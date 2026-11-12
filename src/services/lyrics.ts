/**
 * Lyrics service and parser for LRCLIB synchronized lyrics (.lrc format)
 */

export interface LyricLine {
  id: number;
  time: number; // seconds
  text: string;
}

export interface LyricsData {
  found: boolean;
  trackName?: string;
  artistName?: string;
  albumName?: string | null;
  duration?: number | null;
  instrumental?: boolean;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
  parsedLines?: LyricLine[];
}

export function parseLRC(lrc: string): LyricLine[] {
  if (!lrc) return [];
  const lines = lrc.split('\n');
  const parsed: LyricLine[] = [];
  let id = 0;

  // Pattern: [mm:ss.xx] or [mm:ss.xxx] or [mm:ss]
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Collect all timestamps in this line
    const timestamps: number[] = [];
    let match;
    let lastIndex = 0;

    timeRegex.lastIndex = 0;
    while ((match = timeRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      let millis = 0;
      if (match[3]) {
        const frac = match[3];
        if (frac.length === 1) millis = parseInt(frac, 10) * 100;
        else if (frac.length === 2) millis = parseInt(frac, 10) * 10;
        else millis = parseInt(frac.substring(0, 3), 10);
      }
      const totalSeconds = minutes * 60 + seconds + millis / 1000;
      timestamps.push(totalSeconds);
      lastIndex = timeRegex.lastIndex;
    }

    const text = trimmed.substring(lastIndex).trim();

    // In LRC, one line can have multiple timestamps, or just one
    for (const time of timestamps) {
      if (text.length > 0 || timestamps.length > 0) {
        parsed.push({
          id: id++,
          time,
          text: text || '♪',
        });
      }
    }
  }

  // Sort by time
  parsed.sort((a, b) => a.time - b.time);
  return parsed;
}

export function findActiveLyricIndex(
  lines: LyricLine[],
  currentTime: number,
  offsetSeconds: number = 0
): number {
  if (!lines || lines.length === 0) return -1;
  const target = Math.max(0, currentTime + offsetSeconds);

  // If before first line
  if (target < lines[0].time) {
    return -1;
  }

  // Find the highest line with time <= target
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].time <= target) {
      return i;
    }
  }

  return 0;
}

export async function fetchTrackLyrics(
  track: string,
  artist: string,
  durationSeconds?: number
): Promise<LyricsData> {
  try {
    const params = new URLSearchParams({
      track: track.trim(),
      artist: artist.trim(),
    });
    if (durationSeconds) {
      params.append('duration', String(Math.round(durationSeconds)));
    }

    const res = await fetch(`/api/lyrics?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Lyrics API responded with ${res.status}`);
    }

    const data: LyricsData = await res.json();
    if (data.syncedLyrics) {
      data.parsedLines = parseLRC(data.syncedLyrics);
    }

    return data;
  } catch (err) {
    console.warn('Failed to load lyrics from LRCLIB proxy:', err);
    return {
      found: false,
      plainLyrics: null,
      syncedLyrics: null,
    };
  }
}

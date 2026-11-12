import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// In-memory cache for search & lyrics to speed up repeated queries
const searchCache = new Map<string, { timestamp: number; data: unknown }>();
const lyricsCache = new Map<string, { timestamp: number; data: unknown }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

interface SongResult {
  id: string; // YouTube Video ID
  title: string;
  artist: string;
  duration: string;
  durationSeconds?: number;
  thumbnail: string;
  views?: string;
  album?: string;
  source?: 'youtube' | 'itunes' | 'curated';
}

// Curated verified catalog across multiple genres
const CURATED_TRENDING: Record<string, SongResult[]> = {
  all: [
    {
      id: "kPa7bsKwL-8",
      title: "Die With A Smile",
      artist: "Lady Gaga & Bruno Mars",
      duration: "4:12",
      durationSeconds: 252,
      thumbnail: "https://i.ytimg.com/vi/kPa7bsKwL-8/hqdefault.jpg",
      album: "Die With A Smile - Single",
      views: "480M views",
      source: "curated"
    },
    {
      id: "V9PVRfjEBTI",
      title: "Birds of a Feather",
      artist: "Billie Eilish",
      duration: "3:30",
      durationSeconds: 210,
      thumbnail: "https://i.ytimg.com/vi/V9PVRfjEBTI/hqdefault.jpg",
      album: "HIT ME HARD AND SOFT",
      views: "390M views",
      source: "curated"
    },
    {
      id: "eVli-tstM5E",
      title: "Espresso",
      artist: "Sabrina Carpenter",
      duration: "2:55",
      durationSeconds: 175,
      thumbnail: "https://i.ytimg.com/vi/eVli-tstM5E/hqdefault.jpg",
      album: "Short n' Sweet",
      views: "340M views",
      source: "curated"
    },
    {
      id: "4D7u5KF7SP8",
      title: "Taste",
      artist: "Sabrina Carpenter",
      duration: "2:37",
      durationSeconds: 157,
      thumbnail: "https://i.ytimg.com/vi/4D7u5KF7SP8/hqdefault.jpg",
      album: "Short n' Sweet",
      views: "180M views",
      source: "curated"
    },
    {
      id: "Oa_RSwwpPaA",
      title: "Beautiful Things",
      artist: "Benson Boone",
      duration: "3:00",
      durationSeconds: 180,
      thumbnail: "https://i.ytimg.com/vi/Oa_RSwwpPaA/hqdefault.jpg",
      album: "Fireworks & Rollerblades",
      views: "310M views",
      source: "curated"
    },
    {
      id: "34Na4j8AVgA",
      title: "Starboy",
      artist: "The Weeknd ft. Daft Punk",
      duration: "3:50",
      durationSeconds: 230,
      thumbnail: "https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg",
      album: "Starboy",
      views: "2.4B views",
      source: "curated"
    },
    {
      id: "4NRXx6U8ABQ",
      title: "Blinding Lights",
      artist: "The Weeknd",
      duration: "3:20",
      durationSeconds: 200,
      thumbnail: "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg",
      album: "After Hours",
      views: "820M views",
      source: "curated"
    },
    {
      id: "H5v3kku4y6Q",
      title: "As It Was",
      artist: "Harry Styles",
      duration: "2:47",
      durationSeconds: 167,
      thumbnail: "https://i.ytimg.com/vi/H5v3kku4y6Q/hqdefault.jpg",
      album: "Harry's House",
      views: "810M views",
      source: "curated"
    },
    {
      id: "TUVcZfQe-Kw",
      title: "Levitating",
      artist: "Dua Lipa",
      duration: "3:23",
      durationSeconds: 203,
      thumbnail: "https://i.ytimg.com/vi/TUVcZfQe-Kw/hqdefault.jpg",
      album: "Future Nostalgia",
      views: "920M views",
      source: "curated"
    },
    {
      id: "u2NAus-VDe0",
      title: "Too Sweet",
      artist: "Hozier",
      duration: "4:11",
      durationSeconds: 251,
      thumbnail: "https://i.ytimg.com/vi/u2NAus-VDe0/hqdefault.jpg",
      album: "Unheard EP",
      views: "120M views",
      source: "curated"
    },
    {
      id: "JGwWNGJdvx8",
      title: "Shape of You",
      artist: "Ed Sheeran",
      duration: "3:53",
      durationSeconds: 233,
      thumbnail: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg",
      album: "÷ (Divide)",
      views: "6.2B views",
      source: "curated"
    },
    {
      id: "ic8j13piAhQ",
      title: "Cruel Summer",
      artist: "Taylor Swift",
      duration: "2:58",
      durationSeconds: 178,
      thumbnail: "https://i.ytimg.com/vi/ic8j13piAhQ/hqdefault.jpg",
      album: "Lover",
      views: "290M views",
      source: "curated"
    }
  ],
  pop: [
    {
      id: "eVli-tstM5E",
      title: "Espresso",
      artist: "Sabrina Carpenter",
      duration: "2:55",
      durationSeconds: 175,
      thumbnail: "https://i.ytimg.com/vi/eVli-tstM5E/hqdefault.jpg",
      album: "Short n' Sweet",
      source: "curated"
    },
    {
      id: "kPa7bsKwL-8",
      title: "Die With A Smile",
      artist: "Lady Gaga & Bruno Mars",
      duration: "4:12",
      durationSeconds: 252,
      thumbnail: "https://i.ytimg.com/vi/kPa7bsKwL-8/hqdefault.jpg",
      album: "Die With A Smile",
      source: "curated"
    },
    {
      id: "V9PVRfjEBTI",
      title: "Birds of a Feather",
      artist: "Billie Eilish",
      duration: "3:30",
      durationSeconds: 210,
      thumbnail: "https://i.ytimg.com/vi/V9PVRfjEBTI/hqdefault.jpg",
      album: "HIT ME HARD AND SOFT",
      source: "curated"
    },
    {
      id: "suAR1PYFNYA",
      title: "Houdini",
      artist: "Dua Lipa",
      duration: "3:05",
      durationSeconds: 185,
      thumbnail: "https://i.ytimg.com/vi/suAR1PYFNYA/hqdefault.jpg",
      album: "Radical Optimism",
      source: "curated"
    },
    {
      id: "gNi_6U5Pm_o",
      title: "Good Luck, Babe!",
      artist: "Chappell Roan",
      duration: "3:38",
      durationSeconds: 218,
      thumbnail: "https://i.ytimg.com/vi/gNi_6U5Pm_o/hqdefault.jpg",
      album: "Good Luck, Babe! - Single",
      source: "curated"
    }
  ],
  hiphop: [
    {
      id: "H58vbez_m4E",
      title: "Not Like Us",
      artist: "Kendrick Lamar",
      duration: "4:34",
      durationSeconds: 274,
      thumbnail: "https://i.ytimg.com/vi/H58vbez_m4E/hqdefault.jpg",
      album: "Not Like Us",
      source: "curated"
    },
    {
      id: "34Na4j8AVgA",
      title: "Starboy",
      artist: "The Weeknd ft. Daft Punk",
      duration: "3:50",
      durationSeconds: 230,
      thumbnail: "https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg",
      album: "Starboy",
      source: "curated"
    },
    {
      id: "6ONRf7h3Mdk",
      title: "FE!N",
      artist: "Travis Scott ft. Playboi Carti",
      duration: "3:11",
      durationSeconds: 191,
      thumbnail: "https://i.ytimg.com/vi/6ONRf7h3Mdk/hqdefault.jpg",
      album: "UTOPIA",
      source: "curated"
    },
    {
      id: "7X_mVl8i08I",
      title: "Snooze",
      artist: "SZA",
      duration: "3:21",
      durationSeconds: 201,
      thumbnail: "https://i.ytimg.com/vi/7X_mVl8i08I/hqdefault.jpg",
      album: "SOS",
      source: "curated"
    }
  ],
  lofi: [
    {
      id: "jfKfPfyJRdk",
      title: "lofi hip hop radio - beats to relax/study to",
      artist: "Lofi Girl",
      duration: "3:40",
      durationSeconds: 220,
      thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
      album: "ChilledCow Essentials",
      source: "curated"
    },
    {
      id: "rUxyKA_-grg",
      title: "Midnight City (Chill Lo-Fi Edit)",
      artist: "Komorebi Beats",
      duration: "2:54",
      durationSeconds: 174,
      thumbnail: "https://i.ytimg.com/vi/rUxyKA_-grg/hqdefault.jpg",
      album: "Midnight Rain",
      source: "curated"
    },
    {
      id: "5qap5aO4i9A",
      title: "Lofi Chill Sleep Beats",
      artist: "ChilledCow / Lofi Girl",
      duration: "3:15",
      durationSeconds: 195,
      thumbnail: "https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg",
      album: "Night Drive",
      source: "curated"
    }
  ],
  indie: [
    {
      id: "u2NAus-VDe0",
      title: "Too Sweet",
      artist: "Hozier",
      duration: "4:11",
      durationSeconds: 251,
      thumbnail: "https://i.ytimg.com/vi/u2NAus-VDe0/hqdefault.jpg",
      album: "Unheard EP",
      source: "curated"
    },
    {
      id: "bpOSxM0rNPM",
      title: "Do I Wanna Know?",
      artist: "Arctic Monkeys",
      duration: "4:32",
      durationSeconds: 272,
      thumbnail: "https://i.ytimg.com/vi/bpOSxM0rNPM/hqdefault.jpg",
      album: "AM",
      source: "curated"
    },
    {
      id: "GCdwKhTtNNw",
      title: "Sweater Weather",
      artist: "The Neighbourhood",
      duration: "4:00",
      durationSeconds: 240,
      thumbnail: "https://i.ytimg.com/vi/GCdwKhTtNNw/hqdefault.jpg",
      album: "I Love You.",
      source: "curated"
    }
  ],
  bollywood: [
    {
      id: "cWDq_PZ2tYs",
      title: "Kesariya",
      artist: "Arijit Singh & Pritam",
      duration: "4:28",
      durationSeconds: 268,
      thumbnail: "https://i.ytimg.com/vi/cWDq_PZ2tYs/hqdefault.jpg",
      album: "Brahmastra",
      source: "curated"
    },
    {
      id: "dZ0fwJojhrs",
      title: "Chaleya",
      artist: "Arijit Singh & Shilpa Rao",
      duration: "3:20",
      durationSeconds: 200,
      thumbnail: "https://i.ytimg.com/vi/dZ0fwJojhrs/hqdefault.jpg",
      album: "Jawan",
      source: "curated"
    },
    {
      id: "4L2dFhQfL_s",
      title: "Lover",
      artist: "Diljit Dosanjh",
      duration: "3:10",
      durationSeconds: 190,
      thumbnail: "https://i.ytimg.com/vi/4L2dFhQfL_s/hqdefault.jpg",
      album: "MoonChild Era",
      source: "curated"
    }
  ]
};

// Helper: parse YouTube duration "MM:SS" or "H:MM:SS" to seconds
function parseDurationToSeconds(durationStr: string): number {
  if (!durationStr) return 180;
  const parts = durationStr.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2) {
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }
  if (parts.length === 3) {
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  return 180;
}

// Scrape YouTube for video results
async function searchYouTube(query: string): Promise<SongResult[]> {
  const cacheKey = `yt_${query.toLowerCase().trim()}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as SongResult[];
  }

  try {
    const encoded = encodeURIComponent(query.trim() + ' audio song');
    const searchUrl = `https://www.youtube.com/results?search_query=${encoded}&sp=EgIQAQ%253D%253D`;
    
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) {
      throw new Error(`YouTube HTTP error ${res.status}`);
    }

    const html = await res.text();
    const match =
      html.match(/var ytInitialData = ({.*?});<\/script>/s) ||
      html.match(/ytInitialData\s*=\s*({.*?});/s);

    if (!match) {
      throw new Error('ytInitialData not found in response');
    }

    const data = JSON.parse(match[1]);
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

    const results: SongResult[] = [];

    for (const item of contents) {
      const vr = item?.videoRenderer;
      if (vr && vr.videoId && vr.title?.runs?.[0]?.text) {
        const title = vr.title.runs[0].text;
        const author = vr.ownerText?.runs?.[0]?.text || vr.shortBylineText?.runs?.[0]?.text || 'Unknown Artist';
        const duration = vr.lengthText?.simpleText || '3:30';
        const thumbUrl =
          vr.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
          `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`;
        const views = vr.viewCountText?.simpleText || '';

        results.push({
          id: vr.videoId,
          title: cleanSongTitle(title),
          artist: cleanArtistName(author),
          duration,
          durationSeconds: parseDurationToSeconds(duration),
          thumbnail: thumbUrl,
          views,
          source: 'youtube',
        });
      }
    }

    if (results.length > 0) {
      searchCache.set(cacheKey, { timestamp: Date.now(), data: results });
      return results;
    }
  } catch (err) {
    console.warn('YouTube scraper warning:', err);
  }

  // Fallback: iTunes search to get real structured music tracks
  return searchItunesFallback(query);
}

// Fallback search using iTunes Search API
async function searchItunesFallback(query: string): Promise<SongResult[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const json = await res.json();
    const tracks = (json.results || []) as Array<{
      trackId: number;
      trackName: string;
      artistName: string;
      collectionName?: string;
      artworkUrl100?: string;
      trackTimeMillis?: number;
    }>;

    // Convert each to a SongResult
    const mapped: SongResult[] = tracks.map((t) => {
      const totalSeconds = Math.floor((t.trackTimeMillis || 180000) / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      const duration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      const highResArt = (t.artworkUrl100 || '').replace('100x100bb', '600x600bb');

      return {
        id: `itunes_${t.trackId}`,
        title: t.trackName,
        artist: t.artistName,
        album: t.collectionName,
        duration,
        durationSeconds: totalSeconds,
        thumbnail: highResArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
        source: 'itunes',
      };
    });

    return mapped;
  } catch (e) {
    console.error('iTunes fallback error:', e);
    return [];
  }
}

function cleanSongTitle(raw: string): string {
  return raw
    .replace(/\s*\(Official Video\)/gi, '')
    .replace(/\s*\(Official Music Video\)/gi, '')
    .replace(/\s*\(Official Audio\)/gi, '')
    .replace(/\s*\(Lyric Video\)/gi, '')
    .replace(/\s*\(Lyrics\)/gi, '')
    .replace(/\s*\[Official Video\]/gi, '')
    .replace(/\s*\[Official Music Video\]/gi, '')
    .replace(/\s*\[Official Audio\]/gi, '')
    .replace(/\s*\[HD\]/gi, '')
    .replace(/\s*\[4K\]/gi, '')
    .trim();
}

function cleanArtistName(raw: string): string {
  return raw.replace(/ - Topic$/i, '').replace(/VEVO$/i, '').trim();
}

/* ========================================================================= */
/* API ROUTES                                                                */
/* ========================================================================= */

// 1. Search songs
app.get('/api/search', async (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();
  if (!query) {
    return res.json({ results: CURATED_TRENDING.all });
  }

  try {
    const results = await searchYouTube(query);
    return res.json({ query, results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Search endpoint error:', msg);
    return res.status(500).json({ error: 'Search failed', details: msg });
  }
});

// 2. Curated Trending Tracks by Genre
app.get('/api/trending', (req: Request, res: Response) => {
  const genre = ((req.query.genre as string) || 'all').toLowerCase();
  const list = CURATED_TRENDING[genre] || CURATED_TRENDING.all;
  res.json({ genre, results: list });
});

// 3. LRCLIB Synced and Plain Lyrics
app.get('/api/lyrics', async (req: Request, res: Response) => {
  const track = (req.query.track as string || '').trim();
  const artist = (req.query.artist as string || '').trim();
  const duration = req.query.duration ? Number(req.query.duration) : undefined;

  if (!track) {
    return res.status(400).json({ error: 'Missing track name' });
  }

  const cacheKey = `lyr_${track.toLowerCase()}_${artist.toLowerCase()}`;
  const cached = lyricsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    // 1st attempt: exact lookup with /api/get
    const params = new URLSearchParams({
      track_name: track,
      artist_name: artist,
    });
    if (duration) {
      params.append('duration', String(Math.round(duration)));
    }

    let lrcRes = await fetch(`https://lrclib.net/api/get?${params.toString()}`);
    let lyricsData: Record<string, unknown> | null = null;

    if (lrcRes.ok) {
      lyricsData = (await lrcRes.json()) as Record<string, unknown>;
    } else {
      // 2nd attempt: search endpoint
      const searchQuery = `${track} ${artist}`.trim();
      lrcRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (lrcRes.ok) {
        const searchList = (await lrcRes.json()) as Array<Record<string, unknown>>;
        if (Array.isArray(searchList) && searchList.length > 0) {
          // Prefer item with synced lyrics if available
          const withSync = searchList.find((item) => item.syncedLyrics);
          lyricsData = withSync || searchList[0];
        }
      }
    }

    if (lyricsData) {
      const payload = {
        found: true,
        trackName: lyricsData.trackName || track,
        artistName: lyricsData.artistName || artist,
        albumName: lyricsData.albumName || null,
        duration: lyricsData.duration || null,
        instrumental: !!lyricsData.instrumental,
        plainLyrics: lyricsData.plainLyrics || null,
        syncedLyrics: lyricsData.syncedLyrics || null,
      };

      lyricsCache.set(cacheKey, { timestamp: Date.now(), data: payload });
      return res.json(payload);
    }

    return res.json({
      found: false,
      message: 'No synchronized or plain lyrics found online for this track.',
    });
  } catch (err: unknown) {
    console.error('Lyrics proxy error:', err);
    return res.status(500).json({
      found: false,
      error: 'Failed to retrieve lyrics from LRCLIB',
    });
  }
});

// 4. Quick query suggestions
app.get('/api/suggest', async (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();
  if (!query) {
    return res.json({ suggestions: ['The Weeknd', 'Billie Eilish', 'Sabrina Carpenter', 'Bruno Mars', 'Kendrick Lamar', 'Dua Lipa', 'Lofi Chill'] });
  }

  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      const suggestions = (data?.[1] || []).slice(0, 8);
      return res.json({ suggestions });
    }
  } catch (_) {
    // ignore
  }

  return res.json({ suggestions: [] });
});

/* ========================================================================= */
/* VITE MIDDLEWARE / STATIC ASSETS                                            */
/* ========================================================================= */

async function startServer() {
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('.', 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎵 Vibe Songs server active at http://0.0.0.0:${PORT}`);
  });
}

startServer();

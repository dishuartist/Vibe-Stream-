import React, { useRef, useEffect, useState } from 'react';
import {
  Mic2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Copy,
  Check,
  Sparkles,
  Sliders,
  Volume2,
  Maximize,
  Minimize,
  Music2,
  Loader2,
} from 'lucide-react';
import { useAudio } from '../context/AudioPlayerContext';
import { AudioVisualizer } from './AudioVisualizer';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const KaraokeStudioView: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    lyrics,
    isLoadingLyrics,
    activeLyricIndex,
    lyricsOffset,
    togglePlay,
    seekTo,
    nextTrack,
    prevTrack,
    setLyricsOffset,
    playTrack,
  } = useAudio();

  const [viewMode, setViewMode] = useState<'synced' | 'plain'>('synced');
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('large');
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Smooth scroll active lyric into center
  useEffect(() => {
    if (viewMode === 'synced' && activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLyricIndex, viewMode]);

  const handleCopy = () => {
    const text =
      lyrics?.plainLyrics ||
      lyrics?.parsedLines?.map((l) => l.text).join('\n') ||
      '';
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sampleSong = {
    id: 'kPa7bsKwL-8',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    duration: '4:12',
    durationSeconds: 252,
    thumbnail: 'https://i.ytimg.com/vi/kPa7bsKwL-8/hqdefault.jpg',
    album: 'Die With A Smile - Single',
  };

  if (!currentTrack) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-6 pb-32 animate-in fade-in duration-200">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400 shadow-2xl">
          <Mic2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Vibe Karaoke Studio
          </h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Sing along with real-time synchronized timestamped lyrics from LRCLIB. Tap any line to instantly jump there!
          </p>
        </div>

        <button
          onClick={() => playTrack(sampleSong)}
          className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm flex items-center gap-2.5 mx-auto shadow-lg shadow-purple-950/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start Karaoke with "Die With A Smile"</span>
        </button>
      </div>
    );
  }

  const fontSizeClasses = {
    normal: 'text-base sm:text-lg',
    large: 'text-lg sm:text-2xl',
    huge: 'text-xl sm:text-3xl',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-36 animate-in fade-in duration-200">
      {/* Studio Stage Header Card */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Track Info */}
        <div className="flex items-center gap-4 min-w-0 w-full md:w-auto">
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl object-cover border border-zinc-800 shadow-md shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Now Singing
            </span>
            <h3 className="text-lg sm:text-xl font-display font-bold text-white truncate">
              {currentTrack.title}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Center Visualizer & Play Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevTrack}
            className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Previous song"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-950/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
          <button
            onClick={nextTrack}
            className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Next song"
          >
            <SkipForward className="w-5 h-5" />
          </button>
          <AudioVisualizer isPlaying={isPlaying} barCount={12} className="h-6 w-16" />
        </div>

        {/* Right Tools (Mode, Sync offset, font size) */}
        <div className="flex items-center gap-2">
          {lyrics?.syncedLyrics && (
            <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs">
              <button
                onClick={() => setViewMode('synced')}
                className={`px-2.5 py-1 rounded cursor-pointer ${
                  viewMode === 'synced' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400'
                }`}
              >
                Synced
              </button>
              <button
                onClick={() => setViewMode('plain')}
                className={`px-2.5 py-1 rounded cursor-pointer ${
                  viewMode === 'plain' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400'
                }`}
              >
                Plain
              </button>
            </div>
          )}

          {/* Timing offset adjustment */}
          {lyrics?.syncedLyrics && viewMode === 'synced' && (
            <div className="flex items-center gap-1 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-400">
              <button
                onClick={() => setLyricsOffset(lyricsOffset - 0.25)}
                className="hover:text-white px-1"
                title="Shift lyrics earlier"
              >
                -
              </button>
              <span className="font-mono tabular-nums text-purple-400">
                {lyricsOffset >= 0 ? `+${lyricsOffset.toFixed(2)}` : lyricsOffset.toFixed(2)}s
              </span>
              <button
                onClick={() => setLyricsOffset(lyricsOffset + 0.25)}
                className="hover:text-white px-1"
                title="Shift lyrics later"
              >
                +
              </button>
            </div>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Copy lyrics"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Lyrics Stage */}
      <div
        ref={containerRef}
        className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 sm:p-10 h-[560px] overflow-y-auto space-y-6 text-center scroll-smooth relative"
      >
        {isLoadingLyrics ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-24">
            <Loader2 className="w-10 h-10 animate-spin text-purple-400 mb-4" />
            <p className="text-base font-medium text-zinc-300">Synchronizing Karaoke Lyrics...</p>
            <p className="text-xs text-zinc-500 mt-1">Connecting to LRCLIB global database</p>
          </div>
        ) : lyrics?.parsedLines && lyrics.parsedLines.length > 0 && viewMode === 'synced' ? (
          lyrics.parsedLines.map((line, idx) => {
            const isActive = idx === activeLyricIndex;
            const isPast = activeLyricIndex !== -1 && idx < activeLyricIndex;

            return (
              <div
                key={line.id}
                ref={isActive ? activeLineRef : null}
                onClick={() => seekTo(line.time)}
                className={`py-3 px-4 rounded-2xl transition-all duration-300 cursor-pointer select-none max-w-2xl mx-auto ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-purple-900/40 text-white font-extrabold shadow-xl shadow-purple-950/30 scale-[1.03] border border-purple-500/30 text-2xl sm:text-3xl'
                    : isPast
                    ? 'text-zinc-600 hover:text-zinc-400 text-lg sm:text-xl'
                    : 'text-zinc-400 hover:text-zinc-200 text-lg sm:text-xl'
                }`}
              >
                <p className="leading-relaxed tracking-tight">{line.text}</p>
                {isActive && (
                  <span className="inline-block mt-1 text-[11px] font-mono tabular-nums text-purple-400/80">
                    {formatTime(line.time)}
                  </span>
                )}
              </div>
            );
          })
        ) : lyrics?.plainLyrics ? (
          <div className="max-w-2xl mx-auto whitespace-pre-line text-base sm:text-xl leading-loose text-zinc-200 py-6">
            {lyrics.plainLyrics}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-24">
            <Music2 className="w-12 h-12 text-zinc-700 mb-3" />
            <h3 className="text-lg font-bold text-zinc-200 mb-1">Lyrics Not Available</h3>
            <p className="text-xs text-zinc-400 max-w-md">
              No synced LRC lyrics were found in LRCLIB for "{currentTrack.title}". Enjoy the full-length music track!
            </p>
            <div className="mt-6">
              <AudioVisualizer isPlaying={isPlaying} barCount={24} className="h-10 w-48" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

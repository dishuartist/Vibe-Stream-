import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Download,
  Check,
  Volume2,
  VolumeX,
  Volume1,
  ListMusic,
  Mic2,
  Copy,
  Clock,
  Loader2,
  Sliders,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAudio } from '../context/AudioPlayerContext';
import { isTrackLiked, toggleLikeTrack } from '../services/db';
import { AudioVisualizer } from './AudioVisualizer';

interface ExpandedPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'lyrics' | 'queue';
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const ExpandedPlayerModal: React.FC<ExpandedPlayerModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'lyrics',
}) => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackSpeed,
    repeatMode,
    isShuffled,
    queue,
    currentIndex,
    lyrics,
    isLoadingLyrics,
    activeLyricIndex,
    lyricsOffset,
    downloadingIds,
    downloadedIds,
    togglePlay,
    seekTo,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    setPlaybackSpeed,
    toggleRepeat,
    toggleShuffle,
    playTrack,
    removeFromQueue,
    clearQueue,
    setLyricsOffset,
    downloadTrack,
    deleteDownload,
  } = useAudio();

  const [activeTab, setActiveTab] = useState<'lyrics' | 'queue'>(initialTab);
  const [lyricsViewMode, setLyricsViewMode] = useState<'synced' | 'plain'>('synced');
  const [isLiked, setIsLiked] = useState(false);
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  const activeLyricRef = useRef<HTMLDivElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll lyrics to keep active line centered
  useEffect(() => {
    if (activeTab === 'lyrics' && lyricsViewMode === 'synced' && activeLyricRef.current && lyricsContainerRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLyricIndex, activeTab, lyricsViewMode]);

  // Sync like status
  useEffect(() => {
    if (currentTrack) {
      isTrackLiked(currentTrack.id).then(setIsLiked);
    }
  }, [currentTrack?.id]);

  // Handle sleep timer countdown
  useEffect(() => {
    if (!sleepTimerMinutes) {
      setSleepTimerRemaining(null);
      return;
    }

    setSleepTimerRemaining(sleepTimerMinutes * 60);
    const interval = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          if (isPlaying) togglePlay();
          setSleepTimerMinutes(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerMinutes]);

  if (!isOpen || !currentTrack) return null;

  const isDownloaded = downloadedIds.has(currentTrack.id);
  const isDownloading = downloadingIds.has(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleCopyLyrics = () => {
    const textToCopy =
      lyrics?.plainLyrics ||
      lyrics?.parsedLines?.map((l) => l.text).join('\n') ||
      '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedLyrics(true);
      setTimeout(() => setCopiedLyrics(false), 2000);
    }
  };

  const handleLikeToggle = async () => {
    if (!currentTrack) return;
    const newState = await toggleLikeTrack(currentTrack);
    setIsLiked(newState);
  };

  const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/98 backdrop-blur-2xl flex flex-col overflow-hidden text-zinc-100 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="px-4 md:px-8 py-3.5 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
        <button
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm font-medium"
        >
          <ChevronDown className="w-5 h-5" />
          <span>Minimize</span>
        </button>

        {/* Tab switch inside modal */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'lyrics'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Karaoke Lyrics</span>
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5 text-indigo-400" />
            <span>Up Next ({queue.length})</span>
          </button>
        </div>

        {/* Sleep Timer Indicator */}
        <div className="flex items-center gap-2">
          {sleepTimerRemaining !== null ? (
            <span className="text-xs font-mono tabular-nums text-purple-400 bg-purple-950/40 border border-purple-800/50 px-2 py-1 rounded">
              ⏱ {Math.floor(sleepTimerRemaining / 60)}m {sleepTimerRemaining % 60}s
            </span>
          ) : (
            <div className="relative group">
              <button
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-zinc-200 cursor-pointer"
                title="Set Sleep Timer"
              >
                <Clock className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-10 hidden group-hover:flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 shadow-xl w-32 z-50">
                <span className="text-[10px] text-zinc-500 uppercase px-2 py-1">Sleep Timer</span>
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setSleepTimerMinutes(mins)}
                    className="text-left px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 rounded"
                  >
                    {mins} minutes
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left Artwork & Controls | Right Synced Lyrics / Queue */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {/* Left Column (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center max-w-md mx-auto w-full">
          {/* Cover Art with Glow */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/80 mb-6 group">
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Ambient artwork backlight */}
            <div
              className="absolute -inset-4 bg-purple-600/20 blur-2xl -z-10 pointer-events-none rounded-full"
              aria-hidden="true"
            />
          </div>

          {/* Title & Artist & Quick Badges */}
          <div className="w-full text-left mb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight truncate">
                  {currentTrack.title}
                </h2>
                <p className="text-sm sm:text-base text-zinc-400 truncate mt-0.5">
                  {currentTrack.artist}
                </p>
                {currentTrack.album && (
                  <p className="text-xs text-zinc-500 truncate mt-0.5">
                    {currentTrack.album}
                  </p>
                )}
              </div>

              {/* Like & Download Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleLikeToggle}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title={isLiked ? 'Unlike' : 'Like song'}
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${
                      isLiked ? 'fill-red-500 text-red-500' : ''
                    }`}
                  />
                </button>
                <button
                  onClick={() => {
                    if (isDownloaded) deleteDownload(currentTrack.id);
                    else if (!isDownloading) downloadTrack(currentTrack);
                  }}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title={
                    isDownloaded
                      ? 'Downloaded (tap to remove)'
                      : isDownloading
                      ? 'Downloading...'
                      : 'Download for offline playback'
                  }
                >
                  {isDownloading ? (
                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  ) : isDownloaded ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Scrubber Timeline */}
          <div className="w-full mb-4">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={1}
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer focus:outline-none"
            />
            <div className="flex justify-between text-xs font-mono tabular-nums text-zinc-400 mt-1.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls Row */}
          <div className="w-full flex items-center justify-between gap-4 mb-6">
            <button
              onClick={toggleShuffle}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer ${
                isShuffled ? 'text-purple-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              onClick={prevTrack}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-200 hover:text-white transition-colors cursor-pointer active:scale-95"
              title="Previous"
            >
              <SkipBack className="w-6 h-6" />
            </button>

            <button
              onClick={togglePlay}
              className="min-h-[52px] min-w-[52px] w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 text-white flex items-center justify-center shadow-xl shadow-purple-950/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-200 hover:text-white transition-colors cursor-pointer active:scale-95"
              title="Next"
            >
              <SkipForward className="w-6 h-6" />
            </button>

            <button
              onClick={toggleRepeat}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer ${
                repeatMode !== 'off' ? 'text-purple-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-5 h-5" />
              ) : (
                <Repeat className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Secondary Controls: Volume & Speed */}
          <div className="w-full flex items-center justify-between gap-4 pt-2 border-t border-zinc-900">
            {/* Speed pills */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-zinc-500 mr-1">Speed</span>
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className={`px-2 py-1 text-[11px] font-mono rounded cursor-pointer transition-colors ${
                    playbackSpeed === s
                      ? 'bg-purple-600 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column (7 cols on lg): Interactive Synced Lyrics OR Up Next Queue */}
        <div className="lg:col-span-7 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 flex flex-col h-[520px] lg:h-[620px] overflow-hidden">
          {activeTab === 'lyrics' ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Lyrics toolbar */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800/60 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    LRCLIB Karaoke Engine
                  </span>
                  {lyrics?.syncedLyrics && (
                    <span className="text-[11px] text-zinc-500">· Synced Timestamps</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Synced vs Plain toggle */}
                  {lyrics?.syncedLyrics && (
                    <div className="flex items-center gap-1 p-0.5 bg-zinc-950 rounded-md text-[11px]">
                      <button
                        onClick={() => setLyricsViewMode('synced')}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          lyricsViewMode === 'synced'
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Synced
                      </button>
                      <button
                        onClick={() => setLyricsViewMode('plain')}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          lyricsViewMode === 'plain'
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Plain
                      </button>
                    </div>
                  )}

                  {/* Timing sync offset adjustment */}
                  {lyrics?.syncedLyrics && lyricsViewMode === 'synced' && (
                    <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400">
                      <span>Sync:</span>
                      <button
                        onClick={() => setLyricsOffset(lyricsOffset - 0.25)}
                        className="px-1.5 py-0.5 bg-zinc-800 rounded hover:bg-zinc-700 cursor-pointer"
                        title="Earlier by 0.25s"
                      >
                        -0.25s
                      </button>
                      <span className="font-mono tabular-nums text-zinc-300">
                        {lyricsOffset > 0 ? `+${lyricsOffset.toFixed(2)}` : lyricsOffset.toFixed(2)}s
                      </span>
                      <button
                        onClick={() => setLyricsOffset(lyricsOffset + 0.25)}
                        className="px-1.5 py-0.5 bg-zinc-800 rounded hover:bg-zinc-700 cursor-pointer"
                        title="Later by 0.25s"
                      >
                        +0.25s
                      </button>
                    </div>
                  )}

                  {/* Copy lyrics */}
                  <button
                    onClick={handleCopyLyrics}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                    title="Copy Lyrics to Clipboard"
                  >
                    {copiedLyrics ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Lyrics Scrollable Body */}
              <div
                ref={lyricsContainerRef}
                className="flex-1 overflow-y-auto pr-2 space-y-4 text-center sm:text-left py-4 scroll-smooth"
              >
                {isLoadingLyrics ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-3" />
                    <p className="text-sm">Fetching lyrics from LRCLIB...</p>
                  </div>
                ) : lyrics?.parsedLines && lyrics.parsedLines.length > 0 && lyricsViewMode === 'synced' ? (
                  lyrics.parsedLines.map((line, index) => {
                    const isActive = index === activeLyricIndex;
                    const isPast = activeLyricIndex !== -1 && index < activeLyricIndex;

                    return (
                      <div
                        key={line.id}
                        ref={isActive ? activeLyricRef : null}
                        onClick={() => seekTo(line.time)}
                        className={`group px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer select-none flex items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-purple-900/30 text-white font-bold text-lg sm:text-xl scale-[1.01] shadow-lg shadow-purple-950/20'
                            : isPast
                            ? 'text-zinc-500 hover:text-zinc-300 text-base'
                            : 'text-zinc-400 hover:text-zinc-200 text-base'
                        }`}
                      >
                        <span className="flex-1 leading-relaxed">
                          {line.text}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-zinc-600 group-hover:text-purple-400 transition-colors shrink-0">
                          {formatTime(line.time)}
                        </span>
                      </div>
                    );
                  })
                ) : lyrics?.plainLyrics ? (
                  <div className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-zinc-300 px-2">
                    {lyrics.plainLyrics}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-16 text-center px-4">
                    <Mic2 className="w-10 h-10 text-zinc-700 mb-3" />
                    <h4 className="text-zinc-300 font-semibold mb-1">No Lyrics Found</h4>
                    <p className="text-xs text-zinc-500 max-w-sm">
                      This track doesn't have verified lyrics in LRCLIB yet, or is an instrumental recording.
                    </p>
                    <div className="mt-4">
                      <AudioVisualizer isPlaying={isPlaying} barCount={20} className="h-8 w-40" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Up Next Queue */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800/60 shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Queue ({queue.length} Tracks)
                </span>
                {queue.length > 1 && (
                  <button
                    onClick={clearQueue}
                    className="text-xs text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Queue
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-2">
                {queue.map((track, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      onClick={() => playTrack(track)}
                      className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer group ${
                        isCurrent
                          ? 'bg-purple-950/40 border border-purple-900/50 text-white'
                          : 'hover:bg-zinc-800/60 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 text-xs font-mono tabular-nums text-zinc-500">
                          {isCurrent ? '▶' : idx + 1}
                        </span>
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          className="w-10 h-10 rounded object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className={`text-sm truncate font-medium ${isCurrent ? 'text-purple-300' : ''}`}>
                            {track.title}
                          </p>
                          <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono tabular-nums text-zinc-500">
                          {track.duration}
                        </span>
                        {queue.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromQueue(idx);
                            }}
                            className="p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Remove from queue"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

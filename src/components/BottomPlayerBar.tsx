import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Heart,
  Download,
  Check,
  Maximize2,
  Mic2,
  Video,
  ListMusic,
  Loader2,
} from 'lucide-react';
import { useAudio } from '../context/AudioPlayerContext';
import { isTrackLiked, toggleLikeTrack } from '../services/db';
import { AudioVisualizer } from './AudioVisualizer';

interface BottomPlayerBarProps {
  onOpenExpanded: () => void;
  onOpenLyrics: () => void;
  onOpenQueue: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const BottomPlayerBar: React.FC<BottomPlayerBarProps> = ({
  onOpenExpanded,
  onOpenLyrics,
  onOpenQueue,
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
    lyrics,
    videoMode,
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
    toggleVideoMode,
    downloadTrack,
    deleteDownload,
  } = useAudio();

  const [isLiked, setIsLiked] = useState(false);
  const [isHoveringTime, setIsHoveringTime] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  // Check liked status on currentTrack change
  useEffect(() => {
    if (currentTrack) {
      isTrackLiked(currentTrack.id).then(setIsLiked);
    } else {
      setIsLiked(false);
    }
  }, [currentTrack?.id]);

  const handleLikeToggle = async () => {
    if (!currentTrack) return;
    const newState = await toggleLikeTrack(currentTrack);
    setIsLiked(newState);
  };

  if (!currentTrack) {
    return null;
  }

  const isDownloaded = downloadedIds.has(currentTrack.id);
  const isDownloading = downloadingIds.has(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
  const nextSpeed = () => {
    const idx = speeds.indexOf(playbackSpeed);
    const next = speeds[(idx + 1) % speeds.length];
    setPlaybackSpeed(next);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 shadow-2xl transition-all">
      {/* Top micro progress bar */}
      <div
        className="w-full h-1 bg-zinc-800/80 cursor-pointer relative group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          seekTo(ratio * duration);
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          setHoverTime(ratio * duration);
          setIsHoveringTime(true);
        }}
        onMouseLeave={() => setIsHoveringTime(false)}
      >
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 relative transition-all"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {isHoveringTime && hoverTime !== null && (
          <div
            className="absolute -top-7 -translate-x-1/2 px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-white text-[11px] font-mono tabular-nums rounded shadow pointer-events-none"
            style={{
              left: `${Math.max(20, Math.min(window.innerWidth - 20, (hoverTime / (duration || 1)) * window.innerWidth))}px`,
            }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Track Info & Quick Actions */}
        <div className="flex items-center gap-3 min-w-0 max-w-[28%] md:max-w-[25%] shrink-0">
          <div
            onClick={onOpenExpanded}
            className="relative cursor-pointer group shrink-0"
            title="Expand player"
          >
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-lg object-cover border border-zinc-800 shadow-md group-hover:brightness-110 transition-all"
            />
            <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h4
              onClick={onOpenExpanded}
              className="text-sm font-semibold text-white truncate cursor-pointer hover:underline"
              title={currentTrack.title}
            >
              {currentTrack.title}
            </h4>
            <p className="text-xs text-zinc-400 truncate">{currentTrack.artist}</p>
          </div>

          <div className="hidden sm:flex items-center gap-1 shrink-0">
            {/* Like button */}
            <button
              onClick={handleLikeToggle}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title={isLiked ? 'Unlike' : 'Like song'}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isLiked ? 'fill-red-500 text-red-500' : ''
                }`}
              />
            </button>

            {/* Offline download toggle */}
            <button
              onClick={() => {
                if (isDownloaded) {
                  deleteDownload(currentTrack.id);
                } else if (!isDownloading) {
                  downloadTrack(currentTrack);
                }
              }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title={
                isDownloaded
                  ? 'Downloaded for offline (tap to remove)'
                  : isDownloading
                  ? 'Downloading...'
                  : 'Download for offline playback'
              }
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              ) : isDownloaded ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Center: Playback Controls & Progress Bar */}
        <div className="flex-1 max-w-xl flex flex-col items-center">
          <div className="flex items-center gap-2 sm:gap-4 mb-1">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`min-h-[44px] min-w-[44px] hidden xs:flex items-center justify-center transition-colors cursor-pointer ${
                isShuffled ? 'text-purple-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title={isShuffled ? 'Shuffle on' : 'Shuffle off'}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Previous */}
            <button
              onClick={prevTrack}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer active:scale-95"
              title="Previous song"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="min-h-[44px] min-w-[44px] w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-950/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={nextTrack}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer active:scale-95"
              title="Next song"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              className={`min-h-[44px] min-w-[44px] hidden xs:flex items-center justify-center transition-colors cursor-pointer ${
                repeatMode !== 'off' ? 'text-purple-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Time scrubber row */}
          <div className="w-full flex items-center gap-2.5 text-[11px] font-mono tabular-nums text-zinc-400 px-2">
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={1}
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer focus:outline-none"
            />
            <span className="w-10 text-left">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Visualizer, Lyrics, Video, Speed, Volume */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* Animated visualizer */}
          <div className="hidden lg:block">
            <AudioVisualizer isPlaying={isPlaying} barCount={14} className="h-5 w-16" />
          </div>

          {/* Lyrics toggle button */}
          <button
            onClick={onOpenLyrics}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors cursor-pointer relative ${
              lyrics?.found ? 'text-purple-300 hover:text-purple-200' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title={lyrics?.found ? 'Live Synced Lyrics' : 'Lyrics'}
          >
            <Mic2 className="w-4 h-4" />
            {lyrics?.syncedLyrics && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-purple-400 rounded-full" />
            )}
          </button>

          {/* Video / Audio mode toggle */}
          <button
            onClick={toggleVideoMode}
            className={`min-h-[44px] min-w-[44px] hidden sm:flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              videoMode ? 'text-purple-400 bg-purple-950/40' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title={videoMode ? 'Switch to Audio mode' : 'Switch to Music Video mode'}
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Queue toggle */}
          <button
            onClick={onOpenQueue}
            className="min-h-[44px] min-w-[44px] hidden md:flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Up Next Queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Playback speed selector */}
          <button
            onClick={nextSpeed}
            className="min-h-[44px] min-w-[44px] hidden lg:flex items-center justify-center text-[11px] font-mono tabular-nums text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Playback Speed"
          >
            {playbackSpeed}x
          </button>

          {/* Volume slider */}
          <div className="hidden sm:flex items-center gap-1.5 pl-1">
            <button
              onClick={toggleMute}
              className="min-h-[44px] min-w-[36px] flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
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
              className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer focus:outline-none"
              title={`Volume: ${Math.round(volume * 100)}%`}
            />
          </div>

          {/* Fullscreen Expand */}
          <button
            onClick={onOpenExpanded}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Expand Full Player"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

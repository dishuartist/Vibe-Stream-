import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Track, addToHistory, isTrackDownloaded, saveDownloadedTrack, removeDownloadedTrack } from '../services/db';
import { fetchTrackLyrics, LyricsData, findActiveLyricIndex } from '../services/lyrics';

// Declare YouTube IFrame API window globals
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export type RepeatMode = 'off' | 'all' | 'one';

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackSpeed: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  queue: Track[];
  currentIndex: number;
  lyrics: LyricsData | null;
  isLoadingLyrics: boolean;
  activeLyricIndex: number;
  lyricsOffset: number;
  isOfflineMode: boolean;
  videoMode: boolean;
  downloadingIds: Set<string>;
  downloadedIds: Set<string>;

  // Controls
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackSpeed: (speed: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setLyricsOffset: (offset: number) => void;
  toggleOfflineMode: () => void;
  toggleVideoMode: () => void;
  downloadTrack: (track: Track) => Promise<void>;
  deleteDownload: (trackId: string) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeedState] = useState(1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [isShuffled, setIsShuffled] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Lyrics state
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [lyricsOffset, setLyricsOffset] = useState(0);

  // Offline & UI modes
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [videoMode, setVideoMode] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  // Refs for audio drivers
  const ytPlayerRef = useRef<any>(null);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isYtReadyRef = useRef(false);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        isYtReadyRef.current = true;
      };
    } else {
      isYtReadyRef.current = true;
    }

    // Initialize HTML Audio element for offline or direct stream fallback
    const audio = new Audio();
    audio.preload = 'auto';
    htmlAudioRef.current = audio;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Poll time updates when playing
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const time = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            setCurrentTime(time);
            if (dur > 0 && duration !== dur) setDuration(dur);
          } catch (_) {
            // ignore
          }
        } else if (htmlAudioRef.current && !htmlAudioRef.current.paused) {
          setCurrentTime(htmlAudioRef.current.currentTime);
          if (htmlAudioRef.current.duration) {
            setDuration(htmlAudioRef.current.duration);
          }
        }
      }, 250);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, duration]);

  // Sync active lyric line
  useEffect(() => {
    if (lyrics?.parsedLines && lyrics.parsedLines.length > 0) {
      const idx = findActiveLyricIndex(lyrics.parsedLines, currentTime, lyricsOffset);
      setActiveLyricIndex(idx);
    } else {
      setActiveLyricIndex(-1);
    }
  }, [currentTime, lyrics, lyricsOffset]);

  // Check initial downloaded tracks
  useEffect(() => {
    import('../services/db').then(({ getDownloadedTracks }) => {
      getDownloadedTracks().then((tracks) => {
        setDownloadedIds(new Set(tracks.map((t) => t.id)));
      });
    });
  }, []);

  // Load lyrics when currentTrack changes
  useEffect(() => {
    if (!currentTrack) {
      setLyrics(null);
      return;
    }

    let isCancelled = false;
    setIsLoadingLyrics(true);

    fetchTrackLyrics(currentTrack.title, currentTrack.artist, currentTrack.durationSeconds)
      .then((data) => {
        if (!isCancelled) {
          setLyrics(data);
          setIsLoadingLyrics(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setLyrics(null);
          setIsLoadingLyrics(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentTrack?.id]);

  // Handle song ending based on repeatMode
  const handleSongEnded = useCallback(() => {
    if (repeatMode === 'one') {
      seekTo(0);
      togglePlay();
    } else {
      nextTrack();
    }
  }, [repeatMode]);

  // Initialize or update YT Player
  const initOrPlayYouTube = useCallback((videoId: string) => {
    const container = document.getElementById('youtube-player-anchor');
    if (!container) return;

    if (!ytPlayerRef.current && window.YT && window.YT.Player) {
      ytPlayerRef.current = new window.YT.Player('youtube-player-anchor', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(isMuted ? 0 : volume * 100);
            event.target.setPlaybackRate(playbackSpeed);
            event.target.playVideo();
            setIsPlaying(true);
            setIsLoading(false);
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
            if (event.data === 1) {
              setIsPlaying(true);
              setIsLoading(false);
            } else if (event.data === 2) {
              setIsPlaying(false);
            } else if (event.data === 3) {
              setIsLoading(true);
            } else if (event.data === 0) {
              handleSongEnded();
            }
          },
          onError: () => {
            setIsLoading(false);
            setIsPlaying(false);
          },
        },
      });
    } else if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      ytPlayerRef.current.loadVideoById(videoId);
      ytPlayerRef.current.setVolume(isMuted ? 0 : volume * 100);
      ytPlayerRef.current.playVideo();
      setIsPlaying(true);
    }
  }, [volume, isMuted, playbackSpeed, handleSongEnded]);

  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    setCurrentTrack(track);
    setCurrentTime(0);
    setIsLoading(true);

    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const idx = newQueue.findIndex((t) => t.id === track.id);
      setCurrentIndex(idx >= 0 ? idx : 0);
    } else {
      setQueue((prev) => {
        if (!prev.find((t) => t.id === track.id)) {
          return [...prev, track];
        }
        return prev;
      });
      setCurrentIndex((prev) => (prev >= 0 ? prev : 0));
    }

    addToHistory(track);

    // If videoId is valid for YouTube
    if (track.id && !track.id.startsWith('itunes_') && !track.id.startsWith('offline_')) {
      initOrPlayYouTube(track.id);
    } else {
      // Fallback synthesizer/simulated audio track for offline demo
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
        htmlAudioRef.current.currentTime = 0;
      }
      setIsLoading(false);
      setIsPlaying(true);
      setDuration(track.durationSeconds || 210);
    }
  }, [initOrPlayYouTube]);

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;

    if (isPlaying) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        ytPlayerRef.current.pauseVideo();
      }
      if (htmlAudioRef.current) htmlAudioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        ytPlayerRef.current.playVideo();
      }
      if (htmlAudioRef.current && htmlAudioRef.current.src) htmlAudioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, currentTrack]);

  const seekTo = useCallback((seconds: number) => {
    setCurrentTime(seconds);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(seconds, true);
    }
    if (htmlAudioRef.current) {
      htmlAudioRef.current.currentTime = seconds;
    }
  }, []);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;

    let nextIndex = currentIndex + 1;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    const nextSong = queue[nextIndex];
    if (nextSong) {
      setCurrentIndex(nextIndex);
      playTrack(nextSong);
    }
  }, [queue, currentIndex, isShuffled, repeatMode, playTrack]);

  const prevTrack = useCallback(() => {
    if (currentTime > 4) {
      seekTo(0);
      return;
    }

    if (queue.length === 0) return;
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    const prevSong = queue[prevIndex];
    if (prevSong) {
      setCurrentIndex(prevIndex);
      playTrack(prevSong);
    }
  }, [currentTime, queue, currentIndex, seekTo, playTrack]);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    setIsMuted(clamped === 0);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(clamped * 100);
    }
    if (htmlAudioRef.current) {
      htmlAudioRef.current.volume = clamped;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      const restore = volume > 0 ? volume : 0.75;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.unMute === 'function') {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(restore * 100);
      }
      if (htmlAudioRef.current) {
        htmlAudioRef.current.muted = false;
        htmlAudioRef.current.volume = restore;
      }
    } else {
      setIsMuted(true);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.mute === 'function') {
        ytPlayerRef.current.mute();
      }
      if (htmlAudioRef.current) {
        htmlAudioRef.current.muted = true;
      }
    }
  }, [isMuted, volume]);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeedState(speed);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setPlaybackRate === 'function') {
      ytPlayerRef.current.setPlaybackRate(speed);
    }
    if (htmlAudioRef.current) {
      htmlAudioRef.current.playbackRate = speed;
    }
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => !prev);
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (index === currentIndex) {
      nextTrack();
    } else if (index < currentIndex) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, nextTrack]);

  const clearQueue = useCallback(() => {
    setQueue(currentTrack ? [currentTrack] : []);
    setCurrentIndex(0);
  }, [currentTrack]);

  const toggleOfflineMode = useCallback(() => {
    setIsOfflineMode((prev) => !prev);
  }, []);

  const toggleVideoMode = useCallback(() => {
    setVideoMode((prev) => !prev);
  }, []);

  // Download track locally to IndexedDB
  const downloadTrack = useCallback(async (track: Track) => {
    setDownloadingIds((prev) => new Set(prev).add(track.id));
    try {
      // Fetch lyrics to cache together
      const lyricsData = await fetchTrackLyrics(track.title, track.artist, track.durationSeconds);
      const trackWithLyrics: Track = {
        ...track,
        cachedLyrics: {
          syncedLyrics: lyricsData.syncedLyrics,
          plainLyrics: lyricsData.plainLyrics,
        },
      };

      // Save to IndexedDB
      await saveDownloadedTrack(trackWithLyrics);
      setDownloadedIds((prev) => new Set(prev).add(track.id));
    } catch (e) {
      console.error('Failed to download track:', e);
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    }
  }, []);

  const deleteDownload = useCallback(async (trackId: string) => {
    await removeDownloadedTrack(trackId);
    setDownloadedIds((prev) => {
      const next = new Set(prev);
      next.delete(trackId);
      return next;
    });
  }, []);

  return (
    <AudioContext.Provider
      value={{
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
        isOfflineMode,
        videoMode,
        downloadingIds,
        downloadedIds,
        playTrack,
        togglePlay,
        seekTo,
        nextTrack,
        prevTrack,
        setVolume,
        toggleMute,
        setPlaybackSpeed,
        toggleRepeat,
        toggleShuffle,
        addToQueue,
        removeFromQueue,
        clearQueue,
        setLyricsOffset,
        toggleOfflineMode,
        toggleVideoMode,
        downloadTrack,
        deleteDownload,
      }}
    >
      {children}
      {/* Hidden YouTube IFrame container that plays audio continuously */}
      <div
        className={`fixed z-0 pointer-events-none transition-all duration-300 ${
          videoMode
            ? 'top-20 right-6 w-80 h-48 rounded-xl overflow-hidden shadow-2xl border border-zinc-700 pointer-events-auto z-50'
            : 'w-1 h-1 -bottom-96 -left-96 opacity-0'
        }`}
      >
        <div id="youtube-player-anchor" className="w-full h-full" />
      </div>
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

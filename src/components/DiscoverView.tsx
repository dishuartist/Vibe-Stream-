import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  Check,
  Heart,
  Mic2,
  Sparkles,
  Plus,
  Flame,
  Radio,
  Loader2,
} from 'lucide-react';
import { Track, isTrackLiked, toggleLikeTrack } from '../services/db';
import { useAudio } from '../context/AudioPlayerContext';

interface DiscoverViewProps {
  onOpenLyrics: () => void;
  onSelectTrack: (track: Track) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onOpenLyrics,
}) => {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    addToQueue,
    downloadTrack,
    deleteDownload,
    downloadingIds,
    downloadedIds,
  } = useAudio();

  const [genre, setGenre] = useState<string>('all');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());

  // Fetch trending tracks by genre
  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/trending?genre=${genre}`)
      .then((res) => res.json())
      .then((data) => {
        setTracks(data.results || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load trending songs:', err);
        setIsLoading(false);
      });
  }, [genre]);

  // Load liked track IDs
  useEffect(() => {
    import('../services/db').then(({ getLikedTracks }) => {
      getLikedTracks().then((list) => {
        setLikedTrackIds(new Set(list.map((t) => t.id)));
      });
    });
  }, []);

  const handleLike = async (track: Track) => {
    const isNowLiked = await toggleLikeTrack(track);
    setLikedTrackIds((prev) => {
      const next = new Set(prev);
      if (isNowLiked) next.add(track.id);
      else next.delete(track.id);
      return next;
    });
  };

  const featuredTrack = tracks[0] || null;
  const genres = [
    { id: 'all', label: 'Global Top Hits' },
    { id: 'pop', label: 'Pop & Dance' },
    { id: 'hiphop', label: 'Hip-Hop & R&B' },
    { id: 'lofi', label: 'Lo-Fi Chill' },
    { id: 'indie', label: 'Indie & Alt' },
    { id: 'bollywood', label: 'Bollywood & Global' },
  ];

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-200">
      {/* Hero Featured Banner */}
      {featuredTrack && (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950/80 via-zinc-900 to-zinc-950 border border-zinc-800/80 p-6 md:p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="relative group shrink-0 w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <img
                src={featuredTrack.thumbnail}
                alt={featuredTrack.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <button
                onClick={() => {
                  if (currentTrack?.id === featuredTrack.id) togglePlay();
                  else playTrack(featuredTrack, tracks);
                }}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                  {currentTrack?.id === featuredTrack.id && isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </div>
              </button>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-2">
                <Flame className="w-4 h-4" />
                <span>Featured #1 Global Hit</span>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-400 font-mono tabular-nums">{featuredTrack.views}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white tracking-tight leading-tight">
                {featuredTrack.title}
              </h1>
              <p className="text-base sm:text-lg text-zinc-300 font-medium mt-1">
                {featuredTrack.artist}
              </p>
              {featuredTrack.album && (
                <p className="text-xs text-zinc-500 mt-1">Album: {featuredTrack.album}</p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
                <button
                  onClick={() => {
                    if (currentTrack?.id === featuredTrack.id) togglePlay();
                    else playTrack(featuredTrack, tracks);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-purple-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  {currentTrack?.id === featuredTrack.id && isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pause Track</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play Full Audio</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    if (currentTrack?.id !== featuredTrack.id) {
                      playTrack(featuredTrack, tracks);
                    }
                    onOpenLyrics();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-medium text-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Mic2 className="w-4 h-4 text-purple-400" />
                  <span>Karaoke Lyrics</span>
                </button>

                <button
                  onClick={() => addToQueue(featuredTrack)}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 font-medium text-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Add to queue"
                >
                  <Plus className="w-4 h-4" />
                  <span>Queue</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ambient gradient decor */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 blur-3xl pointer-events-none rounded-full" />
        </div>
      )}

      {/* Value Proposition Pills / Editorial Markers (anti-slop clean prose) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-1">
            <Radio className="w-4 h-4" />
            <span>Full-Length Audio Catalog</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Direct high-bitrate streaming without 30-second Spotify preview restrictions or paywalls.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-1">
            <Mic2 className="w-4 h-4" />
            <span>LRCLIB Synced Karaoke</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Real-time synchronized line-by-line lyric timestamps with one-tap line seeking.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1">
            <Download className="w-4 h-4" />
            <span>Offline Local Storage</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Save tracks directly to your browser's persistent IndexedDB storage for offline listening.
          </p>
        </div>
      </div>

      {/* Genre Filter Tabs */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => setGenre(g.id)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                genre === g.id
                  ? 'bg-purple-600 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trending Songs Table */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-white tracking-tight">
              Top Trending Tracks
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Ranked by global plays and real-time streaming charts
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-zinc-500">
            {tracks.length} songs
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-zinc-500">
            <Loader2 className="w-7 h-7 animate-spin text-purple-400 mb-2" />
            <span className="text-sm">Loading songs catalog...</span>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {tracks.map((track, index) => {
              const isCurrent = currentTrack?.id === track.id;
              const isDownloaded = downloadedIds.has(track.id);
              const isDownloading = downloadingIds.has(track.id);
              const isLiked = likedTrackIds.has(track.id);

              return (
                <div
                  key={`${track.id}-${index}`}
                  className={`flex items-center justify-between p-3 sm:px-5 sm:py-3.5 hover:bg-zinc-800/40 transition-colors group ${
                    isCurrent ? 'bg-purple-950/20' : ''
                  }`}
                >
                  {/* Left: Index, Play Trigger, Artwork, Details */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    {/* Index or Play Button */}
                    <div className="w-7 text-center shrink-0">
                      <button
                        onClick={() => {
                          if (isCurrent) togglePlay();
                          else playTrack(track, tracks);
                        }}
                        className="w-7 h-7 flex items-center justify-center cursor-pointer group-hover:hidden"
                      >
                        {isCurrent && isPlaying ? (
                          <span className="flex items-center gap-0.5 text-purple-400">
                            <span className="w-1 h-3 bg-purple-400 animate-equalizer-1 rounded-full" />
                            <span className="w-1 h-4 bg-purple-400 animate-equalizer-2 rounded-full" />
                            <span className="w-1 h-2 bg-purple-400 animate-equalizer-3 rounded-full" />
                          </span>
                        ) : (
                          <span className="text-xs font-mono tabular-nums text-zinc-500 font-medium">
                            {index + 1}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          if (isCurrent) togglePlay();
                          else playTrack(track, tracks);
                        }}
                        className="w-7 h-7 hidden group-hover:flex items-center justify-center text-white cursor-pointer"
                        title={isCurrent && isPlaying ? 'Pause' : 'Play'}
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4 fill-current text-purple-400" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5 text-white" />
                        )}
                      </button>
                    </div>

                    {/* Artwork */}
                    <div
                      onClick={() => {
                        if (isCurrent) togglePlay();
                        else playTrack(track, tracks);
                      }}
                      className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 cursor-pointer"
                    >
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Title & Artist */}
                    <div className="min-w-0 flex-1">
                      <p
                        onClick={() => {
                          if (isCurrent) togglePlay();
                          else playTrack(track, tracks);
                        }}
                        className={`text-sm font-semibold truncate cursor-pointer hover:underline ${
                          isCurrent ? 'text-purple-300' : 'text-zinc-100'
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {track.artist}
                        {track.album ? ` · ${track.album}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                    {/* Duration & Views */}
                    <div className="hidden md:flex flex-col items-end text-right mr-2">
                      <span className="text-xs font-mono tabular-nums text-zinc-300">
                        {track.duration}
                      </span>
                      {track.views && (
                        <span className="text-[10px] text-zinc-500">{track.views}</span>
                      )}
                    </div>

                    {/* Like button */}
                    <button
                      onClick={() => handleLike(track)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title={isLiked ? 'Unlike' : 'Like'}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isLiked ? 'fill-red-500 text-red-500' : ''
                        }`}
                      />
                    </button>

                    {/* Lyrics trigger */}
                    <button
                      onClick={() => {
                        if (!isCurrent) playTrack(track, tracks);
                        onOpenLyrics();
                      }}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-purple-300 transition-colors cursor-pointer"
                      title="View Lyrics"
                    >
                      <Mic2 className="w-4 h-4" />
                    </button>

                    {/* Download offline */}
                    <button
                      onClick={() => {
                        if (isDownloaded) deleteDownload(track.id);
                        else if (!isDownloading) downloadTrack(track);
                      }}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title={
                        isDownloaded
                          ? 'Downloaded (tap to delete)'
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

                    {/* Add to queue */}
                    <button
                      onClick={() => addToQueue(track)}
                      className="min-h-[44px] min-w-[44px] hidden sm:flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Add to queue"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

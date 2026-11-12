import React, { useState, useEffect } from 'react';
import {
  Search as SearchIcon,
  X,
  Play,
  Pause,
  Download,
  Check,
  Heart,
  Mic2,
  Plus,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { Track, toggleLikeTrack } from '../services/db';
import { useAudio } from '../context/AudioPlayerContext';

interface SearchViewProps {
  onOpenLyrics: () => void;
}

const POPULAR_SEARCHES = [
  'Billie Eilish',
  'Sabrina Carpenter',
  'The Weeknd',
  'Kendrick Lamar',
  'Bruno Mars',
  'Dua Lipa',
  'Hozier',
  'Taylor Swift',
  'Lofi Chill Beats',
  'Arijit Singh',
];

export const SearchView: React.FC<SearchViewProps> = ({ onOpenLyrics }) => {
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

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());

  // Load liked tracks
  useEffect(() => {
    import('../services/db').then(({ getLikedTracks }) => {
      getLikedTracks().then((list) => {
        setLikedTrackIds(new Set(list.map((t) => t.id)));
      });
    });
  }, []);

  const handleSearch = async (searchTerm: string) => {
    const q = searchTerm.trim();
    if (!q) return;

    setIsLoading(true);
    setHasSearched(true);
    setQuery(searchTerm);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      console.error('Search failed:', e);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (track: Track) => {
    const isNowLiked = await toggleLikeTrack(track);
    setLikedTrackIds((prev) => {
      const next = new Set(prev);
      if (isNowLiked) next.add(track.id);
      else next.delete(track.id);
      return next;
    });
  };

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-200">
      {/* Search Header & Input */}
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white text-center tracking-tight">
          Search World's Catalog
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 text-center">
          Find any song, artist, album, or music video with full-length streaming
        </p>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="relative flex items-center"
        >
          <SearchIcon className="absolute left-4 w-5 h-5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, lyrics, or albums..."
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-2xl pl-12 pr-24 py-3.5 text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 shadow-xl transition-all"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setHasSearched(false);
              }}
              className="absolute right-12 text-zinc-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={!query.trim()}
            className="absolute right-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Suggestion Chips */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center pt-1">
          <span className="text-xs text-zinc-500 flex items-center gap-1 mr-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Trending:
          </span>
          {POPULAR_SEARCHES.map((term) => (
            <button
              key={term}
              onClick={() => handleSearch(term)}
              className="text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 bg-zinc-900/80 border border-zinc-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Results View */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-3" />
          <p className="text-sm">Searching global music catalog...</p>
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 max-w-sm mx-auto">
          <SearchIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h4 className="text-zinc-300 font-semibold mb-1">No Results Found</h4>
          <p className="text-xs">
            We couldn't find matching songs for "{query}". Try checking the spelling or searching another artist.
          </p>
        </div>
      ) : results.length > 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden mt-6">
          <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-white">
              Search Results ({results.length})
            </h3>
            <span className="text-xs font-mono tabular-nums text-zinc-500">
              Full-length streams available
            </span>
          </div>

          <div className="divide-y divide-zinc-800/60">
            {results.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isDownloaded = downloadedIds.has(track.id);
              const isDownloading = downloadingIds.has(track.id);
              const isLiked = likedTrackIds.has(track.id);

              return (
                <div
                  key={`${track.id}-${idx}`}
                  className={`flex items-center justify-between p-3 sm:px-5 sm:py-3.5 hover:bg-zinc-800/40 transition-colors group ${
                    isCurrent ? 'bg-purple-950/20' : ''
                  }`}
                >
                  {/* Left: Play button, Artwork, Title & Artist */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <button
                      onClick={() => {
                        if (isCurrent) togglePlay();
                        else playTrack(track, results);
                      }}
                      className="w-8 h-8 rounded-full bg-zinc-800 group-hover:bg-purple-600 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                      title={isCurrent && isPlaying ? 'Pause' : 'Play'}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-zinc-800"
                    />

                    <div className="min-w-0 flex-1">
                      <p
                        onClick={() => {
                          if (isCurrent) togglePlay();
                          else playTrack(track, results);
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
                    <span className="hidden sm:inline text-xs font-mono tabular-nums text-zinc-400 mr-2">
                      {track.duration}
                    </span>

                    {/* Like button */}
                    <button
                      onClick={() => handleLike(track)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title={isLiked ? 'Unlike' : 'Like song'}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isLiked ? 'fill-red-500 text-red-500' : ''
                        }`}
                      />
                    </button>

                    {/* Lyrics */}
                    <button
                      onClick={() => {
                        if (!isCurrent) playTrack(track, results);
                        onOpenLyrics();
                      }}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-purple-300 transition-colors cursor-pointer"
                      title="View Lyrics"
                    >
                      <Mic2 className="w-4 h-4" />
                    </button>

                    {/* Download */}
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
        </div>
      ) : null}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Download,
  Heart,
  ListMusic,
  History,
  Play,
  Pause,
  Trash2,
  HardDrive,
  Plus,
  WifiOff,
  Music,
  Check,
  FolderDown,
  Sparkles,
} from 'lucide-react';
import {
  Track,
  Playlist,
  getDownloadedTracks,
  getLikedTracks,
  getCustomPlaylists,
  getHistory,
  removeDownloadedTrack,
  savePlaylist,
  deletePlaylist,
} from '../services/db';
import { useAudio } from '../context/AudioPlayerContext';

interface LibraryViewProps {
  initialSubTab?: 'downloads' | 'liked' | 'playlists' | 'history';
  onOpenLyrics: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  initialSubTab = 'downloads',
  onOpenLyrics,
}) => {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    isOfflineMode,
    toggleOfflineMode,
    downloadedIds,
    deleteDownload,
  } = useAudio();

  const [subTab, setSubTab] = useState<'downloads' | 'liked' | 'playlists' | 'history'>(
    initialSubTab
  );

  const [downloadedList, setDownloadedList] = useState<Track[]>([]);
  const [likedList, setLikedList] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [historyList, setHistoryList] = useState<Track[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);

  // New playlist modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [newPlaylistEmoji, setNewPlaylistEmoji] = useState('🎧');

  const loadData = async () => {
    const [downloads, liked, pl, hist] = await Promise.all([
      getDownloadedTracks(),
      getLikedTracks(),
      getCustomPlaylists(),
      getHistory(),
    ]);
    setDownloadedList(downloads);
    setLikedList(liked);
    setPlaylists(pl);
    setHistoryList(hist);
  };

  useEffect(() => {
    loadData();
  }, [downloadedIds.size]);

  // Total offline storage bytes
  const totalBytes = downloadedList.reduce((acc, t) => acc + (t.fileSizeBytes || 3500000), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const newPl: Playlist = {
      id: `pl_${Date.now()}`,
      name: newPlaylistName.trim(),
      description: newPlaylistDesc.trim() || 'Custom vibe collection',
      coverEmoji: newPlaylistEmoji,
      trackIds: currentTrack ? [currentTrack.id] : [],
      createdAt: Date.now(),
    };

    await savePlaylist(newPl);
    setShowCreateModal(false);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    await loadData();
  };

  const handleDeletePlaylist = async (id: string) => {
    await deletePlaylist(id);
    if (activePlaylist?.id === id) setActivePlaylist(null);
    await loadData();
  };

  return (
    <div className="space-y-6 pb-36 animate-in fade-in duration-200">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800/80 pb-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => {
              setSubTab('downloads');
              setActivePlaylist(null);
            }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
              subTab === 'downloads'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Downloads ({downloadedList.length})</span>
          </button>

          <button
            onClick={() => {
              setSubTab('liked');
              setActivePlaylist(null);
            }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
              subTab === 'liked'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Liked ({likedList.length})</span>
          </button>

          <button
            onClick={() => {
              setSubTab('playlists');
              setActivePlaylist(null);
            }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
              subTab === 'playlists'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Playlists ({playlists.length})</span>
          </button>

          <button
            onClick={() => {
              setSubTab('history');
              setActivePlaylist(null);
            }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
              subTab === 'history'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </div>

        {/* Offline Mode Toggle & Storage Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono tabular-nums text-zinc-400 flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span>{totalMB} MB Storage</span>
          </div>

          <button
            onClick={toggleOfflineMode}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              isOfflineMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
            title="Toggle offline-only mode"
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline Mode: {isOfflineMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DOWNLOADS SUB-TAB                                                     */}
      {/* ========================================================================= */}
      {subTab === 'downloads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                Offline Saved Music
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Tracks and synchronized LRCLIB lyrics saved in browser storage. Available without internet.
              </p>
            </div>
            {downloadedList.length > 0 && (
              <button
                onClick={() => playTrack(downloadedList[0], downloadedList)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play All Offline</span>
              </button>
            )}
          </div>

          {downloadedList.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-8">
              <FolderDown className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <h4 className="text-zinc-200 font-semibold mb-1">No Downloaded Songs Yet</h4>
              <p className="text-xs max-w-sm mx-auto mb-4">
                Click the download icon (⬇) on any song in Discover or Search to save it locally for offline listening.
              </p>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden divide-y divide-zinc-800/60">
              {downloadedList.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                const sizeMb = ((track.fileSizeBytes || 3500000) / (1024 * 1024)).toFixed(1);

                return (
                  <div
                    key={track.id}
                    className={`flex items-center justify-between p-3 sm:px-5 sm:py-3.5 hover:bg-zinc-800/40 transition-colors group ${
                      isCurrent ? 'bg-purple-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <button
                        onClick={() => {
                          if (isCurrent) togglePlay();
                          else playTrack(track, downloadedList);
                        }}
                        className="w-8 h-8 rounded-full bg-zinc-800 group-hover:bg-purple-600 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
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
                            else playTrack(track, downloadedList);
                          }}
                          className={`text-sm font-semibold truncate cursor-pointer hover:underline ${
                            isCurrent ? 'text-purple-300' : 'text-zinc-100'
                          }`}
                        >
                          {track.title}
                        </p>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {track.artist}
                          <span className="text-zinc-600"> · </span>
                          <span className="text-zinc-500 font-mono">{sizeMb} MB</span>
                          {track.cachedLyrics?.syncedLyrics && (
                            <span className="text-purple-400 ml-1.5 font-sans">
                              · Synced Lyrics Cached
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono tabular-nums text-zinc-400 mr-2">
                        {track.duration}
                      </span>
                      <button
                        onClick={() => deleteDownload(track.id)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete from offline storage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LIKED SONGS SUB-TAB                                                    */}
      {/* ========================================================================= */}
      {subTab === 'liked' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-white">Liked Songs</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Your favorite tracks collected across Vibe Songs
              </p>
            </div>
            {likedList.length > 0 && (
              <button
                onClick={() => playTrack(likedList[0], likedList)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play All Liked</span>
              </button>
            )}
          </div>

          {likedList.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-8">
              <Heart className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <h4 className="text-zinc-200 font-semibold mb-1">No Liked Songs Yet</h4>
              <p className="text-xs max-w-sm mx-auto">
                Tap the heart icon on any song you love to save it to your collection.
              </p>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden divide-y divide-zinc-800/60">
              {likedList.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className={`flex items-center justify-between p-3 sm:px-5 sm:py-3.5 hover:bg-zinc-800/40 transition-colors group ${
                      isCurrent ? 'bg-purple-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <button
                        onClick={() => {
                          if (isCurrent) togglePlay();
                          else playTrack(track, likedList);
                        }}
                        className="w-8 h-8 rounded-full bg-zinc-800 group-hover:bg-purple-600 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
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
                            else playTrack(track, likedList);
                          }}
                          className={`text-sm font-semibold truncate cursor-pointer hover:underline ${
                            isCurrent ? 'text-purple-300' : 'text-zinc-100'
                          }`}
                        >
                          {track.title}
                        </p>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>

                    <span className="text-xs font-mono tabular-nums text-zinc-400">
                      {track.duration}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PLAYLISTS SUB-TAB                                                     */}
      {/* ========================================================================= */}
      {subTab === 'playlists' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-white">Custom Playlists</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Curated collections and customized listening lists
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Playlist</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => setActivePlaylist(pl)}
                className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group relative"
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl mb-3 block">{pl.coverEmoji}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePlaylist(pl.id);
                    }}
                    className="text-zinc-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Delete playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="font-display font-bold text-white text-base group-hover:text-purple-300 transition-colors truncate">
                  {pl.name}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{pl.description}</p>
                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
                  <span>{pl.trackIds.length} tracks</span>
                  <span className="text-purple-400 flex items-center gap-1">
                    <Play className="w-3 h-3 fill-current" /> Play
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Playlist Detail Card */}
          {activePlaylist && (
            <div className="mt-6 p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{activePlaylist.coverEmoji}</span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">
                      {activePlaylist.name}
                    </h3>
                    <p className="text-xs text-zinc-400">{activePlaylist.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActivePlaylist(null)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <p className="text-xs text-zinc-500">
                Contains {activePlaylist.trackIds.length} track IDs in catalog.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. HISTORY SUB-TAB                                                       */}
      {/* ========================================================================= */}
      {subTab === 'history' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-lg font-bold text-white">Recently Played</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Songs you have listened to recently</p>
          </div>

          {historyList.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-8">
              <History className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <h4 className="text-zinc-200 font-semibold mb-1">No History Yet</h4>
              <p className="text-xs">Songs you play will automatically appear here.</p>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden divide-y divide-zinc-800/60">
              {historyList.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={`${track.id}-${idx}`}
                    onClick={() => playTrack(track)}
                    className="flex items-center justify-between p-3 sm:px-5 sm:py-3.5 hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-lg object-cover shrink-0 border border-zinc-800"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isCurrent ? 'text-purple-300' : 'text-zinc-100'
                          }`}
                        >
                          {track.title}
                        </p>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-zinc-400">
                      {track.duration}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePlaylist}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <h3 className="font-display text-lg font-bold text-white">Create New Playlist</h3>
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">Playlist Name</label>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="e.g. Summer Sunset Drive"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">Description</label>
              <input
                type="text"
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
                placeholder="e.g. Mellow tunes for evening drives"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">Cover Emoji</label>
              <div className="flex items-center gap-2">
                {['🎧', '🔥', '🌙', '☕', '⚡', '🌊', '🎸', '🎹'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setNewPlaylistEmoji(em)}
                    className={`text-xl p-2 rounded-lg cursor-pointer ${
                      newPlaylistEmoji === em ? 'bg-purple-600/30 border border-purple-500' : 'bg-zinc-950'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl"
              >
                Create Playlist
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

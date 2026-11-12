import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useAudio } from '../context/AudioPlayerContext';

export type NavTab = 'discover' | 'search' | 'karaoke' | 'library' | 'offline';

interface TopBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ activeTab, onSelectTab }) => {
  const { isOfflineMode, toggleOfflineMode, downloadedIds } = useAudio();

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between gap-8 transition-colors">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={() => onSelectTab('discover')}
        className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2.5 text-left focus:outline-none"
      >
        <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-900/30 text-white text-base">
          🎵
        </span>
        <span className="tracking-tight">
          Vibe <span className="text-purple-400">Songs</span>
        </span>
      </button>

      {/* Zone 2: 4–5 concise single-line nav links */}
      <nav className="flex items-center gap-1 sm:gap-4 md:gap-6 text-sm font-medium text-zinc-400 overflow-x-auto no-scrollbar">
        <button
          onClick={() => onSelectTab('discover')}
          className={`px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'discover'
              ? 'text-white font-semibold border-b-2 border-purple-500'
              : 'hover:text-zinc-200'
          }`}
        >
          Discover
        </button>
        <button
          onClick={() => onSelectTab('search')}
          className={`px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'search'
              ? 'text-white font-semibold border-b-2 border-purple-500'
              : 'hover:text-zinc-200'
          }`}
        >
          Search
        </button>
        <button
          onClick={() => onSelectTab('karaoke')}
          className={`px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'karaoke'
              ? 'text-white font-semibold border-b-2 border-purple-500'
              : 'hover:text-zinc-200'
          }`}
        >
          Karaoke
        </button>
        <button
          onClick={() => onSelectTab('library')}
          className={`px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'library'
              ? 'text-white font-semibold border-b-2 border-purple-500'
              : 'hover:text-zinc-200'
          }`}
        >
          Library
        </button>
        <button
          onClick={() => onSelectTab('offline')}
          className={`px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'offline'
              ? 'text-white font-semibold border-b-2 border-purple-500'
              : 'hover:text-zinc-200'
          }`}
        >
          <span>Offline</span>
          {downloadedIds.size > 0 && (
            <span className="text-[11px] font-mono tabular-nums text-purple-400">
              ({downloadedIds.size})
            </span>
          )}
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={toggleOfflineMode}
          className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
            isOfflineMode
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60'
          }`}
          title={isOfflineMode ? 'Disable offline listening mode' : 'Enable offline mode (only play downloaded songs)'}
        >
          {isOfflineMode ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline Mode Active</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Online Catalog</span>
              <span className="sm:hidden">Online</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { AudioProvider } from './context/AudioPlayerContext';
import { TopBar, NavTab } from './components/TopBar';
import { DiscoverView } from './components/DiscoverView';
import { SearchView } from './components/SearchView';
import { KaraokeStudioView } from './components/KaraokeStudioView';
import { LibraryView } from './components/LibraryView';
import { BottomPlayerBar } from './components/BottomPlayerBar';
import { ExpandedPlayerModal } from './components/ExpandedPlayerModal';

function AppContent() {
  const [activeTab, setActiveTab] = useState<NavTab>('discover');
  const [isExpandedOpen, setIsExpandedOpen] = useState(false);
  const [expandedInitialTab, setExpandedInitialTab] = useState<'lyrics' | 'queue'>('lyrics');

  const handleOpenLyrics = () => {
    setExpandedInitialTab('lyrics');
    setIsExpandedOpen(true);
  };

  const handleOpenQueue = () => {
    setExpandedInitialTab('queue');
    setIsExpandedOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-purple-600 selection:text-white">
      {/* Top Navigation Bar adhering to 3-zone contract */}
      <TopBar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'discover' && (
          <DiscoverView
            onOpenLyrics={handleOpenLyrics}
            onSelectTrack={() => {}}
          />
        )}

        {activeTab === 'search' && (
          <SearchView onOpenLyrics={handleOpenLyrics} />
        )}

        {activeTab === 'karaoke' && (
          <KaraokeStudioView />
        )}

        {activeTab === 'library' && (
          <LibraryView
            initialSubTab="playlists"
            onOpenLyrics={handleOpenLyrics}
          />
        )}

        {activeTab === 'offline' && (
          <LibraryView
            initialSubTab="downloads"
            onOpenLyrics={handleOpenLyrics}
          />
        )}
      </main>

      {/* Persistent Bottom Player Bar */}
      <BottomPlayerBar
        onOpenExpanded={() => setIsExpandedOpen(true)}
        onOpenLyrics={handleOpenLyrics}
        onOpenQueue={handleOpenQueue}
      />

      {/* Fullscreen / Expanded Player & Lyrics Studio Modal */}
      <ExpandedPlayerModal
        isOpen={isExpandedOpen}
        onClose={() => setIsExpandedOpen(false)}
        initialTab={expandedInitialTab}
      />
    </div>
  );
}

export default function App() {
  return (
    <AudioProvider>
      <AppContent />
    </AudioProvider>
  );
}

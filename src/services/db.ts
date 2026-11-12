/**
 * Client-side IndexedDB persistent storage for Vibe Songs
 * Handles offline downloads, custom playlists, liked songs, and play history.
 */

export interface Track {
  id: string; // YouTube videoId or unique ID
  title: string;
  artist: string;
  duration: string;
  durationSeconds?: number;
  thumbnail: string;
  views?: string;
  album?: string;
  source?: 'youtube' | 'itunes' | 'curated' | 'offline';
  downloadedAt?: number;
  fileSizeBytes?: number;
  cachedLyrics?: {
    syncedLyrics?: string | null;
    plainLyrics?: string | null;
  };
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverEmoji: string;
  trackIds: string[];
  createdAt: number;
}

const DB_NAME = 'vibe_songs_storage';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('downloads')) {
        db.createObjectStore('downloads', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('liked')) {
        db.createObjectStore('liked', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('playlists')) {
        db.createObjectStore('playlists', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Downloads management
export async function saveDownloadedTrack(track: Track): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('downloads', 'readwrite');
    const store = tx.objectStore('downloads');
    const trackWithMeta: Track = {
      ...track,
      downloadedAt: Date.now(),
      fileSizeBytes: track.fileSizeBytes || Math.floor((track.durationSeconds || 210) * 128 * 1024 / 8), // est. 128kbps audio size
    };
    const req = store.put(trackWithMeta);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getDownloadedTracks(): Promise<Track[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('downloads', 'readonly');
    const store = tx.objectStore('downloads');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removeDownloadedTrack(trackId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('downloads', 'readwrite');
    const store = tx.objectStore('downloads');
    const req = store.delete(trackId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function isTrackDownloaded(trackId: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('downloads', 'readonly');
    const store = tx.objectStore('downloads');
    const req = store.get(trackId);
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => resolve(false);
  });
}

// Liked Songs
export async function getLikedTracks(): Promise<Track[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('liked', 'readonly');
    const store = tx.objectStore('liked');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function toggleLikeTrack(track: Track): Promise<boolean> {
  const db = await openDB();
  const liked = await isTrackLiked(track.id);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('liked', 'readwrite');
    const store = tx.objectStore('liked');
    if (liked) {
      const req = store.delete(track.id);
      req.onsuccess = () => resolve(false);
      req.onerror = () => reject(req.error);
    } else {
      const req = store.put(track);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    }
  });
}

export async function isTrackLiked(trackId: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('liked', 'readonly');
    const store = tx.objectStore('liked');
    const req = store.get(trackId);
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => resolve(false);
  });
}

// Play History
export async function addToHistory(track: Track): Promise<void> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    store.put({ ...track, playedAt: Date.now() });
    tx.oncomplete = () => resolve();
  });
}

export async function getHistory(): Promise<Track[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readonly');
    const store = tx.objectStore('history');
    const req = store.getAll();
    req.onsuccess = () => {
      const list = (req.result || []) as Array<Track & { playedAt?: number }>;
      list.sort((a, b) => (b.playedAt || 0) - (a.playedAt || 0));
      resolve(list.slice(0, 50));
    };
    req.onerror = () => reject(req.error);
  });
}

// Custom Playlists
export async function getCustomPlaylists(): Promise<Playlist[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readonly');
    const store = tx.objectStore('playlists');
    const req = store.getAll();
    req.onsuccess = () => {
      const res = req.result || [];
      if (res.length === 0) {
        // Seed default playlists
        const defaults: Playlist[] = [
          {
            id: 'pl_late_night',
            name: 'Late Night Vibes',
            description: 'Mellow melodies and midnight reflections',
            coverEmoji: '🌙',
            trackIds: ['34Na4j8AVgA', 'H5v3kku4y6Q', 'eVli-tstM5E'],
            createdAt: Date.now(),
          },
          {
            id: 'pl_workout',
            name: 'Workout High Voltage',
            description: 'Fast paced beats to push past limits',
            coverEmoji: '⚡',
            trackIds: ['H58vbez_m4E', '6ONRf7h3Mdk', '4NRXx6U8ABQ'],
            createdAt: Date.now(),
          },
          {
            id: 'pl_chill_lofi',
            name: 'Study & Coffee Lofi',
            description: 'Zero vocal focus beats for deep coding and work',
            coverEmoji: '☕',
            trackIds: ['jfKfPfyJRdk', 'rUxyKA_-grg', '5qap5aO4i9A'],
            createdAt: Date.now(),
          },
        ];
        resolve(defaults);
      } else {
        resolve(res);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function savePlaylist(playlist: Playlist): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readwrite');
    const store = tx.objectStore('playlists');
    const req = store.put(playlist);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readwrite');
    const store = tx.objectStore('playlists');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

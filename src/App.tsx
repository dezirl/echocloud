import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useT } from './i18n';
import {
  Heart,
  Sparkles,
  Disc,
  Database,
  Terminal,
  Sliders,
  DownloadCloud,
  PlusCircle,
  FolderLock,
  FolderOpen,
  History,
  Music,
  BellRing,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ImagePlus,
  X,
  LayoutList,
  LayoutGrid,
  Users,
  Play,
} from 'lucide-react';

import { useStore } from './store';

// Component imports
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import BottomPlayer from './components/BottomPlayer';
import DynamicBackground from './components/DynamicBackground';
import AudioPlayer from './components/AudioPlayer';
import MiniPlayer from './components/MiniPlayer';
import FullscreenPlayer from './components/FullscreenPlayer';
import PlaylistCard from './components/PlaylistCard';
import TrackCard from './components/TrackCard';
import InterceptorPanel from './components/InterceptorPanel';
import BootScreen from './components/BootScreen';
import ArtistPage from './components/ArtistPage';
import AlbumView from './components/AlbumView';

type Notification = {
  id: string;
  title: string;
  body: string;
};

function LikedTrackRow({ track, index }: { track: import('./types').Track; index: number }) {
  const currentTrackId = useStore((s) => s.currentTrackId);
  const isPlaying = useStore((s) => s.isPlaying);
  const playTrack = useStore((s) => s.playTrack);
  const toggleLikeTrack = useStore((s) => s.toggleLikeTrack);
  const addToManualQueue = useStore((s) => s.addToManualQueue);
  const setActiveArtistId = useStore((s) => s.setActiveArtistId);
  const isLiked = useStore((s) => s.tracks.find((t) => t.id === track.id)?.liked ?? track.liked);
  const isCurrent = currentTrackId === track.id;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div
      onClick={() => playTrack(track.id)}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${isCurrent ? 'bg-accent/[0.07] border border-accent/20' : 'border border-transparent hover:bg-white/[0.03] hover:border-white/[0.04]'}`}
    >
      {/* Index / equalizer indicator */}
      <span className={`w-5 text-center text-xs font-mono shrink-0 ${isCurrent ? 'text-accent' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
        {isCurrent && isPlaying ? (
          <span className="flex items-end justify-center gap-[2px] h-3.5">
            <span className="w-[2px] h-full bg-accent rounded-full animate-[pulse_0.8s_infinite]" style={{ animationDelay: '0.1s' }} />
            <span className="w-[2px] h-[75%] bg-accent rounded-full animate-[pulse_0.6s_infinite]" style={{ animationDelay: '0.3s' }} />
            <span className="w-[2px] h-[50%] bg-accent rounded-full animate-[pulse_0.9s_infinite]" style={{ animationDelay: '0.2s' }} />
          </span>
        ) : (index + 1)}
      </span>

      {/* Artwork */}
      <div className="w-9 h-9 shrink-0 rounded-lg overflow-hidden" style={{ background: 'linear-gradient(135deg,#1a1a2e,#0f3460)' }}>
        {track.artworkUrl && <img src={track.artworkUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />}
      </div>

      {/* Title + artist */}
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold truncate leading-tight ${isCurrent ? 'text-accent' : 'text-white'}`}>{track.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
          <button onClick={(e) => { e.stopPropagation(); if (track.artistId) setActiveArtistId(track.artistId); }} className={`text-[11px] text-zinc-500 truncate text-left ${track.artistId ? 'hover:text-accent cursor-pointer' : 'cursor-default'}`}>{track.artist}</button>
          {track.genre && <><span className="text-zinc-600 text-[10px] shrink-0">·</span><span className="text-[11px] text-zinc-600 truncate">{track.genre}</span></>}
        </div>
      </div>

      {/* Duration — hidden on hover to reveal action buttons */}
      <span className="text-[11px] font-mono text-zinc-600 shrink-0 tabular-nums hidden sm:block group-hover:hidden">{fmt(track.duration)}</span>

      {/* Action buttons — appear on hover, fixed width so they never overflow */}
      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); toggleLikeTrack(track.id); }}
          title={isLiked ? 'Unlike' : 'Like'}
          className={`p-2 rounded-lg cursor-pointer transition-colors ${isLiked ? 'text-accent' : 'text-zinc-500 hover:text-white'}`}
        >
          <Heart size={13} className={isLiked ? 'fill-current' : ''} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); addToManualQueue(track.id); }}
          title="Add to queue"
          className="p-2 rounded-lg text-zinc-500 hover:text-white cursor-pointer transition-colors"
        >
          <PlusCircle size={13} />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const tracks = useStore((state) => state.tracks);
  const playlists = useStore((state) => state.playlists);
  const searchQuery = useStore((state) => state.searchQuery);
  const userSession = useStore((state) => state.userSession);
  const downloads = useStore((state) => state.downloads);
  const addPlaylist = useStore((state) => state.addPlaylist);
  const addTrackToPlaylist = useStore((state) => state.addTrackToPlaylist);
  const addTracks = useStore((state) => state.addTracks);
  const setPlaylists = useStore((state) => state.setPlaylists);
  const removeDownload = useStore((state) => state.removeDownload);
  const homeSections = useStore((state) => state.homeSections);
  const setHomeSections = useStore((state) => state.setHomeSections);
  const appendSectionTracks = useStore((state) => (state as any).appendSectionTracks as (id: string, tracks: any[], nextHref?: string) => void);
  const activeArtistId = useStore((state) => state.activeArtistId);
  const activeAlbumId = useStore((state) => state.activeAlbumId);
  const setActiveArtistId = useStore((state) => state.setActiveArtistId);
  const setContextQueue = useStore((state) => state.setContextQueue);
  const language = useStore((state) => (state as any).language ?? 'en') as 'en' | 'ru';
  const setLanguage = useStore((state) => (state as any).setLanguage) as (l: 'en' | 'ru') => void;
  const t = useT();

  // Theme & customization preferences
  const appTheme = useStore((state) => state.appTheme) || 'slate';
  const setAppTheme = useStore((state) => state.setAppTheme);
  const bgVideoUrl = useStore((state) => state.bgVideoUrl);
  const setBgVideoUrl = useStore((state) => state.setBgVideoUrl);
  const bgImageUrl = useStore((state) => (state as any).bgImageUrl as string) || '';
  const setBgImageUrl = useStore((state) => (state as any).setBgImageUrl as (u: string) => void);
  const updateUserProfile = useStore((state) => (state as any).updateUserProfile as (p: any) => void);
  const visualizerType = useStore((state) => state.visualizerType) || 'hologram';
  const setVisualizerType = useStore((state) => state.setVisualizerType);
  const fullscreenOpen = useStore((state) => state.fullscreenMode);
  const setFullscreenMode = useStore((state) => state.setFullscreenMode);

  const dataLoadedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Local state managers
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingSections, setLoadingSections] = useState<Set<string>>(new Set());
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null);
  const [likedNextHref, setLikedNextHref] = useState<string | null>(null);
  const [isLoadingMoreLikes, setIsLoadingMoreLikes] = useState(false);
  const [likesViewMode, setLikesViewMode] = useState<'grid' | 'list'>('grid');
  const [searchArtists, setSearchArtists] = useState<any[]>([]);
  const [searchNextHref, setSearchNextHref] = useState<string | null>(null);
  const [isSearchLoadingMore, setIsSearchLoadingMore] = useState(false);
  const sectionScrollRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // AI Ambient DJ States
  const [moodInput, setMoodInput] = useState('');
  const [isAnalyzingMood, setIsAnalyzingMood] = useState(false);
  const [aiDjComments, setAiDjComments] = useState('Telemetry feed clear. Submit a mood query below to synchronize soundscapes.');

  // Settings states
  const [discordRpc, setDiscordRpc] = useState(true);
  const [bufferSize, setBufferSize] = useState('5120 KB');
  const [sandboxMode, setSandboxMode] = useState(true);

  // Synchronize CSS Accent Color custom property dynamically with App Theme settings
  useEffect(() => {
    const root = document.documentElement;
    const themeColors: Record<string, string> = {
      slate: '#ff6b00',
      obsidian: '#f4f4f5',
      sunset: '#d946ef',
      forest: '#10b981'
    };
    const accentColor = themeColors[appTheme] || '#ff6b00';
    root.style.setProperty('--color-accent', accentColor);
  }, [appTheme]);

  // Smart AI Mood submission client handler
  const handleMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moodInput.trim()) return;
    setIsAnalyzingMood(true);
    setAiDjComments('Inquiring orbital neural satellites...');

    try {
      const resp = await fetch('/api/gemini/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: moodInput })
      });
      const data = await resp.json();

      if (data.error && !data.genre) {
        throw new Error(data.error);
      }

      // 1. Update visualizer model in store
      useStore.setState({ visualizerType: data.visualizerTheme });

      // 2. Discover tracks matching that matched genre
      const matchedTracks = tracks.filter(t => t.genre.toLowerCase() === data.genre.toLowerCase() || t.genre.toLowerCase().includes(data.genre.toLowerCase()));
      const selectedTrackIds = matchedTracks.map(t => t.id);

      // 3. Register custom matching playlist automatically
      const generatedPlaylistId = 'ai-mood-' + Date.now();
      const newPl = {
        id: generatedPlaylistId,
        name: data.suggestedName,
        description: `AI DJ orbital capsule for prompt: "${moodInput}".`,
        artworkUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
        tracks: selectedTrackIds,
        type: 'user' as const,
        createdAt: new Date().toISOString().split('T')[0]
      };

      // Push to playlists state in store
      useStore.setState((state) => ({
        playlists: [newPl, ...state.playlists]
      }));

      // Highlight matching indicators
      setAiDjComments(`"${data.aiResponse}"`);
      triggerNotification('Mood Synth Engaged', `Synchronizing visualizers: "${data.visualizerTheme}". Triggering: "${data.genre}".`);

      // 4. Play matching tracks instantly
      if (selectedTrackIds.length > 0) {
        useStore.getState().playTrack(selectedTrackIds[0]);
      }

    } catch (err: any) {
      setAiDjComments('IPC link timeout. Initiated local lofi override filters.');
      triggerNotification('Safety Overrides', 'Safely loaded fallback chill ambient channels.');
    } finally {
      setIsAnalyzingMood(false);
    }
  };

  // Trigger floating notifications helper
  const triggerNotification = (title: string, body: string) => {
    const notify = { id: 'notify-' + Date.now(), title, body };
    setNotifications((prev) => [...prev, notify]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter(n => n.id !== notify.id));
    }, 4000);
  };

  // Restore persisted app settings from disk on startup
  useEffect(() => {
    if (!window.electronAPI?.loadSettings) return;
    window.electronAPI.loadSettings().then((saved) => {
      if (!saved) return;
      useStore.setState((s) => ({
        appTheme: (saved.appTheme ?? s.appTheme) as typeof s.appTheme,
        volume: saved.volume ?? s.volume,
        isMuted: saved.isMuted ?? s.isMuted,
        eqBands: saved.eqBands ?? s.eqBands,
        eqQ: saved.eqQ ?? s.eqQ,
        eqEnabled: saved.eqEnabled ?? s.eqEnabled,
        bgVideoUrl: saved.bgVideoUrl ?? s.bgVideoUrl,
        bgImageUrl: saved.bgImageUrl ?? s.bgImageUrl,
        isShuffle: saved.isShuffle ?? s.isShuffle,
        isRepeat: (saved.isRepeat ?? s.isRepeat) as typeof s.isRepeat,
        visualizerType: (saved.visualizerType ?? s.visualizerType) as typeof s.visualizerType,
        language: (saved.language ?? s.language) as typeof s.language,
        sidebarCollapsed: saved.sidebarCollapsed ?? s.sidebarCollapsed,
      }));
    }).catch(() => {});
  }, []);

  // Auto-updater notifications
  useEffect(() => {
    const offAvailable = window.electronAPI?.onUpdateAvailable?.(() => {
      triggerNotification('Update Available', 'Downloading new version in the background...');
    });
    const offDownloaded = window.electronAPI?.onUpdateDownloaded?.(() => {
      triggerNotification('Update Ready', 'Restart to install the new version.');
      useStore.setState({ pendingUpdate: true } as any);
    });
    return () => { offAvailable?.(); offDownloaded?.(); };
  }, []);

  // Auto-save settings to disk whenever any persisted value changes (debounced 600ms)
  useEffect(() => {
    if (!window.electronAPI?.saveSettings) return;

    const KEYS = [
      'appTheme', 'volume', 'isMuted', 'isShuffle', 'isRepeat',
      'eqBands', 'eqQ', 'eqEnabled',
      'bgVideoUrl', 'bgImageUrl',
      'visualizerType', 'language', 'sidebarCollapsed',
    ] as const;

    const unsubscribe = useStore.subscribe((state, prev) => {
      const changed = KEYS.some(k => (state as any)[k] !== (prev as any)[k]);
      if (!changed) return;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const s = useStore.getState();
        window.electronAPI!.saveSettings({
          appTheme: s.appTheme,
          volume: s.volume,
          isMuted: s.isMuted,
          isShuffle: s.isShuffle,
          isRepeat: s.isRepeat,
          eqBands: s.eqBands,
          eqQ: (s as any).eqQ,
          eqEnabled: s.eqEnabled,
          bgVideoUrl: s.bgVideoUrl,
          bgImageUrl: (s as any).bgImageUrl,
          visualizerType: s.visualizerType,
          language: (s as any).language,
          sidebarCollapsed: s.sidebarCollapsed,
        });
      }, 600);
    });

    return () => {
      unsubscribe();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Reset load guard on logout so next login re-fetches
  useEffect(() => {
    if (!userSession.isAuthenticated) dataLoadedRef.current = false;
  }, [userSession.isAuthenticated]);

  // Load real SC data (liked tracks + playlists) right after login
  useEffect(() => {
    if (!userSession.isAuthenticated || !window.electronAPI) return;
    if (dataLoadedRef.current) return;
    dataLoadedRef.current = true;

    const load = async () => {
      try {
        // Fetch real user profile (avatar, follower count)
        window.electronAPI!.getUser().then((user) => {
          if (user) updateUserProfile({
            username: user.username,
            avatarUrl: (user.avatar_url || '').replace('-large', '-t200x200'),
            followersCount: user.followers_count || 0,
            scUserId: user.id || 0,
          });
        }).catch(() => {});

        const [liked, playlistData, sections] = await Promise.allSettled([
          window.electronAPI!.getLikedTracks(),
          window.electronAPI!.getUserPlaylists(),
          window.electronAPI!.getHomeSections(),
        ]);

        if (liked.status === 'fulfilled' && liked.value?.tracks?.length) {
          addTracks(liked.value.tracks);
          setLikedNextHref(liked.value.nextHref ?? null);
        }

        if (playlistData.status === 'fulfilled') {
          const { playlists: scPlaylists, tracks: plTracks } = playlistData.value;
          if (plTracks?.length) addTracks(plTracks);
          if (scPlaylists?.length) {
            setPlaylists(scPlaylists);
            triggerNotification('Playlists Synced', `Loaded ${scPlaylists.length} playlists.`);
          }
        }

        if (sections.status === 'fulfilled' && sections.value?.length) {
          setHomeSections(sections.value);
        }
      } catch (e) {
        console.error('[App] Failed to load SC library:', e);
      }
    };

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSession.isAuthenticated]);

  // Live SoundCloud search — tracks + artists
  useEffect(() => {
    if (!searchQuery.trim() || !window.electronAPI) return;
    setSearchArtists([]);
    setSearchNextHref(null);
    const timer = setTimeout(async () => {
      try {
        const [trackResult, artists] = await Promise.allSettled([
          window.electronAPI!.search(searchQuery),
          window.electronAPI!.searchUsers(searchQuery),
        ]);
        if (trackResult.status === 'fulfilled' && trackResult.value) {
          const { tracks: fresh, nextHref } = trackResult.value;
          setSearchNextHref(nextHref);
          if (fresh?.length) {
            useStore.setState((state) => {
              const existingIds = new Set(state.tracks.map((t) => t.id));
              const newTracks = fresh.filter((r) => !existingIds.has(r.id));
              return { tracks: [...state.tracks, ...newTracks] };
            });
          }
        }
        if (artists.status === 'fulfilled') setSearchArtists(artists.value ?? []);
      } catch (e) {
        console.warn('[Search] SC API error:', e);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keep context queue in sync with the active tab's visible track list
  useEffect(() => {
    if (activeArtistId || activeAlbumId) return; // ArtistPage / AlbumView manage their own context
    if (activeTab === 'likes') {
      setContextQueue(tracks.filter(t => t.liked).map(t => t.id));
    } else if (activeTab === 'home' && homeSections.length > 0) {
      setContextQueue(homeSections.flatMap(s => s.tracks.map(t => t.id)));
    }
    // search context is set when queriedTracks updates (see below)
  }, [activeTab, homeSections, activeArtistId, activeAlbumId]);

  // Filter tracks matching current search words
  const queriedTracks = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return tracks.filter(t =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.genre.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tracks, searchQuery]);

  // Set contextQueue for search tab whenever queried tracks change
  useEffect(() => {
    if (activeTab === 'search' && queriedTracks.length > 0) {
      setContextQueue(queriedTracks.map(t => t.id));
    }
  }, [queriedTracks, activeTab]);

  // Liked tracks
  const likedTracks = useMemo(() => {
    return tracks.filter(t => t.liked);
  }, [tracks]);

  // Handle building user playlist
  const handleCreatePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    addPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    triggerNotification('Playlist Created', `Successfully created custom container list "${newPlaylistName}"`);
    setShowCreatePlaylistModal(false);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
  };

  const handleDragOverPlaylist = (e: React.DragEvent, playlistId: string) => {
    e.preventDefault();
  };

  const handleDropOnPlaylist = (e: React.DragEvent, playlistId: string) => {
    e.preventDefault();
    const trackId = e.dataTransfer.getData('text/plain');
    if (trackId) {
      addTrackToPlaylist(playlistId, trackId);
      const playlist = playlists.find(p => p.id === playlistId);
      triggerNotification('Track Cached', `Added track to playlist "${playlist?.name}"`);
    }
  };

  const handleRefreshHome = async () => {
    if (!window.electronAPI || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const sections = await window.electronAPI.getHomeSections();
      if (sections?.length) setHomeSections(sections);
    } catch (e) {
      console.warn('[App] Refresh failed:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshLikes = async () => {
    if (!window.electronAPI || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const result = await window.electronAPI.getLikedTracks();
      if (result?.tracks?.length) addTracks(result.tracks);
      setLikedNextHref(result?.nextHref ?? null);
    } catch (e) {
      console.warn('[App] Refresh likes failed:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadMoreLikes = async () => {
    if (!likedNextHref || isLoadingMoreLikes || !window.electronAPI) return;
    setIsLoadingMoreLikes(true);
    try {
      const result = await window.electronAPI.getLikedTracksMore(likedNextHref);
      if (result?.tracks?.length) {
        addTracks(result.tracks);
        setLikedNextHref(result.nextHref ?? null);
      } else {
        setLikedNextHref(null);
      }
    } catch (e) {
      console.warn('[App] loadMoreLikes failed:', e);
    } finally {
      setIsLoadingMoreLikes(false);
    }
  };

  const scrollSection = (sectionId: string, dir: 'left' | 'right') => {
    const el = sectionScrollRefs.current.get(sectionId);
    if (el) el.scrollBy({ left: dir === 'right' ? 220 : -220, behavior: 'smooth' });
  };

  const handleLoadMoreSection = async (sectionId: string, nextHref: string) => {
    if (!window.electronAPI || loadingSections.has(sectionId)) return;
    setLoadingSections((prev) => new Set([...prev, sectionId]));
    try {
      const result = await window.electronAPI.loadMoreSection(nextHref);
      if (result?.tracks?.length) {
        appendSectionTracks(sectionId, result.tracks, result.nextHref);
      }
    } catch (e) {
      console.warn('[App] loadMoreSection failed:', e);
    } finally {
      setLoadingSections((prev) => { const n = new Set(prev); n.delete(sectionId); return n; });
    }
  };

  const handleOpenSectionPlaylist = async (playlistId: string) => {
    if (!window.electronAPI?.getPlaylistById || loadingPlaylistId) return;
    setLoadingPlaylistId(playlistId);
    try {
      const result = await window.electronAPI.getPlaylistById(playlistId);
      if (result?.tracks?.length) {
        addTracks(result.tracks);
        setContextQueue(result.tracks.map((t: any) => t.id));
        useStore.getState().playTrack(result.tracks[0].id);
      }
    } catch (e) {
      console.warn('[App] getPlaylistById failed:', e);
    } finally {
      setLoadingPlaylistId(null);
    }
  };

  const handleSearchLoadMore = async () => {
    if (!searchNextHref || isSearchLoadingMore || !window.electronAPI) return;
    setIsSearchLoadingMore(true);
    try {
      const result = await window.electronAPI.searchMore(searchNextHref);
      if (result?.tracks?.length) {
        setSearchNextHref(result.nextHref);
        useStore.setState((state) => {
          const existingIds = new Set(state.tracks.map((t) => t.id));
          const newTracks = result.tracks.filter((r: any) => !existingIds.has(r.id));
          return { tracks: [...state.tracks, ...newTracks] };
        });
      } else {
        setSearchNextHref(null);
      }
    } catch (e) {
      console.warn('[Search] loadMore failed:', e);
    } finally {
      setIsSearchLoadingMore(false);
    }
  };

  // Listen to active downloaded updates to trigger toast notifications
  useMemo(() => {
    const completedDls = downloads.filter(d => d.status === 'completed');
    if (completedDls.length > 0) {
      const lastCompleted = completedDls[completedDls.length - 1];
      const trackObj = tracks.find(t => t.id === lastCompleted.trackId);
      if (trackObj) {
        // Run once
        const marker = `DL_NOTIFIED_${lastCompleted.id}`;
        if (!(window as any)[marker]) {
          (window as any)[marker] = true;
          triggerNotification('Download Completed', `Successfully cached "${trackObj.title}" for offline streaming.`);
        }
      }
    }
  }, [downloads, tracks]);

  if (!userSession.isAuthenticated) {
    return (
      <div className="relative flex flex-col h-screen w-screen overflow-hidden text-white bg-[#08080a] font-sans">
        <BootScreen triggerNotification={triggerNotification} />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden text-white bg-[#0c0c0c] font-sans">
      
      {/* Dynamic backdrop atmosphere lights */}
      <DynamicBackground />

      {/* Primary layout content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Acrylic Nav Sidebar */}
        <Sidebar />

        {/* Right Shell main display */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Header Bar */}
          <SearchBar />

          {/* Scrolling Content viewport container */}
          <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth z-10 select-none pb-24">

            {/* Artist profile overlay */}
            {activeArtistId != null && activeArtistId !== 0 && <ArtistPage artistId={activeArtistId} />}

            {/* Album / playlist detail overlay */}
            {!activeArtistId && activeAlbumId && <AlbumView albumId={activeAlbumId} />}

            {/* Main tab content — hidden when artist/album view is active */}
            <div className={activeArtistId || activeAlbumId ? 'hidden' : ''}>
            <AnimatePresence mode="wait">
              
              {/* === HOME TAB === */}
              {activeTab === 'home' && (
                <motion.div
                  key="tab-home"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="space-y-8 max-w-7xl mx-auto"
                >
                  {/* Hero greeting banner */}
                  {(() => {
                    const h = new Date().getHours();
                    const isRu = language === 'ru';
                    let greeting: string;
                    let emoji: string;
                    if (h >= 6  && h < 12) { greeting = isRu ? 'Доброе утро'  : 'Good morning';   emoji = '🌤'; }
                    else if (h >= 12 && h < 18) { greeting = isRu ? 'Добрый день'  : 'Good afternoon'; emoji = '☀️'; }
                    else if (h >= 18 && h < 23) { greeting = isRu ? 'Добрый вечер' : 'Good evening';   emoji = '🌆'; }
                    else                        { greeting = isRu ? 'Доброй ночи'  : 'Good night';     emoji = '🌙'; }
                    const name = userSession.isAuthenticated ? userSession.username : (isRu ? 'Гость' : 'Guest');
                    return (
                      <div className="relative p-6 md:p-8 rounded-3xl overflow-hidden border border-white/[0.06] flex flex-col justify-center min-h-[150px] md:min-h-[180px]"
                        style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.12) 0%, rgba(120,40,180,0.08) 50%, rgba(10,10,14,0.6) 100%)' }}
                      >
                        {/* Decorative background text */}
                        <div className="absolute top-3 right-5 text-white/[0.04] pointer-events-none select-none font-black" style={{ fontSize: '6rem', lineHeight: 1 }}>EC</div>

                        <div className="relative z-10">
                          {/* Time-based greeting */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{emoji}</span>
                            <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">EchoCloud</span>
                          </div>
                          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                            {greeting},{' '}
                            <span style={{ color: 'var(--color-accent)' }}>{name}</span>
                          </h1>

                          {/* Telegram channel link */}
                          <p className="mt-2 text-[12px] text-zinc-500 font-sans">
                            {isRu ? 'Подпишитесь на канал разработчика' : 'Follow the developer\'s channel'}{' '}
                            <a
                              href="https://t.me/zer0tune"
                              target="_blank"
                              rel="noreferrer"
                              className="text-zinc-400 hover:text-accent transition-colors underline underline-offset-2 cursor-pointer"
                            >
                              @zer0tune
                            </a>
                          </p>
                        </div>
                      </div>
                    );
                  })()}



                  {/* ── Real SC home sections (loaded after login) ── */}
                  {homeSections.length > 0 ? (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-600 tracking-widest">YOUR SOUNDCLOUD FEED</span>
                        <button
                          onClick={handleRefreshHome}
                          disabled={isRefreshing}
                          title="Refresh feed"
                          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono text-zinc-500 hover:text-white border border-white/5 hover:border-white/10 rounded-lg cursor-pointer transition-colors disabled:opacity-40"
                        >
                          <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
                          <span>{isRefreshing ? 'REFRESHING...' : 'REFRESH'}</span>
                        </button>
                      </div>
                      {homeSections.filter(s => !s.title.toLowerCase().includes('more of what you like')).map((section) => (
                        <div key={section.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-mono font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-1.5">
                              <Music size={11} className="text-accent" />
                              <span>{section.title.toUpperCase()}</span>
                            </h3>
                            <div className="flex gap-1">
                              <button
                                onClick={() => scrollSection(section.id, 'left')}
                                className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                              >
                                <ChevronLeft size={12} />
                              </button>
                              <button
                                onClick={() => scrollSection(section.id, 'right')}
                                className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                              >
                                <ChevronRight size={12} />
                              </button>
                            </div>
                          </div>
                          <div
                            ref={(el) => { if (el) sectionScrollRefs.current.set(section.id, el); }}
                            className="flex gap-4 overflow-x-auto py-3 -mx-1 px-1"
                            style={{ scrollbarWidth: 'none' }}
                          >
                            {section.tracks.map((tr: any) => (
                              <div key={tr.id} className="shrink-0 w-48">
                                {tr._sectionKind === 'playlist' ? (
                                  <div
                                    onClick={() => handleOpenSectionPlaylist(tr.id)}
                                    className="group cursor-pointer rounded-2xl overflow-hidden border border-white/[0.05] hover:border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-200"
                                  >
                                    <div className="relative w-full aspect-square bg-zinc-900 overflow-hidden">
                                      {tr.artworkUrl ? (
                                        <img src={tr.artworkUrl} alt={tr.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                          <Music size={28} className="text-zinc-600" />
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        {loadingPlaylistId === tr.id
                                          ? <Disc size={22} className="text-white animate-spin" style={{ animationDuration: '1.2s' }} />
                                          : <Play size={22} className="text-white fill-current" />
                                        }
                                      </div>
                                    </div>
                                    <div className="p-2.5">
                                      <p className="text-[11px] font-bold text-white truncate leading-tight">{tr.title}</p>
                                      {tr._trackCount > 0 && <p className="text-[9px] font-mono text-zinc-500 mt-0.5">{tr._trackCount} tracks</p>}
                                      {tr.artist && <p className="text-[9px] text-zinc-500 truncate mt-0.5">{tr.artist}</p>}
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('text/plain', tr.id);
                                      triggerNotification('Track Dragged', 'Drop onto any playlist card to save.');
                                    }}
                                  >
                                    <TrackCard track={tr} />
                                  </div>
                                )}
                              </div>
                            ))}
                            {section.nextHref && (
                              <div className="shrink-0 flex items-center">
                                <button
                                  onClick={() => handleLoadMoreSection(section.id, section.nextHref!)}
                                  disabled={loadingSections.has(section.id)}
                                  className="h-full min-h-[180px] px-4 flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors disabled:opacity-40"
                                >
                                  {loadingSections.has(section.id) ? (
                                    <Disc size={16} className="animate-spin text-accent" style={{ animationDuration: '1.5s' }} />
                                  ) : (
                                    <ChevronRight size={16} />
                                  )}
                                  <span className="text-[9px] font-mono tracking-widest">
                                    {loadingSections.has(section.id) ? 'LOADING...' : 'MORE'}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Playlists grid (shown before SC data loads) */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-mono font-bold text-zinc-500 tracking-widest uppercase flex items-center gap-1.5">
                          <Database size={12} className="text-accent" />
                          <span>PLAYLISTS</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                          {playlists.map((pl) => (
                            <div
                              key={pl.id}
                              onDragOver={(e) => handleDragOverPlaylist(e, pl.id)}
                              onDrop={(e) => handleDropOnPlaylist(e, pl.id)}
                              onClick={() => setSelectedPlaylistId(pl.id === selectedPlaylistId ? null : pl.id)}
                              className={`rounded-2xl border transition-all ${selectedPlaylistId === pl.id ? 'border-accent/40 ring-1 ring-accent/10 shadow-[0_0_20px_rgba(255,107,0,0.08)]' : 'border-transparent'}`}
                            >
                              <PlaylistCard playlist={pl} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Playlist detail drawer */}
                      {selectedPlaylistId && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-5 bg-white/[0.01] border border-white/[0.04] rounded-2xl space-y-4 overflow-hidden"
                        >
                          {(() => {
                            const pl = playlists.find(p => p.id === selectedPlaylistId);
                            if (!pl) return null;
                            const plTracks = pl.tracks.map(id => tracks.find(t => t.id === id)).filter(Boolean);
                            return (
                              <>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-sm font-extrabold text-[#ff6b00]">{pl.name}</h4>
                                    <p className="text-xs text-zinc-400 mt-1">{pl.description}</p>
                                  </div>
                                  <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-zinc-400 font-mono">
                                    {plTracks.length} tracks
                                  </span>
                                </div>
                                {plTracks.length === 0 ? (
                                  <p className="text-xs text-zinc-500 text-center py-4">Drag tracks here to build the playlist.</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {plTracks.map((tr) => tr && (
                                      <div
                                        key={`pltr-${tr.id}`}
                                        onClick={() => useStore.getState().playTrack(tr.id)}
                                        className="flex items-center gap-3 p-2 bg-black/40 hover:bg-neutral-900 border border-white/5 rounded-xl cursor-pointer transition-colors"
                                      >
                                        <img src={tr.artworkUrl} className="w-9 h-9 rounded-lg object-cover" />
                                        <div className="flex-1 min-w-0">
                                          <h5 className="text-[11.5px] font-bold truncate">{tr.title}</h5>
                                          <p className="text-[10px] text-zinc-400 truncate">{tr.artist}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </motion.div>
                      )}

                      {/* Fallback tracks grid */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-mono font-bold text-zinc-500 tracking-widest uppercase flex items-center gap-1.5">
                          <Disc size={12} className="text-accent animate-spin" style={{ animationDuration: '6s' }} />
                          <span>LIBRARY ({tracks.length} TRACKS)</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
                          {tracks.map((tr) => (
                            <div
                              key={tr.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', tr.id);
                                triggerNotification('Track Dragged', 'Drop onto any playlist card to save.');
                              }}
                            >
                              <TrackCard track={tr} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* === SEARCH TAB === */}
              {activeTab === 'search' && (
                <motion.div
                  key="tab-search"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-8 max-w-7xl mx-auto"
                >
                  <div className="mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-white">{t.search.title}</h2>
                    <p className="text-xs text-zinc-400 mt-1">{t.search.subtitle}</p>
                  </div>

                  {/* Empty state filters */}
                  {!searchQuery.trim() ? (
                    <div className="space-y-6">
                      <span className="text-[10px] font-mono text-zinc-500 tracking-wider">TRENDING CLOUD SEARCHES</span>
                      <div className="flex flex-wrap gap-2.5">
                        {['Synthwave', 'Outrun', 'Tokyo Lofi', 'Liquid DnB', 'Chilling Space', 'Waveshaper'].map((tag) => (
                          <button
                            key={tag}
                            onClick={() => useStore.setState({ searchQuery: tag })}
                            className="px-4 py-2 bg-white/[0.015] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-col items-center justify-center p-12 bg-white/[0.01] border border-white/5 rounded-2xl text-center">
                        <Terminal size={24} className="text-zinc-600 mb-3" />
                        <span className="text-sm font-semibold tracking-tight">Active SoundCloud Extraction Mode</span>
                        <p className="text-xs text-zinc-500 max-w-sm mt-1">Submit keywords or search metrics. Bypasses metadata blocks automatically.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Artists section */}
                      {searchArtists.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-mono font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-1.5">
                            <Users size={11} className="text-accent" />
                            <span>ARTISTS</span>
                          </h3>
                          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                            {searchArtists.map((artist) => (
                              <button
                                key={artist.scId}
                                onClick={() => setActiveArtistId(artist.scId)}
                                className="shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.1] transition-all cursor-pointer w-28"
                              >
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                                  {artist.avatarUrl && (
                                    <img src={artist.avatarUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer"
                                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                                  )}
                                </div>
                                <span className="text-[11px] font-semibold text-white text-center truncate w-full">{artist.username}</span>
                                {artist.displayName && artist.displayName !== artist.username && (
                                  <span className="text-[9px] text-zinc-500 text-center truncate w-full">{artist.displayName}</span>
                                )}
                                <span className="text-[10px] text-zinc-500 font-mono">{(artist.followersCount || 0).toLocaleString()} followers</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tracks section */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-mono font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-1.5">
                          <Music size={11} className="text-accent" />
                          <span>TRACKS — {queriedTracks.length} RESULTS FOR "{searchQuery}"</span>
                        </h3>

                        {queriedTracks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-center">
                            <History size={24} className="text-zinc-600 mb-3" />
                            <span className="text-sm font-semibold text-zinc-400">Search crawler has run dry</span>
                            <p className="text-xs text-zinc-600 max-w-xs mt-1">We couldn't locate any items locally. Check spelling or copy-paste standard direct soundcloud track links to extract.</p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5 animate-in fade-in duration-300">
                              {queriedTracks.map((tr) => (
                                <div key={tr.id}>
                                  <TrackCard track={tr} />
                                </div>
                              ))}
                            </div>
                            {searchNextHref && (
                              <div className="flex justify-center mt-4">
                                <button
                                  onClick={handleSearchLoadMore}
                                  disabled={isSearchLoadingMore}
                                  className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] text-zinc-400 hover:text-white rounded-xl text-xs font-mono transition-colors disabled:opacity-40 cursor-pointer"
                                >
                                  {isSearchLoadingMore ? (
                                    <><Disc size={12} className="animate-spin text-accent" style={{ animationDuration: '1.5s' }} /><span>LOADING...</span></>
                                  ) : (
                                    <><ChevronDown size={12} /><span>LOAD MORE</span></>
                                  )}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* === LIKED TAB === */}
              {activeTab === 'likes' && (
                <motion.div
                  key="tab-likes"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 max-w-7xl mx-auto"
                >
                  <div className="flex items-center justify-between border-b border-[#ffffff05] pb-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Heart className="text-accent fill-current" size={20} />
                        <span>{t.likes.title}</span>
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">{t.likes.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleRefreshLikes}
                        disabled={isRefreshing}
                        title="Refresh liked tracks"
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono text-zinc-500 hover:text-white border border-white/5 hover:border-white/10 rounded-lg cursor-pointer transition-colors disabled:opacity-40"
                      >
                        <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
                        <span>{isRefreshing ? 'REFRESHING...' : 'REFRESH'}</span>
                      </button>
                      <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.05] rounded-xl">
                        <button onClick={() => setLikesViewMode('grid')} title="Grid view" className={`p-1.5 rounded-lg transition-all cursor-pointer ${likesViewMode === 'grid' ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}><LayoutGrid size={14} /></button>
                        <button onClick={() => setLikesViewMode('list')} title="List view" className={`p-1.5 rounded-lg transition-all cursor-pointer ${likesViewMode === 'list' ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}><LayoutList size={14} /></button>
                      </div>
                    </div>
                  </div>

                  {likedTracks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white/[0.01] border border-white/5 rounded-2xl text-center">
                      <Heart size={30} className="text-zinc-700 animate-pulse mb-3" />
                      <span className="text-sm font-semibold">{t.likes.empty}</span>
                      <p className="text-xs text-zinc-500 max-w-xs mt-1">{t.likes.emptyHint}</p>
                      <button onClick={() => setActiveTab('home')} className="mt-5 px-4.5 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl transition-colors border border-white/5 cursor-pointer">{t.likes.browse}</button>
                    </div>
                  ) : likesViewMode === 'grid' ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5 animate-in fade-in duration-300">
                        {likedTracks.map((tr) => <div key={tr.id}><TrackCard track={tr} /></div>)}
                      </div>
                      {likedNextHref && (
                        <div className="flex justify-center mt-6">
                          <button
                            onClick={handleLoadMoreLikes}
                            disabled={isLoadingMoreLikes}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] text-zinc-400 hover:text-white rounded-xl text-xs font-mono transition-colors disabled:opacity-40 cursor-pointer"
                          >
                            {isLoadingMoreLikes ? <><Disc size={12} className="animate-spin text-accent" /><span>LOADING...</span></> : <><ChevronDown size={12} /><span>MORE</span></>}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="space-y-0.5 animate-in fade-in duration-300">
                        {likedTracks.map((tr, i) => (
                          <LikedTrackRow key={tr.id} track={tr} index={i} />
                        ))}
                      </div>
                      {likedNextHref && (
                        <div className="flex justify-center mt-6">
                          <button
                            onClick={handleLoadMoreLikes}
                            disabled={isLoadingMoreLikes}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] text-zinc-400 hover:text-white rounded-xl text-xs font-mono transition-colors disabled:opacity-40 cursor-pointer"
                          >
                            {isLoadingMoreLikes ? <><Disc size={12} className="animate-spin text-accent" /><span>LOADING...</span></> : <><ChevronDown size={12} /><span>MORE</span></>}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* === PLAYLISTS VIEW === */}
              {activeTab === 'playlists' && (
                <motion.div
                  key="tab-playlists"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 max-w-7xl mx-auto"
                >
                  <div className="flex items-center justify-between border-b border-[#ffffff05] pb-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-white">{t.playlists.title}</h2>
                      <p className="text-xs text-zinc-400 mt-1">{t.playlists.subtitle}</p>
                    </div>

                    <button
                      onClick={() => setShowCreatePlaylistModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-accent to-orange-500 text-black font-extrabold text-xs rounded-xl shadow-[0_4px_15px_rgba(255,107,0,0.15)] flex items-center gap-1.5 cursor-pointer hover:shadow-[0_4px_20px_rgba(255,107,0,0.25)] transition-all"
                    >
                      <PlusCircle size={13} />
                      <span>{t.playlists.newBtn}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {playlists.map((pl) => (
                      <div key={`tabpl-${pl.id}`} className="bg-[#12121245] border border-[#ffffff04] rounded-2xl">
                        <PlaylistCard playlist={pl} />
                        
                        <div className="p-3 bg-black/30 border-t border-white/[0.03] flex items-center justify-between text-[10px] text-zinc-500 font-mono font-semibold rounded-b-2xl">
                          <span>DEPLOYED ON {pl.createdAt}</span>
                          <span className="text-accent">{pl.type.toUpperCase()} TYPE</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {showCreatePlaylistModal && (
                    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
                      <div className="w-full max-w-sm liquid-glass rounded-2xl p-6 relative">
                        <h3 className="text-base font-bold mb-3">Create Container Bucket</h3>
                        <form onSubmit={handleCreatePlaylistSubmit} className="space-y-4">
                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 tracking-wider">PLAYLIST NAME</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Liquid Midnight Vibing"
                              value={newPlaylistName}
                              onChange={(e) => setNewPlaylistName(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white/[0.04] border border-white/5 text-xs rounded-lg mt-1 focus:outline-none focus:border-accent/40"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-mono text-zinc-500 tracking-wider">CONTAINER DESCRIPTION</label>
                            <textarea
                              rows={2}
                              placeholder="Describe the mood..."
                              value={newPlaylistDesc}
                              onChange={(e) => setNewPlaylistDesc(e.target.value)}
                              className="w-full px-3 py-2 bg-white/[0.04] border border-white/5 text-xs rounded-lg mt-1 focus:outline-none focus:border-accent/40"
                            />
                          </div>

                          <div className="flex gap-2.5 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowCreatePlaylistModal(false)}
                              className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-xs rounded-lg transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="flex-1 py-1.5 bg-accent hover:brightness-90 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Provision List
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* === DOWNLOADS TAB === */}
              {activeTab === 'downloads' && (
                <motion.div
                  key="tab-downloads"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 max-w-7xl mx-auto"
                >
                  <div className="border-b border-[#ffffff05] pb-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <DownloadCloud className="text-accent" />
                        <span>{t.downloads.title}</span>
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">{t.downloads.subtitle}</p>
                    </div>
                    {window.electronAPI && (
                      <button
                        onClick={() => window.electronAPI!.openDownloadsFolder()}
                        title="Open downloads folder"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white border border-white/5 hover:border-white/10 rounded-xl cursor-pointer transition-colors shrink-0"
                      >
                        <FolderOpen size={13} />
                        <span className="font-mono">OPEN FOLDER</span>
                      </button>
                    )}
                  </div>

                  {downloads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-white/5 rounded-2xl text-center">
                      <FolderLock size={26} className="text-zinc-700 mb-2.5 animate-pulse" />
                      <span className="text-xs font-bold">{t.downloads.empty}</span>
                      <p className="text-[11px] text-zinc-500 max-w-sm mt-1">{t.downloads.emptyHint}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {downloads.map((dl) => {
                        const track = tracks.find(tr => tr.id === dl.trackId);
                        if (!track) return null;
                        return (
                          <div
                            key={dl.id}
                            className="p-4 bg-neutral-900/40 border border-[#ffffff04] hover:border-white/10 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors animate-in fade-in duration-300"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-900">
                                {track.artworkUrl && (
                                  <img
                                    src={track.artworkUrl}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-white truncate">{track.title}</h4>
                                <span className="text-[10px] text-zinc-500">{track.artist}</span>
                              </div>
                            </div>

                            <div className="flex-1 md:max-w-xs space-y-1.5">
                              <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-bold">
                                <span className={dl.status === 'error' ? 'text-red-400' : dl.status === 'completed' ? 'text-emerald-400' : ''}>
                                  {dl.status.toUpperCase()}
                                </span>
                                {dl.status !== 'error' && (
                                  <span className="text-accent">{dl.progress}%</span>
                                )}
                              </div>
                              {dl.status !== 'error' && (
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 ${dl.status === 'completed' ? 'bg-emerald-500' : 'bg-accent animate-pulse'}`}
                                    style={{ width: `${dl.progress}%` }}
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {dl.status === 'completed' && (
                                <button
                                  onClick={() => useStore.getState().playTrack(track.id)}
                                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/15 rounded text-[10px] font-mono font-bold cursor-pointer"
                                >
                                  PLAY
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  if (dl.filePath && window.electronAPI) {
                                    await window.electronAPI.deleteDownload(dl.filePath);
                                  }
                                  removeDownload(dl.id);
                                }}
                                title="Remove"
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* === INTERCEPTOR LOGGER VIEW === */}
              {activeTab === 'interceptor' && (
                <InterceptorPanel />
              )}

              {/* === SETTINGS VIEW === */}
              {activeTab === 'settings' && (
                <motion.div
                  key="tab-settings"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 max-w-3xl mx-auto"
                >
                  <div className="border-b border-[#ffffff05] pb-4">
                    <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                      <Sliders className="text-accent" />
                      <span>{t.settings.title}</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">{t.settings.themeDesc}</p>
                  </div>

                  <div className="space-y-4">
                    
                    {/* App Visualizer Theme Selector */}
                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl space-y-3">
                      <div>
                        <h3 className="text-xs font-mono font-bold text-zinc-400 tracking-wider">CYBERNETIC INTERFACE THEME</h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Shifts visual accent colors, blurred backing circles, and canvas filter ratios.</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { id: 'slate', name: 'Slate Gray', desc: 'Default Neon Orange', color: 'from-[#ff6b00] to-zinc-900' },
                          { id: 'obsidian', name: 'Obsidian Black', desc: 'Minimal Dark White', color: 'from-zinc-100 to-black' },
                          { id: 'sunset', name: 'Cyber Sunset', desc: 'Purple & Orange', color: 'from-fuchsia-500 to-orange-500' },
                          { id: 'forest', name: 'Pine Forest', desc: 'Emerald & Jade', color: 'from-emerald-500 to-stone-900' }
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setAppTheme(t.id as any);
                              triggerNotification('Accent Theme Changed', `Active environment shifted to: ${t.name}`);
                            }}
                            className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                              appTheme === t.id 
                                ? 'bg-white/[0.04] border-accent/40 shadow-[0_0_12px_rgba(255,107,0,0.1)]' 
                                : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className={`w-full h-1.5 rounded-full bg-gradient-to-r ${t.color} mb-2`} />
                            <div className="text-[11px] font-bold text-zinc-200">{t.name}</div>
                            <div className="text-[8.5px] text-zinc-500 font-mono">{t.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language selector */}
                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-mono font-bold text-zinc-400 tracking-wider">{t.settings.languageLabel}</h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{t.settings.languageDesc}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {(['en', 'ru'] as const).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border cursor-pointer transition-all ${
                              language === lang
                                ? 'bg-accent/15 border-accent/30 text-accent'
                                : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/10'
                            }`}
                          >
                            {lang.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Video Background */}
                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl space-y-3">
                      <div>
                        <h3 className="text-xs font-mono font-bold text-zinc-400 tracking-wider">EMBED CUSTOM BACKGROUND VIDEO (LIVE LAYER)</h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Input a direct path (e.g. .mp4 file link) to override standard ambient glow with looping video.</p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Paste a direct video link e.g. https://example.com/live.mp4"
                          value={bgVideoUrl}
                          onChange={(e) => {
                            setBgVideoUrl(e.target.value);
                          }}
                          className="flex-1 h-9.5 px-3 bg-white/[0.03] border border-white/10 text-xs text-zinc-200 rounded-lg focus:outline-none focus:border-accent"
                        />
                        {bgVideoUrl && (
                          <button
                            onClick={() => {
                              setBgVideoUrl('');
                              triggerNotification('Background Reset', 'Custom background video cleared.');
                            }}
                            className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 text-xs rounded-lg font-semibold cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1.5">
                        <span className="text-[9px] font-mono text-zinc-500 self-center">ATMOSPHERIC PRESETS:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setBgVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-rotating-starry-nebula-in-space-41231-large.mp4');
                            triggerNotification('Preset Video Loaded', 'Pulsing galactic stellar field enabled.');
                          }}
                          className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] rounded font-mono text-zinc-300 cursor-pointer"
                        >
                          Galactic Nebula
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBgVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-retro-futurism-grid-background-41483-large.mp4');
                            triggerNotification('Preset Video Loaded', 'Vaporwave synth grid background enabled.');
                          }}
                          className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] rounded font-mono text-zinc-300 cursor-pointer"
                        >
                          Vaporwave Grid
                        </button>
                      </div>
                    </div>

                    {/* Custom Image Background */}
                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl space-y-3">
                      <div>
                        <h3 className="text-xs font-mono font-bold text-zinc-400 tracking-wider">CUSTOM BACKGROUND IMAGE</h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Upload a PNG or JPG image to use as the app background.</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <label className="flex-1 flex items-center gap-2 px-3 h-9 bg-white/[0.03] border border-white/10 hover:border-accent/40 rounded-lg cursor-pointer transition-colors text-xs text-zinc-400 hover:text-zinc-200">
                          <ImagePlus size={13} />
                          <span className="truncate">{bgImageUrl ? 'Image loaded — click to change' : 'Choose image file…'}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setBgImageUrl(ev.target?.result as string);
                                triggerNotification('Background Set', `Image "${file.name}" applied.`);
                              };
                              reader.readAsDataURL(file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        {bgImageUrl && (
                          <button
                            onClick={() => { setBgImageUrl(''); triggerNotification('Background Cleared', 'Custom background image removed.'); }}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                      {bgImageUrl && (
                        <div className="w-full h-20 rounded-lg overflow-hidden border border-white/5">
                          <img src={bgImageUrl} className="w-full h-full object-cover" alt="bg preview" />
                        </div>
                      )}
                    </div>

                    {/* CLIENT-ID config cell */}
                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl space-y-2">
                      <h3 className="text-xs font-mono font-bold text-zinc-400 tracking-wider">SOUNDCLOUD PRIVATE CLIENT ID MASK</h3>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={userSession.clientId}
                          className="flex-1 h-9 px-3 bg-white/[0.04] border border-white/10 text-xs font-mono text-zinc-300 rounded-lg select-all focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(userSession.clientId);
                            triggerNotification('Client ID copied', 'Copied secure payload hash.');
                          }}
                          className="px-3 py-1 bg-[#222] text-xs hover:bg-neutral-800 rounded-lg border border-white/5 font-semibold cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        This rotates dynamically to represent active background cookies. Custom headers bypass limits on public SoundCloud play sequences.
                      </p>
                    </div>

                    {/* Discord RPC Cell */}
                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-mono font-bold text-zinc-400 tracking-wider">DISCORD RICH PRESENCE WRAPPER</h3>
                        <p className="text-[10px] text-zinc-500 mt-1">Broadcasting active track metadata as your Discord Activity status in user tray.</p>
                      </div>
                      <button
                        onClick={() => {
                          setDiscordRpc(!discordRpc);
                          triggerNotification('System State Shift', `Discord RPC tray broadcast set to ${!discordRpc}`);
                        }}
                        className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border cursor-pointer ${discordRpc ? 'bg-accent/15 border-accent/25 text-accent' : 'bg-white/5 border-transparent text-zinc-500'}`}
                      >
                        {discordRpc ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>

                    {/* Audio Buffer Size Cell */}
                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-mono font-bold text-zinc-400 tracking-wider">ALLOCATED CORE TS AUDIO BUFFER SIZE</h3>
                        <p className="text-[10px] text-zinc-500 mt-1">Configure RAM buffers writing to Electron network threads bypass.</p>
                      </div>
                      <select
                        value={bufferSize}
                        onChange={(e) => {
                          setBufferSize(e.target.value);
                          triggerNotification('System Prefs Refined', `Audio Buffer allocated: ${e.target.value}`);
                        }}
                        className="bg-zinc-900 border border-white/5 text-xs rounded-lg p-1.5 text-zinc-300 focus:outline-none focus:border-accent"
                      >
                        <option value="2048 KB">2048 KB (Normal)</option>
                        <option value="5120 KB">5120 KB (High Fidelity)</option>
                        <option value="10240 KB">10240 KB (Lossless Extreme)</option>
                      </select>
                    </div>

                    {/* Security sandbox */}
                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-mono font-bold text-zinc-400 tracking-wider">SECURE IPC CONTAINER PROTECTION</h3>
                        <p className="text-[10px] text-zinc-500 mt-1">Run requests in isolated sandbox blocks to protect Soundcloud user accounts.</p>
                      </div>
                      <button
                        onClick={() => {
                          setSandboxMode(!sandboxMode);
                          triggerNotification('Security Layer Shift', `Active IPC Sandbox safety set: ${!sandboxMode}`);
                        }}
                        className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border cursor-pointer ${sandboxMode ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                      >
                        {sandboxMode ? 'ISOLATION ON' : 'SANDBOX BYPASS'}
                      </button>
                    </div>

                    {/* Flush settings */}
                    <div className="text-center pt-4">
                      <button
                        onClick={() => {
                          useStore.setState({ tracks: tracks.map(t => ({ ...t, liked: false })) });
                          triggerNotification('Database Flush', 'Successfully reset internal memory layouts, cookies, and tokens.');
                        }}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 rounded-xl transition-all cursor-pointer"
                      >
                        Wipe App Cache Data
                      </button>
                    </div>

                  </div>
                </motion.div>
              )}

            </AnimatePresence>
            </div>{/* end main tab content wrapper */}
          </div>

          {/* Hidden HTML5 Core Audio Wrapper Driver */}
          <AudioPlayer />

          {/* Bottom Player Overlay dashboard anchor bar */}
          <BottomPlayer />

        </div>
      </div>

      {/* Floating Mini widget player */}
      <AnimatePresence>
        <MiniPlayer />
      </AnimatePresence>

      {/* Slide-in native looking system notification overlays */}
      <div className="fixed bottom-24 left-6 z-50 space-y-2.5 max-w-sm pointer-events-none text-zinc-200">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20 }}
              className="p-3.5 bg-neutral-950/90 backdrop-blur-3xl border border-accent/25 rounded-2xl flex items-start gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)] cursor-default pointer-events-auto"
            >
              <div className="relative shrink-0 flex items-center justify-center w-8 h-8">
                <span className="absolute inset-0 rounded-full bg-accent/20 animate-ping" style={{ animationDuration: '1.4s' }} />
                <span className="absolute inset-0 rounded-full bg-accent/10 animate-ping" style={{ animationDuration: '1.4s', animationDelay: '0.5s' }} />
                <div className="relative z-10 p-1.5 bg-accent/15 rounded-xl text-accent">
                  <BellRing size={14} />
                </div>
              </div>
              <div>
                <span className="text-xs font-bold font-sans tracking-tight text-white block">{n.title}</span>
                <p className="text-[10px] text-zinc-400 mt-1 leading-normal font-sans">{n.body}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Fullscreen cinematic visualizer stage overlay rendered at root level */}
      <FullscreenPlayer isOpen={fullscreenOpen} onClose={() => setFullscreenMode(false)} />

    </div>
  );
}

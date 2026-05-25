import { create } from 'zustand';
import { Track, Playlist, InterceptorLog, UserSession, HomeSection } from './types';

// Let's pre-generate high-quality wave data
const generateWaveform = (count: number) => {
  const wave = [];
  for (let i = 0; i < count; i++) {
    // Generate organic sounding soundwave peaks
    const val = Math.floor(15 + Math.sin(i * 0.2) * 35 + Math.sin(i * 0.5) * 20 + Math.random() * 15);
    wave.push(Math.max(5, Math.min(95, val)));
  }
  return wave;
};

const DEFAULT_TRACKS: Track[] = [
  {
    id: 'sc-track-1',
    title: 'Neon Drift (Sunset Overdrive)',
    artist: 'Waveshaper [Unofficial]',
    genre: 'Synthwave',
    artworkUrl: 'https://images.unsplash.com/photo-1615247001958-f4bc92fa6a4a?w=400&auto=format&fit=crop&q=80',
    streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 372,
    liked: true,
    waveform: generateWaveform(60),
    soundcloudUrl: 'https://soundcloud.com/waveshaper-official/neon-drift',
    downloadUrl: '#',
    playCount: 142850,
    publishedAt: '2026-01-10',
    lyrics: [
      '[00:15] Driving deep into the neon light...',
      '[00:32] Gridlines glowing in the velvet night...',
      '[00:48] No looking back, we fly...',
      '[01:10] Laser rays slicing through the dark...',
      '[01:35] Accelerating past the safety spark...',
      '[02:05] [Interstellar solo]',
      '[02:40] Lost in the drift, neon memories fade...',
      '[03:15] A synth-wave symphony is made.'
    ]
  },
  {
    id: 'sc-track-2',
    title: 'Retro Highway 101',
    artist: 'Tokyo Rose',
    genre: 'Outrun',
    artworkUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 423,
    liked: false,
    waveform: generateWaveform(60),
    soundcloudUrl: 'https://soundcloud.com/tokyorosemusic/retro-highway',
    downloadUrl: '#',
    playCount: 98412,
    publishedAt: '2026-02-14',
    lyrics: [
      '[00:10] [Engine starts]',
      '[00:30] Full throttle into the glowing grid...',
      '[00:55] Cyber dreams under neon lids...',
      '[01:25] Chasing the chrome horizon...'
    ]
  },
  {
    id: 'sc-track-3',
    title: 'Midnight Arcade (Cassette Session)',
    artist: 'Lazerhawk',
    genre: 'Retrowave',
    artworkUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80',
    streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 302,
    liked: true,
    waveform: generateWaveform(60),
    soundcloudUrl: 'https://soundcloud.com/lazerhawk/midnight-arcade',
    downloadUrl: '#',
    playCount: 224601,
    publishedAt: '2025-11-05',
    lyrics: [
      '[00:08] Insertion: Quarter to start...',
      '[00:25] Retro cabinets glowing in the dark...',
      '[00:50] Virtual pixel hearts beating...',
      '[01:30] Level up, retro gaming machine...'
    ]
  },
  {
    id: 'sc-track-4',
    title: 'Rainy Alleyways',
    artist: 'Lofi City DJ',
    genre: 'Lo-Fi Chill',
    artworkUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=400&auto=format&fit=crop&q=80',
    streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 302,
    liked: false,
    waveform: generateWaveform(60),
    soundcloudUrl: 'https://soundcloud.com/lofi-city-dj/rainy-alleyways',
    downloadUrl: '#',
    playCount: 310550,
    publishedAt: '2026-03-01',
    lyrics: [
      '[00:01] [Rain patters against window pane]',
      '[00:15] Sipping coffee while the world is grey...',
      '[00:45] Lo-fi loops wash the pain away...',
      '[01:20] Watching streetlights flickering warm...'
    ]
  },
  {
    id: 'sc-track-5',
    title: 'Zero Gravity Voyage',
    artist: 'Space Cadet',
    genre: 'Ambient Cosmic',
    artworkUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80',
    streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    duration: 354,
    liked: true,
    waveform: generateWaveform(60),
    soundcloudUrl: 'https://soundcloud.com/spacecadet/zero-gravity',
    downloadUrl: '#',
    playCount: 45780,
    publishedAt: '2026-04-18',
    lyrics: [
      '[00:20] Orbit locked, rocket thrusters clear...',
      '[00:50] Floating quiet, Earth is nowhere near...',
      '[01:40] Inside the cosmic hum, we fade...'
    ]
  },
  {
    id: 'sc-track-6',
    title: 'Velocity Vector',
    artist: 'Subgrid [Liquid DnB]',
    genre: 'Liquid DnB',
    artworkUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
    streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    duration: 416,
    liked: false,
    waveform: generateWaveform(60),
    soundcloudUrl: 'https://soundcloud.com/subgrid/velocity-vector',
    downloadUrl: '#',
    playCount: 88540,
    publishedAt: '2026-05-02',
    lyrics: [
      '[00:10] High-speed drums kicking in step...',
      '[00:30] Sub-bass shaking the floor depth...',
      '[00:55] Liquid synths washing through the high...',
      '[01:20] Rushing past the grid elements...'
    ]
  }
];

const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-synth',
    name: 'Cyberpunk Outrun Oasis',
    description: 'High octane retro-futuristic synth lines to power through the neon grid.',
    artworkUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80',
    tracks: ['sc-track-1', 'sc-track-2', 'sc-track-3'],
    type: 'system',
    createdAt: '2026-05-10'
  },
  {
    id: 'pl-chill',
    name: 'Rainy Night Station',
    description: 'Deep ambient lofi and cosmic tunes for dreaming alongside open windows.',
    artworkUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=400&auto=format&fit=crop&q=80',
    tracks: ['sc-track-4', 'sc-track-5'],
    type: 'system',
    createdAt: '2026-05-15'
  }
];

interface EchoCloudState {
  // Navigation & View State
  activeTab: string;
  searchQuery: string;
  language: 'en' | 'ru';
  setLanguage: (lang: 'en' | 'ru') => void;
  activeArtistId: number | null;
  setActiveArtistId: (id: number | null) => void;
  activeAlbumId: string | null;
  setActiveAlbumId: (id: string | null) => void;

  // Music Player state
  tracks: Track[];
  playlists: Playlist[];
  currentTrackId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: 'none' | 'one' | 'all';
  queue: string[]; // Legacy/manual explicit queue
  historyQueue: string[]; // Past played IDs
  contextQueue: string[];    // Full track list from current browsing view (for auto-play)
  lockedQueue: string[];     // Snapshot of contextQueue at the moment playback started — used for next/prev
  manualQueueNext: string[]; // Tracks explicitly added via "Add to queue" — drain first

  // App Session state
  userSession: UserSession;
  interceptorLogs: InterceptorLog[];
  interceptorActive: boolean;

  // Interactive modes
  visualizerType: 'hologram' | 'nebula' | 'frequency';
  fullscreenMode: boolean;
  miniPlayerMode: boolean;
  sidebarCollapsed: boolean;
  appTheme: 'slate' | 'obsidian' | 'sunset' | 'forest';
  bgVideoUrl: string;
  bgImageUrl: string;

  // EQ state
  eqBands: number[];
  eqQ: number[];
  eqEnabled: boolean;
  setEqBands: (bands: number[]) => void;
  setEqQ: (q: number[]) => void;
  toggleEq: () => void;

  // Playback FX
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  reverbEnabled: boolean;
  reverbAmount: number;
  reverbSize: number;
  reverbDamp: number;
  toggleReverb: () => void;
  setReverbAmount: (amount: number) => void;
  setReverbSize: (size: number) => void;
  setReverbDamp: (damp: number) => void;

  // Downloads & Custom uploads states
  downloads: Array<{
    id: string;
    trackId: string;
    progress: number;
    status: 'downloading' | 'completed' | 'queued' | 'error';
    speed: string;
    filePath?: string;
  }>;

  // Actions
  setActiveTab: (tab: string) => void;
  setSearchQuery: (query: string) => void;
  playTrack: (trackId: string, opts?: { preserveLockedQueue?: boolean }) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setContextQueue: (ids: string[]) => void;
  addToManualQueue: (id: string) => void;
  removeFromManualQueueAt: (index: number) => void;
  toggleLikeTrack: (trackId: string) => void;
  setAppTheme: (theme: 'slate' | 'obsidian' | 'sunset' | 'forest') => void;
  setBgVideoUrl: (url: string) => void;
  setBgImageUrl: (url: string) => void;
  updateUserProfile: (profile: { username: string; avatarUrl: string; followersCount: number; scUserId?: number }) => void;
  setVisualizerType: (type: 'hologram' | 'nebula' | 'frequency') => void;
  setFullscreenMode: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Session & IPC System log triggers
  addInterceptorLog: (type: InterceptorLog['type'], method: InterceptorLog['method'], url: string, status: string, payload: string) => void;
  toggleInterceptor: () => void;
  clearInterceptorLogs: () => void;
  loginSession: (username: string, cookies?: string) => void;
  logoutSession: () => void;

  // Library updates
  addCustomUpload: (title: string, artist: string, genre: string, duration: number, audioUrl: string, artworkUrl: string) => void;
  addDownload: (trackId: string) => void;
  startDownload: (trackId: string) => string; // returns download id
  finishDownload: (id: string, filePath: string) => void;
  failDownload: (id: string) => void;
  removeDownload: (id: string) => void;
  addPlaylist: (name: string, description: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;

  // Real SC data loading
  homeSections: HomeSection[];
  addTracks: (incoming: Track[]) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  setHomeSections: (sections: HomeSection[]) => void;
  appendSectionTracks: (sectionId: string, tracks: Track[], nextHref?: string) => void;
}

export const useStore = create<EchoCloudState>((set, get) => ({
  activeTab: 'home',
  searchQuery: '',

  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
  activeArtistId: null,
  setActiveArtistId: (id) => set({ activeArtistId: id }),
  activeAlbumId: null,
  setActiveAlbumId: (id) => set({ activeAlbumId: id }),

  tracks: [],
  playlists: [],
  homeSections: [],
  currentTrackId: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  isShuffle: false,
  isRepeat: 'none',
  queue: [],
  historyQueue: [],
  contextQueue: [],
  lockedQueue: [],
  manualQueueNext: [],

  userSession: {
    isAuthenticated: false,
    username: 'Guest Explorer',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    clientId: 'sc_anon_' + Math.random().toString(36).substring(2, 10),
    oauthToken: null,
    subscriptionType: 'Free Tier',
    followersCount: 0,
    scUserId: null,
  },

  interceptorLogs: [
    {
      id: 'init-log-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'SESSION_TOKEN',
      method: 'CONNECT',
      url: 'wss://soundcloud.com/session-handshake',
      status: '200 OK',
      payload: 'IPC Tunnel established in background container. Awaiting SoundCloud OAuth/cookie interceptor stream.'
    }
  ],
  interceptorActive: true,

  visualizerType: 'hologram',
  fullscreenMode: false,
  miniPlayerMode: false,
  sidebarCollapsed: false,
  appTheme: 'slate',
  bgVideoUrl: '',
  bgImageUrl: '',
  eqBands: [0, 0, 0, 0, 0],
  eqQ: [1.0, 1.0, 1.0, 1.0, 1.0],
  eqEnabled: false,
  playbackRate: 1.0,
  reverbEnabled: false,
  reverbAmount: 0.5,
  reverbSize: 0.5,
  reverbDamp: 0.3,

  downloads: [],

  // Action implementations
  setActiveTab: (tab) => set({ activeTab: tab, activeArtistId: null, activeAlbumId: null }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setAppTheme: (theme) => set({ appTheme: theme }),
  setBgVideoUrl: (url) => set({ bgVideoUrl: url }),
  setBgImageUrl: (url) => set({ bgImageUrl: url }),
  updateUserProfile: (profile) => set((state) => ({
    userSession: { ...state.userSession, ...profile },
  })),
  setVisualizerType: (type) => set({ visualizerType: type }),
  setFullscreenMode: (open) => set({ fullscreenMode: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setEqBands: (bands) => set({ eqBands: bands }),
  setEqQ: (q) => set({ eqQ: q }),
  toggleEq: () => set((state) => ({ eqEnabled: !state.eqEnabled })),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  toggleReverb: () => set((state) => ({ reverbEnabled: !state.reverbEnabled })),
  setReverbAmount: (amount) => set({ reverbAmount: amount }),
  setReverbSize: (size) => set({ reverbSize: size }),
  setReverbDamp: (damp) => set({ reverbDamp: damp }),

  playTrack: async (trackId, opts) => {
    const { tracks, interceptorActive, addInterceptorLog } = get();
    const trackObj = tracks.find(t => t.id === trackId);
    if (!trackObj) return;

    const isSameTrack = trackId === get().currentTrackId;

    // Resolve real stream URL via Electron IPC
    // Always re-resolve for same-track replay (CDN URLs expire after ~30 min)
    if ((!trackObj.streamUrl || isSameTrack) && window.electronAPI) {
      // Clear cached URL so AudioPlayer detects the change and reloads
      if (isSameTrack && trackObj.streamUrl) {
        set((state) => ({
          tracks: state.tracks.map((t) => t.id === trackId ? { ...t, streamUrl: '' } : t),
        }));
      }

      const identifier =
        (trackObj as any).scTranscodingUrl ||
        (trackObj.scId ? String(trackObj.scId) : trackObj.soundcloudUrl) ||
        '';
      if (identifier) {
        try {
          const resolved = await window.electronAPI.getStreamUrl(identifier);
          if (resolved) {
            set((state) => ({
              tracks: state.tracks.map((t) =>
                t.id === trackId ? { ...t, streamUrl: resolved } : t
              ),
            }));
          }
        } catch (e) {
          console.error('[Store] Failed to resolve stream URL:', e);
        }
      }
    }

    if (interceptorActive) {
      const fresh = get().tracks.find(t => t.id === trackId);
      addInterceptorLog(
        'STREAM_EXTRACTION',
        'GET',
        `https://api-v2.soundcloud.com/tracks/${trackId}/streams`,
        '200 OK',
        JSON.stringify({
          original_url: trackObj.soundcloudUrl || 'N/A',
          resolved_stream: fresh?.streamUrl || 'pending',
          bitrate: '128 kbps MP3',
          codec: 'audio/mpeg'
        }, null, 2)
      );
    }

    set((state) => {
      let updatedQueue = [...state.queue];
      if (!updatedQueue.includes(trackId)) updatedQueue = [...updatedQueue, trackId];
      const snap = (opts?.preserveLockedQueue && state.lockedQueue.length > 0)
        ? state.lockedQueue
        : (state.contextQueue.length > 0 ? state.contextQueue : updatedQueue);
      return { currentTrackId: trackId, isPlaying: true, currentTime: 0, queue: updatedQueue, lockedQueue: snap };
    });
  },

  togglePlay: () => {
    const { currentTrackId, tracks, playTrack, isPlaying } = get();
    if (!currentTrackId) {
      // Play first track in library
      if (tracks.length > 0) {
        playTrack(tracks[0].id);
      }
      return;
    }
    set({ isPlaying: !isPlaying });
  },

  setPlaying: (playing) => set({ isPlaying: playing }),

  nextTrack: () => {
    const { lockedQueue, contextQueue, manualQueueNext, currentTrackId, isShuffle, isRepeat, playTrack } = get();

    // Manual add-to-queue takes priority — drain one entry
    if (manualQueueNext.length > 0) {
      const [nextId, ...rest] = manualQueueNext;
      set({ manualQueueNext: rest });
      playTrack(nextId);
      return;
    }

    // Use lockedQueue (snapshot at play-start) so tab navigation doesn't hijack auto-play
    const src = lockedQueue.length > 0 ? lockedQueue : contextQueue.length > 0 ? contextQueue : get().queue;
    if (src.length === 0) return;
    if (!currentTrackId) { playTrack(src[0]); return; }
    if (isRepeat === 'one') { set({ currentTime: 0, isPlaying: true }); return; }

    const idx = src.indexOf(currentTrackId);
    let nextIdx: number;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * src.length);
    } else {
      nextIdx = (idx === -1 ? 0 : idx) + 1;
      if (nextIdx >= src.length) nextIdx = isRepeat === 'all' ? 0 : -1;
    }

    if (nextIdx !== -1) playTrack(src[nextIdx], { preserveLockedQueue: true });
    else set({ isPlaying: false });
  },

  prevTrack: () => {
    const { lockedQueue, contextQueue, currentTrackId, isShuffle, playTrack, currentTime } = get();

    // Restart if > 3s in
    if (currentTime > 3) { set({ currentTime: 0 }); return; }

    const src = lockedQueue.length > 0 ? lockedQueue : contextQueue.length > 0 ? contextQueue : get().queue;
    if (src.length === 0) return;
    if (!currentTrackId) { playTrack(src[0]); return; }

    const idx = src.indexOf(currentTrackId);
    let prevIdx: number;
    if (isShuffle) {
      prevIdx = Math.floor(Math.random() * src.length);
    } else {
      prevIdx = (idx === -1 ? 0 : idx) - 1;
      if (prevIdx < 0) prevIdx = src.length - 1;
    }

    playTrack(src[prevIdx], { preserveLockedQueue: true });
  },

  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setMuted: (muted) => set({ isMuted: muted }),
  setContextQueue: (ids) => set({ contextQueue: ids }),
  addToManualQueue: (id) => set((state) => ({ manualQueueNext: [...state.manualQueueNext, id] })),
  removeFromManualQueueAt: (index) => set((state) => ({
    manualQueueNext: state.manualQueueNext.filter((_, i) => i !== index),
  })),

  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),

  toggleRepeat: () => set((state) => {
    let nextRepeat: 'none' | 'one' | 'all' = 'none';
    if (state.isRepeat === 'none') nextRepeat = 'all';
    else if (state.isRepeat === 'all') nextRepeat = 'one';
    return { isRepeat: nextRepeat };
  }),

  toggleLikeTrack: (trackId) => {
    const track = get().tracks.find((t) => t.id === trackId);
    if (!track) return;

    const nowLiked = !track.liked;

    // Optimistic local update
    set((state) => ({
      tracks: state.tracks.map((t) => t.id === trackId ? { ...t, liked: nowLiked } : t),
    }));

    // Sync to SoundCloud if we have a numeric scId and Electron API
    if (track.scId && window.electronAPI) {
      const apiCall = nowLiked
        ? window.electronAPI.likeTrack(track.scId)
        : window.electronAPI.unlikeTrack(track.scId);

      apiCall.then((ok) => {
        if (!ok) {
          // Revert if SC rejected the request
          set((state) => ({
            tracks: state.tracks.map((t) => t.id === trackId ? { ...t, liked: !nowLiked } : t),
          }));
        }
      }).catch(() => {
        set((state) => ({
          tracks: state.tracks.map((t) => t.id === trackId ? { ...t, liked: !nowLiked } : t),
        }));
      });
    }
  },

  addInterceptorLog: (type, method, url, status, payload) => set((state) => {
    const log: InterceptorLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleTimeString(),
      type,
      method,
      url,
      status,
      payload
    };
    // Keep max 100 logs
    return { interceptorLogs: [log, ...state.interceptorLogs].slice(0, 100) };
  }),

  toggleInterceptor: () => set((state) => ({ interceptorActive: !state.interceptorActive })),
  clearInterceptorLogs: () => set({ interceptorLogs: [] }),

  loginSession: (username, cookies = '') => {
    const clientId = 'sc_client_' + Math.random().toString(36).substring(2, 12);
    // If cookies looks like a real OAuth token (passed from Electron login), use it directly
    const token = (cookies && cookies.length > 12 && !cookies.includes(' '))
      ? cookies
      : ('oauth_tkn_' + Math.random().toString(36).substring(2, 16));

    const { addInterceptorLog } = get();
    addInterceptorLog(
      'COOKIE_CAPTURE',
      'CONNECT',
      'https://soundcloud.com/login',
      '200 Authenticated',
      JSON.stringify({
        captured_session_cookies: cookies || 'Mocking secure HttpOnly SoundCloud cookies',
        extracted_client_id: clientId,
        oauth_token: token,
        ipc_intercept_mode: 'Electron defaultSession.webRequest.onBeforeSendHeaders'
      }, null, 2)
    );

    set({
      userSession: {
        isAuthenticated: true,
        username,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        clientId,
        oauthToken: token,
        subscriptionType: 'Pro Unlimited Wrapper Member',
        followersCount: 1420
      }
    });
  },

  logoutSession: () => {
    const { addInterceptorLog } = get();
    addInterceptorLog(
      'SESSION_TOKEN',
      'GET',
      'https://soundcloud.com/logout',
      '200 Logged Out',
      'Cleared Electron cache, session cookies, and persistent storage.'
    );

    // Clear Electron session cookie + token file
    if (typeof window !== 'undefined') {
      (window as any).electronAPI?.logout?.();
    }

    set({
      userSession: {
        isAuthenticated: false,
        username: 'Guest Explorer',
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
        clientId: 'sc_anon_' + Math.random().toString(36).substring(2, 10),
        oauthToken: null,
        subscriptionType: 'Free Tier',
        followersCount: 0,
        scUserId: null,
      },
      tracks: [],
    });
  },

  addCustomUpload: (title, artist, genre, duration, audioUrl, artworkUrl) => {
    const newTrack: Track = {
      id: 'upload-' + Date.now(),
      title,
      artist,
      genre,
      artworkUrl: artworkUrl || 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=400&auto=format&fit=crop&q=80',
      streamUrl: audioUrl,
      duration,
      liked: false,
      waveform: generateWaveform(60),
      playCount: 1,
      publishedAt: new Date().toISOString().split('T')[0],
      userUploaded: true,
      downloadUrl: audioUrl
    };

    const { addInterceptorLog } = get();
    addInterceptorLog(
      'API_REQUEST',
      'POST',
      'https://api-v2.soundcloud.com/uploads',
      '202 Accepted',
      JSON.stringify({
        local_ipc_path: '/tmp/music-upload-' + title.toLowerCase().replace(/\s+/g, '-'),
        payload_size: 'HQ MP3/WAV file',
        allocated_track_id: newTrack.id,
        parsed_metadata: { title, artist, genre, duration }
      }, null, 2)
    );

    set((state) => ({
      tracks: [newTrack, ...state.tracks],
      queue: [newTrack.id, ...state.queue]
    }));
  },

  startDownload: (trackId) => {
    const id = 'dl-' + Date.now();
    set((state) => ({
      downloads: [...state.downloads.filter(d => d.trackId !== trackId), {
        id,
        trackId,
        progress: 0,
        status: 'downloading' as const,
        speed: '…',
        filePath: undefined,
      }],
    }));
    return id;
  },

  finishDownload: (id, filePath) => {
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === id ? { ...d, status: 'completed' as const, progress: 100, speed: 'Done', filePath } : d
      ),
    }));
  },

  failDownload: (id) => {
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === id ? { ...d, status: 'error' as const, speed: 'Failed' } : d
      ),
    }));
  },

  removeDownload: (id) => {
    set((state) => ({ downloads: state.downloads.filter((d) => d.id !== id) }));
  },

  addDownload: (trackId) => {
    const { tracks, downloads, addInterceptorLog } = get();
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    if (downloads.some(d => d.trackId === trackId)) return; // Already exists

    const newDownload = {
      id: 'dl-' + Date.now(),
      trackId,
      progress: 0,
      status: 'downloading' as const,
      speed: '4.8 MB/s'
    };

    addInterceptorLog(
      'API_REQUEST',
      'GET',
      `https://api-v2.soundcloud.com/tracks/${trackId}/stream/hls`,
      '200 OK',
      `Simulated Electron Client download of track: "${track.title}" by ${track.artist}. Writing stream packets to user downloads folder.`
    );

    set((state) => ({
      downloads: [...state.downloads, newDownload]
    }));

    // Periodically update progress for realism in native desktop client
    const interval = setInterval(() => {
      set((state) => {
        const itemIdx = state.downloads.findIndex(d => d.trackId === trackId);
        if (itemIdx === -1) {
          clearInterval(interval);
          return {};
        }

        const updated = [...state.downloads];
        const item = updated[itemIdx];
        if (item.progress >= 100) {
          clearInterval(interval);
          item.progress = 100;
          item.status = 'completed';
          item.speed = 'Done';
        } else {
          item.progress = Math.min(100, item.progress + Math.floor(10 + Math.random() * 20));
        }

        return { downloads: updated };
      });
    }, 1200);
  },

  addPlaylist: (name, description) => {
    const newPlaylist: Playlist = {
      id: 'pl-user-' + Date.now(),
      name,
      description,
      artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
      tracks: [],
      type: 'user',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const { addInterceptorLog } = get();
    addInterceptorLog(
      'API_REQUEST',
      'POST',
      'https://api-v2.soundcloud.com/playlists/create',
      '201 Created',
      JSON.stringify(newPlaylist, null, 2)
    );

    set((state) => ({
      playlists: [...state.playlists, newPlaylist]
    }));
  },

  addTracks: (incoming) => set((state) => {
    const byId = new Map(state.tracks.map((t) => [t.id, t]));
    for (const t of incoming) {
      const existing = byId.get(t.id);
      if (existing) {
        byId.set(t.id, {
          ...existing,
          liked: existing.liked || t.liked || false,
          scTranscodingUrl: existing.scTranscodingUrl || (t as any).scTranscodingUrl || '',
          streamUrl: existing.streamUrl || t.streamUrl || '',
          // Prefer incoming description (it's fresher from the API)
          description: (t as any).description || (existing as any).description || '',
          likesCount: (t as any).likesCount ?? (existing as any).likesCount ?? 0,
        } as any);
      } else {
        byId.set(t.id, t);
      }
    }
    return { tracks: Array.from(byId.values()) };
  }),

  setPlaylists: (playlists) => set({ playlists }),

  setHomeSections: (sections) => set((state) => {
    const byId = new Map(state.tracks.map((t) => [t.id, t]));
    for (const sec of sections) {
      for (const t of sec.tracks) {
        if ((t as any)._sectionKind === 'playlist') continue;
        const existing = byId.get(t.id);
        if (!existing) {
          byId.set(t.id, t);
        } else {
          byId.set(t.id, {
            ...existing,
            scTranscodingUrl: existing.scTranscodingUrl || (t as any).scTranscodingUrl || '',
            description: (t as any).description || (existing as any).description || '',
          } as any);
        }
      }
    }
    return { homeSections: sections, tracks: Array.from(byId.values()) };
  }),

  appendSectionTracks: (sectionId, newTracks, nextHref) => set((state) => {
    const byId = new Map(state.tracks.map((t) => [t.id, t]));
    for (const t of newTracks) {
      if (!byId.has(t.id)) byId.set(t.id, t);
    }
    const homeSections = state.homeSections.map((sec) =>
      sec.id === sectionId
        ? { ...sec, tracks: [...sec.tracks, ...newTracks], nextHref }
        : sec
    );
    return { homeSections, tracks: Array.from(byId.values()) };
  }),

  addTrackToPlaylist: (playlistId, trackId) => set((state) => {
    const { addInterceptorLog } = state;
    const updatedPlaylists = state.playlists.map((pl) => {
      if (pl.id === playlistId) {
        if (pl.tracks.includes(trackId)) return pl;

        addInterceptorLog(
          'API_REQUEST',
          'PUT',
          `https://api-v2.soundcloud.com/playlists/${playlistId}/add_track`,
          '200 OK',
          `Added trackID "${trackId}" to playlistID "${playlistId}"`
        );

        return { ...pl, tracks: [...pl.tracks, trackId] };
      }
      return pl;
    });
    return { playlists: updatedPlaylists };
  })
}));

// Auto-save relevant settings to disk on any change (debounced 500ms)
if (typeof window !== 'undefined') {
  let _saveTimer: ReturnType<typeof setTimeout> | null = null;
  useStore.subscribe((state) => {
    const api = (window as any).electronAPI;
    if (!api?.saveSettings) return;
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
      api.saveSettings({
        appTheme: state.appTheme,
        volume: state.volume,
        isMuted: state.isMuted,
        eqBands: state.eqBands,
        eqQ: state.eqQ,
        eqEnabled: state.eqEnabled,
        bgVideoUrl: state.bgVideoUrl,
        bgImageUrl: state.bgImageUrl,
        isShuffle: state.isShuffle,
        isRepeat: state.isRepeat,
        visualizerType: state.visualizerType,
        language: state.language,
      });
    }, 500);
  });
}

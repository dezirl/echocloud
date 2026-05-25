export interface ArtistProfile {
  scId: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  visualsUrl?: string;
  followersCount: number;
  trackCount: number;
  description?: string;
  city?: string;
  country?: string;
}

export interface Track {
  id: string;
  scId?: number;              // Original SoundCloud numeric ID
  artistId?: number;          // SC user ID of the artist (for profile navigation)
  scTranscodingUrl?: string;  // Pre-extracted transcoding URL — avoids extra API call on play
  title: string;
  artist: string;
  artworkUrl: string;
  streamUrl: string;
  duration: number; // in seconds
  genre: string;
  liked: boolean;
  waveform: number[];
  lyrics?: string[];
  soundcloudUrl?: string;
  userUploaded?: boolean;
  downloadUrl?: string;
  playCount: number;
  publishedAt: string;
}

export interface HomeSection {
  id: string;
  title: string;
  tracks: Track[];
  nextHref?: string;
}

// Global bridge injected by Electron preload via contextBridge
export interface ElectronAPI {
  search: (query: string) => Promise<{ tracks: Track[]; nextHref: string | null }>;
  searchMore: (nextHref: string) => Promise<{ tracks: Track[]; nextHref: string | null }>;
  searchUsers: (query: string) => Promise<ArtistProfile[]>;
  getStreamUrl: (trackIdOrUrl: string) => Promise<string>;
  getClientId: () => Promise<string>;
  login: () => Promise<{ username: string; token: string } | null>;
  openBrowserLogin: () => Promise<void>;
  validateToken: (token: string) => Promise<{ username: string; id: number } | null>;
  getUserPlaylists: () => Promise<{ playlists: Playlist[]; tracks: Track[] }>;
  getHomeSections: () => Promise<HomeSection[]>;
  getPlaylistById: (playlistId: string) => Promise<{ title: string; tracks: Track[] } | null>;
  loadMoreSection: (nextHref: string) => Promise<{ tracks: Track[]; nextHref?: string }>;
  loadMoreReposts: (nextHref: string) => Promise<{ tracks: Track[]; nextHref: string | null }>;
  getUser: () => Promise<any | null>;
  getLikedTracks: () => Promise<{ tracks: Track[]; nextHref: string | null }>;
  getLikedTracksMore: (nextHref: string) => Promise<{ tracks: Track[]; nextHref: string | null }>;
  getHomeFeed: () => Promise<Track[]>;
  logout: () => Promise<void>;
  checkAutoLogin: () => Promise<{ username: string; avatarUrl: string; followersCount: number; scUserId: number } | null>;
  getFollowers: (userId: number) => Promise<ArtistProfile[]>;
  likeTrack: (scId: number) => Promise<boolean>;
  unlikeTrack: (scId: number) => Promise<boolean>;
  resolveUrl: (url: string) => Promise<Track | null>;
  getArtistProfile: (userId: number) => Promise<ArtistProfile | null>;
  getArtistTracks: (userId: number) => Promise<{ tracks: Track[]; nextHref: string | null }>;
  getArtistLikes: (userId: number) => Promise<{ tracks: Track[]; nextHref: string | null }>;
  getArtistReposts: (userId: number) => Promise<{ tracks: Track[]; nextHref: string | null }>;
  getArtistAlbums: (userId: number) => Promise<Array<{ id: string; title: string; artworkUrl: string; trackCount: number; publishedAt: string; tracks: Track[] }>>;
  followArtist: (userId: number) => Promise<boolean>;
  unfollowArtist: (userId: number) => Promise<boolean>;
  isFollowingArtist: (userId: number) => Promise<boolean>;
  downloadTrack: (params: { trackId: string; scTranscodingUrl?: string; title: string; artist: string }) => Promise<{ success: boolean; path?: string; error?: string }>;
  deleteDownload: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  openDownloadsFolder: () => Promise<void>;
  onClientIdReady: (cb: (clientId: string) => void) => () => void;
  onAutoLogin: (cb: (user: { username: string; avatarUrl: string; followersCount: number }) => void) => () => void;
  saveSettings: (settings: Record<string, any>) => Promise<boolean>;
  loadSettings: () => Promise<Record<string, any> | null>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  setMiniMode: (active: boolean) => void;
  onUpdateAvailable: (cb: () => void) => () => void;
  onUpdateDownloaded: (cb: () => void) => () => void;
  installUpdate: () => void;
  platform: string;
  isElectron: true;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  artworkUrl: string;
  tracks: string[]; // Track IDs
  type: 'system' | 'user';
  createdAt: string;
}

export interface InterceptorLog {
  id: string;
  timestamp: string;
  type: 'API_REQUEST' | 'SESSION_TOKEN' | 'STREAM_EXTRACTION' | 'COOKIE_CAPTURE';
  method: 'GET' | 'POST' | 'CONNECT' | 'PUT' | 'DELETE';
  url: string;
  status: string;
  payload: string;
}

export interface UserSession {
  isAuthenticated: boolean;
  username: string;
  avatarUrl: string;
  clientId: string;
  oauthToken: string | null;
  subscriptionType: string;
  followersCount: number;
  scUserId?: number | null;
}

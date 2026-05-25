import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // ── SoundCloud ────────────────────────────────────────────────────────────
  search: (query: string) =>
    ipcRenderer.invoke('sc:search', query),
  searchMore: (nextHref: string) =>
    ipcRenderer.invoke('sc:searchMore', nextHref),
  searchUsers: (query: string) =>
    ipcRenderer.invoke('sc:searchUsers', query),
  getStreamUrl: (trackIdOrUrl: string) =>
    ipcRenderer.invoke('sc:getStream', trackIdOrUrl),
  getClientId: () =>
    ipcRenderer.invoke('sc:getClientId'),
  login: () =>
    ipcRenderer.invoke('sc:login'),
  openBrowserLogin: () =>
    ipcRenderer.invoke('sc:openBrowserLogin'),
  validateToken: (token: string) =>
    ipcRenderer.invoke('sc:validateToken', token),
  getUser: () =>
    ipcRenderer.invoke('sc:getUser'),
  getLikedTracks: () =>
    ipcRenderer.invoke('sc:getLikedTracks'),
  getLikedTracksMore: (nextHref: string) =>
    ipcRenderer.invoke('sc:getLikedTracksMore', nextHref),
  getHomeFeed: () =>
    ipcRenderer.invoke('sc:getHomeFeed'),
  resolveUrl: (url: string) =>
    ipcRenderer.invoke('sc:resolveUrl', url),
  getUserPlaylists: () =>
    ipcRenderer.invoke('sc:getUserPlaylists'),
  getHomeSections: () =>
    ipcRenderer.invoke('sc:getHomeSections'),
  getPlaylistById: (playlistId: string) =>
    ipcRenderer.invoke('sc:getPlaylistById', playlistId),
  loadMoreSection: (nextHref: string) =>
    ipcRenderer.invoke('sc:loadMoreSection', nextHref),
  loadMoreReposts: (nextHref: string) =>
    ipcRenderer.invoke('sc:loadMoreReposts', nextHref),
  likeTrack: (scId: number) =>
    ipcRenderer.invoke('sc:likeTrack', scId),
  unlikeTrack: (scId: number) =>
    ipcRenderer.invoke('sc:unlikeTrack', scId),
  getArtistProfile: (userId: number) =>
    ipcRenderer.invoke('sc:getArtistProfile', userId),
  getArtistTracks: (userId: number) =>
    ipcRenderer.invoke('sc:getArtistTracks', userId),
  getArtistLikes: (userId: number) =>
    ipcRenderer.invoke('sc:getArtistLikes', userId),
  getArtistReposts: (userId: number) =>
    ipcRenderer.invoke('sc:getArtistReposts', userId),
  followArtist: (userId: number) =>
    ipcRenderer.invoke('sc:followArtist', userId),
  unfollowArtist: (userId: number) =>
    ipcRenderer.invoke('sc:unfollowArtist', userId),
  isFollowingArtist: (userId: number) =>
    ipcRenderer.invoke('sc:isFollowingArtist', userId),
  getArtistAlbums: (userId: number) =>
    ipcRenderer.invoke('sc:getArtistAlbums', userId),
  getFollowers: (userId: number) =>
    ipcRenderer.invoke('sc:getFollowers', userId),
  loadMoreFollowers: (nextHref: string) =>
    ipcRenderer.invoke('sc:loadMoreFollowers', nextHref),
  logout: () =>
    ipcRenderer.invoke('sc:logout'),
  checkAutoLogin: () =>
    ipcRenderer.invoke('sc:checkAutoLogin'),
  downloadTrack: (params: { trackId: string; scTranscodingUrl?: string; title: string; artist: string }) =>
    ipcRenderer.invoke('sc:downloadTrack', params),
  deleteDownload: (filePath: string) =>
    ipcRenderer.invoke('sc:deleteDownload', filePath),
  openDownloadsFolder: () =>
    ipcRenderer.invoke('sc:openDownloadsFolder'),

  // ── Events from main process ───────────────────────────────────────────────
  onClientIdReady: (cb: (clientId: string) => void) => {
    ipcRenderer.on('sc:clientIdReady', (_, id) => cb(id));
    return () => ipcRenderer.removeAllListeners('sc:clientIdReady');
  },
  onAutoLogin: (cb: (user: { username: string; avatarUrl: string; followersCount: number }) => void) => {
    ipcRenderer.on('sc:autoLogin', (_, user) => cb(user));
    return () => ipcRenderer.removeAllListeners('sc:autoLogin');
  },

  // ── App settings persistence ───────────────────────────────────────────────
  saveSettings: (settings: Record<string, any>) =>
    ipcRenderer.invoke('app:saveSettings', settings),
  loadSettings: () =>
    ipcRenderer.invoke('app:loadSettings'),

  // ── Window controls ────────────────────────────────────────────────────────
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  setMiniMode: (active: boolean) => ipcRenderer.send('window:setMiniMode', active),
  onUpdateAvailable: (cb: () => void) => {
    ipcRenderer.on('update:available', cb);
    return () => ipcRenderer.removeAllListeners('update:available');
  },
  onUpdateDownloaded: (cb: () => void) => {
    ipcRenderer.on('update:downloaded', cb);
    return () => ipcRenderer.removeAllListeners('update:downloaded');
  },
  installUpdate: () => ipcRenderer.send('update:install'),

  platform: process.platform,
  isElectron: true as const,
});

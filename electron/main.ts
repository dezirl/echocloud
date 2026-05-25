import { app, BrowserWindow, ipcMain, shell, session, Menu } from 'electron';
import path from 'path';
import { mkdirSync, unlinkSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { autoUpdater } from 'electron-updater';

// Remove the native menu bar completely (prevents Alt/Shift+Alt from showing it)
Menu.setApplicationMenu(null);

const ICON_PATH = path.join(
  app.isPackaged ? process.resourcesPath : path.join(app.getAppPath()),
  'logo',
  'hf_20260523_235304_f40b7168-daaa-4d5b-b1e2-2cd603b30c7a.png',
);
import { SoundCloudService } from './soundcloud';

const isDev = !app.isPackaged;
const TOKEN_FILE = () => path.join(app.getPath('userData'), 'sc-token.json');

let mainWindow: BrowserWindow | null = null;
let scService: SoundCloudService;
let miniModeActive = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0c0c0c',
    title: 'EchoCloud',
    icon: existsSync(ICON_PATH) ? ICON_PATH : undefined,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: !isDev,
    },
  });

  if (isDev) {
    const loadVite = () => {
      mainWindow!.loadURL('http://localhost:5173').catch(() => {
        setTimeout(loadVite, 1000);
      });
    };
    loadVite();
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  scService = new SoundCloudService();  // session API available only after app ready

  // Open DataDome CAPTCHA in a visible window that shares persist:soundcloud cookies.
  // After the user solves it, the datadome cookie is set in the shared session and _mutate retries.
  scService.onCaptchaRequired = (captchaUrl: string): Promise<void> =>
    new Promise((resolve) => {
      const scSession = session.fromPartition('persist:soundcloud');
      const win = new BrowserWindow({
        width: 560,
        height: 720,
        title: 'Complete verification — EchoCloud',
        autoHideMenuBar: true,
        icon: existsSync(ICON_PATH) ? ICON_PATH : undefined,
        webPreferences: {
          session: scSession,
          contextIsolation: true,
          nodeIntegration: false,
        },
      });
      win.loadURL(captchaUrl);

      // When DataDome redirects away from captcha-delivery.com the challenge is solved.
      // Flush the cookie store first so the new datadome cookie is committed to disk
      // before _mutate reads it, then close the window after a short grace period.
      win.webContents.on('did-navigate', (_e, url) => {
        if (!url.includes('captcha-delivery.com')) {
          scSession.cookies.flushStore().finally(() => {
            setTimeout(() => { try { win.close(); } catch { /* ignore */ } }, 1500);
          });
        }
      });

      win.on('closed', () => resolve());
    });

  createWindow();

  // Check for updates after window is ready (only in production)
  if (app.isPackaged) {
    autoUpdater.checkForUpdates();

    autoUpdater.on('update-available', () => {
      mainWindow?.webContents.send('update:available');
    });

    autoUpdater.on('update-downloaded', () => {
      mainWindow?.webContents.send('update:downloaded');
    });
  }

  // Init SoundCloud service in background — notifies renderer when ready
  scService.init().then(async () => {
    if (!mainWindow) return;
    if (scService.clientId) {
      mainWindow.webContents.send('sc:clientIdReady', scService.clientId);
    }
    // Timing fix: clientId is captured before did-finish-load where cookies are read.
    // Explicitly refresh authToken from session cookies before the auto-login check.
    if (!scService.authToken) {
      await scService.refreshAuthToken();
    }
    // Fallback: restore token from file if cookie was cleared/lost
    if (!scService.authToken) {
      try {
        const saved = JSON.parse(readFileSync(TOKEN_FILE(), 'utf8'));
        if (saved?.token) await scService.setAuthToken(saved.token);
      } catch { /* no saved token */ }
    }
    // Auto-login: if session has oauth_token cookie, attempt to restore session
    if (scService.authToken) {
      try {
        const user = await scService.getUser();
        if (user && mainWindow) {
          // Persist token as fallback in case cookies are cleared between sessions
          try { writeFileSync(TOKEN_FILE(), JSON.stringify({ token: scService.authToken })); } catch { /* ignore */ }
          // Flush session cookies to disk so they survive hard restarts
          try { await session.fromPartition('persist:soundcloud').cookies.flushStore(); } catch { /* ignore */ }
          mainWindow.webContents.send('sc:autoLogin', {
            username: user.username,
            avatarUrl: (user.avatar_url || '').replace('-large', '-t200x200'),
            followersCount: user.followers_count || 0,
            scUserId: user.id || 0,
          });
        }
      } catch { /* non-fatal */ }
    }
  });

  // ── IPC handlers ──────────────────────────────────────────────────────────

  ipcMain.handle('sc:search', (_, query: string) =>
    scService.search(query));
  ipcMain.handle('sc:searchMore', (_, nextHref: string) =>
    scService.searchMore(nextHref));
  ipcMain.handle('sc:searchUsers', (_, query: string) =>
    scService.searchUsers(query));

  ipcMain.handle('sc:getStream', (_, trackIdOrUrl: string) =>
    scService.getStreamUrl(trackIdOrUrl));

  ipcMain.handle('sc:getClientId', () => scService.clientId);

  ipcMain.handle('sc:login', () => {
    if (!mainWindow) return null;
    return scService.openLoginWindow(mainWindow);
  });

  ipcMain.handle('sc:getUser', () => scService.getUser());

  ipcMain.handle('sc:getLikedTracks', () => scService.getLikedTracks());
  ipcMain.handle('sc:getLikedTracksMore', (_, nextHref: string) => scService.getLikedTracks(nextHref));

  ipcMain.handle('sc:getHomeFeed', () => scService.getHomeFeed());

  ipcMain.handle('sc:resolveUrl', (_, url: string) => scService.resolveUrl(url));

  ipcMain.handle('sc:getUserPlaylists', () => scService.getUserPlaylists());
  ipcMain.handle('sc:getHomeSections', () => scService.getHomeSections());

  ipcMain.handle('sc:likeTrack', (_, scId: number) => scService.likeTrack(scId));
  ipcMain.handle('sc:unlikeTrack', (_, scId: number) => scService.unlikeTrack(scId));
  ipcMain.handle('sc:getArtistProfile', (_, userId: number) => scService.getArtistProfile(userId));
  ipcMain.handle('sc:getArtistTracks', (_, userId: number) => scService.getArtistTracks(userId));
  ipcMain.handle('sc:getArtistLikes', (_, userId: number) => scService.getArtistLikes(userId));
  ipcMain.handle('sc:getArtistReposts', (_, userId: number) => scService.getArtistReposts(userId));
  ipcMain.handle('sc:followArtist', (_, userId: number) => scService.followArtist(userId));
  ipcMain.handle('sc:unfollowArtist', (_, userId: number) => scService.unfollowArtist(userId));
  ipcMain.handle('sc:isFollowingArtist', (_, userId: number) => scService.isFollowingArtist(userId));
  ipcMain.handle('sc:getArtistAlbums', (_, userId: number) => scService.getArtistAlbums(userId));
  ipcMain.handle('sc:getFollowers', (_, userId: number) => scService.getFollowers(userId));
  ipcMain.handle('sc:downloadTrack', async (_, { trackId, scTranscodingUrl, title, artist }: { trackId: string; scTranscodingUrl?: string; title: string; artist: string }) => {
    const input = scTranscodingUrl || trackId;
    const streamUrl = await scService.getStreamUrl(input);
    if (!streamUrl) return { success: false, error: 'Could not resolve stream URL' };
    const saveDir = app.isPackaged
      ? path.join(path.dirname(app.getPath('exe')), 'EchoCloud')
      : path.join(app.getAppPath(), 'EchoCloud');
    return scService.downloadTrack(streamUrl, title, artist, saveDir);
  });

  ipcMain.handle('sc:deleteDownload', (_, filePath: string) => {
    try {
      if (filePath && existsSync(filePath)) {
        unlinkSync(filePath);
        return { success: true };
      }
      return { success: false, error: 'File not found' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('sc:getPlaylistById', (_, playlistId: string) =>
    scService.getPlaylistById(playlistId));

  ipcMain.handle('sc:loadMoreSection', (_, nextHref: string) =>
    scService.loadMoreSection(nextHref));
  ipcMain.handle('sc:loadMoreReposts', (_, nextHref: string) =>
    scService.loadMoreReposts(nextHref));

  ipcMain.handle('sc:openDownloadsFolder', () => {
    const folder = app.isPackaged
      ? path.join(path.dirname(app.getPath('exe')), 'EchoCloud')
      : path.join(app.getAppPath(), 'EchoCloud');
    mkdirSync(folder, { recursive: true });
    shell.openPath(folder);
  });

  // Opens SoundCloud sign-in page in the user's default system browser
  ipcMain.handle('sc:openBrowserLogin', () => {
    shell.openExternal('https://soundcloud.com/signin');
  });

  // Validates a manually pasted oauth_token and returns user info if valid
  ipcMain.handle('sc:validateToken', async (_, token: string) => {
    await scService.setAuthToken(token.trim()); // sets cookie + authToken
    const user = await scService.getUser();
    if (!user) {
      await scService.setAuthToken(''); // reset if invalid
    } else {
      // Persist token and flush cookies so both survive hard restarts
      try { writeFileSync(TOKEN_FILE(), JSON.stringify({ token: token.trim() })); } catch { /* ignore */ }
      try { await session.fromPartition('persist:soundcloud').cookies.flushStore(); } catch { /* ignore */ }
    }
    return user;
  });

  // Clear session on logout
  ipcMain.handle('sc:logout', async () => {
    await scService.setAuthToken('');
    try { await session.fromPartition('persist:soundcloud').cookies.remove('https://soundcloud.com', 'oauth_token'); } catch { /* ignore */ }
    try { await session.fromPartition('persist:soundcloud').cookies.flushStore(); } catch { /* ignore */ }
    try { if (existsSync(TOKEN_FILE())) unlinkSync(TOKEN_FILE()); } catch { /* ignore */ }
    return true;
  });

  // Pull-based session check for BootScreen (works after logout+remount)
  ipcMain.handle('sc:checkAutoLogin', async () => {
    if (!scService.authToken) await scService.refreshAuthToken();
    if (!scService.authToken) {
      try {
        const saved = JSON.parse(readFileSync(TOKEN_FILE(), 'utf8'));
        if (saved?.token) await scService.setAuthToken(saved.token);
      } catch { /* no saved token */ }
    }
    if (!scService.authToken) return null;
    const user = await scService.getUser();
    if (!user) return null;
    // Keep TOKEN_FILE and cookies in sync so the next cold-start can restore the session
    try { writeFileSync(TOKEN_FILE(), JSON.stringify({ token: scService.authToken })); } catch { /* ignore */ }
    try { await session.fromPartition('persist:soundcloud').cookies.flushStore(); } catch { /* ignore */ }
    return {
      username: user.username,
      avatarUrl: (user.avatar_url || '').replace('-large', '-t200x200'),
      followersCount: user.followers_count || 0,
      scUserId: user.id || 0,
    };
  });

  // App settings persistence
  ipcMain.handle('app:saveSettings', (_, settings: Record<string, any>) => {
    try {
      const p = path.join(app.getPath('userData'), 'app-settings.json');
      writeFileSync(p, JSON.stringify(settings, null, 2));
      return true;
    } catch { return false; }
  });

  ipcMain.handle('app:loadSettings', () => {
    try {
      const p = path.join(app.getPath('userData'), 'app-settings.json');
      return JSON.parse(readFileSync(p, 'utf8'));
    } catch { return null; }
  });

  // Window controls
  ipcMain.on('update:install', () => autoUpdater.quitAndInstall());

  ipcMain.on('window:minimize', () => {
    // When mini player is active the window stays visible (not minimized)
    if (!miniModeActive) mainWindow?.minimize();
  });
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.restore();
    else mainWindow?.maximize();
  });
  ipcMain.on('window:close', () => mainWindow?.close());

  // Mini player mode — keep window always-on-top and block minimize
  ipcMain.on('window:setMiniMode', (_, active: boolean) => {
    miniModeActive = active;
    if (!mainWindow) return;
    if (active) {
      mainWindow.setAlwaysOnTop(true, 'floating');
      mainWindow.setMinimizable(false);
    } else {
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setMinimizable(true);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

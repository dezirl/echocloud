import { net, session, BrowserWindow } from 'electron';
import path from 'path';
import { mkdirSync, createWriteStream, unlinkSync } from 'fs';

const SC_API = 'https://api-v2.soundcloud.com';

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateWaveform(count: number): number[] {
  const wave: number[] = [];
  for (let i = 0; i < count; i++) {
    const v = Math.floor(15 + Math.sin(i * 0.2) * 35 + Math.sin(i * 0.5) * 20 + Math.random() * 15);
    wave.push(Math.max(5, Math.min(95, v)));
  }
  return wave;
}

/** Pick the highest quality transcoding URL from a track's media object.
 *  Priority: hq > progressive > hls ; mp3 preferred over other mimetypes. */
function pickTranscodingUrl(sc: any): string {
  const transcodings: any[] = sc?.media?.transcodings ?? [];
  if (transcodings.length === 0) return '';
  const sorted = [...transcodings].sort((a, b) => {
    let sa = 0, sb = 0;
    if (a.quality === 'hq') sa += 10;
    if (b.quality === 'hq') sb += 10;
    if (a.format?.protocol === 'progressive') sa += 4;
    if (b.format?.protocol === 'progressive') sb += 4;
    if (a.format?.mime_type === 'audio/mpeg') sa += 2;
    if (b.format?.mime_type === 'audio/mpeg') sb += 2;
    return sb - sa;
  });
  return sorted[0]?.url ?? '';
}

function normalizeTrack(sc: any) {
  return {
    id: String(sc.id),
    scId: sc.id as number,
    artistId: sc.user?.id as number,
    title: sc.title || 'Unknown Track',
    artist: sc.user?.username || 'Unknown Artist',
    genre: sc.genre || 'Unknown',
    artworkUrl: (sc.artwork_url || sc.user?.avatar_url || '').replace('-large', '-t500x500'),
    streamUrl: '',
    scTranscodingUrl: pickTranscodingUrl(sc),   // pre-extracted so play needs 1 call not 2
    duration: Math.floor((sc.duration || 0) / 1000),
    liked: sc.user_favorite || false,
    waveform: generateWaveform(60),
    description: sc.description || '',
    soundcloudUrl: sc.permalink_url || '',
    downloadUrl: sc.download_url || '#',
    playCount: sc.playback_count || 0,
    publishedAt: sc.created_at ? sc.created_at.split('T')[0] : '',
    lyrics: [] as string[],
  };
}

function normalizePlaylist(sc: any) {
  const trackList: any[] = sc.tracks ?? [];
  return {
    playlist: {
      id: String(sc.id),
      name: sc.title || 'Untitled Playlist',
      description: sc.description || '',
      artworkUrl: (sc.artwork_url || trackList[0]?.artwork_url || '')
        .replace('-large', '-t500x500'),
      tracks: trackList.map((t: any) => String(t.id)),
      type: 'user' as const,
      createdAt: sc.created_at ? sc.created_at.split('T')[0] : '',
    },
    tracks: trackList.map(normalizeTrack),
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

export class SoundCloudService {
  clientId = '';
  authToken = '';
  /** Set by main.ts — opens a captcha window and resolves when the user finishes. */
  onCaptchaRequired?: (url: string) => Promise<void>;
  private _userId = 0;
  private _scSession = session.fromPartition('persist:soundcloud');
  private _initPromise: Promise<void> | null = null;
  /** Hidden window used to make mutate requests through real Chromium TLS (bypasses DataDome JA3 checks). */
  private _workerWin: BrowserWindow | null = null;

  init(): Promise<void> {
    if (!this._initPromise) this._initPromise = this._extractClientId();
    return this._initPromise;
  }

  private _extractClientId(): Promise<void> {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };

      this._scSession.webRequest.onBeforeSendHeaders(
        { urls: ['https://api-v2.soundcloud.com/*', 'https://*.sndcdn.com/*'] },
        (details, callback) => {
          if (!this.clientId) {
            try {
              const cid = new URL(details.url).searchParams.get('client_id');
              if (cid && cid.length > 10) {
                this.clientId = cid;
                console.log('[SC] client_id captured');
                finish();
              }
            } catch { /* ignore */ }
          }
          callback({ requestHeaders: details.requestHeaders });
        },
      );

      const hidden = new BrowserWindow({
        show: false, width: 1, height: 1,
        webPreferences: { session: this._scSession, contextIsolation: true, nodeIntegration: false },
      });
      hidden.webContents.setAudioMuted(true);
      hidden.loadURL('https://soundcloud.com/discover').catch(() => {});

      hidden.webContents.on('did-finish-load', () => {
        this._scSession.cookies
          .get({ domain: '.soundcloud.com', name: 'oauth_token' })
          .then((cookies) => { if (cookies[0]) this.authToken = cookies[0].value; })
          .catch(() => {});
      });

      const sweep = setInterval(() => {
        if (this.clientId) { clearInterval(sweep); clearTimeout(giveUp); try { hidden.destroy(); } catch { /**/ } }
      }, 500);
      const giveUp = setTimeout(() => {
        clearInterval(sweep);
        try { hidden.destroy(); } catch { /**/ }
        if (!this.clientId) console.warn('[SC] Could not auto-capture client_id');
        finish();
      }, 25_000);
    });
  }

  // ── HTTP helpers ─────────────────────────────────────────────────────────────

  /** Try reading oauth_token from the persisted session cookies (fallback when authToken not yet set). */
  async refreshAuthToken(): Promise<void> {
    try {
      // Query by URL is more reliable than by domain string matching
      const byUrl = await this._scSession.cookies.get({ url: 'https://soundcloud.com', name: 'oauth_token' });
      if (byUrl[0]?.value) { this.authToken = byUrl[0].value; return; }
      // Fallback: search across all soundcloud domains
      const byDomain = await this._scSession.cookies.get({ name: 'oauth_token' });
      const sc = byDomain.find(c => c.domain?.includes('soundcloud'));
      if (sc?.value) this.authToken = sc.value;
    } catch { /* ignore */ }
  }

  /** Set auth token AND write it as a session cookie so net.request includes it automatically. */
  async setAuthToken(token: string): Promise<void> {
    this.authToken = token;
    if (!token) return;
    try {
      await this._scSession.cookies.set({
        url: 'https://soundcloud.com',
        name: 'oauth_token',
        value: token,
        domain: '.soundcloud.com',
        path: '/',
        secure: true,
        httpOnly: true,
        expirationDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // 1 year
      });
      // Force flush to disk so the cookie survives app restart
      await this._scSession.cookies.flushStore();
    } catch (e) {
      console.warn('[SC] Could not set oauth_token session cookie:', e);
    }
  }

  /**
   * Returns a hidden BrowserWindow loaded on soundcloud.com using the shared persist:soundcloud
   * session. Used to prime DataDome cookies — the JS challenge runs inside real Chromium so the
   * resulting datadome cookie is valid.
   */
  private _ensureWorkerWindow(): Promise<BrowserWindow> {
    if (this._workerWin && !this._workerWin.isDestroyed()) {
      return Promise.resolve(this._workerWin);
    }
    return new Promise((resolve) => {
      const win = new BrowserWindow({
        show: false, width: 1, height: 1,
        webPreferences: { session: this._scSession, contextIsolation: true, nodeIntegration: false },
      });
      win.webContents.setAudioMuted(true);
      win.loadURL('https://soundcloud.com');
      const done = () => { this._workerWin = win; resolve(win); };
      win.webContents.once('did-finish-load', done);
      win.webContents.once('did-fail-load', done);
    });
  }

  /** Build Cookie header from all session cookies for the target URL. */
  private async _buildCookieHeader(targetOrigin: string): Promise<string> {
    const [scCookies, apiCookies] = await Promise.all([
      this._scSession.cookies.get({ url: 'https://soundcloud.com' }),
      this._scSession.cookies.get({ url: targetOrigin }),
    ]);
    const map = new Map<string, string>();
    map.set('oauth_token', this.authToken);
    for (const c of [...scCookies, ...apiCookies]) map.set(c.name, c.value);
    console.log(`[SC cookies] ${Array.from(map.keys()).join(', ')} | datadome: ${map.has('datadome')}`);
    return Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  /**
   * PUT or DELETE.
   * Uses session.fetch (Chromium TLS/JA3).
   * session.fetch does NOT auto-send cookies — we read and attach them manually.
   * Worker window primes DataDome JS challenge so datadome cookie is present.
   */
  private async _mutate(method: 'PUT' | 'DELETE', endpoint: string, sendBody = true, _captchaRetried = false): Promise<number> {
    if (!this.clientId) throw new Error('No client_id');
    if (!this.authToken) await this.refreshAuthToken();
    if (!this.authToken) return 401;

    await this._ensureWorkerWindow();

    const url = new URL(`${SC_API}${endpoint}`);
    url.searchParams.set('client_id', this.clientId);
    const body = (method === 'PUT' && sendBody) ? '{}' : undefined;

    const cookieStr = await this._buildCookieHeader(url.origin);

    const headers: Record<string, string> = {
      Authorization: `OAuth ${this.authToken}`,
      Cookie: cookieStr,
      Accept: 'application/json, */*; q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      Origin: 'https://soundcloud.com',
      Referer: 'https://soundcloud.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
    };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const response = await this._scSession.fetch(url.toString(), {
      method,
      headers,
      ...(body !== undefined ? { body } : {}),
    });

    const text = await response.text();
    console.log(`[SC _mutate] ${method} ${endpoint} → ${response.status}`, text.slice(0, 300));

    if (response.status === 403 && this.onCaptchaRequired && !_captchaRetried) {
      try {
        const d = JSON.parse(text);
        if (d?.url?.includes('captcha-delivery.com')) {
          console.log('[SC] DataDome CAPTCHA required — opening solve window');
          await this.onCaptchaRequired(d.url);
          // Flush cookies and give session time to propagate before retrying.
          // _captchaRetried = true prevents any further captcha loops on this call.
          await this._scSession.cookies.flushStore();
          await new Promise((r) => setTimeout(r, 500));
          return this._mutate(method, endpoint, sendBody, true);
        }
      } catch { /* not JSON */ }
    }

    return response.status;
  }

  private _get(endpointOrUrl: string, params: Record<string, string> = {}): Promise<any> {
    if (!this.clientId) return Promise.reject(new Error('No client_id'));

    const urlObj = endpointOrUrl.startsWith('http')
      ? new URL(endpointOrUrl)
      : new URL(`${SC_API}${endpointOrUrl}`);

    urlObj.searchParams.set('client_id', this.clientId);
    for (const [k, v] of Object.entries(params)) urlObj.searchParams.set(k, v);

    return new Promise((resolve, reject) => {
      const req = net.request({ method: 'GET', url: urlObj.toString(), session: this._scSession });
      req.setHeader('Accept', 'application/json, */*; q=0.8');
      req.setHeader('Accept-Language', 'en-US,en;q=0.9');
      req.setHeader('Origin', 'https://soundcloud.com');
      req.setHeader('Referer', 'https://soundcloud.com/');
      req.setHeader('User-Agent',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36');
      if (this.authToken) req.setHeader('Authorization', `OAuth ${this.authToken}`);

      let body = '';
      req.on('response', (res) => {
        res.on('data', (c) => { body += c.toString(); });
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error(`JSON parse error [${res.statusCode}]: ${body.slice(0, 200)}`)); }
        });
        res.on('error', reject);
      });
      req.on('error', reject);
      req.end();
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async search(query: string): Promise<{ tracks: any[]; nextHref: string | null }> {
    try {
      const res = await this._get('/search/tracks', { q: query, limit: '24' });
      return { tracks: (res.collection ?? []).map(normalizeTrack), nextHref: res.next_href ?? null };
    } catch (e) {
      console.error('[SC search]', e);
      return { tracks: [], nextHref: null };
    }
  }

  async searchMore(nextHref: string): Promise<{ tracks: any[]; nextHref: string | null }> {
    try {
      const res = await this._get(nextHref);
      return { tracks: (res.collection ?? []).map(normalizeTrack), nextHref: res.next_href ?? null };
    } catch (e) {
      console.error('[SC searchMore]', e);
      return { tracks: [], nextHref: null };
    }
  }

  async searchUsers(query: string): Promise<any[]> {
    try {
      const res = await this._get('/search/users', { q: query, limit: '10' });
      return (res.collection ?? []).map((u: any) => ({
        scId: u.id as number,
        username: u.username || 'Unknown',
        displayName: u.full_name || u.username || 'Unknown',
        avatarUrl: (u.avatar_url || '').replace('-large', '-t200x200'),
        followersCount: u.followers_count || 0,
        trackCount: u.track_count || 0,
        city: u.city || '',
        country: u.country || '',
      }));
    } catch (e) {
      console.error('[SC searchUsers]', e);
      return [];
    }
  }

  async resolveUrl(url: string): Promise<any | null> {
    try {
      return normalizeTrack(await this._get('/resolve', { url }));
    } catch (e) {
      console.error('[SC resolve]', e);
      return null;
    }
  }

  /**
   * Resolves the actual CDN stream URL for a track.
   * Accepts:
   *  - A numeric track ID string (e.g. "123456789")
   *  - A full SoundCloud permalink URL
   *  - A pre-extracted transcoding URL (api-v2.soundcloud.com/media/...)
   */
  async getStreamUrl(input: string): Promise<string> {
    try {
      // Case 1: already a transcoding URL — just resolve it (1 call)
      if (input.includes('/media/') || input.includes('api-v2.soundcloud.com/media')) {
        const res = await this._get(input);
        return res.url ?? '';
      }

      // Case 2: permalink URL — resolve first
      let trackId = input;
      if (input.startsWith('http')) {
        const resolved = await this._get('/resolve', { url: input });
        trackId = String(resolved.id);
      }

      // Case 3: numeric ID — fetch track to get transcodings
      const track = await this._get(`/tracks/${trackId}`);
      const transcodingUrl = pickTranscodingUrl(track);
      if (!transcodingUrl) return '';

      const streamRes = await this._get(transcodingUrl);
      return streamRes.url ?? '';
    } catch (e) {
      console.error('[SC stream]', e);
      return '';
    }
  }

  async getHomeFeed(): Promise<any[]> {
    try {
      if (this.authToken) {
        const res = await this._get('/stream', { limit: '20' });
        return (res.collection ?? [])
          .filter((x: any) => x.type === 'track' || x.track)
          .map((x: any) => normalizeTrack(x.track ?? x));
      }
      const res = await this._get('/charts', {
        kind: 'trending',
        genre: 'soundcloud:genres:all-music',
        limit: '20',
      });
      return (res.collection ?? [])
        .filter((x: any) => x.track)
        .map((x: any) => normalizeTrack(x.track));
    } catch (e) {
      console.error('[SC home feed]', e);
      return [];
    }
  }

  async getLikedTracks(nextHref?: string): Promise<{ tracks: any[]; nextHref: string | null }> {
    try {
      if (!this.authToken) return { tracks: [], nextHref: null };
      let res: any;
      if (nextHref) {
        res = await this._get(nextHref);
      } else {
        const me = await this._get('/me');
        res = await this._get(`/users/${me.id}/track_likes`, { limit: '50' });
      }
      const tracks = (res.collection ?? []).map((x: any) => {
        const t = normalizeTrack(x.track ?? x);
        t.liked = true;
        return t;
      });
      return { tracks, nextHref: res.next_href ?? null };
    } catch (e) {
      console.error('[SC likes]', e);
      return { tracks: [], nextHref: null };
    }
  }

  async likeTrack(scId: number): Promise<boolean> {
    try {
      if (!this.authToken) await this.refreshAuthToken();
      if (!this.authToken) return false;
      if (!this._userId) { const u = await this.getUser(); if (!u) return false; }
      const status = await this._mutate('PUT', `/users/${this._userId}/track_likes/${scId}`);
      return status >= 200 && status < 300;
    } catch (e) {
      console.error('[SC like]', e);
      return false;
    }
  }

  async unlikeTrack(scId: number): Promise<boolean> {
    try {
      if (!this.authToken) await this.refreshAuthToken();
      if (!this.authToken) return false;
      if (!this._userId) { const u = await this.getUser(); if (!u) return false; }
      const status = await this._mutate('DELETE', `/users/${this._userId}/track_likes/${scId}`);
      return (status >= 200 && status < 300) || status === 404;
    } catch (e) {
      console.error('[SC unlike]', e);
      return false;
    }
  }

  async getArtistProfile(userId: number): Promise<any | null> {
    try {
      const u = await this._get(`/users/${userId}`);
      const visualsUrl = u.visuals?.visuals?.[0]?.visual_url || '';
      return {
        scId: u.id,
        username: u.username || 'Unknown',
        displayName: u.full_name || u.username || 'Unknown',
        avatarUrl: (u.avatar_url || '').replace('-large', '-t500x500'),
        visualsUrl: visualsUrl ? visualsUrl.replace('-original', '-t2480x520') : '',
        followersCount: u.followers_count || 0,
        trackCount: u.track_count || 0,
        description: u.description || '',
        city: u.city || '',
        country: u.country || '',
      };
    } catch (e) {
      console.error('[SC artist profile]', e);
      return null;
    }
  }

  async getFollowers(userId: number): Promise<any[]> {
    try {
      const res = await this._get(`/users/${userId}/followers`, { limit: '50' });
      return (res.collection ?? []).map((u: any) => ({
        scId: u.id as number,
        username: u.username || 'Unknown',
        displayName: u.full_name || u.username || 'Unknown',
        avatarUrl: (u.avatar_url || '').replace('-large', '-t200x200'),
        followersCount: u.followers_count || 0,
        trackCount: u.track_count || 0,
      }));
    } catch (e) {
      console.error('[SC followers]', e);
      return [];
    }
  }

  async getArtistTracks(userId: number): Promise<{ tracks: any[]; nextHref: string | null }> {
    try {
      const res = await this._get(`/users/${userId}/tracks`, { limit: '50', linked_partitioning: '1' });
      const tracks = (res.collection ?? (Array.isArray(res) ? res : [])).map(normalizeTrack);
      return { tracks, nextHref: res.next_href ?? null };
    } catch (e) {
      console.error('[SC artist tracks]', e);
      return { tracks: [], nextHref: null };
    }
  }

  async getArtistLikes(userId: number): Promise<{ tracks: any[]; nextHref: string | null }> {
    try {
      const res = await this._get(`/users/${userId}/track_likes`, { limit: '50', linked_partitioning: '1' });
      const tracks = (res.collection ?? []).map((x: any) => normalizeTrack(x.track ?? x));
      return { tracks, nextHref: res.next_href ?? null };
    } catch (e) {
      console.error('[SC artist likes]', e);
      return { tracks: [], nextHref: null };
    }
  }

  async followArtist(userId: number): Promise<boolean> {
    try {
      if (!this.authToken) await this.refreshAuthToken();
      if (!this.authToken) return false;
      if (!this._userId) await this.getUser();
      const status = await this._mutate('PUT', `/users/${this._userId}/followings/${userId}`, false);
      return status >= 200 && status < 300;
    } catch (e) { console.error('[SC follow]', e); return false; }
  }

  async unfollowArtist(userId: number): Promise<boolean> {
    try {
      if (!this.authToken) await this.refreshAuthToken();
      if (!this.authToken) return false;
      if (!this._userId) await this.getUser();
      const status = await this._mutate('DELETE', `/users/${this._userId}/followings/${userId}`, false);
      return (status >= 200 && status < 300) || status === 404;
    } catch (e) { console.error('[SC unfollow]', e); return false; }
  }

  async isFollowingArtist(userId: number): Promise<boolean> {
    try {
      if (!this.authToken) return false;
      if (!this._userId) await this.getUser();
      await this._get(`/users/${this._userId}/followings/${userId}`);
      return true;
    } catch { return false; }
  }

  // Fetch raw bytes from a URL using the SoundCloud session
  private _fetchBytes(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const req = net.request({ method: 'GET', url, session: this._scSession });
      req.setHeader('Referer', 'https://soundcloud.com/');
      req.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36');
      const chunks: Buffer[] = [];
      req.on('response', (res) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        res.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      });
      req.on('error', reject);
      req.end();
    });
  }

  // Download HLS stream: fetch manifest → download all .ts segments → concatenate
  private async _downloadHls(manifestUrl: string, filePath: string): Promise<{ success: boolean; path?: string; error?: string }> {
    const cleanup = () => { try { unlinkSync(filePath); } catch { /* ignore */ } };
    try {
      const manifestBuf = await this._fetchBytes(manifestUrl);
      const manifest = manifestBuf.toString('utf8');

      // Build base URL for relative segment paths
      const baseUrl = manifestUrl.split('?')[0].replace(/\/[^/]*$/, '/');

      const segments = manifest
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'))
        .map(l => (l.startsWith('http') ? l : baseUrl + l));

      if (segments.length === 0) return { success: false, error: 'No HLS segments found' };

      const ws = createWriteStream(filePath);
      ws.on('error', () => cleanup());

      for (const segUrl of segments) {
        const buf = await this._fetchBytes(segUrl).catch((e) => {
          throw new Error(`Segment failed: ${e.message}`);
        });
        await new Promise<void>((res, rej) => ws.write(buf, (err) => err ? rej(err) : res()));
      }

      await new Promise<void>((res, rej) => {
        ws.end((err?: Error | null) => err ? rej(err) : res());
      });
      return { success: true, path: filePath };
    } catch (e: any) {
      cleanup();
      return { success: false, error: e.message };
    }
  }

  // Download progressive (direct MP3) stream
  private _downloadProgressive(url: string, filePath: string): Promise<{ success: boolean; path?: string; error?: string }> {
    return new Promise((resolve) => {
      const ws = createWriteStream(filePath);
      const cleanup = () => { try { ws.destroy(); } catch { /* ignore */ } try { unlinkSync(filePath); } catch { /* ignore */ } };
      ws.on('error', (err: Error) => { cleanup(); resolve({ success: false, error: err.message }); });
      const req = net.request({ method: 'GET', url, session: this._scSession });
      req.setHeader('Referer', 'https://soundcloud.com/');
      req.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36');
      req.on('response', (res) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          cleanup();
          resolve({ success: false, error: `HTTP ${res.statusCode}` });
          return;
        }
        res.on('data', (chunk: Buffer) => ws.write(chunk));
        res.on('end', () => ws.end(() => resolve({ success: true, path: filePath })));
        res.on('error', (err: Error) => { cleanup(); resolve({ success: false, error: err.message }); });
      });
      req.on('error', (err: Error) => { cleanup(); resolve({ success: false, error: err.message }); });
      req.end();
    });
  }

  async downloadTrack(streamUrl: string, title: string, artist: string, saveDir: string): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      mkdirSync(saveDir, { recursive: true });
      // Strip trailing spaces/dots that are invalid on Windows
      const safeBase = `${artist} - ${title}`.replace(/[\\/:*?"<>|]/g, '_').replace(/[.\s]+$/, '');
      const isHls = streamUrl.includes('.m3u8');
      const filePath = path.join(saveDir, safeBase + '.mp3');
      return isHls ? this._downloadHls(streamUrl, filePath) : this._downloadProgressive(streamUrl, filePath);
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async getArtistReposts(userId: number): Promise<{ tracks: any[]; nextHref: string | null }> {
    for (const endpoint of [
      `/stream/users/${userId}?filter=reposts`,
      `/users/${userId}/reposts`,
    ]) {
      try {
        const res = await this._get(endpoint, { limit: '50', linked_partitioning: '1' });
        const tracks = (res.collection ?? [])
          .filter((x: any) => x.type === 'track-repost' || (x.track && x.type !== 'track'))
          .map((x: any) => normalizeTrack(x.track ?? x))
          .filter((t: any) => t.id && t.title);
        if (tracks.length > 0) return { tracks, nextHref: res.next_href ?? null };
      } catch { /* try next endpoint */ }
    }
    return { tracks: [], nextHref: null };
  }

  async getArtistAlbums(userId: number): Promise<any[]> {
    try {
      const allRaw: any[] = [];
      let res = await this._get(`/users/${userId}/albums`, { limit: '50', linked_partitioning: '1' });
      allRaw.push(...(res.collection ?? []));
      let pages = 0;
      while (res.next_href && pages < 20) {
        res = await this._get(res.next_href);
        allRaw.push(...(res.collection ?? []));
        pages++;
      }
      return await Promise.all(allRaw.map(async (pl: any) => {
        let tracks: any[] = (pl.tracks ?? []).map(normalizeTrack);
        // If album has no tracks (stub), fetch full playlist
        if (tracks.length === 0 && pl.id) {
          try {
            const full = await this._get(`/playlists/${pl.id}`, { representation: 'full' });
            tracks = (full.tracks ?? []).map(normalizeTrack);
          } catch { /* non-fatal */ }
        }
        return {
          id: String(pl.id),
          title: pl.title || 'Untitled Album',
          artworkUrl: (pl.artwork_url || pl.calculated_artwork_url || '').replace('-large', '-t500x500'),
          trackCount: pl.track_count || tracks.length,
          publishedAt: pl.release_date
            ? pl.release_date.substring(0, 4)
            : (pl.created_at ? pl.created_at.substring(0, 4) : ''),
          tracks,
        };
      }));
    } catch (e) {
      console.error('[SC artist albums]', e);
      return [];
    }
  }

  /** Returns user's playlists along with all tracks they contain. */
  async getUserPlaylists(): Promise<{ playlists: any[]; tracks: any[] }> {
    try {
      if (!this.authToken) return { playlists: [], tracks: [] };
      const me = await this._get('/me');
      const res = await this._get(`/users/${me.id}/playlists`, { limit: '50', representation: 'compact' });
      const raw: any[] = res.collection ?? [];

      const allTracks: any[] = [];
      const playlists: any[] = [];

      for (const pl of raw) {
        // Fetch full playlist to get track details
        try {
          const full = await this._get(`/playlists/${pl.id}`, { representation: 'full' });
          const normalized = normalizePlaylist(full);
          playlists.push(normalized.playlist);
          allTracks.push(...normalized.tracks);
        } catch {
          // If full fetch fails, use compact data
          const normalized = normalizePlaylist(pl);
          playlists.push(normalized.playlist);
        }
      }

      return { playlists, tracks: allTracks };
    } catch (e) {
      console.error('[SC playlists]', e);
      return { playlists: [], tracks: [] };
    }
  }

  /**
   * Returns structured home-page sections (feed, recommendations, recently played,
   * trending, etc.) — mirrors what soundcloud.com/discover shows.
   */
  async getHomeSections(): Promise<Array<{ id: string; title: string; tracks: any[]; nextHref?: string }>> {
    const sections: Array<{ id: string; title: string; tracks: any[]; nextHref?: string }> = [];

    // ── Personal feed (authenticated) ────────────────────────────────────────
    if (this.authToken) {
      try {
        const feed = await this._get('/stream', { limit: '20' });
        const tracks = (feed.collection ?? [])
          .filter((x: any) => x.type === 'track' || x.track)
          .map((x: any) => normalizeTrack(x.track ?? x))
          .slice(0, 20);
        if (tracks.length) sections.push({
          id: 'feed',
          title: 'Your Feed',
          tracks,
          nextHref: feed.next_href || undefined,
        });
      } catch { /* non-fatal */ }

      // Recently played
      try {
        const me = await this._get('/me');
        const recent = await this._get(
          `/recently-played/collection/tracks/soundcloud:users:${me.id}`,
          { limit: '12' },
        );
        const tracks = (recent.collection ?? []).map((x: any) => normalizeTrack(x.track ?? x)).slice(0, 12);
        if (tracks.length) sections.push({ id: 'recently-played', title: 'Recently Played', tracks });
      } catch { /* non-fatal */ }
    }

    // ── Mixed selections (recommendations, trending, etc.) ───────────────────
    try {
      const res = await this._get('/mixed-selections', { limit: '6' });
      for (const sel of (res.collection ?? []).slice(0, 8)) {
        const raw: any[] = sel.items?.collection ?? [];
        const items: any[] = raw
          .filter((x: any) => x?.id && x?.title)
          .map((x: any) => {
            // Playlist / album / system mix
            if (x.kind === 'playlist' || x.kind === 'album' || (x.track_count !== undefined && x.track_count !== null)) {
              return {
                id: String(x.id),
                title: x.title,
                artist: x.user?.username || '',
                artworkUrl: (x.artwork_url || x.calculated_artwork_url || x.user?.avatar_url || '').replace('-large', '-t500x500'),
                streamUrl: '', scTranscodingUrl: '', duration: 0, liked: false, waveform: [],
                _sectionKind: 'playlist',
                _trackCount: x.track_count || 0,
              };
            }
            // Individual track
            return { ...normalizeTrack(x), _sectionKind: 'track' };
          })
          .slice(0, 12);
        if (items.length) sections.push({ id: sel.id, title: sel.title, tracks: items });
      }
    } catch { /* non-fatal */ }

    // ── Trending fallback if nothing loaded ──────────────────────────────────
    if (sections.length === 0) {
      try {
        const res = await this._get('/charts', {
          kind: 'trending',
          genre: 'soundcloud:genres:all-music',
          limit: '20',
        });
        const tracks = (res.collection ?? [])
          .filter((x: any) => x.track)
          .map((x: any) => normalizeTrack(x.track));
        if (tracks.length) sections.push({ id: 'trending', title: 'Trending Music', tracks });
      } catch { /* ignore */ }
    }

    return sections;
  }

  async getPlaylistById(playlistId: string): Promise<{ title: string; tracks: any[] } | null> {
    try {
      const res = await this._get(`/playlists/${playlistId}`, { representation: 'full' });
      const tracks = (res.tracks ?? []).map(normalizeTrack);
      return { title: res.title || '', tracks };
    } catch {
      return null;
    }
  }

  async loadMoreSection(nextHref: string): Promise<{ tracks: any[]; nextHref?: string }> {
    try {
      const res = await this._get(nextHref);
      const items: any[] = res.collection ?? [];
      const tracks = items
        .filter((x: any) => x.type === 'track' || x.track || (x.id && x.title && x.user))
        .map((x: any) => normalizeTrack(x.track ?? x));
      return { tracks, nextHref: res.next_href || undefined };
    } catch {
      return { tracks: [] };
    }
  }

  async loadMoreReposts(nextHref: string): Promise<{ tracks: any[]; nextHref: string | null }> {
    try {
      const res = await this._get(nextHref);
      const tracks = (res.collection ?? [])
        .filter((x: any) => x.type === 'track-repost' || (x.track && x.type !== 'track'))
        .map((x: any) => normalizeTrack(x.track ?? x))
        .filter((t: any) => t.id && t.title);
      return { tracks, nextHref: res.next_href ?? null };
    } catch (e) {
      console.error('[SC loadMoreReposts]', e);
      return { tracks: [], nextHref: null };
    }
  }

  async getUser(): Promise<any | null> {
    try {
      if (!this.authToken) return null;
      const user = await this._get('/me');
      if (user?.id) this._userId = user.id;
      return user;
    } catch (e: any) {
      if (!String(e?.message).includes('401')) console.error('[SC user]', e);
      return null;
    }
  }

  openLoginWindow(parent: BrowserWindow): Promise<{ username: string; token: string } | null> {
    return new Promise((resolve) => {
      const win = new BrowserWindow({
        width: 560, height: 720, parent, modal: true,
        title: 'Sign in to SoundCloud', autoHideMenuBar: true,
        webPreferences: { session: this._scSession, contextIsolation: true, nodeIntegration: false },
      });
      win.loadURL('https://soundcloud.com/signin');

      const checkCookie = async () => {
        try {
          const cookies = await this._scSession.cookies.get({ domain: '.soundcloud.com', name: 'oauth_token' });
          if (cookies[0]) {
            this.authToken = cookies[0].value;
            const user = await this.getUser();
            win.close();
            resolve(user ? { username: user.username, token: this.authToken } : null);
          }
        } catch { /* ignore */ }
      };

      win.webContents.on('did-navigate', (_, url) => { if (!url.includes('/signin')) setTimeout(checkCookie, 1200); });
      win.webContents.on('did-finish-load', () => { if (!win.webContents.getURL().includes('/signin')) checkCookie(); });
      win.on('closed', () => resolve(null));
    });
  }
}

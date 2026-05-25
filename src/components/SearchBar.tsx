import React, { useState, useEffect, useRef } from 'react';
import { Search, LogOut, CheckCircle, Disc, Music, User } from 'lucide-react';
import { useStore } from '../store';

type Suggestion =
  | { kind: 'track'; id: string; title: string; artist: string; artworkUrl: string }
  | { kind: 'artist'; scId: number; username: string; displayName: string; avatarUrl: string };

export default function SearchBar() {
  const searchQuery = useStore((state) => state.searchQuery);
  const setSearchQuery = useStore((state) => state.setSearchQuery);
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const userSession = useStore((state) => state.userSession);
  const loginSession = useStore((state) => state.loginSession);
  const logoutSession = useStore((state) => state.logoutSession);
  const tracks = useStore((state) => state.tracks);
  const setActiveArtistId = useStore((state) => state.setActiveArtistId);
  const setActiveAlbumId = useStore((state) => state.setActiveAlbumId);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [cookieInput, setCookieInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build suggestions when query changes
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) { setSuggestions([]); return; }

    // Local track suggestions
    const seen = new Set<string>();
    const trackSuggs: Suggestion[] = [];
    for (const t of tracks) {
      if (trackSuggs.length >= 4) break;
      if (
        (t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)) &&
        !seen.has(t.id)
      ) {
        seen.add(t.id);
        trackSuggs.push({ kind: 'track', id: t.id, title: t.title, artist: t.artist, artworkUrl: t.artworkUrl });
      }
    }
    setSuggestions(trackSuggs);

    // Async artist suggestions
    if (!window.electronAPI) return;
    const timer = setTimeout(async () => {
      try {
        const artists = await window.electronAPI!.searchUsers(searchQuery.trim());
        setSuggestions((prev) => {
          const existingIds = new Set(prev.filter(s => s.kind === 'artist').map(s => (s as any).scId));
          const newArtists: Suggestion[] = artists
            .filter((a) => !existingIds.has(a.scId))
            .slice(0, 3)
            .map((a) => ({ kind: 'artist', scId: a.scId, username: a.username, displayName: a.displayName, avatarUrl: a.avatarUrl }));
          return [...prev.slice(0, 4), ...newArtists];
        });
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, tracks]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (activeTab !== 'search' && val.trim() !== '') setActiveTab('search');
    setShowSuggestions(true);
  };

  const handleFocus = () => {
    // Collapse artist / album overlays
    setActiveArtistId(null);
    setActiveAlbumId(null);
    if (searchQuery.trim().length >= 2) setShowSuggestions(true);
  };

  const handleSuggestionClick = (s: Suggestion) => {
    setShowSuggestions(false);
    if (s.kind === 'track') {
      setSearchQuery(s.title);
      setActiveTab('search');
    } else {
      setActiveArtistId(s.scId);
      setSearchQuery('');
    }
  };

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    loginSession(usernameInput.trim(), cookieInput.trim());
    setShowLoginModal(false);
    setUsernameInput('');
    setCookieInput('');
  };

  return (
    <div className="flex items-center justify-between h-16 px-6 border-b border-[#ffffff05] bg-neutral-950/20 backdrop-blur-md relative z-30 select-none">

      <div className="w-12 shrink-0" />

      {/* Search input + suggestions */}
      <div
        ref={containerRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm sm:max-w-md px-6 z-10"
      >
        <div className="relative group">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-accent transition-colors">
            <Search size={15} />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search stream, songs, artists, or genres..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleFocus}
            className="w-full h-9.5 pl-10 pr-4 bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.08] focus:border-accent/40 focus:bg-white/[0.05] focus:ring-1 focus:ring-accent/10 focus:outline-none rounded-xl text-[13px] text-zinc-100 placeholder-zinc-500/80 transition-all font-sans"
          />

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-neutral-950/95 border border-white/[0.07] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden z-50">
              {suggestions.map((s, i) =>
                s.kind === 'track' ? (
                  <button
                    key={`t-${s.id}`}
                    onMouseDown={() => handleSuggestionClick(s)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/[0.04] transition-colors text-left cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-neutral-800">
                      {s.artworkUrl && (
                        <img src={s.artworkUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{s.title}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{s.artist}</p>
                    </div>
                    <Music size={11} className="text-zinc-700 shrink-0" />
                  </button>
                ) : (
                  <button
                    key={`a-${s.scId}`}
                    onMouseDown={() => handleSuggestionClick(s)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/[0.04] transition-colors text-left cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-neutral-800 border border-white/10">
                      {s.avatarUrl && (
                        <img src={s.avatarUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{s.username}</p>
                      {s.displayName && s.displayName !== s.username && (
                        <p className="text-[10px] text-zinc-500 truncate">{s.displayName}</p>
                      )}
                    </div>
                    <User size={11} className="text-zinc-700 shrink-0" />
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Actions */}
      <div className="flex items-center gap-3 shrink-0 relative z-20">
        {userSession.isAuthenticated ? (
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline bg-gradient-to-r from-accent to-amber-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(255,107,0,0.3)]">PRO WRAPPER</span>
            <button
              onClick={logoutSession}
              title="Disconnect Stream Session"
              className="flex items-center gap-1.5 h-8.5 px-3 bg-[#ffffff04] hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-xs text-white hover:text-red-400 rounded-xl transition-all cursor-pointer"
            >
              <LogOut size={12} />
              <span className="hidden md:inline font-sans font-bold">Exit</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="h-8.5 px-3.5 bg-[#ffffff05] hover:bg-[#ffffff10] text-[#ffffffd0] hover:text-white border border-white/5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle size={12} className="text-accent" />
            <span className="font-sans">Sign In</span>
          </button>
        )}
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm liquid-glass rounded-2xl border border-white/10 p-6 flex flex-col relative focus:outline-none animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 border-b border-[#ffffff07] pb-4 mb-4">
              <Disc className="w-5 h-5 text-accent animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-sm font-bold tracking-tight">SoundCloud Session Interceptor</span>
            </div>
            <p className="text-xs text-zinc-400 mb-4.5 leading-relaxed">
              Log in to initiate <span className="font-mono text-zinc-200">Electron.webRequest</span> response scrapers. Extracts client headers safely to cache playlists instantly.
            </p>
            <form onSubmit={submitLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-400 tracking-wider">SOUNDCLOUD HANDLER NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CreatorName_HQ"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full h-9 px-3 bg-white/[0.04] border border-white/10 text-xs rounded-lg focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/15"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-400 tracking-wider flex items-center justify-between">
                  <span>COOKIES EXTRACTION (OPTIONAL)</span>
                  <span className="text-[8px] text-accent font-semibold bg-accent/10 px-1 rounded">DECODE IPC</span>
                </label>
                <input
                  type="password"
                  placeholder="Paste oauth_token or Cookie header"
                  value={cookieInput}
                  onChange={(e) => setCookieInput(e.target.value)}
                  className="w-full h-9 px-3 bg-white/[0.04] border border-white/10 text-xs rounded-lg focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/15"
                />
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-xs border border-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-accent hover:brightness-90 text-black text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Inject Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

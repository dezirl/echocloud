import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Music, MapPin, Disc, Play, Maximize2, TrendingUp, Repeat2, Heart, LayoutList, LayoutGrid, UserCheck, UserPlus, RefreshCw, Library, ChevronDown } from 'lucide-react';
import { Track } from '../types';
import { useStore } from '../store';
import { useT } from '../i18n';
import TrackCard from './TrackCard';

type ArtistTab = 'popular' | 'tracks' | 'albums' | 'liked' | 'reposts' | 'followers';
type ViewMode = 'list' | 'grid';

interface AlbumItem {
  id: string;
  title: string;
  artworkUrl: string;
  trackCount: number;
  publishedAt: string;
  tracks: Track[];
}

const TABS: { id: ArtistTab; label: string; icon: React.ReactElement }[] = [
  { id: 'popular',   label: 'Popular',   icon: <TrendingUp size={12} /> },
  { id: 'tracks',    label: 'Tracks',    icon: <Music size={12} /> },
  { id: 'albums',    label: 'Albums',    icon: <Library size={12} /> },
  { id: 'liked',     label: 'Liked',     icon: <Heart size={12} /> },
  { id: 'reposts',   label: 'Reposts',   icon: <Repeat2 size={12} /> },
  { id: 'followers', label: 'Followers', icon: <Users size={12} /> },
];

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TrackRow({ track, index }: { track: Track; index: number; key?: React.Key }) {
  const currentTrackId = useStore((s) => s.currentTrackId);
  const isPlaying = useStore((s) => s.isPlaying);
  const playTrack = useStore((s) => s.playTrack);
  const setFullscreenMode = useStore((s) => s.setFullscreenMode);
  const setActiveArtistId = useStore((s) => s.setActiveArtistId);
  const isCurrent = currentTrackId === track.id;

  return (
    <div
      onClick={() => playTrack(track.id)}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
        isCurrent
          ? 'bg-accent/[0.07] border border-accent/20'
          : 'border border-transparent hover:bg-white/[0.03] hover:border-white/[0.04]'
      }`}
    >
      <div className="w-6 flex items-center justify-center shrink-0">
        {isCurrent && isPlaying ? (
          <div className="flex items-end gap-[2px] h-3.5">
            <div className="w-[2px] h-full bg-accent rounded-full animate-[pulse_0.8s_infinite]" style={{ animationDelay: '0.1s' }} />
            <div className="w-[2px] h-[75%] bg-accent rounded-full animate-[pulse_0.6s_infinite]" style={{ animationDelay: '0.3s' }} />
            <div className="w-[2px] h-[50%] bg-accent rounded-full animate-[pulse_0.9s_infinite]" style={{ animationDelay: '0.2s' }} />
          </div>
        ) : (
          <span className={`text-xs font-mono ${isCurrent ? 'text-accent' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
            {index + 1}
          </span>
        )}
      </div>

      <div
        className="w-10 h-10 shrink-0 rounded-lg overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1a1a2e,#0f3460)' }}
      >
        {track.artworkUrl && (
          <img
            src={track.artworkUrl}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold truncate leading-tight ${isCurrent ? 'text-accent' : 'text-white'}`}>
          {track.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-[11px] text-zinc-500 truncate">
            {(track.playCount / 1000).toFixed(1)}k plays
          </p>
          {track.genre && <span className="text-[11px] text-zinc-600">·</span>}
          {track.genre && <p className="text-[11px] text-zinc-600 truncate">{track.genre}</p>}
        </div>
      </div>

      <span className="text-[11px] font-mono text-zinc-600 shrink-0 hidden sm:block tabular-nums">
        {fmt(track.duration)}
      </span>

      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); setFullscreenMode(true); playTrack(track.id); }}
          title="Play + visualizer"
          className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-all border border-white/[0.05]"
        >
          <Maximize2 size={12} />
        </button>
      </div>
    </div>
  );
}

function FollowerCard({ user, onClick }: { user: any; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group flex flex-col items-center gap-2.5 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl cursor-pointer hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200 hover:scale-[1.03]"
      style={{ willChange: 'transform' }}
    >
      <div
        className="w-16 h-16 shrink-0 rounded-full overflow-hidden border border-white/10 shadow-md"
        style={{ background: 'linear-gradient(135deg,#1a1a2e,#0f3460)' }}
      >
        {user.avatarUrl && (
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>
      <div className="flex flex-col items-center text-center min-w-0 w-full">
        <span className="text-[12px] font-bold text-white truncate w-full leading-tight">{user.username}</span>
        {user.followersCount != null && (
          <span className="text-[10px] font-mono text-zinc-500 mt-0.5 flex items-center gap-1">
            <Users size={8} className="text-accent" />
            {(user.followersCount).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

function AlbumCard({ album, onPlay }: { album: AlbumItem; onPlay: () => void }) {
  return (
    <div
      onClick={onPlay}
      className="group relative flex flex-col p-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl cursor-pointer hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200 hover:scale-[1.03]"
      style={{ willChange: 'transform' }}
    >
      <div
        className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 shadow-md"
        style={{ background: 'linear-gradient(135deg,#1a1a2e,#0f3460)' }}
      >
        {album.artworkUrl && (
          <img
            src={album.artworkUrl}
            alt={album.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-[0_4px_15px_rgba(255,107,0,0.4)]">
            <Play size={18} className="fill-white text-white" style={{ transform: 'translateX(1px)' }} />
          </div>
        </div>
        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-1">
          <Library size={8} className="text-accent" />
          <span className="text-[8px] font-mono tracking-wider uppercase text-white font-semibold">Album</span>
        </div>
      </div>
      <span className="text-[13px] font-semibold text-white truncate leading-tight">{album.title}</span>
      <div className="flex items-center gap-1.5 mt-0.5">
        {album.publishedAt && <span className="text-[10px] font-mono text-zinc-500">{album.publishedAt}</span>}
        {album.publishedAt && album.trackCount > 0 && <span className="text-zinc-700 text-[10px]">·</span>}
        {album.trackCount > 0 && <span className="text-[10px] font-mono text-zinc-500">{album.trackCount} tracks</span>}
      </div>
    </div>
  );
}

export default function ArtistPage({ artistId }: { artistId: number }) {
  const t = useT();
  const [profile, setProfile] = useState<any>(null);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [repostTracks, setRepostTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loaded, setLoaded] = useState<Set<ArtistTab>>(new Set());
  const [activeTab, setActiveTab] = useState<ArtistTab>('popular');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [tracksNextHref, setTracksNextHref] = useState<string | null>(null);
  const [likedNextHref, setLikedNextHref] = useState<string | null>(null);
  const [repostsNextHref, setRepostsNextHref] = useState<string | null>(null);
  const [followersNextHref, setFollowersNextHref] = useState<string | null>(null);

  const setActiveArtistId = useStore((s) => s.setActiveArtistId);
  const setActiveAlbumId = useStore((s) => s.setActiveAlbumId);
  const setContextQueue = useStore((s) => s.setContextQueue);
  const addTracks = useStore((s) => s.addTracks);
  const userSession = useStore((s) => s.userSession);
  const storeTracks = useStore((s) => s.tracks);

  // Keep likedTracks in sync with store liked state so changes are instant
  useEffect(() => {
    if (!loaded.has('liked')) return;
    setLikedTracks((prev) => {
      const storeById = new Map(storeTracks.map((t) => [t.id, t]));
      // Remove unliked tracks
      let next = prev.filter((t) => storeById.get(t.id)?.liked !== false);
      // Add newly liked tracks (from allTracks or repostTracks visible on this page)
      const prevIds = new Set(next.map((t) => t.id));
      for (const t of storeTracks) {
        if (t.liked && !prevIds.has(t.id)) {
          next = [t, ...next];
        }
      }
      return next;
    });
  }, [storeTracks]);

  // Initial load: profile + tracks + follow status
  useEffect(() => {
    setLoading(true);
    setProfile(null);
    setAllTracks([]);
    setLikedTracks([]);
    setRepostTracks([]);
    setAlbums([]);
    setFollowers([]);
    setIsFollowing(false);
    setTracksNextHref(null);
    setLikedNextHref(null);
    setRepostsNextHref(null);
    setFollowersNextHref(null);
    setLoaded(new Set(['popular', 'tracks'] as ArtistTab[]));
    setActiveTab('popular');
    if (!window.electronAPI) { setLoading(false); return; }

    Promise.allSettled([
      window.electronAPI.getArtistProfile(artistId),
      window.electronAPI.getArtistTracks(artistId),
      userSession.isAuthenticated ? window.electronAPI.isFollowingArtist(artistId) : Promise.resolve(false),
    ]).then(([profileRes, tracksRes, followRes]) => {
      if (profileRes.status === 'fulfilled' && profileRes.value) setProfile(profileRes.value);
      if (tracksRes.status === 'fulfilled' && tracksRes.value) {
        const { tracks, nextHref } = tracksRes.value;
        if (tracks?.length) { addTracks(tracks); setAllTracks(tracks); }
        setTracksNextHref(nextHref);
      }
      if (followRes.status === 'fulfilled') setIsFollowing(!!followRes.value);
      setLoading(false);
    });
  }, [artistId]);

  const refreshLiked = async () => {
    if (!window.electronAPI) return;
    setSectionLoading(true);
    try {
      const { tracks, nextHref } = await window.electronAPI.getArtistLikes(artistId);
      setLikedTracks(tracks?.length ? tracks : []);
      setLikedNextHref(nextHref);
      if (tracks?.length) addTracks(tracks);
    } finally {
      setSectionLoading(false);
    }
  };

  const handleTabSwitch = async (tab: ArtistTab) => {
    setActiveTab(tab);
    if ((loaded.has(tab) && tab !== 'liked') || !window.electronAPI) return;
    setSectionLoading(true);
    try {
      if (tab === 'liked') {
        const { tracks, nextHref } = await window.electronAPI.getArtistLikes(artistId);
        setLikedTracks(tracks?.length ? tracks : []);
        setLikedNextHref(nextHref);
        if (tracks?.length) addTracks(tracks);
      } else if (tab === 'reposts') {
        const { tracks, nextHref } = await window.electronAPI.getArtistReposts(artistId);
        if (tracks?.length) { addTracks(tracks); setRepostTracks(tracks); }
        setRepostsNextHref(nextHref);
      } else if (tab === 'albums') {
        const data = await window.electronAPI.getArtistAlbums(artistId);
        setAlbums(data ?? []);
        const albumTracks = (data ?? []).flatMap((a) => a.tracks);
        if (albumTracks.length) addTracks(albumTracks);
      } else if (tab === 'followers') {
        const data = await (window.electronAPI as any).getFollowers(artistId);
        setFollowers(data?.users ?? []);
        setFollowersNextHref(data?.nextHref ?? null);
      }
    } finally {
      setLoaded((prev) => new Set([...prev, tab]));
      setSectionLoading(false);
    }
  };

  const handleLoadMoreFollowers = async () => {
    if (!followersNextHref || loadingMore || !window.electronAPI) return;
    setLoadingMore(true);
    try {
      const result = await (window.electronAPI as any).loadMoreFollowers(followersNextHref);
      if (result?.users?.length) {
        setFollowers((prev) => [...prev, ...result.users]);
        setFollowersNextHref(result.nextHref ?? null);
      } else {
        setFollowersNextHref(null);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLoadMore = async (type: 'tracks' | 'liked' | 'reposts') => {
    const nextHref = type === 'tracks' ? tracksNextHref : type === 'liked' ? likedNextHref : repostsNextHref;
    if (!nextHref || loadingMore || !window.electronAPI) return;
    setLoadingMore(true);
    try {
      const result = type === 'reposts'
        ? await window.electronAPI.loadMoreReposts(nextHref)
        : await window.electronAPI.loadMoreSection(nextHref);
      if (result?.tracks?.length) {
        addTracks(result.tracks);
        const next = result.nextHref ?? null;
        if (type === 'tracks') {
          setAllTracks((prev) => [...prev, ...result.tracks]);
          setTracksNextHref(next);
        } else if (type === 'liked') {
          setLikedTracks((prev) => [...prev, ...result.tracks]);
          setLikedNextHref(next);
        } else {
          setRepostTracks((prev) => [...prev, ...result.tracks]);
          setRepostsNextHref(next);
        }
      } else {
        if (type === 'tracks') setTracksNextHref(null);
        else if (type === 'liked') setLikedNextHref(null);
        else setRepostsNextHref(null);
      }
    } catch (e) {
      console.warn('[ArtistPage] loadMore failed:', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!window.electronAPI || followLoading) return;
    setFollowLoading(true);
    try {
      const ok = isFollowing
        ? await window.electronAPI.unfollowArtist(artistId)
        : await window.electronAPI.followArtist(artistId);
      if (ok) setIsFollowing(!isFollowing);
    } catch {
      // state unchanged on error
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAlbumPlay = (album: AlbumItem) => {
    if (!album.tracks.length) return;
    // Register album as a playlist so AlbumView can render it
    useStore.setState((s) => {
      const existing = s.playlists.find((p) => p.id === album.id);
      const playlist = existing ?? {
        id: album.id,
        name: album.title,
        description: '',
        artworkUrl: album.artworkUrl,
        tracks: album.tracks.map((t) => t.id),
        type: 'user' as const,
        createdAt: album.publishedAt,
      };
      const byId = new Map(s.tracks.map((t) => [t.id, t]));
      for (const t of album.tracks) if (!byId.has(t.id)) byId.set(t.id, t);
      return {
        playlists: existing ? s.playlists : [...s.playlists, playlist],
        tracks: Array.from(byId.values()),
      };
    });
    setActiveAlbumId(album.id);
  };

  // Popular = sorted by playCount desc
  const popularTracks = [...allTracks]
    .sort((a, b) => (b.playCount || 0) - (a.playCount || 0));

  const currentTracks: Track[] =
    activeTab === 'popular' ? popularTracks :
    activeTab === 'tracks'  ? allTracks :
    activeTab === 'liked'   ? likedTracks :
    activeTab === 'reposts' ? repostTracks :
    []; // albums tab handled separately

  // Keep contextQueue in sync with the currently visible track list
  // Must be after currentTracks declaration to avoid temporal dead zone
  useEffect(() => {
    if (currentTracks.length > 0) setContextQueue(currentTracks.map((t) => t.id));
  }, [currentTracks]);

  const showGrid = viewMode === 'grid';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <button
        onClick={() => setActiveArtistId(null)}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Disc className="w-8 h-8 text-accent animate-spin" style={{ animationDuration: '2s' }} />
        </div>
      ) : (
        <>
          {/* Artist header */}
          {profile && (
            <div className="relative rounded-3xl overflow-hidden border border-white/[0.06]">
              {/* Banner image (visuals) or blurred avatar fallback */}
              <div className="relative w-full h-44 md:h-56 overflow-hidden">
                {profile.visualsUrl ? (
                  <img
                    src={profile.visualsUrl}
                    alt=""
                    aria-hidden
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    aria-hidden
                    className="w-full h-full object-cover scale-125 blur-2xl opacity-50"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-neutral-950/95" />
              </div>

              {/* Avatar + info overlapping the banner */}
              <div className="relative px-6 pb-6 md:px-8 -mt-12">
                <div className="flex items-end justify-between gap-4">
                  {/* Avatar */}
                  <div
                    className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-2xl border-2 border-white/25 shadow-2xl overflow-hidden ring-2 ring-neutral-950/80"
                    style={{ background: 'linear-gradient(135deg,#1a1a2e,#0f3460)' }}
                  >
                    {profile.avatarUrl && (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.username}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>

                  {/* Follow button */}
                  {userSession.isAuthenticated && artistId !== userSession.scUserId && (
                    <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 mb-1 ${
                        isFollowing
                          ? 'bg-white/[0.06] border-white/[0.1] text-zinc-300 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400'
                          : 'bg-accent/15 border-accent/30 text-accent hover:bg-accent hover:text-black'
                      } ${followLoading ? 'opacity-60' : ''}`}
                    >
                      {isFollowing ? <UserCheck size={13} /> : <UserPlus size={13} />}
                      {isFollowing ? t.common.unfollow : t.common.follow}
                    </button>
                  )}
                </div>

                {/* Name */}
                <div className="mt-3">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight text-white">
                    {profile.username}
                  </h1>
                  {profile.displayName && profile.displayName !== profile.username && (
                    <p className="text-xs font-mono text-zinc-500 mt-0.5">{profile.displayName}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                    <Users size={11} className="text-accent" />
                    {(profile.followersCount || 0).toLocaleString()} followers
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                    <Music size={11} className="text-accent" />
                    {(profile.trackCount || 0).toLocaleString()} tracks
                  </span>
                  {(profile.city || profile.country) && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                      <MapPin size={11} className="text-accent" />
                      {[profile.city, profile.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab bar + view toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.05] rounded-xl w-fit">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-accent text-black shadow-[0_2px_8px_rgba(255,107,0,0.25)]'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Refresh liked — only shown on liked tab */}
            {activeTab === 'liked' && (
              <button
                onClick={refreshLiked}
                disabled={sectionLoading}
                title="Refresh liked tracks"
                className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-all cursor-pointer disabled:opacity-40"
              >
                <RefreshCw size={14} className={sectionLoading ? 'animate-spin' : ''} />
              </button>
            )}

            {/* View mode toggle — hidden on albums/followers tabs (always grid) */}
            {activeTab !== 'albums' && activeTab !== 'followers' && (
              <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.05] rounded-xl">
                <button
                  onClick={() => setViewMode('list')}
                  title={t.common.viewList}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <LayoutList size={14} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  title={t.common.viewGrid}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          {sectionLoading ? (
            <div className="flex items-center justify-center py-20">
              <Disc className="w-6 h-6 text-accent animate-spin" style={{ animationDuration: '2s' }} />
            </div>
          ) : activeTab === 'albums' ? (
            albums.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-12">No albums found.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {albums.map((album) => (
                  <AlbumCard key={album.id} album={album} onPlay={() => handleAlbumPlay(album)} />
                ))}
              </div>
            )
          ) : activeTab === 'followers' ? (
            followers.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-12">No followers found.</p>
            ) : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
                  {followers.map((user) => (
                    <FollowerCard
                      key={user.id}
                      user={user}
                      onClick={() => setActiveArtistId(user.id)}
                    />
                  ))}
                </div>
                {followersNextHref && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={handleLoadMoreFollowers}
                      disabled={loadingMore}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] text-zinc-400 hover:text-white rounded-xl text-xs font-mono transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {loadingMore ? (
                        <><Disc size={12} className="animate-spin text-accent" style={{ animationDuration: '1.5s' }} /><span>LOADING...</span></>
                      ) : (
                        <><ChevronDown size={12} /><span>LOAD MORE</span></>
                      )}
                    </button>
                  </div>
                )}
              </>
            )
          ) : currentTracks.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-12">Nothing here yet.</p>
          ) : (
            <>
              {showGrid ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {currentTracks.map((track) => (
                    <TrackCard key={track.id} track={track} />
                  ))}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {currentTracks.map((track, i) => (
                    <TrackRow key={track.id} track={track} index={i} />
                  ))}
                </div>
              )}

              {/* Load More button */}
              {(() => {
                const type = activeTab === 'liked' ? 'liked' : activeTab === 'reposts' ? 'reposts' : 'tracks';
                const hasMore = type === 'liked' ? likedNextHref : type === 'reposts' ? repostsNextHref : tracksNextHref;
                if (!hasMore && !['popular', 'tracks', 'liked', 'reposts'].includes(activeTab)) return null;
                if (!hasMore) return null;
                return (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => handleLoadMore(type)}
                      disabled={loadingMore}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] text-zinc-400 hover:text-white rounded-xl text-xs font-mono transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {loadingMore ? (
                        <><Disc size={12} className="animate-spin text-accent" style={{ animationDuration: '1.5s' }} /><span>LOADING...</span></>
                      ) : (
                        <><ChevronDown size={12} /><span>LOAD MORE</span></>
                      )}
                    </button>
                  </div>
                );
              })()}
            </>
          )}
        </>
      )}
    </div>
  );
}

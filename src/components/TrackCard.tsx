import React, { memo } from 'react';
import { Play, Pause, Heart, Download, Plus, ArrowUpRight } from 'lucide-react';
import { Track } from '../types';
import { useStore } from '../store';

interface TrackCardProps {
  track: Track;
}

function TrackCard({ track }: TrackCardProps) {
  const currentTrackId = useStore((state) => state.currentTrackId);
  const isPlaying = useStore((state) => state.isPlaying);
  const playTrack = useStore((state) => state.playTrack);
  const togglePlay = useStore((state) => state.togglePlay);
  const toggleLikeTrack = useStore((state) => state.toggleLikeTrack);
  const addDownload = useStore((state) => state.addDownload);
  const addInterceptorLog = useStore((state) => state.addInterceptorLog);

  const isCurrent = currentTrackId === track.id;
  // Read liked state directly from store so it updates immediately on toggle
  const isLiked = useStore((s) => s.tracks.find((t) => t.id === track.id)?.liked ?? isLiked);
  const appTheme = useStore((state) => state.appTheme);
  const setFullscreenMode = useStore((state) => state.setFullscreenMode);
  const setActiveArtistId = useStore((state) => state.setActiveArtistId);
  const playIconClass = appTheme === 'obsidian' ? 'text-zinc-900' : 'text-white';

  const handlePlayClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track.id);
    }
  };

  const handleArtworkClick = () => {
    if (!isCurrent) {
      playTrack(track.id);
    }
    setFullscreenMode(true);
  };

  const addToManualQueue = useStore((state) => state.addToManualQueue);

  const handleQueueClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToManualQueue(track.id);
    addInterceptorLog(
      'API_REQUEST', 'PUT',
      'https://api-v2.soundcloud.com/me/playqueue/add',
      '202 Accepted',
      `Queued "${track.title}" (ID: ${track.id}) — plays after current track.`
    );
  };

  return (
    <div
      className={`group relative flex flex-col p-4 bg-white/[0.015] border rounded-2xl transition-all duration-200 hover:scale-[1.04] ${isCurrent ? 'border-accent/30 bg-accent/[0.02] shadow-[0_4px_30px_rgba(255,107,0,0.05)]' : 'border-[#ffffff07] hover:border-[#ffffff18] hover:bg-white/[0.035]'}`}
      style={{ willChange: 'transform' }}
    >
      {/* Cover Image Wrapper */}
      <div
        onClick={handleArtworkClick}
        className="relative aspect-square w-full rounded-xl overflow-hidden shadow-md cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
      >
        {track.artworkUrl && (
          <img
            src={track.artworkUrl}
            alt={track.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        {/* Hover / Play States overlays */}
        <div className={`absolute inset-0 bg-black/50 transition-all duration-300 flex items-center justify-center gap-3.5 ${isCurrent ? 'opacity-100 bg-black/45' : 'opacity-0 group-hover:opacity-100'}`}>
          {/* Heart Like */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleLikeTrack(track.id); }}
            className={`p-2 rounded-full bg-black/50 backdrop-blur-sm border cursor-pointer hover:scale-110 active:scale-95 transition-transform ${isLiked ? 'text-accent border-accent/50' : 'text-white border-white/25'}`}
          >
            <Heart size={16} className={isLiked ? 'fill-current' : ''} />
          </button>

          {/* Core play toggle */}
          <button
            onClick={handlePlayClick}
            className="w-11 h-11 shrink-0 rounded-full bg-accent hover:brightness-90 text-white flex items-center justify-center shadow-[0_4px_15px_rgba(255,107,0,0.35)] cursor-pointer hover:scale-110 active:scale-95 transition-transform"
          >
            {isCurrent && isPlaying ? (
              <Pause size={18} className={playIconClass} />
            ) : (
              <Play size={18} className={`fill-current ${playIconClass}`} />
            )}
          </button>

          {/* Add Queue */}
          <button
            onClick={handleQueueClick}
            title="Add to queue"
            className="p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/25 text-white cursor-pointer hover:scale-110 active:scale-95 transition-transform"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Dynamic Equalizer Lines Overlay when track is playing */}
        {isCurrent && isPlaying && (
          <div className="absolute top-3.5 right-3.5 flex items-end gap-[2px] h-4 px-2 py-1.5 bg-black/60 rounded-full backdrop-blur-md border border-accent/20">
            <div className="w-[2px] h-full bg-accent animate-[pulse_0.8s_infinite] origin-bottom rounded-full" style={{ animationDelay: '0.1s' }} />
            <div className="w-[2px] h-[75%] bg-accent animate-[pulse_0.6s_infinite] origin-bottom rounded-full" style={{ animationDelay: '0.3s' }} />
            <div className="w-[2px] h-[50%] bg-accent animate-[pulse_0.9s_infinite] origin-bottom rounded-full" style={{ animationDelay: '0.2s' }} />
          </div>
        )}

        {/* Liked badge — always visible when liked, hidden behind overlay buttons on hover */}
        {isLiked && (
          <div className="absolute bottom-3 right-3 pointer-events-none group-hover:opacity-0 transition-opacity duration-200">
            <Heart size={13} className="fill-accent text-accent drop-shadow-[0_0_4px_rgba(255,107,0,0.7)]" />
          </div>
        )}

        {/* Genre capsule pill label */}
        <div className="absolute top-3.5 left-3.5 pl-1.5 pr-2 py-0.5 bg-black/55 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-accent shadow-[0_0_4px_#ff6b00]" />
          <span className="text-[9px] font-mono tracking-wider uppercase text-white font-semibold">{track.genre}</span>
        </div>
      </div>

      {/* Track Details */}
      <div className="mt-3.5 flex flex-col min-w-0">
        <span 
          onClick={handleArtworkClick}
          className="text-[13.5px] font-semibold text-white group-hover:text-accent transition-colors truncate cursor-pointer"
        >
          {track.title}
        </span>
        
        <div className="flex items-center justify-between mt-1 gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); if (track.artistId) setActiveArtistId(track.artistId); }}
            className={`text-[11.5px] text-[#ffffff50] truncate font-sans font-medium text-left transition-colors ${track.artistId ? 'hover:text-accent cursor-pointer' : 'cursor-default'}`}
          >
            {track.artist}
          </button>
          <span className="text-[9.5px] font-mono text-[#ffffff30] tracking-wide shrink-0">
            {(track.playCount / 1000).toFixed(1)}k plays
          </span>
        </div>

        {/* Quick Action Bar beneath title on Hover to make it feel expensive */}
        <div className="flex items-center justify-between border-t border-[#ffffff05] mt-3 pt-2.5">
          <div className="flex items-center gap-2">
            {track.soundcloudUrl && (
              <a 
                href={track.soundcloudUrl} 
                target="_blank" 
                rel="noreferrer"
                title="View original on SoundCloud"
                onClick={(e) => {
                  e.stopPropagation();
                  addInterceptorLog('API_REQUEST', 'GET', track.soundcloudUrl || '', '302 Found', 'Rerouting user link to SoundCloud via Electron Shell module.');
                }}
                className="text-[#ffffff35] hover:text-accent transition-colors cursor-pointer"
              >
                <ArrowUpRight size={15} />
              </a>
            )}
            {track.userUploaded && (
              <span className="text-[9px] bg-accent/20 text-accent font-mono px-1.5 py-[1px] rounded uppercase font-semibold">User Uploaded</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); addDownload(track.id); }}
              title="Cache audio locally"
              className="p-1 px-2 flex items-center gap-1 text-[10px] text-[#ffffff40] hover:text-accent bg-[#ffffff03] border border-transparent hover:border-white/5 rounded-md transition-all cursor-pointer"
            >
              <Download size={12} />
              <span className="font-mono text-[9px] font-medium">Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(TrackCard);

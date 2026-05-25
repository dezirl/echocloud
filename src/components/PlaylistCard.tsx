import React from 'react';
import { motion } from 'motion/react';
import { Play, Music } from 'lucide-react';
import { Playlist } from '../types';
import { useStore } from '../store';

interface PlaylistCardProps {
  playlist: Playlist;
}

export default function PlaylistCard({ playlist }: PlaylistCardProps) {
  const playTrack = useStore((state) => state.playTrack);
  const setActiveAlbumId = useStore((state) => state.setActiveAlbumId);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0]);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={() => setActiveAlbumId(playlist.id)}
      className="group relative flex flex-col p-4 bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] rounded-2xl cursor-pointer transition-colors"
    >
      {/* Cover Image */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-900 shadow-lg">
        <img
          src={playlist.artworkUrl}
          alt={playlist.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        
        {/* Play overlay button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayClick}
            className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-[0_4px_15px_rgba(255,107,0,0.4)] cursor-pointer"
          >
            <Play size={20} className="fill-current" style={{ transform: 'translateX(1px)' }} />
          </motion.button>
        </div>

        {/* Floating track count badge */}
        <div className="absolute bottom-2.5 left-2.5 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-md flex items-center gap-1.5 text-[10px] text-white">
          <Music size={10} className="text-accent" />
          <span>{playlist.tracks.length} tracks</span>
        </div>
      </div>

      {/* Details */}
      <div className="mt-3.5 flex flex-col min-w-0">
        <span className="text-sm font-semibold tracking-tight text-white group-hover:text-accent transition-colors truncate">
          {playlist.name}
        </span>
        <span className="text-xs text-[#ffffff50] font-sans font-medium line-clamp-2 mt-1 leading-snug">
          {playlist.description}
        </span>
      </div>
    </motion.div>
  );
}

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, SkipForward, Maximize2 } from 'lucide-react';
import { useStore } from '../store';

export default function MiniPlayer() {
  const currentTrackId = useStore((state) => state.currentTrackId);
  const tracks = useStore((state) => state.tracks);
  const isPlaying = useStore((state) => state.isPlaying);
  const togglePlay = useStore((state) => state.togglePlay);
  const nextTrack = useStore((state) => state.nextTrack);
  const currentTime = useStore((state) => state.currentTime);
  const duration = useStore((state) => state.duration);
  const miniPlayerMode = useStore((state) => state.miniPlayerMode);

  // Keep window always-on-top and non-minimizable while mini player is active
  useEffect(() => {
    if (window.electronAPI?.setMiniMode) {
      window.electronAPI.setMiniMode(miniPlayerMode);
    }
  }, [miniPlayerMode]);

  if (!miniPlayerMode || !currentTrackId) return null;

  const activeTrack = tracks.find(t => t.id === currentTrackId);
  if (!activeTrack) return null;

  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleDisableMini = () => {
    useStore.setState({ miniPlayerMode: false });
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9, x: 80 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.85, x: 80 }}
      className="fixed bottom-24 right-6 z-50 w-64 p-3.5 liquid-glass rounded-2xl bg-black/85 border border-accent/25 shadow-[0_10px_50px_rgba(255,107,0,0.15)] cursor-move select-none"
    >
      <div className="flex items-center gap-3">
        {/* Rotating miniature disk artwork */}
        <div className="relative shrink-0 w-12 h-12 rounded-full overflow-hidden border border-accent/25 bg-black">
          <img
            src={activeTrack.artworkUrl}
            alt={activeTrack.title}
            className={`w-full h-full object-cover rounded-full ${isPlaying ? 'animate-spin' : ''}`}
            style={{ animationDuration: '6s' }}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/15 flex items-center justify-center">
            {/* Core center hole of disc */}
            <div className="w-3.5 h-3.5 rounded-full bg-neutral-900 border border-white/10" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-[11px] font-bold text-white truncate">{activeTrack.title}</h4>
          <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{activeTrack.artist}</p>
        </div>

        {/* Maximize back trigger */}
        <button
          onClick={handleDisableMini}
          title="Restore standard layout"
          className="p-1.5 text-zinc-400 hover:text-white bg-white/5 rounded-lg cursor-pointer transition-colors"
        >
          <Maximize2 size={11} />
        </button>
      </div>

      {/* Floating Controls Row */}
      <div className="flex items-center justify-between mt-3 px-1">
        {/* Progress percent stats */}
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500">
          <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-7 h-7 rounded-full bg-accent hover:brightness-90 text-white flex items-center justify-center shadow-md cursor-pointer transition-colors"
          >
            {isPlaying ? <Pause size={11} /> : <Play size={11} className="fill-current" style={{ transform: 'translateX(1px)' }} />}
          </button>
          <button
            onClick={nextTrack}
            className="p-1.5 text-zinc-400 hover:text-white cursor-pointer transition-colors"
          >
            <SkipForward size={12} />
          </button>
        </div>
      </div>

      {/* Mini Progress Line */}
      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-3">
        <div
          className="h-full bg-accent transition-all duration-100"
          style={{ width: `${percent}%` }}
        />
      </div>
    </motion.div>
  );
}

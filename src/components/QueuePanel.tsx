import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Hash, Disc, Trash2, ListMusic, ArrowRight } from 'lucide-react';
import { useStore } from '../store';

type QueuePanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function QueuePanel({ isOpen, onClose }: QueuePanelProps) {
  const currentTrackId = useStore((state) => state.currentTrackId);
  const tracks = useStore((state) => state.tracks);
  const isPlaying = useStore((state) => state.isPlaying);
  const manualQueueNext = useStore((state) => state.manualQueueNext);
  const contextQueue = useStore((state) => state.contextQueue);
  const playTrack = useStore((state) => state.playTrack);
  const removeFromManualQueueAt = useStore((state) => state.removeFromManualQueueAt);

  const activeTrack = tracks.find((t) => t.id === currentTrackId);

  // Manual queue — tracks explicitly added via "Add to queue"
  const manualTracks = manualQueueNext
    .map((id) => tracks.find((t) => t.id === id) ?? null);

  // Context queue — tracks after the current one in the active view
  const currentIdxInContext = contextQueue.indexOf(currentTrackId ?? '');
  const upcomingContext = currentIdxInContext >= 0
    ? contextQueue.slice(currentIdxInContext + 1, currentIdxInContext + 21)
    : contextQueue.slice(0, 20);
  const upcomingContextTracks = upcomingContext
    .map((id) => tracks.find((t) => t.id === id) ?? null);

  const totalQueued = manualTracks.length + upcomingContextTracks.filter(Boolean).length;

  const handleClearManual = () => {
    useStore.setState({ manualQueueNext: [] });
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40 cursor-default"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-80 md:w-96 bg-neutral-950/90 border-l border-white/[0.04] backdrop-blur-3xl z-50 flex flex-col pt-4 shadow-[-10px_0_40px_rgba(0,0,0,0.6)]"
          >
            {/* Header */}
            <div className="px-5 pb-4 border-b border-[#ffffff05] flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold text-accent tracking-widest uppercase flex items-center gap-1.5">
                  <Disc size={12} className="animate-spin text-accent" />
                  <span>PLAY QUEUE</span>
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                  {totalQueued} tracks ahead
                </span>
              </div>
              <div className="flex items-center gap-2">
                {manualTracks.length > 0 && (
                  <button
                    onClick={handleClearManual}
                    title="Clear manual queue"
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/[0.02] rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={13.5} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent hover:border-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto py-3 px-4 space-y-5 select-none">

              {/* Now Playing */}
              {activeTrack && (
                <div className="space-y-2">
                  <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-widest uppercase">NOW PLAYING</span>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-accent/[0.07] border border-accent/20">
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-neutral-900">
                      <img src={activeTrack.artworkUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      {isPlaying && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="flex gap-[2px] items-end h-3.5">
                            <span className="w-[2px] bg-accent rounded-full animate-[pulse_0.6s_infinite_alternate]" style={{ animationDelay: '0.1s', height: '100%' }} />
                            <span className="w-[2px] bg-accent rounded-full animate-[pulse_0.7s_infinite_alternate]" style={{ animationDelay: '0.3s', height: '75%' }} />
                            <span className="w-[2px] bg-accent rounded-full animate-[pulse_0.5s_infinite_alternate]" style={{ animationDelay: '0.5s', height: '55%' }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-accent truncate">{activeTrack.title}</p>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">{activeTrack.artist}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Queue — "Next Up" */}
              {manualTracks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-1">
                      <ArrowRight size={9} />
                      NEXT UP ({manualTracks.length})
                    </span>
                    <span className="text-[8px] font-mono text-zinc-600">MANUAL QUEUE</span>
                  </div>
                  <div className="space-y-1.5">
                    {manualTracks.map((tr, idx) => {
                      if (!tr) return null;
                      return (
                        <div
                          key={`manual-${idx}`}
                          className="group flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.03] hover:border-white/[0.07] cursor-pointer transition-all"
                          onClick={() => {
                            // Remove this and all before it from manual queue, then play
                            useStore.setState((s) => ({ manualQueueNext: s.manualQueueNext.slice(idx + 1) }));
                            playTrack(tr.id);
                          }}
                        >
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-neutral-900">
                            <img src={tr.artworkUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play size={10} className="text-white fill-current" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-white truncate leading-tight">{tr.title}</p>
                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{tr.artist}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeFromManualQueueAt(idx); }}
                            title="Remove from queue"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-600 hover:text-red-400 transition-all cursor-pointer shrink-0"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Context Queue — upcoming from current view */}
              {upcomingContextTracks.filter(Boolean).length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-widest uppercase flex items-center gap-1">
                    <ListMusic size={9} />
                    PLAYING NEXT ({upcomingContextTracks.filter(Boolean).length})
                  </span>
                  <div className="space-y-1.5">
                    {upcomingContextTracks.map((tr, idx) => {
                      if (!tr) return null;
                      return (
                        <div
                          key={`ctx-${tr.id}-${idx}`}
                          onClick={() => playTrack(tr.id)}
                          className="group flex items-center gap-3 p-2 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05] cursor-pointer transition-all"
                        >
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-neutral-900">
                            <img src={tr.artworkUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play size={10} className="text-white fill-current" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-zinc-300 group-hover:text-white truncate leading-tight transition-colors">{tr.title}</p>
                            <p className="text-[10px] text-zinc-600 truncate mt-0.5">{tr.artist}</p>
                          </div>
                          <span className="text-[9px] font-mono text-zinc-700 shrink-0">{tr.genre}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!activeTrack && manualTracks.length === 0 && upcomingContextTracks.filter(Boolean).length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-600">
                  <Hash size={18} className="mb-2" />
                  <span className="text-xs font-bold">Queue unoccupied</span>
                  <p className="text-[10px] max-w-[200px] mt-1 font-sans">
                    Play any track or add tracks via the + button on each card.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#ffffff05] bg-black/30 font-sans text-[10px] text-zinc-500 leading-normal">
              <span className="font-bold text-zinc-400 block mb-0.5">TIP</span>
              Click + on any track card to add it to the manual queue. Manual queue plays before the context list.
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

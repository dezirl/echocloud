import React, { useState, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Heart, Sliders, Maximize, Disc, Download } from 'lucide-react';
import { useStore } from '../store';
import QueuePanel from './QueuePanel';
import EQPanel, { THEME_ACCENT } from './EQPanel';

export default function BottomPlayer() {
  const currentTrackId = useStore((state) => state.currentTrackId);
  const tracks = useStore((state) => state.tracks);
  const isPlaying = useStore((state) => state.isPlaying);
  const currentTime = useStore((state) => state.currentTime);
  const duration = useStore((state) => state.duration);
  const volume = useStore((state) => state.volume);
  const isMuted = useStore((state) => state.isMuted);
  const isShuffle = useStore((state) => state.isShuffle);
  const isRepeat = useStore((state) => state.isRepeat);

  const togglePlay = useStore((state) => state.togglePlay);
  const nextTrack = useStore((state) => state.nextTrack);
  const prevTrack = useStore((state) => state.prevTrack);
  const setVolume = useStore((state) => state.setVolume);
  const setMuted = useStore((state) => state.setMuted);
  const toggleShuffle = useStore((state) => state.toggleShuffle);
  const toggleRepeat = useStore((state) => state.toggleRepeat);
  const toggleLikeTrack = useStore((state) => state.toggleLikeTrack);
  const setActiveArtistId = useStore((state) => state.setActiveArtistId);
  const startDownload = useStore((state) => state.startDownload);
  const finishDownload = useStore((state) => state.finishDownload);
  const failDownload = useStore((state) => state.failDownload);
  const downloads = useStore((state) => state.downloads);
  const appTheme = useStore((state) => state.appTheme);

  const [queueOpen, setQueueOpen] = useState(false);
  const [eqOpen, setEqOpen] = useState(false);
  const [volOpen, setVolOpen] = useState(false);
  const volCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volTrackRef = useRef<HTMLDivElement>(null);
  const volDragging = useRef(false);
  const fullscreenOpen = useStore((state) => state.fullscreenMode);
  const setFullscreenOpen = useStore((state) => state.setFullscreenMode);

  const accentColor = THEME_ACCENT[appTheme] ?? '#ff6b00';
  const playIconColor = appTheme === 'obsidian' ? 'text-zinc-900' : 'text-white';

  const activeTrack = tracks.find(t => t.id === currentTrackId);

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const targetSec = (val / 100) * duration;
    if ((window as any).__setAudioCurrentTime) {
      (window as any).__setAudioCurrentTime(targetSec);
    }
  };

  const isDownloading = activeTrack ? downloads.some(d => d.trackId === activeTrack.id && d.status === 'downloading') : false;
  const isDownloaded = activeTrack ? downloads.some(d => d.trackId === activeTrack.id && d.status === 'completed') : false;

  const handleDownload = async () => {
    if (!activeTrack || !window.electronAPI || isDownloading || isDownloaded) return;
    const dlId = startDownload(activeTrack.id);
    try {
      const result = await window.electronAPI.downloadTrack({
        trackId: activeTrack.id,
        scTranscodingUrl: (activeTrack as any).scTranscodingUrl,
        title: activeTrack.title,
        artist: activeTrack.artist,
      });
      if (result.success && result.path) {
        finishDownload(dlId, result.path);
      } else {
        failDownload(dlId);
        console.warn('[Download]', result.error);
      }
    } catch (e) {
      failDownload(dlId);
    }
  };

  return (
    <div className="h-[88px] border-t border-white/[0.07] bg-zinc-900/65 backdrop-blur-2xl px-6 relative z-40 select-none flex items-center justify-between">

      {/* Left Column: Track Info */}
      <div className="flex items-center gap-4 w-[30%] min-w-[220px] shrink-0">
        {activeTrack ? (
          <>
            <div
              onClick={() => setFullscreenOpen(true)}
              className="relative w-[60px] h-[60px] rounded-xl overflow-hidden group border border-[#ffffff0a] shrink-0 cursor-pointer shadow-lg bg-zinc-950"
            >
              <img
                src={activeTrack.artworkUrl}
                alt={activeTrack.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize size={15} className="text-white hover:scale-110 transition-transform" />
              </div>
            </div>

            <div className="flex flex-col min-w-0 flex-1 select-text">
              <span
                onClick={() => setFullscreenOpen(true)}
                className="text-[13.5px] font-bold text-white hover:text-accent transition-colors truncate cursor-pointer leading-tight"
              >
                {activeTrack.title}
              </span>
              <button
                onClick={() => { if ((activeTrack as any).artistId) setActiveArtistId((activeTrack as any).artistId); }}
                className="text-[11.5px] text-[#ffffff50] hover:text-accent truncate font-medium font-sans mt-0.5 text-left cursor-pointer transition-colors"
              >
                {activeTrack.artist}
              </button>
            </div>

            <button
              onClick={() => toggleLikeTrack(activeTrack.id)}
              className={`p-2 rounded-lg border border-transparent transition-colors hover:bg-white/[0.04] cursor-pointer ${activeTrack.liked ? 'text-accent' : 'text-[#ffffff40] hover:text-white'}`}
            >
              <Heart size={17} className={activeTrack.liked ? 'fill-current' : ''} />
            </button>
            {window.electronAPI && (
              <button
                onClick={handleDownload}
                title={isDownloaded ? 'Already downloaded' : 'Download track'}
                disabled={isDownloading || isDownloaded}
                className={`p-2 rounded-lg border border-transparent transition-colors cursor-pointer ${
                  isDownloaded ? 'text-emerald-400' :
                  isDownloading ? 'text-accent animate-pulse' :
                  'text-[#ffffff40] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Download size={17} />
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3 text-zinc-500 text-sm font-semibold">
            <Disc className="w-7 h-7 animate-pulse" />
            <span>Select a track to play</span>
          </div>
        )}
      </div>

      {/* Center Column: Controls + Slider */}
      <div className="flex-1 max-w-xl mx-4 flex flex-col items-center">
        {/* Play control row */}
        <div className="flex items-center gap-5">
          <button
            onClick={toggleShuffle}
            title="Shuffle"
            className={`p-2 transition-colors cursor-pointer ${isShuffle ? 'text-accent' : 'text-[#ffffff35] hover:text-[#ffffffe5]'}`}
          >
            <Shuffle size={16} />
          </button>

          <button
            onClick={prevTrack}
            className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <SkipBack size={19} />
          </button>

          <button
            onClick={togglePlay}
            className={`w-11 h-11 rounded-full bg-accent hover:brightness-90 flex items-center justify-center shadow-[0_4px_16px_rgba(255,107,0,0.3)] scale-100 hover:scale-105 active:scale-95 cursor-pointer transition ${playIconColor}`}
          >
            {isPlaying
              ? <Pause size={18} className={playIconColor} />
              : <Play size={18} className={`fill-current ${playIconColor}`} style={{ transform: 'translateX(1px)' }} />
            }
          </button>

          <button
            onClick={nextTrack}
            className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <SkipForward size={19} />
          </button>

          <button
            onClick={toggleRepeat}
            title={`Repeat: ${isRepeat}`}
            className={`p-2 relative transition-colors cursor-pointer ${isRepeat !== 'none' ? 'text-accent' : 'text-[#ffffff35] hover:text-[#ffffffe5]'}`}
          >
            <Repeat size={16} />
            {isRepeat === 'one' && (
              <span className="absolute -top-1 -right-1 text-[6.5px] font-mono font-bold bg-accent text-black w-3.5 h-3.5 rounded-full flex items-center justify-center">1</span>
            )}
          </button>
        </div>

        {/* Timeline slider */}
        <div className="w-full flex items-center gap-3.5 mt-2.5 font-mono text-[11px] text-zinc-500">
          <span className="w-8 text-right">{formatTime(currentTime)}</span>
          <div className="flex-1 relative group h-5 flex items-center cursor-pointer">
            {/* Track + fill */}
            <div className="absolute inset-x-0 h-[3px] group-hover:h-[5px] rounded-full overflow-hidden transition-all pointer-events-none" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-none" style={{ width: `${percent}%`, backgroundColor: accentColor }} />
            </div>
            {/* Thumb dot */}
            <div
              className="absolute w-3 h-3 rounded-full pointer-events-none shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${percent}% - 6px)`, backgroundColor: accentColor, boxShadow: `0 0 6px ${accentColor}80` }}
            />
            <input
              type="range"
              value={percent}
              onChange={handleSliderChange}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <span className="w-8 text-left">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right Column: Extras + Volume */}
      <div className="flex items-center gap-3 w-[30%] justify-end shrink-0 select-none">

        {/* EQ toggle */}
        <button
          onClick={() => setEqOpen(!eqOpen)}
          title="Equalizer"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${eqOpen ? 'text-accent bg-accent/10 border border-accent/10' : 'text-zinc-400 border border-transparent hover:text-white hover:bg-white/[0.04]'}`}
        >
          <span className="text-[15px] font-mono font-bold tracking-wider">EQ</span>
        </button>

        {/* Queue */}
        <button
          onClick={() => setQueueOpen(!queueOpen)}
          title="Open play queue"
          className={`p-2 rounded-lg cursor-pointer transition-colors ${queueOpen ? 'text-accent bg-accent/10 border border-accent/10' : 'text-zinc-400 border border-transparent hover:text-white hover:bg-white/[0.04]'}`}
        >
          <Sliders size={16} />
        </button>

        {/* Volume — vertical popup on hover */}
        <div
          className="relative"
          onMouseEnter={() => { if (volCloseTimer.current) clearTimeout(volCloseTimer.current); setVolOpen(true); }}
          onMouseLeave={() => { volCloseTimer.current = setTimeout(() => { if (!volDragging.current) setVolOpen(false); }, 220); }}
        >
          <button
            onClick={() => setMuted(!isMuted)}
            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            className="p-2 rounded-lg text-zinc-400 hover:text-white cursor-pointer transition-colors hover:bg-white/[0.04]"
          >
            {isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          {volOpen && (
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col items-center gap-1.5 bg-zinc-900/97 backdrop-blur-xl border border-white/[0.08] rounded-2xl pt-3 pb-3 px-3 shadow-[0_-8px_32px_rgba(0,0,0,0.7)]"
              style={{ zIndex: 60 }}
              onMouseEnter={() => { if (volCloseTimer.current) clearTimeout(volCloseTimer.current); }}
              onMouseLeave={() => { if (!volDragging.current) setVolOpen(false); }}
            >
              <span className="text-[10px] font-mono tabular-nums" style={{ color: accentColor }}>
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
              <div
                ref={volTrackRef}
                className="relative select-none cursor-pointer"
                style={{ width: 20, height: 120 }}
                onPointerDown={(e) => {
                  volDragging.current = true;
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  if (!volTrackRef.current) return;
                  const rect = volTrackRef.current.getBoundingClientRect();
                  const v = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
                  setVolume(v);
                  if (isMuted && v > 0) setMuted(false);
                }}
                onPointerMove={(e) => {
                  if (!volDragging.current || !volTrackRef.current) return;
                  const rect = volTrackRef.current.getBoundingClientRect();
                  const v = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
                  setVolume(v);
                  if (isMuted && v > 0) setMuted(false);
                }}
                onPointerUp={() => { volDragging.current = false; }}
                onPointerLeave={() => { volDragging.current = false; }}
              >
                {/* Groove */}
                <div className="absolute left-1/2 -translate-x-1/2 rounded-full" style={{ width: 4, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                {/* Fill */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 rounded-full"
                  style={{ width: 4, bottom: 0, height: `${(isMuted ? 0 : volume) * 100}%`, backgroundColor: accentColor }}
                />
                {/* Thumb dot */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 rounded-full"
                  style={{
                    width: 12, height: 12,
                    bottom: `calc(${(isMuted ? 0 : volume) * 100}% - 6px)`,
                    backgroundColor: accentColor,
                    boxShadow: `0 0 10px ${accentColor}80`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen */}
        <button
          onClick={() => setFullscreenOpen(true)}
          title="Launch hologram stage"
          className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-transform hover:scale-105 cursor-pointer"
        >
          <Maximize size={16} />
        </button>
      </div>

      {/* Panels */}
      <EQPanel isOpen={eqOpen} onClose={() => setEqOpen(false)} />
      <QueuePanel isOpen={queueOpen} onClose={() => setQueueOpen(false)} />
    </div>
  );
}

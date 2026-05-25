import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Minimize2, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Heart, Disc, Sparkles, Music, Settings, RotateCcw, Info, Clock, Headphones } from 'lucide-react';
import { useStore } from '../store';
import { HolographicBackground, type VizSettings } from './HolographicBackground';
import { THEME_ACCENT } from './EQPanel';

const VIZ_DEFAULTS: VizSettings = { intensity: 1.0, speed: 1.0, bg: 'none' };

// ─── Background effect components ───────────────────────────────────────────


function WavesBg({ accentColor }: { accentColor: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth ?? window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight ?? window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);
    const waves = [
      { amp: 55, freq: 0.007, spd: 0.018, yOff: 0.28, op: 0.13 },
      { amp: 75, freq: 0.005, spd: 0.012, yOff: 0.48, op: 0.10 },
      { amp: 50, freq: 0.009, spd: 0.024, yOff: 0.68, op: 0.09 },
      { amp: 35, freq: 0.011, spd: 0.03,  yOff: 0.38, op: 0.07 },
    ];
    let t = 0, animId: number;
    const draw = () => {
      animId = requestAnimationFrame(draw);
      t++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const w of waves) {
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 5) {
          const y = canvas.height * w.yOff + w.amp * Math.sin(x * w.freq + t * w.spd);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fillStyle = `rgba(${r},${g},${b},${w.op})`;
        ctx.fill();
      }
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, [accentColor]);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }} />;
}

function VizSliderRow({ label, value, min, max, step, onChange, accentColor, unit }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; accentColor: string; unit?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const display = Number.isInteger(step) ? Math.round(value).toString() : value.toFixed(1);
  return (
    <div className="flex items-center gap-3 mb-3 last:mb-0">
      <span className="text-[10px] font-mono text-zinc-400 w-16 shrink-0">{label}</span>
      <div className="relative flex-1 h-5 flex items-center cursor-pointer">
        <div className="absolute inset-x-0 h-[3px] rounded-full pointer-events-none" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accentColor }} />
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
      <span className="text-[10px] font-mono tabular-nums w-10 text-right shrink-0" style={{ color: accentColor }}>
        {display}{unit ?? ''}
      </span>
    </div>
  );
}

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LyricLine {
  time: number; // in seconds
  text: string;
}

export default function FullscreenPlayer({ isOpen, onClose }: FullscreenPlayerProps) {
  const currentTrackId = useStore((state) => state.currentTrackId);
  const tracks = useStore((state) => state.tracks);
  const isPlaying = useStore((state) => state.isPlaying);
  const currentTime = useStore((state) => state.currentTime);
  const duration = useStore((state) => state.duration);
  const volume = useStore((state) => state.volume);
  const isMuted = useStore((state) => state.isMuted);
  const isShuffle = useStore((state) => state.isShuffle);
  const isRepeat = useStore((state) => state.isRepeat);
  const appTheme = useStore((state) => state.appTheme);

  const togglePlay = useStore((state) => state.togglePlay);
  const nextTrack = useStore((state) => state.nextTrack);
  const prevTrack = useStore((state) => state.prevTrack);
  const setVolume = useStore((state) => state.setVolume);
  const setMuted = useStore((state) => state.setMuted);
  const toggleShuffle = useStore((state) => state.toggleShuffle);
  const toggleRepeat = useStore((state) => state.toggleRepeat);
  const toggleLikeTrack = useStore((state) => state.toggleLikeTrack);
  const setActiveArtistId = useStore((state) => state.setActiveArtistId);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const albumContainerRef = useRef<HTMLDivElement>(null);
  const discImgRef = useRef<HTMLImageElement>(null);
  // Artwork-derived colors for visualizer (R,G,B strings like "255,107,0")
  const artworkColorsRef = useRef<[string, string, string]>(['255,107,0', '200,60,200', '60,130,255']);

  // Visualizer settings — ref is read by canvas loop, state drives the UI
  const vizSettingsRef = useRef<VizSettings>({ ...VIZ_DEFAULTS });
  const [vizSettings, setVizSettings] = useState<VizSettings>({ ...VIZ_DEFAULTS });
  const [vizSettingsOpen, setVizSettingsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const fsVolRef = useRef<HTMLDivElement>(null);
  const fsVolDragging = useRef(false);

  const updateViz = (key: keyof VizSettings, value: number | string) => {
    vizSettingsRef.current = { ...vizSettingsRef.current, [key]: value } as VizSettings;
    setVizSettings(prev => ({ ...prev, [key]: value }) as VizSettings);
  };

  // Refs so animation loop always reads the latest state without re-creating the effect
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const activeTrack = tracks.find(t => t.id === currentTrackId);
  // obsidian theme has near-white accent (#f4f4f5) — dark icon needed for contrast
  const playIconClass = appTheme === 'obsidian' ? 'text-zinc-900' : 'text-white';
  const accentColor = THEME_ACCENT[appTheme] ?? '#ff6b00';

  // Parse custom timestamped lyrics if present
  const parsedLyrics = useMemo<LyricLine[]>(() => {
    if (!activeTrack || !activeTrack.lyrics) return [];
    
    return activeTrack.lyrics.map(line => {
      const match = line.match(/^\[(\d+):(\d+)\]\s*(.*)/);
      if (match) {
        const mins = parseInt(match[1]);
        const secs = parseInt(match[2]);
        return {
          time: mins * 60 + secs,
          text: match[3]
        };
      }
      return { time: 0, text: line };
    }).sort((a, b) => a.time - b.time);
  }, [activeTrack]);

  // Find active lyrics index
  const activeLyricIndex = useMemo(() => {
    if (parsedLyrics.length === 0) return -1;
    let index = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (currentTime >= parsedLyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [parsedLyrics, currentTime]);

  // Scroll active lyric into view spotlight center
  useEffect(() => {
    if (activeLyricIndex !== -1 && lyricsContainerRef.current) {
      const activeEl = lyricsContainerRef.current.children[activeLyricIndex] as HTMLElement;
      if (activeEl) {
        lyricsContainerRef.current.scrollTo({
          top: activeEl.offsetTop - lyricsContainerRef.current.clientHeight / 2 + activeEl.clientHeight / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [activeLyricIndex]);

  // Extract dominant colors from artwork and store in ref for the canvas loop
  useEffect(() => {
    if (!activeTrack?.artworkUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 40; c.height = 40;
        const ctx2 = c.getContext('2d');
        if (!ctx2) return;
        ctx2.drawImage(img, 0, 0, 40, 40);
        const data = ctx2.getImageData(0, 0, 40, 40).data;
        const sample = (x0: number, y0: number, w: number, h: number) => {
          let r = 0, g = 0, b = 0, n = 0;
          for (let px = x0; px < x0 + w; px += 2) {
            for (let py = y0; py < y0 + h; py += 2) {
              const i = (py * 40 + px) * 4;
              // Boost saturation: skip near-grey pixels
              const max = Math.max(data[i], data[i+1], data[i+2]);
              const min = Math.min(data[i], data[i+1], data[i+2]);
              if (max - min < 30) continue; // skip near-grey
              r += data[i]; g += data[i+1]; b += data[i+2]; n++;
            }
          }
          if (n === 0) { n = 1; r = 180; g = 80; b = 20; }
          return `${Math.round(r/n)},${Math.round(g/n)},${Math.round(b/n)}`;
        };
        artworkColorsRef.current = [
          sample(0, 0, 20, 20),
          sample(20, 0, 20, 20),
          sample(10, 20, 20, 20),
        ];
      } catch { /* CORS or canvas error — keep defaults */ }
    };
    img.onerror = () => {}; // silently ignore
    img.src = activeTrack.artworkUrl;
  }, [activeTrack?.artworkUrl]);

  // Responsive Canvas animation runner loop — depends only on isOpen, reads isPlayingRef live
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;
    // Disc inertia — 360° per 24s at 30fps ≈ 0.5°/frame
    const DISC_FULL_SPEED = 0.5;
    let discAngle = 0;
    let discSpeed = isPlayingRef.current ? DISC_FULL_SPEED : 0;
    // Smooth fade-out state
    let fadeMultiplier = isPlayingRef.current ? 1.0 : 0.0;
    let prevPlaying = isPlayingRef.current;
    let fadeStartMs: number | null = null;
    const FADE_MS = 1000;
    let lastRenderMs = 0;
    // Pre-allocated frequency buffer — reused each frame to avoid GC
    let freqArray: Uint8Array | null = null;
    // Low-pass filter for bass — used to isolate beat peaks from average level
    let smoothedBass = 0;
    // Disc pixel radius — updated on resize so the ring always hugs the disc edge
    let discPixelRadius = (albumContainerRef.current?.clientWidth ?? 288) / 2;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 500;
      canvas.height = canvas.parentElement?.clientHeight || 450;
      discPixelRadius = (albumContainerRef.current?.clientWidth ?? 288) / 2;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      animId = requestAnimationFrame(render);

      // Throttle to ~30fps — halves GPU load vs 60fps
      const nowMs = Date.now();
      if (nowMs - lastRenderMs < 33) return;
      lastRenderMs = nowMs;

      // Treat muted/silent as not playing so visualizer fades out
      const playing = isPlayingRef.current && !isMutedRef.current && volumeRef.current > 0;

      // Detect play→stop transition, start fade-out timer
      if (prevPlaying && !playing) fadeStartMs = nowMs;
      prevPlaying = playing;

      // Update fade multiplier
      if (playing) {
        fadeMultiplier = 1.0;
        fadeStartMs = null;
      } else if (fadeStartMs !== null) {
        fadeMultiplier = Math.max(0, 1.0 - (nowMs - fadeStartMs) / FADE_MS);
      } else {
        fadeMultiplier = 0.0;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const baseRadius = discPixelRadius;

      // Artwork-derived palette
      const [c1, c2, c3] = artworkColorsRef.current;

      let bassValue = 0;
      let midValue = 0;
      let trebleValue = 0;

      const analyser = (window as any).__echoAnalyser;
      // Reuse pre-allocated buffer — avoids GC churn on every frame
      if (analyser && (!freqArray || freqArray.length !== analyser.frequencyBinCount)) {
        freqArray = new Uint8Array(analyser.frequencyBinCount);
      }
      const cachedArray = (analyser && playing) ? freqArray : null;

      if (analyser && playing && cachedArray) {
        try {
          analyser.getByteFrequencyData(cachedArray);
          let bassSum = 0;
          for (let i = 0; i < 8; i++) bassSum += cachedArray[i];
          bassValue = (bassSum / 8) / 255;
          let midSum = 0;
          for (let i = 8; i < 24; i++) midSum += cachedArray[i];
          midValue = (midSum / 16) / 255;
          let trebleSum = 0;
          for (let i = 24; i < 64; i++) trebleSum += cachedArray[i];
          trebleValue = (trebleSum / 40) / 255;
        } catch (_e) {}
      }

      // Simulate when no real data (includes fade-out period so bars wind down smoothly)
      if (bassValue === 0 && (playing || fadeMultiplier > 0)) {
        const t = nowMs;
        const baseOsc = Math.sin(t * 0.007) * 0.5 + 0.5;
        const kickTrigger = (Math.sin(t * 0.016) > 0.75) ? 0.35 : 0;
        bassValue = Math.max(0.08, baseOsc * 0.45 + kickTrigger + Math.random() * 0.06);
        midValue = 0.35 + Math.sin(t * 0.004) * 0.15;
        trebleValue = 0.25 + Math.cos(t * 0.01) * 0.2;
      }

      // Apply fade multiplier
      const intensity = vizSettingsRef.current.intensity;
      bassValue   = bassValue   * fadeMultiplier;
      midValue    = midValue    * fadeMultiplier;
      trebleValue = trebleValue * fadeMultiplier;

      // Track smoothed average bass so we can isolate beat peaks above the baseline.
      // This keeps scale(1) as the resting size at any intensity level —
      // only transient beats above the running average get amplified.
      smoothedBass += (bassValue - smoothedBass) * 0.12;
      const beatPeak = Math.max(0, bassValue - smoothedBass * 0.75);

      // Background — scale amplitude controlled by intensity
      const bk = backgroundRef.current;
      if (bk) {
        const scale = 1.04 + beatPeak * 0.18 * intensity;
        const opacity = 0.18 + bassValue * 0.4;
        const blurAmount = Math.max(40, 100 - bassValue * 55);
        bk.style.transform = `scale(${scale})`;
        bk.style.opacity = `${opacity}`;
        bk.style.filter = `blur(${blurAmount}px)`;
      }

      // Album artwork — base is always scale(1), only beat peaks drive the shake
      // Scale smoothly decays back to 1 when paused via fadeMultiplier
      const alb = albumContainerRef.current;
      if (alb) {
        const ac = artworkColorsRef.current[0];
        const scaleBoost = beatPeak * 0.22 * intensity * fadeMultiplier;
        alb.style.transform = `scale(${1 + scaleBoost})`;
        const shadowR = 30 + beatPeak * 90 * intensity * fadeMultiplier;
        alb.style.boxShadow = `0px 20px ${shadowR}px rgba(${ac}, ${(0.08 + bassValue * 0.55) * fadeMultiplier})`;
      }

      // Disc inertia: full speed while playing, gradually decelerates to 0 when paused
      if (playing) {
        discSpeed = DISC_FULL_SPEED * vizSettingsRef.current.speed;
      } else {
        discSpeed *= 0.965;
        if (discSpeed < 0.001) discSpeed = 0;
      }
      discAngle += discSpeed;
      if (discImgRef.current) {
        discImgRef.current.style.transform = `rotate(${discAngle}deg)`;
      }

      // Slow dynamic spin (visualizer ring angle)
      const spd = vizSettingsRef.current.speed;
      angle += playing ? (0.01 + bassValue * 0.015) * spd : (fadeMultiplier > 0 ? 0.003 * fadeMultiplier : 0);

      const startRadius = baseRadius + 15 + bassValue * 15;

      // 1. Draw glowing background outer aura waves
      ctx.shadowBlur = (20 + bassValue * 30) * fadeMultiplier;
      ctx.shadowColor = `rgba(${c1}, 0.45)`;

      const numPoints = 180;
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const theta = (i * Math.PI * 2) / numPoints;
        const waveIndex = Math.floor((i % (numPoints / 2)) / (numPoints / 2) * 32);
        const freqAmp = cachedArray
          ? (cachedArray[waveIndex] / 255)
          : (0.3 + Math.sin(theta * 6 + angle * 4) * 0.2) * fadeMultiplier;
        const offset = freqAmp * 50 * Math.sin(theta * 8 + angle * 3);
        const r = startRadius + offset;
        if (i === 0) ctx.moveTo(cx + r * Math.cos(theta), cy + r * Math.sin(theta));
        else ctx.lineTo(cx + r * Math.cos(theta), cy + r * Math.sin(theta));
      }
      ctx.closePath();

      const glowGrad = ctx.createRadialGradient(cx, cy, startRadius - 20, cx, cy, startRadius + 75);
      glowGrad.addColorStop(0, `rgba(${c1}, ${0.35 * fadeMultiplier})`);
      glowGrad.addColorStop(0.5, `rgba(${c2}, ${0.12 * fadeMultiplier})`);
      glowGrad.addColorStop(1, `rgba(${c3}, 0)`);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // 2. Draw circular equalizer bars
      ctx.shadowBlur = 0;

      const numSpokes = 80;
      for (let i = 0; i < numSpokes; i++) {
        const theta = (i * Math.PI * 2) / numSpokes + angle * 0.4;
        let amp: number;
        if (cachedArray) {
          const bin = Math.floor((i % 30) / 30 * 48);
          amp = (cachedArray[bin] / 255) * fadeMultiplier;
        } else {
          amp = (0.2 + 0.45 * Math.sin(i * 0.15 + angle * 4.5) * Math.cos(i * 0.05) + Math.random() * 0.04) * fadeMultiplier;
        }

        // Alternate between palette colors for spoke gradient
        const spokeColor = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3;
        const innerR = startRadius - 4;
        const outerR = startRadius + amp * 50;
        ctx.strokeStyle = `rgba(${spokeColor}, ${(0.45 + amp * 0.55) * fadeMultiplier})`;
        ctx.lineWidth = 1.6 + amp * 1.4;
        ctx.beginPath();
        ctx.moveTo(cx + innerR * Math.cos(theta), cy + innerR * Math.sin(theta));
        ctx.lineTo(cx + outerR * Math.cos(theta), cy + outerR * Math.sin(theta));
        ctx.stroke();
      }

      // 3. Thin tech rings
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.06 * fadeMultiplier})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, startRadius + 40, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(${c1}, ${0.12 * fadeMultiplier})`;
      ctx.beginPath();
      ctx.arc(cx, cy, startRadius + 55, angle * 0.5, angle * 0.5 + Math.PI * 0.6);
      ctx.stroke();
      ctx.strokeStyle = `rgba(${c2}, ${0.12 * fadeMultiplier})`;
      ctx.beginPath();
      ctx.arc(cx, cy, startRadius + 55, angle * 0.5 + Math.PI, angle * 0.5 + Math.PI * 1.6);
      ctx.stroke();

      // 4. Floating neon particles
      const pCount = 24;
      for (let i = 0; i < pCount; i++) {
        const speed = (i % 3 + 1) * 0.25;
        const pTheta = angle * speed + (i * Math.PI * 2) / pCount;
        const pDist = startRadius + 25 + Math.sin(angle * 1.2 + i) * (15 + bassValue * 20);
        const pColor = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3;
        ctx.shadowBlur = 6 * fadeMultiplier;
        ctx.shadowColor = `rgba(${pColor}, 0.8)`;
        ctx.fillStyle = `rgba(${pColor}, ${fadeMultiplier})`;
        ctx.beginPath();
        ctx.arc(cx + pDist * Math.cos(pTheta), cy + pDist * Math.sin(pTheta), 1.0 + bassValue * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [isOpen]);


  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const targetSec = (val / 100) * duration;
    if ((window as any).__setAudioCurrentTime) {
      (window as any).__setAudioCurrentTime(targetSec);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && activeTrack && (
      <motion.div
        key="fullscreen-player"
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 180 }}
        className="fixed inset-0 z-50 bg-[#060606] flex flex-col h-full overflow-hidden"
      >
        {/* Immersive blurred backdrop artwork */}
        <div 
          ref={backgroundRef}
          className="absolute inset-0 -z-10 w-full h-full opacity-15 overflow-hidden filter blur-[100px] scale-125"
        >
          <img
            src={activeTrack.artworkUrl}
            alt=""
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Immersive animated background layer with requested .animate-shiny-bg */}
        <div className="absolute inset-0 -z-20 w-full h-full animate-shiny-bg opacity-35 select-none pointer-events-none" />

        {/* SVG definition container for custom filter matching .animate-shiny */}
        <svg className="absolute w-0 h-0 hidden" aria-hidden="true">
          <filter id="c3-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.12 0" />
            <feComposite operator="in" in2="SourceGraphic" />
            <feBlend mode="overlay" in2="SourceGraphic" />
          </filter>
        </svg>

        {/* Holographic spiral background — audio-reactive, artwork-colored */}
        <div className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
          <HolographicBackground colorsRef={artworkColorsRef} settingsRef={vizSettingsRef} />
        </div>

        {/* Optional animated background layer */}
        {vizSettings.bg === 'waves' && (
          <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ zIndex: 2 }}>
            <WavesBg accentColor={accentColor} />
          </div>
        )}

        {/* Track info panel — slides in from left */}
        <AnimatePresence>
          {infoOpen && activeTrack && (
            <motion.div
              key="info-panel"
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 220 }}
              className="absolute left-0 top-20 bottom-[220px] w-72 flex flex-col overflow-hidden"
              style={{
                zIndex: 25,
                background: 'rgba(6,6,10,0.55)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* top accent */}
              <div className="h-px w-full shrink-0" style={{ background: `linear-gradient(to right, transparent, ${accentColor}50, transparent)` }} />

              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 scrollbar-thin">
                {/* Mini artwork + title */}
                <div className="flex items-center gap-3">
                  <img
                    src={activeTrack.artworkUrl}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover shrink-0 opacity-90"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-white truncate leading-tight">{activeTrack.title}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 truncate">{activeTrack.artist}</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: <Headphones size={10} />, label: 'Genre', value: activeTrack.genre || '—' },
                    { icon: <Clock size={10} />, label: 'Released', value: activeTrack.publishedAt || '—' },
                    { icon: <Music size={10} />, label: 'Plays', value: activeTrack.playCount ? activeTrack.playCount.toLocaleString() : '—' },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-1 text-zinc-500 mb-1">
                        {item.icon}
                        <span className="text-[8px] font-mono uppercase tracking-wider">{item.label}</span>
                      </div>
                      <div className="text-[10px] font-semibold text-zinc-300 truncate">{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <div>
                  <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Description</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-line">
                    {activeTrack.description?.trim() || 'No description provided for this track.'}
                  </p>
                </div>

                {/* SoundCloud link */}
                {activeTrack.soundcloudUrl && (
                  <a
                    href={activeTrack.soundcloudUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-mono text-zinc-600 hover:text-zinc-300 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    soundcloud.com ↗
                  </a>
                )}
              </div>

              {/* bottom gradient fade */}
              <div className="h-8 shrink-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(6,6,10,0.7), transparent)' }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ambient colored nodes for cinematic depth */}
        <div className="absolute inset-x-0 -top-40 h-96 bg-accent/10 rounded-full blur-[140px]" style={{ zIndex: 1 }} />
        <div className="absolute inset-x-0 -bottom-40 h-96 bg-purple-600/10 rounded-full blur-[140px]" style={{ zIndex: 1 }} />

        {/* Header toolbar */}
        <div className="flex items-center justify-between h-20 px-8 relative" style={{ zIndex: 20 }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Sparkles size={14} className="text-accent animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-[#ffffff50] font-mono tracking-widest leading-none block">CINEMATIC DOCK</span>
              <span className="text-xs font-bold font-mono text-zinc-300">EchoCloud Hologram Stage</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Track info toggle */}
            <button
              onClick={() => setInfoOpen(v => !v)}
              title="Track info"
              className={`w-10 h-10 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                infoOpen
                  ? 'border-accent/30 text-accent bg-accent/10'
                  : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              }`}
              style={infoOpen ? { borderColor: `${accentColor}40`, color: accentColor, backgroundColor: `${accentColor}15` } : {}}
            >
              <Info size={15} />
            </button>

            {/* Visualizer settings gear */}
            <div className="relative">
              <button
                onClick={() => setVizSettingsOpen(v => !v)}
                title="Visualizer settings"
                className={`w-10 h-10 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                  vizSettingsOpen
                    ? 'border-accent/30 text-accent bg-accent/10'
                    : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                }`}
                style={vizSettingsOpen ? { borderColor: `${accentColor}40`, color: accentColor, backgroundColor: `${accentColor}15` } : {}}
              >
                <Settings size={15} className={vizSettingsOpen ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />
              </button>

              {/* Settings panel */}
              {vizSettingsOpen && (
                <div className="absolute top-12 right-0 z-50 w-72 bg-neutral-950/97 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-3xl shadow-[0_8px_40px_rgba(0,0,0,0.7)]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono font-bold text-zinc-300 tracking-[0.18em] uppercase">Visualizer</span>
                    <button
                      onClick={() => {
                        vizSettingsRef.current = { ...VIZ_DEFAULTS };
                        setVizSettings({ ...VIZ_DEFAULTS });
                      }}
                      className="flex items-center gap-1 text-[8.5px] font-mono text-zinc-500 hover:text-zinc-200 cursor-pointer transition-colors"
                    >
                      <RotateCcw size={9} />
                      RESET
                    </button>
                  </div>
                  <p className="text-[8.5px] font-mono text-zinc-600 mb-3 leading-relaxed">
                    Controls the holographic background wave.<br/>
                    Intensity scales both album shake and wave height.
                  </p>
                  <VizSliderRow label="Intensity" value={vizSettings.intensity} min={0.2} max={2.5} step={0.1}
                    onChange={(v) => updateViz('intensity', v)} accentColor={accentColor} />
                  <VizSliderRow label="Speed" value={vizSettings.speed} min={0.1} max={3.0} step={0.1}
                    onChange={(v) => updateViz('speed', v)} accentColor={accentColor} />
                  <div className="mt-3 pt-3 border-t border-white/[0.05]">
                    <span className="text-[9px] font-mono text-zinc-500 tracking-wider block mb-2 uppercase">Background</span>
                    <div className="flex gap-2">
                      {(['none', 'waves'] as const).map(bg => (
                        <button
                          key={bg}
                          onClick={() => updateViz('bg', bg)}
                          className="flex-1 py-1.5 text-[9px] font-mono rounded-lg border transition-all cursor-pointer"
                          style={vizSettings.bg === bg ? {
                            borderColor: `${accentColor}60`, color: accentColor, backgroundColor: `${accentColor}15`,
                          } : {
                            borderColor: 'rgba(255,255,255,0.06)', color: '#71717a',
                          }}
                        >
                          {bg === 'none' ? 'DEFAULT' : bg.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              title="Collapse Stage"
              className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-transform hover:scale-105 cursor-pointer"
            >
              <Minimize2 size={16} />
            </button>
          </div>
        </div>

        {/* Centered content block with full-width layout, lyrics removed */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 lg:px-20 py-2 relative overflow-hidden">
          
          {/* Big high fidelity artwork & visualizer layer (fully centered) */}
          <div className="relative w-full max-w-2xl h-full flex items-center justify-center">
            {/* Visualizer Canvas overlay behind cover */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <canvas ref={canvasRef} className="w-full h-full max-h-[450px]" />
            </div>

            {/* Glowing artwork hub inside orbit */}
            <div className="relative group shrink-0 pb-4">
              <div
                ref={albumContainerRef}
                className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 aspect-square rounded-full overflow-hidden bg-zinc-950 p-2.5 shadow-[0_10px_60px_rgba(0,0,0,0.65)] relative z-10"
              >
                {/* Image — JS-driven rotation with inertia deceleration */}
                <img
                  ref={discImgRef}
                  src={activeTrack.artworkUrl}
                  alt={activeTrack.title}
                  className="w-full h-full object-cover rounded-full select-none"
                  style={{ willChange: 'transform' }}
                  referrerPolicy="no-referrer"
                />

                {/* center adapter mock vinyl hole */}
                <div className="absolute inset-0 bg-[#0000000d] rounded-full pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-950 border-2 border-zinc-800 flex items-center justify-center shadow-lg">
                  <div className="w-2.5 h-2.5 bg-accent/60 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer controls bottom tray */}
        <div className="px-8 lg:px-24 py-10 relative z-20 border-t border-white/[0.03] bg-neutral-950/45 backdrop-blur-3xl flex flex-col gap-4">
          
          {/* Metadata Display */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col min-w-0">
              <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight truncate leading-tight">
                {activeTrack.title}
              </h2>
              <span className="text-xs md:text-sm text-[#ffffff60] mt-0.5 font-medium">
                <button
                  onClick={() => { if ((activeTrack as any).artistId) { setActiveArtistId((activeTrack as any).artistId); onClose(); } }}
                  className="hover:text-accent transition-colors cursor-pointer"
                >
                  {activeTrack.artist}
                </button>
                {' '}• <span className="text-accent/80 font-semibold">{activeTrack.genre}</span>
              </span>
            </div>

            <button
              onClick={() => toggleLikeTrack(activeTrack.id)}
              className={`p-3 rounded-xl border border-white/5 cursor-pointer bg-[#ffffff03] transition-all hover:scale-105 text-white ${activeTrack.liked ? 'text-accent border-accent/25 shadow-[0_0_12px_rgba(255,107,0,0.15)]' : 'hover:text-accent'}`}
            >
              <Heart size={16} className={activeTrack.liked ? 'fill-current' : ''} />
            </button>
          </div>

          {/* Progress Slider */}
          <div className="flex items-center gap-4 mt-1.5 font-mono text-zinc-500 text-[11px] select-none">
            <span className="w-10 text-left">{formatTime(currentTime)}</span>
            <div className="relative flex-1 group h-6 flex items-center cursor-pointer">
              {/* Track + fill */}
              <div className="absolute inset-x-0 h-1 group-hover:h-[5px] rounded-full overflow-hidden pointer-events-none transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full transition-none" style={{ width: `${percent}%`, backgroundColor: accentColor }} />
              </div>
              {/* Thumb */}
              <div
                className="absolute w-3.5 h-3.5 rounded-full pointer-events-none shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${percent}% - 7px)`, backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}90` }}
              />
              <input
                type="range"
                value={percent}
                onChange={handleSliderChange}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <span className="w-10 text-right">{formatTime(duration)}</span>
          </div>

          {/* Main Controls Row — 3 equal columns so play buttons sit exactly below artwork */}
          <div className="grid grid-cols-3 items-center mt-1">
            {/* Left: Shuffle + Repeat */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleShuffle}
                title="Shuffle Tracks"
                className={`p-2 rounded-lg cursor-pointer transition-all ${isShuffle ? 'text-accent bg-accent/10 border border-accent/10' : 'text-zinc-500 hover:text-white'}`}
              >
                <Shuffle size={14} />
              </button>
              <button
                onClick={toggleRepeat}
                title={`Repeat: ${isRepeat}`}
                className={`p-2 rounded-lg cursor-pointer transition-all relative ${isRepeat !== 'none' ? 'text-accent bg-accent/10 border border-accent/10' : 'text-zinc-500 hover:text-white'}`}
              >
                <Repeat size={14} />
                {isRepeat === 'one' && (
                  <span className="absolute -top-1 -right-1 text-[7px] font-bold font-mono bg-accent text-black w-3.5 h-3.5 rounded-full flex items-center justify-center">1</span>
                )}
              </button>
            </div>

            {/* Center: Play controls — always centered under the artwork */}
            <div className="flex items-center gap-4 justify-center">
              <button
                onClick={prevTrack}
                className="w-11 h-11 flex items-center justify-center text-zinc-400 hover:text-white scale-100 hover:scale-110 transition cursor-pointer"
              >
                <SkipBack size={18} />
              </button>

              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePlay}
                className={`w-14 h-14 rounded-full bg-accent flex items-center justify-center shadow-[0_4px_30px_rgba(255,107,0,0.35)] cursor-pointer hover:brightness-90 transition-colors origin-center ${playIconClass}`}
              >
                {isPlaying ? <Pause size={22} className={playIconClass} /> : <Play size={22} className={`fill-current ${playIconClass}`} />}
              </motion.button>

              <button
                onClick={nextTrack}
                className="w-11 h-11 flex items-center justify-center text-zinc-400 hover:text-white scale-100 hover:scale-110 transition cursor-pointer"
              >
                <SkipForward size={18} />
              </button>
            </div>

            {/* Right: Volume */}
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setMuted(!isMuted)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <div
                ref={fsVolRef}
                className="relative w-16 md:w-24 h-5 flex items-center cursor-pointer select-none"
                onPointerDown={(e) => {
                  fsVolDragging.current = true;
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  if (!fsVolRef.current) return;
                  const rect = fsVolRef.current.getBoundingClientRect();
                  const v = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  setVolume(v);
                  if (isMuted && v > 0) setMuted(false);
                }}
                onPointerMove={(e) => {
                  if (!fsVolDragging.current || !fsVolRef.current) return;
                  const rect = fsVolRef.current.getBoundingClientRect();
                  const v = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  setVolume(v);
                  if (isMuted && v > 0) setMuted(false);
                }}
                onPointerUp={() => { fsVolDragging.current = false; }}
                onPointerLeave={() => { fsVolDragging.current = false; }}
              >
                {/* Track */}
                <div className="absolute inset-x-0 h-[3px] rounded-full pointer-events-none" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(isMuted ? 0 : volume) * 100}%`, backgroundColor: accentColor }} />
                </div>
                {/* Thumb */}
                <div
                  className="absolute pointer-events-none rounded-full"
                  style={{
                    width: 11, height: 11,
                    left: `calc(${(isMuted ? 0 : volume) * 100}% - 5.5px)`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: accentColor,
                    boxShadow: `0 0 8px ${accentColor}80`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}

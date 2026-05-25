import { useEffect, useRef } from 'react';

export interface VizSettings {
  intensity: number;
  speed: number;
}

interface Props {
  colorsRef?: React.MutableRefObject<[string, string, string]>;
  settingsRef?: React.MutableRefObject<VizSettings>;
}

// Fallback colors used before artwork is extracted (classic cyan/purple/pink)
const DEFAULT_COLORS: [string, string, string] = ['6,182,212', '139,92,246', '236,72,153'];

const FILAMENT_DEFS = [
  { colorIdx: 0, radius: (x: number, boost: number) => (80  + Math.sin(x * 0.002) * 35) * (1 + boost * 0.6), phaseOffset: 0,              spiralSpeed:  1.4,  waveFrequency: 0.0055, weight: 48 },
  { colorIdx: 1, radius: (x: number, boost: number) => (100 + Math.cos(x * 0.0015) * 45) * (1 + boost * 0.5), phaseOffset: Math.PI * 0.66,  spiralSpeed: -1.1,  waveFrequency: 0.0042, weight: 52 },
  { colorIdx: 2, radius: (x: number, boost: number) => (90  + Math.sin(x * 0.003) * 30) * (1 + boost * 0.4), phaseOffset: Math.PI * 1.33,  spiralSpeed:  1.6,  waveFrequency: 0.0068, weight: 44 },
  { colorIdx: 0, radius: (x: number, boost: number) => (110 + Math.cos(x * 0.001) * 40) * (1 + boost * 0.35), phaseOffset: Math.PI * 0.33, spiralSpeed: -0.8,  waveFrequency: 0.0035, weight: 38 },
  { colorIdx: 1, radius: (x: number, boost: number) => (85  + Math.sin(x * 0.0025) * 25) * (1 + boost * 0.5), phaseOffset: Math.PI,        spiralSpeed:  2.1,  waveFrequency: 0.005,  weight: 42 },
];

export function HolographicBackground({ colorsRef, settingsRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width  = (canvas.width  = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      width  = canvas.width  = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    let time = 0;
    let freqData: Uint8Array | null = null;
    let lastMs = 0;
    let filterFrame = 0;
    let lastFilter = '';
    let lastOpacity = '';

    const render = () => {
      animId = requestAnimationFrame(render);

      const now = Date.now();
      if (now - lastMs < 33) return;
      lastMs = now;

      // Read live settings — zero re-renders needed
      const [c1, c2, c3] = colorsRef?.current ?? DEFAULT_COLORS;
      const palette = [c1, c2, c3];
      const intensity = settingsRef?.current?.intensity ?? 1.0;
      const speed     = settingsRef?.current?.speed     ?? 1.0;

      // Frequency analysis
      const analyser = (window as any).__echoAnalyser as AnalyserNode | null;
      let bassLevel = 0;
      let midLevel  = 0;

      if (analyser) {
        try {
          if (!freqData || freqData.length !== analyser.frequencyBinCount) {
            freqData = new Uint8Array(analyser.frequencyBinCount);
          }
          analyser.getByteFrequencyData(freqData);
          let bSum = 0; for (let i = 0; i < 8;  i++) bSum += freqData[i];
          bassLevel = bSum / (8 * 255);
          let mSum = 0; for (let i = 8; i < 24; i++) mSum += freqData[i];
          midLevel  = mSum / (16 * 255);
        } catch { /* ignore */ }
      }

      // Intensity multiplies the reactive energy — drives both amplitude and wave height
      const energyBoost = (bassLevel * 0.8 + midLevel * 0.2) * intensity;

      // Speed multiplies time step — drives overall animation cadence
      time += (0.0035 + bassLevel * 0.008) * speed;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#070709';
      ctx.fillRect(0, 0, width, height);

      // Subtle color wash from primary artwork color
      ctx.fillStyle = `rgba(${c1}, ${0.03 + energyBoost * 0.04})`;
      ctx.fillRect(0, 0, width, height);

      const segments = 30;

      const passes = [
        { thicknessFactor: 1.1,  alphaMultiplier: 0.23 + energyBoost * 0.18 },
        { thicknessFactor: 0.45, alphaMultiplier: 0.48 + energyBoost * 0.30 },
        { thicknessFactor: 0.12, alphaMultiplier: 0.88 + energyBoost * 0.12 },
      ];

      passes.forEach((pass) => {
        FILAMENT_DEFS.forEach((fil) => {
          const color = palette[fil.colorIdx];
          ctx.beginPath();
          for (let i = 0; i <= segments; i++) {
            const factor = i / segments;
            const x = factor * (width + 160) - 80;
            const centralY = height * 0.60 + Math.sin(time * 0.3 + factor * 2.5) * (60 + bassLevel * 30 * intensity);
            const centralX = x + Math.cos(time * 0.45 + factor * 3.0) * 45;
            const spiralAngle = x * fil.waveFrequency + time * fil.spiralSpeed + fil.phaseOffset;
            const strandRadius = fil.radius(x, energyBoost);
            const finalX = centralX + Math.sin(spiralAngle) * strandRadius + Math.cos(time * 8 - factor * 12) * (8 + bassLevel * 6 * intensity);
            const finalY = centralY + Math.cos(spiralAngle) * strandRadius + Math.sin(time * 6 + factor * 18) * (12 + bassLevel * 10 * intensity);
            if (i === 0) ctx.moveTo(finalX, finalY);
            else ctx.lineTo(finalX, finalY);
          }
          ctx.lineWidth = fil.weight * pass.thicknessFactor * (1 + energyBoost * 0.4);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = `rgba(${color}, ${pass.alphaMultiplier})`;
          ctx.stroke();
        });
      });

      // Particles — cycle through artwork palette
      for (let k = 0; k < 16; k++) {
        const pColor = palette[k % 3];
        const alpha = 0.48 + bassLevel * 0.3;
        ctx.fillStyle = `rgba(${pColor}, ${alpha})`;
        const pSeed  = time * 1.8 + k * 7.7;
        const progress = pSeed % 1.0;
        const sourceX  = progress * (width + 200) - 100;
        const factor   = progress;
        const centralY = height * 0.60 + Math.sin(time * 0.3 + factor * 2.5) * 60;
        const centralX = sourceX + Math.cos(time * 0.45 + factor * 3.0) * 45;
        const orbitFil = FILAMENT_DEFS[k % FILAMENT_DEFS.length];
        const spiralAngle = sourceX * orbitFil.waveFrequency + time * orbitFil.spiralSpeed + orbitFil.phaseOffset + k * 0.5;
        const rad = orbitFil.radius(sourceX, energyBoost) * 1.1;
        const bubbleX = centralX + Math.sin(spiralAngle) * rad;
        const bubbleY = centralY + Math.cos(spiralAngle) * rad;
        const particleSize = (1.2 + Math.abs(Math.sin(time * 3.5 + k)) * 3) * (1 + bassLevel * 0.8);
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ambient center glow — artwork colors
      const glowX = width * 0.5 + Math.sin(time * 0.6) * 150;
      const glowY = height * 0.58 + Math.cos(time * 0.4) * 80;
      const radialFlare = ctx.createRadialGradient(
        glowX, glowY, 30,
        width * 0.5, height * 0.58, Math.max(width * (0.68 + bassLevel * 0.2), 650),
      );
      radialFlare.addColorStop(0,    `rgba(${c1},${0.07 + bassLevel * 0.10})`);
      radialFlare.addColorStop(0.45, `rgba(${c2},${0.03 + bassLevel * 0.05})`);
      radialFlare.addColorStop(0.75, `rgba(${c3},${0.01 + bassLevel * 0.02})`);
      radialFlare.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = radialFlare;
      ctx.fillRect(0, 0, width, height);

      // Throttle filter updates
      filterFrame++;
      if (filterFrame % 4 === 0) {
        const blurAmt  = Math.max(20, 76 - bassLevel * 35);
        const sat      = 2.4 + bassLevel * 1.2 + (intensity - 1) * 0.4;
        const newFilter  = `blur(${blurAmt.toFixed(0)}px) saturate(${sat.toFixed(1)})`;
        const newOpacity = (0.82 + bassLevel * 0.18).toFixed(2);
        if (newFilter  !== lastFilter)  { canvas.style.filter  = newFilter;  lastFilter  = newFilter; }
        if (newOpacity !== lastOpacity) { canvas.style.opacity = newOpacity; lastOpacity = newOpacity; }
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, []); // refs are stable — no deps needed

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

import React, { useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../store';

const EQ_BANDS = [
  { label: '60',  labelFull: '60 Hz',  type: 'lowshelf'  as BiquadFilterType },
  { label: '250', labelFull: '250 Hz', type: 'peaking'   as BiquadFilterType },
  { label: '1k',  labelFull: '1 kHz',  type: 'peaking'   as BiquadFilterType },
  { label: '4k',  labelFull: '4 kHz',  type: 'peaking'   as BiquadFilterType },
  { label: '16k', labelFull: '16 kHz', type: 'highshelf' as BiquadFilterType },
];

const GAIN_RANGE = 12;
const CURVE_W = 300;
const CURVE_H = 90;

export const THEME_ACCENT: Record<string, string> = {
  slate:    '#ff6b00',
  obsidian: '#e4e4e7',
  sunset:   '#c026d3',
  forest:   '#10b981',
};

const PRESETS: Record<string, { bands: number[]; q: number[] }> = {
  Rock: { bands: [4, 2, 0, 2, 3],   q: [1, 1, 1.5, 1.5, 1] },
  Pop:  { bands: [2, 1, 0, 1, 2],   q: [1, 1, 1,   1,   1] },
  Bass: { bands: [8, 4, 0, -2, -3], q: [0.7, 1, 1, 1,   1] },
  Flat: { bands: [0, 0, 0, 0, 0],   q: [1, 1, 1,   1,   1] },
};

function buildCurvePath(bands: number[], q: number[], enabled: boolean): string {
  if (!enabled) {
    const y = CURVE_H / 2;
    return `M 0 ${y} L ${CURVE_W} ${y}`;
  }
  const FREQS = [60, 250, 1000, 4000, 16000];
  const points: string[] = [];
  for (let px = 0; px <= CURVE_W; px += 3) {
    const logFreq = 20 * Math.pow(1000, px / CURVE_W);
    let totalGain = 0;
    for (let i = 0; i < FREQS.length; i++) {
      const gain = bands[i] ?? 0;
      if (gain === 0) continue;
      const bw = FREQS[i] / Math.max(0.1, q[i] ?? 1.0);
      const logDist = Math.log10(logFreq / FREQS[i]);
      const sigma = Math.log10(1 + bw / FREQS[i]) * 2;
      const bell = Math.exp(-(logDist * logDist) / (2 * sigma * sigma));
      totalGain += gain * bell;
    }
    const clampedGain = Math.max(-GAIN_RANGE, Math.min(GAIN_RANGE, totalGain));
    const y = CURVE_H / 2 - (clampedGain / GAIN_RANGE) * (CURVE_H / 2 - 4);
    points.push(`${px === 0 ? 'M' : 'L'} ${px} ${y}`);
  }
  return points.join(' ');
}

function VerticalSlider({
  value, min, max, step, onChange, disabled, accentColor,
}: {
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; disabled?: boolean; accentColor: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const snap = (v: number) => {
    const s = Math.round(v / step) * step;
    return parseFloat(Math.max(min, Math.min(max, s)).toFixed(6));
  };

  const getValueFromY = (clientY: number) => {
    if (!trackRef.current) return value;
    const rect = trackRef.current.getBoundingClientRect();
    const normalized = 1 - (clientY - rect.top) / rect.height;
    return snap(min + normalized * (max - min));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onChange(getValueFromY(e.clientY));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    onChange(getValueFromY(e.clientY));
  };
  const onPointerUp = () => { dragging.current = false; };

  const thumbPct   = ((value - min) / (max - min)) * 100;
  const centerPct  = ((0 - min)     / (max - min)) * 100;
  const fillBottom = Math.min(thumbPct, centerPct);
  const fillHeight = Math.abs(thumbPct - centerPct);

  return (
    <div
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      className={`relative select-none shrink-0 cursor-ns-resize ${disabled ? 'opacity-35' : ''}`}
      style={{ width: 28, height: 120 }}
    >
      {/* Groove track */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{ width: 5, top: 0, bottom: 0, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.05)' }}
      />
      {/* dB ticks */}
      {[-12, -6, 0, 6, 12].map(db => (
        <div
          key={db}
          className="absolute left-0 right-0 h-px"
          style={{
            bottom: `${((db - min) / (max - min)) * 100}%`,
            backgroundColor: db === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
          }}
        />
      ))}
      {/* Fill bar */}
      {fillHeight > 0.4 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: 5,
            bottom: `${fillBottom}%`,
            height: `${fillHeight}%`,
            backgroundColor: accentColor,
            opacity: 0.9,
          }}
        />
      )}
      {/* Thumb */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full transition-shadow"
        style={{
          width: 14, height: 14,
          bottom: `calc(${thumbPct}% - 7px)`,
          backgroundColor: value !== 0 ? accentColor : '#ffffff',
          border: `2px solid ${value !== 0 ? accentColor : 'rgba(255,255,255,0.25)'}`,
          boxShadow: value !== 0 ? `0 0 10px ${accentColor}90` : '0 1px 4px rgba(0,0,0,0.5)',
          transition: 'background-color 0.1s, border-color 0.1s',
        }}
      />
    </div>
  );
}

export default function EQPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const eqBands   = useStore((s) => s.eqBands);
  const eqQ       = useStore((s) => (s as any).eqQ as number[]) ?? [1,1,1,1,1];
  const setEqBands = useStore((s) => s.setEqBands);
  const setEqQ    = useStore((s) => (s as any).setEqQ as (q: number[]) => void);
  const eqEnabled = useStore((s) => s.eqEnabled);
  const toggleEq  = useStore((s) => s.toggleEq);
  const appTheme  = useStore((s) => s.appTheme);

  const accent    = THEME_ACCENT[appTheme] ?? '#ff6b00';
  const curvePath = useMemo(() => buildCurvePath(eqBands, eqQ, eqEnabled), [eqBands, eqQ, eqEnabled]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-[92px] right-4 w-[560px] max-w-[calc(100vw-32px)] bg-neutral-950/98 backdrop-blur-3xl border border-white/[0.07] rounded-2xl z-50 shadow-[0_-8px_40px_rgba(0,0,0,0.8)] overflow-hidden">
      {/* Top accent line */}
      <div className="h-px w-full" style={{ background: `linear-gradient(to right, transparent, ${accent}70, transparent)` }} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono font-bold text-zinc-300 tracking-[0.18em] uppercase">Parametric EQ</span>
          <button
            onClick={toggleEq}
            className="px-5 py-2 text-[15px] font-mono font-black rounded-xl border-2 cursor-pointer transition-all tracking-widest shadow-lg"
            style={eqEnabled ? {
              backgroundColor: `${accent}22`,
              borderColor: accent,
              color: accent,
              boxShadow: `0 0 16px ${accent}50`,
            } : {
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.15)',
              color: '#71717a',
            }}
          >
            {eqEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="flex items-center gap-3">
          {Object.keys(PRESETS).map(name => (
            <button
              key={name}
              onClick={() => { setEqBands(PRESETS[name].bands); setEqQ(PRESETS[name].q); if (!eqEnabled) toggleEq(); }}
              className="text-[11px] font-mono font-semibold text-zinc-400 hover:text-zinc-100 px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/[0.2] cursor-pointer transition-all hover:bg-white/[0.04]"
            >
              {name}
            </button>
          ))}
          <button
            onClick={() => { setEqBands([0,0,0,0,0]); setEqQ([1,1,1,1,1]); }}
            className="text-[11px] font-mono font-semibold text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg border border-white/[0.05] hover:border-white/[0.12] cursor-pointer transition-all tracking-widest"
          >
            RESET
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] cursor-pointer transition-all"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Frequency response curve */}
      <div className="px-5 pb-3">
        <div className="rounded-xl overflow-hidden border border-white/[0.04] bg-black/25 px-2 pt-2 pb-1">
          <svg width="100%" height={CURVE_H} viewBox={`0 0 ${CURVE_W} ${CURVE_H}`} preserveAspectRatio="none" className="w-full">
            {[-12, -6, 0, 6, 12].map(db => {
              const y = CURVE_H / 2 - (db / GAIN_RANGE) * (CURVE_H / 2 - 4);
              return (
                <line key={db} x1="0" y1={y} x2={CURVE_W} y2={y}
                  stroke={db === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}
                  strokeWidth="1"
                  strokeDasharray={db !== 0 ? '4,6' : undefined}
                />
              );
            })}
            {/* Fill under/over curve */}
            <path
              d={curvePath + ` L ${CURVE_W} ${CURVE_H / 2} L 0 ${CURVE_H / 2} Z`}
              fill={eqEnabled ? `${accent}14` : 'transparent'}
            />
            {/* Curve line */}
            <path
              d={curvePath}
              fill="none"
              stroke={eqEnabled ? accent : 'rgba(255,255,255,0.13)'}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Band dots */}
            {EQ_BANDS.map((_, i) => {
              const FREQS = [60, 250, 1000, 4000, 16000];
              const px = (Math.log10(FREQS[i] / 20) / Math.log10(1000)) * CURVE_W;
              const gain = eqEnabled ? (eqBands[i] ?? 0) : 0;
              const py = CURVE_H / 2 - (gain / GAIN_RANGE) * (CURVE_H / 2 - 4);
              return (
                <circle key={i} cx={px} cy={py} r="4"
                  fill={eqEnabled ? accent : 'rgba(255,255,255,0.18)'}
                  stroke="rgba(0,0,0,0.6)" strokeWidth="1.5"
                />
              );
            })}
          </svg>
          <div className="flex justify-between text-[7px] font-mono text-zinc-600 mt-0.5 px-0.5">
            <span>20Hz</span><span>100</span><span>500</span><span>2k</span><span>8k</span><span>20kHz</span>
          </div>
        </div>
      </div>

      {/* Band controls */}
      <div className="px-5 pb-5">
        <div className="flex gap-0">
          {EQ_BANDS.map((band, i) => (
            <div key={band.label} className="flex flex-col items-center gap-2 flex-1 min-w-0 px-1">
              {/* dB value */}
              <span
                className="text-[10px] font-mono tabular-nums font-bold w-full text-center"
                style={{ color: eqBands[i] !== 0 && eqEnabled ? accent : '#52525b' }}
              >
                {eqBands[i] >= 0 ? '+' : ''}{eqBands[i].toFixed(1)}
              </span>

              {/* Vertical slider */}
              <VerticalSlider
                value={eqBands[i]}
                min={-12} max={12} step={0.5}
                disabled={false}
                accentColor={accent}
                onChange={(v) => {
                  const next = [...eqBands];
                  next[i] = v;
                  setEqBands(next);
                  if (!eqEnabled) toggleEq();
                }}
              />

              {/* Frequency label */}
              <span className="text-[9px] font-mono text-zinc-500 text-center leading-none mt-0.5">{band.labelFull}</span>

              {/* Q label */}
              <span className="text-[8px] font-mono text-zinc-600 tabular-nums">Q {(eqQ[i] ?? 1).toFixed(1)}</span>

              {/* Q horizontal slider with fill */}
              <div className="relative w-full h-5 flex items-center">
                <div className="absolute inset-x-0 h-[3px] rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${((eqQ[i] ?? 1) - 0.1) / 9.9 * 100}%`, backgroundColor: `${accent}55` }}
                  />
                </div>
                <input
                  type="range" min="0.1" max="10" step="0.1"
                  value={eqQ[i] ?? 1}
                  disabled={!eqEnabled}
                  onChange={(e) => {
                    const next = [...(eqQ.length === 5 ? eqQ : [1,1,1,1,1])];
                    next[i] = parseFloat(e.target.value);
                    setEqQ(next);
                    if (!eqEnabled) toggleEq();
                  }}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[8px] font-mono text-zinc-700 tracking-wider">GAIN ±12 dB · Q 0.1 – 10.0 · 5-band parametric</span>
          <span className="text-[8px] font-mono" style={{ color: eqEnabled ? `${accent}80` : '#3f3f46' }}>
            {eqEnabled ? '● ACTIVE' : '○ BYPASSED'}
          </span>
        </div>
      </div>
    </div>
  );
}

import { useStore } from '../store';

const THEME_CONFIGS = {
  slate:    { bg: '#0a0a0c', c1: 'rgba(255,107,0,0.09)',  c2: 'rgba(200,80,0,0.04)'   },
  obsidian: { bg: '#030303', c1: 'rgba(255,255,255,0.02)', c2: 'rgba(255,255,255,0.01)' },
  sunset:   { bg: '#12011a', c1: 'rgba(192,38,211,0.10)', c2: 'rgba(249,115,22,0.07)' },
  forest:   { bg: '#020b05', c1: 'rgba(16,185,129,0.08)', c2: 'rgba(5,150,105,0.05)'  },
};

export default function DynamicBackground() {
  const appTheme = useStore((s) => s.appTheme) ?? 'slate';
  const bgVideoUrl = useStore((s) => s.bgVideoUrl);
  const bgImageUrl = useStore((s) => (s as any).bgImageUrl as string) || '';
  const cfg = THEME_CONFIGS[appTheme] ?? THEME_CONFIGS.slate;

  return (
    <div
      className="absolute inset-0 -z-10 w-full h-full overflow-hidden"
      style={{ backgroundColor: bgImageUrl ? '#000' : cfg.bg, transition: 'background-color 0.8s ease' }}
    >
      {/* Custom image background — full coverage, only a slight dark overlay for readability */}
      {bgImageUrl && (
        <>
          <img
            src={bgImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.85 }}
          />
          {/* Dark vignette so text stays readable */}
          <div className="absolute inset-0 bg-black/45" />
        </>
      )}

      {/* Custom video background */}
      {bgVideoUrl && !bgImageUrl && (
        <video
          src={bgVideoUrl}
          autoPlay loop muted playsInline
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen"
        />
      )}

      {/* Ambient orbs + grid — hidden when custom image is active */}
      {!bgImageUrl && (
        <>
          <div
            style={{
              position: 'absolute', top: '-25%', left: '-15%',
              width: '70%', height: '80%', borderRadius: '50%',
              background: `radial-gradient(ellipse, ${cfg.c1}, transparent 70%)`,
              filter: 'blur(80px)',
              transition: 'background 0.8s ease',
              willChange: 'background',
            }}
          />
          <div
            style={{
              position: 'absolute', bottom: '-20%', right: '-15%',
              width: '65%', height: '75%', borderRadius: '50%',
              background: `radial-gradient(ellipse, ${cfg.c2}, transparent 70%)`,
              filter: 'blur(80px)',
              transition: 'background 0.8s ease',
              willChange: 'background',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.06) 1px,transparent 1px),' +
                'linear-gradient(90deg,rgba(255,255,255,0.06) 1px,transparent 1px)',
              backgroundSize: '100px 100px',
            }}
          />
        </>
      )}
    </div>
  );
}

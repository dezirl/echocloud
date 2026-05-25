import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, CheckCircle, Globe, ArrowRight, AlertCircle, Eye, EyeOff, Wifi } from 'lucide-react';
import { useStore } from '../store';
import { useT } from '../i18n';
import EchoCloudLogo from './EchoCloudLogo';

type BootScreenProps = {
  triggerNotification: (title: string, body: string) => void;
};

function Particle({ style }: { style: React.CSSProperties }) {
  return <div className="absolute rounded-full bg-accent/30 animate-ping pointer-events-none" style={style} />;
}

export default function BootScreen({ triggerNotification }: BootScreenProps) {
  const loginSession = useStore((state) => state.loginSession);
  const updateUserProfile = useStore((state) => state.updateUserProfile);
  const language = useStore((state) => (state as any).language ?? 'en') as 'en' | 'ru';
  const setLanguage = useStore((state) => (state as any).setLanguage) as (l: 'en' | 'ru') => void;
  const t = useT();
  const b = t.boot;

  const [isLoading, setIsLoading] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [browserOpened, setBrowserOpened] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showToken, setShowToken] = useState(false);
  const [loadingDots, setLoadingDots] = useState('');
  const dotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate loading dots
  useEffect(() => {
    if (!checkingSession) return;
    dotIntervalRef.current = setInterval(() => {
      setLoadingDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    return () => { if (dotIntervalRef.current) clearInterval(dotIntervalRef.current); };
  }, [checkingSession]);

  // Pull-based session check — works even after logout+remount.
  // mounted guard prevents StrictMode double-invoke from showing the notification twice.
  useEffect(() => {
    if (!window.electronAPI?.checkAutoLogin) {
      setCheckingSession(false);
      return;
    }
    let mounted = true;
    window.electronAPI.checkAutoLogin()
      .then((user) => {
        if (!mounted) return;
        if (user) {
          loginSession(user.username, 'auto');
          updateUserProfile({ ...user });
          triggerNotification('Welcome back', `Signed in as @${user.username}`);
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setCheckingSession(false); });
    return () => { mounted = false; };
  }, []);

  const handleOpenBrowser = async () => {
    if (!window.electronAPI) return;
    await window.electronAPI.openBrowserLogin();
    setBrowserOpened(true);
  };

  const handleValidateToken = async () => {
    const token = tokenInput.trim();
    if (!token) return;
    if (!window.electronAPI) return;

    setTokenError('');
    setIsLoading(true);
    try {
      const user = await window.electronAPI.validateToken(token);
      if (user) {
        loginSession(user.username, token);
        updateUserProfile({
          username: user.username,
          avatarUrl: ((user as any).avatar_url || '').replace('-large', '-t200x200'),
          followersCount: (user as any).followers_count || 0,
          scUserId: (user as any).id || 0,
        });
        triggerNotification('SoundCloud Connected', `Signed in as @${user.username}`);
      } else {
        setTokenError(b.invalidToken);
        setIsLoading(false);
      }
    } catch {
      setTokenError(b.connectionError);
      setIsLoading(false);
    }
  };

  // ── Beautiful loading screen ─────────────────────────────────────────────
  if (checkingSession) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06060a] overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] rounded-full bg-gradient-radial from-accent/20 to-transparent blur-[120px] animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full bg-gradient-radial from-purple-600/15 to-transparent blur-[100px] animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <Particle key={i} style={{
            width: `${4 + (i % 3) * 3}px`,
            height: `${4 + (i % 3) * 3}px`,
            left: `${10 + i * 11}%`,
            top: `${20 + (i % 4) * 15}%`,
            animationDuration: `${1.5 + i * 0.3}s`,
            animationDelay: `${i * 0.2}s`,
            opacity: 0.4,
          }} />
        ))}

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(255,107,0,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,107,0,0.15) 1px,transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center gap-6 relative z-10"
        >
          {/* Logo with glow ring */}
          <div className="relative">
            <div className="absolute inset-[-16px] rounded-full border border-accent/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-[-8px] rounded-full border border-accent/10 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
            <div className="relative p-4 bg-accent/10 rounded-2xl border border-accent/20 shadow-[0_0_40px_rgba(255,107,0,0.15)]">
              <EchoCloudLogo className="w-14 h-10" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Echo<span className="text-accent">Cloud</span>
            </h1>
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 tracking-widest">
              <Wifi size={11} className="text-accent animate-pulse" />
              <span>RESTORING SESSION{loadingDots}</span>
            </div>
          </div>

          {/* Loading bar */}
          <div className="w-48 h-[2px] bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent to-orange-400 rounded-full"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Auth form ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06060a] select-none text-white overflow-hidden">

      {/* Background atmosphere */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] rounded-full blur-[140px] bg-gradient-to-br from-accent/15 to-transparent opacity-80" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[65%] rounded-full blur-[150px] bg-gradient-to-tr from-purple-800/10 via-orange-600/10 to-transparent opacity-75" />
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px)`,
        backgroundSize: '80px 80px',
      }} />

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="relative p-5 bg-accent/10 rounded-2xl border border-accent/20 shadow-[0_0_40px_rgba(255,107,0,0.2)]">
              <div className="absolute inset-0 rounded-2xl border border-accent/30 animate-ping" style={{ animationDuration: '1.5s' }} />
              <EchoCloudLogo className="w-12 h-8 relative z-10" />
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-sm font-bold text-white tracking-tight">{b.verifying}</p>
              <p className="text-[10px] font-mono text-zinc-500 tracking-wider">AUTHENTICATING WITH SOUNDCLOUD</p>
            </div>
            <div className="w-40 h-[2px] bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent to-orange-400"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
            className="w-full max-w-sm relative z-10"
          >
            {/* Language toggle */}
            <div className="absolute top-3 right-3 flex gap-1 z-10">
              {(['en', 'ru'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border cursor-pointer transition-all ${
                    language === lang
                      ? 'bg-accent/20 border-accent/30 text-accent'
                      : 'bg-white/5 border-white/5 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Card */}
            <div className="liquid-glass border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,107,0,0.05)] overflow-hidden">
              {/* Top accent bar */}
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-accent/70 to-transparent" />

              {/* Header */}
              <div className="flex flex-col items-center text-center pt-8 pb-4 px-8">
                <div className="relative mb-4">
                  <div className="absolute inset-[-10px] rounded-2xl bg-accent/5 blur-xl" />
                  <EchoCloudLogo className="w-16 h-11 relative filter drop-shadow-[0_0_12px_rgba(255,107,0,0.3)]" />
                </div>
                <h1 className="text-[22px] font-black tracking-tight leading-tight">
                  Echo<span className="text-accent">Cloud</span>
                </h1>
                <p className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase mt-1">
                  {b.tagline}
                </p>
              </div>

              {/* Divider */}
              <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

              {/* Content */}
              <div className="px-6 py-5">
                <AnimatePresence mode="wait">
                  {!browserOpened ? (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      className="space-y-4"
                    >
                      {/* Steps preview */}
                      <div className="space-y-2">
                        {b.steps.map((step, i) => (
                          <div
                            key={i}
                            className={`flex gap-3 p-3 rounded-xl border transition-colors ${
                              i === 0 ? 'border-accent/25 bg-accent/[0.05]' : 'border-white/[0.04] bg-white/[0.01]'
                            }`}
                          >
                            <div className="w-5 h-5 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-[9px] font-black text-accent shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <div>
                              <div className="text-[11px] font-bold text-zinc-200 leading-tight">{step.title}</div>
                              <div className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{step.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenBrowser}
                        className="w-full h-11 bg-gradient-to-r from-accent to-orange-500 hover:brightness-95 text-black font-extrabold text-[11px] tracking-[0.15em] uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(255,107,0,0.25)] hover:shadow-[0_4px_28px_rgba(255,107,0,0.4)]"
                      >
                        <Globe size={13} />
                        <span>{b.openBrowser}</span>
                        <ArrowRight size={12} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      className="space-y-4"
                    >
                      {/* Steps with checkmarks */}
                      <div className="space-y-1.5">
                        {b.steps.map((step, i) => (
                          <div key={i} className={`flex gap-2.5 p-2.5 rounded-xl border transition-colors ${
                            i === 3 ? 'border-accent/25 bg-accent/[0.05]' : 'border-white/[0.03] bg-white/[0.01]'
                          }`}>
                            <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              i < 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-accent/15 text-accent'
                            }`}>
                              {i < 3 ? <CheckCircle size={10} /> : <span className="text-[8px] font-black">{i + 1}</span>}
                            </div>
                            <div className="text-[10px] font-semibold text-zinc-400 leading-tight">{step.title}</div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-zinc-500 tracking-[0.15em] block">{b.pasteToken}</label>
                        <div className="relative flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type={showToken ? 'text' : 'password'}
                              placeholder={b.tokenPlaceholder}
                              value={tokenInput}
                              onChange={(e) => { setTokenInput(e.target.value); setTokenError(''); }}
                              onKeyDown={(e) => e.key === 'Enter' && handleValidateToken()}
                              className="w-full h-10 pl-3 pr-9 bg-white/[0.04] border border-white/10 focus:border-accent/50 text-[11px] font-mono rounded-xl focus:outline-none transition-colors text-zinc-200 placeholder:text-zinc-700"
                            />
                            <button
                              type="button"
                              onClick={() => setShowToken(!showToken)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 cursor-pointer"
                            >
                              {showToken ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={handleValidateToken}
                            disabled={!tokenInput.trim()}
                            className="px-4 h-10 bg-accent hover:brightness-90 disabled:opacity-40 text-black font-bold text-[11px] rounded-xl transition-all cursor-pointer shrink-0 shadow-[0_0_12px_rgba(255,107,0,0.2)]"
                          >
                            {b.connect}
                          </button>
                        </div>
                        <AnimatePresence>
                          {tokenError && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 border border-red-500/15 rounded-lg px-2.5 py-1.5"
                            >
                              <AlertCircle size={10} />
                              <span>{tokenError}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <button
                        type="button"
                        onClick={() => setBrowserOpened(false)}
                        className="w-full text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer py-1"
                      >
                        ← {b.backToBrowser}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-center gap-1.5 pb-5 text-[9px] text-zinc-700 font-mono tracking-wider uppercase">
                <Key size={8} />
                <span>{b.tokenNote}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

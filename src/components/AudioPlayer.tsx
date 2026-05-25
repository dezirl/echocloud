import { useEffect, useRef } from 'react';
import { useStore } from '../store';

const EQ_FREQUENCIES = [60, 250, 1000, 4000, 16000];

function buildImpulseResponse(ctx: AudioContext, size: number) {
  const duration = 0.5 + size * 4.5;       // 0.5s – 5.0s
  const decay   = 4.0 - size * 2.5;        // 4.0 (tight) – 1.5 (long tail)
  const length  = Math.floor(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return buf;
}

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrackId = useStore((state) => state.currentTrackId);
  const isPlaying      = useStore((state) => state.isPlaying);
  const volume         = useStore((state) => state.volume);
  const isMuted        = useStore((state) => state.isMuted);
  const tracks         = useStore((state) => state.tracks);

  const setPlaying    = useStore((state) => state.setPlaying);
  const setCurrentTime = useStore((state) => state.setCurrentTime);
  const setDuration   = useStore((state) => state.setDuration);
  const nextTrack     = useStore((state) => state.nextTrack);

  const eqBands    = useStore((state) => state.eqBands);
  const eqQ        = useStore((state) => (state as any).eqQ as number[]) ?? [1,1,1,1,1];
  const eqEnabled  = useStore((state) => state.eqEnabled);
  const playbackRate  = useStore((state) => state.playbackRate);
  const reverbEnabled = useStore((state) => state.reverbEnabled);
  const reverbAmount  = useStore((state) => state.reverbAmount);
  const reverbSize    = useStore((state) => state.reverbSize);
  const reverbDamp    = useStore((state) => state.reverbDamp);

  const activeTrack = tracks.find(t => t.id === currentTrackId);

  const playbackRateRef = useRef(playbackRate);
  useEffect(() => { playbackRateRef.current = playbackRate; }, [playbackRate]);

  // Initialize Web Audio API: EQ → dry+wet(convolver+damp) → analyser
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.crossOrigin = 'anonymous';
    let audioCtx: AudioContext | null = null;

    const setupAnalyzer = () => {
      if (audioCtx) return;
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioCtxClass();
        const analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 256;
        const sourceNode = audioCtx.createMediaElementSource(audio);

        // EQ filter chain
        const { eqBands: bands, eqEnabled: enabled } = useStore.getState();
        const eqFilters = EQ_FREQUENCIES.map((freq, i) => {
          const f = audioCtx!.createBiquadFilter();
          f.type = i === 0 ? 'lowshelf' : i === EQ_FREQUENCIES.length - 1 ? 'highshelf' : 'peaking';
          f.frequency.value = freq;
          f.Q.value = 1.5;
          f.gain.value = enabled ? (bands[i] ?? 0) : 0;
          return f;
        });

        // Reverb chain
        const { reverbEnabled: rev, reverbAmount: amt, reverbSize: sz, reverbDamp: dmp } = useStore.getState();
        const convolver  = audioCtx.createConvolver();
        convolver.buffer = buildImpulseResponse(audioCtx, sz);
        // Damping lowpass on the wet signal
        const dampFilter = audioCtx.createBiquadFilter();
        dampFilter.type  = 'lowpass';
        dampFilter.frequency.value = 20000 - dmp * 17000;
        const dryGain = audioCtx.createGain();
        const wetGain = audioCtx.createGain();
        dryGain.gain.value = rev ? 1.0 - amt * 0.35 : 1.0;
        wetGain.gain.value = rev ? amt * 0.45        : 0.0;

        // Wire: source → EQ chain → dryGain → analyser
        //                         → convolver → dampFilter → wetGain → analyser
        let last: AudioNode = sourceNode;
        for (const f of eqFilters) { last.connect(f); last = f; }
        last.connect(dryGain);
        last.connect(convolver);
        convolver.connect(dampFilter);
        dampFilter.connect(wetGain);
        dryGain.connect(analyserNode);
        wetGain.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);

        (window as any).__echoAnalyser   = analyserNode;
        (window as any).__echoEqFilters  = eqFilters;
        (window as any).__echoDryGain    = dryGain;
        (window as any).__echoWetGain    = wetGain;
        (window as any).__echoConvolver  = convolver;
        (window as any).__echoDampFilter = dampFilter;
        (window as any).__echoAudioCtx   = audioCtx;
      } catch (err) {
        console.warn('Web Audio API setup failed:', err);
      }
    };

    audio.addEventListener('play', setupAnalyzer);
    audio.addEventListener('playing', setupAnalyzer);
    return () => {
      audio.removeEventListener('play', setupAnalyzer);
      audio.removeEventListener('playing', setupAnalyzer);
    };
  }, []);

  // Sync source & play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (activeTrack) {
      if (audio.src !== activeTrack.streamUrl) {
        audio.src = activeTrack.streamUrl;
        audio.load();
        audio.playbackRate = playbackRateRef.current;
        (audio as any).preservesPitch    = false;
        (audio as any).mozPreservesPitch = false;
      }
      if (isPlaying) {
        if (!activeTrack.streamUrl) return;
        audio.play().catch(() => setPlaying(false));
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
    }
  }, [currentTrackId, activeTrack, isPlaying, setPlaying]);

  // Sync play/pause without source change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying && activeTrack) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [isPlaying, activeTrack, setPlaying]);

  // Sync volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Sync playback rate — preservesPitch=false → pitch shifts with speed
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
    (audio as any).preservesPitch    = false;
    (audio as any).mozPreservesPitch = false;
  }, [playbackRate]);

  // Apply EQ
  useEffect(() => {
    const filters: BiquadFilterNode[] | undefined = (window as any).__echoEqFilters;
    if (!filters) return;
    eqBands.forEach((gain, i) => {
      if (filters[i]) {
        filters[i].gain.value = eqEnabled ? gain : 0;
        if (eqQ[i] !== undefined) filters[i].Q.value = Math.max(0.1, eqQ[i]);
      }
    });
  }, [eqBands, eqQ, eqEnabled]);

  // Apply reverb wet/dry mix
  useEffect(() => {
    const dry: GainNode | undefined = (window as any).__echoDryGain;
    const wet: GainNode | undefined = (window as any).__echoWetGain;
    if (!dry || !wet) return;
    const t = dry.context.currentTime;
    dry.gain.setTargetAtTime(reverbEnabled ? 1.0 - reverbAmount * 0.35 : 1.0, t, 0.05);
    wet.gain.setTargetAtTime(reverbEnabled ? reverbAmount * 0.45        : 0.0, t, 0.05);
  }, [reverbEnabled, reverbAmount]);

  // Rebuild IR when room size changes
  useEffect(() => {
    const convolver: ConvolverNode | undefined = (window as any).__echoConvolver;
    const ctx: AudioContext | undefined = (window as any).__echoAudioCtx;
    if (!convolver || !ctx) return;
    convolver.buffer = buildImpulseResponse(ctx, reverbSize);
  }, [reverbSize]);

  // Update damp filter frequency
  useEffect(() => {
    const damp: BiquadFilterNode | undefined = (window as any).__echoDampFilter;
    if (!damp) return;
    damp.frequency.setTargetAtTime(20000 - reverbDamp * 17000, damp.context.currentTime, 0.05);
  }, [reverbDamp]);

  // Expose seek helper
  useEffect(() => {
    (window as any).__setAudioCurrentTime = (time: number) => {
      const audio = audioRef.current;
      if (audio) { audio.currentTime = time; setCurrentTime(time); }
    };
    return () => { delete (window as any).__setAudioCurrentTime; };
  }, [setCurrentTime]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) setCurrentTime(audio.currentTime);
  };
  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration || 0);
      audio.playbackRate = playbackRateRef.current;
      (audio as any).preservesPitch    = false;
      (audio as any).mozPreservesPitch = false;
    }
  };
  const handleEnded = () => nextTrack();

  return (
    <audio
      ref={audioRef}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      preload="auto"
      className="hidden"
    />
  );
}

import { useEffect, useRef } from 'react';
import { useStore } from '../store';

const EQ_FREQUENCIES = [60, 250, 1000, 4000, 16000];

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrackId = useStore((state) => state.currentTrackId);
  const isPlaying = useStore((state) => state.isPlaying);
  const volume = useStore((state) => state.volume);
  const isMuted = useStore((state) => state.isMuted);
  const tracks = useStore((state) => state.tracks);
  
  const setPlaying = useStore((state) => state.setPlaying);
  const setCurrentTime = useStore((state) => state.setCurrentTime);
  const setDuration = useStore((state) => state.setDuration);
  const nextTrack = useStore((state) => state.nextTrack);
  const eqBands = useStore((state) => state.eqBands);
  const eqQ = useStore((state) => (state as any).eqQ as number[]) ?? [1,1,1,1,1];
  const eqEnabled = useStore((state) => state.eqEnabled);

  const activeTrack = tracks.find(t => t.id === currentTrackId);

  // Initialize Web Audio API Analyser safely and handle CORS bounds
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.crossOrigin = 'anonymous';

    let audioCtx: AudioContext | null = null;
    let sourceNode: MediaElementAudioSourceNode | null = null;
    let analyserNode: AnalyserNode | null = null;

    const setupAnalyzer = () => {
      if (audioCtx) return;
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioCtxClass();
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 256;

        sourceNode = audioCtx.createMediaElementSource(audio);

        // Build EQ filter chain
        const { eqBands: bands, eqEnabled: enabled } = useStore.getState();
        const eqFilters = EQ_FREQUENCIES.map((freq, i) => {
          const f = audioCtx!.createBiquadFilter();
          f.type = i === 0 ? 'lowshelf' : i === EQ_FREQUENCIES.length - 1 ? 'highshelf' : 'peaking';
          f.frequency.value = freq;
          f.Q.value = 1.5;
          f.gain.value = enabled ? (bands[i] ?? 0) : 0;
          return f;
        });

        // Wire: source -> eq1..5 -> analyser -> destination
        let last: AudioNode = sourceNode;
        for (const f of eqFilters) { last.connect(f); last = f; }
        last.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);

        (window as any).__echoAnalyser = analyserNode;
        (window as any).__echoEqFilters = eqFilters;
      } catch (err) {
        console.warn('Web Audio API setup omitted/restricted:', err);
      }
    };

    // Listen on playback activation
    audio.addEventListener('play', setupAnalyzer);
    audio.addEventListener('playing', setupAnalyzer);
    
    return () => {
      audio.removeEventListener('play', setupAnalyzer);
      audio.removeEventListener('playing', setupAnalyzer);
    };
  }, []);

  // Synchronize playing & source loading safely
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (activeTrack) {
      const currentSrc = audio.src;
      // If the source has actually changed, load the new song
      if (currentSrc !== activeTrack.streamUrl) {
        audio.src = activeTrack.streamUrl;
        audio.load();
      }

      if (isPlaying) {
        // Skip play while stream URL is being resolved (avoid NotSupportedError on empty src)
        if (!activeTrack.streamUrl) return;
        audio.play().catch((err) => {
          console.warn('Playback interrupted or blocked by user guest gestures:', err);
          setPlaying(false);
        });
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
    }
  }, [currentTrackId, activeTrack, isPlaying, setPlaying]);

  // Handle Play/Pause events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying && activeTrack) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, activeTrack, setPlaying]);

  // Synchronize volume and mute states
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Event handlers callback hooks
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration || 0);
  };

  const handleEnded = () => {
    nextTrack();
  };

  // Apply EQ band changes to running filters
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

  // We expose a helper on the window object so other UI sliders can force update current time!
  useEffect(() => {
    (window as any).__setAudioCurrentTime = (time: number) => {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = time;
        setCurrentTime(time);
      }
    };
    return () => {
      delete (window as any).__setAudioCurrentTime;
    };
  }, [setCurrentTime]);

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

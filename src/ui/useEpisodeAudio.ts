import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type {StoryReaderSettings} from '../app/story-reader-settings';
import type { AudioState } from '../domain';
import { readAudioMuted, subscribeAudioMuted } from '../app/audio-preference';
import { attemptEpisodeAudioPlay, probeEpisodeAudioMedia, traceEpisodeAudio } from '../app/episode-audio-diagnostics';
import { ContinuousEpisodeAudioBus } from '../app/episode-audio-continuity';

export type UiAudioCue = 'execute' | 'result_positive' | 'result_negative' | 'result_neutral' | 'continue' | 'character_intro' | 'radio_signal' | 'pressure' | 'scene_shift';

export interface PresentationAudioCue {
  readonly fallback: UiAudioCue;
  readonly asset_id?: string;
  readonly gain?: number;
}

export interface PresentationVoiceCue {
  readonly asset_id: string;
  readonly gain?: number;
  readonly duck_gain?: number;
}

export type UiAudioTimbre = 'clean' | 'radio' | 'pressure' | 'air';

type AssetResolver = (assetId: string) => string | undefined;

const CUE_PROFILE: Readonly<Record<UiAudioCue, readonly [number, number, number]>> = {
  execute: [420, 600, 0.055],
  result_positive: [540, 820, 0.09],
  result_negative: [300, 220, 0.11],
  result_neutral: [430, 430, 0.07],
  continue: [520, 650, 0.045],
  character_intro: [360, 620, 0.085],
  radio_signal: [980, 1320, 0.075],
  pressure: [118, 82, 0.18],
  scene_shift: [250, 430, 0.15],
};

const CUE_TIMBRE: Readonly<Record<UiAudioCue, UiAudioTimbre>> = {
  execute: 'clean',
  result_positive: 'clean',
  result_negative: 'clean',
  result_neutral: 'clean',
  continue: 'clean',
  character_intro: 'clean',
  radio_signal: 'radio',
  pressure: 'pressure',
  scene_shift: 'air',
};

export function uiAudioCueProfile(cue: UiAudioCue): readonly [number, number, number] {
  return CUE_PROFILE[cue];
}

export function uiAudioCueTimbre(cue: UiAudioCue): UiAudioTimbre {
  return CUE_TIMBRE[cue];
}

function syntheticNoise(context: AudioContext, duration: number) {
  const frames = Math.max(1, Math.ceil(context.sampleRate * duration));
  const buffer = context.createBuffer(1, frames, context.sampleRate);
  const channel = buffer.getChannelData(0);
  let seed = 0x505349;
  for (let index = 0; index < frames; index += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    channel[index] = ((seed / 0xffffffff) * 2 - 1) * (1 - index / frames);
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  return source;
}

/** Presentation-only audio bridge. Authored audio remains in GameState; no game rule depends on playback. */
export function useEpisodeAudio(authoredAudio: AudioState | null | undefined, resolve: AssetResolver, options?:{paused?:boolean;settings?:StoryReaderSettings;scene?:{asset_id:string;gain:number};eventId?:string|null}) {
  const [hidden,setHidden]=useState(()=>typeof document!=='undefined'&&document.hidden);
  useEffect(()=>{const changed=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',changed);return()=>document.removeEventListener('visibilitychange',changed);},[]);
  const audio=authoredAudio?{...authoredAudio,volumes:{...authoredAudio.volumes,
    bgm:authoredAudio.volumes.bgm*(options?.settings?.music??1),
    ambience:authoredAudio.volumes.ambience*(options?.settings?.ambience??1),
    sfx:authoredAudio.volumes.sfx*(options?.settings?.effects??1),
    event:authoredAudio.volumes.event*(options?.settings?.effects??1),
  }}:authoredAudio;
  const preferenceMuted = useSyncExternalStore(subscribeAudioMuted, readAudioMuted, () => false);
  const effectiveMuted = Boolean(audio?.muted || audio?.suspended || preferenceMuted || options?.paused || hidden);
  const bgmBusRef = useRef<ContinuousEpisodeAudioBus | null>(null);
  const sceneBusRef = useRef<ContinuousEpisodeAudioBus | null>(null);
  const duckFrameRef = useRef<number | null>(null);
  const duckActualRef = useRef(1);
  const ambienceRef = useRef(new Map<string, HTMLAudioElement>());
  const presentationRef = useRef(new Set<HTMLAudioElement>());
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const voiceCleanupRef = useRef<(() => void) | null>(null);
  const seenCueIds = useRef(new Set<string>());
  const contextRef = useRef<AudioContext | null>(null);
  useEffect(() => {
    traceEpisodeAudio({ bus: 'system', signal: 'scene_change', eventId: options?.eventId ?? 'none', assetId: options?.scene?.asset_id });
  }, [options?.eventId, options?.scene?.asset_id]);
  useEffect(() => {
    traceEpisodeAudio({
      bus: 'system', signal: 'mute_change', value: effectiveMuted ? 1 : 0,
      note: hidden ? 'visibility_hidden' : options?.paused ? 'reader_paused' : 'engine_or_preference',
    });
  }, [effectiveMuted, hidden, options?.paused]);
  const stopVoice=useCallback(()=>voiceCleanupRef.current?.(),[]);
  const cancelPresentation=useCallback(()=>{for(const element of presentationRef.current)element.pause();presentationRef.current.clear();},[]);
  useEffect(()=>{if(effectiveMuted){stopVoice();cancelPresentation();}},[effectiveMuted,stopVoice,cancelPresentation]);
  useEffect(()=>{
    const unlock=()=>{if(effectiveMuted)return;
      traceEpisodeAudio({ bus: 'system', signal: 'gesture' });
      void contextRef.current?.resume().catch(()=>traceEpisodeAudio({ bus: 'ui', signal: 'resume_failed' }));
      bgmBusRef.current?.resume();
      sceneBusRef.current?.resume();
      for(const [assetId,element] of ambienceRef.current)attemptEpisodeAudioPlay(element,'ambience',assetId);
    };
    window.addEventListener('pointerdown',unlock);window.addEventListener('keydown',unlock);
    return()=>{window.removeEventListener('pointerdown',unlock);window.removeEventListener('keydown',unlock);};
  },[effectiveMuted]);

  const applyVoiceDucking = useCallback((gain: number) => {
    const duck = Math.max(0, Math.min(1, gain));
    traceEpisodeAudio({ bus: 'voice', signal: 'duck_change', value: duck });
    const ms = duck < duckActualRef.current ? 160 : 950;
    bgmBusRef.current?.setDuck(duck, ms);
    sceneBusRef.current?.setDuck(duck, ms);
    if (duckFrameRef.current !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(duckFrameRef.current);
      duckFrameRef.current = null;
    }
    const startGain = duckActualRef.current;
    const startTime = typeof performance !== 'undefined' ? performance.now() : 0;
    const paint = (value: number) => {
      duckActualRef.current = value;
      for (const element of [...ambienceRef.current.values(), ...presentationRef.current.values()]) {
        const base = Number(element.dataset.baseVolume ?? element.volume);
        if (Number.isFinite(base)) element.volume = Math.max(0, Math.min(1, base * value));
      }
    };
    if (typeof requestAnimationFrame !== 'function') { paint(duck); return; }
    const tick = (now: number) => {
      const ratio = Math.min(1, Math.max(0, (now - startTime) / ms));
      paint(startGain + (duck - startGain) * ratio);
      if (ratio < 1) duckFrameRef.current = requestAnimationFrame(tick);
      else duckFrameRef.current = null;
    };
    duckFrameRef.current = requestAnimationFrame(tick);
  }, []);

  // The transports outlive individual story scenes. Scene/score changes never
  // pause the previous deck until the incoming media is actually playing.
  useEffect(() => {
    if (typeof Audio === 'undefined') return;
    const bus = sceneBusRef.current ?? (sceneBusRef.current = new ContinuousEpisodeAudioBus('scene'));
    bus.setMuted(effectiveMuted);
    const track = options?.scene;
    const uri = track ? resolve(track.asset_id) : undefined;
    bus.transition(track && uri ? {
      assetId: track.asset_id, uri, loop: true,
      baseGain: (audio?.volumes.master ?? 1) * (audio?.volumes.ambience ?? 1) * track.gain,
    } : null, 1200);
  }, [options?.scene?.asset_id, options?.scene?.gain, effectiveMuted,
      audio?.volumes.master, audio?.volumes.ambience, resolve]);

  useEffect(() => {
    if (typeof Audio === 'undefined') return;
    const bus = bgmBusRef.current ?? (bgmBusRef.current = new ContinuousEpisodeAudioBus('bgm'));
    bus.setMuted(effectiveMuted);
    const track = audio?.bgm;
    const uri = track ? resolve(track.asset_id) : undefined;
    bus.transition(track && uri ? {
      assetId: track.asset_id, uri, loop: track.loop,
      baseGain: (audio?.volumes.master ?? 1) * (audio?.volumes.bgm ?? 1) * track.gain,
    } : null, 2300);
  }, [audio?.bgm?.asset_id, audio?.bgm?.gain, audio?.bgm?.loop,
      effectiveMuted, audio?.volumes.master, audio?.volumes.bgm, resolve]);

  useEffect(() => {
    if (typeof Audio === 'undefined') return;
    const desired = new Set<string>();
    for (const track of audio?.ambience ?? []) {
      desired.add(track.asset_id);
      const uri = resolve(track.asset_id);
      if (!uri || effectiveMuted) continue;
      let element = ambienceRef.current.get(track.asset_id);
      if (!element) {
        element = probeEpisodeAudioMedia(new Audio(uri),'ambience',track.asset_id);
        element.loop = track.loop;
        ambienceRef.current.set(track.asset_id, element);
      }
      const baseVolume = Math.max(0, Math.min(1, (audio?.volumes.master ?? 1) * (audio?.volumes.ambience ?? 1) * track.gain));
      element.dataset.baseVolume = String(baseVolume);
      element.volume = baseVolume * duckActualRef.current;
      if (element.paused) attemptEpisodeAudioPlay(element,'ambience',track.asset_id);
    }
    for (const [assetId, element] of ambienceRef.current) {
      if (!desired.has(assetId) || effectiveMuted) {
        element.pause();
        if (!desired.has(assetId)) ambienceRef.current.delete(assetId);
      }
    }
  }, [audio?.ambience, effectiveMuted, audio?.volumes.master, audio?.volumes.ambience, resolve]);

  useEffect(() => {
    if (typeof Audio === 'undefined' || !audio || effectiveMuted) return;
    const buses = [...audio.sfx_bus, ...audio.event_bus];
    for (const cue of buses) {
      if (seenCueIds.current.has(cue.cue_id)) continue;
      seenCueIds.current.add(cue.cue_id);
      const uri = resolve(cue.asset_id);
      if (!uri) continue;
      const element = probeEpisodeAudioMedia(new Audio(uri),'foley',cue.asset_id);
      presentationRef.current.add(element);
      const release=()=>presentationRef.current.delete(element);
      element.addEventListener('ended',release,{once:true});element.addEventListener('error',release,{once:true});
      const base = Math.max(0, Math.min(1, audio.volumes.master * audio.volumes.sfx));
      element.dataset.baseVolume = String(base);
      element.volume = base * duckActualRef.current;
      attemptEpisodeAudioPlay(element,'foley',cue.asset_id,release);
    }
  }, [audio?.sfx_bus, audio?.event_bus, effectiveMuted, audio?.volumes.master, audio?.volumes.sfx, resolve]);

  useEffect(() => () => {
    traceEpisodeAudio({ bus: 'system', signal: 'cleanup' });
    voiceCleanupRef.current?.();
    bgmBusRef.current?.dispose();
    sceneBusRef.current?.dispose();
    if (duckFrameRef.current !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(duckFrameRef.current);
    }
    for (const element of ambienceRef.current.values()) element.pause();
    for (const element of presentationRef.current.values()) element.pause();
    void contextRef.current?.close();
  }, []);

  const playUiCue = useCallback((cue: UiAudioCue) => {
    if (effectiveMuted || audio?.volumes.sfx===0 || typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return;
    const [startHz, endHz, duration] = CUE_PROFILE[cue];
    const timbre = CUE_TIMBRE[cue];
    const context = contextRef.current ?? new window.AudioContext();
    contextRef.current = context;
    if (context.state === 'suspended') void context.resume().catch(()=>traceEpisodeAudio({bus:'ui',signal:'resume_failed'}));

    const now = context.currentTime;
    const baseVolume = Math.max(0.006, Math.min(0.036,
      (audio?.volumes.master ?? 1) * (audio?.volumes.sfx ?? 1) * 0.026));

    const oscillator = context.createOscillator();
    const toneGain = context.createGain();
    oscillator.type = timbre === 'radio' ? 'square' : timbre === 'pressure' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(Math.max(1, startHz), now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endHz), now + duration);
    toneGain.gain.setValueAtTime(baseVolume * (timbre === 'pressure' ? 0.72 : 1), now);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(toneGain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);

    if (timbre !== 'clean') {
      const noise = syntheticNoise(context, duration);
      const filter = context.createBiquadFilter();
      const noiseGain = context.createGain();
      if (timbre === 'radio') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1450, now);
        filter.Q.setValueAtTime(1.8, now);
        noiseGain.gain.setValueAtTime(baseVolume * 0.72, now);
      } else if (timbre === 'pressure') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(240, now);
        noiseGain.gain.setValueAtTime(baseVolume * 0.55, now);
      } else {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(620, now);
        filter.Q.setValueAtTime(0.65, now);
        noiseGain.gain.setValueAtTime(baseVolume * 0.42, now);
      }
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      noise.connect(filter).connect(noiseGain).connect(context.destination);
      noise.start(now);
      noise.stop(now + duration);
    }
  }, [effectiveMuted, audio?.volumes.master, audio?.volumes.sfx]);

  const playPresentationCue = useCallback((cue: PresentationAudioCue) => {
    if (effectiveMuted) return;
    const uri = cue.asset_id ? resolve(cue.asset_id) : undefined;
    if (!uri || typeof Audio === 'undefined') {
      playUiCue(cue.fallback);
      return;
    }
    const element = probeEpisodeAudioMedia(new Audio(uri),'foley',cue.asset_id ?? 'fallback');
    const gain = cue.gain ?? 1;
    const baseVolume = Math.max(0, Math.min(1,
      (audio?.volumes.master ?? 1) * (audio?.volumes.event ?? 1) * gain));
    element.dataset.baseVolume = String(baseVolume);
    element.volume = baseVolume * duckActualRef.current;
    presentationRef.current.add(element);
    const release = () => presentationRef.current.delete(element);
    element.addEventListener('ended', release, { once: true });
    element.addEventListener('error', release, { once: true });
    let fallbackPlayed = false;
    const useFallback = () => {
      if (fallbackPlayed) return;
      fallbackPlayed = true;
      release();
      playUiCue(cue.fallback);
    };
    if (!attemptEpisodeAudioPlay(element,'foley',cue.asset_id ?? 'fallback',useFallback)) useFallback();
  }, [effectiveMuted, audio?.volumes.master, audio?.volumes.event, resolve, playUiCue]);

  const playVoiceCue = useCallback((
    cue: PresentationVoiceCue,
    onEnded?: () => void,
    onProgress?: (elapsedMs: number) => void,
  ) => {
    voiceCleanupRef.current?.();

    const uri = resolve(cue.asset_id);
    if (effectiveMuted || options?.settings?.voice === 0 || !uri || typeof Audio === 'undefined') {
      onEnded?.();
      return () => {};
    }

    const element = probeEpisodeAudioMedia(new Audio(uri),'voice',cue.asset_id);
    voiceRef.current = element;
    const baseVolume = Math.max(0, Math.min(1,
      (audio?.volumes.master ?? 1) * (options?.settings?.voice ?? 1) * (cue.gain ?? 1)));
    element.dataset.baseVolume = String(baseVolume);
    element.volume = baseVolume;

    let finished = false;
    const reportProgress = () => onProgress?.(element.currentTime * 1000);
    const finish = () => {
      if (finished) return;
      finished = true;
      element.removeEventListener('ended', finish);
      element.removeEventListener('error', finish);
      element.removeEventListener('timeupdate', reportProgress);
      if (voiceRef.current === element) voiceRef.current = null;
      if (voiceCleanupRef.current === cleanup) voiceCleanupRef.current = null;
      applyVoiceDucking(1);
      onEnded?.();
    };
    const cleanup = () => {
      element.pause();
      finish();
    };

    voiceCleanupRef.current = cleanup;
    element.addEventListener('ended', finish, { once: true });
    element.addEventListener('error', finish, { once: true });
    element.addEventListener('timeupdate', reportProgress);
    applyVoiceDucking(cue.duck_gain ?? 0.28);
    onProgress?.(0);

    // Never lock story progression when autoplay or a media source is unavailable.
    if (!attemptEpisodeAudioPlay(element,'voice',cue.asset_id,finish)) finish();
    return cleanup;
  }, [
    effectiveMuted,
    audio?.volumes.master,
    audio?.volumes.event,
    resolve,
    applyVoiceDucking,
    options?.settings?.voice,
  ]);

  return { playUiCue, playPresentationCue, playVoiceCue, stopVoice, cancelPresentation } as const;
}

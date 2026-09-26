import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import type { AudioState } from '../domain';
import { readAudioMuted, subscribeAudioMuted } from '../app/audio-preference';

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
export function useEpisodeAudio(audio: AudioState | null | undefined, resolve: AssetResolver) {
  const preferenceMuted = useSyncExternalStore(subscribeAudioMuted, readAudioMuted, () => false);
  const effectiveMuted = Boolean(audio?.muted || preferenceMuted);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const ambienceRef = useRef(new Map<string, HTMLAudioElement>());
  const presentationRef = useRef(new Set<HTMLAudioElement>());
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const voiceDuckRef = useRef(1);
  const voiceCleanupRef = useRef<(() => void) | null>(null);
  const seenCueIds = useRef(new Set<string>());
  const contextRef = useRef<AudioContext | null>(null);

  const applyVoiceDucking = useCallback((gain: number) => {
    const duck = Math.max(0, Math.min(1, gain));
    voiceDuckRef.current = duck;
    const update = (element: HTMLAudioElement | null | undefined) => {
      if (!element) return;
      const base = Number(element.dataset.baseVolume ?? element.volume);
      if (Number.isFinite(base)) element.volume = Math.max(0, Math.min(1, base * duck));
    };
    update(bgmRef.current);
    for (const element of ambienceRef.current.values()) update(element);
    for (const element of presentationRef.current.values()) update(element);
  }, []);

  useEffect(() => {
    if (typeof Audio === 'undefined') return;
    const track = audio?.bgm;
    const uri = track ? resolve(track.asset_id) : undefined;
    if (!track || !uri || effectiveMuted) {
      bgmRef.current?.pause();
      return;
    }
    if (bgmRef.current?.dataset.assetId !== track.asset_id) {
      bgmRef.current?.pause();
      const element = new Audio(uri);
      element.dataset.assetId = track.asset_id;
      bgmRef.current = element;
    }
    const element = bgmRef.current;
    if (!element) return;
    element.loop = track.loop;
    const baseVolume = Math.max(0, Math.min(1, audio.volumes.master * audio.volumes.bgm * track.gain));
    element.dataset.baseVolume = String(baseVolume);
    element.volume = baseVolume * voiceDuckRef.current;
    void element.play().catch(() => { /* browser gesture policy; retry occurs on the next state change */ });
  }, [audio?.bgm?.asset_id, audio?.bgm?.gain, audio?.bgm?.loop, effectiveMuted, audio?.volumes.master, audio?.volumes.bgm, resolve]);

  useEffect(() => {
    if (typeof Audio === 'undefined') return;
    const desired = new Set<string>();
    for (const track of audio?.ambience ?? []) {
      desired.add(track.asset_id);
      const uri = resolve(track.asset_id);
      if (!uri || effectiveMuted) continue;
      let element = ambienceRef.current.get(track.asset_id);
      if (!element) {
        element = new Audio(uri);
        element.loop = track.loop;
        ambienceRef.current.set(track.asset_id, element);
      }
      const baseVolume = Math.max(0, Math.min(1, (audio?.volumes.master ?? 1) * (audio?.volumes.ambience ?? 1) * track.gain));
      element.dataset.baseVolume = String(baseVolume);
      element.volume = baseVolume * voiceDuckRef.current;
      void element.play().catch(() => {});
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
      const element = new Audio(uri);
      element.volume = Math.max(0, Math.min(1, audio.volumes.master * audio.volumes.sfx));
      void element.play().catch(() => {});
    }
  }, [audio?.sfx_bus, audio?.event_bus, effectiveMuted, audio?.volumes.master, audio?.volumes.sfx, resolve]);

  useEffect(() => () => {
    voiceCleanupRef.current?.();
    bgmRef.current?.pause();
    for (const element of ambienceRef.current.values()) element.pause();
    for (const element of presentationRef.current.values()) element.pause();
    void contextRef.current?.close();
  }, []);

  const playUiCue = useCallback((cue: UiAudioCue) => {
    if (effectiveMuted || typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return;
    const [startHz, endHz, duration] = CUE_PROFILE[cue];
    const timbre = CUE_TIMBRE[cue];
    const context = contextRef.current ?? new window.AudioContext();
    contextRef.current = context;
    if (context.state === 'suspended') void context.resume();

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
    const element = new Audio(uri);
    const gain = cue.gain ?? 1;
    const baseVolume = Math.max(0, Math.min(1,
      (audio?.volumes.master ?? 1) * (audio?.volumes.event ?? 1) * gain));
    element.dataset.baseVolume = String(baseVolume);
    element.volume = baseVolume * voiceDuckRef.current;
    presentationRef.current.add(element);
    const release = () => presentationRef.current.delete(element);
    element.addEventListener('ended', release, { once: true });
    element.addEventListener('error', release, { once: true });
    const playback = element.play();
    if (playback && typeof playback.catch === 'function') {
      void playback.catch(() => {
        release();
        playUiCue(cue.fallback);
      });
    }
  }, [effectiveMuted, audio?.volumes.master, audio?.volumes.event, resolve, playUiCue]);

  const playVoiceCue = useCallback((
    cue: PresentationVoiceCue,
    onEnded?: () => void,
    onProgress?: (elapsedMs: number) => void,
  ) => {
    voiceCleanupRef.current?.();

    const uri = resolve(cue.asset_id);
    if (effectiveMuted || !uri || typeof Audio === 'undefined') {
      onEnded?.();
      return () => {};
    }

    const element = new Audio(uri);
    voiceRef.current = element;
    const baseVolume = Math.max(0, Math.min(1,
      (audio?.volumes.master ?? 1) * (audio?.volumes.event ?? 1) * (cue.gain ?? 1)));
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

    try {
      const playback = element.play();
      // Real browsers return a Promise. Test/hardened media environments may not
      // implement playback; never leave gameplay locked when audio cannot start.
      if (!playback || typeof playback.catch !== 'function') {
        finish();
        return cleanup;
      }
      void playback.catch(finish);
    } catch {
      finish();
    }
    return cleanup;
  }, [
    effectiveMuted,
    audio?.volumes.master,
    audio?.volumes.event,
    resolve,
    applyVoiceDucking,
  ]);

  return { playUiCue, playPresentationCue, playVoiceCue } as const;
}

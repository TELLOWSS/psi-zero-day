import { useCallback, useEffect, useRef } from 'react';
import type { DefenseRunState } from '../domain/defense';
import {
  premiumDefenseAudioRuntimeEnabled,
  premiumDefenseFieldAssets,
  premiumDefenseFieldUri,
  premiumDefenseScoreStemAssets,
  premiumDefenseScoreStemUri,
  type PremiumFieldSoundId,
  type PremiumScoreStemId,
} from '../app/defense-premium-audio';
import {
  g8aIsPremiumAudioScope,
  g8aPremiumMixSnapshot,
  type G8aPremiumMusicState,
} from '../app/g8a-premium-audio-state';

export const G8A_PREMIUM_MIX_EVENT = 'psi:g8a-premium-mix';

const SCORE_CROSSFADE_MS = 420;
const FIELD_CROSSFADE_MS = 260;

function dbToGain(db: number): number {
  return Math.max(0, Math.min(1, Math.pow(10, db / 20)));
}

function safePlay(element: HTMLAudioElement): void {
  const playback = element.play();
  if (playback && typeof playback.catch === 'function') void playback.catch(() => {});
}

export function useG8aPremiumMix(
  state: DefenseRunState | null,
  mapId: string | null | undefined,
  muted: boolean,
) {
  const armedRef = useRef(false);
  const elementsRef = useRef(new Map<string, HTMLAudioElement>());
  const fadeTimersRef = useRef(new Map<string, number>());
  const previousMixStateRef = useRef<G8aPremiumMusicState | null>(null);

  const enabled = premiumDefenseAudioRuntimeEnabled() && g8aIsPremiumAudioScope(mapId);

  const stopFade = useCallback((id: string) => {
    const timer = fadeTimersRef.current.get(id);
    if (timer !== undefined) window.clearInterval(timer);
    fadeTimersRef.current.delete(id);
  }, []);

  const fadeTo = useCallback((id: string, target: number, durationMs: number) => {
    const element = elementsRef.current.get(id);
    if (!element) return;
    stopFade(id);
    const start = element.volume;
    const clamped = Math.max(0, Math.min(1, target));
    if (Math.abs(start - clamped) < 0.005 || durationMs <= 0) {
      element.volume = clamped;
      return;
    }
    const started = performance.now();
    const timer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - started) / durationMs);
      element.volume = start + (clamped - start) * progress;
      if (progress >= 1) stopFade(id);
    }, 24);
    fadeTimersRef.current.set(id, timer);
  }, [stopFade]);

  const ensureElements = useCallback(() => {
    if (!enabled || typeof Audio === 'undefined') return;

    for (const asset of premiumDefenseScoreStemAssets()) {
      if (!asset.loop || elementsRef.current.has(asset.id)) continue;
      const audio = new Audio(asset.uri);
      audio.preload = 'auto';
      audio.loop = true;
      audio.volume = 0;
      elementsRef.current.set(asset.id, audio);
    }

    for (const asset of premiumDefenseFieldAssets()) {
      if (elementsRef.current.has(asset.id)) continue;
      const audio = new Audio(asset.uri);
      audio.preload = 'auto';
      audio.loop = asset.loop;
      audio.volume = 0;
      elementsRef.current.set(asset.id, audio);
    }
  }, [enabled]);

  const playFieldOneShot = useCallback((id: PremiumFieldSoundId, volume = 0.7) => {
    if (!enabled || muted || !armedRef.current || typeof Audio === 'undefined') return;
    const uri = premiumDefenseFieldUri(id);
    if (!uri) return;
    const audio = new Audio(uri);
    audio.preload = 'auto';
    audio.loop = false;
    audio.volume = Math.max(0, Math.min(1, volume));
    safePlay(audio);
  }, [enabled, muted]);

  const playScoreOneShot = useCallback((id: PremiumScoreStemId, volume = 0.7) => {
    if (!enabled || muted || !armedRef.current || typeof Audio === 'undefined') return;
    const uri = premiumDefenseScoreStemUri(id);
    if (!uri) return;
    const audio = new Audio(uri);
    audio.preload = 'auto';
    audio.loop = false;
    audio.volume = Math.max(0, Math.min(1, volume));
    safePlay(audio);
  }, [enabled, muted]);

  const startLoop = useCallback((id: string) => {
    const element = elementsRef.current.get(id);
    if (!element) return;
    if (element.paused) safePlay(element);
  }, []);

  const pauseAll = useCallback(() => {
    for (const id of fadeTimersRef.current.keys()) stopFade(id);
    for (const element of elementsRef.current.values()) {
      element.pause();
      element.volume = 0;
    }
  }, [stopFade]);

  const arm = useCallback(() => {
    armedRef.current = true;
    if (!enabled || muted) return;
    ensureElements();
    for (const asset of premiumDefenseScoreStemAssets()) if (asset.loop) startLoop(asset.id);
    for (const id of ['field.excavation_world', 'field.excavator_hydraulic'] as const) startLoop(id);
  }, [enabled, ensureElements, muted, startLoop]);

  useEffect(() => {
    if (!enabled || muted || !armedRef.current || !state) {
      pauseAll();
      previousMixStateRef.current = null;
      return;
    }

    ensureElements();
    const mix = g8aPremiumMixSnapshot(state);
    const scoreAssets = premiumDefenseScoreStemAssets();
    const activeLoopIds = mix.activeScoreIds.filter(id => scoreAssets.find(asset => asset.id === id)?.loop);
    const activeCount = Math.max(1, activeLoopIds.length);
    const musicBusGain = dbToGain(mix.musicGainDb + mix.duckMusicDb);
    const perStemGain = musicBusGain / Math.sqrt(activeCount);
    const crossfadeMs = mix.state === 'CONTROL_INTERVENTION'
      ? Math.max(40, mix.duckAttackMs)
      : SCORE_CROSSFADE_MS;

    for (const asset of scoreAssets) {
      if (!asset.loop) continue;
      startLoop(asset.id);
      fadeTo(asset.id, activeLoopIds.includes(asset.id) ? perStemGain : 0, crossfadeMs);
    }

    startLoop('field.excavation_world');
    startLoop('field.excavator_hydraulic');
    fadeTo('field.excavation_world', 0.34, FIELD_CROSSFADE_MS);
    fadeTo('field.excavator_hydraulic', 0.17, FIELD_CROSSFADE_MS);

    for (const id of ['swift.engine_loop', 'swift.reverse_alarm'] as const) startLoop(id);
    fadeTo('swift.engine_loop', mix.swiftPresent ? 0.36 : 0, FIELD_CROSSFADE_MS);
    fadeTo('swift.reverse_alarm', mix.swiftPresent ? 0.48 : 0, 120);

    const previous = previousMixStateRef.current;
    if (mix.state !== previous) {
      if (mix.state === 'SWIFT_THREAT') playFieldOneShot('swift.gravel_tire', 0.58);
      if (mix.state === 'CONTROL_INTERVENTION') {
        playScoreOneShot('score.control_intervention', 0.76);
        playFieldOneShot('swift.airbrake', 0.82);
        playFieldOneShot('control.radio_stop', 0.68);
        playFieldOneShot('control.barrier_clack', 0.64);
      }
      if (mix.state === 'RESOLUTION') {
        playScoreOneShot('score.resolution_coda', 0.68);
      }
      window.dispatchEvent(new CustomEvent(G8A_PREMIUM_MIX_EVENT, {
        detail: {
          previousState: previous,
          state: mix.state,
          activeScoreIds: mix.activeScoreIds,
          musicGainDb: mix.musicGainDb,
          duckMusicDb: mix.duckMusicDb,
          swiftPresent: mix.swiftPresent,
          controlIntervening: mix.controlIntervening,
          source: 'premium-binary',
        },
      }));
      previousMixStateRef.current = mix.state;
    }
  }, [enabled, ensureElements, fadeTo, muted, pauseAll, playFieldOneShot, playScoreOneShot, startLoop, state]);

  useEffect(() => () => {
    pauseAll();
    elementsRef.current.clear();
    previousMixStateRef.current = null;
    armedRef.current = false;
  }, [pauseAll]);

  return {
    enabled,
    arm,
    currentState: state ? g8aPremiumMixSnapshot(state).state : 'READY',
  } as const;
}

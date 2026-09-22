import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { readAudioMuted, setAudioMuted, subscribeAudioMuted } from '../app/audio-preference';
import type { DefenseRunState } from '../domain/defense';

export type DefenseAudioCue =
  | 'select'
  | 'place'
  | 'upgrade'
  | 'sell'
  | 'warning'
  | 'single_resolve'
  | 'area_resolve'
  | 'leak'
  | 'support'
  | 'win'
  | 'loss';

export interface DefenseAudioProfile {
  readonly startHz: number;
  readonly endHz: number;
  readonly durationMs: number;
  readonly oscillator: OscillatorType;
  readonly gain: number;
}

export const DEFENSE_RESOLVE_AUDIO_MIN_TICKS = 2;
export const DEFENSE_AUDIO_MAX_VOICES = 12;

const PROFILES: Readonly<Record<DefenseAudioCue, DefenseAudioProfile>> = {
  select: { startHz: 420, endHz: 560, durationMs: 55, oscillator: 'sine', gain: 0.018 },
  place: { startHz: 330, endHz: 520, durationMs: 75, oscillator: 'triangle', gain: 0.024 },
  upgrade: { startHz: 470, endHz: 860, durationMs: 120, oscillator: 'sine', gain: 0.027 },
  sell: { startHz: 520, endHz: 310, durationMs: 85, oscillator: 'triangle', gain: 0.019 },
  warning: { startHz: 210, endHz: 430, durationMs: 150, oscillator: 'triangle', gain: 0.026 },
  single_resolve: { startHz: 840, endHz: 610, durationMs: 42, oscillator: 'square', gain: 0.008 },
  area_resolve: { startHz: 390, endHz: 190, durationMs: 95, oscillator: 'triangle', gain: 0.014 },
  leak: { startHz: 160, endHz: 92, durationMs: 135, oscillator: 'triangle', gain: 0.031 },
  support: { startHz: 350, endHz: 790, durationMs: 175, oscillator: 'sine', gain: 0.03 },
  win: { startHz: 520, endHz: 920, durationMs: 250, oscillator: 'sine', gain: 0.032 },
  loss: { startHz: 230, endHz: 105, durationMs: 270, oscillator: 'triangle', gain: 0.032 },
};

export const DEFENSE_AUDIO_CUE_EVENT = 'psi:defense-audio-cue';

export function defenseAudioCueProfile(cue: DefenseAudioCue): DefenseAudioProfile {
  return PROFILES[cue];
}

export function defenseResolveCues(previous: DefenseRunState, current: DefenseRunState): readonly ('single_resolve' | 'area_resolve')[] {
  let single = false;
  let area = false;
  for (const tower of current.towers) {
    const before = previous.towers.find(item => item.id === tower.id);
    if (!before || tower.attackCooldown <= before.attackCooldown) continue;
    if (tower.towerId === 'BURST') area = true;
    else single = true;
  }
  return [...(single ? ['single_resolve' as const] : []), ...(area ? ['area_resolve' as const] : [])];
}

export function useDefenseAudio(state: DefenseRunState | null) {
  const muted = useSyncExternalStore(subscribeAudioMuted, readAudioMuted, () => false);
  const contextRef = useRef<AudioContext | null>(null);
  const previousRef = useRef<DefenseRunState | null>(null);
  const armedRef = useRef(false);
  const activeVoicesRef = useRef(0);
  const lastResolveTickRef = useRef<Record<'single_resolve' | 'area_resolve', number>>({
    single_resolve: -9999,
    area_resolve: -9999,
  });

  const ensureContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return null;
    const context = contextRef.current ?? new window.AudioContext();
    contextRef.current = context;
    if (context.state === 'suspended') void context.resume();
    return context;
  }, []);

  const armAudio = useCallback(() => {
    armedRef.current = true;
    if (!muted) ensureContext();
  }, [ensureContext, muted]);

  const playCue = useCallback((cue: DefenseAudioCue) => {
    if (!armedRef.current || muted || typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(DEFENSE_AUDIO_CUE_EVENT, { detail: { cue } }));
    const context = ensureContext();
    if (!context || activeVoicesRef.current >= DEFENSE_AUDIO_MAX_VOICES) return;

    const profile = PROFILES[cue];
    const now = context.currentTime;
    const duration = profile.durationMs / 1000;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    activeVoicesRef.current += 1;
    oscillator.type = profile.oscillator;
    oscillator.frequency.setValueAtTime(profile.startHz, now);
    oscillator.frequency.exponentialRampToValueAtTime(profile.endHz, now + duration);
    gain.gain.setValueAtTime(profile.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.addEventListener('ended', () => {
      activeVoicesRef.current = Math.max(0, activeVoicesRef.current - 1);
    }, { once: true });
    oscillator.start(now);
    oscillator.stop(now + duration);
  }, [ensureContext, muted]);

  useEffect(() => {
    const previous = previousRef.current;
    if (!state) {
      previousRef.current = null;
      return;
    }
    if (!previous || previous.runId !== state.runId) {
      previousRef.current = state;
      return;
    }

    if (previous.status !== 'RUNNING' && state.status === 'RUNNING') playCue('warning');
    if (state.shield < previous.shield) playCue('leak');
    if (state.supportCooldownRemaining > previous.supportCooldownRemaining) playCue('support');
    if (previous.status !== 'WON' && state.status === 'WON') playCue('win');
    if (previous.status !== 'LOST' && state.status === 'LOST') playCue('loss');

    for (const cue of defenseResolveCues(previous, state)) {
      if (state.tick - lastResolveTickRef.current[cue] < DEFENSE_RESOLVE_AUDIO_MIN_TICKS) continue;
      lastResolveTickRef.current[cue] = state.tick;
      playCue(cue);
    }

    previousRef.current = state;
  }, [playCue, state]);

  useEffect(() => {
    const onVisibility = () => {
      const context = contextRef.current;
      if (document.hidden && context?.state === 'running') void context.suspend();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => () => {
    armedRef.current = false;
    const context = contextRef.current;
    contextRef.current = null;
    activeVoicesRef.current = 0;
    if (context) void context.close();
  }, []);

  return { muted, setMuted: setAudioMuted, armAudio, playCue } as const;
}

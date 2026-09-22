import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { readAudioMuted, setAudioMuted, subscribeAudioMuted } from '../app/audio-preference';
import type { DefenseRunState } from '../domain/defense';

export type DefenseAudioCue =
  | 'select'
  | 'place'
  | 'upgrade'
  | 'sell'
  | 'wave_start'
  | 'attack'
  | 'shield_hit'
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

export const DEFENSE_ATTACK_AUDIO_MIN_TICKS = 2;

const PROFILES: Readonly<Record<DefenseAudioCue, DefenseAudioProfile>> = {
  select: { startHz: 420, endHz: 560, durationMs: 55, oscillator: 'sine', gain: 0.018 },
  place: { startHz: 330, endHz: 520, durationMs: 75, oscillator: 'triangle', gain: 0.024 },
  upgrade: { startHz: 470, endHz: 860, durationMs: 120, oscillator: 'sine', gain: 0.027 },
  sell: { startHz: 520, endHz: 310, durationMs: 85, oscillator: 'triangle', gain: 0.019 },
  wave_start: { startHz: 210, endHz: 430, durationMs: 150, oscillator: 'triangle', gain: 0.026 },
  attack: { startHz: 840, endHz: 610, durationMs: 42, oscillator: 'square', gain: 0.008 },
  shield_hit: { startHz: 160, endHz: 92, durationMs: 135, oscillator: 'triangle', gain: 0.031 },
  support: { startHz: 350, endHz: 790, durationMs: 175, oscillator: 'sine', gain: 0.03 },
  win: { startHz: 520, endHz: 920, durationMs: 250, oscillator: 'sine', gain: 0.032 },
  loss: { startHz: 230, endHz: 105, durationMs: 270, oscillator: 'triangle', gain: 0.032 },
};

export const DEFENSE_AUDIO_CUE_EVENT = 'psi:defense-audio-cue';

export function defenseAudioCueProfile(cue: DefenseAudioCue): DefenseAudioProfile {
  return PROFILES[cue];
}

function towerFired(previous: DefenseRunState, current: DefenseRunState): boolean {
  return current.towers.some(tower => {
    const before = previous.towers.find(item => item.id === tower.id);
    return Boolean(before && tower.attackCooldown > before.attackCooldown);
  });
}

export function useDefenseAudio(state: DefenseRunState | null) {
  const muted = useSyncExternalStore(subscribeAudioMuted, readAudioMuted, () => false);
  const contextRef = useRef<AudioContext | null>(null);
  const previousRef = useRef<DefenseRunState | null>(null);
  const lastAttackTickRef = useRef(-9999);

  const playCue = useCallback((cue: DefenseAudioCue) => {
    if (muted || typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(DEFENSE_AUDIO_CUE_EVENT, { detail: { cue } }));
    if (typeof window.AudioContext === 'undefined') return;

    const profile = PROFILES[cue];
    const context = contextRef.current ?? new window.AudioContext();
    contextRef.current = context;
    if (context.state === 'suspended') void context.resume();

    const now = context.currentTime;
    const duration = profile.durationMs / 1000;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = profile.oscillator;
    oscillator.frequency.setValueAtTime(profile.startHz, now);
    oscillator.frequency.exponentialRampToValueAtTime(profile.endHz, now + duration);
    gain.gain.setValueAtTime(profile.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }, [muted]);

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

    if (previous.status !== 'RUNNING' && state.status === 'RUNNING') playCue('wave_start');
    if (state.shield < previous.shield) playCue('shield_hit');
    if (state.supportCooldownRemaining > previous.supportCooldownRemaining) playCue('support');
    if (previous.status !== 'WON' && state.status === 'WON') playCue('win');
    if (previous.status !== 'LOST' && state.status === 'LOST') playCue('loss');

    if (
      state.tick - lastAttackTickRef.current >= DEFENSE_ATTACK_AUDIO_MIN_TICKS
      && towerFired(previous, state)
    ) {
      lastAttackTickRef.current = state.tick;
      playCue('attack');
    }

    previousRef.current = state;
  }, [playCue, state]);

  useEffect(() => () => {
    const context = contextRef.current;
    contextRef.current = null;
    if (context) void context.close();
  }, []);

  return {
    muted,
    setMuted: setAudioMuted,
    playCue,
  } as const;
}

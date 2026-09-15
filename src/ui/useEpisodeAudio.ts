import { useCallback, useEffect, useRef } from 'react';
import type { AudioState } from '../domain';

export type UiAudioCue = 'execute' | 'result_positive' | 'result_negative' | 'result_neutral' | 'continue';

type AssetResolver = (assetId: string) => string | undefined;

const CUE_PROFILE: Readonly<Record<UiAudioCue, readonly [number, number, number]>> = {
  execute: [420, 600, 0.055],
  result_positive: [540, 820, 0.09],
  result_negative: [300, 220, 0.11],
  result_neutral: [430, 430, 0.07],
  continue: [520, 650, 0.045],
};

export function uiAudioCueProfile(cue: UiAudioCue): readonly [number, number, number] {
  return CUE_PROFILE[cue];
}

/** Presentation-only audio bridge. Authored audio remains in GameState; no game rule depends on playback. */
export function useEpisodeAudio(audio: AudioState | null | undefined, resolve: AssetResolver) {
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const ambienceRef = useRef(new Map<string, HTMLAudioElement>());
  const seenCueIds = useRef(new Set<string>());
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof Audio === 'undefined') return;
    const track = audio?.bgm;
    const uri = track ? resolve(track.asset_id) : undefined;
    if (!track || !uri || audio?.muted) {
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
    element.volume = Math.max(0, Math.min(1, audio.volumes.master * audio.volumes.bgm * track.gain));
    void element.play().catch(() => { /* browser gesture policy; retry occurs on the next state change */ });
  }, [audio?.bgm?.asset_id, audio?.bgm?.gain, audio?.bgm?.loop, audio?.muted, audio?.volumes.master, audio?.volumes.bgm, resolve]);

  useEffect(() => {
    if (typeof Audio === 'undefined') return;
    const desired = new Set<string>();
    for (const track of audio?.ambience ?? []) {
      desired.add(track.asset_id);
      const uri = resolve(track.asset_id);
      if (!uri || audio?.muted) continue;
      let element = ambienceRef.current.get(track.asset_id);
      if (!element) {
        element = new Audio(uri);
        element.loop = track.loop;
        ambienceRef.current.set(track.asset_id, element);
      }
      element.volume = Math.max(0, Math.min(1, (audio?.volumes.master ?? 1) * (audio?.volumes.ambience ?? 1) * track.gain));
      void element.play().catch(() => {});
    }
    for (const [assetId, element] of ambienceRef.current) {
      if (!desired.has(assetId) || audio?.muted) {
        element.pause();
        if (!desired.has(assetId)) ambienceRef.current.delete(assetId);
      }
    }
  }, [audio?.ambience, audio?.muted, audio?.volumes.master, audio?.volumes.ambience, resolve]);

  useEffect(() => {
    if (typeof Audio === 'undefined' || !audio || audio.muted) return;
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
  }, [audio?.sfx_bus, audio?.event_bus, audio?.muted, audio?.volumes.master, audio?.volumes.sfx, resolve]);

  useEffect(() => () => {
    bgmRef.current?.pause();
    for (const element of ambienceRef.current.values()) element.pause();
    void contextRef.current?.close();
  }, []);

  const playUiCue = useCallback((cue: UiAudioCue) => {
    if (audio?.muted || typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return;
    const [startHz, endHz, duration] = CUE_PROFILE[cue];
    const context = contextRef.current ?? new window.AudioContext();
    contextRef.current = context;
    if (context.state === 'suspended') void context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const volume = Math.max(0.008, Math.min(0.035, (audio?.volumes.master ?? 1) * (audio?.volumes.sfx ?? 1) * 0.025));
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(startHz, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endHz), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }, [audio?.muted, audio?.volumes.master, audio?.volumes.sfx]);

  return { playUiCue } as const;
}

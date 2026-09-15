import { useCallback, useEffect, useRef } from 'react';
import type { AudioState } from '../domain';
import audioPlan from '../../content/episode01/audio.json';

export type UiAudioCue = 'execute' | 'result_positive' | 'result_negative' | 'result_neutral' | 'continue';

type AssetResolver = (assetId: string) => string | undefined;

const CUE_PROFILE: Readonly<Record<UiAudioCue, readonly [number, number, number]>> = {
  execute: [420, 600, 0.055],
  result_positive: [540, 820, 0.09],
  result_negative: [300, 220, 0.11],
  result_neutral: [430, 430, 0.07],
  continue: [520, 650, 0.045],
};

const UI_CUE_ASSET_IDS = audioPlan.ui_cues as Readonly<Record<UiAudioCue, string>>;

export function uiAudioCueProfile(cue: UiAudioCue): readonly [number, number, number] {
  return CUE_PROFILE[cue];
}

export function uiAudioAssetId(cue: UiAudioCue): string {
  return UI_CUE_ASSET_IDS[cue];
}

function playElement(element: HTMLAudioElement, onReject: () => void = () => {}) {
  try {
    const playback = element.play() as Promise<void> | undefined;
    if (playback && typeof playback.catch === 'function') void playback.catch(onReject);
  } catch {
    onReject();
  }
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
    if (!track || !uri || audio?.muted || audio?.suspended) {
      bgmRef.current?.pause();
      return;
    }
    if (bgmRef.current?.dataset.assetId !== track.asset_id) {
      bgmRef.current?.pause();
      const element = new Audio(uri);
      element.dataset.assetId = track.asset_id;
      element.preload = 'auto';
      bgmRef.current = element;
    }
    const element = bgmRef.current;
    if (!element) return;
    element.loop = track.loop;
    element.volume = Math.max(0, Math.min(1, audio.volumes.master * audio.volumes.bgm * track.gain));
    playElement(element);
  }, [audio?.bgm?.asset_id, audio?.bgm?.gain, audio?.bgm?.loop, audio?.muted, audio?.suspended, audio?.volumes.master, audio?.volumes.bgm, resolve]);

  useEffect(() => {
    if (typeof Audio === 'undefined') return;
    const desired = new Set<string>();
    for (const track of audio?.ambience ?? []) {
      desired.add(track.asset_id);
      const uri = resolve(track.asset_id);
      if (!uri || audio?.muted || audio?.suspended) continue;
      let element = ambienceRef.current.get(track.asset_id);
      if (!element) {
        element = new Audio(uri);
        element.loop = track.loop;
        element.preload = 'auto';
        ambienceRef.current.set(track.asset_id, element);
      }
      element.volume = Math.max(0, Math.min(1, (audio?.volumes.master ?? 1) * (audio?.volumes.ambience ?? 1) * track.gain));
      playElement(element);
    }
    for (const [assetId, element] of ambienceRef.current) {
      if (!desired.has(assetId) || audio?.muted || audio?.suspended) {
        element.pause();
        if (!desired.has(assetId)) ambienceRef.current.delete(assetId);
      }
    }
  }, [audio?.ambience, audio?.muted, audio?.suspended, audio?.volumes.master, audio?.volumes.ambience, resolve]);

  useEffect(() => {
    if (typeof Audio === 'undefined' || !audio || audio.muted || audio.suspended) return;
    const buses = [...audio.sfx_bus, ...audio.event_bus];
    for (const cue of buses) {
      if (seenCueIds.current.has(cue.cue_id)) continue;
      seenCueIds.current.add(cue.cue_id);
      const uri = resolve(cue.asset_id);
      if (!uri) continue;
      const element = new Audio(uri);
      element.preload = 'auto';
      element.volume = Math.max(0, Math.min(1, audio.volumes.master * audio.volumes.sfx));
      playElement(element);
    }
  }, [audio?.sfx_bus, audio?.event_bus, audio?.muted, audio?.suspended, audio?.volumes.master, audio?.volumes.sfx, resolve]);

  useEffect(() => () => {
    bgmRef.current?.pause();
    for (const element of ambienceRef.current.values()) element.pause();
    void contextRef.current?.close();
  }, []);

  const playFallbackCue = useCallback((cue: UiAudioCue) => {
    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return;
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
  }, [audio?.volumes.master, audio?.volumes.sfx]);

  const playUiCue = useCallback((cue: UiAudioCue) => {
    if (audio?.muted || audio?.suspended) return;
    const uri = resolve(uiAudioAssetId(cue));
    if (uri && typeof Audio !== 'undefined') {
      const element = new Audio(uri);
      element.preload = 'auto';
      element.volume = Math.max(0, Math.min(1, (audio?.volumes.master ?? 1) * (audio?.volumes.sfx ?? 1)));
      playElement(element, () => playFallbackCue(cue));
      return;
    }
    playFallbackCue(cue);
  }, [audio?.muted, audio?.suspended, audio?.volumes.master, audio?.volumes.sfx, playFallbackCue, resolve]);

  return { playUiCue } as const;
}

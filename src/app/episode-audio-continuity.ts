/**
 * EP01 presentation transport (not gameplay state).
 * Two decks overlap while the incoming media starts; the outgoing deck stays
 * audible until playback readiness is confirmed. No browser storage or network calls.
 */
import { attemptEpisodeAudioPlay, probeEpisodeAudioMedia, traceEpisodeAudio } from './episode-audio-diagnostics';

export type ContinuousBusName = 'scene' | 'bgm';

export interface ContinuousTrack {
  readonly assetId: string;
  readonly uri: string;
  readonly baseGain: number;
  readonly loop: boolean;
}

export interface AudioFrameClock {
  now(): number;
  frame(callback: () => void): number;
  cancel(id: number): void;
}

type Deck = {
  readonly audio: HTMLAudioElement;
  readonly assetId: string;
  baseGain: number;
  gainFrom: number;
  gainTarget: number;
  gainSince: number;
  gainDuration: number;
  mix: number;
  from: number;
  target: number;
  since: number;
  duration: number;
};

const clamp = (value: number): number => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

const browserClock: AudioFrameClock = {
  now: () => typeof performance !== 'undefined' ? performance.now() : Date.now(),
  frame: callback => typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame(callback) : setTimeout(callback, 16) as unknown as number,
  cancel: id => {
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id);
    else clearTimeout(id);
  },
};

export class ContinuousEpisodeAudioBus {
  private active: Deck | null = null;
  private outgoing: Deck | null = null;
  private pending: Deck | null = null;
  private muted = false;
  private duck = 1;
  private duckFrom = 1;
  private duckTo = 1;
  private duckSince = 0;
  private duckDuration = 0;
  private frameId: number | null = null;
  private disposed = false;

  constructor(
    private readonly bus: ContinuousBusName,
    private readonly createAudio: (uri: string) => HTMLAudioElement = uri => new Audio(uri),
    private readonly clock: AudioFrameClock = browserClock,
  ) {}

  private deck(track: ContinuousTrack): Deck {
    const audio = probeEpisodeAudioMedia(this.createAudio(track.uri), this.bus, track.assetId);
    audio.dataset.assetId = track.assetId;
    audio.loop = track.loop;
    audio.preload = 'auto';
    // Never let a pending deck produce a full-volume transient before its first fade frame.
    audio.volume = 0;
    return { audio, assetId: track.assetId, baseGain: clamp(track.baseGain),
      gainFrom: clamp(track.baseGain), gainTarget: clamp(track.baseGain),
      gainSince: this.clock.now(), gainDuration: 0, mix: 0,
      from: 0, target: 0, since: this.clock.now(), duration: 0 };
  }

  private changeMix(deck: Deck, target: number, duration: number): void {
    deck.from = deck.mix;
    deck.target = clamp(target);
    deck.since = this.clock.now();
    deck.duration = Math.max(0, duration);
    if (!duration) deck.mix = deck.target;
    this.paint(deck);
    this.schedule();
  }

  private paint(deck: Deck): void {
    const target = clamp(deck.baseGain * deck.mix * this.duck);
    if (Math.abs(deck.audio.volume - target) > 0.0005) deck.audio.volume = target;
    deck.audio.dataset.baseVolume = String(deck.baseGain);
  }

  private step = (): void => {
    this.frameId = null;
    if (this.disposed) return;
    const now = this.clock.now();
    const duckProgress = this.duckDuration ? Math.min(1, (now - this.duckSince) / this.duckDuration) : 1;
    this.duck = clamp(this.duckFrom + (this.duckTo - this.duckFrom) * duckProgress);
    let changing = duckProgress < 1;
    for (const deck of [this.active, this.outgoing, this.pending]) {
      if (!deck) continue;
      const progress = deck.duration ? Math.min(1, Math.max(0, (now - deck.since) / deck.duration)) : 1;
      deck.mix = clamp(deck.from + (deck.target - deck.from) * progress);
      const gainProgress = deck.gainDuration
        ? Math.min(1, Math.max(0, (now - deck.gainSince) / deck.gainDuration)) : 1;
      deck.baseGain = clamp(deck.gainFrom + (deck.gainTarget - deck.gainFrom) * gainProgress);
      this.paint(deck);
      if (progress < 1 || gainProgress < 1) changing = true;
    }
    if (this.outgoing && this.outgoing.mix === 0) {
      this.outgoing.audio.pause();
      this.outgoing = null;
    }
    if (changing) this.schedule();
  };

  private schedule(): void {
    if (this.disposed || this.muted || this.frameId !== null) return;
    this.frameId = this.clock.frame(this.step);
  }

  /** Repeated IDs keep currentTime; the old deck fades only after the new one plays. */
  transition(track: ContinuousTrack | null, fadeMs: number): void {
    if (this.disposed) return;
    if (!track) {
      this.pending?.audio.pause();
      this.pending = null;
      if (this.outgoing) { this.outgoing.audio.pause(); this.outgoing = null; }
      if (this.active) {
        this.outgoing = this.active;
        this.active = null;
        if (this.muted) { this.outgoing.audio.pause(); this.outgoing = null; }
        else this.changeMix(this.outgoing, 0, fadeMs);
      }
      return;
    }
    if (this.active?.assetId === track.assetId) {
      const active = this.active;
      active.audio.loop = track.loop;
      const target = clamp(track.baseGain);
      if (Math.abs(active.gainTarget - target) > 0.0005) {
        active.gainFrom = active.baseGain;
        active.gainTarget = target;
        active.gainSince = this.clock.now();
        active.gainDuration = Math.min(650, Math.max(180, fadeMs * 0.4));
        this.schedule();
      }
      this.resume();
      return;
    }
    if (this.pending?.assetId === track.assetId) {
      const pending = this.pending;
      pending.baseGain = pending.gainFrom = pending.gainTarget = clamp(track.baseGain);
      pending.audio.loop = track.loop;
      return;
    }
    this.pending?.audio.pause();
    const incoming = this.deck(track);
    this.pending = incoming;
    if (this.muted) return;

    let settled = false;
    const onStarted = () => {
      if (settled || this.disposed || this.pending !== incoming || this.muted) return;
      settled = true;
      this.pending = null;
      if (this.outgoing) this.outgoing.audio.pause();
      this.outgoing = this.active;
      this.active = incoming;
      // First scene starts without a silent ramp. Real transitions crossfade.
      this.changeMix(incoming, 1, this.outgoing ? fadeMs : 0);
      if (this.outgoing) this.changeMix(this.outgoing, 0, fadeMs);
      traceEpisodeAudio({ bus: this.bus, signal: 'scene_change', assetId: incoming.assetId,
        note: this.outgoing ? 'crossfade' : 'first-start' });
    };
    const onFailure = () => {
      if (settled || this.pending !== incoming) return;
      settled = true;
      this.pending = null;
      incoming.audio.pause();
      traceEpisodeAudio({ bus: this.bus, signal: 'error', assetId: incoming.assetId,
        note: 'incoming-failed-retaining-outgoing' });
    };
    if (!attemptEpisodeAudioPlay(incoming.audio, this.bus, incoming.assetId, onFailure, onStarted)) onFailure();
  }

  /** Voice attack 160ms, release 950ms by default; never immediately restore volume. */
  setDuck(target: number, durationMs: number): void {
    if (this.disposed) return;
    this.stepForDuck();
    this.duckFrom = this.duck;
    this.duckTo = clamp(target);
    this.duckSince = this.clock.now();
    this.duckDuration = Math.max(0, durationMs);
    if (!durationMs) this.duck = this.duckTo;
    for (const deck of [this.active, this.outgoing, this.pending]) if (deck) this.paint(deck);
    this.schedule();
  }

  private stepForDuck(): void {
    const progress = this.duckDuration
      ? Math.min(1, Math.max(0, (this.clock.now() - this.duckSince) / this.duckDuration)) : 1;
    this.duck = clamp(this.duckFrom + (this.duckTo - this.duckFrom) * progress);
  }

  setMuted(muted: boolean): void {
    if (this.disposed || this.muted === muted) return;
    this.muted = muted;
    if (muted) {
      if (this.frameId !== null) this.clock.cancel(this.frameId);
      this.frameId = null;
      for (const deck of [this.active, this.outgoing, this.pending]) deck?.audio.pause();
      // Never resume partially expired crossfades after an app background/foreground.
      this.outgoing = null;
      return;
    }
    this.resume();
  }

  resume(): void {
    if (this.disposed || this.muted) return;
    if (this.active?.audio.paused) {
      attemptEpisodeAudioPlay(this.active.audio, this.bus, this.active.assetId);
    }
    // A transition requested while backgrounded is reattempted after user gesture.
    if (this.pending) {
      const pending = this.pending;
      this.pending = null;
      this.transition({
        assetId: pending.assetId, uri: pending.audio.src,
        baseGain: pending.baseGain, loop: pending.audio.loop,
      }, 1100);
      pending.audio.pause();
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.frameId !== null) this.clock.cancel(this.frameId);
    for (const deck of [this.active, this.outgoing, this.pending]) deck?.audio.pause();
    this.active = this.outgoing = this.pending = null;
  }

  inspect(): { active: string | null; outgoing: string | null; pending: string | null; duck: number } {
    return {
      active: this.active?.assetId ?? null,
      outgoing: this.outgoing?.assetId ?? null,
      pending: this.pending?.assetId ?? null,
      duck: this.duck,
    };
  }
}

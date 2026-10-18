/**
 * EP01 audio QA probe.
 * Opt-in only: add ?ep01AudioDebug=1 to the preview URL.
 * Never sends telemetry to a server or writes to persistent browser storage.
 */
export type EpisodeAudioBus = 'scene' | 'bgm' | 'ambience' | 'foley' | 'voice' | 'ui' | 'system';
export type EpisodeAudioSignal =
  | 'created' | 'play_attempt' | 'play_rejected' | 'play_unavailable'
  | 'loadstart' | 'loadeddata' | 'canplay' | 'play' | 'playing'
  | 'pause' | 'waiting' | 'stalled' | 'suspend' | 'ended'
  | 'error' | 'volumechange' | 'scene_change' | 'gesture'
  | 'mute_change' | 'duck_change' | 'cleanup' | 'resume_failed';

export interface EpisodeAudioTraceInput {
  readonly bus: EpisodeAudioBus;
  readonly signal: EpisodeAudioSignal;
  readonly assetId?: string;
  readonly eventId?: string;
  readonly value?: number;
  readonly readyState?: number;
  readonly note?: string;
}

export interface EpisodeAudioTrace extends EpisodeAudioTraceInput {
  readonly seq: number;
  readonly atMs: number;
}

export function createEpisodeAudioJournal(capacity = 240) {
  const records: EpisodeAudioTrace[] = [];
  let sequence = 0;
  return {
    record(input: EpisodeAudioTraceInput): EpisodeAudioTrace {
      const entry: EpisodeAudioTrace = { ...input, seq: ++sequence, atMs: Date.now() };
      records.push(entry);
      if (records.length > capacity) records.splice(0, records.length - capacity);
      return entry;
    },
    read(): readonly EpisodeAudioTrace[] { return records.slice(); },
    clear(): void { records.length = 0; },
  };
}

const journal = createEpisodeAudioJournal();
const enabled = () => typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).get('ep01AudioDebug') === '1';

export function readEpisodeAudioDiagnostics(): readonly EpisodeAudioTrace[] {
  return journal.read();
}
export function clearEpisodeAudioDiagnostics(): void { journal.clear(); }

export function traceEpisodeAudio(input: EpisodeAudioTraceInput): void {
  if (!enabled()) return;
  journal.record(input);
  // Browser/Playwright QA: window.__PSI_EP01_AUDIO_QA__.read() / .clear()
  Object.assign(window, {
    __PSI_EP01_AUDIO_QA__: {
      read: readEpisodeAudioDiagnostics,
      clear: clearEpisodeAudioDiagnostics,
    },
  });
}

/** Attaches passive listeners to an HTMLAudio element without changing playback. */
export function probeEpisodeAudioMedia(element: HTMLAudioElement, bus: EpisodeAudioBus, assetId: string): HTMLAudioElement {
  if (!enabled()) return element;
  traceEpisodeAudio({ bus, signal: 'created', assetId, readyState: element.readyState });
  const signals = [
    'loadstart', 'loadeddata', 'canplay', 'play', 'playing',
    'pause', 'waiting', 'stalled', 'suspend', 'ended', 'error', 'volumechange',
  ] as const;
  for (const signal of signals) {
    element.addEventListener(signal, () => {
      traceEpisodeAudio({
        bus, signal, assetId,
        readyState: element.readyState,
        value: signal === 'volumechange' ? element.volume : undefined,
        note: signal === 'error' ? String(element.error?.code ?? 'unknown') : undefined,
      });
    });
  }
  return element;
}

/** Records rejected autoplay/decoding attempts, retaining caller's failure handling. */
export function attemptEpisodeAudioPlay(
  element: HTMLAudioElement,
  bus: EpisodeAudioBus,
  assetId: string,
  onFailure?: () => void,
): boolean {
  traceEpisodeAudio({ bus, signal: 'play_attempt', assetId, readyState: element.readyState });
  try {
    const playback = element.play();
    if (!playback || typeof playback.catch !== 'function') {
      traceEpisodeAudio({ bus, signal: 'play_unavailable', assetId });
      return false;
    }
    void playback.catch((error: unknown) => {
      const note = error instanceof Error ? error.name : 'unknown';
      traceEpisodeAudio({ bus, signal: 'play_rejected', assetId, note });
      onFailure?.();
    });
    return true;
  } catch (error) {
    const note = error instanceof Error ? error.name : 'unknown';
    traceEpisodeAudio({ bus, signal: 'play_rejected', assetId, note });
    onFailure?.();
    return false;
  }
}

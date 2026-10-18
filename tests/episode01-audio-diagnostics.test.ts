import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  attemptEpisodeAudioPlay,
  clearEpisodeAudioDiagnostics,
  createEpisodeAudioJournal,
  probeEpisodeAudioMedia,
  readEpisodeAudioDiagnostics,
  traceEpisodeAudio,
} from '../src/app/episode-audio-diagnostics';

afterEach(() => {
  clearEpisodeAudioDiagnostics();
  vi.unstubAllGlobals();
});

describe('EP01 opt-in audio QA timeline', () => {
  it('retains only the newest bounded records in chronological order', () => {
    const journal = createEpisodeAudioJournal(2);
    journal.record({ bus: 'scene', signal: 'created', assetId: 'bed-a' });
    journal.record({ bus: 'scene', signal: 'pause', assetId: 'bed-a' });
    journal.record({ bus: 'scene', signal: 'play', assetId: 'bed-b' });
    expect(journal.read().map(item => [item.seq, item.signal, item.assetId]))
      .toEqual([[2, 'pause', 'bed-a'], [3, 'play', 'bed-b']]);
    journal.clear();
    expect(journal.read()).toHaveLength(0);
  });

  it('remains off by default and activates only with an explicit QA query flag', () => {
    vi.stubGlobal('window', { location: { search: '' } });
    traceEpisodeAudio({ bus: 'system', signal: 'scene_change', eventId: 'e01_01_arrival' });
    expect(readEpisodeAudioDiagnostics()).toHaveLength(0);

    vi.stubGlobal('window', { location: { search: '?ep01AudioDebug=1' } });
    traceEpisodeAudio({ bus: 'system', signal: 'scene_change', eventId: 'e01_01_arrival' });
    expect(readEpisodeAudioDiagnostics()).toHaveLength(1);
    expect(readEpisodeAudioDiagnostics()[0].eventId).toBe('e01_01_arrival');
  });

  it('observes element readiness/pause and captures media play rejections', async () => {
    vi.stubGlobal('window', { location: { search: '?ep01AudioDebug=1' } });
    const element = new EventTarget() as EventTarget & {
      readyState: number;
      volume: number;
      error: null;
      play: ReturnType<typeof vi.fn>;
    };
    element.readyState = 3;
    element.volume = 0.4;
    element.error = null;
    element.play = vi.fn(() => Promise.reject(new DOMException('Autoplay blocked', 'NotAllowedError')));
    const media = element as unknown as HTMLAudioElement;
    probeEpisodeAudioMedia(media, 'bgm', 'score_01');
    element.dispatchEvent(new Event('loadeddata'));
    element.dispatchEvent(new Event('pause'));
    const failed = vi.fn();
    expect(attemptEpisodeAudioPlay(media, 'bgm', 'score_01', failed)).toBe(true);
    await Promise.resolve();
    expect(failed).toHaveBeenCalledOnce();
    const records = readEpisodeAudioDiagnostics();
    expect(records.map(item => item.signal)).toEqual([
      'created', 'loadeddata', 'pause', 'play_attempt', 'play_rejected',
    ]);
    expect(records.at(-1)?.note).toBe('NotAllowedError');
  });

  it('never lets a synchronously throwing media play leave an unhandled failure', () => {
    vi.stubGlobal('window', { location: { search: '?ep01AudioDebug=1' } });
    const element = { readyState: 0, play: () => { throw new Error('media unavailable'); } };
    const failed = vi.fn();
    expect(attemptEpisodeAudioPlay(element as unknown as HTMLAudioElement, 'voice', 'voice_01', failed)).toBe(false);
    expect(failed).toHaveBeenCalledOnce();
    expect(readEpisodeAudioDiagnostics().at(-1)?.signal).toBe('play_rejected');
  });
});

// @vitest-environment jsdom
import { act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEpisodeAudio } from '../src/ui/useEpisodeAudio';
import type { PresentationAudioCue } from '../src/ui/useEpisodeAudio';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

class FakeAudio {
  static instances: FakeAudio[] = [];
  readonly dataset: Record<string, string> = {};
  readonly src: string;
  loop = false;
  volume = 1;
  pause = vi.fn();
  play = vi.fn(() => Promise.resolve());

  constructor(src: string) {
    this.src = src;
    FakeAudio.instances.push(this);
  }
}

function Harness({ cue }: { cue: PresentationAudioCue }) {
  const { playPresentationCue } = useEpisodeAudio(null, assetId => `/audio/${assetId}.ogg`);
  useEffect(() => { playPresentationCue(cue); }, [cue, playPresentationCue]);
  return null;
}

describe('presentation audio replacement', () => {
  let container: HTMLDivElement;
  let root: Root;
  const originalAudio = globalThis.Audio;

  beforeEach(() => {
    FakeAudio.instances = [];
    Object.defineProperty(globalThis, 'Audio', { value: FakeAudio, configurable: true });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    Object.defineProperty(globalThis, 'Audio', { value: originalAudio, configurable: true });
  });

  it('stops the previous production cue before starting the next scene cue', () => {
    const first = { asset_id: 'ep01.audio.pump_engine_boom', fallback: 'pressure', gain: .5 } as const;
    const second = { asset_id: 'ep01.audio.stopwork_silence_drop', fallback: 'scene_shift', gain: .6 } as const;

    act(() => root.render(<Harness cue={first} />));
    expect(FakeAudio.instances).toHaveLength(1);
    expect(FakeAudio.instances[0]!.play).toHaveBeenCalledTimes(1);

    act(() => root.render(<Harness cue={second} />));
    expect(FakeAudio.instances).toHaveLength(2);
    expect(FakeAudio.instances[0]!.pause).toHaveBeenCalledTimes(1);
    expect(FakeAudio.instances[1]!.play).toHaveBeenCalledTimes(1);
  });

  it('stops the active production cue when the audio hook unmounts', () => {
    const cue = { asset_id: 'ep01.audio.office_report_roomtone', fallback: 'scene_shift', gain: .3 } as const;
    act(() => root.render(<Harness cue={cue} />));
    const active = FakeAudio.instances[0]!;
    act(() => root.unmount());
    expect(active.pause).toHaveBeenCalledTimes(1);
    container.remove();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });
});

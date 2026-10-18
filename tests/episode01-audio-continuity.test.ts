import { describe, expect, it, vi } from 'vitest';
import {
  ContinuousEpisodeAudioBus,
  type AudioFrameClock,
} from '../src/app/episode-audio-continuity';
import { storySoundscape } from '../src/app/story-soundscape';

class FakeClock implements AudioFrameClock {
  time = 0;
  next = 0;
  frames = new Map<number, () => void>();
  now() { return this.time; }
  frame(fn: () => void) { this.frames.set(++this.next, fn); return this.next; }
  cancel(id: number) { this.frames.delete(id); }
  advance(ms: number) {
    this.time += ms;
    const callbacks = [...this.frames.values()];
    this.frames.clear();
    for (const callback of callbacks) callback();
  }
}

function fixture() {
  const clock = new FakeClock();
  const items: Array<HTMLAudioElement & { play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> }> = [];
  const create = (uri: string) => {
    const item = {
      src: uri, dataset: {} as DOMStringMap, paused: true, volume: 1, loop: false, preload: '',
      play: vi.fn(function(this: { paused: boolean }) { this.paused = false; return Promise.resolve(); }),
      pause: vi.fn(function(this: { paused: boolean }) { this.paused = true; }),
    } as unknown as HTMLAudioElement & { play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> };
    items.push(item);
    return item;
  };
  const bus = new ContinuousEpisodeAudioBus('scene', create, clock);
  const make = (assetId: string) => ({assetId, uri: '/'+assetId+'.ogg',baseGain: 0.6,loop: true});
  return { bus, clock, items, make };
}
async function settle() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); }

describe('EP01 continuous audio mixer', () => {
  it('keeps the outgoing sound until the incoming track starts, then overlaps for 1200ms', async () => {
    const { bus, clock, items, make } = fixture();
    bus.transition(make('gate_queue'), 1200);
    await settle();
    expect(bus.inspect().active).toBe('gate_queue');
    bus.transition(make('workface_pressure'), 1200);
    expect(items[0]?.pause).not.toHaveBeenCalled();
    expect(bus.inspect().pending).toBe('workface_pressure');
    await settle();
    expect(bus.inspect().outgoing).toBe('gate_queue');
    clock.advance(600);
    expect(items[0]?.volume).toBeCloseTo(0.3, 2);
    expect(items[1]?.volume).toBeCloseTo(0.3, 2);
    clock.advance(600);
    expect(items[0]?.pause).toHaveBeenCalledOnce();
    expect(items[1]?.paused).toBe(false);
    expect(bus.inspect().outgoing).toBeNull();
    bus.dispose();
  });

  it('does not restart an unchanged asset across scene text/setting updates', async () => {
    const { bus, clock, items, make } = fixture();
    bus.transition(make('workface_pressure'), 1200);
    await settle();
    bus.transition({...make('workface_pressure'), baseGain: 0.25}, 1200);
    expect(items).toHaveLength(1);
    expect(items[0]?.play).toHaveBeenCalledOnce();
    expect(items[0]?.volume).toBeCloseTo(0.6);
    clock.advance(240);
    expect(items[0]?.volume).toBeGreaterThan(0.25);
    expect(items[0]?.volume).toBeLessThan(0.6);
    clock.advance(360);
    expect(items[0]?.volume).toBeCloseTo(0.25);
    bus.dispose();
  });

  it('keeps old track if an incoming decode or autoplay attempt rejects', async () => {
    const { bus, items, make } = fixture();
    bus.transition(make('gate_queue'), 1200);
    await settle();
    // Make the replacement reject; the ongoing bed must stay audible.
    const original = items[0]!;
    const rejected = {
      ...original,
      src: '/missing.ogg', dataset: {}, paused: true,
      play: vi.fn(() => Promise.reject(new DOMException('cannot decode','NotSupportedError'))),
      pause: vi.fn(),
    } as unknown as HTMLAudioElement;
    const clock = new FakeClock();
    const factory = vi.fn().mockReturnValueOnce(original).mockReturnValueOnce(rejected);
    const rescueBus = new ContinuousEpisodeAudioBus('scene', factory, clock);
    rescueBus.transition(make('gate_queue'), 1200);
    await settle();
    rescueBus.transition(make('missing'), 1200);
    await settle();
    expect(rescueBus.inspect().active).toBe('gate_queue');
    expect(rescueBus.inspect().pending).toBeNull();
    expect(original.pause).not.toHaveBeenCalled();
    bus.dispose();
    rescueBus.dispose();
  });

  it('ramps voice duck-down and slow restoration instead of jumping volumes', async () => {
    const { bus, clock, items, make } = fixture();
    bus.transition(make('workface_pressure'), 1200);
    await settle();
    bus.setDuck(0.3, 160);
    clock.advance(80);
    expect(items[0]?.volume).toBeCloseTo(0.39, 2);
    clock.advance(80);
    expect(items[0]?.volume).toBeCloseTo(0.18, 2);
    bus.setDuck(1, 950);
    clock.advance(475);
    expect(items[0]?.volume).toBeCloseTo(0.39, 2);
    clock.advance(475);
    expect(items[0]?.volume).toBeCloseTo(0.6, 2);
    bus.dispose();
  });

  it('does not loop pump boom as a scene bed', () => {
    expect(storySoundscape('e01_06_pump_arrival')?.asset_id).toBe('ep01.audio.workface_pressure');
  });
});

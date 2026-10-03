import { describe, expect, it } from 'vitest';
import { SpriteMotionTracker } from '../src/ui/survivors-sprite-motion';

describe('grounded presentation motion', () => {
  it('uses travelled distance equally at 30, 60 and 120 render samples', () => {
    const cycles = [30, 60, 120].map(rate => {
      const tracker = new SpriteMotionTracker(), entity = {};
      tracker.sample(entity, 0, 0, 0);
      let cycle = 0;
      for (let frame = 1; frame <= rate; frame++) cycle = tracker.sample(entity, frame * 100 / rate, 0, frame / rate).cycle;
      return cycle;
    });
    expect(cycles[0]).toBeCloseTo(cycles[1]!, 9);
    expect(cycles[1]).toBeCloseTo(cycles[2]!, 9);
  });
  it('does not walk against walls or advance while paused', () => {
    const tracker = new SpriteMotionTracker(), entity = {};
    tracker.sample(entity, 0, 0, 0);
    const walking = tracker.sample(entity, 4, 0, .1);
    expect(tracker.sample(entity, 4, 0, .1)).toEqual(walking);
    const blocked = tracker.sample(entity, 4, 0, .2);
    const paused = tracker.sample(entity, 4, 0, .2);
    expect(blocked.moving).toBe(false);
    expect(blocked.cycle).toBe(walking.cycle);
    expect(paused).toEqual(blocked);
  });
  it('preserves facing at rest and rejects teleport stride', () => {
    const tracker = new SpriteMotionTracker(), entity = {};
    tracker.sample(entity, 100, 0, 0);
    const left = tracker.sample(entity, 95, 0, .1);
    const rest = tracker.sample(entity, 95, 0, .2);
    const teleported = tracker.sample(entity, 900, 0, .3);
    expect(left.facing).toBe(-1);
    expect(rest.facing).toBe(-1);
    expect(teleported.moving).toBe(false);
    expect(teleported.cycle).toBe(rest.cycle);
  });
  it('briefly braces after risk contact and recovers using simulation time', () => {
    const tracker = new SpriteMotionTracker(), entity = {};
    tracker.sample(entity, 0, 0, 0, 100);
    expect(tracker.sample(entity, 0, 0, .1, 90).reaction).toBe(1);
    expect(tracker.sample(entity, 0, 0, .1, 90).reaction).toBe(1);
    expect(tracker.sample(entity, 0, 0, .3, 90).reaction).toBe(0);
  });
});

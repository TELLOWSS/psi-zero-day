import { describe, expect, it } from 'vitest';
import { SurvivorsEngine, createInitialSurvivorsState } from '../src/engine/patrol-survivors-engine';

function displacement(x: number, y: number, paused = false) {
  const engine = new SurvivorsEngine(createInitialSurvivorsState('player', undefined, 'stage_02'));
  engine.start();
  if (paused) engine.setPaused(true);
  const start = { x: engine.state.player.x, y: engine.state.player.y };
  engine.update(1 / 60, { moveX: x, moveY: y });
  return Math.hypot(engine.state.player.x - start.x, engine.state.player.y - start.y);
}

describe('survivors analog movement', () => {
  it('preserves half and quarter joystick speed', () => {
    const full = displacement(1, 0);
    expect(full).toBeGreaterThan(0);
    expect(displacement(0.5, 0)).toBeCloseTo(full / 2);
    expect(displacement(0.25, 0)).toBeCloseTo(full / 4);
  });
  it('caps diagonals and oversized input at full speed', () => {
    expect(displacement(1, 1)).toBeCloseTo(displacement(1, 0));
    expect(displacement(3, 0)).toBeCloseTo(displacement(1, 0));
  });
  it('ignores invalid, idle, and paused input', () => {
    for (const [x, y] of [[NaN, 1], [1, Infinity], [0, 0]] as [number, number][]) expect(displacement(x, y)).toBe(0);
    expect(displacement(1, 0, true)).toBe(0);
  });
});

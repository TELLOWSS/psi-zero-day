import { describe, expect, it } from 'vitest';
import { SurvivorsEngine, createInitialSurvivorsState } from '../src/engine/patrol-survivors-engine';

describe('Patrol Survivors Screen Juice & Impact Systems', () => {
  it('initializes with combo and hit stop counters', () => {
    const state = createInitialSurvivorsState('yoon');
    expect(state.comboCount).toBe(0);
    expect(state.comboTimer).toBe(0);
    expect(state.hitStopTimer).toBe(0);
    expect(state.lastKilledEvents).toEqual([]);
  });

  it('applies radial physics knockback when projectile hits hazard', () => {
    const state = createInitialSurvivorsState('yoon');
    const engine = new SurvivorsEngine(state);
    engine.start();

    // Spawn an unhelmeted worker at x=500, y=500
    state.hazards.push({
      id: 'test_worker',
      type: 'UNHELMETED',
      x: 500,
      y: 500,
      hp: 100,
      maxHp: 100,
      speed: 80,
      radius: 15,
      damage: 10,
      expValue: 5,
    });

    // Spawn projectile moving into worker
    state.projectiles.push({
      id: 'test_proj',
      x: 495,
      y: 500,
      vx: 100,
      vy: 0,
      radius: 10,
      damage: 20,
      duration: 1.0,
      pierce: 1,
      kind: 'radio',
    });

    const prevX = state.hazards[0]!.x;
    engine.update(0.016, { moveX: 0, moveY: 0 });

    const worker = state.hazards[0]!;
    expect(worker.hp).toBeLessThan(100);
    // Worker is to the left of player (500 < 1200), so knockback pushes it further left
    expect(worker.x).toBeLessThan(prevX);
    expect(worker.vx).toBeLessThan(0);
  });

  it('increments combo count and emits kill events on hazard neutralized', () => {
    const state = createInitialSurvivorsState('yoon');
    const engine = new SurvivorsEngine(state);
    engine.start();

    // Spawn 1-HP hazard
    state.hazards.push({
      id: 'fragile_worker',
      type: 'UNHELMETED',
      x: 500,
      y: 500,
      hp: 5,
      maxHp: 30,
      speed: 50,
      radius: 15,
      damage: 5,
      expValue: 3,
    });

    state.projectiles.push({
      id: 'killer_proj',
      x: 500,
      y: 500,
      vx: 0,
      vy: 0,
      radius: 20,
      damage: 50,
      duration: 1.0,
      pierce: 1,
      kind: 'radio',
    });

    engine.update(0.016, { moveX: 0, moveY: 0 });

    expect(state.hazardsNeutralized).toBe(1);
    expect(state.comboCount).toBe(1);
    expect(state.comboTimer).toBeGreaterThan(0);
    expect(state.lastKilledEvents).toHaveLength(1);
    expect(state.lastKilledEvents![0]?.type).toBe('UNHELMETED');
  });

  it('resets combo after timer expires', () => {
    const state = createInitialSurvivorsState('yoon');
    const engine = new SurvivorsEngine(state);
    engine.start();

    state.comboCount = 5;
    state.comboTimer = 0.05;

    // Advance beyond combo timer
    engine.update(0.1, { moveX: 0, moveY: 0 });

    expect(state.comboCount).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import {
  createInitialSurvivorsState,
  SurvivorsEngine,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../src/engine/patrol-survivors-engine';

describe('Patrol Survivors Engine', () => {
  it('initializes with default player stats and level 1 radio perk', () => {
    const state = createInitialSurvivorsState();
    expect(state.phase).toBe('ready');
    expect(state.player.hp).toBe(100);
    expect(state.level).toBe(1);
    expect(state.activePerks.radio_boost).toBe(1);
    expect(state.player.x).toBe(WORLD_WIDTH / 2);
    expect(state.player.y).toBe(WORLD_HEIGHT / 2);
  });

  it('updates player position within world bounds', () => {
    const engine = new SurvivorsEngine();
    engine.start();
    expect(engine.state.phase).toBe('playing');

    // Move right
    const startX = engine.state.player.x;
    engine.update(0.5, { moveX: 1, moveY: 0 });
    expect(engine.state.player.x).toBeGreaterThan(startX);

    // Try moving way past world border
    for (let i = 0; i < 20; i++) {
      engine.update(1.0, { moveX: 1, moveY: 1 });
    }
    expect(engine.state.player.x).toBeLessThanOrEqual(WORLD_WIDTH - 20);
    expect(engine.state.player.y).toBeLessThanOrEqual(WORLD_HEIGHT - 20);
  });

  it('fires radio projectile when hazard is present', () => {
    const engine = new SurvivorsEngine();
    engine.start();

    // Spawn a test hazard nearby
    engine.state.hazards.push({
      id: 'test_hazard',
      type: 'UNHELMETED',
      x: engine.state.player.x + 100,
      y: engine.state.player.y,
      hp: 30,
      maxHp: 30,
      speed: 50,
      radius: 15,
      damage: 10,
      expValue: 5,
    });

    // Advance time to allow weapon to trigger
    engine.update(0.1, { moveX: 0, moveY: 0 });
    expect(engine.state.projectiles.length).toBeGreaterThan(0);
    expect(engine.state.projectiles[0]?.kind).toBe('radio');
  });

  it('neutralizes hazard, creates drop, and levels up on collection', () => {
    const engine = new SurvivorsEngine();
    engine.start();

    // Spawn low HP hazard right on player to trigger collision & kill
    engine.state.hazards.push({
      id: 'weak_hazard',
      type: 'UNHELMETED',
      x: engine.state.player.x + 5,
      y: engine.state.player.y,
      hp: 5,
      maxHp: 30,
      speed: 0,
      radius: 15,
      damage: 0,
      expValue: 15, // enough to trigger level up (req 10)
    });

    // Spawn projectile right on the hazard
    engine.state.projectiles.push({
      id: 'kill_proj',
      x: engine.state.player.x + 5,
      y: engine.state.player.y,
      vx: 0,
      vy: 0,
      radius: 20,
      damage: 50,
      duration: 1,
      pierce: 1,
      kind: 'radio',
    });

    engine.update(0.016, { moveX: 0, moveY: 0 });

    // Hazard should be dead, drop created
    expect(engine.state.hazards.length).toBe(0);
    expect(engine.state.hazardsNeutralized).toBe(1);
    expect(engine.state.drops.length).toBe(1);

    // Update again so player collects drop
    engine.update(0.1, { moveX: 0, moveY: 0 });

    // Should level up and present perk options
    expect(engine.state.phase).toBe('levelup');
    expect(engine.state.level).toBe(2);
    expect(engine.state.perkOptions.length).toBeGreaterThan(0);
    expect(engine.state.perkOptions.length).toBeLessThanOrEqual(3);

    // Pick first perk
    const chosenPerk = engine.state.perkOptions[0]!;
    engine.applyPerk(chosenPerk.id);

    expect(engine.state.activePerks[chosenPerk.id]).toBeGreaterThan(0);
    expect(engine.state.phase).toBe('playing');
  });

  it('triggers defeat when player HP drops to 0', () => {
    const engine = new SurvivorsEngine();
    engine.start();

    engine.state.player.hp = 5;
    engine.state.hazards.push({
      id: 'lethal_hazard',
      type: 'CRANE_BOSS',
      x: engine.state.player.x,
      y: engine.state.player.y,
      hp: 100,
      maxHp: 100,
      speed: 10,
      radius: 30,
      damage: 50,
      expValue: 10,
    });

    engine.update(0.016, { moveX: 0, moveY: 0 });
    expect(engine.state.player.hp).toBe(0);
    expect(engine.state.phase).toBe('defeat');
  });

  it('applies passive perks correctly to player stats', () => {
    const engine = new SurvivorsEngine();
    const baseSpeed = engine.state.player.speed;
    const basePickup = engine.state.player.pickupRadius;
    const baseMaxHp = engine.state.player.maxHp;

    engine.applyPerk('steel_boots');
    expect(engine.state.player.speed).toBe(baseSpeed + 30);

    engine.applyPerk('magnet_beacon');
    expect(engine.state.player.pickupRadius).toBe(basePickup + 35);

    engine.applyPerk('safety_harness');
    expect(engine.state.player.maxHp).toBe(baseMaxHp + 30);
  });
});

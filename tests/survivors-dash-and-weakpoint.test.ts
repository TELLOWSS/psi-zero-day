import { describe, expect, it } from 'vitest';
import { SurvivorsEngine, createInitialSurvivorsState } from '../src/engine/patrol-survivors-engine';

describe('Survivors Emergency Dash and Weak Point Burst', () => {
  it('triggers emergency dash and sets movement, cooldown, and invulnerability', () => {
    const engine = new SurvivorsEngine(createInitialSurvivorsState('player', undefined, 'stage_01'));
    engine.start();

    expect(engine.state.player.dashCooldown).toBe(0);
    expect(engine.state.player.isDashing).toBeFalsy();

    const startX = engine.state.player.x;
    const startY = engine.state.player.y;

    const accepted = engine.triggerPlayerDash();
    expect(accepted).toBe(true);
    expect(engine.state.player.isDashing).toBe(true);
    expect(engine.state.player.dashCooldown).toBeGreaterThan(0);
    expect(engine.state.player.invincibleTime).toBeGreaterThanOrEqual(0.28);

    // Simulate physics step
    engine.update(1 / 60, { moveX: 0, moveY: 0 });

    // Player should have moved significantly faster in dash direction
    const dist = Math.hypot(engine.state.player.x - startX, engine.state.player.y - startY);
    expect(dist).toBeGreaterThan(0);

    // Cannot dash again while on cooldown
    const secondTry = engine.triggerPlayerDash();
    expect(secondTry).toBe(false);
  });

  it('prevents player damage while dashing or invincible', () => {
    const engine = new SurvivorsEngine(createInitialSurvivorsState('player', undefined, 'stage_01'));
    engine.start();

    // Trigger dash
    engine.triggerPlayerDash();
    const initialHp = engine.state.player.hp;

    // Place a hazard directly overlapping the player
    engine.state.hazards.push({
      id: 'test_hazard',
      type: 'RUNAWAY_CART',
      x: engine.state.player.x,
      y: engine.state.player.y,
      hp: 100,
      maxHp: 100,
      speed: 100,
      radius: 30,
      damage: 50,
      expValue: 10,
    });

    engine.update(1 / 60, { moveX: 0, moveY: 0 });

    // Player HP should remain untouched due to dash invulnerability
    expect(engine.state.player.hp).toBe(initialHp);
  });

  it('deals 2.5x burst damage and triggers hit stop when attacking weak point', () => {
    const engine = new SurvivorsEngine(createInitialSurvivorsState('player', undefined, 'stage_01'));
    engine.start();

    // Spawn a hazard with weak point exposed
    const hazard = {
      id: 'boss_hazard',
      type: 'RUNAWAY_CART' as const,
      x: engine.state.player.x + 50,
      y: engine.state.player.y,
      hp: 500,
      maxHp: 500,
      speed: 0,
      radius: 40,
      damage: 10,
      expValue: 20,
      weakPointExposed: true,
      weakPointTimer: 2.0,
    };
    engine.state.hazards.push(hazard);

    // Disable auto-fired ambient weapons to isolate test projectile damage
    engine.state.activePerks = { radio_boost: 0, extinguisher: 0, floodlight: 0, cone_trap: 0, safety_drone: 0 } as any;

    // Add projectile aimed at the hazard
    engine.state.projectiles.push({
      id: 'test_proj',
      x: hazard.x - 10,
      y: hazard.y,
      vx: 100,
      vy: 0,
      radius: 10,
      damage: 100,
      duration: 1.0,
      pierce: 1,
      kind: 'radio',
    });

    engine.update(1 / 60, { moveX: 0, moveY: 0 });

    // 100 base damage * 2.5x weak point multiplier = 250 damage dealt!
    // Remaining HP should be 500 - 250 = 250
    expect(hazard.hp).toBe(250);
    // Hit stop timer should be engaged for juicy impact freeze
    expect(engine.state.hitStopTimer).toBeGreaterThanOrEqual(0.05);
  });
});

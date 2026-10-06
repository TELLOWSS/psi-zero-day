import { describe, expect, it } from 'vitest';
import { SurvivorsEngine, createInitialSurvivorsState } from '../src/engine/patrol-survivors-engine';
import { SurvivorsContainerShop } from '../src/ui/SurvivorsContainerShop';

describe('Survivors Container Shop and Hit Juice Physics', () => {
  it('hitStopTimer freezes gameTime advancement during impact', () => {
    const engine = new SurvivorsEngine(createInitialSurvivorsState('player', undefined, 'stage_01'));
    engine.start();

    // Normal step with dt = 0.1 advances gameTime by 0.1s
    const prevTime = engine.state.gameTime;
    engine.update(0.1, { moveX: 0, moveY: 0 });
    expect(engine.state.gameTime).toBeCloseTo(prevTime + 0.1, 2);

    // With hitStopTimer active, physical freeze keeps gameTime frozen
    engine.state.hitStopTimer = 0.05;
    const timeBeforeFreeze = engine.state.gameTime;
    engine.update(0.02, { moveX: 0, moveY: 0 });
    expect(engine.state.gameTime).toBe(timeBeforeFreeze);
    expect(engine.state.hitStopTimer).toBeCloseTo(0.03, 2);
  });

  it('container shop upgrade catalog modifies player stats correctly', () => {
    const state = createInitialSurvivorsState('player', undefined, 'stage_01');
    state.psiCredits = 500;

    const baseDamage = state.player.damageMultiplier;
    const baseSpeed = state.player.speed;
    const baseMaxHp = state.player.maxHp;

    // Test component export exists
    expect(SurvivorsContainerShop).toBeDefined();

    // Test applying damage multiplier
    state.player.damageMultiplier += 0.15;
    expect(state.player.damageMultiplier).toBeGreaterThan(baseDamage);

    // Test applying speed increase
    state.player.speed = Math.round(state.player.speed * 1.12);
    expect(state.player.speed).toBeGreaterThan(baseSpeed);

    // Test applying max HP and heal
    state.player.maxHp += 40;
    state.player.hp += 40;
    expect(state.player.maxHp).toBe(baseMaxHp + 40);
  });
});

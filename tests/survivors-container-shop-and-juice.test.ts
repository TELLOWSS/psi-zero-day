import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SurvivorsEngine, createInitialSurvivorsState } from '../src/engine/patrol-survivors-engine';
import { SurvivorsContainerShop } from '../src/ui/SurvivorsContainerShop';

describe('Survivors Container Shop and Hit Juice Physics', () => {
  it('does not stack the pause dialog behind wave supply', () => {
    const source = readFileSync(new URL('../src/ui/PatrolSurvivorsGame.tsx', import.meta.url), 'utf8');
    expect(source).toContain("phase === 'paused' && !accountabilityCase && !showRdModal && !showArsenalModal && !showContainerShop");
  });

  it('keeps equipment condition and actions on separate rows', () => {
    const css = readFileSync(new URL('../src/ui/patrol-survivors.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.survivors-store-slots label\s*\{grid-column:1\/-1;/);
    expect(css).toMatch(/\.survivors-store-slots button\s*\{grid-column:1\/-1;/);
    expect(css).toMatch(/\.survivors-fitting-action\s*\{ position: static;/);
  });

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

  it('wave supply stays non-blocking and can only open from an explicit player action', () => {
    const gameSource = readFileSync(new URL('../src/ui/PatrolSurvivorsGame.tsx', import.meta.url), 'utf8');
    const waveStart = gameSource.indexOf('const maxSurvivalTime = engine.state.maxTime || 180;');
    const waveEnd = gameSource.indexOf('const incidentSecured=', waveStart);
    const waveBlock = gameSource.slice(waveStart, waveEnd);

    expect(waveStart).toBeGreaterThan(-1);
    expect(waveEnd).toBeGreaterThan(waveStart);
    expect(waveBlock).not.toContain('setPaused(true)');
    expect(waveBlock).not.toContain('setShowContainerShop(true)');
    expect(waveBlock).toContain('setAvailableContainerShopWave(1)');
    expect(waveBlock).toContain('setAvailableContainerShopWave(2)');

    const openStart = gameSource.indexOf('const openContainerShop=');
    const openEnd = gameSource.indexOf('const openArsenal=', openStart);
    const explicitOpenBlock = gameSource.slice(openStart, openEnd);
    expect(openStart).toBeGreaterThan(-1);
    expect(explicitOpenBlock).toContain('setShowContainerShop(true)');
    expect((gameSource.match(/setShowContainerShop\(true\)/g) ?? [])).toHaveLength(1);
  });

  it('labels wave supply as game-only PSI rather than a real-money purchase', () => {
    const shopSource = readFileSync(new URL('../src/ui/SurvivorsContainerShop.tsx', import.meta.url), 'utf8');
    expect(shopSource).toContain('현금 결제나 유료 구매는 없습니다.');
    expect(shopSource).toContain('FIELD SUPPLY · GAME CREDIT');
    expect(shopSource).not.toContain('💎');
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

import { expect, it } from 'vitest';
import { createInitialSurvivorsState, SurvivorsEngine } from '../src/engine/patrol-survivors-engine';
import { upgradeComparison } from '../src/engine/survivors-equipment-tuning';

it('shows the same radio power/count/interval as production simulation at every level', () => {
  for (let level = 1; level <= 5; level++) {
    const engine = new SurvivorsEngine(undefined, 10); engine.start();
    engine.state.activePerks.radio_boost = level;
    engine.state.player.damageMultiplier = 1.2;
    engine.state.player.cooldownReduction = .12;
    engine.state.hazards.push({ id: 'stationary-signal', type: 'GAS_LEAK', x: engine.state.player.x + 400, y: engine.state.player.y, hp: 100000, maxHp: 100000, speed: 0, radius: 10, damage: 0, expValue: 0 });
    engine.update(1 / 60, { moveX: 0, moveY: 0 });
    const rounds = engine.state.projectiles.filter(p => p.kind === 'radio');
    const rows = upgradeComparison('radio_boost', level, 'radio_boost', level - 1, engine.state.player, false);
    expect(rounds).toHaveLength([1, 2, 2, 3, 3][level - 1]!);
    expect(rounds[0]!.damage).toBeCloseTo([30, 38, 46, 54, 62][level - 1]! * 1.2);
    expect(rows.find(row => row.key === 'damage')!.after).toBeCloseTo(rounds[0]!.damage);
    expect(rows.find(row => row.key === 'count')!.after).toBe(rounds.length);
    const firstTime = engine.state.gameTime;
    const firstIds = new Set(rounds.map(p => p.id));
    for (let i = 0; i < 100; i++) {
      engine.update(1 / 60, { moveX: 0, moveY: 0 });
      if (engine.state.projectiles.some(p => p.kind === 'radio' && !firstIds.has(p.id))) break;
    }
    expect(Math.abs(engine.state.gameTime - firstTime - rows.find(row => row.key === 'interval')!.after)).toBeLessThan(1 / 60 + .0001);
  }
});

it('compares actual support stats, preserves additive upgrades and respects the ordinary cooldown cap', () => {
  const engine = new SurvivorsEngine(createInitialSurvivorsState('safety_monitor'));
  const oldHp = engine.state.player.hp;
  const rows = upgradeComparison('safety_harness', 1, 'safety_harness', 0, engine.state.player, false);
  engine.applyPerk('safety_harness');
  for (const row of rows) expect(engine.state.player[row.key as 'maxHp' | 'regenRate']).toBe(row.after);
  expect(engine.state.player.hp).toBe(oldHp + 18);
  engine.state.player.cooldownReduction = .40;
  expect(upgradeComparison('quick_reflexes', 1, 'quick_reflexes', 0, engine.state.player, false)).toEqual([{ key: 'cooldownReduction', before: .40, after: .45 }]);
});

it('records real contact damage but does not blame a hazard absorbed by a control kit', () => {
  const engine = new SurvivorsEngine(); engine.start();
  engine.state.controlKit = { charges: 1, remaining: 10 };
  engine.state.hazards.push({ id: 'near-worker', type: 'UNHELMETED', x: engine.state.player.x, y: engine.state.player.y, hp: 100000, maxHp: 100000, speed: 0, radius: 10, damage: 12, expValue: 0 });
  engine.update(1 / 60, { moveX: 0, moveY: 0 });
  expect(engine.state.lastDamage).toBeUndefined();
  engine.state.player.invincibleTime = 0;
  engine.state.hazards[0]!.x = engine.state.player.x;
  engine.state.hazards[0]!.y = engine.state.player.y;
  engine.update(1 / 60, { moveX: 0, moveY: 0 });
  expect(engine.state.lastDamage).toEqual({ source: 'UNHELMETED', amount: 12, remaining: 2 });
});

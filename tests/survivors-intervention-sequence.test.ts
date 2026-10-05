import { describe, expect, it } from 'vitest';
import { SurvivorsEngine } from '../src/engine/patrol-survivors-engine';
import { completedOperation } from './fixtures/survivors-completed-operation';

const idle = { moveX: 0, moveY: 0 };
function shouting() {
  const engine = new SurvivorsEngine(undefined, 123);
  engine.start();
  engine.state.ultimateCharge = engine.state.maxUltimateCharge;
  expect(engine.triggerDirectorShout()).toBe(true);
  return engine;
}

describe('intervention before queued upgrades', () => {
  it('collects real magnet pickups, completes the cutin, then spends all XP through sequential choices', () => {
    const engine = shouting();
    const { x, y } = engine.state.player;
    engine.state.drops.push({ id: 'bulk-record', x, y, exp: 100, isHeal: false });
    engine.update(1 / 60, idle);
    expect(engine.state.currentExp).toBe(100);
    expect(engine.state.level).toBe(1);
    expect(engine.state.phase).toBe('playing');
    expect(engine.state.directorCutinPhase).not.toBe('none');
    for (let i = 0; i < 300 && engine.state.phase === 'playing'; i++) engine.update(1 / 60, idle);
    expect(engine.state.directorCutinPhase).toBe('none');
    expect(engine.state.phase).toBe('levelup');
    let spent = 10, choices = 0;
    while (engine.state.phase === 'levelup' && choices < 10) {
      const threshold = engine.state.nextLevelExp;
      engine.applyPerk(engine.state.perkOptions[0]!.id);
      choices++;
      if (engine.state.phase === 'levelup') spent += threshold;
    }
    expect(choices).toBeGreaterThan(1);
    expect(engine.state.currentExp + spent).toBe(100);
    expect(engine.state.level).toBe(choices + 1);
    expect(engine.state.phase).toBe('playing');
  });

  it('holds the cutin and queued XP while paused, and rejects a second shout', () => {
    const engine = shouting();
    engine.addExp(40);
    engine.state.ultimateCharge = engine.state.maxUltimateCharge;
    expect(engine.triggerDirectorShout()).toBe(false);
    engine.setPaused(true);
    engine.update(0.2, idle);
    expect(engine.state.directorShoutTimer).toBe(2);
    expect(engine.state.currentExp).toBe(40);
    engine.setPaused(false);
    for (let i = 0; i < 300 && engine.state.phase === 'playing'; i++) engine.update(1 / 60, idle);
    expect(engine.state.phase).toBe('levelup');
    expect(engine.state.directorCutinPhase).toBe('none');
  });

  it('keeps a simultaneous victory ahead of pending upgrades and clears the cutin', () => {
    const engine = shouting();
    engine.addExp(100);
    completedOperation(engine.state);
    engine.update(1 / 60, idle);
    expect(engine.state.phase).toBe('victory');
    expect(engine.state.currentExp).toBe(100);
    expect(engine.state.directorCutinPhase).toBe('none');
    expect(engine.state.perkOptions).toEqual([]);
  });
});

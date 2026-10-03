import { describe, expect, it } from 'vitest';
import { zeroBreachContent } from '../src/content/defense';
import { applyDefenseCommand, createDefenseRun } from '../src/engine/defense';

describe('Defense Emergency E-Stop Engine', () => {
  it('freezes enemy movement and reveals all enemies when TriggerEStop is dispatched in combat', () => {
    let state = createDefenseRun(zeroBreachContent, 'COORDINATOR');
    state = applyDefenseCommand(state, zeroBreachContent, { type: 'StartWave' });
    expect(state.status).toBe('RUNNING');

    // Add dummy veiled enemy
    const stateWithEnemy = {
      ...state,
      enemies: [
        {
          id: 'test-veiled',
          enemyId: 'VEILED' as const,
          hp: 100,
          distance: 10,
          spawnSequence: 1,
          revealUntilTick: 0,
          slowEffects: [],
          bossPhaseTriggered: false,
          bossArmorFromTick: 0,
          bossArmorUntilTick: 0,
        },
      ],
    };

    const next = applyDefenseCommand(stateWithEnemy, zeroBreachContent, { type: 'TriggerEStop' });

    // Expect freeze and reveal ticks to be set to tick + 70 (3.5 seconds)
    expect(next.freezeMovementUntilTick).toBe(state.tick + 70);
    expect(next.revealAllUntilTick).toBe(state.tick + 70);
    expect(next.enemies[0]!.revealUntilTick).toBe(state.tick + 70);
  });

  it('rejects TriggerEStop when game is not running or paused', () => {
    const readyState = createDefenseRun(zeroBreachContent, 'COORDINATOR');
    expect(() => applyDefenseCommand(readyState, zeroBreachContent, { type: 'TriggerEStop' })).toThrow(
      'E-Stop requires active combat',
    );

    const pausedState = { ...readyState, status: 'RUNNING' as const, paused: true };
    expect(() => applyDefenseCommand(pausedState, zeroBreachContent, { type: 'TriggerEStop' })).toThrow(
      'E-Stop requires active combat',
    );
  });
});

import { describe, expect, it } from 'vitest';
import { PATROL_STAGE_IDS } from '../src/domain/patrol-survivors';
import {
  BOSS_GAMEPLAY_BY_STAGE,
  SURVIVORS_BOSS_GAMEPLAY,
  bossGameplayForStage,
  validateBossGameplayContent,
} from '../src/engine/survivors-boss-gameplay';

describe('Survivors boss gameplay content', () => {
  it('maps every patrol stage exactly once and validates against incident sources', () => {
    expect(validateBossGameplayContent()).toEqual([]);
    expect(SURVIVORS_BOSS_GAMEPLAY.stages).toHaveLength(50);
    expect(BOSS_GAMEPLAY_BY_STAGE.size).toBe(50);
    expect([...BOSS_GAMEPLAY_BY_STAGE.keys()]).toEqual([...PATROL_STAGE_IDS]);
  });

  it('keeps the authored combat archetype mix varied', () => {
    expect(SURVIVORS_BOSS_GAMEPLAY.archetypeMix).toEqual({
      ACTION: 12,
      PATTERN: 11,
      PUZZLE: 9,
      SURVIVAL: 11,
      MULTI: 6,
      FINAL: 1,
    });
  });

  it('locks the Stage 14 gameplay reference to pendulum, debris and a burst window', () => {
    const stage = bossGameplayForStage('stage_14');
    expect(stage.combatArchetype).toBe('PATTERN');
    expect(stage.patternId).toBe('PENDULUM_DEBRIS');
    expect(stage.weakPointId).toBe('DROP_ZONE_BREAK');
    expect(stage.burstWindowSeconds).toBe(4.5);
  });

  it('keeps ordinary bosses concise and reserves whole-site logic for Stage 50', () => {
    const regular = SURVIVORS_BOSS_GAMEPLAY.stages.filter(stage => stage.encounterTier === 'REGULAR');
    expect(regular.length).toBeGreaterThan(0);
    expect(regular.every(stage => stage.phaseCount === 2 && stage.intro.firstPlaySeconds <= 2.4)).toBe(true);

    const final = bossGameplayForStage('stage_50');
    expect(final.combatArchetype).toBe('FINAL');
    expect(final.patternId).toBe('ZERO_DAY_WAVE');
    expect(final.phaseCount).toBe(4);
    expect(final.intro.firstPlaySeconds).toBe(5.5);
    expect(final.burstWindowSeconds).toBe(8);
  });
});

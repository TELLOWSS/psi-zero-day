import type {
  DefenseContent, DefenseEnemyDefinition, DefenseRunState, DefenseWaveDefinition,
} from '../domain/defense';
import type {
  DefenseEventAvailability, DefenseEventDefinition, DefenseUnlockContext,
} from '../domain/defense-event';

function cloneWave(wave: DefenseWaveDefinition): DefenseWaveDefinition {
  return {
    id: wave.id,
    groups: wave.groups.map(group => ({ ...group })),
  };
}

function cloneEnemy(enemy: DefenseEnemyDefinition): DefenseEnemyDefinition {
  return {
    ...enemy,
    ...(enemy.phase ? { phase: { ...enemy.phase } } : {}),
  };
}

export function applyDefenseEvent(
  base: DefenseContent,
  event: DefenseEventDefinition,
): DefenseContent {
  if (event.baseScenarioId !== base.scenario.id) {
    throw new Error(`Event ${event.id} base scenario mismatch`);
  }
  if (event.mapId !== base.map.id) {
    throw new Error(`Event ${event.id} map mismatch`);
  }

  let waves = base.waves.map(cloneWave);
  let enemies = base.enemies.map(cloneEnemy);
  let initialResource = base.initialResource;
  let supportResetWaveIds: readonly number[] = [];

  for (const modifier of event.modifiers.filter(item => item.kind === 'replace-wave')) {
    waves = waves.map(wave => wave.id === modifier.waveId
      ? { id: wave.id, groups: modifier.groups.map(group => ({ ...group })) }
      : wave);
  }

  for (const modifier of event.modifiers.filter(item => item.kind === 'enemy-hp')) {
    const ids = new Set(modifier.enemyIds);
    enemies = enemies.map(enemy => ids.has(enemy.id)
      ? { ...enemy, hp: Math.max(1, Math.round(enemy.hp * modifier.multiplier)) }
      : enemy);
  }

  for (const modifier of event.modifiers.filter(item => item.kind === 'enemy-speed')) {
    const ids = new Set(modifier.enemyIds);
    enemies = enemies.map(enemy => ids.has(enemy.id)
      ? { ...enemy, speed: enemy.speed * modifier.multiplier }
      : enemy);
  }

  const resourceModifier = event.modifiers.find(item => item.kind === 'initial-resource');
  if (resourceModifier?.kind === 'initial-resource') initialResource = resourceModifier.value;

  const supportReset = event.modifiers.find(item => item.kind === 'wave-support-reset');
  if (supportReset?.kind === 'wave-support-reset') supportResetWaveIds = [...supportReset.waveIds];

  return {
    ...base,
    initialResource,
    waves,
    enemies,
    scenario: {
      ...base.scenario,
      id: event.id,
      rewardVersion: event.rewardVersion,
      firstClearCosmetic: event.firstClearCosmeticId,
      threeStarCosmetic: null,
      supportResetWaveIds,
      eventId: event.id,
      eventContentVersion: event.contentVersion,
      mainStoryStatRewards: [],
    },
  };
}

export function defenseEventAvailability(
  event: DefenseEventDefinition,
  context: DefenseUnlockContext,
): DefenseEventAvailability {
  const missing = event.unlock.all.filter(condition => {
    if (condition.kind === 'scenario-cleared') return !context.clearedScenarioIds.has(condition.scenarioId);
    return !context.storyFacts.has(condition.factId);
  });
  return { event, unlocked: missing.length === 0, missing };
}

export function defenseScenarioIdForRun(run: DefenseRunState): string {
  return run.scenarioId || 'training-ramp-v1';
}

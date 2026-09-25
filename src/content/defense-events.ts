import rawEvents from '../../content/defense/events-v1.json';
import rawCosmetics from '../../content/defense/cosmetics-v1.json';
import ko from '../../content/localization/defense-ko.json';
import type {
  DefenseContent, DefenseEnemyId, DefenseRunState, DefenseSpawnGroup,
} from '../domain/defense';
import type {
  DefenseEventDefinition, DefenseEventModifier, DefenseStoryFactId, DefenseUnlockCondition,
} from '../domain/defense-event';
import { applyDefenseEvent, defenseScenarioIdForRun } from '../engine/defense-event';
import { validateDefenseContent, zeroBreachContent } from './defense';
import { siteDefenseContents } from './site-process-maps';

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const str = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const integer = (value: unknown): value is number => finite(value) && Number.isInteger(value);
const positive = (value: unknown): value is number => finite(value) && value > 0;
const nonNegative = (value: unknown): value is number => finite(value) && value >= 0;

const STORY_FACT_IDS = new Set<DefenseStoryFactId>(['ep01.ramp-signal-known']);
const textIds = new Set(Object.keys((ko as { messages: Record<string, string> }).messages));
const cosmeticIds = new Set(
  Array.isArray((rawCosmetics as { cosmetics?: unknown[] }).cosmetics)
    ? (rawCosmetics as { cosmetics: { id?: unknown }[] }).cosmetics.filter(item => str(item.id)).map(item => item.id as string)
    : [],
);

export class DefenseEventContentError extends Error {
  constructor(readonly issues: readonly string[]) {
    super(`Invalid defense event content:\n${issues.join('\n')}`);
  }
}

function parseGroup(value: unknown, path: string, issues: string[]): DefenseSpawnGroup | null {
  if (!record(value)
    || !['NORMAL','SWIFT','ARMORED','SWARM','VEILED','BOSS'].includes(String(value.enemy))
    || !integer(value.count) || value.count <= 0
    || !integer(value.startTick) || value.startTick < 0
    || !integer(value.intervalTicks) || value.intervalTicks <= 0) {
    issues.push(`${path}: invalid spawn group`);
    return null;
  }
  return {
    enemy: value.enemy as DefenseEnemyId,
    count: value.count,
    startTick: value.startTick,
    intervalTicks: value.intervalTicks,
  };
}

export function validateDefenseEvents(input: unknown, base: DefenseContent = zeroBreachContent): readonly DefenseEventDefinition[] {
  const issues: string[] = [];
  if (!record(input) || input.schemaVersion !== 1 || !Array.isArray(input.events)) {
    throw new DefenseEventContentError(['root: schemaVersion 1 and events[] required']);
  }

  const knownEnemyIds = new Set(base.enemies.map(enemy => enemy.id));
  const knownWaveIds = new Set(base.waves.map(wave => wave.id));
  const eventIds = new Set<string>();
  const events: DefenseEventDefinition[] = [];

  for (const [eventIndex, raw] of input.events.entries()) {
    const path = `events[${eventIndex}]`;
    if (!record(raw)) {
      issues.push(`${path}: object required`);
      continue;
    }
    if (!str(raw.id) || !str(raw.contentVersion) || !str(raw.titleTextId) || !str(raw.briefingTextId)
      || !str(raw.mapId) || !str(raw.baseScenarioId) || !integer(raw.rewardVersion) || raw.rewardVersion < 1
      || !str(raw.firstClearCosmeticId) || !record(raw.debriefTextIds) || !record(raw.unlock)
      || !Array.isArray(raw.modifiers)) {
      issues.push(`${path}: missing required field`);
      continue;
    }
    if (eventIds.has(raw.id)) issues.push(`${path}.id: duplicate ${raw.id}`);
    eventIds.add(raw.id);

    if (raw.mapId !== base.map.id) issues.push(`${path}.mapId: unknown map ${raw.mapId}`);
    if (raw.baseScenarioId !== base.scenario.id) issues.push(`${path}.baseScenarioId: unknown scenario ${raw.baseScenarioId}`);
    for (const textId of [raw.titleTextId, raw.briefingTextId, raw.debriefTextIds.win, raw.debriefTextIds.lose, raw.debriefTextIds.perfect]) {
      if (!str(textId) || !textIds.has(textId)) issues.push(`${path}: missing localization ${String(textId)}`);
    }
    if (!cosmeticIds.has(raw.firstClearCosmeticId)) issues.push(`${path}: missing cosmetic ${raw.firstClearCosmeticId}`);

    const unlockAll = Array.isArray(raw.unlock.all) ? raw.unlock.all : [];
    if (!Array.isArray(raw.unlock.all) || unlockAll.length === 0) issues.push(`${path}.unlock.all: conditions required`);
    const unlock: DefenseUnlockCondition[] = [];
    for (const [conditionIndex, condition] of unlockAll.entries()) {
      const cpath = `${path}.unlock.all[${conditionIndex}]`;
      if (!record(condition) || !str(condition.kind)) {
        issues.push(`${cpath}: invalid condition`);
        continue;
      }
      if (condition.kind === 'scenario-cleared') {
        if (!str(condition.scenarioId) || condition.scenarioId !== base.scenario.id) {
          issues.push(`${cpath}: unknown scenario`);
          continue;
        }
        unlock.push({ kind: 'scenario-cleared', scenarioId: condition.scenarioId });
      } else if (condition.kind === 'story-fact') {
        if (!str(condition.factId) || !STORY_FACT_IDS.has(condition.factId as DefenseStoryFactId)) {
          issues.push(`${cpath}: unknown story fact`);
          continue;
        }
        unlock.push({ kind: 'story-fact', factId: condition.factId as DefenseStoryFactId });
      } else {
        issues.push(`${cpath}: unsupported condition ${condition.kind}`);
      }
    }

    const modifiers: DefenseEventModifier[] = [];
    const replacedWaves = new Set<number>();
    const hpEnemyIds = new Set<DefenseEnemyId>();
    const speedEnemyIds = new Set<DefenseEnemyId>();
    let initialResourceCount = 0;
    let supportResetCount = 0;

    for (const [modifierIndex, modifier] of raw.modifiers.entries()) {
      const mpath = `${path}.modifiers[${modifierIndex}]`;
      if (!record(modifier) || !str(modifier.kind)) {
        issues.push(`${mpath}: invalid modifier`);
        continue;
      }
      if (modifier.kind === 'replace-wave') {
        if (!integer(modifier.waveId) || !knownWaveIds.has(modifier.waveId) || !Array.isArray(modifier.groups)) {
          issues.push(`${mpath}: invalid replace-wave`);
          continue;
        }
        if (replacedWaves.has(modifier.waveId)) issues.push(`${mpath}: duplicate replace-wave ${modifier.waveId}`);
        replacedWaves.add(modifier.waveId);
        const groups = modifier.groups.map((group, groupIndex) => parseGroup(group, `${mpath}.groups[${groupIndex}]`, issues))
          .filter((group): group is DefenseSpawnGroup => group !== null);
        for (const group of groups) if (!knownEnemyIds.has(group.enemy)) issues.push(`${mpath}: unknown enemy ${group.enemy}`);
        modifiers.push({ kind: 'replace-wave', waveId: modifier.waveId, groups });
      } else if (modifier.kind === 'enemy-hp' || modifier.kind === 'enemy-speed') {
        if (!Array.isArray(modifier.enemyIds) || modifier.enemyIds.length === 0 || !positive(modifier.multiplier)) {
          issues.push(`${mpath}: invalid ${modifier.kind}`);
          continue;
        }
        const ids: DefenseEnemyId[] = [];
        for (const id of modifier.enemyIds) {
          if (!str(id) || !knownEnemyIds.has(id as DefenseEnemyId)) {
            issues.push(`${mpath}: unknown enemy ${String(id)}`);
            continue;
          }
          const enemyId = id as DefenseEnemyId;
          const seen = modifier.kind === 'enemy-hp' ? hpEnemyIds : speedEnemyIds;
          if (seen.has(enemyId)) issues.push(`${mpath}: duplicate ${modifier.kind} for ${enemyId}`);
          seen.add(enemyId);
          ids.push(enemyId);
        }
        modifiers.push({ kind: modifier.kind, enemyIds: ids, multiplier: modifier.multiplier });
      } else if (modifier.kind === 'initial-resource') {
        initialResourceCount += 1;
        if (initialResourceCount > 1) issues.push(`${mpath}: duplicate initial-resource`);
        if (!nonNegative(modifier.value)) {
          issues.push(`${mpath}: invalid initial-resource`);
          continue;
        }
        modifiers.push({ kind: 'initial-resource', value: modifier.value });
      } else if (modifier.kind === 'wave-support-reset') {
        supportResetCount += 1;
        if (supportResetCount > 1) issues.push(`${mpath}: duplicate wave-support-reset`);
        if (!Array.isArray(modifier.waveIds) || modifier.waveIds.length === 0) {
          issues.push(`${mpath}: invalid wave-support-reset`);
          continue;
        }
        const waveIds = modifier.waveIds.filter((id): id is number => integer(id) && knownWaveIds.has(id));
        if (waveIds.length !== modifier.waveIds.length || new Set(waveIds).size !== waveIds.length) {
          issues.push(`${mpath}: invalid or duplicate wave id`);
        }
        modifiers.push({ kind: 'wave-support-reset', waveIds });
      } else {
        issues.push(`${mpath}: unsupported modifier ${modifier.kind}`);
      }
    }

    events.push({
      id: raw.id,
      contentVersion: raw.contentVersion,
      titleTextId: raw.titleTextId,
      briefingTextId: raw.briefingTextId,
      mapId: raw.mapId,
      baseScenarioId: raw.baseScenarioId,
      unlock: { all: unlock },
      modifiers,
      rewardVersion: raw.rewardVersion,
      firstClearCosmeticId: raw.firstClearCosmeticId,
      debriefTextIds: {
        win: raw.debriefTextIds.win as string,
        lose: raw.debriefTextIds.lose as string,
        perfect: raw.debriefTextIds.perfect as string,
      },
    });
  }

  if (issues.length) throw new DefenseEventContentError(issues);

  for (const event of events) validateDefenseContent(applyDefenseEvent(base, event));
  return Object.freeze(events);
}

export const defenseEvents = validateDefenseEvents(rawEvents);

const contentByScenario = new Map<string, DefenseContent>([
  [zeroBreachContent.scenario.id, zeroBreachContent],
  ...defenseEvents.map(event => [event.id, applyDefenseEvent(zeroBreachContent, event)] as const),
  ...siteDefenseContents.map(content => [content.scenario.id, content] as const),
]);

export function defenseEventById(id: string): DefenseEventDefinition | undefined {
  return defenseEvents.find(event => event.id === id);
}

export function defenseContentForScenario(scenarioId: string): DefenseContent {
  const content = contentByScenario.get(scenarioId);
  if (!content) throw new Error(`Unknown defense scenario: ${scenarioId}`);
  return content;
}

export function resolveDefenseContentForRun(run: DefenseRunState): DefenseContent {
  const scenarioId = defenseScenarioIdForRun(run);
  const content = defenseContentForScenario(scenarioId);
  if (content.scenario.eventId) {
    if (run.eventId !== content.scenario.eventId || run.eventContentVersion !== content.scenario.eventContentVersion) {
      throw new Error(`Defense event version mismatch: ${run.eventId ?? 'none'}@${run.eventContentVersion ?? 'none'}`);
    }
  }
  return content;
}

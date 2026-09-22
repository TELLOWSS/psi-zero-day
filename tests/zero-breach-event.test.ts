import { describe, expect, it } from 'vitest';
import episodeEventsRaw from '../content/episode01/events.json';
import eventRaw from '../content/defense/events-v1.json';
import {
  defenseContentForScenario, defenseEvents, resolveDefenseContentForRun, validateDefenseEvents,
} from '../src/content/defense-events';
import { zeroBreachContent } from '../src/content/defense';
import type { DefenseRunState } from '../src/domain/defense';
import type { DefenseEventDefinition } from '../src/domain/defense-event';
import type { DefenseSaveDocument } from '../src/domain/defense-save';
import type { GameState } from '../src/domain/state';
import {
  applyDefenseEvent, defenseEventAvailability,
} from '../src/engine/defense-event';
import {
  applyDefenseCommand, createDefenseRun, defenseResult, tickDefense,
} from '../src/engine/defense';
import {
  applyDefenseOutcome, decodeDefenseSave, defensePayloadChecksum, emptyDefenseSaveDocument,
  firstClearClaimId, threeStarClaimId,
} from '../src/app/defense-save';
import {
  defenseEventAvailabilityFromState, defenseStoryFactsFromState, RAMP_SIGNAL_STORY_FACT,
} from '../src/app/defense-story-bridge';

const E1_ID = 'event-ramp-reconstruction-v1';

function trainingClearDocument(): DefenseSaveDocument {
  return {
    ...emptyDefenseSaveDocument(),
    records: [{
      scenarioId: 'training-ramp-v1',
      finishedRuns: 1,
      clears: 1,
      bestStars: 2,
      bestScore: 11000,
      bestShield: 15,
      bestCompletedWaves: 10,
      lastResultRunId: 'training-clear',
      updatedAt: '2026-09-22T00:00:00.000Z',
    }],
  };
}

describe('ZERO BREACH Step 6 — E0/E1 event bridge', () => {
  it('maps the verified Episode 01 ramp report flag instead of inventing a defense story flag', () => {
    const episodeEvents = episodeEventsRaw as unknown as Array<{
      event_id: string;
      choices?: Array<{ choice_id: string; effects?: { flags?: Record<string, unknown> } }>;
    }>;
    const source = episodeEvents.find(event => event.event_id === 'e01_04_junho_signal');
    expect(source).toBeDefined();

    const knownChoices = source?.choices?.filter(choice => choice.effects?.flags?.ramp_signal_known === true).map(choice => choice.choice_id) ?? [];
    expect(knownChoices).toEqual(expect.arrayContaining(['direct_follow', 'crosscheck_minseok']));
    expect(source?.choices?.find(choice => choice.choice_id === 'dismiss')?.effects?.flags?.ramp_signal_known).toBe(false);

    const knownState = { flags: { ramp_signal_known: true } } as unknown as GameState;
    const dismissedState = { flags: { ramp_signal_known: false } } as unknown as GameState;
    expect(defenseStoryFactsFromState(knownState).has(RAMP_SIGNAL_STORY_FACT)).toBe(true);
    expect(defenseStoryFactsFromState(dismissedState).has(RAMP_SIGNAL_STORY_FACT)).toBe(false);
  });

  it('unlocks E1 only when both training clear and ramp_signal_known are present', () => {
    const event = defenseEvents.find(item => item.id === E1_ID)!;
    const cleared = trainingClearDocument();
    const noClear = emptyDefenseSaveDocument();
    const knownState = { flags: { ramp_signal_known: true } } as unknown as GameState;
    const unknownState = { flags: { ramp_signal_known: false } } as unknown as GameState;

    expect(defenseEventAvailabilityFromState(event, knownState, cleared).unlocked).toBe(true);
    expect(defenseEventAvailabilityFromState(event, unknownState, cleared).unlocked).toBe(false);
    expect(defenseEventAvailabilityFromState(event, knownState, noClear).unlocked).toBe(false);
    expect(defenseEventAvailabilityFromState(event, unknownState, noClear).missing).toHaveLength(2);
  });

  it('materializes E1 from the base scenario without mutating the base numbers', () => {
    const event = defenseEvents.find(item => item.id === E1_ID)!;
    const before = JSON.stringify(zeroBreachContent);
    const e1 = applyDefenseEvent(zeroBreachContent, event);

    expect(JSON.stringify(zeroBreachContent)).toBe(before);
    expect(e1.scenario.id).toBe(E1_ID);
    expect(e1.scenario.eventId).toBe(E1_ID);
    expect(e1.scenario.eventContentVersion).toBe('event-ramp-reconstruction-1.0.0');
    expect(e1.scenario.supportResetWaveIds).toEqual([6, 8]);
    expect(e1.scenario.firstClearCosmetic).toBe('tablet-skin-signal-blue');
    expect(e1.scenario.threeStarCosmetic).toBeNull();
    expect(e1.scenario.mainStoryStatRewards).toEqual([]);
    expect(e1.waves.find(wave => wave.id === 6)?.groups).toEqual([
      { enemy: 'VEILED', count: 8, startTick: 0, intervalTicks: 30 },
      { enemy: 'NORMAL', count: 6, startTick: 60, intervalTicks: 35 },
    ]);
    expect(e1.waves.find(wave => wave.id === 8)?.groups).toEqual([
      { enemy: 'VEILED', count: 10, startTick: 0, intervalTicks: 25 },
      { enemy: 'SWIFT', count: 8, startTick: 70, intervalTicks: 20 },
    ]);
    expect(e1.waves.find(wave => wave.id === 5)).toEqual(zeroBreachContent.waves.find(wave => wave.id === 5));
    expect(e1.waves.find(wave => wave.id === 7)).toEqual(zeroBreachContent.waves.find(wave => wave.id === 7));
  });

  it('applies modifier categories in the documented order on one existing combat engine', () => {
    const synthetic: DefenseEventDefinition = {
      id: 'synthetic-order',
      contentVersion: '1',
      titleTextId: 'defense.event.e1.title',
      briefingTextId: 'defense.event.e1.briefing',
      mapId: 'ramp-01',
      baseScenarioId: 'training-ramp-v1',
      unlock: { all: [{ kind: 'scenario-cleared', scenarioId: 'training-ramp-v1' }] },
      modifiers: [
        { kind: 'initial-resource', value: 240 },
        { kind: 'enemy-speed', enemyIds: ['SWIFT'], multiplier: 1.1 },
        { kind: 'replace-wave', waveId: 2, groups: [{ enemy: 'VEILED', count: 4, startTick: 0, intervalTicks: 45 }] },
        { kind: 'enemy-hp', enemyIds: ['VEILED'], multiplier: 1.25 },
        { kind: 'wave-support-reset', waveIds: [2] },
      ],
      rewardVersion: 1,
      firstClearCosmeticId: 'tablet-skin-signal-blue',
      debriefTextIds: {
        win: 'defense.event.e1.debrief.win',
        lose: 'defense.event.e1.debrief.lose',
        perfect: 'defense.event.e1.debrief.perfect',
      },
    };
    const derived = applyDefenseEvent(zeroBreachContent, synthetic);
    expect(derived.initialResource).toBe(240);
    expect(derived.enemies.find(enemy => enemy.id === 'VEILED')?.hp).toBe(60);
    expect(derived.enemies.find(enemy => enemy.id === 'SWIFT')?.speed).toBeCloseTo(110);
    expect(derived.waves[1]?.groups[0]?.enemy).toBe('VEILED');
    expect(derived.scenario.supportResetWaveIds).toEqual([2]);
  });

  it('resets support cooldown once when E1 waves 6 and 8 actually start', () => {
    const e1 = defenseContentForScenario(E1_ID);
    const base = createDefenseRun(e1, 'COORDINATOR', 'event-reset');

    const manual = {
      ...base,
      status: 'INTERMISSION' as const,
      waveId: 6,
      supportCooldownRemaining: 321,
      spawnedByGroup: e1.waves.find(wave => wave.id === 6)!.groups.map(() => 0),
    };
    const manualStarted = applyDefenseCommand(manual, e1, { type: 'StartWave' });
    expect(manualStarted.supportCooldownRemaining).toBe(0);
    expect(manualStarted.status).toBe('RUNNING');

    const automatic = {
      ...base,
      status: 'INTERMISSION' as const,
      waveId: 8,
      intermissionRemaining: 1,
      supportCooldownRemaining: 444,
      spawnedByGroup: e1.waves.find(wave => wave.id === 8)!.groups.map(() => 0),
    };
    const autoStarted = tickDefense(automatic, e1);
    expect(autoStarted.status).toBe('RUNNING');
    expect(autoStarted.supportCooldownRemaining).toBe(0);

    const nextTick = tickDefense(autoStarted, e1);
    expect(nextTick.supportCooldownRemaining).toBe(0);
  });

  it('rejects duplicate event modifiers and bad references before runtime', () => {
    const duplicate = structuredClone(eventRaw) as any;
    duplicate.events[0].modifiers.push({
      kind: 'replace-wave',
      waveId: 6,
      groups: [{ enemy: 'NORMAL', count: 1, startTick: 0, intervalTicks: 1 }],
    });
    duplicate.events[0].modifiers.push({ kind: 'wave-support-reset', waveIds: [6] });
    duplicate.events[0].firstClearCosmeticId = 'missing-cosmetic';
    expect(() => validateDefenseEvents(duplicate)).toThrow(/duplicate replace-wave 6/);
    expect(() => validateDefenseEvents(duplicate)).toThrow(/duplicate wave-support-reset/);
    expect(() => validateDefenseEvents(duplicate)).toThrow(/missing cosmetic/);
  });

  it('normalizes pre-Step-6 active runs instead of treating compatible old saves as corrupt', () => {
    const current = createDefenseRun(zeroBreachContent, 'OBSERVER', 'legacy-active');
    const legacyRun: any = { ...current };
    delete legacyRun.scenarioId;
    delete legacyRun.eventId;
    delete legacyRun.eventContentVersion;
    delete legacyRun.leakedByEnemy;

    const legacyDocument: any = {
      activeRun: legacyRun,
      records: [],
      cosmeticIds: [],
      claimIds: [],
      settledRunIds: [],
    };
    const envelope = {
      namespace: 'defense',
      schemaVersion: 1,
      rulesVersion: zeroBreachContent.rulesVersion,
      contentVersion: zeroBreachContent.contentVersion,
      buildVersion: '0.1.0',
      revision: 4,
      savedAt: '2026-09-22T00:00:00.000Z',
      checksum: defensePayloadChecksum(legacyDocument as DefenseSaveDocument),
      payload: legacyDocument,
    };
    const decoded = decodeDefenseSave(JSON.stringify(envelope));
    expect(decoded?.payload.activeRun?.scenarioId).toBe('training-ramp-v1');
    expect(decoded?.payload.activeRun?.eventId).toBeNull();
    expect(decoded?.payload.activeRun?.eventContentVersion).toBeNull();
    expect(decoded?.payload.activeRun?.leakedByEnemy).toEqual({});
  });

  it('records leak counts by risk type for the E1 debrief', () => {
    const content = defenseContentForScenario(E1_ID);
    const base = createDefenseRun(content, 'COORDINATOR', 'leak-counter');
    const normal = content.enemies.find(enemy => enemy.id === 'NORMAL')!;
    const pathLength = content.map.path.slice(1).reduce((sum, point, index) => {
      const prev = content.map.path[index]!;
      return sum + Math.hypot(point[0] - prev[0], point[1] - prev[1]);
    }, 0);
    const run = {
      ...base,
      status: 'RUNNING' as const,
      enemies: [{
        id: 'enemy-leak',
        enemyId: 'NORMAL' as const,
        hp: normal.hp,
        distance: pathLength - 0.1,
        spawnSequence: 1,
        revealUntilTick: 0,
        slowEffects: [],
        bossPhaseTriggered: false,
        bossArmorFromTick: 0,
        bossArmorUntilTick: 0,
      }],
      spawnedByGroup: content.waves[0]!.groups.map(group => group.count),
    };
    const next = tickDefense(run, content);
    expect(next.leakedByEnemy.NORMAL).toBe(1);
    expect(next.shield).toBe(content.initialShield - normal.leak);
  });

  it('awards only the E1 first-clear cosmetic once, even on a three-star result', () => {
    const content = defenseContentForScenario(E1_ID);
    const finished = {
      ...createDefenseRun(content, 'COORDINATOR', 'event-win'),
      status: 'WON' as const,
      completedWaves: 10,
      shield: 20,
    };
    const result = defenseResult(finished);
    expect(result.stars).toBe(3);

    const first = applyDefenseOutcome(emptyDefenseSaveDocument(), content, finished, result, '2026-09-22T00:00:00.000Z');
    expect(first.awardedCosmeticIds).toEqual(['tablet-skin-signal-blue']);
    expect(first.document.claimIds).toContain(firstClearClaimId(content));
    expect(first.document.claimIds).not.toContain(threeStarClaimId(content));
    expect(first.document.cosmeticIds).not.toContain('badge-no-breach');

    const again = applyDefenseOutcome(first.document, content, finished, result, '2026-09-22T00:01:00.000Z');
    expect(again.applied).toBe(false);
    expect(again.awardedCosmeticIds).toEqual([]);
  });

  it('refuses to resume an event run under a different event content version', () => {
    const content = defenseContentForScenario(E1_ID);
    const run = createDefenseRun(content, 'OBSERVER', 'event-version');
    expect(resolveDefenseContentForRun(run).scenario.id).toBe(E1_ID);
    const stale = { ...run, eventContentVersion: 'event-ramp-reconstruction-0.9.0' } as DefenseRunState;
    expect(() => resolveDefenseContentForRun(stale)).toThrow(/version mismatch/);
  });

  it('keeps raw unlock evaluation deterministic for old scenario records', () => {
    const event = defenseEvents[0]!;
    const availability = defenseEventAvailability(event, {
      clearedScenarioIds: new Set(['training-ramp-v1']),
      storyFacts: new Set([RAMP_SIGNAL_STORY_FACT]),
    });
    expect(availability.unlocked).toBe(true);
    expect(availability.missing).toEqual([]);
  });
});

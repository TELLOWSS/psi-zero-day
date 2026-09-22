import { describe, expect, it } from 'vitest';
import { zeroBreachContent as content } from '../src/content/defense';
import type { DefenseContent, DefenseRunState } from '../src/domain';
import {
  applyDefenseOutcome, decodeDefenseSave, emptyDefenseSaveDocument, encodeDefenseSave,
  firstClearClaimId, inspectDefenseSave, resumeDefenseRun, threeStarClaimId, withDefenseActiveRun,
  writeDefenseSave, DEFENSE_SAVE_KEY,
} from '../src/app/defense-save';
import { EPISODE01_SAVE_KEY } from '../src/app/episode-save';
import { advanceDefense, applyDefenseCommand, createDefenseRun, defenseResult } from '../src/engine/defense';
import type { StoragePort } from '../src/platform/storage';

class MemoryStorage implements StoragePort {
  readonly values = new Map<string, string>();
  failWrites = false;

  async read(key: string) { return this.values.get(key) ?? null; }
  async write(key: string, serialized: string) {
    if (this.failWrites) throw new Error('quota exceeded');
    this.values.set(key, serialized);
  }
  async remove(key: string) { this.values.delete(key); }
  async keys() { return [...this.values.keys()]; }
}

function activeRun(runId = 'run-save-test'): DefenseRunState {
  let state = createDefenseRun(content, 'COORDINATOR', runId);
  state = applyDefenseCommand(state, content, { type: 'Build', padId: 'P1', towerId: 'PULSE' });
  state = applyDefenseCommand(state, content, { type: 'Upgrade', towerInstanceId: 'tower-1', levelId: 'L2' });
  state = applyDefenseCommand(state, content, { type: 'StartWave' });
  return advanceDefense(state, content, 25);
}

describe('ZERO BREACH step 3 save envelope', () => {
  it('round-trips the complete active run in the isolated defense namespace', async () => {
    const storage = new MemoryStorage();
    storage.values.set(EPISODE01_SAVE_KEY, 'episode-sentinel');
    const run = activeRun();

    await writeDefenseSave(storage, content, withDefenseActiveRun(emptyDefenseSaveDocument(), run), 0, '2026-09-22T09:00:00.000Z');

    expect(storage.values.get(EPISODE01_SAVE_KEY)).toBe('episode-sentinel');
    const raw = storage.values.get(DEFENSE_SAVE_KEY);
    expect(raw).toBeTruthy();
    const envelope = decodeDefenseSave(raw!);
    expect(envelope?.payload.activeRun).toEqual(run);
    expect(envelope?.rulesVersion).toBe(content.rulesVersion);
    expect(envelope?.contentVersion).toBe(content.contentVersion);

    const loaded = await inspectDefenseSave(storage, content);
    expect(loaded.kind).toBe('ready');
    if (loaded.kind !== 'ready' || !loaded.document.activeRun) throw new Error('expected active run');
    const resumed = resumeDefenseRun(loaded.document.activeRun);
    expect(resumed.paused).toBe(true);
    expect({ ...resumed, paused: run.paused }).toEqual(run);
  });

  it('keeps corrupt raw storage in place instead of silently deleting it', async () => {
    const storage = new MemoryStorage();
    storage.values.set(DEFENSE_SAVE_KEY, '{"broken":true}');

    const loaded = await inspectDefenseSave(storage, content);

    expect(loaded.kind).toBe('corrupt');
    expect(storage.values.get(DEFENSE_SAVE_KEY)).toBe('{"broken":true}');
  });

  it('blocks incompatible run resume while preserving profile records and cosmetics', async () => {
    const storage = new MemoryStorage();
    const document = {
      ...emptyDefenseSaveDocument(),
      activeRun: activeRun('old-run'),
      records: [{
        scenarioId: content.scenario.id,
        finishedRuns: 2,
        clears: 1,
        bestStars: 2 as const,
        bestScore: 9200,
        bestShield: 16,
        bestCompletedWaves: 10,
        lastResultRunId: 'older-result',
        updatedAt: '2026-09-22T08:00:00.000Z',
      }],
      cosmeticIds: ['profile-frame-first-line'],
      claimIds: [firstClearClaimId(content)],
    };
    const oldContent = { ...content, rulesVersion: 'zero-breach-0.9.0' } as DefenseContent;
    storage.values.set(DEFENSE_SAVE_KEY, encodeDefenseSave(document, oldContent, 4, '2026-09-22T08:30:00.000Z'));

    const loaded = await inspectDefenseSave(storage, content);

    expect(loaded.kind).toBe('version-mismatch');
    if (loaded.kind !== 'version-mismatch') throw new Error('expected mismatch');
    expect(loaded.document.activeRun?.runId).toBe('old-run');
    expect(loaded.document.records[0]?.bestScore).toBe(9200);
    expect(loaded.document.cosmeticIds).toContain('profile-frame-first-line');
  });

  it('preserves the previous committed document when a quota-style write fails', async () => {
    const storage = new MemoryStorage();
    const first = withDefenseActiveRun(emptyDefenseSaveDocument(), activeRun('committed'));
    await writeDefenseSave(storage, content, first, 0);
    const committedRaw = storage.values.get(DEFENSE_SAVE_KEY);

    storage.failWrites = true;
    const changed = withDefenseActiveRun(first, { ...first.activeRun!, resource: 1 });
    await expect(writeDefenseSave(storage, content, changed, 1)).rejects.toThrow('quota exceeded');

    expect(storage.values.get(DEFENSE_SAVE_KEY)).toBe(committedRaw);
  });
});

describe('ZERO BREACH atomic result claims', () => {
  it('applies one result transaction once even after duplicate result handling', () => {
    const won: DefenseRunState = {
      ...createDefenseRun(content, 'COORDINATOR', 'winner-once'),
      status: 'WON',
      completedWaves: 10,
      shield: 20,
    };
    const first = applyDefenseOutcome(emptyDefenseSaveDocument(), content, won, defenseResult(won), '2026-09-22T09:00:00.000Z');

    expect(first.applied).toBe(true);
    expect(first.document.claimIds).toEqual(expect.arrayContaining([firstClearClaimId(content), threeStarClaimId(content)]));
    expect(first.document.cosmeticIds).toEqual(expect.arrayContaining([
      content.scenario.firstClearCosmetic,
      content.scenario.threeStarCosmetic,
    ]));
    expect(first.document.records[0]).toMatchObject({ finishedRuns: 1, clears: 1, bestStars: 3 });
    expect(first.document.activeRun).toBeNull();

    const duplicate = applyDefenseOutcome(first.document, content, won, defenseResult(won), '2026-09-22T09:01:00.000Z');
    expect(duplicate.applied).toBe(false);
    expect(duplicate.document).toBe(first.document);
    expect(duplicate.document.records[0]?.finishedRuns).toBe(1);
    expect(duplicate.document.claimIds).toHaveLength(2);
  });

  it('grants first-clear once and later three-star once on a separate run', () => {
    const twoStar: DefenseRunState = {
      ...createDefenseRun(content, 'OBSERVER', 'two-star-run'),
      status: 'WON',
      completedWaves: 10,
      shield: 17,
    };
    const first = applyDefenseOutcome(emptyDefenseSaveDocument(), content, twoStar, defenseResult(twoStar));
    expect(first.awardedCosmeticIds).toEqual([content.scenario.firstClearCosmetic]);
    expect(first.document.claimIds).toEqual([firstClearClaimId(content)]);

    const threeStar: DefenseRunState = {
      ...createDefenseRun(content, 'OBSERVER', 'three-star-run'),
      status: 'WON',
      completedWaves: 10,
      shield: 20,
    };
    const second = applyDefenseOutcome(first.document, content, threeStar, defenseResult(threeStar));
    expect(second.awardedCosmeticIds).toEqual([content.scenario.threeStarCosmetic]);
    expect(second.document.claimIds).toEqual(expect.arrayContaining([firstClearClaimId(content), threeStarClaimId(content)]));
    expect(second.document.records[0]).toMatchObject({ finishedRuns: 2, clears: 2, bestStars: 3 });
  });

  it('recovers a terminal activeRun after restart and settles that run only once', async () => {
    const storage = new MemoryStorage();
    const won: DefenseRunState = {
      ...createDefenseRun(content, 'COORDINATOR', 'crash-between-result-and-claim'),
      status: 'WON',
      completedWaves: 10,
      shield: 20,
    };
    await writeDefenseSave(storage, content, withDefenseActiveRun(emptyDefenseSaveDocument(), won), 0);

    const loaded = await inspectDefenseSave(storage, content);
    if (loaded.kind !== 'ready' || !loaded.document.activeRun) throw new Error('terminal run missing');
    const settled = applyDefenseOutcome(loaded.document, content, loaded.document.activeRun, defenseResult(loaded.document.activeRun));
    await writeDefenseSave(storage, content, settled.document, loaded.revision);

    const reloaded = await inspectDefenseSave(storage, content);
    if (reloaded.kind !== 'ready') throw new Error('settled document missing');
    expect(reloaded.document.activeRun).toBeNull();
    expect(reloaded.document.claimIds).toHaveLength(2);
    expect(reloaded.document.records[0]?.finishedRuns).toBe(1);
  });
});

describe('ZERO BREACH resume determinism', () => {
  it.each([1, 2] as const)('matches uninterrupted simulation after serialized resume at %sx', speed => {
    let direct = activeRun(`resume-${speed}x`);
    direct = applyDefenseCommand(direct, content, { type: 'SetSpeed', speed });
    const raw = encodeDefenseSave(withDefenseActiveRun(emptyDefenseSaveDocument(), direct), content, 1);
    const restored = decodeDefenseSave(raw)?.payload.activeRun;
    if (!restored) throw new Error('restore failed');

    const directAfter = advanceDefense(direct, content, 40);
    const restoredAfter = advanceDefense({ ...restored, paused: false }, content, 40);

    expect(restoredAfter).toEqual(directAfter);
  });
});

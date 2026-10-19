/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EpisodeSession } from '../src/app/episode-session';
import {
  encodeDefenseSave, emptyDefenseSaveDocument, inspectDefenseSave, withDefenseActiveRun,
} from '../src/app/defense-save';
import { zeroBreachContent } from '../src/content/defense';
import { advanceDefense, applyDefenseCommand, createDefenseRun } from '../src/engine/defense';
import type { StoragePort } from '../src/platform/storage';
import { DefenseGame } from '../src/ui/DefenseGame';
import { GUARD_ENTRY, guardContents } from '../src/content/guard-campaign';
import { GUARD_SAVE_KEY, guardStoragePort } from '../src/app/guard-storage';
import { guardPersistenceContent } from '../src/app/guard-save-version';
import { defenseText } from '../src/app/defense-text';

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

function sessionStub(): EpisodeSession {
  return {
    character: (id: string) => ({ id, name: id === 'kang_taesik' ? '강태식' : '임준호', role: '현장 동료' }),
    assetUri: (id: string) => `assets/${id}.webp`,
  } as unknown as EpisodeSession;
}

async function settleEffects(rounds = 8) {
  await act(async () => {
    for (let index = 0; index < rounds; index += 1) await Promise.resolve();
  });
}

async function mount(storage: StoragePort, requestedScenarioId?: string) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const onExit = vi.fn();
  await act(async () => {
    root.render(<DefenseGame session={sessionStub()} onExit={onExit} storage={storage} requestedScenarioId={requestedScenarioId} />);
    for (let index = 0; index < 8; index += 1) await Promise.resolve();
  });
  return { host, root, onExit };
}

function buttonContaining(host: HTMLElement, label: string): HTMLButtonElement {
  const button = [...host.querySelectorAll('button')].find(candidate => candidate.textContent?.includes(label));
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing button: ${label}`);
  return button;
}

async function click(element: Element) {
  await act(async () => {
    (element as HTMLElement).click();
    for (let index = 0; index < 5; index += 1) await Promise.resolve();
  });
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  window.localStorage.clear();
  vi.useFakeTimers();
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
  window.localStorage.clear();
});

describe('ZERO BREACH step 3 persistence UI', () => {
  it('persists a targeting change immediately and restores it after a reload', async () => {
    const storage = new MemoryStorage();
    const first = await mount(storage);
    try {
      await click(first.host.querySelector('[data-support="COORDINATOR"]')!);
      await click(first.host.querySelector('.zb-pad-hit')!);
      await click(first.host.querySelector('.zb-tower-shop button')!);
      const targetButtons = first.host.querySelectorAll<HTMLButtonElement>('.zb-target-mode button');
      expect(targetButtons.length).toBeGreaterThan(1);
      await click(targetButtons[1]!);
      const saved = await inspectDefenseSave(storage, zeroBreachContent);
      if (saved.kind !== 'ready') throw new Error('targeting save missing');
      expect(saved.document.activeRun?.towers[0]?.targetMode).toBe(zeroBreachContent.targetModes[1]);
    } finally { await act(async () => first.root.unmount()); }
    const second = await mount(storage);
    try {
      await click(buttonContaining(second.host, '이어서 훈련'));
      await click(second.host.querySelector('.zb-pad-hit')!);
      expect(second.host.querySelector('.zb-target-mode button[aria-pressed="true"]')?.textContent).toBe(defenseText(`defense.ui.target.${zeroBreachContent.targetModes[1]}`));
    } finally { await act(async () => second.root.unmount()); }
  });

  it('retries a guard defeat with a fresh run and starting budget while preserving one loss record', async () => {
    const storage = new MemoryStorage(), content = guardContents[0]!;
    let run = createDefenseRun(content, 'COORDINATOR', 'guard-retry-loss');
    run = applyDefenseCommand(run, content, {type:'StartWave'});
    run = {...run, shield:1, enemies:[{id:'exit', enemyId:'NORMAL', hp:1, distance:99999, spawnSequence:0, revealUntilTick:0, slowEffects:[], bossPhaseTriggered:false, bossArmorFromTick:0, bossArmorUntilTick:0}]};
    storage.values.set(GUARD_SAVE_KEY, encodeDefenseSave(withDefenseActiveRun(emptyDefenseSaveDocument(), run), guardPersistenceContent, 1));
    const {host, root} = await mount(storage, GUARD_ENTRY);
    try {
      await click(buttonContaining(host, '이어하기'));
      await click(buttonContaining(host, '재개'));
      await act(async () => { await vi.advanceTimersByTimeAsync(300); });
      await settleEffects(20);
      expect(host.querySelector('.zb-result')).not.toBeNull();
      await click(buttonContaining(host, '다시 도전'));
      expect(host.querySelector('[data-defense-screen="support-select"]')).not.toBeNull();
      await click(host.querySelector('[data-support="COORDINATOR"]')!);
      await settleEffects(20);
      const saved = await inspectDefenseSave(guardStoragePort(storage), guardPersistenceContent);
      if (saved.kind !== 'ready') throw new Error('retry save missing');
      expect(saved.document.activeRun).toMatchObject({status:'READY', resource:content.initialResource, shield:content.initialShield, waveId:1, towers:[]});
      expect(saved.document.activeRun?.runId).not.toBe(run.runId);
      expect(saved.document.records[0]).toMatchObject({finishedRuns:1, clears:0, lastResultRunId:run.runId, lastResultWon:false});
    } finally { await act(async () => root.unmount()); }
  });

  it('offers explicit paused resume instead of auto-running after reload', async () => {
    const storage = new MemoryStorage();
    let run = createDefenseRun(zeroBreachContent, 'COORDINATOR', 'resume-ui');
    run = applyDefenseCommand(run, zeroBreachContent, { type: 'Build', padId: 'P1', towerId: 'PULSE' });
    run = applyDefenseCommand(run, zeroBreachContent, { type: 'StartWave' });
    run = advanceDefense(run, zeroBreachContent, 15);
    storage.values.set(
      'psi-zero-day.defense.save.v1',
      encodeDefenseSave(withDefenseActiveRun(emptyDefenseSaveDocument(), run), zeroBreachContent, 3),
    );

    const { host, root } = await mount(storage);

    expect(host.querySelector('[data-defense-screen="save-resume"]')).not.toBeNull();
    expect(host.textContent).toContain('중단한 훈련이 있습니다');
    expect(host.querySelector('[data-defense-screen="combat"]')).toBeNull();

    await click(buttonContaining(host, '이어서 훈련'));
    expect(host.querySelector('[data-defense-screen="combat"]')).not.toBeNull();
    expect(buttonContaining(host, '재개')).toBeInstanceOf(HTMLButtonElement);
    const runId = host.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-run-id');
    expect(runId).toBe('resume-ui');

    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });
    expect(buttonContaining(host, '재개')).toBeInstanceOf(HTMLButtonElement);

    await act(async () => root.unmount());
  });

  it('does not silently delete corrupt storage and requires confirmed replacement', async () => {
    const storage = new MemoryStorage();
    storage.values.set('psi-zero-day.defense.save.v1', '{"broken":true}');
    const { host, root } = await mount(storage);

    expect(host.querySelector('[data-defense-screen="save-corrupt"]')).not.toBeNull();
    expect(storage.values.get('psi-zero-day.defense.save.v1')).toBe('{"broken":true}');

    await click(buttonContaining(host, '새로 시작'));
    expect(host.textContent).toContain('현재 훈련을 버리고 새로 시작할까요?');
    const confirmButtons = [...host.querySelectorAll('.zb-save-confirm button')];
    const confirm = confirmButtons.find(button => button.textContent?.includes('새로 시작'));
    if (!confirm) throw new Error('confirm button missing');
    await click(confirm);
    await settleEffects();

    expect(host.querySelector('[data-defense-screen="support-select"]')).not.toBeNull();
    expect(storage.values.get('psi-zero-day.defense.save.v1')).not.toBe('{"broken":true}');

    await act(async () => root.unmount());
  });

  it('shows unsaved state and retry when the storage write fails', async () => {
    const storage = new MemoryStorage();
    const { host, root } = await mount(storage);
    storage.failWrites = true;

    await click(host.querySelector('[data-support="COORDINATOR"]')!);
    await settleEffects();

    expect(host.querySelector('[data-defense-screen="combat"]')).not.toBeNull();
    expect(host.querySelector('[data-save-status="error"]')).not.toBeNull();
    expect(buttonContaining(host, '저장 다시 시도')).toBeInstanceOf(HTMLButtonElement);

    await act(async () => root.unmount());
  });

  it('autosaves active combat progress on the two-second cadence', async () => {
    const storage = new MemoryStorage();
    const { host, root } = await mount(storage);

    await click(host.querySelector('[data-support="COORDINATOR"]')!);
    await click(buttonContaining(host, '웨이브 시작'));
    await settleEffects();

    const before = await inspectDefenseSave(storage, zeroBreachContent);
    if (before.kind !== 'ready' || !before.document.activeRun) throw new Error('initial run save missing');
    const beforeTick = before.document.activeRun.tick;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_100);
      for (let index = 0; index < 8; index += 1) await Promise.resolve();
    });

    const after = await inspectDefenseSave(storage, zeroBreachContent);
    if (after.kind !== 'ready' || !after.document.activeRun) throw new Error('autosave missing');
    expect(after.document.activeRun.tick).toBeGreaterThan(beforeTick);
    expect(after.document.activeRun.status).toBe('RUNNING');

    await act(async () => root.unmount());
  });

  it('saves a paused activeRun before returning to the main game', async () => {
    const storage = new MemoryStorage();
    const { host, root, onExit } = await mount(storage);

    await click(host.querySelector('[data-support="OBSERVER"]')!);
    await click(buttonContaining(host, '웨이브 시작'));
    await click(buttonContaining(host, '본편 허브로'));
    await settleEffects(12);

    expect(onExit).toHaveBeenCalledTimes(1);
    const inspected = await inspectDefenseSave(storage, zeroBreachContent);
    expect(inspected.kind).toBe('ready');
    if (inspected.kind !== 'ready') throw new Error('save missing');
    expect(inspected.document.activeRun?.paused).toBe(true);
    expect(inspected.document.activeRun?.supportId).toBe('OBSERVER');

    await act(async () => root.unmount());
  });
});

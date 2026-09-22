/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EpisodeSession } from '../src/app/episode-session';
import {
  encodeDefenseSave, emptyDefenseSaveDocument, inspectDefenseSave,
} from '../src/app/defense-save';
import { zeroBreachContent } from '../src/content/defense';
import type { DefenseSaveDocument } from '../src/domain/defense-save';
import type { GameState } from '../src/domain/state';
import type { StoragePort } from '../src/platform/storage';
import { DefenseGame } from '../src/ui/DefenseGame';

class MemoryStorage implements StoragePort {
  readonly values = new Map<string, string>();
  async read(key: string) { return this.values.get(key) ?? null; }
  async write(key: string, serialized: string) { this.values.set(key, serialized); }
  async remove(key: string) { this.values.delete(key); }
  async keys() { return [...this.values.keys()]; }
}

function episodeState(rampKnown: boolean): GameState {
  return {
    flags: { ramp_signal_known: rampKnown },
  } as unknown as GameState;
}

function sessionStub(state: GameState): EpisodeSession {
  return {
    getSnapshot: () => ({ revision: 7, state }),
    character: (id: string) => ({
      id,
      name: id === 'kang_taesik' ? '강태식' : id === 'lim_junho' ? '임준호' : id,
      role: '현장 동료',
    }),
    assetUri: (id: string) => `assets/${id}.webp`,
  } as unknown as EpisodeSession;
}

function clearedTrainingDocument(): DefenseSaveDocument {
  return {
    ...emptyDefenseSaveDocument(),
    records: [{
      scenarioId: 'training-ramp-v1',
      finishedRuns: 1,
      clears: 1,
      bestStars: 2,
      bestScore: 11600,
      bestShield: 16,
      bestCompletedWaves: 10,
      lastResultRunId: 'prior-training-clear',
      updatedAt: '2026-09-22T00:00:00.000Z',
    }],
  };
}

function seed(storage: MemoryStorage, document: DefenseSaveDocument) {
  storage.values.set(
    'psi-zero-day.defense.save.v1',
    encodeDefenseSave(document, zeroBreachContent, 3, '2026-09-22T00:00:00.000Z'),
  );
}

async function settle(rounds = 8) {
  await act(async () => {
    for (let index = 0; index < rounds; index += 1) await Promise.resolve();
  });
}

async function mount(state: GameState, storage: MemoryStorage) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const onExit = vi.fn();
  const session = sessionStub(state);
  await act(async () => {
    root.render(
      <DefenseGame
        session={session}
        onExit={onExit}
        storage={storage}
        requestedScenarioId={null}
      />,
    );
    for (let index = 0; index < 10; index += 1) await Promise.resolve();
  });
  return { host, root, onExit, session };
}

async function click(element: Element) {
  await act(async () => {
    (element as HTMLElement).click();
    for (let index = 0; index < 6; index += 1) await Promise.resolve();
  });
}

function buttonContaining(host: HTMLElement, label: string): HTMLButtonElement {
  const button = [...host.querySelectorAll('button')].find(candidate => candidate.textContent?.includes(label));
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing button: ${label}`);
  return button;
}

beforeEach(() => {
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
  delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
  window.localStorage.clear();
});

describe('ZERO BREACH Step 6 event entry UI', () => {
  it('keeps training always available and explains both missing E1 requirements', async () => {
    const storage = new MemoryStorage();
    const state = episodeState(false);
    const before = JSON.stringify(state);
    const { host, root } = await mount(state, storage);

    expect(host.querySelector('[data-defense-screen="scenario-select"]')).not.toBeNull();
    const training = host.querySelector('[data-scenario="training-ramp-v1"]');
    const event = host.querySelector('[data-scenario="event-ramp-reconstruction-v1"]') as HTMLButtonElement | null;
    expect(training).toBeInstanceOf(HTMLButtonElement);
    expect(event).toBeInstanceOf(HTMLButtonElement);
    expect(event?.disabled).toBe(true);
    expect(host.textContent).toContain('기본 방어 훈련을 먼저 클리어해야 합니다.');
    expect(host.textContent).toContain('본편에서 임준호의 경사로 제보를 확인해야 합니다.');

    await click(training!);
    expect(host.querySelector('[data-defense-screen="support-select"]')?.getAttribute('data-scenario')).toBe('training-ramp-v1');
    expect(JSON.stringify(state)).toBe(before);

    await act(async () => root.unmount());
  });

  it('unlocks E1 from an existing training-clear record plus the real episode fact', async () => {
    const storage = new MemoryStorage();
    seed(storage, clearedTrainingDocument());
    const state = episodeState(true);
    const before = JSON.stringify(state);
    const { host, root } = await mount(state, storage);

    const event = host.querySelector('[data-scenario="event-ramp-reconstruction-v1"]') as HTMLButtonElement | null;
    expect(event).toBeInstanceOf(HTMLButtonElement);
    expect(event?.disabled).toBe(false);
    expect(event?.textContent).toContain('연결 훈련 해금');

    await click(event!);
    const prep = host.querySelector('[data-defense-screen="support-select"]');
    expect(prep?.getAttribute('data-scenario')).toBe('event-ramp-reconstruction-v1');
    expect(host.textContent).toContain('잠복 파형이 늘어납니다. 6·8웨이브 시작 시 동료 지원이 다시 준비됩니다.');

    await click(host.querySelector('[data-support="COORDINATOR"]')!);
    const combat = host.querySelector('[data-defense-screen="combat"]');
    expect(combat?.getAttribute('data-scenario')).toBe('event-ramp-reconstruction-v1');
    expect(combat?.getAttribute('data-event')).toBe('event-ramp-reconstruction-v1');
    expect(JSON.stringify(state)).toBe(before);

    await settle();
    const inspected = await inspectDefenseSave(storage, zeroBreachContent);
    expect(inspected.kind).toBe('ready');
    if (inspected.kind !== 'ready' || !inspected.document.activeRun) throw new Error('event run save missing');
    expect(inspected.document.activeRun.mode).toBe('EVENT');
    expect(inspected.document.activeRun.variant).toBe('EVENT_MODIFIED');
    expect(inspected.document.activeRun.scenarioId).toBe('event-ramp-reconstruction-v1');
    expect(inspected.document.activeRun.eventContentVersion).toBe('event-ramp-reconstruction-1.0.0');

    await act(async () => root.unmount());
  });

  it('returns from an active E1 run without advancing or replacing the Episode 01 state', async () => {
    const storage = new MemoryStorage();
    seed(storage, clearedTrainingDocument());
    const state = episodeState(true);
    const before = JSON.stringify(state);
    const { host, root, onExit } = await mount(state, storage);

    await click(host.querySelector('[data-scenario="event-ramp-reconstruction-v1"]')!);
    await click(host.querySelector('[data-support="OBSERVER"]')!);
    await click(buttonContaining(host, '웨이브 시작'));
    await click(buttonContaining(host, '본편 허브로'));
    await settle(12);

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(state)).toBe(before);

    const inspected = await inspectDefenseSave(storage, zeroBreachContent);
    expect(inspected.kind).toBe('ready');
    if (inspected.kind !== 'ready') throw new Error('save missing');
    expect(inspected.document.activeRun?.scenarioId).toBe('event-ramp-reconstruction-v1');
    expect(inspected.document.activeRun?.paused).toBe(true);

    await act(async () => root.unmount());
  });
});

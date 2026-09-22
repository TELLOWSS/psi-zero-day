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

async function mount(storage: StoragePort) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const onExit = vi.fn();
  await act(async () => {
    root.render(<DefenseGame session={sessionStub()} onExit={onExit} storage={storage} />);
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

describe('ZERO BREACH step 3 persistence UI', () => {
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

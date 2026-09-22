/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EpisodeSession } from '../src/app/episode-session';
import { DEFENSE_TUTORIAL_PREF_KEY } from '../src/app/defense-tutorial';
import type { StoragePort } from '../src/platform/storage';
import { DefenseGame } from '../src/ui/DefenseGame';

class MemoryStorage implements StoragePort {
  readonly values = new Map<string, string>();
  async read(key: string) { return this.values.get(key) ?? null; }
  async write(key: string, serialized: string) { this.values.set(key, serialized); }
  async remove(key: string) { this.values.delete(key); }
  async keys() { return [...this.values.keys()]; }
}

function sessionStub(): EpisodeSession {
  return {
    character: (id: string) => ({ id, name: id === 'kang_taesik' ? '강태식' : '임준호', role: '현장 동료' }),
    assetUri: (id: string) => `assets/${id}.webp`,
  } as unknown as EpisodeSession;
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

async function mount() {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(<DefenseGame session={sessionStub()} onExit={() => {}} storage={new MemoryStorage()} />);
    for (let index = 0; index < 8; index += 1) await Promise.resolve();
  });
  return { host, root };
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

describe('ZERO BREACH step 4 first-run tutorial', () => {
  it('guides placement -> start -> upgrade -> next-wave preview and can be replayed from settings', async () => {
    const { host, root } = await mount();
    await click(host.querySelector('[data-support="COORDINATOR"]')!);

    expect(host.querySelector('[data-tutorial-step="PLACE"]')).not.toBeNull();

    await click(host.querySelector('button[aria-label^="P1 ·"]')!);
    await click(buttonContaining(host, '펄스 대응기'));
    expect(host.querySelector('[data-tutorial-step="START"]')).not.toBeNull();

    await click(buttonContaining(host, '웨이브 시작'));
    expect(host.querySelector('.zb-tutorial')).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(40_000);
      for (let index = 0; index < 8; index += 1) await Promise.resolve();
    });

    expect(host.querySelector('[data-tutorial-step="UPGRADE"]')).not.toBeNull();
    expect(buttonContaining(host, '재개')).toBeInstanceOf(HTMLButtonElement);

    await click(buttonContaining(host, '강화 L2'));
    expect(host.querySelector('[data-tutorial-step="PREVIEW"]')).not.toBeNull();
    expect(host.textContent).toContain('다음 위험을 먼저 읽으세요');

    await click(buttonContaining(host, '안내 완료'));
    expect(host.querySelector('.zb-tutorial')).toBeNull();
    expect(window.localStorage.getItem(DEFENSE_TUTORIAL_PREF_KEY)).toBe('seen');

    await click(buttonContaining(host, '설정'));
    await click(buttonContaining(host, '첫 게임 안내 다시 보기'));
    expect(host.querySelector('.zb-tutorial')).not.toBeNull();

    await act(async () => root.unmount());
  });

  it('supports skipping without blocking combat', async () => {
    const { host, root } = await mount();
    await click(host.querySelector('[data-support="OBSERVER"]')!);
    await click(buttonContaining(host, '안내 건너뛰기'));

    expect(host.querySelector('.zb-tutorial')).toBeNull();
    expect(window.localStorage.getItem(DEFENSE_TUTORIAL_PREF_KEY)).toBe('seen');

    await click(host.querySelector('button[aria-label^="P2 ·"]')!);
    await click(buttonContaining(host, '펄스 대응기'));
    await click(buttonContaining(host, '웨이브 시작'));
    expect(host.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-status')).toBe('RUNNING');

    await act(async () => root.unmount());
  });
});

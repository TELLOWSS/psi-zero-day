/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EpisodeSession } from '../src/app/episode-session';
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

function sessionStub(): EpisodeSession {
  return {
    getSnapshot: () => ({ revision: 1, state: { flags: {} } as unknown as GameState }),
    character: (id: string) => ({
      id,
      name: id,
      role: '현장 동료',
    }),
    assetUri: (id: string) => `assets/${id}.webp`,
  } as unknown as EpisodeSession;
}

async function settle(rounds = 10) {
  await act(async () => {
    for (let index = 0; index < rounds; index += 1) await Promise.resolve();
  });
}

async function click(element: Element) {
  await act(async () => {
    (element as HTMLElement).click();
    for (let index = 0; index < 6; index += 1) await Promise.resolve();
  });
}

describe('ZERO BREACH Keyboard Accessibility & Visual Feedback', () => {
  let host: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    window.localStorage.clear();
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
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    vi.unstubAllGlobals();
    if (root) act(() => root?.unmount());
    host?.remove();
    host = null;
    root = null;
    window.localStorage.clear();
  });

  async function startCombat() {
    const storage = new MemoryStorage();
    await act(async () => {
      root?.render(<DefenseGame session={sessionStub()} onExit={() => {}} storage={storage} requestedScenarioId="training-ramp-v1" />);
    });
    await settle();

    const supportBtn = host?.querySelector('[data-support="COORDINATOR"]');
    if (supportBtn) {
      await click(supportBtn);
      await settle();
    }
  }

  it('renders hotkey badges in HUD and action buttons', async () => {
    await startCombat();

    const hotkeys = host?.querySelectorAll('.zb-hotkey');
    expect(hotkeys && hotkeys.length).toBeGreaterThanOrEqual(3);

    // Verify Space badge exists in HUD
    const hudSpace = host?.querySelector('.zb-hud-button .zb-hotkey');
    expect(hudSpace?.textContent).toBe('Space');

    // Verify Speed badges exist
    const speedBadges = host?.querySelectorAll('.zb-speed .zb-hotkey');
    expect(speedBadges?.length).toBe(2);
    expect(speedBadges?.[0]?.textContent).toBe('1');
    expect(speedBadges?.[1]?.textContent).toBe('2');
  });

  it('triggers StartWave with Enter key when status is READY', async () => {
    await startCombat();

    const startButton = host?.querySelector('.zb-start-wave');
    expect(startButton).not.toBeNull();

    // Dispatch Enter keydown
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }));
    });
    await settle();

    // After pressing Enter, wave should have started (RUNNING status)
    const shell = host?.querySelector('.zb-shell');
    expect(shell?.getAttribute('data-status')).toBe('RUNNING');
  });

  it('changes speed to 2x with key 2 when no pad is selected', async () => {
    await startCombat();

    const shell = host?.querySelector('.zb-shell');
    expect(shell?.getAttribute('data-speed')).toBe('1');

    // Press '2'
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true }));
    });
    await settle();

    expect(shell?.getAttribute('data-speed')).toBe('2');
  });
});

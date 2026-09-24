/** @vitest-environment jsdom */
import fs from 'node:fs';
import path from 'node:path';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EpisodeSession } from '../src/app/episode-session';
import {
  defenseBoardArtUri,
  defenseEnemyArtUri,
  defenseTowerArtUri,
  defenseVisualProduction,
} from '../src/app/defense-visual-assets';
import { DefenseGame } from '../src/ui/DefenseGame';

function sessionStub(): EpisodeSession {
  return {
    character: (id: string) => ({
      id,
      name: id === 'kang_taesik' ? '강태식' : id === 'lim_junho' ? '임준호' : id,
      role: '현장 동료',
    }),
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
    for (let index = 0; index < 4; index += 1) await Promise.resolve();
  });
}

async function mount() {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(<DefenseGame session={sessionStub()} onExit={() => {}} />);
    for (let index = 0; index < 8; index += 1) await Promise.resolve();
  });
  return { host, root };
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('psi-zero-day.defense.tutorial.v1', 'seen');
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

describe('ZERO BREACH step 5A production-art baseline', () => {
  it('preserves the original board, PULSE L1 and NORMAL baseline inside the final production lock', () => {
    expect(defenseVisualProduction.status).toBe('PRODUCTION_LOCKED');
    const locked = defenseVisualProduction.assets.filter(asset => asset.status === 'BASELINE_LOCKED').map(asset => asset.assetId);
    expect(locked).toEqual([
      'defense.board.ramp-01',
      'defense.tower.PULSE.L1',
      'defense.enemy.NORMAL',
    ]);

    expect(defenseBoardArtUri('ramp-01')).toBe('assets/defense/board/ramp-01-hd01.webp');
    expect(defenseTowerArtUri('PULSE', 'L1')).toBe('assets/defense/towers/pulse-l1.svg');
    expect(defenseTowerArtUri('PULSE', 'L2')).toMatch(/pulse-l2\.svg$/);
    expect(defenseTowerArtUri('BURST', 'L1')).toMatch(/burst-l1\.svg$/);
    expect(defenseEnemyArtUri('NORMAL')).toBe('assets/defense/enemies/normal.svg');
    expect(defenseEnemyArtUri('SWIFT')).toMatch(/swift\.svg$/);
  });

  it('keeps the legacy authored geometry as the rollback/alignment reference', () => {
    const read = (relative: string) => fs.readFileSync(path.resolve(relative), 'utf8');
    const board = read('public/assets/defense/board/ramp-01.svg');
    const pulse = read('public/assets/defense/towers/pulse-l1.svg');
    const normal = read('public/assets/defense/enemies/normal.svg');

    expect(board).toContain('width="2000" height="1200" viewBox="0 0 2000 1200"');
    expect(board).toContain('points="0,600 360,600 360,300 900,300 900,900 1440,900 1440,480 2000,480"');
    for (const center of ['240 440', '520 440', '720 140', '740 680', '1060 480', '1200 740', '1280 1060', '1600 640']) {
      expect(board).toContain(`translate(${center})`);
    }

    expect(pulse).toContain('width="256" height="256" viewBox="0 0 256 256"');
    expect(normal).toContain('width="128" height="128" viewBox="0 0 128 128"');
    expect(pulse).not.toMatch(/<rect[^>]+width="256"[^>]+height="256"[^>]+fill=/);
    expect(normal).not.toMatch(/<rect[^>]+width="128"[^>]+height="128"[^>]+fill=/);
    expect(pulse).not.toMatch(/<text\b/i);
    expect(normal).not.toMatch(/<text\b/i);
  });

  it('uses the production board and PULSE art in the real combat UI with no prototype fallback left', async () => {
    const { host, root } = await mount();
    await click(host.querySelector('[data-support="COORDINATOR"]')!);

    const shell = host.querySelector('[data-defense-screen="combat"]');
    expect(shell?.getAttribute('data-visual-version')).toBe(defenseVisualProduction.visualVersion);

    const board = host.querySelector('image[data-production-board-art="ramp-01"]');
    expect(board?.getAttribute('href')).toBe('assets/defense/board/ramp-01-hd01.webp');

    await click(host.querySelector('button[aria-label^="P1 ·"]')!);
    const shopPulse = host.querySelector('.zb-shop-production-art') as HTMLImageElement | null;
    expect(shopPulse).not.toBeNull();
    expect(shopPulse?.getAttribute('src')).toContain('assets/defense/towers/pulse-l1.svg');
    expect(host.querySelector('[data-art-state="prototype"]')).toBeNull();

    await click(buttonContaining(host, '펄스 대응기'));
    expect(host.querySelector('g[data-production-tower-art="PULSE:L1"] image')?.getAttribute('href'))
      .toBe('assets/defense/towers/pulse-l1.svg');

    await click(buttonContaining(host, '웨이브 시작'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
      for (let index = 0; index < 5; index += 1) await Promise.resolve();
    });
    expect(host.querySelector('image[data-production-enemy-art="NORMAL"]')?.getAttribute('href'))
      .toBe('assets/defense/enemies/normal.svg');

    await act(async () => root.unmount());
  });
});

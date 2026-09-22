/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EpisodeSession } from '../src/app/episode-session';
import { DefenseGame } from '../src/ui/DefenseGame';

function sessionStub(): EpisodeSession {
  return {
    character: (id: string) => ({
      id,
      name: id === 'kang_taesik' ? '강태식' : id === 'lim_junho' ? '임준호' : id,
      role: id === 'kang_taesik' ? '형틀반장' : '신입근로자',
    }),
    assetUri: (id: string) => `assets/${id}.webp`,
  } as unknown as EpisodeSession;
}

function buttonContaining(host: HTMLElement, label: string): HTMLButtonElement {
  const button = [...host.querySelectorAll('button')].find(candidate => candidate.textContent?.includes(label));
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing button: ${label}`);
  return button;
}

async function mount() {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const onExit = vi.fn();
  await act(async () => {
    root.render(<DefenseGame session={sessionStub()} onExit={onExit} />);
    for (let index = 0; index < 6; index += 1) await Promise.resolve();
  });
  return { host, root, onExit };
}

async function click(element: Element) {
  await act(async () => {
    (element as HTMLElement).click();
    await Promise.resolve();
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
});

describe('ZERO BREACH step 2 combat UI', () => {
  it('starts at the two-choice support screen and resolves real character adapters', async () => {
    const { host, root, onExit } = await mount();

    expect(host.querySelector('[data-defense-screen="support-select"]')).not.toBeNull();
    expect(host.querySelectorAll('.zb-support-card')).toHaveLength(2);
    expect(host.textContent).toContain('강태식');
    expect(host.textContent).toContain('임준호');
    const portraits = [...host.querySelectorAll('.zb-support-card img')].map(image => image.getAttribute('src') ?? '');
    expect(portraits.some(uri => uri.includes('kang-taesik-portrait.webp'))).toBe(true);
    expect(portraits.some(uri => uri.includes('lim-junho-portrait.webp'))).toBe(true);

    await click(buttonContaining(host, '본편 허브로'));
    expect(onExit).toHaveBeenCalledTimes(1);

    await act(async () => root.unmount());
  });

  it('uses one 1000x600 board transform and keeps all eight pad hit targets aligned by percentage', async () => {
    const { host, root } = await mount();
    await click(host.querySelector('[data-support="COORDINATOR"]')!);

    const board = host.querySelector('.zb-board');
    expect(board?.getAttribute('viewBox')).toBe('0 0 1000 600');

    const pads = [...host.querySelectorAll('.zb-pad-hit')] as HTMLButtonElement[];
    expect(pads).toHaveLength(8);
    expect(pads[0]?.style.left).toBe('12%');
    expect(Number.parseFloat(pads[0]?.style.top ?? '0')).toBeCloseTo(220 / 600 * 100, 5);

    await act(async () => root.unmount());
  });

  it('supports pad -> tower two-input placement, upgrade, target mode, sell, pause and 2x without duplicating engine rules', async () => {
    const { host, root } = await mount();
    await click(host.querySelector('[data-support="COORDINATOR"]')!);

    const p1 = host.querySelector('button[aria-label^="P1 ·"]');
    expect(p1).toBeInstanceOf(HTMLButtonElement);
    await click(p1!);

    expect(host.textContent).toContain('설치할 타워를 선택하세요.');
    await click(buttonContaining(host, '펄스 대응기'));
    expect(host.textContent).toContain('R 120');

    await click(buttonContaining(host, '강화 L2'));
    expect(host.textContent).toContain('P1 · L2');
    expect(host.textContent).toContain('R 60');

    await click(buttonContaining(host, '강한 위험'));
    expect(buttonContaining(host, '강한 위험').className).toContain('is-active');

    await click(buttonContaining(host, '판매'));
    expect(host.textContent).toContain('R 158');
    expect(host.querySelector('button[aria-label^="P1 ·"]')?.getAttribute('aria-label')).toContain('빈 설치 패드');

    await click(buttonContaining(host, '웨이브 시작'));
    expect(host.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-status')).toBe('RUNNING');

    await click(buttonContaining(host, '2×'));
    expect(host.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-speed')).toBe('2');

    await click(buttonContaining(host, '정지'));
    expect(buttonContaining(host, '재개')).toBeInstanceOf(HTMLButtonElement);

    await act(async () => root.unmount());
  });

  it('keeps resource and occupancy stable under rapid repeated build clicks', async () => {
    const { host, root } = await mount();
    await click(host.querySelector('[data-support="COORDINATOR"]')!);
    await click(host.querySelector('button[aria-label^="P1 ·"]')!);

    const pulse = buttonContaining(host, '펄스 대응기');
    await act(async () => {
      pulse.click();
      pulse.click();
      pulse.click();
      await Promise.resolve();
    });

    expect(host.querySelectorAll('.zb-tower')).toHaveLength(1);
    expect(host.textContent).toContain('R 120');
    expect(host.querySelector('button[aria-label^="P1 ·"]')?.getAttribute('aria-label')).toContain('타워 설치됨');

    await act(async () => root.unmount());
  });

  it('keeps support use locked outside active unpaused combat and exposes wave preview/status in combat', async () => {
    const { host, root } = await mount();
    await click(host.querySelector('[data-support="OBSERVER"]')!);

    const support = buttonContaining(host, '동료 지원');
    expect(support.disabled).toBe(true);
    expect(host.textContent).toContain('WAVE 1');
    expect(host.textContent).toContain('불안정 파형');

    await click(buttonContaining(host, '웨이브 시작'));
    const activeSupport = buttonContaining(host, '동료 지원');
    expect(activeSupport.disabled).toBe(false);

    await click(buttonContaining(host, '정지'));
    expect(buttonContaining(host, '동료 지원').disabled).toBe(true);

    await act(async () => root.unmount());
  });

  it('pauses on portrait orientation and shows an explicit rotate/exit guard', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('portrait'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));

    const { host, root } = await mount();
    await click(host.querySelector('[data-support="COORDINATOR"]')!);

    expect(host.querySelector('.zb-rotate')).not.toBeNull();
    expect(host.textContent).toContain('가로 화면으로 돌려주세요');
    expect(buttonContaining(host, '재개')).toBeInstanceOf(HTMLButtonElement);

    await act(async () => root.unmount());
  });
});

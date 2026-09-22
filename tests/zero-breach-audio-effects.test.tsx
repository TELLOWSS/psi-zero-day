/** @vitest-environment jsdom */
import fs from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EpisodeSession } from '../src/app/episode-session';
import { AUDIO_MUTED_STORAGE_KEY, readAudioMuted, setAudioMuted } from '../src/app/audio-preference';
import { zeroBreachContent } from '../src/content/defense';
import type { DefenseRunState } from '../src/domain/defense';
import { createDefenseRun } from '../src/engine/defense';
import { DefenseGame } from '../src/ui/DefenseGame';
import { DEFENSE_AUDIO_MAX_VOICES, DEFENSE_RESOLVE_AUDIO_MIN_TICKS, defenseAudioCueProfile, defenseResolveCues } from '../src/ui/useDefenseAudio';
import { defensePresentationDelta } from '../src/ui/useDefenseEffects';

function sessionStub(): EpisodeSession {
  return {
    character: (id: string) => ({ id, name: id === 'kang_taesik' ? '강태식' : '임준호', role: '현장 동료' }),
    assetUri: (id: string) => `assets/${id}.webp`,
  } as unknown as EpisodeSession;
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
    matches: false, media: query, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  })));
});

afterEach(() => {
  delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
  window.localStorage.clear();
});

describe('ZERO BREACH step 5 audio and impact presentation', () => {
  it('keeps the minimum cue set short and conservatively mixed', () => {
    for (const cue of ['select','place','upgrade','sell','warning','single_resolve','area_resolve','leak','support','win','loss'] as const) {
      const profile = defenseAudioCueProfile(cue);
      expect(profile.startHz).toBeGreaterThan(0);
      expect(profile.endHz).toBeGreaterThan(0);
      expect(profile.durationMs).toBeGreaterThan(20);
      expect(profile.durationMs).toBeLessThanOrEqual(300);
      expect(profile.gain).toBeGreaterThan(0);
      expect(profile.gain).toBeLessThanOrEqual(0.032);
    }
    expect(DEFENSE_RESOLVE_AUDIO_MIN_TICKS * zeroBreachContent.tickMs).toBeGreaterThanOrEqual(80);
    expect(DEFENSE_AUDIO_MAX_VOICES).toBeLessThanOrEqual(12);
  });

  it('derives impact and shield flashes from the same engine state delta as damage', () => {
    const previous = createDefenseRun(zeroBreachContent, 'COORDINATOR', 'fx-run');
    const enemy = {
      id: 'enemy-fx', enemyId: 'NORMAL' as const, hp: 40, distance: 120, spawnSequence: 1,
      revealUntilTick: 0, slowEffects: [], bossPhaseTriggered: false, bossArmorFromTick: 0, bossArmorUntilTick: 0,
    };
    const withEnemy = { ...previous, enemies: [enemy] } as DefenseRunState;
    const damaged = { ...withEnemy, shield: 19, enemies: [{ ...enemy, hp: 28 }] } as DefenseRunState;
    expect(defensePresentationDelta(withEnemy, damaged)).toEqual({
      damagedEnemyIds: ['enemy-fx'],
      shieldHit: true,
      resolvedEnemyEchoes: [],
    });
  });

  it('distinguishes single and area resolution audio from attack cooldown changes', () => {
    const base = createDefenseRun(zeroBreachContent, 'COORDINATOR', 'audio-family-run');
    const pulse = {
      id: 'tower-pulse', padId: 'P1', towerId: 'PULSE' as const, levelId: 'L1' as const,
      targetMode: 'FIRST' as const, invested: 80, attackCooldown: 0, revealCooldown: 0,
    };
    const burst = {
      id: 'tower-burst', padId: 'P2', towerId: 'BURST' as const, levelId: 'L1' as const,
      targetMode: 'FIRST' as const, invested: 110, attackCooldown: 0, revealCooldown: 0,
    };
    const previous = { ...base, towers: [pulse, burst] } as DefenseRunState;
    const current = {
      ...previous,
      tick: previous.tick + 1,
      towers: [{ ...pulse, attackCooldown: 16 }, { ...burst, attackCooldown: 40 }],
    } as DefenseRunState;
    expect(defenseResolveCues(previous, current)).toEqual(['single_resolve', 'area_resolve']);
  });

  it('derives a resolution echo when a removed enemy produced a kill reward without a leak', () => {
    const base = createDefenseRun(zeroBreachContent, 'COORDINATOR', 'resolve-fx-run');
    const enemy = {
      id: 'enemy-kill', enemyId: 'NORMAL' as const, hp: 8, distance: 140, spawnSequence: 1,
      revealUntilTick: 0, slowEffects: [], bossPhaseTriggered: false, bossArmorFromTick: 0, bossArmorUntilTick: 0,
    };
    const previous = { ...base, enemies: [enemy], resource: 100 } as DefenseRunState;
    const current = { ...base, enemies: [], resource: 105 } as DefenseRunState;
    expect(defensePresentationDelta(previous, current).resolvedEnemyEchoes).toEqual([
      { id: 'enemy-kill', enemyId: 'NORMAL', distance: 140 },
    ]);
  });

  it('disables all semantic combat effect animations when reduced motion is requested', () => {
    const css = fs.readFileSync('src/ui/defense-game.css', 'utf8');
    const reduced = css.match(/@media \(prefers-reduced-motion:reduce\)\{([\s\S]*?)\}/g)?.join('\n') ?? '';
    expect(reduced).toContain('.zb-impact-ring');
    expect(reduced).toContain('.zb-enemy.is-hit .zb-enemy-production-image');
    expect(reduced).toContain('.zb-shell.is-shield-hit .zb-board-wrap::after');
    expect(reduced).toContain('.zb-support-field.is-coordinator path');
    expect(reduced).toContain('.zb-support-field.is-observer circle');
    expect(reduced).toContain('.zb-attack-flash');
    expect(reduced).toContain('.zb-area-pulse');
    expect(reduced).toContain('.zb-detect-pulse');
    expect(reduced).toContain('.zb-slow-ring');
    expect(reduced).toContain('.zb-boss-armor-effect');
    expect(reduced).toContain('.zb-resolve-burst');
    expect(reduced).toContain('animation:none');
  });

  it('shares the same global SOUND preference with the main game', async () => {
    setAudioMuted(true);
    expect(readAudioMuted()).toBe(true);
    expect(window.localStorage.getItem(AUDIO_MUTED_STORAGE_KEY)).toBe('1');

    const { host, root } = await mount();
    await click(host.querySelector('[data-support="COORDINATOR"]')!);
    await click([...host.querySelectorAll('button')].find(button => button.textContent?.includes('설정'))!);

    const audioButton = host.querySelector('.zb-defense-settings-panel button[data-audio-muted="true"]');
    expect(audioButton?.textContent).toContain('SOUND');
    expect(audioButton?.textContent).toContain('OFF');

    await click(audioButton!);
    expect(readAudioMuted()).toBe(false);
    expect(host.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-audio-muted')).toBe('false');

    await act(async () => root.unmount());
  });
});

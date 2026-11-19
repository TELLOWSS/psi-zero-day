// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  OMEGA_SAVE_KEY,
  countClearedOmegaSectors,
  emptyOmegaSave,
  readOmegaSave,
  recordOmegaRunResult,
} from '../src/app/omega-save';
import { OmegaProtocolGame } from '../src/ui/OmegaProtocolGame';
import { ReignitionTitle } from '../src/ui/ReignitionTitle';
import { GameShell } from '../src/ui/GameHub';
import { EpisodeSession } from '../src/app/episode-session';
import type { EndgameHomeStatus } from '../src/app/endgame-home';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const baseStatus: EndgameHomeStatus = {
  guardClears: 0,
  guardMastered: 0,
  watchClears: 0,
  watchMastered: 0,
  veteran: false,
  guardUnlocked: false,
  watchUnlocked: false,
  lastStageNumber: 1,
};

describe('OMEGA PROTOCOL save, UI, and hub integration', () => {
  it('sanitizes corrupt or forged omega saves and records verified sector clears', () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => { map.set(k, v); },
    };

    expect(readOmegaSave(null)).toEqual(emptyOmegaSave());
    map.set(OMEGA_SAVE_KEY, '{broken json');
    expect(readOmegaSave(storage)).toEqual(emptyOmegaSave());

    // Forged unlock without clears is rejected by sanitizer
    map.set(OMEGA_SAVE_KEY, JSON.stringify({
      version: 1,
      unlockedSector: 4,
      campaignClears: 9,
      bestCampaignScore: 99999,
      sectors: {
        sector_1: { clears: 0, bestScore: 0, bestRank: null, bestCombo: 0 },
        sector_2: { clears: 0, bestScore: 0, bestRank: null, bestCombo: 0 },
        sector_3: { clears: 0, bestScore: 0, bestRank: null, bestCombo: 0 },
        sector_4: { clears: 0, bestScore: 0, bestRank: null, bestCombo: 0 },
      },
    }));
    const sanitized = readOmegaSave(storage);
    expect(sanitized.unlockedSector).toBe(1);
    expect(sanitized.campaignClears).toBe(0);

    // Valid clear unlocks Sector 2 and counts 1 cleared sector
    const updated = recordOmegaRunResult(storage, {
      clearedSectorIndices: [1],
      fullCampaignClear: false,
      score: 4200,
      rank: 'A',
      maxCombo: 14,
    });
    expect(updated.unlockedSector).toBe(2);
    expect(countClearedOmegaSectors(updated)).toBe(1);
    expect(readOmegaSave(storage).sectors.sector_1.bestRank).toBe('A');
  });

  it('renders Deployment Hub with all 4 sector backdrops and transitions into live combat canvas', () => {
    const host = document.createElement('div');
    const root = createRoot(host);
    try {
      act(() => {
        root.render(
          <OmegaProtocolGame
            onExit={() => {}}
            audioMuted={false}
            onToggleAudio={() => {}}
          />,
        );
      });

      expect(host.querySelector('[data-omega-screen="hub"]')).not.toBeNull();
      expect(host.textContent).toContain('OMEGA PROTOCOL');
      expect(host.textContent).toContain('1~4구역 연결 전장 투입');
      expect(host.querySelectorAll('[data-omega-sector]')).toHaveLength(4);
      expect(host.innerHTML).toContain('/assets/omega/zones/zone-1-gate.webp');
      expect(host.innerHTML).toContain('/assets/omega/zones/zone-4-core.webp');

      const launchBtn = host.querySelector<HTMLButtonElement>('[data-omega-launch="campaign"]')!;
      act(() => {
        launchBtn.click();
      });

      expect(host.querySelector('[data-omega-screen="combat"]')).not.toBeNull();
      expect(host.querySelector('canvas.omega-canvas')).not.toBeNull();
      expect(host.textContent).toContain('SECTOR 01');
      expect(host.textContent).toContain('펄스 피스톨');
    } finally {
      act(() => root.unmount());
    }
  });

  it('renders interactive Omega Protocol launcher in ReignitionTitle when onOmega is provided', () => {
    const onOmega = vi.fn();
    const host = document.createElement('div');
    const root = createRoot(host);
    try {
      act(() => {
        root.render(
          <ReignitionTitle
            status={baseStatus}
            brand="NEW-PSI"
            emblem="/assets/branding/home-new-psi-v6/shield.svg"
            heroWide="/wide.webp"
            heroPortrait="/portrait.webp"
            audioMuted={false}
            motionEnabled={true}
            onOmega={onOmega}
            onStory={() => {}}
            onGuide={() => {}}
            onPeople={() => {}}
            onJournal={() => {}}
            onManual={() => {}}
            onSong={() => {}}
            onToggleAudio={() => {}}
            onToggleMotion={() => {}}
          />,
        );
      });

      const btn = host.querySelector<HTMLButtonElement>('button.rg-card.is-omega');
      expect(btn).not.toBeNull();
      act(() => {
        btn!.click();
      });
      expect(onOmega).toHaveBeenCalledTimes(1);
    } finally {
      act(() => root.unmount());
    }

    // Omitting onOmega preserves legacy anchor markup
    const html = renderToStaticMarkup(
      React.createElement(ReignitionTitle, {
        status: baseStatus,
        brand: 'NEW-PSI',
        emblem: '/shield.svg',
        heroWide: '/wide.webp',
        heroPortrait: '/portrait.webp',
        audioMuted: false,
        motionEnabled: true,
        onStory: () => {},
        onGuide: () => {},
        onPeople: () => {},
        onJournal: () => {},
        onManual: () => {},
        onSong: () => {},
        onToggleAudio: () => {},
        onToggleMotion: () => {},
      }),
    );
    expect(html).toContain('class="rg-card is-omega" href="');
  });

  it('auto-launches OMEGA PROTOCOL from GameShell when ?omegaLab=1 is present', async () => {
    const originalUrl = window.location.href;
    window.history.replaceState(null, '', '/?omegaLab=1');
    const session = new EpisodeSession();
    const host = document.createElement('div');
    const root = createRoot(host);
    try {
      await act(async () => {
        root.render(<GameShell session={session} />);
        await import('../src/ui/OmegaProtocolGame');
      });
      expect(host.querySelector('[data-omega-screen="hub"]')).not.toBeNull();
    } finally {
      act(() => root.unmount());
      window.history.replaceState(null, '', originalUrl);
    }
  });
});

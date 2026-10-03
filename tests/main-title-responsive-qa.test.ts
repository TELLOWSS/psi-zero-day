import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const gameHubSource = readFileSync('src/ui/GameHub.tsx', 'utf8');
const gameHubCss = readFileSync('src/ui/game-hub.css', 'utf8');

describe('Main title responsive optimization for PC and Mobile', () => {
  it('renders all three core pillars (Survivors, Defense, Story) with dedicated semantic classes', () => {
    expect(gameHubSource).toContain('is-survivors-entry');
    expect(gameHubSource).toContain('is-defense-entry');
    expect(gameHubSource).toContain('is-story-entry');
    expect(gameHubSource).toContain('is-sub-entry');
    expect(gameHubSource).toContain('commercial-title-badge-new');
  });

  it('eliminates hardcoded inline styles from survivors entry to honor responsive CSS', () => {
    // Ensures no style={{ ... }} on the button itself that would break responsive media queries
    const survivorsMatch = gameHubSource.match(/<button[^>]*is-survivors-entry[^>]*>/);
    expect(survivorsMatch).not.toBeNull();
    expect(survivorsMatch![0]).not.toContain('style=');
  });

  it('supports PC 3-pillar hierarchy and 2-column secondary split in game-hub.css', () => {
    expect(gameHubCss).toContain('.commercial-title-actions.is-defense-first');
    expect(gameHubCss).toContain('.commercial-title-action.is-survivors-entry');
    expect(gameHubCss).toContain('.commercial-title-action.is-defense-entry');
    expect(gameHubCss).toContain('.commercial-title-action.is-story-entry');
    expect(gameHubCss).toContain('.commercial-title-action.is-sub-entry');
  });

  it('provides smooth vertical scrolling on mobile portrait without viewport clipping', () => {
    expect(gameHubCss).toContain('overflow-y:auto');
    expect(gameHubCss).toContain('-webkit-overflow-scrolling:touch');
  });

  it('positions live briefing card in-flow on mobile portrait to prevent collision with action buttons', () => {
    // In portrait mobile query, briefing card must not be position: absolute bottom: 16px
    const portraitBlockMatch = gameHubCss.match(/@media\s*\(orientation:portrait\)[^{]*\{[\s\S]*?\n\}/);
    expect(portraitBlockMatch).not.toBeNull();
    const portraitCss = portraitBlockMatch![0];
    expect(portraitCss).toContain('data-title-role="live-briefing"');
    expect(portraitCss).toContain('position:relative');
  });
});

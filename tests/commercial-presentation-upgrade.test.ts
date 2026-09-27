import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import layout from '../content/episode01/main-title-layout.json';

const hub = readFileSync('src/ui/GameHub.tsx', 'utf8');
const css = readFileSync('src/ui/game-hub.css', 'utf8');

describe('H-01 through H-04 commercial presentation upgrade', () => {
  it('locks the title hierarchy in live DOM', () => {
    expect(hub).toContain('data-title-hierarchy="H01_LOCKED"');
    expect(hub).toContain('data-title-rank="brand">NEW PSI');
    expect(hub).toContain('aria-label="PSI : ZERO DAY"');
    expect(hub).toContain('data-title-rank="slogan"');
    expect(hub).toContain('data-title-primary-cta="defense"');
    expect(layout.commercialPresentation.h01.desktopHeroWidthMaxVw).toBeLessThanOrEqual(52);
  });

  it('keeps characters as a secondary human anchor rather than the primary UI layer', () => {
    expect(hub).toContain('data-title-role="human-anchor"');
    expect(layout.commercialPresentation.h02.layerOrder.indexOf('character silhouettes'))
      .toBeLessThan(layout.commercialPresentation.h02.layerOrder.indexOf('title/slogan/CTA'));
    expect(css).toContain('.commercial-title-cast[data-title-role="human-anchor"]');
  });

  it('promotes LIVE SITE to a tactical briefing without adding interaction', () => {
    expect(hub).toContain('data-title-role="live-briefing"');
    for (const text of layout.commercialPresentation.h03.requiredText) expect(hub).toContain(text);
    expect(layout.commercialPresentation.h03.interactionRule).toContain('no new click behavior');
  });

  it('keeps feature cards secondary and quick settings tertiary', () => {
    expect(hub).toContain('data-title-role="secondary-features"');
    expect(hub).toContain('data-title-role="quick-settings"');
    expect(layout.commercialPresentation.h04.featurePriority).toBe('secondary');
    expect(layout.commercialPresentation.h04.quickSettingsPriority).toBe('tertiary');
    expect(css).toContain('-webkit-line-clamp:1');
  });

  it('suppresses secondary chrome on short landscape and mobile', () => {
    expect(css).toContain('@media (orientation:landscape) and (max-height:560px)');
    expect(layout.commercialPresentation.h04.shortLandscape).toContain('feature strip hidden');
    expect(layout.commercialPresentation.h04.shortLandscape).toContain('quick settings hidden');
  });
});

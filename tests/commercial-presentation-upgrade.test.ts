import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import layout from '../content/episode01/main-title-layout.json';

const hub = readFileSync('src/ui/GameHub.tsx', 'utf8');
const css = readFileSync('src/ui/game-hub.css', 'utf8');
const defenseGame = readFileSync('src/ui/DefenseGame.tsx', 'utf8');
const defenseCss = readFileSync('src/ui/defense-game.css', 'utf8');
const activity = readFileSync('src/ui/G8AActivityOverlay.tsx', 'utf8');
const camera = readFileSync('src/ui/useDefenseCamera.ts', 'utf8');
const visualAssets = readFileSync('src/app/defense-visual-assets.ts', 'utf8');

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
    expect(layout.commercialPresentation.h02.desktop.layerOrder.indexOf('character silhouettes'))
      .toBeLessThan(layout.commercialPresentation.h02.desktop.layerOrder.indexOf('title/slogan/CTA'));
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

  it('keeps the construction world alive from the first waves instead of waiting for the Wave 8 slice', () => {
    expect(activity).toContain('lee-jaehoon-map.webp');
    expect(activity).toContain('seo-jeongmin-map.webp');
    expect(activity).toContain('data-motion-vehicle="AMBIENT_DUMP"');
    expect(defenseGame).toContain('state.waveId <= 5');
    expect(defenseGame).toContain("enemy.enemyId === 'NORMAL'");
    expect(defenseGame).toContain("enemy.enemyId === 'SWARM'");
    expect(defenseGame).toContain("enemy.enemyId === 'ARMORED'");
  });

  it('uses construction-semantic raster equipment for all G8-A tower families', () => {
    for (const asset of ['temporary-distribution-board.webp','exclusion-zone.webp','vehicle-pedestrian-separation.webp','site-weather-station.webp']) {
      expect(visualAssets).toContain(asset);
    }
    expect(visualAssets).toContain("semantic: 'ALERT_CONTROL'");
    expect(defenseGame).toContain('defenseG8aTowerVisual');
    expect(defenseGame).toContain('data-g8a-semantic');
    expect(defenseCss).toContain('.zb-g8a-semantic-tower-image');
  });

  it('applies the post-lock commercial graphics integration pass without changing simulation contracts', () => {
    expect(defenseGame).toContain('data-world-grade="COMMERCIAL_GFX_V1"');
    expect(defenseGame).toContain('zb-g8a-risk-contact-shadow');
    expect(defenseGame).toContain('zb-health-readout');
    expect(defenseGame).toContain('data-result-grade="COMMERCIAL_GFX_V1"');
    expect(defenseCss).toContain('COMMERCIAL-GFX-V1');
    expect(defenseCss).toContain('.zb-board-grade');
    expect(defenseCss).toContain('.zb-result-stars');
    expect(css).toContain('COMMERCIAL-HERO-GFX-V1');
  });

  it('exposes player zoom and early automatic camera focus on the physical phone board', () => {
    expect(defenseGame).toContain('camera.zoomIn');
    expect(defenseGame).toContain('camera.zoomOut');
    expect(defenseGame).toContain('camera.resetZoom');
    expect(camera).toContain("'TOWER_PLACEMENT'");
    expect(camera).toContain("'RISK_ENTRY'");
    expect(camera).toContain('manualScale');
    expect(defenseCss).toContain('.zb-camera-controls');
  });
});

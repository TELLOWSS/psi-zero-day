import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { omegaCameraTargetZoom } from '../src/ui/omega-protocol-camera';
import {
 OmegaAdaptiveFrameGovernor,
 resolveOmegaMobileProfile,
} from '../src/ui/omega-protocol-mobile-perf';

describe('Wave 5 Mobile Zero-Occlusion UX & Adaptive 60FPS Performance', () => {
 it('caps DPR, disables blur, and compacts HUD cadence on portrait and landscape smartphones', () => {
  const portraitAuto = resolveOmegaMobileProfile(390, 844, 3, 'auto');
  expect(portraitAuto.isCompactViewport).toBe(true);
  expect(portraitAuto.isPortrait).toBe(true);
  expect(portraitAuto.canvasScale).toBeLessThanOrEqual(1);
  expect(portraitAuto.pixelWidth).toBeLessThanOrEqual(880);
  expect(portraitAuto.pixelHeight).toBeLessThanOrEqual(880);
  expect(portraitAuto.skipSecondaryAtmosphere).toBe(true);
  expect(portraitAuto.allowShadowBlur).toBe(false);
  expect(portraitAuto.hudCommitIntervalMs).toBe(145);
  expect(portraitAuto.radarCompact).toBe(true);

  const landscapePerf = resolveOmegaMobileProfile(844, 390, 3, 'performance');
  expect(landscapePerf.isCompactViewport).toBe(true);
  expect(landscapePerf.isLandscapePhone).toBe(true);
  expect(landscapePerf.canvasScale).toBeLessThanOrEqual(0.82);
  expect(landscapePerf.pixelWidth).toBeLessThanOrEqual(760);
  expect(landscapePerf.skipSecondaryAtmosphere).toBe(true);

  const portraitQuality = resolveOmegaMobileProfile(390, 844, 3, 'quality');
  expect(portraitQuality.skipSecondaryAtmosphere).toBe(false);
  expect(portraitQuality.canvasScale).toBeCloseTo(1.18, 2);

  const desktop = resolveOmegaMobileProfile(1440, 900, 2, 'auto');
  expect(desktop.isCompactViewport).toBe(false);
  expect(desktop.allowShadowBlur).toBe(true);
  expect(desktop.skipSecondaryAtmosphere).toBe(false);
  expect(desktop.hudCommitIntervalMs).toBe(95);
  expect(desktop.radarCompact).toBe(false);
 });

 it('adapts render scale down on sustained <44 FPS and recovers cleanly at 60 FPS', () => {
  const gov = new OmegaAdaptiveFrameGovernor();
  expect(gov.currentScale('auto')).toBe(1.0);
  expect(gov.currentLowFx('auto')).toBe(false);

  // Simulate two ~31 FPS windows (~1.0s each at dt = 0.032s)
  let changed = false;
  for (let i = 0; i < 66; i++) {
   if (gov.recordFrame(0.032, 'auto', true)) changed = true;
  }
  expect(changed).toBe(true);
  expect(gov.currentScale('auto')).toBe(0.86);
  expect(gov.currentLowFx('auto')).toBe(true);

  // Two more low-FPS windows drop to 0.74 floor
  for (let i = 0; i < 66; i++) {
   gov.recordFrame(0.032, 'auto', true);
  }
  expect(gov.currentScale('auto')).toBe(0.74);

  // Three sustained ~66 FPS windows recover toward 1.0
  for (let w = 0; w < 6; w++) {
   for (let i = 0; i < 65; i++) {
    gov.recordFrame(0.015, 'auto', true);
   }
  }
  expect(gov.currentScale('auto')).toBe(1.0);
  expect(gov.currentLowFx('auto')).toBe(false);

  // Explicit presets override adaptive governor deterministically
  expect(gov.currentScale('performance')).toBe(0.82);
  expect(gov.currentLowFx('performance')).toBe(true);
  expect(gov.currentScale('quality')).toBe(1.0);
  expect(gov.currentLowFx('quality')).toBe(false);
 });

 it('widens mobile portrait & landscape combat camera sightlines and ships zero-occlusion CSS rules', () => {
  const portraitBattle = omegaCameraTargetZoom('battle', 390, 844);
  const landscapeBattle = omegaCameraTargetZoom('battle', 844, 390);
  const desktopBattle = omegaCameraTargetZoom('battle', 1440, 900);
  expect(portraitBattle).toBe(1.12);
  expect(landscapeBattle).toBe(1.54);
  expect(desktopBattle).toBe(1.78);
  expect(portraitBattle).toBeLessThan(landscapeBattle);
  expect(landscapeBattle).toBeLessThan(desktopBattle);

  const css = fs.readFileSync(path.resolve(process.cwd(), 'src/ui/omega-protocol-playtest.css'), 'utf8');
  expect(css).toContain('env(safe-area-inset-');
  expect(css).toContain('[data-omega-mobile-active-battle="true"]');
  expect(css).toContain('backdrop-filter:none');
  expect(css).toContain('.omega-zs-floating-stick-zone');
  expect(css).toContain('.omega-zs-mobile-drawer');
  expect(css).toContain('.omega-zs-floating-hint');
  expect(css).toContain('[data-omega-clean-hud="true"]');

  const tsx = fs.readFileSync(path.resolve(process.cwd(), 'src/ui/OmegaProtocolPlaytest.tsx'), 'utf8');
  expect(tsx).toContain("const mobileImmersion=(Math.min(viewport.w,viewport.h)<=540||viewport.w<=900)&&!devLabReviewUrl;");
  expect(tsx).toContain('data-omega-clean-hud=');
  expect(tsx).toContain('data-unlocked={unlocked');
  expect(tsx).toContain('omega-zs-briefing-exit');
 });
});

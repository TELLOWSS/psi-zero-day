import { describe, expect, it } from 'vitest';
import fullVisual from '../content/defense/g8a-full-visual-lock.json';
import zeroBreach from '../content/defense/zero-breach-v1.json';

describe('G8-A full-screen visual lock contract', () => {
  it('targets the real representative Wave 8 composition', () => {
    const wave8 = zeroBreach.waves.find(wave => wave.id === 8);
    expect(wave8?.groups).toEqual([
      { enemy: 'VEILED', count: 8, startTick: 0, intervalTicks: 25 },
      { enemy: 'SWIFT', count: 10, startTick: 60, intervalTicks: 20 },
    ]);
    expect(fullVisual.representativePlay.wave).toBe(8);
    expect(fullVisual.representativePlay.waveEnemies).toEqual({ VEILED: 8, SWIFT: 10 });
  });

  it('does not reopen locked WORLD or SWIFT assets', () => {
    expect(fullVisual.baseline.world.reopen).toBe(false);
    expect(fullVisual.baseline.swift.reopen).toBe(false);
    expect(fullVisual.v01.mustKeep).toContain('locked G8-A WORLD raster');
    expect(fullVisual.v01.mustKeep).toContain('locked G8-A SWIFT raster');
    expect(fullVisual.v01.mustKeep).toContain('base wave balance');
    expect(fullVisual.v01.mustKeep).toContain('base defense engine');
  });

  it('keeps asset lock and full-screen visual lock as different gates', () => {
    expect(fullVisual.lockSemantics.neverTreatAsEquivalent).toBe(true);
    expect(fullVisual.status).toBe('V02_PASS_V04A_ACTIVE');
    expect(fullVisual.stopLine).toContain('V-01 through V-05');
    expect(fullVisual.v01.status).toBe('ACTUAL_PLAY_PASS');
  });

  it('locks portrait immersion as an authored camera mode, not a scaled landscape board', () => {
    expect(fullVisual.v01a.status).toBe('ACTUAL_PLAY_QA_PASS');
    expect(fullVisual.v01a.portraitFrame).toEqual({ x: 0, y: 80, width: 430, height: 520 });
    expect(fullVisual.v04a.portraitFrame).toEqual({ x: 0, y: 80, width: 330, height: 520 });
    expect(fullVisual.v01a.requirements).toContain('390x844 world viewport occupies at least 55% of screen height');
    expect(fullVisual.v04a.targets.topHudMaximumScreenShare).toBeLessThanOrEqual(0.09);
    expect(fullVisual.v04a.targets.idleBottomActionMaximumScreenShare).toBeLessThanOrEqual(0.15);
    expect(fullVisual.v04a.targets.idleWorldMinimumScreenShare).toBeGreaterThanOrEqual(0.72);
    expect(fullVisual.v04a.targets.expandedCommandPanelAllowedAfterSelection).toBe(true);
  });
});

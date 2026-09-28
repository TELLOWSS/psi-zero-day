import { describe, expect, it } from 'vitest';
import manifest from '../content/defense/control-tower-production-v1.json';
import zeroBreach from '../content/defense/zero-breach-v1.json';
import {
  defenseControlTowerProductionEntry,
  defenseG8aTowerVisual,
} from '../src/app/defense-visual-assets';

const MAP_ID = 'map-apt-bottom-up-excavation-01';
const FALLBACK = 'assets/episode01/scene-elements/vehicle-pedestrian-separation.webp';

describe('Phase D CONTROL production art pipeline', () => {
  it('defines one distinct production slot for every CONTROL level', () => {
    expect(manifest.family).toBe('CONTROL');
    expect(manifest.promotionRule.oneLevelAtATime).toBe(true);
    expect(manifest.promotionRule.firstLevel).toBe('L1');

    const levels = manifest.levels.map(level => level.levelId);
    expect(levels).toEqual(['L1', 'L2', 'L3A', 'L3B']);

    const uris = manifest.levels.map(level => level.runtimeUri);
    expect(new Set(uris).size).toBe(4);
    expect(uris.every(uri => uri.endsWith('.webp'))).toBe(true);
    expect(uris.every(uri => !uri.endsWith('.svg'))).toBe(true);
  });

  it('binds the visual roles to the locked CONTROL gameplay branch differences', () => {
    const control = zeroBreach.towers.find(tower => tower.id === 'CONTROL');
    expect(control).toBeTruthy();

    for (const visual of manifest.levels) {
      const gameplay = control?.levels.find(level => level.id === visual.levelId);
      expect(gameplay).toBeTruthy();
      expect(visual.gameplayRead).toMatchObject({
        range: gameplay?.range,
        splashRadius: gameplay?.splashRadius,
        maxTargets: gameplay?.maxTargets,
        slowFraction: gameplay?.slowFraction,
        slowTicks: gameplay?.slowTicks,
      });
    }

    const l3a = manifest.levels.find(level => level.levelId === 'L3A')!;
    const l3b = manifest.levels.find(level => level.levelId === 'L3B')!;
    expect(l3a.visualRole).toBe('INTENSIVE_POINT_CONTROL');
    expect(l3b.visualRole).toBe('WIDE_FLOW_SEPARATION');
    expect(l3a.gameplayRead.slowFraction).toBeGreaterThan(l3b.gameplayRead.slowFraction);
    expect(l3b.gameplayRead.splashRadius).toBeGreaterThan(l3a.gameplayRead.splashRadius);
    expect(l3b.gameplayRead.maxTargets).toBeGreaterThan(l3a.gameplayRead.maxTargets);
  });

  it('never points runtime at a missing pending raster', () => {
    for (const level of manifest.levels) {
      const entry = defenseControlTowerProductionEntry(level.levelId as 'L1' | 'L2' | 'L3A' | 'L3B');
      expect(entry?.runtimeUri).toBe(level.runtimeUri);

      const visual = defenseG8aTowerVisual(
        MAP_ID,
        'CONTROL',
        level.levelId as 'L1' | 'L2' | 'L3A' | 'L3B',
      );
      expect(visual).not.toBeNull();

      if (level.status === 'PRODUCTION_APPROVED') {
        expect(visual?.uri).toBe(level.runtimeUri);
      } else {
        expect(visual?.uri).toBe(FALLBACK);
      }
    }
  });

  it('keeps the dedicated CONTROL art scoped to the locked G8-A map', () => {
    expect(defenseG8aTowerVisual('ramp-01', 'CONTROL', 'L1')).toBeNull();
    expect(defenseG8aTowerVisual(MAP_ID, 'CONTROL', 'L1')?.semantic).toBe('TRAFFIC_CONTROL');
  });

  it('forbids size-only upgrades and fantasy turret language in the art contract', () => {
    expect(manifest.artDirection.runtimeRule).toContain('size-only upgrades are forbidden');
    expect(manifest.forbidden).toContain('sci-fi turret');
    expect(manifest.forbidden).toContain('only scaling the L1 image for higher levels');
    for (const level of manifest.levels) {
      expect(level.requiredRead.length).toBeGreaterThanOrEqual(5);
    }
  });
});

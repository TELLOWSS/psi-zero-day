import { describe, expect, it } from 'vitest';
import manifest from '../content/defense/pulse-tower-production-v1.json';
import zeroBreach from '../content/defense/zero-breach-v1.json';
import {
  defenseG8aTowerVisual,
  defensePulseTowerProductionEntry,
} from '../src/app/defense-visual-assets';

const MAP_ID = 'map-apt-bottom-up-excavation-01';
const LEGACY_FALLBACK = 'assets/episode01/scene-elements/temporary-distribution-board.webp';

describe('Phase D PULSE representative production art', () => {
  it('locks only representative L1 and explicitly defers the upgrade family', () => {
    expect(manifest.family).toBe('PULSE');
    expect(manifest.masterBibleRole).toBe('DIRECT_INTERVENTION');
    expect(manifest.scope.representativeOnly).toBe(true);
    expect(manifest.scope.productionLevel).toBe('L1');
    expect(manifest.scope.deferredLevels).toEqual(['L2', 'L3A', 'L3B']);
    expect(manifest.levels.map(level => level.levelId)).toEqual(['L1']);
  });

  it('binds L1 visual meaning to the locked PULSE gameplay values', () => {
    const pulse = zeroBreach.towers.find(tower => tower.id === 'PULSE');
    const gameplay = pulse?.levels.find(level => level.id === 'L1');
    const visual = manifest.levels[0]!;

    expect(gameplay).toBeTruthy();
    expect(visual.gameplayRead).toMatchObject({
      damage: gameplay?.damage,
      damageType: gameplay?.damageType,
      intervalTicks: gameplay?.intervalTicks,
      range: gameplay?.range,
      maxTargets: gameplay?.maxTargets,
    });
    expect(visual.visualRole).toBe('DIRECT_SAFETY_INTERVENTION');
  });

  it('promotes only the approved raster and leaves deferred upgrades on safe fallback', () => {
    const entry = defensePulseTowerProductionEntry('L1');
    expect(entry?.status).toBe('PRODUCTION_APPROVED');
    expect(entry?.runtimeUri).toBe('assets/defense/towers/pulse/pulse-l1-final.webp');

    const l1 = defenseG8aTowerVisual(MAP_ID, 'PULSE', 'L1');
    expect(l1?.uri).toBe(entry?.runtimeUri);
    expect(l1?.semantic).toBe('ALERT_CONTROL');
    expect(l1?.uri.endsWith('.webp')).toBe(true);
    expect(l1?.uri.endsWith('.svg')).toBe(false);

    for (const level of ['L2', 'L3A', 'L3B'] as const) {
      expect(defensePulseTowerProductionEntry(level)).toBeNull();
      expect(defenseG8aTowerVisual(MAP_ID, 'PULSE', level)?.uri).toBe(LEGACY_FALLBACK);
    }
  });

  it('keeps dedicated PULSE art scoped to the locked representative map', () => {
    expect(defenseG8aTowerVisual('ramp-01', 'PULSE', 'L1')).toBeNull();
  });

  it('forbids device substitution and CONTROL-family silhouette leakage', () => {
    expect(manifest.forbidden).toContain('temporary distribution board as the PULSE identity');
    expect(manifest.forbidden).toContain('traffic marshal or signal baton silhouette');
    expect(manifest.forbidden).toContain('vehicle-flow barrier composition');
    expect(manifest.forbidden).toContain('sci-fi turret');
    expect(manifest.artDirection.distinctionFromControl).toContain('PULSE is a person stepping in directly');
  });
});

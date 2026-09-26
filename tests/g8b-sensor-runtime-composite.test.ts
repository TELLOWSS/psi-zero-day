import { describe, expect, it } from 'vitest';
import manifest from '../content/defense/g8b-sensor-runtime-composite.json';
import { defenseSensorG8bComposite } from '../src/app/defense-visual-assets';

describe('G8-B SENSOR:L1 raster runtime composite', () => {
  it('reuses approved raster observation and temporary-lighting assets without new generation', () => {
    expect(manifest.status).toBe('PRODUCTION_APPROVED');
    expect(manifest.kind).toBe('RASTER_RUNTIME_COMPOSITE');
    expect(manifest.sourcePolicy.existingApprovedRasterReuse).toBe(true);
    expect(manifest.sourcePolicy.newGenerationRequired).toBe(false);
    expect(manifest.sourcePolicy.svgUsed).toBe(false);
    expect(manifest.sources.observer).toMatch(/player-map\.webp$/);
    expect(manifest.sources.lighting).toMatch(/temporary-lighting-pack\.webp$/);
  });

  it('is scoped only to the top-down map and SENSOR:L1', () => {
    expect(manifest.mapId).toBe('map-apt-top-down-under-slab-01');
    expect(manifest.towerId).toBe('SENSOR');
    expect(manifest.levelId).toBe('L1');
    expect(defenseSensorG8bComposite()).toEqual({
      mapId:'map-apt-top-down-under-slab-01',
      observerUri:'assets/episode01/characters/player-map.webp',
      lightingUri:'assets/episode01/scene-elements/temporary-lighting-pack.webp',
    });
  });
});

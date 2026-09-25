import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import productionRaw from '../content/defense/production-map-family-v1.json';
import { defenseBoardArtUri, defenseProductionMapEntry } from '../src/app/defense-visual-assets';
import { siteProcessMapByProfile } from '../src/content/site-process-maps';

const BOTTOM_ID = 'map-apt-bottom-up-excavation-01';
const TOP_ID = 'map-apt-top-down-under-slab-01';
const ART = 'public/assets/defense/board/ramp-01-hd01.webp';

describe('G8-A bottom-up production map', () => {
  it('keeps ONE GATE AT A TIME: only bottom-up excavation is a production-map candidate', () => {
    expect(productionRaw.generationRule).toBe('ONE_MAP_AT_A_TIME');
    expect(productionRaw.maps).toHaveLength(1);
    expect(productionRaw.maps[0]?.mapId).toBe(BOTTOM_ID);
    expect(productionRaw.maps[0]?.status).toBe('PRODUCTION_CANDIDATE');
  });

  it('reuses the already approved HD world plate only for G8-A', () => {
    const entry = defenseProductionMapEntry(BOTTOM_ID);
    expect(entry?.runtimeUri).toBe('assets/defense/board/ramp-01-hd01.webp');
    expect(defenseBoardArtUri(BOTTOM_ID)).toBe(entry?.runtimeUri);
    expect(existsSync(ART)).toBe(true);
    expect(statSync(ART).size).toBeGreaterThan(100_000);

    expect(defenseProductionMapEntry(TOP_ID)).toBeNull();
    expect(productionRaw.maps[0]?.reusePolicy.allowedForOtherG8Maps).toBe(false);
  });

  it('preserves the locked G5 bottom-up topology and all eight pad coordinates', () => {
    const map = siteProcessMapByProfile('apt-new-bottom-up-excavation');
    expect(map?.id).toBe(BOTTOM_ID);
    expect(map?.width).toBe(1000);
    expect(map?.height).toBe(600);
    expect(map?.pads).toHaveLength(8);
    expect(map?.routes.find(route => route.id === map.primaryDefenseRouteId)?.points).toEqual([
      { x: 0, y: 500 },
      { x: 180, y: 500 },
      { x: 180, y: 390 },
      { x: 370, y: 390 },
      { x: 370, y: 240 },
      { x: 620, y: 240 },
      { x: 620, y: 120 },
      { x: 1000, y: 120 },
    ]);
  });

  it('keeps gameplay authority outside the background image', () => {
    const contract = productionRaw.maps[0]?.runtimeContract;
    expect(contract?.topologyAuthority).toBe('content/defense/site-process-maps-v1.json');
    expect(contract?.routeCoordinatesPreserved).toBe(true);
    expect(contract?.padCoordinatesPreserved).toBe(true);
    expect(contract?.runtimeOverlaysAuthoritative).toBe(true);
    expect(contract?.noGameplayCoordinatesFromImage).toBe(true);
  });

  it('does not bake HUD or text into the registered world plate contract', () => {
    expect(productionRaw.maps[0]?.visualFit).toContain('no baked HUD, text or logo');
    expect(productionRaw.maps[0]?.format).toBe('webp');
    expect(productionRaw.maps[0]?.width).toBe(1000);
    expect(productionRaw.maps[0]?.height).toBe(600);
  });
});

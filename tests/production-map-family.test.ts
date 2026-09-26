import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import policy from '../content/defense/final-art-policy.json';
import productionRaw from '../content/defense/production-map-family-v1.json';
import { defenseBoardArtUri, defenseProductionMapEntry } from '../src/app/defense-visual-assets';
import { siteProcessMapByProfile } from '../src/content/site-process-maps';

const BOTTOM_ID = 'map-apt-bottom-up-excavation-01';
const TOP_ID = 'map-apt-top-down-under-slab-01';
const ART = 'public/assets/defense/board/ramp-01-hd01.webp';

describe('G8-A bottom-up production map', () => {
  it('keeps ONE GATE AT A TIME and refuses to call the temporary HD plate a Production Lock', () => {
    expect(productionRaw.generationRule).toBe('ONE_MAP_AT_A_TIME');
    expect(productionRaw.maps).toHaveLength(1);
    expect(productionRaw.maps[0]?.mapId).toBe(BOTTOM_ID);
    expect(productionRaw.status).toBe('G8A_SWIFT_FINAL_PASS_WORLD_FINAL_REQUIRED');
    expect(productionRaw.maps[0]?.status).toBe('HD_REFERENCE_ONLY');
    expect(productionRaw.maps[0]?.representativeSlice.response).toBe('CONTROL:L1');
    expect(productionRaw.maps[0]?.representativeSlice.responseState).toBe('RASTER_RUNTIME_COMPOSITE_PASS');
    expect(productionRaw.maps[0]?.representativeSlice.risk).toBe('SWIFT');
    expect(productionRaw.maps[0]?.representativeSlice.riskState).toBe('FINAL_RASTER_APPROVED');
    expect(productionRaw.maps[0]?.representativeSlice.worldPlate.state).toBe('FINAL_RASTER_MISSING');
    expect(productionRaw.maps[0]?.finalArtPolicy.productionLockAllowed).toBe(false);
  });

  it('uses only the approved raster HD reference while the process-specific final plate is reworked', () => {
    const entry = defenseProductionMapEntry(BOTTOM_ID);
    expect(entry?.runtimeUri).toBe('assets/defense/board/ramp-01-hd01.webp');
    expect(defenseBoardArtUri(BOTTOM_ID)).toBe(entry?.runtimeUri);
    expect(existsSync(ART)).toBe(true);
    expect(statSync(ART).size).toBeGreaterThan(100_000);
    expect(entry?.format).toBe('webp');
    expect(entry?.runtimeUri).not.toMatch(/\.svg(?:$|\?)/i);
    expect(defenseProductionMapEntry(TOP_ID)).toBeNull();
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

  it('enforces the Master Bible no-SVG-final rule for production map imagery', () => {
    expect(policy.rules.svgFinalArtForbidden).toBe(true);
    expect(policy.rules.productionImageFormats).not.toContain('svg');
    expect(productionRaw.maps.every(map => !map.runtimeUri.toLowerCase().endsWith('.svg'))).toBe(true);
    expect(productionRaw.maps.every(map => map.format !== 'svg')).toBe(true);
  });
});

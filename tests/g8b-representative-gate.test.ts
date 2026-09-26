import { describe, expect, it } from 'vitest';
import gate from '../content/defense/g8b-representative-asset-gate.json';
import policy from '../content/defense/final-art-policy.json';
import productionMaps from '../content/defense/production-map-family-v1.json';
import { siteProcessMapByMapId } from '../src/content/site-process-maps';

describe('G8-B representative PRE-ART gate', () => {
  it('preserves G8-A Production Lock while opening only one new representative gate', () => {
    expect(policy.enforcement.g8aState).toBe('PRODUCTION_LOCKED');
    expect(policy.enforcement.currentGate).toBe('G8-B');
    expect(policy.enforcement.g8bState).toBe('SENSOR_PASS_WORLD_AND_VEILED_FINAL_REQUIRED');
    expect(productionMaps.maps).toHaveLength(1);
    expect(productionMaps.maps[0]?.mapId).toBe('map-apt-bottom-up-excavation-01');
    expect(productionMaps.maps[0]?.status).toBe('PRODUCTION_LOCKED');
  });

  it('locks SENSOR:L1 versus VEILED as the representative top-down slice', () => {
    expect(gate.status).toBe('BLOCKED_WORLD_AND_VEILED_FINAL_RASTER_REQUIRED');
    expect(gate.map).toBe('map-apt-top-down-under-slab-01');
    expect(gate.representative.response).toBe('SENSOR:L1');
    expect(gate.representative.risk).toBe('VEILED');
    expect(gate.response.state).toBe('PASS');
    expect(gate.world.state).toBe('BLOCKED');
    expect(gate.risk.state).toBe('BLOCKED');
    expect(gate.legalVisualProfileId).toBe('KR-CONSTRUCTION-TOP-DOWN-01');
  });

  it('preserves the locked G5 top-down topology exactly', () => {
    const map=siteProcessMapByMapId('map-apt-top-down-under-slab-01');
    expect(map?.pads).toHaveLength(8);
    expect(map?.routes.find(route=>route.id===map.primaryDefenseRouteId)?.points).toEqual([
      {x:0,y:500},{x:150,y:500},{x:150,y:420},{x:350,y:420},{x:350,y:300},
      {x:570,y:300},{x:570,y:420},{x:780,y:420},{x:780,y:250},{x:1000,y:250},
    ]);
    expect(gate.topologyContract.mutationAllowed).toBe(false);
  });
});

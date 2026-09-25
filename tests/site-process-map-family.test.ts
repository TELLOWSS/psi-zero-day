import { describe, expect, it } from 'vitest';
import { zeroBreachContent } from '../src/content/defense';
import { defenseContentForSiteProfile, siteDefenseContents, siteProcessMapByProfile, siteProcessMaps, siteScenarioId } from '../src/content/site-process-maps';
import { applyDefenseCommand, createDefenseRun, defensePathLength, defensePositionAtDistance } from '../src/engine/defense';

describe('G5 MAP-FAMILY-01', () => {
  it('contains only the two representative maps', () => {
    expect(siteProcessMaps).toHaveLength(2);
    expect(siteProcessMaps.map(map => map.siteProfileId)).toEqual([
      'apt-new-bottom-up-excavation',
      'apt-new-top-down-under-slab',
    ]);
  });

  it('keeps the 1000x600 board while changing map topology', () => {
    const bottom = siteProcessMapByProfile('apt-new-bottom-up-excavation')!;
    const top = siteProcessMapByProfile('apt-new-top-down-under-slab')!;
    expect([bottom.width, bottom.height]).toEqual([1000, 600]);
    expect([top.width, top.height]).toEqual([1000, 600]);
    expect(bottom.primaryDefenseRouteId).not.toBe(top.primaryDefenseRouteId);
    expect(bottom.routes.find(route => route.id === bottom.primaryDefenseRouteId)?.points)
      .not.toEqual(top.routes.find(route => route.id === top.primaryDefenseRouteId)?.points);
  });

  it('expresses bottom-up and top-down through different world structures', () => {
    const bottom = siteProcessMapByProfile('apt-new-bottom-up-excavation')!;
    const top = siteProcessMapByProfile('apt-new-top-down-under-slab')!;
    expect(bottom.verticalTransfers.map(item => item.kind)).toEqual(['RAMP']);
    expect(top.verticalTransfers.map(item => item.kind)).toEqual(['MUCK_OPENING', 'LIFT_OPENING']);
    expect(top.visibilityZones.length).toBeGreaterThan(bottom.visibilityZones.length);
    expect(bottom.zones.some(zone => zone.kind === 'EXCAVATION')).toBe(true);
    expect(top.zones.some(zone => zone.kind === 'UNDER_SLAB')).toBe(true);
    expect(top.zones.some(zone => zone.kind === 'OPENING')).toBe(true);
  });

  it('projects both maps into DefenseGame content without changing balance tables', () => {
    expect(siteDefenseContents).toHaveLength(2);
    for (const derived of siteDefenseContents) {
      expect(derived.towers).toEqual(zeroBreachContent.towers);
      expect(derived.enemies).toEqual(zeroBreachContent.enemies);
      expect(derived.waves).toEqual(zeroBreachContent.waves);
      expect(derived.initialResource).toBe(zeroBreachContent.initialResource);
      expect(derived.initialShield).toBe(zeroBreachContent.initialShield);
    }
  });

  it('gives each map its own scenario identity', () => {
    const bottom = defenseContentForSiteProfile('apt-new-bottom-up-excavation');
    const top = defenseContentForSiteProfile('apt-new-top-down-under-slab');
    expect(bottom.scenario.id).toBe(siteScenarioId('apt-new-bottom-up-excavation'));
    expect(top.scenario.id).toBe(siteScenarioId('apt-new-top-down-under-slab'));
    expect(bottom.scenario.id).not.toBe(top.scenario.id);
  });

  it('changes world position for the same engine distance', () => {
    const bottom = defenseContentForSiteProfile('apt-new-bottom-up-excavation');
    const top = defenseContentForSiteProfile('apt-new-top-down-under-slab');
    const distance = 420;
    expect(defensePositionAtDistance(bottom.map.path, distance))
      .not.toEqual(defensePositionAtDistance(top.map.path, distance));
    expect(defensePathLength(bottom.map.path)).not.toBe(defensePathLength(top.map.path));
  });

  it('starts both variants through the same command engine', () => {
    for (const profileId of ['apt-new-bottom-up-excavation', 'apt-new-top-down-under-slab'] as const) {
      const content = defenseContentForSiteProfile(profileId);
      let run = createDefenseRun(content, 'COORDINATOR', 'g5-test');
      run = applyDefenseCommand(run, content, { type: 'Build', padId: content.map.pads[0]!.id, towerId: 'CONTROL' });
      run = applyDefenseCommand(run, content, { type: 'StartWave' });
      expect(run.status).toBe('RUNNING');
      expect(run.towers[0]?.towerId).toBe('CONTROL');
      expect(run.scenarioId).toBe(siteScenarioId(profileId));
    }
  });
});

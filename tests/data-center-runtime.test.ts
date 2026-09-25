import { describe, expect, it } from 'vitest';
import { zeroBreachContent } from '../src/content/defense';
import {
  dataCenterDefense, dataCenterProfileIdForPhase, dataCenterScenario, initialDataCenterState,
} from '../src/content/data-center';
import { siteProfileById } from '../src/content/site-profiles';
import {
  applyDataCenterAction, dataCenterCanLaunchDefense, dataCenterRiskContext,
} from '../src/engine/data-center';
import { calculateRiskPriorities } from '../src/engine/risk-priority';
import type { DataCenterAction, DataCenterRuntimeState } from '../src/domain/data-center';

function applySequence(actions: readonly DataCenterAction[]): DataCenterRuntimeState {
  let state = initialDataCenterState();
  for (const action of actions) {
    const result = applyDataCenterAction(state, action);
    expect(result.applied, result.blockedReason ?? action).toBe(true);
    state = result.state;
  }
  return state;
}

function priorities(state: DataCenterRuntimeState) {
  const profile = siteProfileById(dataCenterProfileIdForPhase(state.phase))!;
  return calculateRiskPriorities(profile, dataCenterRiskContext(state, profile.id));
}

describe('G7 DATA-CENTER-01', () => {
  it('models one representative mission-critical MEP/electrical/commissioning world', () => {
    expect(dataCenterScenario.map.width).toBe(1000);
    expect(dataCenterScenario.map.height).toBe(600);
    expect(dataCenterScenario.map.pads).toHaveLength(8);
    expect(dataCenterScenario.map.zones.some(zone => zone.kind === 'MEP_SERVICE')).toBe(true);
    expect(dataCenterScenario.map.zones.some(zone => zone.kind === 'ELECTRICAL_ROOM')).toBe(true);
    expect(dataCenterScenario.map.zones.some(zone => zone.kind === 'STORED_ENERGY')).toBe(true);
    expect(dataCenterScenario.map.zones.some(zone => zone.kind === 'LIVE_SYSTEM')).toBe(true);
    expect(dataCenterScenario.map.zones.some(zone => zone.kind === 'COMMISSIONING_INTERFACE')).toBe(true);
  });

  it('does not allow energization or commissioning shortcuts before verified boundaries and isolation', () => {
    const initial = initialDataCenterState();
    expect(applyDataCenterAction(initial, 'ENTER_ENERGIZED_STATE').applied).toBe(false);
    expect(applyDataCenterAction(initial, 'RUN_SINGLE_SYSTEM_TEST').applied).toBe(false);

    const electrical = applyDataCenterAction(initial, 'CLOSE_MEP_PUNCHLIST').state;
    expect(applyDataCenterAction(electrical, 'VERIFY_SYSTEM_ISOLATION').applied).toBe(false);
    expect(applyDataCenterAction(electrical, 'PRE_ENERGIZATION_CHECK').applied).toBe(false);
  });

  it('opens Defense practice only after verified isolation and a controlled energized state', () => {
    const precheck = applySequence([
      'CLOSE_MEP_PUNCHLIST',
      'VERIFY_ELECTRICAL_BOUNDARY',
      'PLAN_SYSTEM_ISOLATION',
      'VERIFY_SYSTEM_ISOLATION',
      'PRE_ENERGIZATION_CHECK',
    ]);
    expect(precheck.energyState).toBe('TESTING');
    expect(dataCenterCanLaunchDefense(precheck)).toBe(false);

    const energized = applyDataCenterAction(precheck, 'ENTER_ENERGIZED_STATE').state;
    expect(energized.energyState).toBe('ENERGIZED');
    expect(dataCenterCanLaunchDefense(energized)).toBe(true);
  });

  it('progresses from MEP to integrated commissioning through guarded state changes', () => {
    const complete = applySequence([
      'CLOSE_MEP_PUNCHLIST',
      'VERIFY_ELECTRICAL_BOUNDARY',
      'PLAN_SYSTEM_ISOLATION',
      'VERIFY_SYSTEM_ISOLATION',
      'PRE_ENERGIZATION_CHECK',
      'ENTER_ENERGIZED_STATE',
      'VERIFY_INTERLOCKS',
      'RUN_SINGLE_SYSTEM_TEST',
      'RUN_INTEGRATED_TEST',
      'VERIFY_COMMISSIONING',
    ]);
    expect(complete.phase).toBe('COMPLETE');
    expect(complete.energyState).toBe('LIVE_CRITICAL');
    expect(complete.interlockState).toBe('VERIFIED');
    expect(complete.commissioningState).toBe('VERIFIED');
  });

  it('changes the dominant risk family as the same facility changes state', () => {
    const initial = initialDataCenterState();
    const mep = priorities(initial);
    expect(mep[0]?.riskId).toBe('SWARM');

    const electrical = applySequence([
      'CLOSE_MEP_PUNCHLIST',
      'VERIFY_ELECTRICAL_BOUNDARY',
    ]);
    const electricalRows = priorities(electrical);
    expect(electricalRows.slice(0, 3).map(row => row.riskId)).toContain('VEILED');
    expect(electricalRows.slice(0, 3).map(row => row.riskId)).toContain('ARMORED');

    const energized = applySequence([
      'CLOSE_MEP_PUNCHLIST',
      'VERIFY_ELECTRICAL_BOUNDARY',
      'PLAN_SYSTEM_ISOLATION',
      'VERIFY_SYSTEM_ISOLATION',
      'PRE_ENERGIZATION_CHECK',
      'ENTER_ENERGIZED_STATE',
    ]);
    const energizedRows = priorities(energized);
    expect(energizedRows.slice(0, 3).map(row => row.riskId)).toContain('ARMORED');

    const integrated = applySequence([
      'CLOSE_MEP_PUNCHLIST',
      'VERIFY_ELECTRICAL_BOUNDARY',
      'PLAN_SYSTEM_ISOLATION',
      'VERIFY_SYSTEM_ISOLATION',
      'PRE_ENERGIZATION_CHECK',
      'ENTER_ENERGIZED_STATE',
      'VERIFY_INTERLOCKS',
      'RUN_SINGLE_SYSTEM_TEST',
      'RUN_INTEGRATED_TEST',
    ]);
    const integratedRows = priorities(integrated);
    expect(integratedRows.slice(0, 3).map(row => row.riskId)).toContain('BOSS');
    expect(integratedRows.find(row => row.riskId === 'BOSS')!.score).toBeGreaterThanOrEqual(95);
  });

  it('reuses protected DefenseGame balance while changing map and scenario identity', () => {
    expect(dataCenterDefense.scenario.id).toBe(dataCenterScenario.id);
    expect(dataCenterDefense.map.id).toBe(dataCenterScenario.map.id);
    expect(dataCenterDefense.towers).toEqual(zeroBreachContent.towers);
    expect(dataCenterDefense.enemies).toEqual(zeroBreachContent.enemies);
    expect(dataCenterDefense.waves).toEqual(zeroBreachContent.waves);
    expect(dataCenterDefense.initialResource).toBe(zeroBreachContent.initialResource);
    expect(dataCenterDefense.initialShield).toBe(zeroBreachContent.initialShield);
  });
});

import { describe, expect, it } from 'vitest';
import { zeroBreachContent } from '../src/content/defense';
import { remodelDefense, initialRemodelState, remodelScenario } from '../src/content/remodel';
import { siteProfileById } from '../src/content/site-profiles';
import { applyRemodelAction, remodelCanLaunchDefense, remodelRiskContext } from '../src/engine/remodel';
import { calculateRiskPriorities } from '../src/engine/risk-priority';
import type { RemodelAction, RemodelRuntimeState } from '../src/domain/remodel';

function applySequence(actions: readonly RemodelAction[]): RemodelRuntimeState {
  let state = initialRemodelState();
  for (const action of actions) {
    const result = applyRemodelAction(state, action);
    expect(result.applied, result.blockedReason ?? action).toBe(true);
    state = result.state;
  }
  return state;
}

describe('G6 REMODEL-01', () => {
  it('models one representative existing-building remodeling scenario', () => {
    expect(remodelScenario.profileId).toBe('apt-remodel-selective-demolition');
    expect(remodelScenario.map.width).toBe(1000);
    expect(remodelScenario.map.height).toBe(600);
    expect(remodelScenario.map.pads).toHaveLength(8);
    expect(remodelScenario.map.zones.some(zone => zone.kind === 'EXISTING_STRUCTURE')).toBe(true);
    expect(remodelScenario.map.zones.some(zone => zone.kind === 'TEMP_SUPPORT')).toBe(true);
    expect(remodelScenario.map.zones.some(zone => zone.kind === 'EXTENSION_CONNECTION')).toBe(true);
  });

  it('does not let selective demolition bypass investigation, isolation and temporary support verification', () => {
    const initial = initialRemodelState();
    expect(applyRemodelAction(initial, 'INSTALL_TEMP_SUPPORT').applied).toBe(false);
    expect(applyRemodelAction(initial, 'OPEN_SELECTIVE_ZONE').applied).toBe(false);

    const inspected = applySequence(['REVIEW_EXISTING_RECORDS','FIELD_VERIFY_EXISTING','VERIFY_ISOLATION']);
    expect(applyRemodelAction(inspected, 'PLAN_SELECTIVE_OPENING').applied).toBe(false);
  });

  it('opens the Defense entry only after verified prerequisites and a planned selective opening', () => {
    const before = applySequence([
      'REVIEW_EXISTING_RECORDS','FIELD_VERIFY_EXISTING','VERIFY_ISOLATION',
      'INSTALL_TEMP_SUPPORT','VERIFY_TEMP_SUPPORT',
    ]);
    expect(remodelCanLaunchDefense(before)).toBe(false);

    const planned = applyRemodelAction(before, 'PLAN_SELECTIVE_OPENING').state;
    expect(remodelCanLaunchDefense(planned)).toBe(true);
    expect(planned.phase).toBe('SELECTIVE_DEMOLITION');
  });

  it('moves through selective demolition to old/new structural connection without unsafe shortcut', () => {
    const state = applySequence([
      'REVIEW_EXISTING_RECORDS','FIELD_VERIFY_EXISTING','VERIFY_ISOLATION',
      'INSTALL_TEMP_SUPPORT','VERIFY_TEMP_SUPPORT','PLAN_SELECTIVE_OPENING',
      'OPEN_SELECTIVE_ZONE','REINFORCE_OPENING','PREPARE_CONNECTION','VERIFY_CONNECTION',
    ]);
    expect(state.phase).toBe('COMPLETE');
    expect(state.connectionState).toBe('VERIFIED');
    expect(state.structuralOpeningState).toBe('REINFORCED');
  });

  it('makes uncertainty a first-class remodeling risk signal and changes priorities as the world is verified', () => {
    const profile = siteProfileById(remodelScenario.profileId)!;
    const initial = initialRemodelState();
    const initialRows = calculateRiskPriorities(profile, remodelRiskContext(initial, profile.id));
    const verified = applySequence([
      'REVIEW_EXISTING_RECORDS','FIELD_VERIFY_EXISTING','VERIFY_ISOLATION',
      'INSTALL_TEMP_SUPPORT','VERIFY_TEMP_SUPPORT','PLAN_SELECTIVE_OPENING',
    ]);
    const verifiedRows = calculateRiskPriorities(profile, remodelRiskContext(verified, profile.id));

    const initialVeiled = initialRows.find(row => row.riskId === 'VEILED')!;
    const verifiedVeiled = verifiedRows.find(row => row.riskId === 'VEILED')!;
    expect(initialVeiled.rank).toBeLessThanOrEqual(2);
    expect(initialVeiled.score).toBeGreaterThanOrEqual(90);
    expect(verifiedVeiled.score).toBeLessThan(initialVeiled.score);
    expect(verifiedRows.some(row => row.riskId === 'ARMORED' && row.rank <= 3)).toBe(true);
  });

  it('reuses DefenseGame balance tables while changing map/scenario identity', () => {
    expect(remodelDefense.scenario.id).toBe(remodelScenario.id);
    expect(remodelDefense.map.id).toBe(remodelScenario.map.id);
    expect(remodelDefense.towers).toEqual(zeroBreachContent.towers);
    expect(remodelDefense.enemies).toEqual(zeroBreachContent.enemies);
    expect(remodelDefense.waves).toEqual(zeroBreachContent.waves);
    expect(remodelDefense.initialShield).toBe(zeroBreachContent.initialShield);
    expect(remodelDefense.initialResource).toBe(zeroBreachContent.initialResource);
  });
});

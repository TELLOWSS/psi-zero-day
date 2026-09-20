import { describe, expect, it } from 'vitest';
import { episode01StrategyProduction } from '../src/app/episode01-strategy-production';

describe('Episode 01 Phase C-4 STRATEGY production quality', () => {
  it('opens by reading the whole site before asking for a judgment', () => {
    expect(episode01StrategyProduction('e01_03_plan_breaks', 'situation')).toEqual({
      phase: 'site-read',
      camera_profile: 'operational-overview',
      depth_profile: 'site-layers',
      lighting_profile: 'survey-neutral',
      ui_profile: 'scan',
      focus: 'overview',
    });
  });

  it('keeps people and process relationships on the map during the plan-break conversation', () => {
    expect(episode01StrategyProduction('e01_03_plan_breaks', 'kang')).toMatchObject({
      phase: 'people-network',
      camera_profile: 'network-pan',
      depth_profile: 'relationship-grid',
      lighting_profile: 'network-cool',
      ui_profile: 'compare',
      focus: 'people',
    });
  });

  it('uses the entrance decision in command pressure as the reference tactical judgment', () => {
    expect(episode01StrategyProduction('e01_05_command', 'entrance')).toEqual({
      phase: 'tactical-judgment',
      camera_profile: 'decision-zone',
      depth_profile: 'decision-layered',
      lighting_profile: 'decision-contrast',
      ui_profile: 'judgment',
      focus: 'entry',
    });
  });

  it('returns the selected control to the same field anchor', () => {
    expect(episode01StrategyProduction('e01_05_command', 'assign_crew_result')).toMatchObject({
      phase: 'field-shift',
      camera_profile: 'action-route',
      depth_profile: 'route-open',
      lighting_profile: 'action-clear',
      ui_profile: 'result',
      focus: 'entry',
    });
    expect(episode01StrategyProduction('e01_03_plan_breaks', 'follow_junho_result')?.focus).toBe('ramp');
  });

  it('reads pump arrival as the consequence of the earlier field state', () => {
    expect(episode01StrategyProduction('e01_06_pump_arrival', 'resolve')).toMatchObject({
      phase: 'consequence-read',
      camera_profile: 'consequence-wide',
      depth_profile: 'changed-field',
      lighting_profile: 'consequence-reactive',
      ui_profile: 'verify',
      focus: 'gate',
    });
    expect(episode01StrategyProduction('e01_06_pump_arrival', 'best_control')?.ui_profile).toBe('result');
  });

  it('does not leak STRATEGY production profiles into other scene families', () => {
    expect(episode01StrategyProduction('e01_04_junho_signal', 'listen')).toBeUndefined();
    expect(episode01StrategyProduction(undefined)).toBeUndefined();
  });
});

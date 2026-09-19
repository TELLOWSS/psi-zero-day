import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/domain';
import { episode01MemoryVisualPlan } from '../src/app/episode01-memory-visuals';

function state(flags: Record<string, unknown>): GameState {
  return { flags } as unknown as GameState;
}

describe('Episode 01 outcome-aware memory visuals', () => {
  it('uses the actual field arc for evening memory frames', () => {
    const plan = episode01MemoryVisualPlan(state({
      inspection_result: 'accepted_after_sequence',
      stopwork_culture_result: 'reporting_route_preserved',
      record_result: 'timeline_preserved',
    }), 'e01_09_evening');

    expect(plan?.phase).toBe('evening');
    expect(plan?.frames.map(frame => frame.asset_id)).toEqual([
      'ep01.scene_bg.ramp_entry',
      'ep01.scene_bg.inspection_zone',
      'ep01.scene_bg.break_area',
      'ep01.scene_bg.site_office',
    ]);
    expect(plan?.frames.some(frame => frame.primary)).toBe(false);
  });

  it('makes a reporting-culture carryover the primary next-day memory', () => {
    const plan = episode01MemoryVisualPlan(state({
      stopwork_culture_result: 'reporting_silenced',
      instruction_chain_result: 'conditional_phrase_restored',
      record_result: 'timeline_preserved',
    }), 'e01_10_next_day_tease');

    expect(plan?.phase).toBe('next-day');
    expect(plan?.carryover_key).toBe('people');
    expect(plan?.frames.find(frame => frame.primary)).toMatchObject({
      key: 'people',
      asset_id: 'ep01.scene_bg.break_area',
    });
  });

  it('prioritizes unresolved instruction continuity before record carryover', () => {
    const plan = episode01MemoryVisualPlan(state({
      stopwork_culture_result: 'reporting_route_preserved',
      instruction_chain_result: 'condition_loss_unresolved',
      record_result: 'document_sync_required',
    }), 'e01_10_next_day_tease');

    expect(plan?.carryover_key).toBe('instruction');
    expect(plan?.frames.find(frame => frame.primary)?.key).toBe('people');
  });

  it('uses record memory when documentation remains the first next-day check', () => {
    const plan = episode01MemoryVisualPlan(state({
      stopwork_culture_result: 'reporting_route_preserved',
      instruction_chain_result: 'conditional_phrase_restored',
      record_result: 'supplement_requested',
    }), 'e01_10_next_day_tease');

    expect(plan?.carryover_key).toBe('record');
    expect(plan?.frames.find(frame => frame.primary)).toMatchObject({
      key: 'record',
      asset_id: 'ep01.scene_bg.site_office',
    });
  });

  it('falls back to field continuity when the late-day chain is stable', () => {
    const plan = episode01MemoryVisualPlan(state({
      inspection_result: 'accepted',
      stopwork_culture_result: 'reporting_route_preserved',
      instruction_chain_result: 'conditional_phrase_restored',
      record_result: 'timeline_preserved',
    }), 'e01_10_next_day_tease');

    expect(plan?.carryover_key).toBe('stable');
    expect(plan?.frames.find(frame => frame.primary)?.key).toBe('field');
  });

  it('stays outside unrelated events', () => {
    expect(episode01MemoryVisualPlan(state({}), 'e01_08p_record_return')).toBeUndefined();
    expect(episode01MemoryVisualPlan(null, 'e01_09_evening')).toBeUndefined();
  });
});

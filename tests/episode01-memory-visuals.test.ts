import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/domain';
import { episode01MemoryVisualPlan } from '../src/app/episode01-memory-visuals';
import { episode01MemoryCallback } from '../src/app/episode01-memory-callback';
import { EpisodeImmersiveScene } from '../src/ui/EpisodeImmersiveScene';

function state(flags: Record<string, unknown>): GameState {
  return { flags } as unknown as GameState;
}

function callbackState(flags: Record<string, unknown>): GameState {
  return {
    flags,
    event_runtime: {
      finished_instances: [],
      choice_history: [],
    },
  } as unknown as GameState;
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
  it('renders the next-day carryover frame as the primary memory before re-entry', () => {
    const plan = episode01MemoryVisualPlan(state({
      stopwork_culture_result: 'reporting_route_preserved',
      instruction_chain_result: 'conditional_phrase_restored',
      record_result: 'document_sync_required',
    }), 'e01_10_next_day_tease');

    const html = renderToStaticMarkup(createElement(EpisodeImmersiveScene, {
      eventId: 'e01_10_next_day_tease',
      nodeId: 'tease',
      eventTitle: '다음날',
      resolve: () => undefined,
      t: (id: string) => id,
      memoryVisualPlan: plan,
    }));

    expect(html).toContain('data-memory-phase="next-day"');
    expect(html).toContain('data-carryover="record"');
    expect(html).toContain('data-memory-key="record"');
    expect(html).toContain('data-primary="true"');
    expect(html).toContain('episode-daybreak-threshold');
  });

  it('keeps next-day memory copy aligned with the same carryover priority', () => {
    const peopleFirst = episode01MemoryCallback(callbackState({
      stopwork_culture_result: 'reporting_silenced',
      instruction_chain_result: 'condition_loss_unresolved',
      record_result: 'document_sync_required',
    }), 'e01_10_next_day_tease');

    expect(peopleFirst?.line_text_ids).toContain('ui.memory.outcome.stopwork.silenced');
    expect(peopleFirst?.line_text_ids).not.toContain('ui.memory.outcome.report.sync');

    const instructionFirst = episode01MemoryCallback(callbackState({
      stopwork_culture_result: 'reporting_route_preserved',
      instruction_chain_result: 'worker_blame_hides_chain',
      record_result: 'supplement_requested',
    }), 'e01_10_next_day_tease');

    expect(instructionFirst?.line_text_ids).toContain('ui.memory.outcome.instruction.gap');
    expect(instructionFirst?.line_text_ids).not.toContain('ui.memory.outcome.report.supplement');
  });

});

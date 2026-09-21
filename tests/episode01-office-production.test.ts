import { describe, expect, it } from 'vitest';
import { episode01OfficeProduction } from '../src/app/episode01-office-production';

describe('Episode 01 Phase C-5 OFFICE production quality', () => {
  it('starts from facts instead of a strategy-map reuse', () => {
    expect(episode01OfficeProduction('e01_08o_record_pressure', 'situation')).toMatchObject({
      phase: 'fact-check',
      camera_profile: 'incident-table',
      depth_profile: 'document-layers',
      lighting_profile: 'worklight-neutral',
      ui_profile: 'facts',
      focus: 'facts',
      cast_profile: 'fact-table',
    });
  });

  it('lets each person occupy the room before compressing the responsibility clash', () => {
    expect(episode01OfficeProduction('e01_08e_responsibility_clash', 'lee')).toMatchObject({
      phase: 'position-read',
      hero_character_id: 'lee_jaehoon',
      focus: 'people',
    });
    expect(episode01OfficeProduction('e01_08e_responsibility_clash', 'kang')).toMatchObject({
      phase: 'responsibility-clash',
      camera_profile: 'pressure-triangle',
      hero_character_id: 'kang_taesik',
      focus: 'responsibility',
    });
  });

  it('uses the responsibility report node as the reference OFFICE judgment', () => {
    expect(episode01OfficeProduction('e01_08e_responsibility_clash', 'report')).toMatchObject({
      phase: 'judgment',
      camera_profile: 'player-over-table',
      depth_profile: 'decision-layered',
      lighting_profile: 'decision-contrast',
      ui_profile: 'judgment',
      focus: 'decision',
      cast_profile: 'player-centered',
      hero_character_id: 'player',
    });
  });

  it('compares evidence on return events instead of reopening the argument', () => {
    expect(episode01OfficeProduction('e01_08f_report_return', 'resolve')).toMatchObject({
      phase: 'evidence-compare',
      camera_profile: 'evidence-over-shoulder',
      depth_profile: 'evidence-stack',
      ui_profile: 'compare',
      focus: 'evidence',
    });
    expect(episode01OfficeProduction('e01_08n_instruction_return', 'resolve')?.evidence_slots.map(item => item.state))
      .toEqual(['past', 'past', 'active']);
  });

  it('turns a result into a record handoff that survives into later field behavior', () => {
    expect(episode01OfficeProduction('e01_08o_record_pressure', 'timeline_result')).toMatchObject({
      phase: 'record-carryover',
      camera_profile: 'file-to-field',
      depth_profile: 'open-handoff',
      lighting_profile: 'carryover-daylight',
      ui_profile: 'result',
      focus: 'field-memory',
      cast_profile: 'record-handoff',
    });
    expect(episode01OfficeProduction('e01_08p_record_return', 'preserved')?.focus).toBe('field-memory');
  });

  it('does not leak OFFICE profiles into FIELD, TBM, STOP WORK or STRATEGY events', () => {
    expect(episode01OfficeProduction('e01_05_command', 'entrance')).toBeUndefined();
    expect(episode01OfficeProduction('e01_08g_tbm_field_gap', 'tbm_action')).toBeUndefined();
    expect(episode01OfficeProduction(undefined)).toBeUndefined();
  });
});

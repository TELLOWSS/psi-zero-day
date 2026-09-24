import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { episode01OfficeProduction } from '../src/app/episode01-office-production';

describe('Episode 01 Phase C-5 OFFICE production quality', () => {
  it('reads facts and role-specific statements before responsibility judgment', () => {
    expect(episode01OfficeProduction('e01_08e_responsibility_clash', 'gc')).toMatchObject({
      phase: 'fact-intake',
      camera_profile: 'speaker-tight',
      depth_profile: 'testimony-layered',
      lighting_profile: 'speaker-focus',
      ui_profile: 'dialogue',
      cast_profile: 'speaker-focus',
      evidence_focus: 'facts',
      hero_character_id: 'oh_seungjae',
    });
    expect(episode01OfficeProduction('e01_08e_responsibility_clash', 'lee')).toMatchObject({
      phase: 'position-split',
      evidence_focus: 'statements',
      hero_character_id: 'lee_jaehoon',
    });
  });

  it('uses the responsibility report node as the reference evidence-table judgment', () => {
    expect(episode01OfficeProduction('e01_08e_responsibility_clash', 'report')).toEqual({
      phase: 'responsibility-judgment',
      camera_profile: 'judgment-table',
      depth_profile: 'evidence-table',
      lighting_profile: 'decision-amber',
      ui_profile: 'judgment',
      cast_profile: 'balanced-table',
      evidence_focus: 'responsibility',
    });
  });

  it('commits the first report basis before returning evidence tests it', () => {
    expect(episode01OfficeProduction('e01_08e_responsibility_clash', 'timeline_result')).toMatchObject({
      phase: 'report-commit',
      ui_profile: 'result',
      evidence_focus: 'timeline',
    });
    expect(episode01OfficeProduction('e01_08f_report_return', 'resolve')).toMatchObject({
      phase: 'evidence-return',
      camera_profile: 'evidence-wide',
      depth_profile: 'evidence-return',
      lighting_profile: 'verification-clear',
      ui_profile: 'judgment',
      evidence_focus: 'timeline',
    });
  });

  it('traces instruction loss as evidence instead of turning it into another field scene', () => {
    expect(episode01OfficeProduction('e01_08n_instruction_return', 'reconstructed')).toMatchObject({
      phase: 'instruction-trace',
      camera_profile: 'trace-medium',
      depth_profile: 'trace-board',
      lighting_profile: 'trace-cool',
      ui_profile: 'trace',
      cast_profile: 'instruction-return',
      evidence_focus: 'instruction',
    });
  });

  it('makes record pressure and record judgment visibly different office beats', () => {
    expect(episode01OfficeProduction('e01_08o_record_pressure', 'oh')).toMatchObject({
      phase: 'record-pressure',
      camera_profile: 'speaker-tight',
      depth_profile: 'record-stack',
      ui_profile: 'dialogue',
      hero_character_id: 'oh_seungjae',
    });
    expect(episode01OfficeProduction('e01_08o_record_pressure', 'record_action')).toEqual({
      phase: 'record-judgment',
      camera_profile: 'record-decision',
      depth_profile: 'decision-layered',
      lighting_profile: 'decision-contrast',
      ui_profile: 'record',
      cast_profile: 'decision-table',
      evidence_focus: 'record',
    });
  });

  it('carries the record consequence toward prevention instead of ending at paperwork', () => {
    expect(episode01OfficeProduction('e01_08p_record_return', 'preserved')).toMatchObject({
      phase: 'prevention-return',
      camera_profile: 'carryover-wide',
      depth_profile: 'prevention-open',
      lighting_profile: 'prevention-soft',
      ui_profile: 'verify',
      cast_profile: 'carryover-table',
      evidence_focus: 'prevention',
    });
  });

  it('locks the Phase D-2 office to the final shared-room composition', () => {
    const css = fs.readFileSync(path.resolve('src/ui/phase-d-screenshot-polish.css'), 'utf8');
    expect(css).toContain('Phase D-2 — OFFICE shared-room lock pass 05.');
    expect(css).toContain('brightness(1.075)');
    expect(css).toContain('.office-table-plane');
    expect(css).toContain('display: none !important');
    expect(css).toContain('width: min(760px,49%)');
    expect(css).toContain('e01_08e_responsibility_clash');
  });

  it('does not leak OFFICE profiles into other scene families', () => {
    expect(episode01OfficeProduction('e01_08g_tbm_field_gap', 'tbm_action')).toBeUndefined();
    expect(episode01OfficeProduction('e01_09_evening', 'evening')).toBeUndefined();
    expect(episode01OfficeProduction(undefined)).toBeUndefined();
  });
});

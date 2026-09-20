import { describe, expect, it } from 'vitest';
import { createEpisode01Registry } from '../src/content/episode01';
import { episode01ExpectedRunTotal } from '../src/app/episode01-run-progress';
import { episode01AutoAdvanceDelay, episode01AutoResolveChoice, episode01StoryPreset } from '../src/app/episode01-story-director';
import { playEpisode } from './helpers/episode01-playthrough';

const directedContent = createEpisode01Registry('directed').getValidatedContent();

describe('Episode 01 directed campaign mode', () => {
  it('plays the complete 26-event story spine without changing engine or choice ids', () => {
    const { state } = playEpisode({
      plan: 'coordinate_schedule',
      signal: 'listen_more',
      ramp: 'check_self',
      entrance: 'request_delay',
      inspection: 'inspection_sequence_agreement',
      responsibility: 'report_verify_timeline',
      tbm: 'tbm_change_control',
      restart: 'restart_verify_controls',
      stopwork: 'stopwork_protect_process',
      instruction: 'instruction_reconstruct_chain',
      record: 'record_preserve_timeline',
      evening: 'field_note',
    }, { content: directedContent });

    const ids = state.event_runtime.completion_history.map(item => item.event_id);
    expect(ids).toHaveLength(26);
    expect(ids).toContain('e01_04_junho_signal');
    expect(ids).toContain('e01_08c_site_pushback');
    expect(ids).toContain('e01_08e_responsibility_clash');
    expect(ids).toContain('e01_08g_tbm_field_gap');
    expect(ids).toContain('e01_08k_stopwork_aftershock');
    expect(ids).toContain('e01_08o_record_pressure');
    expect(state.run.content_version).toBe('ep01.director.v5');
    expect(episode01ExpectedRunTotal(state)).toBe(26);
    expect(state.flags.episode01_completed).toBe(true);
  });

  it('binds the major beats to production scene presets', () => {
    expect(episode01StoryPreset('e01_02_meet_kang')).toBe('TBM');
    expect(episode01StoryPreset('e01_08b_inspection_find')).toBe('STOP_WORK');
    expect(episode01StoryPreset('e01_08c_site_pushback')).toBe('STOP_WORK');
    expect(episode01StoryPreset('e01_08e_responsibility_clash')).toBe('OFFICE_DIALOGUE');
    expect(episode01StoryPreset('e01_09_evening')).toBe('DAY_RESULT');
  });

  it('auto-advances exposition only, never authored decision nodes', () => {
    expect(episode01AutoAdvanceDelay('e01_03_plan_breaks', 'situation', 45)).toBeGreaterThanOrEqual(4200);
    expect(episode01AutoAdvanceDelay('e01_08e_responsibility_clash', 'gc', 45)).toBeGreaterThanOrEqual(4200);
    expect(episode01AutoAdvanceDelay('e01_03_plan_breaks', 'plan', 45)).toBeUndefined();
    expect(episode01AutoAdvanceDelay('e01_08b_inspection_find', 'action', 45)).toBeUndefined();
  });

  it('classifies deterministic return routing separately from the 12 authored player decisions', () => {
    expect(episode01AutoResolveChoice('e01_08a_reporting_return')).toBe(true);
    expect(episode01AutoResolveChoice('e01_08f_report_return')).toBe(true);
    expect(episode01AutoResolveChoice('e01_08p_record_return')).toBe(true);
    expect(episode01AutoResolveChoice('e01_03_plan_breaks')).toBe(false);
    expect(episode01AutoResolveChoice('e01_08c_site_pushback')).toBe(false);
    expect(episode01AutoResolveChoice('e01_09_evening')).toBe(false);
  });
});

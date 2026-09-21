import { describe, expect, it } from 'vitest';
import { episode01DayResultProduction } from '../src/app/episode01-day-result-production';

describe('Episode 01 Phase C-6 DAY RESULT production quality', () => {
  it('closes the day as reflection rather than a scorecard', () => {
    const model = episode01DayResultProduction('e01_09_evening', 'evening', {
      record_result: 'timeline_preserved',
      stopwork_culture_result: 'reporting_route_preserved',
      instruction_chain_result: 'conditional_phrase_restored',
    });
    expect(model).toMatchObject({
      phase: 'day-reflection',
      camera_profile: 'sunset-memory-wide',
      depth_profile: 'memory-tableau',
      lighting_profile: 'home-night-warm',
      ui_profile: 'reflect',
      carryover_key: 'stable',
    });
    expect(model?.lanes.map(item => item.kind)).toEqual(['result', 'people', 'memory', 'tomorrow']);
  });

  it('prioritizes a people residue without turning it into a numeric penalty', () => {
    const model = episode01DayResultProduction('e01_09_evening', 'evening', {
      record_result: 'timeline_preserved',
      stopwork_culture_result: 'reporting_silenced',
      instruction_chain_result: 'conditional_phrase_restored',
    });
    expect(model?.carryover_key).toBe('people');
    expect(model?.lanes[0]).toMatchObject({
      kind: 'result',
      title_text_id: 'ui.day_carryover.people.silenced.title',
    });
    expect(model?.lanes[1]).toMatchObject({
      kind: 'people',
      title_text_id: 'ui.day_carryover.people.silenced.title',
    });
  });

  it('shows the chosen evening action as memory and opens the tomorrow threshold after the choice', () => {
    const model = episode01DayResultProduction('e01_09_evening', 'field_note', {
      record_result: 'document_sync_required',
      stopwork_culture_result: 'reporting_route_preserved',
      instruction_chain_result: 'conditional_phrase_restored',
      evening_field_note: true,
    });
    expect(model).toMatchObject({
      phase: 'choice-afterglow',
      camera_profile: 'personal-settle-wide',
      depth_profile: 'future-threshold',
      lighting_profile: 'night-to-dawn',
      ui_profile: 'afterglow',
      carryover_key: 'record',
    });
    expect(model?.lanes.find(item => item.kind === 'memory')?.title_text_id)
      .toBe('ui.day_carryover.evening.note.title');
    expect(model?.lanes.find(item => item.kind === 'tomorrow')?.title_text_id)
      .toBe('ui.day_carryover.first.record.title');
  });

  it('keeps next-day teaser and other scene families out of the DAY RESULT profile', () => {
    expect(episode01DayResultProduction('e01_10_next_day_tease', 'tease', {})).toBeUndefined();
    expect(episode01DayResultProduction('e01_08p_record_return', 'preserved', {})).toBeUndefined();
    expect(episode01DayResultProduction('e01_09_evening', 'evening', undefined)).toBeUndefined();
  });
});

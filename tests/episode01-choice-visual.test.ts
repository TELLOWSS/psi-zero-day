import { describe, expect, it } from 'vitest';
import { episode01ChoiceVisual } from '../src/app/episode01-choice-visual';

describe('Episode 01 choice visual previews', () => {
  it('gives every major choice family a visual intent', () => {
    expect(episode01ChoiceVisual('e01_04_junho_signal', 'listen_more')?.tone).toBe('people');
    expect(episode01ChoiceVisual('e01_04_junho_signal', 'dismiss')?.tone).toBe('pressure');
    expect(episode01ChoiceVisual('e01_08b_inspection_find', 'inspection_sequence_agreement')?.tone).toBe('control');
    expect(episode01ChoiceVisual('e01_08e_responsibility_clash', 'report_verify_timeline')?.tone).toBe('evidence');
    expect(episode01ChoiceVisual('e01_09_evening', 'family')?.tone).toBe('recovery');
  });

  it('uses authored framing for the major ambiguous player decisions', () => {
    const delegate = episode01ChoiceVisual('e01_03_plan_breaks', 'delegate_kang');
    const schedule = episode01ChoiceVisual('e01_03_plan_breaks', 'coordinate_schedule');
    const report = episode01ChoiceVisual('e01_08e_responsibility_clash', 'report_verify_timeline');
    expect(delegate?.authored).toBe(true);
    expect(schedule?.authored).toBe(true);
    expect(report?.authored).toBe(true);
    expect(delegate?.crop).not.toBe(schedule?.crop);
    expect(report?.tone).toBe('evidence');
  });

  it('keeps state-gated consequence branches on the safe generic fallback', () => {
    expect(episode01ChoiceVisual('e01_08_reactions', 'kang.high')?.authored).toBe(false);
  });

  it('reuses the authored scene background while varying crop and prop emphasis per choice', () => {
    const a = episode01ChoiceVisual('e01_06_pump_arrival', 'best_control');
    const b = episode01ChoiceVisual('e01_06_pump_arrival', 'near_miss');
    expect(a?.background_uri).toContain('concrete-pour');
    expect(b?.background_uri).toContain('concrete-pour');
    expect(a?.tone).not.toBe(b?.tone);
  });
});

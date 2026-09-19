import { describe, expect, it } from 'vitest';
import { episode02LiftReality } from '../src/app/episode02-lift-reality';
import { FIELD_REALITY_DOCTRINE_ID } from '../src/app/gameplay-doctrine';
import { episodeCinematicBeat } from '../src/app/episode-cinematic-beats';
import { episodePresentationAudioCue } from '../src/app/episode-presentation-cues';

describe('Episode 02 first lift reality chain', () => {
  it('binds day two to the absolute field-reality doctrine', () => {
    const model = episode02LiftReality('e02_01_lift_route_pressure', { reporting_return_state: 'reinforced' });
    expect(model?.doctrine_id).toBe(FIELD_REALITY_DOCTRINE_ID);
    expect(model?.cards.some(card => card.title_text_id === 'ui.ep02_lift.floor.title')).toBe(true);
    expect(model?.cards.some(card => card.title_text_id === 'ui.ep02_lift.voices.title')).toBe(true);
  });

  it('carries yesterday reporting climate into the new work condition', () => {
    const model = episode02LiftReality('e02_01_lift_route_pressure', { stopwork_culture_result: 'reporting_silenced' });
    expect(model?.cards.some(card => card.title_text_id.includes('carryover.silenced'))).toBe(true);
  });

  it('shows distinct operational costs for all three route choices', () => {
    const plan = episode02LiftReality('e02_01_lift_route_pressure', { day02_lift_action: 'plan_route' });
    const field = episode02LiftReality('e02_01_lift_route_pressure', { day02_lift_action: 'field_route' });
    const shared = episode02LiftReality('e02_01_lift_route_pressure', { day02_lift_action: 'shared_route' });
    expect(plan?.cards.some(card => card.title_text_id.includes('action.plan'))).toBe(true);
    expect(field?.cards.some(card => card.title_text_id.includes('action.field'))).toBe(true);
    expect(shared?.cards.some(card => card.title_text_id.includes('action.shared'))).toBe(true);
  });

  it('turns the same 07:18 panel from verification into consequence', () => {
    const before = episode02LiftReality('e02_02_lift_route_return', { day02_lift_action: 'field_route' });
    const after = episode02LiftReality('e02_02_lift_route_return', {
      day02_lift_action: 'field_route',
      day02_lift_result: 'experience_route_dependency',
    });
    expect(before?.phase).toBe('return');
    expect(after?.phase).toBe('verdict');
    expect(after?.cards.some(card => card.title_text_id.includes('result.field'))).toBe(true);
  });

  it('does not silently reuse Episode 01 presentation contracts before Episode 02 cues are authored', () => {
    expect(episodeCinematicBeat('e02_01_lift_route_pressure')).toBeUndefined();
    expect(episodeCinematicBeat('e02_02_lift_route_return')).toBeUndefined();
    expect(episodePresentationAudioCue('e02_01_lift_route_pressure')).toBeUndefined();
    expect(episodePresentationAudioCue('e02_02_lift_route_return')).toBeUndefined();
  });
});

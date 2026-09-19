import { describe, expect, it } from 'vitest';
import manifest from '../content/episode01/manifest.json';
import plan from '../content/episode01/immersive-scenes.json';
import { episode01DirectedNodeCount, episode01ImmersiveScene, episode01ImmersiveSceneCount } from '../src/app/episode01-immersive-scene';
import { episode01MomentOverlay, episode01RelationshipSceneCue } from '../src/ui/EpisodeImmersiveScene';

describe('Episode 01 immersive scene coverage', () => {
  it('covers every authored Episode 01 event', () => {
    const ids = manifest.event_flow.map(id => id.toLowerCase());
    expect(episode01ImmersiveSceneCount).toBe(ids.length);
    for (const id of ids) expect(plan.events).toHaveProperty(id);
  });

  it('authors every live non-END node instead of relying on regex camera inference', () => {
    expect(episode01DirectedNodeCount).toBe(146);
    expect(episode01ImmersiveScene('e01_03_plan_breaks', 'follow_junho_result', 'SHOW_RESULT')?.authored_node_direction).toBe(true);
    expect(episode01ImmersiveScene('e01_03_plan_breaks', 'follow_junho_result', 'SHOW_RESULT')?.tone).toBe('neutral');
    expect(episode01ImmersiveScene('e01_08_reactions', 'kang.low', 'SHOW_DIALOGUE', 'kang_taesik')?.tone).toBe('pressure');
  });

  it('uses real scene art rather than the single foundation map for every event', () => {
    const backgrounds = new Set(Object.values(plan.events).map(scene => scene.bg));
    expect(backgrounds.size).toBeGreaterThanOrEqual(8);
    for (const uri of backgrounds) expect(uri).toMatch(/^assets\/episode01\/cg\/.+-rc\.svg$/);
  });

  it('tightens a choice into decision tone and changes result mood by node', () => {
    expect(episode01ImmersiveScene('e01_03_plan_breaks', 'plan', 'SHOW_CHOICE')?.tone).toBe('decision');
    expect(episode01ImmersiveScene('e01_06_pump_arrival', 'near_miss', 'SHOW_RESULT')?.tone).toBe('pressure');
    expect(episode01ImmersiveScene('e01_06_pump_arrival', 'best_control', 'SHOW_RESULT')?.tone).toBe('resolved');
  });

  it('adds the active speaker to the image when the base cast omitted them', () => {
    const scene = episode01ImmersiveScene('e01_06_pump_arrival', 'best_control_react', 'SHOW_DIALOGUE', 'lim_junho');
    expect(scene?.cast).toContain('lim_junho');
  });

  it('directs dialogue, choice and consequence nodes as different shots', () => {
    const dialogue = episode01ImmersiveScene('e01_04_junho_signal', 'detail', 'SHOW_DIALOGUE', 'lim_junho');
    expect(dialogue?.shot).toBe('dialogue');
    expect(dialogue?.subject_character_id).toBe('lim_junho');
    expect(dialogue?.focus).toBe('left');

    const choice = episode01ImmersiveScene('e01_05_command', 'ramp', 'SHOW_CHOICE');
    expect(choice?.shot).toBe('decision');
    expect(choice?.camera).toBe('medium');

    const pressure = episode01ImmersiveScene('e01_06_pump_arrival', 'near_miss', 'SHOW_RESULT');
    expect(pressure?.shot).toBe('result-pressure');
    expect(pressure?.camera).toBe('tight');

    const resolved = episode01ImmersiveScene('e01_06_pump_arrival', 'best_control', 'SHOW_RESULT');
    expect(resolved?.shot).toBe('result-resolved');
    expect(resolved?.camera).toBe('wide');
  });

  it('lets keyboard or pointer choice focus redirect the full scene without scoring it', () => {
    const people = episode01ImmersiveScene('e01_03_plan_breaks', 'kang.branch', 'SHOW_CHOICE', null, 'delegate_kang');
    const control = episode01ImmersiveScene('e01_03_plan_breaks', 'kang.branch', 'SHOW_CHOICE', null, 'coordinate_schedule');
    expect(people?.tone).toBe('decision');
    expect(control?.tone).toBe('decision');
    expect(people?.preview_choice_tone).toBe('people');
    expect(control?.preview_choice_tone).toBe('control');
    expect(people?.focus).toBe('left');
    expect(control?.focus).toBe('center');
  });

  it('keeps evening reflection visually distinct from field pressure', () => {
    expect(episode01ImmersiveScene('e01_09_evening', 'family', 'SHOW_RESULT')?.tone).toBe('reflective');
    expect(episode01ImmersiveScene('e01_09_evening', 'family', 'SHOW_RESULT')?.background_uri).toContain('home-night');
  });
  it('keeps key field beats multi-plane instead of falling back to flat background-only scenes', () => {
    const layeredFieldEvents = [
      'e01_01_arrival',
      'e01_02_meet_kang',
      'e01_08_reactions',
      'e01_08a_reporting_return',
      'e01_10_next_day_tease',
    ] as const;
    for (const eventId of layeredFieldEvents) {
      expect(plan.events[eventId].props.length).toBeGreaterThanOrEqual(2);
    }
  });



  it('maps signature Episode 01 moments to neutral scene overlays without scoring choices', () => {
    expect(episode01MomentOverlay('e01_03_plan_breaks', 'plan')).toBe('schedule-cross');
    expect(episode01MomentOverlay('e01_04_junho_signal', 'detail')).toBe('signal-trace');
    expect(episode01MomentOverlay('e01_06_pump_arrival', 'pump')).toBe('pump-approach');
    expect(episode01MomentOverlay('e01_06_pump_arrival', 'near_miss')).toBe('near-miss');
    expect(episode01MomentOverlay('e01_07_first_pour', 'pressure')).toBe('pour-flow');
    expect(episode01MomentOverlay('e01_08b_inspection_find', 'inspection')).toBe('inspection-frame');
    expect(episode01MomentOverlay('e01_08g_tbm_field_gap', 'tbm_action')).toBe('tbm-gap');
    expect(episode01MomentOverlay('e01_08h_tbm_return', 'paper')).toBe('tbm-gap');
    expect(episode01MomentOverlay('e01_08i_restart_pressure', 'restart_action')).toBe('restart-trace');
    expect(episode01MomentOverlay('e01_08j_restart_return', 'controlled')).toBe('restart-trace');
    expect(episode01MomentOverlay('e01_08k_stopwork_aftershock', 'aftershock')).toBe('stopwork-gap');
    expect(episode01MomentOverlay('e01_08m_instruction_cascade', 'instruction_action')).toBe('instruction-chain');
    expect(episode01MomentOverlay('e01_08n_instruction_return', 'reconstructed')).toBe('instruction-chain');
    expect(episode01MomentOverlay('e01_08o_record_pressure', 'pressure')).toBe('record-pressure');
    expect(episode01MomentOverlay('e01_09_evening', 'rest')).toBeUndefined();
  });


  it('turns relationship deltas into neutral spatial aftermath cues instead of score colors', () => {
    expect(episode01RelationshipSceneCue(3)).toBe('closer');
    expect(episode01RelationshipSceneCue(-2)).toBe('strained');
    expect(episode01RelationshipSceneCue(0)).toBeUndefined();
  });


  it('maps restart and instruction-chain arcs to distinct neutral overlays', () => {
    expect(episode01MomentOverlay('e01_08i_restart_pressure', 'follow_verbal_result')).toBe('restart-trace');
    expect(episode01MomentOverlay('e01_08j_restart_return', 'distorted')).toBe('restart-trace');
    expect(episode01MomentOverlay('e01_08m_instruction_cascade', 'blame_worker_result')).toBe('instruction-chain');
    expect(episode01MomentOverlay('e01_08n_instruction_return', 'gap')).toBe('instruction-chain');
  });


  it('maps TBM paper-field continuity to its own neutral overlay', () => {
    expect(episode01MomentOverlay('e01_08g_tbm_field_gap', 'form_first_result')).toBe('tbm-gap');
    expect(episode01MomentOverlay('e01_08g_tbm_field_gap', 'change_control_result')).toBe('tbm-gap');
    expect(episode01MomentOverlay('e01_08h_tbm_return', 'silenced')).toBe('tbm-gap');
    expect(episode01MomentOverlay('e01_08h_tbm_return', 'controlled')).toBe('tbm-gap');
  });


  it('maps schedule collision and first-pour flow to distinct scene overlays', () => {
    expect(episode01MomentOverlay('e01_03_plan_breaks', 'coordinate_schedule_result')).toBe('schedule-cross');
    expect(episode01MomentOverlay('e01_03_plan_breaks', 'follow_junho_result')).toBe('schedule-cross');
    expect(episode01MomentOverlay('e01_07_first_pour', 'pour')).toBe('pour-flow');
    expect(episode01MomentOverlay('e01_07_first_pour', 'after')).toBe('pour-flow');
  });
});

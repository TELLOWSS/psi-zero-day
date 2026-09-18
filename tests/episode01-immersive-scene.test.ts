import { describe, expect, it } from 'vitest';
import manifest from '../content/episode01/manifest.json';
import plan from '../content/episode01/immersive-scenes.json';
import { episode01ImmersiveScene, episode01ImmersiveSceneCount } from '../src/app/episode01-immersive-scene';

describe('Episode 01 immersive scene coverage', () => {
  it('covers every authored Episode 01 event', () => {
    const ids = manifest.event_flow.map(id => id.toLowerCase());
    expect(episode01ImmersiveSceneCount).toBe(ids.length);
    for (const id of ids) expect(plan.events).toHaveProperty(id);
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

  it('keeps evening reflection visually distinct from field pressure', () => {
    expect(episode01ImmersiveScene('e01_09_evening', 'family', 'SHOW_RESULT')?.tone).toBe('reflective');
    expect(episode01ImmersiveScene('e01_09_evening', 'family', 'SHOW_RESULT')?.background_uri).toContain('home-night');
  });
});

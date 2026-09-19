import { describe, expect, it } from 'vitest';
import events from '../content/episode01/events.json';
import director from '../content/episode01/episode01-director-pass-v2.json';
import sceneComposition from '../content/episode01/scene-composition.json';
import manifest from '../content/episode01/manifest.json';

const event=(id:string)=>events.find(item=>item.event_id===id)!;

describe('Episode 01 director pass v2',()=>{
  it('gives the opening conflict four non-binary attention choices and a consequence beat for each',()=>{
    const e=event('e01_03_plan_breaks');
    const choiceNode=e.dialogue.find(node=>node.node_id==='plan')!;
    expect(choiceNode.choice_ids).toHaveLength(4);
    for(const choice of e.choices){
      const next=e.dialogue.find(node=>node.node_id===choice.next_node_id);
      expect(next?.type).toBe('RESULT');
    }
  });

  it('turns the worker signal into three plausible handling routes',()=>{
    const e=event('e01_04_junho_signal');
    const node=e.dialogue.find(node=>node.node_id==='listen')!;
    expect(node.choice_ids).toEqual(['listen_more','crosscheck_minseok','dismiss']);
    expect(e.participants.some(p=>p.role_id==='minseok')).toBe(true);
  });

  it('uses linked decisions and visible intermediate consequences before pump arrival',()=>{
    const e=event('e01_05_command');
    expect(e.dialogue.find(node=>node.node_id==='ramp')?.choice_ids).toHaveLength(3);
    expect(e.dialogue.find(node=>node.node_id==='entrance')?.choice_ids).toHaveLength(3);
    expect(e.dialogue.filter(node=>node.node_id.endsWith('_result')).length).toBeGreaterThanOrEqual(6);
  });

  it('reveals pump consequences through character reactions and closes on a first-pour set-piece',()=>{
    const pump=event('e01_06_pump_arrival');
    expect(pump.dialogue.filter(node=>node.node_id.endsWith('_react'))).toHaveLength(4);
    const pour=event('e01_07_first_pour');
    expect(pour.dialogue.filter(node=>node.type==='DIALOGUE')).toHaveLength(2);
    expect(sceneComposition.events['e01_07_first_pour'].primary_anchor).toBe('overview');
  });

  it('bumps content compatibility and records the no-obvious-answer design contract',()=>{
    expect(manifest.bundle.content_version).toBe('ep01.director.v4');
    expect(director.design_rules.some(rule=>rule.includes('obviously safe/correct'))).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import inspectionEvents from '../content/episode01/inspection-events.json';
import responsibilityEvent from '../content/episode01/responsibility-clash-event.json';
import tbmEvents from '../content/episode01/tbm-gap-events.json';
import restartEvents from '../content/episode01/restart-events.json';
import stopworkEvents from '../content/episode01/stopwork-aftershock-events.json';
import instructionEvents from '../content/episode01/instruction-chain-events.json';
import manifest from '../content/episode01/manifest.json';
import director from '../content/episode01/episode01-director-pass-v3.json';
import { episodeCinematicBeat } from '../src/app/episode-cinematic-beats';

const pick=(events:readonly any[],id:string)=>events.find(e=>e.event_id===id)!;
const assertImmediateResults=(event:any)=>{
  for(const choice of event.choices){
    const next=event.dialogue.find((n:any)=>n.node_id===choice.next_node_id);
    expect(next).toBeTruthy();
    expect(['RESULT','DIALOGUE']).toContain(next.type);
    expect(next.node_id).not.toBe('end');
  }
};

describe('Episode 01 director pass v3',()=>{
  it('gives immediate consequence beats to every major later-field decision',()=>{
    assertImmediateResults(pick(inspectionEvents,'e01_08b_inspection_find'));
    assertImmediateResults(responsibilityEvent);
    assertImmediateResults(pick(tbmEvents,'e01_08g_tbm_field_gap'));
    assertImmediateResults(pick(restartEvents,'e01_08i_restart_pressure'));
    assertImmediateResults(pick(stopworkEvents,'e01_08k_stopwork_aftershock'));
    assertImmediateResults(pick(instructionEvents,'e01_08m_instruction_cascade'));
  });

  it('adds cinematic time-and-place stamps across later consequence arcs',()=>{
    const ids=['e01_08b_inspection_find','e01_08e_responsibility_clash','e01_08g_tbm_field_gap','e01_08i_restart_pressure','e01_08k_stopwork_aftershock','e01_08m_instruction_cascade'];
    expect(ids.map(id=>episodeCinematicBeat(id)).every(Boolean)).toBe(true);
    expect(new Set(ids.map(id=>episodeCinematicBeat(id)!.zone)).size).toBeGreaterThanOrEqual(4);
  });

  it('bumps incompatible story state and locks the delayed-consequence contract',()=>{
    expect(manifest.bundle.content_version).toBe('ep01.director.v3');
    expect(director.rules.some(rule=>rule.includes('immediate consequence'))).toBe(true);
    expect(director.rules.some(rule=>rule.includes('Delayed return events'))).toBe(true);
  });
});

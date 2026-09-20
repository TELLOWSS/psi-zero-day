import { describe, expect, it } from 'vitest';
import recordEvents from '../content/episode01/record-pressure-events.json';
import manifest from '../content/episode01/manifest.json';
import director from '../content/episode01/episode01-director-pass-v4.json';
import { episodeCinematicBeat } from '../src/app/episode-cinematic-beats';

describe('Episode 01 director pass v4',()=>{
  it('gives every record-pressure choice an immediate consequence before delayed verification',()=>{
    const event=recordEvents.find(item=>item.event_id==='e01_08o_record_pressure')!;
    for(const choice of event.choices){
      const next=event.dialogue.find(node=>node.node_id===choice.next_node_id);
      expect(next?.type).toBe('RESULT');
      expect(next?.node_id).not.toBe('end');
    }
  });

  it('adds closing cinematic beats through evening and next morning',()=>{
    expect(episodeCinematicBeat('e01_08o_record_pressure')?.time).toBe('16:42');
    expect(episodeCinematicBeat('e01_09_evening')?.time).toBe('17:18');
    expect(episodeCinematicBeat('e01_10_next_day_tease')?.zone).toContain('DAY 02');
  });

  it('locks the choice-consequence-memory contract and bumps save compatibility',()=>{
    expect(manifest.bundle.content_version).toBe('ep01.director.v4');
    expect(director.title).toContain('기억');
    expect(director.intent).toContain("player's actual route");
  });
});

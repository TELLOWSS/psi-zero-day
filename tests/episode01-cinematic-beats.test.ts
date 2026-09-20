import { describe, expect, it } from 'vitest';
import { episodeCinematicBeat } from '../src/app/episode-cinematic-beats';

describe('Episode 01 cinematic beat map',()=>{
  it('moves the opening field drama through distinct time and space beats',()=>{
    const ids=['e01_03_plan_breaks','e01_04_junho_signal','e01_05_command','e01_06_pump_arrival','e01_07_first_pour'];
    const beats=ids.map(id=>episodeCinematicBeat(id));
    expect(beats.every(Boolean)).toBe(true);
    expect(new Set(beats.map(beat=>beat!.zone)).size).toBeGreaterThanOrEqual(4);
    expect(beats.map(beat=>beat!.time)).toEqual(['07:10','08:05','09:10','09:24','09:45']);
  });

  it('carries authored time-and-place stamps through the record-pressure closing arc',()=>{
    expect(episodeCinematicBeat('e01_08o_record_pressure')).toMatchObject({ time:'16:42', zone:'SITE OFFICE', tone:'decision' });
    expect(episodeCinematicBeat('e01_08p_record_return')).toMatchObject({ time:'17:08', zone:'REPORT', tone:'consequence' });
  });
});

import { describe, expect, it } from 'vitest';
import { episodeCinematicBeat } from '../src/app/episode-cinematic-beats';

describe('Episode 01 cinematic beat map',()=>{
  it('moves the opening field drama through distinct time and space beats',()=>{
    const ids=['e01_03_plan_breaks','e01_04_junho_signal','e01_05_command','e01_06_pump_arrival','e01_07_first_pour'];
    const beats=ids.map(id=>episodeCinematicBeat(id));
    expect(beats.every(Boolean)).toBe(true);
    expect(new Set(beats.map(beat=>beat!.zone)).size).toBeGreaterThanOrEqual(4);
    expect(beats.map(beat=>beat!.time)).toEqual(['07:18','07:21','07:27','07:36','07:48']);
  });

  it('keeps unrelated later consequence events free of forced transition stamps',()=>{
    expect(episodeCinematicBeat('e01_08o_record_pressure')).toBeUndefined();
  });
});

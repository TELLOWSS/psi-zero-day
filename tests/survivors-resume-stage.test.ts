import { describe, expect, it } from 'vitest';
import { resumePatrolStage,nextPreparedPatrolStage } from '../src/app/survivors-save';

describe('last played patrol stage', () => {
  it('prepares the next operation after a clear and recovers legacy saves without a last stage',()=>{
    expect(resumePatrolStage('stage_28',['stage_01','stage_28'],{stage_28:[true,false,false]})).toBe('stage_29');
    expect(resumePatrolStage(null,[],{stage_28:[true,false,false]})).toBe('stage_29');
    expect(resumePatrolStage('stage_14',['stage_14'],{stage_28:[true,false,false]})).toBe('stage_14');
    expect(resumePatrolStage('stage_28',['stage_28'],{stage_28:[false,true,true]})).toBe('stage_28');
    expect(nextPreparedPatrolStage('stage_50')).toBe('stage_50');
    expect(resumePatrolStage('stage_50',['stage_50'],{stage_50:[true,true,true]})).toBe('stage_50');
  });
  it('restores an unlocked operation rather than restarting at stage one', () => {
    expect(resumePatrolStage('stage_14', ['stage_01', 'stage_14'], {})).toBe('stage_14');
  });
  it('recognizes stages unlocked by a previous clear', () => {
    expect(resumePatrolStage('stage_02', [], { stage_01: [true, false, false] })).toBe('stage_02');
  });
  it.each([null, '', 'stage_99', 'stage_14', {}, 14])('rejects invalid or locked saved stage %s', stage => {
    expect(resumePatrolStage(stage, ['stage_01'], {})).toBe('stage_01');
  });
});

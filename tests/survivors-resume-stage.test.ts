import { describe, expect, it } from 'vitest';
import { resumePatrolStage } from '../src/app/survivors-save';

describe('last played patrol stage', () => {
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

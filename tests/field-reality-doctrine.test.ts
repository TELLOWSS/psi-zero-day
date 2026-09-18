import { describe, expect, it } from 'vitest';
import { FIELD_REALITY_DOCTRINE, FIELD_REALITY_DOCTRINE_ID } from '../src/app/gameplay-doctrine';

describe('Field Reality Doctrine',()=> {
  it('is an absolute project rule with a stable ID',()=> {
    expect(FIELD_REALITY_DOCTRINE.id).toBe(FIELD_REALITY_DOCTRINE_ID);
    expect(FIELD_REALITY_DOCTRINE.absolute).toBe(true);
  });

  it('locks safety floor and listen-before-judgment requirements',()=> {
    const ids=FIELD_REALITY_DOCTRINE.rules.map(rule=>rule.id);
    expect(ids).toContain('safety_floor');
    expect(ids).toContain('listen_before_judgment');
    expect(ids).toContain('practice_is_evidence_not_exemption');
    expect(ids).toContain('no_frictionless_correct_answer');
    expect(ids).toContain('difficulty_from_reality');
  });

  it('states the core lesson explicitly',()=> {
    expect(FIELD_REALITY_DOCTRINE.statement).toContain('정답을 아는 것');
    expect(FIELD_REALITY_DOCTRINE.statement).toContain('현장에서 정답이 작동');
  });
});

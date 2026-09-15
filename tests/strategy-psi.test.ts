import { describe, expect, it } from 'vitest';
import { PSI_INDICATORS } from '../src/app/product-contract';
import { psiCuesForChoice, psiIndicatorTextId } from '../src/app/strategy-psi';

describe('strategy PSI cues', () => {
  it('connects representative field choices to the intended PSI behaviors', () => {
    expect(psiCuesForChoice('follow_junho')).toEqual(['risk_awareness', 'communication_reporting']);
    expect(psiCuesForChoice('tbm_change_control')).toEqual(['training_comprehension', 'practice_participation', 'ppe_rule_compliance']);
    expect(psiCuesForChoice('stopwork_protect_process')).toContain('stop_work_acceptance');
  });

  it('covers all six canonical PSI indicators across Episode 01 field behavior', () => {
    const covered = new Set([
      ...psiCuesForChoice('follow_junho'),
      ...psiCuesForChoice('tbm_change_control'),
      ...psiCuesForChoice('stopwork_protect_process'),
      ...psiCuesForChoice('restart_verify_controls'),
    ]);
    expect([...covered].sort()).toEqual(PSI_INDICATORS.map(item => item.id).slice().sort());
  });

  it('uses stable localization ids and does not invent numeric PSI effects', () => {
    expect(psiIndicatorTextId('communication_reporting')).toBe('ui.psi.indicator.communication_reporting');
    expect(psiCuesForChoice('unknown-choice')).toEqual([]);
  });
});

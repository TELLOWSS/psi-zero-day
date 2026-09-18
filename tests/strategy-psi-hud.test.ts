import { describe, expect, it } from 'vitest';
import { projectPsiObservations } from '../src/app/strategy-psi';

describe('PSI 6 observation HUD projection', () => {
  it('counts only authored PSI cues from actual choices', () => {
    const projected = projectPsiObservations([
      'listen_more',
      'tbm_change_control',
      'restart_verify_controls',
    ]);
    expect(projected.observed_choice_count).toBe(3);
    expect(projected.counts.risk_awareness).toBe(2);
    expect(projected.counts.training_comprehension).toBe(1);
    expect(projected.counts.practice_participation).toBe(1);
    expect(projected.counts.ppe_rule_compliance).toBe(2);
    expect(projected.counts.communication_reporting).toBe(2);
    expect(projected.counts.stop_work_acceptance).toBe(1);
    expect(projected.max_count).toBe(2);
  });

  it('keeps unknown choices neutral instead of inventing PSI evidence', () => {
    const projected = projectPsiObservations(['unknown_choice']);
    expect(Object.values(projected.counts).every(value => value === 0)).toBe(true);
    expect(projected.observed_choice_count).toBe(1);
    expect(projected.max_count).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import policy from '../content/defense/impact-presentation-policy.json';
import { defenseCameraScale } from '../src/ui/useDefenseCamera';

describe('M-02 impact presentation policy', () => {
  it('keeps impact short and stronger in landscape than portrait', () => {
    expect(policy.camera.impactHoldMs).toBeLessThanOrEqual(180);
    expect(policy.camera.recoverEndMs).toBeLessThanOrEqual(650);
    expect(defenseCameraScale('IMPACT_CLOSE_UP', false)).toBe(policy.camera.landscapeImpactScale);
    expect(defenseCameraScale('IMPACT_CLOSE_UP', true)).toBe(policy.camera.portraitImpactScale);
    expect(policy.camera.portraitShakeMultiplier).toBeLessThan(1);
  });

  it('uses construction intervention language rather than fantasy attack language', () => {
    expect(policy.principle).toContain('braking');
    expect(policy.principle).toContain('route control');
    expect(policy.fx.CONTROL_INTERVENTION).toContain('traffic-control barrier line');
    expect(policy.fx.RESOLVE).toContain('no fantasy explosion');
  });
});

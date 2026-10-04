import { describe, expect, it } from 'vitest';
import type { ProjectileFeedback } from '../src/domain/survivors-projectile-feedback';
import { productionPulseSpec } from '../src/ui/survivors-webgl-fx';

const base: ProjectileFeedback = {
  projectileId: 'p',
  kind: 'radio',
  phase: 'impact',
  x: 10,
  y: 20,
  angle: 0,
  radius: 6,
};

describe('graphics vertical slice production pulse contract', () => {
  it('makes premium optical contact materially stronger than the base item', () => {
    const normal = productionPulseSpec(base, [])!;
    const premium = productionPulseSpec(base, ['broadcast_crown'])!;
    expect(premium.size).toBeGreaterThan(normal.size);
    expect(premium.alpha).toBeGreaterThan(normal.alpha);
  });

  it('marks impacts for the GPU burst ring but keeps launches directional', () => {
    expect(productionPulseSpec(base, [])?.ring).toBe(true);
    expect(productionPulseSpec({ ...base, phase: 'launch' }, [])?.ring).toBe(false);
  });

  it('never dramatizes a worker confirmation as a combat hit', () => {
    expect(productionPulseSpec({ ...base, worker: true }, ['broadcast_crown'])).toBeNull();
  });

  it('keeps non-emissive powder and barricade contacts out of the WebGL bloom layer', () => {
    expect(productionPulseSpec({ ...base, kind: 'extinguisher' }, [])).toBeNull();
    expect(productionPulseSpec({ ...base, kind: 'cone_trap' }, [])).toBeNull();
  });
});

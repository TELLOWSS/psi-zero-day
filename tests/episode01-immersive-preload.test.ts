import { describe, expect, it } from 'vitest';
import { episode01ImmersivePreloadAssetIds } from '../src/app/episode01-immersive-preload';

describe('Episode 01 immersive background preload plan', () => {
  it('warms the active environment and the next two distinct surfaces', () => {
    expect(episode01ImmersivePreloadAssetIds('e01_01_arrival')).toEqual([
      'ep01.scene_bg.gate_dawn',
      'ep01.scene_bg.ramp_entry',
      'ep01.scene_bg.work_yard',
    ]);
  });

  it('skips repeated event backgrounds instead of wasting preload slots', () => {
    expect(episode01ImmersivePreloadAssetIds('e01_08c_site_pushback')).toEqual([
      'ep01.scene_bg.inspection_zone',
      'ep01.scene_bg.site_office',
      'ep01.scene_bg.work_yard',
    ]);
  });

  it('keeps the final reflective beat ready for the next-day gate return', () => {
    expect(episode01ImmersivePreloadAssetIds('e01_09_evening')).toEqual([
      'ep01.scene_bg.home_night',
      'ep01.scene_bg.gate_dawn',
    ]);
  });

  it('can limit warming to the current surface only', () => {
    expect(episode01ImmersivePreloadAssetIds('e01_06_pump_arrival', 0)).toEqual([
      'ep01.scene_bg.concrete_pour',
    ]);
  });

  it('returns no preload work for an unknown event', () => {
    expect(episode01ImmersivePreloadAssetIds('e01_missing')).toEqual([]);
  });
});

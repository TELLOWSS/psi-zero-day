import { describe, expect, it } from 'vitest';
import baseline from '../content/episode01/character-replacement-baseline.json';
import plan from '../content/episode01/character-replacement-plan.json';
import batchA from '../content/episode01/production-art-batch-a.json';

const cast=['player','lim_junho','lee_jaehoon','seo_jeongmin'] as const;

describe('character replacement binary contract',()=>{
  it('tracks exactly eight legacy portrait/map fingerprints for the four title characters',()=>{
    expect(baseline.characters).toEqual(cast);
    expect(baseline.assets).toHaveLength(8);
    expect(new Set(baseline.assets.map(asset=>asset.id))).toEqual(new Set([
      'player-portrait','player-map',
      'lim-junho-portrait','lim-junho-map',
      'lee-jaehoon-portrait','lee-jaehoon-map',
      'seo-jeongmin-portrait','seo-jeongmin-map',
    ]));
  });

  it('keeps replacement plan pending until binary replacement actually occurs',()=>{
    expect(plan.pipeline_status).toBe('ready_for_new_webp_inputs');
    expect(plan.batch.every(item=>item.state==='pipeline_ready_asset_pending')).toBe(true);
  });

  it('keeps Batch A aligned to the same four characters',()=>{
    expect(new Set(batchA.title_cast)).toEqual(new Set(cast));
  });
});

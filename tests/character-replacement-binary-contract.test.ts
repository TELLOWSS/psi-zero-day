import { describe, expect, it } from 'vitest';
import baseline from '../content/episode01/character-replacement-baseline.json';
import plan from '../content/episode01/character-replacement-plan.json';
import manifest from '../content/episode01/embedded-media/character-media.json';
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

  it('tracks all eight new candidate binaries while keeping visual lock pending',()=>{
    expect(plan.pipeline_status).toBe('final_candidates_staged_pending_visual_qa');
    expect(plan.batch.every(item=>item.state==='final_candidate_staged_pending_visual_qa')).toBe(true);
    const legacy=new Map(baseline.assets.map(asset=>[asset.id,asset.sha256]));
    const staged=manifest.assets.filter(asset=>legacy.has(asset.id));
    expect(staged).toHaveLength(8);
    expect(staged.every(asset=>asset.storage==='tracked_binary' && asset.sha256!==legacy.get(asset.id))).toBe(true);
  });

  it('keeps Batch A aligned to the same four characters',()=>{
    expect(new Set(batchA.title_cast)).toEqual(new Set(cast));
  });
});

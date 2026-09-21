import { describe, expect, it } from 'vitest';
import status from '../content/episode01/character-production-status.json';
import batches from '../content/episode01/character-production-batches.json';
import plan from '../content/episode01/character-replacement-plan.json';

const canonical=['player','lim_junho','lee_jaehoon','seo_jeongmin'];

describe('character production tracker',()=>{
  it('reports 8/8 staged binaries without claiming Production Lock before visual QA',()=>{
    expect(status.integration_status).toBe('replacement_candidate_staged');
    expect(status.replacement_a.status).toBe('visual_qa_pending');
    expect(status.replacement_a.integrated_new_assets).toBe(8);
    expect(status.rule).toMatch(/Production LOCKED/);
  });

  it('keeps the tracker and replacement plan on the same four-character campaign',()=>{
    expect(new Set(status.replacement_a.characters)).toEqual(new Set(canonical));
    expect(new Set(batches.batch_a.characters.map(character=>character.id))).toEqual(new Set(canonical));
    expect(new Set(plan.batch.map(character=>character.id))).toEqual(new Set(canonical));
  });

  it('moves the whole atomic batch to visual QA instead of generating another placeholder asset',()=>{
    expect(status.replacement_a.assets.every(asset=>asset.status==='candidate_staged')).toBe(true);
    expect(status.next_asset).toBeNull();
    expect(status.next_work).toContain('Main → Loading → MAP');
  });
});

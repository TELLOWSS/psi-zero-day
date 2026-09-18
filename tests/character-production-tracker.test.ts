import { describe, expect, it } from 'vitest';
import status from '../content/episode01/character-production-status.json';
import batches from '../content/episode01/character-production-batches.json';
import plan from '../content/episode01/character-replacement-plan.json';

const canonical=['player','lim_junho','lee_jaehoon','seo_jeongmin'];

describe('character production tracker',()=>{
  it('does not claim the title-cast refresh is integrated while binaries are pending',()=>{
    expect(status.integration_status).toBe('replacement_active');
    expect(status.replacement_a.status).toBe('awaiting_new_webp');
    expect(status.replacement_a.integrated_new_assets).toBe(0);
    expect(status.rule).toMatch(/Do not describe/);
  });

  it('keeps the tracker and replacement plan on the same four-character campaign',()=>{
    expect(new Set(status.replacement_a.characters)).toEqual(new Set(canonical));
    expect(new Set(batches.batch_a.characters.map(character=>character.id))).toEqual(new Set(canonical));
    expect(new Set(plan.batch.map(character=>character.id))).toEqual(new Set(canonical));
  });

  it('has exactly one actionable next asset',()=>{
    const next=status.replacement_a.assets.filter(asset=>asset.status==='next');
    expect(next).toHaveLength(1);
    expect(next[0]).toBeDefined();
    expect(status.next_asset).toBe(next[0]!.file);
  });
});

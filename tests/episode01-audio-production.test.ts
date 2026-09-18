import { describe, expect, it } from 'vitest';
import contract from '../content/episode01/audio-production.json';

describe('Episode 01 audio production contract',()=>{
  it('keeps exactly eight core audio slots while binaries are still pending',()=>{
    expect(contract.required_core_assets).toBe(8);
    expect(contract.assets).toHaveLength(8);
    expect(contract.final_asset_count).toBe(0);
    expect(contract.status).toBe('runtime_slots_wired_binaries_pending');
  });

  it('uses unique stable runtime asset ids and audio target paths',()=>{
    const ids=contract.assets.map(item=>item.asset_id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(id=>id.startsWith('ep01.audio.'))).toBe(true);
    expect(contract.assets.every(item=>item.target_uri.startsWith('assets/episode01/audio/'))).toBe(true);
  });

  it('does not claim final field recordings exist before their binaries are supplied',()=>{
    expect(contract.integration.current).toContain('If absent');
    expect(contract.integration.finalization).toContain('reviewed binary');
  });
});

import { describe, expect, it } from 'vitest';
import queue from '../content/episode01/visual-production-queue.json';
import catalog from '../content/episode01/scene-background-catalog.json';
import ingest from '../content/episode01/final-art-ingest-manifest.json';

describe('Episode 01 visual production queue',()=>{
  it('uses the same stable runtime IDs as the scene background catalog',()=>{
    expect(queue.production_surfaces).toHaveLength(8);
    for(const surface of queue.production_surfaces){
      const runtime=catalog.backgrounds[surface.key as keyof typeof catalog.backgrounds];
      expect(surface.asset_id).toBe(runtime.asset_id);
      expect(surface.final_path).toBe(runtime.final_path);
      expect(surface.used_by).toEqual(runtime.used_by);
    }
  });

  it('tracks one exact eight-background delivery contract without reusing the Production Map ID',()=>{
    expect(queue.final_art_batch.archive_sha256).toBe(ingest.archive.sha256);
    expect(queue.final_art_batch.required_surfaces).toBe(8);
    expect(new Set(queue.production_surfaces.map(item=>item.asset_id)).size).toBe(8);
    expect(queue.production_surfaces.some(item=>item.asset_id===queue.master_map.asset_id)).toBe(false);
  });

  it('keeps the repository state honest until the atomic binary ingest is complete',()=>{
    expect(queue.final_art_batch.status).toBe('exact_archive_verified_pending_github_binary_ingest');
    expect(ingest.status).toBe('exact_archive_verified_pending_github_binary_ingest');
    expect(queue.final_art_batch.repository_binaries_present).toBe(0);
  });
});

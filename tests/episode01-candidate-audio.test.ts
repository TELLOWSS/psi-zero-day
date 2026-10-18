import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import core from '../content/episode01/audio-production.json';
import staged from '../content/episode01/candidate-audio-production.json';
import {
  episode01CandidateScoreAsset, episode01CandidateFoleyAssets,
  EP01_CANDIDATE_ASSET_COUNT, EP01_CANDIDATE_STATUS,
} from '../src/app/episode01-candidate-audio';
import { episodeAudioDirection, episodeAudioDirectedEventIds } from '../src/app/episode01-audio-director';

describe('EP01 candidate audio application lock', () => {
  it('preserves 12 core assets and places all 17 new files in an isolated preview tier', () => {
    expect(core.assets).toHaveLength(12);
    expect(core.assets.filter(a => a.kind === 'voice')).toHaveLength(4);
    expect(staged.assets).toHaveLength(EP01_CANDIDATE_ASSET_COUNT);
    expect(staged.release).toContain('PREVIEW_ONLY');
    expect(EP01_CANDIDATE_STATUS).toContain('PREVIEW_ONLY');
    const coreIds = new Set(core.assets.map(a => a.asset_id));
    const ids = staged.assets.map(a => a.asset_id);
    expect(new Set(ids).size).toBe(17);
    for (const id of ids) {
      expect(id.startsWith('ep01.audio.candidate.')).toBe(true);
      expect(coreIds.has(id)).toBe(false);
    }
    expect(staged.assets.filter(a => a.kind === 'score_excerpt')).toHaveLength(8);
    expect(staged.assets.filter(a => a.kind === 'foley_one_shot')).toHaveLength(9);
  });

  it('matches exact committed binary files to the SHA-locked production manifest', async () => {
    for (const asset of staged.assets) {
      const bytes = await readFile(path.join(process.cwd(), 'public', asset.uri));
      expect(bytes.subarray(0,4).toString('ascii')).toBe('OggS');
      const canonical = createHash('sha1')
        .update(Buffer.from('blob ' + bytes.length + String.fromCharCode(0)))
        .update(bytes).digest('hex');
      expect(canonical,asset.asset_id).toBe(asset.git_blob_sha);
    }
  });

  it('maps each of the 26 story events to one staged score without changing story state', () => {
    const scoreIds = new Set(staged.assets.filter(a => a.kind === 'score_excerpt').map(a => a.asset_id));
    expect(episodeAudioDirectedEventIds()).toHaveLength(26);
    for (const id of episodeAudioDirectedEventIds()) {
      const direction = episodeAudioDirection(id)!;
      const score = episode01CandidateScoreAsset(direction.motif)!;
      expect(scoreIds.has(score.asset_id), id).toBe(true);
      expect(score.loop).toBe(true);
      expect(score.gain).toBeLessThanOrEqual(0.3);
    }
    expect(episode01CandidateScoreAsset(undefined)).toBeUndefined();
  });

  it('uses all nine proposed Foley and avoids duplicate radio sources', () => {
    const used = new Set<string>();
    for (const id of episodeAudioDirectedEventIds()) {
      for (const cue of episode01CandidateFoleyAssets(id)) {
        used.add(cue.asset_id);
        expect(cue.gain).toBeLessThan(0.3);
        expect(cue.fallback).toBe('scene_shift');
      }
    }
    expect(used.size).toBe(9);
    expect([...used].every(id => staged.assets.some(a => a.asset_id===id))).toBe(true);
    expect(episode01CandidateFoleyAssets('e01_04_junho_signal')).toMatchObject([
      {asset_id:'ep01.audio.candidate.radio_ptt_detail'}
    ]);
    expect(episode01CandidateFoleyAssets('e01_08c_site_pushback')).toMatchObject([
      {asset_id:'ep01.audio.candidate.zero_moment_air_cut'}
    ]);
    expect(episode01CandidateFoleyAssets('e01_09_evening')).toMatchObject([
      {asset_id:'ep01.audio.candidate.home_key_door'}
    ]);
    expect(episode01CandidateFoleyAssets('unknown')).toEqual([]);
  });
});

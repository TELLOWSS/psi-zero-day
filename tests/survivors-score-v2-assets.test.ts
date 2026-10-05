import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {expect,it} from 'vitest';
import ingest from '../content/survivors-score-v2-ingest.json';
import {SURVIVORS_SCORE_CANDIDATES,DIRECTOR_SHOUT_VOICE} from '../src/app/survivors-audio-manifest';
it('registers nine source-backed recordings with verified derived binaries',()=>{
 expect(ingest).toHaveLength(9);expect(SURVIVORS_SCORE_CANDIDATES).toHaveLength(9);
 for(const entry of ingest){
  const data=readFileSync('public'+entry.uri);
  expect(createHash('sha256').update(data).digest('hex')).toBe(entry.sha256);
  expect(data.subarray(0,4).toString()).toBe('OggS');
  expect(entry.start+entry.length).toBeLessThanOrEqual(entry.duration+.001);
  expect(entry.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
 }
 expect(ingest.filter(a=>!['ready','foundation','pressure','heavy_risk'].includes(a.id)).every(a=>a.length<=4)).toBe(true);
 expect(SURVIVORS_SCORE_CANDIDATES.filter(a=>a.loop)).toHaveLength(4);
 expect(DIRECTOR_SHOUT_VOICE.uri).toBe('/assets/survivors/director-shout-voice-v1.mp3');
});

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import artIngest from '../content/defense/def-hd01-art-ingest.json';
import { defenseBoardArtUri } from '../src/app/defense-visual-assets';
import { zeroBreachContent } from '../src/content/defense';

describe('DEF-HD01 HD board runtime ingest', () => {
  it('selects the ingested HD construction-site world for ramp-01', () => {
    expect(artIngest.acceptanceState.assetBytesInRepository).toBe('PASS');
    expect(artIngest.backgroundCandidate.runtimeUri).toBe('assets/defense/board/ramp-01-hd01.webp');
    expect(defenseBoardArtUri('ramp-01')).toBe('assets/defense/board/ramp-01-hd01.webp');
  });

  it('keeps the ingested WebP bytes identical to the locked candidate', () => {
    const file = path.resolve('public', artIngest.backgroundCandidate.runtimeUri);
    const bytes = fs.readFileSync(file);
    expect(bytes.length).toBe(artIngest.backgroundCandidate.productionSizeBytes);
    expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP');
    expect(crypto.createHash('sha256').update(bytes).digest('hex'))
      .toBe(artIngest.backgroundCandidate.productionSha256);
  });

  it('leaves the locked DefenseGame topology untouched', () => {
    expect(zeroBreachContent.map.width).toBe(1000);
    expect(zeroBreachContent.map.height).toBe(600);
    expect(zeroBreachContent.map.path).toEqual([
      [0,300],[180,300],[180,150],[450,150],[450,450],[720,450],[720,240],[1000,240],
    ]);
    expect(zeroBreachContent.map.pads.map(pad => pad.id)).toEqual(['P1','P2','P3','P4','P5','P6','P7','P8']);
  });
});

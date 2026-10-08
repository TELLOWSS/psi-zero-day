import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import contract from '../content/branding/production-slots-v1.json';
import { TITLE_CAST_IDS } from '../src/app/title-cast';

describe('brand production slot audit contract', () => {
  it('records existing slots without granting final approval', () => {
    expect(contract.scope).toBe('B2_EXISTING_SLOT_AUDIT_ONLY');
    expect(contract.finalApproval).toBe('NOT_GRANTED_BY_THIS_CONTRACT');
    expect(contract.baselineCommit).toMatch(/^[a-f0-9]{40}$/);
    expect(new Set(contract.slots.map(slot => slot.id)).size).toBe(contract.slots.length);
    expect(new Set(contract.slots.map(slot => slot.selector)).size).toBe(contract.slots.length);
  });

  it('uses existing local delivery files and source references', () => {
    for (const slot of contract.slots) {
      expect(slot.uri).toMatch(/^\/[a-zA-Z0-9/.-]+\.webp$/);
      expect(slot.uri).not.toContain('..');
      expect(existsSync(resolve('public', slot.uri.slice(1)))).toBe(true);
      expect(existsSync(slot.source)).toBe(true);
      expect(slot.width).toBeGreaterThan(0);
      expect(slot.height).toBeGreaterThan(0);
      expect(['contain', 'cover']).toContain(slot.fit);
    }
  });

  it('keeps the exact approved title cast identity set', () => {
    const cast = contract.slots.filter(slot => slot.id.startsWith('cast-')).map(slot =>
      slot.selector.match(/data-character="([a-z_]+)"/)?.[1]);
    expect(cast.sort()).toEqual([...TITLE_CAST_IDS].sort());
  });

  it('does not pretend existing text or empty favicon are approved binaries', () => {
    expect(contract.nonBinarySlots).toEqual([
      expect.objectContaining({ id: 'wordmark', currentType: 'LIVE_TEXT', finalCandidate: 'SEPARATE_DIRECTOR_FILE_APPROVAL_REQUIRED' }),
      expect.objectContaining({ id: 'browser-icon', currentUri: 'data:,', finalCandidate: 'SEPARATE_DIRECTOR_FILE_APPROVAL_REQUIRED' }),
    ]);
    expect(readFileSync('index.html', 'utf8')).toContain('rel="icon" href="data:,"');
  });

  it('preserves the portrait candidate bytes and dimensions outside runtime', () => {
    const record = JSON.parse(readFileSync('docs/branding/candidates/BR-ART-01-player-portrait-r1.json', 'utf8'));
    const bytes = readFileSync(record.file);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(record.sha256);
    expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(bytes.readUInt32BE(16)).toBe(record.width);
    expect(bytes.readUInt32BE(20)).toBe(record.height);
    expect(record.runtimeConnected).toBe(false);
    expect(record.directorFileApproval).toBe(false);
    expect(record.currentTitleSlotAssessment).toBe('HOLD_FACE_CLIPPED_IN_LANDSCAPE_AND_UI_OCCLUSION_IN_PORTRAIT');
    expect(record.file).toMatch(/^docs\/branding\/candidates\//);
    expect(readFileSync('src/ui/GameHub.tsx', 'utf8')).not.toContain('BR-ART-01-player-portrait-r1');
  });
});

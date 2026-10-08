import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import contract from '../content/branding/production-slots-v1.json';
import { TITLE_CAST_IDS } from '../src/app/title-cast';

describe('brand production slot audit contract', () => {
  it('records existing slots without granting final approval', () => {
    expect(contract.scope).toBe('B2_EXISTING_AND_EXPLICITLY_APPROVED_SLOT_AUDIT_ONLY');
    expect(contract.finalApproval).toBe('NOT_GRANTED_BY_THIS_CONTRACT');
    expect(contract.baselineCommit).toMatch(/^[a-f0-9]{40}$/);
    expect(new Set(contract.slots.map(slot => slot.id)).size).toBe(contract.slots.length);
    expect(new Set(contract.slots.map(slot => slot.selector)).size).toBe(contract.slots.length);
  });

  it('uses existing local delivery files and source references', () => {
    for (const slot of contract.slots) {
      expect(slot.uri).toMatch(/^\/[a-zA-Z0-9/.-]+\.webp$/);
      expect(slot.uri).not.toContain('..');
      const delivery = resolve('public', slot.uri.slice(1));
      if ('generatedSourcePrefix' in slot && slot.generatedSourcePrefix) {
        const parts = readdirSync('content/mode-previews').filter(name => name.startsWith(`${slot.generatedSourcePrefix}.b64.`)).sort();
        expect(parts.length).toBeGreaterThan(0);
        const binary = Buffer.from(parts.map(name => readFileSync(resolve('content/mode-previews', name), 'utf8')).join(''), 'base64');
        expect(binary.length).toBeGreaterThan(5000);
        expect(binary.subarray(0, 4).toString()).toBe('RIFF');
        expect(binary.subarray(8, 12).toString()).toBe('WEBP');
        expect(existsSync(slot.materializer!)).toBe(true);
        if (existsSync(delivery)) expect(readFileSync(delivery)).toEqual(binary);
      } else {
        expect(existsSync(delivery)).toBe(true);
      }
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

  it('connects only the exact files explicitly approved by the Director', () => {
    expect(contract.nonBinarySlots).toEqual([]);
    const approval = JSON.parse(readFileSync(contract.approvedBrandFiles, 'utf8'));
    expect(approval.decision).toBe('DESIGN_AND_FILES_APPROVED_APPLY_AFTER_VERIFICATION');
    expect(approval.userAnswer).toBe('디자인·파일 승인, 검증 후 운영 적용');
    expect(approval.otherArtApproval).toBe(false);
    expect(approval.trademarkClearance).toBe('NOT_CONFIRMED');
    expect(approval.approvedRuntimeFiles).toHaveLength(4);
    for (const file of approval.approvedRuntimeFiles) {
      const delivery = readFileSync(resolve('public', file.uri.slice(1)));
      expect(delivery).toEqual(readFileSync(file.source));
      expect(createHash('sha256').update(delivery).digest('hex')).toBe(file.sha256);
      expect(readFileSync(file.id.startsWith('symbol') ? 'index.html' : 'src/ui/GameHub.tsx', 'utf8')).toContain(file.uri);
    }
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

  it('keeps the incomplete wordmark delivery explicitly on hold outside runtime', () => {
    const record = JSON.parse(readFileSync('docs/branding/candidates/BR-LOGO-01-wordmark-r1.json', 'utf8'));
    expect(record.status).toBe('HOLD_NOT_PRODUCTION_ELIGIBLE');
    expect(record.runtimeConnected).toBe(false);
    expect(record.directorFileApproval).toBe(false);
    expect(record.file).toMatch(/^docs\/branding\/candidates\//);
    expect(createHash('sha256').update(readFileSync(record.file)).digest('hex')).toBe(record.sha256);
    expect(record.missingDeliverables).toContain('editable vector');
    expect(record.missingDeliverables).toContain('transparent delivery');
    expect(readFileSync('src/ui/GameHub.tsx', 'utf8')).not.toContain(record.id);
    expect(readFileSync('index.html', 'utf8')).not.toContain(record.id);
  });

  it('preserves the pre-approval vector and raster generation record without changing original bytes', () => {
    const record = JSON.parse(readFileSync('docs/branding/candidates/BR-LOGO-02.json', 'utf8'));
    expect(record.status).toBe('CANDIDATE_REQUIRES_DIRECTOR_FILE_REVIEW');
    expect(record.runtimeConnected).toBe(false);
    expect(record.directorFileApproval).toBe(false);
    expect(record.files).toHaveLength(6);
    const font = readFileSync(record.font.file);
    expect(createHash('sha256').update(font).digest('hex')).toBe(record.font.sha256);
    expect(readFileSync(record.font.license, 'utf8')).toBe(readFileSync('public/fonts/ChakraPetch-OFL.txt', 'utf8'));
    for (const file of record.files) {
      for (const [name, checksum] of [[file.svg, file.svgSha256], [file.png, file.pngSha256], [file.source, file.sourceSha256]]) {
        expect(name).toMatch(/^docs\/branding\/candidates\//);
        expect(createHash('sha256').update(readFileSync(name)).digest('hex')).toBe(checksum);
      }
      const svg = readFileSync(file.svg, 'utf8');
      expect(svg).not.toContain('FONT_DATA');
      expect(svg).not.toContain('href=');
      if (file.kind.startsWith('wordmark')) {
        expect(svg).toContain(`data:font/ttf;base64,${font.toString('base64')}`);
        expect(svg).toContain('>NEW PSI</text>');
        expect(svg).toContain('>: ZERO DAY</text>');
      }
      const png = readFileSync(file.png);
      expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(png.readUInt32BE(16)).toBe(file.kind === 'wordmark' ? 920 : file.kind === 'wordmark-wide' ? 840 : 192);
      expect(png.readUInt32BE(20)).toBe(file.kind === 'wordmark' ? 288 : file.kind === 'wordmark-wide' ? 144 : 192);
    }
    expect(contract.approvedBrandFiles).toBe('docs/branding/candidates/BR-LOGO-02-APPROVAL.json');
  });
});

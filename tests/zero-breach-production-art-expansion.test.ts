import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { defenseVisualProduction, defenseEnemyArtUri, defenseTowerArtUri } from '../src/app/defense-visual-assets';

const TOWERS = ['PULSE','BURST','CONTROL','SENSOR'] as const;
const LEVELS = ['L1','L2','L3A','L3B'] as const;
const ENEMIES = ['NORMAL','SWIFT','ARMORED','SWARM','VEILED','BOSS'] as const;

function readAsset(uri: string): string {
  return fs.readFileSync(path.resolve('public', uri), 'utf8');
}

describe('ZERO BREACH step 5 production lock', () => {
  it('covers all 16 tower states and all 6 risk silhouettes without fallback gaps', () => {
    const towerUris = TOWERS.flatMap(tower => LEVELS.map(level => defenseTowerArtUri(tower, level)));
    const enemyUris = ENEMIES.map(enemy => defenseEnemyArtUri(enemy));

    expect(towerUris).toHaveLength(16);
    expect(enemyUris).toHaveLength(6);
    expect(towerUris.every(Boolean)).toBe(true);
    expect(enemyUris.every(Boolean)).toBe(true);
    expect(new Set(towerUris).size).toBe(16);
    expect(new Set(enemyUris).size).toBe(6);
  });

  it('keeps authored asset contracts consistent with the locked baseline', () => {
    const towerAssets = defenseVisualProduction.assets.filter(asset => asset.kind === 'TOWER');
    const enemyAssets = defenseVisualProduction.assets.filter(asset => asset.kind === 'ENEMY');

    expect(towerAssets).toHaveLength(16);
    expect(enemyAssets).toHaveLength(6);

    for (const asset of towerAssets) {
      expect(asset.width).toBe(256);
      expect(asset.height).toBe(256);
      expect(asset.transparent).toBe(true);
      expect(asset.anchor).toEqual({ x: 0.5, y: 0.76 });
      expect(asset.safeArea).toBe(192);
      const svg = readAsset(asset.uri);
      expect(svg).toContain('width="256" height="256" viewBox="0 0 256 256"');
      expect(svg).not.toMatch(/<text\b/i);
      expect(svg.match(/<(path|circle|ellipse|polygon|rect)\b/g)?.length ?? 0).toBeGreaterThanOrEqual(8);
    }

    for (const asset of enemyAssets) {
      const expected = asset.assetId.endsWith('.BOSS') ? 256 : 128;
      expect(asset.width).toBe(expected);
      expect(asset.height).toBe(expected);
      expect(asset.transparent).toBe(true);
      expect(asset.anchor).toEqual({ x: 0.5, y: 0.76 });
      const svg = readAsset(asset.uri);
      expect(svg).toContain(`width="${expected}" height="${expected}" viewBox="0 0 ${expected} ${expected}"`);
      expect(svg).not.toMatch(/<text\b/i);
      expect(svg.match(/<(path|circle|ellipse|polygon|rect)\b/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
    }
  });

  it('keeps every family and branch visually non-identical at the source level', () => {
    const towerSource = new Map<string, string>();
    for (const tower of TOWERS) {
      for (const level of LEVELS) {
        const uri = defenseTowerArtUri(tower, level);
        if (!uri) throw new Error(`missing ${tower} ${level}`);
        towerSource.set(`${tower}:${level}`, readAsset(uri).replace(/aria-label="[^"]+"/g, ''));
      }
    }

    expect(new Set(towerSource.values()).size).toBe(16);
    for (const tower of TOWERS) {
      expect(towerSource.get(`${tower}:L3A`)).not.toBe(towerSource.get(`${tower}:L3B`));
    }

    const enemySource = ENEMIES.map(enemy => {
      const uri = defenseEnemyArtUri(enemy);
      if (!uri) throw new Error(`missing ${enemy}`);
      return readAsset(uri).replace(/aria-label="[^"]+"/g, '');
    });
    expect(new Set(enemySource).size).toBe(6);
  });

  it('preserves the original three baseline anchors and locks every expansion asset', () => {
    const locked = defenseVisualProduction.assets
      .filter(asset => asset.status === 'BASELINE_LOCKED')
      .map(asset => asset.assetId);

    expect(locked).toEqual([
      'defense.board.ramp-01',
      'defense.tower.PULSE.L1',
      'defense.enemy.NORMAL',
    ]);
    const productionLocked = defenseVisualProduction.assets.filter(asset => asset.status === 'PRODUCTION_LOCKED');
    expect(productionLocked).toHaveLength(20);
    const manifestSource = fs.readFileSync('content/defense/visual-production.json', 'utf8');
    expect(manifestSource).not.toContain('"EXPANSION_CANDIDATE"');
    expect(defenseVisualProduction.assets).toHaveLength(23);
    expect(defenseVisualProduction.status).toBe('PRODUCTION_LOCKED');
    expect(defenseVisualProduction.visualVersion).toBe('zero-breach-production-lock-1.0.0');
  });
});

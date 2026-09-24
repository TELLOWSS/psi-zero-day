import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import benchmark from '../content/defense/def-hd01-pq-benchmark.json';
import { defenseEnemyArtUri, defenseTowerArtUri } from '../src/app/defense-visual-assets';
import { zeroBreachContent } from '../src/content/defense';

describe('DEF-HD01-PQ representative benchmark contract', () => {
  it('keeps the benchmark limited to CONTROL, SWIFT and their intervention FX', () => {
    expect(benchmark.benchmark.response.id).toBe('CONTROL');
    expect(benchmark.benchmark.risk.id).toBe('SWIFT');
    expect(benchmark.benchmark.fx.id).toBe('CONTROL_SWIFT_INTERVENTION');
  });

  it('preserves the locked DefenseGame topology and balance while PQ art is produced', () => {
    expect(zeroBreachContent.map.width).toBe(1000);
    expect(zeroBreachContent.map.height).toBe(600);
    expect(zeroBreachContent.map.pads).toHaveLength(8);
    expect(zeroBreachContent.waves).toHaveLength(10);
    expect(benchmark.runtimeGate.noGameplayCoordinateChange).toBe(true);
    expect(benchmark.runtimeGate.noBalanceChange).toBe(true);
  });

  it('does not promote missing PQ binaries or placeholders into runtime', () => {
    const controlCandidate = path.resolve('public', benchmark.benchmark.response.productionAsset);
    const swiftCandidate = path.resolve('public', benchmark.benchmark.risk.productionAsset);
    expect(fs.existsSync(controlCandidate)).toBe(false);
    expect(fs.existsSync(swiftCandidate)).toBe(false);
    expect(benchmark.runtimeGate.currentLegacyAssetsRemainActive).toBe(true);
    expect(benchmark.runtimeGate.noPlaceholderPromotion).toBe(true);
    expect(defenseTowerArtUri('CONTROL', 'L1')).toBe(benchmark.benchmark.response.legacyAsset);
    expect(defenseEnemyArtUri('SWIFT')).toBe(benchmark.benchmark.risk.legacyAsset);
  });

  it('requires grounded construction-safety semantics instead of sci-fi combat language', () => {
    expect(benchmark.benchmark.response.semantic).toContain('traffic marshal');
    expect(benchmark.benchmark.risk.semantic).toContain('reversing construction vehicle');
    expect(benchmark.benchmark.response.forbidden).toContain('sci-fi arch');
    expect(benchmark.benchmark.risk.forbidden).toContain('monster');
    expect(benchmark.benchmark.fx.forbidden).toContain('explosion');
  });
});

import fs from 'node:fs';
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

  it('does not promote candidate PQ art until the explicit runtime approval gate passes', () => {
    expect(benchmark.runtimePromotion.approved).toBe(false);
    expect(benchmark.runtimePromotion.approvedAssets.control).toBeNull();
    expect(benchmark.runtimePromotion.approvedAssets.swift).toBeNull();
    expect(benchmark.runtimeGate.currentLegacyAssetsRemainActive).toBe(true);
    expect(benchmark.runtimeGate.noPlaceholderPromotion).toBe(true);
    expect(defenseTowerArtUri('CONTROL', 'L1')).toBe(benchmark.benchmark.response.legacyAsset);
    expect(defenseEnemyArtUri('SWIFT')).toBe(benchmark.benchmark.risk.legacyAsset);
  });

  it('renders CONTROL and SWIFT with safety-intervention semantics instead of generic attack-only FX', () => {
    const ui = fs.readFileSync('src/ui/DefenseGame.tsx', 'utf8');
    const css = fs.readFileSync('src/ui/defense-game.css', 'utf8');
    expect(ui).toContain("tower.towerId !== 'CONTROL'");
    expect(ui).toContain('zb-control-intervention');
    expect(ui).toContain("enemy.enemyId === 'SWIFT'");
    expect(ui).toContain('zb-swift-brake-cue');
    expect(css).toContain('.zb-control-intervention');
    expect(css).toContain('.zb-swift-brake-cue');
  });

  it('requires grounded construction-safety semantics instead of sci-fi combat language', () => {
    expect(benchmark.benchmark.response.semantic).toContain('traffic marshal');
    expect(benchmark.benchmark.risk.semantic).toContain('reversing construction vehicle');
    expect(benchmark.benchmark.response.forbidden).toContain('sci-fi arch');
    expect(benchmark.benchmark.risk.forbidden).toContain('monster');
    expect(benchmark.benchmark.fx.forbidden).toContain('explosion');
  });
});

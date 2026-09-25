import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import benchmark from '../content/defense/def-hd01-pq-benchmark.json';
import { defenseControlPqComposite, defenseEnemyArtUri, defenseSwiftPqAsset, defenseTowerArtUri } from '../src/app/defense-visual-assets';
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

  it('allows exactly one valid G2 runtime state: preview or production lock', () => {
    const previewState =
      benchmark.runtimePromotion.previewCandidateOnGateBranch === true
      && benchmark.runtimePromotion.approved === false;
    const lockedState =
      benchmark.runtimePromotion.previewCandidateOnGateBranch === false
      && benchmark.runtimePromotion.approved === true;

    expect(previewState || lockedState).toBe(true);
    expect(previewState && lockedState).toBe(false);
    expect(benchmark.runtimeGate.noPlaceholderPromotion).toBe(true);

    if (previewState) {
      expect(benchmark.runtimePromotion.approvedAssets.control).toBeNull();
      expect(benchmark.runtimePromotion.approvedAssets.swift).toBeNull();
    } else {
      expect(benchmark.runtimePromotion.status).toBe('CONTROL_PRODUCTION_LOCKED_SWIFT_REWORK_REQUIRED');
      expect(benchmark.runtimePromotion.approvedAssets.control).toBeTruthy();
      expect(benchmark.runtimePromotion.approvedAssets.swift).toBeNull();
      expect(benchmark.runtimePromotion.controlApproved).toBe(true);
      expect(benchmark.runtimePromotion.swiftApproved).toBe(false);
    }

    expect(defenseControlPqComposite()).toEqual({
      marshalUri: 'assets/episode01/characters/choi-minseok-map.webp',
      barrierUri: 'assets/episode01/scene-elements/access-barrier.webp',
    });
    expect(defenseSwiftPqAsset()).toBeNull();
    expect(benchmark.benchmark.risk.target.kind).toBe('LEGACY_SVG_REFERENCE');
    expect(benchmark.manualReview.swift.assessment).toBe('REJECT_AS_FINAL');

    // Legacy assets remain available as rollback in either valid runtime state.
    expect(defenseTowerArtUri('CONTROL', 'L1')).toBe(benchmark.benchmark.response.legacyAsset);
    expect(defenseEnemyArtUri('SWIFT')).toBe(benchmark.benchmark.risk.legacyAsset);
  });

  it('guards final G2 promotion behind fresh schema-v2 browser evidence', () => {
    const promotionScript = fs.readFileSync('scripts/promote-def-hd01-pq.mjs', 'utf8');
    expect(promotionScript).toContain("report.schema_version !== 2");
    expect(promotionScript).toContain("report.pq?.swiftAsset !== 'assets/defense/enemies/swift-pq01.svg'");
    expect(promotionScript).toContain('report.pq?.controlCount !== 1');
    expect(promotionScript).toContain("git', ['merge-base', '--is-ancestor'");
    expect(promotionScript).toContain("benchmark.runtimePromotion.previewCandidateOnGateBranch = false");
    expect(promotionScript).toContain("benchmark.runtimePromotion.approved = true");
  });

  it('renders CONTROL and SWIFT with safety-intervention semantics instead of generic attack-only FX', () => {
    const ui = fs.readFileSync('src/ui/DefenseGame.tsx', 'utf8');
    const css = fs.readFileSync('src/ui/defense-game.css', 'utf8');
    expect(ui).toContain("tower.towerId !== 'CONTROL'");
    expect(ui).toContain('zb-control-intervention');
    expect(ui).toContain('data-pq-control="CONTROL:L1"');
    expect(ui).toContain("enemy.enemyId === 'SWIFT'");
    expect(ui).toContain('zb-swift-brake-cue');
    expect(ui).toContain('data-pq-swift="SWIFT"');
    expect(css).toContain('.zb-control-intervention');
    expect(css).toContain('.zb-control-pq-marshal');
    expect(benchmark.benchmark.response.target.sources[0]).toBe('assets/episode01/characters/choi-minseok-map.webp');
    expect(css).toContain('.zb-swift-brake-cue');
    expect(css).toContain('.zb-swift-pq-asset');
  });

  it('requires grounded construction-safety semantics instead of sci-fi combat language', () => {
    expect(benchmark.benchmark.response.semantic).toContain('traffic marshal');
    expect(benchmark.benchmark.risk.semantic).toContain('reversing construction vehicle');
    expect(benchmark.benchmark.response.forbidden).toContain('sci-fi arch');
    expect(benchmark.benchmark.risk.forbidden).toContain('monster');
    expect(benchmark.benchmark.fx.forbidden).toContain('explosion');
  });
});

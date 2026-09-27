import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const game = readFileSync('src/ui/DefenseGame.tsx', 'utf8');
const activity = readFileSync('src/ui/G8AActivityOverlay.tsx', 'utf8');
const css = readFileSync('src/ui/defense-game.css', 'utf8');

describe('G8-A full-screen actor/world integration polish', () => {
  it('keeps representative workers small enough to belong to the world plate', () => {
    expect(activity).toContain('width: 24');
    expect(activity).toContain('height: 36');
    expect(activity).toContain('width: 26');
    expect(activity).toContain('height: 39');
    expect(activity).toContain('width: 23');
    expect(activity).toContain('height: 35');
    expect(activity).toContain('rx={worker.width * 0.38}');
    expect(css).toContain('opacity:.91');
    expect(css).toContain('saturate(.64)');
  });

  it('does not use the generic impact ring for SWIFT or VEILED', () => {
    expect(game).toContain("isHit && enemy.enemyId !== 'SWIFT' && enemy.enemyId !== 'VEILED'");
    expect(game).toContain('zb-swift-brake-cue');
    expect(game).toContain('zb-veiled-site-occlusion');
  });

  it('grounds CONTROL intervention on the road instead of drawing a magic circle', () => {
    const controlStart = game.indexOf('data-pq-control="CONTROL:L1"');
    const controlEnd = game.indexOf('</g>;', controlStart);
    const control = game.slice(controlStart, controlEnd);
    expect(control).toContain('<ellipse cx="0" cy="20" rx="30" ry="8" />');
    expect(control).not.toContain('<circle r="26" />');
    expect(css).toContain('.zb-control-intervention ellipse');
    expect(css).not.toContain('.zb-control-intervention circle{');
  });
});

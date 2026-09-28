import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const game = readFileSync('src/ui/DefenseGame.tsx', 'utf8');
const activity = readFileSync('src/ui/G8AActivityOverlay.tsx', 'utf8');
const css = readFileSync('src/ui/defense-game.css', 'utf8');

describe('G8-A full-screen actor/world integration polish', () => {
  it('keeps representative workers world-scaled but readable on the physical phone', () => {
    expect(activity).toContain('width: 31');
    expect(activity).toContain('height: 47');
    expect(activity).toContain('width: 33');
    expect(activity).toContain('height: 50');
    expect(activity).toContain('width: 30');
    expect(activity).toContain('height: 45');
    expect(activity).toContain('rx={worker.width * 0.39}');
    expect(activity).toContain('yoon-sungho-map.webp');
    expect(activity).toContain('lee-jaehoon-map.webp');
    expect(activity).toContain('seo-jeongmin-map.webp');
    expect(activity).not.toContain("id: 'choi_minseok'");
    expect(css).toContain('opacity:1');
    expect(css).toContain('saturate(.82)');
    expect(css).toContain('.zb-ambient-dump-motion');
  });

  it('recedes unselected pad paint during running play without removing hit targets', () => {
    expect(css).toContain('.zb-pad-runtime .zb-pad-hardstand{opacity:.025}');
    expect(css).toContain('.zb-pad-runtime .zb-pad-mark:not(.is-selected){opacity:.035}');
    expect(game).toContain('className={`zb-pad-hit');
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

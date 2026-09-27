import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import lock from '../content/defense/g8a-full-visual-lock.json';

describe('G8-A V-02 visual coherence', () => {
  it('closes V-01 with actual-play final raster evidence', () => {
    expect(lock.v02.status).toBe('ACTUAL_PLAY_VISUAL_QA_PASS');
    expect(lock.v01.status).toBe('ACTUAL_PLAY_PASS');
    expect(lock.v01.evidence.desktop.prototypeBoardItems).toBe(0);
    expect(lock.v01.evidence.portrait.prototypeBoardItems).toBe(0);
    expect(lock.motionPresentation.m05Veiled.status).toBe('FINAL_RASTER_ACTUAL_PLAY_PASS');
  });

  it('removes prototype anchor letters and reduces CONTROL footprint', () => {
    const overlay = readFileSync('src/ui/SiteProcessMapBoardOverlay.tsx', 'utf8');
    const game = readFileSync('src/ui/DefenseGame.tsx', 'utf8');
    expect(overlay).not.toContain('recommendedTower.slice(0, 1)');
    expect(overlay).toContain('zb-site-anchor-core');
    expect(game).toContain('width="62"');
    expect(game).toContain('width="30"');
    expect(game).toContain('height="39"');
    expect(game).toContain('height="45"');
    const cueStart = game.indexOf('zb-swift-brake-cue');
    const cueEnd = game.indexOf('</g> : null}', cueStart);
    const brakeCue = game.slice(cueStart, cueEnd);
    expect(brakeCue).not.toContain('<circle');
    expect(brakeCue).toContain('<ellipse');
  });

  it('recedes technical overlays during running play', () => {
    const css = readFileSync('src/ui/defense-game.css', 'utf8');
    expect(css).toContain('[data-status="RUNNING"] .zb-site-process-map .zb-site-anchor-hints{opacity:.07}');
    expect(css).toContain('[data-status="RUNNING"] .zb-site-process-map .zb-site-secondary-routes{opacity:.12}');
  });
});

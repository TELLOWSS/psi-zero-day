import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import fullVisual from '../content/defense/g8a-full-visual-lock.json';

const source = readFileSync('src/ui/DefCoreOneStep.tsx', 'utf8');
const css = readFileSync('src/ui/defense-game.css', 'utf8');

describe('G8-A V-05 cinematic production camera lock', () => {
  it('keeps the Master Bible cinematic grammar and six-shot representative sequence', () => {
    expect(fullVisual.v04a.status).toBe('ACTUAL_PLAY_QA_PASS');
    expect(['IMPLEMENTED_AWAITING_ACTUAL_PLAY_QA','ACTUAL_PLAY_CINEMATIC_QA_PASS']).toContain(fullVisual.v05.status);
    expect(fullVisual.v05.sourceRule).toBe('WIDE → FOCUS → HUMAN CLOSE → DECISION → IMPACT → WIDE');
    expect(fullVisual.v05.shots.map(shot => shot.id)).toEqual(['WIDE','FOCUS','REAR','SIGNAL','RADIO','BRAKE']);
    expect(fullVisual.v05.shots.map(shot => shot.motion)).toEqual(['WIDE','FOCUS','REAR','HUMAN_CLOSE','DECISION','IMPACT']);
  });

  it('exposes production camera metadata in the cinematic runtime', () => {
    expect(source).toContain('data-cinematic-grade="V05"');
    expect(source).toContain('data-cinematic-motion={visual.motion}');
    expect(source).toContain('data-cinematic-framing={visual.framing}');
    expect(source).toContain('className="def-core-shot-focus"');
  });

  it('uses distinct camera motion and portrait framing instead of one generic slideshow animation', () => {
    for (const animation of [
      'def-core-shot-wide',
      'def-core-shot-focus',
      'def-core-shot-rear',
      'def-core-shot-signal',
      'def-core-shot-radio',
      'def-core-shot-impact',
    ]) expect(css).toContain(animation);
    expect(css).toContain('@media (orientation:portrait) and (max-width:560px)');
    expect(css).toContain('.def-core-cinematic[data-cinematic-framing="signal"]');
    expect(css).toContain('.def-core-cinematic[data-cinematic-framing="brake"]');
  });

  it('preserves reduced-motion readability', () => {
    expect(css).toContain('.def-core-shot-image,');
    expect(css).toContain('.def-core-shot-focus{animation:none!important}');
  });
});

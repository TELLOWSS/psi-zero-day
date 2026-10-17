import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

describe('commercial hub mode readiness',()=>{
  const hub=readFileSync(new URL('../src/ui/GameHub.tsx',import.meta.url),'utf8');
  const css=readFileSync(new URL('../src/ui/shooting-entry.css',import.meta.url),'utf8');

  it('opens the approved defense training, preserves Watch and Breaker entries, and opens the approved story episode',()=>{
    expect(hub).toContain('시그널 워치 (SURVIVORS)');
    expect(hub).toContain("setModePreview('defense')");
    expect(hub).toContain("setModePreview('story')");
    expect(hub).toContain('onClick={() => onDefense("guard-campaign")}');
    expect(hub).toContain('href="/signal-breaker-dev/index.html?entry=play"');
    expect(hub).toContain("'story.entry.begin'");
    expect(hub).not.toContain('야간 긴급 순찰 (SURVIVORS)');
    expect(hub).not.toContain('현장 디펜스 시작');
    expect(hub).toContain('onClick={onPlay}');
    expect(hub).toContain('onPracticeScenario={id=>onDefense?.(id)}');
    expect((hub.match(/setModePreview\('story'\)/g)??[]).length).toBeGreaterThanOrEqual(1);
  });

  it('wires three distinct authored mode artworks and a full preview dialog',()=>{
    expect(hub).toContain("signal: SIGNAL_WATCH_KEY_ART");
    expect(hub).toContain('defense: `/${DEFENSE_PREMIUM_HERO}`');
    // Single STORY mode uses the verified gate still, checked by browser decode QA.
    expect(hub).toContain('src="/assets/episode01/cg/gate-dawn.webp"');
    expect(hub).toContain('className="commercial-title-action is-story-entry has-mode-art"');
    expect(hub).not.toContain('is-episode02-entry');
    expect(hub).toContain('mode-preview-dialog');
    expect(css).toContain('.mode-preview-dialog');
    expect(css).toContain('.commercial-title-action-art');
    expect(hub).toContain("defenseText('defense.tactics.playable')");
    expect(hub).not.toContain('mode-preview-cta-correction');
    expect(hub).toContain("t('story.entry.title')");
    expect(css).not.toContain('.mode-preview-cta-correction');
  });
});

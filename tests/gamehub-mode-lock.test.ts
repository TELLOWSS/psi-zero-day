import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

describe('commercial hub mode readiness',()=>{
  const hub=readFileSync(new URL('../src/ui/GameHub.tsx',import.meta.url),'utf8');
  const css=readFileSync(new URL('../src/ui/shooting-entry.css',import.meta.url),'utf8');

  it('keeps only Signal Watch playable while unfinished Defense and Story open previews',()=>{
    expect(hub).toContain('시그널 워치 (SURVIVORS)');
    expect(hub).toContain("setModePreview('defense')");
    expect(hub).toContain("setModePreview('story')");
    expect(hub).toContain('디펜스 모드 · 준비중');
    expect(hub).toContain('스토리 모드 · 준비중');
    expect(hub).not.toContain('야간 긴급 순찰 (SURVIVORS)');
    expect(hub).not.toContain('현장 디펜스 시작');
    expect(hub).not.toContain('onClick={onPlay}');
    expect(hub).not.toContain('onPracticeScenario={scenarioId => onDefense');
    expect(hub).toContain("onPracticeScenario={() => setModePreview('defense')}");
    expect((hub.match(/setModePreview\('story'\)/g)??[]).length).toBeGreaterThanOrEqual(3);
  });

  it('wires three distinct authored mode artworks and a full preview dialog',()=>{
    expect(hub).toContain("/mode-previews/signal-watch.webp");
    expect(hub).toContain("/mode-previews/defense-coming-soon.webp");
    expect(hub).toContain("/mode-previews/story-coming-soon.webp");
    expect(hub).toContain('mode-preview-dialog');
    expect(css).toContain('.mode-preview-dialog');
    expect(css).toContain('.commercial-title-action-art');
    expect(hub).toContain('현재 플레이 가능 모드는 시그널 워치입니다.');
  });
});

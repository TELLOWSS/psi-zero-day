import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
describe('Signal Watch commercial visual contract (presentation only)',()=>{
  const game=readFileSync('src/ui/PatrolSurvivorsGame.tsx','utf8');
  const css=readFileSync('src/ui/signal-watch-visual-lock.css','utf8');
  const loading=readFileSync('src/ui/SignalWatchLoadingScreen.tsx','utf8');
  it('responds to real stage themes and existing collision-pressure input only',()=>{
    expect(game).toContain("const signal = checkDanger ? 'elevated' : 'normal'");
    expect(game).toContain('frame.dataset.watchTheme = theme');
    expect(game).toContain('frame.dataset.watchSignal = signal');
    expect(css).toContain('[data-watch-theme="datacenter"]');
    expect(css).toContain('[data-watch-theme="deep_excavation"]');
    expect(css).toContain('[data-watch-signal="elevated"]');
    expect(css).toContain('pointer-events:none');
    expect(game).toContain("import './signal-watch-visual-lock.css'");
  });
  it('retains a single hero poster and never invents a second loading-image layer',()=>{
    expect((loading.match(/className="signal-watch-loading-art"/g)??[])).toHaveLength(1);
    expect(loading).toContain('className="signal-watch-loading-frame"');
    expect(loading).toContain('className="signal-watch-loading-range"');
    expect(loading).toContain('aria-hidden="true"');
  });
  it('protects low-end graphics and accessibility preferences',()=>{
    expect(css).toContain('[data-quality="low"].is-combat::before');
    expect(css).toContain('@media(prefers-reduced-motion:reduce)');
    expect(css).toContain(':focus-visible');
  });
});

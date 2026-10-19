import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

const game=readFileSync('src/ui/PatrolSurvivorsGame.tsx','utf8');
const css=readFileSync('src/ui/survivors-boss-mobile.css','utf8');

describe('Signal Breaker boss mobile viewport protection',()=>{
  it('enables the boss-only HUD state during arrival, live boss, and secured confirmation',()=>{
    expect(game).toContain("import './survivors-boss-mobile.css'");
    expect(game).toContain("bossAlert || bossSecured || engineRef.current?.state.bossEncounter");
    expect(game).toContain("h.isStageBoss&&h.hp>0");
    expect(game).toContain("bossFightVisible ? ' is-boss-fight' : ''");
  });
  it('keeps top HP and directional boss health visible with safe-area placement',()=>{
    expect(css).toContain('.survivors-container.is-combat.is-boss-fight .survivors-hud-top');
    expect(css).toContain('.survivors-container.is-combat.is-boss-fight .survivors-focus-status');
    expect(css).toContain('env(safe-area-inset-top)');
    expect(css).toContain('env(safe-area-inset-left)');
  });
  it('does not allow large boss alerts or cut-ins to cover the arena',()=>{
    expect(css).toContain('.survivors-encounter-notice,');
    expect(css).toContain('.survivors-director-cutin-layer');
    expect(css).toContain('max-height: 64px');
    expect(css).toContain('pointer-events: none');
    expect(css).toContain('overflow: hidden');
  });
  it('retains an accessible skip button and an actual touch target for the ultimate',()=>{
    expect(css).toContain('.survivors-encounter-notice .survivors-boss-skip');
    expect(css).toContain('pointer-events: auto');
    expect(css).toContain('min-width: 56px');
    expect(css).toContain('min-height: 56px');
  });
  it('handles both portrait phone and short landscape phone',()=>{
    expect(css).toContain('@media (max-width: 760px) and (orientation: portrait)');
    expect(css).toContain('@media (orientation: landscape) and (max-height: 480px)');
  });
});

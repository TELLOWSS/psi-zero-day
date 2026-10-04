import { describe, expect, it } from 'vitest';
import { SurvivorsEngine } from '../src/engine/patrol-survivors-engine';
import { equipmentTuning } from '../src/engine/survivors-equipment-tuning';
import type { Hazard, PerkId } from '../src/domain/patrol-survivors';

function combat(weapon: PerkId) {
  const engine = new SurvivorsEngine(undefined, 42);
  engine.start();
  for (const key of Object.keys(engine.state.activePerks) as PerkId[]) engine.state.activePerks[key] = 0;
  engine.state.activePerks[weapon] = 1;
  engine.state.interactiveHazards = [];
  return engine;
}
function risk(engine: SurvivorsEngine, distance: number): Hazard {
  return { id: `risk-${distance}`, type: 'GAS_LEAK', x: engine.state.player.x + distance, y: engine.state.player.y,
    hp: 10000, maxHp: 10000, radius: 10, speed: 80, damage: 0, expValue: 0 };
}
describe('evolved weapons retain a local engagement window', () => {
  it('does not let hunter drones acquire distant entry targets', () => {
    const engine = combat('hunter_swarm');
    engine.state.hazards = [risk(engine, 500)];
    engine.update(1/60, { moveX: 0, moveY: 0 });
    expect(engine.state.projectiles.filter(p => p.kind === 'hunter_beam')).toHaveLength(0);
    engine.state.hazards = [risk(engine, 180)];
    for(let i=0;i<30;i++) engine.update(1/60, {moveX:0,moveY:0});
    expect(engine.state.hazards[0]!.hp).toBeLessThan(10000);
  });
  it('keeps satellite waves inside their engagement range and prevents entry-point damage', () => {
    const engine = combat('satellite_broadcast');
    const far = risk(engine, 500); far.speed = 0;
    engine.state.hazards = [far];
    for(let i=0;i<70;i++) engine.update(1/60,{moveX:0,moveY:0});
    expect(far.hp).toBe(10000);
    expect(equipmentTuning('satellite_broadcast',1)!.duration*580).toBeLessThan(320);
  });
  it('does not permanently mutate base speed and stops tesla damage outside its radius', () => {
    const engine = combat('tesla_dome'), hazard = risk(engine, 100);
    engine.state.hazards = [hazard];
    engine.update(1/60,{moveX:0,moveY:0});
    expect(hazard.speed).toBe(80);
    expect(hazard.hp).toBeLessThan(10000);
    hazard.x=engine.state.player.x+260;hazard.y=engine.state.player.y;
    engine.state.projectiles=[];const hp=hazard.hp;
    engine.update(1/60,{moveX:0,moveY:0});
    expect(hazard.hp).toBe(hp);
    expect(hazard.speed).toBe(80);
  });
});

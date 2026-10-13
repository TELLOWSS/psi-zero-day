import { describe, expect, it, vi } from 'vitest';
import * as vfx from '../src/ui/survivors-projectile-vfx';
import { createInitialSurvivorsState, SurvivorsEngine } from '../src/engine/patrol-survivors-engine';
import { ProjectileFeedbackLayer, MAX_PROJECTILE_FEEDBACK } from '../src/ui/survivors-projectile-feedback';
import type { ProjectileFeedback } from '../src/domain/survivors-projectile-feedback';

const feedback = (phase: ProjectileFeedback['phase'], n = 0): ProjectileFeedback => ({projectileId:String(n),kind:'radio',phase,x:n*30,y:0,angle:0,radius:10});
describe('confirmed projectile lifecycle', () => {
  it('reuses mortar material for confirmed launch and impact without changing events',()=>{
    const draw=vi.spyOn(vfx,'drawProjectileVfx').mockImplementation(()=>{});
    const light=vi.spyOn(vfx,'drawProjectileLight').mockImplementation(()=>{});
    const ctx={save:vi.fn(),restore:vi.fn(),translate:vi.fn(),rotate:vi.fn(),beginPath:vi.fn(),ellipse:vi.fn(),stroke:vi.fn(),moveTo:vi.fn(),lineTo:vi.fn()};
    try {
      for(const kind of ['grout_slug','hydraulic_wave'] as const)for(const phase of ['launch','impact'] as const){
        const layer=new ProjectileFeedbackLayer(),event=Object.freeze({...feedback(phase),kind});
        layer.ingest([event]);layer.draw(ctx as unknown as CanvasRenderingContext2D);
        expect(draw.mock.calls.at(-1)![1]).toMatchObject({kind,damage:0,pierce:0});
        expect(event).toMatchObject({kind,phase});
      }
      expect(draw).toHaveBeenCalledTimes(4);
      expect(ctx.save.mock.calls.length).toBe(ctx.restore.mock.calls.length);
    } finally {draw.mockRestore();light.mockRestore();}
  });
  it('reports a real contact and releases a consumed projectile exactly once', () => {
    const state = createInitialSurvivorsState();state.phase='playing';state.player.critRate=0;
    state.interactiveHazards=[];
    state.hazards=[{id:'worker',type:'UNHELMETED',x:state.player.x+80,y:state.player.y,hp:100,maxHp:100,speed:0,radius:20,damage:0,expValue:1}];
    state.projectiles=[{id:'test',kind:'radio',x:state.hazards[0]!.x,y:state.hazards[0]!.y,vx:0,vy:0,radius:10,damage:1,duration:1,pierce:1}];
    const engine=new SurvivorsEngine(state);engine.update(1/60,{moveX:0,moveY:0});
    const events=engine.drainProjectileFeedback().filter(e=>e.projectileId==='test');
    expect(events.map(e=>e.phase)).toEqual(['impact','release']);
    expect(events[0]).toMatchObject({worker:true,x:state.hazards[0]!.x,y:state.hazards[0]!.y});
    engine.update(1/60,{moveX:0,moveY:0});
    expect(engine.drainProjectileFeedback().filter(e=>e.projectileId==='test')).toEqual([]);
  });
  it('observing feedback cannot change deterministic simulation or audio', () => {
    const a=new SurvivorsEngine(),b=new SurvivorsEngine();a.start();b.start();
    for(const engine of [a,b]) engine.state.hazards.push({id:'in-range',type:'GAS_LEAK',x:engine.state.player.x+100,y:engine.state.player.y,hp:10000,maxHp:10000,speed:0,radius:15,damage:0,expValue:0});
    let launches=0;
    for(let i=0;i<180;i++){
      a.update(1/60,{moveX:1,moveY:0});b.update(1/60,{moveX:1,moveY:0});
      launches+=a.drainProjectileFeedback().filter(e=>e.phase==='launch').length;
    }
    expect(launches).toBeGreaterThan(0);
    expect(a.state).toEqual(b.state);expect(a.drainAudioEvents()).toEqual(b.drainAudioEvents());
    expect(b.drainProjectileFeedback().length).toBeLessThanOrEqual(192);
  });
  it('bounds dense feedback, prioritizes contacts and retires effects', () => {
    const layer=new ProjectileFeedbackLayer();
    layer.ingest(Array.from({length:200},(_,i)=>feedback('impact',i)));
    expect(layer.size).toBe(MAX_PROJECTILE_FEEDBACK);
    layer.ingest([feedback('launch',300),feedback('release',301)],true);
    expect(layer.size).toBe(MAX_PROJECTILE_FEEDBACK);
    layer.advance(.25);expect(layer.size).toBe(0);
    layer.ingest([feedback('impact'),feedback('impact')]);expect(layer.size).toBe(1);
    layer.clear();expect(layer.size).toBe(0);
  });
});

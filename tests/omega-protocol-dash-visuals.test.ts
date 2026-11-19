import {describe,it,expect} from 'vitest';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';
import {
 OMEGA_MAX_DASH_ECHOES,OMEGA_DASH_ECHO_LIFETIME,
 omegaAdvanceDashEchoes,omegaDashEchoOpacity,
 drawOmegaDashEnergy,drawOmegaGroundedSplash,
} from '../src/ui/omega-protocol-dash-visuals';
describe('OMEGA native-trajectory dash and grounded response',()=>{
 it('does not invent echoes for stationary gameplay, pause, or non-native dashes',()=>{
  const hero={x:300,y:450},aim={x:1,y:0};
  expect(omegaAdvanceDashEchoes([],hero,hero,aim,false,1,true)).toEqual([]);
  expect(omegaAdvanceDashEchoes([],hero,hero,aim,true,1,true)).toEqual([]);
  const a=omegaAdvanceDashEchoes([],hero,{x:280,y:450},aim,true,1,true);
  expect(a).toHaveLength(1);
  expect(omegaAdvanceDashEchoes(a,{x:305,y:450},hero,aim,true,1.01,true)).toEqual(a);
  expect(omegaAdvanceDashEchoes(a,{x:340,y:450},hero,aim,false,1.03,true)).toEqual(a);
  expect(omegaAdvanceDashEchoes(a,hero,{x:280,y:450},aim,true,1.03,false)).toEqual([]);
  expect(omegaAdvanceDashEchoes(a,hero,{x:280,y:450},aim,true,1.4,true)).toHaveLength(1);
  expect(omegaAdvanceDashEchoes(a,{x:NaN,y:450},hero,aim,true,1.05,true)).toEqual([]);
 });
 it('expires afterimages in native game time and bounds allocations for 30+ fps',()=>{
  let echoes:ReturnType<typeof omegaAdvanceDashEchoes>=[];
  for(let i=0;i<90;i++)echoes=omegaAdvanceDashEchoes(echoes,{x:100+i*24,y:400},{x:76+i*24,y:400},{x:1,y:0},true,i/60,true);
  expect(echoes.length).toBeLessThanOrEqual(OMEGA_MAX_DASH_ECHOES);
  expect(omegaDashEchoOpacity({x:1,y:1,facingX:1,facingY:0,time:1},1)).toBeGreaterThan(0);
  expect(omegaDashEchoOpacity({x:1,y:1,facingX:1,facingY:0,time:1},1+OMEGA_DASH_ECHO_LIFETIME)).toBe(0);
 });
 it('paints a world-relative ground response only for true planted foot callbacks',()=>{
  const ops:string[]=[];
  const ctx=new Proxy({},{
   get(_t,k){return (..._args:unknown[])=>{ops.push(String(k));};},
   set(){return true;},
  }) as unknown as CanvasRenderingContext2D;
  drawOmegaGroundedSplash(ctx,[{x:0,y:0,landed:false}],2);
  expect(ops).toEqual([]);
  drawOmegaGroundedSplash(ctx,[{x:-8,y:0,landed:true},{x:8,y:0,landed:false}],2);
  expect(ops.filter(s=>s==='ellipse')).toHaveLength(1);
  drawOmegaDashEnergy(ctx,[{x:13,y:14,time:2,facingX:1,facingY:0}],2.04);
  expect(ops.filter(s=>s==='ellipse').length).toBeGreaterThan(2);
 });
 it('takes dash truth from live Watch engine rather than manual rendered flags',()=>{
  const session=new OmegaProtocolCombatSession(20261108,50,false,{fieldTraversal:true});
  const before={x:session.engine.state.player.x,y:session.engine.state.player.y};
  expect(session.dash()).toBe(true);
  let echoes:ReturnType<typeof omegaAdvanceDashEchoes>=[];
  for(let i=0;i<10;i++){
   session.update(1/60,{moveX:1,moveY:0,triggerAction:false});
   const p=session.engine.state.player;
   echoes=omegaAdvanceDashEchoes(echoes,p,before,session.facing,Boolean(p.isDashing),
    session.engine.state.gameTime,session.run.phase==='battle');
   before.x=p.x;before.y=p.y;
  }
  expect(echoes.length).toBeGreaterThan(0);
  expect(echoes.every(e=>Number.isFinite(e.x)&&Number.isFinite(e.y))).toBe(true);
  expect(session.run.owned).toEqual({});
 });
});

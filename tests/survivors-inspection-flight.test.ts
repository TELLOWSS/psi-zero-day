import {expect,it} from 'vitest';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {InspectionFlightTracker,inspectionTarget} from '../src/ui/survivors-inspection-flight';
import type {Hazard} from '../src/domain/patrol-survivors';
import {premiumHazardSpeed} from '../src/engine/survivors-premium-gear';
const dock={x:-9,y:-53};
function fixture(){
  const state=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:['inspection_wing'],equipped:['inspection_wing']});
  state.phase='playing';state.hazards=[];
  return state;
}
function threat(state:ReturnType<typeof fixture>,id='gas',dx=100,type:Hazard['type']='GAS_LEAK'):Hazard {
  return {id,type,x:state.player.x+dx,y:state.player.y,hp:50,radius:12} as Hazard;
}
it('docks without a real suppressed target, then launches and returns without mutating gameplay',()=>{
  const state=fixture(),tracker=new InspectionFlightTracker();
  expect(tracker.sample(state,dock)).toMatchObject({phase:'docked',...dock});
  state.hazards=[threat(state)];
  const before=JSON.stringify(state);
  expect(tracker.sample(state,dock).phase).toBe('launching');
  expect(JSON.stringify(state)).toBe(before);
  state.gameTime=.1;const airborne=tracker.sample(state,dock);
  expect(airborne.x).toBeGreaterThan(dock.x);expect(airborne.x).toBeLessThan(86);
  state.gameTime=.35;expect(tracker.sample(state,dock)).toMatchObject({phase:'inspecting',targetId:'gas',x:86,y:-28});
  expect(premiumHazardSpeed(state,state.hazards[0]!)).toBe(.8);
  state.hazards[0]!.x=state.player.x+181;state.gameTime=.40;
  expect(tracker.sample(state,dock).phase).toBe('returning');
  for(let i=0;i<5;i++){state.gameTime+=.1;tracker.sample(state,dock);}
  expect(tracker.sample(state,dock)).toMatchObject({phase:'docked',...dock});
  expect(premiumHazardSpeed(state,state.hazards[0]!)).toBe(1);
});
it('uses exact engine eligibility, retains a valid target and ignores dead/non-environment hazards',()=>{
  const state=fixture();state.hazards=[threat(state,'edge',180),threat(state,'outside',180.01),threat(state,'worker',20,'UNHELMETED'),{...threat(state,'dead',1),hp:0},threat(state,'cart',60,'RUNAWAY_CART')];
  expect(inspectionTarget(state)?.id).toBe('cart');
  expect(inspectionTarget(state,'edge')?.id).toBe('edge');
  state.premiumGear!.equipped=[];expect(inspectionTarget(state)).toBeUndefined();
});
it('freezes while paused and uses clear static dock/inspection poses for reduced motion',()=>{
  const state=fixture(),tracker=new InspectionFlightTracker();state.hazards=[threat(state)];
  const first=tracker.sample(state,dock);state.phase='paused';
  expect(tracker.sample(state,dock)).toMatchObject(first);
  state.phase='playing';expect(tracker.sample(state,dock,true)).toMatchObject({phase:'inspecting',x:86,y:-28});
  state.hazards=[];expect(tracker.sample(state,dock,true)).toMatchObject({phase:'docked',...dock});
});
it('follows moving body sockets on return and resets for a restarted clock',()=>{
  const state=fixture(),tracker=new InspectionFlightTracker();
  state.hazards=[threat(state)];tracker.sample(state,dock);state.gameTime=.25;tracker.sample(state,dock);
  state.gameTime=.5;tracker.sample(state,dock);state.hazards=[];state.gameTime=.6;tracker.sample(state,dock);
  const movedDock={x:9,y:-51};
  for(let i=0;i<5;i++){state.gameTime+=.1;tracker.sample(state,movedDock);}
  expect(tracker.sample(state,movedDock)).toMatchObject({phase:'docked',...movedDock});
  state.gameTime=0;expect(tracker.sample(state,dock)).toMatchObject({phase:'docked',...dock});
});

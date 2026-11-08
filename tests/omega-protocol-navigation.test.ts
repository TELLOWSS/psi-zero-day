import {describe,it,expect} from 'vitest';
import {omegaFieldNextRoute} from '../src/domain/omega-protocol-navigation';
import {
 omegaFieldPlan,omegaFieldCanInteract,omegaFieldTargetGuide,omegaFieldInitialProgress,
 type OmegaFieldPoint,type OmegaFieldObstacle,
} from '../src/domain/omega-protocol-field';

const block:OmegaFieldObstacle={
 id:'blocking_container',kind:'container',
 x:530,y:370,width:40,height:70,
};
const distance=(a:OmegaFieldPoint,b:OmegaFieldPoint)=>Math.hypot(a.x-b.x,a.y-b.y);

describe('OMEGA obstacle-aware navigation: only visible and reachable objectives',()=>{
 it('detours around expanded collision structures instead of pointing through solids',()=>{
  const start={x:400,y:405},target={x:700,y:405};
  const direct=distance(start,target);
  const route=omegaFieldNextRoute(start,target,[block]);
  expect(route).not.toBeNull();
  if(!route)throw Error('Blocked a physically reachable route');
  expect(route.detour).toBe(true);
  expect(route.length).toBeGreaterThan(direct);
  expect(route.next).not.toEqual(target);
  expect(route.waypoints.at(-1)).toEqual(target);
  let previous=start;
  for(const next of route.waypoints){
   for(let i=0;i<=20;i++){
    const t=i/20;
    const x=previous.x+(next.x-previous.x)*t;
    const y=previous.y+(next.y-previous.y)*t;
    // 20-unit actor clearance (collision radius=21); never penetrate.
    expect(x>block.x-20&&x<block.x+block.width+20&&
      y>block.y-20&&y<block.y+block.height+20).toBe(false);
   }
   previous=next;
  }
 });
 it('permits direct routes, but forbids activating equipment through a wall',()=>{
  const actor={x:500,y:405},target={x:600,y:405};
  expect(distance(actor,target)).toBe(100);
  expect(omegaFieldCanInteract(actor,target)).toBe(true); // legacy range-only contract
  expect(omegaFieldCanInteract(actor,target,[block])).toBe(false);
  expect(omegaFieldCanInteract(target,target,[block])).toBe(true);
  expect(omegaFieldNextRoute({x:500,y:200},{x:600,y:200},[block])?.detour).toBe(false);
 });
 it('handles invalid map positions, complete blockers and exact collision edges safely',()=>{
  expect(omegaFieldNextRoute({x:NaN,y:5},{x:600,y:100},[block])).toBeNull();
  expect(omegaFieldNextRoute({x:545,y:400},{x:600,y:100},[block])).toBeNull();
  expect(omegaFieldNextRoute({x:400,y:400},{x:700,y:400},[block],0,900)).toBeNull();
  const edge={x:block.x-21,y:400};
  // The field resolver itself may stop the player precisely at this edge.
  expect(omegaFieldNextRoute(edge,{x:400,y:400},[block])).not.toBeNull();
  const wall:OmegaFieldObstacle={id:'full-wall',kind:'barrier',x:630,y:0,width:100,height:900};
  expect(omegaFieldNextRoute({x:200,y:450},{x:900,y:450},[wall])).toBeNull();
 });
 it('does not return a zero-distance waypoint after reaching a graph corner',()=>{
  const start={x:400,y:405},target={x:700,y:405};
  const first=omegaFieldNextRoute(start,target,[block]);
  expect(first?.detour).toBe(true);
  if(!first)throw Error('No initial detour');
  const reached=first.next;
  const continuation=omegaFieldNextRoute(reached,target,[block]);
  expect(continuation).not.toBeNull();
  expect(continuation?.next).not.toEqual(reached);
  expect(continuation?.length).toBeGreaterThan(0);
 });
 it('can navigate all 15 seeded rooms to every real event and their exits',()=>{
  const plans=Array.from({length:15},(_,i)=>omegaFieldPlan(20261108,i+1));
  let total=0;
  for(const plan of plans){
   for(const target of [...plan.event.steps.map(step=>step.target),plan.exit]){
    let actor=plan.entry,arrived=false;
    for(let tick=0;tick<22;tick++){
     const route=omegaFieldNextRoute(actor,target,plan.obstacles);
     expect(route).not.toBeNull();
     if(!route)throw Error('Unexpected unreachable mission point in node '+plan.wave);
     expect(route.length).toBeGreaterThanOrEqual(distance(actor,target)-.00001);
     expect(route.waypoints.length).toBeGreaterThanOrEqual(1);
     actor=route.next;
     if(distance(actor,target)<1e-6){arrived=true;break;}
    }
    expect(arrived).toBe(true);
    total++;
   }
  }
  expect(total).toBeGreaterThan(40);
 });
 it('projects mission compass toward the next unobstructed waypoint',()=>{
  const plan=omegaFieldPlan(20261108,3);
  const progress={...omegaFieldInitialProgress(),phase:'objective' as const};
  const goal=plan.event.steps[0]!.target;
  const route=omegaFieldNextRoute(plan.entry,goal,plan.obstacles);
  const compass=omegaFieldTargetGuide(plan,progress,plan.entry);
  expect(route).not.toBeNull();
  expect(compass).not.toBeNull();
  if(!compass||!route)return;
  expect(compass.distance).toBe(Math.round(route.length));
  expect(compass.ready).toBe(false);
  expect(omegaFieldTargetGuide(plan,progress,goal)?.ready).toBe(true);
 });
});

import {describe,it,expect} from 'vitest';
import {omegaFieldPlan,omegaFieldInitialProgress,type OmegaFieldProgress} from '../src/domain/omega-protocol-field';
import {omegaFieldDepthOrder} from '../src/ui/omega-protocol-depth-scene';
import {omegaDeviceState,drawOmegaMissionDevice,drawOmegaExtractionUnit} from '../src/ui/omega-protocol-mission-visuals';

function fakeCanvas(){
 const calls:string[]=[];
 const gradient={addColorStop(_offset:number,_color:string){calls.push('stop');}};
 const handler={
  get(_target:object,key:string|symbol){
   if(key==='createRadialGradient')return ()=>{calls.push(String(key));return gradient;};
   return (..._args:unknown[])=>{calls.push(String(key));};
  },
  set(){return true;},
 };
 return {ctx:new Proxy({},handler) as CanvasRenderingContext2D,calls};
}
describe('OMEGA field equipment is an observable part of the real mission state',()=>{
 it('follows the 3-step progression without ever marking future consoles complete',()=>{
  const plan=omegaFieldPlan(20261108,1);
  const combat=omegaFieldInitialProgress();
  expect(plan.event.steps.length).toBeGreaterThanOrEqual(2);
  for(let i=0;i<plan.event.steps.length;i++)expect(omegaDeviceState(combat,i)).toBe('locked');
  for(let n=0;n<plan.event.steps.length;n++){
   const progress:OmegaFieldProgress={phase:'objective',eventComplete:false,
    exitUnlocked:false,completedSteps:n};
   for(let i=0;i<plan.event.steps.length;i++){
    expect(omegaDeviceState(progress,i)).toBe(i<n?'completed':i===n?'active':'locked');
   }
  }
  expect(()=>omegaDeviceState(combat,-1)).toThrow(RangeError);
 });
 it('renders distinct physical electrical, evacuation and brace control artwork',()=>{
  const signatures=new Map<string,string>();
  for(let wave=1;wave<=15;wave++){
   const plan=omegaFieldPlan(20261108,wave);
   const progress={...omegaFieldInitialProgress(),phase:'objective' as const};
   const {ctx,calls}=fakeCanvas();
   drawOmegaMissionDevice(ctx,plan,progress,0,1.5);
   expect(calls).toContain('ellipse');
   expect(calls).toContain('fillRect');
   expect(calls).toContain('createRadialGradient');
   signatures.set(plan.event.kind,JSON.stringify({
    fillRect:calls.filter(x=>x==='fillRect').length,
    arc:calls.filter(x=>x==='arc').length,
    stroke:calls.filter(x=>x==='stroke').length,
   }));
  }
  expect(signatures.size).toBe(3);
  expect(new Set(signatures.values()).size).toBe(3);
 });
 it('draws a truly locked gate until the last real event unlocks the exit',()=>{
  const plan=omegaFieldPlan(20261108,1);
  const {ctx,calls}=fakeCanvas();
  drawOmegaExtractionUnit(ctx,plan.exit,false,2);
  const before=calls.join(',');
  calls.length=0;
  drawOmegaExtractionUnit(ctx,plan.exit,true,2);
  const after=calls.join(',');
  expect(before).not.toBe(after);
  expect(before.includes('fillRect')).toBe(true);
  expect(after.includes('lineTo')).toBe(true);
  const source=JSON.stringify(plan);
  drawOmegaMissionDevice(ctx,plan,{...omegaFieldInitialProgress(),
   completedSteps:1,phase:'objective'},0,2);
  expect(JSON.stringify(plan)).toBe(source);
 });
 it('sorts all consoles and extraction alongside existing real hero and threats',()=>{
  const plan=omegaFieldPlan(20261108,1),progress=omegaFieldInitialProgress();
  const alive=[{y:320,hp:10},{y:650,hp:5},{y:440,hp:0}];
  const sorted=omegaFieldDepthOrder(plan,alive,450,progress);
  expect(sorted.filter(v=>v.kind==='console')).toHaveLength(plan.event.steps.length);
  expect(sorted.filter(v=>v.kind==='extraction')).toHaveLength(1);
  expect(sorted.filter(v=>v.kind==='hero')).toHaveLength(1);
  expect(sorted.filter(v=>v.kind==='hazard')).toHaveLength(2);
  expect(sorted.map(v=>v.depth)).toEqual([...sorted.map(v=>v.depth)].sort((a,b)=>a-b));
  expect(omegaFieldDepthOrder(plan,alive,450)).not.toContainEqual(
   expect.objectContaining({kind:'console'}));
 });
});

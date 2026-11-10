import {describe,it,expect} from 'vitest';
import {omegaFieldNativeTerrain,omegaFieldPlan} from '../src/domain/omega-protocol-field';
import {
 omegaG4Budget,omegaG4SilverLabRequested,OMEGA_G4_REVIEW_URL,
 OMEGA_G4_ACTOR_PALETTE,drawOmegaG4CenterStageMaterial,drawOmegaG4ActorGrounding,
} from '../src/ui/omega-protocol-m12-combat-fidelity';

function mockCanvas(){
 const calls:string[]=[];
 const hit=(name:string)=>()=>calls.push(name);
 const grad={addColorStop:(_n:number,_v:string)=>calls.push('stop')};
 const ctx={
  save:hit('save'),restore:hit('restore'),translate:hit('translate'),
  beginPath:hit('beginPath'),closePath:hit('closePath'),rect:hit('rect'),
  fill:hit('fill'),stroke:hit('stroke'),fillRect:hit('fillRect'),
  strokeRect:hit('strokeRect'),ellipse:hit('ellipse'),
  moveTo:hit('moveTo'),lineTo:hit('lineTo'),
  createLinearGradient:()=>{calls.push('gradient');return grad;},
 } as unknown as CanvasRenderingContext2D;
 return {ctx,calls};
}
describe('M12-G4 original in-game silver combat fidelity - strictly preview only',()=>{
 it('keeps silver source-review opt-in narrow to development OMEGA without bypassing 160-frame approved pack',()=>{
  expect(omegaG4SilverLabRequested('?omegaLab=1&omegaM12G4=1',true)).toBe(true);
  expect(omegaG4SilverLabRequested('?omegaLab=1&omegaM12G4=1',false)).toBe(false);
  expect(omegaG4SilverLabRequested('?omegaM12G4=1',true)).toBe(false);
  expect(omegaG4SilverLabRequested('?omegaLab=1&omegaM12G4=true',true)).toBe(false);
  expect(omegaG4SilverLabRequested('?omegaLab=1&omegaM12G4=1&omegaSilverPreview=1',true)).toBe(false);
  expect(omegaG4SilverLabRequested('?omegaLab=1&omegaM12G4=1&omegaSilverPreview=0',true)).toBe(false);
  expect(OMEGA_G4_REVIEW_URL).toContain('omegaM12G4=1');
 });
 it('uses stable low-cost palette and distinct silver/infected/boss grounding',()=>{
  expect(omegaG4Budget(390,844)).toEqual({tier:'mobile',rivetRows:2,streaks:3,rimLight:false});
  expect(omegaG4Budget(844,390).tier).toBe('mobile');
  expect(omegaG4Budget(1024,768).tier).toBe('tablet');
  expect(omegaG4Budget(1440,900)).toEqual({tier:'desktop',rivetRows:5,streaks:7,rimLight:true});
  expect(()=>omegaG4Budget(0,390)).toThrow(RangeError);
  expect(OMEGA_G4_ACTOR_PALETTE['silver-aira'].rim).not.toBe(OMEGA_G4_ACTOR_PALETTE.infected.rim);
  expect(OMEGA_G4_ACTOR_PALETTE.boss.reflection).not.toBe(OMEGA_G4_ACTOR_PALETTE.infected.reflection);
 });
 it('paints center ground plus all actual native actor feet with no mutated Watch physical terrain',()=>{
  const plan=omegaFieldPlan(20261108,1);
  const initial=JSON.stringify(plan),physical=JSON.stringify(omegaFieldNativeTerrain(plan));
  const {ctx,calls}=mockCanvas(),budget=omegaG4Budget(1440,900);
  drawOmegaG4CenterStageMaterial(ctx,plan,budget);
  const groundOps=calls.length;
  expect(groundOps).toBeGreaterThan(40);
  for(const who of ['silver-aira','infected','boss'] as const)
   drawOmegaG4ActorGrounding(ctx,plan,{x:150,y:450},who,budget);
  expect(calls.length).toBeGreaterThan(groundOps+15);
  expect(JSON.stringify(plan)).toBe(initial);
  expect(JSON.stringify(omegaFieldNativeTerrain(plan))).toBe(physical);
 });
 it('has no new collision or fake geometry in downstream regions; rejects ungrounded feet',()=>{
  const {ctx,calls}=mockCanvas(),plan=omegaFieldPlan(20261108,13);
  drawOmegaG4CenterStageMaterial(ctx,plan,omegaG4Budget(390,844));
  drawOmegaG4ActorGrounding(ctx,plan,plan.entry,'infected',omegaG4Budget(390,844));
  drawOmegaG4ActorGrounding(ctx,omegaFieldPlan(20261108,1),{x:NaN,y:450},'silver-aira',omegaG4Budget(390,844));
  expect(calls).toEqual([]);
 });
});

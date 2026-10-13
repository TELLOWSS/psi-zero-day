import {it,expect,vi} from 'vitest';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {BossEncounterDirection,bossPresentationPose} from '../src/ui/survivors-boss-direction';
import type {Hazard} from '../src/domain/patrol-survivors';
vi.mock('../src/ui/survivors-equipment-art',()=>({drawProp:vi.fn(()=>true),drawPropReaction:vi.fn()}));
import {drawProp} from '../src/ui/survivors-equipment-art';
const atlas={naturalWidth:1448,naturalHeight:1086} as HTMLImageElement;
const context=()=>({save:vi.fn(),restore:vi.fn(),translate:vi.fn(),drawImage:vi.fn(),rotate:vi.fn()}) as unknown as CanvasRenderingContext2D;
function fixture(){
 const s=createInitialSurvivorsState(),h:Hazard={id:'boss',type:'RUNAWAY_CART',x:700,y:450,hp:100,maxHp:100,speed:0,radius:34,damage:0,expValue:1,isStageBoss:true,bossEncounterManaged:true,bossPhase:1,bossAttackCycles:0,motion:{phase:'cooldown',timer:2,directionX:0,directionY:0}};
 s.hazards=[h];s.bossEncounter={bossId:h.id,phase:'arrival',remaining:3.5};return {s,h};
}
it('uses encounter time for a bounded introduction while combat time is held',()=>{
 const {s,h}=fixture(),early=bossPresentationPose(s,h,false,false)!;
 s.bossEncounter!.remaining=1;const late=bossPresentationPose(s,h,false,false)!;
 expect(late.width).toBeGreaterThan(early.width);expect(late.rotation).toBeLessThan(early.rotation);expect(late.width).toBeLessThanOrEqual(106);
 expect(bossPresentationPose(s,h,true,false)!.rotation).toBe(0);
 expect(bossPresentationPose(s,h,false,true)!.alpha).toBeLessThan(late.alpha);
});
it('suppresses decoration during danger trajectories and marks only locked or exposed cores',()=>{
 const {s,h}=fixture();s.bossEncounter!.phase='combat';h.hp=50;
 expect(bossPresentationPose(s,h,false,false)!.phase).toBe('interlocked');
 for(const phase of ['warning','charge','fall'] as const){h.motion!.phase=phase;expect(bossPresentationPose(s,h,false,false)).toBeNull();}
 h.bossPhase=2;h.bossAttackCycles=1;h.motion!.phase='cooldown';expect(bossPresentationPose(s,h,false,false)!.phase).toBe('exposed');
 h.motion!.phase='approach';expect(bossPresentationPose(s,h,false,false)).toBeNull();
});
it('retains one immutable control remnant, fades it, and clears it on session change',()=>{
 const {s,h}=fixture(),layer=new BossEncounterDirection(),ctx=context();layer.observe(s);const before=JSON.stringify(s);
 layer.draw(ctx,s,atlas,{RUNAWAY_CART:atlas},false,false);expect(JSON.stringify(s)).toBe(before);
 s.hazards=[];s.bossEncounter!.phase='secured';s.bossEncounter!.remaining=2.4;layer.observe(s);vi.mocked(drawProp).mockClear();
 layer.draw(ctx,s,atlas,{RUNAWAY_CART:atlas},false,false);expect(drawProp).toHaveBeenCalledTimes(1);
 const early=bossPresentationPose(s,h,false,false)!;s.bossEncounter!.remaining=.2;const late=bossPresentationPose(s,h,false,false)!;
 expect(late.artAlpha).toBeLessThan(early.artAlpha);expect(late.settle).toBeLessThanOrEqual(3);
 s.bossEncounter=undefined;layer.observe(s);vi.mocked(ctx.drawImage).mockClear();layer.draw(ctx,s,atlas,{},false,false);expect(ctx.drawImage).not.toHaveBeenCalled();
 expect(vi.mocked(ctx.save).mock.calls.length).toBe(vi.mocked(ctx.restore).mock.calls.length);
});
it('never decorates workers or an unrelated boss and freezes repeated/reduced presentation samples',()=>{
 const {s,h}=fixture();s.bossEncounter!.phase='combat';h.bossPhase=2;h.bossAttackCycles=1;
 const early=bossPresentationPose(s,h,true,false);s.gameTime=10;expect(bossPresentationPose(s,h,true,false)).toEqual(early);
 expect(bossPresentationPose(s,h,false,false)).toEqual(bossPresentationPose(s,h,false,false));
 expect(bossPresentationPose(s,{...h,type:'UNHELMETED'},false,false)).toBeNull();
 expect(bossPresentationPose(s,{...h,id:'other'},false,false)).toBeNull();
});

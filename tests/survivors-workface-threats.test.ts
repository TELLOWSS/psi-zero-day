import {describe,it,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {WORKFACE_CROPS,WORKFACE_THREATS,workfaceThreatAppearance,workfaceThreatCopy,workfaceThreatPose} from '../src/ui/survivors-workface-threats';
import {PATROL_STAGES} from '../engine/patrol-survivors-engine';
import type {HazardType,PatrolStageId} from '../domain/patrol-survivors';
describe('fifty authored workface identities',()=>{
 it('gives each existing stage a unique complete identity within its real spawn family',()=>{
  expect(WORKFACE_THREATS).toHaveLength(50);expect(new Set(WORKFACE_THREATS.map(r=>r.id)).size).toBe(50);
  expect(new Set(WORKFACE_THREATS.map(r=>r.atlas+':'+r.cell)).size).toBe(50);
  for(const row of WORKFACE_THREATS){
   const id=`stage_${String(row.stage).padStart(2,'0')}` as PatrolStageId;
   expect(PATROL_STAGES[id].hazardMix).toContain(row.type);
   expect(workfaceThreatCopy(row.stage)?.name).toBeTruthy();
   expect(workfaceThreatAppearance({id:'hazard_1',type:row.type as HazardType},row.stage)?.id).toBe(row.id);
   expect(workfaceThreatAppearance({id:'hazard_3',type:row.type as HazardType},row.stage)).toBeUndefined();
  }
 });
 it('preserves bosses, workers, signature art, and unrelated ordinary families',()=>{
  const h={id:'hazard_1',type:'RUNAWAY_CART' as const};
  expect(workfaceThreatAppearance({...h,isStageBoss:true},1)).toBeUndefined();
  expect(workfaceThreatAppearance({...h,signatureEventId:'authored'},1)).toBeUndefined();
  expect(workfaceThreatAppearance({...h,type:'UNHELMETED'},1)).toBeUndefined();
  expect(workfaceThreatAppearance({...h,type:'GAS_LEAK'},1)).toBeUndefined();
 });
 it('anchors chassis motion to travel and freezes parked/reduced-motion art',()=>{
  const h={id:'hazard_1',type:'RUNAWAY_CART' as const,motion:{phase:'approach' as const,timer:0,directionX:1,directionY:0}};
  const pose={moving:true,speed:200,travel:120};const before=JSON.stringify(h);
  expect(Math.abs(workfaceThreatPose(h,pose,1,false).y)).toBeLessThanOrEqual(.8);
  expect(workfaceThreatPose(h,{...pose,moving:false},1,false).y).toBe(0);
  expect(workfaceThreatPose({...h,motion:{...h.motion,phase:'warning'}},pose,1,false).y).toBe(0);
  expect(workfaceThreatPose(h,pose,1,true)).toEqual({x:0,y:0,rotation:0,scaleX:1,scaleY:1});
  expect(JSON.stringify(h)).toBe(before);
 });
 it('keeps vapor articulation bounded and debris rotation tied to the fall phase',()=>{
  const pose={moving:false,speed:0,travel:0};const gas={id:'hazard_4',type:'GAS_LEAK' as const};
  for(let t=0;t<20;t+=.1){const p=workfaceThreatPose(gas,pose,t,false);expect(Math.abs(p.y)).toBeLessThanOrEqual(1.1);expect(p.scaleX).toBeGreaterThanOrEqual(.975);}
  const debris={id:'hazard_1',type:'FALLING_DEBRIS' as const,motion:{phase:'fall' as const,timer:.225,directionX:0,directionY:0}};
  expect(Math.abs(workfaceThreatPose(debris,pose,1,false).rotation)).toBeCloseTo(.14);
  expect(workfaceThreatPose({...debris,motion:{...debris.motion,phase:'warning'}},pose,1,false).rotation).toBe(0);
 });
 it('contains all fifty complete sprites with transparent gutters and compact regional files',async()=>{
  for(const atlas of new Set(WORKFACE_THREATS.map(r=>r.atlas))){
   const buffer=await readFile('public/assets/survivors/'+atlas);expect(buffer.length).toBeLessThan(500000);
   const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   for(let c=0;c<10;c++){
    const rect=WORKFACE_CROPS[atlas as keyof typeof WORKFACE_CROPS][c]!;
    const x0=rect.x,x1=rect.x+rect.width,y0=rect.y,y1=rect.y+rect.height;
    expect(x1).toBeLessThanOrEqual(info.width);expect(y1).toBeLessThanOrEqual(info.height);
    let minX=x1,minY=y1,maxX=x0,maxY=y0,painted=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*info.width+x)*4+3]!>32){painted++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    expect(painted).toBeGreaterThan(1000);expect(minX-x0).toBeGreaterThan(0);expect(minY-y0).toBeGreaterThan(0);expect(x1-maxX).toBeGreaterThan(0);expect(y1-maxY).toBeGreaterThan(0);
   }
  }
 });
});

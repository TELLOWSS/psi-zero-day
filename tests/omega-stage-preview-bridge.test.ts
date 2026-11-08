import {describe,it,expect,vi} from 'vitest';
import {OMEGA_DIRECTIONS} from '../src/ui/omega-operator-motion';
import {omegaTechnicalFramePlacement,drawOmegaTechnicalPreview} from '../src/ui/omega-stage-preview-bridge';

describe('OMEGA technical actor bridge — NOT the live Watch actor',()=>{
 it('addresses exactly 48 source rectangles for desktop and mobile without overshooting',()=>{
  for(const profile of ['mobile','desktop'] as const){
   const size=profile==='mobile'?192:384;
   const all=new Set<string>();
   for(let direction=0;direction<8;direction++)for(let frame=0;frame<6;frame++){
    const pose=omegaTechnicalFramePlacement({x:480,y:420},direction*Math.PI/4,frame/12,200,profile);
    expect(pose.source).toEqual({x:direction*size,y:frame*(size*4/3),width:size,height:size*4/3});
    expect(pose.frameCell).toBe(profile);
    expect(pose.facing).toBe(OMEGA_DIRECTIONS[direction]);
    expect(pose.frame).toBe(frame);
    expect(pose.playable).toBe(false);
    expect(pose.artStatus).toBe('TECHNICAL_PREVIEW_ONLY');
    all.add(pose.source.x+':'+pose.source.y);
   }
   expect(all.size).toBe(48);
  }
 });
 it('projects grounded contact points and physical radio to deterministic world coordinates',()=>{
  const pos={x:305,y:381},p=omegaTechnicalFramePlacement(pos,7*Math.PI/4,0,200);
  expect(p.facing).toBe('NE');
  expect(p.destination.width).toBe(150);
  expect(p.destination.x).toBe(230);
  expect(p.standing.left).toBe(true);
  expect(p.standing.right).toBe(true);
  expect(p.sockets.leftFoot.y).toBeCloseTo(pos.y,5);
  expect(p.sockets.rightFoot.y).toBeCloseTo(pos.y,5);
  expect(p.sockets.radio.x).toBeGreaterThan(pos.x);
  expect(p.sockets.weaponMuzzle.x).toBeGreaterThan(pos.x);
 });
 it('stays finite for reduced motion and rejects invalid dimensions or positions',()=>{
  const p=omegaTechnicalFramePlacement({x:0,y:0},Math.PI/2,800,90,'mobile',true);
  expect(p.frame).toBe(0);
  expect(p.facing).toBe('S');
  expect(()=>omegaTechnicalFramePlacement({x:Number.NaN,y:0},0,0,70)).toThrow(RangeError);
  expect(()=>omegaTechnicalFramePlacement({x:0,y:0},0,0,0)).toThrow(RangeError);
  expect(()=>omegaTechnicalFramePlacement({x:0,y:0},0,0,4000)).toThrow(RangeError);
 });
 it('draws the exact sprite cell with optional socket marker overlays, not combat',()=>{
  const drawImage=vi.fn(),arc=vi.fn(),stroke=vi.fn(),ctx={
   drawImage,arc,stroke,beginPath:vi.fn(),save:vi.fn(),restore:vi.fn(),
   lineWidth:1,strokeStyle:'#fff',
  } as unknown as CanvasRenderingContext2D;
  const profile=omegaTechnicalFramePlacement({x:300,y:340},0,0,100,'mobile');
  const img={naturalWidth:1536,naturalHeight:1536} as HTMLImageElement;
  expect(drawOmegaTechnicalPreview(ctx,img,profile,{socketOverlay:true,footOverlay:true})).toBe(true);
  expect(drawImage).toHaveBeenCalledOnce();
  expect(arc).toHaveBeenCalledTimes(5);
  expect(stroke).toHaveBeenCalledTimes(5);
  expect(drawOmegaTechnicalPreview(ctx,{naturalWidth:0,naturalHeight:0} as HTMLImageElement,profile)).toBe(false);
 });
});

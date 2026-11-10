import type {OmegaActorView} from './omega-protocol-actor-render';
import type {OmegaZombieBrain} from '../domain/omega-protocol-zombie-ai';
import type {Hazard} from '../domain/patrol-survivors';

/**
 * M12-G5 FIRST PROTOTYPE: six separate original authored vector key poses.
 * Four SILVER E WALK sources + two drifter-infected locomotion sources.
 * These are preliminary original vector drafts, NOT 160/320 artist-approved
 * production sources and NOT source derivatives disguised as final art.
 * Existing SHA-pinned original eight neutral silver WebPs remain intact.
 */
export const OMEGA_G5_SOURCE_ART={
 silverEast:[
  '/assets/omega/g5/silver-east-walk-0.svg',
  '/assets/omega/g5/silver-east-walk-1.svg',
  '/assets/omega/g5/silver-east-walk-2.svg',
  '/assets/omega/g5/silver-east-walk-3.svg',
 ] as const,
 infectedDrifter:[
  '/assets/omega/g5/drifter-step-0.svg',
  '/assets/omega/g5/drifter-step-1.svg',
 ] as const,
 productionApproved:false,
 approved160FrameCount:0,
 approved320MaskCount:0,
} as const;
export type OmegaG5FrameGroup='silverEast'|'infectedDrifter';
export function omegaG5DevRequested(search:string,enabled:boolean):boolean {
 if(!enabled)return false;
 const p=new URLSearchParams(search);
 return p.get('omegaLab')==='1'&&p.get('omegaM12G5')==='1'&&
  !p.has('omegaSilverPreview')&&!p.has('omegaM12G4');
}
export const OMEGA_G5_REVIEW_URL='/?omegaLab=1&omegaM12G5=1' as const;
export function omegaG5EFrameIndex(phase:number):0|1|2|3 {
 if(!Number.isFinite(phase))return 0;
 return Math.min(3,Math.floor(((phase%1+1)%1)*4)) as 0|1|2|3;
}
/** Never advance infected walk only due to wall-clock time if its real
 * collision-corrected Watch world position is not changing. */
export function omegaG5DrifterPoseAt(h:Pick<Hazard,'x'|'y'>):0|1 {
 if(!Number.isFinite(h.x)||!Number.isFinite(h.y))return 0;
 return ((Math.floor(Math.abs(h.x*.83+h.y*.41)/24)%2) as 0|1);
}
type Cached={image:HTMLImageElement;state:'loading'|'ready'|'failed'};
export class OmegaG5DraftImageCache{
 private readonly images=new Map<string,Cached>();
 prepare():void{
  if(typeof Image==='undefined')return;
  for(const path of [...OMEGA_G5_SOURCE_ART.silverEast,...OMEGA_G5_SOURCE_ART.infectedDrifter])
   this.get(path);
 }
 private get(path:string):Cached|null {
  if(typeof Image==='undefined')return null;
  const prev=this.images.get(path);
  if(prev)return prev;
  const image=new Image();image.decoding='async';
  const cached:Cached={image,state:'loading'};
  this.images.set(path,cached);
  const valid=()=>image.naturalWidth===384&&image.naturalHeight===512;
  image.onload=()=>{cached.state=valid()?'ready':'failed';};
  image.onerror=()=>{cached.state='failed';};
  image.src=path;
  if(image.complete)cached.state=valid()?'ready':'failed';
  return cached;
 }
 status():Readonly<Record<OmegaG5FrameGroup,number>>{
  return {
   silverEast:OMEGA_G5_SOURCE_ART.silverEast.filter(p=>this.images.get(p)?.state==='ready').length,
   infectedDrifter:OMEGA_G5_SOURCE_ART.infectedDrifter.filter(p=>this.images.get(p)?.state==='ready').length,
  };
 }
 drawSilverE(ctx:CanvasRenderingContext2D,view:OmegaActorView,height:number):boolean{
  const gait=view.gait;
  if(!gait?.active||view.shooting||view.dashing||view.hurt||view.ultimate||view.finished||
   view.facingX<=0||Math.abs(view.facingY)>view.facingX*.42||
   !Number.isFinite(gait.phase)||!Number.isFinite(height)||height<=0)return false;
  const index=omegaG5EFrameIndex(gait.phase);
  const cached=this.get(OMEGA_G5_SOURCE_ART.silverEast[index]);
  if(cached?.state!=='ready')return false;
  const w=height*384/512;
  ctx.drawImage(cached.image,-w/2,-height*470/512,w,height);
  return true;
 }
 drawDrifter(ctx:CanvasRenderingContext2D,h:Hazard,brain:OmegaZombieBrain|undefined):boolean{
  if(!brain||brain.kind!=='drifter'||h.hp<=0||h.type!=='UNHELMETED')return false;
  const index=brain.phase==='pursue'?omegaG5DrifterPoseAt(h):0;
  const cached=this.get(OMEGA_G5_SOURCE_ART.infectedDrifter[index]);
  if(cached?.state!=='ready')return false;
  const height=91,width=height*384/512;
  // Source authoring boots at 470 of 512: same physical Watch origin.
  ctx.drawImage(cached.image,-width/2,-height*470/512,width,height);
  return true;
 }
}
export const omegaG5Art=new OmegaG5DraftImageCache();

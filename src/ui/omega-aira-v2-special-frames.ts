import type {OmegaActorView,OmegaHeading} from './omega-protocol-actor-render';

/**
 * AIRA V2 E-facing CINEMATIC STUDY from the user's selected animation sheet:
 * 3 genuinely different ultimate key poses + 2 finisher illustrations.
 * The images are source-rendered motion references, NOT a 160-frame
 * commercially approved character animation or 320 layered masks.
 *
 * Keep this one-direction-only to avoid faking seven unfinished headings.
 * Nothing here changes Watch ultimate duration, combat rewards or hitboxes.
 */
export type OmegaAiraSpecialAction='ultimate'|'finish';
interface OmegaSpecialSheet {
 readonly path:string;
 readonly count:2|3;
 readonly cellWidth:number;
 readonly cellHeight:240;
 readonly bootLine:228;
 readonly atlasWidth:number;
 readonly atlasHeight:240;
 readonly svgSha256:string;
 readonly webpSha256:string;
 readonly binaryPresent:true;
 readonly productionApproved:false;
}
export const OMEGA_AIRA_E_SPECIAL_ART:Readonly<Record<OmegaAiraSpecialAction,OmegaSpecialSheet>>={
 ultimate:{
  path:'/assets/omega/aira-v2/e-ultimate-3key-atlas.svg',
  count:3,cellWidth:320,cellHeight:240,bootLine:228,
  atlasWidth:960,atlasHeight:240,
  webpSha256:'35a598c5b94359f5f2088437a4ae453769685980e5d3e06d9d680421250e6a6a',
  svgSha256:'a4eff32520ea38066c24376cca2dc3798bbe426499837f7b1f45487adc1bd03d',
  binaryPresent:true,productionApproved:false,
 },
 finish:{
  path:'/assets/omega/aira-v2/e-finish-2key-atlas.svg',
  count:2,cellWidth:580,cellHeight:240,bootLine:228,
  atlasWidth:1160,atlasHeight:240,
  webpSha256:'4179e2e0e49dde8a33e3614c6bba5ff57228ec8ec2bacfbe794e9d859487bcd4',
  svgSha256:'d42ac751dab5680c5f959df81dab0369cf6e7af740959f078689d3cf4cf5fea4',
  binaryPresent:true,productionApproved:false,
 },
};
export const OMEGA_AIRA_SPECIAL_DURATIONS:Readonly<Record<OmegaAiraSpecialAction,number>>={
 ultimate:2,finish:1,
};
export function omegaAiraSpecialFrameAt(
 action:OmegaAiraSpecialAction,seconds:number,
):0|1|2 {
 if(!Number.isFinite(seconds)||seconds<0)return 0;
 if(action==='finish')return seconds<.42?0:1;
 if(seconds<.55)return 0;
 if(seconds<1.27)return 1;
 return 2;
}
export function omegaAiraSpecialSourceRect(
 action:OmegaAiraSpecialAction,frame:0|1|2,height:number,
):Readonly<{sx:number;sy:number;sw:number;sh:number;dx:number;dy:number;dw:number;dh:number}>{
 if(!Number.isFinite(height)||height<=0)throw new RangeError('Invalid special source display height');
 const sheet=OMEGA_AIRA_E_SPECIAL_ART[action];
 if(frame>=sheet.count)throw new RangeError('Invalid action frame index');
 const width=height*sheet.cellWidth/sheet.cellHeight;
 return {
  sx:frame*sheet.cellWidth,sy:0,sw:sheet.cellWidth,sh:sheet.cellHeight,
  dx:-width/2,dy:-height*sheet.bootLine/sheet.cellHeight,
  dw:width,dh:height,
 };
}
type Loaded={image:HTMLImageElement;status:'loading'|'ready'|'failed'};
export class OmegaAiraV2SpecialFrames{
 private readonly cache=new Map<OmegaAiraSpecialAction,Loaded>();
 prepare():void{
  if(typeof Image==='undefined')return;
  for(const action of ['ultimate','finish'] as const){
   if(this.cache.has(action)||!OMEGA_AIRA_E_SPECIAL_ART[action].binaryPresent)continue;
   const sheet=OMEGA_AIRA_E_SPECIAL_ART[action];
   const image=new Image();image.decoding='async';
   const record:Loaded={image,status:'loading'};
   this.cache.set(action,record);
   const valid=()=>image.naturalWidth===sheet.atlasWidth&&
    image.naturalHeight===sheet.atlasHeight;
   image.onload=()=>{record.status=valid()?'ready':'failed';};
   image.onerror=()=>{record.status='failed';};
   image.src=sheet.path;
   if(image.complete)record.status=valid()?'ready':'failed';
  }
 }
 ready(action:OmegaAiraSpecialAction):boolean{
  return this.cache.get(action)?.status==='ready';
 }
 /**
  * Boot pivot is tied to the real Watch player XY and E heading; no fabricated
  * energy effect in normal idle, premature ultimate, other headings or a
  * final victory without the real terminal completion state.
  */
 draw(ctx:CanvasRenderingContext2D,heading:OmegaHeading,
  view:OmegaActorView,height:number):OmegaAiraSpecialAction|false{
  if(heading!=='E'||!Number.isFinite(height)||height<=0)return false;
  const action:OmegaAiraSpecialAction|null=view.finished?'finish':
   view.ultimate?'ultimate':null;
  if(!action)return false;
  const entry=this.cache.get(action);
  if(!entry||entry.status!=='ready')return false;
  const age=view.actionAge;
  if(age===undefined||!Number.isFinite(age)||age<0||
    age>OMEGA_AIRA_SPECIAL_DURATIONS[action])return false;
  const frame=omegaAiraSpecialFrameAt(action,age);
  const r=omegaAiraSpecialSourceRect(action,frame,height);
  ctx.drawImage(entry.image,r.sx,r.sy,r.sw,r.sh,r.dx,r.dy,r.dw,r.dh);
  return action;
 }
}

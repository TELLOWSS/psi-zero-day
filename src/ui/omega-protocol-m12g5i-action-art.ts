import {omegaG5eCue,omegaG5eFx} from './omega-protocol-m12g5e-silver-action-fx';
import {OMEGA_G5D_ACTUAL_E_WALK} from './omega-protocol-m12g5d-actual-source';
import {omegaG5gCoreSilhouetteDifference} from './omega-protocol-m12g5g-native-pose';
import type {OmegaActorView} from './omega-protocol-actor-render';

/**
 * M12-G5i: strict, local, opt-in audition of actual NEW E FIRE/DASH/HIT
 * source paintings in the Watch/OMEGA Canvas. This module MAKES NO ART.
 * A correctly named WebP or a different SHA does not demonstrate independent
 * painting; HUMAN visual comparison and final release approval are separate.
 * No file persistence, cloud upload, external API or gameplay-state mutation.
 */
export const OMEGA_G5I_ART_GATE={
 candidateActionFilesCommittedToRepo:0,
 independentlyPaintedActionFramesApproved:0,
 independentlyPaintedInfectedFramesApproved:0,
 final160FramesApproved:0,final320MasksApproved:0,
 humanArtworkSignoff:false,commercialReleaseAllowed:false,
 automaticHeroReplacement:false,
} as const;
export const OMEGA_G5I_ACTIONS=['fire','dash','hit'] as const;
export type OmegaG5iAction=typeof OMEGA_G5I_ACTIONS[number];
export const OMEGA_G5I_FILE_NAMES=OMEGA_G5I_ACTIONS.flatMap(action=>
 Array.from({length:4},(_,i)=>'aira-east-'+action+'-'+i+'.webp'));
export const OMEGA_G5I_REQUIRED_FILE_COUNT=12;
const originalWalkDigests=new Set<string>(OMEGA_G5D_ACTUAL_E_WALK.map(x=>x.sha256));
const looksLikeSha256=(s:string):boolean=>/^[0-9a-f]{64}$/.test(s);
const isAction=(s:string):s is OmegaG5iAction=>
 (OMEGA_G5I_ACTIONS as readonly string[]).includes(s);
export function omegaG5iLabRequested(query:string,isDev:boolean):boolean{
 if(!isDev)return false;
 const q=new URLSearchParams(query);
 return q.get('omegaLab')==='1'&&q.get('omegaM12G5i')==='1'&&
  !['omegaSilverPreview','omegaM12G4','omegaM12G5','omegaM12G5b',
   'omegaM12G5c','omegaM12G5d','omegaM12G5e','omegaM12G5g',
   'omegaM12G5h','omegaG5VectorStudy'].some(x=>q.has(x));
}
export function omegaG5iFileSelectionValid(
 files:readonly Pick<File,'name'|'size'|'type'>[],
):boolean{
 const names=new Set(files.map(f=>f.name));
 return files.length===OMEGA_G5I_REQUIRED_FILE_COUNT&&names.size===12&&
  OMEGA_G5I_FILE_NAMES.every(name=>names.has(name))&&
  files.every(f=>f.type==='image/webp'&&f.size>=8192&&f.size<=8_000_000);
}
export function omegaG5iSourceHashesValid(hashes:readonly string[]):boolean{
 return hashes.length===12&&new Set(hashes).size===12&&
  hashes.every(s=>looksLikeSha256(s)&&!originalWalkDigests.has(s));
}
export interface OmegaG5iFrameProof{
 readonly file:string;readonly sha256:string;
 readonly width:384;readonly height:512;readonly toeRow:number;
 readonly opaqueFraction:number;
}
export interface OmegaG5iArtProof{
 readonly status:'DEV_ONLY_HUMAN_PAINTING_REVIEW_REQUIRED';
 readonly frames:readonly OmegaG5iFrameProof[];
 readonly minCoreSilhouetteChange:Readonly<Record<OmegaG5iAction,number>>;
 readonly crossActionCoreChange:readonly number[];
 readonly independentPaintingProven:false;
 readonly humanArtworkSignoff:false;
 readonly commercialReleaseAllowed:false;
}
export function omegaG5iGeometryAudit(pixels:readonly Uint8ClampedArray[]):
 Readonly<{minimumPerAction:Readonly<Record<OmegaG5iAction,number>>;
 crossAction:readonly number[];candidateGeometryEligible:boolean}>{
 const empty={fire:0,dash:0,hit:0};
 if(pixels.length!==12||pixels.some(x=>x.length!==384*512*4))
  return {minimumPerAction:empty,crossAction:[],candidateGeometryEligible:false};
 const minimumPerAction:Record<OmegaG5iAction,number>={fire:0,dash:0,hit:0};
 for(let a=0;a<3;a++){
  const scores:number[]=[];
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)
   scores.push(omegaG5gCoreSilhouetteDifference(pixels[a*4+i]!,pixels[a*4+j]!));
  minimumPerAction[OMEGA_G5I_ACTIONS[a]!]=Math.min(...scores);
 }
 const crossAction:number[]=[];
 for(let frame=0;frame<4;frame++){
  crossAction.push(omegaG5gCoreSilhouetteDifference(pixels[frame]!,pixels[4+frame]!));
  crossAction.push(omegaG5gCoreSilhouetteDifference(pixels[frame]!,pixels[8+frame]!));
  crossAction.push(omegaG5gCoreSilhouetteDifference(pixels[4+frame]!,pixels[8+frame]!));
 }
 const candidateGeometryEligible=
  OMEGA_G5I_ACTIONS.every(a=>minimumPerAction[a]>=.10)&&
  crossAction.every(x=>x>=.10);
 return {minimumPerAction,crossAction,candidateGeometryEligible};
}
export function omegaG5iInspectPixelAlpha(pixels:Uint8ClampedArray):Readonly<{opaqueFraction:number;toeRow:number}>{
 if(pixels.length!==384*512*4)throw Error('G5i requires decoded RGBA 384x512');
 let opaque=0,minY=512,maxY=-1;
 for(let p=0;p<384*512;p++){
  if(pixels[p*4+3]!<64)continue;
  opaque++;
  const y=Math.floor(p/384);
  minY=Math.min(minY,y);maxY=Math.max(maxY,y);
 }
 const opaqueFraction=opaque/(384*512);
 const height=maxY-minY+1;
 if(opaqueFraction<.12||opaqueFraction>.70||minY>110||maxY<455||
    maxY-minY<345)throw Error(
     `알파 실루엣 기준 미달 (불투명 ${(opaqueFraction*100).toFixed(1)}%, 상단 ${minY}, 하단 ${maxY}, 높이 ${height}px). 낮은 자세·발 위치는 별도 시각 검수가 필요합니다.`);
 // This is the last opaque pixel, not proof that it belongs to a boot.
 return {opaqueFraction,toeRow:maxY};
}
function rgba(image:HTMLImageElement):Uint8ClampedArray{
 const surface=document.createElement('canvas');
 surface.width=384;surface.height=512;
 const ctx=surface.getContext('2d',{willReadFrequently:true});
 if(!ctx)throw Error('Canvas pixel inspection unavailable');
 ctx.drawImage(image,0,0,384,512);
 return ctx.getImageData(0,0,384,512).data;
}
async function digest(bytes:ArrayBuffer):Promise<string>{
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
}
type Anchor={x:number;y:number};
export interface OmegaWideFrame {file:string;sha256:string;foot:Anchor;muzzle:Anchor}
export function omegaWideManifest(value:unknown):OmegaWideFrame[]{
 if(!value||typeof value!=='object')throw Error('앵커 JSON 형식 오류');
 const doc=value as {version?:unknown;frames?:unknown};
 if(doc.version!==1||!Array.isArray(doc.frames)||doc.frames.length!==12)throw Error('앵커 JSON은 version 1과 12개 프레임이 필요합니다');
 const rows=doc.frames as OmegaWideFrame[];
 if(new Set(rows.map(x=>x?.file)).size!==12||!OMEGA_G5I_FILE_NAMES.every(n=>rows.some(x=>x?.file===n)))throw Error('앵커 파일명 불일치');
 for(const row of rows){
  if(!looksLikeSha256(row.sha256)||![row.foot,row.muzzle].every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<640&&p.y>=0&&p.y<512))throw Error('SHA 또는 앵커 좌표 오류: '+row.file);
 }
 return OMEGA_G5I_FILE_NAMES.map(n=>rows.find(x=>x.file===n)!);
}
export function omegaWideAlphaValid(pixels:Uint8ClampedArray):boolean{
 if(pixels.length!==640*512*4)return false;
 let opaque=0;
 for(let y=0;y<512;y++)for(let x=0;x<640;x++)if(pixels[(y*640+x)*4+3]!>=64){
  if(x===0||x===639||y===0||y===511)return false;
  opaque++;
 }
 return opaque>=640*512*.04&&opaque<=640*512*.70;
}
export function omegaWidePlacement(frame:OmegaWideFrame,height:number){
 const scale=height/512;
 return {left:-frame.foot.x*scale,top:-frame.foot.y*scale,width:640*scale,height,
  muzzleX:(frame.muzzle.x-frame.foot.x)*scale,muzzleY:(frame.muzzle.y-frame.foot.y)*scale};
}
/** Presentation only: use the native visible action windows, not G5e's
 * longer effect windows. No action state or gameplay timer is extended. */
export function omegaWideNativeFrame(action:OmegaG5iAction,age:number):0|1|2|3{
 const duration=action==='fire'?.09:action==='dash'?.22:.15;
 const elapsed=Number.isFinite(age)?Math.max(0,age):0;
 return Math.min(3,Math.floor(elapsed/duration*4)) as 0|1|2|3;
}
interface VerifiedAction{readonly image:HTMLImageElement;readonly url:string;readonly toeRow:number;readonly wide?:OmegaWideFrame}
export class OmegaG5iLocalActionArtPreview {
 private sources:VerifiedAction[]=[];
 private proof:OmegaG5iArtProof|null=null;
 private selected=false;
 private generation=0;
 private counts:Record<OmegaG5iAction,number>={fire:0,dash:0,hit:0};
 private frames:Record<OmegaG5iAction,Set<number>>={fire:new Set(),dash:new Set(),hit:new Set()};
 get ready():boolean{return this.sources.length===12&&this.proof!==null;}
 get active():boolean{return this.selected&&this.ready;}
 get audit():OmegaG5iArtProof|null{return this.proof;}
 evidence(){return {counts:{...this.counts},frames:{
  fire:[...this.frames.fire].sort(),dash:[...this.frames.dash].sort(),
  hit:[...this.frames.hit].sort(),
 },humanArtworkSignoff:false};}
 activate(next:boolean):boolean{this.selected=next&&this.ready;return this.selected;}
 dispose():void{
  this.generation++;this.selected=false;
  this.sources.forEach(s=>URL.revokeObjectURL(s.url));
  this.sources=[];this.proof=null;
  this.counts={fire:0,dash:0,hit:0};
  for(const s of Object.values(this.frames))s.clear();
 }
 async import(files:readonly File[]):Promise<OmegaG5iArtProof>{
  this.dispose();
  if(!omegaG5iFileSelectionValid(files))
   throw Error('E FIRE/DASH/HIT 각각 0~3, 투명 WebP 384×512 총 12개를 선택하세요');
  const epoch=this.generation;
  const byName=new Map(files.map(f=>[f.name,f]));
  const temporary:VerifiedAction[]=[];
  const proofs:OmegaG5iFrameProof[]=[];
  const allPixels:Uint8ClampedArray[]=[];
  try{
   for(const name of OMEGA_G5I_FILE_NAMES){
    const input=byName.get(name)!;
    const data=await input.arrayBuffer();
    const hash=await digest(data);
    if(originalWalkDigests.has(hash))
     throw Error('Existing G5d WALK source reused as a new combat painting: '+name);
    const url=URL.createObjectURL(new Blob([data],{type:'image/webp'}));
    const image=new Image();image.decoding='async';image.src=url;
    temporary.push({image,url,toeRow:511});
    await image.decode();
    if(image.naturalWidth!==384||image.naturalHeight!==512)
     throw Error('Expected 384×512 transparent authored frame: '+name);
    const pixels=rgba(image);
    let quality:ReturnType<typeof omegaG5iInspectPixelAlpha>;
    try{quality=omegaG5iInspectPixelAlpha(pixels);}
    catch(error){throw Error(name+': '+(error instanceof Error?error.message:'알파 검사 실패'));}
    temporary[temporary.length-1]={image,url,toeRow:quality.toeRow};
    proofs.push({file:name,sha256:hash,width:384,height:512,
     toeRow:quality.toeRow,opaqueFraction:quality.opaqueFraction});
    allPixels.push(pixels);
   }
   if(!omegaG5iSourceHashesValid(proofs.map(p=>p.sha256)))
    throw Error('Duplicate SHA-256 or known source walk image: independent artwork unverified');
   const geometry=omegaG5iGeometryAudit(allPixels);
   if(!geometry.candidateGeometryEligible)
    throw Error('Action character silhouettes are too similar: repaint poses, not light effects');
   if(epoch!==this.generation)throw Error('Superseded G5i import');
   this.sources=temporary.splice(0);
   this.proof={status:'DEV_ONLY_HUMAN_PAINTING_REVIEW_REQUIRED',
    frames:proofs,minCoreSilhouetteChange:geometry.minimumPerAction,
    crossActionCoreChange:geometry.crossAction,
    independentPaintingProven:false,humanArtworkSignoff:false,
    commercialReleaseAllowed:false};
   return this.proof;
  }catch(error){
   temporary.forEach(s=>URL.revokeObjectURL(s.url));
   throw error;
  }
 }
 async importWide(files:readonly File[],manifest:unknown):Promise<void>{
  this.dispose();
  if(!omegaG5iFileSelectionValid(files))throw Error('이름이 정확한 WebP 12개가 필요합니다');
  const entries=omegaWideManifest(manifest),epoch=this.generation;
  const byName=new Map(files.map(f=>[f.name,f])),temporary:VerifiedAction[]=[],hashes:string[]=[];
  try{
   for(const entry of entries){
    const data=await byName.get(entry.file)!.arrayBuffer(),hash=await digest(data);
    if(hash!==entry.sha256)throw Error('SHA 불일치: '+entry.file);
    hashes.push(hash);
    const url=URL.createObjectURL(new Blob([data],{type:'image/webp'}));
    const image=new Image();image.decoding='async';image.src=url;
    temporary.push({image,url,toeRow:0,wide:entry});await image.decode();
    if(image.naturalWidth!==640||image.naturalHeight!==512)throw Error('640×512 필요: '+entry.file);
    const c=document.createElement('canvas');c.width=640;c.height=512;const ctx=c.getContext('2d',{willReadFrequently:true});
    if(!ctx)throw Error('Canvas 검사 불가');
    ctx.drawImage(image,0,0);if(!omegaWideAlphaValid(ctx.getImageData(0,0,640,512).data))throw Error('투명도 또는 가장자리 잘림: '+entry.file);
   }
   if(!omegaG5iSourceHashesValid(hashes))throw Error('중복 또는 기존 걷기 원화');
   if(epoch!==this.generation)throw Error('검수 취소됨');
   this.sources=temporary.splice(0);
   // This proof deliberately does not imply that geometry or art is approved.
   this.proof={status:'DEV_ONLY_HUMAN_PAINTING_REVIEW_REQUIRED',frames:[],minCoreSilhouetteChange:{fire:0,dash:0,hit:0},crossActionCoreChange:[],independentPaintingProven:false,humanArtworkSignoff:false,commercialReleaseAllowed:false};
  }catch(error){temporary.forEach(s=>URL.revokeObjectURL(s.url));throw error;}
 }
 draw(ctx:CanvasRenderingContext2D,view:OmegaActorView,height:number):boolean{
  if(!this.active)return false;
  const cue=omegaG5eCue(view,height);
  if(!cue||!isAction(cue.action))return false;
  const group=OMEGA_G5I_ACTIONS.indexOf(cue.action);
  const wide=this.sources[group*4]?.wide;
  const frame=wide?omegaWideNativeFrame(cue.action,view.actionAge??0):cue.frame;
  const source=this.sources[group*4+frame];
  if(!source)return false;
  if(source.wide){
   const p=omegaWidePlacement(source.wide,height);
   ctx.save();ctx.drawImage(source.image,p.left,p.top,p.width,p.height);
   if(cue.action==='fire'){
    ctx.fillStyle='rgba(230,180,255,.85)';ctx.beginPath();ctx.arc(p.muzzleX,p.muzzleY,Math.max(2,height*.035),0,Math.PI*2);ctx.fill();
   }
   ctx.restore();this.counts[cue.action]++;this.frames[cue.action].add(frame);return true;
  }
  // Native Watch actor (0,0) is the sole world-foot pivot. Source transparent
  // bottom margins must not lift painted boots above the collision floor.
  ctx.save();ctx.translate(0,height*(512-source.toeRow)/512);
  let drawn=false;
  try{drawn=omegaG5eFx.draw(ctx,source.image,view,height);}
  finally{ctx.restore();}
  if(drawn){
   this.counts[cue.action]++;
   this.frames[cue.action].add(cue.frame);
  }
  return drawn;
 }
}
export const omegaG5iActionPreview=new OmegaG5iLocalActionArtPreview();

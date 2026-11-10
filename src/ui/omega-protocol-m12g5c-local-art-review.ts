import {omegaFieldHeading,type OmegaActorView} from './omega-protocol-actor-render';
import {omegaG5EFrameIndex} from './omega-protocol-m12-g5-art';

/**
 * M12-G5c local, SESSION-ONLY, verified WebP review. This is NOT an asset
 * generator, nor a claim that 4 independent painterly WALK paintings exist.
 * Explicit artist review and the global 160/320 gate remain BLOCKED.
 */
export const OMEGA_G5C_ORIGINAL_E_SHA256=
 '6f12fdc0f45f3fcb977d8377e49ad0dd5e37fbd519d6c3a3beede11dffdebe08' as const;
export const OMEGA_G5C_FILE_NAMES=[
 'aira-east-walk-0.webp','aira-east-walk-1.webp',
 'aira-east-walk-2.webp','aira-east-walk-3.webp',
] as const;
export const OMEGA_G5C_ART_POLICY={
 status:'AWAITING_FOUR_INDEPENDENT_PAINTED_WEBPS',
 previewOnly:true,finalSourceFramesApproved:0,finalMasksApproved:0,
 productionApproved:false, mayReplaceDefaultArt:false,
} as const;

export function omegaG5cLabRequested(search:string,dev:boolean):boolean{
 if(!dev)return false;
 const p=new URLSearchParams(search);
 return p.get('omegaLab')==='1'&&p.get('omegaM12G5c')==='1'&&
  !['omegaSilverPreview','omegaM12G4','omegaM12G5','omegaM12G5b',
    'omegaG5VectorStudy'].some(k=>p.has(k));
}
export interface OmegaG5cSourceProof{
 readonly file:string;readonly sha256:string;readonly width:384;
 readonly height:512;readonly alphaFraction:number;
 readonly silhouetteHeight:number;readonly toeRow:number;
}
export interface OmegaG5cReviewProof{
 readonly status:'SESSION_PREVIEW_ONLY_NOT_ART_APPROVED';
 readonly assets:readonly OmegaG5cSourceProof[];
 readonly changedPixelFraction:readonly number[];
 readonly originalEastSha256:typeof OMEGA_G5C_ORIGINAL_E_SHA256;
 readonly independentPaintedArtVerified:false;
 readonly artworkSignoff:false;
}
interface ReviewImage{readonly image:HTMLImageElement;readonly url:string}
const sha=/^[a-f0-9]{64}$/;
export function omegaG5cSelectionCheck(files:readonly Pick<File,'name'|'size'|'type'>[]):boolean{
 return files.length===4&&new Set(files.map(x=>x.name)).size===4&&
  files.every(x=>OMEGA_G5C_FILE_NAMES.includes(x.name as typeof OMEGA_G5C_FILE_NAMES[number])&&
    x.type==='image/webp'&&x.size>4096&&x.size<=6_000_000);
}
export function omegaG5cHashSelectionCheck(hashes:readonly string[],originalHash:string):boolean{
 return hashes.length===4&&sha.test(originalHash)&&
  hashes.every(h=>sha.test(h)&&h!==originalHash)&&new Set(hashes).size===4;
}
export function omegaG5cPixelsChanged(
 a:Uint8ClampedArray,b:Uint8ClampedArray,
):number{
 if(a.length!==b.length||a.length===0||a.length%4!==0)return 0;
 let diff=0;for(let i=0;i<a.length;i+=4){
  if(Math.abs(a[i]!-b[i]!)+Math.abs(a[i+1]!-b[i+1]!)+
   Math.abs(a[i+2]!-b[i+2]!)+Math.abs(a[i+3]!-b[i+3]!)>96)diff++;
 }
 return diff/(a.length/4);
}
export function omegaG5cPixelProof(pixels:Uint8ClampedArray):Readonly<{
 alphaFraction:number; silhouetteHeight:number;toeRow:number;
}>{
 if(pixels.length!==384*512*4)throw new Error('Frame must be RGBA 384x512');
 let opaque=0,minY=512,maxY=-1;
 for(let p=0;p<384*512;p++){
  const a=pixels[p*4+3]!;
  if(a>=64){opaque++;const y=Math.floor(p/384);
   if(y<minY)minY=y;if(y>maxY)maxY=y;}
 }
 const alphaFraction=opaque/(384*512),silhouetteHeight=maxY-minY+1;
 if(alphaFraction<.13||alphaFraction>.64||minY>75||maxY<480||
   silhouetteHeight<400)throw Error('Invalid original character alpha/boot shape');
 return {alphaFraction,silhouetteHeight,toeRow:maxY};
}
async function fileSha256(bytes:ArrayBuffer):Promise<string>{
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function readPixels(image:HTMLImageElement):Uint8ClampedArray{
 const canvas=document.createElement('canvas');
 canvas.width=384;canvas.height=512;
 const context=canvas.getContext('2d',{willReadFrequently:true});
 if(!context)throw Error('Secure canvas decoder unavailable');
 context.drawImage(image,0,0,384,512);
 return context.getImageData(0,0,384,512).data;
}
export class OmegaG5cLocalPainterlyReview{
 private images:ReviewImage[]=[];
 private approvedToPreview=false;
 private generation=0;
 private evidenceDraws=0;
 private framesSeen=new Set<number>();
 private proof:OmegaG5cReviewProof|null=null;
 get ready():boolean{return this.images.length===4&&this.proof!==null;}
 get active():boolean{return this.ready&&this.approvedToPreview;}
 get sessionProof():OmegaG5cReviewProof|null{return this.proof;}
 evidence(){return {draws:this.evidenceDraws,frames:[...this.framesSeen].sort()};}
 activate(enabled:boolean):boolean{
  this.approvedToPreview=enabled&&this.ready;
  return this.approvedToPreview;
 }
 dispose():void{
  this.generation++;
  for(const x of this.images)URL.revokeObjectURL(x.url);
  this.images=[];this.proof=null;this.approvedToPreview=false;
  this.evidenceDraws=0;this.framesSeen.clear();
 }
 /** All-or-nothing candidate import: no IndexedDB/server/production writes.
  * Pixel & SHA checks cannot replace a human visual/art-direction review.
  */
 async import(files:readonly File[]):Promise<OmegaG5cReviewProof>{
  this.dispose();
  if(!omegaG5cSelectionCheck(files))throw Error('Select four named transparent 384x512 WebP frames (0–3), max 6MB each');
  const generation=this.generation;
  const byName=new Map(files.map(f=>[f.name,f]));
  const frames:ReviewImage[]=[];
  const proofs:OmegaG5cSourceProof[]=[];
  const pixels:Uint8ClampedArray[]=[];
  try{
   for(const name of OMEGA_G5C_FILE_NAMES){
    const f=byName.get(name)!;
    const bytes=await f.arrayBuffer();
    const digest=await fileSha256(bytes);
    if(digest===OMEGA_G5C_ORIGINAL_E_SHA256)
     throw Error('Repeated neutral E source cannot count as independent walk art');
    const url=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));
    const image=new Image();image.decoding='async';image.src=url;
    frames.push({url,image});
    await image.decode();
    if(image.naturalWidth!==384||image.naturalHeight!==512)
     throw Error('Incorrect authored frame dimensions: '+name);
    const px=readPixels(image),quality=omegaG5cPixelProof(px);
    pixels.push(px);
    proofs.push({file:name,sha256:digest,width:384,height:512,
     alphaFraction:quality.alphaFraction,
     silhouetteHeight:quality.silhouetteHeight,toeRow:quality.toeRow});
   }
   if(!omegaG5cHashSelectionCheck(proofs.map(p=>p.sha256),OMEGA_G5C_ORIGINAL_E_SHA256))
    throw Error('Reused/duplicate/invalid keyframe SHA-256');
   // This rejects identically rendered sources even if metadata/encoding differs.
   const changed=pixels.map((px,i)=>
    omegaG5cPixelsChanged(px,pixels[(i+1)%4]!));
   if(changed.some(x=>x<.018))
    throw Error('Frames are visually identical or too similar to be distinct key poses');
   if(generation!==this.generation)throw Error('Art import superseded');
   this.images=frames.splice(0);this.approvedToPreview=false;
   this.proof={status:'SESSION_PREVIEW_ONLY_NOT_ART_APPROVED',
    assets:proofs,changedPixelFraction:changed,
    originalEastSha256:OMEGA_G5C_ORIGINAL_E_SHA256,
    independentPaintedArtVerified:false,artworkSignoff:false};
   return this.proof;
  }catch(e){
   for(const item of frames)URL.revokeObjectURL(item.url);
   throw e;
  }
 }
 draw(ctx:CanvasRenderingContext2D,view:OmegaActorView,height:number):boolean{
  if(!this.active||omegaFieldHeading(view.facingX,view.facingY)!=='E'||
   !view.gait?.active||view.shooting||view.dashing||view.hurt||
   view.ultimate||view.finished||
   !Number.isFinite(view.gait.phase)||!Number.isFinite(height)||height<=0)return false;
  const frame=omegaG5EFrameIndex(view.gait.phase),src=this.images[frame];
  if(!src)return false;
  const w=height*384/512;
  ctx.drawImage(src.image,-w/2,-height,w,height);
  this.evidenceDraws++;this.framesSeen.add(frame);
  return true;
 }
}
export const omegaG5cReview=new OmegaG5cLocalPainterlyReview();

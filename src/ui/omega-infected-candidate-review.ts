import type {Hazard} from '../domain/patrol-survivors';
import type {OmegaZombieBrain,OmegaZombieKind} from '../domain/omega-protocol-zombie-ai';

/** Session-only, opt-in art audition. This does not approve or ship artwork. */
const names=['basic','runner','armored','elite'] as const;
const mapping:Record<OmegaZombieKind,typeof names[number]>={drifter:'basic',sprinter:'runner',armored:'armored',stalker:'elite'};
export const OMEGA_INFECTED_FILES=names.flatMap(n=>Array.from({length:4},(_,i)=>`${n}-${i}.webp`));
export function omegaInfectedIsWebP(bytes:ArrayBuffer):boolean{
 const a=new Uint8Array(bytes);return a.length>=16&&String.fromCharCode(...a.subarray(0,4))==='RIFF'&&String.fromCharCode(...a.subarray(8,12))==='WEBP';
}
export function omegaInfectedLabRequested(query:string,dev:boolean):boolean{
 const q=new URLSearchParams(query);return dev&&q.get('omegaLab')==='1'&&q.get('omegaInfectedArtLab')==='1'&&
  !['omegaSilverPreview','omegaM12G4','omegaM12G5','omegaM12G5b','omegaM12G5c','omegaM12G5d','omegaM12G5e','omegaM12G5g','omegaM12G5h','omegaM12G5i','omegaG5VectorStudy'].some(k=>q.has(k));
}
/** A solo actor is available only in the explicit local zombie art fixture. */
export function omegaInfectedSoloKind(query:string,dev:boolean):OmegaZombieKind|null{
 const q=new URLSearchParams(query),kind=q.get('omegaInfectedSolo');
 if(!omegaInfectedLabRequested(query,dev)||q.get('omegaQaState')!=='zombieAI')return null;
 return kind==='drifter'||kind==='sprinter'||kind==='armored'||kind==='stalker'?kind:null;
}
interface Frame {file:string;sha256:string;foot:{x:number;y:number};referenceHeight:number}
export function omegaInfectedManifest(value:unknown):Frame[]{
 if(!value||typeof value!=='object')throw Error('감염체 앵커 JSON 오류');
 const doc=value as {version?:unknown;frames?:unknown};
 if(doc.version!==1||!Array.isArray(doc.frames)||doc.frames.length!==16)throw Error('version 1 프레임 16개 필요');
 const rows=doc.frames as Frame[];
 if(new Set(rows.map(r=>r?.file)).size!==16||!OMEGA_INFECTED_FILES.every(n=>rows.some(r=>r?.file===n)))throw Error('감염체 파일명 불일치');
 for(const r of rows){
  if(!/^[0-9a-f]{64}$/.test(r.sha256)||!r.foot||!Number.isFinite(r.foot.x)||!Number.isFinite(r.foot.y)||!Number.isFinite(r.referenceHeight)||r.referenceHeight<100||r.referenceHeight>2048)throw Error('감염체 SHA 또는 앵커 오류');
 }
 for(const n of names){const scales=rows.filter(r=>r.file.startsWith(n+'-')).map(r=>r.referenceHeight);if(new Set(scales).size!==1)throw Error('같은 종류의 스케일이 다릅니다: '+n);}
 return OMEGA_INFECTED_FILES.map(n=>rows.find(r=>r.file===n)!);
}
export function omegaInfectedPose(phase:OmegaZombieBrain['phase'],moved:boolean,time:number):0|1|2|3{
 if(phase==='warning'||phase==='charge')return 3;
 if(phase==='pursue'&&moved&&Number.isFinite(time))return Math.floor(time*4)%2===0?1:2;
 return 0;
}
export function omegaInfectedFacesLeft(brain:Pick<OmegaZombieBrain,'phase'|'lockedX'>,enemyX:number,targetX:number):boolean{
 return (brain.phase==='warning'||brain.phase==='charge')&&Math.abs(brain.lockedX)>.001?brain.lockedX<0:targetX<enemyX;
}
export interface OmegaInfectedReviewCard {
 readonly file:string;readonly imageUrl:string;
 readonly width:number;readonly height:number;readonly referenceHeight:number;
 readonly foot:Readonly<{x:number;y:number}>;
 readonly alphaBounds:Readonly<{minX:number;minY:number;maxX:number;maxY:number}>;
}
export function omegaInfectedVisibleBounds(pixels:Uint8ClampedArray,width:number,height:number):
 Readonly<{minX:number;minY:number;maxX:number;maxY:number}>|null{
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||
    pixels.length!==width*height*4)return null;
 let minX=width,minY=height,maxX=-1,maxY=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  if(pixels[(y*width+x)*4+3]!<64)continue;
  minX=Math.min(minX,x);minY=Math.min(minY,y);
  maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
 }
 return maxX<0?null:{minX,minY,maxX,maxY};
}
type Source={image:HTMLImageElement;url:string;meta:Frame;
 bounds?:Readonly<{minX:number;minY:number;maxX:number;maxY:number}>};
export class OmegaInfectedCandidateReview{
 private sources=new Map<string,Source>();private generation=0;private selected=false;
 private prior=new Map<string,{x:number;y:number;time:number;movingUntil:number}>();
 private draws:Record<OmegaZombieKind,number>={drifter:0,sprinter:0,armored:0,stalker:0};
 private poses:Record<OmegaZombieKind,Set<number>>={drifter:new Set(),sprinter:new Set(),armored:new Set(),stalker:new Set()};
 get ready(){return this.sources.size===16} get active(){return this.ready&&this.selected}
 /** The source image URL is session-scoped; nothing uploads to a server.
  * Foot points are manually supplied guesses, not certified ground contact. */
 reviewCards():readonly OmegaInfectedReviewCard[]{
  if(!this.ready)return [];
  return OMEGA_INFECTED_FILES.map(file=>{
   const source=this.sources.get(file)!;
   return {file,imageUrl:source.url,width:source.image.naturalWidth,
    height:source.image.naturalHeight,referenceHeight:source.meta.referenceHeight,
    foot:{...source.meta.foot},alphaBounds:{...source.bounds!}};
  });
 }
 activate(on:boolean){this.selected=on&&this.ready;return this.selected}
 evidence(){return {draws:{...this.draws},poses:Object.fromEntries(Object.entries(this.poses).map(([k,v])=>[k,[...v].sort()])),artApproved:false};}
 dispose(){this.generation++;this.selected=false;for(const s of this.sources.values())URL.revokeObjectURL(s.url);this.sources.clear();this.prior.clear();this.draws={drifter:0,sprinter:0,armored:0,stalker:0};for(const s of Object.values(this.poses))s.clear();}
 async import(files:readonly File[],manifest:unknown){
  this.dispose();const epoch=this.generation,rows=omegaInfectedManifest(manifest),byName=new Map(files.map(f=>[f.name,f]));
  if(files.length!==16||byName.size!==16||!OMEGA_INFECTED_FILES.every(n=>byName.has(n))||files.some(f=>f.type!=='image/webp'||f.size<8192||f.size>8_000_000))throw Error('이름이 정확한 WebP 16개 필요');
  const tmp:Source[]=[],hashes=new Set<string>();
  try{
   for(const meta of rows){
    const bytes=await byName.get(meta.file)!.arrayBuffer();if(!omegaInfectedIsWebP(bytes))throw Error('WebP 형식 오류: '+meta.file);const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
    if(hash!==meta.sha256||hashes.has(hash))throw Error('해시 불일치 또는 중복: '+meta.file);hashes.add(hash);
    const url=URL.createObjectURL(new Blob([bytes],{type:'image/webp'})),image=new Image();image.src=url;tmp.push({url,image,meta});await image.decode();
    const w=image.naturalWidth,h=image.naturalHeight;
    if(w<128||h<128||w>2048||h>2048||meta.foot.x<0||meta.foot.y<0||meta.foot.x>=w||meta.foot.y>=h)throw Error('크기 또는 앵커 범위 오류: '+meta.file);
    const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Canvas 검사 불가');ctx.drawImage(image,0,0);
    const a=ctx.getImageData(0,0,w,h).data;let ink=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(a[(y*w+x)*4+3]!>=64){if(x===0||y===0||x===w-1||y===h-1)throw Error('경계 잘림: '+meta.file);ink++;}
    if(ink<w*h*.02||ink>w*h*.7)throw Error('투명도 오류: '+meta.file);
    tmp[tmp.length-1]!.bounds=omegaInfectedVisibleBounds(a,w,h)??undefined;
   }
   if(epoch!==this.generation)throw Error('검수 취소됨');for(const s of tmp)this.sources.set(s.meta.file,s);
  }catch(e){for(const s of tmp)URL.revokeObjectURL(s.url);throw e;}
 }
 draw(ctx:CanvasRenderingContext2D,h:Hazard,brain:OmegaZombieBrain,time:number,targetX:number):boolean{
  if(!this.active||!Number.isFinite(time))return false;
  const id=h.id??`${brain.kind}:${brain.slot}`,previous=this.prior.get(id),old=previous&&time>=previous.time?previous:undefined,moved=Boolean(old&&Math.hypot(h.x-old.x,h.y-old.y)>.05);
  const movingUntil=moved?time+.12:(old?.movingUntil??0);this.prior.set(id,{x:h.x,y:h.y,time,movingUntil});
  const index=omegaInfectedPose(brain.phase,time<movingUntil,time),source=this.sources.get(`${mapping[brain.kind]}-${index}.webp`);if(!source)return false;
  const scale=76/source.meta.referenceHeight;ctx.save();if(omegaInfectedFacesLeft(brain,h.x,targetX))ctx.scale(-1,1);
  ctx.drawImage(source.image,-source.meta.foot.x*scale,-source.meta.foot.y*scale,source.image.naturalWidth*scale,source.image.naturalHeight*scale);ctx.restore();
  this.draws[brain.kind]++;this.poses[brain.kind].add(index);return true;
 }
}
export const omegaInfectedCandidateReview=new OmegaInfectedCandidateReview();

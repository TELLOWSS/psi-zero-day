import {OMEGA_DIRECTIONS,omegaFieldHeading,type OmegaActorView,type OmegaHeading}
 from './omega-protocol-actor-render';

/**
 * OMEGA v1 approved-art slot. All candidate images from PR #234 are intentionally
 * excluded. A build-pinned, audited, artist-approved manifest is required;
 * browser search params, user save data and app settings cannot unlock this.
 */
export type OmegaSpriteAction='walk'|'fire'|'dash'|'hit'|'ultimate'|'finish';
export const OMEGA_SPRITE_ACTIONS:readonly OmegaSpriteAction[]=[
 ...Array<OmegaSpriteAction>(6).fill('walk'),
 ...Array<OmegaSpriteAction>(3).fill('fire'),
 ...Array<OmegaSpriteAction>(3).fill('dash'),
 ...Array<OmegaSpriteAction>(3).fill('hit'),
 ...Array<OmegaSpriteAction>(3).fill('ultimate'),
 ...Array<OmegaSpriteAction>(2).fill('finish'),
];
export interface OmegaApprovedSpriteFrame{
 readonly action:OmegaSpriteAction;
 readonly actor:string;
 readonly rearMask:string;
 readonly frontMask:string;
 readonly actorSha256:string;
 readonly rearSha256:string;
 readonly frontSha256:string;
 readonly authoredUnmirrored:true;
}
export interface OmegaApprovedSpriteManifest{
 readonly identity:'AIRA_MASTER';
 readonly status:'ARTIST_APPROVED';
 readonly artistSignoff:string;
 readonly visualQa:'PASS';
 readonly combatQa:'PASS';
 readonly mobileDeviceQa:'PASS';
 readonly width:384;
 readonly height:512;
 readonly feetLine:454;
 readonly frames:Readonly<Record<OmegaHeading,readonly OmegaApprovedSpriteFrame[]>>;
}
/** LOCKED: no approved 160-frame / 320-mask binary pack in this branch.
 * Never replace these with concept candidate manifests or localStorage flags.
 */
export const OMEGA_PROTOCOL_APPROVED_ART:OmegaApprovedSpriteManifest|null=null;
export const OMEGA_PROTOCOL_BINARY_AUDIT_PASSED=false;

const sha256=/^[a-f\d]{64}$/i;
const localAsset=/^\/assets\/omega\/approved\/[a-z0-9_-]+\.(png|webp)$/i;
const accepted=(path:string)=>localAsset.test(path)&&!path.includes('..');
const isFrame=(frame:OmegaApprovedSpriteFrame|undefined,action:OmegaSpriteAction)=>{
 if(!frame||frame.action!==action||frame.authoredUnmirrored!==true)return false;
 const paths=[frame.actor,frame.rearMask,frame.frontMask];
 const hashes=[frame.actorSha256,frame.rearSha256,frame.frontSha256];
 return paths.every(accepted)&&new Set(paths).size===3&&
  hashes.every(value=>sha256.test(value));
};
const memo=new WeakMap<OmegaApprovedSpriteManifest,boolean>();
/** A WeakMap lookup must NEVER authorize a mutable manifest that was edited
 * after its previous pass (including edited hashes/signoff, or revoked QA).
 * Cache only a recursively frozen manifest; editable QA fixtures are rechecked.
 */
const immutable=(m:OmegaApprovedSpriteManifest):boolean=>
 Object.isFrozen(m)&&Object.isFrozen(m.frames)&&
 OMEGA_DIRECTIONS.every(h=>Array.isArray(m.frames[h])&&
  Object.isFrozen(m.frames[h])&&m.frames[h].every(f=>Object.isFrozen(f)));
/** Full-source contract check, memoized only for immutable build artifacts. */
export function omegaCanRenderApprovedArt(
 manifest:OmegaApprovedSpriteManifest|null,buildAudit:boolean,
):boolean{
 if(!manifest||buildAudit!==true||!manifest.frames||
  typeof manifest.artistSignoff!=='string')return false;
 const safeToCache=immutable(manifest);
 const prev=safeToCache?memo.get(manifest):undefined;
 if(prev!==undefined)return prev;
 const valid=manifest.identity==='AIRA_MASTER'&&
  manifest.status==='ARTIST_APPROVED'&&
  manifest.artistSignoff.trim().length>0&&
  manifest.visualQa==='PASS'&&manifest.combatQa==='PASS'&&
  manifest.mobileDeviceQa==='PASS'&&
  manifest.width===384&&manifest.height===512&&manifest.feetLine===454&&
  OMEGA_DIRECTIONS.every(heading=>{
   const frames=manifest.frames[heading];
   return Array.isArray(frames)&&frames.length===20&&
    frames.every((frame,i)=>isFrame(frame,OMEGA_SPRITE_ACTIONS[i]!))&&
    new Set(frames.map(frame=>frame.actor)).size===20;
  })&&(()=>{
   const allFrames=OMEGA_DIRECTIONS.flatMap(heading=>manifest.frames[heading]);
   // A 160-filename pack containing repeated identical silhouettes is NOT
   // uniquely authored gameplay motion; an independent binary audit remains
   // mandatory as well.
   return allFrames.length===160&&
    new Set(allFrames.map(frame=>frame.actor)).size===160&&
    new Set(allFrames.map(frame=>frame.actorSha256)).size===160;
  })();
 if(safeToCache)memo.set(manifest,valid);
 return valid;
}
export function omegaSpriteFrameForView(view:OmegaActorView&Readonly<{ultimate?:boolean;finished?:boolean;actionAge?:number}>):
 Readonly<{heading:OmegaHeading;frame:number;action:OmegaSpriteAction}>{
 const heading=omegaFieldHeading(view.facingX,view.facingY);
 const action:OmegaSpriteAction=view.finished?'finish':view.ultimate?'ultimate':
  view.hurt?'hit':view.dashing?'dash':view.shooting?'fire':'walk';
 const group=action==='walk'?{start:0,count:6,fps:10}:
  action==='fire'?{start:6,count:3,fps:18}:
  action==='dash'?{start:9,count:3,fps:18}:
  action==='hit'?{start:12,count:3,fps:12}:
  action==='ultimate'?{start:15,count:3,fps:12}:{start:18,count:2,fps:6};
 const t=Number.isFinite(view.time)?Math.max(0,view.time):0;
 const age=Number.isFinite(view.actionAge)?Math.max(0,view.actionAge!):t;
 const realGait=view.gait;
 // The future approved 8x20 sprite shares the SAME travel-driven walk phase
 // as the fallback actor; wall collision must freeze walk at frame zero.
 // One-shot fire/dash/hit/ultimate frames still CLAMP from real action age.
 const walkIndex=realGait?
  (realGait.active?Math.min(group.count-1,Math.floor(realGait.phase*group.count)):0):
  (view.moving?Math.floor(t*group.fps)%group.count:0);
 const subframe=action==='walk'?walkIndex:
  Math.min(group.count-1,Math.floor(age*group.fps));
 return {heading,frame:group.start+subframe,action};
}
type OmegaImageLike=CanvasImageSource&Readonly<{
 complete:boolean;
 naturalWidth:number;
 naturalHeight:number;
}>;
export class OmegaApprovedImageCache{
 private entries=new Map<string,{image:OmegaImageLike;seen:number}>();
 private tick=0;
 constructor(
  private readonly capacity=36,
  private readonly loader:(uri:string)=>OmegaImageLike=(uri)=>{
   const image=new Image();image.decoding='async';image.src=uri;return image;
  },
 ){}
 get(uri:string):OmegaImageLike|undefined{
  let item=this.entries.get(uri);
  if(!item){
   item={image:this.loader(uri),seen:0};
   this.entries.set(uri,item);
  }
  item.seen=++this.tick;
  if(this.entries.size>this.capacity){
   const sorted=[...this.entries.entries()].sort((a,b)=>a[1].seen-b[1].seen);
   for(const [key] of sorted)if(key!==uri){this.entries.delete(key);break;}
  }
  const image=item.image;
  return image.complete&&image.naturalWidth===384&&image.naturalHeight===512?image:undefined;
 }
 clear(){this.entries.clear();}
 get size():number{return this.entries.size;}
 /** Warm a bounded number of approved URLs after the current frame renders.
  * No unreviewed manifest, localStorage flag or paid network API can call this.
  */
 preload(uris:readonly string[]):void{
  for(const uri of uris)this.get(uri);
 }
}
/** Prime only one next frame and both neighboring body directions.
 * 4 complete frames = at most 12 image paths; avoids a 480-file download
 * and keeps the current proven render ahead of speculative loads.
 * The next frame wraps inside WALK and clamps at the end of one-shot actions.
 */
export function omegaApprovedFrameLookahead(
 manifest:OmegaApprovedSpriteManifest,
 pose:Readonly<{heading:OmegaHeading;frame:number;action:OmegaSpriteAction}>,
):readonly string[]{
 const idx=OMEGA_DIRECTIONS.indexOf(pose.heading);
 const groupStart=OMEGA_SPRITE_ACTIONS.indexOf(pose.action);
 const groupEnd=OMEGA_SPRITE_ACTIONS.lastIndexOf(pose.action);
 const candidate=pose.frame<groupEnd?pose.frame+1:
  pose.action==='walk'?groupStart:pose.frame;
 const slots=[
  manifest.frames[pose.heading]?.[candidate],
  manifest.frames[OMEGA_DIRECTIONS[(idx+1)%8]!]?.[pose.frame],
  manifest.frames[OMEGA_DIRECTIONS[(idx+7)%8]!]?.[pose.frame],
 ].filter((f):f is OmegaApprovedSpriteFrame=>Boolean(f));
 return [...new Set(slots.flatMap(f=>[f.rearMask,f.actor,f.frontMask]))];
}
/** Stage is translated to physical player XY. Return false WITHOUT painting
 * when art is missing, so existing procedural gameplay art remains visible.
 */
export function drawOmegaApprovedActor(
 ctx:CanvasRenderingContext2D,
 manifest:OmegaApprovedSpriteManifest|null,
 buildAudit:boolean,
 cache:OmegaApprovedImageCache,
 view:OmegaActorView&Readonly<{ultimate?:boolean;finished?:boolean;actionAge?:number}>,
 height=86,
):boolean{
 if(!omegaCanRenderApprovedArt(manifest,buildAudit)||!manifest||
  !Number.isFinite(height)||height<=0)return false;
 const pos=omegaSpriteFrameForView(view);
 const frame=manifest.frames[pos.heading]?.[pos.frame];
 if(!frame)return false;
 const rear=cache.get(frame.rearMask),actor=cache.get(frame.actor),front=cache.get(frame.frontMask);
 if(!rear||!actor||!front)return false;
 const width=height*384/512,top=-height*manifest.feetLine/512;
 ctx.save();
 ctx.fillStyle='#06152887';ctx.beginPath();ctx.ellipse(0,0,width*.37,6,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(rear,-width/2,top,width,height);
 ctx.drawImage(actor,-width/2,top,width,height);
 ctx.drawImage(front,-width/2,top,width,height);
 ctx.restore();
 // Decode the next walk/attack frame and left/right body turns ahead of time;
 // do not stall this paint on asynchronous image loads.
 cache.preload(omegaApprovedFrameLookahead(manifest,pos));
 return true;
}

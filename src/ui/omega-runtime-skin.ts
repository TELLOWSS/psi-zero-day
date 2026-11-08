import {omegaReleaseDecision,drawOmegaApprovedLayers,type OmegaApprovedManifest,type OmegaAssetDecision} from './omega-combat-art-contract';
import {OMEGA_DIRECTIONS} from './omega-operator-motion';

export interface OmegaRuntimeMotion {
 readonly moving:boolean;
 readonly dashing:boolean;
 readonly hit:boolean;
 readonly shooting:boolean;
 readonly ultimate:boolean;
 readonly finished:boolean;
 readonly facingRadians:number;
 readonly gameTimeSeconds:number;
 readonly reducedMotion:boolean;
}
const GROUPS={
 walk:{start:0,count:6,fps:10},fire:{start:6,count:3,fps:18},
 dash:{start:9,count:3,fps:18},hit:{start:12,count:3,fps:12},
 ultimate:{start:15,count:3,fps:12},finish:{start:18,count:2,fps:6},
} as const;
type Group=keyof typeof GROUPS;

/** Separate cosmetic frames do not alter existing CharacterId/stats/hitbox. */
export function omegaSelectCombatFrame(state:OmegaRuntimeMotion):{direction:typeof OMEGA_DIRECTIONS[number];index:number;group:Group}{
 const angle=Number.isFinite(state.facingRadians)?state.facingRadians:Math.PI/2;
 const directionIndex=((Math.round(angle/(Math.PI/4))%8)+8)%8;
 const group:Group=state.finished?'finish':state.ultimate?'ultimate':state.hit?'hit':state.dashing?'dash':state.shooting?'fire':'walk';
 const cfg=GROUPS[group];
 const elapsed=Number.isFinite(state.gameTimeSeconds)?Math.max(0,state.gameTimeSeconds):0;
 const frame=state.reducedMotion?0:Math.floor(elapsed*cfg.fps)%cfg.count;
 return {direction:OMEGA_DIRECTIONS[directionIndex]!,index:cfg.start+frame,group};
}
interface DeferredImage {image:HTMLImageElement; last:number}
export class OmegaRuntimeImageCache {
 private entries=new Map<string,DeferredImage>();
 private counter=0;
 constructor(private readonly maxEntries=42,private readonly load:(uri:string)=>HTMLImageElement=(uri)=>{
  const img=new Image();img.decoding='async';img.src=uri;return img;
 }){}
 get(uri:string):HTMLImageElement|undefined{
  let obj=this.entries.get(uri);
  if(!obj){
   const image=this.load(uri);
   obj={image,last:0};this.entries.set(uri,obj);
  }
  obj.last=++this.counter;
  if(this.entries.size>this.maxEntries){
   const victim=[...this.entries.entries()].sort((a,b)=>a[1].last-b[1].last)[0];
   if(victim&&victim[0]!==uri)this.entries.delete(victim[0]);
  }
  const image=obj.image;
  return image.complete&&image.naturalWidth>0?image:undefined;
 }
 clear(){this.entries.clear();}
 size(){return this.entries.size;}
}
/**
 * Render inside the game's already-translated player canvas coordinates.
 * Returns false while resources load and leaves the normal player's image
 * as a fallback. No user progress is ever written.
 */
export function drawOmegaRuntimeSkin(
 ctx:CanvasRenderingContext2D,
 manifest:OmegaApprovedManifest|null,
 decision:OmegaAssetDecision,
 cache:OmegaRuntimeImageCache,
 motion:OmegaRuntimeMotion,
 height=74,
):boolean{
 if(!decision.playable||!manifest||!Number.isFinite(height)||height<=0)return false;
 const position=omegaSelectCombatFrame(motion);
 const frame=manifest.frames[position.direction]?.[position.index];
 if(!frame)return false;
 const behind=cache.get(frame.backOcclusion),actor=cache.get(frame.art),front=cache.get(frame.frontOcclusion);
 if(!behind||!actor||!front)return false;
 const width=height*384/512;
 // source y=454 is the artist-stage provisional plant sole line
 return drawOmegaApprovedLayers(ctx,{behind,actor,front},-width/2,-height*454/512,width,height,decision);
}
export function omegaRuntimeEntitlement(earned:boolean,manifest:OmegaApprovedManifest|null,binaryAudit:boolean){
 return omegaReleaseDecision(earned,manifest,binaryAudit);
}

import type { SurvivorsGameState } from '../domain/patrol-survivors';
import { ACTOR_RIGS } from './survivors-animation-rig';
import { actorTorsoPoint, applyActorTorsoTransform, drawAuthoredBody, authoredEquipmentOccluders } from './survivors-rig-renderer';
import { registerSpriteBounds, spriteOpaqueBounds, type SpritePose } from './survivors-sprite-motion';
import type {StoreCategory} from '../domain/survivors-store';
import {isDirectionalActor,directionalSocket,drawDirectionalBody,directionalBootSockets,renderedDirection,directionalHandMasks} from './survivors-directional-art';
import {EquipmentMotion} from './survivors-equipment-motion';
import {equipmentAnimationTime} from './survivors-equipment-clock';
import {drawProp,registerPropAtlas} from './survivors-equipment-art';
import {COMMUNICATION_WEAR_ART,communicationWearPlan} from './survivors-communication-wear-plan';
import {PREMIUM_WORN_ART,NORMAL_WORN_ART,wornEquipmentPlans,WORN_CALIBRATIONS,WORN_VIEW_ART,wornView} from './survivors-worn-equipment-plan';
import {footTravel} from './survivors-ground-contact';
import {InspectionFlightTracker} from './survivors-inspection-flight';
const wornInspectionFlights=new InspectionFlightTracker();
const wearableMotion=new EquipmentMotion();
function drawMountedWearable(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,pose:SpritePose,id:WearableId,image:HTMLImageElement,source:{x:number;y:number;width:number;height:number},x:number,y:number,w:number,h:number,reduced:boolean):void {
  const joint=id==='voice_lens'?'radio':id==='shock_mantle'?'armor':'dock';
  ctx.save();ctx.translate(x+w/2,y+h/2);
  ctx.rotate(wearableMotion.sample(state.player,equipmentAnimationTime(state),pose,reduced,id,joint));
  ctx.drawImage(image,source.x,source.y,source.width,source.height,-w/2,-h/2,w,h);
  ctx.restore();
}

export const WEARABLE_ART = {
  voice_lens: '/assets/survivors/wearables/voice-lens-v1.png',
  shock_mantle: '/assets/survivors/wearables/shock-mantle-v1.png',
  inspection_wing: '/assets/survivors/wearables/inspection-dock-v1.png',
} as const;
export type WearableId = keyof typeof WEARABLE_ART;
export type WearableImages = Partial<Record<WearableId, HTMLImageElement>> & {communication?:HTMLImageElement;premiumWorn?:HTMLImageElement;normalWorn?:HTMLImageElement;premiumSide?:HTMLImageElement;premiumRear?:HTMLImageElement;normalSide?:HTMLImageElement;normalRear?:HTMLImageElement;emptyDock?:HTMLImageElement};
const wornPromises=new Map<string,Promise<HTMLImageElement|undefined>>();
function loadWorn(src:string,columns=4,rows=4):Promise<HTMLImageElement|undefined>{
 let pending=wornPromises.get(src);if(!pending){const layouts=import('./survivors-art-frame-layouts');pending=new Promise(resolve=>{const image=new Image();image.onload=()=>{void layouts.then(({wornFrameLayouts})=>{const file=src.split('/').pop()!;registerPropAtlas(image,columns,rows,wornFrameLayouts[file as keyof typeof wornFrameLayouts]);resolve(image);}).catch(()=>{wornPromises.delete(src);resolve(undefined);});};image.onerror=()=>{wornPromises.delete(src);resolve(undefined);};image.src=src;});wornPromises.set(src,pending);}return pending;
}
let communicationPromise:Promise<HTMLImageElement|undefined>|undefined;
const imagePromises = new Map<WearableId, Promise<HTMLImageElement | undefined>>();
const sockets = {
  voice_lens: { x: .15, y: .14, w: .22, h: .22, layer: 'front' },
  shock_mantle: { x: .34, y: .17, w: .48, h: .32, layer: 'front' },
  inspection_wing: { x: .16, y: .17, w: .30, h: .22, layer: 'back' },
} as const;
type Socket = { x: number; y: number; w: number; h: number; layer: 'front' | 'back' };
type FittingProfile = { sockets: Record<WearableId, Socket>; occluders: number[][][] };
const profile = (x: number, y: number, w: number, h: number, occluders: number[][][]): FittingProfile => ({
  sockets: { shock_mantle: {x,y,w,h,layer:'front'}, voice_lens: {x:x-.08,y:y-.025,w:.19,h:.18,layer:'front'}, inspection_wing: {x:x-.10,y:y+.015,w:.27,h:.20,layer:'back'} }, occluders,
});
/** Authored against each original full-body sprite, not a universal floating badge. */
export const WEARABLE_PROFILES: Record<string, FittingProfile> = {
  safety_monitor: {sockets, occluders: [[[.24,.25],[.29,.18],[.42,.16],[.49,.20],[.44,.27],[.34,.29]],[[.63,.32],[1,.30],[1,.42],[.68,.43],[.60,.38]]]},
  player: profile(.30,.24,.40,.22, [[[.10,.31],[.45,.29],[.61,.32],[.58,.37],[.10,.37]],[[.59,.24],[1,.23],[1,.43],[.61,.43]]]),
  kang_taesik: profile(.39,.23,.38,.29, []),
  yoon_sungho: profile(.30,.24,.40,.25, [[[.23,.39],[.58,.39],[.62,.47],[.30,.48]]]),
  lee_jaehoon: profile(.34,.22,.33,.25, [[[.68,.19],[1,.18],[1,.44],[.64,.43]],[[.18,.40],[.43,.43],[.43,.51],[.29,.52],[.18,.47]]]),
  lim_junho: profile(.31,.21,.43,.24, [[[.64,.14],[.90,.10],[1,.28],[.75,.34],[.62,.27]],[[.28,.39],[.59,.40],[.61,.47],[.45,.49],[.28,.45]]]),
};
WEARABLE_PROFILES.park = WEARABLE_PROFILES.kang_taesik!;
WEARABLE_PROFILES.jung = WEARABLE_PROFILES.player!;
WEARABLE_PROFILES.yoon = WEARABLE_PROFILES.yoon_sungho!;

/** Body-local attachment coordinates; the actor transform owns facing and recoil. */
export function premiumBodySocket(characterId:string,actor:HTMLImageElement,height:number,category:StoreCategory,pose?:SpritePose):{x:number;y:number;size:number;rear?:boolean}|undefined {
  if(isDirectionalActor(actor)){
    const kind=category==='logistics'||category==='companion'?'back':category==='tactics'?'belt':'chest';
    const socket=directionalSocket(actor,pose,height,kind);if(!socket||socket.rear&&kind==='chest')return;
    return category==='communication'?{...socket,x:socket.x-socket.size*.45,y:socket.y-socket.size*.12,size:height*.13}:socket;
  }
  const fitting=WEARABLE_PROFILES[characterId];if(!fitting)return;
  const bounds=spriteOpaqueBounds(actor),width=height*bounds.width/bounds.height;
  const chest=fitting.sockets.shock_mantle,radio=fitting.sockets.voice_lens,back=fitting.sockets.inspection_wing;
  const positions:Record<StoreCategory,[number,number,number]>={
    communication:[radio.x+radio.w/2,radio.y+radio.h/2,.14],
    tempo:[chest.x+chest.w*.85,chest.y+chest.h*.75,.12],
    logistics:[back.x+back.w/2,back.y+back.h*.85,.17],
    protection:[chest.x+chest.w/2,chest.y+chest.h/2,.18],
    tactics:[chest.x+chest.w*.24,chest.y+chest.h*.95,.11],
    companion:[back.x+back.w/2,back.y+back.h/2,.19],
  };
  const [x,y,size]=positions[category];
  return {x:(x-.5)*width,y:(y-1)*height,size:height*size};
}

/** Existing tablet poses retain their hands; base tools mount at the belt. */
export function baseToolSocket(characterId:string,actor:HTMLImageElement,height:number,left:boolean,pose?:SpritePose):{x:number;y:number;size:number}|undefined {
  if(isDirectionalActor(actor)){const socket=directionalSocket(actor,pose,height,'belt');return socket?{...socket,x:socket.x+socket.size*(left?-.3:.3),size:height*.15}:undefined;}
  const chest=WEARABLE_PROFILES[characterId]?.sockets.shock_mantle;if(!chest)return;
  const bounds=spriteOpaqueBounds(actor),width=height*bounds.width/bounds.height;
  return {x:(chest.x+chest.w*(left?.12:.88)-.5)*width,y:(chest.y+chest.h*1.15-1)*height,size:height*(left?.18:.15)};
}

export function drawActorEquipmentOcclusion(ctx:CanvasRenderingContext2D,characterId:string,actor:HTMLImageElement,height:number,pose?:SpritePose):void {
  if(isDirectionalActor(actor)&&pose){
    const socket=directionalSocket(actor,pose,height,'chest');if(!socket||socket.rear)return;
    const masks=directionalHandMasks(actor,pose,height);if(!masks.length)return;
    ctx.save();ctx.beginPath();for(const mask of masks)ctx.rect(mask.x,mask.y,mask.width,mask.height);ctx.clip();drawDirectionalBody(ctx,actor,height,pose,false);ctx.restore();return;
  }
  const fitting=WEARABLE_PROFILES[characterId];if(!fitting)return;
  const occluders=authoredEquipmentOccluders(actor,pose)??fitting.occluders;if(!occluders.length)return;
  const body=spriteOpaqueBounds(actor),width=height*body.width/body.height;
  ctx.save();ctx.beginPath();
  for(const polygon of occluders){polygon.forEach(([x,y],i)=>{const px=x!*width-width/2,py=y!*height-height;i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.closePath();}
  ctx.clip();if(!drawAuthoredBody(ctx,actor,height,pose))ctx.drawImage(actor,body.x,body.y,body.width,body.height,-width/2,-height,width,height);ctx.restore();
}

export function inspectionDockAnchor(characterId:string,actor:HTMLImageElement,height:number,pose:SpritePose,state?:SurvivorsGameState):{x:number;y:number}|undefined {
  const fitting=WORN_CALIBRATIONS[characterId];
  if(fitting&&state){
    const source=spriteOpaqueBounds(actor),width=height*source.width/source.height;
    let point={x:(fitting.back[0]-.5)*width,y:(fitting.back[1]-1)*height};
    if(isDirectionalActor(actor)){const socket=directionalSocket(actor,pose,height,'back');if(!socket)return;point={x:socket.x+(socket.rear?0:-height*.12),y:socket.y};}
    const peers=wornEquipmentPlans(state).filter(plan=>plan.part==='back'),index=peers.findIndex(plan=>plan.id==='inspection_wing');
    if(peers.length>1&&index>=0)point.x+=(index-(peers.length-1)/2)*height*.09;
    return actorTorsoPoint(point,pose,height,Boolean(ACTOR_RIGS[actor.src.split('/').pop()??'']));
  }
  if(isDirectionalActor(actor)){const socket=directionalSocket(actor,pose,height,'back');return socket?actorTorsoPoint(socket,{...pose,directional:true},height,true):undefined;}
  const socket=WEARABLE_PROFILES[characterId]?.sockets.inspection_wing;
  if(!socket)return;
  const bounds=spriteOpaqueBounds(actor),width=height*bounds.width/bounds.height;
  return actorTorsoPoint({x:(socket.x+socket.w/2-.5)*width,y:(socket.y+socket.h/2-1)*height},pose,height,Boolean(ACTOR_RIGS[actor.src.split('/').pop() ?? '']));
}
export function inspectionWearFlight(state:SurvivorsGameState,actor:HTMLImageElement,height:number,pose:SpritePose,reduced=false){
 const dock=inspectionDockAnchor(state.characterId,actor,height,pose,state);return dock?wornInspectionFlights.sample(state,dock,reduced):undefined;
}

export function hasWearable(state: SurvivorsGameState, id: string, images: WearableImages): boolean {
  if(images.premiumWorn?.naturalWidth&&wornEquipmentPlans(state).some(plan=>plan.atlas==='premium'&&plan.id===id))return true;
  if(['voice_lens','command_array','broadcast_crown'].includes(id)&&images.communication?.naturalWidth)return true;
  return Boolean(WEARABLE_PROFILES[state.characterId]) && id in WEARABLE_ART && Boolean(images[id as WearableId]?.naturalWidth);
}

export async function loadWearableImages(characterId: string): Promise<WearableImages> {
  if (!WEARABLE_PROFILES[characterId]) return {};
  const entries = await Promise.all(Object.entries(WEARABLE_ART).map(async ([key, src]) => {
    const id = key as WearableId;
    let pending = imagePromises.get(id);
    if (!pending) {
      pending = new Promise<HTMLImageElement | undefined>(resolve => {
        const image = new Image();
        image.onload = () => { registerSpriteBounds(image); resolve(image); };
        image.onerror = () => { imagePromises.delete(id); resolve(undefined); };
        image.src = src;
      });
      imagePromises.set(id, pending);
    }
    return [id, await pending] as const;
  }));
  if(!communicationPromise)communicationPromise=new Promise(resolve=>{const image=new Image();image.onload=()=>{registerPropAtlas(image,4,3);resolve(image);};image.onerror=()=>{communicationPromise=undefined;resolve(undefined);};image.src=COMMUNICATION_WEAR_ART;});
  const [premiumWorn,normalWorn]=await Promise.all([loadWorn(PREMIUM_WORN_ART),loadWorn(NORMAL_WORN_ART)]);
  const [premiumSide,premiumRear,normalSide,normalRear,emptyDock]=await Promise.all([loadWorn(WORN_VIEW_ART.premiumSide),loadWorn(WORN_VIEW_ART.premiumRear),loadWorn(WORN_VIEW_ART.normalSide),loadWorn(WORN_VIEW_ART.normalRear),loadWorn(WORN_VIEW_ART.emptyDock,2,3)]);
  return {...Object.fromEntries(entries),communication:await communicationPromise,premiumWorn,normalWorn,premiumSide,premiumRear,normalSide,normalRear,emptyDock};
}

const partJoint={chest:'armor',tempo:'wrist',back:'pack',belt:'belt',wrist:'wrist',boots:'armor'} as const;
function drawNewWornLayer(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,actor:HTMLImageElement,height:number,pose:SpritePose,images:WearableImages,layer:'front'|'back',reduced:boolean,only?:'wrist'):boolean {
 const fitting=WORN_CALIBRATIONS[state.characterId];if(!fitting)return false;
 const source=spriteOpaqueBounds(actor),width=height*source.width/source.height,directional=isDirectionalActor(actor);
 const plans=wornEquipmentPlans(state);let drawn=false;
 const view=wornView(directional?renderedDirection(actor,pose):undefined);
 for(const plan of plans){
  if(only&&plan.part!==only)continue;
  let image=plan.atlas==='premium'?(view.view==='side'?images.premiumSide:view.view==='rear'?images.premiumRear:images.premiumWorn):(view.view==='side'?images.normalSide:view.view==='rear'?images.normalRear:images.normalWorn);
  let cell=plan.cell;
  if(plan.id==='inspection_wing'&&inspectionWearFlight(state,actor,height,pose,reduced)?.phase!=='docked'){image=images.emptyDock;cell=(view.view==='rear'?2:view.view==='side'?1:0)*2;}
  if(!image?.naturalWidth)continue;
  if(plan.part==='boots'){
   // Boot guards belong to the legs, never to the torso recoil frame.
   if(layer!=='front')continue;
   if(directional){ctx.save();applyActorTorsoTransform(ctx,pose,height,true);for(const foot of directionalBootSockets(actor,pose,height)){ctx.save();ctx.translate(foot.x,foot.y-height*.01);if(view.mirror)ctx.scale(-1,1);drawProp(ctx,image,cell,0,0,height*plan.size);ctx.restore();}ctx.restore();drawn=true;continue;}
   const rig=ACTOR_RIGS[actor.src.split('/').pop()??''];if(!rig)continue;
   for(const [i,leg] of [rig.left,rig.right].entries()){
    const step=footTravel(pose.cycle,i===1,pose.mode==='run',pose.directionY,pose.reaction>0?0:pose.gaitBlend,pose.stride);
    ctx.save();ctx.scale(pose.facing,1);ctx.transform(1,0,pose.lean,1,0,0);
    drawProp(ctx,image,plan.cell,(leg.sole.x-.5)*width+step.x,(leg.sole.y-1)*height+step.y-step.lift-height*.018,height*plan.size);ctx.restore();
   }drawn=true;continue;
  }
  let point={x:(fitting[plan.part][0]-.5)*width,y:(fitting[plan.part][1]-1)*height};
  let order:'front'|'back'=plan.part==='back'?'back':'front';
  if(directional){
   const socket=directionalSocket(actor,pose,height,plan.part==='back'?'back':plan.part==='belt'?'belt':plan.part==='wrist'?'wrist':plan.part==='tempo'?'tempo':'chest');if(!socket)continue;
   if(socket.rear&&(plan.part==='chest'||plan.part==='tempo'||plan.part==='wrist'&&Math.abs(socket.x)<height*.13))continue;
   order=plan.part==='back'&&!socket.rear?'back':'front';
   point={x:socket.x+(plan.part==='back'?(socket.rear?0:-height*.12):0),y:socket.y};
  }
  if(order!==layer)continue;
  // Fan multiple belt/back modules across their own mounts rather than stacking badges.
  const peers=plans.filter(other=>other.part===plan.part&&other.part!=='chest'),index=peers.findIndex(other=>other.id===plan.id);
  if(peers.length>1)point.x+=(index-(peers.length-1)/2)*height*.09;
  const size=height*plan.size*fitting.scale;
  ctx.save();applyActorTorsoTransform(ctx,pose,height,Boolean(ACTOR_RIGS[actor.src.split('/').pop()??'']));ctx.translate(point.x,point.y);
  ctx.rotate(wearableMotion.sample(state.player,equipmentAnimationTime(state),pose,reduced,plan.id,partJoint[plan.part]));
  if(view.mirror&&directional)ctx.scale(-1,1);
  drawProp(ctx,image,cell,0,size/2,size);ctx.restore();drawn=true;
 }
 return drawn;
}

/** Origin is the actor's feet; sockets are authored in opaque body coordinates. */
export function drawWearableLayer(ctx: CanvasRenderingContext2D, state: SurvivorsGameState, actor: HTMLImageElement, height: number, pose: SpritePose, images: WearableImages, layer: 'front' | 'back',reduced=false): void {
  const newDrawn=drawNewWornLayer(ctx,state,actor,height,pose,images,layer,reduced);
  const directional=isDirectionalActor(actor),communication=images.communication&&communicationWearPlan(state,directional?renderedDirection(actor,pose):undefined);
  let communicationDrawn=false;
  if(communication&&communication.layer===layer){
    let socket=communication.row===2?directionalSocket(actor,pose,height,'chest'):premiumBodySocket(state.characterId,actor,height,'communication',pose);
    if(!directional&&(state.characterId==='player'||state.characterId==='jung')){const source=spriteOpaqueBounds(actor),width=height*source.width/source.height;socket={x:-.06*width,y:-.70*height,size:height*.18};}
    if(socket){ctx.save();applyActorTorsoTransform(ctx,pose,height,Boolean(ACTOR_RIGS[actor.src.split('/').pop()??'']));ctx.translate(socket.x,socket.y);ctx.rotate(wearableMotion.sample(state.player,equipmentAnimationTime(state),pose,reduced,communication.id,'radio'));drawProp(ctx,images.communication,communication.cell,0,height*.09,height*.18);ctx.restore();communicationDrawn=true;}
  }
  if(isDirectionalActor(actor)){
    ctx.save();applyActorTorsoTransform(ctx,{...pose,directional:true},height,true);let drawn=communicationDrawn||newDrawn;
    for(const id of state.premiumGear?.equipped??[]){
      if(images.communication&&['voice_lens','command_array','broadcast_crown'].includes(id))continue;
      if(images.premiumWorn)continue;
      if(!hasWearable(state,id,images))continue;
      const kind=id==='inspection_wing'?'back':'chest';
      const socket=id==='voice_lens'?premiumBodySocket(state.characterId,actor,height,'communication',pose):directionalSocket(actor,pose,height,kind);if(!socket||socket.rear&&kind==='chest')continue;
      const order=kind==='back'&&!socket.rear?'back':'front';if(layer!==order)continue;
      const image=images[id as WearableId]!,source=spriteOpaqueBounds(image),size=socket.size;
      const scale=size/Math.max(source.width,source.height),w=source.width*scale,h=source.height*scale;
      drawMountedWearable(ctx,state,pose,id as WearableId,image,source,socket.x-w/2,socket.y-h/2,w,h,reduced);drawn=true;
    }
    if(drawn&&layer==='front')drawActorEquipmentOcclusion(ctx,state.characterId,actor,height,pose);
    ctx.restore();if(layer==='front')drawNewWornLayer(ctx,state,actor,height,pose,images,layer,reduced,'wrist');return;
  }
  const fitting = WEARABLE_PROFILES[state.characterId]; if (!fitting) return;
  const body = spriteOpaqueBounds(actor), width = height * body.width / body.height;
  ctx.save(); applyActorTorsoTransform(ctx, pose, height, Boolean(ACTOR_RIGS[actor.src.split('/').pop() ?? '']));
  let drawn = communicationDrawn||newDrawn;
  for (const id of state.premiumGear?.equipped ?? []) {
    if(images.communication&&['voice_lens','command_array','broadcast_crown'].includes(id))continue;
    if(images.premiumWorn)continue;
    if (!hasWearable(state, id, images)) continue;
    const socket = fitting.sockets[id as WearableId]; if (socket.layer !== layer) continue;
    const image = images[id as WearableId]!, source = spriteOpaqueBounds(image);
    const scale = Math.min(socket.w * width / source.width, socket.h * height / source.height);
    const w = source.width * scale, h = source.height * scale;
    const x = (socket.x + socket.w / 2) * width - width / 2 - w / 2;
    const y = (socket.y + socket.h / 2) * height - height - h / 2;
    drawMountedWearable(ctx,state,pose,id as WearableId,image,source,x,y,w,h,reduced);
    if (id === 'shock_mantle') {
      ctx.save(); ctx.globalAlpha = state.premiumGear!.shield > 0 ? .9 : .25;
      ctx.fillStyle = state.premiumGear!.feedback > 0 ? '#ecffff' : '#a3e635';
      ctx.fillRect(x + w * .53, y + h * .50, Math.max(.5, w * .10), Math.max(.4, h * .025)); ctx.restore();
    }
    drawn = true;
  }
  // The authored glove and tablet remain in front of the chest-mounted equipment.
  if (drawn && layer === 'front') {
    const occluders = authoredEquipmentOccluders(actor,pose)??fitting.occluders;
    if (!occluders.length) { ctx.restore(); return; }
    ctx.save(); ctx.beginPath();
    for (const polygon of occluders) {
      polygon.forEach(([x,y], i) => { const px=x!*width-width/2, py=y!*height-height; if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py); }); ctx.closePath();
    }
    ctx.clip(); if(!drawAuthoredBody(ctx,actor,height,pose))ctx.drawImage(actor, body.x, body.y, body.width, body.height, -width/2, -height, width, height); ctx.restore();
  }
  ctx.restore();
  if(layer==='front')drawNewWornLayer(ctx,state,actor,height,pose,images,layer,reduced,'wrist');
}

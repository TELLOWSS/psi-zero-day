import type { SurvivorsGameState } from '../domain/patrol-survivors';
import { ACTOR_RIGS } from './survivors-animation-rig';
import { actorTorsoPoint, applyActorTorsoTransform, drawAuthoredBody } from './survivors-rig-renderer';
import { registerSpriteBounds, spriteOpaqueBounds, type SpritePose } from './survivors-sprite-motion';
import type {StoreCategory} from '../domain/survivors-store';

export const WEARABLE_ART = {
  voice_lens: '/assets/survivors/wearables/voice-lens-v1.png',
  shock_mantle: '/assets/survivors/wearables/shock-mantle-v1.png',
  inspection_wing: '/assets/survivors/wearables/inspection-dock-v1.png',
} as const;
export type WearableId = keyof typeof WEARABLE_ART;
export type WearableImages = Partial<Record<WearableId, HTMLImageElement>>;
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
  player: profile(.30,.24,.40,.22, [[[.10,.23],[.58,.21],[.66,.29],[.55,.37],[.13,.34]],[[.59,.24],[1,.23],[1,.43],[.61,.43]]]),
  kang_taesik: profile(.39,.23,.38,.29, []),
  yoon_sungho: profile(.30,.24,.40,.25, [[[.23,.39],[.58,.39],[.62,.47],[.30,.48]]]),
  lee_jaehoon: profile(.30,.19,.41,.25, [[[.68,.19],[1,.18],[1,.44],[.64,.43]],[[.18,.40],[.43,.43],[.43,.51],[.29,.52],[.18,.47]]]),
  lim_junho: profile(.31,.21,.43,.24, [[[.64,.14],[.90,.10],[1,.28],[.75,.34],[.62,.27]],[[.28,.39],[.59,.40],[.61,.47],[.45,.49],[.28,.45]]]),
};
WEARABLE_PROFILES.park = WEARABLE_PROFILES.kang_taesik!;
WEARABLE_PROFILES.jung = WEARABLE_PROFILES.player!;
WEARABLE_PROFILES.yoon = WEARABLE_PROFILES.yoon_sungho!;

/** Body-local attachment coordinates; the actor transform owns facing and recoil. */
export function premiumBodySocket(characterId:string,actor:HTMLImageElement,height:number,category:StoreCategory):{x:number;y:number;size:number}|undefined {
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
export function baseToolSocket(characterId:string,actor:HTMLImageElement,height:number,left:boolean):{x:number;y:number;size:number}|undefined {
  const chest=WEARABLE_PROFILES[characterId]?.sockets.shock_mantle;if(!chest)return;
  const bounds=spriteOpaqueBounds(actor),width=height*bounds.width/bounds.height;
  return {x:(chest.x+chest.w*(left?.12:.88)-.5)*width,y:(chest.y+chest.h*1.15-1)*height,size:height*(left?.18:.15)};
}

export function drawActorEquipmentOcclusion(ctx:CanvasRenderingContext2D,characterId:string,actor:HTMLImageElement,height:number,pose?:SpritePose):void {
  const fitting=WEARABLE_PROFILES[characterId];if(!fitting?.occluders.length)return;
  const body=spriteOpaqueBounds(actor),width=height*body.width/body.height;
  ctx.save();ctx.beginPath();
  for(const polygon of fitting.occluders){polygon.forEach(([x,y],i)=>{const px=x!*width-width/2,py=y!*height-height;i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.closePath();}
  ctx.clip();if(!drawAuthoredBody(ctx,actor,height,pose))ctx.drawImage(actor,body.x,body.y,body.width,body.height,-width/2,-height,width,height);ctx.restore();
}

export function inspectionDockAnchor(characterId:string,actor:HTMLImageElement,height:number,pose:SpritePose):{x:number;y:number}|undefined {
  const socket=WEARABLE_PROFILES[characterId]?.sockets.inspection_wing;
  if(!socket)return;
  const bounds=spriteOpaqueBounds(actor),width=height*bounds.width/bounds.height;
  return actorTorsoPoint({x:(socket.x+socket.w/2-.5)*width,y:(socket.y+socket.h/2-1)*height},pose,height,Boolean(ACTOR_RIGS[actor.src.split('/').pop() ?? '']));
}

export function hasWearable(state: SurvivorsGameState, id: string, images: WearableImages): boolean {
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
  return Object.fromEntries(entries);
}

/** Origin is the actor's feet; sockets are authored in opaque body coordinates. */
export function drawWearableLayer(ctx: CanvasRenderingContext2D, state: SurvivorsGameState, actor: HTMLImageElement, height: number, pose: SpritePose, images: WearableImages, layer: 'front' | 'back'): void {
  const fitting = WEARABLE_PROFILES[state.characterId]; if (!fitting) return;
  const body = spriteOpaqueBounds(actor), width = height * body.width / body.height;
  ctx.save(); applyActorTorsoTransform(ctx, pose, height, Boolean(ACTOR_RIGS[actor.src.split('/').pop() ?? '']));
  let drawn = false;
  for (const id of state.premiumGear?.equipped ?? []) {
    if (!hasWearable(state, id, images)) continue;
    const socket = fitting.sockets[id as WearableId]; if (socket.layer !== layer) continue;
    const image = images[id as WearableId]!, source = spriteOpaqueBounds(image);
    const scale = Math.min(socket.w * width / source.width, socket.h * height / source.height);
    const w = source.width * scale, h = source.height * scale;
    const x = (socket.x + socket.w / 2) * width - width / 2 - w / 2;
    const y = (socket.y + socket.h / 2) * height - height - h / 2;
    ctx.drawImage(image, source.x, source.y, source.width, source.height, x, y, w, h);
    if (id === 'shock_mantle') {
      ctx.save(); ctx.globalAlpha = state.premiumGear!.shield > 0 ? .9 : .25;
      ctx.fillStyle = state.premiumGear!.feedback > 0 ? '#ecffff' : '#a3e635';
      ctx.fillRect(x + w * .53, y + h * .50, Math.max(.5, w * .10), Math.max(.4, h * .025)); ctx.restore();
    }
    drawn = true;
  }
  // The authored glove and tablet remain in front of the chest-mounted equipment.
  if (drawn && layer === 'front') {
    const occluders = fitting.occluders;
    if (!occluders.length) { ctx.restore(); return; }
    ctx.save(); ctx.beginPath();
    for (const polygon of occluders) {
      polygon.forEach(([x,y], i) => { const px=x!*width-width/2, py=y!*height-height; if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py); }); ctx.closePath();
    }
    ctx.clip(); if(!drawAuthoredBody(ctx,actor,height,pose))ctx.drawImage(actor, body.x, body.y, body.width, body.height, -width/2, -height, width, height); ctx.restore();
  }
  ctx.restore();
}

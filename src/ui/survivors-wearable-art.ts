import type { SurvivorsGameState } from '../domain/patrol-survivors';
import { ACTOR_RIGS } from './survivors-animation-rig';
import { applyActorTorsoTransform } from './survivors-rig-renderer';
import { registerSpriteBounds, spriteOpaqueBounds, type SpritePose } from './survivors-sprite-motion';

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

export function hasWearable(state: SurvivorsGameState, id: string, images: WearableImages): boolean {
  return state.characterId === 'safety_monitor' && id in WEARABLE_ART && Boolean(images[id as WearableId]?.naturalWidth);
}

export async function loadWearableImages(characterId: string): Promise<WearableImages> {
  if (characterId !== 'safety_monitor') return {};
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
  if (state.characterId !== 'safety_monitor') return;
  const body = spriteOpaqueBounds(actor), width = height * body.width / body.height;
  ctx.save(); applyActorTorsoTransform(ctx, pose, height, Boolean(ACTOR_RIGS[actor.src.split('/').pop() ?? '']));
  let drawn = false;
  for (const id of state.premiumGear?.equipped ?? []) {
    if (!hasWearable(state, id, images)) continue;
    const socket = sockets[id as WearableId]; if (socket.layer !== layer) continue;
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
    const occluders = [
      [[.24,.25],[.29,.18],[.42,.16],[.49,.20],[.44,.27],[.34,.29]],
      [[.63,.32],[1,.30],[1,.42],[.68,.43],[.60,.38]],
    ];
    ctx.save(); ctx.beginPath();
    for (const polygon of occluders) {
      polygon.forEach(([x,y], i) => { const px=x!*width-width/2, py=y!*height-height; if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py); }); ctx.closePath();
    }
    ctx.clip(); ctx.drawImage(actor, body.x, body.y, body.width, body.height, -width/2, -height, width, height); ctx.restore();
  }
  ctx.restore();
}

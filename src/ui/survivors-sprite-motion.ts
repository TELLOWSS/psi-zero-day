import { ACTOR_RIGS } from './survivors-animation-rig';
import { gaitStride, soleContact } from './survivors-ground-contact';
import { prepareActorRig, drawRiggedActor } from './survivors-rig-renderer';
import {ATTACK_MOTION,attackEnvelope,attackProgress,type AttackMotion} from './survivors-attack-motion';
import {commandArtProfile} from './survivors-command-art';
import {movementDirection,drawDirectionalBody} from './survivors-directional-art';
interface Sample { x: number; y: number; clock: number; hp: number; cycle: number; facing: 1 | -1; reactionUntil: number; actionUntil: number; actionStart:number; actionKind:AttackMotion|undefined; pose: SpritePose }
export interface SpritePose { moving: boolean; cycle: number; authoredCycle?:number; facing: 1 | -1; direction?:number;directional?:boolean; attackAngle?:number; actionKind?:AttackMotion; lean: number; scaleY: number; reaction: number; action: number; actionProgress?: number; speed: number; gaitBlend: number; stride: number; travel: number; directionY: number; mode: 'idle' | 'walk' | 'run' | 'brace' | 'action' }

/** Presentation only: gait follows actual travelled distance, never input or wall time. */
export class SpriteMotionTracker {
  private samples = new WeakMap<object, Sample>();
  private actions = new WeakMap<object, {start:number;kind:AttackMotion;gestureStart:number;gestureKind:AttackMotion;angle?:number}>();
  act(entity: object, clock: number,kind:AttackMotion='shot',angle?:number): void {
    const previous=this.actions.get(entity);
    if(previous?.kind==='ultimate'&&kind!=='ultimate'&&clock>=previous.start&&clock<previous.start+ATTACK_MOTION.ultimate.duration)return;
    if (!previous || clock<previous.start || clock-previous.start>=.065 || kind==='ultimate'&&previous.kind!=='ultimate') {
      // Rapid emissions retrigger recoil, but let the authored hand gesture finish.
      const continuing=previous&&clock>=previous.gestureStart&&clock<previous.gestureStart+ATTACK_MOTION[previous.gestureKind].duration&&kind!=='ultimate';
      this.actions.set(entity,{start:clock,kind,gestureStart:continuing?previous.gestureStart:clock,gestureKind:continuing?previous.gestureKind:kind,angle:Number.isFinite(angle)?angle:previous?.angle});
    }
  }
  sample(entity: object, x: number, y: number, clock: number, hp = 1): SpritePose {
    const previous = this.samples.get(entity);
    const attack=this.actions.get(entity);
    const actionUntil=attack?attack.start+ATTACK_MOTION[attack.kind].duration:0;
    if (previous && clock === previous.clock && x === previous.x && y === previous.y && hp === previous.hp && actionUntil === previous.actionUntil && (attack?.start??-1)===previous.actionStart && attack?.kind===previous.actionKind) return previous.pose;
    const dx = previous ? x - previous.x : 0;
    const dy = previous ? y - previous.y : 0;
    const elapsed = previous ? clock - previous.clock : 0;
    const distance = Math.hypot(dx, dy);
    const held = elapsed===0&&distance===0&&previous;
    const moving = held ? previous.pose.moving : elapsed > 0 && distance > 0.015 && distance < 80;
    const speed = held ? previous.pose.speed : moving ? distance / elapsed : 0;
    const running = speed > 145;
    const directionY = moving && distance>0 ? dy / distance : previous?.pose.directionY ?? 0;
    const stride = moving ? gaitStride(running, directionY) : previous?.pose.stride ?? 54;
    const cycle = moving ? ((previous?.cycle ?? 0) + distance * Math.PI * 2 / stride) % (Math.PI * 2) : previous?.cycle ?? 0;
    // An authored cycle contains both steps; its cadence must not accelerate on vertical travel.
    const authoredCycle=((previous?.pose.authoredCycle??0)+(moving?distance*Math.PI*2/112:0))%(Math.PI*2);
    const facing = moving && Math.abs(dx) > 0.04 ? (dx < 0 ? -1 : 1) : previous?.facing ?? 1;
    const reactionUntil = previous && hp < previous.hp ? clock + .18 : previous?.reactionUntil ?? 0;
    const reaction = Math.max(0, Math.min(1, (reactionUntil - clock) / .18));
    const action = attack?attackEnvelope(clock-attack.start,attack.kind):0;
    const targetLean = moving ? Math.max(-.035, Math.min(.035, dx / Math.max(elapsed, .001) * .0002)) : reaction * .025;
    const leanBlend = 1 - Math.exp(-Math.max(0, elapsed) / .075);
    const lean = previous ? previous.pose.lean + (targetLean - previous.pose.lean) * leanBlend : targetLean;
    const pose: SpritePose = {
      moving, cycle, authoredCycle, facing,direction:moving?movementDirection(dx,dy,previous?.pose.direction??2):attack?.angle!==undefined&&clock<actionUntil?movementDirection(Math.cos(attack.angle),Math.sin(attack.angle),previous?.pose.direction??2):previous?.pose.direction??2,
      attackAngle:attack?.angle,actionKind:attack?.gestureKind,
      lean, actionProgress: attack ? attackProgress(clock-attack.gestureStart,attack.gestureKind) : 0,
      scaleY: 1 - (moving ? Math.abs(Math.sin(cycle)) * .018 : (1 + Math.sin(clock * 2.4)) * .002) - reaction * .035,
      reaction, action, speed, gaitBlend: moving ? Math.min(1,(previous?.pose.gaitBlend ?? 0)+elapsed*10) : Math.max(0,(previous?.pose.gaitBlend ?? 0)-Math.max(0,elapsed)*10),
      stride, travel: (previous?.pose.travel ?? 0) + (moving ? distance : 0), directionY,
      mode: reaction > 0 ? 'brace' : moving ? running ? 'run' : 'walk' : attack && clock>=attack.start && clock<actionUntil ? 'action' : 'idle',
    };
    this.samples.set(entity, { x, y, clock, hp, cycle, facing, reactionUntil, actionUntil, actionStart:attack?.start??-1,actionKind:attack?.kind,pose });
    return pose;
  }
}

interface Bounds { x: number; y: number; width: number; height: number }
const bounds = new WeakMap<HTMLImageElement, Bounds>();
const commandTextures = new WeakMap<HTMLImageElement, HTMLCanvasElement[]>();

/** Register one canonical body, with authored arm poses aligned by the support boot. */
export function registerCommandSprite(image:HTMLImageElement,sheet:HTMLImageElement):boolean {
  const profile=commandArtProfile(image.src);
  if(!profile||!sheet.naturalWidth||!sheet.naturalHeight)return false;
  const cached=commandTextures.get(sheet);
  if(cached){const source={x:0,y:0,width:cached[0]!.width,height:cached[0]!.height};prepareActorRig(image,source,cached);bounds.set(image,source);return true;}
  const cw=sheet.naturalWidth/4,ch=sheet.naturalHeight/2;
  const cells=Array.from({length:8},(_,index)=>{
    const canvas=document.createElement('canvas');canvas.width=Math.ceil(cw);canvas.height=Math.ceil(ch);
    const ctx=canvas.getContext('2d')!;ctx.drawImage(sheet,index%4*cw,Math.floor(index/4)*ch,cw,ch,0,0,canvas.width,canvas.height);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let left=canvas.width,right=-1,top=canvas.height,bottom=-1;
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]!>=32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    if(right<left)throw new Error('Empty authored command cell');
    const height=bottom-top+1;let foot=0,weight=0;
    for(let y=bottom-Math.ceil(height*.025);y<=bottom;y++)for(let x=left;x<=right;x++){
      const alpha=pixels[(y*canvas.width+x)*4+3]!;
      if(alpha>=32){foot+=(x-left)*alpha;weight+=alpha;}
    }
    return {canvas,left,top,width:right-left+1,height,foot:foot/weight};
  });
  const base=cells[0]!,height=256,padding=profile.horizontalPadding??0,width=Math.ceil(base.width*height/base.height)+8+padding;
  const anchor=4+padding/2+base.foot*height/base.height;
  const aligned=cells.map(cell=>{
    const texture=document.createElement('canvas');texture.width=width;texture.height=height;
    const scale=height/cell.height;
    texture.getContext('2d')!.drawImage(cell.canvas,cell.left,cell.top,cell.width,cell.height,anchor-cell.foot*scale,0,cell.width*scale,height);
    return texture;
  });
  const frames=aligned.map(texture=>{
    const frame=document.createElement('canvas');frame.width=width;frame.height=height;
    const ctx=frame.getContext('2d')!;ctx.drawImage(aligned[0]!,0,0);
    // Face, PPE, hips and boots stay canonical. Only the authored command layer changes.
    const top=Math.floor(height*profile.top),bottom=Math.ceil(height*profile.bottom);
    ctx.clearRect(0,top,width,bottom-top);ctx.drawImage(texture,0,top,width,bottom-top,0,top,width,bottom-top);
    if(profile.preserve){
      const p=profile.preserve,x=Math.floor(p.x*width),y=Math.floor(p.y*height),w=Math.ceil(p.width*width),h=Math.ceil(p.height*height);
      ctx.clearRect(x,y,w,h);ctx.drawImage(aligned[0]!,x,y,w,h,x,y,w,h);
    }
    return frame;
  });
  const source={x:0,y:0,width,height};
  commandTextures.set(sheet,frames);
  prepareActorRig(image,source,frames);bounds.set(image,source);return true;
}

export function spriteOpaqueBounds(image: HTMLImageElement): Bounds {
  return bounds.get(image) ?? { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
}

/** Cache opaque bounds on load, so transparent padding cannot lift feet off the floor. */
export function registerSpriteBounds(image: HTMLImageElement): void {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let left = canvas.width, top = canvas.height, right = -1, bottom = -1;
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    if (data[(y * canvas.width + x) * 4 + 3]! < 32) continue;
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  if (right >= left) {
    const source={ x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
    bounds.set(image,source);prepareActorRig(image,source);
  }
}

export function drawGroundedSprite(ctx: CanvasRenderingContext2D, image: HTMLImageElement, height: number, pose: SpritePose): void {
  // Common grounded penumbra, below both rigged and unrigged approved actors.
  ctx.save();ctx.fillStyle='rgba(3,10,18,.14)';ctx.beginPath();
  ctx.ellipse(height*.14,3,height*.29,height*.075,.18,0,Math.PI*2);ctx.fill();ctx.restore();
  if(drawDirectionalBody(ctx,image,height,pose))return;
  if(drawRiggedActor(ctx,image,height,pose))return;
  const source = spriteOpaqueBounds(image);
  const width = height * source.width / source.height;
  ctx.save(); ctx.scale(pose.facing, 1);
  const rig = ACTOR_RIGS[image.src.split('/').pop() ?? ''];
  if (rig) for (const leg of [rig.left, rig.right]) {
    const foot = soleContact(leg.sole, source.width / source.height, height, { x: 0, y: 0 });
    ctx.fillStyle = 'rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(foot.x, foot.y + 1, 5 * height / 74, 2 * height / 74, 0, 0, Math.PI * 2);ctx.fill();
  }
  ctx.transform(1, 0, pose.lean + pose.action*.025, pose.scaleY-pose.action*.008, 0, 0);
  ctx.drawImage(image, source.x, source.y, source.width, source.height, -width / 2, -height, width, height);
  ctx.restore();
}

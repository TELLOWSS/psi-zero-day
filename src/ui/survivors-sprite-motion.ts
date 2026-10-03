import { prepareActorRig, drawRiggedActor } from './survivors-rig-renderer';
interface Sample { x: number; y: number; clock: number; hp: number; cycle: number; facing: 1 | -1; reactionUntil: number; actionUntil: number; pose: SpritePose }
export interface SpritePose { moving: boolean; cycle: number; facing: 1 | -1; lean: number; scaleY: number; reaction: number; action: number; speed: number; gaitBlend: number; stride: number; travel: number; directionY: number; mode: 'idle' | 'walk' | 'run' | 'brace' | 'action' }

/** Presentation only: gait follows actual travelled distance, never input or wall time. */
export class SpriteMotionTracker {
  private samples = new WeakMap<object, Sample>();
  private actions = new WeakMap<object, number>();
  act(entity: object, clock: number): void {
    const until = this.actions.get(entity) ?? 0;
    if (clock >= until) this.actions.set(entity, clock + .24);
  }
  sample(entity: object, x: number, y: number, clock: number, hp = 1): SpritePose {
    const previous = this.samples.get(entity);
    if (previous && clock === previous.clock && x === previous.x && y === previous.y && hp === previous.hp && (this.actions.get(entity) ?? 0) === previous.actionUntil) return previous.pose;
    const dx = previous ? x - previous.x : 0;
    const dy = previous ? y - previous.y : 0;
    const elapsed = previous ? clock - previous.clock : 0;
    const distance = Math.hypot(dx, dy);
    const moving = elapsed > 0 && distance > 0.015 && distance < 80;
    const speed = moving ? distance / elapsed : 0;
    const running = speed > 145;
    const cycle = moving ? ((previous?.cycle ?? 0) + distance * Math.PI * 2 / (running ? 66 : 54)) % (Math.PI * 2) : previous?.cycle ?? 0;
    const facing = moving && Math.abs(dx) > 0.04 ? (dx < 0 ? -1 : 1) : previous?.facing ?? 1;
    const reactionUntil = previous && hp < previous.hp ? clock + .18 : previous?.reactionUntil ?? 0;
    const reaction = Math.max(0, Math.min(1, (reactionUntil - clock) / .18));
    const actionUntil = this.actions.get(entity) ?? 0;
    const action = Math.max(0, Math.min(1, (actionUntil - clock) / .24));
    const pose: SpritePose = {
      moving, cycle, facing,
      lean: moving ? Math.max(-.035, Math.min(.035, dx / Math.max(elapsed, .001) * .0002)) : reaction * .025,
      scaleY: 1 - (moving ? Math.abs(Math.sin(cycle)) * .018 : (1 + Math.sin(clock * 2.4)) * .002) - reaction * .035,
      reaction, action, speed, gaitBlend: moving ? Math.min(1,(previous?.pose.gaitBlend ?? 0)+elapsed*10) : Math.max(0,(previous?.pose.gaitBlend ?? 0)-Math.max(0,elapsed)*10),
      stride: moving ? running ? 66 : 54 : previous?.pose.stride ?? 54, travel: (previous?.pose.travel ?? 0) + (moving ? distance : 0), directionY: moving ? dy / distance : previous?.pose.directionY ?? 0,
      mode: reaction > 0 ? 'brace' : moving ? running ? 'run' : 'walk' : action > 0 ? 'action' : 'idle',
    };
    this.samples.set(entity, { x, y, clock, hp, cycle, facing, reactionUntil, actionUntil, pose });
    return pose;
  }
}

interface Bounds { x: number; y: number; width: number; height: number }
const bounds = new WeakMap<HTMLImageElement, Bounds>();

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
  if(drawRiggedActor(ctx,image,height,pose))return;
  const source = bounds.get(image) ?? { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
  const width = height * source.width / source.height;
  ctx.save(); ctx.scale(pose.facing, 1); ctx.transform(1, 0, pose.lean + pose.action*.025, pose.scaleY-pose.action*.008, 0, 0);
  ctx.drawImage(image, source.x, source.y, source.width, source.height, -width / 2, -height, width, height);
  ctx.restore();
}

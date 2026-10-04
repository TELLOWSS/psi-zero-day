import { expect, it, vi } from 'vitest';
import { createInitialSurvivorsState } from '../src/engine/patrol-survivors-engine';
import { drawWearableLayer, hasWearable, WEARABLE_PROFILES, type WearableImages } from '../src/ui/survivors-wearable-art';
import { SpriteMotionTracker } from '../src/ui/survivors-sprite-motion';
import { applyActorTorsoTransform, riggedTorsoOffset } from '../src/ui/survivors-rig-renderer';

const image = (name: string) => ({ src: `/assets/${name}`, naturalWidth: 600, naturalHeight: 1400 }) as HTMLImageElement;
const context = () => ({ save: vi.fn(), restore: vi.fn(), scale: vi.fn(), transform: vi.fn(), translate: vi.fn(), drawImage: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(), clip: vi.fn() });
const equipped = ['voice_lens', 'shock_mantle', 'inspection_wing'];
const images: WearableImages = Object.fromEntries(equipped.map(id => [id, image(`${id}.png`)]));

it('draws only equipped layers and preserves the authored actor foreground', () => {
  const state = createInitialSurvivorsState('safety_monitor', undefined, undefined, undefined, { owned: equipped, equipped });
  const actor = image('safety-monitor-v2.webp'), pose = new SpriteMotionTracker().sample(state.player, 0, 0, 0);
  const back = context(), front = context();
  drawWearableLayer(back as unknown as CanvasRenderingContext2D, state, actor, 74, pose, images, 'back');
  expect(back.drawImage).toHaveBeenCalledTimes(1);
  expect(back.drawImage.mock.calls[0]![0]).toBe(images.inspection_wing);
  drawWearableLayer(front as unknown as CanvasRenderingContext2D, state, actor, 74, pose, images, 'front');
  expect(front.drawImage.mock.calls.map(call => call[0])).toEqual([images.voice_lens, images.shock_mantle, actor]);
  state.premiumGear!.equipped = [];
  const removed = context();
  drawWearableLayer(removed as unknown as CanvasRenderingContext2D, state, actor, 74, pose, images, 'front');
  expect(removed.drawImage).not.toHaveBeenCalled();
});

it('does not promote missing artwork or sockets for uncalibrated characters', () => {
  const state = createInitialSurvivorsState('safety_monitor');
  expect(hasWearable(state, 'voice_lens', images)).toBe(true);
  expect(hasWearable(state, 'voice_lens', {})).toBe(false);
  expect(hasWearable(state, 'broadcast_crown', images)).toBe(false);
  state.characterId = 'player';
  expect(hasWearable(state, 'voice_lens', images)).toBe(true);
});

it('keeps every calibrated body socket within the original torso bounds', () => {
  expect(Object.keys(WEARABLE_PROFILES)).toHaveLength(9);
  for (const fitting of Object.values(WEARABLE_PROFILES)) for (const socket of Object.values(fitting.sockets)) {
    expect(socket.x).toBeGreaterThanOrEqual(0); expect(socket.y).toBeGreaterThanOrEqual(0);
    expect(socket.x + socket.w).toBeLessThanOrEqual(1);
    expect(socket.y + socket.h).toBeLessThanOrEqual(.55);
  }
  expect(WEARABLE_PROFILES.player!.sockets).not.toEqual(WEARABLE_PROFILES.kang_taesik!.sockets);
});

it('shares the cached rig torso offset for movement, hit reactions and facing', () => {
  const tracker = new SpriteMotionTracker(), entity = {};
  tracker.sample(entity, 0, 0, 0, 100);
  tracker.act(entity, .1);
  const pose = tracker.sample(entity, -10, 0, .1, 90), ctx = context();
  applyActorTorsoTransform(ctx as unknown as CanvasRenderingContext2D, pose, 74, true);
  expect(ctx.scale).toHaveBeenCalledWith(-1, 1);
  const phase = Math.floor(pose.cycle / (Math.PI*2) * 16) % 16;
  const expected = riggedTorsoOffset(phase, false, Math.round(pose.reaction*3)/3, Math.round(pose.action*2)/2, Math.round(pose.gaitBlend*4)/4, 74);
  expect(ctx.translate).toHaveBeenCalledWith(expected.x, expected.y);
});

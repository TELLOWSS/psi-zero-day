import { describe, expect, it, vi } from 'vitest';
import type { Projectile, ProjectileKind } from '../src/domain/patrol-survivors';
import {
  drawBroadcastCrownContact,
  drawBroadcastCrownEmitter,
  drawBroadcastCrownFlight,
  hasBroadcastCrown,
} from '../src/ui/survivors-premium-vfx';

const atlas = { naturalWidth: 1448, naturalHeight: 1086 } as HTMLImageElement;
const context = () => ({
  save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), drawImage: vi.fn(),
  beginPath: vi.fn(), ellipse: vi.fn(), stroke: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
}) as unknown as CanvasRenderingContext2D;

const shot = (kind: ProjectileKind): Projectile => ({
  id:'p', kind, x:50, y:60, vx:100, vy:0, radius:4, damage:12, duration:.2, pierce:1,
});

describe('Broadcast Crown production VFX', () => {
  it('activates only for the exact legendary item', () => {
    expect(hasBroadcastCrown(['broadcast_crown'])).toBe(true);
    expect(hasBroadcastCrown(['voice_lens','command_array'])).toBe(false);
  });

  it('layers flight without mutating projectile state', () => {
    const p = Object.freeze(shot('radio'));
    const ctx = context();
    expect(drawBroadcastCrownFlight(ctx,p,atlas,false,false)).toBe(true);
    expect(ctx.drawImage).toHaveBeenCalledTimes(6);
    expect(p).toEqual(shot('radio'));
  });

  it('reduces drawing cost in a busy scene and respects reduced motion', () => {
    const busy = context();
    expect(drawBroadcastCrownFlight(busy,shot('hunter_beam'),atlas,false,true)).toBe(true);
    expect(busy.drawImage).toHaveBeenCalledTimes(4);
    const quiet = context();
    expect(drawBroadcastCrownFlight(quiet,shot('hunter_beam'),atlas,true,false)).toBe(false);
  });

  it('never treats worker confirmation as combat contact', () => {
    const ctx = context();
    const event = {projectileId:'p',kind:'radio' as const,phase:'impact' as const,x:4,y:8,angle:0,radius:5,worker:true};
    expect(drawBroadcastCrownContact(ctx,event,0,.2,atlas,false,false)).toBe(false);
    expect(ctx.drawImage).not.toHaveBeenCalled();
  });

  it('builds layered contact rings and directional fragments', () => {
    const ctx = context();
    const event = {projectileId:'p',kind:'radio' as const,phase:'impact' as const,x:4,y:8,angle:0,radius:5,critical:true};
    expect(drawBroadcastCrownContact(ctx,event,.03,.24,atlas,false,false)).toBe(true);
    expect(ctx.drawImage).toHaveBeenCalledTimes(2);
    expect(ctx.ellipse).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
  });

  it('draws premium emitter presence', () => {
    const ctx = context();
    drawBroadcastCrownEmitter(ctx,atlas,100,200,1,false);
    expect(ctx.drawImage).toHaveBeenCalledOnce();
    expect(ctx.ellipse).toHaveBeenCalledTimes(2);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { PATROL_STAGE_IDS, type StageHazardObject } from '../src/domain/patrol-survivors';
import { STAGE_LIGHTS, stageActorLight } from '../src/ui/survivors-stage-light';
import { drawEquipmentCastShadow } from '../src/ui/survivors-scene-lighting';

describe('shared fifty-workface grounding', () => {
  it('covers every saved stage without painting every environment with the foundation light', () => {
    expect(Object.keys(STAGE_LIGHTS)).toEqual(PATROL_STAGE_IDS);
    for (const id of PATROL_STAGE_IDS) {
      const light = stageActorLight(id)!;
      expect(light.color).toMatch(/^#[0-9a-f]{6}$/);
      expect(light.fill).toBeGreaterThan(0);
      expect(light.fill).toBeLessThanOrEqual(.08);
      expect(light.opacity).toBeGreaterThan(0);
      expect(light.opacity).toBeLessThanOrEqual(.24);
      expect(light.shadowX).toBeGreaterThan(0);
      expect(light.shadowY).toBeGreaterThan(0);
      expect(light.beam).toBeGreaterThan(0);
      expect(light.beam).toBeLessThanOrEqual(1);
      expect(Object.isFrozen(light)).toBe(true);
    }
    expect(stageActorLight('stage_01')).toMatchObject({ color: '#ffe4b8', beam: .36 });
    expect(stageActorLight('stage_03')!.fill).toBeLessThan(stageActorLight('stage_05')!.fill);
    expect(new Set(Object.values(STAGE_LIGHTS).map(light => light.color)).size).toBe(6);
    for (const id of ['stage_00', 'stage_51', '__proto__', 'constructor']) expect(stageActorLight(id)).toBeUndefined();
  });

  it('keeps projected equipment shadows off invisible crane zones and flat puddles', () => {
    const ctx = { save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), beginPath: vi.fn(), ellipse: vi.fn(), fill: vi.fn() };
    const object = { x: 200, y: 300, state: 'idle', type: 'crane_drop_zone' } as StageHazardObject;
    const before = JSON.stringify(object);
    drawEquipmentCastShadow(ctx as unknown as CanvasRenderingContext2D, object, stageActorLight('stage_03'));
    drawEquipmentCastShadow(ctx as unknown as CanvasRenderingContext2D, { ...object, type: 'slurry_puddle' }, stageActorLight('stage_02'));
    expect(ctx.save).not.toHaveBeenCalled();
    const light = stageActorLight('stage_50')!;
    drawEquipmentCastShadow(ctx as unknown as CanvasRenderingContext2D, { ...object, type: 'electric_transformer' }, light);
    expect(ctx.rotate).toHaveBeenCalledWith(Math.atan2(light.shadowY, light.shadowX));
    expect(ctx.ellipse).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(object)).toBe(before);
  });
});

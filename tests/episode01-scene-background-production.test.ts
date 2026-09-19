import { describe, expect, it } from 'vitest';
import catalog from '../content/episode01/scene-background-catalog.json';
import scenes from '../content/episode01/immersive-scenes.json';
import { episode01ImmersiveScene } from '../src/app/episode01-immersive-scene';

describe('Episode 01 immersive production background contract', () => {
  it('locks eight stable final WebP background slots with RC fallbacks', () => {
    const backgrounds = Object.values(catalog.backgrounds);
    expect(backgrounds).toHaveLength(8);
    expect(new Set(backgrounds.map(item => item.asset_id)).size).toBe(8);
    expect(new Set(backgrounds.map(item => item.final_path)).size).toBe(8);
    expect(new Set(backgrounds.map(item => item.rc_path)).size).toBe(8);
    expect(backgrounds.every(item => item.final_path.match(/^assets\/episode01\/cg\/[a-z-]+\.webp$/))).toBe(true);
    expect(backgrounds.every(item => item.rc_path.match(/^assets\/episode01\/cg\/[a-z-]+-rc\.svg$/))).toBe(true);
  });

  it('maps every immersive event to exactly one production background asset id', () => {
    const byRc = new Map(Object.values(catalog.backgrounds).map(item => [item.rc_path, item.asset_id]));
    const eventIds = Object.keys(scenes.events);
    expect(eventIds).toHaveLength(26);
    for (const eventId of eventIds) {
      const scene = scenes.events[eventId as keyof typeof scenes.events];
      const expectedAssetId = byRc.get(scene.bg);
      expect(expectedAssetId, eventId).toBeTruthy();
      expect(episode01ImmersiveScene(eventId, undefined, undefined)?.background_asset_id).toBe(expectedAssetId);
    }
  });

  it('keeps catalog usage synchronized with the actual immersive event map', () => {
    const actualByRc = new Map<string, string[]>();
    for (const [eventId, scene] of Object.entries(scenes.events)) {
      const list = actualByRc.get(scene.bg) ?? [];
      list.push(eventId);
      actualByRc.set(scene.bg, list);
    }
    for (const background of Object.values(catalog.backgrounds)) {
      expect([...(actualByRc.get(background.rc_path) ?? [])].sort()).toEqual([...background.used_by].sort());
    }
  });
});

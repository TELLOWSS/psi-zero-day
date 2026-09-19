import { describe, expect, it } from 'vitest';
import sceneComposition from '../content/episode01/scene-composition.json';
import backgrounds from '../content/episode01/scene-background-catalog.json';
import { episode01ImmersiveLocator } from '../src/app/episode01-immersive-locator';

describe('Episode 01 map-to-immersive location coherence', () => {
  it('keeps site-office immersive events anchored to the office on the Production Map', () => {
    for (const eventId of backgrounds.backgrounds.site_office.used_by) {
      expect(sceneComposition.events[eventId as keyof typeof sceneComposition.events].primary_anchor).toBe('office');
    }
  });

  it('keeps work-yard immersive events anchored to the yard on the Production Map', () => {
    for (const eventId of backgrounds.backgrounds.work_yard.used_by) {
      expect(sceneComposition.events[eventId as keyof typeof sceneComposition.events].primary_anchor).toBe('yard');
    }
  });

  it('keeps inspection scenes on the inspection anchor and break-area scenes at the yard support zone', () => {
    for (const eventId of backgrounds.backgrounds.inspection_zone.used_by) {
      expect(sceneComposition.events[eventId as keyof typeof sceneComposition.events].primary_anchor).toBe('inspection');
    }
    for (const eventId of backgrounds.backgrounds.break_area.used_by) {
      expect(sceneComposition.events[eventId as keyof typeof sceneComposition.events].primary_anchor).toBe('yard');
    }
  });
  it('projects the same normalized Production Map coordinates into the immersive locator', () => {
    expect(episode01ImmersiveLocator('e01_08b_inspection_find')).toEqual({
      anchor: 'inspection',
      marker_style: { left: '79%', top: '39%' },
    });
    expect(episode01ImmersiveLocator('e01_08o_record_pressure')).toEqual({
      anchor: 'office',
      marker_style: { left: '83%', top: '68%' },
    });
    expect(episode01ImmersiveLocator('e01_10_next_day_tease')).toEqual({
      anchor: 'gate',
      marker_style: { left: '17%', top: '72%' },
    });
  });

  it('does not show a construction-site locator during the home-night reflection scene', () => {
    expect(episode01ImmersiveLocator('e01_09_evening')).toBeUndefined();
  });

});

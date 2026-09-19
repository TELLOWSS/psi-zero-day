import { describe, expect, it } from 'vitest';
import sceneComposition from '../content/episode01/scene-composition.json';
import backgrounds from '../content/episode01/scene-background-catalog.json';

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
});

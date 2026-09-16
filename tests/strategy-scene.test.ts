import { describe, expect, it } from 'vitest';
import { projectEpisode01Scene } from '../src/app/strategy-scene';
import { projectEpisode01Signals } from '../src/app/strategy-signals';

describe('Episode 01 strategy scene composition', () => {
  it('uses a reusable foundation recipe when no event-specific scene is active', () => {
    const scene = projectEpisode01Scene(null, []);

    expect(scene).toMatchObject({
      scene_id: 'foundation.default',
      event_id: null,
      background_asset_id: 'ep01.background.foundation.map',
      environment: 'foundation',
      primary_anchor: 'overview',
    });
    expect(scene.active_layers).toEqual(['background', 'characters', 'elements', 'signals', 'pressures', 'dialogue']);
    expect(scene.hazard_signal_ids).toEqual([]);
    expect(scene.elements).toEqual([]);
  });

  it('recomposes the same background around event-specific anchors and hazard signals', () => {
    const eventId = 'e01_04_junho_signal';
    const signals = projectEpisode01Signals(eventId);
    const scene = projectEpisode01Scene(eventId, signals);

    expect(scene).toMatchObject({
      scene_id: 'foundation.ramp-signal',
      event_id: eventId,
      background_asset_id: 'ep01.background.foundation.map',
      environment: 'foundation',
      primary_anchor: 'ramp',
    });
    expect(scene.hazard_signal_ids).toEqual(['signal.ramp_movement']);
    expect(scene.elements).toEqual([]);
  });

  it('adds only story-grounded physical props to the visual composition', () => {
    const eventId = 'e01_03_plan_breaks';
    const scene = projectEpisode01Scene(eventId, projectEpisode01Signals(eventId));

    expect(scene.elements).toEqual([
      expect.objectContaining({
        element_id: 'scene.prop.material_stack',
        kind: 'prop',
        label: '통로 인접 적재 자재',
        anchor: 'entry',
      }),
    ]);
  });

  it('falls back safely for events that have no dedicated visual recipe', () => {
    const scene = projectEpisode01Scene('e01_unknown_future_event', []);

    expect(scene.scene_id).toBe('foundation.default');
    expect(scene.event_id).toBe('e01_unknown_future_event');
    expect(scene.background_asset_id).toBe('ep01.background.foundation.map');
    expect(scene.elements).toEqual([]);
  });
});

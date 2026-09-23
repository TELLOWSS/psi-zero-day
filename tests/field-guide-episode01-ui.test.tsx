/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import type { EpisodeSession } from '../src/app/episode-session';
import assets from '../content/episode01/assets.json';
import catalog from '../content/episode01/scene-element-catalog.json';
import { FieldGuide } from '../src/ui/FieldGuide';

const keys = [
  'site_gate',
  'pedestrian_gate',
  'vehicle_pedestrian_separation',
  'material_yard',
  'temporary_distribution_board',
  'temporary_lighting_pack',
  'ppe_issue_station',
  'fire_extinguisher_station',
  'first_aid_aed',
  'site_weather_station',
] as const;

describe('Episode 01 Field Guide runtime asset routing', () => {
  it('renders FG001-FG010 through manifest-backed production WebP routes', async () => {
    const manifest = assets as any;
    const guide = catalog as any;
    const session = {
      t: (id: string) => id,
      assetUri: (assetId: string) => {
        const asset = manifest.assets.find((candidate: any) => candidate.asset_id === assetId);
        return asset?.variants?.[0]?.uri;
      },
    } as unknown as EpisodeSession;

    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(<FieldGuide session={session} />);
    });

    const images = [...host.querySelectorAll('img')];
    const srcs = images.map(image => image.getAttribute('src') ?? '');

    for (const key of keys) {
      const entry = guide.elements[key];
      expect(entry.field_guide.episode).toBe('EP01');
      const assetId = entry.field_guide_visual?.asset_id ?? entry.planned_asset_id;
      const asset = manifest.assets.find((candidate: any) => candidate.asset_id === assetId);
      expect(asset).toBeDefined();
      const uri = asset.variants[0].uri;
      expect(srcs.some(src => src.endsWith(uri))).toBe(true);
      const matching = images.find(image => (image.getAttribute('src') ?? '').endsWith(uri));
      expect(matching?.getAttribute('data-asset-tier')).toBe('final');
    }

    expect(guide.elements.site_gate.field_guide_visual.asset_id).toBe('ep01.scene_bg.gate_dawn');
    expect(guide.elements.pedestrian_gate.field_guide_visual.asset_id).toBe('ep01.scene_bg.gate_dawn');
    expect(host.textContent).toContain('FG001');
    expect(host.textContent).toContain('FG010');

    await act(async () => root.unmount());
    host.remove();
  });
});

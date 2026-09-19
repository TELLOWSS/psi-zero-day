import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import catalog from '../content/episode01/scene-background-catalog.json';
import ingest from '../content/episode01/final-art-ingest-manifest.json';
import scenes from '../content/episode01/immersive-scenes.json';
import { episode01ImmersiveScene } from '../src/app/episode01-immersive-scene';
import { episode01CinematicTrace } from '../src/app/episode01-cinematic-trace';
import { episode01ImmersiveLocator } from '../src/app/episode01-immersive-locator';
import { EpisodeImmersiveScene } from '../src/ui/EpisodeImmersiveScene';

const eventIds = Object.keys(scenes.events);

describe('Episode 01 final polish contract', () => {
  it('keeps every authored event on a stable production background slot', () => {
    expect(eventIds.length).toBeGreaterThanOrEqual(26);

    for (const eventId of eventIds) {
      const plan = episode01ImmersiveScene(eventId, null, null);
      expect(plan, eventId).toBeDefined();
      expect(plan?.background_asset_id, eventId).toMatch(/^ep01\.scene_bg\./);
      expect(plan?.cast.length, eventId).toBeLessThanOrEqual(5);
    }
  });

  it('keeps the eight final background files aligned with the ingest contract', () => {
    const backgrounds = Object.values(catalog.backgrounds);
    expect(backgrounds).toHaveLength(8);
    expect(ingest.assets).toHaveLength(8);

    const ingestByFilename = new Map(ingest.assets.map(asset => [asset.filename, asset]));
    for (const background of backgrounds) {
      const filename = background.final_path.split('/').at(-1)!;
      const asset = ingestByFilename.get(filename);
      expect(asset, filename).toBeDefined();
      expect(asset?.target_path).toBe(`public/${background.final_path}`);
      expect(asset?.width).toBeGreaterThanOrEqual(catalog.requirements.minimum_width);
      expect(asset?.height).toBeGreaterThanOrEqual(catalog.requirements.minimum_height);
      expect(asset?.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it('does not claim final background ingest before the binaries are committed', () => {
    expect(ingest.status).toBe('exact_archive_verified_pending_github_binary_ingest');
    expect(ingest.verification.exact_asset_count).toBe(8);
  });

  it('keeps every cinematic trace scene attached to a Production Map locator', () => {
    for (const eventId of eventIds) {
      const trace = episode01CinematicTrace(eventId, null);
      if (!trace) continue;
      expect(episode01ImmersiveLocator(eventId), eventId).toBeDefined();
    }
  });

  it('exposes HUD-density metadata for late cinematic scenes', () => {
    const html = renderToStaticMarkup(createElement(EpisodeImmersiveScene, {
      eventId: 'e01_08i_restart_pressure',
      nodeId: 'kang',
      speakerId: 'kang_taesik',
      eventTitle: '재개 압박',
      resolve: () => undefined,
      t: (id: string) => id,
    }));

    expect(html).toContain('data-has-trace="true"');
    expect(html).toContain('data-has-locator="true"');
    expect(html).toContain('data-character-blocking="true"');
    expect(html).toContain('data-character-performance="true"');
    expect(html).toContain('data-background-source="rc-fallback"');
  });

  it('reports final background source when the production slot resolves', () => {
    const html = renderToStaticMarkup(createElement(EpisodeImmersiveScene, {
      eventId: 'e01_01_arrival',
      nodeId: 'arrival',
      eventTitle: '현장 도착',
      resolve: (assetId: string) => assetId === 'ep01.scene_bg.gate_dawn'
        ? 'assets/episode01/cg/gate-dawn.webp'
        : undefined,
      t: (id: string) => id,
    }));

    expect(html).toContain('data-background-source="final"');
    expect(html).toContain('gate-dawn.webp');
  });

  it('keeps closure scenes visually distinct from dense field HUD scenes', () => {
    const evening = renderToStaticMarkup(createElement(EpisodeImmersiveScene, {
      eventId: 'e01_09_evening',
      nodeId: 'evening',
      eventTitle: '하루 마감',
      resolve: () => undefined,
      t: (id: string) => id,
    }));
    const nextDay = renderToStaticMarkup(createElement(EpisodeImmersiveScene, {
      eventId: 'e01_10_next_day_tease',
      nodeId: 'tease',
      eventTitle: '다음날',
      resolve: () => undefined,
      t: (id: string) => id,
    }));

    expect(evening).toContain('data-has-memory="true"');
    expect(evening).not.toContain('data-has-trace="true"');
    expect(nextDay).toContain('data-has-memory="true"');
    expect(nextDay).toContain('data-has-locator="true"');
  });
});

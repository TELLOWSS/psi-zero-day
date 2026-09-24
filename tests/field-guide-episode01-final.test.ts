import { describe, expect, it } from 'vitest';
import assets from '../content/episode01/assets.json';
import catalog from '../content/episode01/scene-element-catalog.json';
import verification from '../content/episode01/episode01-korea-material-verification.json';
import legalBasis from '../content/episode01/field-guide-legal-basis.json';

const expected = {
  "vehicle_pedestrian_separation": {
    "id": "FG003",
    "bytes": 136318,
    "sha256": "900bd3b7ca99261d6b5d49476e64b54d8e8670fbddf29e7dd8d89a79612c52e4"
  },
  "material_yard": {
    "id": "FG004",
    "bytes": 169282,
    "sha256": "eb6350820151a983b0d5960218d8a9ac590fab8cad3fede2e514cce00229d142"
  },
  "temporary_distribution_board": {
    "id": "FG005",
    "bytes": 84102,
    "sha256": "deba5fac00af118bdf6dcc3402b2ee9dd1ae16c86b77a00acf5a12f924ebf5b9"
  },
  "temporary_lighting_pack": {
    "id": "FG006",
    "bytes": 142140,
    "sha256": "f1bc58b504229c93d1cff85dd29014643a08f45e435923fa2f0a08523083e4ec"
  },
  "ppe_issue_station": {
    "id": "FG007",
    "bytes": 110202,
    "sha256": "be7211aa94cde3ef9b820b18791b8ac88328b1e1d4cfa7935823573bcb5f9074"
  },
  "fire_extinguisher_station": {
    "id": "FG008",
    "bytes": 84980,
    "sha256": "7c7c0af66c2dd3d982c81d87c79beea81a1f1c0b8fd8da3d0a4ca77ff785b2cf"
  },
  "first_aid_aed": {
    "id": "FG009",
    "bytes": 86316,
    "sha256": "61a588d703059995e74f1b3b091791851a6b8fa1cd92d0ff5a90c20de9a027a1"
  },
  "site_weather_station": {
    "id": "FG010",
    "bytes": 115456,
    "sha256": "a89841289665448279216e2f62e0c5f9537adcd71133e223584082c210996fb7"
  }
} as const;
const manifest = assets as any;
const guide = catalog as any;
const reality = verification as any;
const legal = legalBasis as any;

describe('Episode 01 Field Guide FG001-FG010 completion lock', () => {
  it('locks every Episode 01 Section 0 guide asset to realistic-v2 final', () => {
    for (const [key, item] of Object.entries(expected)) {
      const entry = guide.elements[key];
      expect(entry.field_guide.id).toBe(item.id);
      expect(entry.field_guide.episode).toBe('EP01');
      expect(entry.production_status).toBe('final');
      expect(entry.art.style_profile).toBe('field-guide-production-realistic-v2');
      expect(entry.production.width).toBe(768);
      expect(entry.production.height).toBe(768);
      expect(entry.production.bytes).toBe(item.bytes);
      expect(entry.production.sha256).toBe(item.sha256);
      expect(entry.production.visual_review).toBe('approved_realistic_v2');
    }
  });

  it('keeps the committed manifest synchronized with every Episode 01 final', () => {
    for (const [key, item] of Object.entries(expected)) {
      const entry = guide.elements[key];
      const asset = manifest.assets.find((candidate: any) => candidate.asset_id === entry.planned_asset_id);
      expect(asset).toBeDefined();
      expect(asset.version).toBe('2');
      expect(asset.variants[0].uri).toBe(entry.art.path);
      expect(asset.variants[0].format).toBe('webp');
      expect(asset.variants[0].bytes).toBe(item.bytes);
      expect(asset.variants[0].hash).toBe(item.sha256);
    }
  });

  it('closes FG004 without accepting invented shoring connector geometry', () => {
    const item = guide.elements.material_yard;
    expect(item.site_reality_profile.final_scope).toContain('euroform');
    expect(item.site_reality_profile.excluded_from_final).toContain('system_shoring');
    expect(reality.field_guide_section0.material_yard.final_asset_scope.excluded.join(' '))
      .toContain('system-shoring');
  });

  it('keeps FG010 representative rather than claiming an exact product clone', () => {
    const profile = guide.elements.site_weather_station.site_reality_profile;
    expect(profile.exact_manufacturer_clone).toBe(false);
    expect(profile.tower_crane_thresholds_not_universal).toBe(true);
    expect(reality.field_guide_section0.site_weather_station.selected_visual_family.exact_manufacturer_clone)
      .toBe(false);
  });

  it('locks FG001-FG002 to dedicated photorealistic Field Guide assets without promoting map cutouts', () => {
    const finals = {
      site_gate: {
        id: 'FG001',
        path: 'assets/episode01/field-guide/site-gate-final.webp',
        bytes: 17498,
        sha256: 'd7f4a52b8e2732ebdb68da6310308b5a8c2723c17c12a5dc11707333293a94e5',
      },
      pedestrian_gate: {
        id: 'FG002',
        path: 'assets/episode01/field-guide/pedestrian-gate-final.webp',
        bytes: 17442,
        sha256: 'e39b5f791cf4a2bf09c620ecde3a9a80de298db2b259f03492c8b063d0149d01',
      },
    } as const;

    for (const [key, final] of Object.entries(finals) as [keyof typeof finals, (typeof finals)[keyof typeof finals]][]) {
      const entry = guide.elements[key];
      expect(entry.field_guide.id).toBe(final.id);
      expect(entry.field_guide.episode).toBe('EP01');
      expect(entry.field_guide_visual.status).toBe('final');
      expect(entry.field_guide_visual.presentation).toBe('production_realistic_v2');
      expect(entry.field_guide_visual.asset_path).toBe(final.path);
      expect(entry.field_guide_visual.asset_id).toBeUndefined();
      expect(entry.field_guide_visual.source_scene).toContain('approved_field_guide_final_art');
      expect(reality.runtime_assets.site_gate.field_guide_runtime_render.assets[key].bytes).toBe(final.bytes);
      expect(reality.runtime_assets.site_gate.field_guide_runtime_render.assets[key].sha256).toBe(final.sha256);
    }

    expect(guide.elements.site_gate.production_status).toBe('planned');
    expect(guide.elements.pedestrian_gate.production_status).toBe('replacement_required');
    expect(reality.runtime_assets.site_gate.field_guide_runtime_render.version).toBe('korean-site-gate-v3-photoreal');
    expect(reality.runtime_assets.site_gate.field_guide_runtime_render.decisions.join(' ')).toContain('turnstile');
    expect(reality.field_guide_section0.site_gate.final_registration.visual_review).toBe('approved_photorealistic_v3');
    expect(reality.field_guide_section0.pedestrian_gate.final_registration.visual_review).toBe('approved_photorealistic_v3');
    expect(reality.field_guide_section0.site_gate.final_registration.dedicated_map_asset_promoted).toBe(false);
    expect(reality.field_guide_section0.pedestrian_gate.final_registration.dedicated_map_asset_promoted).toBe(false);
  });

  it('surfaces the Korean workplace-entrance rule directly for FG001-FG002', () => {
    expect(legal.profiles.workplace_entrance.law).toBe('산업안전보건기준에 관한 규칙');
    expect(legal.profiles.workplace_entrance.articles).toEqual(['제11조']);
    for (const key of ['site_gate', 'pedestrian_gate'] as const) {
      expect(legal.items[key].bases).toContainEqual({
        profile: 'workplace_entrance',
        applicability: 'direct',
      });
    }
  });

  it('declares FG001-FG010 complete for the Episode 01 field-guide gate', () => {
    expect(reality.episode01_field_guide_completion.status).toBe('complete');
    expect(reality.episode01_field_guide_completion.field_guide_ids)
      .toEqual(['FG001','FG002','FG003','FG004','FG005','FG006','FG007','FG008','FG009','FG010']);
    expect(reality.episode01_field_guide_completion.exceptions).toEqual([]);
  });
});

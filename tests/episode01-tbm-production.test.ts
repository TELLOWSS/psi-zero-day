import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { episode01TbmProduction } from '../src/app/episode01-tbm-production';
import { EpisodeImmersiveScene } from '../src/ui/EpisodeImmersiveScene';

describe('Episode 01 Phase C-3 TBM production quality', () => {
  it('uses the changed-work TBM gap as the reference group scene', () => {
    expect(episode01TbmProduction('e01_08g_tbm_field_gap', 'situation')).toMatchObject({
      phase: 'changed-condition',
      camera_profile: 'condition-wide',
      depth_profile: 'changed-work-layers',
      lighting_profile: 'changed-condition-neutral',
      ui_profile: 'context',
      cast_profile: 'four-person-circle',
    });
  });

  it('hands the first TBM visual lead from Kang to the player when the speaker changes', () => {
    expect(episode01TbmProduction('e01_02_meet_kang', 'kang')?.hero_character_id).toBe('kang_taesik');
    expect(episode01TbmProduction('e01_02_meet_kang', 'player')?.hero_character_id).toBe('player');
  });

  it('moves the visual lead with each field voice instead of collapsing to talking heads', () => {
    expect(episode01TbmProduction('e01_08g_tbm_field_gap', 'lee')?.hero_character_id).toBe('lee_jaehoon');
    expect(episode01TbmProduction('e01_08g_tbm_field_gap', 'kang')?.hero_character_id).toBe('kang_taesik');
    expect(episode01TbmProduction('e01_08g_tbm_field_gap', 'junho')?.hero_character_id).toBe('lim_junho');
    expect(episode01TbmProduction('e01_08g_tbm_field_gap', 'lee')).toMatchObject({
      phase: 'role-voice',
      camera_profile: 'speaker-arc',
      depth_profile: 'speaker-ring',
      ui_profile: 'dialogue',
      cast_profile: 'active-speaker',
    });
  });

  it('returns the whole crew to one decision circle for the changed-work judgment', () => {
    expect(episode01TbmProduction('e01_08g_tbm_field_gap', 'tbm_action')).toEqual({
      phase: 'group-judgment',
      camera_profile: 'decision-circle',
      depth_profile: 'decision-ring',
      lighting_profile: 'decision-amber',
      ui_profile: 'judgment',
      cast_profile: 'decision-circle',
      hero_character_id: 'player',
    });
  });

  it('opens the scene again when changed conditions are rebriefed into field behavior', () => {
    expect(episode01TbmProduction('e01_08g_tbm_field_gap', 'change_control_result')).toMatchObject({
      phase: 'field-rebrief',
      camera_profile: 'rebrief-wide',
      depth_profile: 'rebrief-open',
      lighting_profile: 'rebrief-clear',
      ui_profile: 'result',
      cast_profile: 'rebrief-crew',
    });
    expect(episode01TbmProduction('e01_08h_tbm_return', 'controlled')).toMatchObject({
      phase: 'field-rebrief',
      camera_profile: 'rebrief-wide',
      cast_profile: 'rebrief-crew',
      hero_character_id: 'lim_junho',
    });
  });

  it('keeps paper-gap and silenced outcomes visually distinct from successful rebriefing', () => {
    expect(episode01TbmProduction('e01_08h_tbm_return', 'paper')).toMatchObject({
      phase: 'consequence-return',
      camera_profile: 'consequence-medium',
      depth_profile: 'consequence-ring',
      lighting_profile: 'consequence-soft',
      cast_profile: 'aftermath-circle',
    });
    expect(episode01TbmProduction('e01_08h_tbm_return', 'silenced')?.phase).toBe('consequence-return');
  });

  it('exposes the Phase C-3 production contract on the immersive scene', () => {
    const html = renderToStaticMarkup(createElement(EpisodeImmersiveScene, {
      eventId: 'e01_08g_tbm_field_gap',
      nodeId: 'tbm_action',
      eventTitle: 'TBM과 실제 작업',
      resolve: () => undefined,
      t: (id: string) => id,
    }));

    expect(html).toContain('data-tbm-phase="group-judgment"');
    expect(html).toContain('data-tbm-camera="decision-circle"');
    expect(html).toContain('data-tbm-depth="decision-ring"');
    expect(html).toContain('data-tbm-lighting="decision-amber"');
    expect(html).toContain('data-tbm-ui="judgment"');
    expect(html).toContain('data-tbm-cast="decision-circle"');
    expect(html).toContain('class="tbm-production-layer"');
  });

  it('renders a physical TBM briefing environment without adding new image assets', () => {
    const html = renderToStaticMarkup(createElement(EpisodeImmersiveScene, {
      eventId: 'e01_02_meet_kang',
      nodeId: 'intro',
      eventTitle: '강태식 반장의 TBM',
      resolve: () => undefined,
      t: (id: string) => id,
    }));

    expect(html).toContain('data-tbm-phase="first-briefing"');
    expect(html).toContain('data-tbm-hero="kang_taesik"');
    expect(html).toContain('class="tbm-briefing-board"');
    expect(html).toContain('data-board="work-sequence"');
    expect(html).toContain('class="tbm-background-crew"');
    expect(html).toContain('class="tbm-board-step tbm-board-step-a"');
  });

  it('leaves non-TBM scenes outside the TBM production system', () => {
    expect(episode01TbmProduction('e01_04_junho_signal', 'listen')).toBeUndefined();
    expect(episode01TbmProduction(undefined)).toBeUndefined();
  });
});

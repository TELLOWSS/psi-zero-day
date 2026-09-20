import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  episode01CharacterBlocking,
  episode01UsesCharacterBlocking,
} from '../src/app/episode01-character-blocking';
import { EpisodeImmersiveScene } from '../src/ui/EpisodeImmersiveScene';
import scenes from '../content/episode01/immersive-scenes.json';

describe('Episode 01 cinematic character blocking', () => {
  it('uses authored identity-based positions for inspection scenes', () => {
    expect(episode01CharacterBlocking('e01_08b_inspection_find', 'seo_jeongmin')).toEqual({
      side: 'center',
      depth: 'foreground',
    });
    expect(episode01CharacterBlocking('e01_08b_inspection_find', 'lee_jaehoon')).toEqual({
      side: 'far-right',
      depth: 'midground',
    });
  });

  it('brings the active speaker forward without changing their authored side', () => {
    expect(episode01CharacterBlocking('e01_08i_restart_pressure', 'lim_junho', 'lim_junho')).toEqual({
      side: 'far-right',
      depth: 'foreground',
    });
  });

  it('moves closer relationships inward and strained relationships outward', () => {
    expect(episode01CharacterBlocking('e01_08l_stopwork_return', 'player', null, 'closer')).toEqual({
      side: 'center',
      depth: 'midground',
    });
    expect(episode01CharacterBlocking('e01_08l_stopwork_return', 'lim_junho', null, 'strained')).toEqual({
      side: 'far-right',
      depth: 'midground',
    });
  });

  it('authors restart consequences as different group compositions', () => {
    expect(episode01CharacterBlocking('e01_08j_restart_return', 'player', null, undefined, 'premature')).toEqual({
      side: 'far-left',
      depth: 'midground',
    });
    expect(episode01CharacterBlocking('e01_08j_restart_return', 'player', null, undefined, 'distorted')).toEqual({
      side: 'right',
      depth: 'foreground',
    });
    expect(episode01CharacterBlocking('e01_08j_restart_return', 'lim_junho', null, undefined, 'controlled')).toEqual({
      side: 'right',
      depth: 'foreground',
    });
  });

  it('shows social aftermath spatially in stop-work results', () => {
    expect(episode01CharacterBlocking('e01_08k_stopwork_aftershock', 'lim_junho', null, undefined, 'ignore_social_result')).toEqual({
      side: 'far-right',
      depth: 'background',
    });
    expect(episode01CharacterBlocking('e01_08k_stopwork_aftershock', 'lim_junho', null, undefined, 'protect_process_result')).toEqual({
      side: 'right',
      depth: 'foreground',
    });
    expect(episode01CharacterBlocking('e01_08k_stopwork_aftershock', 'kang_taesik', null, undefined, 'public_boundary_result')).toEqual({
      side: 'far-left',
      depth: 'background',
    });
  });

  it('extends authored blocking into FIELD while leaving unrelated scenes untouched', () => {
    expect(episode01UsesCharacterBlocking('e01_08i_restart_pressure')).toBe(true);
    expect(episode01UsesCharacterBlocking('e01_07_first_pour')).toBe(true);
    expect(episode01CharacterBlocking('e01_07_first_pour', 'player')).toEqual({
      side: 'far-left',
      depth: 'midground',
    });
    expect(episode01UsesCharacterBlocking('e01_06_pump_arrival')).toBe(false);
    expect(episode01CharacterBlocking('e01_06_pump_arrival', 'player')).toBeUndefined();
  });
  it('renders authored blocking metadata into the immersive character layers', () => {
    const html = renderToStaticMarkup(createElement(EpisodeImmersiveScene, {
      eventId: 'e01_08k_stopwork_aftershock',
      nodeId: 'protect_process_result',
      eventTitle: '작업중지 이후',
      resolve: () => undefined,
      t: (id: string) => id,
    }));

    expect(html).toContain('data-character-blocking="true"');
    expect(html).toContain('data-character="player"');
    expect(html).toContain('data-character="lim_junho"');
    expect(html).toContain('data-blocking-side="left" data-blocking-depth="foreground"');
    expect(html).toContain('data-blocking-side="right" data-blocking-depth="foreground"');
  });

  it('keeps stop-work return outcomes spatially distinct', () => {
    expect(episode01CharacterBlocking('e01_08l_stopwork_return', 'lim_junho', null, undefined, 'silenced')).toEqual({
      side: 'far-right',
      depth: 'background',
    });
    expect(episode01CharacterBlocking('e01_08l_stopwork_return', 'lim_junho', null, undefined, 'route')).toEqual({
      side: 'right',
      depth: 'foreground',
    });
  });

  it('stages inspection outcomes as different human compositions', () => {
    expect(episode01CharacterBlocking('e01_08b_inspection_find', 'lee_jaehoon', null, undefined, 'full_stop_result')).toEqual({
      side: 'far-right',
      depth: 'background',
    });
    expect(episode01CharacterBlocking('e01_08b_inspection_find', 'lee_jaehoon', null, undefined, 'quick_photo_result')).toEqual({
      side: 'right',
      depth: 'foreground',
    });
    expect(episode01CharacterBlocking('e01_08d_reinspection', 'lee_jaehoon', null, undefined, 'lee_rework')).toEqual({
      side: 'center',
      depth: 'foreground',
    });
  });

  it('covers every cast member in the authored inspection-restart-stopwork blocking arc', () => {
    const blockedEvents = [
      'e01_08b_inspection_find',
      'e01_08c_site_pushback',
      'e01_08d_reinspection',
      'e01_08i_restart_pressure',
      'e01_08j_restart_return',
      'e01_08k_stopwork_aftershock',
      'e01_08l_stopwork_return',
      'e01_08e_responsibility_clash',
      'e01_08f_report_return',
      'e01_08m_instruction_cascade',
      'e01_08n_instruction_return',
      'e01_08o_record_pressure',
      'e01_08p_record_return',
    ] as const;

    for (const eventId of blockedEvents) {
      for (const characterId of scenes.events[eventId].cast) {
        expect(episode01CharacterBlocking(eventId, characterId), `${eventId}:${characterId}`).toBeDefined();
      }
    }
  });

  it('stages responsibility and record outcomes without cast-index dependence', () => {
    expect(episode01CharacterBlocking('e01_08e_responsibility_clash', 'player', null, undefined, 'timeline_result')).toEqual({
      side: 'center',
      depth: 'foreground',
    });
    expect(episode01CharacterBlocking('e01_08m_instruction_cascade', 'lim_junho', null, undefined, 'blame_worker_result')).toEqual({
      side: 'far-right',
      depth: 'background',
    });
    expect(episode01CharacterBlocking('e01_08p_record_return', 'player', null, undefined, 'preserved')).toEqual({
      side: 'center',
      depth: 'foreground',
    });
  });
  it('centers the player when Day 02 returns to the gate', () => {
    expect(episode01CharacterBlocking('e01_10_next_day_tease', 'player')).toEqual({
      side: 'center',
      depth: 'foreground',
    });
  });

});

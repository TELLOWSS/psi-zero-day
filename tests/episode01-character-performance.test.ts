import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  episode01CharacterPerformance,
  episode01UsesCharacterPerformance,
} from '../src/app/episode01-character-performance';
import { EpisodeImmersiveScene } from '../src/ui/EpisodeImmersiveScene';
import scenes from '../content/episode01/immersive-scenes.json';

describe('Episode 01 cinematic character performance', () => {
  it('keeps the approved five-expression vocabulary', () => {
    const states = [
      episode01CharacterPerformance('e01_08b_inspection_find', 'inspection', 'seo_jeongmin'),
      episode01CharacterPerformance('e01_08i_restart_pressure', 'kang', 'kang_taesik'),
      episode01CharacterPerformance('e01_08j_restart_return', 'controlled', 'lim_junho'),
      episode01CharacterPerformance('e01_08k_stopwork_aftershock', 'public_boundary_result', 'kang_taesik'),
    ].filter(Boolean);
    const allowed = new Set(['neutral', 'concern', 'resolve', 'relief', 'conflict']);
    for (const state of states) expect(allowed.has(state!.expression)).toBe(true);
  });

  it('makes the inspection finding read as inspection rather than generic idle art', () => {
    expect(episode01CharacterPerformance(
      'e01_08b_inspection_find',
      'inspection',
      'seo_jeongmin',
      'seo_jeongmin',
    )).toEqual({
      expression: 'neutral',
      pose: 'inspect',
      motion: 'enter',
    });
  });

  it('makes restart pressure visibly different by role', () => {
    expect(episode01CharacterPerformance(
      'e01_08i_restart_pressure',
      'kang',
      'kang_taesik',
      'kang_taesik',
    )).toEqual({
      expression: 'conflict',
      pose: 'press',
      motion: 'reengage',
    });
    expect(episode01CharacterPerformance(
      'e01_08i_restart_pressure',
      'junho',
      'lim_junho',
      'lim_junho',
    )).toEqual({
      expression: 'concern',
      pose: 'hesitate',
      motion: 'reengage',
    });
  });

  it('shows stop-work social aftermath through withdrawal and re-engagement', () => {
    expect(episode01CharacterPerformance(
      'e01_08k_stopwork_aftershock',
      'ignore_social_result',
      'lim_junho',
    )).toEqual({
      expression: 'concern',
      pose: 'withdraw',
      motion: 'withdraw',
    });
    expect(episode01CharacterPerformance(
      'e01_08k_stopwork_aftershock',
      'protect_process_result',
      'lim_junho',
    )).toEqual({
      expression: 'relief',
      pose: 'reengage',
      motion: 'reengage',
    });
  });

  it('lets relationship aftermath affect performance without score colors', () => {
    expect(episode01CharacterPerformance(
      'e01_08l_stopwork_return',
      'resolve',
      'lim_junho',
      null,
      'strained',
    )).toEqual({
      expression: 'concern',
      pose: 'hesitate',
      motion: 'withdraw',
    });
  });

  it('renders expression, pose and presence motion into character layers', () => {
    const html = renderToStaticMarkup(createElement(EpisodeImmersiveScene, {
      eventId: 'e01_08k_stopwork_aftershock',
      nodeId: 'protect_process_result',
      eventTitle: '작업중지 이후',
      resolve: () => undefined,
      t: (id: string) => id,
    }));

    expect(html).toContain('data-character-performance="true"');
    expect(html).toContain('data-character="lim_junho"');
    expect(html).toContain('data-expression="relief"');
    expect(html).toContain('data-pose="reengage"');
    expect(html).toContain('data-presence-motion="reengage"');
  });

  it('extends authored performance into FIELD while leaving unrelated scenes untouched', () => {
    expect(episode01UsesCharacterPerformance('e01_08k_stopwork_aftershock')).toBe(true);
    expect(episode01UsesCharacterPerformance('e01_07_first_pour')).toBe(true);
    expect(episode01CharacterPerformance('e01_07_first_pour', 'pour', 'player')).toMatchObject({
      expression: 'concern',
      pose: 'observe',
    });
    expect(episode01UsesCharacterPerformance('e01_06_pump_arrival')).toBe(false);
    expect(episode01CharacterPerformance('e01_06_pump_arrival', 'resolve', 'player')).toBeUndefined();
  });
  it('uses the existing Junho concerned art in a live concern-state scene when available', () => {
    const html = renderToStaticMarkup(createElement(EpisodeImmersiveScene, {
      eventId: 'e01_08i_restart_pressure',
      nodeId: 'junho',
      speakerId: 'lim_junho',
      eventTitle: '재개 압박',
      resolve: (assetId: string) => {
        if (assetId === 'ep01.character.lim_junho.concerned') {
          return 'assets/episode01/characters/lim-junho-concerned.webp';
        }
        if (assetId === 'ep01.character.lim_junho.map') {
          return 'assets/episode01/characters/lim-junho-map.webp';
        }
        return undefined;
      },
      t: (id: string) => id,
    }));

    expect(html).toContain('data-character="lim_junho"');
    expect(html).toContain('data-expression="concern"');
    expect(html).toContain('data-performance-asset="expression"');
    expect(html).toContain('lim-junho-concerned.webp');
  });

  it('directs responsibility, instruction and record pressure as distinct human performances', () => {
    expect(episode01CharacterPerformance('e01_08e_responsibility_clash', 'defensive_result', 'oh_seungjae')).toEqual({
      expression: 'conflict',
      pose: 'press',
      motion: 'hold',
    });
    expect(episode01CharacterPerformance('e01_08m_instruction_cascade', 'blame_worker_result', 'lim_junho')).toEqual({
      expression: 'concern',
      pose: 'withdraw',
      motion: 'withdraw',
    });
    expect(episode01CharacterPerformance('e01_08p_record_return', 'preserved', 'player')).toEqual({
      expression: 'resolve',
      pose: 'document',
      motion: 'hold',
    });
  });

  it('covers every cast member in the authored late responsibility-to-record arc', () => {
    const events = [
      'e01_08e_responsibility_clash',
      'e01_08f_report_return',
      'e01_08m_instruction_cascade',
      'e01_08n_instruction_return',
      'e01_08o_record_pressure',
      'e01_08p_record_return',
    ] as const;
    for (const eventId of events) {
      expect(episode01UsesCharacterPerformance(eventId)).toBe(true);
      for (const characterId of scenes.events[eventId].cast) {
        expect(episode01CharacterPerformance(eventId, null, characterId), `${eventId}:${characterId}`).toBeDefined();
      }
    }
  });
  it('stages the Day 02 gate return as a deliberate re-entry', () => {
    expect(episode01CharacterPerformance(
      'e01_10_next_day_tease',
      'tease',
      'player',
    )).toEqual({
      expression: 'neutral',
      pose: 'reengage',
      motion: 'enter',
    });
  });

});

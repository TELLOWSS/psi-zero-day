import { describe, expect, it } from 'vitest';
import {
  episode01CharacterBlocking,
  episode01UsesCharacterBlocking,
} from '../src/app/episode01-character-blocking';

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

  it('does not override scenes outside the authored blocking arc', () => {
    expect(episode01UsesCharacterBlocking('e01_08i_restart_pressure')).toBe(true);
    expect(episode01UsesCharacterBlocking('e01_07_first_pour')).toBe(false);
    expect(episode01CharacterBlocking('e01_07_first_pour', 'player')).toBeUndefined();
  });
});

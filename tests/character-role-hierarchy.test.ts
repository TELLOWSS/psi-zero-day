import { describe, expect, it } from 'vitest';
import episodeKo from '../content/episode01/ko.json';
import responsibilityKo from '../content/episode01/responsibility-ko.json';
import art from '../content/episode01/character-art-spec.json';
import { EpisodeSession } from '../src/app/episode-session';

const messages = episodeKo.messages;
const responsibilityMessages = responsibilityKo.messages;

describe('construction team role hierarchy', () => {
  it('keeps the general-contractor manager and site deputy distinct', () => {
    expect(messages['cast.lee_jaehoon.role']).toBe('공사대리');
    expect(responsibilityMessages['cast.oh_seungjae.role']).toBe('현장 공사팀장');
    expect(messages['cast.lee_jaehoon.role']).not.toBe(responsibilityMessages['cast.oh_seungjae.role']);
  });

  it('aligns the manager art identity with the hierarchy', () => {
    expect(art.characters.oh_seungjae.role).toBe('원도급 현장 공사팀장');
    expect(art.characters.lee_jaehoon.role).toBe('공사대리');
  });

  it('separates grounded trade labels from site roles where the content already supports it', () => {
    expect(messages['cast.player.trade']).toBe('안전관리');
    expect(messages['cast.kang_taesik.trade']).toBe('형틀');
    expect(messages['cast.yoon_sungho.trade']).toBe('철근');
    expect(messages['cast.kang_taesik.trade']).not.toBe(messages['cast.kang_taesik.role']);
    expect(messages['cast.yoon_sungho.trade']).not.toBe(messages['cast.yoon_sungho.role']);
  });


  it('exposes grounded trade through the playable session for scene identity UI', () => {
    const session = new EpisodeSession();
    expect(session.character('kang_taesik')).toMatchObject({ name: '강태식', role: '형틀반장', trade: '형틀' });
    expect(session.character('yoon_sungho')).toMatchObject({ name: '윤성호', role: '철근반장', trade: '철근' });
    expect(session.character('lee_jaehoon')?.trade).toBe(session.character('lee_jaehoon')?.role);
  });
});

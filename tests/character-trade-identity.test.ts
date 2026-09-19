import { describe, expect, it } from 'vitest';
import characters from '../content/episode01/characters.json';
import inspectionCharacters from '../content/episode01/inspection-characters.json';
import responsibilityCharacters from '../content/episode01/responsibility-characters.json';
import { EpisodeSession } from '../src/app/episode-session';

describe('Episode 01 character role and trade identity', () => {
  it('separates field scope from role only when the content is explicit', () => {
    const all = [...characters, ...inspectionCharacters, ...responsibilityCharacters];
    const byId = Object.fromEntries(all.map(character => [character.id, character]));

    expect(byId.kang_taesik.trade_text_id).toBe('cast.kang_taesik.trade');
    expect(byId.yoon_sungho.trade_text_id).toBe('cast.yoon_sungho.trade');
    expect(byId.lee_jaehoon.trade_text_id).toBe('cast.lee_jaehoon.trade');
    expect(byId.choi_minseok.trade_text_id).toBe('cast.choi_minseok.trade');
    expect(byId.seo_jeongmin.trade_text_id).toBe('cast.seo_jeongmin.trade');
    expect(byId.oh_seungjae.trade_text_id).toBe('cast.oh_seungjae.trade');
    expect(byId.lim_junho.trade_text_id).toBe(byId.lim_junho.role_text_id);
  });

  it('projects a distinct trade to the UI without inventing one for an unspecified worker', () => {
    const session = new EpisodeSession();
    expect(session.character('kang_taesik')).toMatchObject({ role: '형틀반장', trade: '형틀' });
    expect(session.character('choi_minseok')).toMatchObject({ role: '크레인 신호수', trade: '양중·신호' });
    expect(session.character('lee_jaehoon')).toMatchObject({ role: '공사대리', trade: '공사관리' });
    expect(session.character('lim_junho')).toEqual({ id: 'lim_junho', name: '임준호', role: '신입근로자' });
  });
});

// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EpisodeSession } from '../src/app/episode-session';
import { PlayableEpisode } from '../src/ui/PlayableEpisode';
import { CharacterCard, SiteScene } from '../src/ui/VisualSlot';
import visuals from '../content/episode01/visuals.json';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root;
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

function advance(session: EpisodeSession) {
  const s = session.getSnapshot(); const p = s.presentation.find(c => 'node_id' in c)!;
  if (!('node_id' in p) || p.type === 'SHOW_CHOICE') throw new Error('Expected continuation');
  act(() => { session.dispatch({ type: 'advance_event', instance_id: p.instance_id, node_id: p.node_id }, s.revision); });
}

describe('TASK-006A visual semantics', () => {
  it('keeps distinct costume geometry and independent SVG definitions when artwork slots coexist', () => {
    const session = new EpisodeSession();
    const ids = Object.keys(visuals.characters);
    act(() => root.render(<><SiteScene /><SiteScene />{ids.map(id => <CharacterCard key={id} person={session.character(id)!} />)}</>));
    const cards = [...container.querySelectorAll('.character-card')];
    expect(cards).toHaveLength(6);
    const costumes = cards.map(card => [...card.querySelectorAll('.worker-mark > path')].map(p => p.getAttribute('d')).join('|'));
    expect(new Set(costumes).size).toBe(6);
    const definitionIds = [...container.querySelectorAll('svg [id]')].map(n => n.id);
    expect(new Set(definitionIds).size).toBe(definitionIds.length);
    for (const [index, card] of cards.entries()) {
      expect(card.getAttribute('aria-label')).toContain(session.character(ids[index]!)!.name);
      expect(card.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('exposes exactly the active speaker while decorative people remain outside the accessibility tree', () => {
    const session = new EpisodeSession();
    act(() => { root.render(<PlayableEpisode session={session} />); session.start(0); });
    expect(container.querySelector('.is-speaking')).toBeNull();
    advance(session);
    expect(container.querySelectorAll('.is-speaking')).toHaveLength(1);
    expect(container.querySelector('.is-speaking')!.getAttribute('data-npc-id')).toBe('kang_taesik');
    expect(container.querySelector('.speaker-label')!.textContent).toBe(session.t('ui.speaking'));
    expect(container.querySelector('.site-scene')!.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('.site-scene button, .site-scene [tabindex]')).toBeNull();
    advance(session);
    expect(container.querySelectorAll('.is-speaking')).toHaveLength(1);
    expect(container.querySelector('.is-speaking')!.getAttribute('data-npc-id')).toBe('player');
  });

  it('attributes feedback to its affected NPC even when the scene has already moved to narration', () => {
    const session = new EpisodeSession();
    act(() => { root.render(<PlayableEpisode session={session} />); session.start(0); });
    for (let step = 0; step < 15 && !session.getSnapshot().dialogue?.responses.length; step++) advance(session);
    const s = session.getSnapshot(); const p = s.presentation.find(c => c.type === 'SHOW_CHOICE')!;
    if (p.type !== 'SHOW_CHOICE') throw new Error('Expected plan choice');
    act(() => { session.dispatch({ type: 'choose_event', instance_id: p.instance_id, node_id: p.node_id, choice_id: 'delegate_kang' }, s.revision); });
    expect(session.getSnapshot().dialogue?.speaker_id).toBeUndefined();
    const feedback = container.querySelector('.relationship-feedback > [data-npc-id="kang_taesik"]')!;
    expect(feedback.textContent).toContain(session.character('kang_taesik')!.name);
    expect(feedback.textContent).toContain('+8');
    expect(container.querySelector('.game-header .relationship-feedback')).toBeNull();
    advance(session);
    expect(container.querySelector('.relationship-feedback')).toBeNull();
  });
});

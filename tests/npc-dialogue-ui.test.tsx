// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EpisodeSession } from '../src/app/episode-session';
import { PlayableEpisode } from '../src/ui/PlayableEpisode';
import { inspectRelationshipDeltas } from '../src/engine/relations';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root;
let session: EpisodeSession;
beforeEach(() => {
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  session = new EpisodeSession();
  act(() => root.render(<PlayableEpisode session={session} />));
  act(() => session.start(0));
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
function click(text: string) {
  const button = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes(text));
  if (!button) throw new Error(`Missing button: ${text}`);
  act(() => button.click());
}
function continueCurrent() {
  const coldOpen = container.querySelector<HTMLButtonElement>('.episode-cold-open-cta');
  if (coldOpen) { act(() => coldOpen.click()); return; }

  const outcome = container.querySelector<HTMLButtonElement>('.strategy-outcome-next');
  if (outcome) { act(() => outcome.click()); return; }

  const transition = container.querySelector<HTMLButtonElement>('.strategy-transition-button');
  if (transition) { act(() => transition.click()); return; }

  const next = container.querySelector<HTMLButtonElement>('.continue-button');
  if (next) { act(() => next.click()); return; }

  throw new Error(`No visible continue control for ${session.getSnapshot().presentation.map(item => item.type).join(',')}`);
}
function continueToChoice() {
  for (let i = 0; i < 40; i++) {
    const choice = session.getSnapshot().presentation.find(item => item.type === 'SHOW_CHOICE');
    if (choice?.type === 'SHOW_CHOICE' && container.querySelector('.choice-panel button')) return;
    continueCurrent();
  }
  throw new Error('No response node reached');
}
function choose(id: string) {
  const presentation = session.getSnapshot().presentation.find(item => item.type === 'SHOW_CHOICE');
  if (presentation?.type !== 'SHOW_CHOICE') throw new Error('No visible choice presentation');
  const response = presentation.choices.find(item => item.choice_id === id);
  if (!response) throw new Error(`Unknown response: ${id}`);
  const button = Array.from(container.querySelectorAll<HTMLButtonElement>('.choice-panel button'))
    .find(item => !item.disabled && item.textContent?.includes(session.t(response.text_id)));
  if (!button) throw new Error(`Missing choice button: ${id}`);
  act(() => button.click());
}

describe('TASK-006 character interaction UI', () => {
  it('shows the role context only on Junho’s first speaking node', () => {
    continueToChoice(); choose('follow_junho');
    for (let i = 0; i < 20 && session.getSnapshot().dialogue?.text_id !== 'ep01.junho.signal'; i++) continueCurrent();
    expect(session.getSnapshot().dialogue?.text_id).toBe('ep01.junho.signal');
    const card = container.querySelector('.character-card')!;
    const intro = container.querySelector('.character-first-contact')!;
    expect(card.getAttribute('data-first-contact')).toBe('true');
    expect(intro).not.toBeNull();
    expect(intro.textContent).toContain(session.t('ui.character.first_appearance'));
    expect(intro.textContent).toContain(session.t('cast.lim_junho.intro'));
    expect(container.querySelector('.character-identity-line')?.textContent).toContain('임준호');
    expect(container.querySelector('.character-identity-line')?.textContent).toContain('신입근로자');
    continueCurrent();
    expect(session.getSnapshot().dialogue?.text_id).toBe('ep01.junho.detail');
    expect(container.querySelector('.character-first-contact')).toBeNull();
    expect(container.querySelector('.character-card')?.hasAttribute('data-first-contact')).toBe(false);
  });

  it('retains the NPC identity and silhouette while presenting distinct Junho response routes', () => {
    continueToChoice(); choose('follow_junho'); continueToChoice();
    expect(session.getSnapshot().dialogue?.speaker_id).toBe('lim_junho');
    const card = container.querySelector('.character-card')!;
    expect(card.textContent).toContain(session.character('lim_junho')!.name);
    expect(card.textContent).toContain(session.character('lim_junho')!.role);
    expect(card.querySelector('.worker-mark')).not.toBeNull();
    expect(card.querySelector('.portrait-image')?.getAttribute('src')).toContain('lim-junho-concerned.webp');
    expect(container.querySelectorAll('.choice-panel button')).toHaveLength(3);
    const responses = session.getSnapshot().dialogue!.responses;
    expect(responses).toHaveLength(3);
    expect(new Set(responses.map(response => JSON.stringify(response.consequences))).size).toBeGreaterThan(1);
  });

  it('shows an attributed relationship delta before confirmation and clears it on the next action', () => {
    continueToChoice(); choose('delegate_kang');
    const feedback = container.querySelector('.strategy-outcome-relations')!;
    expect(feedback).not.toBeNull();
    expect(feedback.textContent).toContain(session.character('kang_taesik')!.name);
    expect(feedback.textContent).toContain(session.t('ui.relationship.trust'));
    expect(feedback.textContent).toContain('+8');
    expect(session.getSnapshot().phase).toBe('playing');
    expect(session.getSnapshot().state!.flags.episode01_completed).toBeUndefined();
    expect(feedback.textContent).not.toContain('38');
    const before = session.getSnapshot();
    act(() => root.render(<PlayableEpisode session={session} />));
    expect(session.getSnapshot()).toBe(before);
    continueCurrent();
    expect(container.querySelector('.strategy-outcome-relations')).toBeNull();
    expect(container.querySelector('.relationship-feedback')).toBeNull();
    expect(inspectRelationshipDeltas(session.getSnapshot().state!, 'kang_taesik')).toHaveLength(1);
  });

  it('shows both negative consequences of FORCE_CLEAR without a correct/incorrect label', () => {
    continueToChoice(); choose('delegate_kang');
    continueToChoice(); choose('check_self');
    continueToChoice(); choose('force_clear');
    const feedback = container.querySelector('.strategy-outcome-relations')!;
    expect(feedback).not.toBeNull();
    expect(feedback.querySelectorAll('span')).toHaveLength(2);
    expect(feedback.textContent).toContain('-5');
    expect(container.textContent).not.toMatch(/GOOD|BAD|SUCCESS|FAIL|RELATION_CONFLICT/);
  });

  it.each(['delegate_kang', 'negotiate_yoon'] as const)('later renders the reaction caused by %s', plan => {
    continueToChoice(); choose(plan);
    continueToChoice(); choose('check_self');
    continueToChoice(); choose('request_delay');
    for (let i = 0; i < 20 && session.getSnapshot().dialogue?.event_id !== 'e01_08_reactions'; i++) continueCurrent();
    const key = plan === 'delegate_kang' ? 'ep01.reactions.kang.high' : 'ep01.reactions.kang.low';
    expect(session.getSnapshot().dialogue?.text_id).toBe(key);
    expect(container.querySelector('.dialogue-text')?.textContent).toBe(session.t(key));
    expect(container.querySelector('.portrait-image')?.getAttribute('src')).toContain(
      plan === 'delegate_kang' ? 'kang-taesik-supportive.webp' : 'kang-taesik-portrait.webp',
    );
    expect(session.getSnapshot().phase).toBe('playing');
  });

  it.each(['delegate_kang', 'negotiate_yoon'] as const)('shows Yoon’s reaction portrait for the actual %s branch', plan => {
    continueToChoice(); choose(plan);
    continueToChoice(); choose('check_self');
    continueToChoice(); choose('request_delay');
    for (let i = 0; i < 30 && !session.getSnapshot().dialogue?.text_id.startsWith('ep01.reactions.yoon.'); i++) continueCurrent();
    const cooperative = plan === 'negotiate_yoon';
    expect(session.getSnapshot().dialogue?.text_id).toBe(cooperative ? 'ep01.reactions.yoon.high' : 'ep01.reactions.yoon.low');
    expect(container.querySelector('.portrait-image')?.getAttribute('src')).toContain(cooperative ? 'yoon-sungho-appreciative.webp' : 'yoon-sungho-portrait.webp');
  });

  it('inspects canonical values, delta history and dialogue conditions without changing state', async () => {
    continueToChoice(); choose('follow_junho'); continueToChoice();
    const before = session.getSnapshot();
    await act(async () => { click(session.t('ui.debug')); });
    await act(async () => { await vi.dynamicImportSettled(); });
    const panel = container.querySelector('.debug-panel')!;
    expect(panel.textContent).toContain('compliance');
    expect(panel.textContent).toContain('effect_instance_id');
    expect(panel.textContent).toContain('follow_junho');
    expect(panel.textContent).toContain('event_conditions');
    expect(panel.textContent).toContain('consequences');
    expect(panel.querySelectorAll('input, textarea, select')).toHaveLength(0);
    expect(session.getSnapshot()).toBe(before);
  });

  it('clears feedback and relationship history on clean restart', () => {
    continueToChoice(); choose('delegate_kang');
    expect(session.getSnapshot().relationshipFeedback).toHaveLength(1);
    act(() => session.restart(session.getSnapshot().revision));
    expect(session.getSnapshot().relationshipFeedback).toEqual([]);
    act(() => session.start(session.getSnapshot().revision));
    expect(inspectRelationshipDeltas(session.getSnapshot().state!, 'kang_taesik')).toEqual([]);
    expect(container.querySelector('.relationship-feedback')).toBeNull();
  });
});

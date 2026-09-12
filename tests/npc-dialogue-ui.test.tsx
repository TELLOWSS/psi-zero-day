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
function continueToChoice() {
  for (let i = 0; i < 20; i++) {
    if (session.getSnapshot().dialogue?.responses.length) return;
    click(session.t('ui.continue'));
  }
  throw new Error('No response node reached');
}
function choose(id: string) {
  const response = session.getSnapshot().dialogue?.responses.find(r => r.choice_id === id);
  if (!response) throw new Error('Unknown response');
  click(session.t(response.text_id));
}

describe('TASK-006 character interaction UI', () => {
  it('retains the NPC identity and silhouette while asking two different Junho responses', () => {
    continueToChoice(); choose('follow_junho'); continueToChoice();
    expect(session.getSnapshot().dialogue?.speaker_id).toBe('lim_junho');
    const card = container.querySelector('.character-card')!;
    expect(card.textContent).toContain(session.character('lim_junho')!.name);
    expect(card.textContent).toContain(session.character('lim_junho')!.role);
    expect(card.querySelector('.worker-mark')).not.toBeNull();
    expect(container.querySelectorAll('.choice-panel button')).toHaveLength(2);
    const responses = session.getSnapshot().dialogue!.responses;
    expect(responses[0]!.consequences).not.toEqual(responses[1]!.consequences);
  });

  it('shows an attributed relationship delta before completion and clears it on the next action', () => {
    continueToChoice(); choose('delegate_kang');
    const feedback = container.querySelector('.relationship-feedback')!;
    expect(feedback.textContent).toContain(session.character('kang_taesik')!.name);
    expect(feedback.textContent).toContain(session.t('ui.relationship.trust'));
    expect(feedback.textContent).toContain('+8');
    expect(session.getSnapshot().phase).toBe('playing');
    expect(session.getSnapshot().state!.flags.episode01_completed).toBeUndefined();
    expect(feedback.textContent).not.toContain('38'); // Not the permanent relationship total.
    const before = session.getSnapshot();
    act(() => root.render(<PlayableEpisode session={session} />));
    expect(session.getSnapshot()).toBe(before);
    click(session.t('ui.continue'));
    expect(container.querySelector('.relationship-feedback')).toBeNull();
    expect(inspectRelationshipDeltas(session.getSnapshot().state!, 'kang_taesik')).toHaveLength(1);
  });

  it('shows both negative consequences of FORCE_CLEAR without a correct/incorrect label', () => {
    continueToChoice(); choose('delegate_kang'); continueToChoice(); choose('check_self'); choose('force_clear');
    expect(container.querySelectorAll('.relationship-feedback > span')).toHaveLength(2);
    expect(Array.from(container.querySelectorAll('.delta-negative')).map(n => n.textContent)).toEqual(['-5', '-5']);
    expect(container.textContent).not.toMatch(/GOOD|BAD|SUCCESS|FAIL|RELATION_CONFLICT/);
  });

  it.each(['delegate_kang', 'negotiate_yoon'] as const)('later renders the reaction caused by %s', plan => {
    continueToChoice(); choose(plan); continueToChoice(); choose('check_self'); choose('request_delay');
    for (let i = 0; i < 12 && session.getSnapshot().dialogue?.event_id !== 'e01_08_reactions'; i++) click(session.t('ui.continue'));
    const key = plan === 'delegate_kang' ? 'ep01.reactions.kang.high' : 'ep01.reactions.kang.low';
    expect(session.getSnapshot().dialogue?.text_id).toBe(key);
    expect(container.querySelector('.dialogue-text')?.textContent).toBe(session.t(key));
    expect(session.getSnapshot().phase).toBe('playing');
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

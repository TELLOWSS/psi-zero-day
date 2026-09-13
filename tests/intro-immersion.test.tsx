// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EpisodeSession } from '../src/app/episode-session';
import { PlayableEpisode } from '../src/ui/PlayableEpisode';
import { SiteAudio } from '../src/presentation/site-audio';
import { sceneContext } from '../src/ui/scene-context';
import { createEpisode01Registry } from '../src/content/episode01';
import immersion from '../content/episode01/immersion.json';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement; let root: Root; let session: EpisodeSession;
beforeEach(() => {
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  session = new EpisodeSession(); act(() => root.render(<PlayableEpisode session={session} />));
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });
function click(selector: string) {
  const button = container.querySelector<HTMLButtonElement>(selector);
  if (!button) throw new Error(`Missing button ${selector}`);
  act(() => button.click());
}
function start() { click('.primary-button'); }
function advance() { click('.continue-button'); }
function plan() { start(); for (let i = 0; i < 7; i++) advance(); }

describe('TASK-006A opening refinement', () => {
  it('resolves every presentation reference against current authored content and localization', () => {
    const content = createEpisode01Registry().getValidatedContent();
    expect(Object.keys(immersion.scenes).sort()).toEqual(content.events.map(e => e.event_id).sort());
    const texts = new Set(content.events.flatMap(e => e.dialogue.map(n => n.text_id)));
    for (const id of Object.keys(immersion.shots)) expect(texts.has(id)).toBe(true);
    for (const [id, identity] of Object.entries(immersion.characters)) {
      expect(content.characters.some(c => c.id === id)).toBe(true);
      for (const textId of Object.values(identity)) expect(session.t(textId)).not.toBe(textId);
    }
    for (const context of Object.values(immersion.scenes)) {
      expect(session.t(context.location_text_id)).not.toBe(context.location_text_id);
      expect(session.t(context.tension_text_id)).not.toBe(context.tension_text_id);
    }
  });

  it('connects the opening to a rich first meeting and an in-world protagonist without extra commands', () => {
    start(); expect(container.querySelector('.opening-scene')).not.toBeNull();
    expect(container.querySelector('.site-scene')!.getAttribute('data-lighting')).toBe('pre_work');
    advance();
    const card = container.querySelector('.is-introduction')!;
    expect(card.textContent).toContain('강태식');
    expect(card.textContent).toContain('형틀반장');
    expect(card.textContent).toContain(session.t('ui.domain.formwork'));
    expect(card.textContent).toContain(session.t('ui.function.kang'));
    expect(session.getSnapshot().dialogue?.text_id).toBe('ep01.meet.kang');
    advance();
    expect(container.querySelector('.character-identity strong')!.textContent).toBe(session.t('ui.protagonist'));
    expect(container.textContent).not.toContain('플레이어');
    expect(session.getSnapshot().dialogue?.speaker_id).toBe('player');
    expect(session.character('player')!.name).toBe('플레이어'); // Canonical identity was not rewritten.
  });

  it('changes object emphasis with the existing speakers and retains the four original responses', () => {
    start(); for (let i = 0; i < 4; i++) advance();
    expect(container.querySelector('.site-scene')!.getAttribute('data-scene-focus')).toBe('coordination');
    expect(container.querySelector('.character-domain')!.textContent).toBe(session.t('ui.domain.foundation'));
    advance(); expect(container.querySelector('.site-scene')!.getAttribute('data-scene-focus')).toBe('formwork');
    advance(); expect(container.querySelector('.site-scene')!.getAttribute('data-scene-focus')).toBe('rebar');
    expect(container.querySelector('.is-introduction')!.textContent).toContain('윤성호');
    advance();
    expect(container.querySelector('.choice-content h2')!.textContent).toBe(session.t('ep01.plan.prompt'));
    expect(session.t('ep01.plan.prompt')).not.toContain('누구에게 말을 걸까');
    expect(container.querySelectorAll('.choice-panel button')).toHaveLength(4);
    expect(session.getSnapshot().state!.event_runtime.choice_history).toHaveLength(0);
    const before = session.getSnapshot(); sceneContext('unknown', 'unknown');
    expect(session.getSnapshot()).toBe(before);
  });

  it('starts muted, enables only by gesture and toggles sound without changing the session', async () => {
    const enable = vi.spyOn(SiteAudio.prototype, 'enable').mockResolvedValue();
    const mute = vi.spyOn(SiteAudio.prototype, 'mute');
    const before = session.getSnapshot();
    expect(enable).not.toHaveBeenCalled();
    expect(container.querySelector('.audio-toggle')!.getAttribute('aria-pressed')).toBe('false');
    await act(async () => click('.audio-toggle'));
    expect(enable).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.audio-toggle')!.getAttribute('aria-pressed')).toBe('true');
    click('.audio-toggle'); expect(mute).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.audio-toggle')!.getAttribute('aria-pressed')).toBe('false');
    expect(session.getSnapshot()).toBe(before);
  });

  it('keeps gameplay usable if browser audio is unavailable or playback is rejected', async () => {
    vi.spyOn(SiteAudio.prototype, 'enable').mockRejectedValue(new Error('Playback blocked'));
    await act(async () => click('.audio-toggle'));
    const button = container.querySelector<HTMLButtonElement>('.audio-toggle')!;
    expect(button.disabled).toBe(true); expect(button.textContent).toContain(session.t('ui.audio.unavailable'));
    start(); advance(); expect(session.getSnapshot().dialogue?.speaker_id).toBe('kang_taesik');
  });

  it('does not allocate audio during ordinary muted gameplay', () => {
    const cue = vi.spyOn(SiteAudio.prototype, 'cue');
    // A muted controller is constructed only by the audio gesture; spy here avoids actual device IO.
    vi.spyOn(SiteAudio.prototype, 'enable').mockResolvedValue();
    plan();
    const before = session.getSnapshot();
    click('.choice-panel button');
    expect(session.getSnapshot().state!.event_runtime.choice_history).toHaveLength(1);
    expect(session.getSnapshot().revision).toBe(before.revision + 1);
    expect(cue).not.toHaveBeenCalled(); // No audio graph was created by ordinary gameplay.
  });

  it('emits confirm and relationship cues only after an accepted choice', async () => {
    vi.spyOn(SiteAudio.prototype, 'enable').mockResolvedValue();
    const cue = vi.spyOn(SiteAudio.prototype, 'cue');
    await act(async () => click('.audio-toggle'));
    plan(); cue.mockClear();
    const button = container.querySelector<HTMLButtonElement>('.choice-panel button')!;
    const before = session.getSnapshot();
    act(() => button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 2 })));
    expect(session.getSnapshot()).toBe(before); expect(cue).not.toHaveBeenCalled();
    click('.choice-panel button');
    expect(cue.mock.calls.map(c => c[0])).toEqual(['confirm', 'relationship']);
    expect(session.getSnapshot().state!.event_runtime.choice_history).toHaveLength(1);
  });

  it('suppresses hidden-tab audio and disposes playback when the UI unmounts', async () => {
    vi.spyOn(SiteAudio.prototype, 'enable').mockResolvedValue();
    const hidden = vi.spyOn(SiteAudio.prototype, 'setHidden');
    const dispose = vi.spyOn(SiteAudio.prototype, 'dispose');
    await act(async () => click('.audio-toggle'));
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(hidden).toHaveBeenLastCalledWith(true);
    act(() => root.render(null)); expect(dispose).toHaveBeenCalledTimes(1);
  });
});

// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EpisodeSession } from '../src/app/episode-session';
import { PlayableEpisode } from '../src/ui/PlayableEpisode';
import { PresentationView } from '../src/ui/PresentationView';
import { CharacterCard } from '../src/ui/VisualSlot';
import { episodeBounds, episodeOptions, playEpisode } from './helpers/episode01-playthrough';
import type { EpisodeDecisions } from './helpers/episode01-playthrough';
import visuals from '../content/episode01/visuals.json';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root;
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const buttons = () => Array.from(container.querySelectorAll('button'));
function click(text: string, detail = 1) {
  const button = buttons().find(b => b.textContent?.includes(text));
  if (!button) throw new Error(`Button not found: ${text}`);
  act(() => button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail })));
}
function mount() {
  const session = new EpisodeSession(episodeOptions(42), episodeBounds);
  act(() => root.render(<StrictMode><PlayableEpisode session={session} /></StrictMode>));
  return session;
}
const paths: EpisodeDecisions[] = [
  { plan: 'follow_junho', signal: 'listen_more', ramp: 'ask_minseok', entrance: 'assign_crew', evening: 'field_note' },
  { plan: 'negotiate_yoon', ramp: 'check_self', entrance: 'request_delay', evening: 'study' },
  { plan: 'coordinate_schedule', ramp: 'keep_schedule', entrance: 'assign_crew', evening: 'family' },
  { plan: 'delegate_kang', ramp: 'check_self', entrance: 'force_clear', evening: 'rest' },
];

describe('Playable Episode React UI', () => {
  it.each(paths)('clicks $plan / $entrance / $evening to the same headless outcome', decisions => {
    const session = mount();
    expect(container.textContent).toContain(session.t('ui.brand'));
    click(session.t('ui.start'));
    const seen: string[] = [];
    const stages: string[] = [];
    const inputs: Record<string, string | undefined> = { plan: decisions.plan, listen: decisions.signal, ramp: decisions.ramp, entrance: decisions.entrance, evening: decisions.evening };
    for (let i = 0; i < 100 && session.getSnapshot().phase === 'playing'; i++) {
      const s = session.getSnapshot(); const p = s.presentation.find(c => 'node_id' in c)!;
      expect(container.textContent).not.toMatch(/PSI|BEST_CONTROL|CONTROLLED_DELAY|NEAR_MISS|RELATION_CONFLICT|SUCCESS|FAIL|GOOD|BAD/);
      if ('text_id' in p) {
        seen.push(p.text_id);
        expect(container.textContent).toContain(session.t(p.text_id));
      }
      if (p.type === 'SHOW_CHOICE') {
        if (p.node_id === 'evening') expect(container.querySelectorAll('.choice-panel button')).toHaveLength(4);
        if (p.node_id === 'ramp' || p.node_id === 'entrance') {
          stages.push(p.node_id);
          expect(container.querySelectorAll('.choice-panel button')).toHaveLength(3);
        }
        const selected = p.choices.find(c => c.choice_id === inputs[p.node_id]);
        if (!selected) throw new Error('Missing intended player choice');
        click(session.t(selected.text_id));
      } else click(session.t('ui.continue'));
    }
    expect(stages).toEqual(['ramp', 'entrance']);
    expect(seen.includes('ep01.junho.signal')).toBe(decisions.plan === 'follow_junho');
    expect(seen.includes('ep01.evening.field_note.record')).toBe(decisions.evening === 'field_note');
    expect(seen).toContain('ep01.tease');
    const expected = playEpisode(decisions).state;
    expect(seen).toContain(`ep01.pump.${String(expected.flags.pump_result).toLowerCase()}`);
    expect(session.getSnapshot().state).toEqual(expected);
    expect(container.textContent).toContain(session.t('ui.complete'));
    expect(container.querySelector('.day-marker strong')?.textContent).toBe('02');
    click(session.t('ui.restart'));
    expect(session.getSnapshot().state).toBeNull();
    click(session.t('ui.start'));
    expect(session.getSnapshot().state!.flags).toEqual({});
    expect(session.getSnapshot().state!.event_runtime.choice_history).toEqual([]);
  });

  it('survives StrictMode and React rerenders without recreating the engine or state', () => {
    const session = mount(); click(session.t('ui.start'));
    const before = session.getSnapshot();
    act(() => root.render(<StrictMode><PlayableEpisode session={session} /></StrictMode>));
    expect(session.getSnapshot()).toBe(before);
    expect(session.getSnapshot().state!.event_runtime.occurrence_history).toHaveLength(1);
  });

  it('opens the development inspector without mutating the session or exposing editing controls', async () => {
    const session = mount(); click(session.t('ui.start'));
    const before = session.getSnapshot();
    await act(async () => buttons().find(b => b.textContent === session.t('ui.debug'))!.click());
    await act(async () => { await vi.dynamicImportSettled(); });
    expect(container.querySelector('.debug-panel')).not.toBeNull();
    expect(container.querySelector('.debug-panel pre')?.textContent).toContain('e01_01_arrival');
    expect(container.querySelectorAll('.debug-panel input, .debug-panel textarea, .debug-panel select')).toHaveLength(0);
    expect(session.getSnapshot()).toBe(before);
    click(session.t('ui.debug_close'));
    expect(container.querySelector('.debug-panel')).toBeNull();
    expect(session.getSnapshot()).toBe(before);
  });

  it('renders disabled choices as non-interactive using only PresentationCommand flags', () => {
    const session = new EpisodeSession(); const send = vi.fn();
    act(() => root.render(<PresentationView t={session.t} send={send} assetUri={() => undefined} commands={[{
      type: 'SHOW_CHOICE', instance_id: 'ui.test', node_id: 'ui.node', text_id: 'ep01.plan.prompt', choices: [
        { choice_id: 'disabled', text_id: 'ep01.plan.a', enabled: false },
        { choice_id: 'enabled', text_id: 'ep01.plan.b', enabled: true },
      ],
    }]} />));
    expect(buttons()[0]!.disabled).toBe(true);
    act(() => buttons()[0]!.click()); expect(send).not.toHaveBeenCalled();
    act(() => buttons()[1]!.click());
    expect(send).toHaveBeenCalledExactlyOnceWith({ type: 'choose_event', instance_id: 'ui.test', node_id: 'ui.node', choice_id: 'enabled' });
  });

  it('handles Enter/Space once, ignores repeats/double clicks, and uses 1–4 for current choices', () => {
    const session = mount(); click(session.t('ui.start'));
    const key = (value: string, code = value, repeat = false) => act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: value, code, repeat, bubbles: true, cancelable: true })));
    key('Enter'); const beforeRepeat = session.getSnapshot();
    key('Enter', 'Enter', true); expect(session.getSnapshot()).toBe(beforeRepeat);
    click(session.t('ui.continue'), 2); expect(session.getSnapshot()).toBe(beforeRepeat);
    key(' ', 'Space'); expect(session.getSnapshot().revision).toBe(beforeRepeat.revision + 1);
    for (let i = 0; i < 15; i++) {
      if (session.getSnapshot().presentation.some(p => p.type === 'SHOW_CHOICE')) break;
      click(session.t('ui.continue'));
    }
    key('4', 'Digit4');
    expect(session.getSnapshot().state!.flags.followed_junho).toBe(true);
    expect(session.getSnapshot().presentation[0]).toMatchObject({ text_id: 'ep01.junho.signal' });
    expect(session.getSnapshot().state!.event_runtime.choice_history).toHaveLength(1);
  });

  it('swaps portraits through manifest data and hides failed images while retaining identity', () => {
    const slot = visuals.characters.player as { uri: string | null; accent: string };
    const original = slot.uri;
    try {
      slot.uri = 'assets/episode01/characters/player.webp';
      const person = new EpisodeSession().character('player')!;
      act(() => root.render(<CharacterCard person={person} />));
      const image = container.querySelector('img')!;
      expect(image.getAttribute('src')).toContain('assets/episode01/characters/player.webp');
      act(() => image.dispatchEvent(new Event('error')));
      expect(container.querySelector('img')).toBeNull();
      expect(container.textContent).toContain(person.name);
      expect(container.textContent).toContain(person.role);
    } finally { slot.uri = original; }
  });

  it('uses inert placeholders for other engine presentation cues', () => {
    const session = new EpisodeSession();
    act(() => root.render(<PresentationView t={session.t} send={vi.fn()} assetUri={() => undefined} commands={[
      { type: 'SCENE_CHANGE', asset_id: 'future.scene' }, { type: 'CHARACTER_ENTER', role_id: 'future.role' },
      { type: 'AUDIO_CUE', asset_id: 'future.audio' }, { type: 'CG_CHANGE', asset_id: 'future.cg' },
    ]} />));
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(4);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).not.toContain('future.');
  });
});

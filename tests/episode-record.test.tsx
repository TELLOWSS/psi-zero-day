// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { EpisodeRecord } from '../src/ui/EpisodeRecord';
import { episodeScene } from '../src/app/episode-scenes';
import { projectEpisodeReview } from '../src/app/episode-review';
import { episodeContent, playEpisode } from './helpers/episode01-playthrough';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
describe('scene records from a real playthrough', () => {
  it('filters visited choices without changing the run or showing other choices', () => {
    const { state } = playEpisode({ plan: 'follow_junho', signal: 'listen_more', ramp: 'ask_minseok', entrance: 'request_delay', evening: 'study' });
    const saved = JSON.stringify(state);
    const entries = projectEpisodeReview(state, episodeContent.events);
    const host = document.createElement('div');
    const root = createRoot(host);
    try {
      act(() => root.render(<EpisodeRecord entries={entries} t={id => id} />));
      expect(host.querySelectorAll('li')).toHaveLength(entries.length);
      const control = Array.from(host.querySelectorAll('button')).find(button => button.textContent === 'ui.scene_flow.traffic')!;
      act(() => control.click());
      const expected = entries.filter(entry => episodeScene(entry.event_id) === 'traffic');
      expect(expected.length).toBeGreaterThan(0);
      expect(host.querySelectorAll('li')).toHaveLength(expected.length);
      expect(control.getAttribute('aria-pressed')).toBe('true');
      for (const entry of expected) expect(host.textContent).toContain(entry.choice_text_id);
      const omitted = entries.find(entry => episodeScene(entry.event_id) === 'record')!;
      expect(host.textContent).not.toContain(omitted.choice_text_id);
      act(() => host.querySelector('button')!.click());
      expect(host.querySelectorAll('li')).toHaveLength(entries.length);
      expect(JSON.stringify(state)).toBe(saved);
    } finally { act(() => root.unmount()); }
  });
  it('does not assign an unknown episode to the first-pour scenes', () => {
    expect(episodeScene('e02_01_arrival')).toBeUndefined();
    expect(episodeScene(undefined)).toBeUndefined();
  });
});

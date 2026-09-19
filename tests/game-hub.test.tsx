// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { GameHub } from '../src/ui/GameHub';
import { EpisodeSession } from '../src/app/episode-session';
import { projectEpisodeJourney } from '../src/app/episode-journey';
import { episodeBounds, episodeOptions, playEpisode } from './helpers/episode01-playthrough';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
describe('game hub navigation', () => {
  it('opens the real run and preserves it when visiting the map and colleagues', async () => {
    const session = new EpisodeSession(episodeOptions(42), episodeBounds);
    const host = document.createElement('div');
    const root = createRoot(host);
    const click = (selector: string) => act(() => host.querySelector<HTMLButtonElement>(selector)!.click());
    try {
      expect(session.start(session.getSnapshot().revision)).toBe(true);
      act(() => root.render(<GameHub session={session} onPlay={() => {}} onNewGame={() => {}} />));
      expect(host.querySelectorAll('.commercial-title-action')).toHaveLength(5);
      expect(host.querySelectorAll('.commercial-title-worker')).toHaveLength(4);
      const saved = JSON.stringify(session.getSnapshot().state);
      expect(session.getSnapshot().phase).toBe('playing');
      click('.commercial-title-action:nth-child(3)');
      expect(host.querySelector('.hub-page-map')).not.toBeNull();
      expect(host.querySelectorAll('.hub-route-node')).toHaveLength(5);
      click('.hub-nav button:nth-child(3)');
      expect(host.querySelectorAll('.hub-person-grid button')).toHaveLength(8);
      click('.hub-person-grid button:last-child');
      expect(host.querySelector('.hub-person-detail')?.textContent).toContain(session.character('oh_seungjae')!.name);
      click('.hub-nav button:nth-child(5)');
      await act(async () => { await import('../src/ui/FieldGuide'); });
      expect(host.querySelectorAll('.field-guide-list button').length).toBeGreaterThanOrEqual(10);
      const guideButtons = Array.from(host.querySelectorAll<HTMLButtonElement>('.field-guide-list button'));
      expect(guideButtons.length).toBeGreaterThanOrEqual(10);
      const selectedImage = guideButtons[0]!.querySelector('img')?.getAttribute('src');
      act(() => guideButtons[0]!.click());
      expect(host.querySelector('.field-guide-detail h2')?.textContent?.trim().length).toBeGreaterThan(0);
      expect(host.querySelector('.field-guide-preview img')?.getAttribute('src')).toBe(selectedImage);
      expect(host.querySelectorAll('.field-guide-list .field-guide-visual').length).toBeGreaterThanOrEqual(10);
      expect(JSON.stringify(session.getSnapshot().state)).toBe(saved);
    } finally { act(() => root.unmount()); }
  });
  it('shows all checkpoints and actual records for a restored completed run', () => {
    const { state } = playEpisode({ plan: 'follow_junho', signal: 'listen_more', ramp: 'ask_minseok', entrance: 'request_delay', evening: 'study' });
    expect(projectEpisodeJourney(state).every(step => step.status === 'done')).toBe(true);
    expect(projectEpisodeJourney(null).map(step => step.status)).toEqual(['current','locked','locked','locked','locked']);
    const session = new EpisodeSession(episodeOptions(42), episodeBounds);
    expect(session.resume(state,0)).toBe(true);
    expect(session.getSnapshot().phase).toBe('complete');
    expect(session.review().length).toBeGreaterThan(0);
  });
});

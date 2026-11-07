// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { GameHub } from '../src/ui/GameHub';
import { EpisodeSession } from '../src/app/episode-session';
import { projectEpisodeJourney } from '../src/app/episode-journey';
import { episodeBounds, episodeOptions, playEpisode } from './helpers/episode01-playthrough';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
describe('RE:IGNITION hub and preserved story navigation', () => {
  it('renders actual full-card Guard/Watch entries, canonical crew and real mode links', () => {
    const session = new EpisodeSession();
    const host = document.createElement('div');
    const root = createRoot(host);
    let watches = 0;
    const guards:(string|null|undefined)[]=[];
    try {
      act(()=>root.render(<GameHub session={session} onPlay={()=>{}} onNewGame={()=>{}} onSurvivors={()=>{watches++;}} onDefense={id=>guards.push(id)}/>));
      expect(host.querySelector('main.rg-home[data-title-layout="REIGNITION_V1"]')).not.toBeNull();
      expect(host.querySelectorAll('button.rg-card')).toHaveLength(2);
      const guard=host.querySelector<HTMLButtonElement>('.rg-card.is-guard')!;
      const watch=host.querySelector<HTMLButtonElement>('.rg-card.is-watch')!;
      expect(guard.disabled).toBe(false);expect(watch.disabled).toBe(false);
      expect(guard.textContent).toContain('시그널 가드');expect(watch.textContent).toContain('시그널 워치');
      expect(host.querySelector('a.rg-breaker-link')?.getAttribute('href')).toBe('/signal-breaker-dev/index.html?entry=play');
      expect(host.querySelectorAll('a[href="/signal-breaker-dev/index.html?entry=play"]')).toHaveLength(1);
      expect(host.querySelector('.rg-command-status')?.textContent).toContain('GUARD CLEAR');
      expect(host.querySelectorAll('.rg-crew-reveal [data-art-surface="main"]')).toHaveLength(4);
      expect(host.querySelector('.rg-crew-reveal [data-character="player"] img')?.getAttribute('src')).toContain('characters/new-psi-crew-v2/player-map.webp');
      expect(host.querySelector('.rg-brand img')?.getAttribute('src')).toBe('/assets/branding/home-new-psi-v6/shield.svg');
      act(()=>guard.click());expect(guards).toEqual(['guard-campaign']);
      act(()=>watch.click());expect(watches).toBe(1);
    }finally{act(()=>root.unmount());}
  });

  it('preserves a live story run while entering map, people and field guide from the new home', async () => {
    const session = new EpisodeSession(episodeOptions(42), episodeBounds);
    const host = document.createElement('div');
    const root = createRoot(host);
    const click=(selector:string)=>act(()=>host.querySelector<HTMLButtonElement>(selector)!.click());
    try {
      expect(session.start(session.getSnapshot().revision)).toBe(true);
      act(()=>root.render(<GameHub session={session} onPlay={()=>{}} onNewGame={()=>{}}/>));
      expect(host.querySelectorAll('button.rg-card')).toHaveLength(2);
      const saved=JSON.stringify(session.getSnapshot().state);
      expect(session.getSnapshot().phase).toBe('playing');
      click('.rg-story-button');
      expect(JSON.stringify(session.getSnapshot().state)).toBe(saved);
      const mapNav=[...host.querySelectorAll<HTMLButtonElement>('.rg-sidebar button')].find(b=>b.textContent?.includes('스토리 진행 경로'))!;
      act(()=>mapNav.click());
      expect(host.querySelector('.hub-page-map')).not.toBeNull();
      expect(host.querySelectorAll('.hub-route-node')).toHaveLength(5);
      click('.hub-nav button:nth-child(3)');
      expect(host.querySelectorAll('.hub-person-grid button')).toHaveLength(8);
      click('.hub-person-grid button:last-child');
      expect(host.querySelector('.hub-person-detail')?.textContent).toContain(session.character('oh_seungjae')!.name);
      click('.hub-nav button:nth-child(5)');
      await act(async ()=>{await import('../src/ui/FieldGuide');});
      const buttons=[...host.querySelectorAll<HTMLButtonElement>('.field-guide-list button')];
      expect(buttons.length).toBeGreaterThanOrEqual(10);
      const selectedImage=buttons[0]!.querySelector('img')?.getAttribute('src');
      act(()=>buttons[0]!.click());
      expect(host.querySelector('.field-guide-detail h2')?.textContent?.trim().length).toBeGreaterThan(0);
      expect(host.querySelector('.field-guide-preview img')?.getAttribute('src')).toBe(selectedImage?.replace('-thumb.webp','.webp'));
      expect(JSON.stringify(session.getSnapshot().state)).toBe(saved);
    }finally{act(()=>root.unmount());}
  });
  it('retains canonical completion state and records after a restored story run',()=>{
    const {state}=playEpisode({plan:'follow_junho',signal:'listen_more',ramp:'ask_minseok',entrance:'request_delay',evening:'study'});
    expect(projectEpisodeJourney(state).every(step=>step.status==='done')).toBe(true);
    expect(projectEpisodeJourney(null).map(step=>step.status)).toEqual(['current','locked','locked','locked','locked']);
    const session=new EpisodeSession(episodeOptions(42),episodeBounds);
    expect(session.resume(state,0)).toBe(true);expect(session.getSnapshot().phase).toBe('complete');
    expect(session.review().length).toBeGreaterThan(0);
  });
});

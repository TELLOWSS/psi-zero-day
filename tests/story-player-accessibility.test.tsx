// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {EpisodeSession} from '../src/app/episode-session';
import {PlayableEpisode} from '../src/ui/PlayableEpisode';

Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let host:HTMLDivElement,root:ReturnType<typeof createRoot>;
beforeEach(()=>{
  localStorage.clear();
  vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(()=>{act(()=>root.unmount());host.remove();vi.restoreAllMocks();});
function click(button:HTMLButtonElement|null){expect(button).not.toBeNull();expect(button!.disabled).toBe(false);act(()=>button!.click());}

it.each(['first','last'])('offers explicit controls throughout the 26-event %s-choice path, including while voice is active',(policy)=>{
  const session=EpisodeSession.directed();session.start(0);
  act(()=>root.render(<PlayableEpisode session={session}/>));
  click(host.querySelector('.episode-cold-open-cta'));
  const seen=new Set<string>();let decisions=0;
  for(let step=0;step<650&&session.getSnapshot().phase==='playing';step++){
    const snapshot=session.getSnapshot(),event=snapshot.state?.event_runtime.active_instance?.event_id;
    if(event)seen.add(event);
    expect(host.querySelector('[data-story-player="cinematic"]')).not.toBeNull();
    expect(host.querySelector('.strategy-shell')).toBeNull();
    expect(host.querySelector('.episode-immersive-background')?.getAttribute('src')).toBeTruthy();
    expect(host.querySelector('.story-reading-guide')?.textContent).toBeTruthy();
    const choices=[...host.querySelectorAll<HTMLButtonElement>('.choice-panel button:not(:disabled)')];
    const choice=policy==='last'?choices.at(-1):choices[0];
    if(choice){expect(host.querySelector('.map-choice-fallback')).toBeNull();decisions++;click(choice);}
    else click(host.querySelector('.continue-button'));
  }
  expect(session.getSnapshot().phase).toBe('complete');expect(seen.size).toBe(26);
  expect(decisions).toBeGreaterThan(5);
},20000);

it('keeps the engine on the current dialogue until its final reading page',()=>{
  const session=EpisodeSession.directed();session.start(0);
  act(()=>root.render(<PlayableEpisode session={session}/>));click(host.querySelector('.episode-cold-open-cta'));
  const before=session.getSnapshot(),first=host.querySelector('.dialogue-text')!.textContent;
  expect(host.querySelector('.continue-button')?.textContent).toContain('다음 문장');
  click(host.querySelector('.continue-button'));
  expect(session.getSnapshot()).toBe(before);
  expect(host.querySelector('.dialogue-text')!.textContent).not.toBe(first);
  click(host.querySelector('.story-reading-position button'));
  expect(host.querySelector('.dialogue-text')!.textContent).toBe(first);
  expect(session.getSnapshot()).toBe(before);
});

it('reports failed background loading and retries without changing the story or save state',()=>{
  const session=EpisodeSession.directed();session.start(0);
  act(()=>root.render(<PlayableEpisode session={session}/>));
  click(host.querySelector('.episode-cold-open-cta'));
  const before=session.getSnapshot(),source=host.querySelector('.episode-immersive-background')!.getAttribute('src');
  for(let attempt=0;attempt<2;attempt++)act(()=>host.querySelector('.episode-immersive-background')?.dispatchEvent(new Event('error')));
  expect(host.querySelector('.story-background-error')?.textContent).toContain('배경');
  click(host.querySelector('.story-background-error button'));
  expect(host.querySelector('.episode-immersive-background')?.getAttribute('src')).toBe(source);
  expect(session.getSnapshot()).toBe(before);
});


it('starts in cinematic subtitle mode and expands reading without advancing or resetting its page',()=>{
  const session=EpisodeSession.directed();session.start(0);
  act(()=>root.render(<PlayableEpisode session={session}/>));
  click(host.querySelector('.episode-cold-open-cta'));
  const before=session.getSnapshot(),frame=host.querySelector('[data-story-player="cinematic"]')!;
  const original=host.querySelector('.dialogue-text')!.textContent;
  expect(frame.getAttribute('data-story-reading-mode')).toBe('cinema');
  const toggle=host.querySelector<HTMLButtonElement>('.story-view-toggle')!;
  expect(toggle.getAttribute('aria-pressed')).toBe('false');
  click(toggle);
  expect(frame.getAttribute('data-story-reading-mode')).toBe('read');
  expect(host.querySelector('.dialogue-text')?.textContent).toBe(original);
  expect(session.getSnapshot()).toBe(before);
  expect(host.querySelector('.story-view-toggle')?.getAttribute('aria-pressed')).toBe('true');
  click(host.querySelector('.continue-button'));
  const page=host.querySelector('.dialogue-text')!.textContent;
  expect(page).not.toBe(original);
  click(host.querySelector('.story-view-toggle'));
  expect(frame.getAttribute('data-story-reading-mode')).toBe('cinema');
  expect(host.querySelector('.dialogue-text')?.textContent).toBe(page);
  expect(session.getSnapshot()).toBe(before);
});


it('unobstructed scene focus preserves the current page and engine, restores on Escape',()=>{
  const session=EpisodeSession.directed();session.start(0);
  act(()=>root.render(<PlayableEpisode session={session}/>));
  click(host.querySelector('.episode-cold-open-cta'));
  const before=session.getSnapshot(), text=host.querySelector('.dialogue-text')!.textContent;
  const button=host.querySelector<HTMLButtonElement>('.story-scene-peek')!;
  expect(button).not.toBeNull();
  click(button);
  expect(host.querySelector('[data-story-focus=true]')).not.toBeNull();
  expect(host.querySelector('.dialogue-text')?.textContent).toBe(text);
  expect(session.getSnapshot()).toBe(before);
  act(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  expect(host.querySelector('[data-story-focus=true]')).toBeNull();
  expect(host.querySelector('.dialogue-text')?.textContent).toBe(text);
  expect(session.getSnapshot()).toBe(before);
});

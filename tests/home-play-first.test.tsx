/** @vitest-environment jsdom */
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {HubPlayFirst} from '../src/ui/HubPlayFirst';
import {GameHub} from '../src/ui/GameHub';
import {EpisodeSession} from '../src/app/episode-session';
import ko from '../content/episode01/ko.json';
let host:HTMLDivElement,root:ReturnType<typeof createRoot>;
const t=(id:string)=>(ko.messages as Record<string,string>)[id]??id;
beforeEach(()=>{(globalThis as typeof globalThis&{IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(()=>{act(()=>root.unmount());host.remove();history.replaceState(null,'','/');});
it('starts the selected playable mode and keeps the story preview separate',()=>{
 const guard=vi.fn(),watch=vi.fn(),story=vi.fn();act(()=>root.render(<HubPlayFirst t={t} onGuard={guard} onWatch={watch} onStory={story}/>));
 const click=(selector:string)=>act(()=>(host.querySelector(selector) as HTMLElement).click());
 click('.pf-start');expect(guard).toHaveBeenCalledOnce();expect(watch).not.toHaveBeenCalled();
 click('#pf-mode-watch');click('.pf-start');expect(watch).toHaveBeenCalledOnce();expect(guard).toHaveBeenCalledOnce();
 expect(host.querySelector('.pf-preview-button img')?.getAttribute('src')).toContain('watch-gameplay.png');
 click('#pf-mode-breaker');expect(host.querySelector('.pf-start')?.getAttribute('href')).toBe('/signal-breaker-dev/index.html?entry=play');
 click('.pf-library-heading button');expect(story).toHaveBeenCalledOnce();expect(guard).toHaveBeenCalledOnce();expect(watch).toHaveBeenCalledOnce();
});
it('keeps the new experience opt-in until the artwork and layout are reviewed',()=>{
 const session=new EpisodeSession(),props={session,onPlay:vi.fn(),onNewGame:vi.fn()};
 expect(renderToStaticMarkup(<GameHub {...props}/>)).not.toContain('class="hub-play-first"');
 history.replaceState(null,'','/?main=play-first');const html=renderToStaticMarkup(<GameHub {...props}/>);
 expect(html).toContain('data-home-art="play-first-v3"');expect(html).toContain('class="hub-play-first"');expect(html).toContain('실제 플레이 화면');
});

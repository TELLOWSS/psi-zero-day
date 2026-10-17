import {it,expect} from 'vitest';
import {EpisodeSession} from '../src/app/episode-session';
import {episodeCinematicBeat} from '../src/app/episode-cinematic-beats';
import {storyPresentationTime} from '../src/app/story-canonical-time';
it('keeps narrative timestamps, legacy sequence cues and engine day/slot in one ordered day',()=>{
 expect(storyPresentationTime('11:12')).toBe('13:30');expect(storyPresentationTime('14:03')).toBe('14:48');expect(storyPresentationTime('20:41')).toBe('17:18');
 const s=EpisodeSession.directed();s.start(0);const seen=new Set<string>();let previous=-1;
 for(let step=0;step<400&&s.getSnapshot().phase==='playing';step++){
  const snapshot=s.getSnapshot(),event=snapshot.state!.event_runtime.active_instance!.event_id,p=snapshot.presentation.find(x=>'node_id'in x)!;
  if(!seen.has(event)){seen.add(event);const beat=episodeCinematicBeat(event)!;const [h,m]=beat.time.split(':').map(Number),now=snapshot.state!.clock.day*1440+h!*60+m!;expect(now,event).toBeGreaterThanOrEqual(previous);previous=now;const prefix=s.t(p.text_id).match(/^\d\d:\d\d/)?.[0];if(prefix)expect(prefix,event).toBe(beat.time);}
  if(p.type==='SHOW_CHOICE'){const choice=p.choices.find(x=>x.enabled)!;s.dispatch({type:'choose_event',instance_id:p.instance_id,node_id:p.node_id,choice_id:choice.choice_id},snapshot.revision);}else s.dispatch({type:'advance_event',instance_id:p.instance_id,node_id:p.node_id},snapshot.revision);
 }
 expect(seen.size).toBe(26);expect(s.getSnapshot().phase).toBe('complete');
});

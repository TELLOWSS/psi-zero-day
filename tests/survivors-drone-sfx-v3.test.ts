// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {DRONE_V3_ASSETS} from '../src/app/survivors-drone-sfx-v3';
import {SurvivorsSessionAudio} from '../src/ui/survivors-session-audio';

afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});

it('locks the six V3 runtime files to their reviewed hashes',()=>{
  expect(DRONE_V3_ASSETS).toHaveLength(6);
  for(const asset of DRONE_V3_ASSETS){
    expect(asset.status).toBe('CANDIDATE');
    expect(asset.loop).toBe(false);
    expect(asset.uri).toContain('/assets/survivors/drone-sfx-v3/');
    expect(createHash('sha256').update(readFileSync('public'+asset.uri)).digest('hex')).toBe(asset.sha256);
  }
});

it('routes base, premium and hunter shots to distinct V3 identities',()=>{
  const audio=new SurvivorsSessionAudio();
  const play=vi.spyOn(audio,'playDroneV3').mockReturnValue(true);
  const event={projectileId:'d',kind:'drone_laser' as const,phase:'launch' as const,x:10,y:20,angle:0,radius:4};
  const listener={x:0,y:0};

  audio.playEquipmentFeedback(event,listener,false,[]);
  audio.playEquipmentFeedback({...event,projectileId:'p'},listener,false,['precision_link']);
  audio.playEquipmentFeedback({...event,projectileId:'h1',kind:'hunter_beam'},listener,false,[]);
  audio.playEquipmentFeedback({...event,projectileId:'h2',kind:'hunter_beam'},listener,false,[]);

  expect(play.mock.calls.map(call=>call[0])).toEqual(['base_release','premium_release','hunter_a','hunter_b']);
  expect(play.mock.calls[0]?.[4]).toBe(.985);
  expect(play.mock.calls[1]?.[4]).toBe(1);
  expect(play.mock.calls[2]?.[4]).toBe(1);
  expect(play.mock.calls[3]?.[4]).toBe(1);
  audio.dispose();
});

it('does not route V3 through gameplay RNG or the rejected V1 drone cue',()=>{
  const random=vi.spyOn(Math,'random');
  const audio=new SurvivorsSessionAudio();
  const play=vi.spyOn(audio,'playDroneV3').mockReturnValue(true);
  const event={projectileId:'d',kind:'drone_laser' as const,phase:'launch' as const,x:0,y:0,angle:0,radius:4};
  for(let i=0;i<6;i++)audio.playEquipmentFeedback({...event,projectileId:String(i)},{x:0,y:0},false,[]);
  expect(play).toHaveBeenCalledTimes(6);
  expect(random).not.toHaveBeenCalled();
  audio.dispose();
});

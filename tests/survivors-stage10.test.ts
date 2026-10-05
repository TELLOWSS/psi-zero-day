import { describe, expect, it } from 'vitest';
import { CHARACTER_PROFILES, PATROL_STAGES, createInitialSurvivorsState, SurvivorsEngine } from '../src/engine/patrol-survivors-engine';
import { STAGE_IDS, validStages, validStars } from '../src/app/survivors-save';
import sites from '../content/defense/site-profiles-v1.json';

describe('ten construction process missions', () => {
  it('maps every mission to a different existing construction profile and keeps legacy saves', () => {
    const profiles = STAGE_IDS.slice(0,10).map(id => PATROL_STAGES[id].siteProfileId);
    expect(new Set(profiles).size).toBe(10);
    expect(profiles.every(id => sites.profiles.some(profile => profile.id === id))).toBe(true);
    expect(validStages(['stage_01','stage_05','stage_06','stage_10','stage_51'])).toEqual(['stage_01','stage_05','stage_06','stage_10']);
    expect(validStars({ stage_10: [true,false,true], stage_51: [true] })).toEqual({ stage_10: [true,false,true] });
    expect(STAGE_IDS.indexOf('stage_05') + 1).toBe(STAGE_IDS.indexOf('stage_06'));
    expect(STAGE_IDS.at(-1)).toBe('stage_50');
  });
  it('initializes the watch officer with radio, mobility and pickup bonuses', () => {
    const state = createInitialSurvivorsState('safety_monitor', undefined, 'stage_10');
    const base = createInitialSurvivorsState('yoon', undefined, 'stage_10');
    expect(state.activePerks.radio_boost).toBe(1);
    expect(state.player.speed - base.player.speed).toBe(20);
    expect(state.player.pickupRadius - base.player.pickupRadius).toBe(20);
    expect(CHARACTER_PROFILES.safety_monitor.portraitUri).toContain('safety-monitor-v2.webp');
  });
  it('spawns the designated boss after 60s even when another cart exists, only once', () => {
    const e = new SurvivorsEngine(createInitialSurvivorsState('safety_monitor'),42);
    e.start(); e.state.gameTime = 60.5;
    e.state.hazards.push({ id:'ordinary-cart',type:'RUNAWAY_CART',x:10,y:10,hp:10,maxHp:10,speed:0,radius:10,damage:0,expValue:1 });
    for (let i = 0; i < 100; i++) e.update(1/60,{moveX:0,moveY:0});
    expect(e.state.hazards.filter(h => h.isStageBoss)).toHaveLength(1);
    e.state.gameTime = 62;
    e.update(1/60,{moveX:0,moveY:0});
    expect(e.state.hazards.filter(h => h.isStageBoss)).toHaveLength(1);
  });
  it('does not award a boss star for an ordinary resolved worker', () => {
    const e = new SurvivorsEngine(createInitialSurvivorsState('player',undefined,'stage_03'),1);e.start();
    e.state.hazardsNeutralized=10;e.update(1/60,{moveX:0,moveY:0});
    expect(e.state.starsEarned[2]).toBe(false);
    e.state.hazards.push({ id:'controlled-boss',isStageBoss:true,type:'CRANE_BOSS',x:10,y:10,hp:0,maxHp:1200,speed:0,radius:34,damage:0,expValue:45 });
    e.update(1/60,{moveX:0,moveY:0});expect(e.state.starsEarned[2]).toBe(true);
  });
  it('counts power isolation once per exposure and does not award survival after defeat', () => {
    const e=new SurvivorsEngine(createInitialSurvivorsState('player',undefined,'stage_05'),1);e.start();
    const power=e.state.interactiveHazards.find(h=>h.type==='electric_transformer')!;
    power.state='active';power.timer=2;
    e.state.hazards.push({id:'exposure',type:'UNHELMETED',x:power.x,y:power.y,hp:10,maxHp:10,speed:0,radius:15,damage:0,expValue:3});
    e.update(1/60,{moveX:0,moveY:0});e.update(1/60,{moveX:0,moveY:0});
    expect(e.state.environmentalKills).toBe(1);
    e.state.phase='defeat';e.state.gameTime=e.state.maxTime;
    expect(e.state.starsEarned[0]).toBe(false);
  });
});

import {expect,it} from 'vitest';
import {createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import {SpriteMotionTracker} from '../src/ui/survivors-sprite-motion';
const setup=()=>{const s=createInitialSurvivorsState('yoon'),e=new SurvivorsEngine(s,42);e.start();s.hazards=[];s.interactiveHazards=[];return {s,e};};
it('responds to reversal/release during hitstop without advancing combat, regeneration or invincibility',()=>{
 const {s,e}=setup();s.hitStopTimer=.08;s.player.hp-=10;s.player.regenRate=2;s.player.invincibleTime=1;
 s.projectiles=[{id:'held',kind:'radio',x:100,y:100,vx:100,vy:0,radius:4,damage:1,duration:1,pierce:1}];
 const x=s.player.x,hp=s.player.hp,time=s.gameTime,tracker=new SpriteMotionTracker();tracker.sample(s.player,x,s.player.y,time);
 e.update(1/60,{moveX:1,moveY:0});expect(s.player.x).toBeGreaterThan(x);expect(s.gameTime).toBe(time);expect(s.player.hp).toBe(hp);expect(s.player.invincibleTime).toBe(1);
 expect(s.projectiles[0]!.x).toBe(100);expect(s.projectiles[0]!.duration).toBe(1);
 const pose=tracker.sample(s.player,s.player.x,s.player.y,s.playerMotionTime!);expect(pose.moving).toBe(true);expect(pose.travel).toBeGreaterThan(0);
 e.update(1/60,{moveX:-1,moveY:0});expect(s.player.x).toBeCloseTo(x);
 e.update(1/60,{moveX:0,moveY:0});expect(s.player.x).toBeCloseTo(x);
});
it('retains environmental speed and boundary/diagonal rules during impact hold',()=>{
 const {s,e}=setup();s.hitStopTimer=.08;s.player.x=20;s.player.y=20;
 e.update(1/60,{moveX:-1,moveY:-1});expect(s.player.x).toBe(20);expect(s.player.y).toBe(20);
 const x=s.player.x,y=s.player.y;e.update(1/60,{moveX:1,moveY:1});
 expect(Math.hypot(s.player.x-x,s.player.y-y)).toBeCloseTo(s.player.speed/60);
});
it('still freezes every actor during pause and boss arrival',()=>{
 const {s,e}=setup();s.hitStopTimer=.08;e.setPaused(true);const x=s.player.x;e.update(1/60,{moveX:1,moveY:0});expect(s.player.x).toBe(x);expect(s.playerMotionTime).toBeUndefined();
 e.setPaused(false);s.bossEncounter={bossId:'intro',phase:'arrival',remaining:1};e.update(1/60,{moveX:1,moveY:0});expect(s.player.x).toBe(x);expect(s.playerMotionTime).toBeUndefined();
});

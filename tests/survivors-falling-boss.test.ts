import {it,expect} from 'vitest';
import {createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import {updateHazardMotion,isHazardContactActive} from '../src/engine/patrol-hazard-motion';
import type {Hazard} from '../src/domain/patrol-survivors';
it('keeps a designated falling risk until controlled and locks each new warning position',()=>{
 const p=createInitialSurvivorsState().player;
 const h:Hazard={id:'boss',type:'FALLING_DEBRIS',isStageBoss:true,x:100,y:100,hp:2600,maxHp:2600,speed:0,radius:38,damage:18,expValue:5,motion:{phase:'fall',timer:.01,directionX:0,directionY:0}};
 updateHazardMotion(h,p,.02,0);expect(h.motion!.phase).toBe('spent');expect(h.motion!.timer).toBe(3);expect(isHazardContactActive(h)).toBe(false);
 p.x=800;p.y=400;updateHazardMotion(h,p,3,0);expect(h.motion!.phase).toBe('warning');expect(h.motion!.timer).toBe(1.25);expect([h.x,h.y]).toEqual([800,400]);
 p.x=1000;updateHazardMotion(h,p,.2,0);expect(h.x).toBe(800);expect(h.hp).toBe(2600);
});
it('does not silently remove a spent boss before confirmed control accounting',()=>{
 const s=createInitialSurvivorsState('yoon',undefined,'stage_15'),e=new SurvivorsEngine(s,42);e.start();s.gameTime=61;
 for(let i=0;i<240;i++)e.update(1/60,{moveX:0,moveY:0});const boss=s.hazards.find(h=>h.isStageBoss)!;
 boss.motion!.phase='spent';boss.motion!.timer=0;boss.hp=0;e.update(1/60,{moveX:0,moveY:0});expect(s.stageBossNeutralized).toBe(true);expect(s.hazards.some(h=>h.id===boss.id)).toBe(false);
});

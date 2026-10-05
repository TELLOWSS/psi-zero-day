import {it,expect} from 'vitest';
import fs from 'node:fs';
import {SurvivorsEngine,createInitialSurvivorsState,PATROL_STAGES} from '../src/engine/patrol-survivors-engine';
import {operationProgress} from '../src/engine/survivors-operation';

it.skipIf(process.env.PSI_CALIBRATE!=='1')('calibrates fifty maps with normal inputs and confirms each has a real objective completion route',()=>{
 const rows=[];
 for(const id of Object.keys(PATROL_STAGES) as Array<keyof typeof PATROL_STAGES>)for(const seed of [42,137,509]) {
  const s=createInitialSurvivorsState('yoon',undefined,id),e=new SurvivorsEngine(s,seed);e.start();
  let readyAt:number|null=null,calls=0,lines=0,requests=0;
  const choices:string[]=[];
  for(let frame=0;frame<16000&&s.phase!=='victory'&&s.phase!=='defeat';frame++) {
   if(s.phase==='levelup'){
    const ranked=[...s.perkOptions].sort((a,b)=>{
     const rank=(id:string)=>id==='satellite_broadcast'?100:id==='safety_harness'?s.player.hp<s.player.maxHp*.55?90:45:id==='radio_boost'?80:id==='data_chip'?70:id==='quick_reflexes'?60:id==='floodlight'?55:id==='steel_boots'?40:20;
     return rank(b.id)-rank(a.id);
    });const option=ranked[0];if(option){choices.push(option.id);e.applyPerk(option.id);}continue;
   }
   const p=s.player,near=s.hazards.filter(h=>h.hp>0&&Math.hypot(h.x-p.x,h.y-p.y)<190);
   if((p.hp<p.maxHp*.8||s.gameTime>60)&&e.requestSupport())calls++;
   if(near.some(h=>h.type==='RUNAWAY_CART'||h.type==='GAS_LEAK')&&e.deployControlLine())lines++;
   if(s.ultimateCharge>=100&&near.length>=3)e.triggerDirectorShout();
   const progress=operationProgress(s);
   if(progress.complete){if(readyAt===null)readyAt=s.gameTime;if(!s.fieldTactics?.handoff&&e.requestHandoff())requests++;}
   // Follow earned pickups/actual control objects; evade live contact/telegraph footprints.
   const target=s.drops.slice().sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]
    ?? s.interactiveHazards.find(h=>!s.operationControlledZones?.includes(h.id)&&['explosive_barrel','electric_transformer','crane_drop_zone'].includes(h.type))
    ?? {x:700+Math.cos(s.gameTime*.13)*230,y:450+Math.sin(s.gameTime*.13)*200};
   let dx=target.x-p.x,dy=target.y-p.y,len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;
   for(const h of near){const vx=p.x-h.x,vy=p.y-h.y,d=Math.hypot(vx,vy)||1;const threshold=h.radius+75;if(d<threshold){const weight=(threshold-d)/threshold*4;dx+=vx/d*weight;dy+=vy/d*weight;}}
   if(s.fieldTactics?.handoff){dx=0;dy=0;}else{len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;}
   e.update(1/60,{moveX:dx,moveY:dy});e.drainAudioEvents();e.drainProjectileFeedback();
  }
  const progress=operationProgress(s);rows.push({stage:id,seed,phase:s.phase,time:Math.round(s.gameTime),hp:Math.round(s.player.hp),level:s.level,boss:progress.boss,zones:progress.zonesSecured,zoneTarget:progress.zones,controls:progress.controlsDone,controlTarget:progress.controls,readyAt:readyAt===null?null:Math.round(readyAt),calls,lines,requests,choices});
 }
 fs.mkdirSync('artifacts/boss-audio',{recursive:true});fs.writeFileSync('artifacts/boss-audio/calibration.json',JSON.stringify({scope:'SCRIPTED_AGENT_NORMAL_ENGINE_NO_UPGRADE_OR_HP_INJECTION_NOT_HUMAN_WIN_RATE_NOT_UI_STORY',rows},null,2));
 expect(rows).toHaveLength(Object.keys(PATROL_STAGES).length*3);
 const baseline=rows.filter(r=>Number(r.stage.slice(6))<=20);
 expect(baseline).toHaveLength(60);
 // No universal 180-second win expectation: bosses and interruptible handoffs can fail.
 for(const id of Object.keys(PATROL_STAGES))expect(rows.some(r=>r.stage===id&&r.phase==='victory'&&r.boss&&r.requests>0)).toBe(true);
 expect(rows.every(r=>r.phase==='victory'||r.phase==='defeat')).toBe(true);
 expect(rows.filter(r=>r.phase==='victory').every(r=>r.boss&&r.requests>0)).toBe(true);
},120000);

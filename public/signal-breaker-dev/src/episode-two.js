/* Pure Breaker EP02 content, progression and one optional signal-chain objective. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerEpisodeTwo=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const STAGES=Object.freeze([
 {id:'CH-01',number:6,nameId:'breaker.ep02.6.name',hookId:'breaker.ep02.6.hook',goalId:'breaker.ep02.6.goal',target:3,event:'ricochet'},
 {id:'CH-02',number:7,nameId:'breaker.ep02.7.name',hookId:'breaker.ep02.7.hook',goalId:'breaker.ep02.7.goal',target:1,event:'beltintercept'},
 {id:'CH-03',number:8,nameId:'breaker.ep02.8.name',hookId:'breaker.ep02.8.hook',goalId:'breaker.ep02.8.goal',target:3,event:'hazardresolved',material:'dust'},
 {id:'CH-04',number:9,nameId:'breaker.ep02.9.name',hookId:'breaker.ep02.9.hook',goalId:'breaker.ep02.9.goal',target:1,event:'anchor',material:'tension'},
 {id:'CH-05',number:10,nameId:'breaker.ep02.10.name',hookId:'breaker.ep02.10.hook',goalId:'breaker.ep02.10.goal',target:1,event:'gridscan'}
]);
const MODULES=Object.freeze({none:{},relay:{startPoints:20},catalyst:{parts:4},survey:{signalPoints:30}});
const stage=id=>STAGES.find(s=>s.id===id)||null;
function unlocked(records,id,episode2=false){const i=STAGES.findIndex(s=>s.id===id);if(i<0)return false;return episode2?records?.['CH-05']?.won===true&&(i===0||records?.['V-'+STAGES[i-1].id]?.won===true):i===0||records?.[STAGES[i-1].id]?.won===true;}
function reset(g){g.psiModule='none';g.episodeSignal={count:0,complete:false,bonusIssued:false};}
function configure(g,id){if(!g.veteran||g.state!=='ready'||!Object.hasOwn(MODULES,id))return false;g.runPoints=Math.max(0,g.runPoints-(MODULES[g.psiModule]?.startPoints||0))+(MODULES[id].startPoints||0);g.psiModule=id;return true;}
const requiredParts=g=>g.veteran?(MODULES[g.psiModule]?.parts||5):5;
function observe(g,event){if(!g.veteran||g.state!=='playing'||g.episodeSignal?.complete)return;const s=stage(g.config.id);if(s?.event==='gridscan'&&!(g.boss?.warningUntil>g.time))return;if(!s||event.kind!==s.event||s.material&&event.material!==s.material||s.event==='anchor'&&event.n!==1)return;const p=g.episodeSignal;p.count=Math.min(s.target,p.count+1);if(p.count<s.target)return;p.complete=true;p.bonusIssued=true;g.runPoints=Math.min(5000,g.runPoints+10+(MODULES[g.psiModule]?.signalPoints||0));g.pendingSignalNotification={kind:'signalchain',x:event.x,y:event.y,n:s.number,material:g.config.id,t:g.time};}
function restore(g,value,module='none'){if(!Object.hasOwn(MODULES,module))return false;if(!value){if(module!=='none')return false;reset(g);return true;}const s=stage(g.config.id);if(!s||!Number.isSafeInteger(value.count)||value.count<0||value.count>s.target||typeof value.complete!=='boolean'||typeof value.bonusIssued!=='boolean'||value.complete!==(value.count===s.target)||value.bonusIssued!==value.complete)return false;g.psiModule=module;g.episodeSignal={count:value.count,complete:value.complete,bonusIssued:value.bonusIssued};return true;}
return {STAGES,MODULES,stage,unlocked,reset,configure,requiredParts,observe,restore};});

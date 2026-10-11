/* CH-01 authored ending; text and images are presentation, not combat rules. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerEndings=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='ch01-ending-v1';
 const CH01=Object.freeze({stageId:'CH-01',bossIdentity:'delivery',version:VERSION,
  image:'art/ending-ch01-restored-v1.webp',nextStageId:'CH-02',
  titleId:'breaker.ending.ch01.title',altId:'breaker.ending.ch01.alt',
  shots:Object.freeze([
   Object.freeze({until:1.5,id:'release',labelId:'breaker.ending.ch01.release',lineId:'breaker.ending.ch01.release.line'}),
   Object.freeze({until:5,id:'world',labelId:'breaker.ending.ch01.world',lineId:'breaker.ending.ch01.world.line'}),
   Object.freeze({until:7.5,id:'human',labelId:'breaker.ending.ch01.human',lineId:'breaker.ending.ch01.human.line'}),
   Object.freeze({until:10,id:'memory',labelId:'breaker.ending.memory',lineId:'breaker.ending.ch01.memory.line'}),
   Object.freeze({until:12,id:'hook',labelId:'breaker.ending.next',lineId:'breaker.ending.ch01.hook'})
  ])});
 const definition=id=>id==='CH-01'?CH01:null;
 // Derived only from engine terminal state. No PSI score or real-site assessment.
 function record(game,runSerial){
  if(!game||game.config?.id!=='CH-01'||!game.operation||game.lab||game.state!=='won'
   ||game.wave!==game.waveCount||game.boss?.identity!=='delivery'||game.boss.phase!=='resolved'
   ||game.cores.length||game.pendingCores.length||!game.circuit.every(n=>n.hit)
   ||!game.source?.observed||!game.source?.controlled||!game.source?.verified)return null;
  return {version:VERSION,id:VERSION+':CH-01:'+game.seed+':'+runSerial,stageId:'CH-01',
   origin:'game',measurementKind:'simulated',externalSync:false,
   evidence:{observed:game.source.observed===true,controlled:game.source.controlled===true,
    verified:game.source.verified===true,recurrences:game.source.emissions,
    bossResolved:true,residualSignals:0},
   indicators:{riskAwareness:'game-evidence',educationUnderstanding:'unmeasured',
    practicalParticipation:'game-evidence',ppeCompliance:'unmeasured',
    communicationReporting:'unmeasured',stopWorkSensitivity:'unmeasured'}};
 }
 function valid(value){return !!value&&value.version===VERSION&&value.stageId==='CH-01'
  &&typeof value.id==='string'&&value.id.startsWith(VERSION+':CH-01:')
  &&value.origin==='game'&&value.measurementKind==='simulated'&&value.externalSync===false
  &&value.evidence?.observed===true&&value.evidence.controlled===true&&value.evidence.verified===true
  &&value.evidence.bossResolved===true&&value.evidence.residualSignals===0;}
 const evidenceIds=value=>valid(value)?['breaker.ending.evidence.observed','breaker.ending.evidence.controlled','breaker.ending.evidence.verified']:[];
 return {VERSION,definition,record,valid,evidenceIds};
});

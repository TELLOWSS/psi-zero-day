/* Authored campaign endings; derive evidence without changing combat rules. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerEndings=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='ch01-ending-v1';
 // Focal positions are authored from the restored image, not gameplay coordinates.
 const cameras={
  'CH-01':{world:47,human:42,memory:47,hook:71},
  'CH-02':{world:54,human:45,memory:54,hook:67},
  'CH-03':{world:54,human:51,memory:54,hook:62},
  'CH-04':{world:90,human:48,memory:78,hook:91},
  'CH-05':{world:49,human:49,memory:49,hook:49}
 };
 const direct=(stageId,shot)=>Object.freeze({...shot,until:shot.until+(shot.id==='human'||shot.id==='memory'||shot.id==='hook'?1.5:0),
  camera:Object.freeze({portrait:shot.id.startsWith('recall')?cameras['CH-0'+shot.id.slice(-1)].world:(cameras[stageId][shot.id]||cameras[stageId].world),landscape:50}),
  ...(shot.id==='human'?{speakerId:'breaker.ending.'+stageId.toLowerCase().replace('-','')+'.speaker'}:{}),
  ...(stageId==='CH-05'&&shot.id==='memory'?{labelId:'breaker.ending.signal.received'}:{}),
  ...(stageId==='CH-05'&&shot.id==='hook'?{titleId:'breaker.ending.finale.title'}:{})
 });
 const CH01=Object.freeze({stageId:'CH-01',bossIdentity:'delivery',version:VERSION,duration:13.5,
  fallbackImage:'art/map-delivery-v3.webp',nextLabelId:'breaker.ending.next',
  image:'art/ending-ch01-restored-v1.webp',nextStageId:'CH-02',
  titleId:'breaker.ending.ch01.title',altId:'breaker.ending.ch01.alt',
  shots:Object.freeze([
   Object.freeze({until:1.5,id:'release',labelId:'breaker.ending.ch01.release',lineId:'breaker.ending.ch01.release.line'}),
   Object.freeze({until:5,id:'world',labelId:'breaker.ending.ch01.world',lineId:'breaker.ending.ch01.world.line'}),
   Object.freeze({until:7.5,id:'human',labelId:'breaker.ending.ch01.human',lineId:'breaker.ending.ch01.human.line'}),
   Object.freeze({until:10,id:'memory',labelId:'breaker.ending.memory',lineId:'breaker.ending.ch01.memory.line'}),
   Object.freeze({until:12,id:'hook',labelId:'breaker.ending.next',lineId:'breaker.ending.ch01.hook'})
  ].map(shot=>direct('CH-01',shot)))});
 const CAMPAIGN_VERSION='campaign-ending-v1';
 const definitions={'CH-01':CH01};
 for(const [number,bossIdentity,map] of [[2,'conveyor','conveyor'],[3,'extraction','extraction'],[4,'tension','hoist'],[5,'grid','power']]){
  const stageId='CH-0'+number,prefix='breaker.ending.ch0'+number;
  const shots=[{until:1.5,id:'release',labelId:prefix+'.release',lineId:prefix+'.release.line'}];
  if(number===5)for(let i=1;i<=4;i++)shots.push({until:1.5+i*1.5,id:'recall'+i,labelId:'breaker.ending.recall',lineId:'breaker.ending.ch0'+i+'.title',image:definitions['CH-0'+i].image,altId:definitions['CH-0'+i].altId,fallbackImage:definitions['CH-0'+i].fallbackImage});
  const offset=number===5?6:0;
  shots.push({until:5.5+offset,id:'world',labelId:prefix+'.world',lineId:prefix+'.world.line'},
   {until:8.5+offset,id:'human',labelId:prefix+'.human',lineId:prefix+'.human.line'},
   {until:11.5+offset,id:'memory',labelId:'breaker.ending.memory',lineId:prefix+'.memory.line'},
   {until:14+offset+(number===5?1:0),id:'hook',labelId:prefix+'.next',lineId:prefix+'.hook'});
  definitions[stageId]=Object.freeze({stageId,bossIdentity,version:CAMPAIGN_VERSION,duration:shots.at(-1).until+1.5,
   image:'art/ending-ch0'+number+'-restored-v1.webp',fallbackImage:'art/map-'+map+'-v2.webp',
   nextStageId:number===5?null:'CH-0'+(number+1),nextLabelId:prefix+'.next',titleId:prefix+'.title',altId:prefix+'.alt',
   shots:Object.freeze(shots.map(shot=>direct(stageId,shot)))});
 }
 Object.freeze(definitions);
 const definition=id=>Object.hasOwn(definitions,id)?definitions[id]:null;
 // Derived only from engine terminal state. No PSI score or real-site assessment.
 function record(game,runSerial){
  const d=definition(game?.config?.id);if(!d)return null;
  if(!game.operation||game.lab||game.state!=='won'
   ||game.wave!==game.waveCount||game.boss?.identity!==d.bossIdentity||game.boss.phase!=='resolved'
   ||game.cores.length||game.pendingCores.length||!game.circuit.every(n=>n.hit)
   ||!game.boss.nodes.every(n=>n.hit))return null;
  if(d.stageId!=='CH-01'){
   if(d.stageId==='CH-02'&&game.boss.segment!==game.boss.maxSegments||d.stageId==='CH-03'&&game.boss.filterStage!==game.boss.maxFilterStages)return null;
   const counter={conveyor:'intercepts',extraction:'pressureVents',tension:'secured',grid:'isolations'}[d.bossIdentity];
   return {version:CAMPAIGN_VERSION,id:CAMPAIGN_VERSION+':'+d.stageId+':'+game.seed+':'+runSerial,stageId:d.stageId,bossIdentity:d.bossIdentity,
    origin:'game',measurementKind:'simulated',externalSync:false,
    evidence:{bossResolved:true,nodesResolved:true,circuitResolved:true,residualSignals:0,sourceAssessment:'unmeasured',
     intervention:{kind:counter,count:Number.isSafeInteger(game.boss[counter])&&game.boss[counter]>=0?game.boss[counter]:0}},
    indicators:{riskAwareness:'game-evidence',educationUnderstanding:'unmeasured',practicalParticipation:'game-evidence',ppeCompliance:'unmeasured',communicationReporting:'unmeasured',stopWorkSensitivity:'unmeasured'}};
  }
  const source=game.source||game.sourceEvidence;if(!source?.observed||!source?.controlled||!source?.verified)return null;
  return {version:VERSION,id:VERSION+':CH-01:'+game.seed+':'+runSerial,stageId:'CH-01',
   origin:'game',measurementKind:'simulated',externalSync:false,
   evidence:{observed:source.observed===true,controlled:source.controlled===true,
    verified:source.verified===true,recurrences:source.emissions,
    bossResolved:true,residualSignals:0},
   indicators:{riskAwareness:'game-evidence',educationUnderstanding:'unmeasured',
    practicalParticipation:'game-evidence',ppeCompliance:'unmeasured',
    communicationReporting:'unmeasured',stopWorkSensitivity:'unmeasured'}};
 }
 function valid(value){
  const d=definition(value?.stageId);if(!d)return false;
  if(d.stageId!=='CH-01')return value.version===CAMPAIGN_VERSION&&value.bossIdentity===d.bossIdentity
   &&typeof value.id==='string'&&value.id.startsWith(CAMPAIGN_VERSION+':'+d.stageId+':')
   &&value.origin==='game'&&value.measurementKind==='simulated'&&value.externalSync===false
   &&value.evidence?.bossResolved===true&&value.evidence.nodesResolved===true&&value.evidence.circuitResolved===true&&value.evidence.residualSignals===0&&value.evidence.sourceAssessment==='unmeasured';
  return !!value&&value.version===VERSION&&value.stageId==='CH-01'
  &&typeof value.id==='string'&&value.id.startsWith(VERSION+':CH-01:')
  &&value.origin==='game'&&value.measurementKind==='simulated'&&value.externalSync===false
  &&value.evidence?.observed===true&&value.evidence.controlled===true&&value.evidence.verified===true
  &&value.evidence.bossResolved===true&&value.evidence.residualSignals===0;}
 const evidenceIds=value=>!valid(value)?[]:value.stageId==='CH-01'?['breaker.ending.evidence.observed','breaker.ending.evidence.controlled','breaker.ending.evidence.verified']:['breaker.ending.ch'+value.stageId.slice(3)+'.evidence.nodes','breaker.ending.ch'+value.stageId.slice(3)+'.evidence.boss','breaker.ending.evidence.residual'];
 return {VERSION,definition,record,valid,evidenceIds};
});

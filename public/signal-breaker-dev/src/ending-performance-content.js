/* Existing production candidates only. Pending recordings have no invented URI. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerEndingPerformanceContent=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const actors={
  'CH-01':{id:'lim_junho',src:'/assets/episode01/characters/performance/lim-junho-relief.webp',width:1024,height:1536,crop:[65,0,945,850],gesture:'relief'},
  'CH-02':{id:'yoon_sungho',src:'/assets/episode01/characters/yoon-sungho-appreciative.webp',width:1254,height:1254,crop:[31,0,1206,1254],gesture:'acknowledge'},
  'CH-03':{id:'lim_junho',src:'/assets/episode01/characters/performance/lim-junho-relief.webp',width:1024,height:1536,crop:[65,0,945,850],gesture:'notice'},
  'CH-04':{id:'kang_taesik',src:'/assets/episode01/characters/kang-taesik-supportive.webp',width:1254,height:1254,crop:[112,0,1084,1254],gesture:'release'}
 };
 const cues={};for(let i=1;i<=5;i++){const id='CH-0'+i,prefix='breaker.ending.ch0'+i;
  if(actors[id]){Object.freeze(actors[id].crop);Object.freeze(actors[id]);}
  cues[id]=Object.freeze({stageId:id,shotId:'human',speakerId:prefix+'.speaker',lineId:prefix+'.human.line',characterId:actors[id]?.id||null,status:'awaiting-recording',voice:null});
 }
 Object.freeze(actors);Object.freeze(cues);
 const cue=id=>Object.hasOwn(cues,id)?cues[id]:null;
 const actor=id=>Object.hasOwn(actors,id)?actors[id]:null;
 function approved(cue,definition){const v=cue?.voice,shot=definition?.shots.find(s=>s.id===cue?.shotId),index=definition?.shots.indexOf(shot),start=index>0?definition.shots[index-1].until:0;
  return !!v&&!!shot&&cue.status==='approved'&&v.speakerId===cue.speakerId&&v.lineId===cue.lineId
   &&typeof v.uri==='string'&&/^\/assets\/[^?#]+\.(wav|ogg|mp3)$/.test(v.uri)&&!v.uri.includes('..')
   &&/^[a-f0-9]{64}$/.test(v.sha256)&&Number.isFinite(v.duration)&&v.duration>0&&v.duration<=shot.until-start-.2;
 }
 return Object.freeze({actor,cue,approved});
});

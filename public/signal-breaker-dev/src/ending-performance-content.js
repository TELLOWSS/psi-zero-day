/* User-supplied recordings: runtime integrated; final listening/rights approval pending. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerEndingPerformanceContent=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const actors={
  'CH-01':{id:'lim_junho',src:'/assets/episode01/characters/performance/lim-junho-relief.webp',width:1024,height:1536,crop:[65,0,945,850],gesture:'relief'},
  'CH-02':{id:'yoon_sungho',src:'/assets/episode01/characters/yoon-sungho-appreciative.webp',width:1254,height:1254,crop:[31,0,1206,1254],gesture:'acknowledge'},
  'CH-03':{id:'lim_junho',src:'/assets/episode01/characters/performance/lim-junho-relief.webp',width:1024,height:1536,crop:[65,0,945,850],gesture:'notice'},
  'CH-04':{id:'kang_taesik',src:'/assets/episode01/characters/kang-taesik-supportive.webp',width:1254,height:1254,crop:[112,0,1084,1254],gesture:'release'}
 };
 const recordings=[{"uri":"/assets/survivors/voice-ending-v1/PSI_V_END_CH01_LIM_v01.wav","duration":3.16,"sha256":"07466237eb455d68d4e227f1dfac28759397f79d2846cc54eae5ab0303a28328","trimGain":0.6700975549941727},{"uri":"/assets/survivors/voice-ending-v1/PSI_V_END_CH02_YOON_v01.wav","duration":3.6,"sha256":"caf995fa716a07d0e572b74b12067a3794d95b8358b28261c3a2e2773638659c","trimGain":0.7389809165213524},{"uri":"/assets/survivors/voice-ending-v1/PSI_V_END_CH03_LIM_v01.wav","duration":3.44,"sha256":"63e61359d95cbee8d447c6086b5ffd902c458c016a45ec94e18e605ba89be0f4","trimGain":1},{"uri":"/assets/survivors/voice-ending-v1/PSI_V_END_CH04_KANG_v01.wav","duration":4.04,"sha256":"cecf542b6b374f175418c9afd936320d744d845aa7512fd2fc3d298ea584b31b","trimGain":0.7654910585895415},{"uri":"/assets/survivors/voice-ending-v1/PSI_V_END_CH05_WORKER_v01.wav","duration":3.16,"sha256":"b65f65f7fe2e17779c6ad7576e70a6966e9293923a51f354483d4a15d0b72c79","trimGain":0.778004749245178}];
 const cues={};for(let i=1;i<=5;i++){const id='CH-0'+i,prefix='breaker.ending.ch0'+i;
  if(actors[id]){Object.freeze(actors[id].crop);Object.freeze(actors[id]);}
  cues[id]=Object.freeze({stageId:id,shotId:'human',speakerId:prefix+'.speaker',lineId:prefix+'.human.line',characterId:actors[id]?.id||null,status:'runtime-integrated-pending-listening',voice:Object.freeze({...recordings[i-1],speakerId:prefix+'.speaker',lineId:prefix+'.human.line',integrationAuthorized:true,finalListeningApproved:false,usageRightsVerified:false})});
 }
 Object.freeze(actors);Object.freeze(cues);
 const cue=id=>Object.hasOwn(cues,id)?cues[id]:null;
 const actor=id=>Object.hasOwn(actors,id)?actors[id]:null;
 function playable(cue,definition){const v=cue?.voice,shot=definition?.shots.find(s=>s.id===cue?.shotId),index=definition?.shots.indexOf(shot),start=index>0?definition.shots[index-1].until:0;
  return !!v&&!!shot&&cue.stageId===definition.stageId&&shot.speakerId===cue.speakerId&&shot.lineId===cue.lineId&&(cue.status==='approved'||cue.status==='runtime-integrated-pending-listening'&&v.integrationAuthorized===true)&&v.speakerId===cue.speakerId&&v.lineId===cue.lineId
   &&typeof v.uri==='string'&&/^\/assets\/[^?#]+\.(wav|ogg|mp3)$/.test(v.uri)&&!v.uri.includes('..')
   &&/^[a-f0-9]{64}$/.test(v.sha256)&&Number.isFinite(v.duration)&&v.duration>0&&v.duration<=shot.until-start-.2;
 }
 return Object.freeze({actor,cue,playable});
});

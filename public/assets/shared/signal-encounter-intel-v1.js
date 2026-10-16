/* Read-only cross-mode field notes. Never read by combat, economy or unlock logic. */
(function(root){'use strict';
 const key='psi-zero-day.encounter-intel.v1',ranks=['unseen','observed','verified'];
 const ids={watch:'stage_14',breaker:'CH-04',guard:'GD-06'};
 const cues={watch:['wire-tension-swing','debris-warning'],breaker:['wire-tension-counter'],guard:['split-lane-transition']};
 const messages={title:'현장 신호 도감',boundary:'실제 사고·PSI 지표와 무관한 가상 훈련 기록입니다. 모드별 대응 경험만 기록하며 보상과 해금은 공유하지 않습니다.',event:'양중 작업면 · 하중과 금속의 신호',watch:'시그널 워치 · ST14',breaker:'시그널 브레이커 · CH-04',guard:'시그널 가드 · GD-06',unseen:'미관측',observed:'관측함',verified:'대응 검증',close:'현장으로 돌아가기',empty:'관측 후 이곳에 신호가 기록됩니다. 다른 모드의 플레이는 필수가 아닙니다.',local:'이 기기에 보관 · 저장 불가 시 현재 세션에서만 유지'};
 function empty(){return {eventId:'load-path-incident-014',riskFamilies:['LOAD','METAL'],siteArea:'lifting-workface',observedCues:[],verifiedAt:null,watch:{encounterId:ids.watch,mastery:'unseen'},breaker:{encounterId:ids.breaker,mastery:'unseen'},guard:{encounterId:ids.guard,mastery:'unseen'},isFictionalTrainingRecord:true};}
 function normalize(raw){const value=empty();if(!raw||raw.eventId!==value.eventId)return value;
  for(const mode of Object.keys(ids)){const entry=raw[mode];if(entry?.encounterId===ids[mode]&&ranks.includes(entry.mastery)){value[mode].mastery=entry.mastery;if(entry.mastery==='verified'&&typeof entry.verifiedAt==='string'&&Number.isFinite(Date.parse(entry.verifiedAt)))value[mode].verifiedAt=entry.verifiedAt;}}
  value.observedCues=Object.keys(ids).filter(mode=>value[mode].mastery!=='unseen').flatMap(mode=>cues[mode]);
  if(Object.keys(ids).every(mode=>value[mode].mastery==='verified'&&value[mode].verifiedAt))value.verifiedAt=Object.keys(ids).map(mode=>value[mode].verifiedAt).sort().at(-1);
  return value;
 }
 function update(raw,mode,encounterId,mastery,now){const value=normalize(raw);if(ids[mode]!==encounterId||!ranks.includes(mastery)||ranks.indexOf(mastery)<=ranks.indexOf(value[mode].mastery))return value;
  value[mode]={encounterId,mastery,...(mastery==='verified'?{verifiedAt:new Date(now??Date.now()).toISOString()}:{})};return normalize(value);
 }
 let memory=empty();
 function read(){try{const stored=normalize(JSON.parse(root.localStorage.getItem(key)));for(const mode of Object.keys(ids))if(ranks.indexOf(memory[mode].mastery)>ranks.indexOf(stored[mode].mastery))stored[mode]=memory[mode];memory=normalize(stored);}catch{}return normalize(memory);}
 function record(mode,id,mastery){if(ids[mode]===id&&ranks.includes(mastery)&&ranks.indexOf(memory[mode].mastery)>=ranks.indexOf(mastery))return normalize(memory);const before=read(),after=update(before,mode,id,mastery);if(JSON.stringify(before)!==JSON.stringify(after)){memory=after;try{root.localStorage.setItem(key,JSON.stringify(after));}catch{}}return after;}
 function open(){const doc=root.document;if(!doc)return;const previous=doc.getElementById('signalEncounterIntel');if(previous?.open){previous.focus();return;}previous?.remove();
  const dialog=doc.createElement('dialog');dialog.id='signalEncounterIntel';dialog.className='signal-encounter-intel';dialog.setAttribute('aria-labelledby','signalIntelTitle');
  const add=(tag,text,parent=dialog)=>{const el=doc.createElement(tag);el.textContent=text;parent.append(el);return el;};
  add('h2',messages.title).id='signalIntelTitle';add('p',messages.boundary);add('h3',messages.event);const value=read();
  for(const mode of Object.keys(ids)){const card=add('article','');add('strong',messages[mode],card);add('span',messages[value[mode].mastery],card);}
  if(!value.observedCues.length)add('p',messages.empty);else add('p',value.observedCues.map(id=>({'wire-tension-swing':'와이어 진동','debris-warning':'낙하 예고','wire-tension-counter':'인장 고정 대응','split-lane-transition':'이중 동선 전환'})[id]).join(' · '));
  add('small',messages.local);const footer=add('footer','');const close=add('button',messages.close,footer);close.type='button';close.addEventListener('click',()=>dialog.close());dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.tabIndex=-1;doc.body.append(dialog);dialog.showModal();dialog.focus({preventScroll:true});dialog.scrollTop=0;
 }
 const api=Object.freeze({key,empty,normalize,update,read,record,open,title:messages.title});root.SignalEncounterIntel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

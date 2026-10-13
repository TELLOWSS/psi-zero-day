/* SIGNAL BREAKER visual/interaction layer. Offline only: no network requests. */
(function(){'use strict';
const {Game,STAGES,CHAPTER,WEAPONS,KINDS,W,H}=window.SignalBreakerEngine;
const GROUND=536;
const endingPlayer=new window.SignalBreakerEndingPlayer(document.getElementById('stageEnding'),id=>window.SignalBreakerText[id]||id);
let completionSaved=true;let veteranMode=false;
const recordKey=(id=game.config.id)=>((game?.veteran)?'V-':'')+id;
const lobbyKey=(id)=> (veteranMode?'V-':'')+id;
let freeUnlockAll=false;
const lobbyLocked=id=>freeUnlockAll?false:!window.SignalBreakerEpisodeTwo.unlocked(records,id,veteranMode);
const t=id=>window.SignalBreakerText[id]||id;
const journey=window.SignalBreakerJourney;
const premium=new window.SignalBreakerPremiumArt.PremiumArt();
const firingPose=new window.SignalBreakerFiringPose.FiringPose();
const soundDirector=new window.SignalBreakerPremiumSound.SoundDirector();
const QUALITY_KEY='psi.signal-breaker.graphics.v1';
let quality=(typeof window.matchMedia==='function'&&window.matchMedia('(pointer: coarse)').matches)?'balanced':'high',reduceMotion=(typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)||false;try{const q=JSON.parse(localStorage.getItem(QUALITY_KEY)||'{}');if(['high','balanced','low'].includes(q.quality))quality=q.quality;if(typeof q.reduceMotion==='boolean')reduceMotion=q.reduceMotion;}catch{}
premium.setQuality(quality);premium.setReducedMotion(reduceMotion);
for(const el of document.querySelectorAll('[data-text-id]'))el.textContent=t(el.dataset.textId);
const $=id=>document.getElementById(id),cv=$('arena'),cx=cv.getContext('2d',{alpha:false}),store='psi.signal-breaker.offline.v1';
let game=new Game('CH-01'),keys=new Set(),touchMove=0,touchAim=0,fireGesture=null,soundOn=true,audio=null,last=0,toastExpires=0,finishedShown=false,frame=0;
let floatingJoy={active:false,pointerId:null,startX:0,startY:0,curX:0,curY:0};
let hitStop=0,screenShake={x:0,y:0,mag:0},cleanChainTimer=0;
let controlActor=null,controlEntity={},supportDrawn=false,bossLabelBounds=null;
function prepareControlActor(){if(game.causalMode&&!game.lab&&game.config.id==='CH-01'&&!controlActor)controlActor=window.SignalBreakerActors.createActor('safety_monitor');}
let trainingTalentManager=null;
function talentManager(){return game?.training&&trainingTalentManager?trainingTalentManager:window.SignalBreakerTalentTech.manager;}
function enterTraining(){
 game.enterTraining();
 if(!trainingTalentManager){const api=window.SignalBreakerTalentTech,source=api?.manager;if(source){
  const snapshot=JSON.parse(JSON.stringify({points:source.points,spentPoints:source.spentPoints,talents:source.talents,weaponLevels:source.weaponLevels,weaponSockets:source.weaponSockets,guideRewardClaimed:source.guideRewardClaimed}));
  trainingTalentManager=Object.assign(new api.TalentTechManager(),snapshot);trainingTalentManager.save=()=>{};trainingTalentManager.parts=99;for(const gem of api.SOCKET_GEMS)trainingTalentManager.inventory[gem.id]=99;
 }}
}
let operationFlow=true;let continuousFlow=true,radioUntil=0;let preparationOpen=false,preparePreview=null,runBaseline=null,overviewPaused=false,guideKey='',guideUntil=0;const lessons=new Set();let mode='chapter',lab=false,credits=0,bindings={left:'KeyA',right:'KeyD',slot1:'Digit1',slot2:'Digit2',shield:'KeyQ',magnet:'KeyE',conveyor:'KeyR',pause:'KeyP',fire:'Space',aimUp:'ArrowUp',aimDown:'ArrowDown',aimLeft:'KeyZ',aimRight:'KeyX'},settings={autoTuning:false,controlMode:'flow',assistVersion:1,autoFire:true,music:.16,effects:.45,devices:.12,voice:.35,aim:true,touchRelease:true,holdFire:true,smartWeapon:true};let workshop=window.SignalBreakerWorkshop.normalize(null);let characterId='player',runSerial=0,shownDraftWave=0,checkpoint=null,resumeCandidate=null;let records={};try{const saved=JSON.parse(localStorage.getItem(store)||'{}');workshop=window.SignalBreakerWorkshop.normalize(saved.workshop);checkpoint=saved.checkpoint||null;resumeCandidate=Game.restoreCheckpoint(checkpoint);if(resumeCandidate?.veteran&&(!window.SignalBreakerEpisodeTwo.unlocked(saved.records,resumeCandidate.config.id,true)||resumeCandidate.psiModule!=='none'&&!workshop.owned.includes('module-'+resumeCandidate.psiModule)))resumeCandidate=null;if(!resumeCandidate)checkpoint=null;runSerial=Number.isSafeInteger(saved.runSerial)?Math.max(0,saved.runSerial):0;credits=Number.isFinite(saved.credits)?Math.max(0,Math.floor(saved.credits)):0;settings={...settings,...saved.settings};if(saved.settings?.assistVersion!==1){settings.controlMode='flow';settings.autoFire=true;settings.assistVersion=1;}bindings={...bindings,...saved.bindings};records=saved.records&&typeof saved.records==='object'?saved.records:{};soundOn=saved.sound!==false;if(window.SignalBreakerActors.characters.some(c=>c.id===saved.characterId))characterId=saved.characterId;}catch{}
if(!['flow','twin','precision'].includes(settings.controlMode))settings.controlMode='flow';
$('soundBtn').textContent=soundOn?'♫ ON':'♫ OFF';
const safeSave=()=>{try{if(window.SignalBreakerTalentTech?.manager.save()===false){toast(t('breaker.journey.unsaved'),4);return false;}localStorage.setItem(store,JSON.stringify({version:1,runSerial,checkpoint,records,sound:soundOn,characterId,credits,workshop,settings,bindings}));return true;}catch{toast(t('breaker.run.storage'),4);return false;}};
function tone(freq=300,len=.13,type='triangle',gain=.08,slide=0){if(!soundOn)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')void audio.resume();const osc=audio.createOscillator(),vol=audio.createGain(),at=audio.currentTime;osc.type=type;osc.frequency.setValueAtTime(freq,at);if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),at+len);vol.gain.setValueAtTime(.0001,at);vol.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),at+.012);vol.gain.exponentialRampToValueAtTime(.0001,at+len);osc.connect(vol).connect(audio.destination);osc.start(at);osc.stop(at+len+.015);}catch{}}
let milestones=new Set();
function sounds(){soundDirector.setSession(game.state==='playing',soundOn);soundDirector.setMix(settings);soundDirector.setScene(game,characterId);for(const e of game.drainEvents()){if(e.kind==='pressuretimewarning')toast(t('breaker.gameplay.pressure').replace('{seconds}',String(e.n)),2.5);if(e.kind==='growthimpact')hitStop=Math.max(hitStop,e.n);if(e.kind==='signalchain')toast(t('breaker.ep02.chain.reward').replace('{points}',String(e.points||10)),1.6);if(e.kind==='wave'){if(game.operation&&game.boss){toast('BOSS · '+t('breaker.boss.stage.'+game.boss.stage),2);triggerBossCutin(game.boss);}else toast(t('breaker.wave.'+e.n),2);announceStory();}if(e.kind==='boss'){toast('EQUIPMENT STABILIZED // 설비 안전 개입 완료',2.2);cleanChainTimer=2.8;hitStop=0.35;screenShake.mag=18;tone(587,0.45,'triangle',0.22,293);}if(e.kind==='autotuning')toast(t('breaker.flow.upgrade')+' · '+t('breaker.tuning.'+e.material+'.name'),1.2);if(e.kind==='waveclear'){toast(t('breaker.wave.clear'),.9);cleanChainTimer=2.0;tone(440,.35,'triangle',.18,220);if(window.SignalBreakerTalentTech){talentManager().addPoints(1);game.applyTalentStats(talentManager().getStats());toast('⚡ 웨이브 완료 · 전문화 특성 +1P 획득!',1.4);}}if(e.kind==='skillshot'&&e.n>=2){hitStop=0.06;screenShake.mag=Math.min(16,screenShake.mag+8);toast('CRITICAL RICOCHET! ↗'+e.n,0.8);}if(e.kind==='overdrive'){hitStop=0.08;screenShake.mag=16;toast('⚡ OVERDRIVE FEVER ACTIVATED! ⚡',2.0);}if(['split','hazardrelease','bossnode'].includes(e.kind)){hitStop=0.04;screenShake.mag=Math.min(14,screenShake.mag+7);tone(100,.08,'sawtooth',.22,-35);}milestones.add(e.kind);const visualEvent=e.kind==='hazardrelease'?{...e,kind:'split'}:e;const presented=window.SignalBreakerActors.presentationEvent?window.SignalBreakerActors.presentationEvent(visualEvent):visualEvent;premium.event(presented,game);if(e.kind==='fire'){firingPose.register(e);premium.actor?.fire(game.player,game.time,Math.atan2(e.dy??game.launchGeometry().direction.y,e.dx??game.launchGeometry().direction.x));}if(e.kind==='sourceverified')toast(t('breaker.source.'+e.kind),2);if(['hazardrelease','powerup','overdrive'].includes(e.kind))toast(t('breaker.burst.'+e.kind)+(e.kind==='powerup'&&game.burstCombo()?' · '+t('breaker.burst.combo.'+game.burstCombo()):''),.9);if(e.kind==='itemcollect'&&game.continuous)toast(t('breaker.item.'+e.material),.7);if(e.kind==='watchsync')toast(t('breaker.item.sync'),1.5);if(e.kind==='reason'&&!assistTarget?.hint&&!(game.source&&!game.source.verified))toast(t('breaker.reason.'+e.material),1.4);soundDirector.play(presented,soundOn);}}
function announceStory(){const line=$('radioLine');if(!line)return;line.textContent=game.continuous?t(window.SignalBreakerStory?.id(game.config.id,game.wave,game.storyCycle)||'breaker.identity.meaning'):'';radioUntil=game.storyCycle>=3&&!([1,5].includes(game.wave))?game.time:game.time+5.5;line.hidden=!game.continuous||game.time>=radioUntil;}
function toast(msg,duration=1.2){const e=$('toast');e.textContent=msg;e.classList.add('visible');toastExpires=performance.now()+duration*1000;}
const tuningDock=$('tuningDock');tuningDock.setAttribute('aria-label',t('breaker.run.title'));
function renderWeaponTree(parent){
 const E=window.SignalBreakerEvolution,e=game.evolution,panel=document.createElement('section');panel.className='evolution-kit weapon-tree';panel.setAttribute('aria-label',t('breaker.tree.title'));
 const heading=document.createElement('p');heading.textContent=t('breaker.tree.title')+' · '+t('breaker.evolution.status')+' '+game.pickupCount;panel.append(heading);
 const recipeCost=window.SignalBreakerEpisodeTwo.requiredParts(game);
 const add=(row,id,name,desc,enabled,chosen,action,cell)=>{const button=document.createElement('button');button.type='button';button.dataset.evolution=id;button.className='iconbtn tree-node';button.disabled=!enabled;button.setAttribute('aria-pressed',String(chosen));const image=document.createElement('span');image.className='tree-projectile';image.style.backgroundPosition=(cell%4*100/3)+'% '+(Math.floor(cell/4)*100/3)+'%';const title=document.createElement('strong'),detail=document.createElement('small');title.textContent=(chosen?'✓ ':'')+name;detail.textContent=desc;button.append(image,title,detail);button.addEventListener('click',()=>{if(action()){checkpoint=game.checkpoint();safeSave();showTuning();setWeapon(game.weapon);}});row.append(button);};
 for(const frame of ['arc','laser']){const group=document.createElement('div');group.className='tree-family';group.dataset.frame=frame;const root=document.createElement('h3');root.textContent=t('breaker.evolution.'+frame+'.name');group.append(root);const row=document.createElement('div');row.className='tree-row';for(const [id,spec] of Object.entries(E.RECIPES).filter(([,v])=>v.frame===frame)){add(row,id,t('breaker.evolution.'+id+'.name'),t('breaker.evolution.'+id+'.desc')+' · '+recipeCost+t('breaker.tree.parts'),!e.recipe&&game.pickupCount>=recipeCost&&(!game.config.gateStable||['mist','net'].includes(spec.support)),e.recipe===id,()=>game.evolve(id),{storm:10,singularity:11,prism:12,plasma:13}[id]);}group.append(row);
 if(e.recipe&&e.frame===frame){const branchRow=document.createElement('div');branchRow.className='tree-row tree-connected';for(const id of E.BRANCHES)add(branchRow,id,t('breaker.tree.'+id+'.name'),t('breaker.tree.'+id+'.desc')+' · 9'+t('breaker.tree.parts')+' · '+t('breaker.tree.wave2'),E.canAdvance(game,id),e.branch===id,()=>game.advanceEvolution(id),frame==='arc'?10:12);group.append(branchRow);const finalRow=document.createElement('div');finalRow.className='tree-row tree-connected';add(finalRow,'capstone',t('breaker.tree.final.'+(e.branch||'spread')+'.name'),t('breaker.tree.final.'+(e.branch||'spread')+'.desc')+' · 14'+t('breaker.tree.parts')+' · '+t('breaker.tree.wave3'),E.canAdvance(game,'capstone'),e.capstone,()=>game.advanceEvolution('capstone'),frame==='arc'?14:15);group.append(finalRow);}
 panel.append(group);}
 const help=document.createElement('small');help.dataset.parts=String(recipeCost);help.textContent=t('breaker.tree.help');panel.append(help);parent.append(panel);
}
function renderEvolutionControls(parent,intermission){
 if(!game.veteran)return;if(intermission){renderWeaponTree(parent);return;}const panel=document.createElement('section');panel.className='evolution-kit';const status=document.createElement('p');
 const advice=document.createElement('p');advice.className='evolution-advice';advice.textContent=t('breaker.gameplay.frame').replace('{frame}',t('breaker.evolution.'+window.SignalBreakerEvolution.preferredFrame(game.config.id)+'.name'));panel.append(advice);const updateStatus=()=>{status.textContent=t('breaker.evolution.status')+' · '+game.pickupCount+' / '+window.SignalBreakerEpisodeTwo.requiredParts(game)+' · '+t('breaker.evolution.'+(game.evolution.recipe||game.evolution.frame)+'.name');};updateStatus();panel.append(status);
 for(const id of intermission?Object.keys(window.SignalBreakerEvolution.RECIPES):['arc','laser']){const button=document.createElement('button');button.type='button';button.dataset.evolution=id;button.className='iconbtn';const name=document.createElement('strong'),desc=document.createElement('small');name.textContent=t('breaker.evolution.'+id+'.name');desc.textContent=t('breaker.evolution.'+id+'.desc');button.append(name,desc);const recipe=window.SignalBreakerEvolution.RECIPES[id];button.disabled=intermission?(game.pickupCount<window.SignalBreakerEpisodeTwo.requiredParts(game)||!!game.evolution.recipe||game.config.gateStable&&!['mist','net'].includes(recipe.support)):game.state!=='ready';button.setAttribute('aria-pressed',String((intermission?game.evolution.recipe:game.evolution.frame)===id));button.addEventListener('click',()=>{if(intermission){if(game.evolve(id)){checkpoint=game.checkpoint();safeSave();showTuning();setWeapon(game.weapon);}}else if(game.selectFrame(id)){setWeapon(game.weapon);updateStatus();for(const choice of panel.querySelectorAll('[data-evolution]'))choice.setAttribute('aria-pressed',String(choice.dataset.evolution===id));}});panel.append(button);}
 const hint=document.createElement('small');hint.textContent=intermission?t('breaker.shop.parts').replace('{n}',window.SignalBreakerEpisodeTwo.requiredParts(game)):t(game.state==='paused'?'breaker.evolution.frame.locked':'breaker.evolution.frame.help');hint.dataset.parts=String(window.SignalBreakerEpisodeTwo.requiredParts(game));panel.append(hint);parent.append(panel);
}

function showTuning(){checkpoint=game.checkpoint();safeSave();clearInput();toastExpires=0;$('toast').classList.remove('visible');document.body.dataset.session='intermission';tuningDock.replaceChildren();const heading=document.createElement('h2');heading.textContent=t('breaker.run.title');const desc=document.createElement('p');desc.textContent=t('breaker.run.next')+' '+(game.wave+1)+' / '+game.waveCount+' · '+t('breaker.run.desc');const cards=document.createElement('div');cards.className='tuning-cards';for(const id of game.draft){const button=document.createElement('button');button.type='button';button.dataset.tuning=id;const label=document.createElement('strong');label.textContent=t('breaker.tuning.'+id+'.name');const detail=document.createElement('span');detail.textContent=t('breaker.tuning.'+id+'.desc');button.append(label,detail);button.addEventListener('click',()=>{clearInput();if(game.chooseTuning(id)){tuningDock.hidden=true;document.body.dataset.session='playing';shownDraftWave=0;hud();}});cards.append(button);}tuningDock.append(heading,desc);if(game.veteran)renderEvolutionControls(tuningDock,true);if(game.source?.verified||game.sourceEvidence?.verified){const record=document.createElement('p');record.className='psi-source-record';record.dataset.psiRecord='verified';record.textContent=t('breaker.source.record')+' · '+t('breaker.identity.meaning');tuningDock.append(record);}tuningDock.append(cards);tuningDock.hidden=false;cards.firstElementChild?.focus({preventScroll:true});}
function setupStage(id,immediate=false,retrySeed=null,incoming=null){endingPlayer.cancel();pendingBossLoot=null;completionSaved=true;tuningDock.hidden=true;shownDraftWave=0;closeView=false;overviewPaused=false;document.body.classList.remove('overview-open');$('viewBtn').textContent=t('breaker.session.overview');$('viewBtn').setAttribute('aria-pressed','false');if(!incoming){clearInput();soundDirector.setSession(false,soundOn);}const premiumRun=mode==='chapter'&&!lab,seed=retrySeed??(premiumRun?20261010+(++runSerial)*7919:20261010);if(premiumRun&&retrySeed===null){checkpoint=null;safeSave();}game=incoming||new Game(id,seed,{operation:operationFlow&&premiumRun,autoTuning:settings.autoTuning,lab,extended:mode==='chapter',premiumRun,burst:premiumRun,veteran:veteranMode,continuous:!veteranMode&&continuousFlow&&premiumRun,causal:premiumRun&&id==='CH-01'});controlEntity={};prepareControlActor();if(window.SignalBreakerTalentTech)game.applyTalentStats(talentManager().getStats());runBaseline=game.continuous?(records[recordKey(id)]?.bestContinuous?{best:records[recordKey(id)].bestContinuous}:null):game.burstMode?(records[recordKey(id)]?.bestCascade?{best:records[recordKey(id)].bestCascade}:null):game.premiumRun?(records[recordKey(id)]?.bestPremium?{best:records[recordKey(id)].bestPremium}:null):game.extended?(records[recordKey(id)]?.bestFlow?{best:records[recordKey(id)].bestFlow}:null):(records[recordKey(id)]||null);guideKey='';guideUntil=0;previewCache=null;previewKey='';previewAt=0;milestones.clear();premium.reset();firingPose.reset();if(game.veteran){game.selectFrame(window.SignalBreakerEvolution.preferredFrame(id));game.configurePsiModule(window.SignalBreakerWorkshop.selected(workshop,'module').value);}if(id==='SB-01')game.setAim(480,210);finishedShown=false;const c=game.config;$('missionTitle').textContent=game.veteran?t(window.SignalBreakerEpisodeTwo.stage(c.id).nameId):c.name;$('missionDesc').textContent=c.summary;$('stageCode').innerHTML=(game.veteran?'EP02-'+String(CHAPTER.indexOf(c)+6).padStart(2,'0'):c.id)+' <i>'+c.name+'</i>';$('total').textContent=game.waveCount;setWeapon(game.loadout[0]);updateStageList();if(immediate){game.start();hideOverlay();toast(t('breaker.brand.promise'),2);}else showOverlay('ready');announceStory();hud();}
function setWeapon(id){game.selectWeapon(id);$('pulseBtn').classList.toggle('selected',id===game.loadout[0]);$('netBtn').classList.toggle('selected',id===game.loadout[1]);for(const [i,button] of ['pulseBtn','netBtn'].entries()){$(button).innerHTML='<span class="weapon-icon">'+(WEAPONS[game.loadout[i]].glyph||['✹','⌗','◎','≋','⚓','◉'][WEAPONS[game.loadout[i]].cell])+'</span><span>'+(game.operation&&i===0&&game.loadout[i]==='pulse'?(game.veteran?t('breaker.evolution.'+(game.evolution.recipe||game.evolution.frame)+'.name'):t('breaker.pattern.'+game.pulseStyle)):game.operation&&['net','magnet','mist','anchor','scan'].includes(game.loadout[i])?t('breaker.gear.short.'+game.loadout[i]):game.veteran&&i===0?t('breaker.evolution.'+(game.evolution.recipe||game.evolution.frame)+'.name'):WEAPONS[game.loadout[i]].label)+'</span>';$(button).setAttribute('aria-label',WEAPONS[game.loadout[i]].label+(game.operation?' · '+t(i===0?'breaker.pattern.'+game.pulseStyle:'breaker.gear.cycle'):''));$(button).title=WEAPONS[game.loadout[i]].label+' · '+WEAPONS[game.loadout[i]].verb;const icon=$(button).querySelector?.('.weapon-icon');if(icon)icon.style.backgroundPosition=(WEAPONS[game.loadout[i]].cell%3*50)+'% '+Math.floor(WEAPONS[game.loadout[i]].cell/3)*100+'%';}}
function updateStageList(){const parent=$('stageList');parent.replaceChildren();(mode==='chapter'?CHAPTER:STAGES).forEach((s,i)=>{const b=document.createElement('button');b.className='stage-card'+(game.config.id===s.id?' selected':'');b.type='button';const done=records[recordKey(s.id)]?.won;const locked=mode==='chapter'&&!lab&&lobbyLocked(s.id);b.innerHTML='<span class="stage-number">'+String(i+1).padStart(2,'0')+'</span><span class="stage-text"><strong>'+s.name+'</strong><small>'+s.area+' '+(done?'· 클리어':locked?'· 이전 작전 클리어 후 해금':'· 체험 가능')+'</small></span><span class="stage-right">'+(done?'✓':game.config.id===s.id?'◆':'↗')+'</span>';b.disabled=locked;if(b.disabled)b.title=t('breaker.unlock.previous');b.addEventListener('click',()=>setupStage(s.id));parent.appendChild(b);});}
function showOverlay(overlayMode){endingPlayer.cancel();clearInput();const o=$('overlay'),inside=$('overlayInner');o.classList.remove('hidden');inside.dataset.state=overlayMode;document.body.dataset.session=overlayMode;const c=game.config;let eyebrow='OPERATION READY',headline=c.name,description=c.summary,label=lab?'무료 실험 시작':'작전 개시',action=()=>{game.start();hideOverlay();toast(t(settings.autoFire&&(game.operation||settings.controlMode==='flow')?'breaker.ui.start.auto':'breaker.ui.start.manual'),1.6);};
if(overlayMode==='paused'){eyebrow='PAUSE / FIELD HOLD';headline='작전을 잠시 정지했습니다';description='정지 중에는 시간, 물리와 충돌 판정이 진행되지 않습니다.';label='작전 재개';action=()=>{game.pause();hideOverlay();};}
if(overlayMode==='won'){eyebrow='OPERATION COMPLETE';headline=game.score.toLocaleString();description=t('breaker.brand.promise');const stages=mode==='chapter'?CHAPTER:STAGES,next=stages[stages.indexOf(c)+1];if(lab){label='보상 없이 다시 실험';action=()=>setupStage(c.id,false);}else if(next){label='다음 작전 준비';action=()=>setupStage(next.id,false);}else if(game.operation&&!game.veteran){label=t('breaker.journey.ep02');action=()=>{veteranMode=true;lobbyStage='CH-01';showLobby();};}else{label='작전 선택';action=showLobby;}}
if(overlayMode==='lost'){eyebrow='SIGNAL INTERRUPTED';headline='다시 경로를 설계하세요';description=`점수 ${game.score.toLocaleString()}점. 미해소 신호 ${game.maxUnits-game.cleared}개 · 재도전 페널티 없음.`;if(game.failureReason==='pressure')description=t('breaker.veteran.timeout');label='동일 스테이지 재도전';action=quickRetry;}
inside.innerHTML='';const el=document.createElement('div');el.className='eyebrow';el.textContent=overlayMode==='won'?t('breaker.brand.clear'):eyebrow;const h=document.createElement('div');h.id='overlayHeading';h.className='overlay-heading';h.textContent=headline;const p=document.createElement('p');p.textContent=description;const btn=document.createElement('button');btn.id='overlayPrimary';btn.className='primary-btn';btn.innerHTML=label+' <span>↗</span>';btn.addEventListener('click',action);inside.append(el,h,p);if(lab){const note=document.createElement('p');note.className='lab-note';note.textContent=t('breaker.lab.notice');inside.append(note);}
if(overlayMode==='ready'||overlayMode==='paused'){
 const label=document.createElement('label');label.className='actor-picker';label.textContent=t('breaker.actor.label');
 const select=document.createElement('select');select.id='actorSelect';select.setAttribute('aria-label',t('breaker.actor.label'));
 for(const character of window.SignalBreakerActors.characters){const option=document.createElement('option');option.value=character.id;const identity=window.SignalBreakerActors.characterIdentity?.[character.id];option.textContent=identity?identity.name+' · '+identity.title:t(character.textId);select.append(option);}select.value=characterId;
 select.addEventListener('change',()=>{characterId=select.value;premium.actor=undefined;keys.clear();touchMove=0;safeSave();});label.append(select);inside.append(label);
const preparation=addPreparationControls(inside,overlayMode);if(game.veteran)renderEvolutionControls(inside,false);const customize=document.createElement('button');customize.id='prepareWorkshop';customize.className='iconbtn';customize.textContent=t('breaker.shop.open');customize.addEventListener('click',openWorkshop);inside.append(customize);if(overlayMode==='ready')preparation.append(label); }else if(overlayMode==='won'||overlayMode==='lost'){addResult(inside);}if(overlayMode==='paused'){const operations=document.createElement('button');operations.className='iconbtn';operations.textContent=t('breaker.lobby.operations');operations.addEventListener('click',showLobby);inside.append(operations);const retry=document.createElement('button');retry.id='quickRetry';retry.className='iconbtn';retry.textContent=t('breaker.session.retry');retry.addEventListener('click',quickRetry);inside.append(retry);const full=document.createElement('button');full.className='iconbtn';full.textContent=t('breaker.session.fullscreen');full.addEventListener('click',toggleFocus);inside.append(full);const back=document.createElement('a');back.className='hub-return';back.href='/';back.textContent='메인화면으로';inside.append(back);}if(overlayMode==='ready'){
 const actionRow=document.createElement('div');actionRow.className='overlay-actions-row';actionRow.style.cssText='display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap;margin-top:14px;width:100%;';
 const stagePickerBtn=document.createElement('button');stagePickerBtn.id='overlayStageSelectBtn';stagePickerBtn.type='button';stagePickerBtn.className='secondary-btn';stagePickerBtn.style.cssText='min-height:46px;padding:11px 18px;border-radius:8px;font-weight:800;border:1px solid #457b9d;background:#0f2b3b;color:#b2ebf2;cursor:pointer;display:inline-flex;align-items:center;gap:6px;';stagePickerBtn.innerHTML='≡ 스테이지 변경 / 선택 ↗';stagePickerBtn.onclick=()=>openStageSelect();
 const quickPrevBtn=document.createElement('button');quickPrevBtn.type='button';quickPrevBtn.className='iconbtn';quickPrevBtn.title='이전 스테이지 (단축키: [)';quickPrevBtn.textContent='◀ 이전';quickPrevBtn.onclick=()=>navigateStage(-1);
 const quickNextBtn=document.createElement('button');quickNextBtn.type='button';quickNextBtn.className='iconbtn';quickNextBtn.title='다음 스테이지 (단축키: ])';quickNextBtn.textContent='다음 ▶';quickNextBtn.onclick=()=>navigateStage(1);
 actionRow.append(quickPrevBtn,stagePickerBtn,btn,quickNextBtn);inside.append(actionRow);
}else{inside.append(btn);}if(overlayMode==='won'&&game.operation){const menu=document.createElement('button');menu.type='button';menu.className='secondary-btn';menu.textContent=t('breaker.lobby.operations');menu.addEventListener('click',showLobby);inside.append(menu);}inside.scrollTop=0;btn.focus?.({preventScroll:true});}
function addPreparationControls(parent,state){
 if(state==='ready'){
  const brief=document.createElement('section');brief.className='journey-brief';
  const heading=document.createElement('strong');heading.textContent=t('breaker.journey.preparation');brief.append(heading);
  for(const textId of ['breaker.journey.controls',...(game.causalMode?['breaker.journey.source']:[])]){const line=document.createElement('p');line.textContent=t(textId);brief.append(line);}
  const guide=document.createElement('button');guide.type='button';guide.className='secondary-btn';guide.textContent=t(window.SignalBreakerTalentTech?.manager.guideRewardClaimed?'breaker.journey.guide.review':'breaker.journey.guide');guide.addEventListener('click',()=>$('guideDialog').showModal());
  const growth=document.createElement('button');growth.id='prepareGrowth';growth.type='button';growth.className='secondary-btn';growth.textContent=t('breaker.journey.growth');growth.addEventListener('click',openTalentTech);brief.append(guide,growth);parent.append(brief);
 }

 const panel=document.createElement('details');panel.className='preparation-details';panel.id='preparationSettings';panel.open=preparationOpen;panel.addEventListener('toggle',()=>{preparationOpen=panel.open;});const summary=document.createElement('summary');summary.textContent=t('breaker.prepare.settings');panel.append(summary);
 const loadout=document.createElement('div');loadout.className='loadout-grid';const index=CHAPTER.findIndex(c=>c.id===game.config.id),allowed=window.SignalBreakerChapter.availableWeapons(mode==='chapter'?index:-1,lab||game.veteran);
 for(let slot=0;slot<2;slot++){const label=document.createElement('label');label.textContent=t('breaker.slot.'+(slot+1));const select=document.createElement('select');select.id='slot'+(slot+1)+'Select';for(const id of [...new Set(allowed)].filter(id=>!game.veteran||(slot===0?id==='pulse':!['pulse','bankshot','resonance'].includes(id)))){const option=document.createElement('option');option.value=id;option.textContent=game.veteran&&id==='pulse'?t('breaker.evolution.frame.label'):WEAPONS[id].label+' · '+WEAPONS[id].verb;select.append(option);}select.value=game.loadout[slot];select.addEventListener('change',()=>{const ids=[...game.loadout];ids[slot]=select.value;if(!game.setLoadout(ids,game.weaponLevel,game.weaponUpgrade)){select.value=game.loadout[slot];toast(t('breaker.loadout.invalid'));return;}setWeapon(game.weapon);preparationOpen=true;showOverlay(state);});label.append(select);loadout.append(label);}panel.append(loadout);
 const actorPreview=document.createElement('canvas');actorPreview.width=700;actorPreview.height=360;actorPreview.className='actor-preview';actorPreview.setAttribute('aria-label',t('breaker.prepare.preview'));preparePreview=actorPreview;panel.append(actorPreview);const info=document.createElement('div');info.className='weapon-contract';for(const id of game.loadout){const spec=WEAPONS[id],row=document.createElement('p');const picture=document.createElement('span');picture.className='gear-preview';picture.style.backgroundPosition=(spec.cell%3*50)+'% '+Math.floor(spec.cell/3)*100+'%';row.append(picture);const caption=document.createElement('span');caption.textContent=game.veteran&&id==='pulse'?t('breaker.evolution.frame.help'):spec.label+' · '+spec.verb+' / '+spec.synergy+' / '+spec.limit;row.append(caption);info.append(row);}if(game.burstMode){const burst=document.createElement('p');burst.textContent=t(game.continuous?'breaker.item.guide':'breaker.burst.guide');info.append(burst);}panel.append(info);
 const growth=document.createElement('label');growth.textContent=t('breaker.growth.label');const levels=document.createElement('select');levels.id='weaponLevel';const max=lab?3:index>=3?3:index>=1?2:1;for(let i=1;i<=max;i++){const option=document.createElement('option');option.value=String(i);option.textContent='Lv.'+i;levels.append(option);}levels.value=String(game.weaponLevel);levels.addEventListener('change',()=>game.setLoadout(game.loadout,Number(levels.value),game.weaponUpgrade));growth.append(levels);const branch=document.createElement('select');branch.setAttribute('aria-label',t('breaker.growth.branch'));for(const [value,id] of [['range','breaker.growth.range'],['duration','breaker.growth.duration']]){const option=document.createElement('option');option.value=value;option.textContent=t(id);branch.append(option);}branch.value=game.weaponUpgrade||'range';branch.addEventListener('change',()=>game.setLoadout(game.loadout,game.weaponLevel,branch.value));growth.append(branch);panel.append(growth);
 const qualitySelect=document.createElement('select');qualitySelect.setAttribute('aria-label',t('breaker.settings.quality'));for(const value of ['high','balanced','low']){const option=document.createElement('option');option.value=value;option.textContent=t('breaker.quality.'+value);qualitySelect.append(option);}qualitySelect.value=quality;qualitySelect.addEventListener('change',()=>{quality=qualitySelect.value;updateQuality();});panel.append(qualitySelect);
 const help=document.createElement('p');help.textContent=t('breaker.quality.help');panel.append(help);
 const controlSelect=document.createElement('select');controlSelect.id='controlModeSelect';controlSelect.setAttribute('aria-label',t('breaker.control.label'));for(const value of ['flow','twin','precision']){const option=document.createElement('option');option.value=value;option.textContent=t('breaker.control.'+value);controlSelect.append(option);}controlSelect.value=settings.controlMode;controlSelect.addEventListener('change',()=>setControlMode(controlSelect.value));panel.append(controlSelect);
 const tuningHelp=document.createElement('p');tuningHelp.textContent=t('breaker.gameplay.tuning.help');panel.append(tuningHelp);for(const [key,textId] of [['autoTuning','breaker.gameplay.tuning'],['autoFire','breaker.settings.auto'],['holdFire','breaker.settings.hold'],['smartWeapon','breaker.settings.smart'],['aim','breaker.settings.aim'],['touchRelease','breaker.settings.touch'],['reduceMotion','breaker.settings.motion']]){const label=document.createElement('label');label.className='setting-toggle';const input=document.createElement('input');input.type='checkbox';input.checked=key==='reduceMotion'?reduceMotion:settings[key];input.addEventListener('change',()=>{if(key==='reduceMotion'){reduceMotion=input.checked;updateQuality();}else{settings[key]=input.checked;if(key==='autoTuning')game.setAutoTuning(input.checked);if(key==='smartWeapon')syncSmartControl();}safeSave();});label.append(input);const span=document.createElement('span');span.textContent=t(textId);label.append(span);panel.append(label);}
 for(const key of ['music','effects','devices','voice']){const label=document.createElement('label');label.textContent=t('breaker.volume.'+key);const input=document.createElement('input');input.type='range';input.min='0';input.max='1';input.step='.01';input.value=String(settings[key]);input.setAttribute('aria-label',label.textContent);input.addEventListener('input',()=>{settings[key]=Number(input.value);soundDirector.setMix(settings);safeSave();});label.append(input);panel.append(label);}
 const keyPanel=document.createElement('details');const keySummary=document.createElement('summary');keySummary.textContent=t('breaker.keys.label');keyPanel.append(keySummary);for(const action of Object.keys(bindings)){const label=document.createElement('label');label.textContent=t('breaker.key.'+action);const select=document.createElement('select');const choices=['KeyA','KeyD','KeyW','KeyS','KeyQ','KeyE','KeyR','KeyP','KeyZ','KeyX','KeyC','Digit1','Digit2','Digit3','Space','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];for(const code of choices){const option=document.createElement('option');option.value=code;option.textContent=code.replace('Key','').replace('Digit','');select.append(option);}select.value=bindings[action];select.addEventListener('change',()=>{const duplicate=Object.keys(bindings).find(k=>k!==action&&bindings[k]===select.value);if(duplicate){select.value=bindings[action];toast(t('breaker.keys.duplicate'));return;}bindings[action]=select.value;keys.clear();safeSave();});label.append(select);keyPanel.append(label);}panel.append(keyPanel);parent.append(panel);if(state==='paused'){const settingsButton=document.createElement('button');settingsButton.id='pauseSettings';settingsButton.type='button';settingsButton.className='secondary-btn';settingsButton.textContent=t('breaker.ui.settings');settingsButton.addEventListener('click',()=>{panel.open=true;preparationOpen=true;panel.scrollIntoView?.({block:'nearest'});panel.querySelector?.('select')?.focus?.({preventScroll:true});});parent.append(settingsButton);}
 const buttons=document.createElement('div');buttons.className='mode-tabs';for(const [id,textId,value,practice] of [['prepareChapter','breaker.mode.chapter','chapter',false],['prepareLab','breaker.mode.lab','chapter',true],['prepareTrial','breaker.mode.trial','trial',false]]){const button=document.createElement('button');button.id=id;button.type='button';button.textContent=t(textId);button.addEventListener('click',()=>selectMode(value,practice));buttons.append(button);}parent.append(buttons);return panel;
}
function addJourneyResult(parent){
 const panel=document.createElement('section');panel.className='journey-brief';
 const title=document.createElement('strong');title.textContent=t(game.state==='lost'?'breaker.journey.recovery.title':'breaker.journey.earned');panel.append(title);
 const line=document.createElement('p');line.textContent=game.state==='lost'?t(journey.recovery(game)):t(game.lastBossReward?'breaker.journey.reward':'breaker.journey.reward.repeat');panel.append(line);
 const button=document.createElement('button');button.type='button';button.className='secondary-btn';button.id='resultGrowth';button.textContent=t('breaker.journey.growth');button.addEventListener('click',openTalentTech);panel.append(button);
 if(game.state==='lost'){const prepare=document.createElement('button');prepare.id='retryPrepare';prepare.type='button';prepare.className='secondary-btn';prepare.textContent=t('breaker.journey.recovery.prepare');prepare.addEventListener('click',()=>retryPreparation(false));panel.append(prepare);}
 parent.append(panel);
}
function addResult(parent){if(game.state==='won'){addEndingMemory(parent);if(!completionSaved){const note=document.createElement('p');note.className='ending-save-warning';note.textContent=t('breaker.ending.save.failed');const retry=document.createElement('button');retry.id='retryCompletionSave';retry.type='button';retry.className='iconbtn';retry.textContent=t('breaker.ending.save.retry');retry.addEventListener('click',()=>{completionSaved=safeSave();if(completionSaved){const memory=records[recordKey()]?.endingMemory;if(memory&&playStageEnding(memory))return;showOverlay('won');}});parent.append(note,retry);}}if(game.state==='won'&&game.operation){const award=document.createElement('div');award.className='result-award';const score=document.createElement('strong');score.textContent='작전 완료 · '+(game.veteran?'EP02-'+String(window.SignalBreakerEpisodeTwo.stage(game.config.id).number).padStart(2,'0'):game.config.id);const sub=document.createElement('span');sub.textContent='위험 해소 '+game.cleared+' · 최고 연쇄 '+game.bestChain+' · 확보 포인트 '+(game.lastRewardDetails?.base||0)+'+'+(game.lastRewardDetails?.bonus||0);award.append(score,sub);parent.append(award);}if(game.premiumRun){const record=document.createElement('div');record.className='premium-run-record';const title=document.createElement('p');title.textContent=t('breaker.run.skill')+' '+game.reflectedHits+' · '+t('breaker.run.stable')+' '+game.stableCaptures;const build=document.createElement('p');build.textContent=t('breaker.run.build')+' · '+game.tunings.map(id=>t('breaker.tuning.'+id+'.name')).join(' → ');const history=document.createElement('details'),label=document.createElement('summary');label.textContent=t('breaker.run.history')+' · '+t('breaker.run.seed')+' '+game.seed;history.append(label);for(const wave of game.waveHistory){const row=document.createElement('p');row.textContent=String(wave.wave).padStart(2,'0')+' · '+wave.time.toFixed(1)+'s · '+t('breaker.session.shots')+' '+wave.shots+' · '+t('breaker.run.damage')+' '+wave.damage;history.append(row);}record.append(title,build,history);if(game.burstMode){const cascade=document.createElement('p');cascade.textContent='LV.'+game.burstRank()+' · '+t('breaker.burst.points')+' '+game.runPoints+' · '+t('breaker.burst.resolves')+' '+game.hazardResolves+(game.burstCombo()?' · '+t('breaker.burst.combo.'+game.burstCombo()):'');record.append(cascade);}parent.append(record);}const stats=document.createElement('div');stats.className='run-stats';const previous=runBaseline?.best||0;stats.textContent=t('breaker.session.shots')+' '+game.shotsFired+' · '+t('breaker.result.reflections')+game.bounces+' · '+t('breaker.session.time')+' '+game.time.toFixed(1)+'s'+(previous?' / '+t('breaker.session.best')+' '+previous.toLocaleString()+(game.score>previous?' · '+t('breaker.session.newbest'): ''):'');parent.append(stats);const mastery=document.createElement('div');mastery.className='mastery-goals';for(const [id,value,goal] of [['breaker.mastery.chain',game.bestChain,3],['breaker.mastery.reflect',game.reflectedHits,3],['breaker.mastery.gear',game.usedWeapons.size,2]]){const chip=document.createElement('span');const key=id.split('.').at(-1),earned=records[recordKey()]?.mastery?.[key]===true;chip.className=value>=goal||earned?'achieved':'';chip.textContent=(value>=goal||earned?'✓ ':'')+t(id)+' '+(earned?goal:Math.min(value,goal))+'/'+goal;mastery.append(chip);}parent.append(mastery);const summary=document.createElement('p');summary.className='result-summary';summary.textContent=(lab?t('breaker.lab.notice'):'첫 클리어 '+(game.lastRewardDetails?.base||0)+' + 연쇄 보너스 '+(game.lastRewardDetails?.bonus||0)+' · 누적 '+credits)+' / '+t('breaker.result.weapons')+[...game.usedWeapons].map(id=>WEAPONS[id].label).join(' + ')+' / '+t('breaker.result.reflections')+game.bounces;const detail=document.createElement('details');detail.className='result-details';const more=document.createElement('summary');more.textContent=t('breaker.brand.details');detail.append(more,summary);parent.append(detail);
 const route=game.lastRoute;if(route?.length){const canvas=document.createElement('canvas');canvas.width=330;canvas.height=150;canvas.className='route-replay';canvas.setAttribute('aria-label',t('breaker.result.route'));const paint=canvas.getContext('2d');paintWorldOverview(paint,330,150);paint.strokeStyle='#88e8e2';paint.lineWidth=2;paint.beginPath();route.forEach((point,i)=>{const x=point.x/W*330,y=point.y/H*150;if(i)paint.lineTo(x,y);else paint.moveTo(x,y);});paint.stroke();const detail=document.createElement('details');detail.className='replay-details';const title=document.createElement('summary');title.textContent=t('breaker.result.route_detail');detail.append(title,canvas);parent.querySelector?.('.result-details')?.append(detail);const replay=document.createElement('button');replay.className='iconbtn';replay.id='routeReplay';replay.textContent=t('breaker.result.replay');replay.addEventListener('click',()=>{const start=performance.now();function animate(now){if(!canvas.isConnected)return;const progress=Math.min(1,(now-start)/1800);paint.clearRect(0,0,330,150);paintWorldOverview(paint,330,150);paint.beginPath();route.slice(0,Math.max(2,Math.ceil(route.length*progress))).forEach((point,i)=>{const x=point.x/W*330,y=point.y/H*150;if(i)paint.lineTo(x,y);else paint.moveTo(x,y);});paint.stroke();if(progress<1)requestAnimationFrame(animate);}requestAnimationFrame(animate);});detail.append(replay);}
 const stages=mode==='chapter'?CHAPTER:STAGES,next=stages[stages.indexOf(game.config)+1];if(next&&game.state==='won'){const nextInfo=document.createElement('p');nextInfo.textContent=t('breaker.result.next')+(game.veteran?t(window.SignalBreakerEpisodeTwo.stage(next.id).nameId):next.name)+' · '+(game.veteran?t(window.SignalBreakerEpisodeTwo.stage(next.id).hookId):next.summary);nextInfo.className='next-route';parent.append(nextInfo);}

 const retry=document.createElement('button');retry.className='iconbtn';retry.textContent=t(game.premiumRun?'breaker.run.same':'breaker.result.retry');retry.addEventListener('click',quickRetry);parent.append(retry);if(game.premiumRun){const fresh=document.createElement('button');fresh.className='iconbtn';fresh.id='newRun';fresh.textContent=t('breaker.run.new');fresh.addEventListener('click',()=>setupStage(game.config.id,!game.veteran));parent.append(fresh);}if(game.state==='won'&&game.operation){const loadout=document.createElement('button');loadout.id='resultLoadout';loadout.className='iconbtn';loadout.textContent='동일 작전 장비 정비';loadout.addEventListener('click',()=>setupStage(game.config.id,false));parent.append(loadout);const operations=document.createElement('button');operations.id='resultOperationSelect';operations.className='iconbtn';operations.textContent='작전 선택';operations.addEventListener('click',showLobby);parent.append(operations);}
 if(game.operation&&!lab&&!game.training)addJourneyResult(parent);
}
function retryPreparation(immediate){const plan=window.SignalBreakerSession.retryPlan(game);settings.autoTuning=plan.autoTuning;if(!game.training&&!lab){checkpoint=null;resumeCandidate=null;safeSave();}setupStage(plan.id,false,plan.seed);window.SignalBreakerSession.applyRetry(game,plan);setWeapon(game.weapon);if(immediate){game.start();hideOverlay();}else{showOverlay('ready');toast(t('breaker.player.retry.kept'),3);}}
function quickRetry(){retryPreparation(true);}
function hideOverlay(){document.body.dataset.session=game.state;soundDirector.setSession(game.state==='playing',soundOn);$('overlay').classList.add('hidden');if(game.state==='playing'){document.body.classList.add('breaker-focus');$('focusBtn').textContent='⛶ 전체화면';}}
function pause(){if(overviewPaused){overviewPaused=false;closeView=false;document.body.classList.remove('overview-open');$('viewBtn').textContent=t('breaker.session.overview');$('viewBtn').setAttribute('aria-pressed','false');}if(game.state==='playing'){game.pause();showOverlay('paused');}else if(game.state==='paused'){game.pause();hideOverlay();}else if(game.state==='ready'){game.start();hideOverlay();}}
const BOSS_CUTIN_META = {
  delivery: { code: 'SB-01 · CRITICAL LIFT', name: '반입 호퍼 리프터 (Hopper Lifter)', desc: '양방향 셔터 과부하 방출 · 유압 차폐벽 강제 차단', target: '개입 목표: 3대 차폐 노드 분쇄 후 중앙 코어 냉각', image: 'art/boss-delivery-final-v2.webp' },
  conveyor: { code: 'SB-02 · RUNAWAY LOGISTICS', name: '인터록 롤러 컨베이어 (Interlock Conveyor)', desc: '듀얼 드라이브 샤프트 폭주 · 이송 벨트 충격파', target: '개입 목표: 3구역 회전 샤프트 정지 및 잔여 신호 포획', image: 'art/boss-conveyor-final-v2.webp' },
  extraction: { code: 'SB-03 · CYCLONE OVERPRESSURE', name: '사이클론 집진 설비 (Cyclone Extractor)', desc: '고압 임펠러 집진 챔버 압력 폭주 · 분진 입자 방출', target: '개입 목표: 4단계 필터 밸브 감압 및 미스트 중화', image: 'art/boss-extraction-final-v2.webp' },
  tension: { code: 'SB-04 · HOIST CABLE OVERLOAD', name: '고장력 케이블 윈치 (Tension Hoist)', desc: '고장력 와이어 인장 한계 초과 · 댐퍼 빔 파열 위험', target: '개입 목표: 앵커 고정 레일 체결 및 하중 밸런스 복구', image: 'art/boss-tension-final-v2.webp' },
  grid: { code: 'SB-05 · MULTI-GRID ARCDOWN', name: '고전압 변전 배전반 (High-Voltage Grid)', desc: '초고압 애자 절연 파괴 · 전력 아크 연쇄 폭주', target: '개입 목표: 위상 스캐너 선로 절체 및 메인 차단기 트립', image: 'art/boss-grid-final-v2.webp' }
};
let bossCutinTimer = null;
function triggerBossCutin(boss){
  if(!boss)return;
  const meta = BOSS_CUTIN_META[boss.identity];
  if(!meta)return;
  const cutin = $('bossCutin');
  if(!cutin)return;
  $('bossCutinImg').src = meta.image;
  $('bossCutinCode').textContent = meta.code;
  $('bossCutinTitle').textContent = meta.name;
  $('bossCutinDesc').textContent = meta.desc;
  $('bossCutinTarget').textContent = meta.target;
  cutin.hidden = false;
  tone(220, 0.45, 'sawtooth', 0.22, 110);
  screenShake.mag = Math.min(18, screenShake.mag + 12);
  clearTimeout(bossCutinTimer);
  bossCutinTimer = setTimeout(() => { cutin.hidden = true; }, 2800);
}
function hud(){document.body.dataset.activeBoss=String(!!game.boss&&!['resolved','defeated'].includes(game.boss.phase));if(game.veteran){const challenge=window.SignalBreakerEpisodeTwo.stage(game.config.id);$('signalObjective').hidden=false;$('signalObjective').textContent=(game.episodeSignal.complete?'✓ ': 'Ψ ')+t(challenge.goalId)+' '+game.episodeSignal.count+'/'+challenge.target;$('signalObjective').dataset.complete=String(game.episodeSignal.complete);$('veteranStatus').hidden=false;$('veteranStatus').textContent=Math.ceil(game.waveTimeRemaining())+'s · '+t('breaker.evolution.'+(game.evolution.recipe||game.evolution.frame)+'.name').split(' · ')[0]+' · '+(game.evolution.recipe?(game.evolution.capstone?t('breaker.tree.final'):game.evolution.branch?t('breaker.tree.'+game.evolution.branch+'.name'):t('breaker.tree.tier2')):Math.min(window.SignalBreakerEpisodeTwo.requiredParts(game),game.pickupCount)+'/'+window.SignalBreakerEpisodeTwo.requiredParts(game));}else{$('veteranStatus').hidden=true;$('signalObjective').hidden=true;}const items=$('itemStatus');if(items){items.hidden=!game.continuous||!['playing','paused'].includes(game.state);items.textContent=t('breaker.item.progress')+' LV.'+game.burstRank()+' · '+(game.burstRank()===3?t('breaker.item.max'):(game.pickupCount%3)+' / 3')+' | '+t('breaker.item.watch.progress')+' '+(game.signalWatch||0)+' / 3';}const encounter=$('bossEncounter');if(encounter){const boss=game.boss;encounter.hidden=!boss||boss.phase==='resolved'||!game.operation; if(!encounter.hidden){const bossNames={delivery:'반입 혼선 제어기',conveyor:'컨베이어 과부하',extraction:'집진 압력 코어',tension:'장력 릴레이',grid:'복합 전력망'};const meta=BOSS_CUTIN_META[boss.identity];if(meta&&$('bossEncounterThumb'))$('bossEncounterThumb').src=meta.image;$('bossEncounterStage').textContent=game.veteran?'EP02-'+window.SignalBreakerEpisodeTwo.stage(game.config.id).number:game.config.id;$('bossEncounterName').textContent=bossNames[boss.identity]||'위험 신호 코어';const sealed=boss.phase==='sealed',remaining=boss.nodes.filter(n=>!n.hit).length;$('bossEncounterPhase').textContent=boss.identity==='delivery'?'반입문 '+boss.gatePhase+'/'+boss.maxGatePhases+(boss.phase==='rearming'?' · 재잠금':sealed?' · 잠금 '+remaining:' · 코어 노출'):boss.identity==='conveyor'?'장갑 '+boss.segment+'/'+boss.maxSegments+(boss.phase==='rebuilding'?' · 재가동':sealed?' · 노드 '+remaining:' · 약점'):boss.identity==='extraction'?'필터 '+boss.filterStage+'/'+boss.maxFilterStages+(boss.phase==='purging'?' · 배출 중':sealed?' · 밸브 '+remaining:' · 코어 노출'):boss.identity==='tension'?t('breaker.boss.load')+' '+boss.loadStage+'/'+boss.maxLoadStages+(boss.phase==='rebalancing'?' · '+t('breaker.boss.rebalancing'):sealed?' · '+t('breaker.boss.sealed'):' · '+t('breaker.boss.exposed')):sealed?'방호 노드 '+remaining+' / '+boss.nodes.length:boss.identity==='grid'&&boss.combatTier===2?'2단계 · 연쇄 과부하':'약점 노출';$('bossEncounterFill').style.width=(boss.identity==='delivery'?100*((boss.maxGatePhases-boss.gatePhase)+(boss.phase==='rearming'?0:sealed?(boss.nodes.length-remaining)/boss.nodes.length*.25:.25+.75*(1-boss.hp/boss.maxHp)))/boss.maxGatePhases:boss.identity==='extraction'?100*((boss.maxFilterStages-boss.filterStage)+(boss.phase==='purging'?0:sealed?(boss.nodes.length-remaining)/boss.nodes.length*.3:.3+.7*(1-boss.hp/boss.maxHp)))/boss.maxFilterStages:boss.identity==='conveyor'?100*((boss.maxSegments-boss.segment)+(boss.phase==='rebuilding'?0:sealed?(boss.nodes.length-remaining)/boss.nodes.length*.25:.25+.75*(1-boss.hp/boss.maxHp)))/boss.maxSegments:boss.identity==='tension'?100*((boss.loadStage-1)+(boss.phase==='rebalancing'?0:sealed?(boss.nodes.length-remaining)/boss.nodes.length*.3:.3+.7*(1-boss.hp/boss.maxHp)))/boss.maxLoadStages:sealed?(boss.nodes.length-remaining)/boss.nodes.length*32:32+68*boss.hp/Math.max(1,boss.maxHp))+'%';encounter.dataset.phase=boss.phase;encounter.dataset.tier=String(boss.combatTier||1);}}const boost=$('boostBtn');if(boost){boost.hidden=!game.burstMode;boost.disabled=game.state!=='playing'||game.runPoints<40||game.time<game.boostReadyAt;boost.textContent=game.runPoints>=40&&game.time>=game.boostReadyAt?'↗ 강화 가능':'↗ 강화 · 40P';boost.title='LV'+game.burstRank()+' · '+game.runPoints+'P · '+game.pickupCount%(game.continuous?3:5)+'/'+(game.continuous?3:5);boost.setAttribute('aria-label',t('breaker.burst.boost')+' 40 '+t('breaker.burst.points')+' · '+game.runPoints);}let s=game.snapshot();const flow=game.operation||settings.controlMode==='flow';$('fireLabel').textContent='FIRE';$('fireAction').textContent=t('breaker.session.fire');$('fireBtn').setAttribute('aria-label',t('breaker.session.fire'));$('fireBtn').setAttribute('aria-pressed','false');const autoButton=$('autoFireBtn');autoButton.hidden=!flow;autoButton.disabled=!flow;autoButton.textContent=settings.autoFire?'AUTO ON':'AUTO OFF';autoButton.setAttribute('aria-pressed',String(flow&&settings.autoFire));autoButton.setAttribute('aria-label',t(settings.autoFire?'breaker.auto.stop':'breaker.auto.start'));autoButton.classList.toggle('active',flow&&settings.autoFire);$('aimPad').setAttribute('aria-label',t(flow?'breaker.control.override':'breaker.control.twin'));const split=milestones.has('split'),reflect=milestones.has('ricochet')||milestones.has('corebounce')||milestones.has('bumper'),capture=milestones.has('capture');const assistGuide=flow&&game.time>=manualAimUntil&&aimPadPointer===null&&assistTarget?.hint?'breaker.assist.'+assistTarget.hint:'';const sourceGuide=game.source&&!game.source.verified?'breaker.source.'+(game.source.controlled?'checking':game.source.requested?'executing':game.source.observed?'revealed':'hint'):'';const toastActive=$('toast').classList.contains('visible')&&performance.now()<toastExpires;const assistVisible=!!(sourceGuide||assistGuide)&&game.state==='playing'&&!endingPlayer.active&&!toastActive;document.body.dataset.guidance=assistVisible?'action':toastActive?'event':'none';const assistHint=$('assistHint');if(assistHint){assistHint.hidden=!assistVisible;const hintText=assistVisible?t(sourceGuide||'breaker.assist.move.'+(assistTarget.moveDirection<0?'left':'right')):'';if(assistHint.textContent!==hintText)assistHint.textContent=hintText;}for(const [button,side] of [['leftBtn',-1],['rightBtn',1]])$(button).classList.toggle('suggested',assistVisible&&!sourceGuide&&assistTarget?.moveDirection===side);const nextGuide=assistGuide||(['SB-01','CH-01'].includes(game.config.id)?(!split?(flow?'breaker.lesson.flow':'breaker.lesson.angle'):!reflect?'breaker.lesson.reflect':!capture?'breaker.lesson.capture':'breaker.lesson.done'):'');if(nextGuide!==guideKey){guideKey=nextGuide;const lesson=game.config.id+':'+nextGuide;guideUntil=nextGuide&&!lessons.has(lesson)?game.time+3:0;if(nextGuide)lessons.add(lesson);}if(assistGuide&&game.time>=guideUntil+7)guideUntil=game.time+3;$('chainGuide').textContent=t(nextGuide);$('chainGuide').style.display=game.state==='playing'&&guideUntil>game.time&&!assistVisible&&!toastActive?'block':'none';const rail=game.railSegment(game.rail[0]);$('shieldBtn').textContent=t('breaker.shield.angle')+' '+Math.round(Math.atan2(rail.by-rail.ay,rail.bx-rail.ax)*180/Math.PI)+'°';$('collected').textContent=s.wave+'/'+s.waveCount;$('score').textContent=String(s.score).padStart(6,'0');$('combo').textContent=s.chain?'× '+s.chain:'—';$('progress').style.width=(s.cleared/s.total*100).toFixed(1)+'%';$('hudBottom').style.opacity=game.comboTime>0?'1':'0';$('comboWindow').style.width=Math.max(0,Math.min(100,game.comboTime/game.comboWindow()*100))+'%';$('missionPercent').textContent=Math.round(s.cleared/s.total*100)+'%';$('missionFill').style.width=(s.cleared/s.total*100).toFixed(1)+'%';$('health').innerHTML=Array.from({length:5},(_,i)=>'<span class="heart'+(i<s.life?'':' empty')+'"></span>').join('');$('time').textContent=String(Math.floor(game.time/60)).padStart(2,'0')+':'+String(Math.floor(game.time%60)).padStart(2,'0');$('magnetBtn').classList.toggle('active',game.magnetOn);$('magnetBtn').textContent='◎ '+(game.magnetOn?(game.magnetPolarity>0?'끌기':'밀기'):'자력 OFF');$('conveyorBtn').disabled=!game.config.conveyor;$('conveyorBtn').textContent='▰ '+(game.conveyorDirection>0?'정방향':game.conveyorDirection<0?'역방향':'벨트 정지');$('pcHelp').textContent=t('breaker.pc.prefix')+Object.entries(bindings).map(([action,key])=>t('breaker.key.'+action)+':'+key.replace('Key','').replace('Digit','')).join(' · ');const aimDir=game.launchGeometry().direction;$('aimAngle').textContent=(aimDir.x<0?'↖ ':'↗ ')+Math.round(Math.atan2(-aimDir.y,Math.abs(aimDir.x))*180/Math.PI)+'°';$('mobileHelp').textContent=t(settings.controlMode==='flow'?'breaker.mobile.flow':settings.controlMode==='twin'?'breaker.mobile.twin':settings.holdFire?'breaker.mobile.hold':settings.touchRelease?'breaker.mobile.help':'breaker.mobile.button');$('deviceStatus').textContent=(lab?'LAB · 무보상 / ':'')+t('breaker.gate.condition')+(game.config.gateStable?t('breaker.gate.stable'):t('breaker.gate.normal'))+(game.config.tension?' · '+t(game.time<game.tensionLockUntil?'breaker.tension.locked':'breaker.tension.moving'):'')+(game.boss?.phase==='exposed'&&(game.config.orderedBoss||game.operation)?' · 노출 '+Math.max(0,(game.operation?5+game.boss.stage:8)-game.boss.exposure).toFixed(1)+'초':'');const source=game.source;const sourceButton=$('sourceBtn');sourceButton.hidden=!source;sourceButton.disabled=game.state!=='playing'||!!source?.requested;sourceButton.textContent=t('breaker.source.'+(!source?.observed?'observe':source.controlled?'closed':source.requested?'pending':'control'));if(source)$('deviceStatus').textContent=t('breaker.source.'+(source.verified?'verified':source.controlled?'checking':source.requested?'executing':source.observed?'revealed':'hint'));$('bossState').textContent=game.boss?.identity==='grid'&&game.boss.warningUntil>game.time?'⚠ 전력 불균형 · 스캔으로 차단 또는 이동':game.boss?.identity==='grid'&&game.boss.scannedUntil>game.time?'✓ 위험 신호 분석 · 약점 타격':game.boss?.identity==='tension'&&game.boss.warningUntil>game.time?'⚠ 장력 파열 임박 · 앵커로 레일 고정':game.boss?.identity==='tension'&&game.tensionLockUntil>game.time?'✓ 장력선 고정 중 · 약점 공격':game.boss?.identity==='extraction'&&game.boss.warningUntil>game.time?'⚠ 분진 압력 상승 · 미스트 또는 회피':game.boss?.identity==='extraction'&&game.boss.mistUntil>game.time?'✓ 집진구 압력 안정화':game.boss?.identity==='conveyor'&&game.boss.warningUntil>game.time?'⚠ 과부하 임박 · 벨트 정지 또는 구역 이탈':source?t('breaker.source.'+(source.verified?'verified':source.controlled?'checking':source.requested?'executing':source.observed?'revealed':'hint')):game.boss?(game.operation?t('breaker.boss.stage.'+game.boss.stage)+' · '+game.boss.hp+'/'+game.boss.maxHp+' / ':'')+(game.boss.phase==='sealed'?'중계 노드 '+game.boss.nodes.filter(v=>v.hit).length+'/3 · 보스 실드 유지':game.boss.phase==='exposed'?'보스 약점 노출 · 최종 공격':['rebalancing','rearming','rebuilding','purging'].includes(game.boss.phase)?t('breaker.boss.'+game.boss.phase):'보스 코어 해소 완료'):'모든 신호 코어를 회수하세요';}
function l(x,y,X,Y,color,width=1){cx.strokeStyle=color;cx.lineWidth=width;cx.beginPath();cx.moveTo(x,y);cx.lineTo(X,Y);cx.stroke();}
function circ(x,y,r,fill,stroke,width=1){cx.beginPath();cx.arc(x,y,r,0,Math.PI*2);if(fill){cx.fillStyle=fill;cx.fill();}if(stroke){cx.strokeStyle=stroke;cx.lineWidth=width;cx.stroke();}}
function text(value,x,y,size=12,color='#dff3f9',align='left',weight='500'){cx.fillStyle=color;cx.font=`${weight} ${size}px "Pretendard","Malgun Gothic",system-ui,sans-serif`;cx.textAlign=align;cx.fillText(value,x,y);}
function roundRect(x,y,w,h,r,fill,stroke){cx.beginPath();cx.roundRect(x,y,w,h,r);if(fill){cx.fillStyle=fill;cx.fill();}if(stroke){cx.lineWidth=1;cx.strokeStyle=stroke;cx.stroke();}}
let closeView=false;
let camera={scale:1,x:0,y:0,width:W,height:H,dpr:1};
function renderSurface(){const box=cv.getBoundingClientRect(),limit=quality==='high'?2:quality==='balanced'?1.5:1,dpr=Math.min(limit,window.devicePixelRatio||1,Math.sqrt(3000000/Math.max(1,box.width*box.height)));const width=Math.round(box.width*dpr),height=Math.round(box.height*dpr);if(cv.width!==width||cv.height!==height){cv.width=width;cv.height=height;}camera.width=box.width;camera.height=box.height;camera.dpr=dpr;cx.imageSmoothingEnabled=true;cx.imageSmoothingQuality='high';cv.dataset.renderScale=dpr.toFixed(2);}
function updateCamera(){const portrait=(window.innerHeight||camera.height)>(window.innerWidth||camera.width);premium.setPortrait(portrait);const bounds=premium.worldBounds(game.config);
 camera.bossFraming=null;
 const encounter=game.operation&&game.boss&&game.boss.phase!=='resolved'&&['playing','paused'].includes(game.state)?game.boss:null;
 const shortBoss=!portrait&&camera.height>=140&&camera.height<=600&&encounter;
 const framing=shortBoss?'landscape':'normal';if(document.body.dataset.bossFraming!==framing)document.body.dataset.bossFraming=framing;
 if(portrait){
  const activeBoss=game.operation&&game.boss&&game.boss.phase!=='resolved'&&['playing','paused'].includes(game.state)?game.boss:null;
  if(activeBoss){
   const view=window.SignalBreakerBossCamera.frame({width:camera.width,height:camera.height,worldWidth:W,boundsTop:bounds.top,boundsHeight:bounds.height,ground:GROUND,player:game.player,boss:activeBoss});
   camera.scale=view.scale;camera.x=view.x;camera.y=view.y;camera.bossFraming=view.targets;
  }else{
   const view=window.SignalBreakerPortraitCamera.frame({width:camera.width,height:camera.height,worldWidth:W,boundsTop:bounds.top,boundsHeight:bounds.height,ground:GROUND,playerX:game.player.x,aimX:game.player.aimX});
   if(view){camera.scale=view.scale;camera.x=view.x;camera.y=view.y;}
  }
 }else if(shortBoss){const view=window.SignalBreakerBossCamera.landscapeFrame({width:camera.width,height:camera.height,worldWidth:W,player:game.player,boss:encounter});camera.scale=view.scale;camera.x=view.x;camera.y=view.y;camera.bossFraming=view.targets;
 }else{camera.scale=Math.max(camera.width/W,camera.height/H);camera.x=(W-camera.width/camera.scale)/2;camera.y=Math.max(0,H-camera.height/camera.scale);}
}
window.addEventListener('resize',renderSurface);
// Mobile browser chrome changes viewport height without a classical window resize.
window.visualViewport?.addEventListener('resize',renderSurface);
if(typeof ResizeObserver==='function')new ResizeObserver(renderSurface).observe(cv);
let worldTexture=null,worldTextureKey='',worldTextureTop=0,worldTextureHeight=H;
function drawWorldBackground(){const bounds=premium.worldBounds(game.config),key=[game.config.id,quality,premium.backgroundRevision(game.config),bounds.top,bounds.height].join(':');if(!worldTexture||key!==worldTextureKey){worldTextureTop=bounds.top;worldTextureHeight=bounds.height;worldTexture=document.createElement('canvas');const resolution=quality==='high'?2:quality==='balanced'?1.5:1;worldTexture.width=W*resolution;worldTexture.height=bounds.height*resolution;const paint=worldTexture.getContext('2d',{alpha:false});paint.scale(resolution,resolution);paint.translate(0,-bounds.top);premium.background(paint,game.config);worldTextureKey=key;}if(camera.bossFraming&&camera.width>camera.height)premium.background(cx,game.config);else cx.drawImage(worldTexture,0,worldTextureTop,W,worldTextureHeight);}
function paintWorldOverview(paint,width,height){if(worldTexture){const scale=worldTexture.width/W;paint.drawImage(worldTexture,0,-worldTextureTop*scale,worldTexture.width,H*scale,0,0,width,height);}}
function background(){drawWorldBackground();premium.ambiance(cx,game);premium.atmosphere(cx,game);}
function obstacles(){const stage=game.config;
 if(stage.conveyor){const steel=cx.createLinearGradient(0,GROUND-9,0,GROUND+17);steel.addColorStop(0,'#8c9891');steel.addColorStop(.18,'#364a4d');steel.addColorStop(.5,'#19272d');steel.addColorStop(1,'#53615d');roundRect(325,GROUND-9,525,26,5,steel,'#b3b4a866');l(330,GROUND-7,845,GROUND-7,'#e4d0a177',1);for(let bolt=340;bolt<845;bolt+=72){circ(bolt,GROUND+13,2,'#cfcec0');}const phase=reduceMotion?0:game.time*65*game.conveyorDirection%30;for(let x=335;x<845;x+=30){circ(x,GROUND+7,6,'#304951','#b2c7c8');const offset=((phase%30)+30)%30;l(x+offset,GROUND-3,x+offset+12,GROUND-3,'#f2bf69',3);}text(t(game.conveyorDirection>0?'breaker.belt.forward':game.conveyorDirection<0?'breaker.belt.reverse':'breaker.belt.stopped'),580,GROUND+35,11,'#ffc77f','center','800');}
 for(const spec of stage.bumper){const b=game.bumperPosition(spec);if(stage.shuttle){l(spec.x-stage.shuttle.amplitude,spec.y,spec.x+stage.shuttle.amplitude,spec.y,'#b7cec34d',3);}const impact=premium.bumperHits?.findLast(h=>Math.hypot(h.x-b.x,h.y-b.y)<b.r+6&&game.time-h.at<.3),press=impact?.at!==undefined?(1-(game.time-impact.at)/.3)*.16:0;cx.save();cx.translate(b.x,b.y);if(impact){cx.rotate(Math.atan2(impact.ny,impact.nx));cx.scale(1-press,1+press*.3);}const clearField=['CH-02','CH-03'].includes(stage.id);if(clearField){circ(0,0,b.r,'#123d4922','#8adbe5aa',2);cx.globalAlpha=.55;premium.structure(cx,1,0,0,b.r*1.1,b.r*1.1);cx.globalAlpha=1;}else if(!premium.structure(cx,1,0,0,b.r*2,b.r*2)){circ(0,0,b.r,'#234e5f','#72d8dd',6);}if(press>0){circ(0,0,b.r+4,null,'#ffe0aa',2);}cx.restore();}
 for(const r of game.rail){const v=game.railSegment(r);if(stage.tension){l(r.x-80,70,r.x,r.y,'#a8bcc8',2);l(r.x+80,70,r.x,r.y,'#a8bcc8',2);circ(r.x,r.y,9,'#172936',game.time<game.tensionLockUntil?'#ffb975':'#95cada',3);premium.structure(cx,4,r.x,67,27,27);}if(['CH-02','CH-03'].includes(stage.id)){cx.save();cx.lineCap='round';l(v.ax,v.ay,v.bx,v.by,'#8adbe544',18);cx.restore();}if(!premium.structure(cx,0,r.x,r.y,Math.hypot(v.bx-v.ax,v.by-v.ay),['CH-02','CH-03'].includes(stage.id)?10:18,Math.atan2(v.by-v.ay,v.bx-v.ax))){l(v.ax,v.ay,v.bx,v.by,'#315a69',14);}for(let j=1;j<=4;j++){const p=j/5;circ(v.ax+(v.bx-v.ax)*p,v.ay+(v.by-v.ay)*p,3,game.shieldMotion?'#ff9b70':'#ffca83');}text(t(game.shieldMotion?'breaker.shield.moving':'breaker.shield.locked'),r.x,r.y+30,10,'#bdd9df','center','800');}
 const m=stage.magnet;premium.structure(cx,2,m.x,m.y,86,86);circ(m.x,m.y,12,game.magnetOn?'#57dbdd77':'#18232caa');text(game.magnetOn?(game.magnetPolarity>0?'N':'S'):'—',m.x,m.y+5,13,game.magnetOn?'#d9f8fa':'#8d9fa5','center','850');
 if(game.magnetOn){cx.save();cx.setLineDash([8,13]);cx.lineDashOffset=reduceMotion?0:-game.time*32*game.magnetPolarity;circ(m.x,m.y,240,null,'#65c5de25',1);cx.setLineDash([]);for(const c of game.cores){const d=Math.hypot(c.x-m.x,c.y-m.y);if(c.kind!=='metal'||d>=240)continue;cx.strokeStyle='#6fc8d54d';cx.lineWidth=1;cx.beginPath();cx.moveTo(c.x,c.y);cx.quadraticCurveTo((m.x+c.x)/2,(m.y+c.y)/2-25,m.x,m.y);cx.stroke();const flow=((game.time*.65)%1),t=game.magnetPolarity>0?flow:1-flow;circ(c.x+(m.x-c.x)*t,c.y+(m.y-c.y)*t,2,'#b4f0df');}cx.restore();}
 const g=stage.gate,open=game.time<game.gateOpenUntil,powered=game.circuit.every(n=>n.hit)&&game.gateStatus().open;premium.structure(cx,3,g.x,g.y,55,140);l(g.x-19,g.y-54,g.x-19,g.y+54,powered?'#80e9d4':'#be8d57',2);l(g.x+19,g.y-54,g.x+19,g.y+54,powered?'#80e9d4':'#be8d57',2);const slit=open?12:2;roundRect(g.x-slit,g.y-58,slit*2,116,3,'#0b3f4199','#6ad1c2');for(let j=-2;j<=2;j++){const flow=game.time*35%20;l(g.x-16,g.y+j*20+flow,g.x-3,g.y+j*20+flow,'#8befcb55',2);}text(stage.gateCycle?t(game.gateStatus().open?'breaker.gate.window':'breaker.gate.wait')+' '+Math.ceil(game.gateStatus().remaining)+'s':t(powered?'breaker.gate.open':'breaker.gate.circuit'),g.x,g.y-84,10,'#aef8dc','center','850');
 for(let i=0;i<game.circuit.length;i++){const n=game.circuit[i],next=game.circuit[i+1]||g;const active=n.hit;l(n.x,n.y,next.x,next.y,active?'#78dcd8':'#465768',active?2:1);if(!premium.equipment(cx,n.hit?3:2,n.x,n.y,44))premium.structure(cx,4,n.x,n.y,44,44);circ(n.x,n.y,11,n.hit?'#67e9b766':'#d5944866');text(n.hit?'✓':String(i+1),n.x,n.y+6,17,'#fff6e2','center','850');if(active){const p=game.time%1;circ(n.x+(next.x-n.x)*p,n.y+(next.y-n.y)*p,3,'#d1fff0');}}
 for(const field of game.fields){const spec=WEAPONS[field.kind];circ(field.x,field.y,field.radius,spec.color+'10',spec.color+'aa',1.5);cx.save();cx.beginPath();cx.arc(field.x,field.y,field.radius,0,Math.PI*2);cx.clip();if(field.kind==='mist'){for(let i=0;i<(quality==='low'?4:15);i++){const phase=(game.time*.45+i*.618)%1,x=field.x+(i%5-2)*field.radius*.35,y=field.y+field.radius*(.7-phase*1.4);circ(x,y,18+phase*20,spec.color+'15');}}else if(field.kind==='magnet'){for(let i=0;i<4;i++){const r=20+((game.time*35*field.polarity+i*35)%field.radius+field.radius)%field.radius;cx.save();cx.scale(1,1);circ(field.x,field.y,r,null,spec.color+'55',1);cx.restore();}}else {const angle=game.time*2; l(field.x,field.y,field.x+Math.cos(angle)*field.radius,field.y+Math.sin(angle)*field.radius,spec.color+'aa',2);}cx.restore();text(spec.label+' · '+Math.max(0,field.until-game.time).toFixed(1)+'s',field.x,field.y-field.radius-9,10,spec.color,'center','800');}
 for(const anchor of game.anchors){const c=game.cores.find(c=>c.id===anchor.id);if(c){l(anchor.x,anchor.y,c.x,c.y,'#ffba7e',3);circ(anchor.x,anchor.y,8,'#233844','#ffbd7a',2);text(t('breaker.anchor.held'),anchor.x,anchor.y-15,10,'#ffc68e','center','800');}}
}
function drawBoss(){bossLabelBounds=null;const b=game.boss;if(!b)return;cx.save();let p=game.time*1.25;if(b.phase!=='resolved'){
  if(b.identity==='delivery'&&b.warningUntil>game.time){cx.save();cx.fillStyle='#f8b3552b';cx.fillRect(b.dischargeX-b.dischargeHalfWidth,b.y+28,b.dischargeHalfWidth*2,GROUND-b.y);l(b.dischargeX,b.y+22,b.dischargeX,GROUND,'#ffe2a9',3);text('⚠ 반입구 충격 예고',b.dischargeX,GROUND-53,13,'#ffe4a8','center','900');cx.restore();}
  if(b.identity==='conveyor'&&b.warningUntil>game.time){cx.save();cx.fillStyle='#ee786333';cx.fillRect(b.dangerLeft,GROUND-73,b.dangerRight-b.dangerLeft,73);for(let x=b.dangerLeft+10;x<b.dangerRight;x+=42)l(x,GROUND-69,x+30,GROUND-7,'#ffba6b88',4);text('⚠ 컨베이어 과부하 · 벨트 정지 또는 이탈',600,GROUND-88,13,'#ffedcb','center','850');cx.restore();}
  if(b.identity==='extraction'&&b.warningUntil>game.time){cx.save();cx.globalAlpha=.86;cx.fillStyle='#ca9f6a2b';cx.fillRect(b.x-143,b.y+65,286,GROUND-b.y-65);for(let i=0;i<7;i++){const x=b.x-120+i*40,y=GROUND-54;circ(x,y,7+(i%3)*3,'#e9bd8f44');}l(b.x-143,GROUND-35,b.x+143,GROUND-35,'#f8c88b',4);text('⚠ 분진 압력 상승 · 집진구 미스트 / 좌우 회피',b.x,GROUND-90,12,'#ffe7b6','center','850');cx.restore();}
  if(b.identity==='tension'&&b.warningUntil>game.time){cx.save();cx.fillStyle='#ef8b4b27';cx.fillRect(b.snapLeft,GROUND-102,b.snapRight-b.snapLeft,102);for(let x=b.snapLeft+10;x<b.snapRight;x+=42)l(x,GROUND-101,x+39,GROUND-7,'#ffba8277',3);l(b.snapLeft,GROUND-8,b.snapRight,GROUND-8,'#ffe1ac',3);text('⚠ 와이어 장력 파열 · 장력 앵커로 레일 고정 / 좌우 회피',640,GROUND-119,12,'#ffe0b7','center','850');cx.restore();}
  if(b.identity==='grid'&&b.warningUntil>game.time){const lane=game.gridArcLanes()[0];cx.save();cx.fillStyle=b.combatTier===2?'#f079a745':'#b28cff35';cx.fillRect(lane.x-lane.half,GROUND-116,lane.half*2,116);for(let x=lane.x-lane.half;x<lane.x+lane.half;x+=44){l(x,GROUND-115,Math.min(lane.x+lane.half,x+32),GROUND-9,'#f8d7ff88',3);}text(b.combatTier===2?'⚠ 전력 연쇄 폭주 · 스캔 격리 또는 회피':'⚠ 전력 구역 활성화 · 스캔 격리 또는 회피',lane.x,GROUND-138,12,'#f9e5ff','center','850');cx.restore();}
  if(b.identity==='delivery')premium.deliveryBoss(cx,b,game.time);else if(b.identity==='conveyor')premium.conveyorBoss(cx,b,game.time,game.conveyorDirection);else if(b.identity==='extraction')premium.extractionBoss(cx,b,game.time,game.gateStatus());else if(b.identity==='tension')premium.tensionBoss(cx,b,game.time,game.tensionLockUntil>game.time);else if(b.identity==='grid')premium.gridBoss(cx,b,game.time);else if(!premium.equipment(cx,b.phase==='exposed'?1:0,b.x,b.y,104))premium.structure(cx,5,b.x,b.y,138,138);cx.save();cx.globalCompositeOperation='screen';const energy=cx.createRadialGradient(b.x,b.y,2,b.x,b.y,26);energy.addColorStop(0,b.phase==='exposed'?'#fff0be55':'transparent');energy.addColorStop(.35,b.phase==='exposed'?'#e9a44433':'transparent');energy.addColorStop(1,'transparent');circ(b.x,b.y,26,energy);cx.restore();const canvasBox=cv.getBoundingClientRect(),guides=[$('chainGuide'),$('toast'),$('assistHint')].filter(Boolean).map(el=>el.getBoundingClientRect()).filter(r=>r.width).map(r=>({left:r.left-canvasBox.left,right:r.right-canvasBox.left,top:r.top-canvasBox.top,bottom:r.bottom-canvasBox.top})),label=premium.equipmentLabel(b,camera,guides);bossLabelBounds={left:canvasBox.left+(label.x-camera.x-50)*camera.scale,right:canvasBox.left+(label.x-camera.x+50)*camera.scale,top:canvasBox.top+(label.y-camera.y-16)*camera.scale,bottom:canvasBox.top+(label.y-camera.y+4)*camera.scale};text((game.operation?b.hp+'/'+b.maxHp+' · ':'')+t('breaker.boss.'+b.phase),label.x,label.y,14,b.phase==='exposed'?'#ffe1a6':'#bed8e7','center','850');
 }else{circ(b.x,b.y,54,'#34665b30','#7cf5ce55',2);text(t('breaker.boss.resolved'),b.x,b.y+8,15,'#a7ffdb','center','850');}
 for(const n of b.nodes){const r=n.hit?17:24;circ(n.x,n.y,r+7,n.hit?'#5cde9a12':'#e9b85d23',n.hit?'#80ecbe55':'#ffdb83a3',2);if(!premium.equipment(cx,n.hit?3:2,n.x,n.y,r*2))premium.structure(cx,4,n.x,n.y,r*2,r*2);circ(n.x,n.y,11,n.hit?'#67e9b766':'#d5944866');text(n.hit?'✓':(game.config.orderedBoss||game.operation&&game.config.relays)?String(b.nodes.indexOf(n)+1):'!',n.x,n.y+6,17,'#fff6e2','center','850');l(n.x,n.y,b.x,b.y,n.hit?'#b5efc68a':'#d1ba8f3a',n.hit?2:1);if(n.hit){const flow=game.time%1;circ(n.x+(b.x-n.x)*flow,n.y+(b.y-n.y)*flow,3,'#caffd5');}if(game.time<game.scanUntil&&!n.hit&&b.nodes.find(v=>!v.hit)===n){circ(n.x,n.y,35,null,'#d5b5ff',2);text(t('breaker.scan.next'),n.x,n.y-43,11,'#e1caff','center','800');}}
 cx.restore();}
function drawArmor(c){if(!game.veteran||!c.maxArmor)return;cx.save();cx.strokeStyle=c.armor>0?'#f4c78c':'#9ef1db';cx.lineWidth=3;cx.beginPath();cx.arc(c.x,c.y,c.r+6,-Math.PI/2,-Math.PI/2+Math.PI*2*(c.armor/c.maxArmor));cx.stroke();text(c.armor>0?String(c.armor)+'/'+c.maxArmor:t('breaker.evolution.recovery.wait'),c.x,c.y+c.r+17,10,c.armor>0?'#ffe4b3':'#aaffde','center','800');cx.restore();}
function drawCore(c){if(c.released&&premium.hazard(cx,c,game.time,camera.scale))return;if(premium.core(cx,c,game.time)){if(game.time<(c.scannedUntil||0))text(WEAPONS.scan.label+' · '+KINDS[c.kind].name,c.x,c.y-c.r-29,10,'#d8c3ff','center','850');if(c.stable)text('STABLE',c.x,c.y-c.r-15,10,'#b6ffe0','center','850');return;}const st=KINDS[c.kind],wave=.5+.5*Math.sin(game.time*4+c.id),rr=c.r;cx.save();cx.shadowBlur=c.glow>0?24:15;cx.shadowColor=st.color;circ(c.x,c.y,rr+6,'#ffffff07',st.color+'77',2);cx.shadowBlur=0;const g=cx.createRadialGradient(c.x-rr*.35,c.y-rr*.3,2,c.x,c.y,rr);g.addColorStop(0,'#f2ffff');g.addColorStop(.28,st.rim);g.addColorStop(.52,st.color);g.addColorStop(1,c.kind==='dust'?'#82522c':'#173b51');circ(c.x,c.y,rr,g,st.rim,2.4);
 cx.globalAlpha=.6;cx.save();cx.translate(c.x,c.y);cx.rotate(game.time*(c.id%2?.75:-.6));for(let i=0;i<Math.min(7,3+c.tier*2);i++){let a=i*Math.PI*2/Math.min(7,3+c.tier*2);l(Math.cos(a)*rr*.39,Math.sin(a)*rr*.39,Math.cos(a)*rr*.78,Math.sin(a)*rr*.78,'#153746a6',2);}cx.restore();cx.globalAlpha=1;
 if(c.stable){circ(c.x,c.y,rr+10,null,'#a4ffce',3);text('STABLE',c.x,c.y-rr-15,10,'#b6ffe0','center','850');}
 if(c.kind==='dust'){for(let i=0;i<5;i++){const a=i*1.25+game.time*.5;circ(c.x+Math.cos(a)*(rr+9),c.y+Math.sin(a)*(rr+8),2.5,'#ffd78b99');}}
 if(c.kind==='power'){l(c.x-7,c.y+7,c.x+3,c.y-7,'#7a45aa',3);l(c.x+3,c.y-7,c.x+8,c.y-2,'#7a45aa',3);}
 if(c.kind==='load')circ(c.x,c.y,rr*.65,null,'#ffe2ba',2);
 premium.proceduralCore(cx,c,game.time);cx.restore();}
function drawShot(s){if(premium.projectile(cx,s,game.time,beamColor))return;cx.save();if(!['pulse','net'].includes(s.kind)){const spec=WEAPONS[s.kind];cx.shadowColor=spec.color;cx.shadowBlur=quality==='low'?0:15;for(const q of s.trail){circ(q.x,q.y,3,spec.color+'88');}cx.translate(s.x,s.y);cx.rotate(Math.atan2(s.vy,s.vx));if(s.kind==='anchor'){l(-9,0,9,0,spec.color,3);l(9,0,2,-7,spec.color,2);l(9,0,2,7,spec.color,2);}else if(s.kind==='scan'){cx.strokeStyle=spec.color;cx.strokeRect(-10,-7,20,14);circ(4,0,3,spec.color);}else if(s.kind==='magnet'){cx.strokeStyle=spec.color;cx.lineWidth=4;cx.beginPath();cx.arc(0,0,8,.5,Math.PI*2-.5);cx.stroke();}else{for(let i=-1;i<=1;i++)circ(2,i*6,4,spec.color+'aa');}cx.restore();return;}for(let i=0;i<s.trail.length;i++){const p=s.trail[i],a=(i+1)/s.trail.length;cx.globalAlpha=a*.34;circ(p.x,p.y,(s.kind==='net'?10:4)*a,s.kind==='net'?'#9dfde8':'#f9de98');}cx.globalAlpha=1;cx.shadowColor=s.kind==='net'?'#70ffd1':'#ffd58f';cx.shadowBlur=20;circ(s.x,s.y,s.r+4,s.kind==='net'?'#82dabc44':'#ffc67a55',s.kind==='net'?'#b3ffe0':'#ffe3b0',2);circ(s.x,s.y,s.r*.62,s.kind==='net'?'#b3ffea':'#fff0bc');cx.restore();premium.shot(cx,s);if(s.kind==='net'){cx.strokeStyle='#c6ffee88';cx.lineWidth=2;for(let a=0;a<6;a++){let t=game.time*2+a*Math.PI/3;l(s.x+Math.cos(t)*5,s.y+Math.sin(t)*5,s.x+Math.cos(t)*(s.r-1),s.y+Math.sin(t)*(s.r-1),'#c6ffee88');}}}
let previewCache=null,previewKey='',previewAt=0;function drawPlayer(){if(game.veteran&&game.signalGuardUntil>game.time){cx.save();cx.globalAlpha=.45+.2*Math.sin(game.time*8);circ(game.player.x,game.player.y-25,36,'#6fe9d415','#a8fff0',2.5);cx.restore();}const p=game.player;if(['ready','playing','paused'].includes(game.state)&&!premium.actor&&window.SignalBreakerActors)premium.actor=window.SignalBreakerActors.createActor(characterId);cx.save();if(p.invuln>0&&Math.floor(game.time*9)%2===0)cx.globalAlpha=.6;const firing=firingPose.sample(game);const actorDrawn=!!premium.actor?.draw(cx,p,p.x,p.y+31,game.time,p.life,firing.weapon,firing.launch);if(!actorDrawn)premium.player(cx,p,firing.weapon,game.time,firing.launch);else premium.directionalMuzzle(cx,firing.launch,firing.weapon,firing.active);cx.restore();
 if(settings.aim&&(game.state==='playing'||game.state==='ready')){const key=[p.x,p.aimX,p.aimY,game.weapon,game.weaponLevel,game.weaponUpgrade,game.shieldAngle,Math.floor(game.time*15)].join(':');if(!previewCache||key!==previewKey&&(game.state!=='playing'||game.time-previewAt>=1/(quality==='high'?15:quality==='balanced'?10:6))){previewCache=game.predictShot();previewKey=key;previewAt=game.time;}const preview=previewCache;cx.save();cx.setLineDash([6,9]);cx.strokeStyle=game.weapon==='net'?'#a6ffe2b0':'#ffe0a5b0';cx.lineWidth=2;cx.beginPath();if(preview.uncertain)cx.globalAlpha=.6;preview.points.forEach((q,i)=>i?cx.lineTo(q.x,q.y):cx.moveTo(q.x,q.y));cx.stroke();cx.setLineDash([]);for(const q of preview.contacts){circ(q.x,q.y,10,'#173140','#ffe5a5',2);text('↗',q.x,q.y+5,16,'#fff0c9','center');}if(preview.target&&game.weapon==='net'){circ(preview.target.x,preview.target.y,preview.captureRadius,'#78f7c914','#a6ffe2',2);}cx.restore();drawPsiReticle(p.aimX,p.aimY);}}

function drawEffects(){if(['won','lost','intermission'].includes(game.state))return;for(const e of game.effects){const t=1-e.life/.48;cx.save();cx.globalAlpha=Math.max(0,1-t);circ(e.x,e.y,15+t*110,'#6ef6d514','#a6f9de',4-t*3);circ(e.x,e.y,9+t*64,null,'#e3fff5',1.5);cx.restore();}for(const p of game.particles){const alpha=Math.max(0,Math.min(.92,p.life/.68));cx.save();cx.globalAlpha=alpha;cx.shadowColor=p.color;cx.shadowBlur=quality==='low'?0:8;if(Math.hypot(p.vx||0,p.vy||0)>40){l(p.x,p.y,p.x-(p.vx||0)*0.022,p.y-(p.vy||0)*0.022,p.color,Math.max(1.2,p.size*0.75));}circ(p.x,p.y,p.size,p.color);cx.restore();}for(const f of game.floaters){cx.save();cx.globalAlpha=Math.min(1,f.life*2);cx.shadowColor=f.color;cx.shadowBlur=10;text(f.label,f.x,f.y+(1-f.life)*14,14,f.color,'center','900');cx.restore();}}
function drawControlSupport(){const pose=game.supportPose();supportDrawn=false;if(!pose)return;prepareControlActor();cx.save();if(pose.barrierProgress>0){cx.save();cx.beginPath();cx.rect(pose.barrierX-65,pose.barrierY-25,130*pose.barrierProgress,50);cx.clip();premium.structure(cx,0,pose.barrierX,pose.barrierY,130,50);cx.restore();}supportDrawn=!!controlActor?.draw(cx,controlEntity,pose.x,pose.y,game.time,1);if(supportDrawn){text(t('breaker.source.crew.'+pose.phase),pose.x,pose.y-108,10,pose.phase==='holding'?'#9dffe1':'#9ddfff','center','750');}cx.restore();}
function drawSource(){const source=game.source;if(!source)return;const color=source.controlled?'#9dffe1':source.requested?'#9ddfff':source.observed?'#ffe0a5':'#c5abff';cx.save();cx.setLineDash(source.observed?[6,5]:[]);if(source.observed&&!source.controlled)for(const core of game.cores)l(source.x,source.y,core.x,core.y,'#ffe0a555',1);cx.setLineDash([]);if(!premium.supplySprite(cx,'source',source.x,source.y,46)){circ(source.x,source.y,19,'#071b29e6',color,2);text(source.controlled?'✓':source.requested?'…':'Ψ',source.x,source.y+6,17,color,'center','850');}else{circ(source.x,source.y,24,null,color,1.5);}const label=t('breaker.source.marker.'+(source.verified?'verified':source.controlled?'checking':source.requested?'executing':source.observed?'revealed':'hint')),half=label.length*6+12,labelX=Math.max(camera.x+half,Math.min(camera.x+camera.width/camera.scale-half,source.x));text(label,labelX,source.y-30,11,color,'center','750');if(source.requested&&!source.controlled){cx.strokeStyle=color;cx.lineWidth=3;cx.beginPath();cx.arc(source.x,source.y,24,-Math.PI/2,-Math.PI/2+(1-source.controlRemaining/window.SignalBreakerCausal.CONTROL_SECONDS)*Math.PI*2);cx.stroke();text(source.controlRemaining.toFixed(1)+'s',source.x,source.y+43,11,color,'center','750');}if(source.controlled&&!source.verified){cx.strokeStyle=color;cx.lineWidth=3;cx.beginPath();cx.arc(source.x,source.y,24,-Math.PI/2,-Math.PI/2+Math.min(1,source.stableFor/2)*Math.PI*2);cx.stroke();}if(source.requested){const progress=source.controlled?1:1-source.controlRemaining/window.SignalBreakerCausal.CONTROL_SECONDS;cx.setLineDash(source.controlled?[]:[5,4]);l(source.x-45*progress,source.y+29,source.x+45*progress,source.y+29,color,3);cx.setLineDash([]);}cx.restore();}
function drawGrowthForecast(){for(const threat of game.predictiveThreats()){circ(threat.x,threat.y,24,null,'#c5abff',2);text(t('breaker.growth.forecast')+' '+threat.remaining.toFixed(1)+'s',threat.x,threat.y-32,10,'#ede1ff','center','750');}}
function drawPriorityLockReticle(){if(!game.priorityTargetId||game.state!=='playing')return;let target=game.cores.find(c=>c.id===game.priorityTargetId);if(!target&&game.boss){if(game.priorityTargetId==='boss'&&game.boss.phase==='exposed')target=game.boss;else target=game.boss.nodes.find(n=>n.id===game.priorityTargetId||String(n.id)===String(game.priorityTargetId));}if(!target){game.setPriorityTarget(null);return;}const tx=target.x,ty=target.y,r=Math.max(28,(target.r||20)+10);cx.save();const pulse=1+0.06*Math.sin(game.time*14),size=r*pulse;cx.strokeStyle='#ffd58f';cx.lineWidth=2.5;cx.shadowColor='#fba341';cx.shadowBlur=14;const bLen=Math.max(10,size*0.35);cx.beginPath();cx.moveTo(tx-size+bLen,ty-size);cx.lineTo(tx-size,ty-size);cx.lineTo(tx-size,ty-size+bLen);cx.moveTo(tx-size,ty+size-bLen);cx.lineTo(tx-size,ty+size);cx.lineTo(tx-size+bLen,ty+size);cx.moveTo(tx+size-bLen,ty-size);cx.lineTo(tx+size,ty-size);cx.lineTo(tx+size,ty-size+bLen);cx.moveTo(tx+size,ty+size-bLen);cx.lineTo(tx+size,ty+size);cx.lineTo(tx+size-bLen,ty+size);cx.stroke();cx.save();cx.translate(tx,ty);cx.rotate(game.time*1.8);cx.setLineDash([6,6]);cx.strokeStyle='#6eedd8';cx.lineWidth=1.5;cx.beginPath();cx.arc(0,0,size*0.82,0,Math.PI*2);cx.stroke();cx.restore();circ(tx,ty,3.5,'#fff2b8');text('PRIORITY LOCK-ON',tx,ty-size-10,11,'#ffe09d','center','900');cx.restore();}
const joyRingImg=window.PSIPresentationAssets.image('art/psi-nav-ring-v1.webp');
const joyKnobImg=window.PSIPresentationAssets.image('art/psi-shield-chip-v1.webp');
function drawFloatingJoystick(){
  if(!floatingJoy.active)return;
  const b=cv.getBoundingClientRect();
  const fx=(floatingJoy.startX-b.left)*(cv.width/b.width),fy=(floatingJoy.startY-b.top)*(cv.height/b.height);
  const cxPos=(floatingJoy.curX-b.left)*(cv.width/b.width),cyPos=(floatingJoy.curY-b.top)*(cv.height/b.height);
  const dx=cxPos-fx,dy=cyPos-fy,dist=Math.hypot(dx,dy),clamped=Math.min(52,dist),angle=Math.atan2(dy,dx);
  const kx=fx+(dist>0?Math.cos(angle)*clamped:0),ky=fy+(dist>0?Math.sin(angle)*clamped:0);
  cx.save();
  cx.setTransform(1,0,0,1,0,0);
  // Outer Base Gimbal Ring
  if(joyRingImg.complete&&joyRingImg.naturalWidth>0){
    cx.globalAlpha=0.82;
    cx.shadowColor='#4bd5e6';
    cx.shadowBlur=14;
    cx.drawImage(joyRingImg,fx-52,fy-52,104,104);
  }else{
    cx.strokeStyle='rgba(83,216,230,0.65)';
    cx.lineWidth=3;
    cx.fillStyle='rgba(11,42,54,0.55)';
    cx.beginPath();
    cx.arc(fx,fy,50,0,Math.PI*2);
    cx.fill();
    cx.stroke();
  }
  // Energy tether line
  if(dist>6){
    cx.strokeStyle='rgba(145,239,226,0.65)';
    cx.lineWidth=2.5;
    cx.beginPath();
    cx.moveTo(fx,fy);
    cx.lineTo(kx,ky);
    cx.stroke();
  }
  // Center Control Knob Chip
  if(joyKnobImg.complete&&joyKnobImg.naturalWidth>0){
    cx.globalAlpha=0.95;
    cx.shadowColor='#6ef6d5';
    cx.shadowBlur=16;
    cx.drawImage(joyKnobImg,kx-22,ky-22,44,44);
  }else{
    cx.fillStyle='rgba(145,223,193,0.9)';
    cx.strokeStyle='#ffffff';
    cx.lineWidth=2;
    cx.beginPath();
    cx.arc(kx,ky,20,0,Math.PI*2);
    cx.fill();
    cx.stroke();
  }
  cx.restore();
}
function drawCleanChainBanner(){if(cleanChainTimer<=0)return;cx.save();cx.setTransform(1,0,0,1,0,0);const w=cv.width,h=cv.height;const gridAlpha=Math.min(0.35,cleanChainTimer*0.2);cx.strokeStyle=`rgba(110,246,213,${gridAlpha})`;cx.lineWidth=1.5;const horizon=h*0.58;for(let y=horizon;y<=h;y+=20){cx.beginPath();cx.moveTo(0,y);cx.lineTo(w,y);cx.stroke();}for(let x=-w*0.5;x<=w*1.5;x+=50){cx.beginPath();cx.moveTo(w*0.5,horizon);cx.lineTo(x,h);cx.stroke();}cx.fillStyle='rgba(255,225,140,0.10)';cx.fillRect(0,0,w,h);const bw=Math.min(520,w*0.88),bh=78,bx=(w-bw)/2,by=(h-bh)/2-12;cx.fillStyle='rgba(8,28,36,0.92)';cx.strokeStyle='#6eedd8';cx.lineWidth=2;cx.shadowColor='#6eedd8';cx.shadowBlur=22;cx.beginPath();cx.roundRect(bx,by,bw,bh,12);cx.fill();cx.stroke();cx.shadowBlur=0;text('PROTOCOL SECURED // CLEAN CHAIN',w/2,by+32,Math.max(16,Math.floor(w/42)),'#fff3be','center','900');text('위험 연쇄 완전 차단 · 아레나 안전 복구 완료',w/2,by+58,12,'#a4fbe2','center','800');cx.restore();}
function drawFeverVignette(){const isBoosted=game.time<game.boostUntil,isHighChain=game.chain>=5;if(!isBoosted&&!isHighChain)return;cx.save();cx.setTransform(1,0,0,1,0,0);const w=cv.width,h=cv.height,pulse=0.5+0.5*Math.sin(game.time*16),alpha=isBoosted?(0.26+0.14*pulse):(0.13+0.07*pulse);const grad=cx.createRadialGradient(w/2,h/2,Math.min(w,h)*0.36,w/2,h/2,Math.max(w,h)*0.74);grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(1,isBoosted?`rgba(247,191,85,${alpha})`:`rgba(101,213,186,${alpha})`);cx.fillStyle=grad;cx.fillRect(0,0,w,h);if(isBoosted){cx.shadowColor='#f6be66';cx.shadowBlur=18;text('⚡ OVERDRIVE FEVER // 3-WAY SPREAD ACTIVE ⚡',w/2,38,Math.max(13,Math.floor(w/55)),'#fff2be','center','900');}cx.restore();}
function draw(){updateCamera();cx.setTransform(camera.dpr,0,0,camera.dpr,0,0);cx.fillStyle='#07121b';cx.fillRect(0,0,camera.width,camera.height);cx.save();cx.scale(camera.scale,camera.scale);cx.translate(-camera.x+screenShake.x,-camera.y+screenShake.y);background();obstacles();drawSource();drawControlSupport();drawBoss();for(const c of game.cores){drawCore(c);drawArmor(c);}for(const shot of game.shots)drawShot(shot);for(const p of game.pickups)premium.pickup(cx,p,game.time);drawPlayer();drawPriorityLockReticle();drawGrowthForecast();drawEffects();premium.effects(cx);cx.restore();drawOffscreenSignals();drawFloatingJoystick();drawCleanChainBanner();drawFeverVignette();}
function drawOffscreenSignals(){if(game.state!=='playing')return;const candidates=game.boss&&game.boss.phase==='sealed'?game.boss.nodes.filter(n=>!n.hit):game.cores;for(const side of [-1,1]){const outside=candidates.filter(n=>side<0?n.x<camera.x:n.x>camera.x+camera.width/camera.scale);if(!outside.length)continue;const x=side<0?16:camera.width-16;circ(x,camera.height*.42,13,'#09252bcc','#ffd58f',1.5);text((side<0?'‹':'›')+outside.length,x,camera.height*.42+4,11,'#ffe7b9','center','800');}}
function mousePosition(e){const b=cv.getBoundingClientRect();const transform=aimCamera||camera;return {x:(e.clientX-b.left)/transform.scale+transform.x,y:(e.clientY-b.top)/transform.scale+transform.y};}
let aimPointer=null,firePointer=null,joyPointer=null,aimPadPointer=null,aimCamera=null,manualAimUntil=0,assistAt=0,assistTarget=null;
function sourceAction(){if(!game.source||game.state!=='playing')return;if(!game.source.observed)game.observeSource();else game.controlSource('isolate');hud();}
$('sourceBtn').addEventListener('click',sourceAction);
function clearInput(){manualAimUntil=0;assistAt=0;assistTarget=null;keys.clear();touchMove=0;touchAim=0;aimPointer=null;firePointer=null;joyPointer=null;aimPadPointer=null;aimCamera=null;fireGesture=null;floatingJoy.active=false;floatingJoy.pointerId=null;touchMove=0;const knob=$('joystick').querySelector?.('span');if(knob)knob.style.transform='';document.querySelectorAll('.pressed').forEach(el=>el.classList.remove('pressed'));}
function setControlMode(value){clearInput();settings.controlMode=value;document.body.classList.toggle('linked-controls',false);document.body.classList.toggle('twin-controls',value==='twin'||value==='flow');document.body.classList.toggle('flow-controls',value==='flow');$('aimPadLabel').textContent=t(value==='flow'?'breaker.control.override.short':'breaker.mobile.aim');$('controlBtn').textContent=t('breaker.control.'+value);$('controlBtn').setAttribute('aria-pressed',String(value==='twin'));safeSave();}
$('controlBtn').addEventListener('click',()=>setControlMode(settings.controlMode==='twin'?'precision':'twin'));
setControlMode(settings.controlMode);
function assistedFire(allowSwitch=true){if(allowSwitch&&settings.smartWeapon&&game.loadout.includes('pulse')&&game.loadout.includes('net')){const target=game.cores.reduce((best,c)=>{const distance=Math.hypot(c.x-game.player.aimX,c.y-game.player.aimY);return !best||distance<best.distance?{core:c,distance}:best;},null);if(target&&target.distance<130){const desired=target.core.tier>0?'pulse':'net';if(desired!==game.weapon)setWeapon(desired);}}return game.fire();}
cv.addEventListener('pointerdown',e=>{
  if(!['playing','ready'].includes(game.state))return;
  if(hasOpenDialog()||aimPointer!==null)return;
  e.preventDefault();
  const p=mousePosition(e);
  const coreTarget=game.cores.find(c=>Math.hypot(c.x-p.x,c.y-p.y)<Math.max(42,(c.r||20)+16));
  let nodeTarget=null;
  if(!coreTarget&&game.boss){
    if(game.boss.phase==='exposed'&&Math.hypot(game.boss.x-p.x,game.boss.y-p.y)<65)nodeTarget={id:'boss',name:'보스 본체'};
    else nodeTarget=game.boss.nodes.find(n=>!n.hit&&Math.hypot(n.x-p.x,n.y-p.y)<38);
  }
  const picked=coreTarget||nodeTarget;
  if(picked){
    game.setPriorityTarget(picked.id);
    toast('우선 타겟 고정: '+(picked.kind?(KINDS[picked.kind]?.name||'신호 코어'):'취약 노드'),0.8);
    tone(620,0.07,'triangle',0.14,120);
    if(navigator.vibrate)navigator.vibrate(25);
    return;
  }
  if(game.priorityTargetId){
    game.setPriorityTarget(null);
    toast('타겟 락온 해제',0.5);
  }
  const b=cv.getBoundingClientRect();
  const relX=(e.clientX-b.left)/b.width;
  const relY=(e.clientY-b.top)/b.height;
  if(e.pointerType==='touch'&&settings.controlMode!=='precision'&&relX<0.45&&relY>0.55){
    floatingJoy.active=true;
    floatingJoy.pointerId=e.pointerId;
    floatingJoy.startX=e.clientX;
    floatingJoy.startY=e.clientY;
    floatingJoy.curX=e.clientX;
    floatingJoy.curY=e.clientY;
    touchMove=0;
    cv.setPointerCapture?.(e.pointerId);
  }else{
    aimPointer=e.pointerId;
    aimCamera={...camera};
    manualAimUntil=game.time+2.5;
    game.setAim(p.x,p.y);
    cv.setPointerCapture?.(e.pointerId);
    if(settings.holdFire&&game.state==='playing')assistedFire();
    else if(e.pointerType!=='touch'&&game.state==='playing')game.fire();
  }
});
cv.addEventListener('pointermove',e=>{
  if(floatingJoy.active&&floatingJoy.pointerId===e.pointerId){
    floatingJoy.curX=e.clientX;
    floatingJoy.curY=e.clientY;
    const dx=floatingJoy.curX-floatingJoy.startX;
    const deadzone=8,maxDist=46;
    touchMove=Math.abs(dx)<deadzone?0:Math.sign(dx)*Math.min(1,(Math.abs(dx)-deadzone)/(maxDist-deadzone));
    return;
  }
  if(aimPointer===e.pointerId||(e.pointerType!=='touch'&&settings.controlMode==='precision')){
    const p=mousePosition(e);
    manualAimUntil=game.time+2.5;
    game.setAim(p.x,p.y);
  }
});
cv.addEventListener('pointerup',e=>{
  if(floatingJoy.active&&floatingJoy.pointerId===e.pointerId){
    floatingJoy.active=false;
    floatingJoy.pointerId=null;
    touchMove=0;
  }
  if(aimPointer===e.pointerId){
    aimPointer=null;
    aimCamera=null;
    if(game.state==='playing'&&!settings.holdFire&&settings.touchRelease&&e.pointerType==='touch')game.fire();
  }
});
for(const ev of ['pointercancel','lostpointercapture'])cv.addEventListener(ev,e=>{
  if(floatingJoy.active&&floatingJoy.pointerId===e.pointerId){
    floatingJoy.active=false;
    floatingJoy.pointerId=null;
    touchMove=0;
  }
  if(aimPointer===e.pointerId){
    aimPointer=null;
    aimCamera=null;
  }
});
function hold(id,dir){const el=$(id);const release=()=>{if(touchMove===dir)touchMove=0;el.classList.remove('pressed');};el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture?.(e.pointerId);touchMove=dir;el.classList.add('pressed');tone(320,0.03,'triangle',0.04,-30);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,release);}
hold('leftBtn',-1);hold('rightBtn',1);
// Manual FIRE and AUTO are separate controls: movement, aim and manual shots never flip the AUTO setting.
$('fireBtn').addEventListener('pointerdown',e=>{e.preventDefault();if(game.state!=='playing'||firePointer!==null)return;firePointer=e.pointerId;$('fireBtn').setPointerCapture?.(e.pointerId);tone(260,0.035,'sawtooth',0.05,-60);assistedFire();});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('fireBtn').addEventListener(ev,e=>{if(e.pointerId===firePointer)firePointer=null;});
$('fireBtn').addEventListener('click',e=>{if(e.detail===0&&game.state==='playing')assistedFire();});
$('autoFireBtn').addEventListener('click',()=>{if(!['ready','playing','paused'].includes(game.state)||!(game.operation||settings.controlMode==='flow'))return;settings.autoFire=!settings.autoFire;safeSave();hud();});
const aimPad=$('aimPad');function aimFromPad(e){const b=aimPad.getBoundingClientRect(),x=(e.clientX-b.left-b.width/2)/(b.width*.36),y=(e.clientY-b.top-b.height/2)/(b.height*.36);manualAimUntil=game.time+1.5;game.setAimDirection(x,y);const marker=aimPad.querySelector?.('.aim-pad-marker');if(marker)marker.style.transform='translate('+Math.max(-1,Math.min(1,x))*b.width*.28+'px,'+Math.max(-1,Math.min(1,y))*b.height*.28+'px)';}
aimPad.addEventListener('pointerdown',e=>{if(game.state!=='playing'||aimPadPointer!==null)return;e.preventDefault();aimPadPointer=e.pointerId;aimPad.setPointerCapture?.(e.pointerId);aimFromPad(e);});aimPad.addEventListener('pointermove',e=>{if(e.pointerId===aimPadPointer){e.preventDefault();aimFromPad(e);}});for(const ev of ['pointerup','pointercancel','lostpointercapture'])aimPad.addEventListener(ev,e=>{if(e.pointerId===aimPadPointer)aimPadPointer=null;});
$('exitBtn').addEventListener('click',()=>{clearInput();if(game.state==='playing')game.pause();soundDirector.setSession(false,soundOn);safeSave();});
function syncSmartControl(){const button=$('smartBtn');button.textContent=t(settings.smartWeapon?'breaker.player.smart.on':'breaker.player.smart.off');button.setAttribute('aria-pressed',String(settings.smartWeapon));button.setAttribute('aria-label',t(settings.smartWeapon?'breaker.player.smart.label.on':'breaker.player.smart.label.off'));}
function manualWeapon(id){if(game.operation){settings.smartWeapon=false;syncSmartControl();toast(t('breaker.gameplay.smart.off'),2);safeSave();}setWeapon(id);}
$('pulseBtn').addEventListener('click',()=>{if(game.operation&&game.weapon==='pulse'){const styles=['rapid','spread','precision'];game.setPulseStyle(styles[(styles.indexOf(game.pulseStyle)+1)%3]);}manualWeapon(game.loadout[0]);});$('netBtn').addEventListener('click',()=>{if(game.operation&&game.weapon===game.loadout[1]){game.cycleSupport();}manualWeapon(game.loadout[1]);});$('shieldBtn').addEventListener('click',()=>{game.cycleShield();toast('방호판 각도 변경');});$('magnetBtn').addEventListener('click',()=>game.toggleMagnet());$('pauseBtn').addEventListener('click',pause);
$('soundBtn').addEventListener('click',()=>{soundOn=!soundOn;$('soundBtn').textContent=soundOn?'♫ ON':'♫ OFF';soundDirector.setSession(game.state==='playing',soundOn);safeSave();});
$('overlay').addEventListener('keydown',event=>{
 if(event.key!=='Tab'||$('overlay').classList.contains('hidden'))return;const inside=$('overlayInner');if(!inside.querySelectorAll)return;
 const controls=[...inside.querySelectorAll('button:not(:disabled),a[href],select,input,summary')].filter(el=>el.getClientRects().length);
 if(!controls.length)return;const first=controls[0],lastControl=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();lastControl.focus();}else if(!event.shiftKey&&document.activeElement===lastControl){event.preventDefault();first.focus();}
});
function hasOpenDialog(){return [...document.querySelectorAll('dialog')].some(dialog=>dialog.open);}
window.addEventListener('keydown',e=>{if(endingPlayer.active||!$('operationLobby').hidden||hasOpenDialog())return;if(e.target?.matches?.('select,input,textarea,button,a,summary,[role=button]')||e.repeat)return;const key=e.code;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space',bindings.fire].includes(key))e.preventDefault();keys.add(key);if(key===bindings.aimLeft||key===bindings.aimRight){manualAimUntil=game.time+1.5;const d=game.launchGeometry().direction;game.setAimElevation(Math.atan2(-d.y,Math.abs(d.x)),key===bindings.aimLeft?-1:1);}if(key==='KeyC'&&!Object.values(bindings).includes('KeyC'))sourceAction();if(key===bindings.slot1)manualWeapon(game.loadout[0]);if(key===bindings.slot2)manualWeapon(game.loadout[1]);if(key===bindings.shield)game.cycleShield();if(key===bindings.magnet)game.toggleMagnet();if(key===bindings.pause)pause();if(key===bindings.conveyor)game.cycleConveyor();if(key==='Escape'&&game.state==='playing')pause();if(key===bindings.fire||key==='KeyF'&&!Object.values(bindings).includes('KeyF')){if(game.state==='ready'){game.start();hideOverlay();}game.fire();}if(key==='KeyM')openStageSelect();if(key==='BracketLeft')navigateStage(-1);if(key==='BracketRight')navigateStage(1);if(key==='Enter'&&!Object.values(bindings).includes('Enter')&&game.state==='ready'){game.start();hideOverlay();}});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{soundDirector.suspend();clearInput();if(game.state==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){soundDirector.suspend();if(game.state==='playing')pause();}});
const endingVoice=new window.SignalBreakerEndingVoice(()=>soundDirector.ensure());
const endingSound=new window.SignalBreakerEndingSound(()=>soundDirector.ensure());
function playStageEnding(memory,replay=false,returnTo=()=>showOverlay('won')){
 if(!window.SignalBreakerEndings.valid(memory?.record))return false;
 clearInput();toastExpires=0;$('toast').classList.remove('visible');$('overlay').classList.add('hidden');
 document.body.dataset.session='ending';soundDirector.setSession(false,soundOn);
 const definition=window.SignalBreakerEndings.definition(memory.record.stageId);endingSound.start(definition,{enabled:soundOn,music:settings.music,devices:settings.devices,effects:settings.effects});
 endingVoice.start(definition,{enabled:soundOn,gain:settings.voice});
 endingPlayer.play(definition,memory.record,{reducedMotion:reduceMotion,quality,replay,
  onState:paused=>{endingSound.pause(paused);endingVoice.pause(paused);},
  onComplete:()=>{endingSound.stop();endingVoice.stop();memory.seen=true;safeSave();returnTo();if(!replay)showPendingBossLoot();(!$('operationLobby').hidden?$('viewEndingArchive'):$('overlayPrimary'))?.focus({preventScroll:true});}});
 return true;
}
function addEndingMemory(parent){
 const memory=records[recordKey()]?.endingMemory;if(!window.SignalBreakerEndings.valid(memory?.record))return;
 const card=document.createElement('div');card.className='ending-memory-card';
 const title=document.createElement('strong');title.textContent=t('breaker.ending.memory');
 const list=document.createElement('ul');for(const id of window.SignalBreakerEndings.evidenceIds(memory.record)){const li=document.createElement('li');li.textContent=t(id);list.append(li);}
 const definition=window.SignalBreakerEndings.definition(memory.record.stageId);
 const next=document.createElement('p');next.textContent=t(definition.nextLabelId)+' · '+t(definition.shots.at(-1).lineId);
 const replay=document.createElement('button');replay.id='replayEnding';replay.type='button';replay.className='iconbtn';replay.textContent=t('breaker.ending.replay');replay.addEventListener('click',()=>playStageEnding(memory,true));
 card.append(title,list,next,replay);parent.append(card);
}
function finalize(){if(game.training){if(!finishedShown&&['won','lost'].includes(game.state)){finishedShown=true;showOverlay(game.state);}return;}if(finishedShown||!['won','lost'].includes(game.state))return;finishedShown=true;if(game.state==='won')triggerBossLoot();checkpoint=null;toastExpires=0;$('toast').classList.remove('visible');if(game.state==='won'&&!lab){const prev=records[recordKey()]||{};const index=CHAPTER.findIndex(c=>c.id===game.config.id),reward=window.SignalBreakerChapter.chapterReward(game.config.id,!!prev.won,game.bestChain,lab);credits+=reward;game.lastReward=reward;game.lastRewardDetails=window.SignalBreakerChapter.chapterRewardDetails(game.config.id,!!prev.won,game.bestChain,lab);records[recordKey()]={...prev,...(game.veteran?{episode:2,stageNumber:window.SignalBreakerEpisodeTwo.stage(game.config.id).number,signalChain:prev.signalChain===true||game.episodeSignal.complete}:{}),won:true,credit:Math.max(prev.credit||0,reward),mastery:journey.mastery(game,prev.mastery),best:Math.max(game.score,prev.best||0),bestChain:Math.max(game.bestChain,prev.bestChain||0),bestTime:prev.bestTime>0?Math.min(prev.bestTime,game.time):game.time,...(game.continuous?{bestContinuous:Math.max(game.score,prev.bestContinuous||0),lastContinuous:{seed:game.seed,cycle:game.storyCycle,rank:game.burstRank(),points:game.runPoints,waves:game.waveHistory.map(v=>({...v}))}}:game.burstMode?{bestCascade:Math.max(game.score,prev.bestCascade||0),bestCascadeTime:prev.bestCascadeTime>0?Math.min(prev.bestCascadeTime,game.time):game.time,lastCascade:{rules:'hazard-cascade-v1',seed:game.seed,rank:game.burstRank(),combo:game.burstCombo(),points:game.runPoints,pickups:game.pickupCount,releases:game.hazardReleases,resolves:game.hazardResolves,tunings:[...game.tunings],waves:game.waveHistory.map(v=>({...v}))}}:game.premiumRun?{bestPremium:Math.max(game.score,prev.bestPremium||0),bestPremiumTime:prev.bestPremiumTime>0?Math.min(prev.bestPremiumTime,game.time):game.time,lastPremium:{controlMode:settings.controlMode,seed:game.seed,tunings:[...game.tunings],reflectedHits:game.reflectedHits,stableCaptures:game.stableCaptures,waves:game.waveHistory.map(v=>({...v}))}}:game.extended?{bestFlow:Math.max(game.score,prev.bestFlow||0),bestFlowTime:prev.bestFlowTime>0?Math.min(prev.bestFlowTime,game.time):game.time}:{})};const endingRecord=window.SignalBreakerEndings.record(game,runSerial);if(endingRecord)records[recordKey()].endingMemory={record:endingRecord,seen:prev.endingMemory?.seen===true};completionSaved=safeSave();updateStageList();}const memory=records[recordKey()]?.endingMemory;if(game.state==='won'&&completionSaved&&memory&&playStageEnding(memory))return;showOverlay(game.state);showPendingBossLoot();if(game.state==='lost')safeSave();}
function tick(now){let delta=last?Math.min(.05,(now-last)/1000):0;last=now;frame++;if(hasOpenDialog()){delta=0;clearInput();}if(hitStop>0){hitStop-=delta;delta=0;}if(reduceMotion){screenShake.x=0;screenShake.y=0;screenShake.mag=0;}if(screenShake.mag>0.08){screenShake.mag*=0.86;screenShake.x=(Math.random()-.5)*screenShake.mag;screenShake.y=(Math.random()-.5)*screenShake.mag;}else{screenShake.x=0;screenShake.y=0;screenShake.mag=0;}if(cleanChainTimer>0)cleanChainTimer=Math.max(0,cleanChainTimer-delta);premium.update(['paused','ready'].includes(game.state)?0:delta);if(game.state==='playing'&&!hasOpenDialog()){const d=(keys.has(bindings.left)||keys.has('ArrowLeft')&&!Object.values(bindings).includes('ArrowLeft')?-1:0)+(keys.has(bindings.right)||keys.has('ArrowRight')&&!Object.values(bindings).includes('ArrowRight')?1:0);game.move(touchMove||d,delta,false,settings.controlMode!=='precision');const elevation=(keys.has(bindings.aimDown)?1:0)-(keys.has(bindings.aimUp)?1:0);if(elevation){manualAimUntil=game.time+1.5;game.adjustAimElevation(elevation,delta);}game.update(delta);if(game.flowCheckpoint&&!game.training){checkpoint=game.flowCheckpoint;game.flowCheckpoint=null;safeSave();}if(settings.controlMode==='flow'&&game.state==='playing'){const direct=aimPadPointer!==null||aimPointer!==null||game.time<manualAimUntil;if(!direct&&game.time>=assistAt){assistTarget=game.assistAim(settings.smartWeapon);assistAt=game.time+.12;setWeapon(game.weapon);}if(settings.autoFire&&(game.operation||direct||assistTarget?.aligned))game.fire();}if(game.operation&&settings.controlMode!=='flow'&&settings.autoFire&&game.state==='playing')game.fire();if((settings.holdFire&&aimPointer!==null)||firePointer!==null||keys.has(bindings.fire))assistedFire();}sounds();endingPlayer.update(delta);if(endingPlayer.active){endingVoice.update(endingPlayer.elapsed,endingPlayer.lastShot);endingSound.update(endingPlayer.elapsed,endingPlayer.lastShot,endingVoice.active);}else{if(endingSound.running)endingSound.stop();if(endingVoice.enabled)endingVoice.stop();}if(game.state==='intermission'&&shownDraftWave!==game.wave){shownDraftWave=game.wave;showTuning();}if(game.state==='won'||game.state==='lost')finalize();if(now>toastExpires)$('toast').classList.remove('visible');const radio=$('radioLine');if(radio)radio.hidden=!game.continuous||game.time>=radioUntil||!['playing','paused'].includes(game.state);if(!endingPlayer.active){draw();drawRadar();}if(preparationOpen&&preparePreview?.isConnected&&!$('overlay').classList.contains('hidden')&&premium.actor?.status().ready){const paint=preparePreview.getContext('2d');paint.setTransform(2,0,0,2,0,0);paint.clearRect(0,0,350,180);paint.save();paint.translate(150-game.player.x*1.4,172-(game.player.y+31)*1.4);paint.scale(1.4,1.4);premium.actor.draw(paint,game.player,game.player.x,game.player.y+31,game.time,game.player.life,game.weapon,game.launchGeometry());paint.restore();}if(frame%4===0)hud();requestAnimationFrame(tick);}

function updateQuality(){renderSurface();premium.setQuality(quality);premium.setReducedMotion(reduceMotion);$('qualityBtn').textContent=t('breaker.quality.'+quality);$('motionBtn').textContent=t(reduceMotion?'breaker.motion.low':'breaker.motion.full');try{localStorage.setItem(QUALITY_KEY,JSON.stringify({quality,reduceMotion}));}catch{}}
$('qualityBtn').addEventListener('click',()=>{quality=quality==='high'?'balanced':quality==='balanced'?'low':'high';updateQuality();toast(t('breaker.quality.'+quality));});
$('motionBtn').addEventListener('click',()=>{reduceMotion=!reduceMotion;updateQuality();toast(reduceMotion?'화면 흔들림 감소':'화면 흔들림 사용');});
async function toggleFocus(){try{if(document.fullscreenElement)await document.exitFullscreen();else await $('shell').requestFullscreen();}catch{toast('현재 브라우저에서는 화면 확장이 제한됩니다');}}
$('focusBtn').addEventListener('click',toggleFocus);
$('conveyorBtn').addEventListener('click',()=>game.cycleConveyor());
function selectMode(value,practice=false){veteranMode=false;mode=value;lab=practice;keys.clear();touchMove=0;setupStage(value==='chapter'?'CH-01':'SB-01');document.body.classList.add('breaker-focus');}
$('boostBtn').addEventListener('click',()=>{if(game.activateBoost())hud();});
$('chapterBtn').addEventListener('click',()=>selectMode('chapter'));$('trialBtn').addEventListener('click',()=>selectMode('trial'));$('labBtn').addEventListener('click',()=>selectMode('chapter',true));

const radar=$('radar'),rc=radar.getContext('2d');
function drawRadar(){rc.clearRect(0,0,220,124);rc.fillStyle='#071b29dd';rc.fillRect(0,0,220,124);if(worldTexture){rc.globalAlpha=.7;paintWorldOverview(rc,220,124);rc.globalAlpha=1;}rc.strokeStyle='#91cab699';rc.strokeRect(Math.max(0,camera.x)/W*220,0,Math.min(W,camera.width/camera.scale)/W*220,124);for(const r of game.rail){const v=game.railSegment(r);rc.beginPath();rc.moveTo(v.ax/W*220,v.ay/H*124);rc.lineTo(v.bx/W*220,v.by/H*124);rc.stroke();}if(game.source){rc.fillStyle=game.source.controlled?'#9dffe1':'#ffe0a5';rc.fillRect(game.source.x/W*220-4,game.source.y/H*124-4,8,8);}const gate=game.config.gate;rc.fillStyle='#99ffcb';rc.fillRect(gate.x/W*220-2,gate.y/H*124-7,4,14);if(game.boss){for(const n of game.boss.nodes){rc.fillStyle=n.hit?'#89ffd0':'#ffb475';rc.fillRect(n.x/W*220-3,n.y/H*124-3,6,6);}}for(const c of game.cores){rc.fillStyle=KINDS[c.kind].color;rc.beginPath();rc.arc(c.x/W*220,c.y/H*124,Math.max(2,c.r/8),0,Math.PI*2);rc.fill();}rc.fillStyle='#fff0ba';rc.fillRect(game.player.x/W*220-2,game.player.y/H*124-3,4,6);}
radar.addEventListener('pointerdown',e=>{e.preventDefault();if(game.state!=='playing'&&!overviewPaused)return;const b=radar.getBoundingClientRect();game.setAim((e.clientX-b.left)/b.width*W,(e.clientY-b.top)/b.height*H);});
const joystick=$('joystick');joystick.addEventListener('pointerdown',e=>{if(game.state!=='playing'||joyPointer!==null)return;e.preventDefault();joyPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);});joystick.addEventListener('pointermove',e=>{if(joyPointer!==e.pointerId)return;const b=joystick.getBoundingClientRect();const raw=(e.clientX-b.left-b.width/2)/(b.width*.35);touchMove=Math.abs(raw)<.16?0:Math.sign(raw)*Math.min(1,(Math.abs(raw)-.16)/.84);touchAim=0;const knob=joystick.querySelector?.('span');if(knob)knob.style.transform='translate('+touchMove*b.width*.25+'px,'+touchAim*b.height*.25+'px)';if(Math.abs(touchAim)<.18)touchAim=0;});for(const ev of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(ev,()=>{joyPointer=null;touchMove=0;touchAim=0;const knob=joystick.querySelector?.('span');if(knob)knob.style.transform='';});
$('smartBtn').addEventListener('click',()=>{settings.smartWeapon=!settings.smartWeapon;syncSmartControl();assistAt=game.time;toast(t(settings.smartWeapon?'breaker.player.smart.restored':'breaker.gameplay.smart.off'),2);safeSave();});
syncSmartControl();
$('settingsBtn').addEventListener('click',()=>{if(!['playing','paused','ready'].includes(game.state)){toast(t('breaker.ui.settings.after'));return;}preparationOpen=true;if(game.state==='playing')pause();else showOverlay(game.state);});
$('viewBtn').textContent=t('breaker.session.overview');
$('viewBtn').addEventListener('click',()=>{clearInput();closeView=!closeView;if(closeView){overviewPaused=game.state==='playing';if(overviewPaused)game.pause();}else if(overviewPaused){game.pause();overviewPaused=false;}document.body.classList.toggle('overview-open',closeView);$('viewBtn').textContent=t(closeView?'breaker.session.return':'breaker.session.overview');$('viewBtn').setAttribute('aria-pressed',String(closeView));});
document.body.classList.add('breaker-focus');
updateQuality();

let shopCategory='hud',workshopWasPlaying=false,reticleImage=null,reticleSize=31,beamColor=null;
function applyWorkshop(){const hud=window.SignalBreakerWorkshop.selected(workshop,'hud');document.body.dataset.psiHud=hud.value;document.body.style.setProperty('--psi-frame',`url("${new URL(hud.image,document.baseURI).href}")`);const reticle=window.SignalBreakerWorkshop.selected(workshop,'reticle');reticleImage=window.PSIPresentationAssets.image(reticle.image);reticleSize=reticle.value==='beacon'?25:31;beamColor=window.SignalBreakerWorkshop.selected(workshop,'beam').color;}
function drawPsiReticle(x,y){if(!reticleImage?.complete||!reticleImage.naturalWidth)return;const size=reticleSize;cx.save();cx.globalAlpha=.9;cx.drawImage(reticleImage,x-size/2,y-size/2,size,size);cx.restore();}
function renderWorkshop(){const api=window.SignalBreakerWorkshop;$('shopBalance').textContent=t('breaker.shop.balance')+' '+credits.toLocaleString()+' CP';const current=api.find('module-'+game.psiModule),planned=api.selected(workshop,'module');$('shopModuleStatus').textContent=(game.veteran&&game.state!=='ready'?t('breaker.shop.module.current')+' · '+t('breaker.shop.'+current.id+'.name')+' / '+t('breaker.shop.module.next'):t('breaker.shop.module.prepare'))+' · '+t('breaker.shop.'+planned.id+'.name');const tabs=$('shopTabs');tabs.replaceChildren();for(const category of ['hud','reticle','beam','module']){const button=document.createElement('button');button.type='button';button.dataset.shopCategory=category;button.textContent=t('breaker.shop.category.'+category);button.setAttribute('aria-pressed',String(shopCategory===category));button.addEventListener('click',()=>{shopCategory=category;renderWorkshop();$('shopScroll').scrollTop=0;});tabs.append(button);}const items=$('shopItems');items.replaceChildren();for(const item of api.CATALOG.filter(x=>x.category===shopCategory)){const card=document.createElement('article');card.dataset.shopItem=item.id;const img=document.createElement('img');img.src=item.image;img.alt='';const title=document.createElement('h3'),desc=document.createElement('p');title.textContent=t('breaker.shop.'+item.id+'.name');desc.textContent=t('breaker.shop.'+item.id+'.desc');const button=document.createElement('button'),owned=workshop.owned.includes(item.id),selected=workshop.selected[item.category]===item.id,locked=item.episode2&&!records['CH-05']?.won;button.type='button';button.dataset.shopAction=item.id;button.disabled=locked||selected||!owned&&credits<item.price;button.textContent=locked?t('breaker.shop.locked'):selected?t('breaker.shop.selected'):owned?t('breaker.shop.equip'):t('breaker.shop.buy')+' · '+item.price+' CP';button.addEventListener('click',()=>{const old=workshop,oldCredits=credits;let next;if(owned)next=api.equip(workshop,item.id,records['CH-05']?.won===true);else{const result=api.purchase(workshop,credits,item.id,records['CH-05']?.won===true);if(!result.ok){$('shopNotice').textContent=t('breaker.shop.error.'+result.error);return;}next=result.state;credits=result.credits;}if(!next)return;workshop=next;if(!safeSave()){workshop=old;credits=oldCredits;$('shopNotice').textContent=t('breaker.shop.error.storage');renderWorkshop();return;}if(item.category==='module'&&game.veteran&&game.state==='ready'){game.configurePsiModule(item.value);showOverlay('ready');}applyWorkshop();$('shopNotice').textContent=t(item.category==='module'&&game.state!=='ready'?'breaker.shop.next':'breaker.shop.applied');renderWorkshop();});card.append(img,title,desc,button);items.append(card);}$('shopNotice').textContent=$('shopNotice').textContent||t('breaker.shop.next');}
function openWorkshop(){if(endingPlayer.active)return;workshopWasPlaying=game.state==='playing';if(workshopWasPlaying)pause();renderWorkshop();$('workshopDialog').showModal();$('shopScroll').scrollTop=0;}
function closeWorkshop(){if($('workshopDialog').open)$('workshopDialog').close();if(workshopWasPlaying&&game.state==='paused'){game.pause();hideOverlay();}workshopWasPlaying=false;}
$('openWorkshop').addEventListener('click',openWorkshop);$('customizeBtn').addEventListener('click',openWorkshop);$('closeWorkshop').addEventListener('click',closeWorkshop);$('workshopDialog').addEventListener('cancel',event=>{event.preventDefault();closeWorkshop();});applyWorkshop();
let talentActiveTab='talents',talentDialogWasPlaying=false;
function renderTalentTech(){
  const TM=window.SignalBreakerTalentTech;if(!TM)return;
  const mgr=talentManager();
  $('tabTalents').classList.toggle('active',talentActiveTab==='talents');
  $('tabWeapons').classList.toggle('active',talentActiveTab==='weapons');$('tabTalents').setAttribute('aria-pressed',String(talentActiveTab==='talents'));$('tabWeapons').setAttribute('aria-pressed',String(talentActiveTab==='weapons'));
  const container=$('talentTabContent');
  container.replaceChildren();
  if(talentActiveTab==='talents'){
    const header=document.createElement('div');
    header.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#0d2936;border-radius:10px;margin-bottom:12px;';
    header.innerHTML=`<div><strong style="color:#ffd58f;font-size:14px;">보유 전문화 포인트: ${mgr.getAvailablePoints()} P</strong><small style="display:block;color:#92b4be;font-size:11px;">웨이브 완료·교본·보스 보상으로 획득 (획득 ${mgr.points}P · 투자 ${mgr.spentPoints}/31P, 다음 단계는 선행 특성 완료 후 개방)</small></div>`;
    const resetBtn=document.createElement('button');
    resetBtn.type='button';resetBtn.className='iconbtn';resetBtn.style.cssText='font-size:11px;padding:6px 12px;border-color:#ff7979;color:#ffb2b2;';
    resetBtn.textContent='↺ 특성 초기화';
    resetBtn.addEventListener('click',()=>{mgr.resetTalents();renderTalentTech();toast('전문화 특성이 초기화되었습니다',0.8);});
    header.append(resetBtn);
    container.append(header);
    const treesGrid=document.createElement('div');
    treesGrid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:12px;';
    for(const tree of Object.values(TM.TALENT_TREES)){
      const col=document.createElement('div');
      col.style.cssText=`background:#0b212dbd;border:1px solid ${tree.color}44;border-radius:12px;padding:12px;`;
      col.innerHTML=`<h3 style="margin:0 0 6px;color:${tree.color};font-size:13px;">${tree.name}</h3><p style="margin:0 0 10px;font-size:10px;color:#89a8b2;line-height:1.4;">${tree.desc}</p>`;
      const tierList=document.createElement('div');
      tierList.style.cssText='display:flex;flex-direction:column;gap:8px;';
      for(const tier of tree.tiers){
        const activeEffect=TM.ACTIVE_TALENT_EFFECTS[tier.id];
        const rank=mgr.talents[tier.id]||0;
        const item=document.createElement('div');item.className='talent-row';item.tabIndex=-1;item.setAttribute('role','group');item.setAttribute('aria-label',tier.name);
        item.style.cssText=`background:#102c3a;border:1px solid ${rank>0?tree.color:'#304d5b'};border-radius:8px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;`;
        item.innerHTML=`<div style="flex:1;min-width:0;padding-right:8px;"><div style="display:flex;align-items:center;gap:6px;"><strong style="font-size:11px;color:${rank>0?'#fff':'#bad2db'}">${tier.name}</strong><span style="font-size:10px;color:${tree.color};font-weight:800;">[${rank}/${tier.maxRank}]</span></div><small style="font-size:9px;color:#84a3ad;display:block;margin-top:2px;line-height:1.3;">${activeEffect}</small></div>`;
        const investBtn=document.createElement('button');
        investBtn.type='button';investBtn.dataset.talent=tier.id;investBtn.className='iconbtn';investBtn.style.cssText=`font-size:11px;min-width:32px;height:32px;padding:2px;border-color:${rank<tier.maxRank&&mgr.getAvailablePoints()>0?tree.color:'#476572'};`;
        investBtn.textContent=activeEffect?'+':'준비 중';
        investBtn.disabled=!mgr.canInvest(tier.id);investBtn.setAttribute('aria-label',t('breaker.ui.invest').replace('{name}',tier.name).replace('{rank}',String(rank)).replace('{max}',String(tier.maxRank)));if(investBtn.disabled){const reason=rank>=tier.maxRank?'breaker.ui.max':mgr.getAvailablePoints()<=0?'breaker.ui.points':'breaker.ui.predecessor';investBtn.title=t(reason);const note=document.createElement('small');note.className='talent-lock-reason';note.textContent=t(reason);item.append(note);}
        investBtn.addEventListener('click',e=>{e.stopPropagation();if(mgr.investTalent(tier.id)){tone(520,0.06,'triangle',0.12,80);renderTalentTech();const next=container.querySelector('[data-talent="'+tier.id+'"]');(next?.disabled?next.closest('.talent-row'):next)?.focus?.({preventScroll:true});}});
        item.append(investBtn);
        tierList.append(item);
      }
      col.append(tierList);
      treesGrid.append(col);
    }
    container.append(treesGrid);
  }else{
    const weapGrid=document.createElement('div');
    weapGrid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;';
    const offsets={pulse:'0% 0%',net:'50% 0%',magnet:'100% 0%',mist:'0% 100%',anchor:'50% 100%',scan:'100% 100%'};
    for(const [wKey,wDef] of Object.entries(TM.WEAPON_TECHS)){
      const curLvl=mgr.weaponLevels[wKey]||1;
      const curTierInfo=wDef.tiers[curLvl-1]||wDef.tiers[0];
      const artPos=offsets[wKey]||'0% 0%';
      const col=document.createElement('div');
      col.style.cssText='background:#0b212dbd;border:1px solid #436979;border-radius:12px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;';
      col.innerHTML=`<div><div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;"><div style="width:64px;height:64px;background:url('art/breaker-six-tools-ui-v4.webp') ${artPos} / 300% 200% no-repeat;border:1px solid #487b8f;border-radius:8px;background-color:#0d232e;flex-shrink:0;box-shadow:inset 0 0 10px #000;"></div><div style="flex:1;min-width:0;"><div style="display:flex;justify-content:space-between;align-items:center;"><strong style="color:#ffd58f;font-size:13px;">${wDef.name}</strong><span style="font-size:11px;color:#91dfc1;font-weight:700;">Tier ${curLvl} / 4</span></div><small style="color:#8cb4be;font-size:10px;display:block;margin-top:2px;">산업 안전 장비 · T${curLvl} 규격</small></div></div><div style="background:#102c3a;border-radius:8px;padding:8px 10px;margin-bottom:10px;border-left:3px solid #65d5ba;"><strong style="font-size:11px;color:#fff;">${curTierInfo.name}</strong><p style="margin:4px 0 0;font-size:10px;color:#89a8b2;line-height:1.3;">${curTierInfo.desc}</p></div></div>`;
      const socketBox=document.createElement('div');
      socketBox.style.cssText='margin-top:6px;';
      socketBox.innerHTML='<span style="font-size:10px;color:#8aa6b1;display:block;margin-bottom:4px;">소켓 슬롯 (3개)</span>';
      const slotRow=document.createElement('div');
      slotRow.style.cssText='display:flex;gap:6px;margin-bottom:8px;';
      const curSockets=mgr.weaponSockets[wKey]||[null,null,null];
      for(let sIdx=0;sIdx<3;sIdx++){
        const gemId=curSockets[sIdx];
        const gem=TM.SOCKET_GEMS.find(g=>g.id===gemId);
        const slotBtn=document.createElement('button');
        slotBtn.type='button';slotBtn.className='iconbtn';
        slotBtn.style.cssText=`flex:1;min-height:36px;padding:4px;font-size:9px;border-color:${gem?gem.color:'#3c5765'};background:${gem?'#183a48':'#0b1c25'};color:${gem?gem.color:'#7997a3'};`;
        slotBtn.disabled=!gem&&TM.SOCKET_GEMS.filter(g=>mgr.canSocket(wKey,g.id)).every(g=>mgr.availableGems(g.id)===0);
        slotBtn.title=TM.SOCKET_GEMS.filter(g=>mgr.canSocket(wKey,g.id)).map(g=>g.name+' · 잔여 '+mgr.availableGems(g.id)).join(' / ');
        slotBtn.innerHTML=gem?`◆ ${gem.name.split(' ')[0]}<br><small style="color:#d2e8ed">${gem.bonus}</small>`:`[슬롯 ${sIdx+1}]<br><small>비어있음</small>`;
        slotBtn.addEventListener('click',()=>{
          const choices=[null,...TM.SOCKET_GEMS.filter(g=>mgr.canSocket(wKey,g.id)&&(mgr.availableGems(g.id)>0||g.id===gemId)).map(g=>g.id)];
          const nextGem=choices[(choices.indexOf(gemId)+1)%choices.length];
          mgr.socketGem(wKey,sIdx,nextGem);
          game.applyTalentStats(mgr.getStats());
          tone(480,0.05,'triangle',0.1,60);
          renderTalentTech();
        });
        slotRow.append(slotBtn);
      }
      socketBox.append(slotRow);
      col.append(socketBox);
      const upBtn=document.createElement('button');
      upBtn.type='button';upBtn.className='primary-btn';
      upBtn.style.cssText='width:100%;min-height:34px;padding:6px;font-size:11px;margin-top:4px;';
      upBtn.textContent=curLvl<4?`Tier ${curLvl+1} 진화 개조 (+)`:'★ 궁극 진화 완료';
      upBtn.disabled=curLvl>=4||mgr.parts<1;
      if(curLvl<4)upBtn.textContent=`Tier ${curLvl+1} 개조 · 부품 1개 (보유 ${mgr.parts})`;
      upBtn.addEventListener('click',()=>{
        if(mgr.upgradeWeapon(wKey)){
          game.applyTalentStats(mgr.getStats());
          tone(580,0.08,'triangle',0.14,100);
          renderTalentTech();
          toast(`${wDef.name} Tier ${mgr.weaponLevels[wKey]} 진화 완료!`,1.0);
        }
      });
      col.append(upBtn);
      weapGrid.append(col);
    }
    container.append(weapGrid);
  }
  const health=document.createElement('p');health.className='growth-save-status';health.setAttribute('role','status');health.textContent=t(mgr.lastSaveSucceeded===false?'breaker.journey.unsaved':'breaker.journey.saved');container.append(health);
 if(mgr.lastSaveSucceeded===false){const retry=document.createElement('button');retry.type='button';retry.className='secondary-btn';retry.textContent=t('breaker.journey.retrySave');retry.addEventListener('click',()=>{mgr.save();renderTalentTech();});container.append(retry);}
 game?.applyTalentStats?.(mgr.getStats());
}
let pendingBossLoot=null;
function triggerBossLoot(){
 if(game.training||lab||!game.operation||game.state!=='won'||game.boss?.phase!=='resolved')return;const mgr=window.SignalBreakerTalentTech?.manager;if(!mgr)return;
 const reward=mgr.grantBossReward(game.config.id,(game.veteran?'EP02:':'EP01:')+game.config.id+':'+game.seed);if(!reward)return;
 game.lastBossReward=reward;pendingBossLoot={run:game,reward};game.applyTalentStats(mgr.getStats());
}
function showPendingBossLoot(){
 if(!pendingBossLoot||pendingBossLoot.run!==game||endingPlayer.active||game.training||game.state!=='won'||hasOpenDialog())return;
 const {reward}=pendingBossLoot;pendingBossLoot=null;const items=$('lootItems');items.replaceChildren();const TM=window.SignalBreakerTalentTech;
 for(const id of [reward.gemId,reward.commonGemId].filter(Boolean)){const gem=TM.SOCKET_GEMS.find(g=>g.id===id),card=document.createElement('article');card.className='loot-card rare';const heading=document.createElement('h4'),detail=document.createElement('p');heading.textContent=gem.name;detail.textContent=gem.bonus;card.append(heading,detail);items.append(card);}
 const part=document.createElement('p');part.textContent=reward.partName+' · '+t('breaker.journey.reward');items.append(part);$('lootBossTitle').textContent=game.config.id;$('bossLootDialog').showModal();
}
$('closeBossLoot')?.addEventListener('click', () => { $('bossLootDialog')?.close(); });
$('lootContinueBtn')?.addEventListener('click', () => { $('bossLootDialog')?.close();$('overlayPrimary')?.focus(); });
$('lootOpenTechBtn')?.addEventListener('click', () => { $('bossLootDialog')?.close(); openTalentTech(); });
$('bossLootDialog')?.addEventListener('cancel', event => { event.preventDefault(); $('bossLootDialog')?.close(); });

function openTalentTech(){if(endingPlayer.active)return;talentDialogWasPlaying=game.state==='playing';if(talentDialogWasPlaying)pause();renderTalentTech();$('talentTechDialog').showModal();}
function closeTalentTech(){if($('talentTechDialog').open)$('talentTechDialog').close();if(talentDialogWasPlaying&&game.state==='paused'){game.pause();hideOverlay();}talentDialogWasPlaying=false;}
$('talentBtn')?.addEventListener('click',openTalentTech);
$('closeTalentTech')?.addEventListener('click',closeTalentTech);
$('tabTalents')?.addEventListener('click',()=>{talentActiveTab='talents';renderTalentTech();});
$('tabWeapons')?.addEventListener('click',()=>{talentActiveTab='weapons';renderTalentTech();});
$('talentTechDialog')?.addEventListener('cancel',event=>{event.preventDefault();closeTalentTech();});

// Stage Select Dialog Handlers & Navigation
let stageSelectTab = 'ep1';
function openStageSelect(){
  if(endingPlayer.active) return;
  stageSelectTab = game.veteran ? 'ep2' : 'ep1';
  $('stageTabEp1')?.classList.toggle('active', stageSelectTab==='ep1');
  $('stageTabEp2')?.classList.toggle('active', stageSelectTab==='ep2');
  clearInput();
  renderStageSelect();
  $('stageSelectDialog')?.showModal();
}
function navigateStage(delta){
  const list = veteranMode ? window.SignalBreakerEpisodeTwo.STAGES : CHAPTER;
  const curIdx = list.findIndex(s => s.id === game.config.id);
  const nextIdx = (curIdx + delta + list.length) % list.length;
  const target = list[nextIdx];
  if(!freeUnlockAll && lobbyLocked(target.id)){
    toast(`[🔒 잠김] ${target.name} - 이전 구역 클리어 필요`, 1.5);
    return;
  }
  setupStage(target.id, false);
  toast(`[작전 전환] ${target.id} · ${target.name}`, 1.5);
}
function renderStageSelect(){
  const grid = $('stageCardsGrid');
  if(!grid) return;
  grid.innerHTML = '';
  const isEp2 = stageSelectTab === 'ep2';$('stageTabEp1').setAttribute('aria-pressed',String(!isEp2));$('stageTabEp2').setAttribute('aria-pressed',String(isEp2));
  const list = isEp2 ? window.SignalBreakerEpisodeTwo.STAGES : CHAPTER;
  list.forEach((st, idx) => {
    const isCurrent = game.config.id === st.id && (isEp2 === !!game.veteran);
    const locked = !freeUnlockAll && (isEp2 ? !records?.['CH-05']?.won || (idx > 0 && !records?.['V-' + list[idx-1].id]?.won) : (idx > 0 && !records?.[list[idx-1].id]?.won));
    const done = records[(isEp2 ? 'V-' : '') + st.id]?.won;
    const card = document.createElement('div');
    card.className = `stage-card-item${isCurrent ? ' current' : ''}`;
    const code = isEp2?'EP02-'+String(st.number).padStart(2,'0'):st.id;const stageName=isEp2?t(st.nameId):st.name,stageSummary=isEp2?t(st.hookId):st.summary;const chapter=CHAPTER.find(c=>c.id===st.id);
    const hazardLabels = { metal: '철골/강재 (자력)', dust: '분진 연무 (미스트)', power: '전력 (미스트·스캔)', load: '하중·장력 (앵커)' };
    const primaryHazard=st.hazardOrder?.[0]||chapter?.cores?.[0]?.kind||'metal';
    card.innerHTML = `
      <div class="stage-card-header">
        <span class="stage-card-code">${code}</span>
        <span class="stage-card-status ${locked ? 'locked' : ''}">${isCurrent ? '★ 현재 작전' : done ? '✓ 개입 완료' : locked ? '🔒 잠김' : '● 개입 가능'}</span>
      </div>
      <div class="stage-card-body">
        <h3>${stageName}</h3>
        <p>${stageSummary}</p>
      </div>
      <div class="stage-card-meta">
        <span>위험: ${hazardLabels[primaryHazard] || primaryHazard}</span>
        <span>${isEp2 ? '고난도 베테랑' : '표준 건설 아레나'}</span>
      </div>
      <button type="button" class="stage-card-enter-btn" ${locked ? 'disabled' : ''}>
        ${isCurrent?t('breaker.ui.stage.current'):locked?t('breaker.unlock.previous'):t('breaker.ui.stage.prepare')}
      </button>
    `;
    const enterBtn = card.querySelector('.stage-card-enter-btn');
    if(enterBtn && !locked){
      enterBtn.addEventListener('click', () => {
        veteranMode = isEp2;
        $('stageSelectDialog')?.close();
        setupStage(st.id, false);
        toast(t('breaker.ui.stage.move').replace('{code}',code).replace('{name}',stageName),1.6);
      });
    }
    grid.append(card);
  });
}
$('stageSelectBtn')?.addEventListener('click', openStageSelect);
$('hudStageBlock')?.addEventListener('click', openStageSelect);
$('hudStageBlock')?.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openStageSelect(); } });
$('overlayStageBtn')?.addEventListener('click', openStageSelect);
$('closeStageSelect')?.addEventListener('click', () => { $('stageSelectDialog')?.close(); });
$('stageSelectDialog')?.addEventListener('cancel', e => { e.preventDefault(); $('stageSelectDialog')?.close(); });
$('stageTabEp1')?.addEventListener('click', () => {
  stageSelectTab = 'ep1';
  $('stageTabEp1')?.classList.add('active');
  $('stageTabEp2')?.classList.remove('active');
  renderStageSelect();
});
$('stageTabEp2')?.addEventListener('click', () => {
  stageSelectTab = 'ep2';
  $('stageTabEp2')?.classList.add('active');
  $('stageTabEp1')?.classList.remove('active');
  renderStageSelect();
});
$('freeUnlockToggle')?.addEventListener('click', () => {
  freeUnlockAll = !freeUnlockAll;
  const btn = $('freeUnlockToggle');
  if(btn){
    btn.textContent = freeUnlockAll ? '🔓 전 스테이지 자유 개방: ON' : '🔓 전 스테이지 자유 개방: OFF';
    btn.classList.toggle('active', freeUnlockAll);
  }
  toast(freeUnlockAll ? '★ 모든 스테이지 자유 접근 해금 완료!' : '표준 순차 잠금 규칙 복원', 1.4);
  renderStageSelect();
});

// Guide Modal Handlers
if(window.SignalBreakerTalentTech?.manager.guideRewardClaimed){$('completeGuideBtn').disabled=true;$('completeGuideBtn').textContent='교본 숙지 완료 · 보상 수령됨';}
$('guideBtn')?.addEventListener('click', () => { $('guideDialog')?.showModal(); });
$('closeGuide')?.addEventListener('click', () => { $('guideDialog')?.close(); });
$('completeGuideBtn')?.addEventListener('click', () => {
  if (window.SignalBreakerTalentTech) {
    window.SignalBreakerTalentTech.manager.claimGuideReward();
    game?.applyTalentStats?.(talentManager().getStats());
  }
  $('completeGuideBtn').disabled=true;
  $('completeGuideBtn').textContent='교본 숙지 완료 · 보상 수령됨';
  toast('★ 교본 숙지 완료 · 보상은 최초 1회 지급됩니다.', 2.0);
  tone(523, 0.35, 'triangle', 0.2, 1046);
  $('guideDialog')?.close();$('lobbyGuide').textContent=t('breaker.journey.guide.review');if(game.state==='ready'&&$('operationLobby').hidden)showOverlay('ready');
});
$('guideDialog')?.addEventListener('cancel', e => { e.preventDefault(); $('guideDialog')?.close(); });

// Sandbox Simulator Handlers
$('sandboxToggleBtn')?.addEventListener('click', () => { $('sandboxDialog')?.showModal(); });
$('closeSandbox')?.addEventListener('click', () => { $('sandboxDialog')?.close(); });
$('sandboxDialog')?.addEventListener('cancel', e => { e.preventDefault(); $('sandboxDialog')?.close(); });

function spawnSandboxCores(kind, count=5){
  if(!game) return;
  enterTraining();
  const spawned=game.spawnTrainingCores(kind,count);
  toast(`[SANDBOX] ${kind.toUpperCase()} 신호체 ${spawned}기 생성 완료`, 1.2);
  tone(440, 0.08, 'triangle', 0.1, 120);
}
$('spawnMetalBtn')?.addEventListener('click', () => spawnSandboxCores('metal', 5));
$('spawnDustBtn')?.addEventListener('click', () => spawnSandboxCores('dust', 5));
$('spawnPowerBtn')?.addEventListener('click', () => spawnSandboxCores('power', 5));
$('spawnLoadBtn')?.addEventListener('click', () => spawnSandboxCores('load', 5));
$('clearCoresBtn')?.addEventListener('click', () => {
  if(!game) return;
  enterTraining();
  game.clearTrainingCores();
  toast('[SANDBOX] 아레나 코어 전체 청소 완료', 1.0);
});

function spawnSandboxBoss(stageKey){
  if(!game) return;
  lab=false;mode='chapter';operationFlow=true;
  setupStage(stageKey, false);
  enterTraining();
  game.applyTalentStats(talentManager().getStats());
  game.spawnTrainingBoss();
  hideOverlay();
  $('sandboxDialog')?.close();
  toast(`[SANDBOX] ${stageKey} 보스 설비 긴급 개입 개시!`, 1.8);
}
$('spawnBoss1')?.addEventListener('click', () => spawnSandboxBoss('CH-01'));
$('spawnBoss2')?.addEventListener('click', () => spawnSandboxBoss('CH-02'));
$('spawnBoss3')?.addEventListener('click', () => spawnSandboxBoss('CH-03'));
$('spawnBoss4')?.addEventListener('click', () => spawnSandboxBoss('CH-04'));
$('spawnBoss5')?.addEventListener('click', () => spawnSandboxBoss('CH-05'));
$('triggerStaggerBtn')?.addEventListener('click', () => {
  if(!game || !game.boss) { toast('현재 보스가 존재하지 않습니다.', 1.0); return; }
  enterTraining();
  game.exposeTrainingBoss();
  toast('★ 보스 차폐막 강제 해제 · 코어 그로기 노출!', 1.6);
  tone(660, 0.3, 'sawtooth', 0.15, 220);
});

$('forceFeverBtn')?.addEventListener('click', () => {
  if(!game) return;
  enterTraining();
  game.forceTrainingFever();
  toast('⚡ [SANDBOX] 오버드라이브 피버 10초 강제 발동! ⚡', 1.8);
  tone(880, 0.25, 'sawtooth', 0.15, 440);
});
$('toggleGodBtn')?.addEventListener('click', () => {
  enterTraining();
  game.toggleTrainingImmunity();
  $('toggleGodBtn').setAttribute('aria-pressed',String(game.godMode));
  toast(game.godMode ? '🛡️ [SANDBOX] 무적 모드 ON' : '🛡️ [SANDBOX] 무적 모드 OFF', 1.4);
});
$('addTalentPointsBtn')?.addEventListener('click', () => {
  if(window.SignalBreakerTalentTech){
    enterTraining();
    talentManager().addPoints(5);
    game?.applyTalentStats?.(talentManager().getStats());
    toast('[SANDBOX] 전문화 특성 +5P 추가 완료', 1.2);
  }
});
$('maxWeaponsBtn')?.addEventListener('click', () => {
  if(window.SignalBreakerTalentTech){
    enterTraining();
    const mgr = talentManager();
    for(const k of Object.keys(mgr.weaponLevels)){ mgr.weaponLevels[k] = 4; }
    mgr.save();
    game?.applyTalentStats?.(mgr.getStats());
    toast('★ [SANDBOX] 6대 무기 전체 Tier 4 진화 완료!', 1.4);
  }
});

$('mobileHelp').textContent=t('breaker.mobile.twin');setupStage('CH-01',false,resumeCandidate?.seed??null);requestAnimationFrame(tick);
const initialRoute=journey.progress(records).next;let lobbyStage=initialRoute?.id||'CH-01';veteranMode=initialRoute?.veteran||false;
function renderLobby(){
 const operations=window.SignalBreakerOperations||[],selected=operations.find(v=>v.id===lobbyStage)||operations[0];if(!selected)return;
 const index=CHAPTER.findIndex(v=>v.id===selected.id),locked=lobbyLocked(selected.id),ep=window.SignalBreakerEpisodeTwo.stage(selected.id),lobby=$('operationLobby');lobby.dataset.episode=veteranMode?'2':'1';lobby.style.setProperty('--operation-accent',selected.accent);$('operationImage').src=selected.image;
 const stageDisplayName=veteranMode?String(ep.number).padStart(2,'0')+' · '+t(ep.nameId):selected.id+' · '+CHAPTER[index].name;
 $('operationName').textContent=stageDisplayName;
 for(const [id,ending] of [['operationTag','tag'],['operationHook','hook'],['operationSignature','signature'],['operationGoal','goal']])$(id).textContent=veteranMode?(id==='operationTag'?t('breaker.ep02.name'):id==='operationHook'?t(ep.hookId):t(ep.goalId)):t(selected.textId+'.'+ending);
 $('episodeOne').setAttribute('aria-pressed',String(!veteranMode));$('veteranTour').setAttribute('aria-pressed',String(veteranMode));$('veteranTour').disabled=false;$('veteranTour').textContent=t('breaker.ep02.name');
 $('lobbyGuide').textContent=t(window.SignalBreakerTalentTech?.manager.guideRewardClaimed?'breaker.journey.guide.review':'breaker.journey.guide');const campaign=journey.progress(records);$('journeyCount').textContent=t('breaker.journey.progress').replace('{n}',String(campaign.completed))+(campaign.next?'':' · '+t('breaker.journey.complete'));const nextButton=$('continueCampaign');nextButton.hidden=!campaign.next;nextButton.textContent=t('breaker.journey.continue')+(campaign.next?' · '+(campaign.next.veteran?'EP02 ':'EP01 ')+campaign.next.id:'');
 $('episodeStatus').textContent=t(veteranMode?'breaker.ep02.summary':'breaker.ep01.summary');$('operationAccess').textContent=locked?t('breaker.ep02.locked').replace('{n}',veteranMode?(index===0?5:ep.number-1):index):t('breaker.lobby.available');$('startOperation').disabled=locked;
 const heroBtn=$('heroStartBtn'),heroText=$('heroStartBtnText'),unlockBtn=$('lobbyFreeUnlockBtn');
 if(heroBtn&&heroText){heroText.textContent=locked?`🔒 [${stageDisplayName}] 해제 필요`:`⚡ [${stageDisplayName}] 출발 준비 ↗`;heroBtn.disabled=locked;heroBtn.onclick=()=>{if(lobbyLocked(lobbyStage))return;resumeCandidate=null;mode='chapter';lab=false;closeLobby();setupStage(lobbyStage,false);};}
 if(unlockBtn){unlockBtn.textContent=freeUnlockAll?'🔓 전 스테이지 자유 개방: ON':'🔓 전 스테이지 자유 개방: OFF';unlockBtn.style.background=freeUnlockAll?'#00e5ff':'#0d2838';unlockBtn.style.color=freeUnlockAll?'#02181f':'#b2ebf2';unlockBtn.onclick=()=>{freeUnlockAll=!freeUnlockAll;const modalBtn=$('freeUnlockToggle');if(modalBtn){modalBtn.textContent=freeUnlockAll?'🔓 전 스테이지 자유 개방: ON':'🔓 전 스테이지 자유 개방: OFF';modalBtn.style.background=freeUnlockAll?'#00e5ff':'#0d2838';modalBtn.style.color=freeUnlockAll?'#02181f':'#b2ebf2';}renderLobby();toast(freeUnlockAll?'🔓 10개 전 스테이지 자유 개방 활성화!':'🔒 정규 스테이지 순차 진행 모드',1.5);};}
 const stages=$('operationStages');stages.replaceChildren();for(const op of operations){const ep=window.SignalBreakerEpisodeTwo.stage(op.id),locked=lobbyLocked(op.id),button=document.createElement('button');button.type='button';button.dataset.lobbyStage=op.id;button.dataset.locked=String(locked);button.className='operation-stage'+(op.id===selected.id?' selected':'');button.setAttribute('aria-pressed',String(op.id===selected.id));const image=document.createElement('img');image.src=op.image;image.alt='';const label=document.createElement('strong');label.textContent=(veteranMode?String(ep.number).padStart(2,'0')+' / '+t(ep.nameId):op.id+' / '+CHAPTER.find(c=>c.id===op.id).name);const detail=document.createElement('span');detail.textContent=locked?t('breaker.ep02.card.locked'):records[lobbyKey(op.id)]?.won?t('breaker.ep02.card.complete')+' · '+t('breaker.journey.mastery').replace('{n}',String(Object.values(records[lobbyKey(op.id)].mastery||{}).filter(v=>v===true).length)):veteranMode?t(ep.goalId):t(op.textId+'.signature');const badge=document.createElement('div');badge.className='stage-badge-action';badge.textContent=locked?'🔒 잠김':(op.id===selected.id?'⚡ 연결 ↗':'선택');button.append(image,label,detail,badge);button.addEventListener('click',()=>{if(lobbyStage===op.id&&!locked){resumeCandidate=null;mode='chapter';lab=false;closeLobby();setupStage(lobbyStage,false);return;}lobbyStage=op.id;renderLobby();});stages.append(button);}
 $('viewEndingArchive').hidden=!window.SignalBreakerEndings.valid(records[lobbyKey(lobbyStage)]?.endingMemory?.record);const resume=$('resumeRun');resume.hidden=!resumeCandidate&&game.state!=='paused';resume.textContent=resumeCandidate?t('breaker.lobby.resume')+' · '+(resumeCandidate.veteran?'EP02-'+window.SignalBreakerEpisodeTwo.stage(resumeCandidate.config.id).number:resumeCandidate.config.id)+' / '+(resumeCandidate.wave+1):t('breaker.session.return');
}

function showLobby(){endingPlayer.cancel();clearInput();if(game.state==='playing')game.pause();soundDirector.setSession(false,soundOn);tuningDock.hidden=true;$('overlay').classList.add('hidden');$('operationLobby').hidden=false;$('shell').inert=true;document.body.dataset.session='lobby';renderLobby();}
function closeLobby(){$('operationLobby').hidden=true;$('shell').inert=false;}
$('operationLobby').hidden=true;
$('lobbyGuide').addEventListener('click',()=>$('guideDialog').showModal());
$('continueCampaign').addEventListener('click',()=>{const next=journey.progress(records).next;if(!next)return;veteranMode=next.veteran;lobbyStage=next.id;resumeCandidate=null;mode='chapter';lab=false;closeLobby();setupStage(next.id,false);});
$('episodeOne').addEventListener('click',()=>{veteranMode=false;lobbyStage='CH-01';renderLobby();});$('veteranTour').addEventListener('click',()=>{veteranMode=true;lobbyStage='CH-01';renderLobby();});
$('viewEndingArchive').addEventListener('click',()=>{const memory=records[lobbyKey(lobbyStage)]?.endingMemory;if(!window.SignalBreakerEndings.valid(memory?.record))return;closeLobby();playStageEnding(memory,true,showLobby);});
$('startOperation').addEventListener('click',()=>{if(lobbyLocked(lobbyStage))return;resumeCandidate=null;mode='chapter';lab=false;closeLobby();setupStage(lobbyStage,false);});
$('resumeRun').addEventListener('click',()=>{if(!resumeCandidate){if(game.state==='paused'){veteranMode=game.veteran;closeLobby();game.pause();hideOverlay();}return;}const recovered=resumeCandidate;veteranMode=recovered.veteran;recovered.operation=true;recovered.pulseStyle=recovered.pulseStyle||'rapid';resumeCandidate=null;mode='chapter';lab=false;closeLobby();setupStage(recovered.config.id,false,recovered.seed);game=recovered;hideOverlay();shownDraftWave=game.wave;setWeapon(game.weapon);hud();if(game.continuous&&game.autoTuning){game.chooseTuning(game.draft[0]);hideOverlay();announceStory();}else showTuning();});
async function bootLoading(){clearInput();$('brandLoading').hidden=false;$('loadingRetry').hidden=true;$('loadingStatus').textContent=t('breaker.loading.prepare');const began=performance.now();if(premium.actor?.status().failed)premium.actor=undefined;if(controlActor?.status().failed)controlActor=null;prepareControlActor();let completed=0;const urls=['art/loading-keyart-v1.webp',...['field','brass','grid'].map(n=>'art/psi-hud-'+n+'-v1.webp'),'art/psi-supply-atlas-v1.webp','art/psi-projectiles-atlas-v1.webp','art/psi-fire-ring-v1.webp','art/psi-nav-ring-v1.webp','art/psi-shield-chip-v1.webp','art/psi-rpg-world-v1.png','art/psi-rpg-base-v1.png','art/control-gimbal-v1.webp','art/core-materials-v3.png','art/industrial-devices-v2.webp','art/boss-equipment-v1.webp',...['delivery','conveyor','extraction','tension','grid'].map(identity=>'art/boss-'+identity+'-final-v2.webp'),'art/released-hazards-v1.webp','art/breaker-six-tools-ui-v4.webp',...window.SignalBreakerOperations.map(o=>o.image),innerHeight>innerWidth?'art/world-delivery-v4.webp':'art/map-delivery-v3.webp',window.SignalBreakerActors.characters.find(c=>c.id===characterId).src];if(controlActor)urls.push(window.SignalBreakerActors.characters.find(c=>c.id==='safety_monitor').src);if(resumeCandidate){const name=['delivery','conveyor','extraction','hoist','power'][CHAPTER.findIndex(c=>c.id===resumeCandidate.config.id)];urls.push(innerHeight>innerWidth?'art/world-'+name+'-v4.webp':'art/map-'+name+(name==='delivery'?'-v3.webp':'-v2.webp'));}
try{await Promise.all(urls.map(url=>new Promise((resolve,reject)=>{const im=window.PSIPresentationAssets.image(url);if(im.complete&&!im.naturalWidth)im.src=new URL(url,document.baseURI).href;const done=()=>{clearTimeout(timer);if(!im.naturalWidth){reject(new Error(url));return;}completed++;$('loadingProgress').value=Math.round(completed/urls.length*100);resolve();};const timer=setTimeout(()=>reject(new Error(url)),20000);if(im.complete)done();else{im.addEventListener('load',done,{once:true});im.addEventListener('error',()=>{clearTimeout(timer);reject(new Error(url));},{once:true});}})));await new Promise((resolve,reject)=>{const at=performance.now();function check(){const state=premium.actor?.status();if(state?.ready&&(!controlActor||controlActor.status().ready))resolve();else if(state?.failed||controlActor?.status().failed||performance.now()-at>20000)reject(new Error('actor'));else requestAnimationFrame(check);}check();});try{await window.SignalBreakerOfflinePresentation?.prepare();}catch(error){console.info('Optional offline presentation cache',error.message);}$('loadingStatus').textContent=t('breaker.loading.ready');await new Promise(resolve=>setTimeout(resolve,Math.max(0,850-(performance.now()-began))));$('brandLoading').hidden=true;showLobby();}catch{$('loadingStatus').textContent=t('breaker.loading.error');$('loadingRetry').hidden=false;}}
$('loadingRetry').addEventListener('click',bootLoading);if(new URLSearchParams(location.search).get('entry')==='prepare')$('brandLoading').hidden=true;else void bootLoading();
// Read-only local QA hook (not used for rewards or online persistence).
window.SignalBreakerQA={view:()=>({combatVfx:premium.combatVfx?.status()||null,projectiles:{ready:!!(premium.projectileAtlas?.complete&&premium.projectileAtlas.naturalWidth),source:premium.projectileAtlas?.src||null,kinds:[...(premium.projectileKinds||[])]},supplies:{ready:!!(premium.supplyAtlas?.complete&&premium.supplyAtlas.naturalWidth),source:premium.supplyAtlas?.src||null,kinds:[...(premium.supplyKinds||[])]},camera:{...camera},bossLabel:bossLabelBounds?{...bossLabelBounds}:null,plane:premium.worldBounds(game.config),assistance:assistTarget?{...assistTarget}:null,supportActor:controlActor?.status()||null,supportDrawn,hazards:{ready:!!(premium.hazardAtlas?.complete&&premium.hazardAtlas.naturalWidth),source:premium.hazardAtlas?.src||null,footprints:game.cores.filter(q=>q.released).map(q=>({kind:q.kind,r:q.r,visual:premium.hazardVisualSize(q,camera.scale),pixels:premium.hazardVisualSize(q,camera.scale)*camera.scale}))},bossArt:premium.lastBossArt&&game.boss?.identity===premium.lastBossArt.identity?{...premium.lastBossArt}:null,equipment:{ready:!!(premium.equipmentAtlas?.complete&&premium.equipmentAtlas.naturalWidth),source:premium.equipmentAtlas?.src||null},materials:{ready:!!(premium.coreAtlas?.complete&&premium.coreAtlas.naturalWidth),source:premium.coreAtlas?.src||null}}),ending:()=>({active:endingPlayer.active,elapsed:endingPlayer.elapsed,shot:endingPlayer.lastShot,paused:endingPlayer.paused}),snapshot:()=>game.snapshot(),selectStage:setupStage,continuous:enabled=>{operationFlow=false;continuousFlow=!!enabled;setupStage(game.config.id,true,game.seed);},engine:()=>game,controlMode:setControlMode,records:()=>({...records}),workshop:()=>({credits,inventory:JSON.parse(JSON.stringify(workshop)),currentModule:game.psiModule}),actor:()=>premium.actor?.status()||null};
})();

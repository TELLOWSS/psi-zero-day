import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createServer} from 'vite';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output='artifacts/operation-story';fs.mkdirSync(output,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5210,strictPort:true,hmr:false},plugins:[{
 name:'operation-story-fixture',configureServer(server){server.middlewares.use(async(req,res,next)=>{
  if(!req.url?.startsWith('/qa-story?'))return next();
  const url=new URL(req.url,'http://127.0.0.1'),id=url.searchParams.get('actor'),outcome=url.searchParams.get('outcome');
  const actors=['player','kang_taesik','yoon_sungho','lee_jaehoon','lim_junho','safety_monitor'];
  if(!actors.includes(id)||!['victory','defeat'].includes(outcome)){res.statusCode=400;res.end();return;}
  const html=`<!doctype html><html lang="ko"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><style>body{background:#122323;color:#e4f4ed;font-family:sans-serif;margin:16px}main{max-width:720px;margin:auto}</style><main id="root"></main><script type="module">
  import React from 'react';import {createRoot} from 'react-dom/client';import {SurvivorsOperationStory,SurvivorsOperationStoryResult} from '/src/ui/SurvivorsOperationStory.tsx';
  import {createInitialSurvivorsState} from '/src/engine/patrol-survivors-engine.ts';import {operationHandoff} from '/src/domain/survivors-operation-handoff.ts';
  const state=createInitialSurvivorsState('${id}',undefined,'stage_12');state.phase='${outcome}';state.terrainRecord.rubbleCleared=1;state.terrainRecord.cartStops=2;state.operationControlledZones=['qa-zone'];
  const record=operationHandoff(state);window.qaBefore=JSON.stringify(state);window.qaState=state;
  createRoot(document.getElementById('root')).render(React.createElement(React.Fragment,null,React.createElement(SurvivorsOperationStory,{characterId:state.characterId,stage:state.stage,records:[record]}),React.createElement(SurvivorsOperationStoryResult,{record,stage:state.stage})));
  </script></html>`;res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml(req.url,html));
 });}
}]});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];
try{for(const [width,height] of [[1440,900],[390,844],[844,390]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 for(const actor of ['player','kang_taesik','yoon_sungho','lee_jaehoon','lim_junho','safety_monitor'])for(const outcome of ['victory','defeat']){
  await page.goto(`http://127.0.0.1:5210/qa-story?actor=${actor}&outcome=${outcome}`);
  await page.getByRole('region',{name:'이번 작전의 내 인계'}).waitFor();
  const result=await page.evaluate(()=>({unchanged:window.qaBefore===JSON.stringify(window.qaState),overflow:document.documentElement.scrollWidth>innerWidth}));
  if(!result.unchanged||result.overflow||errors.length)throw Error(JSON.stringify({actor,outcome,result,errors}));
 }
 await page.screenshot({path:`${output}/${width}-actor-result.png`});
 await page.addInitScript(()=>localStorage.setItem('psi.survivors.stage_stars',JSON.stringify(Object.fromEntries(Array.from({length:11},(_,i)=>['stage_'+String(i+1).padStart(2,'0'),[true,true,true]])))));
 await page.goto('http://127.0.0.1:5210/',{waitUntil:'networkidle'});await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
 await page.locator('.survivors-preflight-tabs button').nth(1).click();await page.locator('#survivors-chapter-1').click();
 await page.locator('.survivors-stage-card').filter({has:page.locator('.survivors-stage-badge strong',{hasText:/^STAGE 12$/})}).click();
 await page.locator('.survivors-preflight-tabs button').nth(0).click();await page.getByRole('region',{name:'내가 맡은 한 가지'}).waitFor();
 const ready=await page.locator('.survivors-operation-story').textContent();if(!ready.includes('퇴근 전에, 이 길만은'))throw Error('Pilot ready story missing');
 await page.evaluate(async()=>{const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts'),update=SurvivorsEngine.prototype.update;SurvivorsEngine.prototype.update=function(dt,input){window.storyEngine=this;if(window.qaOutcome){this.state.phase=window.qaOutcome;window.qaOutcome=null;}return update.call(this,dt,input);};});
 await page.locator('.survivors-ready-launch .survivors-btn-primary').click();await page.waitForFunction(()=>window.storyEngine?.state.phase==='playing');
 // Respect the existing stage's earlier conversation before advancing to the wave break.
 await page.evaluate(()=>{window.storyEngine.state.gameTime=8.1;});
 const conversation=page.locator('.survivors-accountability-event');await conversation.waitFor();
 for(const button of await conversation.locator('.accountability-facts button').all())await button.click();
 await conversation.locator('[data-accountability-confirm]').click();
 for(const checkbox of await conversation.getByRole('checkbox').all())await checkbox.check();
 await conversation.getByRole('button',{name:'대체·인계 계획 확인 후 순찰 시작',exact:true}).click();
 await page.waitForFunction(()=>window.storyEngine.state.phase==='playing');
 const waves=[];
 for(const wave of [1,2]){
  await page.evaluate(wave=>{window.storyEngine.state.gameTime=wave===1?45.1:110.1;},wave);
  await page.getByRole('dialog',{name:'현장 정비 보급소'}).waitFor();await page.getByRole('region',{name:'정비 중 무전'}).waitFor();
  const radio=page.getByRole('region',{name:'정비 중 무전'});await radio.getByText('이번 순찰에서 확인된 기록',{exact:true}).click();
  if(!await radio.getByText(/통로 정리 \d+ · 돌진 제동 \d+ · 통제 구역 \d+/).count())throw Error('Safe radio facts are missing');
  await radio.getByText('이번 순찰에서 확인된 기록',{exact:true}).click();
  const before=await page.evaluate(()=>({state:JSON.stringify(window.storyEngine.state),storage:JSON.stringify(localStorage)}));
  await page.keyboard.press('Escape');await page.keyboard.press('p');await page.waitForTimeout(350);
  const held=await page.evaluate(before=>window.storyEngine.state.phase==='paused'&&JSON.stringify(window.storyEngine.state)===before.state&&JSON.stringify(localStorage)===before.storage,before);
  if(!held)throw Error('Reading radio did not preserve paused combat, rewards and storage');
  waves.push({wave,paused:true,readOnly:true});await page.screenshot({path:`${output}/${width}-wave-${wave}.png`});
  await page.getByRole('button',{name:/정비 완료 · 순찰 재개/}).click();await page.waitForFunction(()=>window.storyEngine.state.phase==='playing');
 }
 await page.evaluate(()=>{window.storyEngine.state.terrainRecord.cartStops=2;window.storyEngine.state.terrainRecord.rubbleCleared=1;window.storyEngine.state.operationControlledZones=['qa-zone'];window.qaOutcome='defeat';});
 await page.getByRole('region',{name:'이번 작전의 내 인계'}).waitFor();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.survivors.operation-handoff.v1')??'[]').find(row=>row.stageId==='stage_12'&&row.characterId==='player'));
 if(saved?.outcome!=='defeat'||saved.cartStops!==2||saved.rubbleCleared!==1)throw Error('Result record did not reflect actual engine counters');
 if(errors.length)throw Error(errors.join('\n'));
 rows.push({width,height,actorFixtureConditions:12,pilotReady:true,waves,resultStored:true,errors});await page.close();
}fs.writeFileSync(`${output}/report.json`,JSON.stringify({evidence:'36 source presentation conditions; actual game UI with QA unlocked STAGE12, advanced wave clocks and forced defeat counters. No natural outcome or attachment study claimed.',rows},null,2));console.log(JSON.stringify(rows));
}finally{await browser.close();await server.close();}

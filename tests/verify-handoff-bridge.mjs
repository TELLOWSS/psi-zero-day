import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createServer} from 'vite';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output='artifacts/handoff-bridge';fs.mkdirSync(output,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5211,strictPort:true,hmr:false},plugins:[{name:'bridge-fixture',configureServer(server){server.middlewares.use(async(req,res,next)=>{
 if(req.url!=='/qa-bridge')return next();
 const html=`<!doctype html><html lang="ko"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><style>body{margin:16px;background:#14221e;color:white;font-family:sans-serif}#root{max-width:720px;margin:auto}</style><div id="root"></div><script type="module">
 import React from 'react';import {createRoot} from 'react-dom/client';import {OperationHandoffDossier} from '/src/ui/OperationHandoffDossier.tsx';import {SurvivorsOperationStory} from '/src/ui/SurvivorsOperationStory.tsx';import {StrategyLoopPanel} from '/src/ui/StrategyLoopPanel.tsx';
 import {createInitialSurvivorsState} from '/src/engine/patrol-survivors-engine.ts';import {operationHandoff} from '/src/domain/survivors-operation-handoff.ts';import {saveOperationHandoff} from '/src/app/operation-handoff-store.ts';
 import {zeroBreachContent} from '/src/content/defense.ts';import {createDefenseRun,applyDefenseCommand,tickDefense} from '/src/engine/defense.ts';window.qaTick=state=>tickDefense(state,zeroBreachContent);
 import {EpisodeSession} from '/src/app/episode-session.ts';const session=new EpisodeSession();
 const source=createInitialSurvivorsState('player',undefined,'stage_12');source.phase='victory';source.terrain.find(t=>t.kind==='rubble').hp=0;source.terrainRecord.rubbleCleared=1;
 const record=operationHandoff(source);saveOperationHandoff(record);const next=createInitialSurvivorsState('player',undefined,'stage_13',undefined,undefined,[record]);window.qaNext=next;
 const action={event_id:'fixture',instance_id:'i',node_id:'n',choice_id:'inspect',label_text_id:'fixture.label',enabled:true,intent:'inspect',target:{kind:'anchor',anchor:'entry'},actor_character_id:'player',resource_axes:[]};
 function App(){const [state,setState]=React.useState(()=>({...createDefenseRun(zeroBreachContent,'COORDINATOR'),status:'INTERMISSION',intermissionRemaining:1}));window.qaDefense=state;
 return React.createElement(React.Fragment,null,React.createElement(SurvivorsOperationStory,{characterId:'player',stage:next.stage,records:[record]}),React.createElement(StrategyLoopPanel,{actions:[action],selectedActions:[action],focusId:'entry',focusTitle:'진입 통로',text:id=>id==='fixture.label'?'진입 통로 확인':session.t(id),personName:()=> '담당자',targetLabel:()=> '진입 통로',onAction:a=>{window.qaChoice=a.choice_id;return true}}),React.createElement(OperationHandoffDossier,{mode:'defense',defense:{content:zeroBreachContent,state,execute:command=>setState(applyDefenseCommand(state,zeroBreachContent,command)),name:id=>id,pauseReading:()=>setState(previous=>applyDefenseCommand(previous,zeroBreachContent,{type:'SetPaused',paused:true}))}}));}
 createRoot(document.getElementById('root')).render(React.createElement(App));</script></html>`;
 res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml(req.url,html));
 });}}]});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];
try{for(const [width,height] of [[1440,900],[390,844],[844,390]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5211/qa-bridge');await page.getByText(/^STAGE 12 인계 적용/).waitFor();
 for(const mode of ['story','defense'])await page.locator('[data-handoff-mode="'+mode+'"] > summary').click();
 await page.waitForFunction(()=>window.qaDefense.paused);
 if(!await page.evaluate(()=>JSON.stringify(window.qaTick(window.qaDefense))===JSON.stringify(window.qaDefense)))throw Error('Intermission advanced while reading');
 const before=await page.evaluate(()=>({resource:window.qaDefense.resource,saved:localStorage.getItem('psi.survivors.operation-handoff.v1'),hp:window.qaNext.terrain.find(t=>t.kind==='rubble').hp,credit:window.qaNext.terrainRecord.rubbleCleared}));
 await page.getByRole('button',{name:/순찰 경험으로 현장 다시 확인/}).click();
 if(await page.evaluate(()=>window.qaChoice!==undefined))throw Error('Story confirmation bypassed');
 await page.locator('.strategy-execute-button').click();await page.getByRole('button',{name:/배치 · CONTROL/}).click();
 await page.waitForFunction(()=>window.qaDefense.towers.length===1);
 const after=await page.evaluate(()=>({resource:window.qaDefense.resource,choice:window.qaChoice,saved:localStorage.getItem('psi.survivors.operation-handoff.v1'),overflow:document.documentElement.scrollWidth>innerWidth}));
 if(before.hp!==0||before.credit!==0||after.resource>=before.resource||after.choice!=='inspect'||after.saved!==before.saved||after.overflow||errors.length)throw Error(JSON.stringify({before,after,errors}));
 await page.screenshot({path:output+'/'+width+'.png',fullPage:true});
 await page.evaluate(()=>localStorage.setItem('psi.survivors.stage_stars',JSON.stringify(Object.fromEntries(Array.from({length:12},(_,i)=>['stage_'+String(i+1).padStart(2,'0'),[true,true,true]])))));
 await page.goto('http://127.0.0.1:5211/',{waitUntil:'networkidle'});await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
 await page.locator('.survivors-preflight-tabs button').nth(1).click();await page.locator('#survivors-chapter-1').click();
 await page.locator('.survivors-stage-card').filter({has:page.locator('.survivors-stage-badge strong',{hasText:/^STAGE 13$/})}).click();await page.locator('.survivors-preflight-tabs button').nth(0).click();
 await page.getByText(/^STAGE 12 인계 적용/).waitFor();
 await page.evaluate(async()=>{const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts'),update=SurvivorsEngine.prototype.update;SurvivorsEngine.prototype.update=function(dt,input){window.qaEngine=this;return update.call(this,dt,input);};});
 await page.locator('.survivors-ready-launch .survivors-btn-primary').click();await page.waitForFunction(()=>window.qaEngine?.state.phase==='playing');
 const actual=await page.evaluate(()=>({stage:window.qaEngine.state.stageId,hp:window.qaEngine.state.terrain.find(t=>t.kind==='rubble').hp,clears:window.qaEngine.state.terrainRecord.rubbleCleared,inherited:window.qaEngine.state.inheritedTerrainIds}));
 if(actual.stage!=='stage_13'||actual.hp!==0||actual.clears!==0||errors.length)throw Error(JSON.stringify({actual,errors}));
 await page.screenshot({path:output+'/'+width+'-actual-stage13.png'});rows.push({width,height,before,after,actual,errors});await page.close();
}fs.writeFileSync(output+'/report.json',JSON.stringify({scope:'Component fixture; real carry/storage and defense engine; synthetic story action callback',rows},null,2));console.log('PASS bridge 3 viewports');}
finally{await browser.close();await server.close();}

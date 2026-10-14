const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');
const a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.PSI_QA_BASE_URL||'http://127.0.0.1:4173',out=path.resolve('artifacts/worker-egress');fs.mkdirSync(out,{recursive:true});
const settled=page=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),rows=[];try{
 for(const [name,width,height] of [['portrait',390,844],['landscape',844,390],['pc',1440,900]]){
  const c=await b.newContext({viewport:{width,height},serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/');await p.locator('.is-survivors-entry').click();await p.locator('.survivors-ready-launch').waitFor({timeout:45000});
  await p.evaluate(async()=>{
   const source=await (await fetch('/src/ui/PatrolSurvivorsGame.tsx')).text(),url=source.match(/from "([^"]*patrol-survivors-engine\.ts[^"]*)"/)?.[1];if(!url)throw Error('Live engine import unavailable');
   const {SurvivorsEngine}=await import(url),original=SurvivorsEngine.prototype.update;
   window.workerUpdate=original;SurvivorsEngine.prototype.update=function(...args){window.workerEngine=this;if(!window.workerFreeze)return original.apply(this,args);};
   const paint=CanvasRenderingContext2D.prototype.fillText;window.workerLabels=new Set();CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(typeof text==='string'&&(text.includes('안전통로')||text.includes('위험 해소')))window.workerLabels.add(text);return paint.call(this,text,...args);};
  });
  await p.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();await p.waitForFunction(()=>window.workerEngine?.state.phase==='playing');
  await p.evaluate(()=>{
   window.workerFreeze=true;const g=window.workerEngine,s=g.state;s.hazards=[{id:'qa-educated',type:'UNHELMETED',x:520,y:600,hp:0,maxHp:1,speed:0,radius:10,damage:0,expValue:0}];s.projectiles=[];s.drops=[];window.workerUpdate.call(g,1/60,{moveX:0,moveY:0});
  });
  const start=await p.evaluate(()=>({...window.workerEngine.state.resolvedWorkers.find(w=>w.id==='qa-educated')}));a.equal(start.route.phase,'approach');
  await p.waitForFunction(()=>window.workerLabels.has('안전통로 합류'));await settled(p);await p.screenshot({path:path.join(out,name+'-approach.png')});
  await p.locator('.survivors-pause-command').click();const before=await p.evaluate(()=>JSON.stringify(window.workerEngine.state.resolvedWorkers));await p.evaluate(()=>window.workerUpdate.call(window.workerEngine,.2,{moveX:0,moveY:0}));a.equal(await p.evaluate(()=>JSON.stringify(window.workerEngine.state.resolvedWorkers)),before);await p.getByRole('button',{name:'순찰 재개',exact:true}).click();
  const entered=await p.evaluate(()=>{const g=window.workerEngine;for(let i=0;i<180;i++){window.workerUpdate.call(g,1/60,{moveX:0,moveY:0});const w=g.state.resolvedWorkers.find(w=>w.id==='qa-educated');if(w?.route.phase==='corridor')return {...w};}return null;});a.ok(entered);a.ok(Math.abs(entered.x-700)<100/60+.02);await p.waitForFunction(()=>window.workerLabels.has('안전통로 이동'));await settled(p);await p.screenshot({path:path.join(out,name+'-corridor.png')});
  const result=await p.evaluate(()=>{const g=window.workerEngine,trace=[];for(let i=0;i<900;i++){const w=g.state.resolvedWorkers.find(w=>w.id==='qa-educated');if(!w)break;trace.push({x:w.x,y:w.y});window.workerUpdate.call(g,1/60,{moveX:0,moveY:0});}return {trace,exists:g.state.resolvedWorkers.some(w=>w.id==='qa-educated'),labels:[...window.workerLabels]};});
  a.equal(result.exists,false);a.ok(result.trace.at(-1).y>900,'last seen at south exit, not mid-map timer');a.ok(result.trace.every(w=>Math.abs(w.x-700)<90));a.ok(result.trace.some(w=>Math.abs(w.x-700)>20),'walks around the central tripod');a.ok(result.labels.some(label=>label.includes('출구')));a.deepEqual(errors,[]);rows.push({name,width,height,start,entered,last:result.trace.at(-1),labels:result.labels,checks:['actual education-to-resolved transition','approach then corridor','tripod detour stays within corridor','pause freezes worker','only despawns at gate','world exit markings drawn'],errors});await c.close();console.log('PASS worker egress '+name);
 }
 fs.writeFileSync(path.join(out,'worker-egress.json'),JSON.stringify({base,method:'Isolated authored worker diagnostic fixture in live UI; risk already resolved to observe departure. Normal engine updates move the actor, no forced victory or player health refill. Not a human difficulty or frame-rate measurement.',rows},null,2));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

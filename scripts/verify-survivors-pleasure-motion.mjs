import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),reports=[];
fs.mkdirSync('artifacts/pleasure-feedback',{recursive:true});
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5200',{waitUntil:'networkidle'});
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
   const {PleasureFeedback}=await import('/src/ui/survivors-pleasure-feedback.ts');
   const drain=SurvivorsEngine.prototype.drainAudioEvents,observe=PleasureFeedback.prototype.observe;
   SurvivorsEngine.prototype.drainAudioEvents=function(...args){window.qaEngine=this;return drain.apply(this,args);};
   PleasureFeedback.prototype.observe=function(...args){window.qaPleasure=this;const value=observe.apply(this,args);window.qaMarks=[...(window.qaMarks??[]),...this.marks.map(m=>({...m}))].slice(-200);return value;};
  });
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();
  await page.waitForFunction(()=>window.qaEngine?.state.phase==='playing');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{
   // Explicit QA fixture: kills and collections still pass through the real engine.
   const s=window.qaEngine.state,p=s.player;s.interactiveHazards=[];p.critRate=0;
   s.hazards=[0,1].map(i=>({id:'qa-target-'+i,type:'RUNAWAY_CART',x:p.x+75+i*15,y:p.y,hp:1,maxHp:1,speed:0,radius:20,damage:0,expValue:0}));
   s.projectiles=[{id:'qa-group',kind:'radio',x:p.x+85,y:p.y,vx:0,vy:0,radius:50,damage:10,duration:1,pierce:2}];
   s.drops=[0,1,2].map(i=>({id:'qa-pickup-'+i,x:p.x,y:p.y,exp:1}));
   window.qaMarks=[];
  });
  await page.waitForFunction(()=>window.qaMarks.some(m=>m.kind==='group'&&m.count===2)&&window.qaMarks.some(m=>m.kind==='finish'));
  await page.screenshot({path:`artifacts/pleasure-feedback/${width}x${height}.png`});
  const observed=await page.evaluate(()=>({pickup:window.qaMarks.some(m=>m.kind==='pickup'),safe:window.qaMarks.some(m=>m.kind==='safe'),group:window.qaMarks.some(m=>m.kind==='group'&&m.count===2),finish:window.qaMarks.some(m=>m.kind==='finish'),bounded:window.qaPleasure.marks.length<=32}));
  await page.locator('.survivors-pause-command').click();await page.getByRole('button',{name:'순찰 재개',exact:true}).waitFor();
  const snapshot=()=>page.evaluate(()=>JSON.stringify(window.qaPleasure.marks));const paused=await snapshot();await page.waitForTimeout(180);const frozen=paused===await snapshot();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  reports.push({width,height,fixture:'Explicit two-target one-projectile and three-drop QA fixture',...observed,frozen,overflow,errors,pass:Object.values(observed).every(Boolean)&&frozen&&!overflow&&!errors.length});await page.close();
 }
 fs.writeFileSync('artifacts/pleasure-feedback/report.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));if(reports.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

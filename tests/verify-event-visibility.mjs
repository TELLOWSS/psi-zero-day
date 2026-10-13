import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/event-visibility');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const results=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390],[568,320]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5203',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
   const {signatureEventPlan}=await import('/src/engine/survivors-signature-events.ts');
   const {signatureMasteryBossFinish}=await import('/src/engine/survivors-signature-mastery.ts');
   const update=SurvivorsEngine.prototype.update;
   SurvivorsEngine.prototype.update=function(dt,input){
    window.noticeEngine=this;
    const result=update.call(this,window.noticeMode?0:dt,input);
    const s=this.state;if(!window.noticeMode)return result;
    s.signatureMastery??={chain:0,best:0,perfectEvents:[],finisherArmed:false,zeroDay:false};
    s.signatureEvent=undefined;s.signatureMastery.notice=undefined;s.directorCutinPhase='none';s.directorShoutTimer=0;s.evolutionBanner=null;s.bossName=null;s.bossAlertTimer=0;
    if(window.noticeMode==='signature'){
     const e=signatureEventPlan(s.stage)[0];s.signatureEvent={...e,phase:'warning',remaining:4,stageAccent:e.stageAccent,positions:e.spawns.map(p=>({x:p.x,y:p.y,type:p.type}))};
    }else if(window.noticeMode==='mastery'){
     s.signatureMastery=signatureMasteryBossFinish({...s.signatureMastery,chain:2,finisherArmed:true});
    }else if(window.noticeMode==='director'){
     s.directorCutinPhase='cutin';s.directorShoutTimer=1.8;
    }else if(window.noticeMode==='evolution'){
     s.evolutionBanner={title:'위성 방송 프로토콜',subtitle:'장비 진화 · 계도 전달 범위 강화',icon:'📡',timer:4};
    }
    return result;
   };
  });
  await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();
  await page.waitForFunction(()=>window.noticeEngine?.state.gameTime>.3);
  for(const [mode,selector] of [['wave','.survivors-wave-director-notice'],['signature','.survivors-signature-event'],['mastery','.survivors-mastery-notice'],['director','.survivors-director-cutin-layer'],['evolution','.survivors-evo-banner']]){
   await page.evaluate(mode=>{window.noticeMode=mode;},mode);
   await page.locator(selector).waitFor({state:'visible'});await page.waitForTimeout(250);
   const layout=await page.locator(selector).evaluate(el=>{
    const r=el.getBoundingClientRect(),style=getComputedStyle(el);
    const safe={left:innerWidth*.45,right:innerWidth*.55,top:innerHeight*.35,bottom:innerHeight*.70};
    const centerClear=r.right<=safe.left||r.left>=safe.right||r.bottom<=safe.top||r.top>=safe.bottom;
    return {x:r.x,y:r.y,width:r.width,height:r.height,centerClear,pointerEvents:style.pointerEvents,overflow:document.documentElement.scrollWidth>innerWidth};
   });
   await page.screenshot({path:path.join(out,`${width}x${height}-${mode}.png`)});
   results.push({width,height,mode,...layout,errors:[...errors],pass:layout.centerClear&&!layout.overflow&&layout.pointerEvents==='none'&&!errors.length});
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  const reduced=await page.locator('.survivors-evo-banner').evaluate(el=>getComputedStyle(el).animationName);
  results.push({width,height,mode:'reduced',pass:reduced==='none'});
  await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));if(results.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

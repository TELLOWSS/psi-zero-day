import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/survivors-playability');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[360,650],[844,390],[568,320]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true}),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.addInitScript(()=>{
   if(localStorage.getItem('qa.playability.seeded'))return;
   localStorage.setItem('qa.playability.seeded','true');
   localStorage.setItem('psi.survivors.last_played_stage','stage_28');
   localStorage.setItem('psi.survivors.unlocked_stages',JSON.stringify(['stage_01','stage_28']));
  });
  await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5197',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  const initial=await page.locator('.survivors-stage-preview').getAttribute('src');
  if(!initial.includes('28'))throw new Error('Uncleared stage not preserved');
  // Synthetic result/upgrade transitions exercise UI persistence, not natural-play victory.
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts'),update=SurvivorsEngine.prototype.update;
   const {createSignatureMasteryState,signatureMasterySuccess}=await import('/src/engine/survivors-signature-mastery.ts');
   SurvivorsEngine.prototype.update=function(...args){
    const value=update.apply(this,args);window.qaEngine=this;
    if(window.qaRequest==='notice'){window.qaRequest=null;this.state.signatureMastery=signatureMasterySuccess(createSignatureMasteryState(),'cart_convoy');}
    if(window.qaRequest==='upgrade'){window.qaRequest=null;this.addExp(this.state.nextLevelExp-this.state.currentExp);}
    if(window.qaRequest==='clear'){window.qaRequest=null;this.state.starsEarned=[true,false,false];this.state.phase='victory';}
    return value;
   };
  });
  await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();
  await page.waitForFunction(()=>window.qaEngine?.state.phase==='playing');await page.waitForTimeout(250);
  const actions=await page.locator('.survivors-tactical-actions button').evaluateAll(buttons=>buttons.map(button=>{const r=button.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,inside:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight};}));
  await page.screenshot({path:path.join(out,`${width}x${height}-actions.png`)});
  const cdp=await page.context().newCDPSession(page);
  const y=Math.floor(height*.65);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:90,y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:110,y:y-25}]});
  await page.locator('.survivors-touch-joystick').waitFor();
  const joystick=await page.locator('.survivors-touch-joystick').evaluate(node=>getComputedStyle(node).backgroundColor);
  await page.screenshot({path:path.join(out,`${width}x${height}-joystick.png`)});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.locator('.survivors-touch-joystick').waitFor({state:'hidden'});
  await page.evaluate(()=>{window.qaRequest='notice';});await page.locator('.survivors-mastery-notice').waitFor();
  const noticeLane=await page.locator('.survivors-wave-director-notice,.survivors-signature-event,.survivors-counterplay-banner,.survivors-mastery-notice,.survivors-mastery-meter').count();
  await page.waitForTimeout(250);await page.screenshot({path:path.join(out,`${width}x${height}-notice.png`)});
  await page.evaluate(()=>{window.qaRequest='upgrade';});
  await page.locator('.survivors-upgrade-dialog').waitFor();
  await page.waitForTimeout(250);
  const options=await page.locator('.survivors-perk-card').evaluateAll(buttons=>buttons.map(button=>{const r=button.getBoundingClientRect();return {height:r.height,visible:r.top>=0&&r.bottom<=innerHeight,rows:button.querySelectorAll('dt').length,nested:button.querySelectorAll('button,summary').length};}));
  await page.screenshot({path:path.join(out,`${width}x${height}-choices.png`)});
  const details=page.locator('.survivors-perk-detail').first();await details.locator('summary').click();
  const preserved=await details.locator('.survivors-upgrade-stats small').count()>0;await details.locator('summary').click();
  await page.locator('.survivors-perk-card').first().click();
  await page.waitForFunction(()=>window.qaEngine.state.phase==='playing');
  await page.evaluate(()=>{window.qaRequest='clear';});await page.locator('.survivors-result-dialog').waitFor();
  const saved=await page.evaluate(()=>localStorage.getItem('psi.survivors.last_played_stage'));
  await page.locator('.survivors-result-dialog').getByRole('button',{name:'현장 복귀',exact:true}).click();
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  const next=await page.locator('.survivors-stage-preview').getAttribute('src');
  await page.reload({waitUntil:'networkidle'});await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  const reloaded=await page.locator('.survivors-stage-preview').getAttribute('src');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const pass=actions.length===3&&actions.every(action=>action.inside&&action.width>=44&&action.height>=44)&&noticeLane===1&&options.length===3&&options.every(option=>option.visible&&option.rows<=2&&!option.nested)&&preserved&&saved==='stage_29'&&next.includes('29')&&reloaded.includes('29')&&!overflow&&!errors.length;
  rows.push({width,height,scope:'Real UI with explicitly synthetic notice/levelup/victory fixtures; not natural clear evidence.',actions,joystick,noticeLane,options,preserved,saved,next,reloaded,overflow,errors,pass});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));if(rows.some(row=>!row.pass))process.exitCode=1;
}finally{await browser.close();}

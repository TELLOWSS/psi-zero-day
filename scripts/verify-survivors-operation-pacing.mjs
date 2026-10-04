import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out='qa/operation-pacing-20261004';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const rows=[];
try {
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1440,height:900}]) {
  const page=await browser.newPage({viewport,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',msg=>{if(msg.type()==='error'&&msg.text().includes('Survivors render error'))errors.push(msg.text());});
  await page.addInitScript(()=>localStorage.setItem('psi.survivors.unlocked_stages',JSON.stringify(Array.from({length:20},(_,i)=>`stage_${String(i+1).padStart(2,'0')}`))));
  for(const stage of ['01','02','03','20']) {
   await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
   await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
   if(stage!=='01'){
    await page.locator('.survivors-stage-select-section > summary').click();
    await page.locator('.survivors-stage-card').filter({hasText:`STAGE ${stage}`}).click();
   }
   await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
   await page.keyboard.down('d');await page.waitForTimeout(2600);await page.keyboard.up('d');
   await page.screenshot({path:`${out}/${viewport.width}x${viewport.height}-stage${stage}.png`});
   const objective=await page.locator('.survivors-live-objective').innerText();
   const hud=await page.locator('.survivors-hud-top').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight;});
   await page.keyboard.press('p');const pause=await page.getByRole('button',{name:'순찰 재개',exact:true}).isVisible();
   await page.getByRole('button',{name:'순찰 재개',exact:true}).click();
   rows.push({viewport,stage,objective,hud,pause,errors:[...errors],pass:hud&&pause&&errors.length===0});
  }
  await page.close();
 }
 fs.writeFileSync(`${out}/report.json`,JSON.stringify({scope:'CHROMIUM_REAL_EARLY_GAMEPLAY_SAVED_UNLOCK_FIXTURE_NOT_ANDROID_FPS',rows,pass:rows.every(r=>r.pass)},null,2));
 console.log(JSON.stringify(rows));if(rows.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const url=process.env.PSI_PREVIEW_URL;if(!url)throw new Error('Set the intended PSI_PREVIEW_URL.');
const out=path.resolve('artifacts/survivors-ready-release');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  // Isolated legacy completed-save fixture. Gameplay and exit use actual deployed UI.
  await page.addInitScript(()=>{
   if(localStorage.getItem('qa.ready.seeded'))return;
   localStorage.setItem('qa.ready.seeded','true');localStorage.setItem('psi.survivors.last_played_stage','stage_28');
   localStorage.setItem('psi.survivors.unlocked_stages',JSON.stringify(['stage_01','stage_28']));
   localStorage.setItem('psi.survivors.stage_stars',JSON.stringify({stage_28:[true,false,false]}));
  });
  await page.goto(url,{waitUntil:'networkidle'});
  const enter=()=>page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();await enter();
  const preview=()=>page.locator('.survivors-stage-preview').getAttribute('src');const ready=await preview();
  if(!ready.includes('29'))throw new Error('Completed save did not prepare stage29: '+ready);
  await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();await page.locator('.survivors-tactical-actions button').first().waitFor();
  await page.waitForTimeout(700);
  const controls=await page.locator('.survivors-tactical-actions button').evaluateAll(buttons=>buttons.map(button=>{const r=button.getBoundingClientRect(),minimum=matchMedia('(pointer:coarse)').matches||innerWidth<=900?44:38;return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&r.width>=minimum&&r.height>=minimum;}));
  await page.screenshot({path:path.join(out,`${width}x${height}-play.png`)});
  await page.locator('.survivors-pause-command').click();await page.getByRole('button',{name:'메인으로 나가기',exact:true}).click();
  await enter();const returned=await preview();await page.reload({waitUntil:'networkidle'});await enter();const reloaded=await preview();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const pass=controls.length===3&&controls.every(Boolean)&&returned===ready&&reloaded===ready&&!overflow&&!errors.length;
  rows.push({width,height,scope:'Legacy completed-save fixture; genuine deployed start/exit/reentry/reload.',ready,returned,reloaded,controls,overflow,errors,pass});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({url,rows},null,2));console.log(JSON.stringify({url,rows}));if(rows.some(row=>!row.pass))process.exitCode=1;
}finally{await browser.close();}

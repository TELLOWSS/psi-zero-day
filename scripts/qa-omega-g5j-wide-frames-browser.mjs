import {chromium} from 'playwright-core';import {writeFile,mkdir} from 'node:fs/promises';import {resolve} from 'node:path';
const dir=process.env.OMEGA_G5J_ASSET_DIR;if(!dir)throw Error('Set OMEGA_G5J_ASSET_DIR to the local unapproved candidate folder');
const out=resolve(process.env.OMEGA_G5J_OUTPUT_DIR||'qa-omega-g5j');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true});const files=['fire','dash','hit'].flatMap(a=>[0,1,2,3].map(i=>`${dir}/aira-east-${a}-${i}.webp`)).concat(`${dir}/g5j-anchors.json`),rows=[];
for(const [name,width,height] of [['desktop',1440,900],['tablet',1024,768],['portrait',390,844],['landscape',844,390]]){
 const row={name};
 for(const action of ['fire','dash','hit']){
  const mode=action==='fire'?'combatGun':'combatHit',page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  try{await page.goto(`http://127.0.0.1:4173/?omegaLab=1&omegaM12G5i=1&omegaQaState=${mode}`);await page.locator('#omega-g5i-wide-files').waitFor();await page.locator('#omega-g5i-wide-files').setInputFiles(files);await page.locator('[data-omega-g5i-feedback="ready"]').waitFor();await page.locator('[data-omega-g5i-toggle]').click();await page.keyboard.down('ArrowRight');await page.waitForTimeout(150);if(action==='dash')await page.keyboard.press('Shift');await page.keyboard.up('ArrowRight');
   try{await page.waitForFunction(a=>{const e=document.querySelector('.omega-protocol-arena');const f=JSON.parse(e?.getAttribute('data-omega-g5i-live-action-frames')||'{}');return (f[a]||[]).length===4},action,{timeout:action==='hit'?20000:8000,polling:'raf'});}catch{}
   row[action]=await page.evaluate(()=>{const e=document.querySelector('.omega-protocol-arena');return {frames:JSON.parse(e?.getAttribute('data-omega-g5i-live-action-frames')||'{}'),counts:JSON.parse(e?.getAttribute('data-omega-g5i-live-action-counts')||'{}'),hp:e?.getAttribute('data-omega-g5h-player-hp'),hits:e?.getAttribute('data-omega-g5h-zombie-hits'),damage:e?.getAttribute('data-omega-g5h-zombie-damage'),gunHits:e?.getAttribute('data-omega-qa-gun-hits')}});row[action].errors=errors;await page.screenshot({path:`${out}/isolated-${action}-${name}.png`});await page.locator('[data-omega-g5i-toggle]').click();row[action].restored=(await page.locator('[data-omega-g5i-toggle]').innerText()).includes('실전');
  }catch(e){row[action]={error:String(e),errors};}await page.close();
 }
 rows.push(row);console.log(JSON.stringify(row));
 for(const action of ['fire','dash','hit']){const r=row[action];if(r.error||r.errors?.length||!r.restored||JSON.stringify(r.frames?.[action])!=='[0,1,2,3]')process.exitCode=1;}
 if(Number(row.fire?.gunHits||0)<1||Number(row.hit?.hits||0)<1||Number(row.hit?.damage||0)<1||Number(row.hit?.hp||100)>=100)process.exitCode=1;
}
await writeFile(`${out}/isolated-frame-audit.json`,JSON.stringify(rows,null,2));await browser.close();

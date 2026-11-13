import {chromium} from 'playwright-core';import {resolve} from 'node:path';import {mkdir,writeFile} from 'node:fs/promises';
const dir=process.env.OMEGA_INFECTED_ASSET_DIR;if(!dir)throw Error('Set OMEGA_INFECTED_ASSET_DIR');const out=resolve(process.env.OMEGA_INFECTED_OUTPUT_DIR||'qa-omega-infected');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const rows=[];
const files=['basic','runner','armored','elite'].flatMap(k=>[0,1,2,3].map(i=>`${dir}/${k}-${i}.webp`)).concat(`${dir}/infected-anchors.json`);
for(const [name,w,h] of [['desktop',1440,900],['tablet',1024,768],['portrait',390,844],['landscape',844,390]]){
 const page=await browser.newPage({viewport:{width:w,height:h}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));let row={name};
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaInfectedArtLab=1&omegaQaState=zombieAI');await page.locator('#omega-infected-files').waitFor({timeout:30000});await page.getByRole('button',{name:'일시정지'}).click();
  await page.screenshot({path:`${out}/original-${name}.png`});await page.locator('#omega-infected-files').setInputFiles(files);await page.locator('[data-omega-infected-feedback="ready"]').waitFor({timeout:30000});await page.locator('[data-omega-infected-toggle]').click();await page.getByRole('button',{name:'계속하기'}).click();
  // Real user movement opens space for the fast enemy to pursue before warning.
  await page.keyboard.down('ArrowLeft');await page.waitForTimeout(1100);await page.keyboard.up('ArrowLeft');
  try{await page.waitForFunction(()=>{const a=document.querySelector('.omega-protocol-arena');const e=JSON.parse(a?.getAttribute('data-omega-infected-evidence')||'{}');return ['drifter','sprinter','armored','stalker'].every(k=>(e.poses?.[k]||[]).includes(3)&&(e.poses?.[k]||[]).some(x=>x===1||x===2));},null,{timeout:30000});}catch{}
  row=await page.evaluate(()=>{const a=document.querySelector('.omega-protocol-arena');return {evidence:JSON.parse(a?.getAttribute('data-omega-infected-evidence')||'{}'),telemetry:JSON.parse(a?.getAttribute('data-omega-zombie-telemetry')||'[]'),hp:a?.getAttribute('data-omega-zombie-player-hp')}});row.name=name;row.errors=errors;
  await page.screenshot({path:`${out}/candidate-${name}.png`});await page.locator('[data-omega-infected-toggle]').click();row.restored=(await page.locator('[data-omega-infected-toggle]').innerText()).includes('비교');
  const evidenceNow=()=>page.evaluate(async()=>JSON.stringify((await import('/src/ui/omega-infected-candidate-review.ts')).omegaInfectedCandidateReview.evidence()));const afterOff=await evidenceNow();await page.waitForTimeout(400);const afterWait=await evidenceNow();row.countsFrozen=afterOff===afterWait;await page.screenshot({path:`${out}/restored-${name}.png`});
 }catch(e){row={name,error:String(e),errors}}rows.push(row);console.log(JSON.stringify(row));
 if(row.error||row.errors?.length||!row.restored||!row.countsFrozen||!['drifter','sprinter','armored','stalker'].every(k=>{const poses=row.evidence?.poses?.[k]||[];const t=row.telemetry?.find(x=>x.kind===k);return poses.includes(3)&&poses.some(x=>x===1||x===2)&&t?.warnings>0;})||typeof row.hp!=='string'||!Number.isFinite(Number(row.hp))||Number(row.hp)<=0||Number(row.hp)>=800)process.exitCode=1;
 await page.close();
}
await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(rows,null,2));

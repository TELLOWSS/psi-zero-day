import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const output=resolve(process.env.OMEGA_SURFACE_QA_DIR||'qa-omega-surface');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const rows=[];
for(const [name,width,height] of [['desktop',1440,900],['tablet',1024,768],['portrait',390,844],['landscape',844,390]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[],assetStatuses=[],horizonStatuses=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.url().includes('concrete-surface-review.webp'))assetStatuses.push(r.status());});
 page.on('response',r=>{if(r.url().includes('construction-horizon-review.webp'))horizonStatuses.push(r.status());});
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaSurfaceReview=1&omegaQaState=zombieAI');
  await page.waitForFunction(()=>{
   const a=document.querySelector('.omega-protocol-arena');
   const z=JSON.parse(a?.getAttribute('data-omega-zombie-telemetry')||'[]');
   return z.length===4&&z.some(e=>e.warnings>0);
  },null,{timeout:30000});
  await page.screenshot({path:`${output}/${name}.png`});
  const telemetry=await page.locator('.omega-protocol-arena').getAttribute('data-omega-zombie-telemetry');
  rows.push({name,assetStatuses,horizonStatuses,errors,telemetry:JSON.parse(telemetry||'[]')});
  if(!assetStatuses.includes(200)||!horizonStatuses.includes(200)||errors.length)process.exitCode=1;
 }catch(error){rows.push({name,error:String(error),errors,assetStatuses});process.exitCode=1;}
 await page.close();
}
const normal=await browser.newPage();let normalRequests=0;
normal.on('request',r=>{if(/(?:concrete-surface|construction-horizon)-review\.webp/.test(r.url()))normalRequests++;});
await normal.goto('http://127.0.0.1:4173/?omegaLab=1&omegaQaState=zombieAI');
await normal.waitForTimeout(1000);await normal.close();
if(normalRequests!==0)process.exitCode=1;
await browser.close();
await writeFile(`${output}/report.json`,JSON.stringify({rows,normalRequests},null,2));
console.log(JSON.stringify({rows,normalRequests}));

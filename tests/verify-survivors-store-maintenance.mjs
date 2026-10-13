import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const copy=JSON.parse(fs.readFileSync('content/localization/survivors-store-ko.json','utf8'));
const url=process.env.PSI_PREVIEW_URL;if(!url)throw Error('Set PSI_PREVIEW_URL');
fs.mkdirSync('artifacts/store-maintenance',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390],[1024,768]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.addInitScript(()=>{if(!localStorage.getItem('qa.store.fixture')){localStorage.setItem('qa.store.fixture','1');localStorage.setItem('psi.survivors.store_wallet',JSON.stringify({credits:2000,inventory:{owned:['voice_lens','shock_mantle'],equipped:['shock_mantle'],durability:{voice_lens:0,shock_mantle:15}}}));}});
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url,{waitUntil:'networkidle'});
  const open=async()=>{await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();await page.getByRole('button',{name:copy.shopEntry,exact:true}).click();};
  await open();
  const wallet=page.locator('.survivors-toolbar-wallet');if(!(await wallet.textContent()).includes('2,000 PSI'))throw Error('Balance missing');
  await page.screenshot({path:`artifacts/store-maintenance/${width}x${height}-browse.png`});
  const sticky=await page.evaluate(()=>{const modal=document.querySelector('.survivors-equipment-workspace');modal.scrollTop=modal.scrollHeight;return new Promise(resolve=>requestAnimationFrame(()=>{const bar=document.querySelector('.survivors-toolbar-wallet').getBoundingClientRect(),bounds=modal.getBoundingClientRect();resolve(bar.top>=bounds.top&&bar.bottom<=bounds.bottom);}));});
  await page.getByRole('tab',{name:/^정비/}).click();
  const resetScroll=await page.locator('.survivors-equipment-workspace').evaluate(element=>element.scrollTop===0);
  const maintenance=page.locator('#store-panel-maintenance');
  if(!(await maintenance.textContent()).includes(copy.broken)||!(await maintenance.textContent()).includes(copy.nextClearBreak))throw Error('Missing condition warning');
  await page.screenshot({path:`artifacts/store-maintenance/${width}x${height}-maintenance.png`});
  await maintenance.getByRole('button',{name:'지향성 계도 렌즈 수리',exact:true}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('psi.survivors.store_wallet')).inventory.durability.voice_lens===100);
  if(!(await wallet.textContent()).includes('1,840 PSI'))throw Error('Single repair balance wrong');
  await maintenance.getByRole('button',{name:copy.repairAll,exact:true}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('psi.survivors.store_wallet')).inventory.durability.shock_mantle===100);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.survivors.store_wallet')));
  if(saved.credits!==956||saved.inventory.equipped.includes('voice_lens'))throw Error('Repair quote or ownership transition wrong');
  await page.reload({waitUntil:'networkidle'});await open();
  const restored=(await wallet.textContent()).includes('956 PSI');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  rows.push({width,height,scope:'Explicit saved-inventory fixture; real UI repairs, authoritative storage and reload',sticky,resetScroll,restored,overflow,credits:saved.credits,errors,pass:sticky&&resetScroll&&restored&&!overflow&&!errors.length});await page.close();
 }
 fs.writeFileSync('artifacts/store-maintenance/report.json',JSON.stringify({url,rows},null,2));console.log(JSON.stringify(rows));if(rows.some(row=>!row.pass))process.exitCode=1;
}finally{await browser.close();}

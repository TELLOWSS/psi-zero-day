import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output='artifacts/character-reflection-natural';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],samples=[];
 page.on('pageerror',error=>errors.push(String(error)));
 const probeOwners=new Set();
 await page.route('**/assets/*.js',async route=>{
  const response=await route.fetch(),body=await response.text();
  const marker=/update\([^)]*\)\{(?=if\(this\.state\.phase!==)/g;
  const count=[...body.matchAll(marker)].length;
  if(!count){await route.fulfill({response,body});return;}
  probeOwners.add(route.request().url());
  if(count!==1||probeOwners.size!==1)throw Error('Read-only engine probe ownership ambiguous');
  await route.fulfill({response,body:body.replace(marker,match=>`${match}window.characterNaturalEngine=this;`)});
 });
 await page.goto(process.env.PSI_PREVIEW_URL);await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
 await page.locator('.survivors-ready-launch .survivors-btn-primary').click();
 await page.waitForFunction(()=>window.characterNaturalEngine?.state.phase==='playing');
 const started=Date.now();let terminal=null;
 while(Date.now()-started<150000){
  const sample=await page.evaluate(()=>{const s=window.characterNaturalEngine.state;return {phase:s.phase,time:s.gameTime,characterId:s.characterId,stageId:s.stageId,record:structuredClone(s.terrainRecord),zones:s.operationControlledZones.length};});
  samples.push(sample);
  if(['victory','defeat'].includes(sample.phase)){terminal=sample;break;}
  if(sample.phase==='levelup')await page.locator('.survivors-perk-card').first().click();
  if(await page.locator('.shop-continue-btn').count())await page.locator('.shop-continue-btn').click();
  await page.waitForTimeout(200);
 }
 if(!terminal)throw Error('Natural completion not observed within 150s');
 await page.waitForTimeout(600);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.survivors.operation-handoff.v1')||'[]'));
 await page.reload();await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
 const details=page.locator('.survivors-operation-brief').first().locator('details').last();
 await details.locator('summary').click();await details.scrollIntoViewIfNeeded();
 const text=await details.textContent();await page.screenshot({path:`${output}/restored.png`});
 const record=saved.find(row=>row.characterId===terminal.characterId&&row.stageId===terminal.stageId);
 const pass=record?.outcome===terminal.phase&&record.rubbleCleared===terminal.record.rubbleCleared&&record.cartStops===terminal.record.cartStops&&record.zones===terminal.zones&&text.includes('이 작전에서 남긴 일')&&(terminal.phase!=='defeat'||text.includes('대응을 중단한 기록'))&&!errors.length;
 fs.writeFileSync(`${output}/report.json`,JSON.stringify({scope:'FRESH_STORAGE_UI_BOT_NO_ENGINE_STATE_INJECTION_NOT_HUMAN_OR_PHYSICAL_DEVICE',terminal,saved,text,samples,errors,pass},null,2));
 console.log(JSON.stringify({terminal,record,pass,errors}));if(!pass)process.exitCode=1;
}finally{await browser.close();}

import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const copy=JSON.parse(fs.readFileSync('content/localization/survivors-store-ko.json','utf8'));
const detail=JSON.parse(fs.readFileSync('content/localization/survivors-equipment-details-ko.json','utf8'));
const slotIds={communication:['voice_lens','command_array','broadcast_crown'],tempo:['relay_core','precision_link','sync_gauntlet'],logistics:['recovery_mesh','dispatch_drive','extraction_pack'],protection:['rescue_shell','recovery_cell','shock_mantle'],companion:['inspection_wing','rescue_wing'],tactics:['barrier_forge','predictive_watch']};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),reports=[];
const quick=Boolean(process.env.EQUIPMENT_DETAILS_QUICK);
try {for(const [width,height] of (quick?[[390,844]]:[[1440,900],[390,844],[844,390]])) {
 const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{window.wornArtDraws=[];const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image?.dataset?.propAtlas?.includes('-worn-v2'))window.wornArtDraws.push({atlas:image.dataset.propAtlas,cell:Number(image.dataset.propCell),equipment:this.canvas.dataset.equipmentId});return draw.call(this,image,...args);};});
 await page.goto('http://127.0.0.1:5203/',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
 await page.getByRole('button',{name:copy.briefBrowse,exact:true}).click();
 await page.getByRole('tab',{name:copy.fitting,exact:true}).click();
 const before=await page.evaluate(()=>JSON.stringify({...localStorage}));
 await page.getByRole('button',{name:copy.pausePreview,exact:true}).click();
 const canvas=page.locator('.survivors-fitting-visual canvas');let count=0;
 for(const character of (quick?['kang_taesik']:Object.keys(detail.roles))) {
  await page.getByLabel(detail.character,{exact:true}).selectOption(character);
  await page.waitForFunction(()=>!document.querySelector('.survivors-fitting-visual figcaption'));
  for(const [slot,ids] of Object.entries(slotIds))for(const id of (width===1440?ids:ids.slice(-1))) {
   await page.getByLabel(copy.categories[slot],{exact:true}).selectOption('');
   await page.waitForTimeout(65);
   const previous=await canvas.screenshot();
   await page.evaluate(()=>{window.wornArtDraws=[];});await page.getByLabel(copy.categories[slot],{exact:true}).selectOption(id);
   await page.waitForTimeout(65);
   const current=await canvas.screenshot();if(previous.equals(current))throw Error(`missing mount ${character}:${id}`);count++;
   if(slot!=='communication'&&!await page.evaluate(()=>window.wornArtDraws.some(draw=>draw.atlas.includes('premium-worn-v2'))))throw Error(`missing dedicated worn art ${character}:${id}`);
  }
  if(await canvas.getAttribute('data-character-id')!==character)throw Error('preview character mismatch');
  if(width===1440)await canvas.screenshot({path:`artifacts/equipment-character-${character}.png`});
 }
 const premiumDetails=page.locator('#store-panel-fitting > details').last();await premiumDetails.locator('summary').click();
 if(await premiumDetails.locator('[data-equipment-detail]').count()!==6)throw Error('missing loadout descriptions');
 await premiumDetails.locator('[data-equipment-detail="shock_mantle"]').waitFor();
 const lab=page.locator('.survivors-equipment-lab');await lab.locator('summary').click();
 const ids=Object.keys(detail.normalItems);
 for(const id of ids){await page.evaluate(()=>{window.wornArtDraws=[];});await lab.getByLabel('시험 장비',{exact:true}).selectOption(id);await lab.locator(`[data-equipment-detail="${id}"]`).waitFor();if(id!=='radio_boost'&&id!=='quick_reflexes')await page.waitForFunction(id=>window.wornArtDraws.some(draw=>draw.equipment===id&&draw.atlas.includes('normal-worn-v2')),id);}
 await lab.getByLabel('시험 종류',{exact:true}).selectOption('evolution');
 for(const id of Object.keys(detail.evolutions)){await page.evaluate(()=>{window.wornArtDraws=[];});await lab.getByLabel('시험 장비',{exact:true}).selectOption(id);await lab.locator(`[data-equipment-detail="${id}"]`).waitFor();if(id!=='satellite_broadcast')await page.waitForFunction(id=>window.wornArtDraws.some(draw=>draw.equipment===id&&draw.atlas.includes('normal-worn-v2')),id);}
 await page.getByLabel(detail.character,{exact:true}).selectOption('kang_taesik');
 for(const slot of Object.keys(slotIds))await page.getByLabel(copy.categories[slot],{exact:true}).selectOption('');
 await page.getByLabel(copy.categories.communication,{exact:true}).selectOption('voice_lens');
 await lab.getByLabel('시험 종류',{exact:true}).selectOption('growth');
 await lab.getByLabel('시험 장비',{exact:true}).selectOption('radio_boost');
 const attack=lab.locator('.survivors-equipment-details dl div').filter({has:page.getByText('기본 타격 위력',{exact:true})});
 if(await attack.locator('dd').innerText()!=='40.5')throw Error('character/loadout attack mismatch');
 await lab.locator('.survivors-equipment-details').scrollIntoViewIfNeeded();
 await page.screenshot({path:`artifacts/equipment-details-${width}.png`});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('horizontal overflow');
 if(before!==await page.evaluate(()=>JSON.stringify({...localStorage})))throw Error('preview changed save');
 if(errors.length)throw Error(errors.join('\n'));reports.push({width,height,characters:quick?1:6,premiumMountComparisons:count,freeDetails:19,storageUntouched:true});await page.close();
 }fs.writeFileSync(`artifacts/equipment-details-browser${quick?'-quick':''}.json`,JSON.stringify(reports));console.log(JSON.stringify(reports));
}finally{await browser.close();}

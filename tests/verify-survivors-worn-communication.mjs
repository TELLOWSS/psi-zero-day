import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const copy=JSON.parse(fs.readFileSync('content/localization/survivors-store-ko.json','utf8'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});const reports=[];
try {for(const [width,height] of [[1440,900],[390,844],[844,390]]) {
 const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{performance.setResourceTimingBufferSize(10000);window.wornCells=[];const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image?.dataset?.propAtlas?.includes('communication-worn-v2'))window.wornCells.push({cell:Number(image.dataset.propCell),combat:this.canvas.classList.contains('survivors-canvas')});return draw.call(this,image,...args);};});
 await page.goto('http://127.0.0.1:5203/',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
 await page.getByRole('button',{name:copy.briefBrowse,exact:true}).click();await page.getByRole('tab',{name:copy.fitting,exact:true}).click();
 const before=await page.evaluate(()=>JSON.stringify({...localStorage}));
 for(const [id,column] of [['voice_lens',1],['command_array',2],['broadcast_crown',3]]) {
  await page.evaluate(()=>{window.wornCells=[];});await page.getByLabel(copy.categories.communication,{exact:true}).selectOption(id);
  await page.waitForFunction(column=>window.wornCells.some(p=>p.cell===column),column);
  if(width===1440)await page.locator('.survivors-fitting-visual canvas').screenshot({path:`artifacts/worn-${id}.png`});
  await page.getByLabel(copy.attackMotion,{exact:true}).selectOption('walk');
  await page.waitForFunction(column=>window.wornCells.some(p=>p.cell===4+column),column);
  await page.getByLabel(copy.attackMotion,{exact:true}).selectOption('idle');
 }
 await page.getByLabel(copy.categories.communication,{exact:true}).selectOption('');
 const lab=page.locator('.survivors-equipment-lab');await lab.locator('summary').click();await lab.getByLabel('시험 장비',{exact:true}).selectOption('radio_boost');
 await page.evaluate(()=>{window.wornCells=[];});await page.waitForFunction(()=>window.wornCells.some(p=>p.cell===0));
 if(before!==await page.evaluate(()=>JSON.stringify({...localStorage})))throw Error('preview changed inventory');
 await page.getByRole('button',{name:copy.close,exact:true}).click();
 await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('patrol-survivors-engine.ts')).name;const {SurvivorsEngine}=await import(url);const update=SurvivorsEngine.prototype.update;SurvivorsEngine.prototype.update=function(dt,input){window.wornEngine=this;return update.call(this,dt,input);};});
 await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();await page.waitForFunction(()=>window.wornEngine);
 await page.evaluate(()=>{const e=window.wornEngine;e.skipBossIntro();e.setPaused(false);e.state.activePerks.radio_boost=1;e.state.player.invincibleTime=999;window.wornCells=[];});
 await page.waitForFunction(()=>window.wornCells.some(p=>p.combat));
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(400);await page.keyboard.up('ArrowRight');
 await page.waitForFunction(()=>window.wornCells.some(p=>p.combat&&p.cell===4));
 await page.keyboard.down('ArrowUp');await page.waitForTimeout(400);await page.keyboard.up('ArrowUp');
 await page.waitForFunction(()=>window.wornCells.some(p=>p.combat&&p.cell===8));
 await page.keyboard.down('ArrowDown');await page.waitForTimeout(400);await page.keyboard.up('ArrowDown');
 for(const [id,column] of [['voice_lens',1],['command_array',2],['broadcast_crown',3]]){
  await page.evaluate(async id=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('survivors-premium-gear.ts')).name;const {applyPremiumLoadout}=await import(url);const e=window.wornEngine;e.setPaused(true);if(!applyPremiumLoadout(e.state,{owned:[id],equipped:[id]}))throw Error('loadout rejected');e.setPaused(false);window.wornCells=[];},id);
  await page.waitForFunction(column=>window.wornCells.some(p=>p.combat&&p.cell===column),column);
 }
 if(errors.length)throw Error(errors.join('\n'));
 await page.screenshot({path:`artifacts/worn-combat-${width}.png`});reports.push({width,height,purchases:3,free:true,combatUsesSameAtlas:true,sideAndRear:true,previewReadOnly:true});await page.close();
 }console.log(JSON.stringify(reports));fs.writeFileSync('artifacts/worn-communication-browser.json',JSON.stringify(reports));
}finally{await browser.close();}

import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const copy=JSON.parse(fs.readFileSync('content/localization/survivors-store-ko.json','utf8'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),reports=[];
const paid={relay_core:2,precision_link:3,recovery_mesh:4,dispatch_drive:5,rescue_shell:6,recovery_cell:7,sync_gauntlet:9,extraction_pack:10,shock_mantle:11,inspection_wing:12,barrier_forge:13,rescue_wing:14,predictive_watch:15};
const normal={extinguisher:0,cryo_blizzard:1,floodlight:2,tesla_dome:3,cone_trap:4,emf_barricade:5,grouting_gun:6,hydraulic_ram:7,emp_generator:8,plasma_grid:9,safety_drone:10,hunter_swarm:11,safety_harness:12,steel_boots:13,magnet_beacon:14,data_chip:15};
try{for(const [width,height] of [[1440,900],[390,844],[844,390]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{performance.setResourceTimingBufferSize(10000);window.wornDraws=[];const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(this.canvas.classList.contains('survivors-canvas')&&image?.dataset?.propAtlas?.includes('-worn-v2'))window.wornDraws.push({atlas:image.dataset.propAtlas,cell:Number(image.dataset.propCell)});return draw.call(this,image,...args);};});
 await page.goto('http://127.0.0.1:5203/',{waitUntil:'networkidle'});await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
 await page.getByRole('button',{name:copy.briefBrowse,exact:true}).click();await page.getByRole('button',{name:copy.close,exact:true}).click();
 await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('patrol-survivors-engine.ts')).name;const {SurvivorsEngine}=await import(url);const update=SurvivorsEngine.prototype.update;SurvivorsEngine.prototype.update=function(dt,input){window.wornEngine=this;return update.call(this,dt,input);};});
 await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();await page.waitForFunction(()=>window.wornEngine);
 await page.evaluate(()=>{const e=window.wornEngine;e.skipBossIntro();e.setPaused(false);e.state.player.invincibleTime=999;});
 // Isolated QA inventory exercises real loadout validation; it never writes a purchase/save.
 for(const [id,cell] of Object.entries(paid)){
  await page.evaluate(async id=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('survivors-premium-gear.ts')).name;const {applyPremiumLoadout}=await import(url);const e=window.wornEngine;e.setPaused(true);e.state.hazards=[];if(!applyPremiumLoadout(e.state,{owned:[id],equipped:[id]}))throw Error('rejected loadout');e.setPaused(false);window.wornDraws=[];},id);
  await page.waitForFunction(cell=>window.wornDraws.some(draw=>draw.atlas.includes('premium-worn-v2')&&draw.cell===cell),cell);
 }
 await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('survivors-premium-gear.ts')).name;const {applyPremiumLoadout}=await import(url);applyPremiumLoadout(window.wornEngine.state,{owned:[],equipped:[]});});
 for(const [id,cell] of Object.entries(normal)){
  await page.evaluate(id=>{const s=window.wornEngine.state;for(const key of Object.keys(s.activePerks))s.activePerks[key]=0;s.activePerks[id]=1;window.wornDraws=[];},id);
  await page.waitForFunction(cell=>window.wornDraws.some(draw=>draw.atlas.includes('normal-worn-v2')&&draw.cell===cell),cell);
 }
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(300);await page.keyboard.up('ArrowRight');await page.keyboard.down('ArrowUp');await page.waitForTimeout(300);await page.keyboard.up('ArrowUp');
 await page.screenshot({path:`artifacts/worn-equipment-combat-${width}.png`});if(errors.length)throw Error(errors.join('\n'));reports.push({width,height,paidWornCells:13,normalWornCells:16,actualCombat:true,errors:0});await page.close();
}fs.writeFileSync('artifacts/worn-equipment-combat-browser.json',JSON.stringify(reports));console.log(JSON.stringify(reports));}finally{await browser.close();}

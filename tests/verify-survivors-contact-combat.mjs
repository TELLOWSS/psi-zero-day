import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright'),copy=JSON.parse(fs.readFileSync('content/localization/survivors-store-ko.json','utf8'));
const ids=['player','kang_taesik','yoon_sungho','lee_jaehoon','lim_junho','safety_monitor'];
const paid={relay_core:2,precision_link:3,recovery_mesh:4,dispatch_drive:5,rescue_shell:6,recovery_cell:7,sync_gauntlet:9,extraction_pack:10,shock_mantle:11,inspection_wing:12,barrier_forge:13,rescue_wing:14,predictive_watch:15};
const normal={extinguisher:0,cryo_blizzard:1,floodlight:2,tesla_dome:3,cone_trap:4,emf_barricade:5,grouting_gun:6,hydraulic_ram:7,emp_generator:8,plasma_grid:9,safety_drone:10,hunter_swarm:11,safety_harness:12,steel_boots:13,magnet_beacon:14,data_chip:15};
const rearPaid=new Set(['recovery_mesh','dispatch_drive','extraction_pack','inspection_wing','barrier_forge','rescue_wing','predictive_watch']),rearNormal=new Set(Object.keys(normal).filter(id=>!['floodlight','tesla_dome','safety_harness'].includes(id)));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),report=[];
try{for(const [width,height] of [[1440,900],[390,844],[844,390]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{performance.setResourceTimingBufferSize(10000);window.contactBodies=[];window.viewDraws=[];const fn=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(this.canvas.classList.contains('survivors-canvas')){if(image?.dataset?.contactSheet)window.contactBodies.push(image.dataset.contactSheet);if(image?.dataset?.propAtlas)window.viewDraws.push({atlas:image.dataset.propAtlas,cell:Number(image.dataset.propCell)});}return fn.call(this,image,...args);};});
 await page.goto(process.env.PSI_PREVIEW_URL??'http://127.0.0.1:5203/',{waitUntil:'networkidle'});await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();await page.getByRole('button',{name:copy.briefBrowse,exact:true}).click();await page.getByRole('button',{name:copy.close,exact:true}).click();
 await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('patrol-survivors-engine.ts')).name;const {SurvivorsEngine}=await import(url);const update=SurvivorsEngine.prototype.update;SurvivorsEngine.prototype.update=function(dt,input){window.contactEngine=this;return update.call(this,dt,input);};});
 // Actual player body/equipment path, isolated QA inventory, no storage writes.
 await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();await page.waitForFunction(()=>window.contactEngine);await page.evaluate(()=>{const e=window.contactEngine;e.skipBossIntro();e.setPaused(false);e.state.player.invincibleTime=999;e.state.hazards=[];});
 await page.waitForFunction(()=>window.contactBodies.some(p=>p==='authored-20:player'||p.includes('/player-contact-')));
 let mounted=0;
 for(const [view,key] of [['front','ArrowDown'],['side','ArrowRight'],['rear','ArrowUp']]){
  await page.evaluate(()=>{const e=window.contactEngine;e.state.hazards=[];e.state.player.x=700;e.state.player.y=450;e.setPaused(false);});
  await page.keyboard.down(key);await page.waitForTimeout(350);await page.keyboard.up(key);await page.evaluate(()=>window.contactEngine.setPaused(true));
  for(const [id,cell] of Object.entries(paid)){
   await page.evaluate(async id=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('survivors-premium-gear.ts')).name;const {applyPremiumLoadout}=await import(url),e=window.contactEngine;e.setPaused(true);e.state.hazards=[];if(!applyPremiumLoadout(e.state,{owned:[id],equipped:[id]}))throw Error('loadout rejected');window.viewDraws=[];},id);
   if(view==='rear'&&!rearPaid.has(id)){await page.waitForTimeout(50);continue;}
   await page.waitForFunction(({view,cell})=>window.viewDraws.some(d=>d.cell===cell&&d.atlas.includes(view==='front'?'premium-worn-v2':'premium-worn-'+view+'-v1')),{view,cell});mounted++;
  }
  await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('survivors-premium-gear.ts')).name;const {applyPremiumLoadout}=await import(url);if(!applyPremiumLoadout(window.contactEngine.state,{owned:[],equipped:[]}))throw Error('QA loadout clear rejected');});
  for(const [id,cell] of Object.entries(normal)){
   await page.evaluate(id=>{const s=window.contactEngine.state;for(const k of Object.keys(s.activePerks))s.activePerks[k]=0;s.activePerks[id]=1;window.viewDraws=[];},id);
   if(view==='rear'&&!rearNormal.has(id)){await page.waitForTimeout(50);continue;}
   try{await page.waitForFunction(({view,cell})=>window.viewDraws.some(d=>d.cell===cell&&d.atlas.includes(view==='front'?'normal-worn-v2':'normal-worn-'+view+'-v1')),{view,cell}, {timeout:8000});}catch(e){console.log('failed view',view,id,await page.evaluate(()=>({draws:window.viewDraws.slice(-20),phase:window.contactEngine.state.phase,position:window.contactEngine.state.player,perks:window.contactEngine.state.activePerks})));throw e;}mounted++;
  }
 }
 // Trigger the real inspection suppression rule and verify the empty dock remains attached.
 await page.evaluate(async()=>{const e=window.contactEngine,url=performance.getEntriesByType('resource').find(e=>e.name.includes('survivors-premium-gear.ts')).name;const {applyPremiumLoadout}=await import(url);applyPremiumLoadout(e.state,{owned:['inspection_wing'],equipped:['inspection_wing']});e.state.hazards.push({id:'qa-inspection-cart',type:'RUNAWAY_CART',expValue:1,x:e.state.player.x+60,y:e.state.player.y,hp:1000,maxHp:1000,radius:24,speed:0,damage:0,hitCooldown:0});e.setPaused(false);window.viewDraws=[];});
 await page.waitForFunction(()=>window.viewDraws.some(d=>d.atlas.includes('empty-drone-docks-v1')));
 const error=await page.locator('canvas.survivors-canvas').getAttribute('data-contact-error');if(Number(error)>1e-6)throw Error('contact projection mismatch');
 await page.screenshot({path:'artifacts/contact-combat-'+width+'.png'});
 if(errors.length)throw Error(errors.join('\n'));report.push({width,height,actualCombat:true,verifiedMountedViews:mounted,emptyInspectionDock:true,errors});await page.close();
}
for(const [index,id] of ids.entries()){
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{performance.setResourceTimingBufferSize(10000);window.actorArt=[];const fn=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(this.canvas.classList.contains('survivors-canvas')&&image?.dataset?.contactSheet)window.actorArt.push(image.dataset.contactSheet);return fn.call(this,image,...args);};});
 await page.goto(process.env.PSI_PREVIEW_URL??'http://127.0.0.1:5203/',{waitUntil:'networkidle'});await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();await page.getByRole('button',{name:copy.briefBrowse,exact:true}).click();await page.getByRole('button',{name:copy.close,exact:true}).click();
 await page.locator('.survivors-preflight-tabs').getByRole('button',{name:'순찰 요원',exact:true}).click();await page.locator('.survivors-char-card').nth(index).click();
 await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('patrol-survivors-engine.ts')).name;const {SurvivorsEngine}=await import(url),update=SurvivorsEngine.prototype.update;SurvivorsEngine.prototype.update=function(dt,input){window.characterEngine=this;return update.call(this,dt,input);};});
 await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();await page.waitForFunction(()=>window.characterEngine);await page.evaluate(async()=>{const e=window.characterEngine;e.skipBossIntro();e.setPaused(false);e.state.player.invincibleTime=999;e.state.hazards=[];const url=performance.getEntriesByType('resource').find(e=>e.name.includes('survivors-premium-gear.ts')).name,{applyPremiumLoadout}=await import(url),gear=['voice_lens','sync_gauntlet','recovery_mesh','rescue_shell','inspection_wing','predictive_watch'];e.setPaused(true);if(!applyPremiumLoadout(e.state,{owned:gear,equipped:gear}))throw Error('combined equipment rejected');e.state.activePerks.steel_boots=1;e.setPaused(false);});
 await page.waitForFunction(id=>window.actorArt.some(path=>path==='authored-20:'+id||path.includes('/'+id+'-contact-')),id);
 for(const key of ['ArrowRight','ArrowDown','ArrowLeft','ArrowUp']){await page.keyboard.down(key);await page.waitForTimeout(280);await page.keyboard.up(key);await page.waitForTimeout(80);}
 await page.screenshot({path:'artifacts/contact-character-combat-'+id+'.png'});if(errors.length)throw Error(errors.join('\n'));report.push({character:id,actualCombat:true,correctAuthoredBody:true,combinedEquipment:true,errors});await page.close();
}
fs.writeFileSync('artifacts/contact-combat-browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}finally{await browser.close();}

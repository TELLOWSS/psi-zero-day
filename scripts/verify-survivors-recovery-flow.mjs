import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/recovery-flow');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const reports=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.setDefaultTimeout(15000);
  await page.route('**/@vite/client',route=>route.fulfill({status:200,contentType:'text/javascript',body:'const styles=new Map();export const injectQuery=url=>url;export const updateStyle=(id,content)=>{let s=styles.get(id);if(!s){s=document.createElement("style");document.head.appendChild(s);styles.set(id,s);}s.textContent=content;};export const removeStyle=id=>{styles.get(id)?.remove();styles.delete(id);};export const createHotContext=()=>({accept(){},dispose(){},on(){},prune(){},invalidate(){},data:{}});'}));
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/src/engine/patrol-survivors-engine.ts*',async route=>{
   const response=await route.fetch(),body=await response.text();
   if(!body.includes('update(dt, input) {'))throw new Error('Engine capture hook unavailable');
   await route.fulfill({response,body:body.replace('update(dt, input) {','update(dt, input) { window.qaEngine=this;')});
  });
  await page.route('**/src/ui/survivors-recovery-flow.ts*',async route=>{
   const response=await route.fetch(),body=await response.text();
   const marker=/const socket = premiumBodySocket\([^;]+;/;
   if(!marker.test(body))throw new Error('Rear socket observer unavailable');
   await route.fulfill({response,body:body.replace(marker,match=>match+' if(!socket)window.qaRearCalls++;')});
  });
  await page.addInitScript(()=>{
   window.qaRecovery=[];window.qaRearCalls=0;const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
    if(image?.src?.includes('recovery-cell-flow-v1.png'))window.qaRecovery.push(args.slice(0,2));
    return draw.call(this,image,...args);
   };
  });
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();await page.waitForFunction(()=>window.qaEngine?.state.phase==='playing');
  await page.evaluate(async()=>{
   const {applyPremiumLoadout}=await import('/src/engine/survivors-premium-gear.ts');
   const s=window.qaEngine.state;s.phase='paused';
   const ids=['broadcast_crown','sync_gauntlet','extraction_pack','recovery_cell','rescue_wing','barrier_forge'];
   applyPremiumLoadout(s,{owned:ids,equipped:ids});s.phase='playing';
   s.player.hp=s.player.maxHp-30;s.player.invincibleTime=100;s.hazards=[];s.interactiveHazards=[];
   window.qaRecovery=[];
  });
  await page.waitForFunction(()=>window.qaRecovery.length>2);await page.waitForTimeout(400);
  await page.screenshot({path:path.join(out,`${width}x${height}-recovering.png`)});
  const active=await page.evaluate(()=>({stamps:window.qaRecovery.length,frames:new Set(window.qaRecovery.map(v=>v.join(','))).size,receipt:window.qaEngine.state.premiumGear.recoveryAmount,equipped:window.qaEngine.state.premiumGear.equipped.length}));
  await page.keyboard.down('w');await page.waitForTimeout(200);
  await page.evaluate(()=>{window.qaRecovery=[];window.qaRearCalls=0;});await page.waitForTimeout(350);
  const rear=await page.evaluate(()=>({stamps:window.qaRecovery.length,calls:window.qaRearCalls,receipt:window.qaEngine.state.premiumGear.recoveryAmount,character:window.qaEngine.state.characterId}));
  await page.screenshot({path:path.join(out,`${width}x${height}-rear-recovering.png`)});
  await page.keyboard.up('w');await page.keyboard.down('s');await page.waitForTimeout(200);await page.keyboard.up('s');
  await page.waitForFunction(()=>window.qaRecovery.length>0);
  await page.evaluate(()=>{window.qaEngine.state.player.hp=window.qaEngine.state.player.maxHp;});await page.waitForTimeout(1200);
  const settled=await page.evaluate(()=>window.qaRecovery.length);await page.waitForTimeout(350);
  const idle=await page.evaluate(()=>window.qaRecovery.length);
  await page.evaluate(()=>{const s=window.qaEngine.state;s.player.hp-=10;});await page.waitForTimeout(1600);
  await page.evaluate(()=>{window.qaEngine.state.phase='paused';window.qaRecovery=[];});await page.waitForTimeout(150);
  const paused=await page.evaluate(()=>[...new Set(window.qaRecovery.map(v=>v.join(',')))]);await page.waitForTimeout(250);
  const held=await page.evaluate(()=>[...new Set(window.qaRecovery.map(v=>v.join(',')))]);
  await page.evaluate(async()=>{const {applyPremiumLoadout}=await import('/src/engine/survivors-premium-gear.ts');applyPremiumLoadout(window.qaEngine.state,{owned:['recovery_cell'],equipped:[]});window.qaRecovery=[];});
  await page.waitForTimeout(300);const unequipped=await page.evaluate(()=>window.qaRecovery.length);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const pass=active.stamps>0&&active.frames>=3&&active.receipt>0&&active.equipped===6&&rear.calls>0&&rear.stamps===0&&rear.receipt>0&&rear.character==='player'&&settled===idle&&JSON.stringify(paused)===JSON.stringify(held)&&unequipped===0&&!overflow&&!errors.length;
  reports.push({width,height,active,rear,settled,idle,paused,held,unequipped,overflow,errors,pass});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));if(reports.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

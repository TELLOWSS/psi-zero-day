import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/premium-restraint');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const reports=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/@vite/client',route=>route.fulfill({status:200,contentType:'text/javascript',body:'const styles=new Map();export const injectQuery=url=>url;export const updateStyle=(id,content)=>{let s=styles.get(id);if(!s){s=document.createElement("style");document.head.appendChild(s);styles.set(id,s);}s.textContent=content;};export const removeStyle=id=>{styles.get(id)?.remove();styles.delete(id);};export const createHotContext=()=>({accept(){},dispose(){},on(){},prune(){},invalidate(){},data:{}});'}));
  await page.route('**/src/engine/patrol-survivors-engine.ts*',async route=>{
   const response=await route.fetch(),body=await response.text();
   await route.fulfill({response,body:body.replace('update(dt, input) {','update(dt, input) {window.restraintEngine=this;')});
  });
  await page.addInitScript(()=>{
   const ids=['broadcast_crown','sync_gauntlet','extraction_pack','shock_mantle','inspection_wing','barrier_forge'];
   localStorage.setItem('psi.survivors.store_wallet',JSON.stringify({credits:10000,inventory:{owned:ids,equipped:ids}}));
   window.shieldStamps=[];window.duplicateShields=0;const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
    if(image?.src?.includes('cinematic-vfx-v3.png')&&args.length===8&&args[1]===0&&
      ((args[6]===42&&args[7]===58)||(args[6]===62&&args[7]===76)))window.shieldStamps.push({width:args[6],height:args[7],alpha:this.globalAlpha});
    if(image?.src?.includes('cinematic-vfx-v3.png')&&args.length===8&&args[6]===76&&args[7]===86)window.duplicateShields++;
    return draw.call(this,image,...args);
   };
  });
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
  await page.waitForFunction(()=>window.restraintEngine?.state.phase==='playing');
  await page.evaluate(()=>{
   const s=window.restraintEngine.state;s.hazards=[];s.interactiveHazards=[];s.premiumGear.feedback=0;
   window.shieldStamps=[];
  });
  await page.waitForFunction(()=>window.shieldStamps.some(s=>s.width===42));
  const idle=await page.evaluate(()=>window.shieldStamps.filter(s=>s.width===42).at(-1));
  await page.screenshot({path:path.join(out,`${width}x${height}-idle.png`)});
  await page.evaluate(()=>{window.restraintEngine.state.premiumGear.feedback=.45;window.shieldStamps=[];});
  await page.waitForFunction(()=>window.shieldStamps.some(s=>s.width===62));
  const active=await page.evaluate(()=>window.shieldStamps.filter(s=>s.width===62).at(-1));
  await page.screenshot({path:path.join(out,`${width}x${height}-feedback.png`)});
  const state=await page.evaluate(()=>({equipped:window.restraintEngine.state.premiumGear.equipped,duplicateShields:window.duplicateShields,overflow:document.documentElement.scrollWidth>innerWidth}));
  reports.push({width,height,idle,active,...state,errors,pass:idle.alpha<=.1&&active.alpha>idle.alpha&&state.equipped.length===6&&state.duplicateShields===0&&!state.overflow&&!errors.length});
  await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
 if(reports.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

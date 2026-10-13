import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/radio-launch');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const reports=[];
 const characters=['안전감시단','현장 안전관리자','강태식','윤성호','이재훈','임준호'];
 const cases=process.env.PSI_RADIO_MATRIX==='1'?characters.map(character=>({width:1440,height:900,character})):
  [[1440,900],[390,844],[844,390]].map(([width,height])=>({width,height}));
 for(const {width,height,character} of cases){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  page.setDefaultTimeout(15000);console.log('Checking',character??`${width}x${height}`);
  await page.route('**/@vite/client',route=>route.fulfill({status:200,contentType:'text/javascript',body:'const styles=new Map();export const injectQuery=url=>url;export const updateStyle=(id,content)=>{let s=styles.get(id);if(!s){s=document.createElement("style");document.head.appendChild(s);styles.set(id,s);}s.textContent=content;};export const removeStyle=id=>{styles.get(id)?.remove();styles.delete(id);};export const createHotContext=()=>({accept(){},dispose(){},on(){},prune(){},invalidate(){},data:{}});'}));
  await page.route('**/src/engine/patrol-survivors-engine.ts*',async route=>{
   const response=await route.fetch(),body=await response.text();
   await route.fulfill({response,body:body.replace('update(dt, input) {','update(dt, input) {window.radioEngine=this;')});
  });
  await page.route('**/src/ui/survivors-tool-emission.ts*',async route=>{
   const response=await route.fetch(),body=await response.text();
   const marker='observe(state, events, offset) {';
   if(!body.includes(marker))throw new Error('Emission projection capture unavailable');
   await route.fulfill({response,body:body.replace(marker,marker+' window.radioProjection=this; if(offset&&events.some(e=>e.kind==="radio"&&e.phase==="launch"))window.radioBindings.push({offset,ids:events.filter(e=>e.kind==="radio"&&e.phase==="launch").map(e=>e.projectileId)});')});
  });
  await page.addInitScript(()=>{
   localStorage.setItem('psi.survivors.store_wallet',JSON.stringify({credits:10000,inventory:{owned:['voice_lens'],equipped:['voice_lens']}}));
   window.radioFrames=new Set();window.radioBindings=[];window.radioStamps=0;const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
    if(image?.src?.includes('voice-lens-release-v1.png')){window.radioStamps++;window.radioFrames.add(args[0]/512+args[1]/512*3);}
    return draw.call(this,image,...args);
   };
  });
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  if(character){
   await page.locator('.survivors-preflight-tabs button').nth(2).click();
   await page.locator('.survivors-char-card').filter({has:page.locator('strong',{hasText:character})}).click();
  }
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
  await page.waitForFunction(()=>window.radioEngine?.state.phase==='playing');
  await page.evaluate(()=>{
   const s=window.radioEngine.state;for(const key of Object.keys(s.activePerks))s.activePerks[key]=0;s.activePerks.radio_boost=1;
   s.interactiveHazards=[];s.nextLevelExp=1e9;s.player.hp=1e9;s.player.maxHp=1e9;
   s.hazards=[{id:'radio-probe',type:'RUNAWAY_CART',x:s.player.x+85,y:s.player.y,hp:1e9,maxHp:1e9,speed:0,radius:20,damage:0,expValue:0}];
  });
  await page.waitForFunction(()=>window.radioFrames.size===6&&window.radioBindings.length>0);
  const directions=[];
  if(character){
   for(const keys of [['d'],['d','s'],['s'],['s','a'],['a'],['a','w'],['w'],['w','d']]){
    await page.evaluate(()=>{const s=window.radioEngine.state;s.hazards[0].x=s.player.x+85;s.hazards[0].y=s.player.y;});
    const before=await page.evaluate(()=>window.radioBindings.length);
    for(const key of keys)await page.keyboard.down(key);
    await page.waitForFunction(count=>window.radioBindings.length>count,before,{timeout:5000});
    directions.push(await page.evaluate(keys=>({keys,characterId:window.radioEngine.state.characterId,offset:window.radioBindings.at(-1).offset}),keys));
    for(const key of keys)await page.keyboard.up(key);
   }
  }
  const bindings=await page.evaluate(()=>window.radioBindings);
  await page.screenshot({path:path.join(out,`${character??'default'}-${width}x${height}-actual-launch.png`)});
  await page.evaluate(()=>window.radioEngine.setPaused(true));await page.waitForTimeout(100);
  const paused=await page.evaluate(()=>window.radioStamps);await page.waitForTimeout(150);
  const pauseHeld=await page.evaluate(value=>window.radioStamps===value,paused);
  await page.evaluate(()=>{window.radioEngine.state.premiumGear.equipped=[];window.radioEngine.setPaused(false);});
  await page.waitForTimeout(300);const unequipped=await page.evaluate(()=>window.radioStamps);await page.waitForTimeout(500);
  const result=await page.evaluate(value=>({unequipQuiet:window.radioStamps===value,frames:[...window.radioFrames],
   weapon:window.radioEngine.state.activePerks.radio_boost,overflow:document.documentElement.scrollWidth>innerWidth}),unequipped);
  reports.push({width,height,character,directions,...result,bindings,pauseHeld,errors,pass:pauseHeld&&result.unequipQuiet&&result.frames.length===6&&bindings.every(b=>Number.isFinite(b.offset.x)&&b.offset.y<0)&&(!character||directions.length===8)&&result.weapon===1&&!result.overflow&&!errors.length});
  await page.close();
 }
 fs.writeFileSync(path.join(out,process.env.PSI_RADIO_MATRIX==='1'?'character-matrix.json':'report.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
 if(reports.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const url=process.env.PSI_PREVIEW_URL;if(!url)throw Error('Set PSI_PREVIEW_URL');
const output='artifacts/aura-combat-scene';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--renderer-process-limit=1']}),rows=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]])for(const mode of ['normal','busy','reduced']){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.emulateMedia({reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  await page.addInitScript(()=>{const ids=['broadcast_crown','sync_gauntlet','extraction_pack','shock_mantle','inspection_wing','barrier_forge'];localStorage.setItem('psi.survivors.store_wallet',JSON.stringify({credits:1260,inventory:{owned:ids,equipped:ids,durability:Object.fromEntries(ids.map(id=>[id,100]))}}));});
  await page.route('**/assets/PatrolSurvivorsGame-*.js',async route=>{
   const response=await route.fetch();let body=await response.text();const capture=/update\([^)]*\)\{(?=if\(this\.state\.phase!==)/g;
   if([...body.matchAll(capture)].length!==1)throw Error('Engine capture unavailable');body=body.replace(capture,m=>`${m}window.auraSceneEngine=this;`);
   const marker=body.indexOf('*1.4%1*6'),start=body.lastIndexOf('function ',marker),header=/^function \w+\(([^)]+)\)\{/.exec(body.slice(start));
   if(marker<0||!header||header[1].split(',').length!==7)throw Error('Aura renderer capture unavailable');
   const args=header[1].split(',').map(a=>a.split('=')[0]),[ctx,images,ids,time,reduced,busy,action]=args;
   const probe=`const originalAction=${action};${action}=1;window.auraSceneCall={ids:[...${ids}],time:${time},reduced:${reduced},busy:${busy},originalAction,action:${action},assetReady:Boolean(${images}),transform:[${ctx}.getTransform().a,${ctx}.getTransform().d,${ctx}.getTransform().e,${ctx}.getTransform().f]};`;
   body=body.slice(0,start)+body.slice(start).replace(header[0],header[0]+probe);await route.fulfill({response,body});
  });
  await page.goto(url);await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();await page.locator('.survivors-ready-launch .survivors-btn-primary').click();
  await page.waitForFunction(()=>window.auraSceneEngine?.state.phase==='playing'&&window.auraSceneCall?.assetReady);
  await page.keyboard.press('KeyP');
  // Only the test state contains the stationary threat fixture; production logic is untouched.
  await page.evaluate(busy=>{const s=window.auraSceneEngine.state,p=s.player;s.hazards=Array.from({length:busy?46:4},(_,i)=>{const angle=i*Math.PI*2/(busy?12:4),radius=160+Math.floor(i/12)*90;return {id:`aura-review-${i}`,type:'RUNAWAY_CART',x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,hp:100,maxHp:100,speed:0,radius:18,damage:0,expValue:0,motion:{phase:'warning',timer:1,directionX:-Math.cos(angle),directionY:-Math.sin(angle)}};});},mode==='busy');
  await page.addStyleTag({content:'.survivors-modal-backdrop{visibility:hidden!important}'});await page.waitForTimeout(300);
  const sample=()=>page.evaluate(()=>{const c=document.querySelector('.survivors-canvas')??document.querySelector('canvas'),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let hash=2166136261,min=255,max=0;for(let i=0;i<data.length;i+=4){hash=Math.imul(hash^data[i],16777619);min=Math.min(min,data[i]);max=Math.max(max,data[i]);}return {hash:hash>>>0,nonblank:max-min>20,time:window.auraSceneEngine.state.gameTime,call:window.auraSceneCall,phase:window.auraSceneEngine.state.phase,hazards:window.auraSceneEngine.state.hazards.length,overflow:document.documentElement.scrollWidth>innerWidth};});
  const samples=[await sample()];for(let i=0;i<4;i++){await page.waitForTimeout(250);samples.push(await sample());if(samples.at(-1).hash===samples.at(-2).hash)break;}
  const last=samples.at(-1),stable=last.hash===samples.at(-2).hash&&samples.every(s=>s.time===samples[0].time);
  await page.screenshot({path:`${output}/${width}x${height}-${mode}.png`});rows.push({width,height,mode,samples,errors,pass:stable&&last.nonblank&&!last.overflow&&last.phase==='paused'&&last.call.ids.length===6&&last.call.assetReady&&Boolean(last.call.busy)===(mode==='busy')&&Boolean(last.call.reduced)===(mode==='reduced')&&!errors.length});await page.close();
 }
 fs.writeFileSync(`${output}/report.json`,JSON.stringify({scope:'INSTRUMENTED_SIX_GEAR_WARNING_SCENE_FORCED_AURA_PEAK_FIXTURE_NOT_NATURAL_CROWD_OR_PHYSICAL_DEVICE',url,rows},null,2));console.log(JSON.stringify(rows));if(rows.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

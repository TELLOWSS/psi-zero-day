#!/usr/bin/env node
/**
 * M12-G4 genuine OMEGA React/Canvas 4-size silver AIRA review.
 * Uses pinned GitHub 8 original WebPs with source SHA256, never dummy actors,
 * artificial alpha/pixel overlays, screenshots composited in test or
 * unapproved production 160 animation frames. No physical Android FPS claim.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const dir=resolve('qa-omega-protocol-captures');await mkdir(dir,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const sizes=[['desktop',1440,900,false],['tablet',1024,768,true],
 ['portrait',390,844,true],['landscape',844,390,true]];
const rows=[];let failures=0;
for(const [name,w,h,mobile] of sizes){
 const context=await browser.newContext({
  viewport:{width:w,height:h},deviceScaleFactor:1,
  ...(mobile?{isMobile:true,hasTouch:true}:{})
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaM12G4=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  const root=page.locator('main[data-omega-protocol-internal="true"]');
  await root.waitFor({timeout:25000});
  await page.locator('[data-omega-silver-preview="ready"]').waitFor({timeout:30000});
  const proof=await root.evaluate(async (el,{w,h})=>{
   const get=k=>el.getAttribute(k);
   const field=await import('/src/domain/omega-protocol-field.ts');
   const graphics=await import('/src/ui/omega-protocol-m12-combat-fidelity.ts');
   const art=await import('/src/ui/omega-protocol-art-slot.ts');
   const plan=field.omegaFieldPlan(20261108,1),before=JSON.stringify(plan);
   const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=900;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)return {pass:false,reason:'no canvas ctx'};
   const budget=graphics.omegaG4Budget(w,h);
   graphics.drawOmegaG4CenterStageMaterial(ctx,plan,budget);
   const ground=ctx.getImageData(88,335,680,218).data;
   let ink=0;const colors=new Set();
   for(let i=0;i<ground.length;i+=16)if(ground[i+3]>7){
    ink++;colors.add([ground[i]>>4,ground[i+1]>>4,ground[i+2]>>4].join(':'));
   }
   const beforeActor=ctx.getImageData(115,400,110,98).data;
   graphics.drawOmegaG4ActorGrounding(ctx,plan,plan.entry,'silver-aira',budget);
   const afterActor=ctx.getImageData(115,400,110,98).data;
   let actorPixels=0;for(let i=0;i<beforeActor.length;i+=16)
    if(beforeActor[i]!==afterActor[i]||beforeActor[i+3]!==afterActor[i+3])actorPixels++;
   const status=get('data-omega-silver-preview');
   const full8=get('data-omega-aira-v2-ready');
   const source=get('data-omega-m12g4-silver-review');
   const artLocked=art.OMEGA_PROTOCOL_APPROVED_ART===null&&
    art.OMEGA_PROTOCOL_BINARY_AUDIT_PASSED===false;
   const nativeSolids=field.omegaFieldNativeTerrain(plan).length;
   const unchanged=JSON.stringify(plan)===before;
   return {pass:status==='ready'&&full8==='true'&&source==='source-sha256-dev-only'&&
     artLocked&&nativeSolids===4&&unchanged&&ink>250&&colors.size>=5&&actorPixels>30,
    status,full8,source,artLocked,nativeSolids,unchanged,
    budget,groundInk:ink,groundColorBins:colors.size,actorPixels};
  },{w,h});
  const arena=page.locator('.omega-protocol-arena');
  const beforeX=Number(await arena.getAttribute('data-omega-player-x'));
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(400);await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(125);
  const afterX=Number(await arena.getAttribute('data-omega-player-x'));
  const layout=await page.evaluate(()=>({
   viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
   canvasHeight:document.querySelector('.omega-protocol-arena canvas')?.getBoundingClientRect().height,
  }));
  await page.screenshot({path:dir+'/m12g4-live-silver-'+name+'-'+w+'x'+h+'.png',
   fullPage:false,animations:'disabled'});
  const pass=proof.pass&&afterX>beforeX+2&&
   layout.documentWidth<=layout.viewport+3&&layout.canvasHeight>140&&errors.length===0;
  const item={name,w,h,pass,proof,layout,movedX:afterX-beforeX,errors,
   final160Approved:false,physicalAndroidFPS:false};
  rows.push(item);
  if(!pass)throw Error('M12-G4 live silver proof '+JSON.stringify(item));
  console.log('QA_PASS M12_G4',name,JSON.stringify({
    all8Verified:proof.full8,materialColors:proof.groundColorBins,
    reflectionPixels:proof.actorPixels,movedX:afterX-beforeX}));
 }catch(e){
  failures++;
  if(rows.at(-1)?.name!==name)rows.push({name,w,h,pass:false,error:String(e),errors});
  else{rows.at(-1).pass=false;rows.at(-1).error=String(e);}
  console.error('QA_FAIL M12_G4',name,String(e));
  try{await page.screenshot({path:dir+'/m12g4-FAIL-'+name+'.png'});}catch{}
 }
 await context.close();
}
await browser.close();
await writeFile(dir+'/m12g4-silver-identity-and-material-report.json',JSON.stringify({
 failures,rows,approved160Sprites:false,approved320Masks:false,
 androidPhysicalTesting:false,productionRelease:false,
},null,2));
if(failures)process.exitCode=1;

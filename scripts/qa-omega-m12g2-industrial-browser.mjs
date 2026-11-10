#!/usr/bin/env node
/**
 * M12-G2: four REAL live OMEGA screenshots, keyboard player movement,
 * original painter pixel probes in Chromium. Source imports are DEV-only
 * probes; no teleport/HP override, release unlock or third-party service.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const dir=resolve('qa-omega-protocol-captures');
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const sizes=[['desktop',1440,900,false],['tablet',1024,768,true],
 ['mobile-portrait',390,844,true],['mobile-landscape',844,390,true]];
const rows=[];let failure=0;
for(const [name,w,h,mobile] of sizes){
 const context=await browser.newContext({
  viewport:{width:w,height:h},deviceScaleFactor:1,
  ...(mobile?{isMobile:true,hasTouch:true}:{}),
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('main[data-omega-protocol-internal="true"]')
   .waitFor({timeout:25000});
  await page.locator('.omega-protocol-arena canvas').waitFor({state:'visible'});
  await page.waitForTimeout(520);
  const probe=await page.evaluate(async ({w,h})=>{
   // Import the ACTUAL Vite-served module used by the live OMEGA renderer.
   const field=await import('/src/domain/omega-protocol-field.ts');
   const m=await import('/src/ui/omega-protocol-m12-authored-industrial.ts');
   const plan=field.omegaFieldPlan(20261108,1),quality=m.omegaG2Quality(w,h);
   const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=900;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)return {pass:false,reason:'offscreen real Canvas unavailable'};
   const countInk=([x,y,rw,rh])=>{
    const raw=ctx.getImageData(x,y,rw,rh).data;
    let painted=0,distinct=new Set();
    for(let i=0;i<raw.length;i+=16){
     if(raw[i+3]>8){
      painted++;
      distinct.add([raw[i]>>4,raw[i+1]>>4,raw[i+2]>>4].join(':'));
     }
    }
    return {painted,colors:distinct.size};
   };
   const region=(draw,rect)=>{ctx.clearRect(0,0,1400,900);draw();return countInk(rect);};
   const rear=region(()=>m.drawOmegaG2RearEnvironment(ctx,plan,1.4,quality),[0,0,1400,160]);
   const get=id=>plan.obstacles.find(o=>o.id===id);
   const cargo=region(()=>m.drawOmegaG2NativeFacade(ctx,plan,get('cargo'),1.4,quality),[240,108,170,206]);
   const gangform=region(()=>m.drawOmegaG2NativeFacade(ctx,plan,get('scaffold'),1.4,quality),[565,585,190,210]);
   const hoist=region(()=>m.drawOmegaG2NativeFacade(ctx,plan,get('machine'),1.4,quality),[795,390,155,200]);
   const near=region(()=>m.drawOmegaG2BoundaryRail(ctx,plan,quality),[0,885,1400,15]);
   const parts=m.omegaG2SceneManifest(plan);
   const all={rear,cargo,gangform,hoist,near};
   const identity=parts.some(p=>p.layer==='native-gangform'&&p.sourceId==='scaffold')&&
    parts.some(p=>p.layer==='native-hoist'&&p.sourceId==='machine');
   const artwork=Object.values(all).every(s=>s.painted>=25&&s.colors>=2);
   return {pass:identity&&artwork,parts:parts.map(p=>p.layer),quality,regions:all,
    // Draw probes do not mutate these real native solids.
    nativeSolids:field.omegaFieldNativeTerrain(plan).length};
  },{w,h});
  const area=page.locator('.omega-protocol-arena');
  const before=Number(await area.getAttribute('data-omega-player-x'));
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(470);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(120);
  const after=Number(await area.getAttribute('data-omega-player-x'));
  await page.screenshot({path:dir+'/m12g2-real-scene-'+name+'-'+w+'x'+h+'.png',
   fullPage:false,animations:'disabled'});
  const layout=await page.evaluate(()=>({
   viewport:innerWidth,docWidth:document.documentElement.scrollWidth,
   canvasHeight:document.querySelector('.omega-protocol-arena canvas')?.getBoundingClientRect().height,
  }));
  const pass=probe.pass&&probe.nativeSolids===4&&after>before+2&&
   layout.docWidth<=layout.viewport+3&&layout.canvasHeight>140&&errors.length===0;
  const row={name,w,h,pass,probe,layout,before,after,errors,androidPhysicalQA:false};
  rows.push(row);
  if(!pass)throw Error('M12G2 real Canvas evidence mismatch '+JSON.stringify(row));
  console.log('QA_PASS M12_G2',name,JSON.stringify({
   quality:probe.quality.tier,regions:probe.regions,movedX:after-before,
  }));
 }catch(e){
  failure++;
  if(rows.at(-1)?.name!==name)rows.push({name,w,h,pass:false,error:String(e),errors});
  else {rows.at(-1).pass=false;rows.at(-1).error=String(e);}
  console.error('QA_FAIL M12_G2',name,String(e));
  try{await page.screenshot({path:dir+'/m12g2-FAIL-'+name+'.png'});}catch{}
 }
 await context.close();
}
await browser.close();
await writeFile(dir+'/m12g2-authored-industrial-report.json',JSON.stringify({
 failure,rows,notCommercialArtApproval:true,notAndroidHardwareQA:true,
},null,2));
if(failure)process.exitCode=1;

#!/usr/bin/env node
/** M12-G1: live Canvas industrial-depth screenshots at four real viewports.
 * No debug teleport, production release, profile mutation or paid service.
 * Physical Android performance / final art approvals are separate blockers.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const folder=resolve('qa-omega-protocol-captures');
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const sizes=[
 ['desktop',1440,900,false],
 ['tablet',1024,768,true],
 ['portrait',390,844,true],
 ['landscape',844,390,true],
];
const results=[];
let failures=0;
for(const [label,width,height,mobile] of sizes){
 const context=await browser.newContext({
  viewport:{width,height},deviceScaleFactor:1,
  ...(mobile?{isMobile:true,hasTouch:true}:{}),
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('main[data-omega-protocol-internal="true"]')
   .waitFor({timeout:25000});
  await page.locator('.omega-protocol-arena canvas').waitFor({state:'visible'});
  await page.waitForTimeout(750);
  const arena=page.locator('.omega-protocol-arena');
  const before=Number(await arena.getAttribute('data-omega-player-x'));
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(480);
  await page.keyboard.up('ArrowRight');await page.waitForTimeout(110);
  const after=Number(await arena.getAttribute('data-omega-player-x'));
  const scene=await page.evaluate(()=>{
   const c=document.querySelector('.omega-protocol-arena canvas');
   if(!(c instanceof HTMLCanvasElement))return {pass:false,reason:'missing canvas'};
   const ctx=c.getContext('2d',{willReadFrequently:true});
   if(!ctx)return {pass:false,reason:'canvas 2d unavailable'};
   const colors=new Set();
   // Sample actual frame pixels, not authored asset filenames or CSS only.
   const pixels=ctx.getImageData(0,0,c.width,c.height).data;
   for(let y=12;y<c.height;y+=Math.max(20,Math.floor(c.height/22))){
    for(let x=12;x<c.width;x+=Math.max(20,Math.floor(c.width/22))){
     const i=(y*c.width+x)*4;
     colors.add([pixels[i]>>4,pixels[i+1]>>4,pixels[i+2]>>4].join(':'));
    }
   }
   const r=c.getBoundingClientRect();
   return {pass:colors.size>=12&&r.width>180&&r.height>150,
    distinctColorBins:colors.size,canvas:{w:c.width,h:c.height},
    visualRect:{w:r.width,h:r.height},
    docWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth};
  });
  await page.screenshot({path:folder+'/m12g1-live-depth-'+label+'-'+width+'x'+height+'.png',
   fullPage:false,animations:'disabled'});
  const moved=Number.isFinite(before)&&Number.isFinite(after)&&after>before+2;
  const pass=scene.pass&&moved&&errors.length===0&&
   scene.docWidth<=scene.viewportWidth+3;
  results.push({label,width,height,pass,moved,before,after,scene,errors,
   source:'live OMEGA React Canvas; not final art or Android hardware'});
  if(!pass)throw Error('M12 depth visual QA '+JSON.stringify(results.at(-1)));
  console.log('QA_PASS M12_G1',label,JSON.stringify({moved,colors:scene.distinctColorBins}));
 }catch(error){
  failures++;
  if(results.at(-1)?.label!==label||results.at(-1)?.pass){
   results.push({label,width,height,pass:false,error:String(error),errors});
  }else results[results.length-1].error=String(error);
  console.error('QA_FAIL M12_G1',label,String(error));
  try{await page.screenshot({path:folder+'/m12g1-FAIL-'+label+'.png'});}catch{}
 }
 await context.close();
}
await browser.close();
await writeFile(folder+'/m12g1-industrial-depth-report.json',
 JSON.stringify({failures,results},null,2));
if(failures)process.exitCode=1;

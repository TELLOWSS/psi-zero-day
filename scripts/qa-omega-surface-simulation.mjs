import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const out=resolve(process.env.OMEGA_SURFACE_SIM_DIR||'qa-omega-surface-simulation');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const cases=[['desktop',1440,900,false],['tablet',1024,768,true],['portrait',390,844,true],['landscape',844,390,true]];
const rows=[];
for(let run=1;run<=2;run++)for(const [name,width,height,mobile] of cases){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,...(mobile?{isMobile:true,hasTouch:true}:{})});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaSurfaceReview=1&omegaQaState=zombieAI');
  const arena=page.locator('.omega-protocol-arena');await arena.waitFor({timeout:30000});
  await page.waitForFunction(()=>{
   const a=document.querySelector('.omega-protocol-arena'),z=JSON.parse(a?.getAttribute('data-omega-zombie-telemetry')||'[]');
   return z.length===4&&z.some(x=>x.warnings>0)&&Number(a?.getAttribute('data-omega-player-x'))>0;
  },null,{timeout:30000});
  const before=Number(await arena.getAttribute('data-omega-player-x'));
  await page.keyboard.down('ArrowLeft');await page.waitForTimeout(700);await page.keyboard.up('ArrowLeft');
  const after=Number(await arena.getAttribute('data-omega-player-x'));
  const canvasProbe=await page.evaluate(async ({width,height})=>{
   const field=await import('/src/domain/omega-protocol-field.ts');
   const cam=await import('/src/ui/omega-protocol-camera.ts');
   const scene=await import('/src/ui/omega-quarantine-surface-review.ts');
   const plan=field.omegaFieldPlan(20261108,1),canvas=document.createElement('canvas');
   canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)throw Error('Canvas unavailable');
   const c0=cam.omegaQuarterViewCamera(plan.entry,width,height,1.55);
   const c1=cam.omegaQuarterViewCamera({x:1010,y:675},width,height,1.55);
   let ready=false;for(let i=0;i<100&&!ready;i++){
    ready=scene.drawOmegaHorizonReview(ctx,plan,c0,1.55);
    if(!ready)await new Promise(r=>setTimeout(r,25));
   }
   if(!ready)throw Error('Horizon did not decode');
   const a=ctx.getImageData(0,0,width,height).data;
   ctx.clearRect(0,0,width,height);scene.drawOmegaHorizonReview(ctx,plan,c1,1.55);
   const b=ctx.getImageData(0,0,width,height).data;let changed=0,visible=0;
   for(let i=0;i<a.length;i+=16){if(a[i+3]>8)visible++;if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])+Math.abs(a[i+3]-b[i+3])>12)changed++;}
   const timings=[];for(let i=0;i<20;i++){const t=performance.now();scene.drawOmegaHorizonReview(ctx,plan,i%2?c0:c1,1.55);timings.push(performance.now()-t);}timings.sort((x,y)=>x-y);
   return {visibleSamples:visible,changedSamples:changed,medianMs:timings[10]};
  },{width,height});
  const telemetry=JSON.parse(await arena.getAttribute('data-omega-zombie-telemetry')||'[]');
  await page.screenshot({path:`${out}/${name}-${run}.png`});
  const row={name,run,move:after-before,canvasProbe,telemetry,errors};rows.push(row);
  if(!Number.isFinite(row.move)||row.move>=-2||canvasProbe.visibleSamples<50||canvasProbe.changedSamples<10||errors.length||!telemetry.some(z=>z.warnings>0))process.exitCode=1;
 }catch(error){rows.push({name,run,error:String(error),errors});process.exitCode=1;}
 await context.close();
}
await browser.close();await writeFile(`${out}/report.json`,JSON.stringify({rows,physicalAndroid:false},null,2));
console.log(JSON.stringify({rows,physicalAndroid:false}));

#!/usr/bin/env node
/** M12-G5: ACTUAL native Watch/OMEGA four-viewport E-frame movement evidence.
 * Test-only independent artwork decode and pixel diff, never fake screen
 * actor overlays, player teleport, HP/edit unlock or Android device FPS.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const dir=resolve('qa-omega-protocol-captures');await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const sizes=[['desktop',1440,900,false],['tablet',1024,768,true],
 ['mobile-portrait',390,844,true],['mobile-landscape',844,390,true]];
let failures=0;const records=[];
for(const [name,w,h,mobile] of sizes){
 const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,
  ...(mobile?{isMobile:true,hasTouch:true}:{})});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaM12G5=1&omegaG5VectorStudy=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  const root=page.locator('main[data-omega-protocol-internal="true"]');
  await root.waitFor({timeout:25000});
  await page.locator('[data-omega-silver-preview="ready"]').waitFor({timeout:25000});
  await page.waitForFunction(async()=>{
   const {omegaG5Art}=await import('/src/ui/omega-protocol-m12-g5-art.ts');
   const s=omegaG5Art.status();return s.silverEast===4&&s.infectedDrifter===2;
  },null,{timeout:23000});
  const source=await page.evaluate(async()=>{
   const gfx=await import('/src/ui/omega-protocol-m12-g5-art.ts');
   const approved=await import('/src/ui/omega-protocol-art-slot.ts');
   const paths=[...gfx.OMEGA_G5_SOURCE_ART.silverEast,...gfx.OMEGA_G5_SOURCE_ART.infectedDrifter];
   const sizes=[];
   for(const uri of paths){
    const img=new Image();img.src=uri;await img.decode();
    sizes.push({uri,w:img.naturalWidth,h:img.naturalHeight});
   }
   const ink=async uri=>{
    const img=new Image();img.src=uri;await img.decode();
    const canvas=document.createElement('canvas');canvas.width=384;canvas.height=512;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(img,0,0);return ctx.getImageData(0,0,384,512).data;
   };
   const deltas=[];
   for(let i=0;i<3;i++){
    const [a,b]=await Promise.all([ink(paths[i]),ink(paths[i+1])]);
    let changed=0;
    for(let j=0;j<a.length;j+=16)
     if(Math.abs(a[j]-b[j])+Math.abs(a[j+1]-b[j+1])+
      Math.abs(a[j+2]-b[j+2])+Math.abs(a[j+3]-b[j+3])>90)changed++;
    deltas.push(changed);
   }
   const [a,b]=await Promise.all([ink(paths[4]),ink(paths[5])]);
   let zombieChanged=0;
   for(let j=0;j<a.length;j+=16)
    if(Math.abs(a[j]-b[j])+Math.abs(a[j+1]-b[j+1])+
     Math.abs(a[j+2]-b[j+2])+Math.abs(a[j+3]-b[j+3])>90)zombieChanged++;
   const originalStillVerified=document.querySelector('main')
    ?.getAttribute('data-omega-aira-v2-ready')==='true';
   return {pass:paths.length===6&&sizes.every(s=>s.w===384&&s.h===512)&&
     deltas.every(n=>n>80)&&zombieChanged>80&&originalStillVerified&&
     approved.OMEGA_PROTOCOL_APPROVED_ART===null&&
     approved.OMEGA_PROTOCOL_BINARY_AUDIT_PASSED===false,
    paths,sizes,deltas,zombieChanged,originalStillVerified,
    approved160:false,approved320:false};
  });
  const arena=page.locator('.omega-protocol-arena');
  const beforeX=Number(await arena.getAttribute('data-omega-player-x'));
  await page.keyboard.down('ArrowRight');
  // This screenshot is taken MID-MOVEMENT, not after key release (idle).
  // Slow shared CI can render only 3 Canvas frames in a fixed 690ms slice;
  // these may all land on one genuine gait pose despite >170 world-unit
  // travel. Wait for TWO independently selected real gait frames rather
  // than treating low CI frame throughput as an animation regression.
  await page.waitForTimeout(350);
  // Capture immutable genuine draw evidence AT the instant the condition
  // becomes true. On shared Vite CI a dev-server HMR refresh can replace the
  // module singleton between waitForFunction and a subsequent evaluate(),
  // resetting counters to zero while the live sprite remains visible.
  const proofHandle=await page.waitForFunction(async()=>{
   const {omegaG5Art}=await import('/src/ui/omega-protocol-m12-g5-art.ts');
   const proof=omegaG5Art.evidence();
   return proof.heroDraws>=2&&proof.heroFramesSeen.length>=2
    ?{status:omegaG5Art.status(),evidence:proof}:false;
  },null,{timeout:3000,polling:100});
  const artwork=await proofHandle.jsonValue();
  await proofHandle.dispose();
  const afterX=Number(await arena.getAttribute('data-omega-player-x'));
  await page.screenshot({path:dir+'/m12g5-live-moving-'+name+'-'+w+'x'+h+'.png',
   fullPage:false,animations:'disabled'});
  await page.keyboard.up('ArrowRight');
  const layout=await page.evaluate(()=>({
   width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
   arenaHeight:document.querySelector('.omega-protocol-arena canvas')?.getBoundingClientRect().height??0,
   mode:document.querySelector('main')?.getAttribute('data-omega-m12g5-lab'),
   vectorStudy:document.querySelector('main')?.getAttribute('data-omega-m12g5-vector-study'),
   gate:document.querySelector('main')?.getAttribute('data-omega-real-unlock-eligible'),
  }));
  // The canonical G5 game entry MUST remain the original SHA-verified,
  // painterly 8-direction AIRA; the six new vector poses were visually
  // rejected and are deliberately a second opt-in diagnostic study only.
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaM12G5=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('[data-omega-silver-preview="ready"]').waitFor({timeout:25000});
  await page.waitForTimeout(240);
  const protectedOriginal=await page.evaluate(async()=>{
   const {omegaG5Art}=await import('/src/ui/omega-protocol-m12-g5-art.ts');
   const root=document.querySelector('main');
   const evidence=omegaG5Art.evidence();
   return {pass:root?.getAttribute('data-omega-m12g5-vector-study')==='off'&&
    root.getAttribute('data-omega-aira-v2-ready')==='true'&&
    evidence.heroDraws===0&&evidence.drifterDraws===0,
    evidence,mode:root?.getAttribute('data-omega-m12g5-lab')};
  });
  await page.screenshot({path:dir+'/m12g5-preserved-original-'+name+'-'+w+'x'+h+'.png',
   fullPage:false,animations:'disabled'});
  const pass=protectedOriginal.pass&&source.pass&&artwork.evidence.heroDraws>1&&
   artwork.evidence.heroFramesSeen.length>=2&&
   artwork.evidence.drifterDraws>0&&afterX>beforeX+4&&
   layout.scrollWidth<=layout.width+3&&layout.arenaHeight>140&&
   layout.mode==='source-verified-silver-originals'&&
   layout.vectorStudy==='isolated-unapproved'&&errors.length===0;
  const record={name,w,h,pass,source,artwork,protectedOriginal,layout,movedX:afterX-beforeX,
   errors,physicalAndroidFPS:false,productionArtQA:false};
  records.push(record);
  if(!pass)throw Error('M12G5 actual dynamic actor evidence failure '+JSON.stringify(record));
  console.log('QA_PASS M12_G5',name,JSON.stringify({frames:artwork.evidence.heroFramesSeen,
   drifter:artwork.evidence.drifterDraws,delta:source.deltas,zombieDelta:source.zombieChanged,
   movedX:afterX-beforeX}));
 }catch(e){
  failures++;if(records.at(-1)?.name!==name)records.push({name,w,h,pass:false,error:String(e),errors});
  else{records.at(-1).pass=false;records.at(-1).error=String(e);}
  console.error('QA_FAIL M12_G5',name,String(e));
  try{await page.screenshot({path:dir+'/m12g5-FAIL-'+name+'.png'});}catch{}
 }
 await context.close();
}
await browser.close();
await writeFile(dir+'/m12g5-original-6pose-live-report.json',JSON.stringify({
 failures,records,approvedAira160:false,approvedAiraMasks320:false,
 realAndroidHardwareMeasured:false,commercialArtFinished:false,
},null,2));
if(failures)process.exitCode=1;

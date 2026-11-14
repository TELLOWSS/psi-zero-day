#!/usr/bin/env node
/**
 * M12-G5n: real recovered QA WebP art, browser-loaded into the native
 * Watch/OMEGA DEV-only importers. No synthetic images, no fake SHA checks.
 * 8 real Chromium pages: AIRA(12) & infected(16) × 4 responsive sizes.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const dir=resolve('qa-omega-protocol-captures');
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,
 args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const records=[];let failures=0;
for(const [name,width,height,mobile] of [
 ['desktop',1440,900,false],['tablet',1024,768,true],
 ['portrait',390,844,true],['landscape',844,390,true],
]){
 for(const mode of ['aira','infected']){
  const context=await browser.newContext({viewport:{width,height},
   deviceScaleFactor:1,...(mobile?{hasTouch:true,isMobile:true}:{})});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  try{
   const query=mode==='aira'
    ?'?omegaLab=1&omegaM12G5i=1&omegaQaState=combatGun'
    :'?omegaLab=1&omegaInfectedArtLab=1&omegaQaState=zombieAI';
   await page.goto('http://127.0.0.1:4173/'+query,{waitUntil:'domcontentloaded',timeout:45000});
   await page.locator('main[data-omega-protocol-internal="true"]').waitFor({timeout:25000});
   await page.getByRole('button',{name:'일시정지'}).click();
   if(mode==='aira')
    await page.locator('[data-omega-silver-preview="ready"]').waitFor({timeout:30000});
   const load=page.locator('[data-omega-g5n-load="'+mode+'"]');
   await load.waitFor({timeout:15000});
   await load.click();
   const ready=page.locator(mode==='aira'?'[data-omega-g5i-feedback="ready"]':'[data-omega-infected-feedback="ready"]');
   await ready.waitFor({timeout:45000});
   const proof=await page.evaluate(async(which)=>{
    if(which==='aira'){
     const {omegaG5iActionPreview}=await import('/src/ui/omega-protocol-m12g5i-action-art.ts');
     const c=omegaG5iActionPreview.reviewCards();
     return {files:c.map(x=>x.file),sizes:c.map(x=>[x.width,x.height]),
      ready:c.length===12,origin:'local-GitHub-qa-source'};
    }
    const {omegaInfectedCandidateReview}=await import('/src/ui/omega-infected-candidate-review.ts');
    const c=omegaInfectedCandidateReview.reviewCards();
    return {files:c.map(x=>x.file),sizes:c.map(x=>[x.width,x.height]),
     ready:c.length===16,origin:'local-GitHub-qa-source'};
   },mode);
   if(!proof.ready||proof.files.length!==(mode==='aira'?12:16))
    throw Error('All original real source frames were not imported: '+JSON.stringify(proof));
   const open=page.locator('[data-omega-g5k-open="'+mode+'"]');
   if(!(await open.isEnabled()))throw Error('Art inspector did not unlock from genuine verified sources');
   await open.click();
   const dialog=page.locator('[data-omega-g5k-audit="'+mode+'"]');
   await dialog.waitFor({timeout:15000});
   const groups=mode==='aira'?['fire','dash','hit']:['basic','runner','armored','elite'];
   const seen=[];
   for(const group of groups){
    await dialog.locator('[data-omega-g5l-group="'+group+'"]').click();
    for(let i=0;i<4;i++){
     await dialog.locator('[data-omega-g5l-pose="'+i+'"]').click();
     await page.waitForFunction(({mode,group,i})=>{
      const node=document.querySelector('[data-omega-g5k-audit="'+mode+'"]');
      const images=[...node.querySelectorAll('.omega-art-audit-card .omega-art-audit-stage img')];
      const desired=(mode==='aira'?'aira-east-':'')+group+'-'+i+'.webp';
      return node.querySelector('[data-omega-g5l-frame]')?.getAttribute('data-omega-g5l-frame')===String(i)&&
       node.querySelector('.omega-art-audit-card:last-child')?.getAttribute('data-omega-g5k-frame')===desired&&
       images.length===2&&images.every(img=>img.complete&&img.naturalWidth>=384&&img.naturalHeight>=512);
     },{mode,group,i},{timeout:12000,polling:100});
     seen.push((mode==='aira'?'aira-east-':'')+group+'-'+i+'.webp');
    }
    await page.screenshot({path:dir+'/m12g5n-'+mode+'-'+name+'-'+group+'.png',
      fullPage:false,animations:'disabled'});
   }
   if(new Set(seen).size!==(mode==='aira'?12:16))
    throw Error('Real art frame count invalid '+seen.length);
   const frozen=await page.getByRole('button',{name:'계속하기'}).isVisible().catch(()=>false);
   if(!frozen)throw Error('Native Watch did not remain paused under reviewer');
   await page.keyboard.press('Escape');
   await dialog.waitFor({state:'detached',timeout:10000});
   const geometry=await page.evaluate(()=>({
    viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
    openReviewCount:document.querySelectorAll('[data-omega-g5k-audit]').length,
   }));
   if(geometry.documentWidth>geometry.viewport+3||geometry.openReviewCount||errors.length)
    throw Error('Layout or client console failed '+JSON.stringify({geometry,errors}));
   records.push({name,mode,width,height,pass:true,count:seen.length,files:seen,
    proof,stillPaused:frozen,geometry,errors,artApproved:false});
   console.log('QA_PASS M12_G5N',mode,name,seen.length,'genuine files');
  }catch(error){
   failures++;records.push({name,mode,width,height,pass:false,error:String(error),errors});
   console.error('QA_FAIL M12_G5N',mode,name,String(error));
   try{await page.screenshot({path:dir+'/m12g5n-FAIL-'+mode+'-'+name+'.png'});}catch{}
  }
  await context.close();
 }
}
await browser.close();
await writeFile(dir+'/m12g5n-real-28-source-review-report.json',
 JSON.stringify({failures,records,verifiedByExistingImporter:true,humanArtApproval:false,
  independentlyPaintedArtApproval:false,mainMerged:false,productionDeployed:false},null,2));
if(failures)process.exitCode=1;

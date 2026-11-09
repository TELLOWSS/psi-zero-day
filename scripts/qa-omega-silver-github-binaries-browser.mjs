#!/usr/bin/env node
/**
 * Source-backed Chromium proof: the actual NINE original user-selected
 * silver AIRA/M01 WebP binaries committed to this PR, NOT synthetic fixtures.
 * The app's real OMEGA Watch-backed renderer and two-game Reignition home
 * preview are tested through dev-only ?omegaSilverPreview=repo.
 *
 * Not release approval. NW and diagonal viewpoints still need art review;
 * independent 8-angle production movement assets remain absent.
 * Desktop/mobile viewport emulation != real Android device certification.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
const base='http://127.0.0.1:4173',out=resolve('qa-omega-protocol-captures');
const headings=['E','SE','S','SW','W','NW','N','NE'];
await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile('public/omega-canonical-art-review/roster.json','utf8'));
if(manifest.stage!=='review_only'||manifest.production_approved!==false||
   manifest.main_games.join('|')!=='SIGNAL GUARD|SIGNAL WATCH')
 throw Error('Canonical roster approval guard invalid');
const fingerprints=[];
for(const slot of [...headings,'M01']){
 const path=slot==='M01'?'public/assets/omega/canonical-review/male/m01.webp':
  'public/assets/omega/canonical-review/aira-v2/'+slot.toLowerCase()+'.webp';
 const b=await readFile(path);
 const sha=createHash('sha256').update(b).digest('hex');
 if(sha!==manifest.sha256_by_slot[slot])throw Error('Original git binary SHA256 mismatch '+slot);
 if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')
  throw Error('Invalid original source image '+slot);
 fingerprints.push({slot,sha256:sha,size:b.length});
}
if(new Set(fingerprints.map(x=>x.sha256)).size!==9)
 throw Error('Direction/male source duplicate, not nine originals');
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const errors=[],screens=[];
let report={pass:false};
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
page.on('pageerror',e=>errors.push(String(e)));
const viewports=[
 ['desktop-1440x900',1440,900],
 ['phone-390x844',390,844],
 ['landscape-844x390',844,390],
 ['tablet-820x1180',820,1180],
];
try{
 // Verify the review room uses original GitHub images automatically,
 // without ever accepting an unverified fake image from local storage.
 await page.goto(base+'/omega-canonical-art-review/index.html',
  {waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('#repoBattle').waitFor({timeout:15000});
 if(await page.locator('#repoBattle').isDisabled())
  throw Error('Canonical source direct preview not enabled');
 await page.locator('#repoBattle').click();
 await page.waitForURL(/omegaSilverPreview=repo/,{timeout:25000});
 await page.locator('[data-omega-silver-preview="ready"]').waitFor({timeout:25000});
 await page.locator('.omega-protocol-lab[data-omega-aira-v2-ready="true"]')
  .waitFor({timeout:25000});
 for(const [name,width,height] of viewports){
  await page.setViewportSize({width,height});
  await page.waitForTimeout(350);
  const size=await page.evaluate(()=>({
   width:innerWidth,height:innerHeight,
   scrollWidth:document.documentElement.scrollWidth,
   canvases:document.querySelectorAll('canvas').length,
   preview:document.querySelector('.omega-protocol-lab')?.getAttribute('data-omega-silver-preview'),
   airaReady:document.querySelector('.omega-protocol-lab')?.getAttribute('data-omega-aira-v2-ready'),
  }));
  if(size.scrollWidth>width+12)throw Error('Horizontal layout overflow '+name+' '+JSON.stringify(size));
  if(size.preview!=='ready'||size.airaReady!=='true'||size.canvases===0)
   throw Error('Original AIRA source not active in native Canvas '+name+' '+JSON.stringify(size));
  const filename='silver-ORIGINAL-GITHUB-'+name+'.png';
  await page.screenshot({path:resolve(out,filename),fullPage:true});
  screens.push({viewport:name,width,height,filename,realSource: true,engine:'OMEGA / SIGNAL WATCH native wrapper'});
 }
 // Direct original silver art on the two-game home — no fake screenshots.
 await page.setViewportSize({width:1440,height:900});
 await page.goto(base+'/?omegaSilverPreview=repo',
  {waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('.rg-home[data-omega-silver-preview="ready"]')
  .waitFor({timeout:25000});
 const home=await page.locator('body').innerText();
 if(!home.includes('시그널 가드')||!home.includes('시그널 워치'))
  throw Error('Original two main games not retained in silver review');
 const hero=page.locator('.rg-aira-v2');
 const heroSrc=await hero.getAttribute('src');
 if(!heroSrc?.startsWith('blob:'))throw Error('Main silver heroine is not the hashed source WebP');
 await page.waitForFunction(()=>{const a=document.querySelector('.rg-aira-v2');
  return a instanceof HTMLImageElement&&a.complete&&a.naturalWidth===384&&a.naturalHeight===512;},
  undefined,{timeout:15000});
 await page.screenshot({path:resolve(out,'silver-ORIGINAL-GITHUB-main-1440x900.png'),fullPage:true});
 screens.push({viewport:'main-1440x900',filename:'silver-ORIGINAL-GITHUB-main-1440x900.png',
  realSource:true,modeLabels:['SIGNAL GUARD','SIGNAL WATCH']});
 // M01 is a separate neutral design candidate, not a playable eight-way
 // game character. Users may compare its original source on this DEV home.
 const maleButton=page.getByRole('button',{name:'M01 · 남성 후보'});
 await maleButton.waitFor({timeout:15000});
 if(await maleButton.isDisabled())throw Error('Real GitHub male M01 portrait not available in DEV review');
 await maleButton.click();
 await page.waitForFunction((original)=>{
  const image=document.querySelector('.rg-aira-v2');
  const button=[...document.querySelectorAll('.rg-silver-character-selector button')]
   .find(b=>b.textContent?.includes('M01'));
  return image instanceof HTMLImageElement&&
   button?.getAttribute('aria-pressed')==='true'&&
   image.getAttribute('src')?.startsWith('blob:')&&
   image.getAttribute('src')!==original;
 },heroSrc,{timeout:14000});
 const maleSrc=await hero.getAttribute('src');
 if(!maleSrc?.startsWith('blob:')||maleSrc===heroSrc)
  throw Error('M01 original artwork is not a unique cached image');
 await page.waitForFunction(()=>{const a=document.querySelector('.rg-aira-v2');
  return a instanceof HTMLImageElement&&a.complete&&
   a.naturalWidth===384&&a.naturalHeight===512;},
  undefined,{timeout:15000});
 await page.screenshot({path:resolve(out,'OMEGA-M01-ORIGINAL-GITHUB-home-1440x900.png'),fullPage:true});
 screens.push({viewport:'main-M01-1440x900',filename:'OMEGA-M01-ORIGINAL-GITHUB-home-1440x900.png',
  realSource:true,designCandidateOnly:true});
 await page.getByRole('button',{name:'AIRA V2'}).click();
 await page.waitForFunction(original=>{
  const img=document.querySelector('.rg-aira-v2');
  return img instanceof HTMLImageElement&&img.getAttribute('src')===original;
 },heroSrc,{timeout:14000});
 if(await hero.getAttribute('src')!==heroSrc)
  throw Error('Silver AIRA portrait did not return after male review');
 // On mobile this is a comparison toolbar, not a game-mode selector.
 await page.setViewportSize({width:390,height:844});
 const bannerSize=await page.locator('.rg-silver-review-banner').evaluate(el=>{
  const r=el.getBoundingClientRect();
  return {left:r.left,right:r.right,viewport:innerWidth};
 });
 if(bannerSize.left<0||bannerSize.right>bannerSize.viewport+1)
  throw Error('Mobile male/AIRA art comparison controls overflow width');
 await page.screenshot({path:resolve(out,'silver-ORIGINAL-GITHUB-main-MOBILE-390x844.png'),fullPage:true});
 screens.push({viewport:'main-390x844',filename:'silver-ORIGINAL-GITHUB-main-MOBILE-390x844.png',
  realSource:true,modeLabels:['SIGNAL GUARD','SIGNAL WATCH']});
 // A replaced response in the repo MUST fail closed before drawing.
 await page.route('**/assets/omega/canonical-review/aira-v2/nw.webp',r=>
  r.fulfill({status:200,contentType:'image/webp',body:Buffer.from('forged-silver-binary')}));
 await page.goto(base+'/?omegaLab=1&omegaSilverPreview=repo',
  {waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('[data-omega-silver-preview="failed"]').waitFor({timeout:25000});
 const blocked=await page.locator('.omega-protocol-lab').getAttribute('data-omega-silver-preview');
 if(blocked!=='failed')throw Error('Tampered NW source bypassed SHA gate');
 report={
  pass:errors.length===0,originalGitBinaries:9,
  originalFileHashesMatched:true,realSourceReview:true,
  nativeWatchBattleCanvas:true,twoMainGameHome:true,
  hashTamperRejected:true,desktopAndMobileViewportScreenshots:screens.length,
  original8DirectionArtApproved:false,original160FrameArtApproved:false,
  realAndroidDeviceTested:false,productionDeploymentAuthorized:false,
  screenshotsAreSynthetic:false,
  distinction:'User original 9 images; real source/renderer; viewport emulation only',
  screens,fingerprints,errors,
 };
 console.log(report.pass?'QA_PASS':'QA_FAIL','Original silver AIRA committed binary browser proof',
  JSON.stringify({pass:report.pass,files:9,screens:screens.length,tamperDenied:true,
   nativeBattle:true,twoGameHome:true,artApproved:false,errors}));
 if(errors.length)process.exitCode=1;
}catch(e){report={pass:false,error:String(e),screens,fingerprints,errors};
 process.exitCode=1;console.error('QA_EXCEPTION','original silver review',String(e));
}finally{
 await writeFile(resolve(out,'silver-ORIGINAL-GITHUB-evidence.json'),JSON.stringify(report,null,2));
 await page.close();await browser.close();
}

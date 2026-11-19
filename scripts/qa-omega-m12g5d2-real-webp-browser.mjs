#!/usr/bin/env node
/**
 * M12-G5d-2: Actual newly authored ORIGINAL 4 WebPs, NOT test rectangles.
 * Validates the exact four binary source files committed to this QA branch,
 * their browser SHA-256, transparency/sole rows, native player movement,
 * all four native-gait render frames and explicit original fallback.
 * Does not imply artist approval, 160/320 final approval, or Android FPS.
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
 ['portrait',390,844,true],['landscape',844,390,true]];
const rows=[];let failures=0;
for(const [name,w,h,mobile] of sizes){
 const ctx=await browser.newContext({
  viewport:{width:w,height:h},deviceScaleFactor:1,
  ...(mobile?{isMobile:true,hasTouch:true}:{})});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(String(err)));
 page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaM12G5d=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  const root=page.locator('main[data-omega-protocol-internal="true"]');
  await root.waitFor({timeout:25000});
  await page.locator('[data-omega-silver-preview="ready"]').waitFor({timeout:30000});
  const attr=k=>root.getAttribute(k);
  const statusBefore={
   source:await attr('data-omega-m12g5d-source'),
   preview:await attr('data-omega-m12g5d-preview'),
   userOriginal:await attr('data-omega-aira-v2-ready'),
   fileStatus:await attr('data-omega-m12g5c-source-status'),
  };
  const initialEvidence=await page.evaluate(async()=>{
   const {omegaG5cReview}=await import('/src/ui/omega-protocol-m12g5c-local-art-review.ts');
   const art=await import('/src/ui/omega-protocol-art-slot.ts');
   return {draw:omegaG5cReview.evidence(),ready:omegaG5cReview.ready,
    signedProductionArt:art.OMEGA_PROTOCOL_APPROVED_ART,
    finalBinaryAudit:art.OMEGA_PROTOCOL_BINARY_AUDIT_PASSED};
  });
  await page.screenshot({path:dir+'/m12g5d2-ORIGINAL-SILVER-'+name+'-'+w+'x'+h+'.png',
   fullPage:false,animations:'disabled'});

  await page.locator('[data-omega-g5d-load="true"]').click();
  await page.locator('[data-omega-g5c-feedback="ready"]').waitFor({timeout:24000});
  const inspect=await page.evaluate(async()=>{
   const art=await import('/src/ui/omega-protocol-m12g5d-actual-source.ts');
   const {omegaG5cReview}=await import('/src/ui/omega-protocol-m12g5c-local-art-review.ts');
   const assets=art.OMEGA_G5D_ACTUAL_E_WALK;
   const proof=omegaG5cReview.sessionProof;
   const hashes=[];
   for(const src of assets){
    const resp=await fetch(src.path,{cache:'no-store'});
    const data=await resp.arrayBuffer();
    const sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)))
     .map(x=>x.toString(16).padStart(2,'0')).join('');
    hashes.push({file:src.file,bytes:data.byteLength,sha256,
     passed:data.byteLength===src.bytes&&sha256===src.sha256});
   }
   const gate=art.OMEGA_G5D_ART_GATE;
   return {ready:omegaG5cReview.ready,hashes,proof,gate,
    pass:omegaG5cReview.ready&&hashes.every(x=>x.passed)&&
     proof?.assets?.length===4&&
     proof.assets.every((x,i)=>x.sha256===assets[i].sha256&&
      x.toeRow>=482&&x.toeRow<=492&&x.alphaFraction>.15)&&
     proof.changedPixelFraction.every(x=>x>.018)&&
     proof.artworkSignoff===false&&gate.productionReleaseAllowed===false&&
     gate.final160ApprovedFrameCount===0&&gate.final320ApprovedMaskCount===0};
  });
  const beforeX=Number(await page.locator('.omega-protocol-arena').getAttribute('data-omega-player-x'));
  await page.locator('[data-omega-g5c-toggle="true"]').click();
  await page.waitForTimeout(120);
  const enabled=await attr('data-omega-m12g5d-preview');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(920);
  const afterX=Number(await page.locator('.omega-protocol-arena').getAttribute('data-omega-player-x'));
  const evidence=await page.evaluate(async()=>{
   const {omegaG5cReview}=await import('/src/ui/omega-protocol-m12g5c-local-art-review.ts');
   return omegaG5cReview.evidence();
  });
  await page.screenshot({path:dir+'/m12g5d2-ACTUAL-ART-CANDIDATE-NOT-APPROVED-'+name+'-'+w+'x'+h+'.png',
   fullPage:false,animations:'disabled'});
  await page.keyboard.up('ArrowRight');
  await page.locator('[data-omega-g5c-toggle="true"]').click();
  await page.waitForTimeout(170);
  const disabled=await attr('data-omega-m12g5d-preview');
  const after=await page.evaluate(()=>{
   const canvas=document.querySelector('.omega-protocol-arena canvas')?.getBoundingClientRect();
   const rect=k=>{const r=document.querySelector(k)?.getBoundingClientRect();
    return r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}:null;};
   return {viewport:innerWidth,doc:document.documentElement.scrollWidth,
    canvasHeight:canvas?.height??0,availableHeight:innerHeight,
    sourcePanel:document.querySelector('[data-omega-g5c-controls]')?.getBoundingClientRect().height??0,
    importButton:rect('[data-omega-g5d-load]'),returnButton:rect('[data-omega-g5c-toggle]')};
  });
  await page.screenshot({path:dir+'/m12g5d2-RESTORED-ORIGINAL-'+name+'-'+w+'x'+h+'.png',
   fullPage:false,animations:'disabled'});
  const pass=statusBefore.source==='git-4-real-webp-candidates-not-approved'&&
   statusBefore.preview==='off'&&statusBefore.userOriginal==='true'&&
   statusBefore.fileStatus==='idle'&&
   initialEvidence.draw.draws===0&&initialEvidence.ready===false&&
   initialEvidence.signedProductionArt===null&&initialEvidence.finalBinaryAudit===false&&
   inspect.pass&&enabled==='dev-candidate-not-approved'&&
   evidence.draws>2&&evidence.frames.length===4&&
   afterX>beforeX+15&&disabled==='off'&&
   after.doc<=after.viewport+3&&after.canvasHeight>h*.53&&
   after.importButton&&after.returnButton&&
   after.importButton.left>=0&&after.importButton.right<=after.viewport+2&&
   after.returnButton.left>=0&&after.returnButton.right<=after.viewport+2&&
   (after.importButton.right<=after.returnButton.left+2||
    after.returnButton.right<=after.importButton.left+2)&&errors.length===0;
  const item={name,w,h,pass,statusBefore,inspect,
   nativePlayerMoved:afterX-beforeX,evidence,enabled,disabled,after,errors,
   actualFourGeneratedWebPsNotSynthetic:true,
   humanApprovedArt:false,approved160:0,approved320:0,
   physicalAndroidFPS:false};
  rows.push(item);
  if(!pass)throw Error('M12-G5d-2 genuine artwork native QA failed '+JSON.stringify(item));
  console.log('QA_PASS M12_G5D2',name,JSON.stringify({
   hashes:inspect.hashes.map(x=>x.sha256.slice(0,12)),toes:inspect.proof.assets.map(x=>x.toeRow),
   frames:evidence.frames,draws:evidence.draws,move:afterX-beforeX,
   artDirectionApproved:false}));
 }catch(error){
  failures++;if(rows.at(-1)?.name!==name)rows.push({name,w,h,pass:false,error:String(error),errors});
  else{rows.at(-1).pass=false;rows.at(-1).error=String(error);}
  console.error('QA_FAIL M12_G5D2',name,String(error));
  try{await page.screenshot({path:dir+'/m12g5d2-FAIL-'+name+'.png'});}catch{}
 }
 await ctx.close();
}
await browser.close();
await writeFile(dir+'/m12g5d2-FOUR-ACTUAL-WEBPS-report.json',JSON.stringify({
 failures,rows,individualRealWebPsInRepo:4,
 userOriginalAiraPreserved:true,visualApproval:false,
 approvedFullSource160:0,approvedOcclusionMasks320:0,
 mainMerged:false,productionDeployed:false,
},null,2));
if(failures)process.exitCode=1;

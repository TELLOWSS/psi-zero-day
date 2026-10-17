// Live commercial title / single campaign / portrait-story regression.
// No staging shortcuts, hidden state mutation or forced screen rotation.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const root=process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4173';
const out=path.resolve(process.env.PSI_TITLE_ARTIFACT_DIR||'artifacts/title-defense-first');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const rows=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(30000);
  try{
   await page.goto(root,{waitUntil:'domcontentloaded'});
   await page.locator('button.is-story-entry').waitFor();
   const entryCount=await page.locator('button.is-story-entry').count();
   const splitCount=await page.locator('button.is-episode02-entry').count();
   if(entryCount!==1||splitCount!==0)throw new Error('Story must have one campaign tile: '+entryCount+'/'+splitCount);
   await page.screenshot({path:path.join(out,width+'x'+height+'-single-story-hub.png')});
   await page.locator('button.is-story-entry').click();
   await page.locator('.episode-cold-open-cta').click();
   const story=page.locator('[data-story-player="cinematic"]');await story.waitFor();
   const look=await page.evaluate(()=>{
     const box=s=>document.querySelector(s)?.getBoundingClientRect();
     const panel=box('.play-panel'),text=document.querySelector('.dialogue-text');
     const actor=document.querySelectorAll('.episode-immersive-character').length;
     return {panelHeight:panel?.height,textHeight:text?.clientHeight,textScroll:text?.scrollHeight,
       sceneHeight:box('.episode-immersive-scene')?.height,
       toggle:!!document.querySelector('.story-view-toggle'),
       actors:actor,overflow:document.documentElement.scrollWidth>innerWidth+2};
   });
   if(!look.toggle||look.panelHeight> Math.max(height<=440?120:150,150) || look.overflow)throw new Error('Cinema UI contract '+JSON.stringify(look));
   if((look.textScroll??0)>(look.textHeight??0)+2)throw new Error('Subtitle page was clipped '+JSON.stringify(look));
   await page.screenshot({path:path.join(out,width+'x'+height+'-story-cinema.png')});
   rows.push({width,height,entryCount,splitCount,look,errors});
   if(errors.length)throw new Error('Browser errors: '+errors.join('; '));
   console.log('PASS unified story '+width+'x'+height);
  }finally{await page.close()}
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({sha:process.env.GITHUB_SHA??null,rows},null,2)+'\n');
}finally{await browser.close()}

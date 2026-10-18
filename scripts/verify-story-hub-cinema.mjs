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
   const entryBox=await page.locator('button.is-story-entry').boundingBox();
   // Director-led home: its portrait key art must own the first viewport.
   // Navigation lives on a real 44px scroll CTA; never squash key art for the tile.
   if(width===390){
     const hero=await page.locator('.hub-cinematic-intro').boundingBox();
     const reveal=page.locator('.hub-reveal-modes');
     const revealBox=await reveal.boundingBox();
     if(!hero||hero.height<height*.75)throw new Error('Main heroine key art was covered by premature mode cards: '+JSON.stringify(hero));
     if(!entryBox||entryBox.y<height*.985)throw new Error('Mode cards enter first screen and cover the portrait key art: '+JSON.stringify(entryBox));
     if(!revealBox||revealBox.height<44||revealBox.y+revealBox.height>height+2)throw new Error('Accessible game selection scroll cue missing: '+JSON.stringify(revealBox));
     const backdrop=await page.locator('.commercial-title-backdrop').evaluate(async img=>{
       await img.decode();
       return {width:img.naturalWidth,height:img.naturalHeight,opacity:Number(getComputedStyle(img).opacity)};
     });
     if(backdrop.width<900||backdrop.height<1500||backdrop.opacity<.98)throw new Error('Premium portrait background missing: '+JSON.stringify(backdrop));
     await page.screenshot({path:path.join(out,'390x844-art-first-before-menu.png'),animations:'disabled'});
     await reveal.click();
     const modeBox=await page.locator('#psi-game-modes').boundingBox();
     if(!modeBox||modeBox.y>height*.60||modeBox.y+modeBox.height<0)throw new Error('Game choice scroll link did not bring actions into view '+JSON.stringify(modeBox));
   }
   const splitCount=await page.locator('button.is-episode02-entry').count();
   const art=await page.locator('button.is-story-entry img.commercial-title-action-art').evaluate(async img=>{
     await img.decode();
     return {src:new URL(img.src).pathname,width:img.naturalWidth,height:img.naturalHeight};
   });
   if(!art.src.endsWith('/gate-dawn.webp')||art.width<1200||art.height<700)throw new Error('Story campaign card art missing '+JSON.stringify(art));
   if(entryCount!==1||splitCount!==0)throw new Error('Story must have one campaign tile: '+entryCount+'/'+splitCount);
   await page.screenshot({path:path.join(out,width+'x'+height+'-single-story-hub.png'),animations:'disabled'});
   await page.locator('button.is-story-entry').click();
   await page.locator('.episode-cold-open-cta').click();
   const story=page.locator('[data-story-player="cinematic"]');await story.waitFor();
   // A "screen rendered" without its decoded scene plate is NOT a valid screenshot.
   await page.waitForFunction(()=>{
     const bg=document.querySelector('.episode-immersive-background');
     return bg instanceof HTMLImageElement&&bg.complete&&bg.naturalWidth>0&&
       Number(getComputedStyle(bg).opacity)>.95;
   },null,{timeout:20000});
   const look=await page.evaluate(()=>{
     const box=s=>document.querySelector(s)?.getBoundingClientRect();
     const panel=box('.play-panel'),text=document.querySelector('.dialogue-text');
     const actor=document.querySelectorAll('.episode-immersive-character').length;
     const actorBox=box('.episode-immersive-character');const sceneBox=box('.episode-immersive-scene');
     return {panelHeight:panel?.height,textHeight:text?.clientHeight,textScroll:text?.scrollHeight,
       sceneHeight:box('.episode-immersive-scene')?.height,
       toggle:!!document.querySelector('.story-view-toggle'),
       actors:actor,actorY:actorBox?.top,sceneY:sceneBox?.top,
       popup:!!document.querySelector('.story-orientation-hint'),
       overflow:document.documentElement.scrollWidth>innerWidth+2};
   });
   if(!look.toggle||look.panelHeight> Math.max(height<=440?120:150,150) || look.overflow||look.popup)throw new Error('Cinema UI contract '+JSON.stringify(look));
   if(height<=440 && (look.actorY??0)<(look.sceneY??0)+35)throw new Error('Landscape cast is floating near the header '+JSON.stringify(look));
   if((look.textScroll??0)>(look.textHeight??0)+2)throw new Error('Subtitle page was clipped '+JSON.stringify(look));
   await page.screenshot({path:path.join(out,width+'x'+height+'-story-cinema.png'),animations:'disabled'});
   rows.push({width,height,entryCount,splitCount,look,errors});
   if(errors.length)throw new Error('Browser errors: '+errors.join('; '));
   console.log('PASS unified story '+width+'x'+height);
  }finally{await page.close()}
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({sha:process.env.GITHUB_SHA??null,rows},null,2)+'\n');
}finally{await browser.close()}

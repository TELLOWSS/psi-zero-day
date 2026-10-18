// Test the approved deployed v7 art-first launcher, not historical SVG suggestions.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const base=process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4173';
const out='artifacts/brand-mobile-hierarchy';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const rows=[];
try {
 for(const [width,height] of [[1440,900],[1024,768],[390,844],[360,640],[320,568],[430,932],[844,390],[740,360]]){
  for(const reducedMotion of ['no-preference','reduce']){
   const page=await browser.newPage({viewport:{width,height},reducedMotion,serviceWorkers:'block'});
   const errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.setDefaultTimeout(15000);
   try {
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.locator('.commercial-title-home[data-title-layout="MODE_SELECT_V11"]').waitFor();
    const portrait=width<height&&width<=600;
    const art=await page.locator('.commercial-title-backdrop').evaluate(async img=>{
      await img.decode();
      return {path:new URL(img.currentSrc).pathname,width:img.naturalWidth,
       height:img.naturalHeight,opacity:Number(getComputedStyle(img).opacity)};
    });
    const first=await page.evaluate(()=>{
      const rect=q=>{const el=document.querySelector(q);if(!el)return null;
       const b=el.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom}};
      return {hero:rect('.hub-cinematic-intro'),jump:rect('.hub-reveal-modes'),
       cards:['.is-story-entry','.is-defense-entry','.is-survivors-entry'].map(rect),
       split:document.querySelectorAll('.is-episode02-entry').length,
       overflow:document.documentElement.scrollWidth>innerWidth+2};
    });
    if(!art.path.includes('home-new-psi')||art.width<900||art.height<700||art.opacity<.98)
      throw Error('Original main hero art missing: '+JSON.stringify(art));
    if(first.cards.some(b=>!b||b.width<150||b.height<44)||first.split||first.overflow||!first.jump||first.jump.height<44)
      throw Error('Mode cards/scroll cue invalid: '+JSON.stringify(first));
    if(portrait&&(first.hero.height<height*.74||first.cards[0].y<height*.68||
      first.jump.y<0||first.jump.bottom>height+4))
      throw Error('Mode cards hide portrait art or game jump is missing: '+JSON.stringify(first));
    if([390,844,1440].includes(width))
      await page.screenshot({path:path.join(out,width+'x'+height+'-'+reducedMotion+'-art-first.png')});
    await page.locator('.hub-reveal-modes').click();
    const after=await page.evaluate(()=>{
      const b=document.querySelector('#psi-game-modes').getBoundingClientRect();
      return {top:b.top,bottom:b.bottom,width:b.width,scrollY:window.scrollY};
    });
    if(after.top>height*.72||after.bottom<=0||after.width<Math.min(width*.7,350))
      throw Error('Game mode jump failed: '+JSON.stringify(after));
    const images=await page.locator('#psi-game-modes .commercial-title-action-art')
      .evaluateAll(async list=>Promise.all(list.map(async img=>{
       await img.decode();return {w:img.naturalWidth,h:img.naturalHeight};
      })));
    if(images.length<3||images.some(x=>x.w<1000||x.h<700))
      throw Error('Game card key-art not decoded: '+JSON.stringify(images));
    if([390,844,1440].includes(width))
      await page.screenshot({path:path.join(out,width+'x'+height+'-'+reducedMotion+'-menu.png')});
    rows.push({width,height,reducedMotion,art,first,after,images,errors,pass:!errors.length});
    if(errors.length)throw Error('Browser errors: '+errors.join(';'));
    console.log('PASS current full-art launcher '+width+'x'+height+' '+reducedMotion);
   }catch(e){
    rows.push({width,height,reducedMotion,pass:false,error:String(e),errors});
    console.error(e);throw e;
   }finally{await page.close()}
  }
 }
}finally{
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({scope:'CURRENT_USER_REQUESTED_V7_ART_NOT_HISTORICAL_B2_APPROVAL',rows},null,2));
 await browser.close();
}

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
   await page.goto(root+(root.includes('?')?'&':'?')+'home=cinematic',{waitUntil:'domcontentloaded'});
   const home=page.locator('main.rg-home');
   await home.waitFor();
   if(width===1440&&height===900){
     const control=page.getByRole('button',{name:'게임 설정 열기'});
     await control.click();
     const dialog=page.getByRole('dialog',{name:'게임·화면 설정'});
     await dialog.waitFor({state:'visible'});
     if(!(await page.evaluate(()=>document.activeElement?.textContent?.includes('닫기'))))throw new Error('Settings initial focus is missing');
     await page.keyboard.press('Escape');
     await dialog.waitFor({state:'detached'});
     if(!(await control.evaluate(el=>document.activeElement===el)))throw new Error('Settings did not restore opener focus');
   }
   const designs=['cinematic','operations','terminal','elite'];
   const choices=await page.locator('.rg-theme-picker button').count();
   if(choices!==4)throw new Error('Four selectable title designs were not rendered: '+choices);
   const launchers=page.locator('button.rg-card');
   if(await launchers.count()!==2)throw new Error('Guard and Watch entry cards missing');
   if(await page.locator('.rg-story-button').count()!==1||await page.locator('.rg-breaker-link').count()!==1)
    throw new Error('Story or Breaker entry is missing');
   if(width===390){
     const hero=await page.locator('.rg-hero').boundingBox();
     const headline=await page.locator('.rg-hero h1').boundingBox();
     const nav=await page.locator('.rg-header').boundingBox();
     if(!hero||hero.height<height*.55||!headline||headline.height===0)
       throw new Error('Portrait hero / welcome message missing: '+JSON.stringify({hero,headline}));
     if(!nav||nav.height>90)throw new Error('Phone header wrapped into multiple rows: '+JSON.stringify(nav));
     const compactHeader=await page.evaluate(()=>{
      const summary=document.querySelector('.rg-appearance summary'),settings=document.querySelector('.rg-header-tools button:last-child'),brand=document.querySelector('.rg-brand');
      const rect=el=>el?.getBoundingClientRect();
      return {themeFont:summary?getComputedStyle(summary).fontSize:null,
       settingsFont:settings?getComputedStyle(settings).fontSize:null,
       brandRight:rect(brand)?.right??0,themeLeft:rect(summary)?.left??0,
       themeRight:rect(summary)?.right??0,settingsLeft:rect(settings)?.left??0,
       settingsRight:rect(settings)?.right??0};
     });
     if(compactHeader.themeFont!=='0px'||compactHeader.settingsFont!=='0px'||
       compactHeader.brandRight>compactHeader.themeLeft+2||
       compactHeader.themeRight>compactHeader.settingsLeft+2||
       compactHeader.settingsRight>width+1)
       throw new Error('Premium phone header controls overlap: '+JSON.stringify(compactHeader));
     const dock=await page.locator('.rg-mobile-dock').evaluate(el=>({
       position:getComputedStyle(el).position,
       visible:getComputedStyle(el).display!=='none',
       bottom:el.getBoundingClientRect().bottom,
       buttons:[...el.querySelectorAll('button')].map(button=>({width:button.getBoundingClientRect().width,height:button.getBoundingClientRect().height,disabled:button.disabled}))
     }));
     if(dock.position!=='fixed'||!dock.visible||Math.abs(dock.bottom-height)>3||dock.buttons.length!==2||
       dock.buttons.some(button=>button.disabled||button.width<130||button.height<44))
       throw new Error('Premium mobile Guard/Watch quick launcher fails touch contract: '+JSON.stringify(dock));
     const headerOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
     if(headerOverflow){
      const offenders=await page.evaluate(()=>[...document.querySelectorAll('main.rg-home *')].map(el=>({selector:el.tagName.toLowerCase()+'.'+String(el.className||'').replace(/\\s+/g,'.'),left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right),scroll:el.scrollWidth,client:el.clientWidth})).filter(x=>x.right>innerWidth+2||x.left< -2).slice(0,18));
      throw new Error('Premium phone title overflow: '+JSON.stringify({scrollWidth:await page.evaluate(()=>document.documentElement.scrollWidth),offenders}));
     }
   }
   const tested=[];
   for(const [index,design] of designs.entries()){
     if(width!==1440&&design!=='cinematic')continue;
     await page.locator('.rg-appearance summary').click();
     await page.locator('.rg-theme-picker button').nth(index).click();
     await page.locator('.rg-appearance summary').click();
     if(await home.getAttribute('data-reignition-concept')!==design)
       throw new Error('Title switch did not apply: '+design);
     const visuals=await page.evaluate(()=>{
       const hero=document.querySelector('.rg-hero');
       const image=document.querySelector('.rg-hero-art');
       const selected=document.querySelector('.rg-theme-picker button[aria-pressed="true"]');
       const root=document.querySelector('#root')?.getBoundingClientRect();
       const home=document.querySelector('main.rg-home')?.getBoundingClientRect();
       const heroRect=hero?.getBoundingClientRect();
       const name=document.querySelector('.rg-hero-name');
       const titleStyle=name?getComputedStyle(name):null;
       const nameRect=name?.getBoundingClientRect();
       const lineHeight=titleStyle?parseFloat(titleStyle.lineHeight):0;
       return {heroHeight:heroRect?.height??0,heroWidth:heroRect?.width??0,
         homeWidth:home?.width??0,rootWidth:root?.width??0,viewport:innerWidth,
         wordmarkHeight:nameRect?.height??0,wordmarkLineHeight:lineHeight,
         imageLoaded:image instanceof HTMLImageElement&&image.complete&&image.naturalWidth>0,
         selected:selected?.textContent?.trim(),
         overflow:document.documentElement.scrollWidth>innerWidth+2};
     });
     await page.waitForFunction(()=>{const image=document.querySelector('.rg-hero-art');return image instanceof HTMLImageElement&&image.complete&&image.naturalWidth>0;},null,{timeout:20000});
     // Cinematic/elite use full-bleed heroes. Operations/terminal intentionally
     // retain a ~200px command rail, so their hero has a smaller inner width.
     const fullBleed=design==='cinematic'||design==='elite';
     if(visuals.heroHeight<260||visuals.overflow||visuals.homeWidth<width*.97||
        visuals.heroWidth<width*(fullBleed?.97:.72))
       throw new Error('Main title must fit its authored layout '+design+': '+JSON.stringify(visuals));
     if(design==='cinematic'&&(visuals.wordmarkHeight>visuals.wordmarkLineHeight*1.18))
       throw new Error('RE:IGNITION title wrapped into broken lines: '+JSON.stringify(visuals));
     if(design==='cinematic'){
       await page.waitForFunction(()=>{
         const art=document.querySelector('.rg-veteran-character');
         return art instanceof HTMLImageElement&&art.complete&&art.naturalWidth>=500;
       },null,{timeout:20000});
       const heroArt=await page.locator('.rg-veteran-character').evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight,opacity:getComputedStyle(img).opacity}));
       if(heroArt.width<500||heroArt.height<600)throw new Error('Approved RE:IGNITION artwork failed to load: '+JSON.stringify(heroArt));
     }
     await page.screenshot({path:path.join(out,width+'x'+height+'-title-'+design+'.png'),animations:'disabled',fullPage:true});
     tested.push({design,...visuals});
   }
   await page.locator('.rg-appearance summary').click();
   await page.locator('.rg-theme-picker button').first().click();
   await page.locator('.rg-appearance summary').click();
   if(width===1440){
     const topCard=await page.locator('.rg-card').first().boundingBox();
     if(!topCard||topCard.y>=height*.96)
       throw new Error('Premium desktop launcher is hidden below the first viewport: '+JSON.stringify(topCard));
   }
   const panels=await page.locator('.rg-card').count();
   await page.locator('#reignition-missions').scrollIntoViewIfNeeded();
   const cardInfo=await launchers.evaluateAll(buttons=>buttons.map(b=>({
     height:b.getBoundingClientRect().height,
     disabled:b.disabled,
     label:b.textContent?.trim(),
     cardWidth:b.getBoundingClientRect().width
   })));
   if(panels!==2||cardInfo.some(card=>card.disabled||card.height<150||card.cardWidth<180))
      throw new Error('Visible Guard and Watch cards must be playable: '+JSON.stringify(cardInfo));
   // Mission artwork must be decoded before a launch screenshot is accepted.
   const artReadiness=await page.locator('.rg-card>img').evaluateAll(async(images)=>{
     return Promise.all(images.map(async image=>{
       try{await image.decode();}catch{return false;}
       return image.naturalWidth>0&&image.naturalHeight>0;
     }));
   });
   if(artReadiness.length!==2||artReadiness.some(ok=>!ok))
     throw new Error('Playable Guard/Watch cards missing finished key artwork: '+JSON.stringify(artReadiness));
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
   if(overflow)throw new Error('RE:IGNITION layout horizontally overflows '+width+'x'+height);
   await page.screenshot({path:path.join(out,width+'x'+height+'-game-choices.png'),animations:'disabled'});
   const entryCount=await page.locator('button.rg-story-button').count(),splitCount=await page.locator('button.is-episode02-entry').count();
   if(entryCount!==1||splitCount!==0)throw new Error('Story episode entry contract '+entryCount+'/'+splitCount);
   await page.locator('button.rg-story-button').click();
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
   rows.push({width,height,entryCount,splitCount,tested,look,errors});
   if(errors.length)throw new Error('Browser errors: '+errors.join('; '));
   console.log('PASS unified story '+width+'x'+height);
  }finally{await page.close()}
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({sha:process.env.GITHUB_SHA??null,rows},null,2)+'\n');
}finally{await browser.close()}

// Automated usability regression, not a manual narrative playtest.
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),{chromium}=require('playwright');
const base=process.env.PSI_QA_BASE_URL||'http://127.0.0.1:4178',out='artifacts/story-player';fs.mkdirSync(out,{recursive:true});
const castPlan=JSON.parse(fs.readFileSync(path.join(__dirname,'../content/episode01/immersive-scenes.json'),'utf8')).events;
const capture=new Set(['e01_01_arrival','e01_03_plan_breaks','e01_04_junho_signal','e01_08e_responsibility_clash','e01_08g_tbm_field_gap','e01_08o_record_pressure','e01_09_evening']);
const cinemaEvents=new Set(['e01_03_plan_breaks','e01_04_junho_signal','e01_08e_responsibility_clash','e01_08g_tbm_field_gap','e01_08o_record_pressure','e01_09_evening']);
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true}),rows=[];let currentPage;
 try{for(const [width,height,policy]of [[390,844,'first'],[844,390,'last'],[1440,900,'first']]){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage(),errors=[],trace=[],seen=new Set(),screens=new Set();
  currentPage=page;
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('.is-story-entry').click();await page.locator('.episode-cold-open-cta').click({timeout:30000});
  for(let step=0;step<650;step++){
   if(await page.locator('.phase-complete').count())break;
   await page.locator('[data-story-player="cinematic"]').waitFor();
   const scene=page.locator('.episode-immersive-scene'),event=await scene.getAttribute('data-event'),node=await scene.getAttribute('data-node');seen.add(event);
   await page.waitForFunction(()=>{const image=document.querySelector('.episode-immersive-background');return image instanceof HTMLImageElement&&image.complete&&image.naturalWidth>0&&Number(getComputedStyle(image).opacity)>.95;},{},{timeout:15000});
   if(cinemaEvents.has(event))a(await page.locator('.episode-immersive-background').evaluate(image=>image.currentSrc.includes('-cinema.webp')&&image.naturalWidth===1920&&image.naturalHeight===1080),'new cinematic plate missing or fallback used: '+event);
   const area=await scene.evaluate(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,viewportWidth:innerWidth,viewportHeight:innerHeight};});a(area.width>area.viewportWidth*.8&&area.height>area.viewportHeight*.5,'scene has no readable world area: '+event+' '+JSON.stringify(area));
   const text=page.locator('.dialogue-text');
   if(await text.count())a(await text.evaluate(el=>{for(let e=el;e&&e!==document.body;e=e.parentElement)if(Number(getComputedStyle(e).opacity)<.95)return false;return getComputedStyle(el).color==='rgb(245, 243, 233)';}),'dialogue dimmed: '+event);
   // Speaker/reader controls may be temporarily suppressed during fully directed
   // presentation beats. The opening-mode toggle and reading action are checked
   // explicitly below; do not require a persistent UI wall on every movie frame.
   if(step===0){
    const mode=page.locator('[data-story-player="cinematic"]');
    a.equal(await mode.getAttribute('data-story-reading-mode'),'cinema','default must be cinematic subtitles');
    const textBefore=await page.locator('.dialogue-text').innerText();
    const nodeBefore=await scene.getAttribute('data-node');
    const compact=await page.locator('.play-panel').boundingBox();
    a(compact&&compact.height<= (height<=440?105:130),'subtitle dock is not compact: '+JSON.stringify(compact));
    const toggle=page.locator('.story-view-toggle');
    await toggle.click();
    a.equal(await mode.getAttribute('data-story-reading-mode'),'read','read mode not activated');
    const expanded=await page.locator('.play-panel').boundingBox();
    a(expanded&&expanded.height>compact.height,'read mode did not expand the subtitle dock');
    a.equal(await page.locator('.dialogue-text').innerText(),textBefore,'read mode changed unread dialogue');
    await toggle.click();
    a.equal(await mode.getAttribute('data-story-reading-mode'),'cinema','cinema mode did not restore');
    a.equal(await scene.getAttribute('data-node'),nodeBefore,'mode toggle advanced the engine');
    const peek=page.locator('.story-scene-peek');
    await peek.click();
    a.equal(await mode.getAttribute('data-story-focus'),'true','scene focus did not reveal the whole frame');
    a(await page.locator('.play-panel').evaluate(el=>getComputedStyle(el).visibility==='hidden'),'subtitle still covers focused scene');
    a.equal(await page.locator('.dialogue-text').textContent(),textBefore,'scene focus changed the story page');
    const focusWorld=await page.locator('.episode-immersive-scene').boundingBox();
    a(focusWorld&&focusWorld.y<=1&&focusWorld.height>=height-1,'focus mode did not fill the screen: '+JSON.stringify(focusWorld));
    await peek.click();
    a.equal(await mode.getAttribute('data-story-focus'),null,'scene focus did not restore subtitles');
    a.equal(await scene.getAttribute('data-node'),nodeBefore,'scene focus mutated story engine');
    a.equal(await page.locator('.dialogue-text').innerText(),textBefore,'mode toggle skipped authored text');
   }
   a.equal(await page.locator('.strategy-shell').count(),0,'story reader unexpectedly requires a tactical map');
   const choices=page.locator('.choice-panel button:not(:disabled)'),count=await choices.count();
   const button=count?choices.nth(policy==='last'?count-1:0):page.locator('.continue-button');
   await button.scrollIntoViewIfNeeded();const box=await button.boundingBox();a(box&&box.height>=44&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'primary action clipped: '+event);
   const hit=await button.evaluate(el=>{const r=el.getBoundingClientRect(),target=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return target===el||el.contains(target);});a(hit,'primary action covered: '+event);
   trace.push({event,node,kind:count?'choice':'continue',text:await button.innerText(),dialogue:await text.count()?await text.innerText():null,backgroundVisible:true,buttonReachable:true});
   if(capture.has(event)&&!screens.has(event)){
    await page.locator('.episode-immersive-character img').evaluateAll(images=>Promise.all(images.map(image=>image.decode().catch(()=>{}))));await page.waitForTimeout(700);
    const composition=await page.evaluate(()=>{const dock=document.querySelector('.play-panel').getBoundingClientRect();return [...document.querySelectorAll('.episode-immersive-character')].map(actor=>{const box=actor.getBoundingClientRect(),image=actor.querySelector('img');return {character:actor.dataset.character,top:box.top,bottom:box.bottom,height:box.height,dockTop:dock.top,decoded:!!image&&image.complete&&image.naturalWidth>0};});});
    const expectedCast=castPlan[event]?.cast;
    a(Array.isArray(expectedCast),'missing scene cast contract: '+event);
    if(expectedCast.length===0){
     a.equal(composition.length,0,'intentional empty-cast scene contains unexpected actor: '+event);
    }else{
     a(composition.length>0&&composition.every(actor=>actor.decoded&&actor.height>70&&actor.top+Math.min(60,actor.height*.3)<actor.dockTop),'cast has no visible head region above reading dock: '+event+' '+JSON.stringify(composition));
    }
    fs.writeFileSync(path.join(out,`${width}-${event}-composition.json`),JSON.stringify(composition,null,2));
    await page.screenshot({path:path.join(out,`${width}-${event}.png`)});screens.add(event);
   }
   if(count&&!screens.has('decision')){await page.screenshot({path:path.join(out,`${width}-decision.png`)});screens.add('decision');}
   await button.click({timeout:3000});
   // Allow React to commit the next reader state; no voice skip and no DOM click shortcut.
   await page.waitForTimeout(140);
  }
  a.equal(await page.locator('.phase-complete').count(),1,'story did not finish');a.equal(seen.size,26);a.deepEqual(errors,[]);
  rows.push({width,height,policy,events:seen.size,errors,trace});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,scope:'automated visible-background and reachable-action regression; not manual narrative review',rows},null,2));console.log('PASS story player',width,height,seen.size,'events with visible backgrounds and reachable controls');await context.close();
 }}catch(error){if(currentPage&&!currentPage.isClosed())await currentPage.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw error;}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

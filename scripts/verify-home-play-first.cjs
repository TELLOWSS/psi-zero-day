const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out=process.env.PSI_QA_OUTPUT||'docs/qa/home-play-first-20261016';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true}),rows=[];
 try{for(const[width,height]of[[1440,900],[1366,768],[1920,1080],[390,844],[320,568],[844,390],[568,320]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4176/';await page.goto(base+'?main=play-first',{waitUntil:'networkidle'});await page.locator('.hub-play-first').waitFor();
  assert.equal(await page.locator('[data-home-art="play-first-v3"]').count(),1);
  await page.locator('.pf-key-art').evaluate(e=>e.decode());
  assert(await page.locator('.commercial-title-home').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  const modes=[];
  for(const [id,title]of[['guard','시그널 가드'],['watch','시그널 워치'],['breaker','시그널 브레이커']]){
   await page.locator('#pf-mode-'+id).click();assert((await page.locator('.pf-start').innerText()).includes(title));
   await page.locator('.pf-preview-button img').evaluate(e=>e.decode());assert((await page.locator('.pf-preview-button img').getAttribute('src')).includes(id+'-gameplay.png'));
   await page.locator('.commercial-title-home').evaluate(e=>e.scrollTop=0);
   const box=await page.locator('.pf-start').boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1&&box.height>=44,'Start action clipped '+JSON.stringify({width,height,box}));
   await page.locator('.pf-preview-button').click();assert(await page.locator('.pf-preview-dialog').evaluate(e=>e.open));await page.keyboard.press('Escape');assert.equal(await page.locator('.pf-preview-dialog').evaluate(e=>e.open),false);modes.push(id);
  }
  await page.locator('#pf-mode-guard').click();await page.locator('#pf-mode-guard').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#pf-mode-watch').getAttribute('aria-selected'),'true');
  await page.locator('#pf-mode-guard').click();await page.locator('.commercial-title-home').evaluate(e=>e.scrollTop=0);await page.screenshot({path:out+'/home-'+width+'.png',timeout:15000});
  await page.locator('.pf-library-heading button').click();await page.locator('.mode-preview-dialog').waitFor();assert((await page.locator('.mode-preview-dialog').innerText()).includes('준비중'));await page.locator('.mode-preview-close').click();
  await page.locator('.pf-start').click();await page.locator('[data-defense-screen="guard-home"]').waitFor();
  await page.goto(base+'?main=play-first',{waitUntil:'networkidle'});await page.locator('#pf-mode-watch').click();await page.locator('.pf-start').click();await page.locator('.survivors-ready-launch').waitFor({timeout:60000});
  await page.goto(base+'?main=play-first',{waitUntil:'networkidle'});await page.locator('#pf-mode-breaker').click();await page.locator('.pf-start').click();await page.waitForFunction(()=>typeof SignalBreakerQA!=='undefined');assert(page.url().includes('/signal-breaker-dev/index.html?entry=play'));
  assert.deepEqual(errors,[]);rows.push({width,height,modes,keyboardTabs:true,nativePreviewDialog:true,storyGated:true,guardEntry:true,watchEntry:true,breakerEntry:true,errors});fs.writeFileSync(out+'/browser.json',JSON.stringify(rows,null,2));console.log(width,height,'PASS');await context.close();
 }
 const p=await browser.newPage();await p.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4176/',{waitUntil:'networkidle'});assert.equal(await p.locator('.hub-play-first').count(),0);await p.close();
 }finally{await Promise.race([browser.close(),new Promise(r=>setTimeout(r,3000))])}
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});

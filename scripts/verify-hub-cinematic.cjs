const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const out=process.env.PSI_QA_OUTPUT||'docs/qa/hub-art-20261016';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true}),rows=[];
 try{for(const [width,height] of [[1440,900],[1920,1080],[390,844],[320,568],[844,390],[568,320]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4176/',{waitUntil:'networkidle'});
  const home=page.locator('[data-home-art="cinematic-dawn-v1"]');await home.waitFor();
  const art=await home.locator('.commercial-title-backdrop').evaluate(async e=>{await e.decode();return {width:e.naturalWidth,height:e.naturalHeight}});assert.deepEqual(art,{width:1672,height:941});
  assert.deepEqual(await home.locator('.commercial-title-actions .commercial-title-badge-new').allTextContents(),['준비중']);
  const layout=await home.evaluate(e=>({width:e.clientWidth,scrollWidth:e.scrollWidth,scrollHeight:e.scrollHeight,height:e.clientHeight,columns:getComputedStyle(e.querySelector('.commercial-title-actions')).gridTemplateColumns}));assert(layout.scrollWidth<=layout.width+1);
  assert.equal(layout.columns.split(' ').length,width>1050?4:width<=600&&height>width?1:2);
  const cards=await home.locator('.commercial-title-action.has-mode-art').evaluateAll(xs=>xs.map(e=>{const r=e.getBoundingClientRect(),t=e.querySelector('strong').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,titleInside:t.x>=r.x&&t.right<=r.right+1}}));
  assert.equal(cards.length,4);assert(cards.every(c=>c.x>=0&&c.x+c.width<=width+1&&c.titleInside&&c.height>=44));
  const utilities=await home.locator('.commercial-title-utility button').evaluateAll(xs=>xs.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}}));
  assert(utilities.every(r=>r.width>=44&&r.height>=44&&r.x>=0&&r.x+r.width<=width+1),'Utility touch targets');
  await page.screenshot({path:path.join(out,'after-'+width+'.png'),timeout:15000});
  await home.locator('.is-story-entry').click();await page.locator('.mode-preview-dialog').waitFor();
  assert((await page.locator('.mode-preview-dialog').innerText()).includes('준비중'));await page.keyboard.press('Escape');
  if(await page.locator('.mode-preview-dialog').count())await page.locator('.mode-preview-backdrop').click({position:{x:3,y:3}});
  assert.equal(await home.locator('.is-breaker-entry').getAttribute('href'),'/signal-breaker-dev/index.html?entry=play');
  await home.locator('.is-defense-entry').click();await page.locator('[data-defense-screen="guard-home"]').waitFor();
  assert.deepEqual(errors,[]);rows.push({width,height,art,layout,cards,storyStillGated:true,guardEntryWorks:true,errors});console.log(width,height,'PASS');
  fs.writeFileSync(out+'/browser.json',JSON.stringify(rows,null,2));await context.close();
 }}finally{await Promise.race([browser.close(),new Promise(r=>setTimeout(r,3000))]);}
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});

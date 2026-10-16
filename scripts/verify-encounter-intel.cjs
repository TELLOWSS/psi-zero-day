const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4178',out=process.env.PSI_QA_OUTPUT||'docs/qa/trimode-raid-20261016';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true}),rows=[];
 try{const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});await page.locator('.is-survivors-entry').click();await page.locator('.survivors-ready-dialog').waitFor();
  for(const [width,height]of[[320,568],[390,844],[568,320],[844,390],[768,1024],[1440,900]]){
   await page.setViewportSize({width,height});await page.locator('.survivors-ready-dialog').getByRole('button',{name:'현장 신호 도감',exact:true}).click();const dialog=page.locator('#signalEncounterIntel');await dialog.waitFor();
   const box=await dialog.boundingBox(),title=await dialog.locator('h2').boundingBox(),close=await dialog.locator('button').boundingBox();assert(title.y>=box.y&&title.y+title.height<=box.y+110,'Title must be visible on open');assert.equal(await dialog.evaluate(e=>e.scrollTop),0);assert(close.height>=44);assert(close.y>=box.y&&close.y+close.height<=height+1);
   assert.equal(await dialog.locator('article').count(),3);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:path.join(out,`intel-${width}.png`)});await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert.equal(await dialog.count(),0);assert(await page.locator('.survivors-ready-dialog').isVisible());rows.push({base,width,height,titleVisible:true,initialScroll:0,closeTarget44:true,keyboardClose:true});
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'intel-browser.json'),JSON.stringify({rows,errors},null,2));console.log('PASS intel focus, sizing and keyboard at six viewports');await context.close();
 }finally{await Promise.race([browser.close(),new Promise(r=>setTimeout(r,3000))]);}
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});

const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4178',out=process.env.PSI_QA_OUTPUT||'artifacts/field-studio-guide/local';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];
try{for(const[width,height]of[[320,568],[390,844],[568,320],[844,390],[1440,900]]){
 const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage(),errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push([r.status(),r.url()]);});
 await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('.commercial-title-utility button').nth(3).click();await page.locator('.field-guide-masthead').waitFor();await page.locator('.field-guide-scene').evaluate(e=>e.decode());
 await page.getByRole('button',{name:'전체 공정',exact:true}).click();assert.equal(await page.locator('.field-guide-list button').count(),118);
 const primary=await page.locator('.field-guide-list img').evaluateAll(async es=>{es.forEach(e=>e.loading='eager');await Promise.all(es.map(e=>e.decode()));return es.map(e=>({src:e.currentSrc,w:e.naturalWidth,h:e.naturalHeight}));});assert.equal(primary.length,118);assert.equal(await page.locator('.field-guide-list .field-guide-generated-art').count(),0);
 assert.equal(primary.filter(a=>a.src.includes('/realistic-v3/')).length,61);
 const art=require('../content/art/field-guide-realistic-v3.json'),master=require('../content/episode01/field-guide-master.json');
 const detailed=[];
 if(width===390){for(const key of Object.keys(art.items)){
  const item=master.items.find(x=>x.key===key);const search=page.getByRole('searchbox',{name:'도감 검색'});await search.fill(item.id);
  await page.waitForFunction(key=>document.querySelector('.field-guide-detail [data-item-key]')?.getAttribute('data-item-key')===key,key);
  const image=page.locator('.field-guide-detail .field-guide-image');await image.evaluate(e=>e.decode());
  const decoded=await image.evaluate(e=>({src:e.currentSrc,w:e.naturalWidth,h:e.naturalHeight}));assert(decoded.src.endsWith(art.items[key].uri));assert(decoded.w>=768&&decoded.h>=512);detailed.push(key);
  if(['transfer_floor_high_ceiling','alform_pin_wedge','gangform_shackle','eye_face_ppe','near_miss_marker'].includes(key)){await page.locator('.field-guide-preview').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${width}-${key}.png`)});}
 }await page.getByRole('searchbox',{name:'도감 검색'}).fill('');}
 for(const b of await page.locator('.field-guide-sections button').all()){await b.click();assert(await page.locator('.field-guide-list button').count()>0);}
 const search=page.getByRole('searchbox',{name:'도감 검색'});await search.fill('FG107');await page.waitForFunction(()=>document.querySelectorAll('.field-guide-list button').length===1);assert.equal(await page.locator('.field-guide-detail [data-item-key]').getAttribute('data-item-key'),'material_stack');
 await page.locator('.field-guide-detail .field-guide-image').evaluate(e=>e.decode());assert(!(await page.locator('.field-guide-detail').innerText()).includes('+15%'));
 await page.locator('.field-guide-preview').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${width}-detail.png`)});
 await search.fill('FG053');await page.waitForFunction(()=>document.querySelector('.field-guide-detail [data-item-key]')?.getAttribute('data-item-key')==='alform_pin_wedge');await page.locator('.field-guide-detail .field-guide-image').evaluate(e=>e.decode());
 const enlarge=page.getByRole('button',{name:'원화 크게 보기',exact:true});await enlarge.click();const modal=page.getByRole('dialog');await modal.waitFor();await modal.locator('img').evaluate(e=>e.decode());assert(await modal.evaluate(e=>e.open));assert(await modal.evaluate(e=>e.contains(document.activeElement)));
 assert((await modal.locator('img').getAttribute('src')).endsWith(art.items.alform_pin_wedge.uri));
 const box=await modal.boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1);await page.screenshot({path:path.join(out,`${width}-enlarged.png`)});await page.keyboard.press('Escape');await modal.waitFor({state:'detached'});assert.equal(await enlarge.evaluate(e=>e===document.activeElement),true);
 await search.fill('no-such-item-xyz');await page.locator('.field-guide-empty').waitFor();assert.equal(await page.locator('.field-guide-detail').count(),0);await search.fill('');assert.equal(await page.locator('.field-guide-list button').count(),118);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);rows.push({width,height,primaryArt:primary.length,replacedArt:61,legacyDiagrams:0,detailed,sections:true,search:true,enlarge:true,escapeFocusRestored:true,noResults:true,errors,failed,pass:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));console.log(width,'PASS');await context.close();
}}finally{await Promise.race([browser.close(),new Promise(r=>setTimeout(r,3000))]);}})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});

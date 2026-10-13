const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.PSI_QA_BASE_URL||'http://127.0.0.1:4173';
const out=path.resolve(process.env.PSI_QA_OUTPUT||'artifacts/audit-20261013');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{channel:'chrome'});const rows=[];
try{for(const [name,width,height] of [['phone',390,844],['small',360,640],['landscape',844,390],['short',667,375],['pc',1440,900],['tablet',820,1180],['fullhd',1920,1080]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/');await page.locator('.is-survivors-entry').waitFor();await page.screenshot({path:path.join(out,'main-title-'+name+'.png')});
 await page.locator('.is-story-entry').scrollIntoViewIfNeeded();await page.locator('.is-story-entry').click();await page.locator('.mode-preview-dialog').waitFor();assert.equal(await page.locator('.game-frame').count(),0,'release story gate must remain intact');await page.locator('.mode-preview-close').click();
 await page.locator('.is-survivors-entry').click();await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).waitFor();
 await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();await page.locator('.survivors-container.is-combat').waitFor();await page.keyboard.down('KeyD');await page.waitForTimeout(700);await page.keyboard.up('KeyD');
 const layout=await page.evaluate(()=>{const e=document.querySelector('.survivors-hud-top'),r=e.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth+1,hudFits:r.x>=0&&r.right<=innerWidth&&e.scrollWidth<=e.clientWidth+1}});
 assert.equal(layout.overflow,false,name+' overflow');assert.equal(layout.hudFits,true,name+' HUD');await page.screenshot({path:path.join(out,'main-play-'+name+'.png')});await page.locator('.survivors-pause-command').click();
 assert.deepEqual(errors,[],name+' exceptions');rows.push({name,width,height,...layout,errors,storyGate:true,launched:true,paused:true});await context.close();
}fs.writeFileSync(path.join(out,'main-device-verification.json'),JSON.stringify({base,rows},null,2));console.log('PASS 7 viewports: main title entries, story release gate, Signal Watch launch/movement/pause, HUD and overflow');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});

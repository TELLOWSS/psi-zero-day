const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');
const out='docs/qa/guard-immersion-20261015',seed=JSON.parse(fs.readFileSync('docs/qa/guard-p2-20261015/campaign-browser.json'))[0].saved.guard;
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true}),results=[];
try{for(const [name,width,height]of [['pc',1440,900],['portrait',390,844],['landscape',844,390],['small-portrait',320,568],['small-landscape',568,320]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(save=>{localStorage.setItem('psi-zero-day.guard.save.v2',JSON.stringify(save));localStorage.setItem('psi-zero-day.defense.tutorial.v1','seen');},seed);
 await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4190/',{waitUntil:'networkidle'});await page.locator('.is-defense-entry').click();
 await page.locator('[data-guard-stage="guard-gd-04-v1"] button').click();await page.locator('[data-support="COMMANDER"]').click();
 await page.locator('.zb-pad-hit').filter({hasText:'P1'}).click();await page.locator('.zb-tower-shop button').filter({hasText:'단일'}).first().click();
 const read=()=>page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('psi-zero-day.guard.save.v2')).payload));
 await page.waitForTimeout(300);const before=await read();
 await page.locator('[data-level="L2"]').click();await page.waitForTimeout(100);if(await read()!==before)throw Error('Preview spent resources');
 await page.locator('.guard-evolution-decision>button').last().click();if(await read()!==before)throw Error('Cancel mutated save');
 await page.locator('[data-level="L2"]').click();await page.locator('.guard-evolution-confirm').click();
 await page.locator('[data-level="L3A"]').click();await page.locator('.guard-evolution-confirm').click();
 await page.waitForTimeout(300);const equipped=await read();
 await page.locator('[data-level="L4A"]').click();if(await page.locator('.guard-evolution-confirm').isEnabled())throw Error('Resource-blocked final upgrade enabled');
 await page.locator('.guard-evolution-decision>button').last().click();
 const lab=page.locator('.guard-lab');await lab.locator('summary').click();await lab.locator('[data-lab-tier="L4"]').click();
 const trial=[];for(const fixture of ['NORMAL','SWARM','ARMORED','VEILED','MIXED']){await lab.locator('[data-lab-fixture="'+fixture+'"]').click();trial.push({fixture,rows:await lab.locator('[data-lab-comparison]').allTextContents()});}
 const previews=[];for(const level of ['L4A','L4B']){await lab.locator('nav button').filter({hasText:level}).last().click();await lab.locator('svg+button').click();previews.push({level,damage:await lab.locator('output').innerText()});}
 if(await read()!==equipped)throw Error('Final lab mutated real battle save');
 await lab.locator('[data-lab-tier="L4"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,name+'-final-lab.png')});await lab.locator('summary').click();
 await page.locator('[data-level="L4B"]').click();await page.locator('.guard-evolution-decision').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,name+'-evolution-decision.png')});
 const text=await page.locator('.guard-evolution-decision').innerText();if(/guard\\.|defense\\./.test(text))throw Error('Untranslated evolution text');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 if(overflow||errors.length)throw Error('Responsive regression '+name);
 results.push({name,width,height,previewFree:true,cancelFree:true,insufficientBlocked:true,labIndependent:true,trial,previews,overflow,errors});console.log(name,'evolution/lab PASS');await context.close();
}fs.writeFileSync(out+'/features-browser.json',JSON.stringify(results,null,2));}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});

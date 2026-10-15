const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE || 'playwright');
const out=path.resolve(process.env.PSI_QA_OUTPUT || 'docs/qa/defense-tactics-20261015');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true});
 const report=[];
 try{for(const [name,width,height] of [['portrait',390,844],['landscape',844,390],['pc',1440,900],['portrait-small',320,568],['landscape-small',568,320]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4176/'),{waitUntil:'networkidle'});
  await page.locator('.is-defense-entry').click();
  try{await page.locator('[data-support="COORDINATOR"]').waitFor();}catch(e){await page.screenshot({path:path.join(out,`${name}-error.png`)});console.error({errors,body:await page.locator('body').innerText()});throw e;}
  await page.screenshot({path:path.join(out,`${name}-preparation.png`)});
  await page.locator('[data-support="COORDINATOR"]').click();
  await page.locator('[data-defense-screen="combat"]').waitFor();
  if(await page.locator('.zb-rotate').count())throw Error('Blocking rotate dialog');
  await page.screenshot({path:path.join(out,`${name}-board.png`)});
  const alignmentError=await page.evaluate(()=>{const svg=document.querySelector('.zb-board'),marks=[...document.querySelectorAll('.zb-pad-mark')],hits=[...document.querySelectorAll('.zb-pad-hit')];return Math.max(...marks.map((mark,i)=>{const point=new DOMPoint(Number(mark.getAttribute('cx')),Number(mark.getAttribute('cy'))).matrixTransform(svg.getScreenCTM()),box=hits[i].getBoundingClientRect();return Math.hypot(point.x-box.x-box.width/2,point.y-box.y-box.height/2);}));});
  await page.locator('.zb-tactics-strip button').click();
  const shopVisible=await page.locator('.zb-tower-shop button').evaluateAll(xs=>xs.filter(x=>x.getBoundingClientRect().height>0&&getComputedStyle(x).display!=='none').length);
  if(shopVisible!==4)throw Error(`${name}: missing a legal tower in the shop`);
  await page.locator('.zb-tower-shop button[data-recommended="true"]').click();
  await page.locator('.zb-tech-nodes [data-level="L2"]').click();
  await page.screenshot({path:path.join(out,`${name}-tree.png`)});
  const row={name,width,height,errors,alignmentError,levels:await page.locator('.zb-tech-nodes button').count(),current:await page.locator('.zb-tech-nodes [aria-current="step"]').getAttribute('data-level'),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),board:await page.locator('.zb-board-wrap').boundingBox()};
  await page.getByRole('button',{name:'현장으로 돌아가기'}).click();
  await page.locator('.zb-start-wave').click();
  await page.waitForFunction(()=>Number(document.querySelector('[data-defense-screen="combat"]')?.dataset.tick)>2);
  await page.locator('.zb-pad-hit').first().click();
  const before=await page.locator('[data-defense-screen="combat"]').getAttribute('data-tick');
  await page.waitForTimeout(220);
  row.selectionPaused=before===await page.locator('[data-defense-screen="combat"]').getAttribute('data-tick');
  await page.getByRole('button',{name:'현장으로 돌아가기'}).click();
  row.closeStillPaused=await page.locator('.zb-hud-button').getAttribute('aria-pressed')==='true';
  await page.locator('.zb-exit').click();await page.locator('.is-defense-entry').waitFor();
  await page.locator('.is-defense-entry').click();
  await page.getByRole('button',{name:'이어서 훈련',exact:true}).click();
  await page.locator('[data-defense-screen="combat"]').waitFor();
  row.reloadWave=await page.locator('[data-defense-screen="combat"]').getAttribute('data-wave');
  row.resumeResource=await page.locator('[data-defense-screen="combat"]').getAttribute('data-resource');
  if(name==='pc'){
    const second=await context.newPage();await second.goto((process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4176/'),{waitUntil:'networkidle'});await second.locator('.is-defense-entry').click();
    await second.getByRole('heading',{name:'다른 탭에서 현장 디펜스가 실행 중입니다'}).waitFor();row.secondTabBlocked=true;await second.close();
    await context.setOffline(true);await page.locator('.zb-hud-button').click();await page.waitForFunction(()=>Number(document.querySelector('[data-defense-screen="combat"]')?.dataset.tick)>8);row.loadedOfflinePlay=true;await context.setOffline(false);
  }
  report.push(row);fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(report,null,2));await context.close();
 }}finally{await browser.close();}
 if(report.some(r=>r.errors.length||r.overflow||r.alignmentError>2||!r.selectionPaused||!r.closeStillPaused||r.levels!==4||r.current!=='L2'))throw Error('Defense browser check failed');
})().catch(e=>{console.error(e);process.exitCode=1});

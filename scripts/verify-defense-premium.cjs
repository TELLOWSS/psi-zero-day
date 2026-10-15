const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');
const manifest=JSON.parse(fs.readFileSync('content/defense/premium-art-v1.json','utf8'));
const out=path.resolve(process.env.PSI_QA_OUTPUT||'docs/qa/defense-premium-20261015');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4176/',{waitUntil:'networkidle'});
  const assets=await page.evaluate(async items=>Promise.all(items.map(async asset=>{const image=new Image();image.src='/'+asset.uri;await image.decode();return {id:asset.id,width:image.naturalWidth,height:image.naturalHeight,uri:asset.uri};})),manifest.assets);
  await page.locator('.is-defense-entry').click();await page.locator('.zb-support-fullbody').first().waitFor();
  const crew=await page.locator('.zb-support-card').evaluateAll(cards=>cards.map(card=>({support:card.dataset.support,body:card.querySelector('.zb-support-fullbody')?.getAttribute('src'),portrait:card.querySelector('.zb-support-portrait')?.getAttribute('src'),text:card.innerText})));
  await page.locator('[data-support="COORDINATOR"]').click();await page.locator('.zb-pad-hit').first().click();
  const shop=await page.locator('.zb-shop-production-art').evaluateAll(images=>images.map(image=>image.getAttribute('src')));
  const report={assets,crew,shop,pageErrors:errors,legacyDecorativeOverlays:await page.locator('.zb-field-hazards-layer').count(),board:await page.locator('[data-production-board-art]').getAttribute('href'),reducedMotion:await page.locator('.zb-path-centerline').evaluate(node=>getComputedStyle(node).animationName)};
  fs.writeFileSync(path.join(out,'art-browser.json'),JSON.stringify(report,null,2));
  if(assets.length!==24||errors.length||crew.length!==2||shop.length!==4||shop.some(uri=>!uri.includes('/premium-v1/'))||report.legacyDecorativeOverlays!==0||report.reducedMotion!=='none')throw Error('Premium art integration failed');
  if(!crew.some(c=>c.body.includes('kang-taesik-map.webp'))||!crew.some(c=>c.body.includes('lim-junho-map.webp')))throw Error('Canonical crew mismatch');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

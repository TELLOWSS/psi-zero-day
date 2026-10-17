// Current cinematic Episode 01: five-viewport entry/reading/asset smoke.
// Complementary to scripts/verify-story-player.cjs (26-event route regression).
// Do not substitute this for physical-device or manual narrative/audio review.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const base = process.env.PSI_QA_BASE_URL || 'http://127.0.0.1:4173';
const output = process.env.PSI_RESPONSIVE_ARTIFACT_DIR || 'artifacts/responsive-cinematic';
fs.mkdirSync(output, {recursive:true});
const sizes = [
  [1440, 900, 'desktop'],
  [1920, 1080, 'desktop-wide'],
  [390, 844, 'phone-portrait'],
  [844, 390, 'phone-landscape'],
  [820, 1180, 'tablet-portrait'],
];
const checks = [];

async function verifyStage(page, width, height, expectedEvent) {
  const scene = page.locator('[data-story-player="cinematic"] .episode-immersive-scene');
  await scene.waitFor({state:'visible', timeout:20000});
  const actualEvent = await scene.getAttribute('data-event');
  assert.equal(actualEvent, expectedEvent, 'Wrong cinematic event');
  await page.waitForFunction(() => {
    const img = document.querySelector('.episode-immersive-background');
    return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0
      && Number(getComputedStyle(img).opacity) > .95;
  }, null, {timeout:20000});

  const details = await page.evaluate(() => {
    const scene = document.querySelector('.episode-immersive-scene');
    const bg = document.querySelector('.episode-immersive-background');
    const panel = document.querySelector('.play-panel');
    const text = document.querySelector('.dialogue-text');
    const rect = scene.getBoundingClientRect();
    const dock = panel.getBoundingClientRect();
    const action = document.querySelector('.choice-panel button:not(:disabled), .continue-button');
    const actionRect = action?.getBoundingClientRect();
    const hit = actionRect ? document.elementFromPoint(
      actionRect.x + actionRect.width / 2, actionRect.y + actionRect.height / 2
    ) : null;
    return {
      bodyWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
      event: scene.getAttribute('data-event'),
      image: bg.currentSrc,
      imageSize: [bg.naturalWidth, bg.naturalHeight],
      sceneHeight: rect.height,
      dockTop: dock.top,
      textVisible: Boolean(text && text.getBoundingClientRect().height > 0 &&
        Number(getComputedStyle(text).opacity) >= .95),
      actionText: action?.textContent?.trim().slice(0,60) || '',
      actionReachable: Boolean(action && actionRect && actionRect.height >= 44 &&
        actionRect.left >= -1 && actionRect.top >= -1 &&
        actionRect.right <= innerWidth + 1 && actionRect.bottom <= innerHeight + 1 &&
        (hit === action || action.contains(hit))),
      pageErrors: Boolean(document.querySelector('.vite-error-overlay')),
    };
  });
  assert(!details.pageErrors, 'Runtime error overlay');
  assert(details.bodyWidth <= width + 2, 'Horizontal overflow: '+JSON.stringify(details));
  assert(details.sceneHeight >= height * .5, 'Story world too small: '+JSON.stringify(details));
  assert(details.textVisible, 'Cinematic dialogue not readable: '+JSON.stringify(details));
  assert(details.actionReachable, 'Reading/choice action not reachable: '+JSON.stringify(details));
  const backgroundPath = new URL(details.image).pathname;
  assert(backgroundPath.endsWith(expectedEvent === 'e01_02_meet_kang' ?
    '/work-yard-cinema.webp' : '/gate-dawn.webp'), 'Wrong background: '+details.image);
  return details;
}

(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROME_BIN, headless:true});
  try {
    for(const [width,height,label] of sizes){
      const ctx=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});
      const page=await ctx.newPage();
      const errors=[];
      page.on('pageerror',err=>errors.push(err.message));
      try{
        await page.goto(base,{waitUntil:'domcontentloaded'});
        const start=page.locator('button.is-story-entry:not(:disabled)');
        await start.scrollIntoViewIfNeeded();
        await start.click({timeout:10000});
        await page.locator('.episode-cold-open-cta').click({timeout:30000});
        const first=await verifyStage(page,width,height,'e01_01_arrival');
        await page.screenshot({path:path.join(output,label+'-arrival.png')});
        let reached=false;
        for(let i=0;i<50;i++){
          const event=await page.locator('.episode-immersive-scene').getAttribute('data-event');
          if(event==='e01_02_meet_kang'){reached=true;break;}
          const available=page.locator('.choice-panel button:not(:disabled)');
          const action=await available.count()?available.first():page.locator('.continue-button');
          await action.scrollIntoViewIfNeeded();
          await action.click({timeout:5000});
          await page.waitForTimeout(110);
        }
        assert(reached,'Player could not advance from arrival to first TBM scene');
        const second=await verifyStage(page,width,height,'e01_02_meet_kang');
        await page.screenshot({path:path.join(output,label+'-tbm.png')});
        assert.deepEqual(errors,[],'Browser errors');
        checks.push({label,width,height,status:'PASS',first,second,errors});
        console.log('PASS responsive cinematic '+label+' '+width+'x'+height);
      }catch(err){
        await page.screenshot({path:path.join(output,label+'-failure.png')}).catch(()=>{});
        checks.push({label,width,height,status:'FAIL',message:String(err),errors});
        console.error('FAIL responsive cinematic '+label+': '+String(err));
      }finally{await ctx.close();}
    }
  }finally{
    await browser.close();
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({base,scope:'automated five-viewport cinematic UI and first two scenes; not human visual/audio/Android review',checks},null,2)+'\n');
  }
  if(checks.some(c=>c.status==='FAIL'))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});

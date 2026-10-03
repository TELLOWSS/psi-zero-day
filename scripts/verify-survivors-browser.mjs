import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const out = path.resolve(process.env.PSI_SURVIVORS_QA_DIR || 'artifacts/survivors-browser');
fs.mkdirSync(out, {recursive: true});
const report = {status: 'NOT_RUN', baseUrl: process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173', rows: [], errors: []};
let browser;
try {
  let playwright;
  try { playwright = require('playwright'); }
  catch {
    const modules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
    if (!modules) throw new Error('Playwright module unavailable; install playwright or set CODEX_PRIMARY_RUNTIME_NODE_MODULES.');
    playwright = require(path.join(modules, 'playwright'));
  }
  browser = await playwright.chromium.launch({headless: true, ...(process.env.CHROME_BIN ? {executablePath: process.env.CHROME_BIN} : {})});
  report.status = 'RUNNING';
  for (const viewport of [{width:360,height:800},{width:390,height:844},{width:844,height:390},{width:1440,height:900}]) {
    const page = await browser.newPage({viewport, hasTouch: true});
    const row = {viewport, status: 'RUNNING', checks: {}, errors: []};
    report.rows.push(row);
    page.on('pageerror', e => row.errors.push(String(e)));
    await page.addInitScript(() => {
      window.__psiDecodedAudioDurations = [];
      const original = AudioContext.prototype.decodeAudioData;
      AudioContext.prototype.decodeAudioData = function(...args) {
        return original.apply(this, args).then(buffer => {
          window.__psiDecodedAudioDurations.push(buffer.duration);
          return buffer;
        });
      };
    });
    await page.goto(report.baseUrl, {waitUntil: 'networkidle'});
    await page.getByRole('button', {name:/작업중지 BGM 들어보기/}).click();
    const audio = page.locator('.work-stop-song-player audio');
    await audio.evaluate(a => new Promise(resolve => {
      if (a.readyState >= 1) resolve(); else a.addEventListener('loadedmetadata',resolve,{once:true});
    }));
    row.checks.fullSongDuration = await audio.evaluate(a => a.duration > 161.9 && a.duration < 162.2);
    await audio.evaluate(async a => { window.__psiSongElement = a; a.currentTime = 140; await a.play(); });
    await page.waitForTimeout(500);
    row.checks.fullSongPlayback = await audio.evaluate(a => !a.paused && a.currentTime > 140);
    await page.getByRole('button', {name:'플레이어 닫기', exact:true}).click();
    row.checks.fullSongStopsOnClose = await page.evaluate(() => window.__psiSongElement.paused);
    await page.getByRole('button', {name:'게임 설명서', exact:true}).click();
    row.checks.manual = await page.getByRole('dialog', {name:'처음 시작하는 게임 설명서'}).isVisible();
    await page.screenshot({path:path.join(out,`${viewport.width}x${viewport.height}-manual.png`)});
    await page.getByRole('button', {name:'설명서 닫기', exact:true}).click();
    await page.getByRole('button', {name:/야간 긴급 순찰/}).click({timeout:30000});
    row.checks.stageCount = await page.locator('.survivors-stage-card').count() === 10;
    row.checks.lastStage = await page.locator('.survivors-stage-card').last().innerText().then(t => t.includes('STAGE 10') && !t.includes('STAGE 010'));
    await page.locator('.survivors-char-card').filter({hasText:'안전감시단'}).click();
    row.checks.watchOfficer = await page.locator('.survivors-char-card.is-selected').innerText().then(t => t.includes('안전감시단'));
    await page.getByRole('button', {name:'순찰 시작하기', exact:true}).click();
    await page.waitForTimeout(1000);
    await page.waitForFunction(() => window.__psiDecodedAudioDurations.some(d => d >= 3.9 && d <= 4.1), undefined, {timeout: 10000});
    row.checks.suppliedShoutDecoded = true;
    row.checks.nonblank = await page.locator('canvas').evaluate(c => {
      const ctx = c.getContext('2d'); const data = ctx.getImageData(0,0,c.width,c.height).data;
      const colors = new Set(); for(let i=0;i<data.length;i+=Math.max(4,Math.floor(data.length/400/4)*4)) colors.add(`${data[i]},${data[i+1]},${data[i+2]}`);
      return colors.size > 4;
    });
    await page.keyboard.down('d'); await page.waitForTimeout(800); await page.keyboard.up('d');
    await page.keyboard.press('p');
    row.checks.pause = await page.getByRole('button',{name:'순찰 재개',exact:true}).isVisible();
    await page.getByRole('button',{name:'순찰 재개',exact:true}).click();
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    row.checks.focusPause = await page.getByRole('button',{name:'순찰 재개',exact:true}).isVisible();
    await page.getByRole('button',{name:'순찰 재개',exact:true}).click();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:40,y:viewport.height-110,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:90,y:viewport.height-110,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    row.checks.touchCancelPause = await page.getByRole('button',{name:'순찰 재개',exact:true}).isVisible();
    await page.getByRole('button',{name:'순찰 재개',exact:true}).click();
    const name = `${viewport.width}x${viewport.height}`;
    await page.screenshot({path:path.join(out,`${name}-playing.png`)});
    await page.waitForTimeout(12000);
    await page.screenshot({path:path.join(out,`${name}-encounter.png`)});
    row.checks.alertLane = await page.evaluate(() => {
      const hud = document.querySelector('.survivors-hud-top').getBoundingClientRect();
      return [...document.querySelectorAll('.survivors-combo-banner,.survivors-boss-alert,.survivors-evo-banner')].every(e => e.getBoundingClientRect().top >= hud.bottom);
    });
    // No synthetic engine state is injected. These captures document actual visible gameplay.
    row.checks.errorOverlay = await page.locator('vite-error-overlay').count() === 0;
    row.checks.fullGrowthUltimateResult = 'NOT_RUN';
    row.status = Object.values(row.checks).some(v => v === false) || row.errors.length ? 'FAIL' : 'SMOKE_PASS';
    await page.close();
  }
  const processPage = await browser.newPage({viewport:{width:1440,height:900}});
  await processPage.addInitScript(() => localStorage.setItem('psi.survivors.unlocked_stages', JSON.stringify(Array.from({length:10},(_,i)=>`stage_${String(i+1).padStart(2,'0')}`))));
  for (const stageNumber of ['02','07','10']) {
    await processPage.goto(report.baseUrl,{waitUntil:'networkidle'});
    await processPage.getByRole('button',{name:/야간 긴급 순찰/}).click();
    await processPage.locator('.survivors-stage-card').filter({hasText:`STAGE ${stageNumber}`}).click();
    await processPage.locator('.survivors-char-card').filter({hasText:'안전감시단'}).click();
    await processPage.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
    await processPage.waitForTimeout(2000);
    await processPage.screenshot({path:path.join(out,`stage-${stageNumber}-saved-unlock-fixture.png`)});
  }
  await processPage.close();
  report.processCaptureScope = 'Saved unlock fixture for Stage02/07/10 display, not natural unlock progression.';
  report.status = report.rows.some(r=>r.status==='FAIL') ? 'FAIL' : 'SMOKE_PASS';
} catch (err) {
  report.errors.push(String(err));
  if (report.status !== 'NOT_RUN') report.status = 'FAIL';
} finally {
  await browser?.close();
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
process.exitCode = report.status === 'SMOKE_PASS' ? 0 : report.status === 'NOT_RUN' ? 2 : 1;

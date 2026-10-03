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
    const page = await browser.newPage({viewport, hasTouch: true, ...(viewport.width === 390 ? {recordVideo:{dir:out,size:viewport}} : {})});
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
    row.checks.excavationGround = await page.evaluate(async () => {
      const art = new Image(); art.src = '/assets/survivors/excavation-ground-v3.webp';
      await art.decode(); return art.naturalWidth >= 1400 && art.naturalHeight >= 900;
    });
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
    await page.locator('.survivors-stage-card').first().waitFor({state:'visible'});
    row.checks.stageCount = await page.locator('.survivors-stage-card').count() === 10;
    row.checks.lastStage = await page.locator('.survivors-stage-card').last().innerText().then(t => t.includes('STAGE 10') && !t.includes('STAGE 010'));
    row.checks.characterHero = await page.locator('.survivors-monarch-hero-img').evaluate(async image=>{await image.decode();return image.naturalWidth>0;});
    await page.locator('.survivors-supply-guide summary').click();
    row.checks.supplyGuide = await page.locator('.survivors-supply-cards article').count() === 3;
    row.checks.evolutionRecipes = await page.locator('.survivors-supply-guide li').count() === 5;
    row.checks.itemArt = await page.evaluate(async()=>{const image=new Image();image.src='/assets/survivors/tactical-items-v1.webp';await image.decode();return image.naturalWidth===1254&&image.naturalHeight===1254;});
    await page.screenshot({path:path.join(out,`${viewport.width}x${viewport.height}-supplies.png`)});
    await page.locator('.survivors-supply-guide summary').click();
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
    for (const key of viewport.width === 390 ? ['d','a','w','s'] : ['d']) {
      await page.keyboard.down(key); await page.waitForTimeout(800); await page.keyboard.up(key);
    }
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
    row.checks.hudVisible = await page.locator('.survivors-hud-top').evaluate(h => {
      const r = h.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth;
    });
    if (viewport.width <= 600 && viewport.height > viewport.width) {
      row.checks.compactHud = await page.locator('.survivors-hud-top').evaluate(h => h.getBoundingClientRect().height <= 110);
    }
    // No synthetic engine state is injected. These captures document actual visible gameplay.
    row.checks.errorOverlay = await page.locator('vite-error-overlay').count() === 0;
    row.checks.fullGrowthUltimateResult = 'NOT_RUN';
    row.status = Object.values(row.checks).some(v => v === false) || row.errors.length ? 'FAIL' : 'SMOKE_PASS';
    const motionVideo = page.video();
    await page.close();
    if (motionVideo) await motionVideo.saveAs(path.join(out,'390x844-grounded-motion.webm'));
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
  // Exercise production simulation without injecting live engine state. Saved
  // unlock/R&D fixtures only make late-stage readability inspection repeatable.
  const combatPage = await browser.newPage({viewport:{width:390,height:844}});
  await combatPage.addInitScript(() => {
    localStorage.setItem('psi.survivors.unlocked_stages', JSON.stringify(Array.from({length:10},(_,i)=>`stage_${String(i+1).padStart(2,'0')}`)));
    localStorage.setItem('psi.survivors.rd_upgrades', JSON.stringify({vitality:5,mobility:5,intelligence:5,firstAid:1,reroll:3}));
    window.__psiCombatWarnings = {cart:false,fall:false,supply:false,pickup:false};
    const original=CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText=function(text,...args) {
      if (text === '진행 방향 · 옆으로 회피') window.__psiCombatWarnings.cart=true;
      if (text === '낙하 예고 · 원 밖으로') window.__psiCombatWarnings.fall=true;
      if (['기록 회수 비콘','무전 배터리','긴급 통제 키트'].includes(text)) {
        if(args[1]===23) window.__psiCombatWarnings.supply=true;
        if(args[1]===-100) window.__psiCombatWarnings.pickup=true;
      }
      return original.call(this,text,...args);
    };
  });
  await combatPage.goto(report.baseUrl,{waitUntil:'networkidle'});
  await combatPage.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await combatPage.locator('.survivors-stage-card').filter({hasText:'STAGE 10'}).click();
  await combatPage.locator('.survivors-char-card').filter({hasText:'안전감시단'}).click();
  await combatPage.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
  const combat = {status:'RUNNING',scope:'Stage10 saved unlock and maximum valid permanent upgrades; real simulation, not natural progression proof.',checks:{},errors:[]};
  report.combat = combat;
  combatPage.on('pageerror',e=>combat.errors.push(String(e)));
  let bossCaptured=false;
  for(let tick=0;tick<110;tick++) {
    const perk=combatPage.locator('.survivors-perk-card').first();
    if(await perk.isVisible()) {
      combat.checks.upgradeButton = await perk.getAttribute('aria-keyshortcuts') === '1' && await perk.evaluate(e=>e.tagName==='BUTTON');
      const previousChoice = await perk.innerText();
      await combatPage.keyboard.press('1');
      // Bulk experience can immediately show the next level instead of closing.
      await combatPage.waitForFunction(text=>{
        const card=document.querySelector('.survivors-perk-card');
        return !card || card.innerText!==text;
      },previousChoice);
      combat.checks.numberedUpgrade = true;
    }
    const key=['d','s','a','w'][tick%4];
    await combatPage.keyboard.down(key);await combatPage.waitForTimeout(800);await combatPage.keyboard.up(key);
    if(!bossCaptured && await combatPage.locator('.survivors-boss-risk').isVisible()) {
      bossCaptured=true;
      combat.checks.bossRisk=await combatPage.getByRole('progressbar',{name:'대표 위험 잔여량'}).getAttribute('value').then(v=>Number(v)>0 && Number(v)<=100);
      combat.checks.hudFits=await combatPage.locator('.survivors-hud-top').evaluate(h=>[...h.querySelectorAll('*')].every(e=>{const r=e.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth;}));
      await combatPage.screenshot({path:path.join(out,'390x844-stage10-combat-boss.png')});
    }
    const warnings=await combatPage.evaluate(()=>window.__psiCombatWarnings);
    if(warnings.cart && warnings.fall && warnings.supply && warnings.pickup && bossCaptured) break;
    if(await combatPage.getByRole('heading',{name:'🚨 현장 중대위험 발생',exact:true}).isVisible()) break;
  }
  Object.assign(combat.checks,await combatPage.evaluate(()=>({cartTelegraph:window.__psiCombatWarnings.cart,fallTelegraph:window.__psiCombatWarnings.fall,supplySpawn:window.__psiCombatWarnings.supply,supplyPickup:window.__psiCombatWarnings.pickup})));
  combat.checks.bossSeen=bossCaptured;
  combat.status=Object.values(combat.checks).some(v=>v===false)||combat.errors.length?'FAIL':'PASS';
  await combatPage.screenshot({path:path.join(out,'390x844-stage10-combat.png')});
  await combatPage.close();
  report.status = report.rows.some(r=>r.status==='FAIL') || combat.status==='FAIL' ? 'FAIL' : 'SMOKE_PASS';
} catch (err) {
  report.errors.push(String(err));
  if (report.status !== 'NOT_RUN') report.status = 'FAIL';
} finally {
  await browser?.close();
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
process.exitCode = report.status === 'SMOKE_PASS' ? 0 : report.status === 'NOT_RUN' ? 2 : 1;

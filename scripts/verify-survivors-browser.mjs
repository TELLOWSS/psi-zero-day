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
      window.__psiRigFrames = new Set();
      window.__psiLandmarks = new Set();
      const paintText = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function(text,...args) {
        if(['북측 투광 구역','남측 투광 구역','서측 인화물 보관','동측 인화물 보관'].includes(text)) window.__psiLandmarks.add(text);
        return paintText.call(this,text,...args);
      };
      window.__psiPropFrames = new Set();
      const draw = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function(source,...args) {
        if(source instanceof HTMLCanvasElement && source.width===256 && source.height===256) window.__psiPropFrames.add(source);
        if (source instanceof HTMLCanvasElement && source.width === 300 && source.height === 320) window.__psiRigFrames.add(source);
        return draw.call(this,source,...args);
      };
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
    await page.locator('.survivors-ready-launch').waitFor({state:'visible'});
    row.checks.startBeforeScroll = await page.getByRole('button',{name:'순찰 시작하기',exact:true}).evaluate(button => {const r=button.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;});
    row.checks.missionBrief = await page.locator('.survivors-mission-brief li').count() === 3;
    await page.locator('.survivors-stage-select-section > summary').click();
    await page.locator('.survivors-stage-card').first().waitFor({state:'visible'});
    row.checks.stageCount = await page.locator('.survivors-stage-card').count() === 20;
    row.checks.lastStage = await page.locator('.survivors-stage-card').last().innerText().then(t => t.includes('STAGE 20') && !t.includes('STAGE 010'));
    row.checks.characterHero = await page.locator('.survivors-monarch-hero-img').evaluate(async image=>{await image.decode();return image.naturalWidth>0;});
    await page.locator('.survivors-stage-select-section > summary').click();
    await page.getByText('보급 아이템과 장비 성장 알아보기',{exact:true}).click();
    await page.locator('.survivors-supply-guide summary').click();
    row.checks.supplyGuide = await page.locator('.survivors-supply-cards article').count() === 5 && await page.locator('.survivors-supply-cards').innerText().then(text=>['기록 회수 비콘','무전 배터리','긴급 통제 키트','현장 회복 보급','안전 유도등'].every(name=>text.includes(name)));
    row.checks.evolutionRecipes = await page.locator('.survivors-supply-guide li').count() === 5;
    row.checks.itemArt = await page.evaluate(async()=>{const image=new Image();image.src='/assets/survivors/pickup-atlas-v2.webp';await image.decode();return image.naturalWidth>=1700&&image.naturalHeight>=850&&Math.abs(image.naturalWidth/image.naturalHeight-2)<.01;});
    await page.screenshot({path:path.join(out,`${viewport.width}x${viewport.height}-supplies.png`)});
    await page.locator('.survivors-supply-guide summary').click();
    await page.locator('.survivors-char-select-section > summary').click();
    await page.locator('.survivors-char-card').filter({hasText:'안전감시단'}).click();
    await page.screenshot({path:path.join(out,`${viewport.width}x${viewport.height}-watch-selection.png`)});
    row.checks.watchOfficer = await page.locator('.survivors-char-card.is-selected').innerText().then(t => t.includes('안전감시단'));
    await page.getByRole('button', {name:'순찰 시작하기', exact:true}).click();
    await page.waitForTimeout(1000);
    await page.waitForFunction(() => window.__psiDecodedAudioDurations.some(d => d >= 3.9 && d <= 4.1), undefined, {timeout: 10000});
    row.checks.suppliedShoutDecoded = true;
    await page.waitForFunction(() => window.__psiDecodedAudioDurations.some(d => d > 77 && d < 79), undefined, {timeout: 15000});
    row.checks.orchestralPatrolDecoded = true;
    row.checks.stage01LandmarkPaint = await page.evaluate(()=>window.__psiLandmarks.size===4);
    row.checks.viewportPinned=await page.locator('.survivors-container').evaluate(e=>{const r=e.getBoundingClientRect();return r.top===0 && r.left===0 && Math.abs(r.height-innerHeight)<2;});
    row.checks.nonblank = await page.locator('canvas').evaluate(c => {
      const ctx = c.getContext('2d'); const data = ctx.getImageData(0,0,c.width,c.height).data;
      const colors = new Set(); for(let i=0;i<data.length;i+=Math.max(4,Math.floor(data.length/400/4)*4)) colors.add(`${data[i]},${data[i+1]},${data[i+2]}`);
      return colors.size > 4;
    });
    for (const key of viewport.width === 390 ? ['d','a','w','s'] : ['d']) {
      await page.keyboard.down(key); await page.waitForTimeout(800); await page.keyboard.up(key);
    }
    row.checks.articulatedMotion = await page.evaluate(() => window.__psiRigFrames.size >= 3);
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
    row.checks.propSprites=await page.evaluate(()=>window.__psiPropFrames.size>=2);
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
  await processPage.addInitScript(() => localStorage.setItem('psi.survivors.unlocked_stages', JSON.stringify(Array.from({length:20},(_,i)=>`stage_${String(i+1).padStart(2,'0')}`))));
  for (const stageNumber of ['02','03','07','10','11','20']) {
    await processPage.goto(report.baseUrl,{waitUntil:'networkidle'});
    await processPage.getByRole('button',{name:/야간 긴급 순찰/}).click();
    await processPage.locator('.survivors-stage-select-section > summary').click();
    await processPage.locator('.survivors-stage-card').filter({hasText:`STAGE ${stageNumber}`}).click();
    await processPage.locator('.survivors-char-select-section > summary').click();
    await processPage.locator('.survivors-char-card').filter({hasText:'안전감시단'}).click();
    await processPage.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
    await processPage.waitForTimeout(2000);
    const ground=await processPage.evaluate(async n=>{const paths=n==='02'?'excavation':n==='07'?'demolition':['03','11'].includes(n)?'concrete':'industrial';const im=new Image();im.src='/assets/survivors/'+paths+'-ground-v3.webp';await im.decode();return {width:im.naturalWidth,height:im.naturalHeight};},stageNumber);
    if(ground.width<1500 || ground.height<1000) throw new Error('Process ground lacks native high-resolution source');
    await processPage.screenshot({path:path.join(out,`stage-${stageNumber}-saved-unlock-fixture.png`)});
  }
  await processPage.close();
  report.processCaptureScope = 'Saved unlock fixture for Stage02/03/07/10/11/20 display, not natural unlock progression.';
  // Exercise production simulation without injecting live engine state. Saved
  // unlock/R&D fixtures only make late-stage readability inspection repeatable.
  const combatPage = await browser.newPage({viewport:{width:390,height:844}});
  await combatPage.addInitScript(() => {
    localStorage.setItem('psi.survivors.unlocked_stages', JSON.stringify(Array.from({length:20},(_,i)=>`stage_${String(i+1).padStart(2,'0')}`)));
    localStorage.setItem('psi.survivors.rd_upgrades', JSON.stringify({vitality:5,mobility:5,intelligence:5,firstAid:1,reroll:3}));
    window.__psiCombatWarnings = {cart:false,fall:false,supply:false,pickup:false};
    window.__psiSupplyKinds=new Set();
    const original=CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText=function(text,...args) {
      if (text === '진행 방향 · 옆으로 회피') window.__psiCombatWarnings.cart=true;
      if (text === '낙하 예고 · 원 밖으로') window.__psiCombatWarnings.fall=true;
      if (['기록 회수 비콘','무전 배터리','긴급 통제 키트','현장 회복 보급','안전 유도등'].includes(text)) {
        if(args[1]===23){window.__psiCombatWarnings.supply=true;window.__psiSupplyKinds.add(text);}
        if(args[1]===-100) window.__psiCombatWarnings.pickup=true;
      }
      return original.call(this,text,...args);
    };
  });
  await combatPage.goto(report.baseUrl,{waitUntil:'networkidle'});
  await combatPage.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await combatPage.locator('.survivors-stage-select-section > summary').click();
  await combatPage.locator('.survivors-stage-card').filter({hasText:'STAGE 20'}).click();
  await combatPage.locator('.survivors-char-select-section > summary').click();
  await combatPage.locator('.survivors-char-card').filter({hasText:'안전감시단'}).click();
  await combatPage.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
  const combat = {status:'RUNNING',scope:'Stage20 saved unlock and maximum valid permanent upgrades; real simulation, not natural progression proof.',checks:{},errors:[]};
  report.combat = combat;
  combatPage.on('pageerror',e=>combat.errors.push(String(e)));
  let bossCaptured=false, shoutCaptured=false;
  const equipmentLevels=new Set();
  for(let tick=0;tick<110;tick++) {
    for(const lv of await combatPage.locator('.survivors-perks-tray [data-equipment-level]').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.equipmentLevel))))equipmentLevels.add(lv);
    const perk=combatPage.locator('.survivors-perk-card').first();
    if(await perk.isVisible()) {
      combat.checks.upgradeButton = await perk.getAttribute('aria-keyshortcuts') === '1' && await perk.evaluate(e=>e.tagName==='BUTTON');
      const previousChoice = await perk.innerText();
      if(!combat.checks.upgradeArt){combat.checks.upgradeArt=await combatPage.locator('.survivors-upgrade-preview [data-equipment-cell]').count()>0;await combatPage.screenshot({path:path.join(out,'390x844-real-equipment-upgrade.png')});}
      await combatPage.keyboard.press('1');
      // Bulk experience can immediately show the next level instead of closing.
      await combatPage.waitForFunction(text=>{
        const card=document.querySelector('.survivors-perk-card');
        return !card || card.innerText!==text;
      },previousChoice);
      combat.checks.numberedUpgrade = true;
      // A bulk pickup may have queued another choice. Finish choices on their
      // own iterations before attempting an intervention behind a modal.
      continue;
    }
    const shoutButton=combatPage.getByRole('button',{name:'현장소장 사자후 궁극기 발동',exact:true});
    if(!shoutCaptured && await shoutButton.isVisible() && await shoutButton.isEnabled()) {
      await shoutButton.click();
      const cutin=combatPage.locator('.survivors-director-cutin-layer');
      await cutin.waitFor({state:'visible'});
      await cutin.locator('img').evaluate(image=>image.decode());
      combat.checks.shoutArt = await cutin.locator('img').evaluate(image=>image.naturalWidth>=1600 && image.src.includes('shout-v3'));
      combat.checks.shoutText = await cutin.locator('h2').innerText().then(text=>text==='작업중지 돌아버려 씨~!!!');
      combat.checks.shoutFits = await cutin.locator('.survivors-cutin-diagonal-banner').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight;});
      // Review the settled cut-in, not the first transparent animation frame.
      await combatPage.waitForTimeout(300);
      await combatPage.screenshot({path:path.join(out,'390x844-real-director-shout.png')});
      shoutCaptured=true;
    }
    const key=['d','s','a','w'][tick%4];
    await combatPage.keyboard.down(key);await combatPage.waitForTimeout(800);await combatPage.keyboard.up(key);
    const bossBanner=combatPage.locator('.survivors-boss-alert');
    if(!combat.checks.compactBossAlert && await bossBanner.isVisible()) {
      combat.checks.compactBossAlert=await bossBanner.evaluate(e=>{const r=e.getBoundingClientRect();const hud=document.querySelector('.survivors-hud-top').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=hud.bottom&&r.height<132&&getComputedStyle(e).pointerEvents==='none';});
      combat.checks.bossActionHint=await bossBanner.innerText().then(text=>text.includes('대표 위험 경보') && (text.includes('밖으로')||text.includes('벗어나')));
      await combatPage.screenshot({path:path.join(out,'390x844-compact-boss-warning.png')});
    }
    if(!bossCaptured && await combatPage.locator('.survivors-boss-risk').isVisible()) {
      bossCaptured=true;
      combat.checks.bossRisk=await combatPage.getByRole('progressbar',{name:'대표 위험 잔여량'}).getAttribute('value').then(v=>Number(v)>0 && Number(v)<=100);
      combat.checks.hudFits=await combatPage.locator('.survivors-hud-top').evaluate(h=>[...h.querySelectorAll('*')].every(e=>{const r=e.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth;}));
      await combatPage.screenshot({path:path.join(out,'390x844-stage10-combat-boss.png')});
    }
    const warnings=await combatPage.evaluate(()=>window.__psiCombatWarnings);
    if(warnings.cart && warnings.fall && warnings.supply && warnings.pickup && bossCaptured && shoutCaptured && combat.checks.compactBossAlert) break;
    if(await combatPage.getByRole('heading',{name:'🚨 현장 중대위험 발생',exact:true}).isVisible()) break;
  }
  Object.assign(combat.checks,await combatPage.evaluate(()=>({cartTelegraph:window.__psiCombatWarnings.cart,fallTelegraph:window.__psiCombatWarnings.fall,supplySpawn:window.__psiCombatWarnings.supply,supplyPickup:window.__psiCombatWarnings.pickup})));
  combat.checks.bossSeen=bossCaptured;
  combat.checks.compactBossAlert=Boolean(combat.checks.compactBossAlert);
  combat.equipmentLevels=[...equipmentLevels].sort();
  combat.supplyKinds=await combatPage.evaluate(()=>[...window.__psiSupplyKinds]);
  combat.checks.actualEquipmentGrowth=equipmentLevels.size>=3;
  combat.checks.shoutSeen=shoutCaptured;
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

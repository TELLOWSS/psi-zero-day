import fs from 'node:fs';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_BIN});
const key = 'psi.survivors.operation-handoff.v1';
const fixture = [{version:1, characterId:'kang_taesik', stageId:'stage_01', stageNumber:1, outcome:'victory', zones:2, cartStops:3, rubbleCleared:1, damageTaken:2.5, stars:[true,false,true]}, {version:1, characterId:'player', stageId:'stage_02', stageNumber:2, outcome:'defeat', zones:0, cartStops:0, rubbleCleared:0, damageTaken:15, stars:[false,false,false]}];
const reports = [];
try {
 for (const [width,height] of [[1440,900], [390,844], [844,390], [568,320]]) {
  const page = await browser.newPage({viewport:{width,height}});
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(process.env.HANDOFF_TEST_URL ?? 'http://127.0.0.1:5203/', {waitUntil:'networkidle'});
  await page.evaluate(({key,fixture}) => localStorage.setItem(key, JSON.stringify(fixture)), {key,fixture});
  const before = await page.evaluate(() => JSON.stringify({...localStorage}));
  for (const [mode,label] of [['story','스토리 모드 · 준비중'], ['defense','디펜스 모드 · 준비중']]) {
   await page.getByRole('button', {name:new RegExp(label)}).click();
   const panel = page.locator(`[data-handoff-mode="${mode}"]`);
   await panel.locator('summary').click();
   await panel.getByLabel('확인할 순찰 기록', {exact:true}).selectOption('1');
   if (!(await panel.locator('header').innerText()).includes('강태식')) throw Error('character selection failed');
   if (!(await panel.locator('dl').innerText()).includes('2/3')) throw Error('objective count failed');
   await panel.locator('.operation-handoff-boundary').scrollIntoViewIfNeeded();
   const boundary = await panel.locator('.operation-handoff-boundary').boundingBox();
   if (!boundary || boundary.y < 0 || boundary.y + boundary.height > height) throw Error('boundary not reachable');
   if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) throw Error('horizontal overflow');
   await page.screenshot({path:`artifacts/dossier-${mode}-${width}.png`});
   await page.getByRole('button', {name:'프리뷰 닫기', exact:true}).click();
  }
  if (before !== await page.evaluate(() => JSON.stringify({...localStorage}))) throw Error('dossier changed storage');
  await page.evaluate(key => localStorage.setItem(key, '{broken'), key);
  await page.getByRole('button', {name:/스토리 모드 · 준비중/}).click();
  await page.locator('[data-handoff-mode="story"] summary').click();
  await page.getByText('아직 완료한 순찰 기록이 없습니다.', {exact:false}).waitFor();
  if (errors.length) throw Error(errors.join('\n'));
  reports.push({width,height,recordsSelectable:true,readOnly:true,emptyRecoverable:true});
  await page.close();
 }
 fs.writeFileSync('artifacts/dossier-browser.json', JSON.stringify(reports, null, 2));
 console.log(JSON.stringify(reports));
} finally { await browser.close(); }

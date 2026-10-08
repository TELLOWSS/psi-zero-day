import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/graphics-settings');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const results=[];
try{
 for(const [width,height] of [[1440,900],[390,844]]) {
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:5203',{waitUntil:'networkidle'});
  await page.locator('.commercial-title-utility').getByRole('button',{name:/설정/}).click();
  const titleDialog=page.getByRole('dialog');
  await titleDialog.getByRole('button',{name:/부드럽게/}).click();
  await titleDialog.screenshot({path:path.join(out,`${width}-main.png`)});
  await titleDialog.getByRole('button',{name:/닫기/}).click();
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.getByRole('button',{name:'설정',exact:true}).click();
  const panel=page.getByRole('region',{name:'그래픽 · 한 번에 맞추기'});
  if(await panel.getByRole('button',{name:/부드럽게/}).getAttribute('aria-pressed')!=='true')throw Error('Main setting not shared');
  // A named section maps to a region in the accessibility tree.
  await panel.getByRole('button',{name:/부드럽게/}).click();
  if(await panel.getByRole('button',{name:/부드럽게/}).getAttribute('aria-pressed')!=='true')throw Error('Selection not reflected');
  await panel.screenshot({path:path.join(out,`${width}-ready.png`)});
  await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();
  await page.waitForFunction(()=>{const c=document.querySelector('.survivors-container canvas');return c&&c.width===Math.floor(c.getBoundingClientRect().width);});
  const low=await page.locator('.survivors-container canvas').first().evaluate(c=>c.width);
  await page.keyboard.press('p');
  await page.getByText('설정 · 커스터마이징',{exact:true}).click();
  const live=page.getByRole('region',{name:'그래픽 · 한 번에 맞추기'});
  if(await live.getByRole('button',{name:/부드럽게/}).getAttribute('aria-pressed')!=='true')throw Error('Mode not shared');
  await live.getByRole('button',{name:/선명하게/}).click();
  await page.waitForFunction(low=>document.querySelector('.survivors-container canvas')?.width===low*2,low);
  const high=await page.locator('.survivors-container canvas').first().evaluate(c=>c.width);
  await live.screenshot({path:path.join(out,`${width}-live.png`)});
  await page.reload();await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.getByRole('button',{name:'설정',exact:true}).click();
  if(await page.getByRole('button',{name:/선명하게/}).getAttribute('aria-pressed')!=='true')throw Error('Mode not restored');
  if(errors.length)throw Error(errors.join('\n'));
  results.push({width,height,low,high,shared:true,restored:true,errors});await context.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}

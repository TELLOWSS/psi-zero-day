import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const url=process.env.PSI_PREVIEW_URL;if(!url)throw Error('Set PSI_PREVIEW_URL');
const output='artifacts/lz-guidance';fs.mkdirSync(output,{recursive:true});const rows=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--renderer-process-limit=1']});
try{for(const [width,height] of [[1440,900],[390,844],[844,390]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 // Vite may move the engine into a shared chunk; capture by its update contract.
 await page.route('**/assets/*.js',async route=>{const response=await route.fetch(),body=await response.text(),pattern=/update\([^)]*\)\{(?=if\(this\.state\.phase!==)/g;const matches=[...body.matchAll(pattern)].length;if(matches>1)throw Error('Ambiguous engine capture');await route.fulfill({response,body:matches?body.replace(pattern,m=>`${m}window.lzEngine=this;`):body});});
 await page.addInitScript(()=>{window.lzGroundLabels=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(String(text).includes('랑데부 구역'))window.lzGroundLabels.push(String(text));return original.call(this,text,...args);};});
 await page.goto(url);await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();await page.locator('.survivors-ready-launch .survivors-btn-primary').click();await page.waitForFunction(()=>window.lzEngine?.state.phase==='playing');
 // Complete the Wave 2 supply pause through its UI before the extraction fixture.
 await page.evaluate(()=>{window.lzEngine.state.gameTime=111;window.lzEngine.state.player.hp=window.lzEngine.state.player.maxHp=10000;window.lzEngine.state.hazards=[];});
 await page.getByRole('button',{name:'정비 완료 · 순찰 재개 (Wave 3) ≫',exact:true}).click();
 await page.waitForFunction(()=>window.lzEngine.state.phase==='playing');
 await page.evaluate(()=>{const s=window.lzEngine.state;s.gameTime=125;s.stageBossNeutralized=true;s.bossEncounter={bossId:'lz-review-boss',phase:'combat',remaining:0};s.hazards=[];});
 await page.waitForFunction(()=>Boolean(window.lzEngine.state.extractionPhase));
 await page.evaluate(()=>{const s=window.lzEngine.state;s.player.x=s.extractionPhase.x+450;s.player.y=s.extractionPhase.y;});
 await page.locator('.survivors-extraction-status[data-inside="false"]').waitFor();await page.waitForTimeout(300);
 const outside=await page.locator('.survivors-extraction-status').evaluate(e=>{const b=e.getBoundingClientRect();return {text:e.textContent,arrow:e.querySelector('svg')?.getAttribute('style'),fits:e.scrollHeight<=e.clientHeight+1&&e.scrollWidth<=e.clientWidth+1,inViewport:b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight};});
 await page.screenshot({path:`${output}/${width}x${height}-outside.png`});
 const before=await page.evaluate(()=>window.lzEngine.state.extractionPhase.countdown);await page.waitForTimeout(300);const after=await page.evaluate(()=>window.lzEngine.state.extractionPhase.countdown);
 await page.evaluate(()=>{const s=window.lzEngine.state;s.player.x=s.extractionPhase.x;s.player.y=s.extractionPhase.y;});await page.locator('.survivors-extraction-status[data-inside="true"]').waitFor();await page.waitForTimeout(300);
 const inside=await page.locator('.survivors-extraction-status').textContent(),insideTime=await page.evaluate(()=>window.lzEngine.state.extractionPhase.countdown);
 const groundLabels=await page.evaluate(()=>window.lzGroundLabels);await page.screenshot({path:`${output}/${width}x${height}-inside.png`});
 rows.push({width,height,outside,before,after,inside,insideTime,groundLabels,errors,pass:outside.fits&&outside.inViewport&&outside.text.includes('왼쪽')&&outside.arrow.includes('rotate')&&before===after&&inside.includes('LZ 사수 중')&&insideTime<after&&!groundLabels.length&&!errors.length});await page.close();
}fs.writeFileSync(`${output}/report.json`,JSON.stringify({scope:'EXPLICIT_BOSS_SECURED_AND_PLAYER_POSITION_FIXTURE_NOT_NATURAL_PLAY',url,rows},null,2));console.log(JSON.stringify(rows));if(rows.some(r=>!r.pass))process.exitCode=1;}finally{await browser.close();}

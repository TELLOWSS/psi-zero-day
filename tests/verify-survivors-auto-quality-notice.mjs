import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const store=JSON.parse(fs.readFileSync('content/localization/survivors-store-ko.json','utf8')),browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),reports=[];
try{for(const [width,height] of [[1440,900],[390,844]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(process.env.PSI_PREVIEW_URL??'http://127.0.0.1:5204/',{waitUntil:'networkidle'});await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
 await page.getByRole('button',{name:store.briefBrowse,exact:true}).click();await page.getByRole('button',{name:store.close,exact:true}).click();
 await page.evaluate(async()=>{const {SurvivorsPerformanceBudget}=await import('/src/ui/survivors-performance.ts'),sample=SurvivorsPerformanceBudget.prototype.sample;SurvivorsPerformanceBudget.prototype.sample=function(){sample.call(this,70);};const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts'),update=SurvivorsEngine.prototype.update;SurvivorsEngine.prototype.update=function(dt,input){window.noticeEngine=this;this.state.hazards=[];return update.call(this,dt,input);};});
 await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();await page.locator('.survivors-auto-quality-notice').waitFor();
 const before=await page.evaluate(()=>({wallet:JSON.stringify(window.noticeEngine.state.premiumGear),time:window.noticeEngine.state.gameTime}));
 await page.locator('.survivors-auto-quality-notice').click();await page.waitForFunction(()=>document.querySelector('.survivors-session-settings')?.open);
 const paused=await page.evaluate(()=>window.noticeEngine.state.gameTime);await page.waitForTimeout(200);
 if(await page.evaluate(()=>window.noticeEngine.state.phase)!=='paused'||await page.evaluate(()=>window.noticeEngine.state.gameTime)!==paused)throw Error('Settings do not hold safe pause');
 const panel=page.locator('.survivors-session-settings');await panel.getByText('화면·성능 최적화',{exact:true}).click();await panel.getByRole('combobox',{name:/^최적화 모드/}).selectOption('high');
 await page.getByRole('button',{name:'순찰 재개',exact:true}).click();await page.waitForTimeout(200);
 if(await page.locator('.survivors-auto-quality-notice').count())throw Error('Manual quality not respected');
 if(await page.evaluate(()=>JSON.stringify(window.noticeEngine.state.premiumGear))!==before.wallet)throw Error('Opening graphics changed gear');
 if(errors.length)throw Error(errors.join('\n'));reports.push({width,height,notice:true,settingsPaused:true,manualRestore:true,gearUnchanged:true,errors});await page.close();
}fs.writeFileSync('artifacts/graphics-upgrade/auto-quality-notice.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));}finally{await browser.close();}

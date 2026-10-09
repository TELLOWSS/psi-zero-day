import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});const reports=[];
try{for(const [width,height] of [[390,844],[844,390]]){
const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.addInitScript(()=>performance.setResourceTimingBufferSize(10000));await page.goto('http://127.0.0.1:5203/',{waitUntil:'networkidle'});await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).waitFor();await page.evaluate(async()=>{const {SurvivorsEngine}=await import([...performance.getEntriesByType('resource')].reverse().find(e=>e.name.includes('patrol-survivors-engine.ts')).name);const update=SurvivorsEngine.prototype.update;SurvivorsEngine.prototype.update=function(dt,input){window.cleanupEngine=this;return update.call(this,dt,input);};});
await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();await page.waitForFunction(()=>window.cleanupEngine);
await page.evaluate(()=>{const e=window.cleanupEngine,s=e.state;e.skipBossIntro();e.setPaused(false);s.hazards=[];s.interactiveHazards=[];s.projectiles=[];s.player.invincibleTime=999;const o=s.terrain.find(o=>o.kind==='rubble');s.player.x=o.x-25;s.player.y=o.y+o.height/2;});
const button=page.getByRole('button',{name:'잔재물 정리 · 2회 남음'});await button.waitFor();const bounds=await button.boundingBox();if(!bounds||bounds.width<100||bounds.height<60||bounds.x<0||bounds.y<0||bounds.x+bounds.width>width||bounds.y+bounds.height>height)throw Error('touch bounds');
const overlaps=await button.evaluate(b=>{const a=b.getBoundingClientRect();return [...document.querySelectorAll('.survivors-tactical-actions button,.survivors-ultimate-btn')].some(o=>{const r=o.getBoundingClientRect();return a.left<r.right&&a.right>r.left&&a.top<r.bottom&&a.bottom>r.top;});});if(overlaps)throw Error('control overlap');
const cdp=await page.context().newCDPSession(page);const left={x:50,y:height-50,id:1},right={x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2,id:2};
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left,right]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[left]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});const next=page.getByRole('button',{name:'잔재물 정리 · 1회 남음'});await next.waitFor();await page.screenshot({path:`artifacts/mobile-cleanup-${width}.png`});await next.tap();await next.waitFor({state:'hidden'});
const result=await page.evaluate(()=>({hp:window.cleanupEngine.state.terrain.find(o=>o.kind==='rubble').hp,cleared:window.cleanupEngine.state.terrainRecord.rubbleCleared}));if(result.hp!==0||result.cleared!==1||errors.length)throw Error(JSON.stringify({result,errors}));reports.push({width,height,bounds,...result});await page.close();
}fs.writeFileSync('artifacts/mobile-cleanup-report.json',JSON.stringify(reports));console.log(JSON.stringify(reports));}finally{await browser.close();}

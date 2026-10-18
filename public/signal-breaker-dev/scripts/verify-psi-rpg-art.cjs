/* Verify original scene artwork, readable controls, mobile layout and offline decoding. */
const {createRequire}=require('node:module'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const {chromium}=(process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT?createRequire(path.join(process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT,'package.json'))('playwright'):require('playwright'));
const root=path.resolve(__dirname,'../../..'),out=process.env.SIGNAL_BREAKER_QA_OUTPUT||'/tmp/psi-rpg-art-qa',url='http://127.0.0.1:5190/signal-breaker-dev/index.html';
(async()=>{fs.mkdirSync(out,{recursive:true});const server=spawn(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5190'],{cwd:root,stdio:'ignore'});let browser;
try{for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
browser=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];
for(const [width,height] of [[1440,900],[844,390],[390,844]]){
const ctx=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
await page.locator('#operationLobby').waitFor({state:'visible',timeout:45000});
a.ok(await page.locator('#brandLoading>img').evaluate(i=>new URL(i.currentSrc||i.src).pathname.endsWith('/signal-breaker-dev/art/loading-keyart-v1.webp')&&i.complete&&i.naturalWidth>=720&&i.naturalHeight>=320),'current single-piece loading hero art failed to decode');
a.ok(await page.locator('#operationImage').evaluate(i=>new URL(i.currentSrc||i.src).pathname.endsWith('/signal-breaker-dev/art/lobby-keyart-v1.webp')&&i.complete&&i.naturalWidth>=720),'current operation lobby key art failed to decode');
a.ok(await page.locator('#operationLobby').evaluate(e=>getComputedStyle(e).backgroundColor!=='rgba(0, 0, 0, 0)'),'operation lobby background missing');
a.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await page.screenshot({path:out+'/psi-base-'+width+'.png',fullPage:true});
await page.locator('#openWorkshop').click();await page.locator('#workshopDialog').waitFor({state:'visible'});
a.ok(await page.locator('#workshopDialog').evaluate(e=>getComputedStyle(e).backgroundImage.includes('psi-rpg-lab-v1.png')));
a.ok(await page.locator('#shopBalance').evaluate(e=>getComputedStyle(e,'::before').backgroundImage.includes('psi-rpg-ui-parts-v1.png')));
a.ok(await page.locator('#closeWorkshop').evaluate(e=>{const r=e.getBoundingClientRect();return r.height>=44&&r.top>=0&&r.bottom<=innerHeight;}));
a.ok(await page.locator('#shopScroll').evaluate(e=>e.scrollHeight>=e.clientHeight&&e.clientHeight>0));
await page.screenshot({path:out+'/psi-lab-'+width+'.png',fullPage:true});await page.locator('#closeWorkshop').click();a.deepEqual(errors,[]);
results.push({width,height,sceneImages:true,controls:true,errors});await ctx.close();}
const ctx=await browser.newContext({serviceWorkers:'allow'}),page=await ctx.newPage();await page.goto(url);await page.waitForFunction(()=>navigator.serviceWorker.controller,null,{timeout:60000});
await ctx.setOffline(true);await page.reload();await page.locator('#operationLobby').waitFor({state:'visible',timeout:45000});
const offline=await page.evaluate(async()=>{const files=['world','base','lab','ui-parts'];return Promise.all(files.map(async id=>{const im=new Image();im.src='art/psi-rpg-'+id+'-v1.png';await im.decode();return{id,width:im.naturalWidth,height:im.naturalHeight};}));});
a.equal(offline.length,4);a.ok(offline.every(i=>i.width>=1536));await page.locator('#openWorkshop').click();await page.locator('#workshopDialog').waitFor({state:'visible'});await page.screenshot({path:out+'/psi-lab-offline.png',fullPage:true});await ctx.close();
fs.writeFileSync(out+'/psi-rpg-art-results.json',JSON.stringify({results,offline},null,2));console.log(JSON.stringify({results,offline}));
}finally{await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});

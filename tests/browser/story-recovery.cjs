// Synthetic receipts are isolated browser-test fixtures, never production content.
const {chromium}=require('playwright'),a=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.PSI_QA_BASE_URL||'http://127.0.0.1:4178',key='psi-zero-day.episode01.save.v1',out='artifacts/story-recovery';fs.mkdirSync(out,{recursive:true});
const receipts=['watch','guard','breaker'].map((mode,i)=>({schemaVersion:1,sourceMode:mode,sourceRecordId:'qa-fixture-'+mode,incidentId:mode==='breaker'?'ep01.edge':'ep01.ramp',observationIds:['qa-observation'],outcome:['verified-clear','incomplete','observed'][i],contentVersion:'ep01.story-evidence.v1'}));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_BIN}),rows=[];try{
const context=()=>b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const enter=async p=>{await p.locator('.rg-story-button,.is-story-entry').click();await p.locator('.episode-cold-open-cta').click({timeout:25000,noWaitAfter:true});};
const advance=async p=>{const selector=await p.evaluate(()=>{for(const s of ['.story-skip-voice','.strategy-observe-card button:not(:disabled)','.strategy-outcome-card > .strategy-execute-button:not(:disabled)','.strategy-action-confirm .strategy-execute-button:not(:disabled)','.strategy-action-list button:not(:disabled)','.strategy-map-worker.has-actions, .strategy-risk-signal.has-actions, .strategy-zone-target.has-actions, .strategy-rail button.has-actions','.choice-panel button:not(:disabled)','.continue-button:not(:disabled)']){const e=document.querySelector(s);if(e instanceof HTMLElement){e.click();return s;}}return '';});await p.waitForTimeout(selector?100:200);};
{
const c=await context(),p=await c.newPage(),raw='{recover-this-original';await p.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key,raw});await p.goto(base);await p.locator('.story-save-warning').waitFor();await enter(p);a.equal(await p.evaluate(key=>localStorage.getItem(key),key),raw);await p.locator('.gameplay-home-button').click();await p.locator('.story-restart-entry').click();await p.getByRole('button',{name:'기존 본편 기록을 바꾸고 처음부터 시작',exact:true}).click();await p.locator('.episode-cold-open-cta').click({timeout:25000,noWaitAfter:true});const next=await p.evaluate(key=>localStorage.getItem(key),key);a.notEqual(next,raw);a.equal(JSON.parse(next).schema_version,1);rows.push('corrupt original preserved until explicit restart');await c.close();}
{
const c=await context(),p=await c.newPage();await p.addInitScript(key=>{const old=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('QA quota','QuotaExceededError');return old.call(this,k,v);};},key);await p.goto(base);await enter(p);await p.locator('.story-save-warning').waitFor();a.equal(await p.evaluate(key=>localStorage.getItem(key),key),null);a(await p.locator('.dialogue-text').count());rows.push('quota warning retains playable current session');await c.close();}
{
const c=await context(),p=await c.newPage();let fail=true;await p.route('**/new-psi-crew-v2/player-map.webp*',r=>fail?r.abort():r.continue());await p.goto(base);await p.locator('.rg-story-button,.is-story-entry').click();await p.locator('.story-loading-recovery').waitFor({timeout:20000});a.equal(await p.locator('.episode-cold-open-cta').count(),0);a.equal(await p.evaluate(key=>localStorage.getItem(key),key),null);fail=false;await p.getByRole('button',{name:'다시 불러오기',exact:true}).click();await p.locator('.episode-cold-open-cta').waitFor({timeout:25000});rows.push('missing required art blocks entry; retry recovers without advancing save');await c.close();}
{
const c=await context(),p=await c.newPage();await p.addInitScript(receipts=>localStorage.setItem('psi.story.evidence.v1',JSON.stringify(receipts)),receipts);await p.goto(base);await enter(p);const seen=new Set();let watch=false,guard=false,missingFrames=0;
for(let step=0;step<350;step++){
// The finished frame unmounts the scene. During authored tactical interludes,
// the same narrative session can legitimately show strategy actions instead.
if(await p.locator('.phase-complete').count())break;
const scene=p.locator('.episode-immersive-scene');
const visibleScene=(await scene.count())>0;
const event=visibleScene?await scene.getAttribute('data-event',{timeout:2500}):null;
if(!visibleScene){
 const validInterlude=(await p.locator('.strategy-shell,.strategy-observe-card,.strategy-outcome-card,.strategy-action-confirm,.strategy-action-list,.strategy-map-worker,.strategy-risk-signal,.strategy-zone-target,.strategy-rail,.choice-panel,.continue-button,.story-skip-voice').count())>0;
 missingFrames=validInterlude?0:missingFrames+1;
 if(missingFrames>8){
  const current=await p.evaluate(()=>({phaseComplete:!!document.querySelector('.phase-complete'),storyFrame:document.querySelector('.game-frame')?.className,hub:!!document.querySelector('.rg-home'),guard:!!document.querySelector('.guard-home'),watch:!!document.querySelector('.survivors-preflight-top'),actions:[...document.querySelectorAll('button')].slice(0,8).map(e=>e.textContent?.trim()),title:document.title}));
  throw new Error('Story recovery left all valid narrative and tactical surfaces at step '+step+': '+JSON.stringify(current));
 }
}else missingFrames=0;
for(const el of await p.locator('[data-evidence-mode]').all())seen.add((await el.getAttribute('data-evidence-mode'))+':'+await el.getAttribute('data-evidence-outcome'));
if((event==='e01_04_junho_signal'&&!watch)||(event==='e01_05_command'&&!guard)){
const isWatch=!watch&&event==='e01_04_junho_signal',before=JSON.parse(await p.evaluate(key=>localStorage.getItem(key),key)).payload;
await p.locator('.story-context-panel>summary').click();await p.locator('.story-mode-link button').click();
if(isWatch){await p.locator('.survivors-preflight-top').waitFor({timeout:45000});await p.locator('.survivors-preflight-top>div button').last().click();watch=true;}else{await p.locator('.guard-home nav').waitFor({timeout:30000});await p.locator('.guard-home nav button').last().click();guard=true;}
await p.locator('.episode-immersive-scene').waitFor();const after=JSON.parse(await p.evaluate(key=>localStorage.getItem(key),key)).payload;a.deepEqual(after,before,'optional combat menu must preserve story engine facts');
}
await advance(p);
}
a(watch&&guard);a(seen.has('watch:verified-clear'));a(seen.has('guard:incomplete'));a(seen.has('breaker:observed'));rows.push({optionalWatchAndGuardReturnPreserveState:true,syntheticReceiptVariants:[...seen]});await c.close();}
fs.writeFileSync(out+'/report.json',JSON.stringify({base,rows},null,2));console.log('PASS story recovery and evidence',rows);
}finally{await Promise.race([b.close(),new Promise(r=>setTimeout(r,2500))]);}})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_RESPONSIVE_ARTIFACT_DIR || 'artifacts/survivors-mobile');
fs.mkdirSync(outputDir, { recursive: true });

const candidates = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const chrome = candidates.find(candidate => fs.existsSync(candidate));
if (!chrome) {
  console.error('Responsive QA requires Chrome/Chromium. Set CHROME_BIN or install a browser on the runner.');
  process.exit(1);
}

const port = Number(process.env.PSI_CHROME_DEBUG_PORT || 9233);
const profile = fs.mkdtempSync(path.join(tmpdir(), 'psi-zero-day-chrome-'));
const browser = spawn(chrome, [
  ...(process.platform === 'win32' && path.basename(chrome).toLowerCase() === 'msedge.exe' ? ['--edge-skip-compat-layer-relaunch'] : []),
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-extensions',
  '--no-first-run',
  '--no-default-browser-check',
  '--hide-scrollbars',
  '--mute-audio',
  '--remote-debugging-address=127.0.0.1',
  '--remote-debugging-port=' + port,
  '--user-data-dir=' + profile,
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let browserStderr = '';
browser.stderr.on('data', chunk => { browserStderr += chunk.toString(); });
let browserSpawnError;
browser.on('error', error => { browserSpawnError = error; });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForJson(url, timeoutMs = 10000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    if (browserSpawnError || browser.exitCode !== null || browser.signalCode !== null) {
      throw new Error('Chrome exited before CDP readiness: ' + (browserSpawnError?.message ?? browser.exitCode ?? browser.signalCode) + '\n' + browserStderr.slice(-6000));
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return await response.json();
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw new Error('Timed out waiting for ' + url + ': ' + (lastError?.message || 'unknown error') + '\nChrome stderr:\n' + browserStderr.slice(-6000));
}

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.events = new Map();
    this.opened = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP connection open timed out')), 10000);
      this.socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      this.socket.addEventListener('error', error => { clearTimeout(timer); reject(error); }, { once: true });
    });
    this.socket.addEventListener('close', () => {
      for (const pending of this.pending.values()) pending.reject(new Error('CDP connection closed'));
      this.pending.clear();
    });
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      const listeners = this.events.get(message.method) || [];
      for (const listener of listeners) listener(message.params);
    });
  }

  async send(method, params = {}) {
    await this.opened;
    const id = this.nextId++;
    const result = new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('CDP command timed out: ' + method)); }, 15000);
      this.pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    });
    this.socket.send(JSON.stringify({ id, method, params }));
    return result;
  }

  async once(method, timeoutMs = 10000) {
    await this.opened;
    return new Promise((resolve, reject) => {
      const listener = params => {
        clearTimeout(timer);
        const list = this.events.get(method) || [];
        this.events.set(method, list.filter(item => item !== listener));
        resolve(params);
      };
      const timer = setTimeout(() => {
        const list = this.events.get(method) || [];
        this.events.set(method, list.filter(item => item !== listener));
        reject(new Error('Timed out waiting for CDP event ' + method));
      }, timeoutMs);
      this.events.set(method, [...(this.events.get(method) || []), listener]);
    });
  }

  close() {
    this.socket.close();
  }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
  return result.result?.value;
}

async function waitFor(cdp, expression, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(cdp, expression)) return;
    await sleep(100);
  }
  throw new Error('Timed out waiting for condition: ' + expression);
}

async function screenshot(cdp, filename) {
  const result = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  fs.writeFileSync(path.join(outputDir, filename), Buffer.from(result.data, 'base64'));
}


const report=[];
try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`,15000);
  for(const [width,height] of [[390,844],[360,650],[844,390],[568,320],[820,1180],[1180,820]]){
    const response=await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'});
    const target=await response.json(),cdp=new Cdp(target.webSocketDebuggerUrl),errors=[];
    cdp.events.set('Runtime.exceptionThrown',[event=>errors.push(event.exceptionDetails.text)]);
    cdp.events.set('Runtime.consoleAPICalled',[event=>{if(event.type==='error')errors.push(event.args.map(a=>a.value??a.description).join(' '));}]);
    try {
      await cdp.send('Page.enable');await cdp.send('Runtime.enable');
      await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:3,mobile:true});
      await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
      await cdp.send('Page.navigate',{url:baseUrl});
      await waitFor(cdp,"[...document.querySelectorAll('button')].some(b=>/시그널 워치.*SURVIVORS/.test(b.textContent))");
      await evaluate(cdp,"[...document.querySelectorAll('button')].find(b=>/시그널 워치.*SURVIVORS/.test(b.textContent)).click()");
      await waitFor(cdp,"Boolean(document.querySelector('.survivors-ready-launch .survivors-btn-primary'))");
      await evaluate(cdp,`(async()=>{
        const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
        const update=SurvivorsEngine.prototype.update;
        SurvivorsEngine.prototype.update=function(dt,input){window.qaMobileEngine=this;window.qaInput={dt,...input};if(window.qaVisualFreeze)return;return update.call(this,dt,input);};
      })()`);
      // The launch button is intentionally disabled until the actor and map have finished preparing.
      // Clicking before readiness is a no-op and used to fail this QA at the 'playing' wait.
      await waitFor(cdp,"document.querySelector('.survivors-ready-launch .survivors-btn-primary')?.disabled===false",25000);
      await evaluate(cdp,"document.querySelector('.survivors-ready-launch .survivors-btn-primary').click()");
      await waitFor(cdp,"window.qaMobileEngine?.state.phase==='playing'");
      await sleep(500);
      const before=await evaluate(cdp,'window.qaMobileEngine.state.player.x');
      const y=Math.floor(height*.65);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:80,y}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:125,y}]});
      await sleep(180);
      const moved=await evaluate(cdp,`({x:window.qaMobileEngine.state.player.x,input:window.qaInput.moveX})`);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await sleep(120);
      const released=await evaluate(cdp,'window.qaInput.moveX');
      const layout=await evaluate(cdp,`(()=>{
        const box=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,inside:r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1};};
        const hud=document.querySelector('.survivors-hud-top'),canvas=document.querySelector('canvas.survivors-canvas');
        return {hud:box(hud),hudOverflow:hud.scrollWidth>hud.clientWidth+1,actions:[...document.querySelectorAll('.survivors-tactical-actions button')].map(box),pixels:canvas.width*canvas.height,overflow:document.documentElement.scrollWidth>innerWidth+1};
      })()`);
      await screenshot(cdp,`${width}x${height}-combat.png`);
      // Inspect pause/settings on a CLEAN running scene before injecting 70 hazards\n      // and changing world stages. Synthetic combat fixtures can trigger\n      // accountability/level-up modals, making the pause test unrelated to UI.
      await evaluate(cdp,"document.querySelector('.survivors-pause-command').click()");
      await waitFor(cdp,"Boolean(document.querySelector('.survivors-modal-backdrop .survivors-display-settings'))");
      const qualities=[];
      for(const quality of ['low','balanced','high','auto']){
        await evaluate(cdp,`(()=>{const panel=document.querySelector('.survivors-modal-backdrop .survivors-display-settings');panel.open=true;const select=panel.querySelector('select');const setter=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;setter.call(select,'${quality}');select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
        await sleep(120);qualities.push(await evaluate(cdp,"document.querySelector('.survivors-container').dataset.quality"));
      }
      await evaluate(cdp,`(()=>{const panel=document.querySelector('.survivors-modal-backdrop .survivors-display-settings');for(const box of panel.querySelectorAll('input[type=checkbox]'))if(box.checked)box.click();})()`);
      const savedDisplay=await evaluate(cdp,"JSON.parse(localStorage.getItem('psi.survivors.display.v1'))");
      await screenshot(cdp,`${width}x${height}-display-settings.png`);\n      await evaluate(cdp,"document.querySelector('.survivors-pause-command').click()");\n      await waitFor(cdp,"window.qaMobileEngine?.state.phase==='playing'");
      // Explicit synthetic stress fixture, not evidence of a natural stage clear or Android FPS.
      await evaluate(cdp,`(()=>{const e=window.qaMobileEngine;e.state.player.hp=e.state.player.maxHp=100000;e.state.nextLevelExp=100000;e.state.gameTime=70;for(let i=0;i<70;i++)e.spawnHazard(i%2?'RUNAWAY_CART':'GAS_LEAK');})()`);
      await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await sleep(2600);
      const stress=await evaluate(cdp,"({quality:document.querySelector('.survivors-container').dataset.quality,dt:window.qaInput.dt,finite:Number.isFinite(window.qaMobileEngine.state.player.x),hazards:window.qaMobileEngine.state.hazards.length})");
      await screenshot(cdp,`${width}x${height}-cpu-stress.png`);
      await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
      const appearance=await evaluate(cdp,`(async()=>{
        const {stageThreatAppearance}=await import('/src/ui/survivors-threat-appearance.ts');
        const image=new Image();image.src='/assets/survivors/stage-threat-silhouettes-v1.webp';await image.decode();
        const e=window.qaMobileEngine;window.qaVisualFreeze=true;e.state.stage={...e.state.stage,theme:'highrise_slab',stageNumber:3};
        const specs=[['RUNAWAY_CART',null,null],['RUNAWAY_CART','reinforced_cart',null],['RUNAWAY_CART',null,'flanking_cart'],['GAS_LEAK','pulse_gas',null],['GAS_LEAK','split_gas',null],['GAS_LEAK',null,'crosswind'],['FALLING_DEBRIS',null,null],['FALLING_DEBRIS',null,'wide_debris'],['FALLING_DEBRIS',null,null]];
        e.state.hazards=[];e.state.interactiveHazards=[];e.state.perkOptions=[];
        const cells=[];
        for(let i=0;i<9;i++){const [type,variant,behavior]=specs[i];e.spawnHazard(type);const h=e.state.hazards.at(-1);h.x=e.state.player.x+(i%3-1)*150;h.y=e.state.player.y+(Math.floor(i/3)-1)*140;h.speed=0;h.damage=0;h.variant=variant||undefined;h.behavior=behavior||undefined;h.id='qa_existing_3';h.isStageBoss=false;h.signatureEventId=undefined;h.motion={phase:type==='FALLING_DEBRIS'?'fall':'warning',timer:type==='FALLING_DEBRIS'?.15:1.25,directionX:1,directionY:0};if(i===4)h.y+=50;cells.push(stageThreatAppearance(h,i===8?5:3,i===8?'surface_logistics':'highrise_slab')?.cell);}
        return {width:image.naturalWidth,height:image.naturalHeight,cells,scope:'Synthetic nine-shape render fixture; no gameplay completion claim.'};
      })()`);
      await sleep(250);await screenshot(cdp,`${width}x${height}-threat-silhouettes.png`);
      await evaluate(cdp,"window.qaMobileEngine.state.stage={...window.qaMobileEngine.state.stage,theme:'surface_logistics',stageNumber:5}");
      await sleep(150);await screenshot(cdp,`${width}x${height}-steel-silhouettes.png`);
      const workfaces=[],naturalMotion=[];
      if(width===820&&height===1180){
        for(let stageNumber=1;stageNumber<=50;stageNumber++){
          const selected=await evaluate(cdp,`(async()=>{
            const {workfaceThreat,workfaceThreatAppearance,workfaceThreatCopy}=await import('/src/ui/survivors-workface-threats.ts');
            const {PATROL_STAGES}=await import('/src/engine/patrol-survivors-engine.ts');
            const row=workfaceThreat(${stageNumber}),e=window.qaMobileEngine;
            e.state.stage=PATROL_STAGES['stage_'+String(${stageNumber}).padStart(2,'0')];e.state.hazards=[];
            e.spawnHazard(row.type);const h=e.state.hazards.at(-1);h.id='qa_workface_1';h.x=e.state.player.x+70;h.y=e.state.player.y+100;h.isStageBoss=false;h.signatureEventId=undefined;h.variant=undefined;h.behavior=undefined;h.motion={phase:h.type==='FALLING_DEBRIS'?'fall':h.type==='RUNAWAY_CART'?'charge':'approach',timer:.225,directionX:1,directionY:0};
            const before=JSON.stringify(h);const result=workfaceThreatAppearance(h,${stageNumber});
            return {stage:${stageNumber},id:result?.id,cell:result?.cell,atlas:row.atlas,name:workfaceThreatCopy(${stageNumber}).name,preserved:JSON.stringify(h)===before};
          })()`);
          await waitFor(cdp,`document.querySelector('.survivors-container').dataset.workfaceArt==='ready'&&document.querySelector('.survivors-container').dataset.workfaceStage==='${stageNumber}'`);await sleep(100);
          const loaded=await evaluate(cdp,`document.querySelector('.survivors-container').dataset.workfaceArt==='ready'&&document.querySelector('.survivors-container').dataset.workfaceStage==='${stageNumber}'`);
          workfaces.push({...selected,loaded});
          if([1,4,11,14,21,31,41,43,45,50].includes(stageNumber))await screenshot(cdp,`stage-${stageNumber}-workface.png`);
        }
      }
      if(width===820&&height===1180){
        for(const stageNumber of [1,22,34]){
          const beforeMotion=await evaluate(cdp,`(async()=>{
            const {workfaceThreat}=await import('/src/ui/survivors-workface-threats.ts');
            const {PATROL_STAGES}=await import('/src/engine/patrol-survivors-engine.ts');
            const e=window.qaMobileEngine,row=workfaceThreat(${stageNumber});e.state.stage=PATROL_STAGES['stage_'+String(${stageNumber}).padStart(2,'0')];e.state.gameTime=20;e.state.hazards=[];e.state.projectiles=[];for(const key of Object.keys(e.state.activePerks))e.state.activePerks[key]=0;
            e.spawnHazard(row.type);const h=e.state.hazards.at(-1);h.id='qa_motion_1';h.x=e.state.player.x+160;h.y=e.state.player.y+100;h.hp=h.maxHp=100000;h.damage=0;h.speed=100;h.isStageBoss=false;h.signatureEventId=undefined;h.variant=undefined;h.behavior=undefined;h.motion={phase:h.type==='FALLING_DEBRIS'?'fall':h.type==='RUNAWAY_CART'?'charge':'approach',timer:h.type==='RUNAWAY_CART'?1.05:.45,directionX:-1,directionY:0};
            return {stage:${stageNumber},type:h.type,x:h.x,y:h.y,timer:h.motion.timer};
          })()`);
          await waitFor(cdp,`document.querySelector('.survivors-container').dataset.workfaceArt==='ready'&&document.querySelector('.survivors-container').dataset.workfaceStage==='${stageNumber}'`);
          await evaluate(cdp,'window.qaVisualFreeze=false');await sleep(180);
          const afterMotion=await evaluate(cdp,"(()=>{window.qaVisualFreeze=true;const h=window.qaMobileEngine.state.hazards.find(h=>h.id==='qa_motion_1');return h?{x:h.x,y:h.y,timer:h.motion?.timer,phase:h.motion?.phase}:null;})()");
          const valid=afterMotion&&Number.isFinite(afterMotion.x)&&Number.isFinite(afterMotion.y)&&(beforeMotion.type==='FALLING_DEBRIS'?afterMotion.x===beforeMotion.x&&afterMotion.y===beforeMotion.y&&afterMotion.timer<beforeMotion.timer:Math.hypot(afterMotion.x-beforeMotion.x,afterMotion.y-beforeMotion.y)>0);
          naturalMotion.push({before:beforeMotion,after:afterMotion,valid});await screenshot(cdp,`stage-${stageNumber}-natural-motion.png`);
        }
      }
      await cdp.send('Page.navigate',{url:baseUrl});
      await waitFor(cdp,"[...document.querySelectorAll('button')].some(b=>/시그널 워치.*SURVIVORS/.test(b.textContent))");
      await evaluate(cdp,"[...document.querySelectorAll('button')].find(b=>/시그널 워치.*SURVIVORS/.test(b.textContent)).click()");
      await waitFor(cdp,"Boolean(document.querySelector('.survivors-display-settings'))");
      const restored=await evaluate(cdp,"document.querySelector('.survivors-display-settings select').value==='auto'&&[...document.querySelectorAll('.survivors-display-settings input[type=checkbox]')].every(box=>!box.checked)");
      const customization={qualities,savedDisplay,restored};
      await evaluate(cdp,"localStorage.removeItem('psi.survivors.display.v1')");
      const pass=naturalMotion.every(r=>r.valid)&&workfaces.every(r=>r.loaded&&r.id&&r.preserved)&&restored&&qualities[0]==='low'&&qualities[1]==='balanced'&&qualities[2]==='high'&&appearance.width===1254&&appearance.cells.every((cell,i)=>cell===i)&&!errors.length&&!layout.overflow&&!layout.hudOverflow&&layout.hud.inside&&layout.actions.length===3&&layout.actions.every(a=>a.inside&&a.width>=44&&a.height>=44)&&layout.pixels<=2800001&&moved.x>before&&moved.input>0&&released===0&&stress.finite&&stress.dt<=5/60+.00001;
      report.push({width,height,scope:'Browser touch/geometry and synthetic crowd with 4x CPU throttling; not physical Android performance.',layout,movement:{before,...moved,released},stress,appearance,customization,workfaces,naturalMotion,errors,pass});
    } finally {cdp.close();await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);}
  }
} finally {
  browser.kill('SIGTERM');
  await Promise.race([new Promise(resolve=>browser.once('exit',resolve)),sleep(1200)]);
}
fs.writeFileSync(path.join(outputDir,'mobile-report.json'),JSON.stringify(report,null,2));
for(const row of report)console.log(row.pass?'PASS':'FAIL',row.width,row.height,JSON.stringify(row));
if(report.some(row=>!row.pass))process.exitCode=1;

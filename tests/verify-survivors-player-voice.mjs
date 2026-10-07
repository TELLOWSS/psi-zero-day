import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const url=process.env.PSI_PREVIEW_URL;if(!url)throw Error('Set PSI_PREVIEW_URL');
const manifest=JSON.parse(fs.readFileSync('content/survivors-player-voice-v1-ingest.json','utf8'));
manifest.assets.push(...JSON.parse(fs.readFileSync('content/survivors-player-voice-p1-v1-ingest.json','utf8')).assets);
const fixtures=process.env.PSI_VOICE_FIXTURES==='1';
const openingDelayMs=Number(process.env.PSI_VOICE_DELAY_MS??0);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const rows=[];
try {
  for (const [width,height] of [[1440,900],[390,844],[844,390]]) {
    const page=await browser.newPage({viewport:{width,height}}),errors=[];
    if(openingDelayMs>0)await page.route('**/PSI_V_PLAYER_START_A_v01.wav',async route=>{
      await new Promise(resolve=>setTimeout(resolve,openingDelayMs));await route.continue();
    });
    page.on('pageerror',error=>errors.push(String(error)));
    await page.addInitScript(({assets})=>{
      performance.setResourceTimingBufferSize(5000);
      const records=window.qaPlayerVoice={decoded:[],starts:[],stops:[]};
      const names=new Map(assets.map(row=>[row.sha256,row.file])),buffers=new WeakMap();
      const proto=AudioContext.prototype,decode=proto.decodeAudioData,create=proto.createBufferSource;
      proto.decodeAudioData=async function(bytes){
        const digest=await crypto.subtle.digest('SHA-256',bytes);
        const hash=Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('');
        const buffer=await decode.call(this,bytes),file=names.get(hash);
        if(file){records.decoded.push({file,duration:buffer.duration});buffers.set(buffer,file);}return buffer;
      };
      proto.createBufferSource=function(){
        const source=create.call(this),start=source.start.bind(source),stop=source.stop.bind(source);
        source.start=(...args)=>{const file=buffers.get(source.buffer);if(file)records.starts.push({file,time:performance.now()});return start(...args);};
        source.stop=(...args)=>{const file=buffers.get(source.buffer);if(file)records.stops.push({file,time:performance.now()});return stop(...args);};return source;
      };
    },manifest);
    await page.goto(url,{waitUntil:'networkidle'});
    await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
    if(fixtures)await page.evaluate(async()=>{
      const compiled=await (await fetch('/src/ui/PatrolSurvivorsGame.tsx')).text();
      const moduleUrl=compiled.match(/from "([^"]*patrol-survivors-engine\.ts[^"]*)"/)?.[1];
      if(!moduleUrl)throw Error('Live engine module not found');
      const {SurvivorsEngine}=await import(moduleUrl),update=SurvivorsEngine.prototype.update;
      SurvivorsEngine.prototype.update=function(...args){
        const value=window.qaVoiceFreeze?undefined:update.apply(this,args),state=this.state;window.qaVoiceEngine=this;
        const request=window.qaVoiceFixture;window.qaVoiceFixture=null;
        if(request)state.gameTime+=10;
        if(request==='LOW_HP')state.player.hp=state.player.maxHp*.29;
        if(request==='CART_WARNING'||request==='FALL_WARNING')state.hazards.push({id:'qa-'+request,type:request==='CART_WARNING'?'RUNAWAY_CART':'FALLING_DEBRIS',x:state.player.x+80,y:state.player.y,hp:999,maxHp:999,speed:0,radius:10,damage:0,expValue:0,motion:{phase:'warning',timer:1,directionX:1,directionY:0}});
        if(request==='SECURED')state.bossEncounter={bossId:'qa-boss',phase:'secured',remaining:2};
        if(request==='CLEAR'){state.starsEarned=[true,false,false];state.phase='victory';}
        if(request==='GAS_WARNING')state.hazards.push({id:'qa-gas',type:'GAS_LEAK',x:state.player.x+50,y:state.player.y,hp:999,maxHp:999,speed:0,radius:10,damage:0,expValue:0,motion:{phase:'warning',timer:1,directionX:0,directionY:0}});
        if(request==='CORE_SETUP')state.hazards.push({id:'qa-core',type:'CRANE_BOSS',isStageBoss:true,bossEncounterManaged:true,bossPhase:2,bossAttackCycles:0,x:state.player.x+50,y:state.player.y,hp:8,maxHp:100,speed:0,radius:10,damage:0,expValue:0,motion:{phase:'cooldown',timer:1,directionX:0,directionY:0}});
        if(request==='CORE_OPEN')state.hazards.find(h=>h.id==='qa-core').bossAttackCycles=1;
        if(request==='WORKER_ACK')state.resolvedWorkers=[{id:'qa-worker',x:state.player.x,y:state.player.y,remaining:3}];
        if(request==='EVOLUTION')state.activePerks.satellite_broadcast=1;
        if(request==='SUPPORT'&&!this.requestSupport())throw Error('Fixture support request rejected');
        if(request==='FINAL_CLEAR'){state.stageId='stage_50';state.starsEarned=[true,false,false];state.phase='victory';}
        if(request==='DEFEAT')state.phase='defeat';
        return value;
      };
    });
    await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();
    await page.waitForFunction(()=>window.qaPlayerVoice.decoded.length===26&&window.qaPlayerVoice.starts.length>0);
    const opening=await page.evaluate(()=>structuredClone(window.qaPlayerVoice));
    await page.locator('.survivors-pause-command').click();await page.waitForTimeout(150);
    const paused=await page.evaluate(()=>structuredClone(window.qaPlayerVoice));
    await page.waitForTimeout(400);
    const stayed=await page.evaluate(()=>window.qaPlayerVoice.starts.length);
    await page.getByRole('button',{name:'순찰 재개',exact:true}).click();await page.waitForTimeout(600);
    const resumed=await page.evaluate(()=>structuredClone(window.qaPlayerVoice));
    let fixturePass=true;
    if(fixtures&&width===1440){
      await page.evaluate(()=>{window.qaVoiceFreeze=true;});
      // Explicit synthetic state transitions test presentation wiring, not natural completion.
      for(const cue of ['LOW_HP','CART_WARNING','FALL_WARNING','GAS_WARNING','CORE_OPEN','WORKER_ACK','EVOLUTION','SUPPORT','SECURED','FINAL_CLEAR']){
        if(cue==='CORE_OPEN'){await page.evaluate(()=>{window.qaVoiceFixture='CORE_SETUP';});await page.waitForTimeout(80);}
        await page.evaluate(cue=>{window.qaVoiceFixture=cue;},cue);
        try {await page.waitForFunction(cue=>window.qaPlayerVoice.starts.some(row=>row.file.includes('_'+cue+'_')),cue,{timeout:8000});}
        catch(error){console.log(JSON.stringify({cue,debug:await page.evaluate(()=>({audio:window.qaPlayerVoice,phase:window.qaVoiceEngine?.state.phase,cutin:window.qaVoiceEngine?.state.directorCutinPhase,hp:window.qaVoiceEngine?.state.player.hp,gameTime:window.qaVoiceEngine?.state.gameTime}))}));throw error;}
        if(cue==='LOW_HP')continue; // Real urgent source must interrupt this lower-priority line.
        await page.waitForTimeout(cue==='FINAL_CLEAR'?300:3900);
      }
      const evidence=await page.evaluate(()=>structuredClone(window.qaPlayerVoice));
      fixturePass=evidence.stops.some(row=>row.file.includes('LOW_HP'))&&!evidence.stops.some(row=>row.file.includes('FINAL_CLEAR'))&&!evidence.starts.some(row=>row.file.includes('_PLAYER_CLEAR_'));
      rows.push({scope:'Explicit synthetic P0/P1 state fixtures, genuine audio sources and actual support method. Not natural-play clearance.',evidence,pass:fixturePass});
      await page.getByRole('button',{name:'같은 작전 다시 준비',exact:true}).click();
      const before=await page.evaluate(()=>window.qaPlayerVoice.starts.filter(row=>row.file.includes('_RETRY_')).length);
      if(before!==0)throw Error('Victory preparation incorrectly played defeat retry voice');
      await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();
      await page.waitForFunction(()=>window.qaVoiceEngine?.state.phase==='playing');
      await page.evaluate(()=>{window.qaVoiceFixture='DEFEAT';});
      await page.getByRole('button',{name:'같은 작전 다시 준비',exact:true}).click();
      await page.waitForFunction(()=>window.qaPlayerVoice.starts.some(row=>row.file.includes('_RETRY_')));
      await page.waitForTimeout(250);
      const retry=await page.evaluate(()=>structuredClone(window.qaPlayerVoice));
      if(retry.starts.filter(row=>row.file.includes('_RETRY_')).length!==1||retry.stops.some(row=>row.file.includes('_RETRY_')))throw Error('Retry voice canceled or repeated during preparation');
      rows.push({scope:'Synthetic defeat; real preparation button and genuine retry source',retry,pass:true});
    }
    const pass=opening.decoded.length===26&&opening.starts[0]?.file.includes('START_A')
      &&paused.stops.some(row=>row.file.includes('START_A'))&&stayed===paused.starts.length
      &&resumed.starts.filter(row=>row.file.includes('START')).length===1&&!errors.length&&fixturePass;
    rows.push({width,height,opening,paused,resumed,errors,pass});
    await page.close();
  }
  fs.mkdirSync('artifacts/survivors-player-voice',{recursive:true});
  fs.writeFileSync('artifacts/survivors-player-voice/report.json',JSON.stringify({url,rows},null,2));
  console.log(JSON.stringify({url,rows}));if(rows.some(row=>!row.pass))process.exitCode=1;
} finally {await browser.close();}

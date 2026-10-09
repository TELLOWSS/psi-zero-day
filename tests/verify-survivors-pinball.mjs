import fs from 'node:fs';import {createRequire} from 'node:module';import {createServer} from 'vite';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output='artifacts/pinball';fs.mkdirSync(output,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5212,strictPort:true,hmr:false}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});const reports=[];
try{for(const [width,height] of [[1440,900],[390,844],[844,390],[360,640],[412,740]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,recordVideo:{dir:output+'/video',size:{width,height}}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5212/',{waitUntil:'networkidle'});await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
 await page.getByRole('button',{name:'보너스 스테이지 · 현장 핀볼',exact:true}).click();const dialog=page.getByRole('dialog',{name:'퇴근 전 마지막 한 판'});await dialog.waitFor();
 await dialog.getByRole('button',{name:'첫 공 발사',exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('.pinball-actions .survivors-btn-primary').disabled);
 await page.evaluate(async()=>{const {PinballAudio}=await import('/src/ui/survivors-pinball-audio.ts');const original=PinballAudio.prototype.setActive;PinballAudio.prototype.setActive=function(v){window.pinballAudio=this;return original.call(this,v);};});
 const tableSize=await page.locator('.pinball-table canvas').boundingBox();if(Math.abs(tableSize.width/tableSize.height-2/3)>.015)throw Error('Table artwork stretched: '+JSON.stringify(tableSize));
 await page.evaluate(async()=>{const {SurvivorsPinballEngine}=await import('/src/engine/survivors-pinball-engine.ts'),update=SurvivorsPinballEngine.prototype.update;SurvivorsPinballEngine.prototype.update=function(dt,input){window.pinball=this;return update.call(this,dt,input);};});
 await page.screenshot({path:output+'/'+width+'-ready.png'});await dialog.getByRole('button',{name:'첫 공 발사',exact:true}).click();await page.waitForFunction(()=>window.pinball?.state.phase==='playing');
 await dialog.getByRole('checkbox',{name:'초보자 패들 보조'}).uncheck();
 if(width===1440){await page.keyboard.down('a');await page.keyboard.down('d');await page.waitForTimeout(180);}
 else{const left=await dialog.getByRole('button',{name:'왼쪽 패들',exact:true}).boundingBox(),right=await dialog.getByRole('button',{name:'오른쪽 패들',exact:true}).boundingBox();const cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:left.x+left.width/2,y:left.y+left.height/2,id:1},{x:right.x+right.width/2,y:right.y+right.height/2,id:2}]});await page.waitForTimeout(180);
  const both=await page.evaluate(()=>window.pinball.state.leftAngle<-.4&&window.pinball.state.rightAngle>Math.PI+.4);if(!both)throw Error('two-finger paddles failed '+JSON.stringify({width,height,left,right,state:await page.evaluate(()=>window.pinball.state)}));await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 const angles=await page.evaluate(()=>({left:window.pinball.state.leftAngle,right:window.pinball.state.rightAngle}));if(width===1440&&(angles.left>=-.4||angles.right<=Math.PI+.4))throw Error('keyboard paddles failed');
 await page.keyboard.up('a');await page.keyboard.up('d');await dialog.getByRole('checkbox',{name:'초보자 패들 보조'}).check();await page.waitForTimeout(1600);
 await dialog.getByRole('button',{name:'일시정지',exact:true}).click();const held=await page.evaluate(()=>JSON.stringify(window.pinball.state));await page.waitForTimeout(350);if(await page.evaluate(()=>JSON.stringify(window.pinball.state))!==held)throw Error('pause advanced');
 if(await page.evaluate(()=>!!window.pinballAudio.musicSource||window.pinballAudio.voices.size>0))throw Error('paused audio continued');
 const settingsBefore=await page.locator('.pinball-table canvas').boundingBox();
 await dialog.getByRole('button',{name:'음악 · 소리 설정',exact:true}).click();
 const settingsAfter=await page.locator('.pinball-table canvas').boundingBox();if(JSON.stringify(settingsBefore)!==JSON.stringify(settingsAfter))throw Error('settings shifted table');
 await page.keyboard.press('p');await page.waitForTimeout(150);if(await page.evaluate(()=>JSON.stringify(window.pinball.state))!==held)throw Error('settings hotkey resumed game');
 await page.screenshot({path:output+'/'+width+'-settings.png'});
 await dialog.getByRole('combobox',{name:'핀볼 음악'}).selectOption('theme');await dialog.getByRole('checkbox',{name:'핀볼 소리 끄기'}).check();await dialog.getByRole('button',{name:'설정 닫기',exact:true}).click();
 await dialog.getByRole('button',{name:'이어서 플레이',exact:true}).click();await page.waitForTimeout(180);if(await page.evaluate(()=>!!window.pinballAudio.musicSource||window.pinballAudio.voices.size>0))throw Error('muted audio continued');
 await dialog.getByRole('button',{name:'음악 · 소리 설정',exact:true}).click();
 const settingsHeld=await page.evaluate(()=>JSON.stringify(window.pinball.state));await page.waitForTimeout(150);if(await page.evaluate(()=>JSON.stringify(window.pinball.state))!==settingsHeld)throw Error('opening settings did not pause');
 await dialog.getByRole('checkbox',{name:'핀볼 소리 끄기'}).uncheck();await dialog.getByRole('button',{name:'설정 닫기',exact:true}).click();
 await dialog.getByRole('button',{name:'이어서 플레이',exact:true}).click();await page.waitForTimeout(300);await page.screenshot({path:output+'/'+width+'-playing.png'});
 const natural=await page.evaluate(()=>({hits:window.pinball.state.hits,score:window.pinball.state.score,ball:window.pinball.state.ball}));
 for(const selector of ['.pinball-table canvas','.pinball-paddle-button.left','.pinball-paddle-button.right','#bonus-title','.pinball-settings-toggle']){
  const box=await page.locator(selector).boundingBox();if(!box||box.y<0||box.y+box.height>height+1)throw Error('play control clipped: '+selector+' '+JSON.stringify(box));}
 if(width<600&&height>width){const table=await page.locator('.pinball-table').boundingBox(),paddle=await page.locator('.pinball-paddles').boundingBox(),consoleBox=await page.locator('.pinball-console').boundingBox(),settings=await page.locator('.pinball-settings-toggle').boundingBox(),actions=await page.locator('.pinball-actions').boundingBox();
  if(table.y+table.height>paddle.y+1||paddle.y+paddle.height>consoleBox.y+1||settings.y+settings.height>actions.y+1)throw Error('portrait controls overlap '+JSON.stringify({width,height,table,paddle,consoleBox,settings,actions}));}
 // Place a ball against each real authored bumper to exercise the full reward/visual chain without waiting for skillful play.
 await page.evaluate(async()=>{const {PINBALL_BUMPERS}=await import('/src/engine/survivors-pinball-engine.ts'),e=window.pinball;
  for(let c=0;c<6;c++)for(const b of PINBALL_BUMPERS){e.state.x=b.x;e.state.y=b.y+b.r+10;e.state.vx=0;e.state.vy=-200;e.update(.001,{left:false,right:false,assist:false});
   for(let t=0;t<18;t++){e.state.x=300;e.state.y=550;e.state.vx=0;e.state.vy=0;e.update(.01,{left:false,right:false,assist:false});}}
 });
 await page.screenshot({path:output+'/'+width+'-chain.png'});
 for(let n=1;n<=3;n++){await page.evaluate(()=>{window.pinball.state.remaining=.001;});
  if(n<3){await dialog.getByRole('button',{name:'다음 공 발사',exact:true}).click();await page.waitForFunction(n=>window.pinball.state.ball===n+1&&window.pinball.state.phase==='playing',n);}}
 await dialog.getByText('장비 구매 지갑에 저장했습니다.',{exact:true}).waitFor();
 const earned=await page.evaluate(()=>({ball:window.pinball.state.ball,earned:window.pinball.state.earned,wallet:Number(localStorage.getItem('psi.survivors.credits')),fourth:window.pinball.launch(),overflow:document.documentElement.scrollWidth>innerWidth}));
 if(earned.ball!==3||earned.earned!==400||earned.wallet!==400||earned.fourth||earned.overflow||errors.length)throw Error(JSON.stringify({earned,errors}));
 await page.waitForTimeout(250);if(await page.evaluate(()=>Number(localStorage.getItem('psi.survivors.credits')))!==400)throw Error('duplicate payment');
 await dialog.getByRole('button',{name:'순찰로 돌아가기',exact:true}).click();await page.reload();if(await page.evaluate(()=>Number(localStorage.getItem('psi.survivors.credits')))!==400)throw Error('wallet not persisted');
 if(!await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.survivors.pinball.best.v1')).score>0))throw Error('personal record not persisted');
 if(width===1440){await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();await page.getByRole('button',{name:'보너스 스테이지 · 현장 핀볼',exact:true}).click();
  await page.evaluate(async()=>{const {SurvivorsPinballEngine}=await import('/src/engine/survivors-pinball-engine.ts'),update=SurvivorsPinballEngine.prototype.update;SurvivorsPinballEngine.prototype.update=function(dt,input){window.pinball=this;return update.call(this,dt,input);};});
  await dialog.getByRole('button',{name:'첫 공 발사',exact:true}).click();await page.waitForFunction(()=>window.pinball?.state.phase==='playing');
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='psi.survivors.store_wallet'){Storage.prototype.setItem=original;throw Error('QA write failure');}return original.call(this,key,value);};});
  await dialog.getByRole('button',{name:'보상 챙기고 마치기',exact:true}).click();await dialog.getByText(/저장하지 못했습니다/).waitFor();
  if(await page.evaluate(()=>Number(localStorage.getItem('psi.survivors.credits')))!==400)throw Error('failed save changed wallet');
  const pending=await page.evaluate(()=>window.pinball.state.earned);await dialog.getByRole('button',{name:'보상 저장 다시 시도',exact:true}).click();await dialog.getByText('장비 구매 지갑에 저장했습니다.',{exact:true}).waitFor();
  if(await page.evaluate(()=>Number(localStorage.getItem('psi.survivors.credits')))!==400+pending)throw Error('retry payout wrong');
 }
 reports.push({width,height,tableSize,multiInput:true,pauseHeld:true,natural,earned,saveRetry:width===1440,errors});const video=page.video();await context.close();await video.saveAs(output+'/'+width+'-play.webm');
}fs.writeFileSync(output+'/report.json',JSON.stringify({scope:'Actual app entry/controls/settings safety/three balls/wallet in five viewports; QA bumper placement and clock shortening for reward completion. Natural sample only, not a player study.',reports},null,2));console.log('PASS actual pinball 5 viewports');}
finally{await browser.close();await server.close();}

import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const base=process.env.OMEGA_QA_ORIGIN||'http://127.0.0.1:4173';
const results=[];
for(const [name,width,height] of [['desktop',1440,900],['mobile-landscape',844,390],['mobile-portrait',390,844]]){
 const page=await browser.newPage({viewport:{width,height},hasTouch:name.startsWith('mobile-')}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}/?omegaLab=1&omegaSceneArt=1&omegaQaState=combatGun`);
 await page.getByText('감염체 원화 16장 로드됨').waitFor({timeout:30000});
 const arena=page.locator('.omega-protocol-arena');
 const launches=async()=>Number(await arena.getAttribute('data-omega-qa-gun-launches'));
 await page.waitForTimeout(1100);const idle=await launches();
 if(name==='desktop')await page.keyboard.down('j');
 else {const b=await page.locator('.omega-protocol-fire').boundingBox();const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});page.touchSession=cdp;}
 await page.waitForTimeout(1200);
 if(name==='desktop')await page.keyboard.up('j');else await page.touchSession.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const manual=await launches();await page.waitForTimeout(1100);const released=await launches();
 let mouseShots=released,mouseStopped=released,mouseScreenX=0,aimAlignment=1,renderedFrame=null;
 if(name==='desktop'){
  const b=await page.locator('.omega-protocol-arena canvas').boundingBox();
  await page.mouse.move(b.x+b.width*.75,b.y+b.height*.52);await page.mouse.down();await page.waitForTimeout(1200);await page.mouse.up();
  mouseShots=await launches();const a=Number(await arena.getAttribute('data-omega-qa-gun-angle'));mouseScreenX=Math.cos(a)-.22*Math.sin(a);const sy=.78*Math.sin(a),mag=Math.hypot(mouseScreenX,sy);const face=JSON.parse(await arena.getAttribute('data-omega-qa-facing'));aimAlignment=(mouseScreenX*face.x+sy*face.y)/mag;renderedFrame=await page.locator('.omega-protocol-arena canvas').getAttribute('data-omega-scene-art-frame');await page.waitForTimeout(1000);mouseStopped=await launches();
 }
 let multiStart=0,multiEnd=0,multiShots=0,multiScreenY=0,multiStopped=0;
 if(name.startsWith('mobile-')){
  const stick=await page.locator('.omega-protocol-stick').boundingBox(),fire=await page.locator('.omega-protocol-fire').boundingBox();
  const left={x:stick.x+stick.width*.8,y:stick.y+stick.height*.5,id:1},right={x:fire.x+fire.width*.5,y:fire.y+fire.height*.5,id:2};
  const cdp=page.touchSession;multiStart=Number(await arena.getAttribute('data-omega-qa-player-x'));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left,right]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[left,{...right,y:right.y-70}]});
  await page.waitForTimeout(1500);multiEnd=Number(await arena.getAttribute('data-omega-qa-player-x'));multiShots=await launches();
  const angle=Number(await arena.getAttribute('data-omega-qa-gun-angle'));const sx=Math.cos(angle)-.22*Math.sin(angle),sy=.78*Math.sin(angle);multiScreenY=sy/Math.hypot(sx,sy);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(1100);multiStopped=await launches();mouseStopped=multiStopped;
 }
 await page.locator('.omega-protocol-fire-mode').click();const enabled=await page.locator('.omega-protocol-fire-mode').getAttribute('aria-pressed');const fireDisabled=await page.locator('.omega-protocol-fire').isDisabled();
 await page.waitForTimeout(1500);const automatic=await launches();
 await page.locator('.omega-protocol-fire-mode').click();await page.waitForTimeout(1100);const disabled=await launches();const fireRestored=await page.locator('.omega-protocol-fire').isEnabled();
 const pass=idle===0&&manual>0&&released===manual&&enabled==='true'&&fireDisabled&&fireRestored&&automatic>mouseStopped&&disabled===automatic&&(name!=='desktop'||(mouseShots>released&&mouseStopped===mouseShots&&mouseScreenX>.1&&aimAlignment>.97&&/-(E)(?:-\d+)?$/.test(renderedFrame||'')))&&(!name.startsWith('mobile-')||(multiEnd>multiStart+5&&multiShots>released&&multiStopped===multiShots&&multiScreenY<-.85))&&!errors.length;
 results.push({name,idle,manual,released,mouseShots,mouseStopped,mouseScreenX,aimAlignment,renderedFrame,multiStart,multiEnd,multiShots,multiScreenY,multiStopped,automatic,disabled,fireDisabled,fireRestored,errors,pass});if(!pass)process.exitCode=1;
 await page.close();
}
await browser.close();console.log(JSON.stringify(results));

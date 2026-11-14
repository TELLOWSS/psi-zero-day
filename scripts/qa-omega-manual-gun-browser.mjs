import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const base=process.env.OMEGA_QA_ORIGIN||'http://127.0.0.1:4173';
const results=[];
for(const [name,width,height] of [['desktop',1440,900],['mobile-landscape',844,390]]){
 const page=await browser.newPage({viewport:{width,height},hasTouch:name==='mobile-landscape'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
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
 let mouseShots=released,mouseStopped=released,mouseScreenX=0;
 if(name==='desktop'){
  const b=await page.locator('.omega-protocol-arena canvas').boundingBox();
  await page.mouse.move(b.x+b.width*.75,b.y+b.height*.52);await page.mouse.down();await page.waitForTimeout(1200);await page.mouse.up();
  mouseShots=await launches();const a=Number(await arena.getAttribute('data-omega-qa-gun-angle'));mouseScreenX=Math.cos(a)-.22*Math.sin(a);await page.waitForTimeout(1000);mouseStopped=await launches();
 }
 await page.locator('.omega-protocol-fire-mode').click();const enabled=await page.locator('.omega-protocol-fire-mode').getAttribute('aria-pressed');
 await page.waitForTimeout(1500);const automatic=await launches();
 await page.locator('.omega-protocol-fire-mode').click();await page.waitForTimeout(1100);const disabled=await launches();
 const pass=idle===0&&manual>0&&released===manual&&enabled==='true'&&automatic>mouseStopped&&disabled===automatic&&(name!=='desktop'||(mouseShots>released&&mouseStopped===mouseShots&&mouseScreenX>.1))&&!errors.length;
 results.push({name,idle,manual,released,mouseShots,mouseStopped,mouseScreenX,automatic,disabled,errors,pass});if(!pass)process.exitCode=1;
 await page.close();
}
await browser.close();console.log(JSON.stringify(results));

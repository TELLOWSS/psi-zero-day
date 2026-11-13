import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});let failed=0;
for(const [name,w,h] of [['desktop',1440,900],['tablet',1024,768],['portrait',390,844],['landscape',844,390]])for(const [mode,query,max] of [['normal','?omegaLab=1',100],['fixture','?omegaLab=1&omegaQaState=zombieAI',800]]){
 const page=await browser.newPage({viewport:{width:w,height:h}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));try{
  await page.goto('http://127.0.0.1:4173/'+query);const meter=page.getByRole('meter',{name:'남은 체력'});await meter.waitFor({timeout:30000});
  const value=Number(await meter.getAttribute('aria-valuenow')),maximum=Number(await meter.getAttribute('aria-valuemax')),text=await page.locator('.omega-protocol-hp').innerText();
  const result={name,mode,value,maximum,text,errors};console.log(JSON.stringify(result));if(maximum!==max||!text.includes('/ '+max)||value<0||value>max||errors.length)failed++;
 }catch(e){failed++;console.error(name,mode,String(e));}await page.close();
}
await browser.close();if(failed)process.exitCode=1;

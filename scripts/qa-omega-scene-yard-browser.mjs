import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const base=process.env.OMEGA_QA_ORIGIN||'http://127.0.0.1:4173';
const output=resolve(process.env.OMEGA_SCENE_YARD_QA_DIR||'qa-omega-scene-yard');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const expected=['yard-ground-v3.webp','buildings-v3.webp','site-office-v3.webp','barrier-v3.webp','forklift-v3.webp','scaffold-v1.webp'];
const rows=[];
for(const [name,width,height] of [['desktop',1440,900],['tablet',1024,768],['portrait',390,844],['landscape',844,390]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[],assets=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{const name=r.url().split('/').pop()?.split('?')[0];if(expected.includes(name))assets.push({name,status:r.status()});});
 try{
  await page.goto(`${base}/?omegaLab=1&omegaSceneArt=1`);
  await page.getByText('감염체 원화 16장 로드됨').waitFor({timeout:30000});
  for(let i=0;i<150&&!expected.every(n=>assets.some(x=>x.name===n));i++)await page.waitForTimeout(100);
  const arena=page.locator('.omega-protocol-arena'),before=Number(await arena.getAttribute('data-omega-player-x'));
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(600);await page.keyboard.up('ArrowRight');
  const after=Number(await arena.getAttribute('data-omega-player-x'));
  await page.screenshot({path:`${output}/${name}.png`});
  const evidence=JSON.parse(await arena.getAttribute('data-omega-infected-evidence')||'{}');
  const pass=after>before+2&&expected.every(n=>assets.some(x=>x.name===n&&x.status===200))&&
   Object.values(evidence.draws??{}).some(n=>n>0)&&!errors.length;
  rows.push({name,before,after,assets,errors,pass});if(!pass)process.exitCode=1;
 }catch(error){rows.push({name,error:String(error),assets,errors});process.exitCode=1;}
 await page.close();
}
{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(`${base}/?omegaLab=1&omegaSceneArt=1&omegaQaState=combatGun`);
  await page.getByText('감염체 원화 16장 로드됨').waitFor({timeout:30000});
  const arena=page.locator('.omega-protocol-arena');
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(()=>Number(document.querySelector('.omega-protocol-arena')?.getAttribute('data-omega-player-x'))>=390,null,{timeout:12000});
  await page.keyboard.up('ArrowRight');await page.keyboard.down('ArrowUp');
  await page.waitForFunction(()=>Number(document.querySelector('.omega-protocol-arena')?.getAttribute('data-omega-player-y'))<=328,null,{timeout:12000});
  const first=Number(await arena.getAttribute('data-omega-player-y'));
  await page.waitForTimeout(350);const second=Number(await arena.getAttribute('data-omega-player-y'));
  await page.keyboard.up('ArrowUp');await page.screenshot({path:`${output}/office-collision.png`});
  const pass=first>=320&&second>=320&&Math.abs(first-second)<4&&!errors.length;
  rows.push({name:'office-collision',first,second,errors,pass});if(!pass)process.exitCode=1;
 }catch(error){rows.push({name:'office-collision',error:String(error),errors});process.exitCode=1;}
 await page.close();
}
{
 const page=await browser.newPage(),requests=[];
 page.on('request',r=>{if(expected.some(n=>r.url().includes(n)))requests.push(r.url());});
 await page.goto(`${base}/?omegaLab=1`);await page.waitForTimeout(1000);
 rows.push({name:'ordinary-lab-isolation',requests:requests.length,pass:requests.length===0});
 if(requests.length)process.exitCode=1;await page.close();
}
await browser.close();
await writeFile(`${output}/report.json`,JSON.stringify({rows,physicalAndroid:false},null,2));
console.log(JSON.stringify(rows));

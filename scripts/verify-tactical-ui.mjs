import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const copy=JSON.parse(fs.readFileSync('content/localization/survivors-store-ko.json','utf8'));
const url=process.env.PSI_PREVIEW_URL;
if(!url)throw Error('Set PSI_PREVIEW_URL');
fs.mkdirSync('artifacts/tactical-ui',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--renderer-process-limit=1']}),rows=[];
try {
  for(const [width,height] of [[1440,900],[390,844],[844,390]]) {
    const page=await browser.newPage({viewport:{width,height}}),errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).waitFor();
    const fonts=await page.evaluate(async()=>{
      const faces=await Promise.all([document.fonts.load('500 14px Pretendard','현장'),document.fonts.load('400 20px "Black Han Sans"','작전'),document.fonts.load('700 22px "Chakra Petch"','2,000')]);
      return faces.every(face=>face.length>0&&face.every(font=>font.status==='loaded'));
    });
    await page.screenshot({path:`artifacts/tactical-ui/${width}x${height}-entry.png`});
    await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click({noWaitAfter:true});
    try { await page.getByRole('button',{name:copy.shopEntry,exact:true}).waitFor({timeout:60000}); }
    catch(error) { console.log(JSON.stringify({errors,body:await page.locator('body').innerText()}));await page.screenshot({path:`artifacts/tactical-ui/${width}x${height}-failure.png`});throw error; }
    const ready=await page.locator('.survivors-ready-dialog').evaluate(element=>({surface:getComputedStyle(element).backgroundColor,title:getComputedStyle(element.querySelector('.survivors-preflight-top h2')).fontFamily}));
    await page.screenshot({path:`artifacts/tactical-ui/${width}x${height}-ready.png`});
    await page.getByRole('button',{name:copy.shopEntry,exact:true}).click({noWaitAfter:true});
    const tabs=[];
    for(const name of [copy.browse,copy.fitting,copy.loadout,copy.maintenance]) {
      await page.getByRole('tab',{name:new RegExp(`^${name}`)}).click({noWaitAfter:true});
      const bounds=await page.evaluate(()=>{
        const modal=document.querySelector('.survivors-equipment-workspace'),bar=document.querySelector('.survivors-equipment-toolbar'),wallet=document.querySelector('.survivors-toolbar-wallet'),close=bar.querySelector('button');
        const rect=element=>element.getBoundingClientRect(),m=rect(modal),w=rect(wallet),c=rect(close);
        return {overflow:modal.scrollWidth>modal.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1,walletVisible:w.left>=m.left&&w.right<=c.left+1&&w.bottom<=m.bottom,font:getComputedStyle(wallet.querySelector('strong')).fontFamily,surface:getComputedStyle(modal).backgroundColor};
      });
      await page.screenshot({path:`artifacts/tactical-ui/${width}x${height}-${tabs.length}.png`});
      tabs.push({name,...bounds});
    }
    const pass=fonts&&ready.surface==='rgb(22, 26, 29)'&&ready.title.includes('Black Han Sans')&&tabs.every(tab=>!tab.overflow&&tab.walletVisible&&tab.font.includes('Chakra Petch')&&tab.surface==='rgb(22, 26, 29)')&&!errors.length;
    rows.push({width,height,fonts,ready,tabs,errors,pass});await page.close();
  }
  fs.writeFileSync('artifacts/tactical-ui/report.json',JSON.stringify({url,rows},null,2));
  console.log(JSON.stringify(rows));if(rows.some(row=>!row.pass))process.exitCode=1;
}finally{await browser.close();}

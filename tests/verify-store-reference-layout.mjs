import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const copy=JSON.parse(fs.readFileSync('content/localization/survivors-store-ko.json','utf8'));
const url=process.env.PSI_PREVIEW_URL;if(!url)throw Error('Set PSI_PREVIEW_URL');
const output='artifacts/store-reference-layout';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--renderer-process-limit=1']}),rows=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390],[1024,768]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>localStorage.setItem('psi.survivors.store_wallet',JSON.stringify({credits:1260,inventory:{owned:['broadcast_crown','sync_gauntlet'],equipped:['broadcast_crown','sync_gauntlet'],durability:{broadcast_crown:10,sync_gauntlet:40}}})));
  await page.goto(url,{waitUntil:'networkidle'});await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();await page.getByRole('button',{name:copy.shopEntry,exact:true}).click();
  const descriptions=await page.locator('.survivors-store-card').evaluateAll((cards,expected)=>cards.map(card=>{
   const label=card.querySelector('.survivors-store-effect'),use=card.querySelector('.survivors-premium-use'),a=label.getBoundingClientRect(),b=use.getBoundingClientRect(),c=card.getBoundingClientRect();
   return {text:label.textContent,pass:Object.values(expected).some(item=>item.description===label.textContent)&&label.scrollWidth<=label.clientWidth+1&&a.left>=c.left&&a.right<=c.right+1&&a.bottom<=b.top+1};
  }),copy.items);
  await page.locator('.survivors-store-card').last().scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/${width}x${height}-effect-copy.png`});
  await page.getByRole('tab',{name:copy.loadout,exact:true}).click();
  const slots=await page.locator('#store-panel-loadout .survivors-store-slots > div').evaluateAll(elements=>elements.filter(e=>e.querySelector('label')).map(e=>{
   const box=x=>{const b=x.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,height:b.height};},label=box(e.querySelector('label')),buttons=[...e.querySelectorAll('button')].map(box),bounds=box(e);
   const overlap=(a,b)=>Math.min(a.right,b.right)>Math.max(a.left,b.left)+.5&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)+.5;
   return {text:e.querySelector('label').textContent,label,buttons,pass:buttons.every(b=>b.height>=43.5&&!overlap(label,b)&&b.left>=bounds.left-.5&&b.right<=bounds.right+.5)&&buttons.every((b,i)=>buttons.slice(i+1).every(other=>!overlap(b,other)))};
  }));
  await page.screenshot({path:`${output}/${width}x${height}-loadout.png`});
  await page.getByRole('tab',{name:copy.fitting,exact:true}).click();
  for(const [category,id] of [['communication','broadcast_crown'],['tempo','sync_gauntlet'],['logistics','extraction_pack'],['protection','shock_mantle'],['companion','rescue_wing'],['tactics','predictive_watch']]){
    await page.locator(`.survivors-fitting-slots select[aria-label="${copy.categories[category]}"]`).selectOption(id);
  }
  const comparisons=await page.locator('.survivors-fitting-summary dl > div').evaluateAll(rows=>rows.map(row=>{
    const dt=row.querySelector('dt'),dd=row.querySelector('dd'),a=dt.getBoundingClientRect(),b=dd.getBoundingClientRect(),c=row.getBoundingClientRect();
    return {label:dt.textContent,value:Number(dd.childNodes[0].textContent),pass:a.right<=b.left+1&&a.left>=c.left&&b.right<=c.right+1&&dt.scrollWidth<=dt.clientWidth+1&&dd.scrollWidth<=dd.clientWidth+1};
  }));
  const values=Object.fromEntries(comparisons.map(r=>[r.label,r.value]));
  const effectValues=values[copy.fittingShield]===60&&values[copy.fittingShieldPeriod]===18&&values[copy.fittingRegen]===.8&&values[copy.fittingUltimate]===.35&&values[copy.fittingSupport]===2;
  await page.locator('.survivors-fitting-summary dl').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/${width}x${height}-fitting-effects.png`});
  await page.locator('.survivors-fitting-action button').scrollIntoViewIfNeeded();
  const fitting=await page.evaluate(()=>{
   const action=document.querySelector('.survivors-fitting-action'),summary=document.querySelector('.survivors-fitting-summary'),button=action.querySelector('button'),b=button.getBoundingClientRect(),a=action.getBoundingClientRect(),s=summary.getBoundingClientRect(),modal=document.querySelector('.survivors-equipment-workspace').getBoundingClientRect();
   return {position:getComputedStyle(action).position,summaryBottom:s.bottom,actionTop:a.top,buttonHeight:b.height,buttonReachable:b.top>=modal.top&&b.bottom<=modal.bottom+1,pass:s.bottom<=a.top+1&&b.height>=43.5&&b.top>=modal.top&&b.bottom<=modal.bottom+1};
  });
  await page.screenshot({path:`${output}/${width}x${height}-fitting-bottom.png`});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const wallet=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.survivors.store_wallet')));
  rows.push({width,height,descriptions,slots,comparisons,effectValues,fitting,overflow,errors,pass:descriptions.length===16&&descriptions.every(d=>d.pass)&&slots.length===2&&slots.every(s=>s.pass)&&comparisons.every(r=>r.pass)&&effectValues&&wallet.credits===1260&&wallet.inventory.equipped.length===2&&fitting.pass&&!overflow&&!errors.length});await page.close();
 }
 fs.writeFileSync(`${output}/report.json`,JSON.stringify({scope:'EXPLICIT_REFERENCE_INVENTORY_UI_LAYOUT_NOT_PHYSICAL_DEVICE',url,rows},null,2));console.log(JSON.stringify(rows));if(rows.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

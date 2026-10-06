import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const output=path.resolve('artifacts/six-points');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const results=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  console.log(`Review ${width}x${height}`);
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(15000);page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:5196',{waitUntil:'domcontentloaded'});
  const images=[];
  for(const mode of ['defense','story']){
   await page.locator(`.is-${mode}-entry`).click();
   const dialog=page.locator('.mode-preview-dialog');await dialog.waitFor();
   const dimensions=await dialog.locator('.mode-preview-visual img').evaluate(async image=>{await image.decode();return {width:image.naturalWidth,height:image.naturalHeight};});
   images.push({mode,...dimensions});await page.screenshot({path:path.join(output,`${width}x${height}-${mode}.png`)});
   await page.locator('.mode-preview-close').click();
  }
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  const art=await page.evaluate(async()=>{
   const a=await import('/src/ui/survivors-equipment-art.ts');
   const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
   const [base,evolution,tactical]=await Promise.all([load(a.EQUIPMENT_ART),load(a.EVOLUTION_ART),load(a.TACTICAL_EQUIPMENT_ART)]);
   a.registerPropAtlas(base,3,5);a.registerEvolutionAtlas(base,evolution);a.registerTacticalEquipmentAtlas(base,tactical);
   const ids=['radio_boost','extinguisher','floodlight','cone_trap','safety_drone','grouting_gun','emp_generator','satellite_broadcast','cryo_blizzard','tesla_dome','emf_barricade','hunter_swarm','hydraulic_ram','plasma_grid'];
   const chart=document.createElement('canvas');chart.width=840;chart.height=240;chart.id='equipment-review-chart';
   const paint=chart.getContext('2d');const rows=[];
   for(const [index,id] of ids.entries()){
    const tile=document.createElement('canvas');tile.width=120;tile.height=120;const ctx=tile.getContext('2d');
    const drawn=a.drawEquipment(ctx,base,id,5,60,112,96);
    const data=ctx.getImageData(0,0,120,120).data;let filled=0,hash=2166136261;
    for(let i=0;i<data.length;i++){hash=Math.imul(hash^data[i],16777619);if(i%4===3&&data[i]>32)filled++;}
    paint.drawImage(tile,index%7*120,Math.floor(index/7)*120);rows.push({id,drawn,filled,hash:hash>>>0});
   }
   chart.style.cssText='position:fixed;left:0;top:0;z-index:10000;background:#15221e;max-width:100vw;height:auto';document.body.append(chart);
   return rows;
  });
  await page.locator('#equipment-review-chart').screenshot({path:path.join(output,`${width}x${height}-equipment.png`)});
  await page.evaluate(()=>document.querySelector('#equipment-review-chart').remove());
  await page.locator('.survivors-ready-launch .survivors-btn-primary').click();
  await page.locator('.survivors-wave-director-notice').waitFor({state:'hidden'});
  // Isolate the real status component over a running canvas; engine extraction is covered separately.
  await page.evaluate(async()=>{
   const react=await import('/node_modules/.vite/deps/react.js');
   const roots=await import('/node_modules/.vite/deps/react-dom_client.js');
   const createElement=react.createElement??react.default.createElement,createRoot=roots.createRoot??roots.default.createRoot;
   const {SurvivorsExtractionStatus}=await import('/src/ui/SurvivorsExtractionStatus.tsx');
   const host=document.createElement('div');host.id='extraction-review-host';document.querySelector('.survivors-container').append(host);
   createRoot(host).render(createElement(SurvivorsExtractionStatus,{remaining:15,inside:false}));
  });
  await page.locator('.survivors-extraction-status').waitFor();
  const status=await page.locator('.survivors-extraction-status').evaluate(element=>{const r=element.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,pointerEvents:getComputedStyle(element).pointerEvents,centerBlocked:r.left<=innerWidth/2&&r.right>=innerWidth/2&&r.top<=innerHeight/2&&r.bottom>=innerHeight/2};});
  await page.keyboard.down('d');await page.waitForTimeout(250);await page.keyboard.up('d');
  await page.screenshot({path:path.join(output,`${width}x${height}-extraction-status-fixture.png`)});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const pass=images.every(i=>i.width>=1600)&&art.every(row=>row.drawn&&row.filled>200)&&new Set(art.map(row=>row.hash)).size===14&&status.height<=46&&status.pointerEvents==='none'&&!status.centerBlocked&&!overflow&&!errors.length;
  results.push({width,height,images,art,status,overflow,errors,pass});await page.close();
 }
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
 if(results.some(row=>!row.pass))process.exitCode=1;
}finally{await browser.close();}

import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createServer} from 'vite';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output='artifacts/supply-preview';fs.mkdirSync(output,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5196,strictPort:true},plugins:[{name:'supply-preview-fixture',configureServer(server){server.middlewares.use(async(req,res,next)=>{
 if(req.url!=='/qa-supply-preview')return next();
 const html=`<!doctype html><html lang="ko"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module">
 import React from 'react';import {createRoot} from 'react-dom/client';import {SurvivorsContainerShop} from '/src/ui/SurvivorsContainerShop.tsx';import {createInitialSurvivorsState} from '/src/engine/patrol-survivors-engine.ts';import '/src/ui/playable.css';
 const state=createInitialSurvivorsState('player',undefined,'stage_01');state.psiCredits=3000;state.player.cooldownReduction=.5;state.player.dashMaxCooldown=1.8;window.qaState=state;window.qaBefore=JSON.stringify(state);window.qaContinued=0;Math.random=()=>.5;
 createRoot(document.getElementById('root')).render(React.createElement(SurvivorsContainerShop,{completedWave:1,gameState:state,onContinue:()=>{window.qaContinued++;}}));
 </script></html>`;res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml(req.url,html));
 });}}]});await server.listen();const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];
try{for(const [width,height] of [[1440,900],[390,844],[844,390]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto('http://127.0.0.1:5196/qa-supply-preview');
 await page.getByText('구매 후 변화',{exact:true}).first().waitFor();for(const summary of await page.getByText('구매 후 변화',{exact:true}).all())await summary.click();
 const result=await page.evaluate(()=>({unchanged:JSON.stringify(window.qaState)===window.qaBefore,overflow:document.documentElement.scrollWidth>innerWidth,previews:[...document.querySelectorAll('details')].filter(d=>d.querySelector('summary')?.textContent==='구매 후 변화').map(d=>d.textContent)}));
 if(!result.unchanged||result.overflow||errors.length||result.previews.length!==4)throw Error(JSON.stringify({result,errors}));await page.screenshot({path:`${output}/${width}x${height}.png`});
 const purchases=[];
 for(let batch=0;batch<2;batch++){
   if(batch)await page.getByRole('button',{name:/보급 목록 갱신/}).click();
   for(const card of await page.locator('.shop-card').all()){
     const name=await card.locator('h3').textContent(),before=await page.evaluate(()=>structuredClone(window.qaState.player));
     await card.getByRole('button',{name:/장착 ·/}).click();
     const after=await page.evaluate(()=>structuredClone(window.qaState.player));
     if(await card.getByText('구매 후 변화',{exact:true}).count())throw Error('Purchased preview remained');
     if(await card.locator('.shop-buy-btn').count())throw Error('Duplicate purchase action remained');
     purchases.push({name,before,after});
   }
 }
 const capNames=['초전도 긴급 축전지','오버클럭 드론 배터리','응급 세척·지혈 키트'];
 for(const item of purchases.filter(item=>capNames.includes(item.name)))if(JSON.stringify(item.before)!==JSON.stringify(item.after))throw Error(`Capped purchase changed player: ${item.name}`);
 for(const item of purchases){const expected=structuredClone(item.before);
   if(item.name==='고성능 분사 노즐')expected.damageMultiplier+=.15;
   if(item.name==='레이저 조준 모듈')expected.critRate+=.12;
   if(item.name==='강화 강철 토캡 안전화')expected.speed=Math.round(expected.speed*1.12);
   if(item.name==='충격 흡수 세이프티 하네스'){expected.hp+=40;expected.maxHp+=40;}
   if(item.name==='고출력 자재 회수 비콘')expected.pickupRadius=Math.round(expected.pickupRadius*1.45);
   if(JSON.stringify(expected)!==JSON.stringify(item.after))throw Error(`Unexpected purchase delta: ${item.name}`);
 }
 const final=await page.evaluate(()=>({credits:window.qaState.psiCredits,player:window.qaState.player}));
 if(purchases.length!==8||final.credits!==2080)throw Error(JSON.stringify({purchases,final}));
 await page.getByRole('button',{name:/정비 완료/}).click();const continued=await page.evaluate(()=>window.qaContinued===1);if(!continued)throw Error('Continue callback missing');
 rows.push({width,height,...result,purchases,final,continued,errors});await page.close();
}fs.writeFileSync(`${output}/report.json`,JSON.stringify({evidence:'Source shop fixture; read-only previews, not natural wave progression',rows},null,2));console.log('PASS 3 supply preview viewports');}finally{await browser.close();await server.close();}

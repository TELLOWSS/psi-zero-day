import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createServer} from 'vite';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output='artifacts/supply-preview';fs.mkdirSync(output,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5196,strictPort:true},plugins:[{name:'supply-preview-fixture',configureServer(server){server.middlewares.use(async(req,res,next)=>{
 if(req.url!=='/qa-supply-preview')return next();
 const html=`<!doctype html><html lang="ko"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module">
 import React from 'react';import {createRoot} from 'react-dom/client';import {SurvivorsContainerShop} from '/src/ui/SurvivorsContainerShop.tsx';import {createInitialSurvivorsState} from '/src/engine/patrol-survivors-engine.ts';import '/src/ui/playable.css';
 const state=createInitialSurvivorsState('player',undefined,'stage_01');state.psiCredits=500;state.player.cooldownReduction=.5;window.qaState=state;window.qaBefore=JSON.stringify(state);Math.random=()=>.5;
 createRoot(document.getElementById('root')).render(React.createElement(SurvivorsContainerShop,{completedWave:1,gameState:state,onContinue:()=>{}}));
 </script></html>`;res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml(req.url,html));
 });}}]});await server.listen();const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];
try{for(const [width,height] of [[1440,900],[390,844],[844,390]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto('http://127.0.0.1:5196/qa-supply-preview');
 await page.getByText('구매 후 변화',{exact:true}).first().waitFor();for(const summary of await page.getByText('구매 후 변화',{exact:true}).all())await summary.click();
 const result=await page.evaluate(()=>({unchanged:JSON.stringify(window.qaState)===window.qaBefore,overflow:document.documentElement.scrollWidth>innerWidth,previews:[...document.querySelectorAll('details')].filter(d=>d.querySelector('summary')?.textContent==='구매 후 변화').map(d=>d.textContent)}));
 if(!result.unchanged||result.overflow||errors.length||result.previews.length!==4)throw Error(JSON.stringify({result,errors}));await page.screenshot({path:`${output}/${width}x${height}.png`});rows.push({width,height,...result,errors});await page.close();
}fs.writeFileSync(`${output}/report.json`,JSON.stringify({evidence:'Source shop fixture; read-only previews, not natural wave progression',rows},null,2));console.log('PASS 3 supply preview viewports');}finally{await browser.close();await server.close();}

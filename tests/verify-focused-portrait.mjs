import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createServer} from 'vite';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output='artifacts/focused-portrait';fs.mkdirSync(output,{recursive:true});
const styles=[...fs.readFileSync('src/app/main.tsx','utf8').matchAll(/import '(\.\.\/ui\/[^']+\.css)'/g)].map(match=>`import '/src/ui/${match[1].split('/').at(-1)}';`).join('\n');
const server=await createServer({server:{host:'127.0.0.1',port:5196,strictPort:true},plugins:[{name:'focused-portrait-fixture',configureServer(server){server.middlewares.use(async(req,res,next)=>{
 if(!req.url.startsWith('/qa-focused'))return next();
 const html=`<!doctype html><html lang="ko"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="qa"></div><script type="module">
 import React from 'react';import {createRoot} from 'react-dom/client';import {CharacterCard} from '/src/ui/VisualSlot.tsx';import {projectCharacterGrowth} from '/src/app/character-growth.ts';${styles}
 const params=new URLSearchParams(location.search),id=params.get('id')||'player',stage=params.get('stage')||'initial';
 const growth=projectCharacterGrowth({['growth.'+id]:stage},id);window.qaFlags={['growth.'+id]:stage};
 createRoot(document.getElementById('qa')).render(React.createElement(CharacterCard,{person:{id,name:'검증 인물',role:'안전관리자'},portraitUri:'assets/episode01/characters/player-portrait.webp',growth}));
 </script><style>#qa{width:min(260px,calc(100vw - 32px));margin:16px}.character-card{min-height:180px}body{margin:0}</style></html>`;
 res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml(req.url,html));
 });}}]});
await server.listen();const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]])for(const [id,stage,fail] of [['player','initial',false],['player','focused',false],['player','skilled',false],['lim_junho','focused',false],['player','invalid',false],['player','focused',true]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  if(fail)await page.route('**/player-focused-portrait-v1.png',route=>route.abort());
  await page.goto(`http://127.0.0.1:5196/qa-focused?id=${id}&stage=${stage}`);const img=page.locator('.portrait-image');
  await page.waitForFunction(()=>document.querySelector('.portrait-image')?.dataset.loaded==='true');await img.evaluate(img=>img.decode());
  const result=await page.evaluate(()=>{const img=document.querySelector('.portrait-image'),box=img.getBoundingClientRect(),canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let solid=0;for(let i=3;i<data.length;i+=4)if(data[i]>0)solid++;return {src:img.getAttribute('src'),natural:[img.naturalWidth,img.naturalHeight],solid,fit:getComputedStyle(img).objectFit,box:{x:box.x,y:box.y,width:box.width,height:box.height},overflow:document.documentElement.scrollWidth>innerWidth,flags:window.qaFlags};});
  const expected=id==='player'&&stage==='focused'&&!fail?'player-focused-portrait-v1.png':'player-portrait.webp';
  const focusedStyle=await page.evaluate(()=>{const card=document.querySelector('.character-card');return {active:card.dataset.focusedPortrait==='true',mark:getComputedStyle(card.querySelector('.worker-mark')).visibility};});
  if(!result.src.endsWith(expected)||!result.solid||result.overflow||result.box.width<=0||errors.length||(id==='player'&&stage==='focused'&&(result.fit!=='contain'||focusedStyle.mark!=='hidden')))throw Error(JSON.stringify({id,stage,fail,result,focusedStyle,errors}));
  await page.screenshot({path:`${output}/${width}x${height}-${id}-${stage}${fail?'-fallback':''}.png`});rows.push({width,height,id,stage,fail,...result,errors});await page.close();
 }
 fs.writeFileSync(`${output}/report.json`,JSON.stringify({evidence:'Actual CharacterCard source and product CSS; isolated flags fixture, not natural training or full production layout',rows},null,2));console.log(`PASS ${rows.length} portrait paths`);
}finally{await browser.close();await server.close();}

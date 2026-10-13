import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createServer} from 'vite';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output='artifacts/growth-episode-slot';fs.mkdirSync(output,{recursive:true});
const styles=[...fs.readFileSync('src/app/main.tsx','utf8').matchAll(/import '(\.\.\/ui\/[^']+\.css)'/g)].map(m=>`import '/src/ui/${m[1].split('/').at(-1)}';`).join('\n');
const server=await createServer({server:{host:'127.0.0.1',port:5196,strictPort:true},plugins:[{name:'episode-growth-qa',configureServer(server){server.middlewares.use(async(req,res,next)=>{
 if(!req.url.startsWith('/qa-episode-growth'))return next();
 const html=`<!doctype html><html lang="ko"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module">
 import React from 'react';import {createRoot} from 'react-dom/client';import {PlayableEpisode} from '/src/ui/PlayableEpisode.tsx';import {EpisodeSession} from '/src/app/episode-session.ts';${styles}
 const stage=new URLSearchParams(location.search).get('stage');const seed=new EpisodeSession();seed.start(0);const state=structuredClone(seed.getSnapshot().state);state.flags['growth.player']=stage;
 const session=new EpisodeSession();if(!session.resume(state,0))throw Error('Fixture resume failed');
 for(let i=0;i<40&&session.getSnapshot().dialogue?.speaker_id!=='player';i++){const s=session.getSnapshot(),p=s.presentation.find(c=>'node_id'in c);if(!p)throw Error('No authored command');if(p.type==='SHOW_CHOICE'){const c=p.choices.find(c=>c.enabled);session.dispatch({type:'choose_event',instance_id:p.instance_id,node_id:p.node_id,choice_id:c.id},s.revision);}else session.dispatch({type:'advance_event',instance_id:p.instance_id,node_id:p.node_id},s.revision);}
 if(session.getSnapshot().dialogue?.speaker_id!=='player')throw Error('No authored player dialogue');window.qa={stage,event:session.getSnapshot().state.event_runtime.active_instance.event_id,flags:JSON.stringify(session.getSnapshot().state.flags)};
 createRoot(document.getElementById('root')).render(React.createElement(PlayableEpisode,{session}));
 </script></html>`;res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml(req.url,html));
 });}}]});
await server.listen();const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];
try{for(const [width,height] of [[1440,900],[390,844],[844,390]])for(const stage of ['focused','skilled']){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(`http://127.0.0.1:5196/qa-episode-growth?stage=${stage}`);
 await page.waitForFunction(()=>document.querySelector('.character-card .portrait-image')?.dataset.loaded==='true');
 const result=await page.evaluate(()=>{const card=document.querySelector('.character-card'),img=card.querySelector('img'),box=card.getBoundingClientRect();return {...window.qa,src:img.getAttribute('src'),decoded:img.complete&&img.naturalWidth>0,visible:box.width>0&&box.height>0&&getComputedStyle(card).visibility!=='hidden',box:{x:box.x,y:box.y,width:box.width,height:box.height},overflow:document.documentElement.scrollWidth>innerWidth,scene:document.querySelector('.game-frame')?.dataset.productionScene};});
 const tag=await page.locator('.episode-growth-speaker-portrait').evaluate(img=>{const b=img.getBoundingClientRect();return {src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0,x:b.x,y:b.y,width:b.width,height:b.height,label:img.parentElement.querySelector('small')?.textContent};});
 if(errors.length||!result.decoded||!result.src.includes(`player-${stage}-portrait-v1.png`)||result.overflow||!tag.loaded||tag.width<=0||tag.height<=0)throw Error(JSON.stringify({result,tag,errors}));
 result.speakerPortrait=tag;
 await page.screenshot({path:`${output}/${width}x${height}-${stage}.png`});rows.push({width,height,...result,errors});await page.close();
}fs.writeFileSync(`${output}/report.json`,JSON.stringify({evidence:'Full PlayableEpisode and real authored commands from a seeded growth flag; not natural training, production build, or all scenes',rows},null,2));console.log(JSON.stringify(rows));}finally{await browser.close();await server.close();}

import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('content/art/survivors-authored-actor-layouts-v1.json','utf8'));
const ids=['player','kang_taesik','yoon_sungho','lee_jaehoon','lim_junho','safety_monitor'];
const urls=[...new Set(ids.flatMap(id=>data[id].flatMap(d=>[d.src,...d.frames.flatMap(f=>f.src?[f.src]:[])])))];
const path='public/signal-breaker-dev/service-worker.js';const source=fs.readFileSync(path,'utf8');const assets=source.match(/const ASSETS = \[([^\]]+)\]/)[1];const missing=urls.filter(url=>!assets.includes("'"+url+"'"));
if(missing.length)fs.writeFileSync(path,source.replace('const ASSETS = [',"const ASSETS = ["+missing.map(url=>"'"+url+"'").join(', ')+', '));
console.log('Career animation assets: '+urls.length+'; '+Math.round(urls.reduce((n,url)=>n+fs.statSync('public'+url).size,0)/1024/1024*10)/10+' MiB (existing production PNGs)');

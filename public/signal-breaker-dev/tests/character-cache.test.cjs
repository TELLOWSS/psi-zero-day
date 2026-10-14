const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('all six final authored actors can load every pose dependency offline',()=>{
 const root=path.resolve(__dirname,'../../..'),layouts=JSON.parse(fs.readFileSync(path.join(root,'content/art/survivors-authored-actor-layouts-v1.json'),'utf8')),worker=fs.readFileSync(path.join(__dirname,'../service-worker.js'),'utf8');
 const assets=new Set([...worker.match(/const ASSETS = \[([^\]]+)\]/)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]));
 for(const id of ['player','kang_taesik','yoon_sungho','lee_jaehoon','lim_junho','safety_monitor'])for(const layout of layouts[id])for(const url of [layout.src,...layout.frames.flatMap(f=>f.src?[f.src]:[])]){a.ok(assets.has(url),id+' offline pose missing '+url);a.ok(fs.statSync(path.join(root,'public',url)).size>0);}
});

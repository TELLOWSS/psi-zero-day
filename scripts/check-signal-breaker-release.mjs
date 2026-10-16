import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../public/',import.meta.url));
const app=path.join(root,'signal-breaker-dev');
const worker=fs.readFileSync(path.join(app,'service-worker.js'),'utf8');
const cacheName=worker.match(/const CACHE = '([^']+)'/)[1];
const assets=worker.match(/const ASSETS = \[([^\]]+)\]/)[1];
const paths=new Set(['/signal-breaker-dev/index.html','/signal-breaker-dev/service-worker.js','/signal-breaker-dev/art/production-v7.json']);
for(const match of assets.matchAll(/['"]([^'"]+)['"]/g))paths.add(new URL(match[1],'https://release.invalid/signal-breaker-dev/').pathname.replace(/\/$/,'/index.html'));
// Stage soundtracks are verified with release hashes but loaded on demand.
const RELEASE_SOUNDTRACKS=["/signal-breaker-dev/audio/ep01/ch01_ricochet_candidate_v01.ogg","/signal-breaker-dev/audio/ep01/ch02_belt_candidate_v01.ogg","/signal-breaker-dev/audio/ep01/ch03_unfinished_candidate_v01.ogg","/signal-breaker-dev/audio/ep01/ch04_steel_candidate_v01.ogg","/signal-breaker-dev/audio/ep01/ch05_relay_candidate_v01.ogg","/signal-breaker-dev/audio/ep02/ch06_point_contact_candidate_v01.ogg","/signal-breaker-dev/audio/ep02/ch07_ratchet_candidate_v01.ogg","/signal-breaker-dev/audio/ep02/ch08_glass_candidate_v01.ogg","/signal-breaker-dev/audio/ep02/ch09_asymmetric_candidate_v01.ogg","/signal-breaker-dev/audio/ep02/ch10_manual_override_candidate_v01.ogg","/signal-breaker-dev/audio/ep03/ch11_brushed_steel_candidate_v01.ogg","/signal-breaker-dev/audio/ep03/ch12_gantry_candidate_v01.ogg","/signal-breaker-dev/audio/ep03/ch13_perimeter_candidate_v01.ogg","/signal-breaker-dev/audio/ep03/ch14_winch_candidate_v01.ogg","/signal-breaker-dev/audio/ep03/ch15_architect_candidate_v01.ogg"];
for(const pathname of RELEASE_SOUNDTRACKS)paths.add(pathname);
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const files=[...paths].sort().map(url=>{const bytes=fs.readFileSync(path.join(root,url));return {path:url,bytes:bytes.length,sha256:sha(bytes)};});
const expected={schemaVersion:1,version:'0.67.0-raid-monitor',cacheName,fingerprint:sha(JSON.stringify(files)),files};
const target=path.join(app,'release.json');
if(process.argv.includes('--write'))fs.writeFileSync(target,JSON.stringify(expected,null,2)+'\n');
assert.deepEqual(JSON.parse(fs.readFileSync(target,'utf8')),expected,'Release metadata is stale; run node scripts/check-signal-breaker-release.mjs --write');
if(process.argv.includes('--git')){
 for(const file of files){
  const committed=execFileSync('git',['show','HEAD:public'+file.path],{maxBuffer:32*1024*1024});
  assert.equal(sha(committed),file.sha256,file.path+' Git bytes differ from the release; verify LF checkout attributes and commit the exact source');
 }
 console.log('PASS Git byte identity for all '+files.length+' release assets');
}
const remote=process.argv.indexOf('--remote');
if(remote>=0){
 const base=new URL(process.argv[remote+1]);
 const response=await fetch(new URL('release.json',base));assert.equal(response.status,200);
 const published=await response.json();assert.equal(published.fingerprint,expected.fingerprint,'Remote release differs from the local source snapshot');
 const results=await Promise.allSettled(expected.files.map(async file=>{const response=await fetch(new URL(file.path,base),{cache:'no-cache'});assert.equal(response.status,200,file.path);assert.equal(sha(Buffer.from(await response.arrayBuffer())),file.sha256,file.path+' remote byte identity');}));
 for(const result of results)if(result.status==='rejected')throw result.reason;
 console.log('PASS remote release and all '+files.length+' exact asset hashes: '+base.origin);
}else console.log('PASS local release '+expected.version+'; '+files.length+' asset hashes; '+expected.fingerprint.slice(0,12));

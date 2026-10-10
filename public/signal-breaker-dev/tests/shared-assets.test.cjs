const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
test('common URL decodes once across consumers; unused assets never start loading',()=>{
 const requests=[];class Image{set src(value){requests.push(value);}}
 const window={Image,location:{href:'http://localhost/signal-breaker-dev/'}};
 const ctx={window,URL,Map,Object};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../assets/shared/presentation-cache-v1.js'),'utf8'),ctx);
 const assets=window.PSIPresentationAssets;assert.equal(requests.length,0);
 const a=assets.image('/assets/survivors/cinematic-vfx-v3.png'),b=assets.image('../assets/survivors/cinematic-vfx-v3.png');
 assert.equal(a,b);assert.equal(requests.length,1);a.onerror();assert.notEqual(assets.image('/assets/survivors/cinematic-vfx-v3.png'),a);
});
test('preview shares public assets but rejects directory escape',async()=>{
 const {resolveAssetPath}=await import('../shared-paths.mjs');const root=path.resolve('public/assets');
 assert.equal(resolveAssetPath(root,'/assets/survivors/cinematic-vfx-v3.png'),path.join(root,'survivors','cinematic-vfx-v3.png'));
 for(const url of ['/assets/../../package.json','/assets/','/assets/..\\secret','/src/app.js'])assert.equal(resolveAssetPath(root,url),null);
});
test('audio loading coalesces per context and URL',async()=>{
 let requests=0,decodes=0;const window={location:{href:'http://localhost/signal-breaker-dev/'},fetch:async()=>{requests++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};}};
 const ctx={window,URL,Map,Object};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../assets/shared/presentation-cache-v1.js'),'utf8'),ctx);
 const audio={decodeAudioData:async()=>{decodes++;return {duration:1};}};
 const a=window.PSIPresentationAssets.audio(audio,'/assets/test.mp3'),b=window.PSIPresentationAssets.audio(audio,'../assets/test.mp3');assert.equal(a,b);await Promise.all([a,b]);assert.equal(requests,1);assert.equal(decodes,1);
});


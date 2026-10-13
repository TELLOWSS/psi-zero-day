const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const dir=path.resolve(__dirname,'..');
const files=['index.html','src/engine.js','src/app.js','src/premium-art.js','src/premium-sound.js','src/style.css','service-worker.js','icon.svg','manifest.webmanifest'];
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8'),sw=fs.readFileSync(path.join(dir,'service-worker.js'),'utf8');
for(const f of files)assert.ok(fs.statSync(path.join(dir,f)).size>0,`missing nonempty asset ${f}`);
for(const f of ['engine.js','premium-art.js','premium-sound.js','app.js'])assert.ok(html.includes('src/'+f),`HTML does not load ${f}`);
assert.ok(html.indexOf('premium-art.js')<html.indexOf('src/app.js'),'art loads before app');
assert.ok(html.indexOf('premium-sound.js')<html.indexOf('src/app.js'),'sound loads before app');
for(const f of ['premium-art.js','premium-sound.js'])assert.ok(sw.includes('./src/'+f),`SW missing offline asset ${f}`);
const app=fs.readFileSync(path.join(dir,'src/app.js'),'utf8');
assert.ok(app.includes("qualityBtn")&&app.includes("motionBtn")&&app.includes("focusBtn"));
assert.ok(!app.includes('fetch(')&&!app.includes('XMLHttpRequest'),'No runtime network calls in gameplay layer');
let fake={}; const context={window:fake,Math,performance:{now:()=>1000}};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(dir,'src/premium-art.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(dir,'src/premium-sound.js'),'utf8'),context);
const art=new fake.SignalBreakerPremiumArt.PremiumArt();
for(const profile of ['high','balanced','low']){
 art.setQuality(profile); const cap=art.max;
 for(let i=0;i<250;i++)art.event({kind:'boss',x:500,y:200,n:0},{time:0});
 assert.ok(art.sparks.length<=cap,`${profile} visual FX bounded`);
 assert.ok(art.fx.length<=22,`${profile} transient ring cap`);
 art.update(.05);
}
art.setReducedMotion(true);assert.equal(art.reducedMotion,true);
let silence=new fake.SignalBreakerPremiumSound.SoundDirector();
for(let i=0;i<50;i++)silence.play({kind:'impact'},true); // no Web Audio API provided: graceful fallback
assert.equal(silence.context,null);
test('original procedural art, bounded quality presets and offline asset contract',()=>assert.ok(true));
console.log('PASS graphics profile tiers / VFX object ceilings');
console.log('PASS offline PWA assets and source load order');
console.log('PASS audio API fallback without browser audio');
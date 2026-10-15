const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function worker(){
 const listeners={},stored=new Map(),requests=[];let online=true;
 const response=label=>({label,status:200,type:'basic',clone(){return response(label);}});
 const cache={match:async(req,options={})=>{const url=typeof req==='string'?req:req.url;if(stored.has(url))return stored.get(url);if(options.ignoreSearch){const base=new URL(url);base.search='';for(const [key,value] of stored){const candidate=new URL(key);candidate.search='';if(candidate.href===base.href)return value;}}},put:async(req,value)=>stored.set(typeof req==='string'?req:req.url,value)};
 const self={location:{origin:'https://game.test'},registration:{scope:'https://game.test/signal-breaker-dev/'},addEventListener:(name,fn)=>listeners[name]=fn};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../service-worker.js'),'utf8'),{self,URL,caches:{open:async()=>cache},fetch:async req=>{requests.push(req.url);if(!online)throw Error('offline');return response('fresh');}});
 return {stored,requests,offline(){online=false;},async get(url,options={}){let promise;listeners.fetch({request:{url,method:'GET',mode:options.mode||'cors',headers:{has:name=>name==='range'&&!!options.range}},respondWith:p=>promise=p});return promise?await promise:undefined;},response};
}
test('online shell refreshes stale cached code; offline shell falls back within its own cache',async()=>{
 const w=worker(),url='https://game.test/signal-breaker-dev/src/app.js';w.stored.set(url,w.response('stale'));
 assert.equal((await w.get(url)).label,'fresh');w.offline();assert.equal((await w.get(url)).label,'fresh');
 w.stored.set('https://game.test/signal-breaker-dev/index.html',w.response('shell'));
 assert.equal((await w.get('https://game.test/signal-breaker-dev/?resume=1',{mode:'navigate'})).label,'shell');
});
test('shared complete images revalidate online and remain available offline; range and unrelated routes are untouched',async()=>{
 const w=worker(),url='https://game.test/assets/survivors/hero.webp';assert.equal((await w.get(url)).label,'fresh');w.stored.set(url,w.response('stale-art'));assert.equal((await w.get(url)).label,'fresh');w.offline();assert.equal((await w.get(url)).label,'fresh');assert.equal(w.requests.length,3);
 assert.equal(await w.get('https://game.test/assets/survivors/music.mp3',{range:true}),undefined);
 assert.equal(await w.get('https://game.test/another-mode/index.html'),undefined);
});
test('first offline rest navigation with actor parameters uses the rest shell, without relaxing JS version matching',async()=>{
 const w=worker(),base='https://game.test/signal-breaker-dev/';w.stored.set(base+'index.html',w.response('campaign'));w.stored.set(base+'rest.html',w.response('rest'));w.stored.set(base+'src/app.js',w.response('code'));w.offline();assert.equal((await w.get(base+'rest.html?actor=kang_taesik&first=1',{mode:'navigate'})).label,'rest');await assert.rejects(()=>w.get(base+'src/app.js?version=unavailable'),/offline/);
});

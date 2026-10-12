const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function worker({offline=false,range=false}={}){
 const handlers={},stored=new Map(),url='https://game.test/signal-breaker-dev/art/example.webp';stored.set(url,new Response('old-art'));
 let calls=0,option;
 const cache={match:async request=>stored.get(typeof request==='string'?request:request.url)?.clone(),put:async(request,response)=>stored.set(request.url,response)};
 const scope={URL,Response,caches:{open:async()=>cache},self:{location:{origin:'https://game.test'},registration:{scope:'https://game.test/signal-breaker-dev/'},addEventListener:(event,fn)=>handlers[event]=fn},fetch:async(request,options)=>{calls++;option=options;if(offline)throw Error('offline');return new Response('new-art',{status:200});}};
 // Synthetic Response objects have default type; actual same-origin responses are basic.
 scope.fetch=async(request,options)=>{calls++;option=options;if(offline)throw Error('offline');const r=new Response('new-art');Object.defineProperty(r,'type',{value:'basic'});return r;};
 vm.runInNewContext(fs.readFileSync(require.resolve('../service-worker.js'),'utf8'),scope);
 let result;handlers.fetch({request:{method:'GET',url,headers:new Headers(range?{range:'bytes=0-1'}:{}),mode:'cors'},respondWith:promise=>result=promise});
 return {result,stored,url,stats:()=>({calls,option})};
}
test('online media revalidates and replaces stale artwork without requiring storage deletion',async()=>{const w=worker();a.equal(await(await w.result).text(),'new-art');a.equal(w.stats().calls,1);a.equal(w.stats().option.cache,'no-cache');a.equal(await w.stored.get(w.url).text(),'new-art');});
test('offline media retains the complete cached artwork',async()=>{const w=worker({offline:true});a.equal(await(await w.result).text(),'old-art');});
test('ranged media is left to the browser and never cached as a complete file',()=>{const w=worker({range:true});a.equal(w.result,undefined);a.equal(w.stats().calls,0);});

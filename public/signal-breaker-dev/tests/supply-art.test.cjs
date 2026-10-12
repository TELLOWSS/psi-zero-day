const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('new supply atlas has real transparency and bounded four-cell raster mapping',async()=>{
 const sharp=require('../../../node_modules/sharp'),file=__dirname+'/../art/psi-supply-atlas-v1.webp',meta=await sharp(file).metadata();a.equal(meta.hasAlpha,true);a.equal(meta.width%2,0);a.equal(meta.height%2,0);
 const raw=await sharp(file).ensureAlpha().raw().toBuffer();a.equal(raw[3],0);a.ok(meta.width>=1024);
 const img={complete:true,naturalWidth:meta.width,naturalHeight:meta.height},root={PSIPresentationAssets:{image:()=>img}},context={window:root,Math,Set};vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/../src/premium-art.js','utf8'),context);const art=new root.SignalBreakerPremiumArt.PremiumArt(),calls=[],canvas={drawImage:(...v)=>calls.push(v)};
 for(const kind of ['source','power','charge','watch'])a.equal(art.supplySprite(canvas,kind,100,100,34),true);
 a.deepEqual(calls.map(v=>v.slice(1,3)),[[0,0],[meta.width/2,0],[0,meta.height/2],[meta.width/2,meta.height/2]]);a.ok(calls.every(v=>v[7]===34&&v[8]===34));a.equal(art.supplySprite(canvas,'unknown',0,0,34),false);
});

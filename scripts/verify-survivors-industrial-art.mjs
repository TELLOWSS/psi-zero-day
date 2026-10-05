import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/industrial-art');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const results=[];
try {
  for(const [width,height] of [[1440,900],[390,844],[844,390]]) {
    const page=await browser.newPage({viewport:{width,height}}),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5196');
    await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
    const assets=await page.evaluate(async()=>{
      const names=['industrial-hazards-v3.webp','industrial-contacts-v3.webp'];
      const images=await Promise.all(names.map(name=>new Promise((resolve,reject)=>{
        const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=`/assets/survivors/${name}`;
      })));
      const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;
      const ctx=canvas.getContext('2d'),proof=[];
      for(const image of images) {
        ctx.clearRect(0,0,1536,1024);ctx.drawImage(image,0,0);
        const d=ctx.getImageData(0,0,1536,1024).data;
        let transparent=0,opaque=0;
        for(let i=3;i<d.length;i+=4){if(d[i]<8)transparent++;if(d[i]>160)opaque++;}
        proof.push({width:image.naturalWidth,height:image.naturalHeight,transparent,opaque});
      }
      const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
      const update=SurvivorsEngine.prototype.update;
      SurvivorsEngine.prototype.update=function(dt,input){
        const result=update.call(this,dt,input);window.psiIndustrialEngine=this;
        if(!this.qaIndustrial&&this.state.phase==='playing') {
          this.qaIndustrial=true;const {x,y}=this.state.player;
          this.state.hazards=[['RUNAWAY_CART',undefined,-100,-70],['RUNAWAY_CART','reinforced_cart',85,-70],['GAS_LEAK','pulse_gas',-95,70],['GAS_LEAK','split_gas',90,70],['FALLING_DEBRIS',undefined,0,-140]].map(([type,variant,dx,dy],i)=>({id:`qa-${i}`,type,variant,x:x+dx,y:y+dy,hp:100000,maxHp:100000,speed:0,radius:25,damage:0,expValue:0}));
        }
        return result;
      };
      return proof;
    });
    await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
    await page.waitForFunction(()=>window.psiIndustrialEngine?.state.gameTime>.5);
    await page.screenshot({path:path.join(out,`${width}x${height}-gameplay.png`)});
    const contacts=await page.evaluate(async()=>{
      const {drawIndustrialContact}=await import('/src/ui/survivors-industrial-art.ts');
      const {registerPropAtlas}=await import('/src/ui/survivors-equipment-art.ts');
      const image=new Image();image.src='/assets/survivors/industrial-contacts-v3.webp';await image.decode();registerPropAtlas(image,3,2);
      const c=document.createElement('canvas');c.width=360;c.height=160;c.id='psi-contact-proof';
      const ctx=c.getContext('2d'),cells=[];
      for(let i=0;i<6;i++){
        const x=60+i%3*120,y=40+Math.floor(i/3)*80;
        ctx.save();ctx.translate(x,y);
        const actorKind=['RUNAWAY_CART','FALLING_DEBRIS','GAS_LEAK'][i%3];
        const drawn=drawIndustrialContact(ctx,image,{projectileId:'proof',kind:'radio',phase:'impact',x:0,y:0,angle:0,radius:10,actorKind,critical:i>=3},.015,.24,false,false);
        ctx.restore();const d=ctx.getImageData(x-50,y-35,100,70).data;
        cells.push({drawn,pixels:d.filter((n,index)=>index%4===3&&n>20).length});
      }
      Object.assign(c.style,{position:'fixed',top:'80px',left:'0',zIndex:'99999',background:'#394747'});document.body.append(c);
      return cells;
    });
    await page.locator('#psi-contact-proof').screenshot({path:path.join(out,`${width}x${height}-contacts.png`)});
    await page.evaluate(()=>document.querySelector('#psi-contact-proof').remove());
    const result=await page.evaluate(()=>{
      const c=document.querySelector('canvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      return {overflow:document.documentElement.scrollWidth>innerWidth,nonblank:d.some((n,i)=>i%4!==3&&n>50),hazards:window.psiIndustrialEngine.state.hazards.length};
    });
    results.push({width,height,assets,contacts,...result,errors,pass:assets.every(a=>a.transparent>300000&&a.opaque>10000)&&contacts.every(c=>c.drawn&&c.pixels>40)&&result.nonblank&&!result.overflow&&!errors.length});
    await page.close();
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({scope:'CONSTRUCTED_HAZARD_FIXTURES_NOT_NATURAL_PLAY',results},null,2));
  console.log(JSON.stringify(results));if(results.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

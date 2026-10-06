export function materialRibbonPoint(u:number,time:number,side:number,action=0) {
 const t=Number.isFinite(time)?Math.max(0,time):0;
 const p=Math.max(0,Math.min(1,u)),charge=Math.max(0,Math.min(1,action));
 return {x:side*(15+Math.sin(p*Math.PI)*8+Math.sin(t*1.9+p*4)*2),y:-9-p*52,
  width:6+Math.sin(p*Math.PI)*(6+charge*4),alpha:Math.sin(p*Math.PI)**2*(.46+charge*.24),
  texture:.5+.5*Math.sin(t*2-p*5)};
}

const materials=new WeakMap<HTMLImageElement,Map<number,HTMLCanvasElement[]>>();
function materialStrips(atlas:HTMLImageElement,cell:number):HTMLCanvasElement[]|undefined {
 if(typeof document==='undefined')return;
 let cells=materials.get(atlas);if(!cells){cells=new Map();materials.set(atlas,cells);}
 const cached=cells.get(cell);if(cached)return cached;
 const cw=atlas.naturalWidth/4,ch=atlas.naturalHeight/3,strips:HTMLCanvasElement[]=[];
 for(let i=0;i<16;i++){
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.drawImage(atlas,(cell%4+.1+i/15*.6)*cw,(Math.floor(cell/4)+.2)*ch,cw*.2,ch*.6,0,0,64,64);
  ctx.globalCompositeOperation='destination-in';
  for(const vertical of [false,true]){
   const mask=ctx.createLinearGradient(0,0,vertical?0:64,vertical?64:0);
   mask.addColorStop(0,'rgba(0,0,0,0)');mask.addColorStop(.2,'#000');mask.addColorStop(.8,'#000');mask.addColorStop(1,'rgba(0,0,0,0)');
   ctx.fillStyle=mask;ctx.fillRect(0,0,64,64);
  }
  strips.push(canvas);
 }
 cells.set(cell,strips);return strips;
}

/** Advected strips bend a real optical texture along the silhouette, rather than moving a decal. */
export function drawMaterialRibbon(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement,cell:number,time:number,side:number,action:number,drag:number,busy:boolean):void {
 const count=busy?4:8,cw=atlas.naturalWidth/4,ch=atlas.naturalHeight/3;
 const strips=materialStrips(atlas,cell);
 for(let i=0;i<count;i++){
  const p=materialRibbonPoint((i+.5)/count,time,side,action),next=materialRibbonPoint(Math.min(1,(i+.5)/count+.01),time,side,action);
  const angle=Math.atan2(next.y-p.y,next.x-p.x);
  ctx.save();ctx.translate(p.x+drag,p.y);ctx.rotate(angle);ctx.globalAlpha=p.alpha*(busy?.82:1);
  const sx=(cell%4+.1+p.texture*.6)*cw,sy=(Math.floor(cell/4)+.2)*ch;
  if(strips)ctx.drawImage(strips[Math.round(p.texture*15)]!,-52/count*.7,-p.width/2,52/count*1.4,p.width);
  else ctx.drawImage(atlas,sx,sy,cw*.2,ch*.6,-52/count*.7,-p.width/2,52/count*1.4,p.width);
  ctx.restore();
 }
}

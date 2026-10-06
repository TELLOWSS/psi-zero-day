const textures=new WeakMap<HTMLImageElement,HTMLCanvasElement[][]>();
/** Feather painted fragments once on load, not with per-frame filters or pixel reads. */
export function prepareMaterialFragments(image:HTMLImageElement):void{
 if(textures.has(image)||!image.naturalWidth)return;
 const cw=image.naturalWidth/3,ch=image.naturalHeight/2;
 const cells=Array.from({length:6},(_,cell)=>Array.from({length:6},(_,index)=>{
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d')!;
  const phase=index/4,sx=cell%3*cw,sy=Math.floor(cell/3)*ch;
  if(index===5)ctx.drawImage(image,sx+cw*.46,sy+ch*.22,cw*.45,ch*.56,0,0,128,128);
  else ctx.drawImage(image,sx+cw*(.52+phase*.25),sy+ch*(.30+phase*.28),cw*.10,ch*.13,0,0,128,128);
  ctx.globalCompositeOperation='destination-in';
  const mask=ctx.createRadialGradient(64,64,12,64,64,64);mask.addColorStop(0,'rgba(0,0,0,1)');mask.addColorStop(.55,'rgba(0,0,0,.85)');mask.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=mask;ctx.fillRect(0,0,128,128);return canvas;
 }));textures.set(image,cells);
}
export function materialFragmentTexture(image:HTMLImageElement,cell:number,index:number):HTMLCanvasElement|undefined{return textures.get(image)?.[cell]?.[index];}

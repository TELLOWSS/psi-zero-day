import type {FootPoint} from './survivors-foot-lock';
/** Preserve authored limb proportions even when a world contact trails the pelvis. */
export function constrainContactFeet(source:readonly FootPoint[],target:readonly FootPoint[],height:number):FootPoint[]{
 const hipY=-height*.4;
 return source.map((foot,i)=>{
  const wanted=target[i]??foot,rest=Math.max(height*.12,foot.y-hipY);
  const dx=Math.max(-height*.12,Math.min(height*.12,wanted.x-foot.x));
  // Vertical elongation is much more visible than lateral stance adjustment.
  const dy=Math.max(rest*.72,Math.min(rest*1.08,wanted.y-hipY));
  const length=Math.hypot(dx,dy),ratio=Math.min(1,rest*1.08/length);
  return {x:foot.x+dx*ratio,y:hipY+dy*ratio};
 });
}
/** Piecewise affine leg mesh; upper-body pixels and authored identity stay intact. */
function triangle(ctx:CanvasRenderingContext2D,image:CanvasImageSource,s:FootPoint[],d:FootPoint[]):void{
 const [a,b,c]=s as [FootPoint,FootPoint,FootPoint],[p,q,r]=d as [FootPoint,FootPoint,FootPoint];
 const x1=b.x-a.x,y1=b.y-a.y,x2=c.x-a.x,y2=c.y-a.y,det=x1*y2-x2*y1;if(Math.abs(det)<.001)return;
 const m11=((q.x-p.x)*y2-(r.x-p.x)*y1)/det,m21=((q.y-p.y)*y2-(r.y-p.y)*y1)/det,m12=((r.x-p.x)*x1-(q.x-p.x)*x2)/det,m22=((r.y-p.y)*x1-(q.y-p.y)*x2)/det;
 ctx.save();ctx.beginPath();d.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.clip();ctx.transform(m11,m21,m12,m22,p.x-m11*a.x-m12*a.y,p.y-m21*a.x-m22*a.y);ctx.drawImage(image,0,0);ctx.restore();
}
export function drawContactMesh(ctx:CanvasRenderingContext2D,image:HTMLCanvasElement,source:readonly FootPoint[],target:readonly FootPoint[],height:number):void{
 const scale=image.height/height,origin=image.width/2;
 const split=Math.max(image.width*.2,Math.min(image.width*.8,(source[0]!.x+source[1]!.x)*scale/2+origin));
 ctx.save();ctx.scale(1/scale,1/scale);ctx.translate(-origin,-image.height);
 const waist=Math.floor(image.height*.60);ctx.drawImage(image,0,0,image.width,waist+1,0,0,image.width,waist+1);
 const leftLeg=source[0]!.x<=source[1]!.x?0:1;
 for(let leg=0;leg<2;leg++){
  const screenLeft=leg===leftLeg;
  const lo=screenLeft?0:split,hi=screenLeft?split:image.width;
  const delta={x:(target[leg]!.x-source[leg]!.x)*scale,y:(target[leg]!.y-source[leg]!.y)*scale};
  const sole=Math.max(waist+1,source[leg]!.y*scale+image.height),rows=[waist,waist+(sole-waist)*.35,waist+(sole-waist)*.7,sole,image.height];
  for(let row=0;row<4;row++){
   const y=rows[row]!,next=rows[row+1]!;
   const shift=(v:number)=>{const t=Math.max(0,Math.min(1,(v-waist)/(sole-waist)));return t*t*(3-2*t);},a=shift(y),b=shift(next);
   const s=[{x:lo,y},{x:hi,y},{x:lo,y:next},{x:hi,y:next}];
   const d=[{x:lo+delta.x*a,y:y+delta.y*a},{x:hi+delta.x*a,y:y+delta.y*a},{x:lo+delta.x*b,y:next+delta.y*b},{x:hi+delta.x*b,y:next+delta.y*b}];
   triangle(ctx,image,[s[0]!,s[1]!,s[2]!],[d[0]!,d[1]!,d[2]!]);triangle(ctx,image,[s[1]!,s[3]!,s[2]!],[d[1]!,d[3]!,d[2]!]);
  }
 }ctx.restore();
}

type Box={x:number;y:number;width:number;height:number};
type HeadCell={canvas:HTMLCanvasElement;helmet:Box;bounds:Box};
export interface CrewHeadAtlas {id:string;cells:HeadCell[];sizes:Map<number,number>}
const pending=new Map<string,Promise<CrewHeadAtlas|undefined>>();
const ids=new Set(['player','kang_taesik','yoon_sungho','lee_jaehoon','lim_junho','choi_minseok','seo_jeongmin','oh_seungjae']);
function helmetColor(id:string,r:number,g:number,b:number){
  if(['kang_taesik','choi_minseok'].includes(id))return r>130&&g>35&&g<190&&b<110&&r>g*1.17;
  if(['lim_junho','yoon_sungho'].includes(id))return r>145&&g>105&&b<145&&r>g*.9;
  return Math.min(r,g,b)>145&&Math.max(r,g,b)-Math.min(r,g,b)<72;
}
function alphaBounds(data:Uint8ClampedArray,w:number,h:number):Box {
  let l=w,t=h,r=-1,b=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]!>40){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
  if(r<l)throw Error('Empty head cell');return {x:l,y:t,width:r-l+1,height:b-t+1};
}
function helmetBounds(data:Uint8ClampedArray,w:number,h:number,id:string,limit:number,center:number,radius:number,preferTop=true):Box|undefined {
  const seen=new Uint8Array(w*h),candidates:{box:Box;count:number}[]=[];
  const matches=(x:number,y:number)=>{const p=(y*w+x)*4;return data[p+3]!>80&&helmetColor(id,data[p]!,data[p+1]!,data[p+2]!);};
  for(let y=0;y<Math.min(h,limit);y++)for(let x=Math.max(0,Math.floor(center-radius));x<Math.min(w,center+radius);x++){
    const start=y*w+x;if(seen[start]||!matches(x,y))continue;
    const queue=[start];seen[start]=1;let l=x,r=x,t=y,b=y,count=0;
    for(let n=0;n<queue.length;n++){const p=queue[n]!,px=p%w,py=Math.floor(p/w);count++;l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,py);b=Math.max(b,py);
      for(const [nx,ny]of [[px-1,py],[px+1,py],[px,py-1],[px,py+1]])if(nx!>=0&&nx!<w&&ny!>=0&&ny!<Math.min(h,limit)){const k=ny!*w+nx!;if(!seen[k]&&matches(nx!,ny!)){seen[k]=1;queue.push(k);}}}
    const box={x:l,y:t,width:r-l+1,height:b-t+1};if(count>Math.max(8,h*h*.0007)&&box.width>=box.height*.7)candidates.push({box,count});
  }
  return candidates.sort((a,b)=>preferTop?a.box.y-b.box.y||b.count-a.count:b.count-a.count||a.box.y-b.box.y)[0]?.box;
}
export async function loadCrewHeadAtlas(id:string):Promise<CrewHeadAtlas|undefined>{
  if(!ids.has(id))return;
  let p=pending.get(id);if(!p){p=(async()=>{
    const image=new Image();image.src=`/assets/episode01/characters/crew-heads-v1/${id}.webp`;await image.decode();
    const cells:HeadCell[]=[],cw=Math.floor(image.naturalWidth/4),ch=Math.floor(image.naturalHeight/2);
    for(let i=0;i<8;i++){const canvas=document.createElement('canvas');canvas.width=cw;canvas.height=ch;const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,(i%4)*cw,Math.floor(i/4)*ch,cw,ch,0,0,cw,ch);const data=ctx.getImageData(0,0,cw,ch).data,bounds=alphaBounds(data,cw,ch),helmet=helmetBounds(data,cw,ch,id,ch*.65,cw/2,cw/2,false);if(!helmet)throw Error('Helmet missing in '+id+':'+i);cells.push({canvas,helmet,bounds});}
    return {id,cells,sizes:new Map<number,number>()};
  })().catch(error=>{pending.delete(id);throw error;});pending.set(id,p);}return p;
}
/** Presentation composition only: replace the painted head, preserving all body/foot/tool coordinates. */
export function applyCrewHead(canvas:HTMLCanvasElement,atlas:CrewHeadAtlas,direction:number,worldScale:number):boolean {
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!,w=canvas.width,h=canvas.height,data=ctx.getImageData(0,0,w,h).data;
  let sum=0,count=0;for(let y=Math.floor(h*.45);y<h*.58;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]!>80){sum+=x;count++;}
  const center=count?sum/count:w/2,helmet=helmetBounds(data,w,h,atlas.id,h*.35,center,Math.max(h*.2,w*.28));if(!helmet)return false;
  const rawRef=atlas.cells[direction]!;const ref={...rawRef,helmet:rawRef.helmet.width<rawRef.bounds.width*.5?{...rawRef.bounds,height:rawRef.bounds.height*.5}:rawRef.helmet};if(!atlas.sizes.has(direction))atlas.sizes.set(direction,helmet.width*worldScale);
  const scale=atlas.sizes.get(direction)!/worldScale/ref.helmet.width;
  let skinBottom=helmet.y+helmet.height;
  for(let y=Math.floor(helmet.y+helmet.height*.6);y<Math.min(h*.34,helmet.y+helmet.width*1.55);y++)for(let x=Math.floor(helmet.x+helmet.width*.18);x<Math.min(w,helmet.x+helmet.width*.82);x++){
    const k=(y*w+x)*4,r=data[k]!,g=data[k+1]!,b=data[k+2]!;
    if(data[k+3]!>80&&r>95&&r>g*1.05&&g>b*1.04&&r-b>20)skinBottom=Math.max(skinBottom,y);
  }
  const bottom=Math.max(skinBottom,helmet.y+helmet.width*1.05),destHeight=ref.bounds.height*scale;
  const dx=helmet.x+helmet.width/2-(ref.helmet.x+ref.helmet.width/2-ref.bounds.x)*scale,dy=bottom-destHeight;
  ctx.clearRect(Math.max(0,helmet.x-helmet.width*.08),Math.max(0,helmet.y-3),helmet.width*1.16,bottom-helmet.y+3);
  ctx.drawImage(ref.canvas,ref.bounds.x,ref.bounds.y,ref.bounds.width,ref.bounds.height,dx,dy,ref.bounds.width*scale,destHeight);
  canvas.dataset.crewHeadIdentity=atlas.id;canvas.dataset.crewHeadDirection=String(direction);return true;
}

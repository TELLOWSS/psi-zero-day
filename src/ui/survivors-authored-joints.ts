import type {FootPoint} from './survivors-foot-lock';
/** Find the soles, including a lifted boot above the old bottom-sixth crop. */
export function authoredBootSoles(pixels:Uint8ClampedArray,width:number,height:number,anchor:number,brown:boolean):FootPoint[]{
 const footwear=(i:number)=>{const r=pixels[i]!,g=pixels[i+1]!,b=pixels[i+2]!;return brown?r>g*1.06&&g>b*1.06:Math.max(r,g,b)<115&&Math.max(r,g,b)-Math.min(r,g,b)<15;};
 return [0,1].map(side=>{
  const candidates:FootPoint[]=[];
  for(let y=Math.floor(height*.66);y<height;y++)for(let x=0;x<width;x++){
   const i=(y*width+x)*4;if((x<anchor?0:1)===side&&pixels[i+3]!>=32&&footwear(i))candidates.push({x,y});
  }
  if(candidates.length<4){for(let y=Math.floor(height*.84);y<height;y++)for(let x=0;x<width;x++)if((x<anchor?0:1)===side&&pixels[(y*width+x)*4+3]!>=32)candidates.push({x,y});}
  if(!candidates.length)return {x:anchor,y:height-1};
  const sole=Math.max(...candidates.map(p=>p.y)),edge=candidates.filter(p=>p.y>=sole-Math.max(2,height*.012));
  return {x:edge.reduce((sum,p)=>sum+p.x,0)/edge.length,y:sole};
 });
}

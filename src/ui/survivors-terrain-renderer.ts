import type {TerrainObject} from '../domain/survivors-terrain';
import copy from '../../content/localization/survivors-terrain-ko.json';
export function drawTerrain(ctx:CanvasRenderingContext2D,objects:readonly TerrainObject[],image:HTMLImageElement|undefined,player:{x:number;y:number}):void {
 for(const o of objects){
  ctx.save();
  if(o.hp<=0){ctx.strokeStyle='#65b69b';ctx.setLineDash([6,5]);ctx.strokeRect(o.x,o.y,o.width,o.height);ctx.restore();continue;}
  ctx.fillStyle='#17232480';ctx.fillRect(o.x,o.y,o.width,o.height);
  ctx.strokeStyle=o.kind==='rubble'?'#65dbaf':'#fbbf24';ctx.lineWidth=2;ctx.setLineDash([7,4]);ctx.strokeRect(o.x,o.y,o.width,o.height);ctx.setLineDash([]);
  if(image?.naturalWidth){
   const cell=o.kind==='pillar'?0:o.kind==='cover'?1:2,sw=image.naturalWidth/3,sh=image.naturalHeight;
   const w=o.width*1.2,h=o.kind==='pillar'?o.height+50:o.height+35;
   ctx.globalAlpha=Math.hypot(player.x-(o.x+o.width/2),player.y-(o.y+o.height/2))<100?.65:1;
   ctx.drawImage(image,cell*sw,0,sw,sh,o.x-(w-o.width)/2,o.y+o.height-h,w,h);
  }
  ctx.globalAlpha=1;ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle=o.kind==='rubble'?'#9af3cd':'#ffe09a';
  ctx.fillText(copy[o.kind],o.x+o.width/2,o.y+o.height+17);
  if(o.kind==='rubble'){ctx.fillStyle='#172524';ctx.fillRect(o.x,o.y+o.height+23,o.width,4);ctx.fillStyle='#65dbaf';ctx.fillRect(o.x,o.y+o.height+23,o.width*o.hp/o.maxHp,4);}
  ctx.restore();
 }
}

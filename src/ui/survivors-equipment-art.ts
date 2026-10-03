import campaign from '../../content/localization/survivors-campaign20-ko.json';
import type { BaseWeaponId, PerkId } from '../domain/patrol-survivors';

export const PICKUP_ART='/assets/survivors/pickup-atlas-v2.webp';
export const EQUIPMENT_ART='/assets/survivors/equipment-growth-v1.webp';
export const EQUIPMENT_ROWS: Record<BaseWeaponId,number>={radio_boost:0,extinguisher:1,floodlight:2,cone_trap:3,safety_drone:4};
const EVOLVED: Partial<Record<PerkId,BaseWeaponId>>={satellite_broadcast:'radio_boost',cryo_blizzard:'extinguisher',tesla_dome:'floodlight',emf_barricade:'cone_trap',hunter_swarm:'safety_drone'};
export function equipmentAppearance(id:PerkId,level:number) {
 const base=EVOLVED[id] ?? id;
 if(!(base in EQUIPMENT_ROWS)) return null;
 const lv=Math.min(5,Math.max(1,Math.round(level))),evolved=Boolean(EVOLVED[id]);
 const tier=evolved?2:Math.floor((lv-1)/2);
 return {base:base as BaseWeaponId,level:lv,tier,cell:EQUIPMENT_ROWS[base as BaseWeaponId]*3+tier,evolved,module:lv===2||lv===4,scale:1+(lv-1)*.055};
}
export function stageGroundUri(stageId:string):string {
 const sequel=campaign.stages.find(stage=>stage.id===stageId);if(sequel)return `/assets/survivors/${sequel.ground}-ground-v3.webp`;
 if(['stage_02','stage_06'].includes(stageId)) return '/assets/survivors/excavation-ground-v3.webp';
 if(stageId==='stage_07') return '/assets/survivors/demolition-ground-v3.webp';
 if(['stage_05','stage_09','stage_10'].includes(stageId)) return '/assets/survivors/industrial-ground-v3.webp';
 return '/assets/survivors/concrete-ground-v3.webp';
}

// Scan alpha and bake the tightly fitted texture once; steady frames use drawImage.
const atlases=new WeakMap<HTMLImageElement,HTMLCanvasElement[]>();
export function registerPropAtlas(image:HTMLImageElement,columns:number,rows:number):void {
 if(atlases.has(image)||!image.naturalWidth) return;
 const scratch=document.createElement('canvas');scratch.width=image.naturalWidth;scratch.height=image.naturalHeight;
 const ctx=scratch.getContext('2d',{willReadFrequently:true});if(!ctx)return;
 ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,scratch.width,scratch.height).data;
 const frames:HTMLCanvasElement[]=[];
 for(let cell=0;cell<columns*rows;cell++) {
  const x0=Math.floor(cell%columns*scratch.width/columns),x1=Math.floor((cell%columns+1)*scratch.width/columns);
  const y0=Math.floor(Math.floor(cell/columns)*scratch.height/rows),y1=Math.floor((Math.floor(cell/columns)+1)*scratch.height/rows);
  let left=x1,right=x0,top=y1,bottom=y0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(pixels[(y*scratch.width+x)*4+3]!>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const frame=document.createElement('canvas');frame.width=256;frame.height=256;
  if(right>=left&&bottom>=top){const w=right-left+1,h=bottom-top+1,scale=248/Math.max(w,h);frame.getContext('2d')?.drawImage(image,left,top,w,h,(256-w*scale)/2,252-h*scale,w*scale,h*scale);}
  frames.push(frame);
 }
 atlases.set(image,frames);
}
export function drawProp(ctx:CanvasRenderingContext2D,image:HTMLImageElement|undefined,cell:number,x:number,y:number,size:number):boolean {
 if(!image)return false;const frame=atlases.get(image)?.[cell];if(!frame)return false;
 ctx.drawImage(frame,x-size/2,y-size,size,size);return true;
}
export function drawEquipment(ctx:CanvasRenderingContext2D,image:HTMLImageElement|undefined,id:PerkId,level:number,x:number,y:number,size:number,pickupImage?:HTMLImageElement):boolean {
 const art=equipmentAppearance(id,level);if(!art)return false;
 if(!drawProp(ctx,image,art.cell,x,y,size*art.scale))return false;
 if(art.module){ // Added power/controller modules use the approved pickup texture.
  drawProp(ctx,pickupImage,art.base==='cone_trap'?6:3,x+size*.30,y+size*.04,size*.36);
 }
 return true;
}

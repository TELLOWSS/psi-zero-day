import {STORE_ITEMS} from '../domain/survivors-store';
import type {PremiumPresenceImages} from './survivors-equipment-animation';

type Palette=keyof PremiumPresenceImages;
const categoryPalette:Record<string,Palette>={communication:'gold',tempo:'violet',logistics:'gold',protection:'cyan',companion:'cyan',tactics:'gold'};
export function premiumPresenceProfile(ids:readonly string[],busy=false,actionStrength=0){
  const items=[...new Set(ids)].map(id=>STORE_ITEMS.find(item=>item.id===id)).filter(item=>item!==undefined);
  const weights:Record<Palette,number>={gold:0,cyan:0,violet:0};
  for(const item of items)weights[categoryPalette[item.category]!]+=item.rarity==='legendary'?3:item.rarity==='elite'?2:1;
  const palettes=(Object.keys(weights) as Palette[]).filter(p=>weights[p]>0).sort((a,b)=>weights[b]-weights[a]);
  const action=Number.isFinite(actionStrength)?Math.max(0,Math.min(1,actionStrength)):0;
  const count=Math.min(6,items.length);
  const expansion=action*(busy?.6:1);
  return {count,left:palettes[0]??'gold',right:palettes[1]??palettes[0]??'gold',
    width:88+count*3+expansion*32,height:104+count*3+expansion*28,
    alpha:(busy?.12:.16)+count*.012+action*(busy?.24:.54)};
}

/** Body-local authored wisps: the opaque actor is drawn afterward over the empty center. */
export function drawPremiumPresence(ctx:CanvasRenderingContext2D,images:PremiumPresenceImages|undefined,ids:readonly string[],time:number,reduced:boolean,busy=false,action=0):void {
  if(reduced||!images)return;
  const profile=premiumPresenceProfile(ids,busy,action);if(!profile.count)return;
  const t=Number.isFinite(time)?Math.max(0,time):0,cursor=(t*1.4%1)*6;
  const frame=Math.floor(cursor),blend=cursor-frame;
  ctx.save();ctx.globalCompositeOperation='screen';
  for(const [index,weight] of [[frame,1-blend],[(frame+1)%6,blend]] as [number,number][]){
    if(!weight)continue;
    ctx.globalAlpha=Math.min(.98,profile.alpha)*weight;
    ctx.drawImage(images[profile.left],index*256,0,128,256,-profile.width/2,-34-profile.height/2,profile.width/2,profile.height);
    ctx.drawImage(images[profile.right],index*256+128,0,128,256,0,-34-profile.height/2,profile.width/2,profile.height);
  }
  ctx.restore();
}

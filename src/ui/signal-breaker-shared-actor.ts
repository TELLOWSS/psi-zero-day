export {presentationEvent} from './signal-breaker-presentation-event';
import identity from '../../public/assets/shared/character-identity-ko.json';
import {loadDirectionalActor,drawDirectionalBody,directionalSocket,directionalHandMasks} from './survivors-directional-art';
import {actorTorsoPoint} from './survivors-rig-renderer';
import {SpriteMotionTracker} from './survivors-sprite-motion';

/** Reuse WATCH presentation; breaker physics remains the only position owner. */
export const characters=[
 {id:'player',textId:'breaker.actor.player',src:'/assets/episode01/characters/player-map.webp'},
 {id:'kang_taesik',textId:'breaker.actor.kang',src:'/assets/episode01/characters/kang-taesik-map.webp'},
 {id:'yoon_sungho',textId:'breaker.actor.yoon',src:'/assets/episode01/characters/yoon-sungho-map.webp'},
 {id:'lee_jaehoon',textId:'breaker.actor.lee',src:'/assets/episode01/characters/lee-jaehoon-map.webp'},
 {id:'lim_junho',textId:'breaker.actor.lim',src:'/assets/episode01/characters/lim-junho-map.webp'},
 {id:'safety_monitor',textId:'breaker.actor.monitor',src:'/assets/survivors/safety-monitor-v2.webp'}
] as const;
export const characterIdentity=identity;
export function createActor(characterId='player'){
 const character=characters.find(c=>c.id===characterId)??characters[0];
 const cache=(window as Window & {PSIPresentationAssets?:{image:(url:string)=>HTMLImageElement}}).PSIPresentationAssets;const tools=cache?.image(new URL('art/breaker-six-tools-final-v3.webp',document.baseURI).href);
 const tracker=new SpriteMotionTracker();const image=new Image();let ready=false,failed=false;
 image.onload=()=>{void loadDirectionalActor(image).then(value=>{ready=value;failed=!value;}).catch(()=>{failed=true;});};
 image.onerror=()=>{failed=true;};image.src=character.src;
 return {
  status:()=>({ready,failed,characterId:character.id}),
  fire(entity:object,time:number,angle:number){tracker.act(entity,time,'shot',angle);},
  draw(ctx:CanvasRenderingContext2D,entity:object,x:number,y:number,time:number,hp:number,weapon?:string,launch?:{muzzle:{x:number;y:number};direction:{x:number;y:number};cell?:number;color?:string}){
   if(!ready)return false;
   const pose=tracker.sample(entity,x,y,time,hp);
   ctx.save();ctx.translate(x,y);const drawn=drawDirectionalBody(ctx,image,96,pose);ctx.restore();
   if(drawn&&weapon&&launch){
    const wrist=directionalSocket(image,pose,96,'wrist');
    if(wrist){const point=actorTorsoPoint(wrist,{...pose,directional:true},96,true);
     const wx=x+point.x,wy=y+point.y,angle=Math.atan2(launch.muzzle.y-wy,launch.muzzle.x-wx),length=Math.hypot(launch.muzzle.x-wx,launch.muzzle.y-wy);
     ctx.save();ctx.translate(wx,wy);ctx.rotate(angle);ctx.fillStyle='#274757';ctx.strokeStyle=launch.color??(weapon==='net'?'#9dffe1':'#ffe1a5');ctx.lineWidth=1;
     if(tools?.complete&&tools.naturalWidth){
      const cell=launch.cell??0,cw=tools.naturalWidth/3,ch=tools.naturalHeight/2,grips=[[.18,.76],[.18,.75],[.18,.76],[.20,.77],[.18,.75],[.18,.77]],tips=[[.97,.44],[.97,.47],[.97,.48],[.97,.46],[.97,.48],[.97,.48]];
      const grip=grips[cell]!,tip=tips[cell]!,dx=(tip[0]!-grip[0]!)*cw,dy=(tip[1]!-grip[1]!)*ch,scale=length/Math.hypot(dx,dy);ctx.rotate(-Math.atan2(dy,dx));ctx.drawImage(tools,(cell%3)*cw,Math.floor(cell/3)*ch,cw,ch,-grip[0]!*cw*scale,-grip[1]!*ch*scale,cw*scale,ch*scale);
     }else{ctx.beginPath();ctx.roundRect(-6,-5,length+6,10,3);ctx.fill();ctx.stroke();}ctx.restore();
     ctx.canvas.dataset.breakerWrist=JSON.stringify({x:wx,y:wy});
     ctx.canvas.dataset.breakerMuzzle=JSON.stringify(launch.muzzle);
     const masks=directionalHandMasks(image,pose,96);
     if(wrist.rear){ctx.save();ctx.translate(x,y);drawDirectionalBody(ctx,image,96,pose);ctx.restore();}else if(masks.length){ctx.save();ctx.translate(x,y);ctx.beginPath();
      for(const mask of masks){const corners=[[mask.x,mask.y],[mask.x+mask.width,mask.y],[mask.x+mask.width,mask.y+mask.height],[mask.x,mask.y+mask.height]];
       corners.forEach(([px,py],i)=>{const q=actorTorsoPoint({x:px!,y:py!},{...pose,directional:true},96,true);if(i===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);});ctx.closePath();}
      ctx.clip();drawDirectionalBody(ctx,image,96,pose);ctx.restore();
     }
    }
   }
   return drawn;
  }
 };
}

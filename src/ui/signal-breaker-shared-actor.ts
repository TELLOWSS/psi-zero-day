export {presentationEvent} from './signal-breaker-presentation-event';
import identity from '../../public/assets/shared/character-identity-ko.json';
import {loadDirectionalActor,drawDirectionalBody,directionalSocket,directionalHandMasks} from './survivors-directional-art';
import {actorTorsoPoint} from './survivors-rig-renderer';
import {BreakerAimMotion,equippedToolPose} from './signal-breaker-actor-motion';
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
 const cache=(window as Window & {PSIPresentationAssets?:{image:(url:string)=>HTMLImageElement}}).PSIPresentationAssets;const tools=cache?.image(new URL('art/breaker-six-tools-ui-v4.webp',document.baseURI).href);
 const tracker=new SpriteMotionTracker(),aimMotion=new BreakerAimMotion();let lastMotion:unknown=null,lastEquipment:unknown=null;const image=new Image();let ready=false,failed=false;
 image.onload=()=>{void loadDirectionalActor(image).then(value=>{ready=value;failed=!value;}).catch(()=>{failed=true;});};
 image.onerror=()=>{failed=true;};image.src=character.src;
 return {
  status:()=>({ready,failed,characterId:character.id,motion:lastMotion,equipment:lastEquipment}),
  fire(entity:object,time:number,angle:number,weapon='pulse'){tracker.act(entity,time,['mist','net','scan'].includes(weapon)?'spray':'shot',angle);},
  draw(ctx:CanvasRenderingContext2D,entity:object,x:number,y:number,time:number,hp:number,weapon?:string,launch?:{muzzle:{x:number;y:number};direction:{x:number;y:number};cell?:number;color?:string;equipmentTier?:number;reducedMotion?:boolean}){
   if(!ready)return false;
   const sampled=tracker.sample(entity,x,y,time,hp);
   // Breaker permits strafing: the body and tool face the shot, not the travel direction.
   const angle=launch?Math.atan2(launch.direction.y,launch.direction.x):undefined;
   const blended=angle===undefined?sampled:aimMotion.sample(sampled,time,angle);const pose=launch?.reducedMotion?{...blended,action:0}:blended;lastMotion={mode:pose.mode,moving:pose.moving,speed:pose.speed,cycle:pose.authoredCycle,angle:pose.visualAngle,turning:pose.turning,actionKind:pose.actionKind,action:pose.action,reaction:pose.reaction};
   if(launch)ctx.canvas.dataset.breakerFacing=String(pose.direction);
   ctx.save();ctx.translate(x,y);const drawn=drawDirectionalBody(ctx,image,96,pose);ctx.restore();
   if(drawn&&weapon&&launch){
    const wrist=directionalSocket(image,pose,96,'wrist');
    if(wrist){const point=actorTorsoPoint(wrist,{...pose,directional:true},96,true);
     const wx=x+point.x,wy=y+point.y,equipped=equippedToolPose(launch.muzzle,launch.direction,launch.cell??0,pose.action,launch.equipmentTier);const angle=Math.atan2(launch.direction.y,launch.direction.x),length=equipped.length;lastEquipment={weapon,tier:equipped.tier,length,grip:equipped.grip,tip:equipped.tip};
     ctx.save();ctx.strokeStyle='#547077';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(wx,wy);ctx.lineTo(equipped.grip.x,equipped.grip.y);ctx.stroke();ctx.translate(equipped.grip.x,equipped.grip.y);ctx.rotate(angle);ctx.fillStyle='#274757';ctx.strokeStyle=launch.color??(weapon==='net'?'#9dffe1':'#ffe1a5');ctx.lineWidth=1;
     if(tools?.complete&&tools.naturalWidth){
      const cell=launch.cell??0,cw=tools.naturalWidth/3,ch=tools.naturalHeight/2,grips=[[.18,.76],[.18,.75],[.18,.76],[.20,.77],[.18,.75],[.18,.77]],tips=[[.97,.44],[.97,.47],[.97,.48],[.97,.46],[.97,.48],[.97,.48]];
      const grip=grips[cell]!,tip=tips[cell]!,dx=(tip[0]!-grip[0]!)*cw,dy=(tip[1]!-grip[1]!)*ch,scale=length/Math.hypot(dx,dy);ctx.save();ctx.rotate(-Math.atan2(dy,dx));ctx.drawImage(tools,(cell%3)*cw,Math.floor(cell/3)*ch,cw,ch,-grip[0]!*cw*scale,-grip[1]!*ch*scale,cw*scale,ch*scale);ctx.restore();
      ctx.strokeStyle=launch.color??'#ffd18d';ctx.lineWidth=1.2;for(let mark=0;mark<equipped.tier;mark++){const rx=9+mark*3;ctx.beginPath();ctx.moveTo(rx,-5);ctx.lineTo(rx,5);ctx.stroke();}
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

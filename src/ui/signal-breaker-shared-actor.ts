import {loadDirectionalActor,drawDirectionalBody,directionalSocket} from './survivors-directional-art';
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
export function createActor(characterId='player'){
 const character=characters.find(c=>c.id===characterId)??characters[0];
 const tracker=new SpriteMotionTracker();const image=new Image();let ready=false,failed=false;
 image.onload=()=>{void loadDirectionalActor(image).then(value=>{ready=value;failed=!value;}).catch(()=>{failed=true;});};
 image.onerror=()=>{failed=true;};image.src=character.src;
 return {
  status:()=>({ready,failed,characterId:character.id}),
  fire(entity:object,time:number,angle:number){tracker.act(entity,time,'shot',angle);},
  draw(ctx:CanvasRenderingContext2D,entity:object,x:number,y:number,time:number,hp:number,weapon?:string,aim?:{x:number;y:number}){
   if(!ready)return false;
   const pose=tracker.sample(entity,x,y,time,hp);
   ctx.save();ctx.translate(x,y);const drawn=drawDirectionalBody(ctx,image,96,pose);ctx.restore();
   if(drawn&&weapon&&aim){
    const wrist=directionalSocket(image,pose,96,'wrist');
    if(wrist){const point=actorTorsoPoint(wrist,{...pose,directional:true},96,true);
     const wx=x+point.x,wy=y+point.y,angle=Math.atan2(aim.y-wy,aim.x-wx);
     ctx.save();ctx.translate(wx,wy);ctx.rotate(angle);ctx.fillStyle='#274757';ctx.strokeStyle=weapon==='net'?'#9dffe1':'#ffe1a5';ctx.lineWidth=1;
     ctx.beginPath();ctx.roundRect(-6,-5,28,10,3);ctx.fill();ctx.stroke();ctx.restore();
     ctx.canvas.dataset.breakerWrist=JSON.stringify({x:wx,y:wy});
    }
   }
   return drawn;
  }
 };
}

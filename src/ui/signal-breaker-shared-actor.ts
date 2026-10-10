import {loadDirectionalActor,drawDirectionalBody} from './survivors-directional-art';
import {SpriteMotionTracker} from './survivors-sprite-motion';

/** Reuse WATCH presentation; breaker physics remains the only position owner. */
export function createActor(){
 const tracker=new SpriteMotionTracker();const image=new Image();let ready=false,failed=false;
 image.onload=()=>{void loadDirectionalActor(image).then(value=>{ready=value;failed=!value;}).catch(()=>{failed=true;});};
 image.onerror=()=>{failed=true;};image.src='/assets/episode01/characters/player-map.webp';
 return {
  status:()=>({ready,failed}),
  fire(entity:object,time:number,angle:number){tracker.act(entity,time,'shot',angle);},
  draw(ctx:CanvasRenderingContext2D,entity:object,x:number,y:number,time:number,hp:number){
   if(!ready)return false;
   const pose=tracker.sample(entity,x,y,time,hp);
   ctx.save();ctx.translate(x,y);const drawn=drawDirectionalBody(ctx,image,96,pose);ctx.restore();return drawn;
  }
 };
}

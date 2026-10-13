import type {SurvivorsGameState} from '../domain/patrol-survivors';
import type {SpritePose} from './survivors-sprite-motion';
import {premiumBodySocket} from './survivors-wearable-art';
import {actorTorsoPoint} from './survivors-rig-renderer';
import {ACTOR_RIGS} from './survivors-animation-rig';
import {metalImpactFrame} from './survivors-authored-metal-impact';
import {isDirectionalActor,directionalSocket} from './survivors-directional-art';

export const RECOVERY_CELL_FLOW_ART='/assets/survivors/recovery-cell-flow-v1.png';
const origins=[[263,411],[263,415],[265,416],[267,385],[267,387],[267,386]] as const;
const duration=.8,cadence=1.4;

/** One short body-mounted flow per recovery cadence, never an idle floor loop. */
export class RecoveryFlow {
 private run?:SurvivorsGameState;
 private start?:number;
 private last=-Infinity;
 get count():number{return this.start===undefined?0:1;}
 observe(state:SurvivorsGameState):void {
  if(this.run!==state){this.run=state;this.start=undefined;this.last=-Infinity;}
  if(!state.premiumGear?.equipped.includes('recovery_cell')){this.start=undefined;this.last=-Infinity;return;}
  if(this.start!==undefined&&state.gameTime-this.start>=duration)this.start=undefined;
  if(state.phase!=='playing')return;
  if((state.premiumGear.recoveryAmount??0)<=0)return;
  if(state.gameTime-this.last<cadence)return;
  this.start=state.gameTime;this.last=state.gameTime;
 }
 draw(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,atlas:HTMLImageElement|undefined,reduced:boolean,busy:boolean,actor?:{image:HTMLImageElement;height:number;pose:SpritePose}):boolean {
  if(reduced||!atlas?.naturalWidth||!actor||!state.premiumGear?.equipped.includes('recovery_cell'))return false;
  const socket=premiumBodySocket(state.characterId,actor.image,actor.height,'protection',actor.pose);
  // Rear occlusion is intentional ownership, not a missing-asset fallback.
  if(!socket)return isDirectionalActor(actor.image)&&Boolean(directionalSocket(actor.image,actor.pose,actor.height,'chest')?.rear);
  // Owning the loaded slot also suppresses the old stamp during the quiet interval.
  if(this.start===undefined)return true;
  const frame=metalImpactFrame(state.gameTime-this.start,duration);if(!frame)return true;
  const rigged=Boolean(ACTOR_RIGS[actor.image.src.split('/').pop()??'']);
  const point=actorTorsoPoint(socket,actor.pose,actor.height,rigged);
  const extent=100*actor.height/74,cw=atlas.naturalWidth/3,ch=atlas.naturalHeight/2;
  ctx.save();ctx.translate(state.player.x+point.x,state.player.y+point.y);
  ctx.globalCompositeOperation='source-over';
  const stamp=(index:number,weight:number)=>{
   const [ox,oy]=origins[index]!;ctx.globalAlpha=frame.alpha*weight*(busy?.65:.85);
   ctx.drawImage(atlas,index%3*cw,Math.floor(index/3)*ch,cw,ch,-ox/512*extent,-oy/512*extent,extent,extent);
  };
  if(busy)stamp(frame.blend<.5?frame.frame:frame.next,1);
  else{stamp(frame.frame,1-frame.blend);if(frame.blend>0)stamp(frame.next,frame.blend);}
  ctx.restore();return true;
 }
}

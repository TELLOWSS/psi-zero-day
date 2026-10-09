export interface BonusPickup {id:number;x:number;y:number;collected:boolean;}
export class SurvivorsBonusEngine {
 readonly state={x:.5,y:.85,remaining:30,pickups:[{x:.2,y:.7},{x:.8,y:.7},{x:.5,y:.5},{x:.2,y:.3},{x:.8,y:.3},{x:.5,y:.15}].map((p,id)=>({...p,id,collected:false})),earned:0,finished:false};
 update(dt:number,input:{x:number;y:number}) {
  const s=this.state;if(s.finished||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.1);
  const length=Math.hypot(input.x,input.y);if(Number.isFinite(length)&&length>0){s.x=Math.max(.04,Math.min(.96,s.x+input.x/Math.max(1,length)*dt*.45));s.y=Math.max(.06,Math.min(.94,s.y+input.y/Math.max(1,length)*dt*.45));}
  for(const p of s.pickups)if(!p.collected&&Math.hypot(p.x-s.x,p.y-s.y)<.085){p.collected=true;s.earned+=50;}
  s.remaining=Math.max(0,s.remaining-dt);if(s.pickups.every(p=>p.collected)){s.earned+=100;s.finished=true;}else if(s.remaining===0)s.finished=true;
 }
 finish(){this.state.finished=true;return this.state.earned;}
}

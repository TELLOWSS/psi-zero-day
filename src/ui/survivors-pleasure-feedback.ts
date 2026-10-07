import type {SurvivorsAudioEvent} from '../domain/survivors-audio';
import type {SurvivorsGameState} from '../domain/patrol-survivors';

type Kill=NonNullable<SurvivorsGameState['lastKilledEvents']>[number];
export interface PleasureMark {kind:'pickup'|'safe'|'finish'|'group';x:number;y:number;age:number;duration:number;count:number;}
/** Observes receipts only; never awards currency, changes targets or consumes simulation RNG. */
export class PleasureFeedback {
 marks:PleasureMark[]=[];
 private pending=0;
 private due=0;
 private finishAt=-Infinity;
 private groups=new Map<string,{count:number;x:number;y:number;at:number}>();
 reset(){this.marks=[];this.pending=0;this.due=0;this.finishAt=-Infinity;this.groups.clear();}
 observe(events:readonly SurvivorsAudioEvent[],kills:readonly Kill[],live:number,time:number):boolean {
  for(const event of events)if(event.type==='pickup'&&event.collected&&event.x!==undefined&&event.y!==undefined){
   if(!this.pending)this.due=time+.14;
   this.pending++;
   this.marks.push({kind:'pickup',x:event.x,y:event.y,age:0,duration:.32,count:1});
  }
  for(const kill of kills){
   this.marks.push({kind:'safe',x:kill.x,y:kill.y,age:0,duration:1.1,count:1});
   if(kill.projectileId){
    const group=this.groups.get(kill.projectileId)??{count:0,x:kill.x,y:kill.y,at:time};
    group.count++;group.x=kill.x;group.y=kill.y;group.at=time;this.groups.set(kill.projectileId,group);
   }
  }
  for(const [id,group] of this.groups){
   if(time-group.at>=.12){
    if(group.count>1)this.marks.push({kind:'group',x:group.x,y:group.y,age:0,duration:.8,count:group.count});
    this.groups.delete(id);
   }
  }
  const finished=kills.some(k=>k.type!=='UNHELMETED')&&live===0&&time-this.finishAt>=8;
  if(finished){const last=kills[kills.length-1]!;this.finishAt=time;this.marks.push({kind:'finish',x:last.x,y:last.y,age:0,duration:.7,count:1});}
  this.marks=this.marks.slice(-32);
  return finished;
 }
 update(dt:number,time:number):number {
  this.marks=this.marks.filter(mark=>{mark.age+=Math.max(0,dt);return mark.age<mark.duration;});
  if(!this.pending||time<this.due)return 0;
  const count=this.pending;this.pending=0;return count;
 }
}

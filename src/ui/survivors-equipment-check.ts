export interface EquipmentCheckContext {clock:number;phase:string;moving:boolean;action:number;reaction:number;danger:boolean;reduced:boolean;player:boolean;}
/** An interruptible presentation cue: never changes input, firing or equipment state. */
export class EquipmentCheckDirection {
 private opening=true;
 private idleAt:number|undefined;
 private start:number|undefined;
 private last=-Infinity;
 private progress=0;
 reset(){this.opening=true;this.idleAt=undefined;this.start=undefined;this.last=-Infinity;this.progress=0;}
 sample(context:EquipmentCheckContext):number {
  const {clock,phase,moving,action,reaction,danger,reduced,player}=context;
  if(phase==='paused'||phase==='levelup')return this.progress;
  if(phase!=='playing'||!Number.isFinite(clock)||!player||reduced){this.start=undefined;this.progress=0;return 0;}
  const opening=this.opening;this.opening=false;
  if(moving||action>0||reaction>0||danger){this.idleAt=undefined;this.start=undefined;this.progress=0;return 0;}
  this.idleAt??=clock;
  if(this.start===undefined&&(opening||clock-this.idleAt>=8&&clock-this.last>=18)){this.start=clock;this.last=clock;}
  this.progress=this.start===undefined?0:Math.max(0,(clock-this.start)/.9);
  if(this.progress>=1){this.start=undefined;this.progress=0;}
  return this.progress;
 }
}

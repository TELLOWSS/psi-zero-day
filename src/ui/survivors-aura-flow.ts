/** Three overlapping material wisps, driven only by simulation time. */
export function auraFlow(time:number,index:number,side:number,action:number) {
 const clock=Number.isFinite(time)?Math.max(0,time):0;
 const phase=((clock*(.65+index*.07)+index/3)%1+1)%1;
 const envelope=Math.sin(phase*Math.PI)**2;
 const recoil=Math.max(0,Math.min(1,action));
 return {
  x:side*(12+Math.sin(phase*Math.PI)*8+Math.sin(clock*2+index)*2),
  y:-12-phase*50,
  width:12+envelope*10+recoil*3,
  height:14+envelope*14,
  alpha:envelope*(.24+recoil*.08),
  rotation:side*(.12+Math.sin(clock*1.7+index)*.18),
 };
}

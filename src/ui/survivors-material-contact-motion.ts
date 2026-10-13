/** Material components use distinct trajectories; no simulation coordinates are changed. */
export function materialContactMotion(age:number,duration:number,gas:boolean){
 const t=Math.max(0,Math.min(1,age/Math.max(.001,duration)));
 const travel=1-(1-t)**3;
 return {coreAlpha:(1-t)**3,coreScale:.68+travel*.38,
  fragmentAlpha:Math.sin(Math.min(1,t/.12)*Math.PI/2)*(1-t)**.65,
  fragmentTravel:travel*(gas?14:25),fragmentFall:t*t*(gas?-10:12),
  tailAlpha:Math.sin(Math.PI*t)*(gas?.32:.18),tailScale:.55+travel*.75,t};
}

export function materialFragmentMotion(age:number,duration:number,gas:boolean,index:number,count:number){
 const phase=count<=1?.5:index/(count-1);
 const delay=(index%3)*duration*.045;
 const motion=materialContactMotion(Math.max(0,age-delay),Math.max(.001,duration-delay),gas);
 const angle=(phase-.5)*(gas?2.1:1.8);
 const distance=6+motion.fragmentTravel*(.65+phase*.5);
 // Different velocities and a shrinking vapor curl prevent synchronized stamp motion.
 const curl=gas?Math.sin(motion.t*Math.PI*1.5+index)*motion.t*(1-motion.t)*9:0;
 return {x:Math.cos(angle)*distance,y:Math.sin(angle)*distance+motion.fragmentFall+curl,
  rotation:(index%2?1:-1)*motion.t*(gas?.45:1.2+phase),
  scale:(gas?.75+Math.sin(motion.t*Math.PI)*.35:1-motion.t*.35),
  alpha:age<delay?0:motion.fragmentAlpha};
}

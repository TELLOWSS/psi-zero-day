import type {Hazard,WorkfaceSpecies} from '../domain/patrol-survivors';
import {MATERIAL_FEEL} from '../domain/survivors-material-feel';
/** Painted vapor fragments advect from the outlet. Stable per-entity phase; no RNG or wall time. */
export function hazardVaporPose(h:Pick<Hazard,'id'|'variant'|'behavior'|'motion'>,clock:number,index:number){
 let seed=0;for(let i=0;i<h.id.length;i++)seed=(seed*31+h.id.charCodeAt(i))>>>0;
 const t=((Math.max(0,clock)*.65+index/3+(seed%997)/997)%1),wind=h.behavior==='crosswind'?1:0;
 const pressure=h.variant==='pulse_gas'&&h.motion?.phase==='warning'?1.25:1;
 return {x:(wind*t*.22+Math.sin(t*Math.PI*1.4+index)*t*.055)*pressure,y:-t*.24,rotation:Math.sin(t*Math.PI+index)*.16,scale:.20+t*.20,alpha:Math.sin(t*Math.PI)*.22};
}
/** Independent rigid fragments lift, fall and settle; the source artwork never stretches. */
export function resolutionFragmentPose(species:WorkfaceSpecies,age:number,index:number,reduced=false){
 if(reduced)return {x:0,y:0,angle:0};
 const weight=MATERIAL_FEEL[species].weight,delay=index*.035,t=Math.max(0,Math.min(1,(age-delay)/.9));
 const side=index%3-1,spread=(14+(index%2)*9)*(1-weight*.25),flight=Math.min(1,t/.62);
 const lift=(12+(index%3)*4)*(1-weight*.35)*Math.sin(flight*Math.PI);
 const settle=flight*flight*18,bounce=t>.62?Math.sin(Math.min(1,(t-.62)/.38)*Math.PI)*3*(1-t):0;
 return {x:side*(1-(1-t)**3)*spread,y:settle-lift-bounce,angle:(index%2?1:-1)*(1-(1-t)**2)*(.12+index*.035)};
}

/** Regional art is a visible material, independent of the simulation's species balance. */
export function workfaceResolutionAction(type:Hazard['type'],subject:string):'brake'|'ring'|'crumble'|'cascade'|'vapor'{
 if(type==='GAS_LEAK')return 'vapor';if(type==='RUNAWAY_CART')return 'brake';
 if(/brick|mortar|concrete|splatter/.test(subject))return 'crumble';
 if(/cluster|bundle|braces|elbows|flanges|stack/.test(subject))return 'cascade';
 return 'ring';
}

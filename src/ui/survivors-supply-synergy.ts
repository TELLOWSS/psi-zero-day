import type {PerkId,PatrolStageDefinition} from '../domain/patrol-survivors';
const partners:Record<string,PerkId[]>={
 tuned_nozzle:['extinguisher','cryo_blizzard','grouting_gun','hydraulic_ram'],
 laser_sight:['radio_boost','satellite_broadcast','safety_drone','hunter_swarm'],
 steel_toecap:['extinguisher','cryo_blizzard','magnet_beacon'],
 super_capacitor:['cone_trap','emf_barricade','extinguisher','grouting_gun'],
 drone_overclock:['safety_drone','hunter_swarm','radio_boost','emp_generator','plasma_grid'],
 first_aid_wash:['safety_harness'],safety_harness:['steel_boots','quick_reflexes'],magnet_beacon:['steel_boots','magnet_beacon'],
};
export function supplyPartners(id:string,active:Partial<Record<PerkId,number>>) {
 const options=partners[id]??[];
 const owned=options.filter(key=>(active[key]??0)>0);
 return {owned:owned.length>0,ids:(owned.length?owned:options).slice(0,2)};
}
export function supplyPartnerAvailability(id:string,active:Partial<Record<PerkId,number>>) {
 const options=partners[id]??[];
 return {owned:options.filter(key=>(active[key]??0)>0),missing:options.filter(key=>(active[key]??0)<=0)};
}
export function supplyStageAdvice(id:string,stage:PatrolStageDefinition):'mobility'|'cart'|'fall'|'gas'|'general' {
 if(id==='steel_toecap'||id==='super_capacitor')return 'mobility';
 if(id==='magnet_beacon'&&stage.hazardMix?.includes('GAS_LEAK'))return 'gas';
 if((id==='safety_harness'||id==='first_aid_wash')&&stage.hazardMix?.includes('FALLING_DEBRIS'))return 'fall';
 if(stage.hazardMix?.includes('RUNAWAY_CART')||stage.bossType==='RUNAWAY_CART')return 'cart';
 return 'general';
}

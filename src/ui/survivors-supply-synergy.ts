import type {PerkId} from '../domain/patrol-survivors';
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

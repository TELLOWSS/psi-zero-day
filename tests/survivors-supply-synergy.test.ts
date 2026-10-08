import {expect,it} from 'vitest';
import {supplyPartners} from '../src/ui/survivors-supply-synergy';
it('prioritizes owned base and evolved partners',()=>{
 expect(supplyPartners('tuned_nozzle',{cryo_blizzard:1,radio_boost:3})).toEqual({owned:true,ids:['cryo_blizzard']});
 expect(supplyPartners('drone_overclock',{hunter_swarm:1,safety_drone:0})).toEqual({owned:true,ids:['hunter_swarm']});
});
it('labels missing partners as suggestions and never changes the build',()=>{
 const active={radio_boost:2};const snapshot={...active};
 expect(supplyPartners('first_aid_wash',active)).toEqual({owned:false,ids:['safety_harness']});
 expect(active).toEqual(snapshot);expect(supplyPartners('missing',active)).toEqual({owned:false,ids:[]});
});

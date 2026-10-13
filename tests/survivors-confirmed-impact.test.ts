import {expect,it} from 'vitest';
import {confirmedImpactScale} from '../src/ui/survivors-authored-metal-impact';
import type {ProjectileFeedback} from '../src/domain/survivors-projectile-feedback';
const event:ProjectileFeedback={projectileId:'impact',kind:'radio',phase:'impact',x:0,y:0,angle:0,radius:10};
it('grades authored raster impact size by confirmed damage with bounded growth',()=>{
 expect(confirmedImpactScale(event)).toBe(1);
 expect(confirmedImpactScale({...event,appliedDamage:180})).toBeGreaterThan(confirmedImpactScale({...event,appliedDamage:30}));
 expect(confirmedImpactScale({...event,appliedDamage:1e9})).toBe(1.25);
 expect(confirmedImpactScale({...event,appliedDamage:0})).toBe(.75);
 expect(confirmedImpactScale({...event,blocked:true,appliedDamage:180})).toBe(.75);
 expect(confirmedImpactScale({...event,appliedDamage:NaN})).toBe(1);
});

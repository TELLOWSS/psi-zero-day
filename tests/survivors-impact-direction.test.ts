import {expect,it} from 'vitest';
import {selectImpactAccents} from '../src/ui/survivors-impact-direction';
import type {ProjectileFeedback} from '../src/domain/survivors-projectile-feedback';
const contact:ProjectileFeedback={projectileId:'hit',kind:'radio',phase:'impact',x:0,y:0,angle:0,radius:12};
it('reserves readable contacts, excludes worker/blocked/offscreen facts and caps dense fire',()=>{
 const crowded=Array.from({length:200},(_,i)=>({...contact,projectileId:String(i),x:i*35}));
 const critical={...contact,x:140,critical:true,projectileId:'critical'};
 const events=[...crowded,critical,{...contact,worker:true},{...contact,blocked:true},{...contact,x:NaN}];
 const normal=selectImpactAccents(events,{x:0,y:0},false),busy=selectImpactAccents(events,{x:0,y:0},true);
 expect(normal.size).toBe(6);expect(busy.size).toBe(3);expect(normal.has(critical)).toBe(true);
 expect([...normal].every(e=>!e.worker&&!e.blocked&&Number.isFinite(e.x))).toBe(true);
 expect(selectImpactAccents(Array(100).fill(contact),{x:0,y:0},false).size).toBe(1);
});

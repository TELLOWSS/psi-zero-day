import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
import {feedbackCoreOwners} from './survivors-vfx-composition';

/** Pick readable accents from confirmed contacts before allocating particles. */
export function selectImpactAccents(events:readonly ProjectileFeedback[],listener:{x:number;y:number},busy:boolean):Set<ProjectileFeedback>{
 const contacts=events.filter(e=>e.phase==='impact'&&!e.worker&&!e.blocked&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&Math.hypot(e.x-listener.x,e.y-listener.y)<520);
 const ordered=contacts.map(event=>({event})).sort((a,b)=>Number(Boolean(b.event.critical))-Number(Boolean(a.event.critical))||Math.hypot(a.event.x-listener.x,a.event.y-listener.y)-Math.hypot(b.event.x-listener.x,b.event.y-listener.y));
 const owners=feedbackCoreOwners(ordered);
 return new Set(ordered.filter(e=>owners.has(e)).slice(0,busy?3:6).map(e=>e.event));
}

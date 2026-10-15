import type {DefenseContent} from '../domain/defense';
import {defenseRoutes} from '../engine/defense-geometry';
import {defenseText as t} from '../app/defense-text';

/** Preview the actual combat geometry, including a planned corridor switch. */
export function GuardStagePreview({content,uri}:{content:DefenseContent;uri:string}){
 const routes=defenseRoutes(content);
 return <div className="guard-stage-preview">
  <img src={uri} alt=""/>
  <svg viewBox="0 0 1000 600" role="img" aria-label={t('guard.map.preview')}>
   {routes.map((r,i)=><polyline key={r.id} points={r.path.map(p=>p.join(',')).join(' ')} className={i?'is-secondary':undefined}/>)}
   {content.map.transition?.routes.map(r=><polyline key={r.id} points={r.path.map(p=>p.join(',')).join(' ')} className="is-transition"/>)}
   {content.map.pads.map(p=><circle key={p.id} cx={p.x} cy={p.y} r="12"/>)}
  </svg>
  <span>{t(content.map.transition?'guard.map.switch':routes.length>1?'guard.map.merge':'guard.map.single')}</span>
 </div>;
}

import type {DefenseContent,DefenseRunState,DefenseWaveDefinition} from '../domain/defense';
import {guardPreparationCheck} from '../app/guard-preparation-check';
import {defenseText as t} from '../app/defense-text';
export function GuardPreparationCheck({content,state,wave}:{content:DefenseContent;state:DefenseRunState;wave:DefenseWaveDefinition}){
 if(state.status!=='READY'&&state.status!=='INTERMISSION')return null;
 const routes=guardPreparationCheck(content,state,wave);
 return <section className="guard-preparation-check" aria-label={t('guard.preparation.check')}>
  <strong>{t('guard.preparation.check')}</strong>
  <ul>{routes.map(route=><li key={route.routeId} data-preparation-route={route.routeId}>
   <b>{route.routeId}</b> · {t('guard.preparation.attack')} {route.attackPercent}%
   {route.hidden?<> · {t('guard.preparation.reveal')} {route.revealPercent}%</>:null}
   {route.attackPercent===0||route.hidden&&route.revealPercent===0?<em>{t('guard.preparation.gap')}</em>:null}
  </li>)}</ul><small>{t('guard.preparation.scope')}</small>
 </section>;
}

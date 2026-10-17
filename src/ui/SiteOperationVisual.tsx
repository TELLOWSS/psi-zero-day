import {sitePatrolStage,readSitePatrolAccess} from '../app/site-patrol-access';
import {stageArtProfile} from './survivors-stage-art';
import {worksiteFamily} from '../domain/survivors-worksite';
import copy from '../../content/localization/site-operations-ko.json';
import worksite from '../../content/localization/survivors-worksite-ko.json';
import './site-operation-visual.css';
export function SiteOperationVisual({profileId,onPatrol}:{profileId:string;onPatrol?:(profileId:string)=>void}){
 const stage=sitePatrolStage(profileId),operation=copy.operations[profileId as keyof typeof copy.operations];if(!stage||!operation)return null;
 const n=Number(stage.slice(6)),steps=worksite.families[worksiteFamily(n)],ready=readSitePatrolAccess(profileId);
 return <section className="site-operation-visual" data-patrol-stage={stage}>
  <figure><img src={stageArtProfile(stage).ground} alt={operation.name}/><figcaption><small>{copy.linked} · STAGE {n}</small><h2>{operation.name}</h2></figcaption></figure>
  <ol>{(['prepare','operate','handover'] as const).map(key=><li key={key}><strong>{copy.phases[key]}</strong><span>{steps[key]}</span></li>)}</ol>
  {onPatrol&&<button type="button" disabled={!ready} onClick={()=>onPatrol(profileId)}>{ready?copy.open:`STAGE ${n} · ${copy.locked}`}</button>}<p>{copy.view}</p>
 </section>;
}

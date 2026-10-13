import type {OperationHandoff} from '../domain/survivors-operation-handoff';
import {confirmedHandoffScene} from '../app/survivors-character-reflection';
import {readOperationHandoffs} from '../app/operation-handoff-store';
import {SurvivorsHandoffDialogue} from './SurvivorsHandoffDialogue';
import copy from '../../content/localization/survivors-character-reflection-ko.json';
import brief from '../../content/localization/survivors-operation-brief-ko.json';
export function SurvivorsHandoffResult({record}:{record:OperationHandoff|null}) {
 const confirmed=confirmedHandoffScene(record,readOperationHandoffs());
 if(!confirmed)return null;
 return <details className="survivors-result-handoff"><summary>{copy.archiveTitle}</summary>
 <p>{brief.routes} {confirmed.rubbleCleared} · {brief.stops} {confirmed.cartStops} · {brief.zones} {confirmed.zones}</p>
 <figure className="survivors-handoff-scene"><img src="/assets/survivors/growth/player-stage12-handoff-v1.png" alt={copy.sceneAlt}/><figcaption>{copy.sceneCaption}</figcaption></figure>
 <SurvivorsHandoffDialogue/>
 </details>;
}

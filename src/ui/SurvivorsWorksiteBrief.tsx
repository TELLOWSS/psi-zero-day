import type {PatrolStageDefinition,StageHazardObject} from '../domain/patrol-survivors';
import type {TerrainObject} from '../domain/survivors-terrain';
import {worksiteFamily} from '../domain/survivors-worksite';
import {createTerrain} from '../engine/survivors-terrain';
import {stageArtProfile} from './survivors-stage-art';
import copy from '../../content/localization/survivors-worksite-ko.json';
import './survivors-worksite.css';
/** Preview and actual combat both consume the engine's authored footprints. */
export function SurvivorsWorksiteBrief({stage,hazards,terrain}:{stage:PatrolStageDefinition;hazards?:readonly StageHazardObject[];terrain?:readonly TerrainObject[]}){
 const family=worksiteFamily(stage.stageNumber),text=copy.families[family],objects=terrain??createTerrain(stage);
 const controls=(hazards??stage.hazards).filter(h=>h.type!=='floodlight_tower'&&h.type!=='slurry_puddle');
 return <details className="survivors-worksite-brief" data-worksite-family={family}>
  <summary>{copy.title} · {text.name}</summary>
  <figure><svg viewBox="0 0 1400 900" role="img" aria-label={`${stage.name} · ${copy.layout}`}>
   <image href={stageArtProfile(stage.id).ground} width="1400" height="900" preserveAspectRatio="none"/>
   <path d="M700 30V870" stroke="#62ecad" strokeWidth="100" opacity=".2"/>
   <path d="M700 30V870" stroke="#9cf9c8" strokeWidth="3" strokeDasharray="18 14"/>
   {objects.map(o=><rect key={o.id} data-terrain-id={o.id} x={o.x} y={o.y} width={o.width} height={o.height} rx="4" opacity={o.hp<=0?.2:1} fill={o.kind==='rubble'?'#227e69':'#d5d8c8'} stroke="#f6fff0" strokeWidth="3"/>)}
   {controls.map((h,i)=><g key={h.id} data-control-state={h.state}><circle cx={h.x} cy={h.y} r="28" fill="#17262b" stroke={h.state==='destroyed'?'#83e9b6':h.state==='warning'||h.state==='active'?'#ff876e':'#ffd38c'} strokeWidth="4"/><text x={h.x} y={h.y+11} textAnchor="middle" fill="#ffdf9b" fontSize="30" fontWeight="700">{i+1}</text></g>)}
  </svg><figcaption>{copy.legend}</figcaption></figure>
  <ol className="survivors-worksite-process">{(['prepare','operate','handover'] as const).map(key=><li key={key}><strong>{copy[key]}</strong><span>{text[key]}</span></li>)}</ol>
  <p>{hazards?copy.liveNote:copy.note}</p><ol className="survivors-worksite-targets" aria-label={copy.controls}>{controls.map(h=><li key={h.id}>{h.label??copy.controls}{hazards?` · ${copy.states[h.state]}`:''}</li>)}</ol>
 </details>;
}

import {useEffect} from 'react';
import type {TerrainRecord} from '../domain/survivors-terrain';
import type {PatrolDifficulty} from '../domain/survivors-challenge';
import copy from '../../content/localization/survivors-terrain-ko.json';
import challenge from '../../content/localization/survivors-challenge-ko.json';
export function SurvivorsTerrainRecord({record,stage,difficulty,victory}:{record:TerrainRecord|undefined;stage:string;difficulty:PatrolDifficulty;victory:boolean}) {
 const summary=record?JSON.stringify({...record,victory}):'';
 useEffect(()=>{if(summary)try{localStorage.setItem(`psi.survivors.response.${stage}.${difficulty}`,summary);}catch{/* Current result still displays. */}},[summary,stage,difficulty]);
 if(!record)return null;
 return <section className="survivors-terrain-record" aria-label={copy.record}><h3>{copy.record} · {challenge[difficulty]}</h3><dl>{(['cartStops','rubbleCleared','weakPointHits','damageTaken'] as const).map(key=><div key={key}><dt>{copy[key]}</dt><dd>{record[key]}</dd></div>)}</dl>{record.cartStops>0&&record.rubbleCleared>0&&<p>{copy.routeBadge}</p>}{victory&&record.damageTaken===0&&<p>{copy.cleanBadge}</p>}</section>;
}

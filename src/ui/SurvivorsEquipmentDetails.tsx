import type {CharacterId,PlayerStats} from '../domain/patrol-survivors';
import {equipmentDetails,equipmentCharacterIdentity} from '../app/survivors-equipment-details';
import copy from '../../content/localization/survivors-equipment-details-ko.json';
import './survivors-equipment-details.css';
export function SurvivorsEquipmentDetails({characterId,id,kind,level=1,player}: {characterId:CharacterId;id:string;kind:'normal'|'premium';level?:number;player?:PlayerStats}) {
 const item = equipmentDetails(id,kind,level,player);
 if (!item) return null;
 return <section className="survivors-equipment-details" aria-label={copy.title} data-equipment-detail={id}>
  <header><small>{kind==='normal'?copy.normal:copy.premium}</small><h4>{item.name}</h4></header>
  <p><strong>{copy.identity}</strong>{equipmentCharacterIdentity(characterId)}</p>
  <div className="survivors-equipment-detail-columns">{(['mount','feedback','synergy','limit'] as const).map(key=><p key={key}><strong>{copy[key]}</strong>{item[key]}</p>)}</div>
  <h5>{copy.actual}</h5><dl>{item.stats.map(stat=><div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}</dl>
  {kind==='normal'&&player&&<small>{copy.combatNote}</small>}
  {item.recipe&&<p><strong>{copy.recipe}</strong>{item.recipe}</p>}
  <small>{item.note}</small>
 </section>;
}

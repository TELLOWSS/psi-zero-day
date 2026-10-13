import { equipmentAppearance, EQUIPMENT_ART, EVOLUTION_ART, TACTICAL_EQUIPMENT_ART, PICKUP_ART } from './survivors-equipment-art';
import { PERK_CATALOG } from '../engine/patrol-survivors-engine';
import type { PerkId } from '../domain/patrol-survivors';
import type { CSSProperties } from 'react';

export function SurvivorsEquipmentIcon({id,level}:{id:PerkId;level:number}) {
 const art=equipmentAppearance(id,level),meta=PERK_CATALOG[id];
 if(!art)return <span className="survivors-support-icon" aria-label={meta.name}>{meta.icon}</span>;
 const tactical=art.atlas==='tactical',columns=tactical?4:3,rows=art.atlas==='base'?5:2;
 const style:CSSProperties={backgroundImage:`url(${tactical?TACTICAL_EQUIPMENT_ART:art.evolved?EVOLUTION_ART:EQUIPMENT_ART})`,backgroundSize:`${columns*100}% ${rows*100}%`,backgroundPosition:`${art.cell%columns*100/(columns-1)}% ${Math.floor(art.cell/columns)*100/(rows-1)}%`,transform:`scale(${art.scale})`};
 return <span className={`survivors-equipment-icon ${art.evolved?'is-evolved':''}`} style={style} role="img" aria-label={`${meta.name} Lv.${level}`} data-equipment-cell={art.cell} data-equipment-level={level}>
  {art.module&&<span className="survivors-equipment-module" style={{backgroundImage:`url(${PICKUP_ART})`,backgroundPosition:art.base==='cone_trap'?'66.6667% 100%':'100% 0'}}/>}
  <span className="survivors-equipment-pips" aria-hidden="true">{Array.from({length:art.evolved?5:art.level},(_,i)=><i key={i}/>)}</span>
 </span>;
}

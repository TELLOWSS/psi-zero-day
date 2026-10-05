import type {CharacterId} from '../domain/patrol-survivors';
import {characterGrowth,type PatrolClearRecord} from '../domain/survivors-growth';
import copy from '../../content/localization/survivors-campaign50-ko.json';
import {CHARACTER_PROFILES} from '../engine/patrol-survivors-engine';

export function SurvivorsGrowthRecord({records,characterId,legacy=false}:{records:readonly PatrolClearRecord[];characterId:CharacterId;legacy?:boolean}) {
  const growth=characterGrowth(records,characterId);
  return <section className="survivors-growth-record" aria-label={copy.growth_title}>
    <h3>{CHARACTER_PROFILES[characterId].name} · {copy.growth_title}</h3>
    <dl><div><dt>{copy.growth_clears}</dt><dd>{growth.clears}/50</dd></div><div><dt>{copy.growth_highest}</dt><dd>{String(growth.highest).padStart(2,'0')}</dd></div><div><dt>{copy.growth_control}</dt><dd>{growth.controls}</dd></div></dl>
    <p>{growth.clears?copy.growth_story[growth.storyTier]:copy.growth_empty}</p>
    {growth.clears>0&&<div className="survivors-growth-skills">{copy.growth_skills.map((name,index)=><label key={name}><span>{name} <b>{growth.chapters[index]}/10</b></span><progress aria-label={name} value={growth.chapters[index]} max={10}/></label>)}</div>}
    {growth.clears>0&&growth.next>0&&<small>{copy.growth_next} · {growth.next}</small>}
    {legacy&&!growth.clears&&<small>{copy.growth_legacy}</small>}
  </section>;
}

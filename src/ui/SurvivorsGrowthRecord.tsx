import type {CharacterId} from '../domain/patrol-survivors';
import {characterGrowth,type PatrolClearRecord} from '../domain/survivors-growth';
import copy from '../../content/localization/survivors-campaign50-ko.json';
import {CHARACTER_PROFILES} from '../engine/patrol-survivors-engine';
import chapterCopy from '../../content/localization/survivors-character-chapters-ko.json';
import {PATROL_STAGE_IDS} from '../domain/patrol-survivors';
import {validGrowthRecords} from '../domain/survivors-growth';

export function SurvivorsGrowthRecord({records,characterId,legacy=false}:{records:readonly PatrolClearRecord[];characterId:CharacterId;legacy?:boolean}) {
  const growth=characterGrowth(records,characterId);
  const roleId=characterId==='park'?'kang_taesik':characterId==='jung'||characterId==='yoon'?'player':characterId;
  const own=validGrowthRecords(records).filter(record=>record.characterId===characterId);
  return <section className="survivors-growth-record" aria-label={copy.growth_title}>
    <h3>{CHARACTER_PROFILES[characterId].name} · {copy.growth_title}</h3>
    <dl><div><dt>{copy.growth_clears}</dt><dd>{growth.clears}/50</dd></div><div><dt>{copy.growth_highest}</dt><dd>{String(growth.highest).padStart(2,'0')}</dd></div><div><dt>{copy.growth_control}</dt><dd>{growth.controls}</dd></div></dl>
    <p>{growth.clears?copy.growth_story[growth.storyTier]:copy.growth_empty}</p>
    {growth.clears>0&&<div className="survivors-growth-skills">{copy.growth_skills.map((name,index)=><label key={name}><span>{name} <b>{growth.chapters[index]}/10</b></span><progress aria-label={name} value={growth.chapters[index]} max={10}/></label>)}</div>}
    {growth.clears>0&&growth.next>0&&<small>{copy.growth_next} · {growth.next}</small>}
    {growth.clears>0&&<details className="survivors-character-chapters"><summary>{chapterCopy.title}</summary>
      {growth.chapters.map((count,index)=>count>0&&<section key={index} aria-label={copy.chapters[index]}>
        <h4>{copy.chapters[index]}</h4>
        <p>{chapterCopy.clears} {count}/10 · {chapterCopy.controls} {own.filter(record=>Math.floor(PATROL_STAGE_IDS.indexOf(record.stageId)/10)===index&&record.stars[1]).length}</p>
        <p><strong>{chapterCopy.perspective}</strong> · {chapterCopy.roles[roleId][index]}</p>
      </section>)}
      <small>{chapterCopy.note}</small>
    </details>}
    {legacy&&!growth.clears&&<small>{copy.growth_legacy}</small>}
  </section>;
}

import {PINBALL_RULES,type PinballTheme,type PinballRule} from '../domain/survivors-recreation';
import {PINBALL_TABLES,PINBALL_TABLE_IDS,pinballTableProgress,nextPinballTable} from '../domain/survivors-pinball-tables';
import type {PatrolStageId} from '../domain/patrol-survivors';
import text from '../../content/localization/survivors-recreation-ko.json';
export function SurvivorsPinballUnlockPreview({completedStages}:{completedStages:readonly PatrolStageId[]}){
 const next=nextPinballTable(completedStages);if(!next)return null;const progress=pinballTableProgress(next,completedStages);
 return <div className="pinball-unlock-preview"><img src={PINBALL_TABLES[next].asset} alt=""/><div><small>{text.nextTable} · {progress.from}~{progress.to}</small><strong>{text.themes[next].name}</strong><p>{text.locked.replace('{from}',String(progress.from)).replace('{to}',String(progress.to)).replace('{count}',String(progress.missing.length))}</p><progress value={progress.completed} max={5}/></div></div>;
}
export function SurvivorsPinballCustomization({choice,clears,completedStages=[],disabled,onChange}:{choice:{theme:PinballTheme;rule:PinballRule};clears:number;completedStages?:readonly PatrolStageId[];disabled:boolean;onChange:(choice:{theme:PinballTheme;rule:PinballRule})=>void}){
 return <section className="pinball-customization" aria-label={text.settings}>
 <p>{text.progress.replace('{count}',String(clears))}</p><SurvivorsPinballUnlockPreview completedStages={completedStages}/><h3>{text.background}</h3>
 <div className="pinball-theme-grid">{PINBALL_TABLE_IDS.map(id=>{const table=PINBALL_TABLES[id],progress=pinballTableProgress(id,completedStages);
 return <button type="button" key={id} className="pinball-theme-card" aria-pressed={choice.theme===id} disabled={disabled||!progress.unlocked} onClick={()=>onChange({...choice,theme:id})}>
 <img src={table.asset} alt="" loading="lazy"/><strong>{text.themes[id].name}</strong><small>{progress.unlocked?text.unlocked:text.locked.replace('{from}',String(progress.from)).replace('{to}',String(progress.to)).replace('{count}',String(progress.missing.length))}</small></button>;
 })}</div><p>{text.themes[choice.theme].detail}</p><p>{text.manualShot}</p>
 <label className="pinball-music">{text.rule}<select value={choice.rule} disabled={disabled} onChange={e=>onChange({...choice,rule:e.target.value as PinballRule})}>
 {(Object.keys(PINBALL_RULES) as PinballRule[]).map(id=><option key={id} value={id} disabled={clears<PINBALL_RULES[id].unlock}>{text.rules[id].name}</option>)}
 </select></label><p>{text.rules[choice.rule].detail}</p><p>{text.nextRound}</p><p>{text.budgetHint}</p>
 </section>;
}

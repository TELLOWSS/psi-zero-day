import {PINBALL_THEMES,PINBALL_RULES,type PinballTheme,type PinballRule} from '../domain/survivors-recreation';
import text from '../../content/localization/survivors-recreation-ko.json';
export function SurvivorsPinballCustomization({choice,clears,disabled,onChange}:{choice:{theme:PinballTheme;rule:PinballRule};clears:number;disabled:boolean;onChange:(choice:{theme:PinballTheme;rule:PinballRule})=>void}){
 return <section className="pinball-customization" aria-label={text.settings}>
  <p>{text.progress.replace('{count}',String(clears))}</p><h3>{text.background}</h3>
  <div className="pinball-theme-grid">{(Object.keys(PINBALL_THEMES) as PinballTheme[]).map(id=>{
   const theme=PINBALL_THEMES[id],locked=clears<theme.unlock;
   return <button type="button" key={id} className="pinball-theme-card" aria-pressed={choice.theme===id} disabled={disabled||locked} onClick={()=>onChange({...choice,theme:id})}>
    <img src={theme.asset} alt="" loading="lazy"/><strong>{text.themes[id].name}</strong><small>{locked?text.locked.replace('{count}',String(theme.unlock)):text.unlocked}</small>
   </button>;
  })}</div><p>{text.themes[choice.theme].detail}</p>
  <label className="pinball-music">{text.rule}<select value={choice.rule} disabled={disabled} onChange={e=>onChange({...choice,rule:e.target.value as PinballRule})}>
   {(Object.keys(PINBALL_RULES) as PinballRule[]).map(id=><option key={id} value={id} disabled={clears<PINBALL_RULES[id].unlock}>{text.rules[id].name}{clears<PINBALL_RULES[id].unlock?' · '+text.locked.replace('{count}',String(PINBALL_RULES[id].unlock)):''}</option>)}
  </select></label><p>{text.rules[choice.rule].detail}</p><p>{text.nextRound}</p><p>{text.budgetHint}</p>
 </section>;
}

import {useId} from 'react';
import {DEFAULT_DISPLAY_SETTINGS,type DisplaySettings} from './survivors-display-settings';
import copy from '../../content/localization/survivors-display-ko.json';
import './survivors-display-settings.css';
export function SurvivorsDisplaySettings({settings,onChange,saved}:{settings:DisplaySettings;onChange:(settings:DisplaySettings)=>void;saved:boolean}) {
 const id=useId();
 const choose=<K extends keyof DisplaySettings>(key:K,options:readonly DisplaySettings[K][],label:string)=><label className="survivors-display-row"><span>{label}</span><select id={`${id}-${key}`} value={String(settings[key])} onChange={e=>onChange({...settings,[key]:e.target.value})}>{options.map(option=><option key={String(option)} value={String(option)}>{copy[option as keyof typeof copy]}</option>)}</select></label>;
 return <details className="survivors-display-settings"><summary>{copy.title}</summary><div className="survivors-display-body">
 {choose('quality',['auto','low','balanced','high'],copy.quality)}<p>{copy.hint}</p>
 {choose('view',['standard','wide','close'],copy.view)}
 {choose('particles',['auto','sparse','off'],copy.particles)}
 {choose('motion',['system','reduced'],copy.motion)}
 {(['lighting','shake','flash'] as const).map(key=><label key={key} className="survivors-display-row"><span>{copy[key]}</span><input type="checkbox" checked={settings[key]} onChange={e=>onChange({...settings,[key]:e.target.checked})}/></label>)}
 <p>{copy.safety}</p><p role="status">{saved?copy.saved:copy.temporary}</p><button type="button" className="survivors-btn-secondary" onClick={()=>onChange({...DEFAULT_DISPLAY_SETTINGS})}>{copy.reset}</button>
 </div></details>;
}

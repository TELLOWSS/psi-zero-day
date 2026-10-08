import type {FeelSettings} from './survivors-feel-settings';
import copy from '../../content/localization/survivors-material-feel-ko.json';
import graphicsCopy from '../../content/localization/survivors-graphics-ko.json';

import {SurvivorsGraphicsSettings} from './SurvivorsGraphicsSettings';

export function SurvivorsFeelSettings({value,onChange}:{value:FeelSettings;onChange:(value:FeelSettings)=>void}) {
  return <SurvivorsGraphicsSettings><details><summary>{graphicsCopy.comfort}</summary>
    <fieldset className="survivors-feel-settings"><legend>{copy.settings}</legend>
    {(['shake','flash'] as const).map(key=><label key={key}>{copy[key]} <input type="range" min="0" max="1" step="0.1" value={value[key]} onChange={event=>onChange({...value,[key]:Number(event.target.value)})}/><output>{Math.round(value[key]*100)}%</output></label>)}
    <p>{graphicsCopy.comfortNote}</p>
  </fieldset></details></SurvivorsGraphicsSettings>;
}

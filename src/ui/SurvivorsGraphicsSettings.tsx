import type {ReactNode} from 'react';
import {useSyncExternalStore} from 'react';
import graphicsCopy from '../../content/localization/survivors-graphics-ko.json';
import {getGraphicsMode,setGraphicsMode,subscribeGraphics,type GraphicsMode} from './survivors-graphics-settings';
import './survivors-graphics-settings.css';

export function SurvivorsGraphicsSettings({children}:{children?:ReactNode}) {
  const mode=useSyncExternalStore(subscribeGraphics,getGraphicsMode,getGraphicsMode);
  return <section className="survivors-graphics-settings" aria-label={graphicsCopy.title}>
    <h3>{graphicsCopy.title}</h3><p>{graphicsCopy.intro}</p>
    <div className="survivors-graphics-presets">{(['recommended','smooth','vivid'] as GraphicsMode[]).map(id=><button type="button" key={id} aria-pressed={mode===id} onClick={()=>setGraphicsMode(id)}>
      <strong>{graphicsCopy[id].name}</strong><span>{graphicsCopy[id].hint}</span><small>{graphicsCopy[id].detail}</small>
    </button>)}</div>
    <p role="status">{graphicsCopy[mode].name} · {graphicsCopy.applied}</p><p>{graphicsCopy.preserved}</p>
    {children}
  </section>;
}


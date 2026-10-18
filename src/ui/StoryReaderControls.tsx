import {useEffect,useRef,useState} from 'react';
import type {StoryReaderSettings} from '../app/story-reader-settings';

export function StoryReaderControls({settings,onChange,onPaused,t}:{settings:StoryReaderSettings;onChange:(s:StoryReaderSettings)=>void;onPaused:(p:boolean)=>void;t:(id:string)=>string}) {
  const dialog=useRef<HTMLDialogElement>(null),[open,setOpen]=useState(false);
  useEffect(()=>{const el=dialog.current;if(open){el?.showModal();onPaused(true);}return()=>{if(open){el?.close();onPaused(false);}};},[open,onPaused]);
  return <>
    <button className="story-reader-open" type="button" aria-label="읽기 크기 및 소리 설정" title="읽기 크기 및 소리 설정" onClick={()=>setOpen(true)}>{t('story.reader.open')}</button>
    <dialog className="story-reader-dialog" ref={dialog} onClose={()=>setOpen(false)} aria-labelledby="story-reader-title">
      <header><h2 id="story-reader-title">{t('story.reader.title')}</h2><button type="button" onClick={()=>setOpen(false)} aria-label={t('story.reader.close')}>×</button></header>
      <p>{t('story.reader.pause')}</p>
      {(['fontScale','music','ambience','effects','voice'] as const).map(key=><label key={key}><span>{t(`story.reader.${key}`)}</span><output>{Math.round(settings[key]*100)}%</output><input type="range" min={key==='fontScale'?.9:0} max={key==='fontScale'?1.35:1} step={.05} value={settings[key]} onChange={e=>onChange({...settings,[key]:Number(e.target.value)})}/></label>)}
      <button type="button" className="primary-button" onClick={()=>setOpen(false)}>{t('story.reader.resume')}</button>
    </dialog>
  </>;
}

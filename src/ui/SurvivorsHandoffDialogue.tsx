import {useEffect,useRef,useState} from 'react';
import {MessageSquare,RotateCcw} from 'lucide-react';
import {readHandoffDialogue,saveHandoffDialogue} from '../app/handoff-dialogue-store';
import type {HandoffDialogueChoice} from '../domain/survivors-handoff-dialogue';
import copy from '../../content/localization/survivors-handoff-dialogue-ko.json';
export function SurvivorsHandoffDialogue({onSaved}:{onSaved?:()=>void}={}) {
 const [choice,setChoice]=useState<HandoffDialogueChoice|null>(()=>readHandoffDialogue()?.choice??null);
 const [visible,setVisible]=useState(false),[error,setError]=useState(false);
 const line=useRef<HTMLParagraphElement>(null);
 const trigger=useRef<HTMLButtonElement>(null),wasVisible=useRef(false);
 useEffect(()=>{
  if(visible&&choice)line.current?.focus();
  if(!visible&&wasVisible.current)trigger.current?.focus();
  wasVisible.current=visible;
 },[visible,choice]);
 const choose=(next:HandoffDialogueChoice)=>{
  if(!saveHandoffDialogue(next)){setError(true);return;}
  setChoice(next);setError(false);onSaved?.();
 };
 return <section className="survivors-handoff-dialogue" aria-label={copy.title}>
 <h4>{copy.title}</h4>
 {!visible?<button ref={trigger} type="button" onClick={()=>setVisible(true)}>{choice?<RotateCcw size={16}/>:<MessageSquare size={16}/>} {choice?copy.replay:copy.return}</button>:<>
 {choice?<p ref={line} tabIndex={-1} className="survivors-handoff-line"><strong>{copy.speaker}</strong>{' '}{copy[choice]}</p>:<>
 <p>{copy.question}</p><div className="survivors-handoff-choices">
 <button type="button" onClick={()=>choose('together')}>{copy.togetherLabel}</button>
 <button type="button" onClick={()=>choose('explain')}>{copy.explainLabel}</button>
 </div></>}
 {error&&<p role="alert">{copy.failure}</p>}
 <div className="survivors-handoff-controls">
 <button type="button" onClick={()=>setVisible(false)}>{choice?copy.close:copy.skip}</button>
 </div>
 </>}
 </section>;
}

import {useEffect,useRef,useState} from 'react';
import {Save} from 'lucide-react';
import type {OperationHandoff} from '../domain/survivors-operation-handoff';
import {canChooseNarrativeDirection,type NarrativeDirection} from '../domain/survivors-narrative-direction';
import {readHandoffDialogue} from '../app/handoff-dialogue-store';
import {readNarrativeDirection,saveNarrativeDirection} from '../app/narrative-direction-store';
import copy from '../../content/localization/survivors-narrative-direction-ko.json';
export function SurvivorsNarrativeDirection({record}:{record:OperationHandoff}) {
 const [selected,setSelected]=useState(()=>readNarrativeDirection()?.direction??null);
 const [draft,setDraft]=useState<NarrativeDirection|''>(selected??'');
 const [open,setOpen]=useState(false),[message,setMessage]=useState<'saved'|'failure'|null>(null);
 const trigger=useRef<HTMLButtonElement>(null),selector=useRef<HTMLSelectElement>(null),wasOpen=useRef(false);
 useEffect(()=>{if(open)selector.current?.focus();else if(wasOpen.current)trigger.current?.focus();wasOpen.current=open;},[open]);
 if(!canChooseNarrativeDirection(record,readHandoffDialogue()))return null;
 return <section className="survivors-narrative-direction" aria-label={copy.title}>
 <h4>{copy.title}</h4>{selected&&<p>{copy.statements[selected]}</p>}
 {selected==='control'&&<figure className="survivors-narrative-interest-scene"><img src="/assets/survivors/growth/player-control-interest-v1.png" alt={copy.labels.control}/></figure>}
 {!open?<button ref={trigger} type="button" onClick={()=>{setDraft(selected??'');setMessage(null);setOpen(true);}}>{selected?copy.change:copy.open}</button>:<>
 <select ref={selector} aria-label={copy.title} value={draft} onChange={event=>{setDraft(event.target.value as NarrativeDirection|'');setMessage(null);}}>
 <option value="">{copy.empty}</option>{(['control','coordination','investigation'] as const).map(id=><option key={id} value={id}>{copy.labels[id]}</option>)}
 </select>{draft&&draft!==selected&&<p>{copy.statements[draft]}</p>}
 <div className="survivors-handoff-controls"><button type="button" disabled={!draft} onClick={()=>{
  if(!draft)return;
  if(!saveNarrativeDirection(draft,record,readHandoffDialogue())){setMessage('failure');return;}
  setSelected(draft);setMessage('saved');
 }}><Save size={16}/> {copy.save}</button><button type="button" onClick={()=>setOpen(false)}>{copy.later}</button></div>
 {message&&<p role={message==='failure'?'alert':'status'}>{copy[message]}</p>}
 </>}
 </section>;
}

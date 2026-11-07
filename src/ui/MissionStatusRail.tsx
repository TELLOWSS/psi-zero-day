export interface MissionStatusItem {readonly label:string;readonly value:string;readonly note?:string;}
export function MissionStatusRail({mode,label,items}:{mode:'guard'|'watch';label:string;items:readonly MissionStatusItem[]}){
 return <aside className="psi-mission-rail" data-psi-mode={mode} aria-label={label}>
  <span className="psi-mission-rail-eyebrow"><i aria-hidden="true"/> LIVE MISSION STATUS / RE:IGNITION</span>
  <dl>{items.map(item=><div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd>{item.note?<small>{item.note}</small>:null}</div>)}</dl>
 </aside>;
}

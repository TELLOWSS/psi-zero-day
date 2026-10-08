import { ArrowUp, MapPin } from 'lucide-react';
import text from '../../content/localization/survivors-extraction-ko.json';

export function SurvivorsExtractionStatus({remaining,inside,total=15,direction}:{remaining:number;inside:boolean;total?:number;direction?:{x:number;y:number}}) {
  const duration=Number.isFinite(total)&&total>0?total:15;
  const seconds=Number.isFinite(remaining)?Math.max(0,Math.min(Math.ceil(duration),Math.ceil(remaining))):Math.ceil(duration);
  const angle=direction&&Number.isFinite(direction.x)&&Number.isFinite(direction.y)&&Math.hypot(direction.x,direction.y)>0?Math.atan2(direction.y,direction.x):undefined;
  const heading=angle===undefined?undefined:Math.round(angle/(Math.PI/4)+8)%8;
  const directionText=heading===undefined?undefined:text.directions[heading];
  return <aside className="survivors-extraction-status" data-inside={inside} aria-label={text.label}>
    {!inside&&angle!==undefined?<ArrowUp size={20} aria-hidden="true" style={{transform:`rotate(${angle*180/Math.PI+90}deg)`,flexShrink:0}}/>:<MapPin size={18} aria-hidden="true" />}
    <span role="status">{inside?text.hold:text.move}<small>{inside?text.label:directionText?`${directionText} · ${text.timerPaused}`:text.paused}</small></span>
    <progress hidden={!inside} aria-label={text.progress} max={duration} value={Math.max(0,duration-seconds)} />
    <strong>{seconds}<small>{text.seconds}</small></strong>
  </aside>;
}

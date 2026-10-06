import { MapPin } from 'lucide-react';
import text from '../../content/localization/survivors-extraction-ko.json';

export function SurvivorsExtractionStatus({remaining,inside,total=15}:{remaining:number;inside:boolean;total?:number}) {
  const duration=Number.isFinite(total)&&total>0?total:15;
  const seconds=Number.isFinite(remaining)?Math.max(0,Math.min(Math.ceil(duration),Math.ceil(remaining))):Math.ceil(duration);
  return <aside className="survivors-extraction-status" data-inside={inside} aria-label={text.label}>
    <MapPin size={18} aria-hidden="true" />
    <span role="status">{inside?text.hold:text.move}<small>{inside?text.label:text.paused}</small></span>
    <progress aria-label={text.progress} max={duration} value={Math.max(0,duration-seconds)} />
    <strong>{seconds}<small>{text.seconds}</small></strong>
  </aside>;
}

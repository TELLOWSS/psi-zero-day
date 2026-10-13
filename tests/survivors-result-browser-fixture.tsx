import {createRoot,type Root} from 'react-dom/client';
import {SurvivorsResultSummary,type ResultStat} from '../src/ui/SurvivorsResultSummary';
import copy from '../content/localization/survivors-result-ko.json';
import {Trophy,ShieldAlert} from 'lucide-react';

let root:Root|undefined;
export function mountResultFixture(outcome:'victory'|'defeat'){
  if(!root){
    const host=document.createElement('div');host.id='qa-result-fixture';host.className='survivors-container';
    host.style.cssText='position:fixed;inset:0;z-index:500';document.body.append(host);root=createRoot(host);
  }
  const stats:readonly ResultStat[]=outcome==='victory'?
    [{label:copy.grade,value:'무사고',tone:'success'},{label:copy.finalScore,value:'1,234,567'},{label:copy.totalControlled,value:'999건'},{label:copy.environment,value:'100건',tone:'cyan'},{label:copy.mastery,value:'ZERO DAY ×3'}]:
    [{label:copy.survival,value:'03:00'},{label:copy.score,value:'0'},{label:copy.controlled,value:'0건'}];
  root.render(<div className="survivors-modal-backdrop"><div className="survivors-modal-content survivors-result-dialog" data-outcome={outcome}>
    <div className="survivors-result-body" tabIndex={0}>
      <h2 className="survivors-modal-title">{outcome==='victory'?<Trophy aria-hidden="true"/>:<ShieldAlert aria-hidden="true"/>}{outcome==='victory'?'STAGE 01 클리어!':copy.dangerTitle}</h2>
      <SurvivorsResultSummary credits={outcome==='victory'?1234567:0} stats={stats}/>
      {Array.from({length:5},(_,i)=><p className="survivors-story-result" key={i}>QA fixture: scrollable debrief content</p>)}
    </div>
    <div className="survivors-actions-row survivors-result-actions"><button className="survivors-btn-primary">{outcome==='victory'?copy.next_ready:copy.retry_ready}</button></div>
  </div></div>);
}

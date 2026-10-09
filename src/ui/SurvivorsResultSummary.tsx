import {Coins} from 'lucide-react';
import copy from '../../content/localization/survivors-result-ko.json';
import type {OperationHandoff} from '../domain/survivors-operation-handoff';
import {SurvivorsRoleMemory} from './SurvivorsRoleMemory';

export interface ResultStat {
  readonly label: string;
  readonly value: string;
  readonly tone?: 'success' | 'cyan';
}

export function SurvivorsResultSummary({credits,stats,handoff}:{credits:number;stats:readonly ResultStat[];handoff?:OperationHandoff|null}) {
  return <section className="survivors-result-summary" aria-label={copy.summary}>
    <div className="survivors-result-reward"><Coins size={24} aria-hidden="true"/><span>{copy.credits}</span><strong>+{credits.toLocaleString()} <small>PSI</small></strong></div>
    <dl className="survivors-results-grid">{stats.map(stat=><div className="survivors-stat-box" key={stat.label} data-tone={stat.tone}>
      <dt>{stat.label}</dt><dd>{stat.value}</dd>
    </div>)}</dl>
    {handoff&&<SurvivorsRoleMemory handoff={handoff}/>}
  </section>;
}

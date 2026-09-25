import { defenseText as t } from '../app/defense-text';
import type { RiskPriorityResult, SiteProfileDefinition } from '../domain/defense-site-profile';

export function SiteRiskPriorityHud({
  profile,
  result,
}: {
  readonly profile: SiteProfileDefinition;
  readonly result: RiskPriorityResult;
}) {
  return <aside
    className="zb-risk-priority"
    data-site-profile={profile.id}
    data-project-archetype={profile.projectArchetype}
    data-construction-method={profile.constructionMethod}
    data-process-phase={profile.processPhase}
    data-risk-top3={result.top3.map(item => item.riskId).join(',')}
    aria-label={t('defense.risk_priority.title')}
  >
    <header>
      <span>
        <small>PSI</small>
        <strong>{t('defense.risk_priority.title')}</strong>
      </span>
      <em>{t('defense.risk_priority.dynamic')}</em>
    </header>
    <p>
      <b>{t(profile.labelTextId)}</b>
      <span>{t(profile.methodTextId)} · {t(profile.phaseTextId)}</span>
    </p>
    <ol>
      {result.top3.map(entry => <li
        key={entry.riskId}
        data-risk-id={entry.riskId}
        data-risk-rank={entry.rank}
        data-risk-score={entry.score}
      >
        <b>{entry.rank}</b>
        <span>{t(`defense.enemy.${entry.riskId}.name`)}</span>
        <i aria-hidden="true"><u style={{ width:`${entry.score}%` }} /></i>
      </li>)}
    </ol>
    <footer>{t('defense.risk_priority.notice')}</footer>
  </aside>;
}

import { PSI_INDICATORS, type PsiIndicatorId } from '../app/product-contract';
import type { StrategyPsiView } from '../app/strategy-view';

const ICONS: Readonly<Record<PsiIndicatorId, string>> = Object.freeze({
  risk_awareness: '△',
  training_comprehension: '▤',
  practice_participation: '◉',
  ppe_rule_compliance: '✦',
  communication_reporting: '▣',
  stop_work_acceptance: '⬣',
});

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function StrategyPsiSixPanel({
  psi,
  text,
}: {
  readonly psi: StrategyPsiView;
  readonly text: (textId: string) => string;
}) {
  const fallbackMax = Math.max(1, psi.max_observation_count);

  return <section className="strategy-panel strategy-psi-six" aria-label="PSI 6">
    <header>
      <div><strong>PSI 6</strong><small>{text('ui.psi.definition')}</small></div>
      <span>{psi.observed_choice_count}</span>
    </header>
    <div className="strategy-psi-six-list">
      {PSI_INDICATORS.map(indicator => {
        const authored = psi.values[indicator.id];
        const hasAuthoredValue = Number.isFinite(authored);
        const observationCount = psi.observation_counts[indicator.id] ?? 0;
        const percent = hasAuthoredValue
          ? clampPercent(authored)
          : observationCount === 0 ? 0 : clampPercent((observationCount / fallbackMax) * 100);

        return <article key={indicator.id} data-psi-indicator={indicator.id} data-mode={hasAuthoredValue ? 'value' : 'observation'}>
          <span className="strategy-psi-icon" aria-hidden="true">{ICONS[indicator.id]}</span>
          <div>
            <div className="strategy-psi-label">
              <strong>{text(`ui.psi.indicator.${indicator.id}`)}</strong>
              <em>{hasAuthoredValue ? Math.round(authored) : observationCount ? `×${observationCount}` : '—'}</em>
            </div>
            <span className="strategy-psi-track" aria-hidden="true"><i style={{ width: `${percent}%` }} /></span>
          </div>
        </article>;
      })}
    </div>
    <footer>선택에서 관찰된 PSI 축 · 점수 아님</footer>
  </section>;
}

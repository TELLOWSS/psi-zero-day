import type { DefenseContent, DefenseEnemyId, DefenseRunState } from '../domain/defense';
import type {
  EnergyState,
  RiskPriorityContext,
  RiskPriorityEntry,
  RiskPriorityResult,
  SiteProfileDefinition,
} from '../domain/defense-site-profile';

const RISK_IDS: readonly DefenseEnemyId[] = ['NORMAL','SWIFT','ARMORED','SWARM','VEILED','BOSS'];
const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function energyAdjustment(state: EnergyState, riskId: DefenseEnemyId): number {
  if (state === 'TESTING') {
    if (riskId === 'VEILED') return 8;
    if (riskId === 'BOSS') return 4;
  }
  if (state === 'ENERGIZED') {
    if (riskId === 'ARMORED') return 12;
    if (riskId === 'VEILED') return 6;
    if (riskId === 'BOSS') return 8;
  }
  if (state === 'LIVE_CRITICAL') {
    if (riskId === 'ARMORED') return 16;
    if (riskId === 'VEILED') return 10;
    if (riskId === 'BOSS') return 22;
  }
  if (state === 'LOCKED_OUT' && riskId === 'VEILED') return -4;
  return 0;
}

export function defaultRiskPriorityContext(profile: SiteProfileDefinition): RiskPriorityContext {
  return {
    projectArchetype:profile.projectArchetype,
    constructionMethod:profile.constructionMethod,
    processPhase:profile.processPhase,
    verticalLayer:profile.defaults.verticalLayer,
    uncertainty:profile.defaults.uncertainty,
    concurrency:profile.defaults.concurrency,
    logisticsCongestion:profile.defaults.logisticsCongestion,
    timePressure:profile.defaults.timePressure,
    asBuiltConfidence:profile.defaults.asBuiltConfidence,
    energyState:profile.defaults.energyState,
    currentSignals:{},
    unresolvedHistory:{},
  };
}

export function riskPriorityContextFromRun(
  profile: SiteProfileDefinition,
  state: DefenseRunState,
  content: DefenseContent,
): RiskPriorityContext {
  const counts: Partial<Record<DefenseEnemyId,number>> = {};
  for (const enemy of state.enemies) counts[enemy.enemyId] = (counts[enemy.enemyId] ?? 0) + 1;

  const currentSignals: Partial<Record<DefenseEnemyId,number>> = {};
  for (const riskId of RISK_IDS) currentSignals[riskId] = clamp01((counts[riskId] ?? 0) / 4);

  const unresolvedHistory: Partial<Record<DefenseEnemyId,number>> = {};
  for (const riskId of RISK_IDS) unresolvedHistory[riskId] = clamp01((state.leakedByEnemy[riskId] ?? 0) / 3);

  const activeFamilies = RISK_IDS.filter(riskId => (counts[riskId] ?? 0) > 0).length;
  const logisticsCount = (counts.SWIFT ?? 0) + (counts.SWARM ?? 0);
  const veiledActive = (counts.VEILED ?? 0) > 0;
  const progressPressure = content.waves.length > 1
    ? clamp01((state.waveId - 1) / (content.waves.length - 1))
    : 0;

  return {
    ...defaultRiskPriorityContext(profile),
    uncertainty:Math.max(profile.defaults.uncertainty, veiledActive ? 0.72 : 0),
    concurrency:Math.max(profile.defaults.concurrency, clamp01(activeFamilies / 4)),
    logisticsCongestion:Math.max(profile.defaults.logisticsCongestion, clamp01(logisticsCount / 6)),
    timePressure:Math.max(profile.defaults.timePressure, progressPressure * 0.72),
    currentSignals,
    unresolvedHistory,
  };
}

/**
 * Produces game-play priority only. The resulting 0..100 value must never be
 * displayed or exported as a statutory risk-assessment score.
 */
export function calculateRiskPriority(
  profile: SiteProfileDefinition,
  context: RiskPriorityContext,
): RiskPriorityResult {
  if (context.projectArchetype !== profile.projectArchetype
    || context.constructionMethod !== profile.constructionMethod
    || context.processPhase !== profile.processPhase) {
    throw new Error(`Risk context/profile mismatch: ${profile.id}`);
  }

  const uncertainty = clamp01(context.uncertainty);
  const concurrency = clamp01(context.concurrency);
  const logistics = clamp01(context.logisticsCongestion);
  const pressure = clamp01(context.timePressure);
  const confidenceGap = 1 - clamp01(context.asBuiltConfidence);

  const entries = RISK_IDS.map((riskId,index) => {
    const drivers: string[] = ['PROFILE'];
    let score = 22 + profile.baseRiskModifiers[riskId];

    const add = (amount: number, driver: string) => {
      score += amount;
      if (Math.abs(amount) >= 4) drivers.push(driver);
    };

    if (riskId === 'VEILED') add(uncertainty * 28, 'UNCERTAINTY');
    if (riskId === 'ARMORED') add(uncertainty * 6, 'UNCERTAINTY');
    if (riskId === 'BOSS') add(uncertainty * 4, 'UNCERTAINTY');

    if (riskId === 'SWARM') add(concurrency * 26, 'CONCURRENCY');
    if (riskId === 'BOSS') add(concurrency * 12, 'CONCURRENCY');
    if (riskId === 'NORMAL') add(concurrency * 4, 'CONCURRENCY');

    if (riskId === 'SWIFT') add(logistics * 25, 'LOGISTICS');
    if (riskId === 'SWARM') add(logistics * 10, 'LOGISTICS');

    if (riskId === 'SWIFT') add(pressure * 10, 'TIME_PRESSURE');
    if (riskId === 'SWARM') add(pressure * 6, 'TIME_PRESSURE');
    if (riskId === 'BOSS') add(pressure * 10, 'TIME_PRESSURE');

    if (riskId === 'VEILED') add(confidenceGap * 20, 'AS_BUILT');
    if (riskId === 'ARMORED') add(confidenceGap * 10, 'AS_BUILT');

    add(energyAdjustment(context.energyState,riskId), 'ENERGY_STATE');
    add(clamp01(context.currentSignals[riskId] ?? 0) * 30, 'LIVE_SIGNAL');
    add(clamp01(context.unresolvedHistory[riskId] ?? 0) * 15, 'MEMORY');

    return { riskId, score:clampScore(score), rank:index + 1, drivers };
  });

  const order = new Map(RISK_IDS.map((riskId,index) => [riskId,index]));
  const sorted = [...entries]
    .sort((a,b) => b.score - a.score || (order.get(a.riskId)! - order.get(b.riskId)!))
    .map((entry,index): RiskPriorityEntry => ({ ...entry, rank:index + 1 }));

  return {
    profileId:profile.id,
    context,
    entries:sorted,
    top3:sorted.slice(0,3),
  };
}

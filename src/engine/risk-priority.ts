import type { DefenseEnemyId } from '../domain/defense';
import type { RiskPriorityContext, RiskPriorityResult, SiteProfileDefinition } from '../domain/site-profile';

const RISK_IDS: readonly DefenseEnemyId[] = ['NORMAL','SWIFT','ARMORED','SWARM','VEILED','BOSS'];

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const clamp100 = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function adjustmentFor(
  riskId: DefenseEnemyId,
  context: RiskPriorityContext,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const add = (value: number, reason: string) => {
    if (!value) return;
    score += value;
    reasons.push(reason);
  };

  const concurrency = clamp01(context.concurrency);
  const uncertainty = clamp01(context.uncertainty);
  const logistics = clamp01(context.logisticsCongestion);
  const pressure = clamp01(context.timePressure);

  if (riskId === 'SWARM') add(concurrency * 20, '동시작업 밀도');
  if (riskId === 'BOSS') add(concurrency * 8, '복합작업 결합 가능성');

  if (riskId === 'VEILED') add(uncertainty * 25, '정보 불확실성');
  if (riskId === 'ARMORED') add(uncertainty * 6, '구조/상태 검증 부족');

  if (riskId === 'SWIFT') add(logistics * 18, '물류 혼잡');
  if (riskId === 'SWARM') add(logistics * 12, '동선 간섭');

  if (riskId === 'SWIFT') add(pressure * 10, '공정 압박');
  if (riskId === 'SWARM') add(pressure * 8, '작업 중첩 압박');
  if (riskId === 'BOSS') add(pressure * 5, '복합사건 여지');

  if (context.asBuiltConfidence === 'LOW') {
    if (riskId === 'VEILED') add(18, '도면-실물 신뢰도 낮음');
    if (riskId === 'ARMORED') add(8, '기존 구조 확인 필요');
  } else if (context.asBuiltConfidence === 'MEDIUM') {
    if (riskId === 'VEILED') add(8, '도면-실물 일부 불확실');
    if (riskId === 'ARMORED') add(3, '기존 구조 추가 확인');
  }

  if (context.energyState === 'TESTING') {
    if (riskId === 'VEILED') add(8, '시험 중 상태 변화');
    if (riskId === 'ARMORED') add(8, '시험 에너지');
    if (riskId === 'BOSS') add(4, '시스템 상호작용');
  } else if (context.energyState === 'ENERGIZED') {
    if (riskId === 'VEILED') add(10, '통전 상태 가시성');
    if (riskId === 'ARMORED') add(12, '활성 에너지');
    if (riskId === 'BOSS') add(8, '시스템 결합');
  } else if (context.energyState === 'LIVE_CRITICAL') {
    if (riskId === 'VEILED') add(12, '활성계통 상태 확인');
    if (riskId === 'ARMORED') add(15, '고에너지 활성계통');
    if (riskId === 'BOSS') add(14, '통합시스템 상호작용');
  } else if (context.energyState === 'LOCKED_OUT') {
    if (riskId === 'VEILED') add(-8, '격리상태 확인');
    if (riskId === 'ARMORED') add(-10, '에너지 격리');
  }

  if (context.groundwaterState === 'RISING') {
    if (riskId === 'VEILED') add(8, '지하수 변화');
    if (riskId === 'ARMORED') add(5, '굴착/지반 영향');
  } else if (context.groundwaterState === 'UNCONTROLLED') {
    if (riskId === 'VEILED') add(16, '지하수 통제 불확실');
    if (riskId === 'ARMORED') add(12, '굴착/지반 영향 확대');
    if (riskId === 'BOSS') add(5, '복합 지반상태');
  }

  const unresolved = Math.max(0, Math.min(4, context.unresolvedSignals?.[riskId] ?? 0));
  add(unresolved * 4, '미해결 신호 누적');

  return { score, reasons };
}

/**
 * Game-facing dynamic priority only.
 * This must never be presented as a statutory risk-assessment score.
 */
export function calculateRiskPriorities(
  profile: SiteProfileDefinition,
  context: RiskPriorityContext,
): readonly RiskPriorityResult[] {
  if (context.profileId !== profile.id) throw new Error(`Risk context/profile mismatch: ${context.profileId} != ${profile.id}`);

  const rows = RISK_IDS.map(riskId => {
    const baseScore = profile.baseRiskScores[riskId];
    const adjustment = adjustmentFor(riskId, context);
    return {
      riskId,
      baseScore,
      score: clamp100(baseScore + adjustment.score),
      reasons: Object.freeze(adjustment.reasons),
    };
  })
    .sort((a, b) => b.score - a.score || RISK_IDS.indexOf(a.riskId) - RISK_IDS.indexOf(b.riskId))
    .map((row, index) => Object.freeze({ ...row, rank: index + 1 }));

  return Object.freeze(rows);
}

export function topRiskPriorities(
  profile: SiteProfileDefinition,
  context: RiskPriorityContext,
  count = 3,
): readonly RiskPriorityResult[] {
  return calculateRiskPriorities(profile, context).slice(0, Math.max(1, Math.min(6, count)));
}

export function baselineRiskContext(profileId: string): RiskPriorityContext {
  return Object.freeze({
    profileId,
    concurrency: 0,
    uncertainty: 0,
    logisticsCongestion: 0,
    timePressure: 0,
    asBuiltConfidence: 'HIGH',
    energyState: 'NOT_INSTALLED',
    groundwaterState: 'NORMAL',
    unresolvedSignals: Object.freeze({}),
  });
}

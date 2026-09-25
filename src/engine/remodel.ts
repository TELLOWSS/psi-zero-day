import type { DefenseEnemyId } from '../domain/defense';
import type { RiskPriorityContext } from '../domain/site-profile';
import type { RemodelAction, RemodelActionResult, RemodelRuntimeState } from '../domain/remodel';

function blocked(state: RemodelRuntimeState, reason: string): RemodelActionResult {
  return Object.freeze({ state, applied: false, blockedReason: reason });
}

function applied(state: RemodelRuntimeState, action: RemodelAction, patch: Partial<RemodelRuntimeState>): RemodelActionResult {
  if (state.completedActions.includes(action)) {
    return Object.freeze({ state, applied: false, blockedReason: null });
  }
  const next: RemodelRuntimeState = Object.freeze({
    ...state,
    ...patch,
    completedActions: Object.freeze([...state.completedActions, action]),
    revision: state.revision + 1,
  });
  return Object.freeze({ state: next, applied: true, blockedReason: null });
}

export function applyRemodelAction(state: RemodelRuntimeState, action: RemodelAction): RemodelActionResult {
  if (state.phase === 'COMPLETE') return blocked(state, '대표 리모델링 공정 검증이 완료되었습니다.');

  if (action === 'REVIEW_EXISTING_RECORDS') {
    if (state.asBuiltConfidence !== 'LOW') return blocked(state, '기존 도면·기록 검토가 이미 반영되었습니다.');
    return applied(state, action, { asBuiltConfidence: 'MEDIUM' });
  }

  if (action === 'FIELD_VERIFY_EXISTING') {
    if (state.asBuiltConfidence === 'LOW') return blocked(state, '먼저 기존 도면·기록을 검토해야 합니다.');
    if (state.asBuiltConfidence === 'HIGH') return blocked(state, '현장 실측·확인까지 반영된 상태입니다.');
    return applied(state, action, { asBuiltConfidence: 'HIGH' });
  }

  if (action === 'VERIFY_ISOLATION') {
    if (state.asBuiltConfidence === 'LOW') return blocked(state, '기존 구조·설비 정보 확인 전에는 차단 상태를 확정하지 않습니다.');
    return applied(state, action, { isolationState: 'VERIFIED' });
  }

  if (action === 'INSTALL_TEMP_SUPPORT') {
    if (state.asBuiltConfidence !== 'HIGH') return blocked(state, '기존 구조 상태를 현장에서 확인한 뒤 임시지지 계획을 적용합니다.');
    if (state.isolationState !== 'VERIFIED') return blocked(state, '기존 계통 차단 상태를 먼저 확인해야 합니다.');
    return applied(state, action, { phase: 'TEMP_SUPPORT', tempSupportState: 'INSTALLED' });
  }

  if (action === 'VERIFY_TEMP_SUPPORT') {
    if (state.tempSupportState !== 'INSTALLED') return blocked(state, '임시지지 설치가 선행되어야 합니다.');
    return applied(state, action, { tempSupportState: 'VERIFIED' });
  }

  if (action === 'PLAN_SELECTIVE_OPENING') {
    if (state.tempSupportState !== 'VERIFIED') return blocked(state, '임시지지 검증 후 선택철거 구역을 확정합니다.');
    return applied(state, action, { phase: 'SELECTIVE_DEMOLITION', structuralOpeningState: 'PLANNED' });
  }

  if (action === 'OPEN_SELECTIVE_ZONE') {
    if (state.structuralOpeningState !== 'PLANNED') return blocked(state, '선택철거 구역과 순서를 먼저 확정해야 합니다.');
    if (state.tempSupportState !== 'VERIFIED' || state.isolationState !== 'VERIFIED') {
      return blocked(state, '차단과 임시지지 검증이 유지된 상태에서만 선택철거를 진행합니다.');
    }
    return applied(state, action, { structuralOpeningState: 'OPENED' });
  }

  if (action === 'REINFORCE_OPENING') {
    if (state.structuralOpeningState !== 'OPENED') return blocked(state, '선택철거가 완료된 구역에서 보강·접합 준비를 진행합니다.');
    return applied(state, action, { phase: 'OLD_NEW_CONNECTION', structuralOpeningState: 'REINFORCED' });
  }

  if (action === 'PREPARE_CONNECTION') {
    if (state.structuralOpeningState !== 'REINFORCED') return blocked(state, '개구부 보강 상태를 먼저 확보해야 합니다.');
    return applied(state, action, { connectionState: 'PREPARED' });
  }

  if (action === 'VERIFY_CONNECTION') {
    if (state.connectionState !== 'PREPARED') return blocked(state, '기존·신설 구조 접합 준비가 먼저 완료되어야 합니다.');
    return applied(state, action, { phase: 'COMPLETE', connectionState: 'VERIFIED' });
  }

  return blocked(state, '지원하지 않는 리모델링 조치입니다.');
}

export function remodelRiskContext(state: RemodelRuntimeState, profileId: string): RiskPriorityContext {
  const unresolvedSignals: Partial<Record<DefenseEnemyId, number>> = {};
  const add = (risk: DefenseEnemyId, amount: number) => {
    unresolvedSignals[risk] = Math.min(4, (unresolvedSignals[risk] ?? 0) + amount);
  };

  if (state.asBuiltConfidence === 'LOW') add('VEILED', 3);
  if (state.asBuiltConfidence === 'MEDIUM') add('VEILED', 1);
  if (state.isolationState !== 'VERIFIED') add('VEILED', 1);

  if (state.tempSupportState !== 'VERIFIED' && state.phase !== 'SURVEY_ISOLATION') add('ARMORED', 2);
  if (state.structuralOpeningState === 'OPENED') {
    add('ARMORED', 2);
    add('SWARM', 1);
  }
  if (state.phase === 'SELECTIVE_DEMOLITION') {
    add('SWARM', 2);
    add('SWIFT', 1);
  }
  if (state.phase === 'OLD_NEW_CONNECTION') {
    add('ARMORED', 1);
    add('SWARM', 1);
    if (state.connectionState !== 'VERIFIED') add('VEILED', 1);
  }

  const phaseLoad = {
    SURVEY_ISOLATION: { concurrency: 0.2, logistics: 0.15 },
    TEMP_SUPPORT: { concurrency: 0.45, logistics: 0.3 },
    SELECTIVE_DEMOLITION: { concurrency: 0.82, logistics: 0.78 },
    OLD_NEW_CONNECTION: { concurrency: 0.7, logistics: 0.52 },
    COMPLETE: { concurrency: 0.25, logistics: 0.2 },
  }[state.phase];

  return Object.freeze({
    profileId,
    concurrency: phaseLoad.concurrency,
    uncertainty: state.asBuiltConfidence === 'LOW' ? 0.5 : state.asBuiltConfidence === 'MEDIUM' ? 0.3 : 0.12,
    logisticsCongestion: phaseLoad.logistics,
    timePressure: state.phase === 'SELECTIVE_DEMOLITION' ? 0.55 : 0.25,
    asBuiltConfidence: state.asBuiltConfidence,
    energyState: state.isolationState === 'VERIFIED' ? 'LOCKED_OUT' : 'INSTALLED',
    groundwaterState: 'NORMAL',
    unresolvedSignals: Object.freeze(unresolvedSignals),
  });
}

export function remodelCanLaunchDefense(state: RemodelRuntimeState): boolean {
  return state.asBuiltConfidence === 'HIGH'
    && state.isolationState === 'VERIFIED'
    && state.tempSupportState === 'VERIFIED'
    && (state.structuralOpeningState === 'PLANNED'
      || state.structuralOpeningState === 'OPENED'
      || state.structuralOpeningState === 'REINFORCED'
      || state.connectionState === 'PREPARED'
      || state.connectionState === 'VERIFIED');
}

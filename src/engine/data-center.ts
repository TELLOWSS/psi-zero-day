import type { DefenseEnemyId } from '../domain/defense';
import type {
  DataCenterAction, DataCenterActionResult, DataCenterRuntimeState,
} from '../domain/data-center';
import type { RiskPriorityContext } from '../domain/site-profile';

function blocked(state: DataCenterRuntimeState, reason: string): DataCenterActionResult {
  return Object.freeze({ state, applied: false, blockedReason: reason });
}

function applied(
  state: DataCenterRuntimeState,
  action: DataCenterAction,
  patch: Partial<DataCenterRuntimeState>,
): DataCenterActionResult {
  if (state.completedActions.includes(action)) {
    return Object.freeze({ state, applied: false, blockedReason: null });
  }
  const next: DataCenterRuntimeState = Object.freeze({
    ...state,
    ...patch,
    completedActions: Object.freeze([...state.completedActions, action]),
    revision: state.revision + 1,
  });
  return Object.freeze({ state: next, applied: true, blockedReason: null });
}

export function applyDataCenterAction(
  state: DataCenterRuntimeState,
  action: DataCenterAction,
): DataCenterActionResult {
  if (state.phase === 'COMPLETE') return blocked(state, '대표 데이터센터 시운전 검증이 완료되었습니다.');

  if (action === 'CLOSE_MEP_PUNCHLIST') {
    if (state.phase !== 'MEP_ROUGH_IN') return blocked(state, 'MEP 마감·간섭 확인 단계가 이미 지나갔습니다.');
    return applied(state, action, {
      phase: 'ELECTRICAL_UPS',
      energyState: 'INSTALLED',
      crossTradeConcurrency: 'MEDIUM',
    });
  }

  if (action === 'VERIFY_ELECTRICAL_BOUNDARY') {
    if (state.phase !== 'ELECTRICAL_UPS') return blocked(state, '전기/UPS 설치 상태가 확인되는 단계에서 작업경계를 검토합니다.');
    return applied(state, action, {});
  }

  if (action === 'PLAN_SYSTEM_ISOLATION') {
    if (!state.completedActions.includes('VERIFY_ELECTRICAL_BOUNDARY')) {
      return blocked(state, '전기계통 작업경계를 먼저 확인해야 합니다.');
    }
    return applied(state, action, { isolationState: 'PLANNED' });
  }

  if (action === 'VERIFY_SYSTEM_ISOLATION') {
    if (state.isolationState !== 'PLANNED') return blocked(state, '계통 격리 계획을 먼저 확정해야 합니다.');
    return applied(state, action, {
      isolationState: 'VERIFIED',
      energyState: 'LOCKED_OUT',
    });
  }

  if (action === 'PRE_ENERGIZATION_CHECK') {
    if (state.phase !== 'ELECTRICAL_UPS') return blocked(state, '전기/UPS 설치 상태에서 통전 전 확인을 진행합니다.');
    if (state.isolationState !== 'VERIFIED') return blocked(state, '검증된 계통 격리 상태가 먼저 필요합니다.');
    if (!state.completedActions.includes('VERIFY_ELECTRICAL_BOUNDARY')) {
      return blocked(state, '작업경계 확인이 먼저 필요합니다.');
    }
    return applied(state, action, {
      phase: 'ENERGIZATION',
      energyState: 'TESTING',
      commissioningState: 'PRECHECK',
      crossTradeConcurrency: 'LOW',
    });
  }

  if (action === 'ENTER_ENERGIZED_STATE') {
    if (state.phase !== 'ENERGIZATION' || state.commissioningState !== 'PRECHECK') {
      return blocked(state, '통전 전 확인과 격리 검증을 완료한 뒤 제한된 통전 상태로 전환합니다.');
    }
    if (state.isolationState !== 'VERIFIED') return blocked(state, '격리 경계가 검증된 상태여야 합니다.');
    return applied(state, action, {
      energyState: 'ENERGIZED',
    });
  }

  if (action === 'VERIFY_INTERLOCKS') {
    if (state.energyState !== 'ENERGIZED') return blocked(state, '활성계통 상태를 확인한 뒤 인터록 검증을 진행합니다.');
    return applied(state, action, { interlockState: 'VERIFIED' });
  }

  if (action === 'RUN_SINGLE_SYSTEM_TEST') {
    if (state.energyState !== 'ENERGIZED' || state.interlockState !== 'VERIFIED') {
      return blocked(state, '통전 상태와 인터록 검증이 모두 확보되어야 단일계통 시험을 시작합니다.');
    }
    return applied(state, action, {
      phase: 'INTEGRATED_COMMISSIONING',
      energyState: 'LIVE_CRITICAL',
      commissioningState: 'SINGLE_SYSTEM_TEST',
      crossTradeConcurrency: 'MEDIUM',
    });
  }

  if (action === 'RUN_INTEGRATED_TEST') {
    if (state.phase !== 'INTEGRATED_COMMISSIONING' || state.commissioningState !== 'SINGLE_SYSTEM_TEST') {
      return blocked(state, '단일계통 시험이 완료된 뒤 통합시운전으로 전환합니다.');
    }
    if (state.interlockState !== 'VERIFIED') return blocked(state, '인터록 검증 상태가 유지되어야 합니다.');
    return applied(state, action, {
      commissioningState: 'INTEGRATED_TEST',
      crossTradeConcurrency: 'HIGH',
    });
  }

  if (action === 'VERIFY_COMMISSIONING') {
    if (state.commissioningState !== 'INTEGRATED_TEST') {
      return blocked(state, '통합시운전 결과 확인이 선행되어야 합니다.');
    }
    return applied(state, action, {
      phase: 'COMPLETE',
      commissioningState: 'VERIFIED',
      crossTradeConcurrency: 'LOW',
    });
  }

  return blocked(state, '지원하지 않는 데이터센터 조치입니다.');
}

export function dataCenterRiskContext(
  state: DataCenterRuntimeState,
  profileId: string,
): RiskPriorityContext {
  const unresolvedSignals: Partial<Record<DefenseEnemyId, number>> = {};
  const add = (risk: DefenseEnemyId, amount: number) => {
    unresolvedSignals[risk] = Math.min(4, (unresolvedSignals[risk] ?? 0) + amount);
  };

  if (state.phase === 'MEP_ROUGH_IN') {
    add('SWARM', 2);
    add('VEILED', 1);
    add('SWIFT', 1);
  }
  if (state.phase === 'ELECTRICAL_UPS') {
    add('ARMORED', 1);
    add('VEILED', state.isolationState === 'VERIFIED' ? 0 : 2);
  }
  if (state.phase === 'ENERGIZATION') {
    add('ARMORED', 2);
    add('VEILED', state.interlockState === 'VERIFIED' ? 1 : 2);
  }
  if (state.phase === 'INTEGRATED_COMMISSIONING') {
    add('BOSS', state.commissioningState === 'INTEGRATED_TEST' ? 4 : 2);
    add('SWARM', 2);
    add('VEILED', 2);
  }

  const concurrency = state.crossTradeConcurrency === 'HIGH' ? 0.9
    : state.crossTradeConcurrency === 'MEDIUM' ? 0.58 : 0.25;
  const uncertainty = state.phase === 'MEP_ROUGH_IN' ? 0.42
    : state.phase === 'ELECTRICAL_UPS' ? 0.5
      : state.phase === 'ENERGIZATION' ? 0.45
        : state.phase === 'INTEGRATED_COMMISSIONING' ? 0.62 : 0.18;

  return Object.freeze({
    profileId,
    concurrency,
    uncertainty,
    logisticsCongestion: state.phase === 'MEP_ROUGH_IN' ? 0.65
      : state.phase === 'ELECTRICAL_UPS' ? 0.42
        : state.phase === 'ENERGIZATION' ? 0.2
          : state.phase === 'INTEGRATED_COMMISSIONING' ? 0.32 : 0.15,
    timePressure: state.phase === 'INTEGRATED_COMMISSIONING' ? 0.55 : 0.3,
    asBuiltConfidence: 'HIGH',
    energyState: state.energyState,
    groundwaterState: 'NORMAL',
    unresolvedSignals: Object.freeze(unresolvedSignals),
  });
}

export function dataCenterCanLaunchDefense(state: DataCenterRuntimeState): boolean {
  return state.isolationState === 'VERIFIED'
    && (state.energyState === 'ENERGIZED' || state.energyState === 'LIVE_CRITICAL')
    && state.commissioningState !== 'NOT_STARTED';
}

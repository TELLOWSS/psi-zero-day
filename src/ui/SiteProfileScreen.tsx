import { useMemo, useState } from 'react';
import { defaultSiteProfile, siteProfileById, siteProfiles } from '../content/site-profiles';
import { remodelScenario } from '../content/remodel';
import { siteProcessMapByProfile, siteScenarioId } from '../content/site-process-maps';
import type { RemodelAction } from '../domain/remodel';
import type { ProjectArchetype } from '../domain/site-profile';
import { baselineRiskContext, topRiskPriorities } from '../engine/risk-priority';
import { applyRemodelAction, remodelCanLaunchDefense, remodelRiskContext } from '../engine/remodel';
import { readRemodelState, resetRemodelState, writeRemodelState } from '../app/remodel-state';
import { readSiteProfilePreference, writeSiteProfilePreference } from '../app/site-profile-preference';

const PROJECT_LABEL: Record<ProjectArchetype, string> = {
  APT_NEW_BUILD: '공동주택 신축',
  APT_REMODEL: '공동주택 리모델링',
  DATA_CENTER: '데이터센터',
};

const RISK_COPY = {
  NORMAL: '눈에 보이는 일상 위험',
  SWIFT: '차량·양중·급변 동선',
  ARMORED: '구조·중량·큰 에너지',
  SWARM: '동시작업·혼잡·간섭',
  VEILED: '숨은 상태·정보 불확실',
  BOSS: '복합 시스템 사건',
} as const;

type ContextKey = 'concurrency' | 'uncertainty' | 'logisticsCongestion' | 'timePressure';

const CONTEXT_LABEL: Record<ContextKey, string> = {
  concurrency: '동시작업',
  uncertainty: '정보 불확실',
  logisticsCongestion: '물류 혼잡',
  timePressure: '공정 압박',
};

const MAP_HINT: Record<string, string> = {
  A1_SITE_EXCAVATION: '개방 굴착 · 흙막이 · 굴착기/덤프 동선',
  A3_RC_FRAME: '형틀 · 철근 · 슬래브단부 · 갱폼/동바리',
  T2_UNDER_SLAB_EXCAVATION: '슬래브 하부 · 토사반출구 · 저시야/수직물류',
  T3_CONCURRENT_ABOVE_BELOW: '상부 골조 + 하부 굴착 · 공정 간섭',
  R1_SURVEY_ISOLATION: '기존 구조 조사 · 설비 차단 · 도면/실물 검증',
  R2_SELECTIVE_DEMOLITION: '선택철거 · 잭서포트 · 폐기물 반출',
  R4_EXTENSION_CONNECTION: '기존/신설 구조 접합 · 보강 · 양중',
  D2_MEP_ROUGH_IN: '케이블트레이 · 덕트 · 배관 · 다공종 동시작업',
  D3_ELECTRICAL_UPS: '수배전 · UPS · 배터리 · 에너지 상태',
  D6_COMMISSIONING: '통전 · 기능시험 · 통합시운전 · 활성계통',
};

function nextLevel(value: number) {
  if (value < 0.25) return 0.5;
  if (value < 0.75) return 1;
  return 0;
}

function levelLabel(value: number) {
  if (value < 0.25) return '낮음';
  if (value < 0.75) return '중간';
  return '높음';
}

const REMODEL_ACTIONS: readonly { readonly action: RemodelAction; readonly label: string; readonly hint: string }[] = [
  { action: 'REVIEW_EXISTING_RECORDS', label: '도면·기록 검토', hint: '기존 구조·설비 기록을 먼저 읽습니다.' },
  { action: 'FIELD_VERIFY_EXISTING', label: '현장 실측 확인', hint: '도면과 실제 구조의 차이를 확인합니다.' },
  { action: 'VERIFY_ISOLATION', label: '계통 차단 확인', hint: '철거 전 기존 설비·에너지 상태를 확인합니다.' },
  { action: 'INSTALL_TEMP_SUPPORT', label: '임시지지 적용', hint: '구조 변경 전 임시지지 상태를 확보합니다.' },
  { action: 'VERIFY_TEMP_SUPPORT', label: '임시지지 검증', hint: '설치 상태를 확인하고 다음 단계 조건을 엽니다.' },
  { action: 'PLAN_SELECTIVE_OPENING', label: '선택철거 구역 확정', hint: '철거 범위와 순서를 계획 상태로 고정합니다.' },
  { action: 'OPEN_SELECTIVE_ZONE', label: '선택철거 진행', hint: '검증된 선행조건 아래에서만 진행됩니다.' },
  { action: 'REINFORCE_OPENING', label: '개구부 보강', hint: '구조 접합 전 보강 상태를 확보합니다.' },
  { action: 'PREPARE_CONNECTION', label: '기존·신설 접합 준비', hint: '증축부와 기존 구조의 접합 준비를 진행합니다.' },
  { action: 'VERIFY_CONNECTION', label: '접합 상태 검증', hint: '대표 리모델링 공정을 완료합니다.' },
];

const REMODEL_STATE_LABELS = {
  LOW: '낮음', MEDIUM: '중간', HIGH: '높음',
  UNKNOWN: '미확인', PARTIAL: '일부확인', VERIFIED: '검증',
  NOT_INSTALLED: '미설치', INSTALLED: '설치', CLOSED: '폐쇄', PLANNED: '계획',
  OPENED: '개방', REINFORCED: '보강', NOT_STARTED: '미시작', PREPARED: '준비',
} as const;

export function SiteProfileScreen({ onBack, onPracticeScenario }: {
  readonly onBack: () => void;
  readonly onPracticeScenario: (scenarioId: string) => void;
}) {
  const [profileId, setProfileId] = useState(() => readSiteProfilePreference());
  const [context, setContext] = useState(() => ({
    concurrency: 0,
    uncertainty: 0,
    logisticsCongestion: 0,
    timePressure: 0,
  }));
  const [remodelState, setRemodelState] = useState(() => readRemodelState());
  const [remodelNotice, setRemodelNotice] = useState('');
  const selected = siteProfileById(profileId) ?? defaultSiteProfile;
  const isRemodelRepresentative = selected.id === remodelScenario.profileId;
  const riskContext = useMemo(() => isRemodelRepresentative
    ? remodelRiskContext(remodelState, selected.id)
    : ({
      ...baselineRiskContext(selected.id),
      ...context,
      asBuiltConfidence: selected.projectArchetype === 'APT_REMODEL' ? 'MEDIUM' as const : 'HIGH' as const,
      energyState: selected.processPhase === 'COMMISSIONING'
        ? 'TESTING' as const
        : selected.processPhase === 'ELECTRICAL_UPS'
          ? 'INSTALLED' as const
          : 'NOT_INSTALLED' as const,
    }), [context, isRemodelRepresentative, remodelState, selected]);

  const top = useMemo(() => topRiskPriorities(selected, riskContext, 3), [riskContext, selected]);
  const processMap = useMemo(
    () => siteProcessMapByProfile(selected.id) ?? (isRemodelRepresentative ? remodelScenario.map : undefined),
    [isRemodelRepresentative, selected.id],
  );
  const practiceScenarioId = isRemodelRepresentative ? remodelScenario.id : siteProcessMapByProfile(selected.id) ? siteScenarioId(selected.id) : null;
  const remodelReady = isRemodelRepresentative && remodelCanLaunchDefense(remodelState);

  const choose = (id: string) => {
    setProfileId(id);
    writeSiteProfilePreference(id);
    setContext({ concurrency: 0, uncertainty: 0, logisticsCongestion: 0, timePressure: 0 });
    setRemodelNotice('');
  };

  const runRemodelAction = (action: RemodelAction) => {
    const result = applyRemodelAction(remodelState, action);
    setRemodelState(result.state);
    if (result.applied) {
      writeRemodelState(result.state);
      setRemodelNotice('현장 상태가 반영되었습니다.');
    } else {
      setRemodelNotice(result.blockedReason ?? '이미 반영된 조치입니다.');
    }
  };

  const restartRemodel = () => {
    const state = resetRemodelState();
    setRemodelState(state);
    setRemodelNotice('리모델링 대표 공정을 처음 상태로 되돌렸습니다.');
  };

  const grouped = (['APT_NEW_BUILD','APT_REMODEL','DATA_CENTER'] as const).map(project => ({
    project,
    profiles: siteProfiles.filter(profile => profile.projectArchetype === project),
  }));

  return <section className="site-profile-screen" data-site-profile={selected.id}>
    <header className="site-profile-head">
      <div>
        <small>G4 · SITE-PROFILE-01</small>
        <h1>현장 · 공정</h1>
        <p>현장 종류와 공법, 현재 공정이 바뀌면 먼저 읽어야 할 위험도 달라집니다.</p>
      </div>
      <button type="button" onClick={onBack}>메인으로</button>
    </header>

    <div className="site-profile-layout">
      <section className="site-profile-picker" aria-label="현장 프로필 선택">
        {grouped.map(group => <div key={group.project} className="site-profile-group">
          <h2>{PROJECT_LABEL[group.project]}</h2>
          <div>
            {group.profiles.map(profile => <button
              key={profile.id}
              type="button"
              aria-pressed={profile.id === selected.id}
              onClick={() => choose(profile.id)}
            >
              <strong>{profile.label.replace(PROJECT_LABEL[group.project] + ' · ', '')}</strong>
              <small>{MAP_HINT[profile.mapFamily] ?? profile.mapFamily}</small>
            </button>)}
          </div>
        </div>)}
      </section>

      <aside className="site-profile-priority">
        <div className="site-profile-priority-head">
          <span>PSI RISK PRIORITY</span>
          <b>GAME PRIORITY · NOT LEGAL RA</b>
        </div>
        <h2>{selected.label}</h2>
        <p>아래 값은 법정 위험성평가 점수가 아니라 게임 내 우선순위입니다.</p>

        <div className="site-profile-top3">
          {top.map(row => <article key={row.riskId} data-risk={row.riskId}>
            <i>{String(row.rank).padStart(2, '0')}</i>
            <div><strong>{row.riskId}</strong><small>{RISK_COPY[row.riskId]}</small></div>
            <b>{row.score}</b>
          </article>)}
        </div>

        {processMap ? <section className="site-process-preview" aria-label="대표 공정 맵 미리보기">
          <div className="site-process-preview-head">
            <div><small>{isRemodelRepresentative ? 'G6 · REMODEL RUNTIME PROOF' : 'G5 · TOPOLOGY PROOF'}</small><strong>{processMap.label}</strong></div>
            <button
              type="button"
              disabled={!practiceScenarioId || (isRemodelRepresentative && !remodelReady)}
              onClick={() => practiceScenarioId && onPracticeScenario(practiceScenarioId)}
            >{isRemodelRepresentative && !remodelReady ? '선행조건 확인 필요' : '이 공정으로 디펜스 체험'}</button>
          </div>
          <svg viewBox="0 0 1000 600" role="img" aria-label={processMap.label}>
            {processMap.zones.map(zone => <polygon
              key={zone.id}
              className={`site-map-zone zone-${zone.kind.toLowerCase()}`}
              points={zone.points.map(point => `${point.x},${point.y}`).join(' ')}
            />)}
            {processMap.visibilityZones.map(zone => <circle
              key={zone.id}
              className="site-map-visibility"
              cx={zone.center.x}
              cy={zone.center.y}
              r={zone.radius}
              opacity={0.18 + zone.severity * 0.28}
            />)}
            {processMap.routes.map(route => <polyline
              key={route.id}
              className={`site-map-route route-${route.kind}`}
              points={route.points.map(point => `${point.x},${point.y}`).join(' ')}
            />)}
            {processMap.verticalTransfers.map(item => <g key={item.id} className="site-map-transfer">
              <circle cx={item.point.x} cy={item.point.y} r="20" />
              <path d={`M${item.point.x - 10} ${item.point.y}h20M${item.point.x} ${item.point.y - 10}v20`} />
            </g>)}
            {processMap.interventionAnchors.map(item => <g key={item.id} className="site-map-anchor" data-tower={item.recommendedTower}>
              <circle cx={item.x} cy={item.y} r="16" />
              <text x={item.x} y={item.y + 5} textAnchor="middle">{item.recommendedTower.slice(0, 1)}</text>
            </g>)}
          </svg>
          <div className="site-process-preview-legend">
            <span data-kind="vehicle">차량/장비</span><span data-kind="worker">보행</span><span data-kind="material">자재/토사</span>
            <span data-kind="visibility">시야제한</span>
          </div>
        </section> : <section className="site-process-preview is-pending">
          <small>NEXT MAP GATE</small>
          <strong>대표 맵 제작 대기</strong>
          <p>G5는 순타 굴착과 역타 슬래브 하부굴착 두 맵만 먼저 검증합니다. 리모델링과 데이터센터 전용 맵은 G6/G7에서 순차 제작합니다.</p>
        </section>}

        {isRemodelRepresentative ? <section className="remodel-runtime-panel" data-remodel-phase={remodelState.phase}>
          <div className="remodel-runtime-head">
            <div><small>G6 · EXISTING BUILDING STATE</small><strong>기존 구조를 먼저 읽고, 검증된 순서로 바꿉니다.</strong></div>
            <button type="button" onClick={restartRemodel}>처음부터</button>
          </div>
          <p>{remodelScenario.legalScaleNote}</p>
          <div className="remodel-runtime-state">
            <span><small>AS-BUILT</small><b>{REMODEL_STATE_LABELS[remodelState.asBuiltConfidence]}</b></span>
            <span><small>차단</small><b>{REMODEL_STATE_LABELS[remodelState.isolationState]}</b></span>
            <span><small>임시지지</small><b>{REMODEL_STATE_LABELS[remodelState.tempSupportState]}</b></span>
            <span><small>선택철거</small><b>{REMODEL_STATE_LABELS[remodelState.structuralOpeningState]}</b></span>
            <span><small>구조접합</small><b>{REMODEL_STATE_LABELS[remodelState.connectionState]}</b></span>
          </div>
          <div className="remodel-runtime-actions">
            {REMODEL_ACTIONS.map((item, index) => <button
              key={item.action}
              type="button"
              data-done={remodelState.completedActions.includes(item.action) ? 'true' : 'false'}
              onClick={() => runRemodelAction(item.action)}
            >
              <i>{String(index + 1).padStart(2, '0')}</i>
              <span><strong>{item.label}</strong><small>{item.hint}</small></span>
              <b>{remodelState.completedActions.includes(item.action) ? '완료' : '진행'}</b>
            </button>)}
          </div>
          {remodelNotice ? <div className="remodel-runtime-notice" role="status">{remodelNotice}</div> : null}
        </section> : <div className="site-profile-context">
          <strong>현장 조건을 바꿔보세요</strong>
          <small>같은 공정에서도 신호와 현장 상태에 따라 순위가 변합니다.</small>
          <div>
            {(Object.keys(CONTEXT_LABEL) as ContextKey[]).map(key => <button
              key={key}
              type="button"
              data-level={levelLabel(context[key])}
              onClick={() => setContext(current => ({ ...current, [key]: nextLevel(current[key]) }))}
            >
              <span>{CONTEXT_LABEL[key]}</span><b>{levelLabel(context[key])}</b>
            </button>)}
          </div>
        </div>}

        <div className="site-profile-gate-note">
          <b>현재 Gate</b>
          <p>{isRemodelRepresentative
            ? 'G6는 기존 구조 조사·차단·임시지지·선택철거·접합 상태가 위험우선순위와 디펜스 진입 조건을 바꾸는지 검증합니다.'
            : 'G5 대표 순타/역타 맵은 topology/runtime proof까지 잠겼습니다. 데이터센터는 G7에서 대표 공정부터 이어집니다.'}</p>
        </div>
      </aside>
    </div>
  </section>;
}

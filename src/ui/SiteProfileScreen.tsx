import { useMemo, useState } from 'react';
import { defaultSiteProfile, siteProfileById, siteProfiles } from '../content/site-profiles';
import { siteProcessMapByProfile } from '../content/site-process-maps';
import type { ProjectArchetype } from '../domain/site-profile';
import { baselineRiskContext, topRiskPriorities } from '../engine/risk-priority';
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

export function SiteProfileScreen({ onBack, onPractice }: { readonly onBack: () => void; readonly onPractice: (profileId: string) => void }) {
  const [profileId, setProfileId] = useState(() => readSiteProfilePreference());
  const [context, setContext] = useState(() => ({
    concurrency: 0,
    uncertainty: 0,
    logisticsCongestion: 0,
    timePressure: 0,
  }));
  const selected = siteProfileById(profileId) ?? defaultSiteProfile;
  const riskContext = useMemo(() => ({
    ...baselineRiskContext(selected.id),
    ...context,
    asBuiltConfidence: selected.projectArchetype === 'APT_REMODEL' ? 'MEDIUM' as const : 'HIGH' as const,
    energyState: selected.processPhase === 'COMMISSIONING'
      ? 'TESTING' as const
      : selected.processPhase === 'ELECTRICAL_UPS'
        ? 'INSTALLED' as const
        : 'NOT_INSTALLED' as const,
  }), [context, selected]);

  const top = useMemo(() => topRiskPriorities(selected, riskContext, 3), [riskContext, selected]);
  const processMap = useMemo(() => siteProcessMapByProfile(selected.id), [selected.id]);

  const choose = (id: string) => {
    setProfileId(id);
    writeSiteProfilePreference(id);
    setContext({ concurrency: 0, uncertainty: 0, logisticsCongestion: 0, timePressure: 0 });
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
            <div><small>G5 · TOPOLOGY PROOF</small><strong>{processMap.label}</strong></div>
            <button type="button" onClick={() => onPractice(selected.id)}>이 공정으로 디펜스 체험</button>
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

        <div className="site-profile-context">
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
        </div>

        <div className="site-profile-gate-note">
          <b>현재 Gate</b>
          <p>G4에서는 선택·위험우선순위 시스템만 연결합니다. 실제 순타/역타/리모델링/데이터센터 전용 맵은 G5 이후 대표 맵부터 하나씩 제작합니다.</p>
        </div>
      </aside>
    </div>
  </section>;
}

export const MASTER_DESIGN_PRINCIPLES_ID = 'master-design-principles-v1' as const;

export const MASTER_DESIGN_PRINCIPLES = Object.freeze({
  id: MASTER_DESIGN_PRINCIPLES_ID,
  status: 'ABSOLUTE_PROJECT_DIRECTION',
  product: Object.freeze({
    brand: 'NEW PSI',
    title: 'NEW PSI : ZERO DAY',
    subtitle: '오늘도 무사히',
  }),
  northStar: '하나의 에피소드가 영화처럼 몰입되고, 플레이어의 판단이 다음 현장에 실제 흔적으로 남는 건설현장 전략·추리·디펜스 게임.',
  genrePillars: Object.freeze(['strategy', 'investigation', 'defense'] as const),
  principles: Object.freeze([
    Object.freeze({
      id: 'play_not_lecture',
      title: '교육보다 먼저 게임이어야 한다',
      text: '전략·추리·디펜스를 하나의 사건 흐름으로 엮고, 플레이어가 단순히 다음 버튼을 누르는 대신 관찰·질문·배치·판단·대응을 실제로 수행하게 한다.',
    }),
    Object.freeze({
      id: 'cognitive_rhythm',
      title: '두뇌 피로를 연출 리듬으로 해소한다',
      text: '생각이 필요한 구간 사이에 고품질 장면, 매력적인 캐릭터, 음악·효과음, 짧은 액션·회복 구간을 배치해 공부처럼 느껴지는 연속 문제풀이를 피한다.',
    }),
    Object.freeze({
      id: 'living_construction_world',
      title: '현장은 공정과 함께 실제로 성장한다',
      text: '기초 → 지하 → 기준층 → 상부·옥탑·마감으로 공사가 진행되며, 같은 현장의 공간·동선·위험·인물 관계가 시간에 따라 누적 변화한다.',
    }),
    Object.freeze({
      id: 'season_changes_play',
      title: '계절은 배경 스킨이 아니라 게임 상태다',
      text: '계절·우기·혹서·혹한 변화가 위험요인, 작업속도, 근로자 상태, TBM, 장비·공정 조건과 사건 발생 방식에 영향을 준다.',
    }),
    Object.freeze({
      id: 'method_changes_rules',
      title: '공법은 다른 플레이 문법을 만든다',
      text: '순타·역타·리모델링 등 공법 차이는 장식이 아니라 동선, 순서, 위험 신호, 의사결정과 대응 방식의 차이로 구현한다.',
    }),
    Object.freeze({
      id: 'project_type_expansion',
      title: '현장 종류를 캠페인 축으로 확장한다',
      text: '아파트·물류센터 등 서로 다른 프로젝트 유형은 같은 엔진 위에서 공간 구조, 공종, 이해관계자, 장비와 위험 패턴이 다른 별도 캠페인 경험을 제공한다.',
    }),
    Object.freeze({
      id: 'real_records_become_clues',
      title: '실제 안전자료는 이야기의 단서가 된다',
      text: '월별 위험성평가, 사고사례, 근로자 참여 위험성평가, TBM·사진·기록은 정답표가 아니라 사건을 추리하고 판단하는 증거와 후속 행동의 근거로 사용한다.',
    }),
    Object.freeze({
      id: 'cinematic_episode_memory',
      title: '에피소드는 한 편의 영화처럼 닫힌다',
      text: '오프닝 → 이상징후 → 관계·탐색 → 판단 → 사건·대응 → 결과 → 다음 날 신호가 하나의 인과로 이어지고, 선택의 기억이 관계·기록·PSI 신호·다음 공정에 남는다.',
    }),
  ]),
  productionOrder: Object.freeze([
    'phase_c_integrated_quality_baseline',
    'episode01_final_playthrough_and_regression',
    'phase_d_final_art_sound_direction_lock',
    'episode01_cinematic_vertical_slice_lock',
    'expand_progression_season_method_project_systems',
  ] as const),
  episodeAuthoringGate: Object.freeze([
    '플레이어가 실제로 관찰·질문·배치·판단·대응 중 하나 이상을 수행하는가?',
    '전략·추리 구간 뒤에 감정·시각·사운드 리듬을 회복시키는 장면이 있는가?',
    '현재 공정 단계와 공간 변화가 장면에 반영되는가?',
    '위험성평가·TBM·사진·증언·사고기록 중 필요한 정보가 단서로 기능하는가?',
    '선택의 결과가 즉시 점수표가 아니라 이후 사람·기록·현장 상태에 남는가?',
    '에피소드 시작부터 다음 날 신호까지 하나의 영화적 인과선으로 이어지는가?',
  ]),
  forbiddenDrift: Object.freeze([
    'Episode 01을 Production Lock하기 전에 대규모 신규 캠페인 제작을 시작하지 않는다.',
    '전략·추리를 연속 문제풀이 또는 법규 퀴즈로 축소하지 않는다.',
    '계절·공법·현장종류를 단순 배경 교체로 처리하지 않는다.',
    '실제 사고사례나 위험성평가를 정답 암기용 슬라이드로 삽입하지 않는다.',
    '참고 작품의 고유 캐릭터·아트·서사·명칭을 복제하지 않는다. 참고는 시스템·리듬 수준으로 제한한다.',
  ]),
});

export type MasterDesignPrinciple = (typeof MASTER_DESIGN_PRINCIPLES.principles)[number];

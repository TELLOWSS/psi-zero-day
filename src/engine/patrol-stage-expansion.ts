import type { HazardType, PatrolStageDefinition, StageHazardObject } from '../domain/patrol-survivors';

const object = (id: string, type: StageHazardObject['type'], x: number, y: number, label: string): StageHazardObject => ({
  id, type, x, y, label, radius: type === 'crane_drop_zone' ? 115 : type === 'floodlight_tower' ? 170 : 30,
  hp: type === 'crane_drop_zone' || type === 'floodlight_tower' ? 9999 : 60,
  maxHp: type === 'crane_drop_zone' || type === 'floodlight_tower' ? 9999 : 60,
  state: type === 'floodlight_tower' ? 'active' : 'idle', timer: type === 'crane_drop_zone' ? 10 : 0,
});
function mission(n: 6 | 7 | 8 | 9 | 10, name: string, profile: string, description: string, mix: readonly HazardType[], objects: StageHazardObject[], metric: 'boss' | 'hp' | 'shout', target: number): PatrolStageDefinition {
  return {
    id: `stage_${String(n).padStart(2, '0')}` as PatrolStageDefinition['id'], stageNumber: n, name,
    subtitle: 'Construction Process Mission', siteProfileId: profile, description,
    theme: n >= 9 ? 'datacenter' : n === 6 ? 'deep_excavation' : 'highrise_slab',
    floorColor: n >= 9 ? '#142128' : '#242b30', gridColor: 'rgba(148,163,184,.09)',
    borderColor: n >= 9 ? '#38bdf8' : '#a3e635', ambientColor: 'rgba(148,163,184,.04)', icon: n >= 9 ? '⚡' : '🏗️',
    hazards: objects, hazardMix: mix, difficulty: 1 + (n - 5) * .06,
    bossName: n >= 9 ? '설비 반입 작업반경' : n === 7 ? '철거 양중 작업반경' : '중장비 작업반경',
    bossTitle: 'STOP · ISOLATE · VERIFY', bossType: n === 6 ? 'RUNAWAY_CART' : 'CRANE_BOSS', bossHp: 1400 + n * 80,
    starChallenges: [
      { starIndex: 1, metric: 'victory', title: '공정 순찰 완료', description: '3분간 방호 한계를 지키고 작전 완료', currentValue: 0, targetValue: 1, isCompleted: false },
      { starIndex: 2, metric: 'environmental', title: '작업구역 통제', description: `격리·양중 중지로 위험 노출 ${n - 2}건 해소`, currentValue: 0, targetValue: n - 2, isCompleted: false },
      { starIndex: 3, metric, title: metric === 'hp' ? '안전 여력 확보' : metric === 'shout' ? '긴급 작업중지' : '대표 위험 통제', description: metric === 'hp' ? `체력 ${target}% 이상으로 완료` : metric === 'shout' ? '소장 샤우팅 1회 사용' : '경보로 등장한 대표 장비 위험 통제', currentValue: 0, targetValue: target, isCompleted: false },
    ],
  };
}

// Separate construction-site training missions, not a single building's chronological schedule.
export const ADDITIONAL_PATROL_STAGES = {
  stage_06: mission(6, '리모델링 사전 조사·전원 차단', 'apt-remodel-survey', '기존 설비와 통로를 조사합니다. 전원 차단 구역을 확보하고 가스 위험과 반입 차량을 통제하세요.', ['UNHELMETED', 'GAS_LEAK', 'GAS_LEAK', 'RUNAWAY_CART'], [object('survey_power_1','electric_transformer',420,300,'기존 전원 차단'), object('survey_power_2','electric_transformer',1000,600,'분전반 격리'), object('survey_light','floodlight_tower',700,220,'조사 조명')], 'hp', 50),
  stage_07: mission(7, '리모델링 선택 철거', 'apt-remodel-selective-demolition', '철거 낙하물 경고원을 벗어나고 양중 작업을 중지합니다. 무전 조치로 낙하 작업반경을 비우세요.', ['UNHELMETED','FALLING_DEBRIS','FALLING_DEBRIS','RUNAWAY_CART'], [object('demo_1','crane_drop_zone',350,280,'철거 양중 통제'), object('demo_2','crane_drop_zone',1050,620,'폐기물 반출 통제'), object('demo_3','crane_drop_zone',700,450,'낙하 작업반경')], 'boss', 1),
  stage_08: mission(8, '기존·신설 구조 접합', 'apt-remodel-old-new-connection', '접합부 작업과 자재 반입 동선이 겹칩니다. 양중 중지와 기존 설비 격리를 조합해 통로를 확보하세요.', ['UNHELMETED','FALLING_DEBRIS','RUNAWAY_CART','UNHELMETED'], [object('join_1','crane_drop_zone',420,300,'접합부 양중 중지'),object('join_2','crane_drop_zone',980,600,'보강재 양중 중지'),object('join_power','electric_transformer',700,220,'기존 설비 격리')], 'hp', 60),
  stage_09: mission(9, '데이터센터 MEP 설치', 'data-center-mep', '배관·공조·전기 설치가 동시에 진행됩니다. 설비 반입 동선과 가스 위험을 구분하고 전원 차단을 확인하세요.', ['UNHELMETED','GAS_LEAK','RUNAWAY_CART','GAS_LEAK'], [object('mep_power1','electric_transformer',400,280,'전기 구역 격리'),object('mep_power2','electric_transformer',1000,620,'공조 전원 차단'),object('mep_store1','explosive_barrel',400,620,'용제 보관구역 격리'),object('mep_store2','explosive_barrel',1000,280,'작업구역 대피')], 'shout', 1),
  stage_10: mission(10, '데이터센터 통합 시운전', 'data-center-commissioning', '전체 공정 통제를 점검하는 마지막 순찰입니다. 차단·격리 상태를 확보하고 대표 설비 위험까지 통제하세요.', ['UNHELMETED','GAS_LEAK','RUNAWAY_CART','FALLING_DEBRIS'], [object('test_power1','electric_transformer',350,280,'수전 구역 차단'),object('test_power2','electric_transformer',1050,620,'UPS 전원 격리'),object('test_power3','electric_transformer',700,220,'시운전 구역 격리'),object('test_lift1','crane_drop_zone',420,600,'설비 반입 중지'),object('test_lift2','crane_drop_zone',980,300,'양중 작업반경')], 'boss', 1),
};

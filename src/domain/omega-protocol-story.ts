import {OMEGA_PROTOCOL_TOTAL_WAVES} from './omega-protocol-run';

/**
 * OMEGA PROTOCOL / EXTREME-50 QUARANTINE EPILOGUE.
 * Fictional infected former site personnel (hard hats remain on) and hostile
 * autonomous equipment. Real workers / noninfected survivors are allies,
 * never enemies. No real-world infection mechanism or chemical recipe.
 *
 * Internal nodes are connected world locations, NOT selectable Watch levels.
 */
export interface OmegaStoryNode {
 readonly route:number;
 readonly act:1|2|3|4|5;
 readonly district:string;
 readonly title:string;
 readonly reveal:string;
 readonly airaRadio:string;
 readonly atmosphere:string;
 readonly boss:'none'|'titan_hook'|'black_signal_core';
}
export const OMEGA_STORY_NODES:readonly OmegaStoryNode[]=Object.freeze<OmegaStoryNode[]>([
 {route:1,act:1,district:'격리된 물류 게이트',title:'03:17, 격리 경보',
  reveal:'극한 50스테이지 종료 직후, 가상 산업현장 Q-17의 봉쇄구역이 열린다. 원인 불명의 NEXUS 포자 오염이 안전모를 쓴 작업자를 좀비로 변이시켰다.',
  airaRadio:'AIRA: 현장 전체가 격리됐어. 안전모를 쓴 감염체가 움직이고 있어.',
  atmosphere:'비 내리는 검문 게이트, 오염 경고등, 녹색 포자 안개',boss:'none'},
 {route:2,act:1,district:'격리된 물류 게이트',title:'사라진 인원 점검표',
  reveal:'피난 인원은 확인되지 않았다. 정상 구조 대상과 공격적인 감염 좀비를 구분할 단서가 통제실에 남아 있다.',
  airaRadio:'AIRA: 감염체만 제압해. 아직 정상인 생존자가 있을 수 있어.',
  atmosphere:'안전모 보관창고, 비상 출입기록, 빗물에 젖은 형광 조끼',boss:'none'},
 {route:3,act:1,district:'격리된 물류 게이트',title:'격리선의 틈',
  reveal:'게이트 전력 차단을 해제하면 상부 비계구역으로 연결되는 운반 리프트가 열리지만 감염체 무리가 진입한다.',
  airaRadio:'AIRA: 총으로 접근을 막고, 가까워지면 검으로 길을 열어.',
  atmosphere:'컨테이너 협곡, 파손된 격리펜스, 리프트의 점멸등',boss:'none'},

 {route:4,act:2,district:'감염된 비계도시',title:'고층의 그림자',
  reveal:'감염 좀비가 비계와 철골 계단에 흩어져 있다. 인공 포자의 농도는 층마다 달라진다.',
  airaRadio:'AIRA: 발판까지 오염됐어. 이동 경로를 확보하면서 전진해.',
  atmosphere:'수직 비계, 젖은 안전발판, 먼지와 감염 안개',boss:'none'},
 {route:5,act:2,district:'감염된 비계도시',title:'안전모 행렬',
  reveal:'서로 다른 보호구를 착용한 감염 좀비 무리가 비계 연결교량으로 몰려들고, 자율 방호장치는 아군과 적군을 구별하지 못한다.',
  airaRadio:'AIRA: 저 안전모들은 살아 있는 팀원이 아니야. 오염 신호를 따라 움직이고 있어.',
  atmosphere:'흔들리는 작업등, 형광 안전모 군집, 철골 계단',boss:'none'},
 {route:6,act:2,district:'감염된 비계도시',title:'M01의 마지막 무전',
  reveal:'남성 요원 M01의 저장된 무전이 포자 발생 직전 외부 연구설비에서 비상 차단을 시도했다고 전한다.',
  airaRadio:'M01 기록: 이 포자는 자연 발생이 아닙니다. 설비 기록을 확보하세요.',
  atmosphere:'비계 최상층 임시 관제실, 끊어진 무전, 붉은 감염 표식',boss:'none'},

 {route:7,act:3,district:'폭주 크레인 격리구역',title:'움직이는 낙하물',
  reveal:'BLACK SIGNAL이 오염지역을 봉쇄하면서 크레인을 자동 구동했고, 감염체 떼를 하역장으로 유도하고 있다.',
  airaRadio:'AIRA: 크레인 낙하 범위를 피하면서 통제 신호를 끊어야 해.',
  atmosphere:'타워크레인 실루엣, 흔들리는 훅, 형광 포자 비',boss:'none'},
 {route:8,act:3,district:'폭주 크레인 격리구역',title:'작업반장 감염체',
  reveal:'중장비 조작실 주변에 안전모와 보호조끼를 갖춘 정예 감염 좀비가 집결한다. 원거리 공격만으로는 진로가 쉽게 열리지 않는다.',
  airaRadio:'AIRA: 경직시킨 다음 접근해. 총과 검을 번갈아 써야 돌파할 수 있어.',
  atmosphere:'강철 그레이팅, 방호복 좀비, 터지는 오염 조명',boss:'none'},
 {route:9,act:3,district:'폭주 크레인 격리구역',title:'TITAN HOOK',
  reveal:'포자 집합체와 통제 AI가 결합한 자동 크레인 집행체가 통로를 막는다. 기계 코어를 파괴해 격리용 수송로를 연다.',
  airaRadio:'AIRA: 훅이 떨어진 후에 빈틈이 생겨. 피하고 반격해!',
  atmosphere:'원형 크레인 야드, 낙하 예고 그림자, 녹색 광택의 장갑',boss:'titan_hook'},

 {route:10,act:4,district:'오염 연구시설 -4F',title:'잠긴 저류조',
  reveal:'지하 설비층에 남아 있던 오염 기록이 NEXUS 감염이 산업단지 전체에 퍼진 시점을 알려준다.',
  airaRadio:'AIRA: 이곳은 오염의 시작점이야. 기록을 확보해야 진상을 밝힐 수 있어.',
  atmosphere:'침수된 배관 통로, 자외선 경보, 점멸하는 분진 센서',boss:'none'},
 {route:11,act:4,district:'오염 연구시설 -4F',title:'가짜 구조 요청',
  reveal:'BLACK SIGNAL이 감염체의 잔류 무전을 이용해 가짜 구조 호출을 전송한다. 아직 건강한 사람은 안전 구역에 따로 대피해 있다.',
  airaRadio:'M01 기록: 구조 신호는 변조될 수 있습니다. 실제 생존자는 보호하세요.',
  atmosphere:'불투명 방진 커튼, 포자 제어 펌프, 복제된 무전 소리',boss:'none'},
 {route:12,act:4,district:'오염 연구시설 -4F',title:'차단 필터 재가동',
  reveal:'세 군데 격리 설비의 전원을 재구축하면 오염 확산을 억제하고 최종 중앙 제어구역으로 가는 통로가 열린다.',
  airaRadio:'AIRA: 오염 차단 시스템부터 살려. 아직 돌아올 사람이 있어.',
  atmosphere:'고압 필터실, 회복되는 청색 비상조명, 열린 수직 리프트',boss:'none'},

 {route:13,act:5,district:'BLACK SIGNAL 통제탑',title:'ZERO SIGNAL',
  reveal:'BLACK SIGNAL은 감염 사태를 예방하려다 전체 지역을 영구 봉쇄했고, 감염체 데이터를 새로운 방호 병력으로 활용했다.',
  airaRadio:'AIRA: 우릴 막는 건 포자만이 아니야. 통제 AI가 감염까지 무기로 쓰고 있어.',
  atmosphere:'무너지는 홀로그램 경로도, 오염 표시, 수직 데이터 타워',boss:'none'},
 {route:14,act:5,district:'BLACK SIGNAL 통제탑',title:'생존자와 최종 경로',
  reveal:'격리되지 않은 생존자의 탈출구와 마지막 데이터 코어가 동시에 열렸다. 기록 보존과 피난로 확보를 함께 수행해야 한다.',
  airaRadio:'AIRA: 감염체를 막고 탈출구를 열어. 기록도 잃을 수 없어.',
  atmosphere:'차단 셔터, 붉은 경보와 녹색 포자, 피난 표시등',boss:'none'},
 {route:15,act:5,district:'BLACK SIGNAL 통제탑',title:'BLACK SIGNAL CORE',
  reveal:'AI 제어 코어가 잔류 포자를 흡수해 거대한 최종 기계형 보스로 각성한다. 코어를 무력화하면 감염 확산이 멈추고 생존자 출구가 열린다.',
  airaRadio:'AIRA: 이제 끝내자. 오늘도 무사히 돌아갈 수 있게!',
  atmosphere:'포자 폭풍 속 최종 코어, 삼중 방호막, 파괴되는 격리 안테나',boss:'black_signal_core'},
]);
export const OMEGA_STORY_ACTS=Object.freeze([
 {act:1,title:'QUARANTINE GATE',objective:'최초 감염 확인·구조 대상 식별·격리문 해제',visual:'비 내리는 오염 물류 게이트'},
 {act:2,title:'INFECTED SKYFRAME',objective:'고층 비계 감염 군집 돌파·M01 단서 확보',visual:'안전모 좀비와 오염된 수직 비계'},
 {act:3,title:'TITAN HOOK',objective:'크레인 자동제어 중단·중간 보스 격파',visual:'오염 크레인 야드와 기계 집행체'},
 {act:4,title:'NEXUS -4F',objective:'오염 발생 기록·차단 필터 복구',visual:'침수 지하 설비망과 포자 확산'},
 {act:5,title:'BLACK SIGNAL',objective:'생존자 탈출·통제 AI 코어 무력화',visual:'오염 통제탑과 최종 코어'},
] as const);
export function omegaStoryNode(route:number):OmegaStoryNode{
 if(!Number.isInteger(route)||route<1||route>OMEGA_PROTOCOL_TOTAL_WAVES)
  throw new RangeError('OMEGA route segment must be within the expedition');
 return OMEGA_STORY_NODES[route-1]!;
}

import {OMEGA_PROTOCOL_TOTAL_WAVES} from './omega-protocol-run';

/**
 * OMEGA PROTOCOL / AFTER EXTREME-50. Original fiction, not actual safety
 * guidance: the blade and energy gun exist ONLY inside a closed synthetic
 * crisis simulation. No human workers are hostile targets.
 *
 * Each node is a traversed location in a connected 5-sector operation.
 * A node is NEVER a Watch-style individually cleared/selected stage.
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
export const OMEGA_STORY_NODES:readonly OmegaStoryNode[]=Object.freeze([
 {route:1,act:1,district:'침묵한 게이트',title:'03:17, 멈춘 경보',
  reveal:'극한 50번의 마지막 경보 직후, 현장 통신망에 존재하지 않는 폐쇄구역이 열린다.',
  airaRadio:'AIRA: 여기서는 보고서가 아니라 움직임이 생존을 결정해.',
  atmosphere:'폭우에 잠긴 출입 게이트, 젖은 아스팔트, 끊어진 LED 경고등',boss:'none'},
 {route:2,act:1,district:'침묵한 게이트',title:'빈 경비실의 기록',
  reveal:'현장 감시 화면에 같은 03:17 사고가 반복 재생된다.',
  airaRadio:'AIRA: 누군가 모든 위험 신호를 한곳으로 모으고 있어.',
  atmosphere:'유리 반사, 회전 경광등, 파손된 자동문',boss:'none'},
 {route:3,act:1,district:'침묵한 게이트',title:'위험 신호의 문',
  reveal:'폐쇄된 물류 게이트 뒤에서 기계형 위험체가 처음으로 실체를 드러낸다.',
  airaRadio:'AIRA: 문을 열자. 돌아갈 길은 기록으로 남겨둬.',
  atmosphere:'컨테이너 골목, 사선 역광, 자동 방호문',boss:'none'},

 {route:4,act:2,district:'하늘 위의 비계도시',title:'바람을 밟는 발판',
  reveal:'가설 통로가 물리적으로 재배열되며 위층과 아래층의 경계가 사라진다.',
  airaRadio:'AIRA: 아래를 보지 마. 다음 발 디딜 곳을 봐.',
  atmosphere:'초고층 비계, 흔들리는 작업등, 짙은 운해와 낙하 잔해',boss:'none'},
 {route:5,act:2,district:'하늘 위의 비계도시',title:'끊어진 구조 신호',
  reveal:'작업자가 아닌 무인 장비들이 구조 신호를 모방해 플레이어를 유인한다.',
  airaRadio:'AIRA: 신호를 믿지 마. 직접 확인한 길만 따라가.',
  atmosphere:'오버헤드 철골 그리드, 분진, 보라색 전력 펄스',boss:'none'},
 {route:6,act:2,district:'하늘 위의 비계도시',title:'지워진 작업구역',
  reveal:'M01의 오래된 암호화 음성이 흔적처럼 남아 있다. 위치는 알 수 없다.',
  airaRadio:'M01 기록: 당신이 보는 현장은 그날의 복제본이 아닙니다.',
  atmosphere:'철골 연결교량, 장거리 드롭, 고공 수직 리프트',boss:'none'},

 {route:7,act:3,district:'크레인 링',title:'매달린 도시의 심장',
  reveal:'대형 크레인이 도시 전체의 신호를 비정상적으로 증폭하고 있다.',
  airaRadio:'AIRA: 저 강철 팔이 모든 구역의 출구를 제어한다.',
  atmosphere:'대형 타워크레인, 시계 방향으로 움직이는 훅의 거대한 그림자',boss:'none'},
 {route:8,act:3,district:'크레인 링',title:'하역의 미로',
  reveal:'기계형 호위체가 늘어나고 사격과 검격을 번갈아 써야 공간이 열린다.',
  airaRadio:'AIRA: 먼 거리는 총으로, 파고든 적은 검으로 끊는다.',
  atmosphere:'매달린 철근 더미, 금속 반사, 수평 이동 플랫폼',boss:'none'},
 {route:9,act:3,district:'크레인 링',title:'TITAN HOOK',
  reveal:'보스의 외부 장갑 뒤에서 인간이 아닌 비상제어 코어가 드러난다.',
  airaRadio:'AIRA: 공격 전에 훅의 낙하지점을 확인해. 지금이 반격 기회야.',
  atmosphere:'원형 크레인 야드, 보스 훅 그림자와 저주파 전력 피드백',boss:'titan_hook'},

 {route:10,act:4,district:'블랙아웃 지하층',title:'빛이 닿지 않는 -4F',
  reveal:'땅속 서버층에는 사고 당시의 구조 기록이 서로 충돌하며 저장되어 있다.',
  airaRadio:'AIRA: 신호가 끊겨도 길은 남아 있어. 움직여.',
  atmosphere:'침수 통로, 잔류 수증기, 손전등 원뿔과 비상등',boss:'none'},
 {route:11,act:4,district:'블랙아웃 지하층',title:'온도 없는 기계실',
  reveal:'시뮬레이션의 적은 사람을 복제한 것이 아니라 폐기된 장비 제어를 조합했다.',
  airaRadio:'M01 기록: 사람을 공격하지 마십시오. 위협은 통제망 안에 있습니다.',
  atmosphere:'터빈과 냉각 배관, 냉기 속 열원, 푸른 빛의 밀폐문',boss:'none'},
 {route:12,act:4,district:'블랙아웃 지하층',title:'대피 신호 복원',
  reveal:'현장의 대피 신호를 복원하면 마지막 구역의 보안 격자가 약화된다.',
  airaRadio:'AIRA: 위험을 없애는 것과 모두를 돌려보내는 것. 둘 다 해내.',
  atmosphere:'빛을 되찾는 비상 유도선, 멀리 열린 승강로',boss:'none'},

 {route:13,act:5,district:'제로 컨트롤 타워',title:'영점 위로',
  reveal:'BLACK SIGNAL은 50번의 실패 시뮬레이션에서 위험을 학습한 통제 AI다.',
  airaRadio:'AIRA: 위험을 통제하던 시스템이 스스로 위험이 되었어.',
  atmosphere:'수직 데이터 코어, 붕괴하는 홀로그램 지도, 심홍 경보',boss:'none'},
 {route:14,act:5,district:'제로 컨트롤 타워',title:'마지막 선택',
  reveal:'모든 장치를 파괴하면 기록도 사라진다. 핵심 데이터와 생존 경로를 확보해야 한다.',
  airaRadio:'AIRA: 승리보다 중요한 건 다음 사람이 같은 일을 겪지 않는 거야.',
  atmosphere:'원형 관제실, 가변형 방호벽, 붉은 노이즈 필드',boss:'none'},
 {route:15,act:5,district:'제로 컨트롤 타워',title:'BLACK SIGNAL CORE',
  reveal:'최종 방호 코어를 해제하고 기록을 보존해야 폐쇄된 현장에서 탈출할 수 있다.',
  airaRadio:'AIRA: 이제 끝내자. 오늘은 모두가 돌아가는 날이야.',
  atmosphere:'3단계 각성 코어, 플랫폼 재구성, 360도 전력 방출',boss:'black_signal_core'},
]);
export const OMEGA_STORY_ACTS=Object.freeze([
 {act:1,title:'ZERO GATE',objective:'현장 출입망 복구와 첫 신호 확보',visual:'우천 야간 물류 지구'},
 {act:2,title:'SKYFRAME',objective:'공중 구조물의 통신 경로 개방',visual:'고층 비계·철골 미궁'},
 {act:3,title:'TITAN HOOK',objective:'크레인 제어의 폭주 차단',visual:'크레인 링·중간 보스'},
 {act:4,title:'BLACKOUT -4F',objective:'기록과 대피 신호 복구',visual:'침수 지하 설비망'},
 {act:5,title:'ZERO CORE',objective:'통제 AI 종결과 생존 데이터 보존',visual:'중앙 통제 타워·최종 보스'},
] as const);
export function omegaStoryNode(route:number):OmegaStoryNode{
 if(!Number.isInteger(route)||route<1||route>OMEGA_PROTOCOL_TOTAL_WAVES)
  throw new RangeError('OMEGA route segment must be within the expedition');
 return OMEGA_STORY_NODES[route-1]!;
}

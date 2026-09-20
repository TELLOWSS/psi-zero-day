export type Episode01ScenePreset =
  | 'FIELD'
  | 'STRATEGY'
  | 'TBM'
  | 'STOP_WORK'
  | 'OFFICE'
  | 'DAY_RESULT';

export interface Episode01DirectorBeat {
  readonly event_id: string;
  readonly act: number;
  readonly sequence: number;
  readonly preset: Episode01ScenePreset;
  readonly time: string;
  readonly zone: string;
  readonly label: string;
  readonly tone: 'arrival' | 'pressure' | 'signal' | 'decision' | 'consequence' | 'release';
  readonly detail: string;
  readonly auto_advance_nodes: readonly string[];
}

const BEATS: Readonly<Record<string, Episode01DirectorBeat>> = Object.freeze({
  e01_01_arrival: {
    event_id: 'e01_01_arrival', act: 1, sequence: 10, preset: 'FIELD',
    time: '06:27', zone: 'GATE', label: '첫 출근', tone: 'arrival',
    detail: '10:24의 작업중지 장면으로 이어질 첫 신호가 아직 평범한 아침 속에 섞여 있다.',
    auto_advance_nodes: [],
  },
  e01_02_meet_kang: {
    event_id: 'e01_02_meet_kang', act: 1, sequence: 20, preset: 'TBM',
    time: '06:40', zone: 'TBM', label: '첫 TBM', tone: 'arrival',
    detail: '오늘의 위험을 말하는 것보다 현장이 실제로 무엇을 다르게 하고 있는지 듣는 데서 시작한다.',
    auto_advance_nodes: ['kang'],
  },
  e01_03_plan_breaks: {
    event_id: 'e01_03_plan_breaks', act: 2, sequence: 30, preset: 'STRATEGY',
    time: '07:10', zone: 'SITE MAP', label: '현장 배치', tone: 'pressure',
    detail: '인력·차량·자재가 동시에 움직이기 시작하면 작은 불일치가 다음 위험의 조건이 된다.',
    auto_advance_nodes: ['situation', 'lee', 'kang', 'yoon'],
  },
  e01_04_junho_signal: {
    event_id: 'e01_04_junho_signal', act: 2, sequence: 40, preset: 'FIELD',
    time: '08:05', zone: 'RAMP', label: '작은 신호', tone: 'signal',
    detail: '확실하지 않은 한마디를 무시할지, 사실로 만들기 위해 확인할지 결정한다.',
    auto_advance_nodes: ['signal', 'detail'],
  },
  e01_05_command: {
    event_id: 'e01_05_command', act: 3, sequence: 50, preset: 'STRATEGY',
    time: '09:10', zone: 'ENTRY · YARD', label: '공정 압박', tone: 'pressure',
    detail: '펌프카 도착시간과 현장 통제상태가 어긋나며 확인과 지시의 순서를 정해야 한다.',
    auto_advance_nodes: ['situation'],
  },
  e01_06_pump_arrival: {
    event_id: 'e01_06_pump_arrival', act: 3, sequence: 60, preset: 'FIELD',
    time: '09:24', zone: 'GATE', label: '판단이 돌아온다', tone: 'consequence',
    detail: '앞서 직접 본 것과 맡긴 것, 미뤄둔 것이 차량 한 대 앞에서 동시에 결과가 된다.',
    auto_advance_nodes: ['relation_conflict', 'relation_conflict_react', 'best_control', 'best_control_react', 'near_miss', 'near_miss_react', 'controlled_delay', 'controlled_delay_react'],
  },
  e01_07_first_pour: {
    event_id: 'e01_07_first_pour', act: 3, sequence: 70, preset: 'FIELD',
    time: '09:45', zone: 'POUR', label: '첫 타설', tone: 'release',
    detail: '작업 시작은 안전 판단의 끝이 아니라 현장이 다시 움직이기 시작하는 다음 상태다.',
    auto_advance_nodes: ['pour', 'kang', 'pressure', 'lee', 'after'],
  },
  e01_08_reactions: {
    event_id: 'e01_08_reactions', act: 4, sequence: 80, preset: 'FIELD',
    time: '10:02', zone: 'WORKFACE', label: '사람에게 남은 것', tone: 'consequence',
    detail: '아침의 판단은 공정표보다 사람의 기억과 다음 보고 행동에 더 오래 남는다.',
    auto_advance_nodes: ['kang.high', 'kang.low', 'yoon.high', 'yoon.low', 'junho.high', 'junho.low'],
  },
  e01_08a_reporting_return: {
    event_id: 'e01_08a_reporting_return', act: 4, sequence: 90, preset: 'FIELD',
    time: '10:10', zone: 'WORKFACE', label: '다시 말할 수 있는가', tone: 'signal',
    detail: '앞서 보고를 받아준 방식이 다음 이상신호의 크기와 속도를 바꾼다.',
    auto_advance_nodes: ['reinforced', 'suppressed', 'missed'],
  },
  e01_08b_inspection_find: {
    event_id: 'e01_08b_inspection_find', act: 5, sequence: 100, preset: 'STOP_WORK',
    time: '10:20', zone: '17F EDGE', label: '위험이 드러난다', tone: 'pressure',
    detail: '작업구역의 실제 상태와 공정 요구가 동시에 보이는 순간, 무엇을 먼저 확정할지 선택한다.',
    auto_advance_nodes: ['inspection', 'lee'],
  },
  e01_08c_site_pushback: {
    event_id: 'e01_08c_site_pushback', act: 5, sequence: 110, preset: 'STOP_WORK',
    time: '10:24', zone: '17F EDGE', label: 'ZERO MOMENT', tone: 'decision',
    detail: '작업을 멈추는 판단보다 더 어려운 것은 왜 멈췄고 무엇이 갖춰져야 다시 시작하는지를 설명하는 일이다.',
    auto_advance_nodes: ['full_stop', 'quick_photo', 'sequence'],
  },
  e01_08d_reinspection: {
    event_id: 'e01_08d_reinspection', act: 6, sequence: 120, preset: 'STOP_WORK',
    time: '11:15', zone: 'REINSPECTION', label: '재개 기준', tone: 'consequence',
    detail: '사진이나 말이 아니라 실제 현장을 다시 확인해 재개조건이 닫혔는지 검증한다.',
    auto_advance_nodes: ['full', 'reject', 'lee_rework', 'sequence'],
  },
  e01_08e_responsibility_clash: {
    event_id: 'e01_08e_responsibility_clash', act: 7, sequence: 130, preset: 'OFFICE',
    time: '13:30', zone: 'SITE OFFICE', label: '현장 현실', tone: 'pressure',
    detail: '같은 현장을 본 사람들의 서로 다른 시각을 맞추지 않으면 기록은 누군가의 주장으로 남는다.',
    auto_advance_nodes: ['gc', 'lee', 'kang'],
  },
  e01_08f_report_return: {
    event_id: 'e01_08f_report_return', act: 7, sequence: 140, preset: 'OFFICE',
    time: '13:48', zone: 'REPORT', label: '첫 기록의 반응', tone: 'consequence',
    detail: '첫 문장의 근거가 추가자료 앞에서 다시 검증된다.',
    auto_advance_nodes: ['correction', 'evidence', 'timeline'],
  },
  e01_08g_tbm_field_gap: {
    event_id: 'e01_08g_tbm_field_gap', act: 8, sequence: 150, preset: 'TBM',
    time: '14:20', zone: 'TBM · WORKFACE', label: '바뀐 작업, 바뀌지 않은 교육', tone: 'signal',
    detail: '아침의 TBM이 틀린 것이 아니라 작업조건이 달라졌다면 기준도 다시 현장 언어로 맞춰야 한다.',
    auto_advance_nodes: ['situation', 'lee', 'kang', 'junho'],
  },
  e01_08h_tbm_return: {
    event_id: 'e01_08h_tbm_return', act: 8, sequence: 160, preset: 'TBM',
    time: '14:36', zone: 'WORKFACE', label: '재전파의 결과', tone: 'consequence',
    detail: '서류보다 다음 작업자의 질문과 행동에서 변경기준이 실제로 공유됐는지가 드러난다.',
    auto_advance_nodes: ['paper', 'silenced', 'controlled'],
  },
  e01_08i_restart_pressure: {
    event_id: 'e01_08i_restart_pressure', act: 9, sequence: 170, preset: 'STOP_WORK',
    time: '14:48', zone: 'RESTART', label: '다시 시작해도 되는가', tone: 'decision',
    detail: '재개 지시와 실제 복구상태가 같은 시점에 닫혔는지 확인한다.',
    auto_advance_nodes: ['situation', 'kang', 'lee', 'junho'],
  },
  e01_08j_restart_return: {
    event_id: 'e01_08j_restart_return', act: 9, sequence: 180, preset: 'STOP_WORK',
    time: '15:02', zone: 'RESTART', label: '재개의 결과', tone: 'consequence',
    detail: '재개는 말이 아니라 난간·동선·감시·최종 확인자가 실제로 맞았는지로 검증된다.',
    auto_advance_nodes: ['premature', 'distorted', 'controlled'],
  },
  e01_08k_stopwork_aftershock: {
    event_id: 'e01_08k_stopwork_aftershock', act: 10, sequence: 190, preset: 'FIELD',
    time: '15:20', zone: 'BREAK AREA', label: '멈춘 뒤에 남는 분위기', tone: 'pressure',
    detail: '기술적 조치가 끝나도 누가 문제를 제기했는지에 대한 기억은 사람 사이에 남는다.',
    auto_advance_nodes: ['situation', 'kang', 'junho', 'lee'],
  },
  e01_08l_stopwork_return: {
    event_id: 'e01_08l_stopwork_return', act: 10, sequence: 200, preset: 'FIELD',
    time: '15:38', zone: 'WORKFACE', label: '다음 보고', tone: 'consequence',
    detail: '다음 이상신호에서 작업자가 무전을 드는지 내려놓는지가 실제 보고문화를 보여준다.',
    auto_advance_nodes: ['silenced', 'cold', 'route'],
  },
  e01_08m_instruction_cascade: {
    event_id: 'e01_08m_instruction_cascade', act: 11, sequence: 210, preset: 'FIELD',
    time: '16:05', zone: 'WORKFACE', label: '말이 내려갈수록 짧아진다', tone: 'signal',
    detail: '원지시가 정확해도 마지막 작업자에게 조건이 도착하지 않았다면 통제는 완성되지 않는다.',
    auto_advance_nodes: ['situation', 'lee', 'kang', 'junho'],
  },
  e01_08n_instruction_return: {
    event_id: 'e01_08n_instruction_return', act: 11, sequence: 220, preset: 'OFFICE',
    time: '16:24', zone: 'RECORD', label: '사라진 조건을 찾는다', tone: 'consequence',
    detail: '누가 틀렸는지보다 각 단계가 실제로 들은 말을 맞춰 조건이 사라진 지점을 찾는다.',
    auto_advance_nodes: ['gap', 'chilled', 'reconstructed'],
  },
  e01_08o_record_pressure: {
    event_id: 'e01_08o_record_pressure', act: 12, sequence: 230, preset: 'OFFICE',
    time: '16:42', zone: 'SITE OFFICE', label: '무엇을 기록할 것인가', tone: 'decision',
    detail: '빠른 보고, 문서 일관성, 시간순 사실 사이에서 오늘 밤에도 설명 가능한 기록을 선택한다.',
    auto_advance_nodes: ['situation', 'oh', 'lee', 'kang'],
  },
  e01_08p_record_return: {
    event_id: 'e01_08p_record_return', act: 12, sequence: 240, preset: 'OFFICE',
    time: '17:08', zone: 'REPORT', label: '기록이 되돌아온다', tone: 'consequence',
    detail: '사진·통화·TBM 시각을 함께 열면 기록 방식의 장단점이 바로 드러난다.',
    auto_advance_nodes: ['correction', 'conflict', 'preserved'],
  },
  e01_09_evening: {
    event_id: 'e01_09_evening', act: 13, sequence: 250, preset: 'DAY_RESULT',
    time: '17:18', zone: 'SUNSET', label: '오늘의 결과', tone: 'release',
    detail: '정답표가 아니라 오늘의 선택이 사람·보고·기록에 남긴 흔적을 돌아본다.',
    auto_advance_nodes: ['rest', 'family', 'study', 'field_note'],
  },
  e01_10_next_day_tease: {
    event_id: 'e01_10_next_day_tease', act: 14, sequence: 260, preset: 'DAY_RESULT',
    time: '06:52', zone: 'DAY 02', label: '내일의 변수', tone: 'arrival',
    detail: '같은 현장도 날씨·자재·사람의 반응이 달라지면 다시 읽어야 한다.',
    auto_advance_nodes: [],
  },
});

export const EPISODE01_MEANINGFUL_DECISION_COUNT = 12;

export function episode01StoryDirector(eventId: string | null | undefined): Episode01DirectorBeat | undefined {
  return eventId ? BEATS[eventId] : undefined;
}

export function episode01AutoAdvanceDelay(
  eventId: string | null | undefined,
  nodeId: string | null | undefined,
  textLength: number,
): number | undefined {
  if (!eventId || !nodeId) return undefined;
  const beat = BEATS[eventId];
  if (!beat?.auto_advance_nodes.includes(nodeId)) return undefined;
  return Math.max(4200, Math.min(9000, 1800 + Math.max(0, textLength) * 72));
}

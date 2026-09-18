export type EpisodeCinematicTone = 'arrival' | 'pressure' | 'signal' | 'decision' | 'consequence' | 'release';

export interface EpisodeCinematicBeat {
  readonly time: string;
  readonly zone: string;
  readonly label: string;
  readonly tone: EpisodeCinematicTone;
  readonly detail?: string;
}

const BEATS: Readonly<Record<string, EpisodeCinematicBeat>> = Object.freeze({
  e01_01_arrival: { time: '06:47', zone: 'GATE', label: '첫 출근', tone: 'arrival', detail: '세 채널의 무전이 사람보다 먼저 하루를 시작한다' },
  e01_02_meet_kang: { time: '07:02', zone: 'FOUNDATION', label: '현장의 첫 얼굴', tone: 'arrival', detail: '첫 관계가 다음 보고의 온도를 만든다' },
  e01_03_plan_breaks: { time: '07:18', zone: 'ENTRY', label: '세 일이 동시에 겹친다', tone: 'pressure', detail: '답하지 않은 3분도 현장에서는 하나의 선택이다' },
  e01_04_junho_signal: { time: '07:21', zone: 'RAMP', label: '작은 신호', tone: 'signal', detail: '확실하지 않은 말도 사고 전 신호일 수 있다' },
  e01_05_command: { time: '07:27', zone: 'WORKFACE', label: '확인과 통제를 동시에', tone: 'decision', detail: '한 곳을 직접 보면 다른 한 곳은 누군가에게 맡겨진다' },
  e01_06_pump_arrival: { time: '07:36', zone: 'GATE', label: '판단의 결과가 돌아온다', tone: 'consequence', detail: '앞선 선택들이 차량 한 대 앞에서 동시에 만난다' },
  e01_07_first_pour: { time: '07:48', zone: 'POUR', label: '첫 타설', tone: 'release', detail: '작업 시작은 안전 판단의 끝이 아니라 다음 상태의 시작이다' },
  e01_08_reactions: { time: '08:12 → 09:58', zone: 'POUR · CLEANUP', label: '현장은 멈추지 않는다', tone: 'consequence', detail: '아침의 선택이 작업속도·대화·다음 보고 방식으로 남는다' },
  e01_08a_reporting_return: { time: '10:07', zone: 'WORKFACE', label: '말했던 사람은 다시 말할까', tone: 'signal', detail: '보고를 받아준 방식이 다음 신호의 크기를 바꾼다' },
  e01_08b_inspection_find: { time: '10:16', zone: 'INSPECTION', label: '조치와 공정이 충돌한다', tone: 'pressure', detail: '현재 상태를 고르는 순간 동시에 지연·증거·협의 비용도 선택하게 된다' },
  e01_08c_site_pushback: { time: '10:24', zone: 'INSPECTION', label: '선택의 비용이 돌아온다', tone: 'consequence', detail: '조치가 끝나도 일정·표현·협의 의존성은 다른 형태로 현장에 남는다' },
  e01_08d_reinspection: { time: '10:39', zone: 'INSPECTION', label: '사진이 아니라 현장을 다시 본다', tone: 'consequence', detail: '설명보다 실제 상태가 앞선 선택의 의미를 다시 결정한다' },
  e01_08e_responsibility_clash: { time: '11:12', zone: 'SITE OFFICE', label: '누구 말이 맞나', tone: 'pressure', detail: '같은 현장을 본 세 사람의 말은 시각과 역할이 달라 서로 다른 사실처럼 들린다' },
  e01_08f_report_return: { time: '11:31', zone: 'REPORT', label: '기록이 말을 되돌린다', tone: 'consequence', detail: '보고서가 맞는지보다 무엇을 근거로 썼는지가 추가자료 앞에서 검증된다' },
  e01_08g_tbm_field_gap: { time: '13:42', zone: 'WORKFACE', label: '아침 TBM과 오후 작업', tone: 'signal', detail: '서명된 기준은 남아 있지만 작업순서가 바뀌면 실제 통제조건은 다시 말로 맞춰야 한다' },
  e01_08h_tbm_return: { time: '13:56', zone: 'WORKFACE', label: '서류 밖의 기준', tone: 'consequence', detail: '앞선 대응이 다음 변경작업에서 질문·보고·복구 행동으로 남았는지를 확인한다' },
  e01_08i_restart_pressure: { time: '14:03', zone: 'RESTART', label: '다시 시작해도 되는가', tone: 'decision', detail: '재개 지시의 출처와 실제 복구상태가 같은 시점에 닫혔는지 확인해야 한다' },
  e01_08j_restart_return: { time: '14:11', zone: 'RESTART', label: '재개의 조건이 남는다', tone: 'consequence', detail: '재개는 말이 아니라 난간·동선·감시자·최종 확인자가 실제로 맞았는지로 검증된다' },
  e01_08k_stopwork_aftershock: { time: '15:10', zone: 'BREAK AREA', label: '멈춘 뒤에 남는 분위기', tone: 'pressure', detail: '작업중지의 기술적 결과가 끝나도 누가 문제를 제기했는지에 대한 기억은 사람 사이에 남는다' },
  e01_08l_stopwork_return: { time: '15:32', zone: 'WORKFACE', label: '다음 보고가 결정된다', tone: 'consequence', detail: '다음 이상신호에서 작업자가 무전을 드는지 내려놓는지가 현장의 실제 보고경로를 보여준다' },
  e01_08m_instruction_cascade: { time: '16:05', zone: 'WORKFACE', label: '말이 내려갈수록 짧아진다', tone: 'signal', detail: '원지시가 법과 절차에 맞아도 마지막 작업자에게 조건이 도착하지 않았다면 현장 통제는 완성되지 않는다' },
  e01_08n_instruction_return: { time: '16:24', zone: 'RECORD', label: '사라진 조건을 찾는다', tone: 'consequence', detail: '누가 틀렸는지 단정하기 전에 각 단계가 실제로 들은 말을 맞추면 조건이 사라진 지점과 관계비용이 함께 보인다' },
  e01_08o_record_pressure: { time: '16:42', zone: 'SITE OFFICE', label: '오늘을 어떤 문장으로 남길 것인가', tone: 'decision', detail: '보고서는 현장을 정리하는 문서지만 당시 없던 사실을 뒤에서 만들어 넣는 순간 기록은 통제가 아니라 설명용 이야기가 된다' },
  e01_08p_record_return: { time: '17:08', zone: 'REPORT', label: '기록이 다시 질문한다', tone: 'consequence', detail: '사진·통화·TBM 시각을 함께 열면 문장보다 사실·판단·미확인이 어떻게 구분됐는지가 먼저 드러난다' },
  e01_09_evening: { time: '20:41', zone: 'HOME', label: '현장이 끝난 뒤 남는 것', tone: 'release', detail: '하루를 정답표로 닫지 않고 기록·사람·보고습관과 내가 회복하는 방식을 내일의 출발조건으로 남긴다' },
  e01_10_next_day_tease: { time: '06:52', zone: 'GATE · DAY 02', label: '어제의 선택이 오늘의 조건이 된다', tone: 'arrival', detail: '같은 게이트로 들어와도 누가 먼저 말하고 무엇을 다시 확인하는지는 어제 남긴 관계·기록·회복방식에 따라 달라진다' },
});

export function episodeCinematicBeat(eventId: string | null | undefined): EpisodeCinematicBeat | undefined {
  return eventId ? BEATS[eventId] : undefined;
}

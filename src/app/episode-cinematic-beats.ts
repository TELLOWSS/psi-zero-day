export type EpisodeCinematicTone = 'arrival' | 'pressure' | 'signal' | 'decision' | 'consequence' | 'release';

export interface EpisodeCinematicBeat {
  readonly time: string;
  readonly zone: string;
  readonly label: string;
  readonly tone: EpisodeCinematicTone;
}

const BEATS: Readonly<Record<string, EpisodeCinematicBeat>> = Object.freeze({
  e01_01_arrival: { time: '06:47', zone: 'GATE', label: '첫 출근', tone: 'arrival' },
  e01_02_meet_kang: { time: '07:02', zone: 'FOUNDATION', label: '현장의 첫 얼굴', tone: 'arrival' },
  e01_03_plan_breaks: { time: '07:18', zone: 'ENTRY', label: '세 일이 동시에 겹친다', tone: 'pressure' },
  e01_04_junho_signal: { time: '07:21', zone: 'RAMP', label: '작은 신호', tone: 'signal' },
  e01_05_command: { time: '07:27', zone: 'WORKFACE', label: '확인과 통제를 동시에', tone: 'decision' },
  e01_06_pump_arrival: { time: '07:36', zone: 'GATE', label: '판단의 결과가 돌아온다', tone: 'consequence' },
  e01_07_first_pour: { time: '07:48', zone: 'POUR', label: '첫 타설', tone: 'release' },
  e01_08b_inspection_find: { time: '10:16', zone: 'INSPECTION', label: '조치와 공정이 충돌한다', tone: 'pressure' },
  e01_08c_site_pushback: { time: '10:24', zone: 'INSPECTION', label: '선택의 비용이 돌아온다', tone: 'consequence' },
  e01_08d_reinspection: { time: '10:39', zone: 'INSPECTION', label: '사진이 아니라 현장을 다시 본다', tone: 'consequence' },
  e01_08e_responsibility_clash: { time: '11:12', zone: 'SITE OFFICE', label: '누구 말이 맞나', tone: 'pressure' },
  e01_08f_report_return: { time: '11:31', zone: 'REPORT', label: '기록이 말을 되돌린다', tone: 'consequence' },
  e01_08g_tbm_field_gap: { time: '13:42', zone: 'WORKFACE', label: '아침 TBM과 오후 작업', tone: 'signal' },
  e01_08h_tbm_return: { time: '13:56', zone: 'WORKFACE', label: '서류 밖의 기준', tone: 'consequence' },
  e01_08i_restart_pressure: { time: '14:03', zone: 'RESTART', label: '다시 시작해도 되는가', tone: 'decision' },
  e01_08j_restart_return: { time: '14:11', zone: 'RESTART', label: '재개의 조건이 남는다', tone: 'consequence' },
  e01_08k_stopwork_aftershock: { time: '15:10', zone: 'BREAK AREA', label: '멈춘 뒤에 남는 분위기', tone: 'pressure' },
  e01_08l_stopwork_return: { time: '15:32', zone: 'WORKFACE', label: '다음 보고가 결정된다', tone: 'consequence' },
  e01_08m_instruction_cascade: { time: '16:05', zone: 'WORKFACE', label: '말이 내려갈수록 짧아진다', tone: 'signal' },
  e01_08n_instruction_return: { time: '16:24', zone: 'RECORD', label: '사라진 조건을 찾는다', tone: 'consequence' },
  e01_08o_record_pressure: { time: '16:42', zone: 'SITE OFFICE', label: '오늘을 어떤 문장으로 남길 것인가', tone: 'decision' },
  e01_08p_record_return: { time: '17:08', zone: 'REPORT', label: '기록이 다시 질문한다', tone: 'consequence' },
});

export function episodeCinematicBeat(eventId: string | null | undefined): EpisodeCinematicBeat | undefined {
  return eventId ? BEATS[eventId] : undefined;
}

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
});

export function episodeCinematicBeat(eventId: string | null | undefined): EpisodeCinematicBeat | undefined {
  return eventId ? BEATS[eventId] : undefined;
}

/**
 * EP01 Audio Director v2, pass A.
 *
 * These are authored transition/room-tone intentions using EXISTING audio.
 * Score motifs are editorial placeholders only, never fake playback paths.
 * Business rules, event order, narration masters and saved state stay untouched.
 */
export type EpisodeScoreMotif =
  | 'SC_01_DAWN_PROMISE'
  | 'SC_02_WORK_PULSE'
  | 'SC_03_UNSAID_SIGNAL'
  | 'SC_04_SEVEN_MINUTES'
  | 'SC_05_ZERO_MOMENT'
  | 'SC_06_AFTER_THE_STOP'
  | 'SC_07_FACT_AND_MEMORY'
  | 'SC_08_TODAY_RETURN_HOME';

export interface EpisodeAudioDirection {
  readonly act: 'I'|'II'|'III'|'IV'|'V'|'EPILOGUE';
  readonly motif: EpisodeScoreMotif;
  readonly sceneFadeMs: number;
  readonly scoreFadeMs: number;
  /** Multiplies room tone only, not dialogue, authored event effect or BGM. */
  readonly roomToneScale: number;
  readonly editorialNote: string;
}

const cue = (
  act: EpisodeAudioDirection['act'],
  motif: EpisodeScoreMotif,
  sceneFadeMs: number,
  scoreFadeMs: number,
  roomToneScale: number,
  editorialNote: string,
): EpisodeAudioDirection => Object.freeze({ act, motif, sceneFadeMs, scoreFadeMs, roomToneScale, editorialNote });

const DIR: Readonly<Record<string, EpisodeAudioDirection>> = Object.freeze({
  e01_01_arrival: cue('I','SC_01_DAWN_PROMISE',1200,2300,1,'Gate air starts before the first face; dawn piano score remains unproduced.'),
  e01_02_meet_kang: cue('I','SC_01_DAWN_PROMISE',1400,2300,0.85,'Preserve Kang voice intelligibility; no ominous introduction.'),
  e01_03_plan_breaks: cue('I','SC_02_WORK_PULSE',1300,2100,1,'Three work rhythms diverge; player still chooses manually.'),
  e01_04_junho_signal: cue('II','SC_03_UNSAID_SIGNAL',1450,2600,0.68,'Make room for quiet reporting and existing Junho VO.'),
  e01_05_command: cue('II','SC_04_SEVEN_MINUTES',1100,1800,0.85,'Seven-minute pressure stays matter-of-fact, not villain scoring.'),
  e01_06_pump_arrival: cue('II','SC_02_WORK_PULSE',1000,1900,0.9,'Pump enters as one-shot; its engine must not become a loop.'),
  e01_07_first_pour: cue('III','SC_02_WORK_PULSE',1300,1900,1,'Concrete pulse establishes activity without triumphant release.'),
  e01_08_reactions: cue('III','SC_02_WORK_PULSE',1550,2200,0.9,'Carry physical hose ambience across the cut.'),
  e01_08a_reporting_return: cue('III','SC_03_UNSAID_SIGNAL',1400,2100,0.75,'Old report changes who speaks again.'),
  e01_08b_inspection_find: cue('III','SC_05_ZERO_MOMENT',1150,2300,0.78,'Inspection tightens perspective without artificial impact.'),
  e01_08c_site_pushback: cue('III','SC_05_ZERO_MOMENT',850,2100,0.38,'Zero Moment: lower workface room tone but do not mistake a playback fault for authored silence.'),
  e01_08d_reinspection: cue('III','SC_06_AFTER_THE_STOP',1650,2500,0.72,'Physical correction and reinspection restore believable air.'),
  e01_08e_responsibility_clash: cue('IV','SC_07_FACT_AND_MEMORY',1600,2500,0.68,'Outside workface to quieter office, overlapping tail.'),
  e01_08f_report_return: cue('IV','SC_07_FACT_AND_MEMORY',1100,2000,0.62,'Report rejection creates space for unanswered facts.'),
  e01_08g_tbm_field_gap: cue('IV','SC_03_UNSAID_SIGNAL',1550,2200,0.76,'Morning safety cue returns as a changed question, not a repeat sample.'),
  e01_08h_tbm_return: cue('IV','SC_06_AFTER_THE_STOP',1150,2250,0.82,'Workers hear the corrected briefing; no score payoff.'),
  e01_08i_restart_pressure: cue('IV','SC_04_SEVEN_MINUTES',1200,1750,0.76,'Schedule pressure returns without countdown alarm.'),
  e01_08j_restart_return: cue('IV','SC_06_AFTER_THE_STOP',1300,2400,0.8,'The resumed site must sound physically believable.'),
  e01_08k_stopwork_aftershock: cue('IV','SC_06_AFTER_THE_STOP',1700,2700,0.58,'Silence-drop remains a single effect, not a permanent silent bed.'),
  e01_08l_stopwork_return: cue('IV','SC_03_UNSAID_SIGNAL',1300,2250,0.77,'Leave audible space before the next report.'),
  e01_08m_instruction_cascade: cue('V','SC_03_UNSAID_SIGNAL',1250,2000,0.77,'Speech loses information; do not make intelligibility depend on sound only.'),
  e01_08n_instruction_return: cue('V','SC_07_FACT_AND_MEMORY',1500,2200,0.64,'Office evidence narrows attention.'),
  e01_08o_record_pressure: cue('V','SC_07_FACT_AND_MEMORY',1200,2400,0.58,'Reviewed Oh voice remains foregrounded.'),
  e01_08p_record_return: cue('V','SC_07_FACT_AND_MEMORY',1300,2350,0.57,'Let factual verification breathe.'),
  e01_09_evening: cue('EPILOGUE','SC_08_TODAY_RETURN_HOME',1800,3200,0.63,'Home tone enters slowly; dawn-theme reprise needs original music production.'),
  e01_10_next_day_tease: cue('EPILOGUE','SC_01_DAWN_PROMISE',1650,2800,0.86,'Morning gate returns, but someone may speak first.'),
});

export const EP01_DIRECTED_AUDIO_EVENT_COUNT = 26;
export function episodeAudioDirection(eventId: string | null | undefined): EpisodeAudioDirection | undefined {
  return eventId ? DIR[eventId] : undefined;
}
export function episodeAudioDirectedEventIds(): readonly string[] {
  return Object.keys(DIR);
}

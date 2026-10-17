import {episodeCinematicBeat} from './episode-cinematic-beats';
/** Read-only legacy presentation cues follow the same scene clock as the novel. */
export const STORY_LEGACY_TIME_EVENTS:Readonly<Record<string,string>>={
  "10:39": "e01_08d_reinspection",
  "11:12": "e01_08e_responsibility_clash",
  "11:31": "e01_08f_report_return",
  "13:42": "e01_08g_tbm_field_gap",
  "13:56": "e01_08h_tbm_return",
  "14:03": "e01_08i_restart_pressure",
  "14:11": "e01_08j_restart_return",
  "15:10": "e01_08k_stopwork_aftershock",
  "15:32": "e01_08l_stopwork_return",
  "20:41": "e01_09_evening"
};
export function storyPresentationTime(time:string):string {return episodeCinematicBeat(STORY_LEGACY_TIME_EVENTS[time])?.time??time;}

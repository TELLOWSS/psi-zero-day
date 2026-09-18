import plan from '../../content/episode01/immersive-scenes.json';

export type ImmersiveSceneTone = 'neutral' | 'decision' | 'pressure' | 'resolved' | 'reflective';

export interface ImmersiveScenePlan {
  readonly event_id: string;
  readonly background_uri: string;
  readonly cast: readonly string[];
  readonly prop_uris: readonly string[];
  readonly camera: 'wide' | 'medium' | 'tight';
  readonly focus: 'left' | 'center' | 'right';
  readonly tone: ImmersiveSceneTone;
  readonly node_id?: string;
}

type SceneRecord = {
  readonly bg: string;
  readonly cast: readonly string[];
  readonly props: readonly string[];
  readonly camera: 'wide' | 'medium' | 'tight';
  readonly focus: 'left' | 'center' | 'right';
};

const scenes = plan.events as Readonly<Record<string, SceneRecord>>;

const pressurePattern = /(near_miss|conflict|reject|premature|silenced|blame|missed|suppressed|low|force_clear|keep_schedule|worker_blame|ignore_social|gap|chilled|correction|defensive|quick_photo)/i;
const resolvedPattern = /(best_control|controlled|sequence|timeline|preserved|reinforced|listen_more|crosscheck|reconstruct|protect_process|reporting_route|verify_controls|change_control|assign_crew|request_delay|full_stop|accepted)/i;
const reflectivePattern = /(evening|rest|family|study|field_note|tease)/i;

export function episode01ImmersiveScene(
  eventId: string | null | undefined,
  nodeId: string | null | undefined,
  presentationType: string | null | undefined,
  speakerId?: string | null,
): ImmersiveScenePlan | undefined {
  if (!eventId) return undefined;
  const scene = scenes[eventId];
  if (!scene) return undefined;

  const key = nodeId ?? '';
  let tone: ImmersiveSceneTone = 'neutral';
  if (reflectivePattern.test(key) || eventId === 'e01_09_evening' || eventId === 'e01_10_next_day_tease') tone = 'reflective';
  else if (presentationType === 'SHOW_CHOICE') tone = 'decision';
  else if (pressurePattern.test(key)) tone = 'pressure';
  else if (resolvedPattern.test(key)) tone = 'resolved';

  const cast = [...scene.cast];
  if (speakerId && !cast.includes(speakerId)) cast.push(speakerId);

  return Object.freeze({
    event_id: eventId,
    background_uri: scene.bg,
    cast: Object.freeze(cast.slice(0, 5)),
    prop_uris: Object.freeze([...scene.props]),
    camera: scene.camera,
    focus: scene.focus,
    tone,
    ...(nodeId ? { node_id: nodeId } : {}),
  });
}

export const episode01ImmersiveSceneCount = Object.keys(scenes).length;

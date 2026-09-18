import plan from '../../content/episode01/immersive-scenes.json';

export type ImmersiveSceneTone = 'neutral' | 'decision' | 'pressure' | 'resolved' | 'reflective';

export type ImmersiveSceneShot = 'establishing' | 'dialogue' | 'decision' | 'result-pressure' | 'result-resolved' | 'result-neutral' | 'reflection';

export interface ImmersiveScenePlan {
  readonly event_id: string;
  readonly background_uri: string;
  readonly cast: readonly string[];
  readonly prop_uris: readonly string[];
  readonly camera: 'wide' | 'medium' | 'tight';
  readonly focus: 'left' | 'center' | 'right';
  readonly tone: ImmersiveSceneTone;
  readonly shot: ImmersiveSceneShot;
  readonly subject_character_id?: string;
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

function speakerFocus(cast: readonly string[], speakerId: string | null | undefined, fallback: 'left' | 'center' | 'right') {
  if (!speakerId) return fallback;
  const index = cast.indexOf(speakerId);
  if (index < 0) return fallback;
  if (index === 4) return 'center' as const;
  if (index <= 1) return 'left' as const;
  return 'right' as const;
}

function shotFor(
  presentationType: string | null | undefined,
  tone: ImmersiveSceneTone,
  speakerId: string | null | undefined,
): ImmersiveSceneShot {
  if (tone === 'reflective') return 'reflection';
  if (presentationType === 'SHOW_CHOICE') return 'decision';
  if (presentationType === 'SHOW_RESULT') {
    if (tone === 'pressure') return 'result-pressure';
    if (tone === 'resolved') return 'result-resolved';
    return 'result-neutral';
  }
  if (speakerId) return 'dialogue';
  return 'establishing';
}

function cameraFor(
  shot: ImmersiveSceneShot,
  base: 'wide' | 'medium' | 'tight',
  castSize: number,
): 'wide' | 'medium' | 'tight' {
  if (shot === 'reflection' || shot === 'result-resolved') return 'wide';
  if (shot === 'result-pressure') return 'tight';
  if (shot === 'decision') return 'medium';
  if (shot === 'dialogue') return castSize <= 2 ? 'tight' : 'medium';
  return base;
}

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
  const visibleCast = cast.slice(0, 5);
  const shot = shotFor(presentationType, tone, speakerId);
  const focus = speakerFocus(visibleCast, speakerId, scene.focus);
  const camera = cameraFor(shot, scene.camera, visibleCast.length);

  return Object.freeze({
    event_id: eventId,
    background_uri: scene.bg,
    cast: Object.freeze(visibleCast),
    prop_uris: Object.freeze([...scene.props]),
    camera,
    focus,
    tone,
    shot,
    ...(speakerId ? { subject_character_id: speakerId } : {}),
    ...(nodeId ? { node_id: nodeId } : {}),
  });
}

export const episode01ImmersiveSceneCount = Object.keys(scenes).length;

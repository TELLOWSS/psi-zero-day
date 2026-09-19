import plan from '../../content/episode01/immersive-scenes.json';
import { episode01ChoiceVisual, type Episode01ChoiceVisualTone } from './episode01-choice-visual';

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
  readonly preview_choice_id?: string;
  readonly preview_choice_tone?: Episode01ChoiceVisualTone;
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
  previewChoiceId?: string | null,
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
  const choicePreview = presentationType === 'SHOW_CHOICE' && previewChoiceId
    ? episode01ChoiceVisual(eventId, previewChoiceId)
    : undefined;
  const shot = shotFor(presentationType, tone, speakerId);
  const baseFocus = speakerFocus(visibleCast, speakerId, scene.focus);
  const focus = choicePreview?.crop ?? baseFocus;
  const baseCamera = cameraFor(shot, scene.camera, visibleCast.length);
  const camera = choicePreview
    ? choicePreview.tone === 'evidence' ? 'tight'
      : choicePreview.tone === 'recovery' ? 'wide'
      : 'medium'
    : baseCamera;
  const propUris = choicePreview?.prop_uri
    ? [choicePreview.prop_uri, ...scene.props.filter(uri => uri !== choicePreview.prop_uri)]
    : [...scene.props];

  return Object.freeze({
    event_id: eventId,
    background_uri: scene.bg,
    cast: Object.freeze(visibleCast),
    prop_uris: Object.freeze(propUris),
    camera,
    focus,
    tone,
    shot,
    ...(speakerId ? { subject_character_id: speakerId } : {}),
    ...(nodeId ? { node_id: nodeId } : {}),
    ...(choicePreview && previewChoiceId ? {
      preview_choice_id: previewChoiceId,
      preview_choice_tone: choicePreview.tone,
    } : {}),
  });
}

export const episode01ImmersiveSceneCount = Object.keys(scenes).length;

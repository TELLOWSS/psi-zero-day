import plan from '../../content/episode01/immersive-scenes.json';
import nodeDirectionA from '../../content/episode01/node-visual-direction-a.json';
import nodeDirectionB from '../../content/episode01/node-visual-direction-b.json';
import sceneBackgroundCatalog from '../../content/episode01/scene-background-catalog.json';
import { episode01ChoiceVisual, type Episode01ChoiceVisualTone } from './episode01-choice-visual';
import { episode01CharacterBlocking } from './episode01-character-blocking';

export type ImmersiveSceneTone = 'neutral' | 'decision' | 'pressure' | 'resolved' | 'reflective';

export type ImmersiveSceneShot = 'establishing' | 'dialogue' | 'decision' | 'result-pressure' | 'result-resolved' | 'result-neutral' | 'reflection';

export interface ImmersiveScenePlan {
  readonly event_id: string;
  readonly background_uri: string;
  readonly background_asset_id?: string;
  readonly background_environment?: string;
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
  readonly authored_node_direction: boolean;
}

type SceneRecord = {
  readonly bg: string;
  readonly cast: readonly string[];
  readonly props: readonly string[];
  readonly camera: 'wide' | 'medium' | 'tight';
  readonly focus: 'left' | 'center' | 'right';
};

type NodeDirectionRecord = {
  readonly camera: 'wide' | 'medium' | 'tight';
  readonly focus: 'left' | 'center' | 'right';
  readonly tone: ImmersiveSceneTone;
  readonly shot: ImmersiveSceneShot;
  readonly subject_character_id?: string;
};

const scenes = plan.events as Readonly<Record<string, SceneRecord>>;
const sceneBackgroundByRc = Object.freeze(Object.fromEntries(
  Object.entries(sceneBackgroundCatalog.backgrounds).map(([key, background]) => [
    background.rc_path,
    { key, asset_id: background.asset_id },
  ]),
) as Readonly<Record<string, { readonly key: string; readonly asset_id: string }>>);

const nodeDirections = Object.freeze({
  ...(nodeDirectionA.events as Readonly<Record<string, Readonly<Record<string, NodeDirectionRecord>>>>),
  ...(nodeDirectionB.events as Readonly<Record<string, Readonly<Record<string, NodeDirectionRecord>>>>),
});

const pressurePattern = /(?:^|[._-])(near_miss|conflict|reject|premature|silenced|blame|missed|suppressed|low|force_clear|keep_schedule|worker_blame|ignore_social|gap|chilled|defensive|one_sided|distorted|cold|dismiss)(?:$|[._-])/i;
const resolvedPattern = /(?:^|[._-])(best_control|controlled|sequence|timeline|preserved|reinforced|listen_more|crosscheck|reconstruct|reconstructed|protect_process|reporting_route|verify_controls|change_control|request_delay|full_stop|accept_full|evidence|route)(?:$|[._-])/i;
const reflectivePattern = /(?:^|[._-])(evening|rest|family|study|field_note|tease)(?:$|[._-])/i;

function speakerFocus(cast: readonly string[], speakerId: string | null | undefined, fallback: 'left' | 'center' | 'right') {
  if (!speakerId) return fallback;
  const index = cast.indexOf(speakerId);
  if (index < 0) return fallback;
  if (index === 4) return 'center' as const;
  if (index <= 1) return 'left' as const;
  return 'right' as const;
}

function blockingFocus(side: 'far-left' | 'left' | 'center' | 'right' | 'far-right'): 'left' | 'center' | 'right' {
  if (side === 'center') return 'center';
  return side === 'far-left' || side === 'left' ? 'left' : 'right';
}

function fallbackShotFor(
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

function fallbackCameraFor(
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
  const nodeDirective = nodeId ? nodeDirections[eventId]?.[nodeId] : undefined;
  const backgroundPlan = sceneBackgroundByRc[scene.bg];

  let fallbackTone: ImmersiveSceneTone = 'neutral';
  if (reflectivePattern.test(key) || eventId === 'e01_09_evening' || eventId === 'e01_10_next_day_tease') fallbackTone = 'reflective';
  else if (presentationType === 'SHOW_CHOICE') fallbackTone = 'decision';
  else if (pressurePattern.test(key)) fallbackTone = 'pressure';
  else if (resolvedPattern.test(key)) fallbackTone = 'resolved';

  const tone = nodeDirective?.tone ?? fallbackTone;
  const directedSubject = speakerId ?? nodeDirective?.subject_character_id;

  const cast = [...scene.cast];
  if (directedSubject && !cast.includes(directedSubject)) cast.push(directedSubject);
  const visibleCast = cast.slice(0, 5);

  const choicePreview = presentationType === 'SHOW_CHOICE' && previewChoiceId
    ? episode01ChoiceVisual(eventId, previewChoiceId)
    : undefined;

  const shot = nodeDirective?.shot ?? fallbackShotFor(presentationType, tone, directedSubject);
  const subjectBlocking = directedSubject
    ? episode01CharacterBlocking(eventId, directedSubject, directedSubject, undefined, nodeId)
    : undefined;
  const directedBlockingFocus = shot === 'dialogue' && subjectBlocking
    ? blockingFocus(subjectBlocking.side)
    : undefined;
  const authoredFocus = directedBlockingFocus
    ?? nodeDirective?.focus
    ?? speakerFocus(visibleCast, directedSubject, scene.focus);
  const focus = choicePreview?.crop ?? authoredFocus;
  const fallbackCamera = fallbackCameraFor(shot, scene.camera, visibleCast.length);
  const camera = choicePreview
    ? choicePreview.tone === 'evidence' ? 'tight'
      : choicePreview.tone === 'recovery' ? 'wide'
      : 'medium'
    : nodeDirective?.camera ?? fallbackCamera;

  const propUris = choicePreview?.prop_uri
    ? [choicePreview.prop_uri, ...scene.props.filter(uri => uri !== choicePreview.prop_uri)]
    : [...scene.props];

  return Object.freeze({
    event_id: eventId,
    background_uri: scene.bg,
    ...(backgroundPlan ? { background_asset_id: backgroundPlan.asset_id, background_environment: backgroundPlan.key } : {}),
    cast: Object.freeze(visibleCast),
    prop_uris: Object.freeze(propUris),
    camera,
    focus,
    tone,
    shot,
    authored_node_direction: Boolean(nodeDirective),
    ...(directedSubject ? { subject_character_id: directedSubject } : {}),
    ...(nodeId ? { node_id: nodeId } : {}),
    ...(choicePreview && previewChoiceId ? {
      preview_choice_id: previewChoiceId,
      preview_choice_tone: choicePreview.tone,
    } : {}),
  });
}

export const episode01ImmersiveSceneCount = Object.keys(scenes).length;
export const episode01DirectedNodeCount = Object.values(nodeDirections)
  .reduce((total, event) => total + Object.keys(event).length, 0);

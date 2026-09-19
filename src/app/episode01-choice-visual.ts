import plan from '../../content/episode01/immersive-scenes.json';
import direction from '../../content/episode01/choice-visual-direction.json';
import sceneBackgroundCatalog from '../../content/episode01/scene-background-catalog.json';

export type Episode01ChoiceVisualTone = 'control' | 'pressure' | 'people' | 'evidence' | 'recovery';

export interface Episode01ChoiceVisual {
  readonly background_uri: string;
  readonly background_asset_id?: string;
  readonly prop_uri?: string;
  readonly tone: Episode01ChoiceVisualTone;
  readonly crop: 'left' | 'center' | 'right';
  readonly label_text_id: string;
  readonly authored: boolean;
}

type SceneRecord = {
  readonly bg: string;
  readonly props: readonly string[];
};

const scenes = plan.events as Readonly<Record<string, SceneRecord>>;

const sceneBackgroundAssetByRc = Object.freeze(Object.fromEntries(
  Object.values(sceneBackgroundCatalog.backgrounds).map(background => [
    background.rc_path,
    background.asset_id,
  ]),
) as Readonly<Record<string, string>>);

type DirectionRecord = {
  readonly tone: Episode01ChoiceVisualTone;
  readonly crop: 'left' | 'center' | 'right';
  readonly prop_index?: number;
};

const authoredDirections = direction.events as Readonly<Record<string, Readonly<Record<string, DirectionRecord>>>>;

function choiceTone(choiceId: string): Episode01ChoiceVisualTone {
  if (/(rest|family|study|field_note)/i.test(choiceId)) return 'recovery';
  if (/(report|record|photo|timeline|paper|retrofit|evidence)/i.test(choiceId)) return 'evidence';
  if (/(blame|dismiss|ignore|force|keep_schedule|follow_verbal|near_miss|conflict|suppressed|silenced)/i.test(choiceId)) return 'pressure';
  if (/(listen|negotiate|ask_|crosscheck|delegate|public_boundary|protect_process|relation)/i.test(choiceId)) return 'people';
  return 'control';
}

function labelId(tone: Episode01ChoiceVisualTone): string {
  return `ui.choice_visual.${tone}`;
}

function cropFor(choiceId: string): 'left' | 'center' | 'right' {
  let hash = 0;
  for (const char of choiceId) hash = (hash + char.charCodeAt(0)) % 3;
  return hash === 0 ? 'left' : hash === 1 ? 'center' : 'right';
}

export function episode01ChoiceVisual(
  eventId: string | null | undefined,
  choiceId: string,
): Episode01ChoiceVisual | undefined {
  if (!eventId) return undefined;
  const scene = scenes[eventId];
  if (!scene) return undefined;

  const authored = authoredDirections[eventId]?.[choiceId];
  const tone = authored?.tone ?? choiceTone(choiceId);
  const crop = authored?.crop ?? cropFor(choiceId);
  const propIndex = authored?.prop_index ?? (tone === 'pressure' ? 1 : 0);
  const propUri = scene.props[propIndex] ?? scene.props[0];

  const backgroundAssetId = sceneBackgroundAssetByRc[scene.bg];

  return Object.freeze({
    background_uri: scene.bg,
    ...(backgroundAssetId ? { background_asset_id: backgroundAssetId } : {}),
    ...(propUri ? { prop_uri: propUri } : {}),
    tone,
    crop,
    label_text_id: labelId(tone),
    authored: Boolean(authored),
  });
}

import type { AssetResolver } from '../app/episode-visual-assets';
import { characterMapUri } from '../app/episode-visual-assets';
import { episode01ImmersiveScene } from '../app/episode01-immersive-scene';
import { VisualImage } from './VisualSlot';

function stageTextId(presentationType: string | null | undefined, nodeId: string | null | undefined) {
  if (presentationType === 'SHOW_CHOICE') return 'ui.immersive.stage.decision';
  if (nodeId && /(result|high|low|reinforced|suppressed|missed|correction|evidence|timeline|paper|silenced|controlled|premature|distorted|cold|route|gap|chilled|reconstructed|preserved|rest|family|study|field_note)/i.test(nodeId)) {
    return 'ui.immersive.stage.consequence';
  }
  return 'ui.immersive.stage.dialogue';
}

export function EpisodeImmersiveScene({
  eventId,
  nodeId,
  speakerId,
  presentationType,
  previewChoiceId,
  eventTitle,
  time,
  zone,
  resolve,
  t,
}: {
  readonly eventId: string | null | undefined;
  readonly nodeId: string | null | undefined;
  readonly speakerId?: string | null;
  readonly presentationType?: string | null;
  readonly previewChoiceId?: string | null;
  readonly eventTitle: string;
  readonly time?: string;
  readonly zone?: string;
  readonly resolve: AssetResolver;
  readonly t: (id: string) => string;
}) {
  const scene = episode01ImmersiveScene(eventId, nodeId, presentationType, speakerId, previewChoiceId);
  if (!scene) return null;
  const resolvedBackground = scene.background_asset_id ? resolve(scene.background_asset_id) : undefined;
  const showEvidenceBoard = scene.event_id === 'e01_08e_responsibility_clash' || scene.event_id === 'e01_08f_report_return';

  return <figure
    className="episode-immersive-scene"
    data-camera={scene.camera}
    data-focus={scene.focus}
    data-tone={scene.tone}
    data-shot={scene.shot}
    data-has-speaker={Boolean(scene.subject_character_id) || undefined}
    data-subject={scene.subject_character_id ?? undefined}
    data-node={scene.node_id ?? undefined}
    data-preview-choice={scene.preview_choice_id ?? undefined}
    data-choice-tone={scene.preview_choice_tone ?? undefined}
    data-event={scene.event_id}
    data-environment={scene.background_environment ?? undefined}
    data-authored-node={scene.authored_node_direction || undefined}
    key={`${scene.event_id}:${scene.node_id ?? 'entry'}:${scene.tone}`}
  >
    <VisualImage uri={resolvedBackground ?? scene.background_uri} fallbackUri={resolvedBackground ? scene.background_uri : undefined} alt="" className="episode-immersive-background" />
    <div className="episode-immersive-atmosphere" aria-hidden="true" />
    {showEvidenceBoard ? <div className="episode-immersive-evidence-board" aria-hidden="true">
      <span className="evidence-sheet sheet-a" />
      <span className="evidence-sheet sheet-b" />
      <span className="evidence-sheet sheet-c" />
      <i className="evidence-pin pin-a" />
      <i className="evidence-pin pin-b" />
      <b className="evidence-timeline" />
    </div> : null}
    <div className="episode-immersive-props" aria-hidden="true">
      {scene.prop_uris.map((uri, index) => <VisualImage key={uri} uri={uri} alt="" className={`episode-immersive-prop prop-${index + 1}`} />)}
    </div>
    <div className="episode-immersive-cast" aria-hidden="true">
      {scene.cast.map((characterId, index) => <div
        key={characterId}
        className={`episode-immersive-character cast-${index + 1}`}
        data-speaker={speakerId === characterId || undefined}
        data-character={characterId}
      >
        <VisualImage uri={characterMapUri(characterId, resolve)} alt="" />
      </div>)}
    </div>
    <div className="episode-immersive-grade" aria-hidden="true" />
    <figcaption>
      <div><span>{time ?? 'EP01'}</span>{zone ? <b>{zone}</b> : null}<em>{t(stageTextId(presentationType, nodeId))}</em></div>
      <strong>{eventTitle}</strong>
      <small>{scene.preview_choice_tone
        ? `${t('ui.immersive.stage.decision')} · ${t(`ui.choice_visual.${scene.preview_choice_tone}`)}`
        : t(`ui.immersive.tone.${scene.tone}`)}</small>
    </figcaption>
  </figure>;
}

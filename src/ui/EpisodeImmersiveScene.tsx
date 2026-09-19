import type { AssetResolver } from '../app/episode-visual-assets';
import { characterMapUri } from '../app/episode-visual-assets';
import { episode01ImmersiveScene } from '../app/episode01-immersive-scene';
import { VisualImage } from './VisualSlot';

const EPISODE01_MEMORY_FRAMES = [
  { assetId: 'ep01.scene_bg.ramp_entry', fallback: 'assets/episode01/cg/ramp-entry-rc.svg' },
  { assetId: 'ep01.scene_bg.concrete_pour', fallback: 'assets/episode01/cg/concrete-pour-rc.svg' },
  { assetId: 'ep01.scene_bg.inspection_zone', fallback: 'assets/episode01/cg/inspection-zone-rc.svg' },
  { assetId: 'ep01.scene_bg.site_office', fallback: 'assets/episode01/cg/site-office-rc.svg' },
] as const;

export function episode01UsesMemoryStrip(eventId: string | null | undefined) {
  return eventId === 'e01_09_evening' || eventId === 'e01_10_next_day_tease';
}

export function episode01UsesEvidenceBoard(eventId: string | null | undefined) {
  return eventId === 'e01_08e_responsibility_clash'
    || eventId === 'e01_08f_report_return'
    || eventId === 'e01_08n_instruction_return'
    || eventId === 'e01_08o_record_pressure'
    || eventId === 'e01_08p_record_return';
}

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
  speakerIdentity,
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
  readonly speakerIdentity?: { readonly name: string; readonly role: string; readonly trade?: string };
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
  const showEvidenceBoard = episode01UsesEvidenceBoard(scene.event_id);
  const showMemoryStrip = episode01UsesMemoryStrip(scene.event_id);

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
    {showMemoryStrip ? <div className="episode-immersive-memory-strip" data-next-day={scene.event_id === 'e01_10_next_day_tease' || undefined} aria-hidden="true">
      {EPISODE01_MEMORY_FRAMES.map((frame, index) => <span key={frame.assetId} className={`memory-frame memory-${index + 1}`}>
        <VisualImage uri={resolve(frame.assetId) ?? frame.fallback} fallbackUri={frame.fallback} alt="" />
      </span>)}
    </div> : null}
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
    {speakerIdentity ? <div className="episode-immersive-speaker-tag" aria-hidden="true">
      <strong>{speakerIdentity.name}</strong>
      <span>{speakerIdentity.role}</span>
      {speakerIdentity.trade && speakerIdentity.trade !== speakerIdentity.role ? <em>{speakerIdentity.trade}</em> : null}
    </div> : null}
    <figcaption>
      <div><span>{time ?? 'EP01'}</span>{zone ? <b>{zone}</b> : null}<em>{t(stageTextId(presentationType, nodeId))}</em></div>
      <strong>{eventTitle}</strong>
      <small>{scene.preview_choice_tone
        ? `${t('ui.immersive.stage.decision')} · ${t(`ui.choice_visual.${scene.preview_choice_tone}`)}`
        : t(`ui.immersive.tone.${scene.tone}`)}</small>
    </figcaption>
  </figure>;
}

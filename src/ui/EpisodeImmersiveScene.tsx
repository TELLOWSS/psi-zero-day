import type { AssetResolver } from '../app/episode-visual-assets';
import { characterMapUri, episode01BackgroundUri } from '../app/episode-visual-assets';
import { episode01ImmersiveScene } from '../app/episode01-immersive-scene';
import { episode01CinematicTrace } from '../app/episode01-cinematic-trace';
import { episode01ImmersiveLocator } from '../app/episode01-immersive-locator';
import { useEpisode01ScenePreload } from './useEpisode01ScenePreload';
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

export type Episode01RelationshipSceneCue = 'closer' | 'strained';

export function episode01RelationshipSceneCue(delta: number): Episode01RelationshipSceneCue | undefined {
  if (delta > 0) return 'closer';
  if (delta < 0) return 'strained';
  return undefined;
}

export type Episode01MomentOverlay =
  | 'signal-trace'
  | 'schedule-cross'
  | 'pour-flow'
  | 'pump-approach'
  | 'near-miss'
  | 'inspection-frame'
  | 'stopwork-gap'
  | 'record-pressure'
  | 'tbm-gap'
  | 'restart-trace'
  | 'instruction-chain';

export function episode01MomentOverlay(eventId: string | null | undefined, nodeId: string | null | undefined): Episode01MomentOverlay | undefined {
  if (eventId === 'e01_03_plan_breaks') return 'schedule-cross';
  if (eventId === 'e01_04_junho_signal') return 'signal-trace';
  if (eventId === 'e01_06_pump_arrival') {
    return nodeId && /near[_-]?miss/i.test(nodeId) ? 'near-miss' : 'pump-approach';
  }
  if (eventId === 'e01_07_first_pour') return 'pour-flow';
  if (eventId === 'e01_08b_inspection_find' || eventId === 'e01_08c_site_pushback' || eventId === 'e01_08d_reinspection') {
    return 'inspection-frame';
  }
  if (eventId === 'e01_08g_tbm_field_gap' || eventId === 'e01_08h_tbm_return') return 'tbm-gap';
  if (eventId === 'e01_08i_restart_pressure' || eventId === 'e01_08j_restart_return') return 'restart-trace';
  if (eventId === 'e01_08k_stopwork_aftershock' || eventId === 'e01_08l_stopwork_return') return 'stopwork-gap';
  if (eventId === 'e01_08m_instruction_cascade' || eventId === 'e01_08n_instruction_return') return 'instruction-chain';
  if (eventId === 'e01_08o_record_pressure' || eventId === 'e01_08p_record_return') return 'record-pressure';
  return undefined;
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
  relationshipCues = [],
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
  readonly relationshipCues?: readonly { readonly character_id: string; readonly cue: Episode01RelationshipSceneCue }[];
  readonly presentationType?: string | null;
  readonly previewChoiceId?: string | null;
  readonly eventTitle: string;
  readonly time?: string;
  readonly zone?: string;
  readonly resolve: AssetResolver;
  readonly t: (id: string) => string;
}) {
  const scene = episode01ImmersiveScene(eventId, nodeId, presentationType, speakerId, previewChoiceId);
  useEpisode01ScenePreload(eventId, resolve);
  if (!scene) return null;
  const resolvedBackground = scene.background_asset_id ? resolve(scene.background_asset_id) : undefined;
  const showEvidenceBoard = episode01UsesEvidenceBoard(scene.event_id);
  const showMemoryStrip = episode01UsesMemoryStrip(scene.event_id);
  const momentOverlay = episode01MomentOverlay(scene.event_id, scene.node_id);
  const cinematicTrace = episode01CinematicTrace(scene.event_id, scene.node_id);
  const locator = episode01ImmersiveLocator(scene.event_id);
  const productionMapUri = locator ? episode01BackgroundUri(resolve) : undefined;

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
    data-psi-active={cinematicTrace?.active_kind ?? undefined}
    key={scene.background_asset_id ?? scene.background_uri}
  >
    <VisualImage uri={resolvedBackground ?? scene.background_uri} fallbackUri={resolvedBackground ? scene.background_uri : undefined} alt="" className="episode-immersive-background" />
    <div className="episode-immersive-atmosphere" aria-hidden="true" />
    {momentOverlay ? <div className="episode-immersive-moment-overlay" data-moment={momentOverlay} aria-hidden="true">
      <span className="moment-mark moment-a" />
      <span className="moment-mark moment-b" />
      <span className="moment-mark moment-c" />
      <i className="moment-axis" />
    </div> : null}
    {cinematicTrace ? <div className="episode-psi-field-markers" data-trace={cinematicTrace.trace_id} aria-hidden="true">
      {cinematicTrace.items.map(item => <span
        key={item.kind}
        data-kind={item.kind}
        data-active={item.kind === cinematicTrace.active_kind || undefined}
      />)}
    </div> : null}
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
    {cinematicTrace ? <aside
      className="episode-psi-trace"
      data-trace={cinematicTrace.trace_id}
      data-side={scene.focus === 'right' ? 'left' : 'right'}
      aria-label={t('ui.psi_trace.title')}
    >
      <strong><i aria-hidden="true" />{t('ui.psi_trace.title')}</strong>
      <div>
        {cinematicTrace.items.map(item => <span
          key={item.kind}
          data-kind={item.kind}
          data-active={item.kind === cinematicTrace.active_kind || undefined}
        >
          <b>{t(`ui.psi_trace.kind.${item.kind}`)}</b>
          <em>{t(item.label_text_id)}</em>
        </span>)}
      </div>
    </aside> : null}
    {locator ? <aside
      className="episode-scene-minimap"
      data-side={cinematicTrace ? (scene.focus === 'right' ? 'right' : 'left') : 'right'}
      data-anchor={locator.anchor}
      aria-label={t('ui.scene_minimap.title')}
    >
      <header><strong>{t('ui.scene_minimap.title')}</strong><span>{t(`ui.strategy.zone.${locator.anchor}`)}</span></header>
      <div>
        <VisualImage uri={productionMapUri} alt="" className="episode-scene-minimap-art" />
        <i className="episode-scene-minimap-marker" style={locator.marker_style} />
      </div>
    </aside> : null}
    <div className="episode-immersive-props" aria-hidden="true">
      {scene.prop_uris.map((uri, index) => <VisualImage key={uri} uri={uri} alt="" className={`episode-immersive-prop prop-${index + 1}`} />)}
    </div>
    <div className="episode-immersive-cast" aria-hidden="true">
      {scene.cast.map((characterId, index) => {
        const relationshipCue = relationshipCues.find(item => item.character_id === characterId)?.cue;
        return <div
        key={characterId}
        className={`episode-immersive-character cast-${index + 1}`}
        data-speaker={speakerId === characterId || undefined}
        data-character={characterId}
        data-relationship-cue={relationshipCue}
      >
        <VisualImage uri={characterMapUri(characterId, resolve)} alt="" />
      </div>;
      })}
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

import type { AssetResolver } from '../app/episode-visual-assets';
import { characterMapUri, episode01BackgroundUri } from '../app/episode-visual-assets';
import { episode01ImmersiveScene } from '../app/episode01-immersive-scene';
import { episode01CinematicTrace } from '../app/episode01-cinematic-trace';
import { episode01ImmersiveLocator } from '../app/episode01-immersive-locator';
import { episode01CharacterBlocking, episode01UsesCharacterBlocking } from '../app/episode01-character-blocking';
import { episode01CharacterPerformance, episode01UsesCharacterPerformance } from '../app/episode01-character-performance';
import { episode01CharacterPerformanceAsset } from '../app/episode01-character-performance-assets';
import { episode01StopWorkProduction } from '../app/episode01-stopwork-production';
import { episode01FieldProduction } from '../app/episode01-field-production';
import { episode01FieldVisualLock } from '../app/episode01-field-visual-lock';
import { episode01TbmProduction } from '../app/episode01-tbm-production';
import { episode01TbmVisualLock } from '../app/episode01-tbm-visual-lock';
import { episode01OfficeProduction } from '../app/episode01-office-production';
import type { Episode01MemoryVisualPlan } from '../app/episode01-memory-visuals';
import type { Episode01DayResultProduction } from '../app/episode01-day-result-production';
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
  memoryVisualPlan,
  dayResultProduction,
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
  readonly memoryVisualPlan?: Episode01MemoryVisualPlan;
  readonly dayResultProduction?: Episode01DayResultProduction;
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
  const stopWorkProduction = episode01StopWorkProduction(scene.event_id);
  const fieldProduction = episode01FieldProduction(scene.event_id, scene.node_id);
  const fieldVisualLock = episode01FieldVisualLock(scene.event_id, scene.node_id);
  const tbmProduction = episode01TbmProduction(scene.event_id, scene.node_id);
  const tbmVisualLock = episode01TbmVisualLock(scene.event_id, scene.node_id);
  const officeProduction = episode01OfficeProduction(scene.event_id, scene.node_id);

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
    data-background-source={resolvedBackground ? 'final' : 'rc-fallback'}
    data-authored-node={scene.authored_node_direction || undefined}
    data-psi-active={cinematicTrace?.active_kind ?? undefined}
    data-character-blocking={episode01UsesCharacterBlocking(scene.event_id) || undefined}
    data-character-performance={episode01UsesCharacterPerformance(scene.event_id) || undefined}
    data-has-trace={Boolean(cinematicTrace) || undefined}
    data-has-locator={Boolean(locator) || undefined}
    data-has-memory={showMemoryStrip || undefined}
    data-has-evidence={showEvidenceBoard || undefined}
    data-stopwork-phase={stopWorkProduction?.phase}
    data-stopwork-hero={stopWorkProduction?.hero_character_id}
    data-stopwork-camera={stopWorkProduction?.camera_profile}
    data-stopwork-depth={stopWorkProduction?.depth_profile}
    data-stopwork-lighting={stopWorkProduction?.lighting_profile}
    data-stopwork-ui={stopWorkProduction?.ui_profile}
    data-stopwork-cast={stopWorkProduction?.cast_profile}
    data-field-phase={fieldProduction?.phase}
    data-field-hero={fieldProduction?.hero_character_id}
    data-field-camera={fieldProduction?.camera_profile}
    data-field-depth={fieldProduction?.depth_profile}
    data-field-lighting={fieldProduction?.lighting_profile}
    data-field-ui={fieldProduction?.ui_profile}
    data-field-cast={fieldProduction?.cast_profile}
    data-field-visual-lock={fieldVisualLock?.lock_id}
    data-tbm-phase={tbmProduction?.phase}
    data-tbm-hero={tbmProduction?.hero_character_id}
    data-tbm-camera={tbmProduction?.camera_profile}
    data-tbm-depth={tbmProduction?.depth_profile}
    data-tbm-lighting={tbmProduction?.lighting_profile}
    data-tbm-ui={tbmProduction?.ui_profile}
    data-tbm-cast={tbmProduction?.cast_profile}
    data-tbm-visual-lock={tbmVisualLock?.lock_id}
    data-visual-rebaseline={fieldProduction || tbmProduction ? 'world-first-v1' : undefined}
    data-office-phase={officeProduction?.phase}
    data-office-hero={officeProduction?.hero_character_id}
    data-office-camera={officeProduction?.camera_profile}
    data-office-depth={officeProduction?.depth_profile}
    data-office-lighting={officeProduction?.lighting_profile}
    data-office-ui={officeProduction?.ui_profile}
    data-office-cast={officeProduction?.cast_profile}
    data-office-evidence={officeProduction?.evidence_focus}
    data-dayresult-phase={dayResultProduction?.phase}
    data-dayresult-camera={dayResultProduction?.camera_profile}
    data-dayresult-depth={dayResultProduction?.depth_profile}
    data-dayresult-lighting={dayResultProduction?.lighting_profile}
    data-dayresult-ui={dayResultProduction?.ui_profile}
    data-dayresult-carryover={dayResultProduction?.carryover_key}
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
    {showMemoryStrip ? <div
      className="episode-immersive-memory-strip"
      data-next-day={scene.event_id === 'e01_10_next_day_tease' || undefined}
      data-memory-phase={memoryVisualPlan?.phase}
      data-carryover={memoryVisualPlan?.carryover_key}
      aria-hidden="true"
    >
      {(memoryVisualPlan?.frames ?? EPISODE01_MEMORY_FRAMES.map(frame => ({
        key: frame.assetId,
        asset_id: frame.assetId,
        fallback_uri: frame.fallback,
        primary: false,
      }))).map((frame, index) => <span
        key={frame.asset_id}
        className={`memory-frame memory-${index + 1}`}
        data-memory-key={frame.key}
        data-primary={frame.primary || undefined}
      >
        <VisualImage uri={resolve(frame.asset_id) ?? frame.fallback_uri} fallbackUri={frame.fallback_uri} alt="" />
      </span>)}
      {scene.event_id === 'e01_10_next_day_tease' ? <i className="episode-daybreak-threshold" /> : null}
    </div> : null}
    {dayResultProduction ? <section
      className="day-result-production-layer"
      data-phase={dayResultProduction.phase}
      data-carryover={dayResultProduction.carryover_key}
      aria-label={t(dayResultProduction.title_text_id)}
    >
      <header className="day-result-production-title">
        <span>{t(dayResultProduction.eyebrow_text_id)}</span>
        <strong>{t(dayResultProduction.title_text_id)}</strong>
      </header>
      <div className="day-result-production-thread">
        {dayResultProduction.lanes.map((lane, index) => <article key={lane.kind} data-lane={lane.kind}>
          <i aria-hidden="true">{String(index + 1).padStart(2, '0')}</i>
          <span>{t(lane.label_text_id)}</span>
          <strong>{t(lane.title_text_id)}</strong>
        </article>)}
      </div>
      <div className="day-result-tomorrow-threshold" aria-hidden="true">
        <i />
        <span />
        <b />
      </div>
    </section> : null}
    {showEvidenceBoard ? <div className="episode-immersive-evidence-board" aria-hidden="true">
      <span className="evidence-sheet sheet-a" />
      <span className="evidence-sheet sheet-b" />
      <span className="evidence-sheet sheet-c" />
      <i className="evidence-pin pin-a" />
      <i className="evidence-pin pin-b" />
      <b className="evidence-timeline" />
    </div> : null}
    {officeProduction ? <div className="office-production-layer" data-phase={officeProduction.phase} data-evidence={officeProduction.evidence_focus} aria-hidden="true">
      <span className="office-table-plane" />
      <span className="office-record record-a" />
      <span className="office-record record-b" />
      <span className="office-record record-c" />
      <i className="office-evidence-axis" />
      <i className="office-evidence-link link-a" />
      <i className="office-evidence-link link-b" />
      <b className="office-next-field-trace" />
    </div> : null}
    {fieldVisualLock ? <div className="field-visual-lock-layer" data-lock={fieldVisualLock.lock_id} aria-hidden="true">
      <i className="field-ramp-plate" />
      <i className="field-ramp-gravel" />
      <i className="field-vehicle-trace" />
      {fieldVisualLock.evidence.map(item => <span key={item.key} className="field-world-evidence" data-evidence={item.key}>
        {t(item.label_text_id)}
      </span>)}
    </div> : null}
    {tbmProduction ? <div className="tbm-production-layer" data-phase={tbmProduction.phase} aria-hidden="true">
      <div className="tbm-briefing-board" data-board="work-sequence">
        <b>TBM</b>
        <span className="tbm-board-step tbm-board-step-a"><i>01</i><em /></span>
        <span className="tbm-board-step tbm-board-step-b"><i>02</i><em /></span>
        <span className="tbm-board-step tbm-board-step-c"><i>03</i><em /></span>
        <span className="tbm-board-stand" />
      </div>
      <div className="tbm-background-crew">
        <span className="tbm-background-worker worker-a"><i /><b /></span>
        <span className="tbm-background-worker worker-b"><i /><b /></span>
        <span className="tbm-background-worker worker-c"><i /><b /></span>
      </div>
      <i className="tbm-briefing-ring" />
      <span className="tbm-floor-mark tbm-floor-mark-a" />
      <span className="tbm-floor-mark tbm-floor-mark-b" />
      <span className="tbm-floor-mark tbm-floor-mark-c" />
    </div> : null}
    {tbmVisualLock ? <div className="tbm-visual-lock-layer" data-lock={tbmVisualLock.lock_id} aria-hidden="true">
      <i className="tbm-change-route-line" />
      <i className="tbm-change-control-point" />
      {tbmVisualLock.evidence.map(item => <span key={item.key} className="tbm-world-evidence" data-evidence={item.key}>
        {t(item.label_text_id)}
      </span>)}
    </div> : null}
    {stopWorkProduction ? <div className="stop-work-production-layer" data-phase={stopWorkProduction.phase} aria-hidden="true">
      <div className="stop-work-production-title">
        <span>{t(stopWorkProduction.kicker_text_id)}</span>
        <strong>{t(stopWorkProduction.title_text_id)}</strong>
        <small>{t(stopWorkProduction.detail_text_id)}</small>
      </div>
      <div className="stop-work-production-markers">
        {stopWorkProduction.markers.map(marker => <span key={marker.key} data-marker={marker.key}>
          <i />
          <b>{t(marker.label_text_id)}</b>
        </span>)}
      </div>
      {stopWorkProduction.phase === 'zero-moment' ? <div className="stop-work-production-stopline">
        <i />
        <b>STOP</b>
      </div> : null}
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
      data-side={scene.background_environment === 'site_office'
        ? 'right'
        : cinematicTrace ? (scene.focus === 'right' ? 'right' : 'left') : 'right'}
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
        const blocking = episode01CharacterBlocking(scene.event_id, characterId, speakerId, relationshipCue, scene.node_id);
        const performance = episode01CharacterPerformance(scene.event_id, scene.node_id, characterId, speakerId, relationshipCue);
        const performanceAsset = episode01CharacterPerformanceAsset(characterId, performance?.expression, resolve);
        const characterUri = performanceAsset?.uri
          ?? performanceAsset?.fallback_uri
          ?? characterMapUri(characterId, resolve);
        const characterFallbackUri = performanceAsset?.uri
          ? performanceAsset.fallback_uri ?? characterMapUri(characterId, resolve)
          : undefined;
        return <div
        key={characterId}
        className={`episode-immersive-character cast-${index + 1}`}
        data-speaker={speakerId === characterId || undefined}
        data-character={characterId}
        data-relationship-cue={relationshipCue}
        data-blocking-side={blocking?.side}
        data-blocking-depth={blocking?.depth}
        data-expression={performance?.expression}
        data-pose={performance?.pose}
        data-presence-motion={performance?.motion}
        data-performance-asset={performanceAsset?.using_expression_asset ? 'expression' : 'map-fallback'}
      >
        <VisualImage uri={characterUri} fallbackUri={characterFallbackUri} alt="" />
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

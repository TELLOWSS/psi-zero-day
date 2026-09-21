import { lazy, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { GameState } from '../domain';
import type { EpisodeSession } from '../app/episode-session';
import { projectCharacterGrowth } from '../app/character-growth';
import { dialogueExpressionUri } from '../app/dialogue-art';
import { projectCharacterLoadout } from '../app/character-loadout';
import { FIELD_SUPPORT_ITEMS, isFieldSupportItemActive } from '../app/field-support-items';
import { completedTraining } from '../app/training';
import { isStrategyFieldActionEvent, projectStrategyActions } from '../app/strategy-actions';
import type { StrategyAction } from '../app/strategy-actions';
import { characterMapUri, characterPortraitUri, episode01BackgroundUri, projectStrategyVisualAssets } from '../app/strategy-assets';
import { psiCuesForChoice } from '../app/strategy-psi';
import { episodeCinematicBeat } from '../app/episode-cinematic-beats';
import { episodePresentationAudioCue, episodePresentationNodeCue } from '../app/episode-presentation-cues';
import { episode01ContinuityTrace, episode01MemoryCallback } from '../app/episode01-memory-callback';
import { episode01MemoryVisualPlan } from '../app/episode01-memory-visuals';
import { characterIntroductionTextId, formatCharacterIdentity } from '../app/character-label';
import {
  consumePaidItem,
  emptyPaidItemWallet,
  loadPaidItemWallet,
  paidItemQuantity,
  REPLAN_PASS_ITEM_ID,
  savePaidItemWallet,
} from '../app/paid-item-wallet';
import { CharacterCard, SiteScene, VisualImage } from './VisualSlot';
import { PresentationView } from './PresentationView';
import { StrategyMapShell } from './StrategyMapShell';
import { useEpisodeAudio } from './useEpisodeAudio';
import { EpisodeSceneBrief } from './EpisodeSceneBrief';
import { EpisodeTimeMontage } from './EpisodeTimeMontage';
import { EpisodeInspectionContext } from './EpisodeInspectionContext';
import { EpisodeInspectionAftermath } from './EpisodeInspectionAftermath';
import { EpisodeReportChain } from './EpisodeReportChain';
import { EpisodeTbmChangeChain } from './EpisodeTbmChangeChain';
import { EpisodeRestartChain } from './EpisodeRestartChain';
import { EpisodeStopworkCultureChain } from './EpisodeStopworkCultureChain';
import { EpisodeInstructionRealityChain } from './EpisodeInstructionRealityChain';
import { EpisodeRecordRealityChain } from './EpisodeRecordRealityChain';
import { EpisodeDayCarryover } from './EpisodeDayCarryover';
import { EpisodeImmersiveScene, episode01RelationshipSceneCue } from './EpisodeImmersiveScene';
import { EpisodeRecord } from './EpisodeRecord';
import { EpisodeColdOpen } from './EpisodeColdOpen';
import { TITLE_CAST_IDS } from '../app/title-cast';
import { episode01StoryDirection } from '../app/episode01-story-director';
import { episode01ProductionScene } from '../app/episode01-production-scene';
import { episode01StopWorkProduction } from '../app/episode01-stopwork-production';
import { episode01FieldProduction } from '../app/episode01-field-production';
import { episode01TbmProduction } from '../app/episode01-tbm-production';
import { episode01StrategyProduction } from '../app/episode01-strategy-production';
import { episode01OfficeProduction } from '../app/episode01-office-production';
import { episode01DayResultProduction } from '../app/episode01-day-result-production';

const DebugPanel = import.meta.env.DEV ? lazy(() => import('./DebugPanel')) : null;

interface ExecutedFieldAction {
  readonly action: StrategyAction;
  readonly source_revision: number;
  readonly checkpoint: GameState;
}

interface PresentationHistoryEntry {
  readonly key: string;
  readonly eventTitle: string;
  readonly speaker: string;
  readonly text: string;
}

function initialPaidItemWallet() {
  if (typeof window === 'undefined') return emptyPaidItemWallet();
  try { return loadPaidItemWallet(window.localStorage); }
  catch { return emptyPaidItemWallet(); }
}

export function PlayableEpisode({ session, onReturn }: { session: EpisodeSession; onReturn?: () => void }) {
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const [debugOpen, setDebugOpen] = useState(false);
  const [executedFieldAction, setExecutedFieldAction] = useState<ExecutedFieldAction | null>(null);
  const [paidItemWallet, setPaidItemWallet] = useState(initialPaidItemWallet);
  const focusRef = useRef<HTMLElement>(null);
  const seenSpeakersByRun = useRef(new Set<string>());
  const playedSceneCues = useRef(new Set<string>());
  const [firstContactNode, setFirstContactNode] = useState<string | null>(null);
  const [choicePreviewId, setChoicePreviewId] = useState<string | null>(null);
  const [coldOpenDismissed, setColdOpenDismissed] = useState(false);
  const [presentationHistory, setPresentationHistory] = useState<readonly PresentationHistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const t = session.t;
  const resolveAsset = useCallback((id: string) => session.assetUri(id), [session]);
  const { playUiCue, playPresentationCue } = useEpisodeAudio(snapshot.state?.audio, resolveAsset);
  const presentation = snapshot.presentation.find(p => 'node_id' in p);
  const person = snapshot.dialogue?.speaker_id ? session.character(snapshot.dialogue.speaker_id) : undefined;
  const portrait = snapshot.dialogue?.visual_reference;
  const runIdentity = snapshot.state ? `${snapshot.state.run.run_id}:${snapshot.state.run.playthrough}` : null;
  const dialogueNodeIdentity = snapshot.dialogue && runIdentity
    ? `${runIdentity}:${snapshot.dialogue.event_id}:${snapshot.dialogue.node_id}`
    : null;
  const firstContactTextId = person && dialogueNodeIdentity === firstContactNode
    ? characterIntroductionTextId(person.id)
    : undefined;
  const clock = snapshot.state?.clock ?? { day: 1, slot: 'PRE_WORK' };
  const isPlaying = snapshot.phase === 'playing';
  const strategy = snapshot.strategy;
  const activeInstance = snapshot.state?.event_runtime.active_instance ?? null;
  const activeEventId = activeInstance?.event_id ?? null;
  const directedCampaign = snapshot.state?.run.content_version === 'ep01.director.v5';
  const storyDirection = episode01StoryDirection(activeEventId);
  const productionScene = episode01ProductionScene(storyDirection?.preset);
  const strategyActive = isPlaying && strategy !== null && productionScene === 'STRATEGY';
  const stopWorkProduction = productionScene === 'STOP_WORK' ? episode01StopWorkProduction(activeEventId) : undefined;
  const fieldProduction = productionScene === 'FIELD' ? episode01FieldProduction(activeEventId, activeInstance?.current_node_id) : undefined;
  const tbmProduction = productionScene === 'TBM' ? episode01TbmProduction(activeEventId, activeInstance?.current_node_id) : undefined;
  const strategyProduction = productionScene === 'STRATEGY' ? episode01StrategyProduction(activeEventId, activeInstance?.current_node_id) : undefined;
  const officeProduction = productionScene === 'OFFICE' ? episode01OfficeProduction(activeEventId, activeInstance?.current_node_id) : undefined;
  const dayResultProduction = productionScene === 'DAY_RESULT' ? episode01DayResultProduction(activeEventId, activeInstance?.current_node_id, snapshot.state?.flags) : undefined;
  const cinematicBeat = episodeCinematicBeat(activeEventId);
  const memoryCallback = episode01MemoryCallback(snapshot.state, activeEventId);
  const memoryVisualPlan = episode01MemoryVisualPlan(snapshot.state, activeEventId);
  const continuityTrace = episode01ContinuityTrace(snapshot.state, activeEventId);
  const activeInstanceHasChoice = activeInstance !== null && (snapshot.state?.event_runtime.choice_history.some(item => item.instance_id === activeInstance.instance_id) ?? false);
  const fallbackChoiceId = activeInstance
    ? (snapshot.state?.event_runtime.choice_history.slice().reverse().find(item => item.instance_id === activeInstance.instance_id)?.choice_id)
    : undefined;
  const strategyActions = projectStrategyActions(strategy?.runtime.active_event_id ?? null, presentation);
  const executedOutcomeReady = executedFieldAction !== null && snapshot.revision > executedFieldAction.source_revision;
  const executedEngineResult = executedOutcomeReady && presentation?.type === 'SHOW_RESULT' && presentation.instance_id === executedFieldAction?.action.instance_id;
  const fallbackEngineOutcome = !executedOutcomeReady && isPlaying && activeInstanceHasChoice && isStrategyFieldActionEvent(activeEventId) && presentation?.type === 'SHOW_RESULT';
  const mapOutcomeActive = strategyActive && (executedOutcomeReady || fallbackEngineOutcome);
  const outcomePsiCues = psiCuesForChoice(executedFieldAction?.action.choice_id ?? fallbackChoiceId);
  const replanBalance = paidItemQuantity(paidItemWallet, REPLAN_PASS_ITEM_ID);
  const supportItems = snapshot.state
    ? FIELD_SUPPORT_ITEMS.map(item => {
      const remaining = paidItemQuantity(paidItemWallet, item.item_id);
      const active = isFieldSupportItemActive(snapshot.state!.flags, item.item_id);
      return {
        ...item,
        remaining,
        active,
        enabled: remaining > 0 && !active && !mapOutcomeActive && activeEventId !== null && isStrategyFieldActionEvent(activeEventId),
      };
    }).filter(item => item.remaining > 0 || item.active)
    : [];
  const visualAssets = strategy
    ? projectStrategyVisualAssets(
      strategy.placements.map(item => item.character_id),
      resolveAsset,
      strategy.scene.background_asset_id,
    )
    : undefined;
  const titleBackgroundUri = episode01BackgroundUri(resolveAsset);
  const titleHeroCast = snapshot.phase === 'start'
    ? TITLE_CAST_IDS.map((characterId, index) => ({
      characterId,
      index,
      uri: characterMapUri(characterId, resolveAsset),
    }))
    : [];
  const strategyCopy = {
    brand: t('ui.brand'),
    day: t('ui.day'),
    stage: t('ui.strategy.stage'),
    psi: t('ui.strategy.psi'),
    objectives: t('ui.strategy.objectives'),
    assignments: t('ui.strategy.assignments'),
    roster: t('ui.strategy.roster'),
    site: t('ui.strategy.site'),
    events: t('ui.strategy.events'),
    progress: t('ui.strategy.progress'),
    pressures: t('ui.strategy.pressures'),
    focus: t('ui.strategy.focus'),
    focusHint: t('ui.strategy.focus_hint'),
    actions: t('ui.strategy.actions'),
    actionHint: t('ui.strategy.action_hint'),
  };
  const outcomeText = executedOutcomeReady && executedFieldAction
    ? executedEngineResult && presentation?.type === 'SHOW_RESULT'
      ? t(presentation.text_id)
      : `${t(executedFieldAction.action.label_text_id)} · ${t('ui.strategy.action_applied')}`
    : fallbackEngineOutcome && presentation?.type === 'SHOW_RESULT'
      ? t(presentation.text_id)
      : '';
  const strategyOutcome = mapOutcomeActive
    ? {
      key: executedFieldAction
        ? `${executedFieldAction.action.instance_id}:${executedFieldAction.action.choice_id}:${snapshot.revision}`
        : `${activeInstance?.instance_id ?? 'field'}:${presentation && 'node_id' in presentation ? presentation.node_id : 'result'}:${snapshot.revision}`,
      text: outcomeText,
      relationship_lines: snapshot.relationshipFeedback.map(({ npc_id, delta }) => {
        const character = session.character(npc_id);
        const identity = character ? formatCharacterIdentity(character) : npc_id;
        const field = t(`ui.relationship.${delta.field}`);
        const amount = `${delta.applied_delta > 0 ? '+' : ''}${delta.applied_delta}`;
        return `${identity} · ${field} ${amount}`;
      }),
      psi_cues: outcomePsiCues,
      ...(executedFieldAction ? {
        reconsideration: {
          item_id: REPLAN_PASS_ITEM_ID,
          remaining: replanBalance,
          enabled: replanBalance > 0,
        },
      } : {}),
    }
    : undefined;

  const saveWallet = (nextWallet: typeof paidItemWallet) => {
    setPaidItemWallet(nextWallet);
    if (typeof window !== 'undefined') {
      try { savePaidItemWallet(window.localStorage, nextWallet); } catch { /* storage unavailable */ }
    }
  };

  const chooseEvent = (instanceId: string, nodeId: string, choiceId: string): boolean => {
    const fieldAction = strategyActions.find(action => action.instance_id === instanceId && action.node_id === nodeId && action.choice_id === choiceId);
    if (fieldAction && snapshot.state && strategyActive) {
      setExecutedFieldAction({ action: fieldAction, source_revision: snapshot.revision, checkpoint: snapshot.state });
    }
    const accepted = session.dispatch({ type: 'choose_event', instance_id: instanceId, node_id: nodeId, choice_id: choiceId }, snapshot.revision);
    if (!accepted && fieldAction) setExecutedFieldAction(null);
    return accepted;
  };

  const continueMapOutcome = () => {
    if (!mapOutcomeActive) return;
    playUiCue('continue');
    if ((executedEngineResult || fallbackEngineOutcome) && presentation?.type === 'SHOW_RESULT') {
      const accepted = session.dispatch({ type: 'advance_event', instance_id: presentation.instance_id, node_id: presentation.node_id }, snapshot.revision);
      if (accepted) setExecutedFieldAction(null);
      return;
    }
    if (executedFieldAction) {
      // A field choice can lead to another node in the same event (for example ramp -> entrance).
      // In that case the engine is already positioned on the next presentation; confirming the
      // visible action result should only uncover it, not require the whole event to be finished.
      if (activeInstance?.instance_id === executedFieldAction.action.instance_id) {
        setExecutedFieldAction(null);
        return;
      }
      const accepted = session.confirmFieldOutcome(executedFieldAction.action.instance_id, snapshot.revision);
      if (accepted) setExecutedFieldAction(null);
      return;
    }
    setExecutedFieldAction(null);
  };

  const reconsiderMapOutcome = () => {
    if (!executedFieldAction || replanBalance <= 0) return;
    const accepted = session.reconsider(executedFieldAction.checkpoint, snapshot.revision);
    if (!accepted) return;
    saveWallet(consumePaidItem(paidItemWallet, REPLAN_PASS_ITEM_ID));
    setExecutedFieldAction(null);
    playUiCue('continue');
  };

  const useSupportItem = (itemId: string) => {
    if (paidItemQuantity(paidItemWallet, itemId) <= 0) return;
    const accepted = session.activateSupportItem(itemId, snapshot.revision);
    if (!accepted) return;
    saveWallet(consumePaidItem(paidItemWallet, itemId));
    playUiCue('execute');
  };

  useEffect(() => { if (snapshot.phase === 'playing') focusRef.current?.focus({ preventScroll: true }); }, [snapshot.revision, snapshot.phase]);
  useEffect(() => { if (!isPlaying) setExecutedFieldAction(null); }, [isPlaying]);
  useEffect(() => { setChoicePreviewId(null); }, [activeEventId, activeInstance?.current_node_id]);
  useEffect(() => {
    if (!person || !dialogueNodeIdentity || !runIdentity) {
      setFirstContactNode(null);
      return;
    }
    const speakerRunKey = `${runIdentity}:${person.id}`;
    if (seenSpeakersByRun.current.has(speakerRunKey)) {
      setFirstContactNode(null);
      return;
    }
    seenSpeakersByRun.current.add(speakerRunKey);
    setFirstContactNode(dialogueNodeIdentity);
  }, [person?.id, dialogueNodeIdentity, runIdentity]);
  useEffect(() => {
    if (!activeEventId || !runIdentity) return;
    const cue = episodePresentationAudioCue(activeEventId);
    if (!cue) return;
    const key = `${runIdentity}:${activeEventId}`;
    if (playedSceneCues.current.has(key)) return;
    playedSceneCues.current.add(key);
    playPresentationCue(cue);
  }, [activeEventId, runIdentity, playPresentationCue]);
  useEffect(() => {
    if (!activeEventId || !runIdentity || !presentation || !('node_id' in presentation)) return;
    const cue = episodePresentationNodeCue(activeEventId, presentation.node_id, presentation.type);
    if (!cue) return;
    const key = `${runIdentity}:node:${activeEventId}:${presentation.node_id}`;
    if (playedSceneCues.current.has(key)) return;
    playedSceneCues.current.add(key);
    playUiCue(cue);
  }, [activeEventId, runIdentity, presentation?.type, presentation && 'node_id' in presentation ? presentation.node_id : null, playUiCue]);
  useEffect(() => {
    if (!firstContactTextId || !dialogueNodeIdentity) return;
    playUiCue('character_intro');
  }, [firstContactTextId, dialogueNodeIdentity, playUiCue]);
  useEffect(() => {
    if (!presentation || !('node_id' in presentation)) return;
    if (presentation.type !== 'SHOW_DIALOGUE' && presentation.type !== 'SHOW_RESULT') return;
    const key = `${presentation.instance_id}:${presentation.node_id}`;
    const entry: PresentationHistoryEntry = {
      key,
      eventTitle: snapshot.eventTitle,
      speaker: person ? formatCharacterIdentity(person) : t(presentation.type === 'SHOW_DIALOGUE' ? 'ui.dialogue' : 'ui.narration'),
      text: t(presentation.text_id),
    };
    setPresentationHistory(previous => {
      if (previous.at(-1)?.key === key) return previous;
      return Object.freeze([...previous, entry].slice(-20));
    });
  }, [presentation, snapshot.eventTitle, person?.id, t]);
  useEffect(() => {
    if (snapshot.phase === 'start') {
      setColdOpenDismissed(false);
      setPresentationHistory([]);
      setHistoryOpen(false);
    }
  }, [snapshot.phase]);
  useEffect(() => {
    if (!strategyOutcome) return;
    const relationDelta = snapshot.relationshipFeedback.reduce((sum, item) => sum + item.delta.applied_delta, 0);
    playUiCue(relationDelta > 0 ? 'result_positive' : relationDelta < 0 ? 'result_negative' : 'result_neutral');
  }, [strategyOutcome?.key, playUiCue]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest('input, textarea, select, summary, [contenteditable="true"], .debug-panel')) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.repeat) { if (e.key === 'Enter' || e.code === 'Space') e.preventDefault(); return; }
      if (mapOutcomeActive) {
        if (e.key === 'Enter' || e.code === 'Space') { e.preventDefault(); continueMapOutcome(); }
        return;
      }
      if (snapshot.phase !== 'playing' || !presentation || !('node_id' in presentation)) return;
      if (presentation.type === 'SHOW_CHOICE' && /^[1-4]$/.test(e.key)) {
        e.preventDefault();
        const choice = presentation.choices[Number(e.key) - 1];
        if (choice?.enabled) {
          playUiCue('execute');
          chooseEvent(presentation.instance_id, presentation.node_id, choice.choice_id);
        }
      } else if (presentation.type !== 'SHOW_CHOICE' && (e.key === 'Enter' || e.code === 'Space')) {
        if (target?.closest('button') && !target.closest('.continue-button')) return;
        e.preventDefault();
        playUiCue('continue');
        session.dispatch({ type: 'advance_event', instance_id: presentation.instance_id, node_id: presentation.node_id }, snapshot.revision);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session, snapshot.revision, snapshot.phase, presentation, mapOutcomeActive, executedEngineResult, fallbackEngineOutcome, playUiCue]);

  const basePortraitUri = portrait?.kind === 'asset'
    ? resolveAsset(portrait.id)
    : person ? characterPortraitUri(person.id, resolveAsset) : undefined;
  const dialoguePortraitUri = dialogueExpressionUri(person?.id, snapshot.dialogue?.text_id, resolveAsset) ?? basePortraitUri;
  const dialogueGrowth = person && snapshot.state ? projectCharacterGrowth(snapshot.state.flags, person.id) : undefined;
  const dialogueLoadout = person && snapshot.state ? projectCharacterLoadout(snapshot.state.flags, person.id) : undefined;
  const rewardCharacterId = activeEventId === 'e01_09_evening'
    ? 'player'
    : activeEventId === 'e01_08a_reporting_return' ? 'lim_junho' : undefined;
  const trainingReward = snapshot.state && rewardCharacterId
    ? completedTraining(snapshot.state.flags, rewardCharacterId)
    : undefined;
  const equippedTrainingRewards = trainingReward && snapshot.state && rewardCharacterId
    ? [...trainingReward.auto_equipped, ...trainingReward.equip_options.filter(item =>
      snapshot.state?.flags[`equipment.${rewardCharacterId}.${item.slot}`] === item.item_id)]
    : [];
  const currentHistoryKey = presentation && 'node_id' in presentation && (presentation.type === 'SHOW_DIALOGUE' || presentation.type === 'SHOW_RESULT')
    ? `${presentation.instance_id}:${presentation.node_id}`
    : null;
  const previousHistoryEntries = presentationHistory
    .filter(entry => entry.key !== currentHistoryKey)
    .slice(-8)
    .reverse();
  const showColdOpen = directedCampaign && isPlaying && activeEventId === 'e01_01_arrival' && !coldOpenDismissed;
  const dismissColdOpen = useCallback(() => {
    setColdOpenDismissed(true);
    playUiCue('continue');
  }, [playUiCue]);

  return <main
    className={`game-frame phase-${snapshot.phase}${strategyActive ? ' strategy-active' : ''}${strategyActive && (strategyActions.length || mapOutcomeActive) ? ' strategy-action-active' : ''}`}
    data-story-act={storyDirection?.act_id}
    data-story-beat={storyDirection?.beat}
    data-scene-preset={storyDirection?.preset}
    data-production-scene={productionScene}
    data-stopwork-phase={stopWorkProduction?.phase}
    data-stopwork-camera={stopWorkProduction?.camera_profile}
    data-stopwork-depth={stopWorkProduction?.depth_profile}
    data-stopwork-lighting={stopWorkProduction?.lighting_profile}
    data-stopwork-ui={stopWorkProduction?.ui_profile}
    data-field-phase={fieldProduction?.phase}
    data-field-camera={fieldProduction?.camera_profile}
    data-field-depth={fieldProduction?.depth_profile}
    data-field-lighting={fieldProduction?.lighting_profile}
    data-field-ui={fieldProduction?.ui_profile}
    data-field-cast={fieldProduction?.cast_profile}
    data-tbm-phase={tbmProduction?.phase}
    data-tbm-camera={tbmProduction?.camera_profile}
    data-tbm-depth={tbmProduction?.depth_profile}
    data-tbm-lighting={tbmProduction?.lighting_profile}
    data-tbm-ui={tbmProduction?.ui_profile}
    data-tbm-cast={tbmProduction?.cast_profile}
    data-tbm-hero={tbmProduction?.hero_character_id}
    data-strategy-phase={strategyProduction?.phase}
    data-strategy-camera={strategyProduction?.camera_profile}
    data-strategy-depth={strategyProduction?.depth_profile}
    data-strategy-lighting={strategyProduction?.lighting_profile}
    data-strategy-ui={strategyProduction?.ui_profile}
    data-strategy-focus={strategyProduction?.focus}
    data-office-phase={officeProduction?.phase}
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
    data-hud-density={storyDirection?.hud_density}
    data-interaction-mode={storyDirection?.interaction_mode}
    data-pacing={storyDirection?.pacing}
  >
    {isPlaying && cinematicBeat ? <div className="episode-scene-stamp" key={activeEventId ?? 'beat'} data-tone={cinematicBeat.tone} aria-hidden="true">
      <span>{cinematicBeat.time}</span><b>{cinematicBeat.zone}</b><strong>{cinematicBeat.label}</strong>
      {cinematicBeat.detail ? <small>{cinematicBeat.detail}</small> : null}
    </div> : null}
    {strategyActive ? <StrategyMapShell
      key={`${activeEventId ?? 'strategy'}:${activeInstance?.instance_id ?? 'none'}`}
      view={strategy}
      copy={strategyCopy}
      text={t}
      person={id => session.character(id)}
      actions={mapOutcomeActive ? [] : strategyActions}
      visualAssets={visualAssets}
      outcome={strategyOutcome}
      onOutcomeContinue={continueMapOutcome}
      onOutcomeReconsider={reconsiderMapOutcome}
      supportItems={supportItems}
      onSupportItemUse={useSupportItem}
      onReturn={onReturn}
      onAction={action => {
        playUiCue('execute');
        chooseEvent(action.instance_id, action.node_id, action.choice_id);
      }}
    /> : <SiteScene chapter={snapshot.state?.event_runtime.chapter_id} backgroundUri={titleBackgroundUri} />}
    {!strategyActive ? <header className="game-header">
      {onReturn ? <button className="gameplay-home-button" type="button" onClick={onReturn} aria-label={t('ui.hub.return')} title={t('ui.hub.return')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10" /></svg>
      </button> : null}
      <div className="hud-brand"><strong>{t('ui.brand')}</strong><small>{t('ui.tagline')}</small></div>
      <div className="day-marker"><span>{t('ui.day')}</span><strong>{String(clock.day).padStart(2, '0')}</strong></div>
      <div className="time-marker"><span>{t(`ui.slot.${clock.slot.toLowerCase()}`)}</span><i /><span>{snapshot.chapterTitle}</span></div>
      {previousHistoryEntries.length > 0 ? <button
        className="gameplay-history-button"
        type="button"
        onClick={() => setHistoryOpen(true)}
        aria-label={t('ui.previous_view')}
        title={t('ui.previous_view')}
      ><span aria-hidden="true">↶</span><b>{t('ui.previous_view')}</b></button> : null}
      <span className="header-episode">{t('ui.episode')}</span>
    </header> : null}
    {snapshot.phase === 'start' ? <section className="title-screen title-screen-commercial">
      <div className="title-copy"><span className="eyebrow">{t('ui.episode')} <i /> {t('ui.site')}</span>
        <h1>{t('ui.brand')}</h1><p className="tagline">{t('ui.tagline')}</p></div>
      <div className="title-hero-cast" aria-hidden="true">
        {titleHeroCast.map(({ characterId, index, uri }) => <div className={`title-hero-character title-hero-character-${index + 1}`} data-character={characterId} key={characterId}>
          <VisualImage uri={uri} alt="" className="title-hero-character-image" />
        </div>)}
        <span className="title-hero-ground" />
      </div>
      <div className="start-block"><div><span className="eyebrow">{t('ui.day')} 01</span><h2>{t('ep01.title')}</h2><p>{t('ui.start_hint')}</p></div>
        <button className="primary-button" type="button" onClick={e => { if (e.detail < 2) { playUiCue('continue'); session.start(snapshot.revision); } }}>{t('ui.start')}<span aria-hidden="true">↗</span></button>
      </div>
    </section> : isPlaying ? <>
      <section className="scene-heading"><span className="eyebrow">{t('ui.scene')}</span><h1>{snapshot.eventTitle}</h1></section>
      <EpisodeImmersiveScene
        eventId={activeEventId}
        nodeId={activeInstance?.current_node_id}
        speakerId={snapshot.dialogue?.speaker_id}
        speakerIdentity={person}
        relationshipCues={snapshot.relationshipFeedback.flatMap(({ npc_id, delta }) => {
          const cue = episode01RelationshipSceneCue(delta.applied_delta);
          return cue ? [{ character_id: npc_id, cue }] : [];
        })}
        presentationType={presentation?.type}
        previewChoiceId={choicePreviewId}
        eventTitle={snapshot.eventTitle}
        time={cinematicBeat?.time}
        zone={cinematicBeat?.zone}
        resolve={resolveAsset}
        t={t}
        memoryVisualPlan={memoryVisualPlan}
        dayResultProduction={dayResultProduction}
      />
      <section className="play-panel" ref={focusRef} tabIndex={-1} aria-label={t('ui.dialogue')}>
        {person ? <CharacterCard
          person={person}
          portraitUri={dialoguePortraitUri}
          fallbackPortraitUri={basePortraitUri}
          growth={dialogueGrowth}
          loadout={dialogueLoadout}
          equipmentTitle={t('ui.equipment.title')}
          slotLabel={slot => t(`ui.equipment.${slot}`)}
          introLabel={firstContactTextId ? t('ui.character.first_appearance') : undefined}
          introLine={firstContactTextId ? t(firstContactTextId) : undefined}
          firstContact={Boolean(firstContactTextId)}
        /> : <aside className="narrator-card"><span className="narrator-mark" aria-hidden="true">01</span><strong>{t('ui.record')}</strong><span>{t('ep01.title')}</span></aside>}
        <div className="presentation-area" data-presentation={presentation?.type ?? 'NONE'} aria-live="polite" key={snapshot.revision}>
          <EpisodeTimeMontage eventId={activeEventId} flags={snapshot.state?.flags} t={t} />
          <EpisodeSceneBrief eventId={activeEventId ?? undefined} t={t} />
          <EpisodeInspectionContext eventId={activeEventId} flags={snapshot.state?.flags} t={t} />
          <EpisodeInspectionAftermath eventId={activeEventId} flags={snapshot.state?.flags} t={t} />
          <EpisodeReportChain eventId={activeEventId} flags={snapshot.state?.flags} t={t} />
          <EpisodeTbmChangeChain eventId={activeEventId} flags={snapshot.state?.flags} t={t} />
          <EpisodeRestartChain eventId={activeEventId} flags={snapshot.state?.flags} t={t} />
          <EpisodeStopworkCultureChain eventId={activeEventId} flags={snapshot.state?.flags} t={t} />
          <EpisodeInstructionRealityChain eventId={activeEventId} flags={snapshot.state?.flags} t={t} />
          <EpisodeRecordRealityChain eventId={activeEventId} flags={snapshot.state?.flags} t={t} />
          <EpisodeDayCarryover eventId={activeEventId} flags={snapshot.state?.flags} t={t} />
          {continuityTrace ? <aside className="episode-continuity-ribbon" aria-label={t(continuityTrace.eyebrow_text_id)}>
            <span>{t(continuityTrace.eyebrow_text_id)}</span>
            <p>{t(continuityTrace.line_text_id)}</p>
          </aside> : null}
          {memoryCallback ? <aside className="episode-memory-callback" aria-label={t(memoryCallback.title_text_id)}>
            <span>{t(memoryCallback.eyebrow_text_id)}</span>
            <strong>{t(memoryCallback.title_text_id)}</strong>
            <div>{memoryCallback.line_text_ids.map(id => <p key={id}>{t(id)}</p>)}</div>
          </aside> : null}
          {!mapOutcomeActive && snapshot.relationshipFeedback.length ? <div className="relationship-feedback" role="status" aria-label={t('ui.relationship_change')}>
            {snapshot.relationshipFeedback.map(({ npc_id, delta }) => <span key={delta.source.effect_instance_id}>
              <strong>{formatCharacterIdentity(session.character(npc_id))}</strong> {t(`ui.relationship.${delta.field}`)}
              <b className={delta.applied_delta > 0 ? 'delta-positive' : 'delta-negative'}>{delta.applied_delta > 0 ? '+' : ''}{delta.applied_delta}</b>
            </span>)}
          </div> : null}
          {trainingReward ? <div className="training-reward-panel" role="status" data-training={trainingReward.training_id}>
            <span>{t('ui.training.complete')}</span><strong>{t(trainingReward.title_text_id)}</strong>
            <div><b>{t('ui.training.reward')}</b>{trainingReward.rewards.map(item => <em key={item.item_id}>{item.name}</em>)}</div>
            {equippedTrainingRewards.length ? <div><b>{t('ui.training.equipped')}</b>{equippedTrainingRewards.map(item => <em key={item.slot}>{item.name}</em>)}</div> : null}
          </div> : null}
          {mapOutcomeActive
            ? <p className="map-outcome-support">{t('ui.strategy.result_on_map')}</p>
            : <PresentationView
              commands={snapshot.presentation}
              t={t}
              send={command => {
                if (command.type === 'choose_event') {
                  playUiCue('execute');
                  chooseEvent(command.instance_id, command.node_id, command.choice_id);
                } else {
                  if (command.type === 'advance_event') playUiCue('continue');
                  session.dispatch(command, snapshot.revision);
                }
              }}
              assetUri={resolveAsset}
              eventId={activeEventId}
              choiceFallback={strategyActive && strategyActions.length > 0}
              onChoicePreview={setChoicePreviewId}
            />}
        </div>
      </section>
      {historyOpen ? <aside className="presentation-history-drawer" role="dialog" aria-modal="true" aria-label={t('ui.previous_view.title')}>
        <header><div><span>{t('ui.previous_view.eyebrow')}</span><strong>{t('ui.previous_view.title')}</strong></div><button type="button" onClick={() => setHistoryOpen(false)} aria-label={t('ui.previous_view.close')}>×</button></header>
        <div className="presentation-history-list">
          {previousHistoryEntries.length ? previousHistoryEntries.map(entry => <article key={entry.key}>
            <div><strong>{entry.speaker}</strong><span>{entry.eventTitle}</span></div>
            <p>{entry.text}</p>
          </article>) : <p className="presentation-history-empty">{t('ui.previous_view.empty')}</p>}
        </div>
      </aside> : null}
      {showColdOpen ? <EpisodeColdOpen
        backgroundUri={resolveAsset('ep01.scene_bg.inspection_zone')}
        playerUri={resolveAsset('ep01.character.player.performance.resolve') ?? characterMapUri('player', resolveAsset)}
        kangUri={resolveAsset('ep01.character.kang_taesik.performance.conflict') ?? characterMapUri('kang_taesik', resolveAsset)}
        junhoUri={resolveAsset('ep01.character.lim_junho.performance.relief') ?? characterMapUri('lim_junho', resolveAsset)}
        t={t}
        onComplete={dismissColdOpen}
      /> : null}
    </> : snapshot.phase === 'complete' ? <section className="complete-screen">
      <span className="completion-rule" /><p className="eyebrow">{t('ui.complete')}</p><h1>{t('ep01.title')}</h1>
      <p className="end-line">{t('ui.end_hint')}</p>
      <div className="episode-completion-carryover">
        <EpisodeDayCarryover eventId="e01_10_next_day_tease" flags={snapshot.state?.flags} t={t} />
      </div>
      <section className="episode-review" aria-label={t('ui.review.title')}>
        <h2>{t('ui.review.title')}</h2>
        <p>{t('ui.review.hint')}</p>
        <EpisodeRecord entries={session.review()} t={t} />
      </section>
      <p className="replay-hint">{t('ui.review.replay')}</p>
      <button className="primary-button" type="button" onClick={e => { if (e.detail < 2) { playUiCue('continue'); session.restart(snapshot.revision); } }}>{t('ui.restart')}<span aria-hidden="true">↗</span></button>
    </section> : <section className="complete-screen" role="alert"><p>{t('ui.error')}</p><button className="primary-button" type="button" onClick={() => session.restart(snapshot.revision)}>{t('ui.restart')}</button></section>}
    <footer className="game-footer"><div className="progress-block"><span>{t('ui.progress')}</span>
      <progress aria-label={t('ui.progress')} value={snapshot.phase === 'complete' ? snapshot.total : snapshot.completed} max={snapshot.total} /></div>
      {snapshot.phase === 'playing' ? <span className="save-hint" aria-label={t('ui.autosave')}>● {t('ui.autosave')}</span> : null}
      <span className="keyboard-hint">{t('ui.keyboard')}</span>
      {import.meta.env.DEV ? <button className="debug-toggle" type="button" aria-expanded={debugOpen} onClick={() => setDebugOpen(v => !v)}>{t('ui.debug')}</button> : null}
    </footer>
    {import.meta.env.DEV && debugOpen && DebugPanel ? <Suspense fallback={null}><DebugPanel state={snapshot.state} dialogue={snapshot.dialogue} t={t} close={() => setDebugOpen(false)} /></Suspense> : null}
  </main>;
}

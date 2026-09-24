import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { COMPANY_NAME } from '../app/brand';
import { formatCharacterIdentity } from '../app/character-label';
import { projectSupportAssistedActions, strategyActionExecutionChoiceId, strategyActionsForMapTarget, strategyActionsForTarget } from '../app/strategy-actions';
import type { StrategyAction } from '../app/strategy-actions';
import type { StrategyVisualAssets } from '../app/strategy-assets';
import type { StrategyView } from '../app/strategy-view';
import type { FieldFrictionKind } from '../app/strategy-frictions';
import { PRODUCTION_MAP_ANCHOR_IDS, STRATEGY_ZONE_ANCHOR_IDS, productionMapPoint, productionMapStyle } from '../app/production-map';
import { STRATEGY_CAMERA_FOCUS_ZOOM, strategyCameraAfterPan, strategyCameraAfterPinch, strategyCameraForPoint, strategyCameraOverview, type StrategyCameraBounds, type StrategyCameraState } from '../app/strategy-camera';
import type { StrategySignalKind } from '../app/strategy-signals';
import { StrategyLoopPanel } from './StrategyLoopPanel';
import { StrategyPsiSixPanel } from './StrategyPsiSixPanel';
import type { StrategyMapOutcome } from './StrategyLoopPanel';

export interface StrategyMapCopy {
  readonly brand: string;
  readonly day: string;
  readonly stage: string;
  readonly psi: string;
  readonly objectives: string;
  readonly assignments: string;
  readonly roster: string;
  readonly site: string;
  readonly events: string;
  readonly progress: string;
  readonly pressures: string;
  readonly focus: string;
  readonly focusHint: string;
  readonly actions: string;
  readonly actionHint: string;
}

export interface StrategyPersonLabel {
  readonly name: string;
  readonly role: string;
  readonly trade?: string;
}

export interface StrategySupportItem {
  readonly item_id: string;
  readonly category: 'facility' | 'equipment';
  readonly name_text_id: string;
  readonly remaining: number;
  readonly active: boolean;
  readonly enabled: boolean;
}

function signalIcon(kind: StrategySignalKind): string {
  switch (kind) {
    case 'ramp': return '↗';
    case 'vehicle': return '▣';
    case 'overlap': return '⇄';
    case 'access': return '!';
  }
}

function frictionIcon(kind: FieldFrictionKind): string {
  switch (kind) {
    case 'schedule_pressure': return '◷';
    case 'coordination_conflict': return '⇆';
    case 'reporting_hesitation': return '…';
    case 'hierarchy_pressure': return '▲';
    case 'responsibility_shift': return '↔';
    case 'inspection_pressure': return '✓';
  }
}

export function StrategyMapShell({
  view, copy, text, person, actions = [], onAction, visualAssets, outcome, onOutcomeContinue, onOutcomeReconsider,
  supportItems = [], onSupportItemUse, onReturn, eventTitle, transitionPrompt, onTransitionContinue,
}: {
  readonly view: StrategyView;
  readonly copy: StrategyMapCopy;
  readonly text: (textId: string) => string;
  readonly person: (characterId: string) => StrategyPersonLabel | undefined;
  readonly actions?: readonly StrategyAction[];
  readonly onAction?: (action: StrategyAction) => void;
  readonly visualAssets?: StrategyVisualAssets;
  readonly outcome?: StrategyMapOutcome;
  readonly onOutcomeContinue?: () => void;
  readonly onOutcomeReconsider?: () => void;
  readonly supportItems?: readonly StrategySupportItem[];
  readonly onSupportItemUse?: (itemId: string) => void;
  readonly onReturn?: () => void;
  readonly eventTitle?: string;
  readonly transitionPrompt?: string;
  readonly onTransitionContinue?: () => void;
}) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [actionFocusId, setActionFocusId] = useState<string | null>(null);
  const [camera, setCamera] = useState<StrategyCameraState>({ x: 0, y: 0, zoom: 1 });
  const cameraStateRef = useRef<StrategyCameraState>(camera);
  const cameraViewportRef = useRef<HTMLElement | null>(null);
  const cameraWorldRef = useRef<HTMLDivElement | null>(null);
  const pointerPositions = useRef(new Map<number, { x: number; y: number }>());
  const panGesture = useRef<{ x: number; y: number; camera: StrategyCameraState } | null>(null);
  const pinchGesture = useRef<{ distance: number; camera: StrategyCameraState } | null>(null);
  const [cameraDragging, setCameraDragging] = useState(false);
  const previousActionNodeKey = useRef('');
  const actionNodeKey = [...new Set(actions.map(action => `${action.instance_id}:${action.node_id}`))].join('|');
  useEffect(() => {
    // Keep a selection while context/dialogue opens choices for the same node,
    // but never carry one judgment node's target into the next actionable node.
    setActionFocusId(null);
    if (!actionNodeKey) return;
    if (previousActionNodeKey.current && previousActionNodeKey.current !== actionNodeKey) {
      setFocusId(null);
    }
    previousActionNodeKey.current = actionNodeKey;
  }, [actionNodeKey]);
  const effectiveFocusId = actionFocusId ?? focusId;
  const activeSupportItemIds = supportItems.filter(item => item.active).map(item => item.item_id);
  const effectiveActions = projectSupportAssistedActions(actions, activeSupportItemIds);
  const actionsForMapTarget = (targetKey: string | null) =>
    strategyActionsForMapTarget(effectiveActions, targetKey, view.signals, view.placements);
  const directSelectedActions = strategyActionsForTarget(effectiveActions, focusId);
  const selectedActions = actionsForMapTarget(focusId);
  const selectedSignal = view.signals.find(signal => signal.signal_id === focusId);
  const guidedSignal = selectedSignal !== undefined && directSelectedActions.length === 0 && selectedActions.length > 0;
  const informationOnlySignal = selectedSignal !== undefined && directSelectedActions.length === 0 && selectedActions.length === 0;
  const roster = view.roster.slice(0, 5);
  const progress = Math.max(0, Math.min(100, view.construction.current_stage_progress));
  const focusedSignal = view.signals.find(signal => signal.signal_id === effectiveFocusId);
  const focusedPlacement = view.placements.find(placement => placement.character_id === effectiveFocusId);
  const focusedPerson = focusedPlacement ? person(focusedPlacement.character_id) : undefined;
  const focusedAnchor = effectiveFocusId?.startsWith('anchor:') ? effectiveFocusId.slice(7) : null;
  const anchorTitle = focusedAnchor ? text(`ui.strategy.zone.${focusedAnchor}`) : null;
  const focusTitle = focusedSignal
    ? text(focusedSignal.label_text_id)
    : focusedPerson ? formatCharacterIdentity(focusedPerson) : focusedPlacement?.character_id ?? anchorTitle ?? (effectiveFocusId === 'site' ? copy.site : null);
  const focusDetail = focusedPlacement
    ? ''
    : focusedSignal
      ? focusedSignal.signal_id === focusId && guidedSignal
        ? text('ui.strategy.signal_guided')
        : focusedSignal.signal_id === focusId && informationOnlySignal
          ? text('ui.strategy.signal_info_only')
          : copy.events
      : focusedAnchor ? text('ui.strategy.zone_hint') : effectiveFocusId === 'site' ? copy.actionHint : '';
  const hasActionsFor = (targetKey: string): boolean => actionsForMapTarget(targetKey).length > 0;
  const actionTargetLabel = (action: StrategyAction): string => {
    if (action.target.kind === 'character') return formatCharacterIdentity(person(action.target.character_id)) || action.target.character_id;
    if (action.target.kind === 'signal') {
      const signalId = action.target.signal_id;
      const signal = view.signals.find(item => item.signal_id === signalId);
      return signal ? text(signal.label_text_id) : copy.site;
    }
    if (action.target.kind === 'anchor') return text(`ui.strategy.zone.${action.target.anchor}`);
    return copy.site;
  };
  const executeAction = (action: StrategyAction) => {
    if (!onAction) return;
    const executionChoiceId = strategyActionExecutionChoiceId(action);
    const engineAction = actions.find(candidate => candidate.instance_id === action.instance_id
      && candidate.node_id === action.node_id && candidate.choice_id === executionChoiceId);
    onAction(engineAction ?? action);
  };

  const zones = STRATEGY_ZONE_ANCHOR_IDS;
  const zoneSummary = Object.fromEntries(zones.map(zone => [
    zone,
    {
      workers: view.placements.filter(placement => placement.anchor === zone).length,
      signals: view.signals.filter(signal => signal.anchor === zone).length,
    },
  ])) as Record<(typeof zones)[number], { workers: number; signals: number }>;
  const hasBackgroundArt = visualAssets?.background_uri !== undefined;
  const sceneElements = view.scene.elements ?? [];
  const moneyValue = `₩${Math.max(0, view.resources.money).toLocaleString('ko-KR')}`;
  const timeValue = view.resources.display_time ?? text(`ui.slot.${view.resources.time_slot.toLowerCase()}`);
  const safetyValue = `${text('ui.resource.safety_signals')} ${view.resources.safety_signal_count}`;
  const playerMapAnchor = view.placements.find(placement => placement.character_id === 'player')?.anchor ?? 'overview';
  const loopPhase = outcome ? 'result' : focusId ? 'action' : 'target';

  const cameraFocusAnchor = focusedSignal?.anchor
    ?? focusedPlacement?.anchor
    ?? (focusedAnchor && PRODUCTION_MAP_ANCHOR_IDS.includes(focusedAnchor as (typeof PRODUCTION_MAP_ANCHOR_IDS)[number])
      ? focusedAnchor as (typeof PRODUCTION_MAP_ANCHOR_IDS)[number]
      : null);

  const cameraBounds = (): StrategyCameraBounds | null => {
    const viewport = cameraViewportRef.current;
    const world = cameraWorldRef.current;
    if (!viewport || !world || viewport.clientWidth <= 0 || viewport.clientHeight <= 0 || world.offsetWidth <= 0 || world.offsetHeight <= 0) {
      return null;
    }
    return {
      viewportWidth: viewport.clientWidth,
      viewportHeight: viewport.clientHeight,
      worldWidth: world.offsetWidth,
      worldHeight: world.offsetHeight,
    };
  };

  const applyCamera = (next: StrategyCameraState) => {
    cameraStateRef.current = next;
    setCamera(next);
  };

  const resetCamera = () => {
    const bounds = cameraBounds();
    if (!bounds) return;
    applyCamera(strategyCameraOverview(bounds, productionMapPoint('overview')));
  };

  const focusCameraOnAnchor = (anchor: (typeof PRODUCTION_MAP_ANCHOR_IDS)[number]) => {
    const bounds = cameraBounds();
    if (!bounds) return;
    applyCamera(strategyCameraForPoint(productionMapPoint(anchor), bounds, STRATEGY_CAMERA_FOCUS_ZOOM));
  };

  useEffect(() => {
    const viewport = cameraViewportRef.current;
    const world = cameraWorldRef.current;
    if (!viewport || !world) return;

    const syncCamera = () => {
      if (loopPhase === 'result' || !cameraFocusAnchor) {
        resetCamera();
      } else {
        focusCameraOnAnchor(cameraFocusAnchor);
      }
    };

    syncCamera();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(syncCamera);
    observer.observe(viewport);
    observer.observe(world);
    return () => observer.disconnect();
  }, [cameraFocusAnchor, loopPhase]);

  const pointerDistance = () => {
    const [first, second] = [...pointerPositions.current.values()];
    if (!first || !second) return 0;
    return Math.hypot(first.x - second.x, first.y - second.y);
  };

  const pointerFocalPoint = () => {
    const viewport = cameraViewportRef.current;
    const [first, second] = [...pointerPositions.current.values()];
    if (!viewport || !first || !second) return { x: 0, y: 0 };
    const rect = viewport.getBoundingClientRect();
    return {
      x: ((first.x + second.x) / 2) - rect.left,
      y: ((first.y + second.y) / 2) - rect.top,
    };
  };

  const handleCameraPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea')) return;

    pointerPositions.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setCameraDragging(true);

    if (pointerPositions.current.size === 1) {
      panGesture.current = { x: event.clientX, y: event.clientY, camera: cameraStateRef.current };
      pinchGesture.current = null;
    } else if (pointerPositions.current.size === 2) {
      panGesture.current = null;
      pinchGesture.current = {
        distance: Math.max(1, pointerDistance()),
        camera: cameraStateRef.current,
      };
    }
  };

  const handleCameraPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!pointerPositions.current.has(event.pointerId)) return;
    pointerPositions.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const bounds = cameraBounds();
    if (!bounds) return;

    if (pointerPositions.current.size === 1 && panGesture.current) {
      const [only] = [...pointerPositions.current.values()];
      if (!only) return;
      applyCamera(strategyCameraAfterPan(
        panGesture.current.camera,
        only.x - panGesture.current.x,
        only.y - panGesture.current.y,
        bounds,
      ));
      return;
    }

    if (pointerPositions.current.size >= 2 && pinchGesture.current) {
      const distance = Math.max(1, pointerDistance());
      applyCamera(strategyCameraAfterPinch(
        pinchGesture.current.camera,
        distance / pinchGesture.current.distance,
        pointerFocalPoint(),
        bounds,
      ));
    }
  };

  const releaseCameraPointer = (event: ReactPointerEvent<HTMLElement>) => {
    pointerPositions.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (pointerPositions.current.size === 1) {
      const [remaining] = [...pointerPositions.current.values()];
      if (remaining) {
        panGesture.current = { x: remaining.x, y: remaining.y, camera: cameraStateRef.current };
      }
      pinchGesture.current = null;
    } else if (pointerPositions.current.size === 0) {
      panGesture.current = null;
      pinchGesture.current = null;
      setCameraDragging(false);
    }
  };

  const cameraStyle = {
    '--strategy-camera-x': `${camera.x}px`,
    '--strategy-camera-y': `${camera.y}px`,
    '--strategy-camera-zoom': camera.zoom,
  } as CSSProperties;


  return <main className="strategy-shell" data-stage={view.construction.stage_id} data-visual-mode={hasBackgroundArt ? 'art' : 'css'} data-loop-phase={loopPhase}>
    {visualAssets?.background_uri ? <img className="strategy-world-backdrop" src={visualAssets.background_uri} alt="" aria-hidden="true" /> : null}
    <div className="strategy-world-atmosphere" aria-hidden="true" />
    <div className="strategy-entry-slate" aria-hidden="true">
      <span>PSI FIELD / DAY {view.clock.day}</span>
      <strong>{copy.stage} · {view.construction.stage_id}</strong>
      <small>SCAN COMPLETE · OBSERVE · ANALYZE · PLAN</small>
    </div>
    <header className="strategy-hud">
      <div className="strategy-brand">
        {onReturn ? <button className="gameplay-home-button" type="button" onClick={onReturn} aria-label={text('ui.hub.return')} title={text('ui.hub.return')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10" /></svg>
        </button> : null}
        <span className="strategy-hardhat" aria-hidden="true">⛑</span><div><strong>{copy.brand}</strong><small>{COMPANY_NAME}</small></div>
      </div>
      <div className="strategy-resource-bar" aria-label={`${text('ui.resource.money')} ${text('ui.resource.time')} ${text('ui.resource.schedule')} ${text('ui.resource.safety')}`}>
        <article data-resource="money"><span>{text('ui.resource.money')}</span><strong>{moneyValue}</strong></article>
        <article data-resource="time"><span>{text('ui.resource.time')}</span><strong>{timeValue}</strong></article>
        <article data-resource="schedule"><span>{text('ui.resource.schedule')}</span><strong>{view.resources.schedule_progress}%</strong></article>
        <article data-resource="safety" data-signal-count={view.resources.safety_signal_count}><span>{text('ui.resource.safety')}</span><strong>{safetyValue}</strong></article>
      </div>
      <div className="strategy-day"><span>{copy.day}</span><strong>{view.clock.day}</strong></div>
    </header>

    <section className="strategy-event-title" aria-label={text('ui.strategy.situation')}>
      <span>{text('ui.strategy.situation')}</span>
      <strong>{eventTitle ?? copy.events}</strong>
    </section>

    <nav className="strategy-loop-stage-strip" aria-label={text('ui.strategy.loop.label')}>
      {(['target','action','result'] as const).map((stage,index) => {
        const order = { target:0, action:1, result:2 } as const;
        const current = order[loopPhase];
        return <span key={stage} className={index === current ? 'is-active' : index < current ? 'is-done' : ''}>
          {text(`ui.strategy.loop.${stage}`)}
        </span>;
      })}
    </nav>

    <aside className="strategy-rail" aria-label={copy.objectives}>
      <StrategyPsiSixPanel psi={view.psi} text={text} />

      <section className="strategy-panel strategy-objectives">
        <h2>{copy.objectives}</h2>
        <p>{copy.stage}<strong>{view.construction.stage_id}</strong></p>
        <p>{copy.progress}<strong>{progress}%</strong></p>
      </section>

      <section className="strategy-panel strategy-friction-panel" aria-label={copy.pressures}>
        <h2>{copy.pressures}</h2>
        <div className="strategy-friction-list">
          {view.frictions.length ? view.frictions.map(friction => <article key={friction.friction_id} data-friction={friction.friction_id}>
            <span aria-hidden="true">{frictionIcon(friction.kind)}</span>
            <div><strong>{text(friction.label_text_id)}</strong><small>{text(friction.detail_text_id)}</small></div>
          </article>) : <p className="strategy-friction-empty">-</p>}
        </div>
      </section>

      <section className="strategy-panel strategy-focus-panel" aria-live="polite">
        <h2>{copy.focus}</h2>
        {focusTitle ? <p><strong>{focusTitle}</strong><span>{focusDetail}</span></p> : <small>{copy.focusHint}</small>}
      </section>

      <button type="button" className={hasActionsFor('site') ? 'has-actions' : ''} onClick={() => setFocusId('site')}>
        <span aria-hidden="true">⌖</span>{copy.site}{hasActionsFor('site') ? <b>{actionsForMapTarget('site').length}</b> : null}
      </button>
      <button type="button"><span aria-hidden="true">⚠</span>{copy.events}<b>{view.signals.length}</b></button>
      <button type="button"><span aria-hidden="true">▦</span>{copy.assignments}<b>{view.assignments.length}</b></button>

      {supportItems.length ? <section className="strategy-support-panel" aria-label={text('ui.paid_item.support_title')}>
        <h2>{text('ui.paid_item.support_title')}</h2>
        <div className="strategy-support-list">
          {supportItems.map(item => <article key={item.item_id} data-support-item={item.item_id} data-support-active={item.active ? 'true' : 'false'}>
            <span>{text(`ui.paid_item.${item.category}`)}</span>
            <strong>{text(item.name_text_id)}</strong>
            {item.active ? <em>{text('ui.paid_item.active')}</em> : <button
              type="button"
              disabled={!item.enabled}
              onClick={() => item.enabled && onSupportItemUse?.(item.item_id)}
            >{item.category === 'facility' ? text('ui.paid_item.deploy') : text('ui.paid_item.commit')} · {text('ui.paid_item.owned')} {item.remaining}</button>}
          </article>)}
        </div>
      </section> : null}
    </aside>

    <section
      ref={cameraViewportRef}
      className={`strategy-map${effectiveFocusId === 'site' ? ' is-site-focused' : ''}${hasBackgroundArt ? ' has-background-art' : ''}`}
      aria-label={copy.site}
      data-scene={view.scene.scene_id}
      data-environment={view.scene.environment}
      data-production-map="v1"
      data-camera="hd02"
      data-camera-dragging={cameraDragging ? 'true' : 'false'}
      data-camera-zoom={camera.zoom.toFixed(2)}
      onPointerDown={handleCameraPointerDown}
      onPointerMove={handleCameraPointerMove}
      onPointerUp={releaseCameraPointer}
      onPointerCancel={releaseCameraPointer}
    >
      <div ref={cameraWorldRef} className="strategy-map-camera strategy-map-camera-world" style={cameraStyle} aria-hidden="true">
      <div className="strategy-production-layer" aria-hidden="true">
        <i className="strategy-production-grid" />
        <i className="strategy-production-route" />
        <b className="strategy-production-pulse" />
      </div>
      {visualAssets?.background_uri ? <img className="strategy-map-background-art" src={visualAssets.background_uri} alt="" aria-hidden="true" /> : null}
      <div className="strategy-map-css-scene" aria-hidden={hasBackgroundArt ? 'true' : undefined}>
        <div className="strategy-map-sky" />
        <div className="strategy-map-road strategy-map-road-a" />
        <div className="strategy-map-road strategy-map-road-b" />
        <div className="strategy-site-building strategy-building-main"><span>5F</span><i /><i /><i /><i /></div>
        <div className="strategy-site-building strategy-building-side"><span>3F</span><i /><i /><i /></div>
        <div className="strategy-site-core"><span>CORE</span></div>
        <div className="strategy-tower-crane"><i /><b /><em /></div>
        <div className="strategy-site-yard"><span>{view.assignments.length}</span><small>{copy.assignments}</small></div>
      </div>
      </div>
      <div className="strategy-map-stage-card">
        <span>{copy.stage}</span>
        <strong>{view.construction.stage_id}</strong>
        <progress value={progress} max={100} aria-label={copy.progress} />
      </div>

      <aside className="strategy-overview-minimap" aria-label="현장 전체도" data-production-map="v1">
        <header><strong>현장 전체도</strong><span>N</span></header>
        <div className="strategy-minimap-plan" aria-hidden="true">
          <i className="mini-building mini-building-a" />
          <i className="mini-building mini-building-b" />
          <i className="mini-building mini-building-c" />
          {PRODUCTION_MAP_ANCHOR_IDS.map(anchor => <b
            key={anchor}
            className={`mini-zone mini-zone-${anchor}`}
            data-anchor={anchor}
            data-alert={view.signals.some(signal => signal.anchor === anchor) ? 'true' : 'false'}
            style={productionMapStyle(anchor, 'minimap')}
          />)}
          <em className="mini-player" data-anchor={playerMapAnchor} style={productionMapStyle(playerMapAnchor, 'player')} />
        </div>
        <footer><span>● 작업구역</span><span>● 위험신호</span></footer>
      </aside>

      <button
        type="button"
        className="strategy-camera-recenter"
        aria-label={text('ui.strategy.return_map')}
        title={text('ui.strategy.return_map')}
        onClick={resetCamera}
      ><span aria-hidden="true">⌖</span></button>

      <div className="strategy-map-camera strategy-map-camera-interaction" style={cameraStyle}>
      <div className="strategy-zone-layer" aria-label={text('ui.strategy.zones')}>
        {zones.map(zone => {
          const key = `anchor:${zone}`;
          return <button
            key={zone}
            type="button"
            data-zone={zone}
            className={`strategy-zone-target zone-${zone}${effectiveFocusId === key ? ' is-focused' : ''}${hasActionsFor(key) ? ' has-actions' : ''}`}
            data-production-anchor={zone}
            style={productionMapStyle(zone, 'zone')}
            onClick={() => setFocusId(key)}
          ><span className="strategy-zone-copy">
            <strong>{text(`ui.strategy.zone.${zone}`)}</strong>
            <small>배치 {zoneSummary[zone].workers} · 위험 {zoneSummary[zone].signals}</small>
          </span>{hasActionsFor(key) ? <b>{actionsForMapTarget(key).length}</b> : null}</button>;
        })}
      </div>

      {sceneElements.length ? <div className="strategy-scene-element-layer" aria-label="현장 위험요소 및 소품">
        {sceneElements.map(element => {
          const visual = visualAssets?.scene_elements?.[element.element_id];
          const artStyle = {
            ...productionMapStyle(element.anchor, 'scene-element'),
            ...(visual ? {
              width: `${visual.map_max_px}px`,
              transform: `translate(${-visual.pivot_x * 100}%, ${-visual.pivot_y * 100}%)`,
            } : {}),
          };
          return <div
            className={`strategy-scene-element scene-element-${element.anchor} scene-element-${element.kind}${visual ? ' has-art' : ''}`}
            data-scene-element={element.element_id}
            data-scene-element-key={element.catalog_key}
            data-production-anchor={element.anchor}
            data-production-status={element.production_status}
            data-visual={visual ? 'asset' : 'css'}
            key={`${element.element_id}:${element.anchor}`}
            title={element.label}
            style={artStyle}
          >
            {visual
              ? <img className="strategy-scene-element-art" src={visual.uri} alt="" aria-hidden="true" />
              : <><span aria-hidden="true">{element.visual_token}</span><small>{element.label}</small></>}
          </div>;
        })}
      </div> : null}

      <div className="strategy-worker-layer">
        {view.placements.map(placement => {
          const label = person(placement.character_id);
          const nearSignal = placement.nearby_signal_ids.length > 0;
          const key = placement.character_id;
          const visual = visualAssets?.characters[placement.character_id];
          return <button
            className={`strategy-map-worker worker-${placement.anchor}${placement.scene_participant ? ' is-scene-participant' : ''}${nearSignal ? ' is-near-signal' : ''}${effectiveFocusId === key ? ' is-focused' : ''}${hasActionsFor(key) ? ' has-actions' : ''}${visual?.map_uri ? ' has-art' : ''}`}
            data-character={placement.character_id}
            data-art-surface="map"
            data-scene-participant={placement.scene_participant ? 'true' : 'false'}
            data-action-count={actionsForMapTarget(key).length}
            data-production-anchor={placement.anchor}
            data-visual={visual?.map_uri ? 'asset' : 'css'}
            key={placement.character_id}
            type="button"
            style={productionMapStyle(placement.anchor, 'character')}
            onClick={() => {
              const anchorKey = `anchor:${placement.anchor}`;
              setFocusId(hasActionsFor(key) ? key : hasActionsFor(anchorKey) ? anchorKey : key);
            }}
          >
            {visual?.map_uri
              ? <img className="strategy-worker-art" src={visual.map_uri} alt="" aria-hidden="true" />
              : <span className="strategy-worker-figure" aria-hidden="true"><i className="worker-helmet" /><i className="worker-head" /><i className="worker-body" /></span>}
            <span className="strategy-worker-label" style={visual ? { borderColor: visual.accent } : undefined}>
              <strong>{label ? formatCharacterIdentity(label) : placement.character_id}{!label && placement.role_id ? <em> · {placement.role_id}</em> : null}</strong>
            </span>
            {nearSignal ? <b className="strategy-worker-alert" aria-label={copy.events}>!</b> : null}
          </button>;
        })}
      </div>

      <div className="strategy-signal-layer" aria-live="polite">
        {view.signals.map(signal => {
          const key = signal.signal_id;
          return <button
            className={`strategy-risk-signal signal-${signal.anchor} signal-${signal.kind}${effectiveFocusId === key ? ' is-focused' : ''}${hasActionsFor(key) ? ' has-actions' : ''}`}
            data-signal={signal.signal_id}
            data-action-count={actionsForMapTarget(key).length}
            data-production-anchor={signal.anchor}
            key={signal.signal_id}
            type="button"
            style={productionMapStyle(signal.anchor, 'signal')}
            onClick={() => setFocusId(key)}
          >
            <span aria-hidden="true">{signalIcon(signal.kind)}</span>
            <strong>{text(signal.label_text_id)}</strong>
          </button>;
        })}
      </div>
      </div>

    </section>

    <StrategyLoopPanel
      actions={effectiveActions}
      selectedActions={selectedActions}
      focusId={focusId}
      focusTitle={focusTitle}
      text={text}
      personName={id => formatCharacterIdentity(person(id)) || id}
      targetLabel={actionTargetLabel}
      onAction={executeAction}
      outcome={outcome}
      onOutcomeContinue={onOutcomeContinue}
      onOutcomeReconsider={onOutcomeReconsider}
      onActionFocus={setActionFocusId}
      guidanceText={guidedSignal ? text('ui.strategy.signal_guided') : undefined}
      emptyText={informationOnlySignal ? text('ui.strategy.signal_info_only') : undefined}
      transitionPrompt={transitionPrompt}
      onTransitionContinue={onTransitionContinue}
    />

    <footer className="strategy-roster" aria-label={copy.roster}>
      <div className="roster-title"><span>{copy.roster}</span><strong>{view.roster.length}</strong></div>
      {roster.map((character, index) => {
        const label = person(character.character_id);
        const visual = visualAssets?.characters[character.character_id];
        return <article className="strategy-character" key={character.character_id}>
          <div className="character-token" aria-hidden="true">{visual?.portrait_uri ? <img src={visual.portrait_uri} alt="" /> : index + 1}</div>
          <div><strong>{formatCharacterIdentity(label) || character.character_id}</strong><span>{character.available ? '●' : '○'} {character.experience}</span></div>
        </article>;
      })}
    </footer>
  </main>;
}

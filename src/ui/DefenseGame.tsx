import {resolveCharacterBrandingUri} from '../app/character-branding';
import {defensePressureWaveGroups} from '../engine/defense-sensor-pressure';
import pressureArt from '../../content/defense/guard-pressure-art-v1.json';
import {GuardSensorPressureOverlay,guardPressureReadout} from './GuardSensorPressure';
import {recordEncounterIntel,openEncounterIntel,encounterIntelTitle} from '../app/signal-encounter-intel';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { EpisodeSession } from '../app/episode-session';
import { characterPortraitUri,characterMapUri } from '../app/episode-visual-assets';
import { defenseSupportCharacterId } from '../app/defense-support';
import { defenseText as t } from '../app/defense-text';
import { defenseBoardArtUri, defenseControlPqComposite, defenseControlTowerProductionEntry, defenseEnemyArtUri, defenseG8aTowerVisual, defenseG8aWorldFinalAsset, defenseProductionMapEntry, defensePulseTowerProductionEntry, defenseSwiftPqAsset, defenseTowerArtUri, defenseVisualProduction } from '../app/defense-visual-assets';
import { defenseMapFrame, defenseMapPointPercent, defenseMapViewBox } from '../app/defense-map-framing';
import { defenseVisualPadPoint, defenseVisualPath, defenseVisualPositionAtDistance } from '../app/defense-visual-projection';
import { useDefensePersistence } from '../app/use-defense-persistence';
import { readDataCenterState } from '../app/data-center-state';
import { readRemodelState } from '../app/remodel-state';
import { dataCenterDefense, dataCenterScenario } from '../content/data-center';
import { zeroBreachContent } from '../content/defense';
import { remodelDefense, remodelScenario } from '../content/remodel';
import { siteDefenseContentForScenario, siteProcessMapByMapId } from '../content/site-process-maps';
import {
  defenseContentForScenario, defenseEventById, defenseEvents, resolveDefenseContentForRun,
} from '../content/defense-events';
import { defenseEventAvailabilityFromState } from '../app/defense-story-bridge';
import type {
  DefenseCombatShot, DefenseContent, DefenseEnemyId, DefenseRunState, DefenseSupportId, DefenseTowerId, DefenseTowerState,
} from '../domain/defense';
import {
  advanceDefenseWithCombat, applyDefenseCommand, canUndoDefenseBuild, defenseResult, defenseSupportHasTarget,
} from '../engine/defense';
import type { StoragePort } from '../platform/storage';
import { VisualImage } from './VisualSlot';
import { DefenseConflictOverlay, DefensePersistenceGate, DefenseSaveStatus } from './DefensePersistenceGate';
import { DefenseTutorial, useDefenseTutorial } from './DefenseTutorial';
import { applyDefCoreOneStepRuntime, DefCoreOneStepBoardOverlay, DefCoreOneStepOverlay, useDefCoreOneStep } from './DefCoreOneStep';
import {GUARD_ENTRY,guardContents,guardStageIds,guardStageUnlocked,guardSupportUnlocked,guardSupportUnlockStage,isGuardMap,isGuardScenario} from '../content/guard-campaign';
import {defenseEnemyPath,defenseRoutes} from '../engine/defense-geometry';
import {GuardBattleFields,GuardEvolutionFX,GuardBattleFeedback,GuardWaveMeter} from './GuardBattleAtmosphere';
import {GuardWorldLighting,GuardEquipmentRig,GuardRiskAura} from './GuardCinematicWorld';
import './guard-immersion.css';
import './guard-cinematic.css';
import {GuardSpatialControls} from './GuardSpatialControls';
import {guardStoragePort,GUARD_SAVE_KEY} from '../app/guard-storage';
import {guardPersistenceContent} from '../app/guard-save-version';
import {GuardCampaignHome} from './GuardCampaignHome';
import {GuardWaveIntel} from './GuardWaveIntel';
import {GuardTacticalDebrief} from './GuardTacticalDebrief';
import {guardTacticalReport,guardDebriefAdvice} from '../app/guard-tactical-report';
import {readGuardPlanningStyle,writeGuardPlanningStyle} from '../app/guard-planning-style';
import { useDefenseAudio } from './useDefenseAudio';
import {DefenseCombatFX,useDefenseCombatFX} from './DefenseCombatFX';
import { useDefenseEffects } from './useDefenseEffects';
import { useDefenseCamera } from './useDefenseCamera';
import { SiteProcessMapBoardOverlay } from './SiteProcessMapBoardOverlay';
import { RemodelBoardOverlay } from './RemodelBoardOverlay';
import { DataCenterBoardOverlay } from './DataCenterBoardOverlay';
import { G8AActivityOverlay } from './G8AActivityOverlay';
import { FieldHazardsOverlay } from './FieldHazardsOverlay';
import {OperationHandoffDossier} from './OperationHandoffDossier';
import {defensePlanningWave, recommendDefenseAction} from '../app/defense-tactics';
import {DefenseTechTree} from './DefenseTechTree';
import './defense-tactics.css';
import {defensePremiumArt,DEFENSE_PREMIUM_HERO} from '../app/defense-premium-art';
import './defense-premium.css';
import './guard-usability.css';
import './guard-mobile.css';
import {useGuardBoardFit} from './use-guard-board-fit';
import {GuardMobileInfo} from './GuardMobileInfo';

function statusLabel(state: DefenseRunState): string {
  return t(`defense.ui.${state.status.toLowerCase()}`);
}

function towerDefinition(content: DefenseContent, id: DefenseTowerId) {
  return content.towers.find(item => item.id === id)!;
}

function towerLevel(content: DefenseContent, tower: DefenseTowerState) {
  return towerDefinition(content, tower.towerId).levels.find(level => level.id === tower.levelId)!;
}

const G8A_MAP_ID = 'map-apt-bottom-up-excavation-01';

function enemyName(mapId: string, id: DefenseEnemyId) {
  return t(mapId === G8A_MAP_ID ? `defense.g8a.enemy.${id}.name` : `defense.enemy.${id}.name`);
}

function towerName(mapId: string, id: DefenseTowerId) {
  return t(mapId === G8A_MAP_ID ? `defense.g8a.tower.${id}.name` : `defense.tower.${id}.name`);
}

function towerRole(mapId: string, id: DefenseTowerId) {
  return t(mapId === G8A_MAP_ID ? `defense.g8a.tower.${id}.role` : `defense.tower.${id}.role`);
}

function recommendedTowerForLeaks(leaks: DefenseRunState['leakedByEnemy']): DefenseTowerId {
  const entries = (Object.entries(leaks) as [DefenseEnemyId, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  const enemy = entries[0]?.[0] ?? 'VEILED';
  if (enemy === 'VEILED') return 'SENSOR';
  if (enemy === 'SWARM') return 'BURST';
  if (enemy === 'SWIFT') return 'CONTROL';
  return 'PULSE';
}

function TowerGlyph({ content, tower }: { content: DefenseContent; tower: DefenseTowerState }) {
  const level = towerLevel(content, tower);
  const firing = tower.attackCooldown === level.intervalTicks;
  const revealing = tower.towerId === 'SENSOR'
    && typeof level.revealIntervalTicks === 'number'
    && tower.revealCooldown === level.revealIntervalTicks;
  const dedicatedControl = tower.towerId === 'CONTROL'
    && defenseControlTowerProductionEntry(tower.levelId)?.status === 'PRODUCTION_APPROVED';
  const dedicatedPulse = tower.towerId === 'PULSE'
    && defensePulseTowerProductionEntry(tower.levelId)?.status === 'PRODUCTION_APPROVED';
  const dedicatedTower = dedicatedControl || dedicatedPulse;
  const controlPq = tower.towerId === 'CONTROL' && tower.levelId === 'L1' && !dedicatedControl
    ? defenseControlPqComposite()
    : null;
  if (controlPq) {
    return <g
      className={`zb-tower zb-tower-production zb-control-pq${firing ? ' is-firing' : ''}`}
      data-pq-control="CONTROL:L1"
      data-tower-family={tower.towerId}
    >
      <ellipse cx="0" cy="25" rx="28" ry="6" className="zb-control-ground-shadow" aria-hidden="true" />
      {firing ? <g className="zb-control-intervention" aria-hidden="true">
        <ellipse cx="0" cy="20" rx="30" ry="8" />
        <path d="M-34 18H34M-24 14L-14 6M14 6L24 14M-14 6H14" />
      </g> : null}
      <image
        href={controlPq.barrierUri}
        x="-28"
        y="-7"
        width="56"
        height="35"
        preserveAspectRatio="xMidYMid meet"
        className="zb-control-pq-barrier"
        aria-hidden="true"
      />
      <image
        href={controlPq.marshalUri}
        x="5"
        y="-37"
        width="27"
        height="41"
        preserveAspectRatio="xMidYMid meet"
        className="zb-control-pq-marshal"
        aria-hidden="true"
      />
    </g>;
  }
  const g8aVisual = defenseG8aTowerVisual(content.map.id, tower.towerId, tower.levelId);
  if (g8aVisual) {
    return <g
      className={`zb-tower zb-tower-production zb-g8a-semantic-tower${firing ? ' is-firing' : ''}`}
      data-g8a-tower={tower.towerId}
      data-g8a-tower-level={tower.levelId}
      data-g8a-semantic={g8aVisual.semantic}
      data-g8a-tower-uri={g8aVisual.uri}
      data-g8a-tower-dedicated={dedicatedTower ? 'true' : undefined}
      data-g8a-control-dedicated={tower.towerId === 'CONTROL' && dedicatedControl ? 'true' : undefined}
      data-g8a-pulse-dedicated={tower.towerId === 'PULSE' && dedicatedPulse ? 'true' : undefined}
    >
      <ellipse cx="0" cy="20" rx="31" ry="8" className="zb-g8a-tower-ground-shadow" aria-hidden="true" />
      {firing ? <ellipse cx="0" cy="18" rx="38" ry="12" className="zb-g8a-intervention-cue" aria-hidden="true" /> : null}
      <image
        href={g8aVisual.uri}
        x={-g8aVisual.width / 2}
        y={-g8aVisual.height + 22}
        width={g8aVisual.width}
        height={g8aVisual.height}
        preserveAspectRatio="xMidYMid meet"
        className="zb-g8a-semantic-tower-image"
        aria-hidden="true"
      />
    </g>;
  }

  const artUri = defenseTowerArtUri(tower.towerId, tower.levelId,content.map.id);
  const premium=!!artUri&&(artUri.includes('/premium-v1/')||artUri.includes('/guard-p2-v1/'));
  if (artUri) {
    return <g
      className={`zb-tower zb-tower-production${firing ? ' is-firing' : ''}`}
      data-production-tower-art={`${tower.towerId}:${tower.levelId}`}
      data-tower-family={tower.towerId}
      data-premium-equipment={premium?'true':undefined}
    >
      {firing && tower.towerId !== 'CONTROL'&&!isGuardMap(content.map.id) ? <circle r="31" className="zb-attack-flash" aria-hidden="true" /> : null}
      {firing && tower.towerId === 'CONTROL'&&!isGuardMap(content.map.id) ? <g className="zb-control-intervention" aria-hidden="true">
        <ellipse cx="0" cy="20" rx="32" ry="9" />
        <path d="M-30 18L-18 8M18 8L30 18M-18 8H18" />
      </g> : null}
      {firing && tower.towerId === 'BURST'&&!isGuardMap(content.map.id) ? <circle r="48" className="zb-area-pulse" aria-hidden="true" /> : null}
      {revealing ? <circle r={isGuardMap(content.map.id)?level.revealRadius:58} className={isGuardMap(content.map.id)?'guard-reveal-range':'zb-detect-pulse'} aria-hidden="true" /> : null}
      {premium?<ellipse cx="0" cy="20" rx="28" ry="8" className="zb-premium-contact" aria-hidden="true"/>:null}
      {premium&&firing&&content.map.id!=='ramp-01'&&!isGuardMap(content.map.id)?<g className={`zb-premium-discharge is-${tower.towerId.toLowerCase()}`} aria-hidden="true">
        <path d="M21-29L49-16M25-34L57-26M20-39L47-45"/>
        <circle cx="30" cy="-31" r="9"/>
      </g>:null}
      <image
        href={artUri}
        x={premium?-54:-64}
        y={premium?-77:-98}
        width={premium?108:128}
        height={premium?108:128}
        preserveAspectRatio="xMidYMid meet"
        className="zb-tower-production-image"
      />
      {isGuardMap(content.map.id)?<GuardEquipmentRig content={content} tower={tower}/>:null}
      {premium?<g className="zb-premium-level" aria-hidden="true"><rect x="-20" y="24" width="40" height="15" rx="5"/><text y="35" textAnchor="middle">{tower.levelId}</text></g>:null}
    </g>;
  }
  return <g
    className={`zb-tower zb-tower-${tower.towerId.toLowerCase()}${firing ? ' is-firing' : ''}`}
    data-art-state="prototype"
  >
    <circle r="25" className="zb-tower-base" />
    {tower.towerId === 'PULSE' ? <>
      <circle r="14" className="zb-tower-core" />
      <path d="M-12 0h24M0-12v24" className="zb-tower-line" />
    </> : null}
    {tower.towerId === 'BURST' ? <>
      <polygon points="-17,-11 0,-20 17,-11 17,11 0,20 -17,11" className="zb-tower-core" />
      <circle r="7" className="zb-tower-line" />
    </> : null}
    {tower.towerId === 'CONTROL' ? <>
      <path d="M-16 12V-6Q0-22 16-6V12" className="zb-tower-line zb-tower-arch" />
      <circle r="5" className="zb-tower-core" />
    </> : null}
    {tower.towerId === 'SENSOR' ? <>
      <path d="M0 18V-8" className="zb-tower-line" />
      <circle cy="-9" r="10" className="zb-tower-core" />
      <circle cy="-9" r="17" className="zb-sensor-ring" />
    </> : null}
    <text y="40" textAnchor="middle">{tower.levelId}</text>
  </g>;
}

function EnemyGlyph({ content, enemy, state, isHit, counterRotate=false }: { content: DefenseContent; enemy: DefenseRunState['enemies'][number]; state: DefenseRunState; isHit: boolean;counterRotate?:boolean }) {
  const definition = content.enemies.find(item => item.id === enemy.enemyId)!;
  const pos = defenseVisualPositionAtDistance(content.map.id, defenseEnemyPath(content,enemy,state), enemy.distance);
  const hpRatio = Math.max(0, Math.min(1, enemy.hp / definition.hp));
  const hidden = definition.hidden && enemy.revealUntilTick <= state.tick && state.revealAllUntilTick <= state.tick;
  const bossArmor = definition.boss && enemy.bossArmorFromTick <= state.tick && state.tick < enemy.bossArmorUntilTick;
  const slowed = enemy.slowEffects.some(effect => effect.startTick <= state.tick && state.tick < effect.endTick);
  const revealed = definition.hidden && (enemy.revealUntilTick > state.tick || state.revealAllUntilTick > state.tick);
  const g8aDump = content.map.id === G8A_MAP_ID ? defenseSwiftPqAsset() : null;
  const swiftPq = enemy.enemyId === 'SWIFT' ? g8aDump : null;
  const pressureCore = isGuardMap(content.map.id) && state.sensorPressureEnabled === true && !!enemy.sensorPressure;
  const artUri = pressureCore ? pressureArt.core.uri : defenseEnemyArtUri(enemy.enemyId,content.map.id);
  const g8aRiskActor = content.map.id === G8A_MAP_ID;
  const showHp = !g8aRiskActor || definition.boss || hpRatio < 0.75;
  const g8aVehicleRisk = enemy.enemyId === 'SWIFT' || enemy.enemyId === 'ARMORED';
  const hpWidth = g8aRiskActor ? 28 : 44;
  const hpY = pressureCore ? -52 : g8aRiskActor ? (g8aVehicleRisk ? 31 : 8) : -31;
  const artSize = pressureCore ? 78 : definition.boss ? 92 : 60;
  const artY = pressureCore ? -49 : definition.boss ? -60 : -39;
  const vehicleState = enemy.enemyId === 'SWIFT'
    ? slowed ? 'BRAKE' : isHit ? 'THREAT' : 'CRUISE'
    : undefined;
  return <g
    transform={`translate(${pos.x} ${pos.y})${counterRotate?" rotate(-90)":""}`}
    className={`zb-enemy zb-enemy-${enemy.enemyId.toLowerCase()}${hidden ? ' is-hidden' : ''}${bossArmor ? ' has-boss-armor' : ''}${isHit ? ' is-hit' : ''}${(enemy.armorExposedUntilTick??0)>state.tick?' is-exposed':''}`}
    data-enemy={enemy.enemyId}
    data-pressure-core={pressureCore ? enemy.sensorPressure!.phase : undefined}
    style={isGuardMap(content.map.id)?{'--guard-motion-phase':`-${(enemy.spawnSequence%7)*.17}s`} as CSSProperties:undefined}
    data-distance={enemy.distance.toFixed(3)}
    data-motion-vehicle={enemy.enemyId === 'SWIFT' ? 'SWIFT' : undefined}
    data-vehicle-state={vehicleState}
    data-veiled-state={enemy.enemyId === 'VEILED' ? (hidden ? 'CONCEALED' : revealed ? 'REVEALED' : 'TRACKED') : undefined}
  >
    {isGuardMap(content.map.id)?<GuardRiskAura enemyId={enemy.enemyId} locked={(enemy.lockedUntilTick??0)>state.tick} armored={!!bossArmor}/>:null}
    {enemy.enemyId === 'VEILED' ? <ellipse cx="0" cy="8" rx="30" ry="16" className="zb-veiled-site-occlusion" aria-hidden="true" /> : null}
    {isHit && enemy.enemyId !== 'SWIFT' && enemy.enemyId !== 'VEILED' && !isGuardMap(content.map.id) ? <circle r="28" className="zb-impact-ring" aria-hidden="true" /> : null}
    {slowed && enemy.enemyId !== 'SWIFT' ? <circle r={definition.boss ? 42 : 24} className="zb-slow-ring" aria-hidden="true" /> : null}
    {slowed && enemy.enemyId === 'SWIFT' ? <g className="zb-swift-brake-cue" aria-hidden="true">
      <ellipse cx="-25" cy="19" rx="18" ry="5" />
      <ellipse cx="-38" cy="21" rx="11" ry="4" />
      <path d="M-31 14H-15M-37 19H-20M-42 23H-27" />
    </g> : null}
    {revealed ? <circle r={definition.boss ? 48 : 29} className="zb-reveal-ring" aria-hidden="true" /> : null}
    {bossArmor ? <circle r="50" className="zb-boss-armor-effect" aria-hidden="true" /> : null}
    {g8aRiskActor && enemy.enemyId === 'NORMAL' ? <g className="zb-g8a-risk-worker-wrap" data-g8a-risk-actor="WORKER_APPROACH" aria-hidden="true">
      <ellipse cx="0" cy="2" rx="11" ry="3.6" className="zb-g8a-risk-contact-shadow" />
      <image
        href={resolveCharacterBrandingUri('assets/episode01/characters/player-map.webp')}
        x="-15"
        y="-44"
        width="30"
        height="46"
        preserveAspectRatio="xMidYMax meet"
        className="zb-g8a-risk-worker"
      />
    </g> : g8aRiskActor && enemy.enemyId === 'SWARM' ? <g className="zb-g8a-risk-worker-group" data-g8a-risk-actor="WORKER_GROUP" aria-hidden="true">
      <ellipse cx="0" cy="3" rx="26" ry="5" className="zb-g8a-risk-contact-shadow" />
      <image href={resolveCharacterBrandingUri('assets/episode01/characters/lee-jaehoon-map.webp')} x="-25" y="-43" width="27" height="43" preserveAspectRatio="xMidYMax meet" />
      <image href={resolveCharacterBrandingUri('assets/episode01/characters/seo-jeongmin-map.webp')} x="-4" y="-49" width="29" height="45" preserveAspectRatio="xMidYMax meet" />
      <image href={resolveCharacterBrandingUri('assets/episode01/characters/player-map.webp')} x="-1" y="-37" width="25" height="39" preserveAspectRatio="xMidYMax meet" />
    </g> : g8aRiskActor && enemy.enemyId === 'ARMORED' && g8aDump ? <>
      <ellipse cx="0" cy="22" rx="37" ry="9" className="zb-swift-road-contact" aria-hidden="true" />
      <image
        href={g8aDump.uri}
        x="-46"
        y="-39"
        width="92"
        height="68"
        preserveAspectRatio="xMidYMid meet"
        className="zb-g8a-heavy-vehicle"
        data-g8a-risk-actor="HEAVY_VEHICLE"
        aria-hidden="true"
      />
    </> : swiftPq ? <>
      <ellipse cx="0" cy="20" rx="31" ry="8" className="zb-swift-road-contact" aria-hidden="true" />
      <image
        href={swiftPq.uri}
        x="-39"
        y="-34"
        width="78"
        height="58"
        preserveAspectRatio="xMidYMid meet"
        className="zb-swift-pq-asset"
        data-pq-swift="SWIFT"
        aria-hidden="true"
      />
    </> : artUri ? <g className={isGuardMap(content.map.id)?'guard-risk-suspension':undefined}><image
      href={artUri}
      x={-artSize / 2}
      y={artY}
      width={artSize}
      height={artSize}
      preserveAspectRatio="xMidYMid meet"
      className="zb-enemy-production-image"
      data-production-enemy-art={enemy.enemyId}
    /></g> : enemy.enemyId === 'SWIFT' ? <polygon points="-16,-9 18,0 -16,9 -7,0" data-art-state="prototype" /> :
      enemy.enemyId === 'ARMORED' ? <polygon points="-16,-14 8,-18 20,0 8,18 -16,14 -22,0" data-art-state="prototype" /> :
      enemy.enemyId === 'SWARM' ? <polygon points="-13,-4 -5,-14 4,-8 13,-13 16,-2 8,7 12,16 0,12 -9,18 -11,7 -20,3" data-art-state="prototype" /> :
      enemy.enemyId === 'VEILED' ? <>
        <circle r="17" className="zb-enemy-hollow" data-art-state="prototype" />
        <path d="M-13 0h7M6 0h7" className="zb-enemy-cut" />
      </> :
      enemy.enemyId === 'BOSS' ? <>
        <circle r="28" data-art-state="prototype" />
        <circle r="20" className="zb-boss-ring" />
        <circle r="10" className="zb-boss-core" />
      </> : <circle r="16" data-art-state="prototype" />}
    {showHp ? <g className={`zb-health-readout${g8aRiskActor ? ' is-grounded' : ''}`} aria-hidden="true">
      <rect x={-hpWidth / 2} y={hpY} width={hpWidth} height={g8aRiskActor ? 3 : 4} rx="2" className="zb-hp-track" />
      <rect x={-hpWidth / 2} y={hpY} width={hpWidth * hpRatio} height={g8aRiskActor ? 3 : 4} rx="2" className="zb-hp-fill" />
    </g> : null}
  </g>;
}

function SupportCard({
  session, supportId, onChoose,content,locked=false,unlockStage,
}: {
  session: EpisodeSession;
  supportId: DefenseSupportId;
  onChoose: () => void;
  content:DefenseContent;
  locked?:boolean;
  unlockStage?:number;
}) {
  const characterId = defenseSupportCharacterId(supportId);
  const character = session.character(characterId);
  const portrait = characterPortraitUri(characterId, id => session.assetUri(id));
  const body=characterMapUri(characterId,id=>session.assetUri(id));
  const support=content.supports.find(item=>item.id===supportId)!;
  return <button className="zb-support-card" type="button" onClick={()=>{if(!locked)onChoose();}} data-support={supportId} data-locked={locked?'true':undefined} aria-disabled={locked}>
    <VisualImage uri={body} alt="" className="zb-support-fullbody"/>
    <VisualImage uri={portrait} alt="" className="zb-support-portrait" />
    <span>
      <small>{t(`defense.art.${supportId}`)}</small>
      <strong>{character?.name ?? t(`defense.support.${supportId}.suggestedName`)}</strong>
      <em>{character?.role ?? ''}</em>
      <b>{t(isGuardMap(content.map.id)&&!['COORDINATOR','OBSERVER'].includes(supportId)?`guard.support.${supportId}`:`defense.support.${supportId}.skill`)}</b>
      <span className="zb-support-effects">
      {support.armorExposeTicks||support.readyOneTower||support.relocation||support.directionalRange?<em>{t(`guard.support.${supportId}.hint`)}</em>:null}
      {support.freezeMovementTicks>0?<span>{t('defense.art.stop')} <b>{support.freezeMovementTicks*content.tickMs/1000}{t('defense.art.seconds')}</b></span>:null}
      {support.revealAllTicks>0?<span>{t('defense.art.reveal')} <b>{support.revealAllTicks*content.tickMs/1000}{t('defense.art.seconds')}</b></span>:null}
      {support.rangeBonus>0?<span>{t('defense.art.range')} <b>+{support.rangeBonus}</b></span>:null}
      <span>{t('defense.art.cooldown')} <b>{support.cooldownTicks*content.tickMs/1000}{t('defense.art.seconds')}</b></span>
      </span>
    </span>
    <i>{locked?`${t('guard.crew.locked')} · GD-0${unlockStage} ${t('guard.crew.unlock')}`:t('defense.ui.support.choose')}</i>
  </button>;
}

export function DefenseGame({
  session, onExit, storage, onPractice, requestedScenarioId = zeroBreachContent.scenario.id,
}: {
  readonly session: EpisodeSession;
  readonly onExit: () => void;
  readonly storage?: StoragePort;
  readonly onPractice?:()=>void;
  readonly requestedScenarioId?: string | null;
}) {
  const campaignEntry=requestedScenarioId===GUARD_ENTRY;
  const campaignStorage=useMemo(()=>guardStoragePort(storage),[storage]);
  const persistence = useDefensePersistence(campaignEntry?guardPersistenceContent:zeroBreachContent, onExit, campaignEntry?campaignStorage:storage, resolveDefenseContentForRun,campaignEntry?GUARD_SAVE_KEY:undefined);
  const { state, setState } = persistence;
  const e1 = defenseEvents[0]!;
  const episodeState = session.getSnapshot?.().state ?? null;
  const e1Availability = defenseEventAvailabilityFromState(e1, episodeState, persistence.document);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(() => requestedScenarioId);
  const [planningStyle,setPlanningStyle]=useState(readGuardPlanningStyle);
  const selectedScenarioAllowed = (isGuardScenario(selectedScenarioId)&&guardStageUnlocked(selectedScenarioId!,persistence.document)) || selectedScenarioId === zeroBreachContent.scenario.id
    || selectedScenarioId === remodelDefense.scenario.id
    || selectedScenarioId === dataCenterDefense.scenario.id
    || Boolean(selectedScenarioId && siteDefenseContentForScenario(selectedScenarioId))
    || (selectedScenarioId === e1.id && e1Availability.unlocked);
  const content = state
    ? resolveDefenseContentForRun(state)
    : selectedScenarioAllowed && selectedScenarioId
      ? defenseContentForScenario(selectedScenarioId)
      : zeroBreachContent;
  const guard=isGuardMap(content.map.id);
  useEffect(()=>{
   if(content.scenario.id!=='guard-gd-06-v1'||!state)return;
   if(state.waveId>=5&&state.status!=='READY')recordEncounterIntel('guard','GD-06','observed');
   if(state.status==='WON'&&state.mapPhase==='SHIFTED')recordEncounterIntel('guard','GD-06','verified');
  },[content.scenario.id,state?.waveId,state?.status,state?.mapPhase]);
  const guardIndex=guardStageIds.indexOf(content.scenario.id);
  const guardKey=`guard.gd0${guardIndex+1}`;
  const TOWER_IDS = content.scenario.availableTowers as readonly DefenseTowerId[];
  const SUPPORT_IDS = content.scenario.availableSupports as readonly DefenseSupportId[];
  const BOARD_ART_URI = defenseBoardArtUri(content.map.id);
  const PRODUCTION_MAP = defenseProductionMapEntry(content.map.id);
  const G8A_WORLD_FINAL = content.map.id === 'map-apt-bottom-up-excavation-01' ? defenseG8aWorldFinalAsset() : null;
  const activeSiteMap = siteProcessMapByMapId(content.map.id)
    ?? (content.map.id === remodelScenario.map.id ? remodelScenario.map : undefined)
    ?? (content.map.id === dataCenterScenario.map.id ? dataCenterScenario.map : undefined);
  const remodelWorldState = content.scenario.id === remodelScenario.id ? readRemodelState() : null;
  const dataCenterWorldState = content.scenario.id === dataCenterScenario.id ? readDataCenterState() : null;
  const [selectedPadId, setSelectedPadId] = useState<string | null>(null);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [portrait, setPortrait] = useState(() => window.matchMedia?.('(orientation: portrait)').matches ?? false);
  const [compactViewport,setCompactViewport]=useState(()=>window.matchMedia?.('(max-width: 900px), (max-height: 600px)').matches??false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen,setHelpOpen]=useState(false);
  const [mobileInfoOpen,setMobileInfoOpen]=useState(false);
  const guardMobile=guard&&compactViewport;
  const boardFit=useGuardBoardFit(guardMobile&&!!state,portrait);
  const mapFrame = defenseMapFrame(content.map.id, boardFit.rotate, content.map.width, content.map.height);
  const visualRoutes = defenseRoutes(content,state??undefined).map(route=>({...route,path:defenseVisualPath(content.map.id,route.path)}));
  const visualPath = visualRoutes[0]!.path;
  const tutorial = useDefenseTutorial(state, content, paused => {
    if (!state) return;
    persistence.dispatch({ type: 'SetPaused', paused });
  });
  useEffect(()=>{if(guardMobile&&tutorial.pausedByGuide)setMobileInfoOpen(true);},[guardMobile,tutorial.pausedByGuide]);
  const combatFrameRef=useRef<readonly DefenseCombatShot[]>([]);
  const combatShots=useDefenseCombatFX(state,combatFrameRef.current);
  const audio = useDefenseAudio(state, content.map.id,combatFrameRef.current,content.waves.length,portrait);
  const effects = useDefenseEffects(state);
  const camera = useDefenseCamera(state, content, portrait);
  const oneStep = useDefCoreOneStep({
    state,
    onPause: paused => {
      if (!state) return;
      persistence.dispatch({ type: 'SetPaused', paused });
    },
    playCue: audio.playCue,
    armAudio: audio.armAudio,
    muted: audio.muted,
  });

  const selectedTower = state?.towers.find(tower => tower.id === selectedTowerId) ?? null;
  const selectedPad = content.map.pads.find(pad => pad.id === selectedPadId) ?? null;
  const selectedPadTower = state?.towers.find(tower => tower.padId === selectedPadId) ?? null;
  const supportCharacterId = state ? defenseSupportCharacterId(state.supportId) : null;
  const supportCharacter = supportCharacterId ? session.character(supportCharacterId) : null;
  const supportPortrait = supportCharacterId ? characterPortraitUri(supportCharacterId, id => session.assetUri(id)) : undefined;
  const preview = state ? defensePlanningWave(content, state) : null;
  const advice = state ? recommendDefenseAction(content, state,guard?planningStyle:'BALANCED') : null;
  const result = state && (state.status === 'WON' || state.status === 'LOST') ? defenseResult(state) : null;
  const activeEvent = state?.eventId ? defenseEventById(state.eventId) : undefined;
  const leakedEntries = state
    ? (Object.entries(state.leakedByEnemy) as [DefenseEnemyId, number][]).filter(([, count]) => count > 0)
    : [];
  const recommendedTowerId = state ? recommendedTowerForLeaks(state.leakedByEnemy) : 'SENSOR';
  const eventDebriefTextId = activeEvent && result
    ? result.won
      ? result.stars === 3 ? activeEvent.debriefTextIds.perfect : activeEvent.debriefTextIds.win
      : activeEvent.debriefTextIds.lose
    : null;

  // Phase 2: Active E-Stop emergency brake & Tactical Radio Chatter (Tick-based, zero extra timers)
  const radioUntilTickRef = useRef<number>(0);
  const [radioChatter, setRadioChatter] = useState<{
    speaker: string;
    role: string;
    portraitUri?: string;
    text: string;
  } | null>(null);
  const pressureCuesRef=useRef(new Set<string>());
  useEffect(()=>{
   if(!state||state.paused||state.status!=='RUNNING')return;
   for(const e of state.enemies){const phase=e.sensorPressure?.phase;if(phase!=='WARNING'&&phase!=='ACTIVE')continue;
    const key=state.runId+':'+e.id+':'+phase;if(pressureCuesRef.current.has(key))continue;
    pressureCuesRef.current.add(key);if(pressureCuesRef.current.size>32)pressureCuesRef.current.delete(pressureCuesRef.current.values().next().value!);
    if(!audio.muted)audio.playCue(phase==='WARNING'?'warning':'radio');
   }
  },[state?.tick,state?.paused,state?.status,state?.runId,audio.muted]);
  const lastReportedWaveRef = useRef<number>(0);

  const eStopActive = state ? Math.max(0, (((state.eStopActiveUntilTick??0) - state.tick) * content.tickMs) / 1000) : 0;
  const eStopCooldown = state ? Math.max(0, (((state.eStopCooldownUntilTick??0) - state.tick) * content.tickMs) / 1000) : 0;
  const isRadioVisible = Boolean(radioChatter && state && state.tick < radioUntilTickRef.current);

  const triggerRadio = (speaker: string, role: string, text: string, portraitUri?: string) => {
    setRadioChatter({ speaker, role, portraitUri, text });
    if (state) {
      radioUntilTickRef.current = state.tick + 80;
    }
    if (typeof window !== 'undefined' && state && state.tick > 0 && !audio.muted) {
      audio.playCue('radio');
    }
  };

  const triggerEStop = () => {
    if (!state || state.status !== 'RUNNING' || state.paused || eStopCooldown > 0) return;
    dispatch({ type: 'TriggerEStop' });
    if (!audio.muted) audio.playCue('estop');
    const chiefPortrait = characterPortraitUri('yoon_sungho', id => session.assetUri(id));
    triggerRadio(session.character('yoon_sungho')?.name ?? '윤성호', session.character('yoon_sungho')?.role ?? '', t('defense.tactics.radio.estop'), chiefPortrait);
  };

  // Tactical Radio triggers when enemies first engage in wave 1 or periodic waves
  useEffect(() => {
    if (!state || state.status !== 'RUNNING' || lastReportedWaveRef.current === state.waveId) return;
    if (state.waveId === 1 && state.enemies.length === 0) return; // wait for first hazard to enter site
    lastReportedWaveRef.current = state.waveId;
    const foremanPortrait = characterPortraitUri('kang_taesik', id => session.assetUri(id));
    const engineerPortrait = characterPortraitUri('lee_jaehoon', id => session.assetUri(id));
    if (state.waveId === 1) {
      triggerRadio(session.character('kang_taesik')?.name ?? '강태식', session.character('kang_taesik')?.role ?? '', t('defense.tactics.radio.first'), foremanPortrait);
    } else if (state.waveId % 3 === 0) {
      triggerRadio(session.character('lee_jaehoon')?.name ?? '이재훈', session.character('lee_jaehoon')?.role ?? '', t('defense.tactics.radio.periodic'), engineerPortrait);
    }
  }, [state?.waveId, state?.status, state?.enemies.length]);

  // Tactical Radio trigger on shield breach
  useEffect(() => {
    if (effects.shieldHit && state && state.status === 'RUNNING') {
      const foremanPortrait = characterPortraitUri('kang_taesik', id => session.assetUri(id));
      triggerRadio(session.character('kang_taesik')?.name ?? '강태식', session.character('kang_taesik')?.role ?? '', t('defense.tactics.radio.leak'), foremanPortrait);
    }
  }, [effects.shieldHit]);

  useEffect(() => {
    if (!state || state.paused || (state.status !== 'RUNNING' && state.status !== 'INTERMISSION')) return;
    const timer = window.setInterval(() => {
      setState(current => {
        if (!current) return current;
        const frame = advanceDefenseWithCombat(current, resolveDefenseContentForRun(current), 1);
        // Assignment is idempotent if React checks the updater twice. Effects consume unique engine IDs.
        combatFrameRef.current=frame.shots;
        const advanced=frame.state;
        return applyDefCoreOneStepRuntime(current, advanced, oneStep.choice, oneStep.choiceTick);
      });
    }, content.tickMs);
    return () => window.clearInterval(timer);
  }, [state?.status, state?.paused, state?.speed, oneStep.choice, oneStep.choiceTick]);

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) return;
      setState(current => current && !current.paused
        ? applyDefenseCommand(current, resolveDefenseContentForRun(current), { type: 'SetPaused', paused: true })
        : current);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const media = window.matchMedia?.('(orientation: portrait)');
    const compact=window.matchMedia?.('(max-width: 900px), (max-height: 600px)');
    if (!media) return;
    const sync = () => {setPortrait(media.matches);setCompactViewport(compact?.matches??false);};
    sync();
    media.addEventListener?.('change', sync);
    compact?.addEventListener?.('change',sync);
    return () => {media.removeEventListener?.('change', sync);compact?.removeEventListener?.('change',sync);};
  }, []);
  useEffect(()=>{setMobileInfoOpen(false);},[guardMobile,state?.runId]);

  const dispatch = (command: Parameters<typeof applyDefenseCommand>[2]) => {
    if (!state) return;
    try {
      if (command.type === 'StartWave') {
        setMobileInfoOpen(false);
        if (state.paused) persistence.dispatch({type:'SetPaused',paused:false});
        setSelectedPadId(null);
        setSelectedTowerId(null);
      }
      if (command.type === 'SetPaused' && !command.paused) {
        setMobileInfoOpen(false);
        setSelectedPadId(null);
        setSelectedTowerId(null);
        setSettingsOpen(false);
      }
      if (command.type === 'StartWave' || (command.type === 'SetPaused' && command.paused === false && state.status === 'RUNNING')) {
        audio.armAudio();
      }
      const next = persistence.dispatch(command);
      if (!next) return;
      setNotice('');
      if (command.type === 'Build') {
        const built = next.towers.find(tower => tower.padId === command.padId);
        setSelectedTowerId(built?.id ?? null);
        audio.playCue('place');
      }
      if (command.type === 'Upgrade') audio.playCue('upgrade');
      if (command.type === 'Sell' || command.type === 'UndoBuild') {
        setSelectedTowerId(null);
        audio.playCue('sell');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('defense.ui.command_error');
      setNotice(message === 'Insufficient resource' ? t('defense.ui.no_resource') : message==='E-Stop is cooling down'?t('defense.tactics.cooldown'):message);
    }
  };

  const selectedLevel = selectedTower ? towerLevel(content, selectedTower) : null;
  const upgrades = selectedTower
    ? towerDefinition(content, selectedTower.towerId).levels.filter(level => level.from === selectedTower.levelId)
    : [];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!state || event.repeat || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement
        || (event.target instanceof HTMLElement && (event.target.isContentEditable || event.target.closest('button,select,a,summary')))) return;

      // Space: Toggle pause
      if (event.code === 'Space') {
        event.preventDefault();
        dispatch({ type: 'SetPaused', paused: !state.paused });
        return;
      }

      // Enter: Start wave when ready or in intermission
      if (event.code === 'Enter') {
        if (state.status === 'READY' || state.status === 'INTERMISSION') {
          event.preventDefault();
          dispatch({ type: 'StartWave' });
          return;
        }
      }

      // Escape: Deselect pad or tower / close settings
      if (event.key === 'Escape') {
        if (settingsOpen) {
          setSettingsOpen(false);
          return;
        }
        if (selectedPadId || selectedTowerId) {
          setSelectedPadId(null);
          setSelectedTowerId(null);
          return;
        }
      }

      // Support Skill (Q or F)
      if (event.key === 'q' || event.key === 'Q' || event.key === 'f' || event.key === 'F') {
        if (state.status === 'RUNNING' && !state.paused && state.supportCooldownRemaining <= 0) {
          event.preventDefault();
          dispatch({ type: 'UseSupport' });
        }
        return;
      }

      // Emergency E-Stop (E)
      if (event.key === 'e' || event.key === 'E') {
        if (state.status === 'RUNNING' && !state.paused && eStopCooldown <= 0) {
          event.preventDefault();
          triggerEStop();
        }
        return;
      }

      // Tower building hotkeys 1, 2, 3, 4 when empty pad is selected
      if (selectedPad && !selectedPadTower) {
        const keyMap: Record<string, DefenseTowerId> = {
          '1': 'PULSE',
          '2': 'CONTROL',
          '3': 'BURST',
          '4': 'SENSOR',
        };
        const towerId = keyMap[event.key];
        if (towerId && TOWER_IDS.includes(towerId)) {
          const definition = towerDefinition(content, towerId);
          const level = definition.levels.find(item => item.id === 'L1')!;
          if (state.resource >= level.cost) {
            event.preventDefault();
            dispatch({ type: 'Build', padId: selectedPad.id, towerId });
          }
          return;
        }
      }

      // Tower management hotkeys when a tower is selected: U (upgrade), S (sell), T (target mode)
      if (selectedTower && selectedLevel) {
        if (event.key === 'u' || event.key === 'U') {
          const availableUpgrade = upgrades.find(lvl => state.resource >= lvl.cost);
          if (availableUpgrade) {
            event.preventDefault();
            dispatch({ type: 'Upgrade', towerInstanceId: selectedTower.id, levelId: availableUpgrade.id });
          }
          return;
        }
        if (event.key === 's' || event.key === 'S') {
          event.preventDefault();
          dispatch({ type: 'Sell', towerInstanceId: selectedTower.id });
          return;
        }
        if (event.key === 't' || event.key === 'T') {
          event.preventDefault();
          const curIdx = content.targetModes.indexOf(selectedTower.targetMode);
          const nextMode = content.targetModes[(curIdx + 1) % content.targetModes.length] ?? content.targetModes[0];
          if (nextMode) {
            dispatch({ type: 'SetTargetMode', towerInstanceId: selectedTower.id, targetMode: nextMode });
          }
          return;
        }
      }

      // Speed hotkeys 1, 2 when no pad is selected
      if (!selectedPad && (event.key === '1' || event.key === '2')) {
        event.preventDefault();
        dispatch({ type: 'SetSpeed', speed: Number(event.key) as 1 | 2 });
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, selectedPad, selectedPadTower, selectedTower, selectedLevel, upgrades, settingsOpen, content, TOWER_IDS, dispatch, eStopCooldown, triggerEStop]);

  const choosePad = (padId: string) => {
    if (!state) return;
    if (!state.paused && (state.status === 'RUNNING' || state.status === 'INTERMISSION')) persistence.dispatch({type:'SetPaused',paused:true});
    const tower = state.towers.find(item => item.padId === padId);
    setSelectedPadId(padId);
    setSelectedTowerId(tower?.id ?? null);
    setMobileInfoOpen(false);
    setSettingsOpen(false);
    setNotice('');
  };
  const openMobileInfo=()=>{
    if(state?.status==='RUNNING'&&!state.paused)dispatch({type:'SetPaused',paused:true});
    setSettingsOpen(false);setMobileInfoOpen(true);
  };

  const startWithSupport = (supportId: DefenseSupportId) => {
    if(content.map.id==='ramp-01'||guard)audio.armAudio();
    if(guard&&!guardSupportUnlocked(supportId,persistence.document))return;
    audio.playCue('select');
    persistence.startWithSupport(supportId, false, content);
    radioUntilTickRef.current=0;
    lastReportedWaveRef.current=0;
  };

  const retry = () => {
    if (state) setSelectedScenarioId(state.scenarioId);
    persistence.retryAfterResult();
    setSelectedPadId(null);
    setSelectedTowerId(null);
    setNotice('');
  };

  const requestedResumeConflict = !state
    && Boolean(requestedScenarioId)
    && persistence.entry.kind === 'resume'
    && persistence.entry.run.scenarioId !== requestedScenarioId
    && persistence.entry.run.eventId !== requestedScenarioId;

  const operations=async()=>{if(await persistence.returnToOperations()){setSelectedScenarioId(GUARD_ENTRY);setSelectedPadId(null);setSelectedTowerId(null);setSettingsOpen(false);}};
  if(campaignEntry&&!state&&selectedScenarioId===GUARD_ENTRY&&(persistence.entry.kind==='select'||persistence.entry.kind==='resume'))return <GuardCampaignHome document={persistence.document} onExit={()=>{void persistence.exitToMain();}} onPractice={onPractice} onResume={persistence.entry.kind==='resume'?persistence.resumeSavedRun:undefined} onSelect={async(id,replace)=>{if(!guardStageUnlocked(id,persistence.document))return;if(replace&&!await persistence.discardSavedRun())return;setSelectedScenarioId(id);}}/>;

  if (requestedResumeConflict && persistence.entry.kind === 'resume') {
    return <main className="zb-shell zb-save-gate" data-defense-screen="requested-scenario-conflict">
      <section>
        <small>ZERO BREACH · LIVE SITE</small>
        <h1>대표 시나리오로 전환할까요?</h1>
        <p>중단한 일반 훈련이 남아 있습니다. 대표 시나리오를 시작하면 현재 중단 지점만 정리되고, 기존 클리어 기록과 보상 기록은 유지됩니다.</p>
        <dl className="zb-save-version">
          <div><dt>현재 저장</dt><dd>WAVE {persistence.entry.run.waveId} / 10</dd></div>
          <div><dt>진입 대상</dt><dd>DEF-CORE-01</dd></div>
        </dl>
        <div className="zb-save-actions">
          <button
            type="button"
            className="is-primary"
            onClick={() => { void persistence.discardSavedRun(); }}
          >대표 시나리오 시작</button>
          <button type="button" onClick={persistence.resumeSavedRun}>기존 훈련 이어하기</button>
          <button type="button" onClick={() => { void persistence.exitToMain(); }}>본편 허브로</button>
        </div>
      </section>
    </main>;
  }

  if (!state && persistence.entry.kind !== 'select') {
    return <DefensePersistenceGate controller={persistence} />;
  }

  if (!state && !selectedScenarioAllowed) return <main className="zb-shell zb-prep zb-scenario-select" data-defense-screen="scenario-select">
    <header className="zb-prep-header">
      <div><small>{t('defense.ui.kicker')}</small><h1>{t('defense.scenario.title')}</h1></div>
      <button type="button" onClick={() => { void persistence.exitToMain(); }}>{t(campaignEntry?'guard.hub':'defense.ui.exit')}</button>
    </header>
    <section className="zb-prep-copy">
      <h2>{t('defense.scenario.title')}</h2>
      <p>{t('defense.scenario.body')}</p>
    </section>
    <section className="zb-scenario-grid">
      <button type="button" className="zb-scenario-card is-unlocked" data-scenario="training-ramp-v1" onClick={() => setSelectedScenarioId(zeroBreachContent.scenario.id)}>
        <small>{t('defense.scenario.training.status')}</small>
        <strong>{t('defense.scenario.training.title')}</strong>
        <p>{t('defense.scenario.training.body')}</p>
        <b>{t('defense.scenario.choose')}</b>
      </button>
      <button type="button" className={`zb-scenario-card${e1Availability.unlocked ? ' is-unlocked' : ' is-locked'}`} data-scenario={e1.id}
        disabled={!e1Availability.unlocked} onClick={() => setSelectedScenarioId(e1.id)}>
        <small>{t(e1Availability.unlocked ? 'defense.scenario.event.status.unlocked' : 'defense.scenario.event.status.locked')}</small>
        <strong>{t(e1.titleTextId)}</strong>
        <p>{t(e1.briefingTextId)}</p>
        {!e1Availability.unlocked ? <ul>
          {e1Availability.missing.map((missing, index) => <li key={index}>{t(missing.kind === 'scenario-cleared'
            ? 'defense.scenario.event.lock.training' : 'defense.scenario.event.lock.story')}</li>)}
        </ul> : <b>{t('defense.scenario.choose')}</b>}
      </button>
    </section>
  </main>;

  if (!state) return <main className="zb-shell zb-prep zb-premium-deployment" data-defense-screen="support-select" data-scenario={content.scenario.id} data-map={content.map.id}>
    <img className="zb-deployment-keyart" src={guard?(BOARD_ART_URI??DEFENSE_PREMIUM_HERO):DEFENSE_PREMIUM_HERO} alt="" aria-hidden="true"/>
    <header className="zb-prep-header">
      <div><small>{t('defense.ui.kicker')}</small><h1>{t(guard?'guard.title':'defense.ui.hub.title')}</h1></div>
      <button type="button" onClick={() => setSelectedScenarioId(campaignEntry?GUARD_ENTRY:null)}>{t(campaignEntry?'guard.home':'defense.scenario.back')}</button>
      <button type="button" onClick={() => { void persistence.exitToMain(); }}>{t('defense.ui.exit')}</button>
    </header>
    <section className="zb-prep-copy zb-deployment-copy">
      <span>{t('defense.art.subtitle')}</span>
      <h2>{t('defense.art.title')}</h2>
      <p>{t('defense.art.promise')}</p>
      <div className="zb-deployment-operation"><strong>{t('defense.art.operation')}</strong><span>{guard?t(guardKey+'.title'):activeSiteMap?.label??(content.scenario.eventId?t(defenseEventById(content.scenario.eventId)?.titleTextId??'defense.event.e1.title'):t('defense.map.ramp-01.name'))}</span><small>{guard?`${content.map.pads.length}개 지점 · 4종 장비 · ${content.waves.length}파`:t('defense.art.route')}</small>{guard?<p>{t(guardKey+'.brief')}</p>:null}
        {content.scenario.eventId?<p>{t(defenseEventById(content.scenario.eventId)?.briefingTextId??'defense.event.e1.briefing')}</p>:null}
      </div>
      <small className="zb-simulation-boundary">{t('defense.tactics.boundary')}</small>
    </section>
    <section className="zb-support-grid">
      <header className="zb-crew-heading"><h2>{t('defense.art.crew')} {guard?<small>{SUPPORT_IDS.filter(id=>guardSupportUnlocked(id,persistence.document)).length} / {SUPPORT_IDS.length} {t('guard.crew.available')}</small>:null}</h2><p>{t(guard?'guard.crew_hint':'defense.art.crew_hint')}</p></header>
      {SUPPORT_IDS.map(id => <SupportCard
        key={id}
        session={session}
        supportId={id}
        onChoose={() => startWithSupport(id)}
        content={content}
        locked={guard&&!guardSupportUnlocked(id,persistence.document)}
        unlockStage={guardStageIds.indexOf(guardSupportUnlockStage(id)??'')+1}
      />)}
    </section>
    <section className="zb-deployment-bottom"><details><summary>{t('defense.art.tree')} · {t('defense.art.standard')}</summary><div className="zb-deployment-equipment">{TOWER_IDS.map(id=><div key={id}><img src={defenseTowerArtUri(id,'L3A',content.map.id)??undefined} alt=""/><strong>{towerName(content.map.id,id)}</strong><small>{towerRole(content.map.id,id)}</small></div>)}</div></details><OperationHandoffDossier mode="defense"/></section>
  </main>;

  const refund = selectedTower ? Math.floor(selectedTower.invested * content.sellRate) : 0;
  const supportCooldownSeconds = Math.ceil(state.supportCooldownRemaining * content.tickMs / 1000);
  const needsTransition=!!content.map.transition&&state.waveId===content.map.transition.beforeWave&&!state.appliedTransitionIds?.includes(content.map.transition.id);

  return <main className={`zb-shell${effects.shieldHit ? ' is-shield-hit' : ''}${state.shield <= 3 ? ' is-critical-shield' : ''}${oneStep.active ? ' is-def-core-active' : ''}${portrait ? ' is-portrait-immersion' : ''}`} data-defense-screen="combat" data-supplied-audio={guard?"true":undefined} data-guard-shift={guardIndex===2&&state.waveId>=5?"LATE":"EARLY"} data-orientation={portrait ? 'portrait' : 'landscape'} data-def-core-phase={oneStep.phase} data-def-core-choice={oneStep.choice ?? ''} data-status={state.status} data-speed={state.speed} data-run-id={state.runId} data-tick={state.tick} data-wave={state.waveId} data-shield={state.shield} data-resource={state.resource} data-visual-version={(content.map.id==='ramp-01'||guard)?defensePremiumArt.visualVersion:defenseVisualProduction.visualVersion} data-audio-muted={audio.muted ? 'true' : 'false'} data-premium-audio={audio.premiumMixEnabled ? 'true' : 'false'} data-premium-mix-state={audio.premiumMixState} data-scenario={state.scenarioId} data-event={state.eventId ?? ''} data-map={content.map.id}
      data-logical-route={content.map.path.map(point => point.join(',')).join(' ')}
      data-guard-mobile={guardMobile?'true':undefined}
      data-mobile-info={mobileInfoOpen?'true':undefined}
      data-battle-paused={state.paused?'true':'false'}
      data-visual-route={visualPath.map(point => point.join(',')).join(' ')}
      data-frame-mode={mapFrame.mode} data-camera-mode={camera.mode} data-camera-reason={camera.reason ?? ''} data-production-map={PRODUCTION_MAP?.status ?? ''} data-g8a-world-final={G8A_WORLD_FINAL ? 'true' : 'false'} data-remodel-phase={remodelWorldState?.phase ?? ''} data-data-center-phase={dataCenterWorldState?.phase ?? ''} data-energy-state={dataCenterWorldState?.energyState ?? ''} data-selection-mode={!selectedPad ? 'NONE' : selectedTower ? 'TOWER' : 'PAD'}>
    <header className="zb-hud">
      <div className="zb-brand"><small>{guard?"SIGNAL GUARD":"ZERO BREACH"}</small><strong>{t(guard?"guard.title":"defense.ui.hub.title")}</strong></div>
      <div className={`zb-meter${state.shield <= 3 ? ' is-critical' : ''}`}><span>{t('defense.ui.shield')}</span><strong>{state.shield}</strong></div>
      <div className="zb-meter"><span>{t('defense.ui.resource')}</span><strong>R {state.resource}</strong></div>
      <div className="zb-meter"><span>{t('defense.ui.wave')}</span><strong>{state.waveId} / {content.waves.length}</strong></div>
      <div className="zb-status"><span>{guard&&state.status==='INTERMISSION'?t('guard.preparation'):statusLabel(state)}</span>{state.paused ? <b>{t('defense.tactics.hold')}</b> : null}</div>
      <button
        type="button"
        className="zb-hud-button"
        aria-pressed={state.paused}
        onClick={() => dispatch({ type: 'SetPaused', paused: !state.paused })}
      >{t(state.paused ? 'defense.ui.resume' : 'defense.ui.pause')}<kbd className="zb-hotkey">Space</kbd></button>
      <div className="zb-speed" aria-label={t('defense.ui.speed')}>
        {[1, 2].map(speed => <button
          key={speed}
          type="button"
          className={state.speed === speed ? 'is-active' : ''}
          onClick={() => dispatch({ type: 'SetSpeed', speed: speed as 1 | 2 })}
        >{speed}×<kbd className="zb-hotkey">{speed}</kbd></button>)}
      </div>
      <button className="zb-defense-settings" type="button" aria-expanded={settingsOpen} onClick={() => {if (!settingsOpen && !state.paused) dispatch({type:'SetPaused',paused:true});setMobileInfoOpen(false);setSettingsOpen(open => !open);}}>{t(guardMobile?'guard.mobile.menu':'defense.tactics.settings')}</button>
      <button type="button" className="zb-exit" onClick={() => { if(guard)void operations();else void persistence.exitToMain(); }}>{t(guard?'guard.home':'defense.ui.exit')}</button>
    </header>
    {settingsOpen ? <section className="zb-defense-settings-panel" aria-label="현장 디펜스 설정">
      <button type="button" onClick={()=>setSettingsOpen(false)}>{t('defense.tactics.close')}</button>
      <button type="button" onClick={() => { tutorial.replay(); setHelpOpen(true);setSettingsOpen(false);if(guardMobile)setMobileInfoOpen(true); }}>{t('defense.tutorial.replay')}</button>
      {guardMobile?<button type="button" onClick={openMobileInfo}>{t('guard.mobile.intel')}</button>:null}
      {guard?<div className="guard-settings-speed" aria-label={t('defense.ui.speed')}>{[1,2].map(speed=><button key={speed} type="button" aria-pressed={state.speed===speed} onClick={()=>dispatch({type:'SetSpeed',speed:speed as 1|2})}>{speed}×</button>)}</div>:null}
      <button
        type="button"
        data-audio-muted={audio.muted ? 'true' : 'false'}
        aria-pressed={audio.muted}
        onClick={() => audio.setMuted(!audio.muted)}
      ><span>SOUND</span><b>{audio.muted ? 'OFF' : 'ON'}</b></button>
      {guard?<button type="button" className="guard-menu-operations" onClick={()=>{void operations();}}>{t('guard.home')}</button>:null}
    </section> : null}
    <DefenseSaveStatus controller={persistence} />
    <section className={`zb-tactics-strip${guardPressureReadout(state,content)?' has-sensor-pressure':''}`} aria-label={t('defense.tactics.simulation')}>
      {guardPressureReadout(state,content)?<strong className="guard-pressure-banner" role="status" aria-live="polite" aria-atomic="true">{guardPressureReadout(state,content)}</strong>:null}
      {guard?<GuardBattleFeedback state={state} shots={combatFrameRef.current}/>:null}
      {guard?<GuardWaveMeter content={content} state={state}/>:null}
      <div className="guard-next-intel"><small>{guard?`GD-0${guardIndex+1} · ${t(guardKey+'.title')}`:t('defense.tactics.simulation')}</small><strong>{guardPressureReadout(state,content)??(preview?`${t('defense.ui.next_wave')} ${preview.id} · ${t('defense.tactics.count')} ${preview.groups.reduce((sum,group)=>sum+group.count,0)}`:t('defense.tactics.last_wave'))}</strong>
      <span>{(preview?defensePressureWaveGroups(content,preview,state.sensorPressureEnabled===true):[]).map(group=>`${group.pressureCore?t('guard.pressure.core'):enemyName(content.map.id,group.enemy)} ×${group.count}`).join(' · ')}</span>
      {isRadioVisible&&radioChatter?<span className="zb-radio-line" role="status">{radioChatter.speaker} · {radioChatter.text}</span>:null}</div>
      {!result?<button type="button" disabled={!advice} onClick={()=>{if(advice)choosePad(advice.padId);}}>{t('defense.tactics.recommend')}{advice?` · ${advice.padId} · R ${advice.cost}`:''}</button>:null}
    </section>

    {guardMobile&&mobileInfoOpen?<GuardMobileInfo onClose={()=>setMobileInfoOpen(false)}>
      <GuardSpatialControls content={content} state={state} selectedTower={selectedTower} onCommand={dispatch}/>
      {preview?<GuardWaveIntel pressureEnabled={state.sensorPressureEnabled===true} key={`mobile-${state.waveId}:${state.status}`} content={content} state={state} wave={preview} style={planningStyle} onStyle={value=>{setPlanningStyle(value);writeGuardPlanningStyle(value);}} initiallyOpen/>:null}
      <DefenseTutorial controller={tutorial}/><p>{t('guard.purchase.hint')}</p>
    </GuardMobileInfo>:null}
    <section className="zb-stage" ref={boardFit.ref}>
      <div
        className="zb-board-wrap"
        style={{
          '--zb-board-aspect': String(mapFrame.width/mapFrame.height),
          '--zb-camera-scale': String(camera.scale),
          '--zb-camera-x': `${camera.focus.left}%`,
          '--zb-camera-y': `${camera.focus.top}%`,
        } as CSSProperties}
      >
        <svg
          className="zb-board"
          viewBox={defenseMapViewBox(mapFrame)}
          role="img"
          aria-label={guard?t(guardKey+'.title'):t('defense.map.ramp-01.name')}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="zb-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M50 0H0V50" className="zb-grid-line" />
            </pattern>
          </defs>
          <g transform={mapFrame.rotateClockwise?"translate(600 0) rotate(90)":undefined}>
          <rect width="1000" height="600" rx="22" className="zb-board-bg" />
          {BOARD_ART_URI ? <image
            href={BOARD_ART_URI}
            x="0"
            y="0"
            width="1000"
            height="600"
            preserveAspectRatio="none"
            className="zb-board-production-art"
            data-production-board-art={content.map.id}
          /> : <rect width="1000" height="600" rx="22" fill="url(#zb-grid)" />}
          {guard?<GuardWorldLighting running={state.status==='RUNNING'&&!state.paused}/>:null}
          <SiteProcessMapBoardOverlay mapId={content.map.id} />
          <RemodelBoardOverlay state={remodelWorldState} />
          <DataCenterBoardOverlay state={dataCenterWorldState} />
          {content.map.id!=='ramp-01'&&!guard?<FieldHazardsOverlay mapId={content.map.id} isRunning={state.status === 'RUNNING'} />:null}
          {visualRoutes.map(route=>{const points=route.path.map(point=>point.join(',')).join(' ');return <g key={route.id} data-guard-route={route.id}>
            <polyline points={points} className="zb-path-shoulder" fill="none" aria-hidden="true"/>
            <polyline points={points} className="zb-path-shadow" fill="none" aria-hidden="true"/>
            <polyline points={points} className="zb-path" fill="none" aria-hidden="true"/>
            <polyline points={points} className="zb-path-centerline" fill="none" aria-hidden="true"/>
          </g>;})}
          {content.map.id === G8A_MAP_ID
            ? <G8AActivityOverlay
              cameraMode={camera.mode}
              waveId={state.waveId}
              ambientDumpUri={defenseSwiftPqAsset()?.uri ?? null}
              showAmbientDump={state.waveId <= 5 && !state.enemies.some(enemy => enemy.enemyId === 'SWIFT')}
            />
            : null}
          {selectedTower && selectedLevel ? (() => {
            const pad = content.map.pads.find(item => item.id === selectedTower.padId)!;
            const visualPad = defenseVisualPadPoint(content.map.id, pad);
            return <circle cx={visualPad.x} cy={visualPad.y} r={selectedLevel.range} className="zb-range-preview" />;
          })() : null}
          {content.map.pads.map(pad => {
            const visualPad = defenseVisualPadPoint(content.map.id, pad);
            return <g key={`pad-${pad.id}`} className="zb-pad-runtime">
            <circle cx={visualPad.x} cy={visualPad.y} r="42" className="zb-pad-hardstand" aria-hidden="true" />
            <circle
              cx={visualPad.x}
              cy={visualPad.y}
              r="22"
              className={`zb-pad-mark${selectedPadId === pad.id ? ' is-selected' : ''}${state.towers.some(tower => tower.padId === pad.id) ? ' is-occupied' : ''}`}
            />
          </g>;
          })}
          {guard?<GuardBattleFields content={content} state={state} rotated={!!mapFrame.rotateClockwise}/>:null}
          {state.freezeMovementUntilTick > state.tick ? <g className="zb-support-field is-coordinator" aria-hidden="true">
            <rect x="8" y="8" width="984" height="584" rx="20" />
            <path d="M120 300H880" />
          </g> : null}
          {state.rangeBonusUntilTick > state.tick ? <g className="zb-support-field is-observer" aria-hidden="true">
            <circle cx="500" cy="300" r="210" />
            <circle cx="500" cy="300" r="130" />
          </g> : null}
          {effects.resolvedEnemyEchoes.map(echo => {
            const pos = defenseVisualPositionAtDistance(content.map.id, defenseEnemyPath(content,echo,state), echo.distance);
            return <g key={`resolved-${echo.id}`} transform={`translate(${pos.x} ${pos.y})`} className="zb-resolve-burst" data-effect="resolve" aria-hidden="true">
              <circle r="10" />
              <path d="M-24 0H24M0-24V24M-17-17L17 17M17-17L-17 17" />
              <text y="-14" textAnchor="middle" className="zb-reward-float">+R</text>
            </g>;
          })}
          <DefCoreOneStepBoardOverlay state={state} controller={oneStep} />
          {state.towers.map(tower => {
            const pad = content.map.pads.find(item => item.id === tower.padId)!;
            const visualPad = defenseVisualPadPoint(content.map.id, pad);
            return <g key={tower.id} transform={`translate(${visualPad.x} ${visualPad.y})${mapFrame.rotateClockwise?" rotate(-90)":""}`}>
              <TowerGlyph content={content} tower={tower} />
            </g>;
          })}
          {state.enemies.map(enemy => <EnemyGlyph key={enemy.id} content={content} enemy={enemy} state={state} isHit={effects.impactedEnemyIds.has(enemy.id)} counterRotate={!!mapFrame.rotateClockwise} />)}
          {(content.map.id==='ramp-01'||guard)?<DefenseCombatFX shots={combatShots} content={content} rotated={!!mapFrame.rotateClockwise}/>:null}
          {guard?<GuardSensorPressureOverlay content={content} state={state} rotated={!!mapFrame.rotateClockwise}/>:null}
          {guard?<GuardEvolutionFX content={content} state={state} rotated={!!mapFrame.rotateClockwise}/>:null}
          </g>
        </svg>
        {content.map.id === G8A_MAP_ID ? <div className="zb-board-grade" aria-hidden="true" data-world-grade="COMMERCIAL_GFX_V1" /> : null}

        <div className="zb-pad-layer" aria-label="설치 패드">
          {content.map.pads.map(pad => {
            const occupied = state.towers.some(tower => tower.padId === pad.id);
            const visualPad = defenseVisualPadPoint(content.map.id, pad);
            const point = defenseMapPointPercent(mapFrame, visualPad.x, visualPad.y);
            if (!point.visible) return null;
            return <button
              key={pad.id}
              type="button"
              className={`zb-pad-hit${selectedPadId === pad.id ? ' is-selected' : ''}`}
              style={{ left: `${point.left}%`, top: `${point.top}%` }}
              aria-label={`${pad.id} · ${occupied ? '타워 설치됨' : t('defense.ui.empty_pad')}`}
              onClick={() => choosePad(pad.id)}
            ><span>{pad.id}</span></button>;
          })}
        </div>

        <aside className="zb-wave-preview" hidden>
          <small>{state.status === 'RUNNING' ? t('defense.ui.next_wave') : t('defense.ui.current_wave')}</small>
          <strong>WAVE {preview?.id}</strong>
          <ul>
            {preview?.groups.map((group, index) => <li key={`${group.enemy}-${index}`}>
              <span>{enemyName(content.map.id, group.enemy)}</span><b>×{group.count}</b>
            </li>)}
          </ul>
        </aside>

        <div className="zb-board-caption">
          <span>{t('defense.tactics.simulation')}</span>
          <b>{guard?t(guardKey+'.title'):activeSiteMap?.label ?? t('defense.map.ramp-01.name')}</b>
        </div>

        {content.map.id === G8A_MAP_ID ? <div className="zb-camera-controls" aria-label="현장 카메라 확대 축소">
          <button type="button" onClick={camera.zoomOut} disabled={camera.manualScale <= 1} aria-label="축소">−</button>
          <button type="button" className="zb-camera-reset" onClick={camera.resetZoom} aria-label="배율 초기화">{Math.round(camera.manualScale * 100)}%</button>
          <button type="button" onClick={camera.zoomIn} disabled={camera.manualScale >= 1.8} aria-label="확대">＋</button>
        </div> : null}

        {/* Phase 2: Active E-Stop Banner */}
        {eStopActive > 0 ? <div className="zb-estop-banner" role="alert" aria-live="assertive">
          <span>🚨</span>
          <strong>{t('defense.tactics.estop')} ({eStopActive.toFixed(1)}s)</strong>
        </div> : null}

        {/* Phase 2: Tactical Radio Chatter Walkie-Talkie HUD */}
        {isRadioVisible && radioChatter ? <div className="zb-radio-chatter" role="status" aria-live="polite">
          {radioChatter.portraitUri
            ? <img src={resolveCharacterBrandingUri(radioChatter.portraitUri)} alt="" className="zb-radio-portrait" />
            : <div className="zb-radio-portrait" />}
          <div className="zb-radio-content">
            <div className="zb-radio-header">
              <span className="zb-radio-channel">{t('defense.tactics.radio.channel')}</span>
              <strong className="zb-radio-speaker">{radioChatter.speaker}</strong>
              <span className="zb-radio-role">{radioChatter.role}</span>
            </div>
            <p className="zb-radio-text">{radioChatter.text}</p>
          </div>
        </div> : null}
      </div>
    </section>

    <DefCoreOneStepOverlay controller={oneStep} />

    <footer className="zb-command">
      <section className="zb-selection">
        {guard&&!guardMobile&&canUndoDefenseBuild(state)?<button className="guard-undo-build" type="button" onClick={()=>dispatch({type:'UndoBuild'})}><strong>{t('guard.purchase.undo')}</strong><span>{state.lastTowerPurchase?.padId} · +R {state.towers.find(t=>t.id===state.lastTowerPurchase?.towerInstanceId)?.invested} · {t('guard.purchase.refund')}</span></button>:null}
        {!selectedPad ? <div className="zb-empty-selection"><strong>{t('defense.ui.select_pad')}</strong><span>{advice?t(advice.reasonId):t('defense.tactics.no_advice')}</span></div> : null}
        {selectedPad?<div className="zb-selection-heading">
          <small>{guardMobile?`${selectedPad.id} · ${selectedTower?.levelId??t('guard.mobile.empty')} · ${t('defense.tactics.hold')}`:state.paused?t('defense.tactics.hold'):t('defense.tactics.advice_hint')}</small>
          {guardMobile?<select className="guard-pad-select" aria-label={t('guard.mobile.pads')} value={selectedPadId??''} onChange={event=>choosePad(event.target.value)}>{content.map.pads.map(pad=><option key={pad.id} value={pad.id}>{pad.id} · {state.towers.find(tower=>tower.padId===pad.id)?.levelId??t('guard.mobile.empty')}</option>)}</select>:null}
          {guardMobile&&canUndoDefenseBuild(state)?<button className="guard-undo-build is-mobile" type="button" onClick={()=>dispatch({type:'UndoBuild'})}>{t('guard.purchase.undo')}<b>{state.lastTowerPurchase?.padId} · +R {state.towers.find(t=>t.id===state.lastTowerPurchase?.towerInstanceId)?.invested}</b></button>:null}
          <button type="button" onClick={()=>{setSelectedPadId(null);setSelectedTowerId(null);}}>{t(guardMobile?'guard.mobile.close':'defense.tactics.close')}</button>
        </div>:null}
        {guardMobile&&selectedPad?<nav className="guard-pad-rail" aria-label={t('guard.mobile.pads')}>{content.map.pads.map(pad=>{const tower=state.towers.find(item=>item.padId===pad.id);return <button key={pad.id} type="button" data-pad-choice={pad.id} aria-pressed={pad.id===selectedPadId} aria-label={`${pad.id} · ${tower?towerName(content.map.id,tower.towerId):t('guard.mobile.empty')}`} onClick={()=>choosePad(pad.id)}><strong>{pad.id}</strong><small>{tower?.levelId??'+'}</small></button>;})}</nav>:null}
        {selectedPad&&advice?.padId===selectedPad.id?<p className="zb-advice-reason">{t('defense.tactics.recommended')} · {towerName(content.map.id,advice.towerId)} · {t(advice.reasonId)}</p>:null}

        {selectedPad && !selectedPadTower ? <div className="zb-build-panel">
          <div className="zb-panel-heading"><span>{selectedPad.id}</span><strong>{t('defense.ui.select_tower')}</strong></div>
          <div className="zb-tower-shop">
            {TOWER_IDS.map((towerId, index) => {
              const definition = towerDefinition(content, towerId);
              const level = definition.levels.find(item => item.id === 'L1')!;
              const disabled = state.resource < level.cost;
              const shopArtUri = defenseG8aTowerVisual(content.map.id, towerId, 'L1')?.uri
                ?? defenseTowerArtUri(towerId, 'L1',content.map.id);
              return <button
                key={towerId}
                type="button"
                disabled={disabled}
                data-recommended={advice?.command.type==='Build'&&advice.padId===selectedPad.id&&advice.towerId===towerId?'true':undefined}
                onClick={() => dispatch({ type: 'Build', padId: selectedPad.id, towerId })}
              >
                {shopArtUri
                  ? <img src={shopArtUri} className="zb-shop-production-art" alt="" aria-hidden="true" data-g8a-shop-art={content.map.id === G8A_MAP_ID ? towerId : undefined} />
                  : <span className={`zb-shop-glyph zb-shop-${towerId.toLowerCase()}`} aria-hidden="true" data-art-state="prototype" />}
                <span><strong>{towerName(content.map.id, towerId)}</strong><small>{towerRole(content.map.id, towerId)}</small></span>
                <b>R {level.cost}<kbd className="zb-hotkey">{index + 1}</kbd></b>
              </button>;
            })}
          </div>
        </div> : null}

        {selectedTower && selectedLevel ? <div className="zb-tower-panel">
          <div className="zb-panel-heading">
            <span>{selectedTower.padId} · {selectedTower.levelId}</span>
            <strong>{towerName(content.map.id, selectedTower.towerId)}</strong>
          </div>
          <div className="zb-tower-stats">
            <span>{t('defense.ui.damage')} <b>{selectedLevel.damage}</b></span>
            <span>{t('defense.ui.range')} <b>{selectedLevel.range}</b></span>
            <span>{t('defense.ui.interval')} <b>{(selectedLevel.intervalTicks * content.tickMs / 1000).toFixed(2)}s</b></span>
          </div>
          <details className="guard-tower-management" open={!guardMobile||undefined}><summary>{t('guard.mobile.management')}</summary>
          <div className="zb-target-mode">
            <span>{t('defense.ui.target')} <kbd className="zb-hotkey" style={{ fontSize: '8px' }}>T</kbd></span>
            {content.targetModes.map(mode => <button
              key={mode}
              type="button"
              className={selectedTower.targetMode === mode ? 'is-active' : ''}
              onClick={() => dispatch({ type: 'SetTargetMode', towerInstanceId: selectedTower.id, targetMode: mode })}
              aria-pressed={selectedTower.targetMode===mode}
              title={mode==='THREAT'?t('guard.target.THREAT.hint'):undefined}
            >{t(`defense.ui.target.${mode}`)}</button>)}
          </div>
          {guard?<p className="guard-target-hint">{t('guard.target.THREAT.hint')}</p>:null}
          <div className="zb-upgrades">
            <button className="zb-sell" type="button" onClick={() => dispatch({ type: 'Sell', towerInstanceId: selectedTower.id })}>
              <span>{t('defense.ui.sell')}<kbd className="zb-hotkey">S</kbd></span><b>R {refund}</b>
            </button>
          </div>
          </details>
          <DefenseTechTree key={selectedTower.id} content={content} tower={selectedTower} resource={state.resource} advice={advice} onCommand={dispatch} compact={guardMobile} ultimateAvailable={!!state.ultimateUnlocked&&!state.towers.some(t=>t.levelId.startsWith('L4'))}/>
        </div> : null}
      </section>

      <section className="zb-run-controls">
        {guardMobile&&(state.status==='READY'||state.status==='INTERMISSION'||state.paused)?<>
          <button type="button" className="guard-mobile-recommend" disabled={!advice} onClick={()=>{if(advice)choosePad(advice.padId);}}>{t('guard.mobile.recommend')}</button>
          <button type="button" className="guard-mobile-intel-toggle" aria-expanded={mobileInfoOpen} onClick={()=>mobileInfoOpen?setMobileInfoOpen(false):openMobileInfo()}>{t(needsTransition?'guard.mobile.transition':'guard.mobile.intel_short')}</button>
          {state.status==='RUNNING'&&state.paused?<button type="button" className="guard-mobile-resume" onClick={()=>dispatch({type:'SetPaused',paused:false})}>{t('guard.mobile.continue')}</button>:null}
        </>:null}
        {guard?<GuardSpatialControls content={content} state={state} selectedTower={selectedTower} onCommand={dispatch}/>:null}
        {guard&&(state.status==='READY'||state.status==='INTERMISSION')?<p className="guard-preparation-hint">{t('guard.preparation.hint')}</p>:null}
        {guard&&!guardMobile&&preview&&(state.status==='READY'||state.status==='INTERMISSION')?<GuardWaveIntel pressureEnabled={state.sensorPressureEnabled===true} key={`${state.waveId}:${state.status}`} content={content} state={state} wave={preview} style={planningStyle} onStyle={value=>{setPlanningStyle(value);writeGuardPlanningStyle(value);}}/>:null}
        <div className="zb-support-action">
          <VisualImage uri={supportPortrait} alt="" className="zb-support-mini" />
          <span><small>{supportCharacter?.name ?? state.supportId}</small><strong>{t(guard&&!['COORDINATOR','OBSERVER'].includes(state.supportId)?`guard.support.${state.supportId}`:`defense.support.${state.supportId}.skill`)}</strong></span>
          <button
            type="button"
            disabled={state.status !== 'RUNNING' || state.paused || state.supportCooldownRemaining > 0 || !defenseSupportHasTarget(state,content)||state.supportId==='COMMANDER'||state.supportId==='SIGNALER'}
            onClick={() => dispatch({ type: 'UseSupport' })}
            hidden={state.supportId==='COMMANDER'||state.supportId==='SIGNALER'}
          >
            {state.supportCooldownRemaining > 0 ? `${supportCooldownSeconds}s` : t(defenseSupportHasTarget(state,content)?'defense.ui.support':'guard.support.no_target')}
            {state.supportCooldownRemaining <= 0 ? <kbd className="zb-hotkey">Q</kbd> : null}
          </button>
          {guardMobile&&(state.supportId==='COMMANDER'||state.supportId==='SIGNALER')?<button type="button" className="guard-spatial-pick" onClick={()=>choosePad(state.towers[0]?.padId??content.map.pads[0]!.id)}>{t('guard.mobile.select_equipment')}</button>:null}
        </div>

        {/* Phase 2: Active E-Stop Button */}
        <div className="zb-estop-action">
          <span><small>E-STOP</small><strong>{t('defense.tactics.estop')}</strong></span>
          <button
            type="button"
            className="zb-estop-btn"
            disabled={state.status !== 'RUNNING' || state.paused || eStopCooldown > 0}
            onClick={triggerEStop}
          >
            {eStopCooldown > 0 ? `${Math.ceil(eStopCooldown)}s` : '🚨 E-STOP'}
            {eStopCooldown <= 0 ? <kbd className="zb-hotkey" style={{ marginLeft: 4 }}>E</kbd> : null}
          </button>
        </div>
        {(state.status === 'READY' || state.status === 'INTERMISSION')&&<OperationHandoffDossier mode="defense" defense={{content,state,execute:dispatch,name:id=>towerName(content.map.id,id),pauseReading:()=>{if(state.status==='INTERMISSION'&&!state.paused)dispatch({type:'SetPaused',paused:true});}}}/>}
        {(state.status === 'READY' || state.status === 'INTERMISSION') ? <button
          className="zb-start-wave"
          type="button"
          disabled={needsTransition}
          onClick={() => dispatch({ type: 'StartWave' })}
        >{t(state.status === 'READY' ? 'defense.ui.start_wave' : 'defense.ui.start_next')}<kbd className="zb-hotkey">Enter</kbd></button> : null}
        {notice ? <p className="zb-notice" role="status">{notice}</p> : null}
      </section>
      <div className="zb-planning-notes">
        {guard?<details className="guard-help" open={helpOpen||tutorial.pausedByGuide} onToggle={event=>setHelpOpen(event.currentTarget.open)}><summary>{t('guard.controls.help')}</summary><DefenseTutorial controller={tutorial}/><p>{t('guard.purchase.hint')}</p></details>:<DefenseTutorial controller={tutorial}/>}
        {preview?.groups.some(group=>group.enemy==='BOSS')?<p className="zb-danger-note">{t('defense.tactics.boss')}</p>:preview?.groups.some(group=>group.enemy==='VEILED')?<p>{t('defense.tactics.hidden')}</p>:null}
        {selectedPad&&state.paused?<p>{t('defense.tactics.hold_hint')}</p>:null}
      </div>
    </footer>
    {guardMobile&&selectedPad&&!result?<nav className="guard-mobile-selectionbar" aria-label={t('guard.mobile.selection_actions')}>
      <button type="button" onClick={()=>{setSelectedPadId(null);setSelectedTowerId(null);}}>{t('guard.mobile.map')}</button>
      {state.status==='RUNNING'?<button type="button" className="is-primary" onClick={()=>dispatch({type:'SetPaused',paused:false})}>{t('guard.mobile.continue')}</button>:<button type="button" className="is-primary" onClick={()=>needsTransition?openMobileInfo():dispatch({type:'StartWave'})}>{t(needsTransition?'guard.mobile.transition':state.status==='READY'?'defense.ui.start_wave':'defense.ui.start_next')}</button>}
    </nav>:null}

    {result ? <section className={`zb-result ${result.won ? 'is-win' : 'is-loss'}`} role="dialog" aria-modal="true" aria-labelledby="zb-result-title" data-result-grade="COMMERCIAL_GFX_V1">
      <div>
        <div className="zb-result-keyart" aria-hidden="true"><img src={DEFENSE_PREMIUM_HERO} alt=""/><span>{t('defense.art.result')}</span></div>
        <div className="zb-result-head">
          <span className="zb-result-kicker">{t('defense.ui.result')}</span>
          <div className="zb-result-stars" aria-hidden="true">{[1,2,3].map(star => <span key={star} className={star <= result.stars ? 'is-earned' : ''}>★</span>)}</div>
        </div>
        <h2 id="zb-result-title">{t(result.won ? 'defense.ui.won' : 'defense.ui.lost')}</h2>
        <dl>
          <div><dt>{t('defense.ui.stars')}</dt><dd>{result.stars} / 3</dd></div>
          <div><dt>{t('defense.ui.score')}</dt><dd>{result.score.toLocaleString()}</dd></div>
          <div><dt>{t('defense.ui.completed')}</dt><dd>{result.completedWaves} / {content.waves.length}</dd></div>
          <div><dt>{t('defense.ui.shield')}</dt><dd>{result.shield}</dd></div>
        </dl>
        <div className="zb-result-actions">
          {guard&&result.won&&guardContents[guardIndex+1]?<button className="guard-next" disabled={persistence.saveStatus==='saving'||!persistence.document.records.some(r=>r.scenarioId===content.scenario.id&&r.clears>0)} onClick={()=>{persistence.retryAfterResult();setSelectedScenarioId(guardStageIds[guardIndex+1]!);}}>{t("guard.next")}</button>:null}
          <button type="button" onClick={retry}>{t('defense.ui.retry')}</button>
          <button type="button" onClick={() => { if(guard)void operations();else void persistence.exitToMain(); }}>{t(guard?'guard.home':activeEvent ? 'defense.event.return' : 'defense.ui.exit')}</button>
        </div>
        {guard?<button type="button" onClick={openEncounterIntel}>{encounterIntelTitle}</button>:null}
        {guard&&state.tacticalStats?<details className="guard-result-review" open={!result.won}><summary>{t('guard.review')} · {t('guard.review.resolved')} {state.tacticalStats.resolved}</summary><GuardTacticalDebrief report={guardTacticalReport(content,state)!} adviceId={guardDebriefAdvice(state)}/></details>:null}
        {guard?<p className="guard-result-boundary">{t('defense.tactics.boundary')}</p>:<section className="zb-tactics-debrief"><h3>{t('defense.tactics.review')}</h3><p>{t('defense.tactics.boundary')}</p>
          <strong>{t('defense.tactics.loadout')}</strong><p>{state.towers.map(tower=>`${tower.padId} ${towerName(content.map.id,tower.towerId)} ${tower.levelId}`).join(' · ')||'—'}</p>
          <strong>{t('defense.tactics.leaks')}</strong><p>{leakedEntries.length?leakedEntries.map(([id,count])=>`${enemyName(content.map.id,id)} ×${count}`).join(' · '):t('defense.tactics.no_leaks')}</p>
          {leakedEntries.length?<p>{t('defense.tactics.recommended')} · {towerName(content.map.id,recommendedTowerId)} · {towerRole(content.map.id,recommendedTowerId)}</p>:null}
        </section>}
        {activeEvent && eventDebriefTextId ? <section className="zb-event-debrief" data-event-debrief={activeEvent.id}>
          <strong>{t(activeEvent.titleTextId)}</strong>
          <p>{t(eventDebriefTextId)}</p>
          <div className="zb-event-leaks">
            <small>{t('defense.event.result.leaks')}</small>
            {leakedEntries.length ? <ul>{leakedEntries.map(([enemyId, count]) => <li key={enemyId}>
              <span>{enemyName(content.map.id, enemyId)}</span><b>×{count}</b>
            </li>)}</ul> : <p>{t('defense.event.result.no_leaks')}</p>}
          </div>
          <div className="zb-event-recommend">
            <small>{t('defense.event.result.recommend')}</small>
            <strong>{towerName(content.map.id, recommendedTowerId)}</strong>
            <span>{towerRole(content.map.id, recommendedTowerId)}</span>
          </div>
        </section> : null}
        {persistence.awardedCosmeticIds.length ? <div className="zb-result-rewards">
          <strong>{t('defense.save.reward')}</strong>
          {persistence.awardedCosmeticIds.map(id => <span key={id}>
            {id === 'tablet-skin-signal-blue'
              ? t('defense.event.reward.signal_blue')
              : id === content.scenario.threeStarCosmetic ? t('defense.save.reward.three') : t('defense.save.reward.first')}
          </span>)}
        </div> : null}
      </div>
    </section> : null}

    <DefenseConflictOverlay controller={persistence} />

  </main>;
}

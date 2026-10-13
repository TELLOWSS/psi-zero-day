import type { HazardType, PatrolStageDefinition } from '../domain/patrol-survivors';
import {PATROL_DIFFICULTIES, type PatrolDifficulty} from '../domain/survivors-challenge';
import {operationTiming} from './survivors-operation';

/** Authored map progression; independent of permanent upgrades and player performance. */
export function difficultyProfile(stageNumber: number) {
  const number=Number.isFinite(stageNumber)?Math.max(1,Math.min(50,Math.floor(stageNumber))):1;
  const n = Math.min(20,number),advanced=Math.max(0,number-20);
  return {
    openingInterval: 1.65 - (n - 1) * .035-advanced*.008,
    finalInterval: .72 - (n - 1) * .012-advanced*.004,
    activeLimit: 18 + (n - 1) * 2+Math.floor(advanced/3),
    telegraphLimit: n <= 5 ? 2 : n <= 12 ? 3 : 4,
    hpScale: 1 + (n - 1) * .018+advanced*.01,
    introductionTime: n <= 3 ? 30 : n <= 10 ? 20 : 12,
  };
}

export type SurvivorsWave = 1 | 2 | 3;

export interface WaveDirectorProfile {
  wave: SurvivorsWave;
  key: 'scan_build' | 'pressure_shift' | 'red_zone';
  title: string;
  detail: string;
  intervalMultiplier: number;
  activeLimitDelta: number;
  telegraphLimitDelta: number;
  complexBias: number;
  recovery: boolean;
  surge: boolean;
  bossPrelude: boolean;
}

/** Authored three-act pacing. It is time/stage driven, never a response to player power. */
export function waveDirector(time:number,maxTime=180):WaveDirectorProfile {
  const t=Math.max(0,Number.isFinite(time)?time:0);
  const timing=operationTiming(maxTime);
  if(t<timing.wave2At){
    return {
      wave:1,key:'scan_build',title:'탐색 · 빌드업',
      detail:'기본 위험을 읽고 이동·회수·장비 조합을 완성',
      intervalMultiplier:1.18,activeLimitDelta:-4,telegraphLimitDelta:-1,
      complexBias:.12,recovery:false,surge:false,bossPrelude:false,
    };
  }
  if(t<timing.wave3At){
    const elapsed=t-timing.wave2At;
    const cycle=elapsed%22;
    const surge=cycle<12;
    const recovery=cycle>=16;
    return {
      wave:2,key:'pressure_shift',title:'압박 · 변칙 대응',
      detail:surge?'복합 위험이 밀려옵니다 · 동선을 먼저 확보':'짧은 회복 구간 · 기록 회수와 위치 재정비',
      intervalMultiplier:recovery?1.28:surge?.84:1.02,
      activeLimitDelta:surge?2:0,telegraphLimitDelta:0,
      complexBias:.42,recovery,surge,bossPrelude:false,
    };
  }
  const bossPrelude=t>=timing.bossRevealAt;
  return {
    wave:3,key:'red_zone',title:'RED ZONE · 보스 전초전',
    detail:bossPrelude?'대표 위험 신호 포착 · 전장을 비우고 보스 패턴 준비':'복합 위험 집중 · 최종 장비 조합을 완성',
    intervalMultiplier:bossPrelude?1.16:.70,
    activeLimitDelta:bossPrelude?1:5,
    telegraphLimitDelta:1,complexBias:.78,
    recovery:bossPrelude,surge:!bossPrelude,bossPrelude,
  };
}

/** Recovery follows each pressure wave, with room to read the first boss alert. */
export function spawnPressure(stageNumber: number, time: number, difficulty:PatrolDifficulty='standard',maxTime=180) {
  const p = difficultyProfile(stageNumber);
  const director=waveDirector(time,maxTime);
  const progress = Math.max(0, Math.min(1, time / Math.max(1,maxTime)));
  const contract=PATROL_DIFFICULTIES[difficulty];
  const baseInterval=p.openingInterval + (p.finalInterval - p.openingInterval) * progress;
  return {
    ...p,
    wave:director.wave,
    surge:director.surge,
    recovery:director.recovery,
    bossPrelude:director.bossPrelude,
    hpScale:p.hpScale*contract.hp,
    activeLimit:Math.max(8,p.activeLimit+director.activeLimitDelta),
    telegraphLimit:Math.max(1,p.telegraphLimit+director.telegraphLimitDelta),
    interval:baseInterval*director.intervalMultiplier*contract.spawn,
  };
}

const introductoryMixes: readonly (readonly HazardType[])[] = [
  ['UNHELMETED', 'UNHELMETED', 'RUNAWAY_CART'],
  ['UNHELMETED', 'GAS_LEAK', 'GAS_LEAK', 'RUNAWAY_CART'],
  ['UNHELMETED', 'FALLING_DEBRIS', 'RUNAWAY_CART'],
  ['UNHELMETED', 'RUNAWAY_CART', 'RUNAWAY_CART', 'GAS_LEAK'],
  ['UNHELMETED', 'GAS_LEAK', 'FALLING_DEBRIS', 'RUNAWAY_CART'],
];
export function selectStageHazard(stage: PatrolStageDefinition, time: number, roll: number,maxTime=180,accentRoll?:number): HazardType {
  if (time < difficultyProfile(stage.stageNumber).introductionTime) return 'UNHELMETED';
  // Bosses are authored one-off events, never accidental ordinary spawns.
  const mix = (stage.hazardMix ?? introductoryMixes[Math.max(0, Math.min(4, stage.stageNumber - 1))] ?? ['UNHELMETED'])
    .filter(type => type !== 'CRANE_BOSS');
  const selected=mix[Math.min(mix.length - 1, Math.max(0, Math.floor(roll * mix.length)))] ?? 'UNHELMETED';
  const complex=mix.filter(type=>type!=='UNHELMETED');
  const director=waveDirector(time,maxTime);
  const accent=accentRoll===undefined?((roll*1.61803398875+.173)%1):Math.max(0,Math.min(.999999,accentRoll));

  // Wave 1 teaches the map language: complex hazards appear, but never dominate the screen.
  if(director.wave===1&&selected!=='UNHELMETED'&&accent<.55)return 'UNHELMETED';

  // Wave 2/3 deliberately replace some generic contacts with authored stage hazards.
  if(complex.length&&selected==='UNHELMETED'&&accent<director.complexBias){
    const index=Math.min(complex.length-1,Math.floor(((roll*7.173)+accent)%1*complex.length));
    return complex[index]??selected;
  }
  if(complex.length&&director.wave===3&&accent<.34){
    const index=Math.min(complex.length-1,Math.floor(((accent*5.31)+roll)%1*complex.length));
    return complex[index]??selected;
  }
  return selected;
}


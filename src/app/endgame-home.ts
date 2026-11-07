import {decodeDefenseSave} from './defense-save';
import {GUARD_SAVE_KEY,GUARD_V1_SAVE_KEY} from './guard-storage';
import {guardStageIds} from '../content/guard-campaign';
import {parseSave,validStars} from './survivors-save';
import {completedPatrolStages} from '../domain/survivors-recreation';
import {sanitizeDifficultyClearRecords} from '../domain/survivors-difficulty-records';
import {PATROL_STAGE_IDS} from '../domain/patrol-survivors';

export type StorageReader=Pick<Storage,'getItem'>;
export interface EndgameHomeStatus {
  readonly guardClears:number;readonly guardMastered:number;
  readonly watchClears:number;readonly watchMastered:number;
  readonly veteran:boolean;readonly guardUnlocked:boolean;readonly watchUnlocked:boolean;
  readonly lastStageNumber:number;
}

/** Saved progress is display-only: corrupt, missing and old save keys never grant unlocks. */
export function readEndgameHomeStatus(storage?:StorageReader):EndgameHomeStatus{
  const empty:EndgameHomeStatus={guardClears:0,guardMastered:0,watchClears:0,watchMastered:0,veteran:false,guardUnlocked:false,watchUnlocked:false,lastStageNumber:1};
  if(!storage)return empty;
  const get=(key:string):string|null=>{try{return storage.getItem(key);}catch{return null;}};
  const raw=get(GUARD_SAVE_KEY)??get(GUARD_V1_SAVE_KEY);
  const saved=raw?decodeDefenseSave(raw):null;
  const records=saved?.payload.records??[];
  const guardClears=guardStageIds.filter(id=>records.some(r=>r.scenarioId===id&&r.clears>0)).length;
  const guardMastered=guardStageIds.filter(id=>records.some(r=>r.scenarioId===id&&r.bestMasteryStars===3)).length;
  const wallet=parseSave(get('psi.survivors.store_wallet'));
  const data=wallet&&typeof wallet==='object'&&!Array.isArray(wallet)?wallet as Record<string,unknown>:{};
  const stars=validStars(parseSave(get('psi.survivors.stage_stars')));
  const growth=parseSave(get('psi.survivors.growth_v1'));
  const watchClears=completedPatrolStages(stars,growth,data.clearRewardClaims).length;
  const difficulty=sanitizeDifficultyClearRecords(data.difficultyClearRecords);
  const watchMastered=PATROL_STAGE_IDS.filter(id=>difficulty[id]?.mastery===3).length;
  const last=get('psi.survivors.last_played_stage');
  const lastIndex=PATROL_STAGE_IDS.indexOf(last as typeof PATROL_STAGE_IDS[number]);
  return {guardClears,guardMastered,watchClears,watchMastered,
    veteran:guardClears===guardStageIds.length||watchClears===PATROL_STAGE_IDS.length,
    guardUnlocked:guardClears===guardStageIds.length,watchUnlocked:watchClears===PATROL_STAGE_IDS.length,
    lastStageNumber:Math.max(1,lastIndex+1)};
}

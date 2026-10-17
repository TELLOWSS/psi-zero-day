import type {DefenseContent,DefenseEnemyState,DefenseRunState,DefenseTargetMode} from '../domain/defense';
import {defenseEnemyPath,defensePathLength} from './defense-geometry';

function threat(enemy:DefenseEnemyState,content:DefenseContent):number{
 const phase=enemy.sensorPressure?.phase;
 if(phase==='WARNING'||phase==='ACTIVE')return 3;
 const definition=content.enemies.find(e=>e.id===enemy.enemyId);
 return definition?.boss?2:definition?.hidden?1:0;
}
/** Call only after visibility and range filtering. No target mode grants detection or reach. */
export function compareDefenseTargets(a:DefenseEnemyState,b:DefenseEnemyState,mode:DefenseTargetMode,content:DefenseContent,state:DefenseRunState):number{
 const remaining=(e:DefenseEnemyState)=>Math.max(0,defensePathLength(defenseEnemyPath(content,e,state))-e.distance);
 const priority=mode==='THREAT'?threat(b,content)-threat(a,content):mode==='STRONG'?b.hp-a.hp:0;
 return priority||remaining(a)-remaining(b)||a.spawnSequence-b.spawnSequence||(a.id<b.id?-1:a.id>b.id?1:0);
}

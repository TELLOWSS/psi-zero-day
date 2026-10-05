import copy from '../../content/localization/survivors-campaign50-ko.json';
import type {CharacterId,HazardType,PatrolStageDefinition,PatrolStageId,StageHazardObject} from '../domain/patrol-survivors';

const layouts: readonly (readonly [number,number][])[] = [
  [[350,270],[1050,630],[1050,270],[350,630],[700,180]],
  [[300,450],[1100,450],[500,250],[900,650],[950,200]],
  [[400,240],[1000,240],[400,660],[1000,660],[700,720]],
  [[330,300],[1070,600],[800,220],[600,680],[1100,240]],
  [[450,220],[950,680],[1050,350],[350,550],[700,720]],
];
const speakers: CharacterId[]=['safety_monitor','lee_jaehoon','lim_junho','kang_taesik','yoon_sungho'];
function object(id:string,type:StageHazardObject['type'],point:readonly [number,number],label:string):StageHazardObject {
  const staticObject=type==='floodlight_tower'||type==='crane_drop_zone';
  return {id,type,x:point[0],y:point[1],label,radius:type==='floodlight_tower'?150:type==='crane_drop_zone'?100:type==='slurry_puddle'?54:30,
    hp:staticObject?9999:60,maxHp:staticObject?9999:60,state:type==='floodlight_tower'?'active':'idle',timer:type==='crane_drop_zone'?10:0};
}

/** Authored workfaces use existing mechanics; scenery never implies new terrain collision. */
export const ADVANCED_PATROL_STAGES=Object.fromEntries(copy.stages.map(row=>{
  const n=row.number,id=`stage_${n}` as PatrolStageId,points=layouts[(n-21)%5]!;
  const chapter=Math.floor((n-1)/10),gas=row.mix.filter(t=>t==='GAS_LEAK').length>1;
  const objects=[
    object(`${id}_west`,gas?'electric_transformer':'crane_drop_zone',points[0]!,copy.controls.west),
    object(`${id}_east`,gas?'explosive_barrel':'crane_drop_zone',points[1]!,copy.controls.east),
    object(`${id}_power`,'electric_transformer',points[2]!,copy.controls.power),
    object(`${id}_stock`,n%2?'explosive_barrel':'crane_drop_zone',points[3]!,n%2?copy.controls.stock:copy.controls.lift),
    object(`${id}_light`,'floodlight_tower',points[4]!,copy.controls.light),
  ];
  if(row.ground==='deepworks')objects.push(object(`${id}_drain`,'slurry_puddle',[points[0]![0]+110,points[0]![1]+90],copy.controls.drain));
  const stage:PatrolStageDefinition={id,stageNumber:n,name:row.name,siteProfileId:row.profile,
    subtitle:copy.chapters[chapter]!,description:row.brief,
    theme:chapter===2?'deep_excavation':chapter===3?'highrise_slab':'datacenter',
    floorColor:'#27322f',gridColor:'rgba(180,200,190,.06)',borderColor:chapter===2?'#76d9bd':chapter===3?'#efc876':'#81dcea',ambientColor:'rgba(220,230,210,.04)',icon:'🏗️',
    hazards:objects,hazardMix:row.mix as HazardType[],difficulty:1.6+(n-21)*.012,
    bossName:row.name,bossTitle:'STOP · ISOLATE · VERIFY',bossType:row.boss as HazardType,bossHp:2600+(n-21)*35,
    narrative:{speaker:speakers[(n-21)%speakers.length]!,brief:row.brief,success:copy.success,residual:copy.residual},
    starChallenges:[
      {starIndex:1,metric:'victory',title:copy.objectives.clear,description:copy.objectives.clear_detail,currentValue:0,targetValue:1,isCompleted:false},
      {starIndex:2,metric:'environmental',title:copy.objectives.control,description:copy.objectives.control_detail,currentValue:0,targetValue:6+chapter,isCompleted:false},
      {starIndex:3,metric:'boss',title:copy.objectives.boss,description:copy.objectives.boss_detail,currentValue:0,targetValue:1,isCompleted:false},
    ]};
  return [id,stage];
})) as Record<Exclude<Extract<PatrolStageId,`stage_2${number}`|`stage_3${number}`|`stage_4${number}`|'stage_50'>,'stage_20'>,PatrolStageDefinition>;

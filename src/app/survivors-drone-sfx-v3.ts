import type {SurvivorsAudioAsset} from '../domain/survivors-audio';

export type DroneV3Id =
  | 'base_release'
  | 'premium_release'
  | 'hunter_a'
  | 'hunter_b'
  | 'launch'
  | 'dock';

const definitions: readonly {id:DroneV3Id;uri:string;sha256:string}[] = [
  {id:'base_release',uri:'/assets/survivors/drone-sfx-v3/drone_base_release.ogg',sha256:'fdae8d1f5cc3c645ecd93899e0dcaf087f45ed4a4ffd4f54bb0296e5ce25a891'},
  {id:'premium_release',uri:'/assets/survivors/drone-sfx-v3/drone_premium_release.ogg',sha256:'7c20fc7ea420b8662ada640fd2f0ddbc2ad8eba6b44e8f933246137553a9108c'},
  {id:'hunter_a',uri:'/assets/survivors/drone-sfx-v3/drone_hunter_a.ogg',sha256:'1dada3c4a8927063d71949b24913bfe94ecc883d43633ca0f51ac83570e92837'},
  {id:'hunter_b',uri:'/assets/survivors/drone-sfx-v3/drone_hunter_b.ogg',sha256:'c601c039532f10254f8e5c19b22c282b142394a03fdd455be147a42dee2db2ef'},
  {id:'launch',uri:'/assets/survivors/drone-sfx-v3/drone_launch.ogg',sha256:'30833ebd4c5da245d68c8d061eab565d7a8e42f373ffc45d1dc5ef87ec9d8558'},
  {id:'dock',uri:'/assets/survivors/drone-sfx-v3/drone_dock.ogg',sha256:'a7400562937471143132e2c527c97bf8264e02df66433a0275d08985b9302b22'},
];

export const DRONE_V3_ASSETS: readonly SurvivorsAudioAsset[] = definitions.map(({id,uri,sha256})=>({
  id:'drone_v3.'+id,
  bus:'SFX',
  status:'CANDIDATE',
  uri,
  sha256,
  rights:'DIRECTOR_SUPPLIED_MANUS_V3_RUNTIME_CANDIDATE_LISTENING_REVIEW_REQUIRED',
  loop:false,
}));

export function droneV3Asset(id:DroneV3Id):SurvivorsAudioAsset {
  return DRONE_V3_ASSETS.find(asset=>asset.id==='drone_v3.'+id)!;
}

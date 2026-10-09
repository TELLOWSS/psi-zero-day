import type {SurvivorsGameState} from '../domain/patrol-survivors';
export const COMMUNICATION_WEAR_ART='/assets/survivors/wearables/communication-worn-v2.png';
const columns={voice_lens:1,command_array:2,broadcast_crown:3} as const;
/** Visual selection only: purchased equipment never grants a free weapon or combat benefit. */
export function communicationWearPlan(state:Readonly<SurvivorsGameState>,direction?:number) {
 const purchase=state.premiumGear?.equipped.find(id=>Object.hasOwn(columns,id));
 const free=state.activePerks.radio_boost>0||state.activePerks.satellite_broadcast>0;
 if(!purchase&&!free)return undefined;
 const column=purchase?columns[purchase as keyof typeof columns]:0;
 const row=direction===undefined?0:direction>=5?2:direction===0||direction===4?1:0;
 return {column,row,cell:row*4+column,layer:row===2?'back' as const:'front' as const,id:purchase??'radio_boost'};
}

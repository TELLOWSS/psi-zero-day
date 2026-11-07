/** Stage 50 mastery counterplay: difficulty escalates with consecutive clean evasions.
 * A visible warning always lasts 2.2s, independent of user gear or platform.
 */
export const MASTERY_WARNING_SECONDS=2.2;
export type MasteryPressureProfile={readonly tier:1|2|3;readonly radius:number;readonly cooldownSeconds:number;readonly dodgeScore:number};
export function masteryBossPressureProfile(streak:number):MasteryPressureProfile {
 const clean=Number.isFinite(streak)?Math.max(0,Math.floor(streak)):0;
 if(clean>=6)return {tier:3,radius:144,cooldownSeconds:3.8,dodgeScore:180};
 if(clean>=3)return {tier:2,radius:132,cooldownSeconds:4.3,dodgeScore:140};
 return {tier:1,radius:118,cooldownSeconds:4.8,dodgeScore:100};
}

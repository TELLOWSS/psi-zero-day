export const ULTIMATE_LESSON_KEY='psi.survivors.ultimate-lesson.v1';
export const ULTIMATE_LESSON_SEEN_KEY='psi.survivors.ultimate-lesson.v2';
export function readUltimateLessonSeen():boolean{try{return localStorage.getItem(ULTIMATE_LESSON_SEEN_KEY)==='shown'||readUltimateLesson();}catch{return false;}}
export function rememberUltimateLessonShown(){try{localStorage.setItem(ULTIMATE_LESSON_SEEN_KEY,'shown');}catch{/* Keep session memory when persistence is unavailable. */}}
export function shouldOfferUltimateLesson(stageId:string,used:boolean,seen:boolean){return stageId==='stage_01'&&!used&&!seen;}
export function readUltimateLesson():boolean{try{return localStorage.getItem(ULTIMATE_LESSON_KEY)==='used';}catch{return false;}}
/** Save only after the actual engine activation succeeded; storage failure never blocks play. */
export function rememberUltimateUse(){try{localStorage.setItem(ULTIMATE_LESSON_KEY,'used');}catch{/* Session memory still records success. */}}
export function ultimateReadiness(charge:number,max:number){
 const valid=Number.isFinite(charge)&&Number.isFinite(max)&&max>0;
 return {ready:valid&&charge>=max,percent:valid?Math.max(0,Math.min(100,Math.floor(charge/max*100))):0};
}

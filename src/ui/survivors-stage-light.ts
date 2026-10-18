/** Stage 01 production candidate. Other stages keep their reviewed lighting until their own gate. */
const FOUNDATION_LIGHT = Object.freeze({
  color: '#ffe4b8', fill: .065, shadowX: .42, shadowY: .28, opacity: .19,
});
export function stageActorLight(stageId:string):typeof FOUNDATION_LIGHT|undefined {
  return stageId==='stage_01'?FOUNDATION_LIGHT:undefined;
}

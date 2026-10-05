import type { PatrolStageDefinition, SurvivorsGameState } from '../domain/patrol-survivors';

/** Different authored routes to completion, never a performance-based difficulty penalty. */
export function operationPlan(stage:PatrolStageDefinition) {
  const mode=(stage.stageNumber-1)%3;
  const available=stage.hazards.filter(h=>h.type==='explosive_barrel'||h.type==='electric_transformer'||h.type==='crane_drop_zone').length;
  const advanced=Math.max(0,Math.floor((stage.stageNumber-21)/10)+1);
  return {mode,earliest:(mode===0?90:mode===1?105:120)+advanced*5,
    zones:Math.min(available,(mode===1?2:1)+(advanced>=2?1:0)),controls:mode===2?18+stage.stageNumber:8+Math.floor(stage.stageNumber/2)};
}
export function operationProgress(state:SurvivorsGameState) {
  const plan=operationPlan(state.stage);
  const controlled=new Set(state.operationControlledZones ?? []);
  for(const h of state.interactiveHazards) {
    if((h.type==='explosive_barrel'&&(h.state==='active'||h.state==='destroyed')) ||
       (h.type==='electric_transformer'&&h.state==='active') ||
       (h.type==='crane_drop_zone'&&h.state==='cooldown'))controlled.add(h.id);
  }
  const zones=controlled.size;
  const boss=Boolean(state.stageBossNeutralized);
  const complete=state.gameTime>=plan.earliest&&boss&&zones>=plan.zones&&state.hazardsNeutralized>=plan.controls;
  return {...plan,zonesSecured:zones,boss,controlsDone:state.hazardsNeutralized,complete};
}

/** Record completed interventions before their short presentation state expires. */
export function recordOperationControls(state:SurvivorsGameState):void {
  const ids=new Set(state.operationControlledZones ?? []);
  for(const h of state.interactiveHazards) {
    if((h.type==='explosive_barrel'&&(h.state==='active'||h.state==='destroyed')) ||
       (h.type==='electric_transformer'&&h.state==='active') ||
       (h.type==='crane_drop_zone'&&h.state==='cooldown')) ids.add(h.id);
  }
  state.operationControlledZones=[...ids];
}

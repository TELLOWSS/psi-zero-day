export interface FieldTactics {
 supportCharges:number;supportCooldown:number;
 pendingSupport?:{x:number;y:number;remaining:number};
 lineCharges:number;lineCooldown:number;
 lines:Array<{x:number;y:number;radius:number;remaining:number}>;
 handoff?:{x:number;y:number;remaining:number};
}

export type CombatNotice='boss'|'damage'|'evolution'|'signature'|'mastery'|'counterplay'|'wave'|'supply';
/** One foreground notice owns the shared HUD lane; confirmed danger outranks celebration. */
export function selectCombatNotice(active:Partial<Record<CombatNotice,boolean>>,signatureDanger=false):CombatNotice|undefined {
 const order:CombatNotice[]=['boss',...(signatureDanger?['signature' as const]:[]),'damage','evolution','mastery','counterplay','signature','wave','supply'];
 return order.find(kind=>active[kind]);
}

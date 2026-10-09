import {expect,it} from 'vitest';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {previewSupplyUpgrade} from '../src/app/survivors-supply-preview';
it('projects capped healing without changing gameplay or nested state',()=>{
 const state=createInitialSurvivorsState('player',undefined,'stage_01');state.player.hp=state.player.maxHp-5;const before=JSON.stringify(state);
 expect(previewSupplyUpgrade(state,s=>{s.player.hp=Math.min(s.player.maxHp,s.player.hp+s.player.maxHp*.6);})).toEqual([{field:'hp',before:state.player.hp,after:state.player.maxHp}]);expect(JSON.stringify(state)).toBe(before);
 state.player.hp=state.player.maxHp;expect(previewSupplyUpgrade(state,s=>{s.player.hp=Math.min(s.player.maxHp,s.player.hp+s.player.maxHp*.6);})).toEqual([]);
});
it('shows only actual changes at cooldown cap and both health fields',()=>{
 const state=createInitialSurvivorsState('player',undefined,'stage_01');state.player.cooldownReduction=.5;
 expect(previewSupplyUpgrade(state,s=>{s.player.cooldownReduction=Math.min(.5,s.player.cooldownReduction+.1);})).toEqual([]);
 expect(previewSupplyUpgrade(state,s=>{s.player.maxHp+=40;s.player.hp+=40;})).toHaveLength(2);
});

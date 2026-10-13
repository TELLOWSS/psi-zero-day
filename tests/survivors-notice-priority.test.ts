import {expect,it} from 'vitest';
import {selectCombatNotice} from '../src/ui/survivors-notice-priority';
it('reserves one notice lane and prioritizes real danger over success messages',()=>{
 const all={boss:true,evolution:true,signature:true,mastery:true,counterplay:true,wave:true,supply:true};
 expect(selectCombatNotice(all,true)).toBe('boss');
 expect(selectCombatNotice({...all,boss:false},true)).toBe('signature');
 expect(selectCombatNotice({damage:true,wave:true})).toBe('damage');
 expect(selectCombatNotice({...all,boss:false,evolution:false},true)).toBe('signature');
 expect(selectCombatNotice({...all,boss:false,evolution:false})).toBe('mastery');
 expect(selectCombatNotice({signature:true,wave:true,supply:true})).toBe('signature');
 expect(selectCombatNotice({wave:true,supply:true})).toBe('wave');
 expect(selectCombatNotice({supply:true})).toBe('supply');expect(selectCombatNotice({})).toBeUndefined();
});

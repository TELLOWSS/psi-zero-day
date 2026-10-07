// @vitest-environment jsdom
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {SurvivorsUpgradeStats} from '../src/ui/SurvivorsUpgradeStats';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
it('keeps real upgrade values in compact mode and full comparison available for detail',()=>{
 const player=createInitialSurvivorsState().player;
 const props={id:'radio_boost' as const,level:1,previousId:'radio_boost' as const,previousLevel:0,player,inFloodlight:false};
 const compact=renderToStaticMarkup(<SurvivorsUpgradeStats {...props} compact/>),full=renderToStaticMarkup(<SurvivorsUpgradeStats {...props}/>);
 const compactNode=document.createElement('div'),fullNode=document.createElement('div');compactNode.innerHTML=compact;fullNode.innerHTML=full;
 expect(compactNode.querySelectorAll('dt')).toHaveLength(2);expect(fullNode.querySelectorAll('dt').length).toBeGreaterThan(2);
 expect(compactNode.querySelector('small')).toBeNull();expect(fullNode.querySelector('small')).not.toBeNull();
 for(const value of compactNode.querySelectorAll('strong'))expect(full).toContain(value.textContent!);
 expect(compact).not.toContain('NaN');expect(JSON.stringify(player)).toBe(JSON.stringify(createInitialSurvivorsState().player));
});

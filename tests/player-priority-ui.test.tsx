// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach,beforeEach,it,expect} from 'vitest';
import {StoryEvidence} from '../src/ui/StoryEvidence';
import {GuardWaveIntel} from '../src/ui/GuardWaveIntel';
import {GuardTacticalDebrief} from '../src/ui/GuardTacticalDebrief';
import {guardContents} from '../src/content/guard-campaign';
import {createDefenseRun} from '../src/engine/defense';
import {guardTacticalReport} from '../src/app/guard-tactical-report';
import {emptyDefenseSaveDocument,encodeDefenseSave} from '../src/app/defense-save';
import {GUARD_SAVE_KEY} from '../src/app/guard-storage';
import {guardPersistenceContent} from '../src/app/guard-save-version';
import {STORY_EVIDENCE_KEY} from '../src/app/story-evidence';
import locale from '../content/localization/story-novel-ko.json';
import {episode01DayCarryover} from '../src/app/episode01-day-carryover';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
const t=(id:string)=>(locale.messages as Record<string,string>)[id]??id;
let host:HTMLDivElement,root:ReturnType<typeof createRoot>;
beforeEach(()=>{localStorage.clear();host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(()=>{act(()=>root.unmount());host.remove();});
it('collects a latest defeat from the real save into source-labelled generic training UI and deduplicates on focus',async()=>{
 const doc={...emptyDefenseSaveDocument(),records:[{scenarioId:'guard-gd-03-v1',finishedRuns:2,clears:1,bestStars:3 as const,bestScore:200,bestShield:20,bestCompletedWaves:8,lastResultRunId:'latest-loss',lastResultWon:false,updatedAt:'2026-10-19T01:00:00Z'}]};
 localStorage.setItem(GUARD_SAVE_KEY,encodeDefenseSave(doc,guardPersistenceContent,1));
 await act(async()=>{root.render(<StoryEvidence eventId="e01_05_command" state={null} t={t}/>);});
 expect(host.textContent).toContain('guard-gd-03-v1');
 expect(host.textContent).toContain(t('story.evidence.outcome.incomplete'));
 expect(host.textContent).toContain(t('story.evidence.general'));
 expect(host.querySelector('time')?.dateTime).toBe('2026-10-19T01:00:00Z');
 await act(async()=>{window.dispatchEvent(new Event('focus'));});
 expect(JSON.parse(localStorage.getItem(STORY_EVIDENCE_KEY)!)).toHaveLength(1);
 expect(host.querySelectorAll('[data-evidence-mode]')).toHaveLength(1);
});
it('shows upcoming hazard advice before the collapsed detailed wave panel',()=>{
 const content=guardContents[5]!,state=createDefenseRun(content,'COORDINATOR','brief');
 act(()=>root.render(<GuardWaveIntel content={content} state={state} wave={content.waves[0]!} style="BALANCED" onStyle={()=>{}}/>));
 expect(host.querySelector('.guard-wave-brief>ul')?.children.length).toBeGreaterThan(0);
 expect(host.querySelector('details')?.open).toBe(false);
 expect(host.querySelector('.guard-wave-brief>strong')?.textContent).toContain('다음 파');
 expect(state.towers).toHaveLength(0);expect(state.resource).toBe(content.initialResource);
});
it('shows leak-time targeting rather than replacing it with the final loadout mode',()=>{
 const c=guardContents[2]!,run={...createDefenseRun(c,'COORDINATOR','review'),status:'LOST' as const};
 const report=guardTacticalReport(c,run)!;
 const proof={...report,stats:{...report.stats,routeLeaks:[{enemyId:'SWIFT' as const,routeId:'main',waveId:3,tick:100,point:{x:900,y:200},targetsAtLeak:[{padId:'P1',targetMode:'STRONG' as const}]}]}};
 act(()=>root.render(<GuardTacticalDebrief report={proof}/>));
 expect(host.querySelector('.guard-failure-review')?.textContent).toContain('빠른 신호');
 expect(host.querySelector('.guard-leak-targets')?.textContent).toContain('P1');
 expect(host.querySelector('.guard-failure-review')?.textContent).toContain('기존 시작 자원');
});
it('keeps missing safety instruction checks ahead of a preserved reporting route',()=>{
 expect(episode01DayCarryover('e01_10_next_day_tease',{stopwork_culture_result:'reporting_route_preserved',instruction_chain_result:'condition_loss_unresolved'})?.cards.at(-1)?.title_text_id).toBe('ui.day_carryover.first.instruction.title');
 expect(episode01DayCarryover('e01_10_next_day_tease',{stopwork_culture_result:'reporting_route_preserved'})?.cards.at(-1)?.title_text_id).toBe('ui.day_carryover.first.route.title');
});
it('distinguishes a recorded empty deployment from unavailable targeting history',()=>{
 const c=guardContents[0]!,run={...createDefenseRun(c,'COORDINATOR','empty-deployment'),status:'LOST' as const};
 const report=guardTacticalReport(c,run)!;
 const proof={...report,stats:{...report.stats,routeLeaks:[{enemyId:'NORMAL' as const,routeId:'main',waveId:2,tick:100,point:{x:900,y:200},targetsAtLeak:[]}]}};
 act(()=>root.render(<GuardTacticalDebrief report={proof}/>));
 expect(host.querySelector('.guard-leak-targets')?.textContent).toContain('이탈 당시 배치된 장비가 없었습니다.');
 expect(host.querySelector('.guard-leak-targets ul')).toBeNull();
 expect(host.textContent).not.toContain('이전 기록에는 이탈 당시 조준 방식이 없습니다.');
});

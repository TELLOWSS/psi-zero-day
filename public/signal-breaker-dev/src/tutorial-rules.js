/* Episode learning presentation contracts; read-only engine facts, no gameplay mutation. */
(function(root){'use strict';
const LESSONS=Object.freeze({
 'CH-01':{titleId:'breaker.guide.ch01',steps:['breaker.guide.move','breaker.guide.source','breaker.guide.fire','breaker.guide.reflect','breaker.guide.capture']},
 'CH-02':{titleId:'breaker.guide.ch02',steps:['breaker.guide.move','breaker.guide.belt','breaker.guide.reflect','breaker.guide.capture']},
 'CH-03':{titleId:'breaker.guide.ch03',steps:['breaker.guide.move','breaker.guide.mist','breaker.guide.capture']},
 'CH-04':{titleId:'breaker.guide.ch04',steps:['breaker.guide.move','breaker.guide.anchor','breaker.guide.reflect']},
 'CH-05':{titleId:'breaker.guide.ch05',steps:['breaker.guide.move','breaker.guide.scan','breaker.guide.capture']}
});
function lesson(g){if(g.practice)return {titleId:'breaker.practice.title',actionId:'breaker.practice.action',completed:0,total:1};if(g.veteran)return {titleId:'breaker.guide.ep02',actionId:g.evolution.recipe?'breaker.guide.ep02.branch':'breaker.guide.ep02.recipe',completed:g.evolution.capstone?3:g.evolution.branch?2:g.evolution.recipe?1:0,total:3};
const spec=LESSONS[g.config.id]||LESSONS['CH-01'],done={
 'breaker.guide.move':Math.abs(g.player.x-290)>40||g.shotsFired>4,
 'breaker.guide.source':!!(g.source?.verified||g.sourceEvidence?.verified),
 'breaker.guide.fire':g.shotsFired>0,
 'breaker.guide.reflect':g.reflectedHits>0,
 'breaker.guide.capture':g.captureUnits>0||g.cleared>0,
 'breaker.guide.belt':g.conveyorDirection!==1,
 'breaker.guide.mist':g.usedWeapons.has('mist'),
 'breaker.guide.anchor':g.usedWeapons.has('anchor'),
 'breaker.guide.scan':g.usedWeapons.has('scan')
};const completed=spec.steps.filter(id=>done[id]).length;return {titleId:spec.titleId,actionId:spec.steps.find(id=>!done[id])||'breaker.guide.next',completed,total:spec.steps.length};}
root.SignalBreakerTutorial={LESSONS,lesson};if(typeof module==='object'&&module.exports)module.exports=root.SignalBreakerTutorial;
})(typeof window!=='undefined'?window:globalThis);

/* PSI Signal Boss Monitor: read-only advice. Never issues input or changes combat. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerRaidAdvisor=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const modes=['full','essential','off'];
 function settings(value){return {mode:modes.includes(value?.mode)?value.mode:'full',sound:value?.sound!==false,voice:value?.voice===true};}
 function advice(s,playerX,mode='full'){
  if(!s||mode==='off'||s.state==='FINISHER')return null;const danger=s.state==='WARNING'&&s.trueSignal&&Math.abs(playerX-s.laneX)<=s.half+24;
  if(mode==='essential'&&!danger)return null;
  let key=s.state==='WARNING'?!s.trueSignal?'hold':danger?'move':s.requireEvade&&!s.evaded?'move':'counter.'+s.counter:s.state==='SUPPORT'?'support':s.state==='BURST'?'burst':s.state==='STAGGER'?'stagger':s.state==='RECOVERY'?'retry':s.state==='TRANSITION'?'phase':'prepare';
  const direction=danger?(s.laneX<550?'right':s.laneX>550?'left':playerX<s.laneX?'left':'right'):null;
  const seconds=Math.max(0,s.remaining),priority=danger?3:s.state==='WARNING'&&s.trueSignal?2:1;
  return {textId:'breaker.monitor.'+key,direction,seconds,priority,progress:Math.min(1,seconds/(s.warningDuration||2)),cue:['WARNING','BURST','SUPPORT'].includes(s.state)?[s.pattern,s.attempts,s.state,s.trueSignal,Math.ceil(seconds)].join(':'):null};
 }
 return {settings,advice};
});

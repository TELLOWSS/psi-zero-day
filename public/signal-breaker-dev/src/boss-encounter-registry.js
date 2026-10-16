/* Authored raid rules. Pure data; provisional timings are deliberately centralized. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerRaidRegistry=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const bosses=Object.freeze({
  delivery:{stage:'CH-01',material:'metal',counter:'bank',name:'delivery',half:78},
  conveyor:{stage:'CH-02',material:'metal',counter:'belt',name:'conveyor',half:190},
  extraction:{stage:'CH-03',material:'dust',counter:'mist',name:'extraction',half:143},
  tension:{stage:'CH-04',material:'load',counter:'anchor',name:'tension',half:185},
  grid:{stage:'CH-05',material:'power',counter:'scan',name:'grid',half:128}
 });
 const difficulties=Object.freeze({story:{warning:2,weakpoint:5.5,retry:7,fake:false},standard:{warning:1.8,weakpoint:5,retry:6.5,fake:false},veteran:{warning:1.5,weakpoint:4.2,retry:6,fake:true},nightmare:{warning:1.3,weakpoint:3.5,retry:5.5,fake:true}});
 function difficulty(value,veteran=false){return Object.hasOwn(difficulties,value)?value:veteran?'veteran':'standard';}
 function pattern(identity,phase,episode,mode){const boss=bosses[identity],tune=difficulties[mode];return {...boss,...tune,fake:phase>1&&mode!=='story'&&(tune.fake||episode>1||identity==='tension'),compound:phase===3&&(episode===3||mode==='nightmare'||identity==='grid'),support:phase>1&&(identity==='tension'||episode===3),floor:[.7,.35,0][phase-1]};}
 return {bosses,difficulties,difficulty,pattern};
});

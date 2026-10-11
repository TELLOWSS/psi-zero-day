/* A foreground actor layer, driven by the ending clock. No combat/PSI writes. */
(function(root){'use strict';
 class EndingPerformance{
  constructor(element){this.element=element;this.generation=0;}
  start(definition,still){this.stop();this.still=still;this.definition=definition;const actor=root.SignalBreakerEndingPerformanceContent.actor(definition.stageId);if(!actor)return;
   const frame=document.createElement('div');frame.className='ending-actor';frame.setAttribute('aria-hidden','true');frame.hidden=true;frame.dataset.character=actor.id;frame.dataset.gesture=actor.gesture;
   const [x,y,w,h]=actor.crop;frame.style.aspectRatio=w+'/'+h;const image=document.createElement('img');image.alt='';image.decoding='async';image.style.width=(actor.width/w*100)+'%';image.style.left=(-x/w*100)+'%';image.style.top=(-y/h*100)+'%';
   const generation=this.generation;image.onload=()=>{if(generation===this.generation){this.ready=true;}};image.onerror=()=>{if(generation===this.generation){this.ready=false;frame.hidden=true;}};
   frame.append(image);this.element.append(frame);this.frame=frame;this.image=image;image.src=actor.src;
   const i=definition.shots.findIndex(s=>s.id==='human');this.startAt=definition.shots[i-1].until;this.endAt=definition.shots[i].until;
  }
  update(elapsed,shot){if(!this.frame)return;const human=shot==='human'&&this.ready;this.frame.hidden=!human;this.element.dataset.actor=human?'visible':'absent';if(!human)return;
   const t=Math.max(0,elapsed-this.startAt),remaining=this.endAt-elapsed,entrance=Math.min(1,t/.45),exit=Math.min(1,remaining/.3),presence=this.still?1:Math.max(0,Math.min(entrance,exit));
   this.frame.style.opacity=String(presence);this.frame.style.transform=this.still?'none':'translateY('+((1-presence)*12+Math.sin(t*2.2)*.65).toFixed(2)+'px) rotate('+(Math.sin(t*.85)*.18).toFixed(3)+'deg)';
  }
  stop(){this.generation++;this.ready=false;if(this.image){this.image.onload=null;this.image.onerror=null;}this.frame?.remove();this.frame=null;this.image=null;this.element.dataset.actor='absent';}
 }
 root.SignalBreakerEndingPerformance=EndingPerformance;
})(typeof window!=='undefined'?window:globalThis);

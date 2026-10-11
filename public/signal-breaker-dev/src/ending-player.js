/* Cinematic presentation only. Does not grant rewards, start stages or alter Game. */
(function(root){'use strict';
 class EndingPlayer {
  constructor(element,text){this.element=element;this.text=text;this.active=false;this.elapsed=0;this.paused=false;this.lastShot='';this.locked=[];}
  play(definition,record,{reducedMotion=false,quality='balanced',replay=false,onShot=()=>{},onComplete=()=>{}}={}){
   this.cancel();this.active=true;this.elapsed=0;this.paused=false;this.replay=replay;this.definition=definition;this.record=record;this.onComplete=onComplete;this.onShot=onShot;
   const e=this.element;e.replaceChildren();e.hidden=false;e.dataset.motion=reducedMotion||quality==='low'?'still':'full';e.dataset.image='loading';
   const picture=document.createElement('img');picture.className='ending-art';picture.alt=this.text(definition.altId);picture.decoding='async';
   picture.onload=()=>{if(this.active&&this.picture===picture)e.dataset.image='ready';};
   picture.onerror=()=>{if(this.active&&this.picture===picture){e.dataset.image='failed';picture.hidden=true;}};
   picture.src=definition.image;this.picture=picture;
   const shade=document.createElement('div');shade.className='ending-shade';
   const header=document.createElement('header');header.className='ending-header';
   const brand=document.createElement('span');brand.textContent=this.text('breaker.ending.brand');
   const tools=document.createElement('div');tools.className='ending-tools';
   this.pauseButton=this.button('endingPause','breaker.ending.pause',()=>{this.paused=!this.paused;this.pauseButton.textContent=this.text(this.paused?'breaker.ending.resume':'breaker.ending.pause');this.pauseButton.setAttribute('aria-pressed',String(this.paused));});this.pauseButton.setAttribute('aria-pressed','false');
   const skip=this.button('endingSkip','breaker.ending.skip',()=>this.finish('skip'));
   tools.append(this.pauseButton,skip);header.append(brand,tools);
   const copy=document.createElement('div');copy.className='ending-copy';
   this.label=document.createElement('p');this.label.className='ending-label';
   const title=document.createElement('h2');title.id='endingTitle';title.textContent=this.text(definition.titleId);
   this.line=document.createElement('p');this.line.className='ending-line';this.line.setAttribute('aria-live','polite');
   const evidence=document.createElement('ul');evidence.className='ending-evidence';evidence.id='endingEvidence';
   for(const id of root.SignalBreakerEndings.evidenceIds(record)){const item=document.createElement('li');item.textContent=this.text(id);evidence.append(item);}
   const note=document.createElement('p');note.className='ending-note';note.textContent=this.text('breaker.ending.record.scope');
   this.progress=document.createElement('div');this.progress.className='ending-progress';this.progress.setAttribute('aria-hidden','true');const fill=document.createElement('i');this.progress.append(fill);
   copy.append(this.label,title,this.line,evidence,note,this.progress);e.append(picture,shade,header,copy);
   this.locked=[...e.parentElement.children].filter(child=>child!==e).map(child=>({child,inert:child.inert}));for(const {child} of this.locked)child.inert=true;
   document.body.classList.add('ending-open');this.render();skip.focus();
   this.keyHandler=event=>{if(event.key==='Escape'){event.preventDefault();this.finish('skip');return;}if(event.key==='Tab'){const first=this.pauseButton,last=skip;if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}};e.addEventListener('keydown',this.keyHandler);
  }
  button(id,textId,action){const button=document.createElement('button');button.id=id;button.type='button';button.textContent=this.text(textId);button.addEventListener('click',action);return button;}
  update(dt){if(!this.active||this.paused||document.hidden)return;this.elapsed+=dt;this.render();if(this.elapsed>=12)this.finish('complete');}
  render(){const shot=this.definition.shots.find(s=>this.elapsed<s.until)||this.definition.shots.at(-1);if(shot.id!==this.lastShot){this.lastShot=shot.id;this.element.dataset.shot=shot.id;this.label.textContent=this.text(shot.labelId);this.line.textContent=this.text(shot.lineId);this.onShot(shot.id);}this.progress.firstChild.style.width=Math.min(100,this.elapsed/12*100)+'%';}
  finish(reason){if(!this.active)return;const complete=this.onComplete;this.cancel();complete(reason);}
  cancel(){this.active=false;this.lastShot='';this.element.hidden=true;document.body.classList.remove('ending-open');for(const {child,inert} of this.locked)child.inert=inert;this.locked=[];if(this.keyHandler)this.element.removeEventListener('keydown',this.keyHandler);this.element.replaceChildren();}
 }
 root.SignalBreakerEndingPlayer=EndingPlayer;
})(typeof window!=='undefined'?window:globalThis);

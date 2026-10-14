/* Image-led, accessible graph. Selection is presentation state; manager owns investment. */
(function(root){'use strict';
let selected=null,branch=null,character=null,motionPaused=false,celebrate=null,previousRanks={};
const ORDER=['defense','kinetic','engineering'],COLORS=['#85eac3','#ffc376','#c1a3ff'];
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text)e.textContent=text;return e;};
const svg=tag=>document.createElementNS('http://www.w3.org/2000/svg',tag);
function render(parent,{manager:m,text:t,onChange,identity,reduced=false,quality='balanced'}){
 const api=root.SignalBreakerTalentTech,rec=m.recommendation(),career=api.CAREERS[m.characterId];
 for(const tree of Object.values(api.TALENT_TREES))for(const node of tree.tiers){const id=node.id,rank=m.talents[id]||0,key=m.characterId+':'+id;if(previousRanks[key]!==undefined&&rank>previousRanks[key])celebrate={id,at:performance.now()};previousRanks[key]=rank;}
 if(character!==m.characterId){character=m.characterId;selected=rec?.id||api.TALENT_TREES[career.tree].tiers[0].id;branch=Object.values(api.TALENT_TREES).find(tree=>tree.tiers.some(node=>node.id===selected)).id;}
 branch=branch||career.tree;selected=selected||rec?.id||api.TALENT_TREES[branch].tiers[0].id;
 const panel=make('section','tech-observatory');panel.dataset.motion=String(!(motionPaused||reduced||quality==='low'));panel.setAttribute('aria-label',t('breaker.tech.title'));
 const hero=make('header','tech-hero'),image=make('img','tech-world');image.src='art/tech-reactor-world-v1.webp';image.alt='';image.width=1672;image.height=941;image.decoding='async';
 const light=make('div','tech-reactor-light');light.setAttribute('aria-hidden','true');const title=make('div','tech-hero-copy');title.append(make('small','',t('breaker.tech.eyebrow')),make('h3','',t('breaker.tech.title')),make('p','',(identity[m.characterId]?.name||m.characterId)+' · '+t('breaker.career.'+m.characterId+'.name')),make('span','tech-budget',t('breaker.tech.points').replace('{n}',String(m.getAvailablePoints()))));
 hero.append(image,light,title);panel.append(hero);
 const actions=make('div','tech-actions'),motion=make('button','iconbtn',t(reduced||quality==='low'?'breaker.tech.motion.static':motionPaused?'breaker.tech.motion.start':'breaker.tech.motion.stop'));motion.type='button';motion.setAttribute('aria-pressed',String(motionPaused));motion.disabled=reduced||quality==='low';motion.addEventListener('click',()=>{motionPaused=!motionPaused;panel.dataset.motion=String(!motionPaused);motion.textContent=t(motionPaused?'breaker.tech.motion.start':'breaker.tech.motion.stop');motion.setAttribute('aria-pressed',String(motionPaused));});
 const choose=make('button','iconbtn',t('breaker.tech.character'));choose.type='button';choose.addEventListener('click',()=>{parent.querySelector('.career-roster')?.scrollIntoView({block:'start',behavior:'auto'});parent.querySelector('.career-card[aria-pressed=true]')?.focus({preventScroll:true});});actions.append(choose,motion);panel.append(actions);
 const recommendationHost=make('div','tech-recommendation-host');panel.append(recommendationHost);
 const nav=make('nav','tech-branches');nav.setAttribute('aria-label',t('breaker.tech.branches'));const lanes=make('div','tech-lanes');panel.append(nav,make('p','tech-instruction',t('breaker.tech.help')),lanes);
 const inspector=make('section','tech-inspector');inspector.setAttribute('aria-label',t('breaker.tech.inspect'));panel.append(inspector);
 const announce=make('p','tech-announcement');announce.setAttribute('role','status');announce.setAttribute('aria-live','polite');panel.append(announce);
 function selectNode(id,focus=false){selected=id;for(const button of lanes.querySelectorAll('[data-tech-node]')){button.setAttribute('aria-pressed',String(button.dataset.techNode===id));if(button.dataset.techNode===id&&focus)button.focus({preventScroll:true});}drawInspector();}
 function drawInspector(){inspector.replaceChildren();const tree=Object.values(api.TALENT_TREES).find(tree=>tree.tiers.some(n=>n.id===selected)),node=tree.tiers.find(n=>n.id===selected),rank=m.talents[node.id]||0;
  inspector.style.setProperty('--tech-color',COLORS[ORDER.indexOf(tree.id)]);const title=make('h4','',node.name),copy=make('p','',api.ACTIVE_TALENT_EFFECTS[node.id]||node.desc),progress=make('p','',t('breaker.tech.rank').replace('{n}',String(rank)).replace('{max}',String(node.maxRank)));inspector.append(title,copy,progress);
  const button=make('button','primary-btn',t('breaker.tech.invest'));button.type='button';button.dataset.talent=node.id;button.disabled=!m.canInvest(node.id);button.setAttribute('aria-label',t('breaker.ui.invest').replace('{name}',node.name).replace('{rank}',String(rank)).replace('{max}',String(node.maxRank)));
  const index=tree.tiers.indexOf(node),open=index===0||(m.talents[tree.tiers[index-1].id]||0)===tree.tiers[index-1].maxRank;const reason=rank>=node.maxRank?'breaker.ui.max':!open?'breaker.ui.predecessor':'breaker.ui.points';if(button.disabled)button.textContent=t(reason);
  button.addEventListener('click',()=>{if(m.investTalent(node.id)){celebrate={id:node.id,at:performance.now()};onChange();const target=parent.querySelector('[data-tech-node="'+node.id+'"]');target?.focus({preventScroll:true});parent.querySelector('.tech-announcement').textContent=t('breaker.tech.updated').replace('{name}',node.name);}else onChange();});const back=make('button','iconbtn',t('breaker.tech.back'));back.type='button';back.addEventListener('click',()=>{const node=lanes.querySelector('[data-tech-node="'+selected+'"]');node?.scrollIntoView?.({block:'center',behavior:'auto'});node?.focus({preventScroll:true});});inspector.append(button,back);
 }
 for(const [column,id] of ORDER.entries()){
  const tree=api.TALENT_TREES[id],tab=make('button','tech-branch',t('breaker.tech.'+id));tab.type='button';tab.dataset.techBranch=id;tab.style.setProperty('--tech-color',COLORS[column]);tab.setAttribute('aria-pressed',String(branch===id));
  tab.addEventListener('click',()=>{branch=id;for(const b of nav.children)b.setAttribute('aria-pressed',String(b===tab));for(const lane of lanes.children)lane.dataset.current=String(lane.dataset.tree===id);selectNode(tree.tiers.find(n=>m.canInvest(n.id))?.id||tree.tiers[0].id);});nav.append(tab);
  const lane=make('section','tech-lane');lane.dataset.tree=id;lane.dataset.current=String(branch===id);lane.style.setProperty('--tech-color',COLORS[column]);lane.append(make('h4','tech-lane-title',t('breaker.tech.'+id)));
  const links=svg('svg');links.classList.add('tech-links');links.setAttribute('viewBox','0 0 300 720');links.setAttribute('preserveAspectRatio','none');links.setAttribute('aria-hidden','true');lane.append(links);
  for(let i=0;i<4;i++){const y=80+i*126,x=150+[-16,18,-20,20,0][i],nextX=150+[-16,18,-20,20,0][i+1],earned=(m.talents[tree.tiers[i].id]||0)===tree.tiers[i].maxRank;const path=svg('path');path.setAttribute('d',`M ${x} ${y+36} C ${x} ${y+80}, ${nextX} ${y+46}, ${nextX} ${y+90}`);path.classList.add(earned?'is-powered':'is-dormant');links.append(path);if(earned){const flow=path.cloneNode();flow.classList.add('tech-energy-flow');links.append(flow);}}
  for(const [i,node] of tree.tiers.entries()){
   const rank=m.talents[node.id]||0,open=i===0||(m.talents[tree.tiers[i-1].id]||0)===tree.tiers[i-1].maxRank;
   const button=make('button','tech-node'+(rank>0?' is-invested':'')+(rank===node.maxRank?' is-complete':'')+(rec?.id===node.id?' is-recommended':'')+(!open?' is-locked':''));button.type='button';button.dataset.techNode=node.id;button.dataset.rank=String(rank);button.dataset.unlocked=String(open);button.style.left=(150+[-16,18,-20,20,0][i])/3+'%';button.style.top=30+i*126+'px';button.setAttribute('aria-pressed',String(selected===node.id));button.setAttribute('aria-label',node.name+' · '+rank+'/'+node.maxRank+' · '+t(!open?'breaker.ui.predecessor':rank===node.maxRank?'breaker.ui.max':'breaker.tech.inspect'));
   const icon=make('span','tech-node-art');icon.style.backgroundPosition=(column*50)+'% '+(i*25)+'%';icon.setAttribute('aria-hidden','true');const halo=make('span','tech-node-halo');halo.setAttribute('aria-hidden','true');
   const label=make('span','tech-node-label');label.append(make('strong','',node.name),make('small','',rank+'/'+node.maxRank+' · '+t(rank===node.maxRank?'breaker.tech.complete':!open?'breaker.tech.locked':rec?.id===node.id?'breaker.career.recommended':'breaker.tech.inspect')));button.append(halo,icon,label);button.addEventListener('click',()=>{selectNode(node.id);inspector.scrollIntoView?.({block:'nearest',behavior:'auto'});});
   if(celebrate?.id===node.id&&performance.now()-celebrate.at<1100)button.classList.add('tech-just-invested');lane.append(button);
  }lanes.append(lane);
 }
 drawInspector();parent.append(panel);return {recommendationHost};
}
function decorateWeapons(grid,{manager:m,text:t,reduced=false,quality='balanced'}){
 const api=root.SignalBreakerTalentTech,keys=Object.keys(api.WEAPON_TECHS);
 for(const [index,col] of [...grid.children].entries()){
  const key=keys[index],weapon=api.WEAPON_TECHS[key],level=m.weaponLevels[key]||1;col.classList.add('tech-weapon-column');col.dataset.weapon=key;col.dataset.motion=String(!reduced&&quality!=='low'&&!motionPaused);
  const path=make('div','tech-weapon-path');path.setAttribute('aria-label',t('breaker.tech.weaponPath'));const detail=make('p','tech-weapon-detail');
  for(const [i,tier] of weapon.tiers.entries()){
   const node=make('button','tech-weapon-node'+(i<level?' is-powered':''));node.type='button';node.setAttribute('aria-pressed',String(i+1===level));node.setAttribute('aria-label','Tier '+(i+1)+' · '+tier.name);node.title=tier.desc;
   const icon=make('span','tech-weapon-icon');icon.style.backgroundPosition=(index%3*50)+'% '+(index>=3?100:0)+'%';icon.setAttribute('aria-hidden','true');node.append(icon,make('small','',(i+1)+' · '+t(i<level?'breaker.tech.complete':'breaker.tech.inspect')));
   node.addEventListener('click',()=>{for(const b of path.children)b.setAttribute('aria-pressed',String(b===node));detail.textContent=tier.name+' · '+tier.desc;});path.append(node);
  }
  detail.textContent=weapon.tiers[level-1].name+' · '+t('breaker.tech.weaponPreview');col.prepend(path,detail);
 }
}
root.SignalBreakerTechTreeArt={render,decorateWeapons};
})(window);

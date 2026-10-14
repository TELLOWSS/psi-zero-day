/* Presentation only: career rules and transactions live in TalentTechManager. */
(function(root){'use strict';
function render(parent,{manager,characters,identity,text,canSelect,onSelect,onChange,recommendationHost}){
 const api=root.SignalBreakerTalentTech,t=text,make=(tag,cls,content)=>{const e=document.createElement(tag);e.className=cls;if(content)e.textContent=content;return e;};
 const section=make('section','career-panel');section.setAttribute('aria-label',t('breaker.career.roster'));
 section.append(make('h3','',t('breaker.career.roster')),make('p','career-explainer',t(canSelect?'breaker.career.selectHelp':'breaker.career.locked')));
 const roster=make('div','career-roster');
 for(const actor of characters){const card=make('button','career-card');card.type='button';card.dataset.character=actor.id;card.disabled=!canSelect;card.setAttribute('aria-pressed',String(manager.characterId===actor.id));const name=identity[actor.id]?.name||t(actor.textId);const img=make('img','career-avatar');img.src=actor.src;img.alt='';img.loading='lazy';const content=make('span','');content.append(make('strong','',name),make('small','',identity[actor.id]?.title),make('small','',t('breaker.career.'+actor.id+'.role')));card.append(img,content);card.addEventListener('click',()=>onSelect(actor.id));roster.append(card);}
 section.append(roster);
 const id=manager.characterId,career=api.CAREERS[id];section.append(make('h3','career-title',(identity[id]?.name||id)+' · '+t('breaker.career.'+id+'.name')),make('p','career-explainer',t('breaker.career.'+id+'.story')));
 const steps=make('ol','career-path');
 for(const node of manager.careerProgress()){const item=make('li','career-step'+(node.active?' is-earned':''));item.dataset.careerStep=String(node.index);item.append(make('strong','',(node.active?'✓ ':'')+t('breaker.career.'+id+'.node'+node.index)),make('small','',t('breaker.career.'+id+'.effect'+node.index)),make('small','',t('breaker.career.progress').replace('{n}',String(Math.min(node.invested,node.required))).replace('{max}',String(node.required))));steps.append(item);}
 section.append(make('p','career-explainer',t('breaker.career.unlock').replace('{tree}',api.TALENT_TREES[career.tree].name)),steps);
 const recommendation=manager.recommendation(),advice=make('div','career-recommendation');advice.setAttribute('role','status');
 if(recommendation){const node=api.TALENT_TREES[recommendation.tree].tiers.find(n=>n.id===recommendation.id);advice.append(make('strong','',t('breaker.career.recommended')+' · '+node.name),make('p','',node.desc),make('small','',t('breaker.career.cost').replace('{rank}',String(recommendation.rank+1)).replace('{max}',String(node.maxRank))));const button=make('button','primary-btn',t('breaker.career.apply'));button.type='button';button.id='applyRecommendedTalent';button.addEventListener('click',()=>{if(manager.investTalent(recommendation.id))onChange();else onChange();});advice.append(button);}else advice.append(make('p','',t(manager.getAvailablePoints()>0?'breaker.career.full':'breaker.career.noPoints')));
 const notes=make('details','tech-growth-notes');notes.append(make('summary','',t('breaker.tech.rules')),make('small','',t('breaker.career.ranks')),make('small','',t('breaker.career.shared')));advice.append(notes);if(recommendationHost)recommendationHost.append(advice);else section.prepend(advice);if(!recommendationHost)advice.prepend(make('h3','',(identity[id]?.name||id)+' · '+t('breaker.career.'+id+'.name')));parent.append(section);
}
root.SignalBreakerCareerUI={render};
})(window);

import type {CharacterId, PerkId, PlayerStats} from '../domain/patrol-survivors';
import {STORE_ITEMS} from '../domain/survivors-store';
import {PERK_CATALOG, EVOLUTION_RECIPES} from '../engine/patrol-survivors-engine';
import {equipmentTuning, SUPPORT_EFFECTS} from '../engine/survivors-equipment-tuning';
import copy from '../../content/localization/survivors-equipment-details-ko.json';
import storeCopy from '../../content/localization/survivors-store-ko.json';

export function equipmentCharacterIdentity(id: CharacterId): string {
 const canonical = id === 'park' ? 'kang_taesik' : id === 'jung' ? 'player' : id === 'yoon' ? 'yoon_sungho' : id;
 return copy.roles[canonical];
}
export function equipmentDetails(id: string, kind: 'normal'|'premium', level = 1, player?:PlayerStats) {
 if (kind === 'premium') {
  const item = STORE_ITEMS.find(item => item.id === id);
  if (!item) return undefined;
  const description = copy.premiumItems[id as keyof typeof copy.premiumItems];
  const percent = new Set(['damage','cooldown','crit','suppression']);
  return {name:storeCopy.items[id as keyof typeof storeCopy.items].name, ...description, recipe:undefined,
   note:copy.payment,
   stats:Object.entries(item.effects).map(([key,value]) => ({label:copy.labels[key as keyof typeof copy.labels], value:percent.has(key) ? `+${Number((value*100).toFixed(2))}%` : `${key==='shieldPeriod'?'':'+'}${Number(value.toFixed(2))}`}))};
 }
 if (!Object.hasOwn(PERK_CATALOG,id)) return undefined;
 const perk = id as PerkId, meta = PERK_CATALOG[perk];
 const lv = Math.min(meta.maxLevel, Math.max(1, Math.floor(Number.isFinite(level) ? level : 1)));
 const recipe = EVOLUTION_RECIPES[perk as keyof typeof EVOLUTION_RECIPES];
 const base = recipe?.weapon ?? perk;
 const description = copy.normalItems[base as keyof typeof copy.normalItems];
 const tuning = equipmentTuning(perk, lv);
 const support = SUPPORT_EFFECTS[perk];
 const stats = Object.entries(tuning ?? support ?? {}).filter(([,value]) => value > 0).map(([key,value]) => {
  const scale = tuning && player ? ['damage','continuousDamage','secondaryDamage'].includes(key) ? player.damageMultiplier : key==='interval' ? 1-Math.min(.75,player.cooldownReduction) : 1 : 1;
  const amount = support ? value * lv : value * scale;
  const percent = ['cooldownReduction','critRate','damageMultiplier'].includes(key);
  const label = key==='radius' && !['floodlight','tesla_dome','emp_generator','plasma_grid'].includes(id) ? copy.contactRadius : copy.labels[key as keyof typeof copy.labels];
  return {label, value:percent ? `+${Number((amount*100).toFixed(2))}%` : `${support?'+':''}${Number(amount.toFixed(2))}`};
 });
 return {name:`${meta.name} · Lv.${lv}`, ...description,
  feedback:recipe ? copy.evolutions[perk as keyof typeof copy.evolutions] : description.feedback,
  recipe:recipe ? `${PERK_CATALOG[recipe.weapon].name} Lv.5 + ${PERK_CATALOG[recipe.support].name} Lv.1` : undefined,
  note:recipe ? copy.evolutionNote : support ? copy.supportNote : copy.growthNote, stats};
}

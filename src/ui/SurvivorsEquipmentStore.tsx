import { useMemo, useState } from 'react';
import { STORE_ITEMS, type StoreCategory, type StoreInventory } from '../domain/survivors-store';
import copy from '../../content/localization/survivors-store-ko.json';
import { SurvivorsPremiumArt } from './SurvivorsPremiumArt';
import type { CharacterId, PermanentUpgrades } from '../domain/patrol-survivors';
import { fittingInventory } from '../domain/survivors-fitting';
import { createInitialSurvivorsState, DEFAULT_PERMANENT_UPGRADES, CHARACTER_PROFILES } from '../engine/patrol-survivors-engine';
import { SurvivorsFittingPreview } from './SurvivorsFittingPreview';

export function SurvivorsEquipmentStore({ inventory, credits, message, onChange, characterId = 'player', upgrades = DEFAULT_PERMANENT_UPGRADES }: {
  inventory: StoreInventory; credits: number; message: string;
  onChange: (id: string, purchase: boolean) => void;
  characterId?: CharacterId; upgrades?: PermanentUpgrades;
}) {
  const [category, setCategory] = useState<StoreCategory | 'all'>('all');
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [affordableOnly, setAffordableOnly] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const baseline = useMemo(() => createInitialSurvivorsState(characterId, upgrades, undefined, undefined, inventory), [characterId, upgrades, inventory]);
  const preview = useMemo(() => createInitialSurvivorsState(characterId, upgrades, undefined, undefined, fittingInventory(inventory, previewId)), [characterId, upgrades, inventory, previewId]);
  const previewItem = STORE_ITEMS.find(item => item.id === previewId);
  const comparisons = [
    [copy.fittingHp, baseline.player.maxHp, preview.player.maxHp],
    [copy.fittingSpeed, baseline.player.speed, preview.player.speed],
    [copy.fittingPickup, baseline.player.pickupRadius, preview.player.pickupRadius],
    [copy.fittingDamage, baseline.player.damageMultiplier * 100, preview.player.damageMultiplier * 100],
    [copy.fittingCooldown, baseline.player.cooldownReduction * 100, preview.player.cooldownReduction * 100],
  ] as const;
  const categories = Object.keys(copy.categories) as StoreCategory[];
  const items = STORE_ITEMS.filter(item => (category === 'all' || item.category === category)
    && (!ownedOnly || inventory.owned.includes(item.id))
    && (!affordableOnly || inventory.owned.includes(item.id) || credits >= item.price));
  return <section className="survivors-store" aria-label={copy.title}>
    <header className="survivors-store-heading"><div><h3>{copy.title}</h3><p>{copy.intro}</p></div>
      <strong className="survivors-store-wallet">{credits.toLocaleString()} PSI</strong></header>
    <div className="survivors-fitting">
      <SurvivorsFittingPreview state={preview}/>
      <div className="survivors-fitting-summary"><h4>{CHARACTER_PROFILES[characterId].name}</h4>
        <p role="status">{previewItem ? `${copy.fitting}: ${copy.items[previewItem.id as keyof typeof copy.items].name}` : copy.currentLoadout}</p>
        <dl>{comparisons.map(([label, before, after]) => <div key={label}><dt>{label}</dt><dd>{Number(after.toFixed(1))}{Math.abs(after-before) > .01 && <span> ({after > before ? '+' : ''}{Number((after-before).toFixed(1))})</span>}</dd></div>)}</dl>
        {previewItem && <><p>{copy.items[previewItem.id as keyof typeof copy.items].description}</p><button type="button" onClick={() => setPreviewId(null)}>{copy.resetFitting}</button></>}
      </div>
    </div>
    <div className="survivors-store-slots" aria-label={copy.status}>{categories.map(slot => {
      const item = STORE_ITEMS.find(item => item.category === slot && inventory.equipped.includes(item.id));
      return <div key={slot}><small>{copy.categories[slot]}</small>{item
        ? <><SurvivorsPremiumArt item={item}/><strong>{copy.items[item.id as keyof typeof copy.items].name}</strong>
          <button type="button" onClick={() => onChange(item.id, false)} aria-label={`${copy.items[item.id as keyof typeof copy.items].name} ${copy.remove}`}>{copy.remove}</button></>
        : <span>{copy.emptySlot}</span>}</div>;
    })}</div>
    <div className="survivors-store-filters">
      <label>{copy.category}<select value={category} onChange={event => setCategory(event.target.value as StoreCategory | 'all')}>
        <option value="all">{copy.all}</option>{categories.map(slot => <option key={slot} value={slot}>{copy.categories[slot]}</option>)}</select></label>
      <label><input type="checkbox" checked={ownedOnly} onChange={event => setOwnedOnly(event.target.checked)}/>{copy.ownedOnly}</label>
      <label><input type="checkbox" checked={affordableOnly} onChange={event => setAffordableOnly(event.target.checked)}/>{copy.affordableOnly}</label>
      <span aria-live="polite">{items.length} / {STORE_ITEMS.length}</span>
    </div>
    {message && <p role={message === copy.failure ? 'alert' : 'status'}>{message}</p>}
    {!items.length && <p role="status">{copy.noResults}</p>}
    <div className="survivors-store-grid">{items.map(item => {
      const text = copy.items[item.id as keyof typeof copy.items];
      const owned = inventory.owned.includes(item.id), equipped = inventory.equipped.includes(item.id);
      const replaced = STORE_ITEMS.find(other => other.category === item.category && inventory.equipped.includes(other.id) && other.id !== item.id);
      return <article key={item.id} data-rarity={item.rarity} className={`survivors-store-card ${equipped ? 'is-equipped' : ''}`}>
        <div className="survivors-store-item-head"><SurvivorsPremiumArt item={item}/><div><small>{copy.categories[item.category]} · {copy[item.rarity]}</small><strong>{text.name}</strong></div></div>
        <span className="survivors-store-effect">{text.description}</span><p className="survivors-premium-use">{text.use}</p>
        <small>{equipped ? copy.equipped : owned ? copy.owned : `${item.price.toLocaleString()} PSI`}</small>
        {replaced && <small className="survivors-store-replacement">{copy.replaces} {copy.items[replaced.id as keyof typeof copy.items].name}</small>}
        {!owned && credits < item.price && <small>{copy.shortfall} {(item.price-credits).toLocaleString()} PSI</small>}
        <button type="button" aria-pressed={owned ? equipped : undefined} disabled={!owned && credits < item.price} onClick={() => onChange(item.id, !owned)}>
          {owned ? equipped ? copy.remove : copy.equip : `${copy.buy} · ${item.price.toLocaleString()} PSI`}</button>
        <button type="button" className="survivors-fitting-button" aria-pressed={previewId === item.id} onClick={() => setPreviewId(item.id)}>{copy.tryOn}</button>
        <details><summary>{copy.preview}</summary><SurvivorsPremiumArt item={item} large/><p>{copy.recommend}: {text.use}</p><small>{copy.next}</small></details>
      </article>;
    })}</div>
  </section>;
}

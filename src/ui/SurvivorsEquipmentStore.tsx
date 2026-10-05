import { useMemo, useState } from 'react';
import { STORE_ITEMS, buyAndEquipLoadout,itemDurability,storeRepairCost,type StoreCategory, type StoreInventory } from '../domain/survivors-store';
import copy from '../../content/localization/survivors-store-ko.json';
import { SurvivorsPremiumArt } from './SurvivorsPremiumArt';
import type { CharacterId, PermanentUpgrades } from '../domain/patrol-survivors';
import { fittingLoadout } from '../domain/survivors-fitting';
import { createInitialSurvivorsState, DEFAULT_PERMANENT_UPGRADES, CHARACTER_PROFILES } from '../engine/patrol-survivors-engine';
import { SurvivorsFittingPreview } from './SurvivorsFittingPreview';
import {ArrowLeft,ArrowRight,PersonStanding,Footprints,Zap,Play,Pause} from 'lucide-react';
import type {FittingMotion} from './survivors-fitting-pose';

export function SurvivorsEquipmentStore({ inventory, credits, message, onChange, onRepair, onApply, live=false, characterId = 'player', upgrades = DEFAULT_PERMANENT_UPGRADES }: {
  inventory: StoreInventory; credits: number; message: string;
  onChange: (id: string, purchase: boolean) => void;
  onRepair?: (id:string)=>void; onApply?:(ids:string[])=>void; live?:boolean;
  characterId?: CharacterId; upgrades?: PermanentUpgrades;
}) {
  const [category, setCategory] = useState<StoreCategory | 'all'>('all');
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [affordableOnly, setAffordableOnly] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string[]>([...inventory.equipped]);
  const [facing,setFacing]=useState<1|-1>(1);
  const [zoom,setZoom]=useState(1);
  const [motion,setMotion]=useState<FittingMotion>('idle');
  const [previewPlaying,setPreviewPlaying]=useState(true);
  const [view, setView] = useState<'browse' | 'fitting' | 'loadout'>('browse');
  const baseline = useMemo(() => createInitialSurvivorsState(characterId, upgrades, undefined, undefined, inventory), [characterId, upgrades, inventory]);
  const preview = useMemo(() => createInitialSurvivorsState(characterId, upgrades, undefined, undefined, fittingLoadout(inventory, draft)), [characterId, upgrades, inventory, draft]);
  const previewItem = STORE_ITEMS.find(item => item.id === previewId);
  const draftItems=STORE_ITEMS.filter(item=>draft.includes(item.id));
  const quote=buyAndEquipLoadout(inventory,credits,draft);
  const price=draftItems.reduce((sum,item)=>sum+(inventory.owned.includes(item.id)?0:item.price),0);
  const broken=draftItems.some(item=>inventory.owned.includes(item.id)&&itemDurability(inventory,item.id)===0);
  const selectDraft=(slot:StoreCategory,id:string)=>{
    setDraft(previous=>[...previous.filter(current=>STORE_ITEMS.find(item=>item.id===current)?.category!==slot),...(id?[id]:[])]);
    setPreviewId(id||null);
  };
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
    {live&&<p className="survivors-store-live" role="status">{copy.liveShop}</p>}
    <p className="survivors-durability-rule">{copy.wearRule}</p>
    <div className="survivors-store-tabs" role="tablist" aria-label={copy.title}>
      {(['browse', 'fitting', 'loadout'] as const).map((tab, index, tabs) => <button key={tab} type="button" role="tab" id={`store-tab-${tab}`} aria-selected={view === tab} aria-controls={`store-panel-${tab}`} tabIndex={view === tab ? 0 : -1} onClick={() => setView(tab)} onKeyDown={event => {
        const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!offset) return; event.preventDefault();
        const next = tabs[(index + offset + tabs.length) % tabs.length]!;
        setView(next); document.getElementById(`store-tab-${next}`)?.focus();
      }}>{copy[tab]}</button>)}
    </div>
    {message && <p role={message === copy.failure ? 'alert' : 'status'}>{message}</p>}
    <div id="store-panel-fitting" role="tabpanel" aria-labelledby="store-tab-fitting" hidden={view !== 'fitting'}>
    <div className="survivors-fitting">
      <div className="survivors-fitting-visual"><SurvivorsFittingPreview state={preview} facing={facing} zoom={zoom} motion={motion} playing={previewPlaying} active={view==='fitting'}/>
        <div className="survivors-fitting-controls"><button type="button" aria-label={copy.leftView} title={copy.leftView} aria-pressed={facing===-1} onClick={()=>setFacing(-1)}><ArrowLeft size={18}/></button><button type="button" aria-label={copy.rightView} title={copy.rightView} aria-pressed={facing===1} onClick={()=>setFacing(1)}><ArrowRight size={18}/></button><label>{copy.zoom}<input type="range" min={.8} max={1.25} step={.05} value={zoom} onChange={event=>setZoom(Number(event.target.value))}/></label></div>
        <div className="survivors-fitting-controls" role="group" aria-label={copy.pose}><button type="button" aria-label={copy.poseIdle} title={copy.poseIdle} aria-pressed={motion==='idle'} onClick={()=>setMotion('idle')}><PersonStanding size={18}/></button><button type="button" aria-label={copy.poseWalk} title={copy.poseWalk} aria-pressed={motion==='walk'} onClick={()=>setMotion('walk')}><Footprints size={18}/></button><button type="button" aria-label={copy.poseAction} title={copy.poseAction} aria-pressed={motion==='action'} onClick={()=>setMotion('action')}><Zap size={18}/></button><button type="button" aria-label={previewPlaying?copy.pausePreview:copy.playPreview} title={previewPlaying?copy.pausePreview:copy.playPreview} aria-pressed={previewPlaying} onClick={()=>setPreviewPlaying(value=>!value)}>{previewPlaying?<Pause size={18}/>:<Play size={18}/>}</button></div>
      </div>
      <div className="survivors-fitting-summary"><h4>{CHARACTER_PROFILES[characterId].name}</h4>
        <p role="status">{previewItem ? `${copy.fitting}: ${copy.items[previewItem.id as keyof typeof copy.items].name}` : copy.currentLoadout}</p>
        <dl>{comparisons.map(([label, before, after]) => <div key={label}><dt>{label}</dt><dd>{Number(after.toFixed(1))}{Math.abs(after-before) > .01 && <span> ({after > before ? '+' : ''}{Number((after-before).toFixed(1))})</span>}</dd></div>)}</dl>
        <div className="survivors-fitting-slots" aria-label={copy.draftSlots}>{categories.map(slot=>{
          const selected=STORE_ITEMS.find(item=>item.category===slot&&draft.includes(item.id));
          return <label key={slot}>{copy.categories[slot]}<select aria-label={copy.categories[slot]} value={selected?.id??''} onChange={event=>selectDraft(slot,event.target.value)}><option value="">{copy.emptySlot}</option>{STORE_ITEMS.filter(item=>item.category===slot).map(item=><option key={item.id} value={item.id}>{copy.items[item.id as keyof typeof copy.items].name} · {inventory.owned.includes(item.id)?copy.owned:`${item.price.toLocaleString()} PSI`}</option>)}</select>
          {selected&&<small>{copy.items[selected.id as keyof typeof copy.items].description}</small>}
          {selected&&inventory.owned.includes(selected.id)&&itemDurability(inventory,selected.id)<100&&<button type="button" disabled={!onRepair||credits<storeRepairCost(inventory,selected.id)} onClick={()=>onRepair?.(selected.id)}>{copy.repair} · {storeRepairCost(inventory,selected.id).toLocaleString()} PSI</button>}
          </label>;
        })}</div>
        {previewItem && <p>{copy.items[previewItem.id as keyof typeof copy.items].description}</p>}
        <button type="button" onClick={() => {setPreviewId(null);setDraft([...inventory.equipped]);}}>{copy.resetFitting}</button>
      </div>
    </div>
    <div className="survivors-fitting-action"><strong>{copy.draftSlots} · {draft.length}/6 <small>{copy.fittingOnly}</small></strong><button type="button" disabled={!quote||(!onApply&&!previewItem)} onClick={()=>onApply?onApply(draft):previewItem&&onChange(previewItem.id,!inventory.owned.includes(previewItem.id))}>{price?`${copy.buyLoadout} · ${price.toLocaleString()} PSI`:copy.applyLoadout}</button>
    {price>credits&&<small>{copy.shortfall} {(price-credits).toLocaleString()} PSI</small>}{broken&&<small role="alert">{copy.repairFirst}</small>}</div>
    </div>
    <div id="store-panel-loadout" role="tabpanel" aria-labelledby="store-tab-loadout" hidden={view !== 'loadout'}>
    <div className="survivors-store-slots" aria-label={copy.status}>{categories.map(slot => {
      const item = STORE_ITEMS.find(item => item.category === slot && inventory.equipped.includes(item.id));
      return <div key={slot}><small>{copy.categories[slot]}</small>{item
        ? <><SurvivorsPremiumArt item={item}/><strong>{copy.items[item.id as keyof typeof copy.items].name}</strong>
          <label>{copy.durability} {itemDurability(inventory,item.id)}/100<progress max={100} value={itemDurability(inventory,item.id)}/></label>
          <button type="button" onClick={() => onChange(item.id, false)} aria-label={`${copy.items[item.id as keyof typeof copy.items].name} ${copy.remove}`}>{copy.remove}</button>
          {itemDurability(inventory,item.id)<100&&<button type="button" disabled={!onRepair||credits<storeRepairCost(inventory,item.id)} onClick={()=>onRepair?.(item.id)}>{copy.repair} · {storeRepairCost(inventory,item.id).toLocaleString()} PSI</button>}</>
        : <span>{copy.emptySlot}</span>}</div>;
    })}</div>
    </div>
    <div id="store-panel-browse" role="tabpanel" aria-labelledby="store-tab-browse" hidden={view !== 'browse'}>
    <div className="survivors-store-filters">
      <label>{copy.category}<select value={category} onChange={event => setCategory(event.target.value as StoreCategory | 'all')}>
        <option value="all">{copy.all}</option>{categories.map(slot => <option key={slot} value={slot}>{copy.categories[slot]}</option>)}</select></label>
      <label><input type="checkbox" checked={ownedOnly} onChange={event => setOwnedOnly(event.target.checked)}/>{copy.ownedOnly}</label>
      <label><input type="checkbox" checked={affordableOnly} onChange={event => setAffordableOnly(event.target.checked)}/>{copy.affordableOnly}</label>
      <span aria-live="polite">{items.length} / {STORE_ITEMS.length}</span>
    </div>
    {!items.length && <p role="status">{copy.noResults}</p>}
    <div className="survivors-store-grid">{items.map(item => {
      const text = copy.items[item.id as keyof typeof copy.items];
      const owned = inventory.owned.includes(item.id), equipped = inventory.equipped.includes(item.id);
      const replaced = STORE_ITEMS.find(other => other.category === item.category && inventory.equipped.includes(other.id) && other.id !== item.id);
      return <article key={item.id} data-rarity={item.rarity} className={`survivors-store-card ${equipped ? 'is-equipped' : ''}`}>
        <div className="survivors-store-item-head"><SurvivorsPremiumArt item={item}/><div><small>{copy.categories[item.category]} · {copy[item.rarity]}</small><strong>{text.name}</strong></div></div>
        <span className="survivors-store-effect">{text.description}</span><p className="survivors-premium-use">{text.use}</p>
        <small>{equipped ? copy.equipped : owned ? copy.owned : `${item.price.toLocaleString()} PSI`}</small>
        {owned?<label className="survivors-item-condition" data-low={itemDurability(inventory,item.id)<=30}>{copy.durability} {itemDurability(inventory,item.id)}/100 <progress max={100} value={itemDurability(inventory,item.id)}/>{itemDurability(inventory,item.id)===0&&<b>{copy.broken}</b>}</label>:<small>{copy.fullCondition}</small>}
        {replaced && <small className="survivors-store-replacement">{copy.replaces} {copy.items[replaced.id as keyof typeof copy.items].name}</small>}
        {!owned && credits < item.price && <small>{copy.shortfall} {(item.price-credits).toLocaleString()} PSI</small>}
        <div className="survivors-store-card-actions"><button type="button" aria-pressed={owned ? equipped : undefined} disabled={owned?itemDurability(inventory,item.id)===0:credits < item.price} onClick={() => onChange(item.id, !owned)}>
          {owned ? equipped ? copy.remove : copy.equip : `${copy.buy} · ${item.price.toLocaleString()} PSI`}</button>
        <button type="button" className="survivors-fitting-button" aria-pressed={draft.includes(item.id)} onClick={() => {selectDraft(item.category,item.id); setView('fitting'); document.getElementById('store-tab-fitting')?.focus();}}>{copy.tryOn}</button>
        {owned&&itemDurability(inventory,item.id)<100&&<button type="button" className="survivors-repair-button" disabled={!onRepair||credits<storeRepairCost(inventory,item.id)} onClick={()=>onRepair?.(item.id)}>{copy.repair} · {storeRepairCost(inventory,item.id).toLocaleString()} PSI</button>}
        </div>
        <details><summary>{copy.preview}</summary><SurvivorsPremiumArt item={item} large/><p>{copy.recommend}: {text.use}</p><small>{live ? copy.liveShop : copy.next}</small></details>
      </article>;
    })}</div>
    </div>
  </section>;
}

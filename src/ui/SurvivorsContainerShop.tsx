import { useState } from 'react';
import {previewSupplyUpgrade} from '../app/survivors-supply-preview';
import previewText from '../../content/localization/survivors-supply-preview-ko.json';
import { RefreshCw } from 'lucide-react';
import type { SurvivorsGameState } from '../domain/patrol-survivors';
import './survivors-container-shop.css';
import safeSupplyText from '../../content/localization/survivors-safe-supply-ko.json';
import supplyText from '../../content/localization/survivors-supply-ko.json';
import {supplyPartners} from './survivors-supply-synergy';
import {SurvivorsEquipmentIcon} from './SurvivorsEquipmentIcon';
import {PERK_CATALOG} from '../engine/patrol-survivors-engine';
import type {PerkId} from '../domain/patrol-survivors';

export interface ShopUpgradeItem {
  id: string;
  name: string;
  tag: string;
  description: string;
  cost: number;
  iconName: 'nozzle' | 'laser' | 'boots' | 'capacitor' | 'drone' | 'heal' | 'harness' | 'magnet';
  effectText: string;
  apply: (state: SurvivorsGameState) => void;
}

const UPGRADE_CATALOG: ShopUpgradeItem[] = [
  {
    id: 'tuned_nozzle',
    name: '고성능 분사 노즐',
    tag: '무기 튜닝',
    description: '소화기 및 냉각 가스의 분사 노즐을 개조하여 공격 범위와 지속력을 극대화합니다.',
    cost: 110,
    iconName: 'nozzle',
    effectText: '전체 피해 배율 +0.15',
    apply: s => { s.player.damageMultiplier += 0.15; },
  },
  {
    id: 'laser_sight',
    name: '레이저 조준 모듈',
    tag: '정밀 조준',
    description: '고휘도 타깃팅 레이저를 장착하여 치명타 확률을 크게 끌어올립니다.',
    cost: 130,
    iconName: 'laser',
    effectText: '치명타 확률 +12%p',
    apply: s => { s.player.critRate += 0.12; },
  },
  {
    id: 'steel_toecap',
    name: '강화 강철 토캡 안전화',
    tag: '기동 방호',
    description: '현장 파편과 충격에 강한 고강도 스틸캡을 덧대어 기동성과 충격 저항을 높입니다.',
    cost: 110,
    iconName: 'boots',
    effectText: '이동속도 +12% 증가',
    apply: s => { s.player.speed = Math.round(s.player.speed * 1.12); },
  },
  {
    id: 'super_capacitor',
    name: '초전도 긴급 축전지',
    tag: '전술 장비',
    description: '긴급 대시 구동계의 충전 사이클을 단축시켜 더 자주 위기를 벗어날 수 있게 합니다.',
    cost: 140,
    iconName: 'capacitor',
    effectText: '긴급 회피(대시) 쿨다운 -25% 단축',
    apply: s => { s.player.dashMaxCooldown = Math.max(1.8, ((s.player.dashMaxCooldown ?? 3.2) * 0.75)); },
  },
  {
    id: 'drone_overclock',
    name: '오버클럭 드론 배터리',
    tag: '원격 지원',
    description: '안전 드론의 순항 로직과 비행 축전지를 튜닝하여 쿨다운을 감소시킵니다.',
    cost: 130,
    iconName: 'drone',
    effectText: '공격 재사용 시간 감소 +10%p',
    apply: s => { s.player.cooldownReduction = Math.min(0.5, s.player.cooldownReduction + 0.1); },
  },
  {
    id: 'first_aid_wash',
    name: '응급 세척·지혈 키트',
    tag: '현장 의료',
    description: '화학 가스 및 타박상으로부터 즉시 회복할 수 있는 고농축 구급 세정제입니다.',
    cost: 80,
    iconName: 'heal',
    effectText: '체력 60% 즉시 회복',
    apply: s => { s.player.hp = Math.min(s.player.maxHp, Math.round(s.player.hp + s.player.maxHp * 0.6)); },
  },
  {
    id: 'safety_harness',
    name: '충격 흡수 세이프티 하네스',
    tag: '추락 방지',
    description: '복합 섬유 완충 하네스로 불의의 충격에 대한 최대 생존력을 늘립니다.',
    cost: 120,
    iconName: 'harness',
    effectText: '최대 체력 +40 · 현재 체력 +40',
    apply: s => { s.player.maxHp += 40; s.player.hp += 40; },
  },
  {
    id: 'magnet_beacon',
    name: '고출력 자재 회수 비콘',
    tag: '자재 수거',
    description: '현장에 흩어진 안전 일지 및 보급품을 먼 거리에서도 자석처럼 끌어당깁니다.',
    cost: 90,
    iconName: 'magnet',
    effectText: '아이템 자석 습득 반경 +45%',
    apply: s => { s.player.pickupRadius = Math.round(s.player.pickupRadius * 1.45); },
  },
];

function getRandomItems(count = 4, excludeIds: string[] = [],credits=Infinity): ShopUpgradeItem[] {
  const pool = UPGRADE_CATALOG.filter(item => !excludeIds.includes(item.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected=shuffled.slice(0, count);
  const affordable=pool.find(item=>item.cost<=credits);
  if(affordable&&!selected.some(item=>item.cost<=credits))selected[selected.length-1]=affordable;
  return selected;
}

interface SurvivorsContainerShopProps {
  completedWave: number;
  gameState: SurvivorsGameState;
  onContinue: () => void;
  playSfx?: (name: 'pickup' | 'control') => void;
}

export function SurvivorsContainerShop({
  completedWave,
  gameState,
  onContinue,
  playSfx,
}: SurvivorsContainerShopProps) {
  const [items, setItems] = useState<ShopUpgradeItem[]>(() => getRandomItems(4,[],gameState.psiCredits));
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [credits, setCredits] = useState<number>(gameState.psiCredits);

  const REROLL_COST = 10;

  const handleBuy = (item: ShopUpgradeItem) => {
    if (credits < item.cost || purchasedIds.has(item.id)) return;

    const nextCredits = credits - item.cost;
    gameState.psiCredits = nextCredits;
    setCredits(nextCredits);

    // Apply upgrade effect
    item.apply(gameState);

    setPurchasedIds(prev => new Set(prev).add(item.id));
    if (playSfx) playSfx('pickup');
  };

  const handleReroll = () => {
    if (credits < REROLL_COST) return;

    const nextCredits = credits - REROLL_COST;
    gameState.psiCredits = nextCredits;
    setCredits(nextCredits);

    const boughtList = Array.from(purchasedIds);
    setItems(getRandomItems(4, boughtList,nextCredits));
    if (playSfx) playSfx('control');
  };

  const artCells={nozzle:0,laser:1,boots:2,capacitor:3,drone:4,heal:5,harness:6,magnet:7};

  return (
    <div className="survivors-container-shop-backdrop" role="dialog" aria-modal="true" aria-labelledby="shop-title">
      <div className="survivors-container-shop-modal">
        {/* TOP HEADER */}
        <div className="shop-header">
          <div className="shop-header-title">
            <span className="shop-badge">WAVE {completedWave} CLEARED</span>
            <h2 id="shop-title">현장 정비 보급소</h2>
            <p role="status">{safeSupplyText.safeSupply}</p>
            <details className="shop-currency-info"><summary>{supplyText.currencyDetails}</summary><p>게임 내 PSI 보급 포인트로 이번 순찰 장비를 튜닝합니다. 현금 결제나 유료 구매는 없습니다.</p></details>
          </div>
          <div className="shop-wallet">
            <span className="shop-wallet-label" title="FIELD SUPPLY · GAME CREDIT">{supplyText.wallet}</span>
            <span className="shop-wallet-amount">PSI {credits.toLocaleString()}</span>
          </div>
        </div>

        <section className="shop-loadout" aria-label={supplyText.loadout}><strong>{supplyText.loadout}</strong><div>{(Object.entries(gameState.activePerks) as [PerkId,number][]).filter(([,level])=>level>0).map(([id,level])=><span key={id}><SurvivorsEquipmentIcon id={id} level={level}/>{PERK_CATALOG[id].name} <small>Lv.{level}</small></span>)}</div><small>{supplyText.note}</small></section>
        <details className="shop-detail"><summary>{supplyText.nextWave}</summary><p>{[...new Set(gameState.stage.hazardMix??[])].filter((id):id is keyof typeof supplyText.risks=>id in supplyText.risks).map(id=>supplyText.risks[id]).join(' · ')||gameState.stage.name}</p></details>
        {/* 4 UPGRADE CARDS */}
        <div className="shop-items-grid">
          {items.map((item, idx) => {
            const isBought = purchasedIds.has(item.id);
            const preview=isBought?[]:previewSupplyUpgrade(gameState,item.apply);
            const canAfford = credits >= item.cost;
            const synergy=supplyPartners(item.id,gameState.activePerks);
            const explanation=supplyText.items[item.id as keyof typeof supplyText.items];
            return (
              <div
                key={`${item.id}-${idx}`}
                className={`shop-card ${isBought ? 'is-purchased' : canAfford ? 'is-affordable' : 'is-expensive'}`}
              >
                <div className="shop-card-badge">{item.tag}</div>
                <div className="shop-card-art" role="img" aria-label={item.name} style={{backgroundPosition:`${artCells[item.iconName]%4*100/3}% ${Math.floor(artCells[item.iconName]/4)*100}%`}}/>
                <h3 className="shop-card-title">{item.name}</h3>
                <div className="shop-card-effect">{item.effectText}</div>
                {!isBought ? <details className="shop-detail"><summary>{previewText.title}</summary>{preview.length?preview.map(({field,before,after})=>{
                  const percent=field==='critRate'||field==='cooldownReduction',scale=percent?100:1;
                  const unit=percent?'%':field==='dashMaxCooldown'?previewText.seconds:'';
                  return <p key={field}>{previewText.fields[field]}: {Number((before*scale).toFixed(2))}{unit} → {Number((after*scale).toFixed(2))}{unit}</p>;
                }):<p>{previewText.unchanged}</p>}</details> : null}
                <section className={`shop-synergy${synergy.owned?' is-matched':''}`}><strong>{synergy.owned?supplyText.matched:supplyText.suggested}</strong><div>{synergy.ids.map(id=><span key={id}><SurvivorsEquipmentIcon id={id} level={gameState.activePerks[id]||1}/><small>{PERK_CATALOG[id].name}</small></span>)}</div><p>{explanation.reason}</p></section>
                <details className="shop-detail"><summary>{supplyText.details}</summary><p>{explanation.detail}</p></details>

                <div className="shop-card-bottom">
                  {isBought ? (
                    <div className="shop-bought-stamp">✔ 장착 완료</div>
                  ) : (
                    <button
                      type="button"
                      className="shop-buy-btn"
                      disabled={!canAfford}
                      onClick={() => handleBuy(item)}
                    >
                      <span>{canAfford?supplyText.buy:supplyText.shortfall} · {item.cost} PSI</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="shop-footer">
          <button
            type="button"
            className="shop-reroll-btn"
            disabled={credits < REROLL_COST}
            onClick={handleReroll}
            title={`보급 목록 갱신 (비용: ${REROLL_COST} PSI)`}
          >
            <RefreshCw size={18} />
            <span>보급 목록 갱신 ({REROLL_COST} PSI)</span>
          </button>

          <button
            type="button"
            className="shop-continue-btn"
            onClick={onContinue}
          >
            <span>정비 완료 · 순찰 재개 (Wave {completedWave + 1}) ≫</span>
          </button>
        </div>
      </div>
    </div>
  );
}

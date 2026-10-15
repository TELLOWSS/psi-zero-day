/* SIGNAL BREAKER: WoW-style Talent Tree & Diablo-style Weapon Tech/Socket System.
 * Safe industrial engineering terminology. Non-P2W gameplay progression.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SignalBreakerTalentTech={...api,manager:new api.TalentTechManager({storage:typeof localStorage==='object'?localStorage:null})};})(typeof window==='object'?window:globalThis,function(){
  'use strict';

  // 1. WoW-Style 3 Specializations (31 Points Total Cap, 1 point per wave/level)
  const TALENT_TREES = {
    defense: {
      id: 'defense',
      name: '전술 방호 (Tactical Defense)',
      desc: '방호벽 편향 각도 최적화, 충격 흡수 실드 및 신호 안정화 지속력 강화',
      color: '#65d5ba',
      tiers: [
        {
          id: 'def_t1',
          name: '충격 완충 패드',
          desc: '벽면 및 방호판 반사 시 탄속 감쇠율 15% 감소, 콤보 유지시간 +0.4초',
          maxRank: 5,
          stat: { bounceVelocity: 0.15, comboWindow: 0.4 }
        },
        {
          id: 'def_t2',
          name: '위상 편향 각도기',
          desc: '방호판의 반사 유효 각도 허용치 20% 확장 및 금속 튕김 각도 정밀화',
          maxRank: 3,
          stat: { shieldTolerance: 0.2, deflectionAngle: 0.1 }
        },
        {
          id: 'def_t3',
          name: '비상 차폐막 전개',
          desc: '체력 1 잔여 시 3초간 무적 차폐막 자동 전개 (스테이지당 1회)',
          maxRank: 1,
          stat: { emergencyShield: true }
        },
        {
          id: 'def_t4',
          name: '신호 감압 필터링',
          desc: '분진 및 고압 신호 코어의 폭주 방출 속도 25% 지연',
          maxRank: 5,
          stat: { hazardDelay: 0.25 }
        },
        {
          id: 'def_t5',
          name: '궁극: 절대 방호 결계',
          desc: '방호판 활성화 시 전방위 펄스 반사 충격파 방출, 즉시 위험 코어 1개 안정화',
          maxRank: 1,
          stat: { absoluteShieldShockwave: true }
        }
      ]
    },
    kinetic: {
      id: 'kinetic',
      name: '키네틱 제동 (Kinetic Braking)',
      desc: '순간 충격량 극대화, 다중 분쇄 타격 및 물리 히트스탑 연쇄 파괴',
      color: '#f9b364',
      tiers: [
        {
          id: 'kin_t1',
          name: '고압 압축 챔버',
          desc: '에어 펄스 초기 발사 속도 15% 증가, 관통 충격량 20% 증가',
          maxRank: 5,
          stat: { pulseSpeed: 0.15, pulseImpact: 0.2 }
        },
        {
          id: 'kin_t2',
          name: '충격파 진동 핀',
          desc: '타격 시 0.04초 히트스탑 임팩트 및 주변 코어 연쇄 넉백 발생',
          maxRank: 3,
          stat: { hitStopBoost: 0.04, knockbackRadius: 40 }
        },
        {
          id: 'kin_t3',
          name: '공진 파쇄탄',
          desc: '아머를 보유한 신호 코어 타격 시 2배 방호벽 관통 피해',
          maxRank: 1,
          stat: { armorPierceMultiplier: 2.0 }
        },
        {
          id: 'kin_t4',
          name: '연쇄 파동 축전기',
          desc: '반사 타격 3회 연속 성공 시 다음 1발이 삼중 분할 펄스로 변환',
          maxRank: 5,
          stat: { tripleSplitChance: 0.6 }
        },
        {
          id: 'kin_t5',
          name: '궁극: 키네틱 오버드라이브',
          desc: '보스 약점 노드 타격 시 100% 확률로 즉시 체인 콤보 최대치 부여 및 연쇄 폭파',
          maxRank: 1,
          stat: { kineticOverdrive: true }
        }
      ]
    },
    engineering: {
      id: 'engineering',
      name: '현장 공학 (Field Engineering)',
      desc: '전자석 유도 궤적 왜곡, 원격 포획망 및 잔여 신호 자동 회수 체인',
      color: '#7bd8f4',
      tiers: [
        {
          id: 'eng_t1',
          name: '초전도 자력 코일',
          desc: '전자석 흡인 유효 반경 25% 확장 및 금속 코어 유도력 증폭',
          maxRank: 5,
          stat: { magnetRadius: 0.25, magnetPull: 0.2 }
        },
        {
          id: 'eng_t2',
          name: '고밀도 나일론 메시',
          desc: '포획망 반경 20% 증가, 다중 포획 한도 +2개',
          maxRank: 3,
          stat: { netRadius: 0.2, netCapacity: 2 }
        },
        {
          id: 'eng_t3',
          name: '신호 공진 스캐너',
          desc: '화면 밖 위험 신호의 발생 궤적을 1.5초 사전 감지하고 경고 레티클 투사',
          maxRank: 1,
          stat: { predictiveScanner: true }
        },
        {
          id: 'eng_t4',
          name: '스마트 에너지 루프',
          desc: '신호 코어 회수 시마다 서브 보조탄 쿨다운 15% 단축 및 에너지 리사이클',
          maxRank: 5,
          stat: { cooldownReduction: 0.15 }
        },
        {
          id: 'eng_t5',
          name: '궁극: 클린 체인 자동 전개기',
          desc: '마지막 잔여 코어 3개 이하 시 유도 드론 펄스가 자동 출격하여 일괄 회수',
          maxRank: 1,
          stat: { autoCleanDrone: true }
        }
      ]
    }
  };

  // 2. Diablo-Style 6 Weapon Tech Trees & Socket Sockets
  const WEAPON_TECHS = {
    pulse: {
      name: '01 에어 펄스',
      tiers: [
        { tier: 1, name: '표준형 단발 펄스', desc: '직선 탄도, 기본 반사율' },
        { tier: 2, name: '듀얼 챔버 펄스', desc: '발사 간격 25% 단축, 탄속 +15%' },
        { tier: 3, name: '플라즈마 임팩터', desc: '반경 95 안에서 최대 3개 신호 추가 타격' },
        { tier: 4, name: '슈프림 바이브로 캐논', desc: '탄당 최대 3회 관통 · 반경 95 충격파 유지' }
      ]
    },
    net: {
      name: '02 전개형 포획망',
      tiers: [
        { tier: 1, name: '표준형 포획망', desc: '단일 구역 코어 억제' },
        { tier: 2, name: '와이드 메시 네트', desc: '포획 반경 30% 확장' },
        { tier: 3, name: '전자기 억류 필드', desc: '망 내부 코어 1.5초 정지' },
        { tier: 4, name: '볼텍스 트랩 그리드', desc: '확장 회수장 3초 유지 · 범위 안의 신호를 중심으로 유도' }
      ]
    },
    magnet: {
      name: '03 전자석 패드',
      tiers: [
        { tier: 1, name: '영구 자석 패드', desc: '금속 코어 궤적 굴절' },
        { tier: 2, name: '극성 변환 펄서', desc: 'N/S극 고속 교번을 통한 궤적 조작' },
        { tier: 3, name: '초전도 고리 자장', desc: '원형 궤도 포획 및 안정화' },
        { tier: 4, name: '자기부상 레일웨이', desc: '자장 안의 금속 신호를 게이트 방향으로 추가 유도' }
      ]
    },
    mist: {
      name: '04 감압 미스트',
      tiers: [
        { tier: 1, name: '미세 노즐 분무', desc: '분진 코어 압력 완화' },
        { tier: 2, name: '저온 응결 에어로졸', desc: '신호 감압 속도 2배 가속' },
        { tier: 3, name: '정전기 집진 커튼', desc: '부유 입자 즉시 침전' },
        { tier: 4, name: '초청정 클린룸 필드', desc: '분진·전력 즉시 안정화 · 분진 속도 강하게 감쇠' }
      ]
    },
    anchor: {
      name: '05 장력 앵커',
      tiers: [
        { tier: 1, name: '기계식 잠금 훅', desc: '단일 와이어 레일 고정' },
        { tier: 2, name: '유압 댐퍼 앵커', desc: '하중 신호 속도 50% 완충 · 고정 중 추가 감쇠' },
        { tier: 3, name: '멀티 바인드 윈치', desc: '최대 3개 신호 동시 고정' },
        { tier: 4, name: '티타늄 인장 지지대', desc: '명중 주변 2개 연동 · 최대 5개 고정 · 유지 +1.5초' }
      ]
    },
    scan: {
      name: '06 위상 스캐너',
      tiers: [
        { tier: 1, name: '광학 반사 분석기', desc: '취약 노드 하이라이트' },
        { tier: 2, name: '주파수 분광기', desc: '다음 출현 신호 패턴 사전 투사' },
        { tier: 3, name: '홀로그래픽 레티클', desc: '스캔 중 자동 조준각 즉시 갱신' },
        { tier: 4, name: '시공간 위상 동조기', desc: '전투 중 슬로우 모션 1.5초 기동' }
      ]
    }
  };

  const SOCKET_GEMS = [
    { stat:{pulseSpeed:.12,pulseImpact:.15},id: 'gem_kinetic', name: '키네틱 코어 (탄속)', bonus: '+12% 에어 펄스 탄속', color: '#ffb36a' },
    {stat:{netRadius:.15,magnetRadius:.15},id: 'gem_thermal', name: '열역학 칩셋 (포획)', bonus: '+15% 포획 반경', color: '#68dbe3' },
    {stat:{comboWindow:.3,tripleSplitChance:.1},id: 'gem_pulse', name: '펄스 증폭기 (연쇄/콤보)', bonus: '+0.3초 콤보 · 삼중 펄스 확률 +10%', color: '#a68aff' }
    ,{id:'gem_damper',name:'충격 완충 젬',bonus:'반사 감쇠 15% 감소',color:'#87d5dd',stat:{bounceVelocity:.15}}
    ,{id:'gem_mist',name:'공학 미스트 젬',bonus:'미스트 감압 25% 가속',color:'#87e4cb',stat:{mistRate:.25}}
    ,{id:'gem_tension',name:'텐션 하중 젬',bonus:'앵커 고정시간 +1초',color:'#ffc582',stat:{anchorDuration:1}}
    ,{id:'gem_insulation',name:'절연 세라믹 젬',bonus:'전력 코어 접촉 피해 면역',color:'#ccabff',stat:{powerImmunity:1}}
  ];
  const BOSS_LOOT={
    'CH-01':{gemId:'gem_kinetic',partName:'고압 챔버 부품'},
    'CH-02':{gemId:'gem_damper',commonGemId:'gem_pulse',partName:'댐퍼 앵커 부품'},
    'CH-03':{gemId:'gem_mist',commonGemId:'gem_thermal',partName:'나노 집진 필터 부품'},
    'CH-04':{gemId:'gem_tension',commonGemId:'gem_pulse',partName:'고장력 와이어 부품'},
    'CH-05':{gemId:'gem_insulation',commonGemId:'gem_thermal',partName:'특고압 릴레이 부품'}
  };
  const GEM_WEAPONS={gem_kinetic:['pulse'],gem_thermal:['net','magnet'],gem_pulse:['pulse'],gem_mist:['mist'],gem_tension:['anchor']};
  // Character careers reuse earned entitlement, never grant points on switching.
  const CAREERS={
    player:{tree:'defense',order:['defense','engineering','kinetic'],stats:[{comboWindow:.1},{shieldTolerance:.05},{cooldownReduction:.04}]},
    kang_taesik:{tree:'defense',order:['defense','kinetic','engineering'],stats:[{bounceVelocity:.05},{shieldTolerance:.05},{comboWindow:.2}]},
    yoon_sungho:{tree:'kinetic',order:['defense','kinetic','engineering'],stats:[{pulseSpeed:.04},{pulseImpact:.05},{knockbackRadius:12}]},
    lee_jaehoon:{tree:'engineering',order:['defense','engineering','kinetic'],stats:[{magnetRadius:.04},{netRadius:.05},{cooldownReduction:.04}]},
    lim_junho:{tree:'engineering',order:['defense','engineering','kinetic'],stats:[{comboWindow:.1},{netCapacity:1},{magnetPull:.05}]},
    safety_monitor:{tree:'defense',order:['defense','engineering','kinetic'],stats:[{shieldTolerance:.04},{hazardDelay:.04},{bounceVelocity:.06}]}
  };
  function validTalents(value,points){const result={};let remaining=Math.min(31,points);for(const tree of Object.values(TALENT_TREES))for(let i=0;i<tree.tiers.length;i++){const node=tree.tiers[i],rank=value?.[node.id];const unlocked=i===0||result[tree.tiers[i-1].id]===tree.tiers[i-1].maxRank;result[node.id]=unlocked&&Number.isInteger(rank)&&rank>=0?Math.min(rank,node.maxRank,remaining):0;remaining-=result[node.id];}return result;}
  const compatible=(weapon,id)=>Object.hasOwn(WEAPON_TECHS,weapon)&&SOCKET_GEMS.some(g=>g.id===id)&&(!GEM_WEAPONS[id]||GEM_WEAPONS[id].includes(weapon));
  const recommendDraft=choices=>['capture','memory','field','cadence','bank','focus'].find(id=>choices.includes(id))||choices[0]||null;

  class TalentTechManager {
    constructor(options = {}) {
      this.storage = options.storage || null;
      this.parts = 0;
      this.inventory = {};
      this.rewardClaims = [];
      this.storageKey = 'psi.signal-breaker.talent-tech.v1';
      this.guideRewardClaimed = false;
      this.points = 5; // 기본 지급 포인트
      this.spentPoints = 0;
      this.talents = {}; // { [talentId]: rank }
      this.characterId='player';this.characterTalents={};
      this.weaponLevels = { pulse: 1, net: 1, magnet: 1, mist: 1, anchor: 1, scan: 1 };
      this.weaponSockets = {
        pulse: [null, null, null],
        net: [null, null, null],
        magnet: [null, null, null],
        mist: [null, null, null],
        anchor: [null, null, null],
        scan: [null, null, null]
      };
      this.load();
    }

    load() {
      try {
        const raw = this.storage?.getItem(this.storageKey);
        if (!raw) return;
        const data = JSON.parse(raw);
        this.guideRewardClaimed = data.guideRewardClaimed === true;
        if (Number.isSafeInteger(data.points) && data.points >= 0) this.points = data.points;
        for (const tree of Object.values(TALENT_TREES)) for (const tier of tree.tiers) {
          const rank = data.talents?.[tier.id];
          if (Number.isInteger(rank) && rank >= 0 && rank <= tier.maxRank) this.talents[tier.id] = rank;
        }
        for (const key of Object.keys(this.weaponLevels)) {
          const level = data.weaponLevels?.[key];
          if (Number.isInteger(level) && level >= 1 && level <= 4) this.weaponLevels[key] = level;
          const sockets = data.weaponSockets?.[key];
          if (Array.isArray(sockets) && sockets.length === 3) this.weaponSockets[key] = sockets.map(id => SOCKET_GEMS.some(gem => gem.id === id) ? id : null);
        }
        const validCount=v=>Number.isSafeInteger(v)&&v>=0&&v<=999;
        if(validCount(data.parts))this.parts=data.parts;
        for(const gem of SOCKET_GEMS)if(validCount(data.inventory?.[gem.id]))this.inventory[gem.id]=data.inventory[gem.id];
        // Legacy mounted stock is preserved; incompatible mounts return to inventory.
        if(![2,3].includes(data.schemaVersion))for(const slots of Object.values(this.weaponSockets))for(const id of slots)if(id)this.inventory[id]=Math.max(this.inventory[id]||0,this.equippedCount(id));
        const allocated={};for(const [weapon,slots] of Object.entries(this.weaponSockets))this.weaponSockets[weapon]=slots.map(id=>{if(!id||!compatible(weapon,id)||(allocated[id]||0)>=(this.inventory[id]||0))return null;allocated[id]=(allocated[id]||0)+1;return id;});
        this.rewardClaims=Array.isArray(data.rewardClaims)?[...new Set(data.rewardClaims.filter(id=>typeof id==='string'&&id.length<=100))].slice(-512):[];
        let remaining=Math.min(31,this.points);for(const tree of Object.values(TALENT_TREES))for(let index=0;index<tree.tiers.length;index++){const tier=tree.tiers[index],rank=this.talents[tier.id]||0,unlocked=index===0||this.talents[tree.tiers[index-1].id]===tree.tiers[index-1].maxRank;this.talents[tier.id]=unlocked?Math.min(rank,remaining):0;remaining-=this.talents[tier.id];}
        this.calcSpent();
        for(const id of Object.keys(CAREERS))this.characterTalents[id]=validTalents(data.characterTalents?.[id]||(id==='player'?this.talents:{}),this.points);
        this.characterId=Object.hasOwn(CAREERS,data.characterId)?data.characterId:'player';this.talents=this.characterTalents[this.characterId];this.calcSpent();
      } catch (e) {
        console.warn('TalentTech load error', e);
      }
    }

    save() {
      try {
        this.storage?.setItem(this.storageKey, JSON.stringify({
          schemaVersion:3,characterId:this.characterId,characterTalents:{...this.characterTalents,[this.characterId]:this.talents},parts:this.parts,inventory:this.inventory,rewardClaims:this.rewardClaims,
          guideRewardClaimed: this.guideRewardClaimed,
          points: this.points,
          talents: this.talents,
          weaponLevels: this.weaponLevels,
          weaponSockets: this.weaponSockets
        }));
        this.lastSaveSucceeded=true;return true;
      } catch (e) {
        this.lastSaveSucceeded=false;return false;
      }
    }

    calcSpent() {
      this.spentPoints = Object.values(this.talents).reduce((sum, v) => sum + (v || 0), 0);
    }
    setCharacter(id){
      if(!Object.hasOwn(CAREERS,id))return false;
      const old=this.characterId,oldTalents=this.talents;
      this.characterTalents[old]=oldTalents;this.characterId=id;this.talents=this.characterTalents[id]||{};this.calcSpent();
      if(this.save()===false){this.characterId=old;this.talents=oldTalents;this.calcSpent();return false;}return true;
    }
    recommendation(){const career=CAREERS[this.characterId];if(this.canInvest('def_t1'))return {id:'def_t1',tree:'defense',cost:1,rank:this.talents.def_t1||0,maxRank:5};for(const key of [career.tree,...career.order.filter(id=>id!==career.tree)])for(const node of TALENT_TREES[key].tiers)if(this.canInvest(node.id))return {id:node.id,tree:key,cost:1,rank:this.talents[node.id]||0,maxRank:node.maxRank};return null;}
    careerProgress(){const career=CAREERS[this.characterId];const invested=TALENT_TREES[career.tree].tiers.reduce((n,node)=>n+(this.talents[node.id]||0),0);return [5,9,15].map((required,index)=>({required,index,invested,active:invested>=required,stat:career.stats[index]}));}
    equipmentRecommendation(loadout){for(const weapon of loadout.filter(id=>Object.hasOwn(WEAPON_TECHS,id))){if(this.parts>0&&this.weaponLevels[weapon]<4)return {type:'upgrade',weapon,cost:1};const slot=this.weaponSockets[weapon].indexOf(null),gem=SOCKET_GEMS.find(g=>compatible(weapon,g.id)&&this.availableGems(g.id)>0);if(slot>=0&&gem)return {type:'socket',weapon,slot,gemId:gem.id,cost:0};}return null;}

    getAvailablePoints() {
      return Math.max(0, Math.min(31,this.points) - this.spentPoints);
    }

    claimGuideReward() {
      if (this.guideRewardClaimed) return false;
      this.guideRewardClaimed = true;
      this.addPoints(3);
      return true;
    }

    addPoints(n = 1) {
      if (!Number.isSafeInteger(n) || n <= 0 || !Number.isSafeInteger(this.points + n)) return false;
      this.points += n;
      this.save();
      return true;
    }

    investTalent(talentId) {
      if (!this.canInvest(talentId)) return false;
      // 해당 특성 찾기
      let found = null;
      for (const tree of Object.values(TALENT_TREES)) {
        for (const tier of tree.tiers) {
          if (tier.id === talentId) {
            found = tier;
            break;
          }
        }
        if (found) break;
      }
      if (!found) return false;
      const cur = this.talents[talentId] || 0;
      if (cur >= found.maxRank) return false;
      if (this.getAvailablePoints() <= 0) return false;

      this.talents[talentId] = cur + 1;
      this.calcSpent();
      if(this.save()===false){this.talents[talentId]=cur;this.calcSpent();return false;}
      return true;
    }

    canInvest(id) {
      if(this.getAvailablePoints()<=0)return false;
      for(const tree of Object.values(TALENT_TREES)){const index=tree.tiers.findIndex(t=>t.id===id);if(index<0)continue;const tier=tree.tiers[index];return (this.talents[id]||0)<tier.maxRank&&(index===0||(this.talents[tree.tiers[index-1].id]||0)===tree.tiers[index-1].maxRank);}
      return false;
    }
    equippedCount(id){return Object.values(this.weaponSockets).flat().filter(v=>v===id).length;}
    availableGems(id){return Math.max(0,(this.inventory[id]||0)-this.equippedCount(id));}
    canSocket(weapon,id){return compatible(weapon,id);}
    grantBossReward(stage,key){
      const entry=BOSS_LOOT[stage];if(!entry||typeof key!=='string'||!key||key.length>100||this.rewardClaims.includes(key))return null;
      this.rewardClaims.push(key);this.rewardClaims=this.rewardClaims.slice(-512);for(const id of [entry.gemId,entry.commonGemId].filter(Boolean))this.inventory[id]=Math.min(999,(this.inventory[id]||0)+1);this.parts=Math.min(999,this.parts+1);this.points+=2;this.save();return {...entry,points:2,parts:1};
    }
    resetTalents() {
      const previous=this.talents;
      this.talents = {};
      this.calcSpent();
      if(this.save()===false){this.talents=previous;this.calcSpent();return false;}return true;
    }

    upgradeWeapon(weaponKey) {
      if(!Object.hasOwn(WEAPON_TECHS,weaponKey))return false;
      if(this.parts<1)return false;
      if (!this.weaponLevels[weaponKey]) return false;
      if (this.weaponLevels[weaponKey] >= 4) return false;
      this.parts--;
      this.weaponLevels[weaponKey]++;
      if(this.save()===false){this.parts++;this.weaponLevels[weaponKey]--;return false;}
      return true;
    }

    socketGem(weaponKey, slotIdx, gemId) {
      if (!Object.hasOwn(WEAPON_TECHS,weaponKey) || !Number.isInteger(slotIdx) || slotIdx < 0 || slotIdx > 2 || (gemId !== null && !compatible(weaponKey,gemId))) return false;
      if(this.weaponSockets[weaponKey][slotIdx]===gemId)return true;
      if(gemId!==null&&this.availableGems(gemId)<1)return false;
      const previous=this.weaponSockets[weaponKey][slotIdx];this.weaponSockets[weaponKey][slotIdx] = gemId;
      if(this.save()===false){this.weaponSockets[weaponKey][slotIdx]=previous;return false;}
      return true;
    }

    getStats() {
      const stats = {
        bounceVelocity: 0,
        comboWindow: 0,
        shieldTolerance: 0,
        pulseSpeed: 0,
        pulseImpact: 0,
        hitStopBoost: 0,
        magnetRadius: 0,
        netRadius: 0,
        cooldownReduction: 0,
        tripleSplitChance: 0
      };
      // 1. WoW Specialization Talents
      for (const tree of Object.values(TALENT_TREES)) {
        for (const tier of tree.tiers) {
          const rank = this.talents[tier.id] || 0;
          if (rank > 0 && tier.stat) {
            for (const [k, v] of Object.entries(tier.stat)) {
              if (typeof v === 'number') stats[k] = (stats[k] || 0) + v * (rank / tier.maxRank);
              else if (typeof v === 'boolean') stats[k] = v;
            }
          }
        }
      }
      for(const node of this.careerProgress())if(node.active)for(const [key,value] of Object.entries(node.stat))stats[key]=(stats[key]||0)+value;
      stats.weaponLevels={...this.weaponLevels};
      stats.weaponSocketStats={};
      for(const [key,sockets] of Object.entries(this.weaponSockets)){const values={};for(const id of sockets){const gem=SOCKET_GEMS.find(g=>g.id===id);if(gem)for(const [name,value] of Object.entries(gem.stat))values[name]=(values[name]||0)+value;}stats.weaponSocketStats[key]=values;}
      return stats;
    }
  }

  const ACTIVE_TALENT_EFFECTS=Object.fromEntries(Object.values(TALENT_TREES).flatMap(tree=>tree.tiers.map(tier=>[tier.id,tier.desc])));

  return {
    TalentTechManager,BOSS_LOOT,CAREERS,validTalents,recommendDraft,
    ACTIVE_TALENT_EFFECTS,
    TALENT_TREES,
    WEAPON_TECHS,
    SOCKET_GEMS,
    pointCap:31
  };
});

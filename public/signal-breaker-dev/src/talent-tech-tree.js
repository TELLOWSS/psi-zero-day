/* SIGNAL BREAKER: WoW-style Talent Tree & Diablo-style Weapon Tech/Socket System.
 * Safe industrial engineering terminology. Non-P2W gameplay progression.
 */
(function(){
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
        { tier: 3, name: '플라즈마 임팩터', desc: '타격 시 방사형 충격파 파편 발생' },
        { tier: 4, name: '슈프림 바이브로 캐논', desc: '관통 반사 및 전방위 공진 파괴' }
      ]
    },
    net: {
      name: '02 전개형 포획망',
      tiers: [
        { tier: 1, name: '표준형 포획망', desc: '단일 구역 코어 억제' },
        { tier: 2, name: '와이드 메시 네트', desc: '포획 반경 30% 확장' },
        { tier: 3, name: '전자기 억류 필드', desc: '망 내부 코어 1.5초 정지' },
        { tier: 4, name: '볼텍스 트랩 그리드', desc: '주변 모든 잔여 신호 강제 흡입' }
      ]
    },
    magnet: {
      name: '03 전자석 패드',
      tiers: [
        { tier: 1, name: '영구 자석 패드', desc: '금속 코어 궤적 굴절' },
        { tier: 2, name: '극성 변환 펄서', desc: 'N/S극 고속 교번을 통한 궤적 조작' },
        { tier: 3, name: '초전도 고리 자장', desc: '원형 궤도 포획 및 안정화' },
        { tier: 4, name: '자기부상 레일웨이', desc: '신호 코어를 게이트로 직행 유도' }
      ]
    },
    mist: {
      name: '04 감압 미스트',
      tiers: [
        { tier: 1, name: '미세 노즐 분무', desc: '분진 코어 압력 완화' },
        { tier: 2, name: '저온 응결 에어로졸', desc: '신호 감압 속도 2배 가속' },
        { tier: 3, name: '정전기 집진 커튼', desc: '부유 입자 즉시 침전' },
        { tier: 4, name: '초청정 클린룸 필드', desc: '위험 가스 폭주 100% 차단' }
      ]
    },
    anchor: {
      name: '05 장력 앵커',
      tiers: [
        { tier: 1, name: '기계식 잠금 훅', desc: '단일 와이어 레일 고정' },
        { tier: 2, name: '유압 댐퍼 앵커', desc: '파열 진동 50% 흡수' },
        { tier: 3, name: '멀티 바인드 윈치', desc: '동시 3개 레일 연동 고정' },
        { tier: 4, name: '티타늄 인장 지지대', desc: '보스 장력 기믹 완전 무력화' }
      ]
    },
    scan: {
      name: '06 위상 스캐너',
      tiers: [
        { tier: 1, name: '광학 반사 분석기', desc: '취약 노드 하이라이트' },
        { tier: 2, name: '주파수 분광기', desc: '다음 출현 신호 패턴 사전 투사' },
        { tier: 3, name: '홀로그래픽 레티클', desc: '스마트 자동 조준각도 오차 0%' },
        { tier: 4, name: '시공간 위상 동조기', desc: '전투 중 슬로우 모션 1.5초 기동' }
      ]
    }
  };

  const SOCKET_GEMS = [
    { id: 'gem_kinetic', name: '키네틱 코어 (탄속)', bonus: '+12% 에어 펄스 탄속', color: '#ffb36a' },
    { id: 'gem_thermal', name: '열역학 칩셋 (포획)', bonus: '+15% 포획 반경', color: '#68dbe3' },
    { id: 'gem_pulse', name: '펄스 증폭기 (연쇄/콤보)', bonus: '+0.3초 콤보 · 삼중 펄스 확률 +10%', color: '#a68aff' }
  ];

  class TalentTechManager {
    constructor() {
      this.storageKey = 'psi.signal-breaker.talent-tech.v1';
      this.guideRewardClaimed = false;
      this.points = 5; // 기본 지급 포인트
      this.spentPoints = 0;
      this.talents = {}; // { [talentId]: rank }
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
        const raw = localStorage.getItem(this.storageKey);
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
        this.calcSpent();
      } catch (e) {
        console.warn('TalentTech load error', e);
      }
    }

    save() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify({
          guideRewardClaimed: this.guideRewardClaimed,
          points: this.points,
          talents: this.talents,
          weaponLevels: this.weaponLevels,
          weaponSockets: this.weaponSockets
        }));
      } catch (e) {
        console.warn('TalentTech save error', e);
      }
    }

    calcSpent() {
      this.spentPoints = Object.values(this.talents).reduce((sum, v) => sum + (v || 0), 0);
    }

    getAvailablePoints() {
      return Math.max(0, this.points - this.spentPoints);
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
      if (!Object.hasOwn(ACTIVE_TALENT_EFFECTS, talentId)) return false;
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
      this.save();
      return true;
    }

    resetTalents() {
      this.talents = {};
      this.calcSpent();
      this.save();
    }

    upgradeWeapon(weaponKey) {
      if (!['pulse', 'net'].includes(weaponKey)) return false;
      if (!this.weaponLevels[weaponKey]) return false;
      if (this.weaponLevels[weaponKey] >= 4) return false;
      this.weaponLevels[weaponKey]++;
      this.save();
      return true;
    }

    socketGem(weaponKey, slotIdx, gemId) {
      if (!this.weaponSockets[weaponKey] || !Number.isInteger(slotIdx) || slotIdx < 0 || slotIdx > 2 || (gemId !== null && !SOCKET_GEMS.some(gem => gem.id === gemId))) return false;
      this.weaponSockets[weaponKey][slotIdx] = gemId;
      this.save();
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
      // 2. Weapon Tier Enhancements
      for (const [wKey, lvl] of Object.entries(this.weaponLevels)) {
        if (lvl > 1) {
          const tierBonus = (lvl - 1) * 0.08;
          if (wKey === 'pulse') stats.pulseSpeed += tierBonus;
          if (wKey === 'net') stats.netRadius += tierBonus;
          if (wKey === 'magnet') stats.magnetRadius += tierBonus;
        }
      }
      // 3. Diablo Socket Gems
      for (const sockets of Object.values(this.weaponSockets)) {
        for (const gemId of sockets) {
          if (gemId === 'gem_kinetic') {
            stats.pulseSpeed += 0.12;
            stats.pulseImpact += 0.15;
          } else if (gemId === 'gem_thermal') {
            stats.netRadius += 0.15;
            stats.magnetRadius += 0.15;
          } else if (gemId === 'gem_pulse') {
            stats.comboWindow += 0.3;
            stats.tripleSplitChance += 0.1;
          }
        }
      }
      return stats;
    }
  }

  const ACTIVE_TALENT_EFFECTS = {
    def_t1: '최대 투자 시 콤보 유지시간 +0.4초',
    kin_t1: '최대 투자 시 에어 펄스 탄속 +15%',
    kin_t4: '최대 투자 시 발사마다 60% 확률로 삼중 펄스',
    eng_t2: '최대 투자 시 포획 반경 +20%',
    eng_t4: '최대 투자 시 장비 발사 간격 15% 단축'
  };

  window.SignalBreakerTalentTech = {
    ACTIVE_TALENT_EFFECTS,
    TALENT_TREES,
    WEAPON_TECHS,
    SOCKET_GEMS,
    manager: new TalentTechManager()
  };
})();

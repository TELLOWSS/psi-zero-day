# NEW PSI 브랜딩 진행 기록

## 최신 기준선

- 사용자 직접 STAGE12 인계 대화 A/B '두 방향 승인, 검증 후 연결' 답변. 질문에 제시한 안전관리자 두 문장만 localization/UI 연결; 초안의 동료 응답·공통 시작·회고 추가 대사는 미연결. player/stage12/victory/통로정리>0 기존 근거 조건 유지. domain 사건/선택 검증, app 독립 `psi.survivors.handoff-dialogue.v1`에 최초 선택만 저장. skip은 저장 없음, 다시보기는 같은 선택 읽기만, 저장 실패 시 성공 표시 없음. 직업/능력치/보상/음성/기존 저장 변경 없음.
- 집중11/전체1877pass1skip/타입/prebuild/build 성공. 이후 키보드 초점 보완은 타입/최종 Vitebuild와 UI 회귀로 별도 검증. 실제 빌드 PC/폰세로/폰가로 x2선택의6경로: skip/실패/재시도/최초쓰기1회/기존storage불변/새로고침복구/44px/넘침·오류없음. `artifacts/handoff-dialogue/report.json`/6PNG, 폰세로 B 직접 확인. 저장된 STAGE12 fixture이며 자연 완료/실기기 증거 아님. Vercel 한도 보존을 위해 localcommit 후 push/운영은 보류.

- PR162 remote13404dabc05bf6d7828303cca312905f08e20e4c의 Linux verify-voice-lock 성공(모바일/전체회귀 포함). Vercel latest는 'Deployment rate limited — retry in 24 hours' 실패. 이전 preview 성공을 최신 성공으로 사용하지 않고 병합/운영 미반영 유지, 우회/유료업그레이드/반복배포 없음.
- 사용자 첫 시범 안전관리자 선택 및 생성된 STAGE12 CG 직접 '디자인·파일 승인, 검증 후 연결' 답변 기록. 승인 SHA `0129709a46a7381b68491eba8c3b453b82fc9ae2b750470184ba5f18544da72e` 원본1672x941 유지. local 후속은 실제 player/stage12/victory/rubbleCleared>0 handoff에서만 서사 삽화 표시, 새로운 성장 상태/선택/보상 없음. `PLAYER-STAGE12-HANDOFF-APPROVAL.json`은 디자인/파일 승인과 대사/사용권/실기기/운영을 구분한다.
- CG local 집중10/타입/최종CSS Vitebuild/전체1872pass1skip 성공. 실제 빌드9경로 이미지decode/원본비율/승리만표시/중단·활동0비표시/승인SHA/44px/저장불변/오류넘침0 재통과, 폰세로 직접 확인. `artifacts/character-reflection/report.json` 최신은 CG 포함local 증거이며 remote13404 제품 검증과 구분. 새로고침 자연STAGE01은 CG표시 조건을 충족하지 않는 이전 증거다. 후속 CG는 한도 대기로 아직push/운영 없음. 다음 대화2안은 `SURVIVORS-PLAYER-STAGE12-DIALOGUE-DRAFT-V1.md` 초안이며 임의 확정/운영 연결하지 않는다.

- 새 저장 실제 UI 봇 후속: 안전관리자 STAGE01 무이동/레벨업 첫 선택만으로 57.13992초 defeat, 돌진제동2/통로0/구역0/피해102. 엔진 read-only 단일 소유 파일 계측(상태/시간/피해/phase 주입 없음), 종료 handoff와 실제 값 일치, 새로고침 후 같은 인물 회고·중단 문구 복구/오류0. `artifacts/character-reflection-natural/report.json`/restored.png. 최초 chunk 이동으로 marker 탐색 실패, 다음 새로고침의 동일 소유 파일을 중복으로 오판하여 URI별 단일 소유 검증으로 수정/재통과. STAGE12 성장 선택·자연 완주·진로/실기기 증거로 확대하지 않는다.

- 2026-10-09 성장 시범 인물 사용자 직접 선택: 안전관리자(characterId player). STAGE 12 시범의 대표 인물 확정이며 대사/신규 CG/직업 조건 승인은 별도. 실제 aggregate 기록의 생산 경로와 추정 금지, 선택/재도전/저장 게이트는 `SURVIVORS-GROWTH-EVENT-CONTRACT-V1.md`로 연결.

- PR162 후속: 최근 인계 기록에서 해당 인물의 통로 정리/돌진 제동/통제 구역과 중단 사실만 읽는 회고 추가. 수치형 성격·직업·본편 성장 해금 및 새 저장/보상 없음. 집중9건/전체1,871통과·1제외/타입/prebuild/build 성공. 실제 빌드 3viewport x 승리/중단/활동0 저장fixture 9경로: 다른 인물 제외/44px/잘림·넘침·오류없음/전체 저장불변, 폰세로 직접 확인. `artifacts/character-reflection/report.json`/9PNG. 자연 성장·진로 해금·실기기·최종 아트 증거 아님.
- PR162 기존 fdbcda25 Linux CI는 모바일 설정 대기에서 실패. 시간70초 stress fixture가 열 수 있는 보급은 실제 완료 버튼으로 재개한 뒤 정지 renderer를 검사하도록 수정하고, 시작 버튼은 자산 준비 후 enabled 상태까지 대기. 실패 진단에 phase/disabled/supply 상태 추가. Windows 로컬은 처음 자산 준비 대기 실패, 후속 CDP 연결 종료로 전체 모바일 검사 미통과. 최신 Linux 재검증 전 운영 병합 금지; preview 성공을 전체 CI 성공으로 확대하지 않는다.

- 첫 인물·공정 기록 묶음 최종 전체 Vitest 회귀1,866건 통과·1건 제외(332파일 통과/1파일 제외), 타입·prebuild 및 최종 CSS 반영 Vite build 성공. 로컬 검증 완료이며 원격CI와 운영 적용은 아직 별개다.

- 사용자 인물 성장·스테이지 서사 실행 요청의 첫 묶음: 기존 `growth_v1` 완수 기록만 읽어 6명 x5장 역할 관점을 준비/결과의 '내가 지나온 현장'에 표시. 실제 완수/통제 수치, 캐릭터 분리·중복 기록 정규화 유지. 기록 없는 인물/legacy 전역 완수를 새 성장으로 추정하지 않는다. 진로/본편 단계/새 저장 키/수치/원화 불변. 신규 성장·50구역 서사 기획은 기존 본편3단계와 요원 기록을 연결하는 문서이며 전체 기능 완료가 아니다.
- 집중4건/타입/prebuild/build 통과. 첫 테스트는 없는 testing-library 의존성으로 실패하여 기존 react-dom/server 방식으로 수정/재통과. 실제 빌드 PC1440x900/폰390x844/844x390 저장fixture의2장 기록/44px/잘림·넘침·오류없음/저장불변 통과, 폰세로 직접 화면 확인. 첫 저장 비교는 진입 초기화와 겹쳐 실패했으며 UI 준비/800ms 이후 정렬된 전체 storage 비교로 재통과. `artifacts/character-chapters/report.json`/3PNG. 자연 플레이/진로해금/실기기/최종아트 승인 증거 아님. 원격CI/운영 반영은 별도 후속.

- 2026-10-09 재기준화: 제품 기준 `5444a9ec2aafe90b49bd1b82b9352f31912e1dec`. 별도 사용자 작업이 동기화한 배포 `dpl_HSoXnPa2HN3g4ekBBycsTsvH9VZZ`의 정확한 프로젝트/SHA/production READY/`psi-zero-day.vercel.app` 별칭을 이 작업에서 읽기 확인했다. 이 작업이 해당 제품을 배포했거나 전체 회귀를 재실행한 것으로 기록하지 않는다. 과거 PR153 운영 유지 및 PR154 한도 대기는 당시 이력이며 현재 운영 기준이 아니다.
- 현재 B3 소스 확인: premium renderer는 `ShieldPresentationTracker`를 호출하며 directional renderer는 authored/contact 원화를 준비하고 `authoredMotionWeights`를 사용한다. visual budget은 혼잡 오라·비행·문구 제한을 연결하고 body light는 flash 설정을 반영한다. 이전 'shield0이면 즉시 VFX 생략' 및 기존 walking 파일만 유지한다는 감사 문구는 과거 기준이며 현재 미구현 TODO로 반복하지 않는다.
- 별도 작업의 `SURVIVORS-GRAPHICS-UPGRADE-IMPLEMENTATION.md`는 접점 이동 약5.64~8.07 CSS 단위와 VISUAL PRODUCTION LOCK 미승인을 명시한다. 좌표 역투영 오차1e-6을 완전 접지로 표현하지 않는다. `survivors-graphics-animation-v1.json`은 implemented-candidates-director-visual-lock-pending이며 960 logical slots/836 unique crops는 960 독립 원화 제작이나 최종 승인이 아니다.
- 이번 묶음은 소스/문서 대조와 기록 갱신만 수행했다. 이전 원본97셀·강제24% light 진단을 새6명 원화의 품질 증거로 재사용하지 않는다. 다음은 현 운영 기준의 실제 흐름 검증이며 새 원화·청취·실기기 최종 승인과 사용권 질문은 별도로 남는다. 게임 규칙·저장·자산 바이트 변경 없음.

- 주인공 조명 분리 진단(제품 변경 아님): `tests/verify-player-light-contrast.mjs` 실제 빌드의 body-light 함수만 표시 계측/override하여 PC·폰세로·가로 x idle/walking 6조건에서 original/off/24% peak 비교18PNG 확보. paused gameTime 고정/오류·넘침없음. 변경 픽셀1345~1695개, 평균 RGB 차이29.93~30.99, 변경 픽셀 luma 약30~32 증가. 폰 walking off/peak 직접 확인: peak에서 작업복이 밝아짐. 모든 original strength는0이므로 자연 플레이에서 최대 조명이 실행됐다는 증거 또는 영상 희미함의 원인 확정이 아님. 국소 배경 대비율/자연 조명 분포/실기기/최종 시각 승인도 아님. `artifacts/player-light-contrast/report.json` 참조. 원본/게임 규칙/운영 표시 불변.
- 현재 작업 트리에는 이전4파일 외 material-feel/workface 및 엔진·UI·조명·음향 등의 추가 사용자/다른 작업 변경이 있음. 이를 보존하며 이번 진단 결과를 해당 미검증 변경의 검증으로 확대하지 않음. 제품 가독성 조정 전 현재 소유 작업·실제 활성 경로를 다시 확인해야 함.

- 주인공 희미함 원인 재조사(제품 수정 아님): `audit-player-source-alpha.mjs` 원본5파일/97셀 read-only 픽셀·SHA 기록. visible alpha>=32 기준 median 최소249~253, solid alpha>=192 비율 최소87.6~98.0%. 원본 전반 반투명 가설의 근거 없음; 원본알파를 임의 불투명화하지 않음. `artifacts/player-source-alpha/report.json`.
- 실제몸체 grounded draw 직전 계측 추가 자연 UI bot 재실행:3338몸체샘플 alpha .8~1, composite source-over, filter none, .8미만0. shield실제eventcycle/HUD부분·소진·복구 일치 재통과(261samples/258일치). main ctx 알파누수/brightness filter가 관측한 stage01 희미함 원인이라는 근거 없음. stage별weather code는02~05 ground-before-actor이며 이번stage01 실행에는 해당branch 없음. 따라서 '날씨 때문에 희미함'을 확정하지 않고 원화색/밝은바닥/heroLight·실제국소대비를 다음조사대상으로 좁힘. 자연봇/seededloadout이며 모든맵·실기기원인 해결 아님. 기존visual선택/assetbytes/palette/규칙 변경 없음.

- 보호 장비 자연발동 후속 `verify-shield-natural-play.mjs`: shock_mantle 소유/장착 저장fixture, actual build engine는 read-only 계측, 이동/레벨업선택 UI입력만. 실제 충돌 흡수7.7s/shield33, 소진30.7167s/0, recharge48.7167s/45(실제18초 cadence), 마지막49.1333s/HP117/보호막45/45. 최초 연출 관측 직후종료는 HUD갱신한주기전이라 보강: partial/depleted/final HUD 각각일치/234samples중233일치/오류넘침0. `artifacts/shield-natural-play/report.json`/native natural-cycle.webm. 함수 직접호출·phase변경·시간주입 없음. 새저장자연구매·사람/실기기/과밀성능·모바일표시가시성/최종청취·아트 승인 아님. 날씨/무적 합성의 몸체대비는 기존표현 미해결로 유지.
- 위 실제 플레이 후보영상을 사용자에게 보여주고 보호 장비 시간축 범위의 운영 적용 판단을 요청. 답변 전 승인기록/운영적용을 자동으로 하지 않음. 후보/local만, Vercel154배포한도 실패 유지.

- 보호 장비 실제 renderer 감쇠 후속: 기존27경로에 중간/종료54지점 추가 통과. actual tick함수와gameTime으로 흡수/소진 .225→.46초, 재충전 .3→.61초; 실제 VFX 호출alpha·phase 일치, 종료 시 소진 draw없음/잔량이 있으면42x58 idle, reduced 정적표시 유지. 폰세로 소진 중간/종료 직접확인. report27rows/54timeline, PNG33장. 정지 fixture의 HUD45/45는 의도적으로 React 미갱신이므로 실제 HUD/자연전투 증거가 아님. 제품 변경 없음, 다음 실제 충돌/UI tick에서 상태표시와 연출 인과 검증 및 후보 시각판단. Vercel한도 때문에 원격/운영 미반영 유지.

- 보호 장비 실제 빌드 fixture `verify-shield-combat.mjs` 3viewport x normal/busy/reduced x 흡수/소진/재충전27경로 통과. 실제 compiled absorb/tick 호출로45→15(overflow0)→0(overflow15)→45 생성, 실제 cell3 draw 호출/atlas 준비/phase·alpha 일치/paused gameTime와연속canvas hash불변/nonblank/오류·넘침없음. `artifacts/shield-combat/report.json`/27PNG. 폰세로 소진·폰가로 혼잡재충전 직접 확인: 몸체·노란예고 구분. 정지된 엔진 직접호출 fixture이므로 React HUD는 이전45/45로 남음; HUD 동기화/자연충돌/실기기/최종아트 검증으로 확대 금지.
- 전체 첫 회귀1767pass/2fail/1skip은 이전 feedback 수동주입/즉시소진숨김 기대의 restraint2건. 실제absorb함수로 갱신, single shield owner/상태불변/감쇠끝 draw없음 조건 유지하여 집중10 및 전체1769pass1skip 재통과. 제품code는 전회eee17244 그대로. 실제 감쇠중간·끝 renderer 타임라인/자연발동과 최종시각검수는 후속. 배포한도 우회 없이 로컬 유지.

- Vercel PR154 preview가 `Deployment rate limited - retry in 24 hours`로 실패. 운영153은 유지하며 한도 우회/유료 업그레이드/강제 운영배포를 하지 않음. 최신154 CI는 별도 확인 필요.
- B3 보호 장비 후보: `ShieldPresentationTracker`가 실제 shield 감소/증가를 read-only로 관측. 흡수 .45초/소진 .45초/재충전 .6초로 기존 VFX cell3만 사용, 소진 직후0charge에서 기존 이펙트가 즉시 사라지는 경로 보완. 초기 관측·loadout replacement는 발동을 만들지 않음, gameTime pause 고정/혼잡 gain 제한/reduced 정적 잔량만 유지. 실제 absorb/tick/apply 함수 회귀 포함11건/타입/Vitebuild 통과. 새 원화·피해·capacity·cooldown·save 불변. branch `codex/brand-shield-events-20261008` 로컬 후보; 화면/픽셀/전체회귀/Director 검수 미완료, 운영/원격 미반영. 154문서 이력을 포함하지만 feature간 병합은 하지 않음.

- PR153 latest1933d507 검사/preview 성공 후 main `f15dfcbe577861071b74f42ea9c787367868c010` 병합, `dpl_83QJjhhSmPA3nPHY83bFndtj6Zqj` READY/정확SHA/별칭 확인. 공개 운영 원본26 decode/START_A/상단pause취소/정지중새start없음/resumeSTART재생없음 PC·폰세로·가로3경로 통과. 실제 UI/엔진주입없음, 자연과밀·실청취·실기기와 구분.
- B3 실제 경로 재조사: passing frames8/9가 이미 연결되어 있어 이전 '중간 원화 없음' TODO를 현재 사실로 반복하지 않음. 장비별 spring은 독립 inertia이나 공통 pose.action을 사용하며 실제 발동 choreography와 다름. shield feedback은 흡수/복구가 같은 field를 쓰고 shield0이면 VFX branch가 생략됨. 다음 묶음은 실제 엔진 흡수·소진·재충전/장비교체 시간축 캡처 후 승인 원화 범위 표현 개선. `NEW-PSI-B3-RUNTIME-AUDIT-20261008.md`에 코드근거와 미확정 승인 분리. 제품/원본/승인metadata 변경 없음.

- B3 브라우저 후속 `tests/verify-voice-budget.mjs`: 실제 Edge WebAudio/원본 CART_WARNING 디코딩·재생 후 명시적인 무음 loop 효과24개로 shared budget 포화. PC/폰세로/폰가로3경로에서 경고 source 유지, 효과 source 교체와24한도, 낮은/동순위 대사 거부, mute 취소, 새 START 재생 및 silence 취소/오류없음 통과. `artifacts/voice-budget/report.json`. 독립 audio class dev-module 검증이며 자연 전투/UI pause/실기기/실청취 승인 아님. 검증 전용5182 서버 종료, 기존5181 유지.

- PR152 최신 `fbb7c54b05996706e0e0c0f6fd4d68bb06dde374` 검사4개/preview 성공 후 main `ed06b3f0d7c32ee7733fafc0365beb168cf51658` 병합. 운영 `dpl_6zkTBvc93vQHHA6CeaF5r9N68TBD` READY/정확 SHA/별칭 확인. 공개 운영 mobile16/slot8(밝음·어두움 및 승인 SVG SHA)/공식제목4 통과. 아래 후보 제작 당시 비연결·미승인은 역사적 기록이며 현재 BR-LOGO-02 승인 파일은 운영 연결 완료.
- B3 후속: 공유24음원 슬롯에서 같은 우선순위 UI 효과가 진행 중인 경고 대사를 제거하는 경로를 확인. 슬롯 교체 대상에서 현재 speech owner만 제외하며 실제 음성 우선순위/중단·음소거 경로와 파일·볼륨·게임 규칙은 유지. 포화 회귀 포함12건/타입/Vite 빌드 통과. 최초 음소거 mock의 stop 1회 기대는 기존 silence의 이중 stop 호출과 달라 실패하여 취소 여부로 검증 수정. 실제 청취·자연 과밀·실기기 증거가 아니며 운영 후속 검증 전.

- 2026-10-08 사용자 직접 `디자인·파일 승인, 검증 후 운영 적용` 답변으로 BR-LOGO-02 워드마크/심벌 파일의 적용 범위를 승인. `BR-LOGO-02-APPROVAL.json`의4개 정확한 SVG/SHA만 public/GameHub/index에 연결하며 실제 빌드/원격CI/운영검증을 수행한다. 상표·실기기·다른 원화/음성 승인은 별도. 생성 당시 미승인 JSON/metadata는 승인 전 이력이며 최신 승인 기록이 대체한다. R1 HOLD 불변.
- B2 별도 BR-LOGO-02: 열린 직각 경계/분리 신호 막대의 편집 SVG, 자체 포함 기존 OFL 폰트 기본/낮은 가로 워드마크와 독립 심벌 ink/chalk SVG·투명 PNG 납품 후보. 실제640/320/240 및48/24px x 밝음/어두움16표시 픽셀/투명/잘림 검사와 직접 캡처 확인. 실제 빌드4viewport 브라우저 한정 대입/8PNG: 처음 폰세로 인물/가로 CTA 실패 후, 세로 안전폭/가로 전용 lockup 보완해 공식명·경계·CTA·인물 요소 비중첩/오류·넘침 없음. 운영 비연결, Director 파일 승인·상표 검수 미확정. R1 HOLD를 승인으로 바꾸지 않는다.
- PR152 첫86bf4b70 voice CI: 타입/빌드/폰트 성공 후 CDP9222 준비10초 실패. 원인 단정 없이 시작만45초/종료 즉시 실패/2초 요청 제한/실패stderr를 보강하며 최신 Linux 전체 실행 성공을 별도로 확인한다.

- PR151 운영 완료: `e0f34ed01039d588f69be170b32be3585f9b012e`, `dpl_G1zveJZ17vKcEXqXboxhJ9QZkWpz` production READY/정확 project SHA/공개 별칭 확인. 최종d15317b9 검사4개/preview 성공 후 병합. 공개 운영 모바일 위계16경로,9슬롯4viewport,공식제목4viewport 재통과. 자연전투/실기기/새 원화 승인은 별도. 아래 후보 문구는 적용 전 이력이다.
- B2 워드마크 R1 파일 검토: 투명 출력2번의 경계 질감을 채택하지 않고 단색 원본을 docs에 보존. 열린 삼각형의 재생 기호 유사성, 흰 바탕 래스터/벡터·투명·독립아이콘 미납품 때문에 `HOLD_NOT_PRODUCTION_ELIGIBLE`. 운영 텍스트 로고/favicon 불변. 작은 크기/주변 배경 캡처와 파일 측정을 별도로 수행하며 기술적 로딩을 최종 승인으로 계산하지 않는다.

- PR150 문서/QA 운영 동기화 완료: `f7ec0ff0a5f3736aa21a4f651537794ed47995d6`, `dpl_3mX9nrkeD1o2wPug8RC3cD2VCxFP` production READY/공개 별칭 확인. 최종748e54c3 검사3개/preview 성공 후 병합. 새 계약 단위 검사5건 및 Linux 전체/타입/빌드/실제8슬롯 감사 성공. R1 후보는 docs에만 보존하며 runtime 교체 없음; 기존 타이틀 폰가로 얼굴 잘림/폰세로 UI 가림으로 적용 HOLD.
- B1 모바일 위계 후속 후보: 기존 승인 player-map.webp를 제목 그룹 안에만 재사용하여 폰세로 대표 인물 노출, 실제 플레이 행동을 read-only 상태 요약보다 앞에 배치. 준비 중 프리뷰 기능/PC4인/낮은 폰가로 간소화 유지. 새 자산/게임규칙/저장/권리·최종 승인 변경 없음. 전체1,762건 통과·1건 제외, 집중22/타입/prebuild/build 통과. 최종 작은 CSS 간격 및9번째 재사용 슬롯 보완 뒤 실제 빌드 감사 재통과; 8viewport 일반/움직임 감소16경로 alpha bounds/CTA/모드 잠금 검증을 보강한다.
- 첫 모바일 시안에서 구 CSS의 display:none!important와 고정 화면 좌표의 큰 폰 버튼 겹침을 발견했다. 인물 원화를 제목 그룹 내부 별도 표시 슬롯으로 옮기고 실제 alpha32 경계를 계측하여 가림을 수정한다. 낮은 폰가로의 숨겨진 상태 요약은 DOM 순서와 visible 여부를 구분해 검사한다. 첫 실패를 통과로 계산하지 않는다.
- 최종 로컬 모바일 위계16경로 모두 통과, 390/430 폰세로 최신 PNG 직접 확인. 9슬롯4viewport 감사와 최종 집중22/타입/Vite build 통과. 운영 반영은 최신 원격 검사 성공 이후 별도로 확인한다.

- PR149 운영 완료: `27667547431e29c624563a0f4a0aca2d0888fbd2`, `dpl_GcFpyJX4sANFLDSbER8kZtQ6EBJF` production READY/공개 별칭 확인. 최종2c7c357a 검사3개/preview 성공 후 병합. 공개 LZ3viewport에서 중복 바닥 문구0/HUD 방향·범위 밖15초 유지·내부14.67/14.68/14.67 감소/오류없음 통과. 아래 영상 후속 후보는 적용 전 이력이다.
- B2 독립 후속: `NEW-PSI-BRAND-PRODUCTION-SLOTS-20261008.md`와 QA 전용 계약 JSON에 실제 타이틀8개 이미지 슬롯/크롭/4인 identity·폰 hidden/텍스트 로고·빈 favicon 상태를 기록. 공개4viewport 연결/파일 크기/디코딩/object-fit 일치, 집중4건/타입 통과. runtime/기존 자산/권리·최종 승인 상태를 바꾸지 않는다.
- 세로 대표 원화 최종 후보 R1을 기존 승인 주인공/현장 파일 참조로 built-in image_gen 제작, 원본/프롬프트/hash/승인 대기 기록 보존. `docs/branding/candidates`에만 저장하고 public/runtime에는 연결하지 않는다. 별도 브라우저 후보 대입4viewport 캡처는 크롭 검토이며 운영 배포 또는 시각 승인 증거가 아니다.

- PR148 운영 완료: `ca58e14a028adafcf9d03da7db92664132033e73`, `dpl_7vwWR7s2cP3gGd8uKFq3XFrikDuT` production READY/공개 별칭 확인. 최종fcfe149f 검사3개/preview 성공 후 병합. 동봉 폰트 Linux 검증과 상점4viewport CI 성공. 공개 운영4viewport에서16종 설명·전체 효과 비교·0.35 정밀값·내구도/44px/적용 접근 통과. 아래148 후보 및 외부 설치 대기 기록은 당시 이력이다.
- 최신 사용자 영상 `KakaoTalk_20261008_163726443.mp4` 후속: 화면 밖으로 잘리거나 전투 동선을 가리는 중복 LZ 바닥 문구 제거. HUD 방향·남은 시간·구역 밖 정지 조건과 착륙 표식 유지. 집중15건/prebuild/타입/build 및 실제 빌드3viewport LZ fixture 통과. 운영 반영 전 후보이며 `MOBILE-LZ-VIDEO-REVIEW-20261008.md`에 관찰/검증 한계를 기록한다.

- 착용 비교 후속 검증 보강: 최대 체력 문구를 공유하던 HUD 접근성 이름 회귀를 currentHp/fittingHp 분리로 수정, 집중34건·타입/Vite build 재통과. 최신fffdccda CI의 전체/빌드는 성공했으나 survivors-art가 외부 fonts-noto-cjk 61.2MB 다운로드에서 대기 후 취소됐다. 동일 작업이 종료된 로그 확인 후 기존 성공한 음성 QA의 동봉 Black Han Sans/OFL 설치·fc-query family 및 실제 U+D55C 파일 매칭 검증을 재사용한다. 상점 비교4viewport 검증/증거 업로드를 해당 CI에 추가하며 Linux 성공 확인 전 운영 완료로 계산하지 않는다.

- PR147 운영 완료: `058944ee89be115525ad7b86feae619139c7476c`, `dpl_AhYbvdZKjnDY5ayQgc8GrqXFQWq1` production READY/공개 별칭 확인. 최신9762b957 검사2개/preview 성공 후 병합(문구/검증 전용으로 survivors-art 경로 미실행). 공개 상점4viewport 설명16종/내구도/44px/fitting 접근 통과. 아래146 및147 후보 기록은 당시 이력이다.
- 후속 B1 착용 비교 후보: 기존5개 능력치 외 정밀 확률·회복·보호막 용량/복구 주기·카트/가스 감속·샤우팅 충전·최초 장착 통제선/보급 지급 효과를 표시. 관련 없는 0/0 추가 행은 숨기고 현재 장착 효과를 제거하는 비교는 남긴다. 현재 남은 보호막/보급 수량이 아닌 장비 효과·지급 계약을 표시하며 게임 규칙/가격/저장/원화를 바꾸지 않는다.
- 소수1자리 비교에서0.35가0.3으로 표시되는 테스트 실패를 확인하여 값/차이를 최대 소수2자리로 보완. 집중32건/전체1,756건 통과·1건 제외/타입/prebuild/build 성공. 실제6종 조합 UI fixture4viewport에서 보호막60/주기18/회복0.8/충전0.35/보급2, 항목명·수치 비중첩/미리보기 잔액1260·실장착2 유지/fitting 적용 접근 확인. 폰세로 비교 캡처 직접 확인. `artifacts/store-reference-layout`은 자연 구매·실기기·최종 아트 승인이 아니다. 후속CI 및 운영 반영 완료 여부는 이후 기록한다.

- PR146 운영 완료: `8b4c2d0a41e30b06780f27e81fe03c80c7e0d2bf`, `dpl_CNAdzq3qzkQC42JwwqkPUrxJJXUU` production READY/공개 별칭 확인. 최신fa663cb 검사3개/preview 성공 후 병합. 공개 일반18·긴 문구18 paused fixture에서 원화6개 준비, 실제3종 문구 표시, HUD/보수적 주인공 보호 영역/수평·수직 경계와 마지막3문구 간 비중첩 확인. 자연 과밀·실기기·위험 예고 전체 보호의 근거가 아니다.
- 후속 B0/B1 효과 설명 감사: 장비 대응 효과는 기존 배율에 더하는 값이므로 +15/+25/+38%를 %p로 명확히 한다. 통제선/보급 호출의 1회 지급은 시작 시뿐 아니라 작전 도중 최초 장착에도 적용되므로 해당 조건을 명시한다. 저장 실패 문구의 포인트 명칭은 PSI로 통일. 엔진·저장·가격·최종 자산은 변경하지 않는다.
- 16종 개별 장비의 기본 능력치와 표시 수치를 대조하고, 통제선/보급 최초 장착 및 재장착 중복 지급 방지를 확인하는 집중19건 통과. 최초 비교의 기본 캐릭터 불일치로16건 실패한 테스트를 같은 캐릭터 기준으로 수정/재통과했으며 제품 버그로 계산하지 않는다.
- 전체1,748건 통과·1건 제외, 타입/prebuild/build 성공. 상점4viewport에서16종 설명 일치/가로 경계/다음 문장 비중첩, 사진 장착 조합의 내구도/버튼44px 및 fitting 적용 접근 통과. 폰세로 긴 보급 설명 캡처 직접 확인. `artifacts/store-reference-layout/report.json`/12PNG는 저장 fixture이며 자연 구매·실기기 증거가 아니다. 후속 원격 검사와 운영 반영은 아직 미완료다.

- PR145 운영 완료: `0c040d667d53d993799b0d6d332001a11d478e1e`, `dpl_Gchojnevj3cwwhv51HmAyXRAgaCf` production READY/공개 별칭 확인. 최신76d283c 검사3개/preview 성공 후 병합. 공개 타이틀4viewport·일반18·긴 문구18경로에서 필수 원화6개 준비와 실제 가로 draw bounds 통과. 아래 PR144 기준은 이전 시점이다.
- 다음 B0/B1 후보는 전투 문구의 측정된 글자 높이·폭에 따라 주인공 안전모/몸체/손의 보수적 보호 영역과 이전 문구를 피해 가장 가까운 위/아래 공간을 선택한다. 카메라 수직 경계 안에 배치하며 공간 부족 시 표시만 생략한다. 원본 이벤트·피해·보상·저장·원화는 변경하지 않는다. 자연 과밀 전투·실기기·모든 위험 예고 보호의 완료 근거가 아니다.

- PR139~144 운영 반영 완료. 현재 운영 커밋 `b653e1a2f54aa7149b0935eae8e2cd95941c5ba9`, 배포 `dpl_7LEnmvVJ7W2C5GF7jLj8CCkat2Vd` production READY/공개 별칭 확인. 아래의 과거 후보·대기 문구는 시점별 이력이다.
- PR144 공개 운영18경로는 명시적 paused projectile/feedback fixture다. 초기 캡처의 원화 준비를 단언할 수 없어 별도 지연2경로에서 원화 주인공/cart를 확인했다. 자연 전투·실기기·최종 아트 승인은 별개다.
- 후속 B0/B1 묶음: 호송 완료 문구는 실제 LZ 사수 완료에 한정(전원 인계라는 미계측 주장 제거). 초기 HTML/부팅/실패 화면의 작품명을 기존 공식 상수와 통일. 전투 문구 가로 경계 보강과 QA 원화 준비·실제 draw bounds 계측. 새 기획·규칙·저장·최종 자산 승인 변경 없음.
- 로컬 집중10/타입/prebuild/build 및 전체1,726건 통과·1건 제외(최종 HTML/부팅 문구 조정 전 전체 회귀). 조정 후 타입/Vite build와4viewport 타이틀 통과. 긴 문구18경로에서 필수 원화6개 디코딩/실제 그리기 가로 경계/오류·넘침 통과. 자연 사건·성능·몸체 가림 해결 증거가 아니다.
- 긴 문구가 폭 안에 들어오더라도 몸체를 가릴 수 있으며 수직 경계·문구 간 모든 교차는 후속이다. 작은 캡처에서 확인하지 않은 사항을 최종 브랜드 품질로 계산하지 않는다.

## 사용자 승인

- 2026-10-08: 사용자가 '브랜딩한 기획서 데로 순차적으로 계속적인 자동 진행 실시'를 요청했다.
- 브랜드 전략·경험 명세·적용 계획 v0.1의 방향 및 단계별 진행을 승인한 것으로 기록한다.
- 기존 작품명·대표 인물·게임 규칙·저장 데이터는 유지한다.
- 새 로고·원화·음원의 최종 파일 승인과 화면·청취 검수는 별개다. 이번 진행 요청만으로 최종 자산 승인이나 제작 완료로 처리하지 않는다.

## 현재 단계

| 단계 | 상태 | 다음 작업 |
|---|---|---|
| B0 사실·표현 기준선 | 기술 기준선 확보, 승인 항목 남음 | 수정 후 자연 UI 봇 승리630PSI·다음 준비/복구·대응 중단·보급 재개 확보. 음악/SFX V1/배경 공개 배포권 확인 답변과 실기기/최종 검수 남음 |
| B1 이름·용어·정보 위계 | 검증 묶음 운영 적용, 전체 검수 진행 중 | 공식 제목/한국어 부제·모드 잠금·장비실/실제 효과/전체 비교·대응 중단 적용. 최신 영상 LZ 중복 문구 후보 및 화면별 Director 확인 남음 |
| B2 공식 브랜드 자산 | BR-LOGO-02 디자인·파일 승인/연결 검증 | 기존9개 이미지 슬롯 유지. 정확한 승인 워드마크·심벌4파일 연결과 CI/운영 검증 진행. 세로 원화R1 HOLD, 다른 편집기/상표·실기기 검수 별도 |
| B3 주인공·장비·소리 | 대기 | 실제 이벤트·피벗·소켓에 맞춘 연기와 검증 |
| B4 완성형 한 흐름 | 대기 | 실제 클리어·정비·다음 준비 및 저장 유지 검증 |
| B5 본편·외부 접점 | 대기 | 기존 Episode 01 제작 게이트 충족 후 진행 |

### 증거와 남은 게이트

- 자연 입력 봇: `artifacts/natural-progression/brand-credit-settled/report.json`의 승리/630PSI 정산, `artifacts/earned-progress/report.json`의 그 저장 복구, `artifacts/natural-defeat/report.json`의 대응 중단, `artifacts/natural-progression/supply-resume/report.json`의 보급 재개. 사람/실기기 검수로 확대하지 않는다. 수정 전960PSI 관측은 올바른 정산 증거가 아니다.
- 명시적 fixture: 마지막 구역/지도 복귀·수리/잔액·장비 비교·EMP/오라/발사체/긴 문구의 화면·계측 기록. 자연 과밀 전투나 긴 플레이 성능 증거와 구분한다.
- 사용권: 네 음성 버전과 타격 효과음은 사용자 확인 기록이 있다. Score V2 9곡, SFX V1 운영8개, Episode 01 배경8개의 공개 배포권 질문은 답변 대기다. 파일 존재/hash 일치를 약관·최종 청취 승인으로 계산하지 않는다.
- B2는 실제 적용 슬롯·크롭/승인 계약 조사가 독립 실행 가능하다. 새 후보의 제작/교체·파일 승인과 B3 최종 연기/청취·B4 실기기·B5 외부 소개 승인은 별도다. 기획의 전체 완료를 선언하지 않는다.

## 실행 규칙

- 한 번에 가장 앞선 실행 가능한 작업 묶음을 처리하고, 실제 수행한 검사와 다음 항목을 기록한다.
- 사용자 변경을 보존한다. 승인이나 실제 기기 검수가 필요한 항목은 명확히 남기고 독립 작업만 이어간다.
- 기능 검사, fixture, 실제 플레이, 시각·청각 승인 결과를 구분한다.
- 검증된 승인 범위만 GitHub·Vercel에 동기화하고 운영 커밋과 배포 상태를 확인한다.
- 모든 단계 종료 또는 최종 승인 대기 시 임의의 신규 범위를 추가하지 않는다.

## 실행 기록

- 2026-10-08 첫 묶음: `NEW-PSI-BRAND-BASELINE-20261008.md`에 타이틀·모드·장비실·잔액·수리·피해·음성·다음 구역의 소스/표시 매핑 작성.
- 집중 자동 테스트 9개 파일 137건 통과. 자연 클리어, 운영 화면 및 물리 기기 검수는 미완료로 유지.
- 다음 묶음: 현재 버전 화면 기록과 실제 결과→정비→다음 준비 검증. B0 전체 완료 전 B1 전체 완료로 처리하지 않음.

### 두 번째 실행 묶음

- 장비실 제목을 `PSI 장비실`로, 미사용 장비 결과 문구를 `구매 장비`로 정리. 저장 키·아이템 ID·장비 규칙은 변경하지 않음.
- 브랜드 문구 회귀 테스트 2건 추가, 기존 dialog 접근성 이름 테스트 갱신.
- 전체 회귀 1,700건 통과·1건 제외, 타입 검사 및 전체 prebuild/build 통과.
- PC 1440x900, 폰 세로 390x844, 폰 가로 844x390에서 실제 UI 수리·잔액 차감·소유권·새로고침 저장 유지 검사 통과. 명시적 저장 fixture 사용, 자연 획득/클리어 증거 아님.
- 동일 3개 화면에서 stage_14 저장 fixture로 진입·시작·일시정지·메인 복귀·재진입 지도 유지 통과. 가로 넘침 및 런타임 오류 없음.
- 기준 화면과 상세 JSON은 `artifacts/store-maintenance`, `artifacts/stage-resume`에 기록. 실제 휴대폰/태블릿 검수와 자연 승리 흐름은 여전히 별도 증거 필요.
- 자연 입력 검증 스크립트의 오래된 모드/시작 버튼 이름과 고정 URL을 현재 UI·환경 URL에 맞춤. 엔진 상태 변경 또는 승리 강제 기능을 추가하지 않음.

### 표현과 검증 추가 개선

- 입구·전투 중 버튼도 `PSI 장비실`로 통일하고 관련 UI 테스트/검증 스크립트의 접근성 이름을 함께 갱신.
- 낮은 내구도 안내를 `사용 후 클리어하면 파손 · 수리 권장`으로 수정. 단순 사용 또는 실패만으로 마모된다는 오해를 제거.
- 전체 회귀 재실행 1,700건 통과·1건 제외, prebuild/build 및 타입 검사 통과.
- 태블릿 1024x768을 포함한 4개 viewport의 수리·저장 유지와 미완료 맵 복귀 검사 통과. 물리 기기 검증 아님.
- 90초 새 저장 UI 입력 봇 검사: 오류·요청 실패·가로 넘침 없음, 레벨 6까지 진행. 시간 종료로 승리/실패에 도달하지 않았으며, 클리어 증거로 계산하지 않음.
- GitHub PR #135에 검증된 변경만 동기화. 운영 배포 확인은 후속 실행 기록으로 구분.

### 실제 입력 플레이 증거

- 새 저장에서 UI 입력 봇으로 게임 시간 약 277초 후 stage_01 승리. 실제 보스 통제 확인, 강제 HP/시간/승리 변경 없음.
- 레벨 11, 위험 통제 362건, 진화 hunter_swarm 도달. 브라우저 오류·요청 실패·가로 넘침 없음.
- 저장에 stage_02 해금 및 다음 준비 구역, 지갑 960 PSI, stage_01 별 기록과 성장 기록 반영 확인. 결과의 세션 획득 630 PSI와 최종 지갑 960 PSI는 구분.
- 증거: `artifacts/natural-progression/brand-b0-extended/report.json`, `outcome.png`. 자동 입력 플레이이며 인간의 재미·난이도 승인이나 실제 휴대폰 성능 검수는 아님.
- 미완료 stage_14 / 클리어 stage_14 저장 fixture를 4개 viewport에서 비교: 각각 stage_14 / stage_15 준비 및 시작→메인→재진입 유지 8개 경우 통과.
- 실제 승리에서 내보낸 저장 기록의 새 브라우저 복구 검증을 별도 스크립트에 추가. 원래 플레이 세션의 연속 입력 증거와 혼동하지 않도록 범위를 보고서에 명시.
- 복구 검증 결과: 4개 viewport 모두 stage_02 준비, 장비실 960 PSI 표시 및 새로고침 후 지갑·지도 유지 통과.

### 정산 오류 발견 및 수정

- 위 960 PSI는 수정 전 실제 관측값이다. 추가 소스 추적에서 웨이브 보급이 지갑을 세션 누적 수입으로 덮어쓰고, 종료 시 그 값을 다시 더하는 오류를 확인했다. 이 관측을 올바른 보상 계산 증거로 사용하지 않는다.
- 보급은 기존 지갑을 보존하여 지급하고, 실제 저장에 성공한 선지급액만 세션별로 추적. 종료 시 도메인의 `settlePatrolCredits`가 미지급 세션 수입만 더한다.
- 보급 저장 실패 시 선지급으로 표시하지 않아 종료 정산에서 해당 수입을 잃지 않도록 한다. 기존 저장 데이터·소유권·장비 마모 규칙은 유지.
- 도메인 회귀 5건과 UI 구매/정산 회귀 추가: 10,000 PSI 지갑→보급 120→구매 5,200→보급 180→추가 수입 50→최종 5,150 PSI. 반복 프레임은 보급·정산을 중복 지급하지 않음.
- 수정 후 prebuild/build·타입 검사 통과, 전체 회귀 1,705건 통과·1건 제외. 두 차례 보급을 포함한 UI 정산 회귀 재실행 통과. 실제 입력 플레이는 재검증 중이며 수정 전 플레이 증거와 구분한다.

### 수정 후 실제 플레이 검증 완료

- 검증 봇이 보스 통제 후 실제 인계 구역으로 이동하도록 개선. 이동 키 입력만 사용하며 게임 규칙·엔진 상태를 변경하지 않음.
- 새 저장의 UI 입력으로 약 150초 후 실제 승리, 보스 통제·인계 완료 및 stage_02 해금·준비 저장 확인.
- 세션 획득 630 PSI = 최종 지갑 630 PSI. 중복 보급 정산 없음, `walletMatches: true`, 브라우저 오류·요청 실패·가로 넘침 없음.
- 증거: `artifacts/natural-progression/brand-credit-settled/report.json`, `outcome.png`.
- 이 실제 승리의 저장을 새 브라우저에 복구해 4개 viewport에서 장비실 630 PSI, stage_02 준비 및 새로고침 유지 확인. `artifacts/earned-progress/report.json` 참조.
- B0의 자연 승리·다음 준비 증거는 확보했으나, 저장 실패/패배/마지막 구역/실제 기기/자산 사용권 목록 및 Director 검수는 아직 독립 항목으로 남음. B0 전체 완료와 최종 프리미엄 완성을 선언하지 않음.

### 다음 실행: 운영 반영과 실패 경로

- PR #135 최신 head `74698dd28cdbc10b559dd70e0cfabe4d069ceaba`의 GitHub 검사 3개 및 Vercel preview 통과 확인 후 병합.
- 병합 커밋 `bd8aa3f497262f4143d23e8b5c43eff0d7a8200c`. 운영 배포 상태와 핵심 UI 검증은 별도로 확인한다.
- 저장 실패 주입 UI 회귀 2건 추가: 첫 보급의 지갑 쓰기 실패→두 번째 보급 성공→승리/패배 종료 정산. 10,000 + 세션 350 = 10,350 PSI, 중복 지급·원래 잔액 손실 없음. 승리는 장비 85, 패배는 100 내구도 유지.
- 마지막 구역/복귀 로직 포함 집중 47건 통과. 저장 실패 주입 및 결과 설정은 테스트 fixture이며 자연 플레이와 구분한다.
- 새 저장의 실제 무입력 플레이에서 패배, 18 PSI 저장, 같은 구역 재준비 및 새로고침 유지 확인. 오류·가로 넘침 없음. 증거는 `artifacts/natural-defeat/report.json`.
- 관측한 패배 화면은 HP 0에서 현장 사고를 단정했다. 승인된 브랜드 경험 명세의 사실 중심 톤에 맞춰 `대응 중단` 및 `방호 한계에 도달해 이번 작전을 중단했습니다.`로 변경. localization으로 이동하며 게임 규칙·사고 기록을 바꾸지 않음.
- 후속 브랜치 `codex/brand-result-trust-20261008`는 위 테스트/문구만 포함한다. 기존 사용자 변경과 PR #135에 포함하지 않은 자산은 보존.
- 후속 전체 회귀 1,707건 통과·1건 제외, 타입 검사 및 prebuild/build 통과. 새 문구의 실제 패배에서 12 PSI 획득·저장과 재준비·새로고침 유지도 확인. 첫 실제 패배 검사 18 PSI와 다른 별도 실행이며 랜덤 플레이 수입을 동일하다고 주장하지 않음.
- PR #135 운영 배포 `dpl_3vsrp4ZXV6vSLZaUafZVDi4Pehjc` READY, 운영 별칭 `psi-zero-day.vercel.app`과 커밋 `bd8aa3f497262f4143d23e8b5c43eff0d7a8200c` 확인.
- 운영 4개 viewport에서 저장 fixture 기반 수리·잔액·소유권·새로고침 복구 통과. 운영 3개 viewport에서 원화 로딩·비어 있지 않은 캔버스·이동·일시정지 안정화·재개 통과.
- 첫 운영 검사에서 PC 일시정지 직후 픽셀 변동으로 실패. 원인을 확정하지 않고 검증 스크립트를 최대 2초 추가 샘플링 및 연속 2회 동일 해시 확인으로 보완했다. 계속 변하면 실패하며 모든 샘플 해시를 기록한다. 후속 검사에서 안정화와 재개를 확인했으나 즉시 정지/실기기 성능을 확대 주장하지 않음.
- 운영 증거: `artifacts/store-maintenance/report.json`, `artifacts/brand-production-release/report.json`. '대응 중단'은 후속 변경이므로 PR #135 운영에 이미 반영됐다고 표시하지 않는다.

### B1 타이틀의 브랜드 약속

- PR #136 검사와 운영 동기화는 별도 선행 작업으로 유지. 타이틀 후속은 `codex/brand-title-copy-20261008`에서 분리.
- 보조 문구의 `FIELD DEFENSE`를 localization의 `오늘도 무사히 · 위험을 읽고 현장을 지킨다`로 변경. 공식 로고 접근성 이름은 기존 `GAME_TITLE`인 `NEW PSI : ZERO DAY`를 참조.
- 기존 NEW PSI kicker, 슬로건, 원화·로고·모드 잠금·배치 유지. 본편/디펜스가 공개됐다는 새 약속이나 최종 아트 제작 완료를 추가하지 않음.
- 전체 회귀 1,708건 통과·1건 제외. 기존 타이틀 계층 검사에서 바뀐 공식 접근성 이름의 기대값만 갱신.
- 4개 viewport에서 공식 제목·보조 문구·넘침·준비 중 디펜스 프리뷰 검증 통과. PC/폰 세로/태블릿은 문구 표시, 낮은 모바일 가로는 기존 규칙에 따라 숨김 유지.
- 폰트 준비와 진입 애니메이션이 끝난 실제 화면을 확인. 증거: `artifacts/brand-title/report.json`, viewport별 PNG.
- PR #136 이후에 후속 PR을 main으로 적용하고 최신 검사 및 운영 확인을 별도로 수행한다. 로컬 검증을 운영 반영 완료로 표현하지 않음.

### PR #136 운영 확인 및 타이틀 반영 준비

- PR #136 검사 3개와 Vercel preview 성공 후 main 병합. 운영 커밋 `9b289566b05bd977d869a618325f600574cee9dd`, 배포 `dpl_GwNHdRyNWJHcqbv2gAxMWeG2NngP` READY 및 `psi-zero-day.vercel.app` 별칭 확인.
- 운영 새 브라우저 저장에서 엔진 변경 없이 무입력/레벨업 선택만으로 실제 패배 진행. `대응 중단` 문구, 24 PSI 보상과 지갑 일치, 같은 첫 구역 재준비 및 새로고침 복구, 오류/가로 넘침 없음. 별도 랜덤 실행이며 이전 12/18 PSI 검사와 구분한다.
- 운영 증거 `artifacts/natural-defeat/report.json`. 실제 플레이 검증이며 사람이 직접 조작한 실기기 검수는 아님.
- PR #137 base를 main으로 전환하고 draft 해제. 최신 main을 병합해 타이틀/음성 잠금 CI 재실행. 모든 최신 검사와 preview 성공 전에는 운영 병합하지 않는다.

### 타이틀 운영 반영 완료

- PR #137 최종 head `216daafd5710388cac9ac133429fb43a852d1a2f`의 검사 3개 및 Vercel preview 성공 후 main 병합. 운영 커밋 `116e1e4a3ee257cd62c1c7e8bd4cd62d821ceccc`, 배포 `dpl_BdY7Y9m9kBtTEucK6DFXMLmtEaDf` READY 및 운영 별칭 확인.
- 외부 한국어 폰트 설치 지연을 저장소의 Black Han Sans/OFL 설치로 해소. 전체 `ko` 언어 태그 확인은 실패해 실제 한글 글리프 U+D55C의 fontconfig 선택 확인으로 수정했다. 최신 Linux CI에서 폰트 준비, 본편 화면, 전체 회귀 모두 통과.
- 공개 운영 주소에서 1440x900/390x844/844x390/1024x768의 공식 제목/한국어 보조 문구/모드 잠금/넘침/실행 오류 검증 통과. 낮은 모바일 가로 보조 문구 숨김은 기존 의도대로 유지.
- 증거 `artifacts/brand-title/report.json` 및 화면별 PNG. 보호된 preview의 직접 검증은 로그인 전환으로 실패했으므로 운영 검증과 구분한다.
- 후속 PR #138을 main으로 전환하고 draft 해제. 자산 사용권 기준선은 `NEW-PSI-BRAND-ASSET-RIGHTS-20261008.md` 참조. 사용자 음성 네 버전 공개 배포권 확인과 최종 청취 승인을 구분한다.

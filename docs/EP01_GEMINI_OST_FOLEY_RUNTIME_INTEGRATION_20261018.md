# PSI : ZERO DAY — EP01 신규 오디오 실제 게임 연결 검증 기록

날짜: 2026-10-18 · 적용 브랜치: `art/story-cinema-20261017` · PR #210: **Draft / 운영 main 미병합**

## 소스·승인 범위

- 사용자가 제공한 Gemini 영상 `the_weight_of_the_morning.mp4`의 단일 음악을 SC_01~SC_08 구간으로 **발췌**. 8개의 독립 작곡 마스터가 아니다.
- 편집용 8개 OGG를 **약 0.55초 loop seam crossfade**, 보수적인 음량 보정 및 Opus 48kHz stereo로 제작.
- 사용자가 제공한 `EP01_NEW_FOLEY_SFX_9_WAV_20261018.zip`의 각각 oneshot + tail을 45ms 접합 크로스페이드, 12ms attack/90ms tail fade, SFX 피크 목표값(-10 또는 -13 dBFS)과 보수적 증폭 한도로 보정한 9개 mono OGG로 제작.
- 원본 파일과 기존 코어 12개 자산은 절대 덮어쓰지 않음. 후보 자산에만 `ep01.audio.candidate.*` ID 할당.
- `content/episode01/candidate-audio-production.json`의 17개 Git blob SHA-1 원문 일치 여부를 `scripts/build-episode01-assets.mjs`에서 매번 검증.
- `content/episode01/assets.json` 빌드 생성 항목에 후보 17개를 포함하고, 게임의 `session.assetUri` 조회가 가리키도록 함.

## 런타임 연결

- `src/app/episode01-candidate-audio.ts`가 OST 후보 8개/효과음 9개를 각 사건 ID에 배정.
- `PlayableEpisode.tsx`에서 스토리 Director 모티프를 BGM 후보에 연결, 사건이 잠시 비활성화되어도 직전 `finished_instances`를 사용하여 소리 끊김 회피.
- `useEpisodeAudio.ts`의 기존 P1 두 덱 BGM crossfade 및 성우 duck attack 160ms/release 950ms 재사용.
- Foley는 사건 진입 일회만 재생. `e01_04_junho_signal` 등의 신규 PTT가 있을 때 기존 짧은 무전 cue 중복 재생 억제. 타설·펌프 등의 기존 환경/단발음은 별도 보존.
- 엔진 스토리, 26개 사건 순서/선택/결과/세이브 및 성우 4개 마스터의 대사/노드 타이밍 변경 없음.
- 앱의 음악 음량 설정 및 음소거/일시정지/가시성 변경/선택지 직접 수동진행 구조 유지.

## 신규 효과음 위치

| 신규 음원 | 사용 사건 |
|---|---|
| RADIO_PTT_DETAIL | e01_04_junho_signal, e01_08m_instruction_cascade |
| METAL_SHEET_TAP | e01_08a_reporting_return |
| ZERO_MOMENT_AIR_CUT | e01_08c_site_pushback |
| PUMP_HYDRAULIC_DETAIL | e01_06_pump_arrival |
| HOSE_SURFACE_TOUCH | e01_07_first_pour |
| TBM_PAPER_GEAR | e01_08g_tbm_field_gap |
| RECORD_PAGE_KEY | e01_08o_record_pressure |
| HOME_KEY_DOOR | e01_09_evening |
| DAY02_GATE_REPRISE | e01_10_next_day_tease |

## 품질·권리 미결

1. **SC_01~SC_08은 2분55초짜리 통합 OST에서 구간을 발췌한 시안**이다. 별도 연주/작곡된 8곡, 독립 stem, 고유곡별 동기 발전 및 악보는 아직 납품되지 않았다.
2. 새 Foley 9개는 원본 WAV를 편집한 게임용 미리보기이며, 본음/잔향 구조·현장 물성·음색을 감독과 실제 모바일 사용자가 들어 승인하지 않았다.
3. 기존 보고의 통합 OST 원본 약 -12.1 LUFS / +0.2dBTP를 기준으로, 후보 게임용 음량을 낮췄다. 이는 최종 합산 믹스의 LUFS/TP 실측 승인까지 대체하지 않는다.
4. Gemini 서비스 생성물과 Foley 원본의 **상업 이용권, 성우·샘플 권한·원본 제작 정보** 확인 필요. 후보 코드는 Preview에서 테스트 가능하되 최종 출시 권리를 승인한 것은 아니다.
5. Android 실제 기기(내장 스피커/이어폰, 일시정지·잠금·Bluetooth), 26개 사건 빠른 클릭, loop seam 청감, VO 마스킹, 플레이 통합 성능을 최종 검증해야 한다.
6. GitHub CI 모든 workflow 성공을 별도 확인한 이후에만 Visual/Audio Lock으로 진행. 특히 SURVIVORS의 브랜드 SVG 승인 목록 불일치 이력은 오디오 검증과 분리 관리.

**운영 보호:** Draft PR #210 유지, production `main` 미병합.

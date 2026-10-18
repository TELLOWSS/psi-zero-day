# PSI : ZERO DAY · EP01
# ② 성우 + 환경음 + 음향효과(SFX/Foley) 통합 제작지시서

문서: EP01-AUD-VO-AMB-SFX-001 | 작성: 2026-10-18 | Rev 1.0
상태: **환경음 기존 5종·성우 기존 4종·단발 SFX 3종 보존 / 추가 녹음·Foley 대기**
대상: EP01 26개 사건, DAY02 브리지, PR #210 Draft
연계: src/app/episode01-voice-cues.ts, src/app/episode-presentation-cues.ts, src/ui/useEpisodeAudio.ts, content/episode01/audio-production.json

**업무 경계:** 본 문서는 성우 대사·대사 자막·무전·기계 동작 단발음·작업중지 효과·UI/선택 폴리를 담당한다. **신규 오리지널 OST 8곡, 길게 반복되는 현장/사무실/집 공간음 5개는 별도 문서 EP01_OST_AND_AMBIENCE_PRODUCTION_BRIEF_20261018.md에 배정한다.** 복수 문서 간 동일 자산 중복 발주 금지.

## 1. 서사·녹음 원칙

말의 힘은 재난 예고나 큰 목소리가 아니라 조심스럽게 제보한 근로자의 용기, 공정 압박 속 답변, 불확실한 사실을 그대로 적는 책임감에서 나온다. 한 사람을 악역화하거나 출처 없는 명대사로 기존 인물·역사·선택의 뜻을 바꾸지 않는다. 사용자의 클릭과 선택이 우선이며 **자동으로 장면을 넘기는 음성 연출은 금지**한다.

## 2. 연속 환경음 5종 — 성우·효과음과 함께 관리

**이관 근거:** 환경음은 현장 동작·인물 목소리·폴리와 같은 물리적 세계를 구성하므로 Gemini 작곡 범위에서 제외한다. **기존 5종은 실제 파일이 존재하여 런타임에 연결**되어 있으며 새 파일이 자동 생성된 것은 아니다.

| 자산 ID | 기존 파일 / 장면 | 현황 및 방향 |
|---|---|---|
| ep01.audio.gate_queue | gate-queue.ogg / 게이트·DAY02 | 제작·연결됨. 6.4초 루프 후보; 첫 출근의 공기 |
| ep01.audio.workface_pressure | workface-pressure.ogg / 현장·경사로·재개 | 제작·연결됨. 4.8초; 08:05 제보와 10:24 중지에 게인 조절 |
| ep01.audio.concrete_pour | concrete-pour.ogg / 09:45 타설 | 제작·연결됨. 7.8초; 호스·타설 흐름 |
| ep01.audio.office_report_roomtone | office-report-roomtone.ogg / 13:30·16:42 사무실 | 제작·연결됨. 6.3초; 공조·먼 현장음 |
| ep01.audio.home_night | home-night.ogg / 17:18 귀가 | 제작·연결됨. 6.5초; 집의 작은 고요 |

### 2-1. 환경음 제작 및 루프 지시

- `gate_queue`: 06:27 게이트와 DAY02 입장, 뒤쪽 디젤·먼 발소리·바퀴 소리. 실제 업체/차량 식별 방송 금지.
- `workface_pressure`: 06:40 기초 현장부터 10:24 중지·재개·재보고까지 이어지는 작업공간 음향. 분기 때 재시작 금지. 08:05는 현재 상대 게인 0.68x, 10:24는 0.38x로 낮아지도록 코드 반영됨.
- `concrete_pour`: 09:45 타설·10:02 반응, 호스/습윤 콘크리트 리듬. 오디오 전환 시 기존 tail을 잘라먹지 않음.
- `office_report_roomtone`: 13:30 책임 공방·16:42 기록, 공조·먼 현장·작은 종이의 공간층. 상세 종이/키보드 **단발 Foley는 신규 SFX 영역**.
- `home_night`: 17:18 귀가. 도시 멀리 소음과 실내 정적, TV 대사·음악 합성 금지. 기존 상대 게인 0.63x로 부드럽게 연결.
- 신규/개선 환경음은 별도 dry/wet·loop 검수본으로 제출하고, 원본/변주/loop cut/tail을 구분한다. 장면 목적이 바뀌지 않으면 기존 안정 `asset_id` 유지.

### 2-2. 환경음 납품·검수 규격

- 오리지널 WAV PCM 48 kHz / 24-bit master, mono 또는 stereo 근거 명시. 게임 런타임 Ogg/Opus 48 kHz 변환본은 마스터 청감 승인 후 생성한다.
- **무한 반복되는 env loop는** 경계 클릭/급격한 음량·스테레오 위치 변화 0건, 단발 펌프·무전·STOP 효과는 loop 금지.
- VO 재생 중 기존 duck attack 160ms, release 950ms와 결합하여 대사를 침범하지 않는다. 주관적 '무음'과 미디어 재생 실패를 QA 로그로 구별한다.
- 실제 현장 근로자/교신·업체 방송을 무단 취득·활용하지 않는다. 상업 이용 증빙·원본 SHA-256·사건 ID·재생 루프 정책을 제출한다.

## 3. 기존 성우 마스터 4종 — 무조건 보존 후 A/B 심사

이 네 개는 현재 스토리의 특정 node에 결합되어 있으며, 전체 26개 사건을 전부 성우화했다는 뜻이 아니다.

| 큐 / 장면 / 노드 | 기존 파일·재생 길이 | 캐릭터/연기 | 기존 더킹 목표 |
|---|---|---|---|
| e01_02_meet_kang / kang | voice-kang-first-contact.ogg, 약 16.807초 | **강태식** / 담담·단단한 첫 인상; 현장 논리를 설명하되 꼰대·악역 톤 금지 | 0.28 |
| e01_04_junho_signal / signal | voice-junho-signal.ogg, 약 10.607초 | **임준호** / 조심스러운 실제 제보; 끝까지 확정하지 않은 관찰 사실 | 0.24 |
| e01_05_command / request_delay_result | voice-lee-delay.ogg, 약 11.207초 | **이재훈** / “7분”의 제한을 명확히 전달; 분노·압박의 희화화 금지 | 0.26 |
| e01_08o_record_pressure / oh | voice-oh-record-judgment.ogg, 약 14.207초 | **오승재** / 사실과 판단을 구분하는 1차 보고 기준, 위압적 판사 톤 금지 | 0.22 |

원본의 정확한 길이·자막 타이밍과 asset ID는 src/app/episode01-voice-cues.ts 기준. 기존 마스터 포맷 Ogg/Opus 48 kHz mono 32kbps VBR, 내부 계약의 목표는 약 -18 LUFS와 true-peak headroom(-1.5dBFS 표기). **계약상의 목표치와 실제 측정값은 다르므로 최종 검수 성적서를 새로 작성한다.**

### 3-1. 성우별 디렉팅 프롬프트 (재녹음 또는 추가 대사 필요할 때만)

- **강태식 (06:40):** 일의 순서를 오래 겪은 현장 팀장의 자연스러운 호흡. “새로운 안전관리자요?”는 사람을 재단하지 않고 확인하는 말. 마지막 ‘누가 뭘 보고 움직이는지’는 설명하듯 낮게, 극적 감탄 금지.
- **임준호 (08:05):** 주변을 의식해 살짝 숨이 걸리지만 말끝이 사라지지는 않도록. “아닐 수도 있습니다”는 자신 없는 사람이 거짓말하는 느낌이 아니라, 관찰 사실의 불확실성을 정직하게 말하는 태도. 이어지는 경사로 제보는 **정확히 들리도록**.
- **이재훈 (09:10):** 짧고 현실적인 7분. 일정 조정도 자신의 책임이라 말하는 사람. 화내거나 협박하지 않음. “들어가도 되는지 답을 주세요”는 결정을 재촉하지만 안전을 조롱하는 말이 아니다.
- **오승재 (16:42):** 오늘 밤 설명 가능한 기록이 무엇인지 묻는 실무자. 보고서의 ‘너무 길면 늦고, 너무 짧으면 다시 물어옵니다’는 인간적 지친 호흡과 정확성을 함께.

### 3-2. 자막과 마스터 결합 게이트

대사·자막 문구 변경은 **오디오 제작자가 임의 수정 불가**. 기존 source의 각 start_ms를 기준으로 onset ± 허용치(초안: 150ms)를 수동 확인하고, 단어가 가려지는 구간을 타이밍/믹스로 교정한다. VO 완료 후 BGM/환경음은 160ms attack, 950ms release로 원상 복원되며 끊김·펌핑이 없어야 한다. 재생 실패 시 VO 잠금이 해제돼 조작 불능이 없어야 한다. 기기 블루투스 지연은 별도 A/V sync 검사.

## 4. 기존 단발 사운드 3종 — 신규 제작 전 재사용 기준

| asset ID / 파일 | 실제 대표 사건 | 역할 / 허용 반복 |
|---|---|---|
| ep01.audio.radio_burst / radio-burst.ogg (1.22초) | 08:05 제보, 14:20 TBM 변경, 15:38 보고, 16:05 전달 | PTT 버튼·무전 잡음; **loop 금지**. 명료한 타인 무전 대사나 실제 교신 녹음 금지 |
| ep01.audio.pump_engine_boom / pump-engine-boom.ogg (7.2초) | 09:24 펌프 진입 | 차량 도착·유압 붐의 부드러운 실제 작업 물성; **loop 금지**. 충돌·급발진 같은 사고 확정음 금지 |
| ep01.audio.stopwork_silence_drop / stopwork-silence-drop.ogg (2.6초) | 15:20 후속 작업중지 분위기 | 장비 정지 후 현장 공기의 변화; **loop 금지**. 공포 드롭·비상경보 금지 |

현재 의도된 단발 3개는 8종 기존 환경/SFX 자산 중 일부이다. stopwork_silence_drop의 실제 큐는 e01_08k_stopwork_aftershock이며, **10:24 e01_08c_site_pushback에 새 단발 음원이 실제 연결된 것은 아니다**. 10:24는 현재 room-tone 상대 게인 0.38x로 공간 변화만 구현됐다. 150~300ms 정적 스냅은 제작 제안이며 아직 최종 구현·실청 승인 전이다.

## 5. 신규 Foley / SFX 발주 우선순위

모두 제안 사항이며 미제작·미등록. 기존 프로젝트의 소리/방호 문맥과 실제 장면의 원인-결과가 일치해야 한다.

| 우선 | 신규 가제·이벤트 | 소리 제작 연출 | 길이 제안 / 트리거 |
|---|---|---|---|
| P0 | SFX_01_RADIO_PTT_DETAIL / 08:05, 15:38, 16:05 | 무전 버튼 down/up, 가벼운 squelch, 특정 실제 채널명 없음 | 0.15~0.75초, 발화 앞·뒤 한 번 |
| P0 | SFX_02_METAL_SHEET_TAP / 08:05 → 10:10 회상 | 흔들린 철판의 미묘한 떨림. 경사로 사고가 확정된 듯한 굉음 금지 | 0.45~1.4초, 제보 앞·회상 후 변주 |
| P0 | SFX_03_ZERO_MOMENT_AIR_CUT / 10:24 | 현장 리듬을 줄이고 짧은 공백. 불길한 베이스/고음 경보 금지 | **150~300ms** 감소 연출 + 자연스러운 tail |
| P1 | SFX_04_PUMP_HYDRAULIC_DETAIL / 09:24 | 펌프 붐 관절 작동·호스 금속 결합 소리, 기존 펌프 단발음과 겹침 검사 | 0.5~2초, 한 번 |
| P1 | SFX_05_HOSE_SURFACE_TOUCH / 09:45~10:02 | 타설 호스, 젖은 콘크리트 리듬, 과장된 물소리 금지 | 0.4~1.8초, 행위별 한 번 |
| P1 | SFX_06_TBM_PAPER_GEAR / 14:20~14:36 | TBM 종이/장갑/헬멧의 소형 생활음. 중요한 교육정보는 자막에도 | 0.2~1.3초, 제시할 때만 |
| P1 | SFX_07_RECORD_PAGE_KEY / 16:42~17:08 | 키보드·종이·사진확인 음, 사람의 기록 리듬 | 0.15~1.5초, 페이지 넘김/보고 판단 |
| P2 | SFX_08_HOME_KEY_DOOR / 17:18 | 문 잠금, 작은 열쇠·옷 소리. 개인 삶의 여운 | 0.4~2초, 귀가 전환 한 번 |
| P2 | SFX_09_DAY02_GATE_REPRISE / DAY02 06:52 | 동일 무전의 작은 변형. DAY01과 인지적 연결 | 0.25~1.0초, 다음 날의 첫 보고 지점 |

**규칙:** 기존 파일과 연관 없는 외부 녹음·실제 근로자 개인정보/대화 수집·사용 금지. Foley는 사건을 직접 만들어내는 듯한 사고음보다 실제 관찰 가능한 소리 우선. 마스터 3개를 새 이름으로 중복 발주하지 않는다.

## 6. 성우·환경음·효과음 제작을 묶는 '씬별 패키지' 기준

| 패키지 ID | 사건 | 묶음 콘텐츠 | 사람의 감정선 |
|---|---|---|---|
| PKG_01_FIRST_CONTACT | 06:40 / e01_02_meet_kang | 강태식 기존 VO + 현장 소형 도구 Foley 후보 | 서로를 관찰하는 첫 만남 |
| PKG_02_SMALL_SIGNAL | 08:05 / e01_04_junho_signal | 임준호 기존 VO + 짧은 PTT + 철판의 작고 의미 있는 금속음 | 망설임이 말로 바뀌는 순간 |
| PKG_03_SEVEN_MINUTES | 09:10 / e01_05_command | 이재훈 기존 VO + 절제된 접촉/현장 Foley | 양쪽 책임이 팽팽한 현실 |
| PKG_04_PUMP_AND_POUR | 09:24~10:02 | 기존 펌프·타설 SFX + 호스 디테일 | 진행되는 공정과 앞선 판단의 결과 |
| PKG_05_STOP_AND_REPORT | 10:24·15:20·15:38 | STOP WORK 150~300ms 제안 + 기존 aftershock 효과 + 보고 무전 | 기술적 중지 이후 사람 사이에 남는 시간 |
| PKG_06_FACTUAL_RECORD | 16:42~17:08 | 오승재 기존 VO + 키보드·종이 Foley 후보 | 지금 기록해야 할 것과 아직 모르는 것 |
| PKG_07_GO_HOME | 17:18~DAY02 06:52 | 집/문 잠금 Foley 후보 + DAY02 무전 reprise | 끝난 하루, 이어질 말 |

PKG 목록은 제작 관리 편의용이며 게임 코드에 아직 통합된 신규 이벤트·선택지를 뜻하지 않는다. 반드시 현재 사건 ID와 대사 node를 유지한다.

## 7. 제작 프롬프트 / 녹음 품질

**성우 공통 감독 프롬프트**
Natural Korean dramatic dialogue in a contemporary construction workplace. Respectful, grounded, non-stereotyped performances; no yelling theatrics, no villain voices, no fear-mongering. Match approved exact Korean text and subtitle timing. Record dry mono at 48 kHz/24-bit WAV, no background music, keep breaths natural, no aggressive gating or robotic denoise. Deliver takes A/B/C, clean pickups, script match sheet, release form, and loudness report. Artificially cloned identifiable voices require documented consent and commercial authorization; otherwise do not use.

**현장 Foley 공통 프롬프트**
Original high-fidelity foley inspired by Korean construction site work: subtle metallic contact, safe equipment idle, radio push-to-talk, hose fabric/wet surface, paperwork, boots and working gloves. Make cues precise and believable, avoid real intercepted radio, names, emergency siren, car crash, graphic harm, weapon sounds, disaster stings, existing-game audio samples or lifted movie SFX. Dry main take and short natural tail separate; avoid baked-in music. 48 kHz/24-bit WAV production master and project-owned commercial license.

**실무 규격**
- 성우 마스터: WAV PCM 48 kHz/24-bit dry mono, 현재 runtime Ogg/Opus 48 kHz mono(기존 4마스터). 스튜디오 또는 독립된 처리실에서 노이즈 플로어·클리핑 체크.
- Foley/SFX 마스터: WAV PCM 48 kHz/24-bit mono 또는 현장 공간성이 중요한 경우 stereo(사유 기록). 각 cue 단발 main + tail + optional 2~3 variations.
- 목표: 목소리 중심의 약 -18 LUFS, true peak 여유 최소 -1.5dBFS 등의 기존 계약치를 **측정표로 재확인한 후 확정**. SFX는 상대 음량·폰 스피커를 실청 후 결정.
- 미완성 오디오를 임의 manifest 등록 금지. 제작분 ID, 파일명, duration_ms, SHA256, 연결 사건, 미리듣기/QA 기록이 모두 충족된 뒤 승인.

## 8. 납품 폴더 체계

audio-delivery/ep01/voice_sfx/
- voice/source/ (기존 4마스터 수정 금지, 새 대사 승인 때만 take WAV 추가)
- voice/approved/voice-kang-first-contact.wav, voice-junho-signal.wav, voice-lee-delay.wav, voice-oh-record-judgment.wav
- voice/subtitles/EP01_VOICE_CUE_TIMECODES.csv (event_id, node_id, start_ms, text, revision)
- voice/paperwork/VOICE_RIGHTS_AND_PERFORMANCE_APPROVAL.md
- ambience/loops/gate-queue.wav, workface-pressure.wav, concrete-pour.wav, office-report-roomtone.wav, home-night.wav (기존 파일 리마스터 승인본에 한함)
- ambience/tails/ (공간 이동용 잔향·교차 구간)
- ambience/reports/AMBIENCE_LOOP_QA.csv, AMBIENCE_SOURCE_RIGHTS.md
- sfx/oneshot/SFX_01_RADIO_PTT_DETAIL_MAIN.wav ~ 승인된 별도 cue
- sfx/tails/ (잔향 별도)
- sfx/variations/ (중복 피로도 완화, 의미 달라지는 효과음 무분별 랜덤 금지)
- reports/EP01_VO_SFX_SYNC_REPORT.csv
- reports/EP01_VO_SFX_LOUDNESS_TP_REPORT.csv
- paperwork/EP01_VO_SFX_ASSET_RIGHTS.md, SHA256SUMS.txt

## 9. Final Voice/Ambience/SFX LOCK 합격 기준

0. **환경음:** 기존 5개 파일의 반복 경계·공간 전환·루프 규칙·실기기 VO 마스킹·라이선스 검수 모두 통과.

1. **대사 충실도**: 네 음성의 한국어 원문/노드/순서와 시간 코드를 바꾸지 않고 전 구간 내용이 또렷하다.
2. **음량과 공백**: VO 시작·종료 게인이 튀지 않고, 음성 뒤 효과음이 관객의 이해를 방해하지 않는다.
3. **효과음 사실성**: 무전·철판·펌프·호스·문서 Foley가 상황과 원인·결과에 맞으며 점프스케어 0건.
4. **빠른 플레이**: 20회 연속 클릭·일시정지·음소거·앞뒤 전환에서 성우 중복/미종료 잠금/무의도 반복 재생 0건.
5. **기기 검증**: Android WebView 실기기 1종 이상, 내장 스피커·이어폰, 390×844 및 844×390 장면, 블루투스 딜레이/잠금 복귀.
6. **안전/권리**: 개인정보·실제 무전 도청·무단 샘플·무허가 음성 복제 0건. 권리 선언과 사용 범위 확보.
7. **버전 관리**: 승인된 WAV/codec와 기존 안정 asset_id 사용. 리뷰 없이 prod manifest 교체 금지.

**승인 순서:** 스크립트/실제 VO 검수 → Foley 샘플 A/B → 장면별 결합 → OST 문서 ①와 합산 믹스 → Android 실기기 → 저작권/성우 동의 → Director Final Lock.

**연동 문서 ①:** [Gemini 배경음악(OST/BGM) 단독 제작지시서](./EP01_GEMINI_BGM_OST_PRODUCTION_BRIEF_20261018.md). 아직 신제작 Foley/새 성우 녹음/STOP WORK 전용 150~300ms 효과를 실제 플레이에 추가한 것은 아니며 **본 문서는 제작·납품의 명세서**이다. 운영 main 병합은 승인 전 금지.

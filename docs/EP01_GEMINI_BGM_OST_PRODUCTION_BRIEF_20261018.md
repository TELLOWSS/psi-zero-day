# PSI : ZERO DAY · EP01
# ① Gemini 전용 배경음악(OST/BGM) 제작지시서

문서번호: EP01-AUD-GEMINI-BGM-001 | 2026-10-18 | 제작 소관: **Gemini** | 상태: **8곡 제작 대기, 아직 실제 OST 음원 없음**
범위: EP01 26개 사건 및 DAY02 Bridge, 작업 브랜치 `art/story-cinema-20261017`.

> **이 문서는 Gemini를 이용한 배경음악 생성만 지시합니다. 환경음(앰비언스), 성우 대사, 무전·기계·발소리·작업중지·UI 효과음은 이 문서의 제작 범위가 아닙니다.** 해당 자산의 책임 문서는 `EP01_VOICE_AMBIENCE_SFX_PRODUCTION_BRIEF_20261018.md`입니다. 따라서 Gemini 음악 프롬프트에 현장 엔진음·실제 무전·성우 음성을 포함하지 않습니다.

## 1. 음악적 정체성과 핵심 감정선

06:27 첫 출근 때 짧게 등장한 **3음 피아노 동기**가 17:18 귀가 때 같은 인물의 새로운 감정으로 돌아와야 합니다. 화려한 전투 음악이 아니라 실제 건설현장에서 위험을 감지하고 보고하며 선택한 하루의 기억을 음악으로 남깁니다. 각 큐는 실제 출처가 확인되는 **독창적인 원곡**이어야 하며, 기존 영화/게임 IP의 멜로디·편곡 모방, 샘플 무단 사용 및 상업적 권리 불명확한 결과는 배제합니다.

## 2. 신규 오리지널 OST 8모티프 발주표

아래 BPM·편성·제작 길이는 감독 검토용 설계 목표이며 확정 오디오 스펙은 아니다. 각 곡은 시작 버전, 완전 무결점 loop, 종료 tail, 2~3개 독립 stem이 필요하다.

| ID / 곡명 제안 | 적용 사건·감정 | 제안 템포 / 음악적 설계 | 필수 변주 |
|---|---|---|---|
| SC_01_DAWN_PROMISE · First Light | 06:27 첫 출근, 06:40 강태식, DAY02 06:52 / 낯섦·가능성 | 70~78 BPM; 세 음 피아노와 가느다란 현, 숨이 느껴지는 여백 | SC_08의 회귀 주제가 될 3음 DNA; piano/string/air 3 stems |
| SC_02_WORK_PULSE · Work Moves | 07:10 일 겹침, 09:24 펌프, 09:45 타설 / 작업의 밀도 | 92~104 BPM; 저현 ostinato와 작고 둥근 목재 타악 | 악센트 하나가 탈락하는 pressure 변주; 3 stems |
| SC_03_UNSAID_SIGNAL · Unspoken | **08:05 임준호**, 10:10 재보고, 14:20 TBM, 15:38 보고 복귀 / 조심스러운 신호 | 60~72 BPM; 단음 피아노, 얇은 불완전 현, 간격 | 제보 음성 전에 rhythm stem을 빼는 축약 버전; 3 stems |
| SC_04_SEVEN_MINUTES · Seven Minutes | 09:10 7분, 14:48 재개 / 시간·책임의 압박 | 86~96 BPM; 반복 현과 낮은 pulse, 실제 초침/경보 없음 | 긴박하지만 감독자를 악역화하지 않음; 2 stems |
| SC_05_ZERO_MOMENT · Hold | 10:20 점검, **10:24 중지** / 선택·멈춤 | 무박 또는 48~58 BPM; 소리의 양을 줄이는 저현 1음 | 울림이 빠지는 clean tail, 공포충격음 금지; 2 stems |
| SC_06_AFTER_THE_STOP · Aftermath | 11:15 재확인, 14:36 교정, 15:20 여파 / 남겨진 관계 | 66~76 BPM; 작은 현과 짧은 목재 타악 | 어색한 표정과 신뢰의 회복을 모두 담는 변주; 3 stems |
| SC_07_FACT_AND_MEMORY · Record | 13:30 책임, 16:42 보고, 17:08 검증 / 사실과 기록 | 62~74 BPM; 조용한 단음 피아노, 실내 공기 같은 리버브 | 대사보다 뒤에 배치, 팡파르 금지; 2 stems |
| SC_08_TODAY_RETURN_HOME · Home | **17:18 퇴근**·결과 / 작은 안도 | 66~74 BPM; SC_01의 세 음을 새로운 화성으로 변환, 목관·첼로 | 내일의 미결을 남기는 alternate ending, 3 stems |

## 3. 제작자 공통 프롬프트

Original, commercially cleared cinematic interactive score for a contemporary Korean construction-site human-safety narrative. Eight related cues with a recurring three-note piano identity, patient rests, understated strings, subtle wooden pulse, emotional realism over spectacle. Dialogue must lead. Never resemble copyrighted scores, known game melodies, Hollywood trailer braams or a horror soundtrack. No speech, siren, recognizable broadcast, stock samples or copyrighted field recording. Deliver loopable body, clean intro/outro, split stems, mastering and original-source/rights evidence. WAV 48 kHz 24-bit.

**장면별 추가 지시**

- SC_01: 첫 출근의 낯선 공기. 완전히 닫히지 않은 화음과 세 음 피아노, 공간이 주역.
- SC_02: 실제 현장 작업의 리듬을 저현으로 비유. 기계 소음을 악기로 그대로 넣지 말 것.
- SC_03: 제보하려는 사람이 말을 고르는 시간. 연주보다 쉼이 중요, 임준호 성우의 발음을 가리지 말 것.
- SC_04: 7분의 압박을 소리의 밀도와 불완전한 반복으로 묘사. 초침·카운트다운 녹음 금지.
- SC_05: 결단 앞에서 점점 빠지는 악기. 절제된 저음과 짧은 잔향만 남김.
- SC_06: 위험 조치가 끝난 뒤 남는 사람들의 불편함과 존중. 승리 연주 금지.
- SC_07: 보고서·서명·사진이 남기는 책임. 조용한 사실 확인의 톤.
- SC_08: SC_01과 같은 세 음이지만 더 따뜻하고 성숙한 화성. 신파 아닌 작은 귀가의 감동.

## 4. Gemini 생성·평가 워크플로 (음악만)

1. **한 번에 8곡 생성하지 말 것.** SC_01과 SC_08을 1세트로 먼저 생성해 3음 주제의 동일성과 감정 변화를 승인받습니다. 그다음 SC_03과 SC_05, 나머지 SC_02·04·06·07을 순차 제작합니다.
2. 각 SC마다 **A/B/C 최소 3개 음악 후보**, 구간별 stem 분리 가능 여부, loop-tail의 실제 제공 여부를 기록합니다. Gemini가 파일/stem 분리를 지원하지 않으면 가능한 출력만 제출하고 **없는 stem을 있는 것처럼 표기하지 않습니다**.
3. 음악 생성 입력은 위 공통 프롬프트+각 곡의 사건·길이·감정 설명만으로 제한합니다. 사람의 말, 한국어 성우 대사, 현장 무전, 기계 Foley, 보안·위험 경보를 **배경음악에 합성하지 않습니다**.
4. 각 생성 후보에 사용 모델/기능, 날짜, 실제 프롬프트, 출력 파일 형식, 라이선스·상업 배포 조건을 기록합니다. 상업 이용 가능 여부는 사용한 Gemini 서비스의 **당시 약관과 결과물 권리를 별도로 검증**해야 하며, 자동으로 독점 저작권이 확보된다고 주장하지 않습니다.
5. 본편 26개 이벤트는 `src/app/episode01-audio-director.ts`의 `motif`에 따라 연결 예정입니다. 기존 오디오와 재생 밸런스 조정은 통합 믹싱 단계에서 수행하며, **Gemini 작곡본이 승인되기 전에는 게임 manifest에 추가하지 않습니다**.

## 5. 사건별 음악 큐 및 믹싱 방향

| 장면/사건 | 음악 큐 | 배경음악에 대한 지시 |
|---|---|---|
| 06:27 첫 출근 / e01_01_arrival | SC_01 | 인트로에는 3음 피아노와 조용한 현; 과장된 도입 금지 |
| 08:05 임준호 제보 / e01_04_junho_signal | SC_03 | 성우 시작 전에 선율을 간소화한 버전; 말의 침묵을 차단하지 않음 |
| 09:10 7분 압박 / e01_05_command | SC_04 | 긴장감을 선율의 불완전 반복으로; 무전·초침 Foley 넣지 않음 |
| 10:24 작업중지 / e01_08c_site_pushback | SC_05 | 음악이 빠지는 정서, 큰 저음 충격음 금지; 정적 단발효과는 문서 ② |
| 16:42 1차보고 / e01_08o_record_pressure | SC_07 | 조용한 기록의 음형, 오승재 VO 우선 |
| 17:18 귀가 / e01_09_evening | SC_08 | SC_01을 다른 화성으로 재해석; 신파 금지 |
| DAY02 브리지 / e01_10_next_day_tease | SC_01 | 동일 3음 동기, 이전 선택이 남은 새로운 시작 |

나머지 사건의 8개 motif 매핑 기준은 코드 `episode01-audio-director.ts`. **환경음 상대 게인 및 엔진룸톤 수치는 이 문서에서 발주·편집하지 않습니다.**

## 6. 납품 구조·권리·검수

예시 산출 폴더: audio-delivery/ep01/music/
- masters/SC_01_DAWN_PROMISE_MAIN_48k24.wav ~ SC_08... (WAV PCM 48 kHz / 24-bit)
- stems/SC_01_DAWN_PROMISE_PIANO_48k24.wav, STRINGS.wav, AIR.wav 등 트랙 길이/시작점 완전 일치
- loops/SC_01_DAWN_PROMISE_LOOP.wav ~ 각 8종 (zero click & zero phase discontinuity)
- tails/SC_01_DAWN_PROMISE_TAIL.wav ~ 각 8종
- previews/SC_01_DAWN_PROMISE_REF.mp3 ~ 각 8종
- paperwork/OST_CUE_SHEET.csv, RIGHTS_DECLARATION.md, AUDIO_MEASUREMENT.csv, SHA256SUMS.txt

런타임용 Ogg/Opus 48 kHz 압축물과 MP3 fallback은 WAV 마스터 승인 후 별도 제작. 원본 DAW 세션/AI 생성 정책·샘플 출처·상업 이용 권한/양도 범위를 반드시 명시하고, 타작품 멜로디·제3자 샘플 무단 사용 금지. 기존 환경음 보정·리마스터는 문서 ②의 전담 작업으로 이관합니다.

**합격 체크리스트**
1. SC_01과 SC_08이 같은 3음 모티프라는 점이 청감으로 확인되되 복붙 느낌이 없다.
2. 임준호·이재훈·오승재 음성이 음악에 묻히지 않는지는 문서 ②와 통합 믹스 QA에서 최종 확인합니다.
3. 루프 경계 클릭·무의도 침묵·복귀 시 볼륨 폭주·기기별 재생오류가 없다.
4. Android 실제 기기 스피커/이어폰, 음소거·잠금복귀·빠른 전환 20회 검수.
5. WAV·stem·loop·tail·권리·측정·QA 승인 문서가 일치하며 감독 서명이 있다.

**승인 순서:** 제작자 → 음악 감독 → 음성 우선 믹스 → Android 청감 → 권리 심사 → Draft PR 검증 → Final Audio Lock. 승인 전 운영 main 병합 금지.

**짝문서:** EP01_VOICE_AND_SFX_PRODUCTION_BRIEF_20261018.md

**Gemini 전용 최종 수락:** SC_01↔SC_08 주제 동기 일치, 8곡 각각의 인트로·loop·tail·실제 제공 stem 확보, 음악 단독 파일에서 성우·앰비언스·효과음 미포함, 출처/약관/상업 이용 증빙, Android 합산 믹스 승인. `main` 병합은 최종 Audio Lock까지 보류.

**연동 문서 ②:** [성우·환경음·음향효과 통합 제작지시서](./EP01_VOICE_AMBIENCE_SFX_PRODUCTION_BRIEF_20261018.md)

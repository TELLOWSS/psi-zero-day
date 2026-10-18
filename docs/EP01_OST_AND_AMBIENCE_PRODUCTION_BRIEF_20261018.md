# PSI : ZERO DAY · EP01
# ① 배경음악(OST/BGM) 및 연속 환경음 별도 제작지시서

문서: EP01-AUD-MUS-001 | 작성: 2026-10-18 | Rev 1.0
상태: **OST 신규 음원 8종 제작 대기 / 환경음 기존 5종 런타임 사용 / 최종 Audio Lock 미승인**
대상: EP01 26개 사건 및 DAY02 Bridge, PR #210 Draft
연계: src/app/episode01-audio-director.ts, src/app/story-soundscape.ts, content/episode01/audio-production.json

**업무 경계:** 본 문서는 ① 오리지널 음악, ② 길게 유지되는 현장·사무실·집의 공간 환경음만 담당한다. 성우 대사/무전 신호/펌프 동작/STOP WORK 단발음/버튼음은 다른 별도 문서인 EP01_VOICE_AND_SFX_PRODUCTION_BRIEF_20261018.md에 배정한다.

## 1. 제작 콘셉트

첫 출근 06:27에 소개한 짧은 **세 음 피아노 동기**가 17:18 귀가 장면에서는 안전하게 돌아온 사람의 의미로 바뀌어 돌아온다. 게임의 주인공은 사람과 판단이다. 음악은 실제 건설 현장감을 가리지 않으며, 공포/트레일러식 과장, 유명 게임의 멜로디 차용, 강제 감정 유도는 금지한다.

## 2. 이미 존재하는 연속 환경음 — 신규 OST와 구분

| 자산 ID | 기존 파일 / 장면 | 현황 및 방향 |
|---|---|---|
| ep01.audio.gate_queue | gate-queue.ogg / 게이트·DAY02 | 제작·연결됨. 6.4초 루프 후보; 첫 출근의 공기 |
| ep01.audio.workface_pressure | workface-pressure.ogg / 현장·경사로·재개 | 제작·연결됨. 4.8초; 08:05 제보와 10:24 중지에 게인 조절 |
| ep01.audio.concrete_pour | concrete-pour.ogg / 09:45 타설 | 제작·연결됨. 7.8초; 호스·타설 흐름 |
| ep01.audio.office_report_roomtone | office-report-roomtone.ogg / 13:30·16:42 사무실 | 제작·연결됨. 6.3초; 공조·먼 현장음 |
| ep01.audio.home_night | home-night.ogg / 17:18 귀가 | 제작·연결됨. 6.5초; 집의 작은 고요 |

현재 코어 자산 총 12개 중 환경음 5개. 세 개의 다른 단발 SFX + 성우 4개는 문서 ②에 별도 기록. **이 문서에서 발주하는 신규 OST 8개는 실제 음원이 없으며 코드에는 모티프 이름만 존재한다.**

## 3. 신규 오리지널 OST 8모티프 발주표

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

## 4. 제작자 공통 프롬프트

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

## 5. 실제 코드 연출 수치와 오디오 승인 기준의 구분

| 장면 | 현재 환경음 코드 실제 반영 | 아직 제작 대기 |
|---|---|---|
| 06:27 | gate_queue 1.00×, 장면 교차 1,200ms | SC_01 원곡과 변주 |
| 08:05 | workface_pressure 0.68×, 장면 교차 1,450ms, 성우 우선 | SC_03 실제 피아노·현 마스터 |
| 10:24 | workface_pressure 0.38×, 장면 교차 850ms | SC_05 음악, 단발 정적 SFX는 문서 ② |
| 17:18 | home_night 0.63×, 장면 교차 1,800ms | SC_08와 SC_01의 음악적 회귀 |

26/26 사건의 예정 OST 배정은 src/app/episode01-audio-director.ts의 motif 키가 유일한 현행 기준이다. 메타데이터가 존재한다고 실제 음악을 재생한 것은 아니다.

현재 엔진의 scene 전환은 약 850~1,800ms, BGM 전환 지시는 1,750~3,200ms. 이 값은 목표 게인 자동화이며 최종 청감/실측 승인 전이다. 성우 duck attack 160ms·release 950ms 유지, 프로젝트 설정의 음악/환경음은 별개로 제어한다.

## 6. 납품 구조·권리·검수

예시 산출 폴더: audio-delivery/ep01/music/
- masters/SC_01_DAWN_PROMISE_MAIN_48k24.wav ~ SC_08... (WAV PCM 48 kHz / 24-bit)
- stems/SC_01_DAWN_PROMISE_PIANO_48k24.wav, STRINGS.wav, AIR.wav 등 트랙 길이/시작점 완전 일치
- loops/SC_01_DAWN_PROMISE_LOOP.wav ~ 각 8종 (zero click & zero phase discontinuity)
- tails/SC_01_DAWN_PROMISE_TAIL.wav ~ 각 8종
- previews/SC_01_DAWN_PROMISE_REF.mp3 ~ 각 8종
- paperwork/OST_CUE_SHEET.csv, RIGHTS_DECLARATION.md, AUDIO_MEASUREMENT.csv, SHA256SUMS.txt

런타임용 Ogg/Opus 48 kHz 압축물과 MP3 fallback은 WAV 마스터 승인 후 별도 제작. 원본 DAW 세션/AI 생성 정책·샘플 출처·상업 이용 권한/양도 범위를 반드시 명시하고, 타작품 멜로디·제3자 샘플 무단 사용 금지. 기존 5종 환경음 리마스터가 필요한 경우 원본 보존, A/B 실청 후 승인된 파일만 안정 ID에 교체.

**합격 체크리스트**
1. SC_01과 SC_08이 같은 3음 모티프라는 점이 청감으로 확인되되 복붙 느낌이 없다.
2. 임준호·이재훈·오승재 음성 문장마다 음악에 묻히는 구간이 없다.
3. 루프 경계 클릭·무의도 침묵·복귀 시 볼륨 폭주·기기별 재생오류가 없다.
4. Android 실제 기기 스피커/이어폰, 음소거·잠금복귀·빠른 전환 20회 검수.
5. WAV·stem·loop·tail·권리·측정·QA 승인 문서가 일치하며 감독 서명이 있다.

**승인 순서:** 제작자 → 음악 감독 → 음성 우선 믹스 → Android 청감 → 권리 심사 → Draft PR 검증 → Final Audio Lock. 승인 전 운영 main 병합 금지.

**짝문서:** EP01_VOICE_AND_SFX_PRODUCTION_BRIEF_20261018.md

# INDUSTRIAL PINBALL — 음원 보완·2차 제작 프롬프트

아래 내용을 마누스와 제미나이에 동일하게 전달해주세요. 기존 1차 ZIP과 Pneumatic_Payout.mp3도 참고 파일로 함께 전달하면 됩니다.

```text
당신은 ‘오늘도 무사히 — INDUSTRIAL PINBALL’의 사운드 디자이너·작곡가입니다.
기존 1차 납품 이후 실제 게임 적용과 브라우저 디코딩 검사를 진행했습니다.
아래 결과를 바탕으로 부족한 원본을 보완하고, 아직 제작하지 않은 파일을 제작해주세요.

[목표]
산업현장의 설비가 플레이어의 정확한 패들 타격과 샷에 반응하는 프리미엄 핀볼입니다.
접촉의 선명함 → 설비의 중량과 움직임 → 성공의 음악적 해소를 연결해주세요.
상시 큰 폭발·긴 고음·사이렌보다, 중요한 성공에서 강도를 높이는 방향입니다.
스마트폰 모노 스피커에서도 접촉·기믹 성공·공 출격을 구분할 수 있어야 합니다.
기존 작품의 음악이나 효과음은 모방하지 마세요. 대사·보컬·워터마크 음성은 제외합니다.

[검사에서 확인한 사실]
1. 1차 ZIP에는 공통 효과음 36개, 항만 효과음 13개, 음악 full mix 1개,
   성공 감상 데모 1개가 있습니다. 바이너리 및 공통 음원의 직접 PCM 상관 검사에서
   동일 파일이나 0.97을 넘는 직접 상관 쌍은 발견되지 않았습니다.
   이것은 음색·손맛의 최종 승인이나 ‘모든 음원이 좋다’는 뜻은 아닙니다.
2. 공통 효과음 36개가 모두 브라우저 디코드 기준 약 0.480초입니다.
   파일별 원래 동작에 맞는 길이를 다시 확인해주세요.
   동일한 길이로 잘랐다는 이유만으로 품질을 맞춘 것으로 보지 않습니다.
3. 공통 효과음의 RMS는 약 -53.5~-12.3dBFS로 큰 편차가 있습니다.
   특히 유리 효과 일부는 매우 약하고, 일부 강한 타격은 과도하게 큽니다.
   RMS 수치를 동일하게 맞추라는 의미가 아닙니다. 비교 청취와 실제 게임 믹스가 필요합니다.
4. 일부 MP3와 WAV 데모를 디코딩하면 0dBFS에 도달하거나 이를 넘는 샘플이 있습니다.
   원본 클리핑인지 인코딩·디코딩 오버슈트인지 소스에서 확인해주세요.
   이 검사만으로 가청 왜곡이 있다고 단정하지 않습니다.
5. 여러 짧은 음원은 첫/마지막 샘플이 0으로 자연스럽게 정착하지 않습니다.
   특히 motor_stop, success_finish, 일부 perfect_shot·충돌·멀티볼 음원의
   종료부를 원본에서 점검하고 잔향을 자연스럽게 보완해주세요.
6. manifest의 MP3 컨테이너 길이와 브라우저 실제 디코드 길이에 차이가 있습니다.
   인코더 지연·패딩을 구분해 기록해주세요.
7. 음악 base/groove/tension/special 분리 트랙은 아직 없습니다.
8. harbor_music_full_mix_v01은 약 63.61초이며 끝에 약 1.7초의 저레벨 구간이 있습니다.
   반복 경계에서 리듬과 잔향이 연결되는지는 별도로 검수해야 합니다.
9. Pneumatic_Payout은 약 176.77초의 음악 파일입니다.
   짧은 보상 지급 효과음으로 사용할 수 없으므로 BGM으로 분류해주세요.
10. 이번 검사는 디코드·파형·음량·재생 동작 검사입니다.
    주관적인 청취 품질·10분 반복 피로·상업적 사용 조건의 최종 확인은 별도입니다.

[이미 게임에 연결한 파일 — 무조건 다시 만들 필요 없음]
다음 13개는 짧은 시작/종료 페이드와 개별 게인을 적용해 연결했습니다.
원본이 완전히 최종 확정됐다는 의미는 아닙니다.
개선본을 제출한다면 기존 원본과 비교할 수 있게 파일 버전을 구분해주세요.

hit_metal_light_01.mp3
hit_metal_light_02.mp3
hit_rubber_light_03.mp3
hit_rubber_heavy_02.mp3
paddle_left_01.mp3
paddle_right_03.mp3
perfect_contact_01.mp3
perfect_contact_02.mp3
perfect_shot_01.mp3
harbor_crane_motor_start.mp3
harbor_crane_motor_loop.mp3
harbor_cargo_lock.mp3
harbor_multiball_entry_02.mp3

연결 방식:
- 패들 실제 작동은 좌우 음원을 공간 배치해 재생합니다.
- 퍼펙트 접촉과 충격탄 실제 발사는 별도 사건입니다.
- 항만 특수 활성은 추가 공이 즉시 생성되는 사건입니다.
  실제 없는 화물 충돌을 임의의 큰 충돌음으로 표현하지 않습니다.
- 타워 포획/투하/충돌은 실제 공 상태에 따라 별도로 발생합니다.
- 일시정지·음소거·게임 종료는 예약 재생도 취소합니다.

[우선 납품 A — 1차 핵심 보완]

A1. 짧은 패들
paddle_left_v02_01~03.wav / paddle_right_v02_01~03.wav
0.08~0.22초 권장. 입력 직후 느껴지는 단단한 솔레노이드 접촉.
느린 시작·과한 잔향·누르는 동안 지속되는 기계음을 넣지 마세요.
좌우는 단순 좌우 채널 이동만이 아닌 자연스러운 미세 변형으로 제작합니다.

A2. 재질별 약·강 타격
hit_[metal/rubber/glass/concrete]_[light/heavy]_v02_01~03.wav
금속 0.12~0.55초 / 고무 0.08~0.30초 / 유리 0.12~0.50초 / 콘크리트 0.15~0.65초.
재질과 강도가 구분되어야 하며, 길이는 잔향을 억지로 잘라 맞추지 마세요.
일반 유리 접촉에는 깨지는 소리를 넣지 마세요.
콘크리트의 강한 타격에만 제한적인 파편감을 더해주세요.
약한 타격도 스마트폰에서 접촉이 전달되어야 합니다.
같은 재질의 변형은 단순 게인·피치 변경만으로 채우지 마세요.

A3. 퍼펙트 접촉 / 발사
perfect_contact_v02_01~03.wav — 0.18~0.45초.
perfect_shot_v02_01~03.wav — 0.20~0.60초.
접촉의 어택이 먼저 오고 발사가 뒤를 잇도록, 두 음원을 독립 제작합니다.
발사음의 잔향과 스테레오가 모노 합산에서 사라지지 않게 검수해주세요.

A4. 항만 나머지 동작
harbor_crane_motor_stop_v02.wav — 0.3~0.7초: 자연스러운 감속·제동.
harbor_cargo_release_v02.wav — 0.15~0.35초: 잠금 해제.
harbor_cargo_fall_v02.wav — 0.3~0.8초: 낙하 이동, 충돌은 제외.
harbor_cargo_impact_v02.wav — 0.6~1.2초: 첫 충돌→몸체 진동→짧은 잔향.
harbor_cargo_debris_v02.wav — 0.4~1.0초: 작은 잔해의 정착.
harbor_success_finish_v02.wav — 1~2초: 음악적 성취, 기계음은 제외.
harbor_multiball_entry_v02_01~03.wav — 0.3~0.7초: 선명한 공 출격.
harbor_ambience_loop_v02.wav — 12~24초: 수면·멀리 있는 기계, 반복 피로를 낮게.

모터 기동·반복·정지가 같은 기계처럼 연결되어야 합니다.
모터 반복음은 10회 반복해 경계의 음색·리듬·잔향을 확인해주세요.
투하 연출은 동작별 파일을 제출하고 4~6초 감상용 데모를 별도로 만듭니다.
데모 믹스만 제출하고 분리 파일을 생략하지 마세요.

A5. 정말 짧은 보상 지급 효과음 — 신규
pneumatic_payout_short_01~03.wav — 0.5~1.2초.
공압 장치의 ‘치익→기계 잠금→짧은 성취음’을 연결합니다.
176초 음악에서 일부를 잘라 보상 효과음이라고 제출하지 마세요.
짧은 지급음과 긴 BGM은 이름과 폴더부터 구분해주세요.

[우선 납품 B — 반응형 음악]

항만 BGM 세트:
harbor_music_base_v02.wav
harbor_music_groove_v02.wav
harbor_music_tension_v02.wav
harbor_music_special_v02.wav
harbor_music_full_mix_v02.wav

동일한 타임라인에서 재생되는 진짜 분리 트랙이 필요합니다.
- base: 기본 리듬·화성. 단독으로도 플레이 가능.
- groove: 연속 성공 시 추가되는 베이스·퍼커션.
- tension: 설비 준비 때 추가되는 긴장.
- special: 특수 모드의 추진력과 멜로디.

기존 full mix를 필터링·EQ 분리한 것을 원래 stem이라 표기하지 마세요.
독립 생성한 서로 다른 곡을 BPM만 맞춰 분리 트랙이라고 부르지 마세요.
진짜 stem 제작이 불가능하면 그렇게 명시하고 미제작으로 남겨주세요.

약 60~90초, 4/4, 고정 BPM과 조성을 명시합니다.
기존 공급 manifest에는 112 BPM이라고 되어 있으나 실제 원곡에서 확인해야 합니다.
모든 stem은 시작 위치·길이·샘플 수·박자·조성·템포가 동일해야 합니다.
전체 합산과 일부 stem 조합 모두 헤드룸을 확보해주세요.
끝과 시작의 리듬·음색·잔향을 이어 실제 10회 반복을 검수합니다.

Pneumatic_Payout BGM:
pneumatic_payout_music_remaster.wav
pneumatic_payout_music_game_loop.wav

원곡의 음악적 특징을 유지해 과도한 피크와 끝부분을 점검합니다.
원곡 전체와 게임용 반복 편집을 구분하고 실제 BPM·조성을 확인해 기록합니다.
MP3를 WAV로 변환한 것만으로 새 고해상도 마스터라고 주장하지 마세요.
원래 프로젝트나 무손실 소스가 없으면 그 사실을 명시해주세요.

[납품 C — 아직 없는 9개 테이블의 전용 사운드]

각 테이블에 다음을 독립 파일로 제작합니다:
[table]_mechanism_start.wav
[table]_mechanism_loop.wav
[table]_mechanism_stop.wav
[table]_action_release.wav
[table]_action_impact.wav
[table]_success_finish.wav
[table]_success_demo.wav — 평가용, 위 분리 파일은 필수.

one-shot은 보통 0.15~1.2초, success finish는 1~2초,
기계 반복은 2~4초의 자연스러운 루프로 제작합니다.
게임의 동작 길이에 맞춰 loop를 시작/정지할 수 있어야 합니다.
출력 파일을 임의로 같은 0.48초로 잘라 모두 통일하지 마세요.

conveyor — 벨트 이송→압축 준비→프레스 스트로크→철판 압축.
규칙적인 생산 리듬과 단단한 압축 결정타.

foundry — 가열→용융 흐름→냉각→주괴 연쇄 파열.
뜨거운 압력과 금속의 중량. 상시 불꽃 소음은 약하게.
추가: foundry_heat_ready.wav / foundry_melt_link_01~03.wav.

 tunnel — 굴진기 기동→암반 관통→깊은 층 돌파.
연속 타격의 추진력. 추가: tunnel_rock_break_01~03.wav.

 tower — 공 포획→와이어 장력→해제→고속 낙하→실제 중량 충돌.
항만과 다른 수직 높이와 장력.
추가: tower_ball_capture.wav / tower_cable_tension_loop.wav.

power — 릴레이 접점→단계별 충전→연쇄 방전.
추가: power_relay_step_01~04.wav.
각 step이 단독으로도 성립하고, 순서대로 들으면 상승감을 줍니다.
지속적인 거친 고주파 잡음은 피해주세요.

water — 밸브 전환→펌프 기동→압력 상승→고압 수류 발사.
물의 공간감과 펌프의 힘을 함께 표현.
추가: water_valve_switch_01~03.wav.

rail — 분기기 잠금→레일 접촉→가속→급행 통과.
경로가 연결되는 성취. 위험 경보를 반복하는 방식은 피해주세요.
추가: rail_turnout_lock_01~03.wav.

demolition — 지지대 균열→약점 파괴→순차 붕괴→잔해 정착.
추가: demolition_collapse_small_01~03.wav.
각 파일을 실제 연쇄 타격 시점에 재생할 수 있게 분리합니다.

zeroday — 기계·전력·수류가 연결되는 복합 코어.
추가: zeroday_phase_drill.wav / zeroday_phase_power.wav / zeroday_phase_water.wav.
세 단계의 차이와 하나의 테이블이라는 통일성을 함께 표현합니다.

[규격·검수]
가능하면 원본 프로젝트에서 WAV PCM 48kHz/24bit로 출력해주세요.
효과음은 공간 배치를 위한 모노 원본, 음악·환경음은 스테레오.
실제 네이티브가 MP3이면 원본을 보존하고 규격과 한계를 솔직하게 기록합니다.
임의 업샘플·비트 확장으로 원본 품질을 과장하지 마세요.

- 첫 접촉 앞의 불필요한 무음 제거. 어택 자체를 지우지 말 것.
- 자연스러운 잔향. 끝에서 강한 파형을 갑자기 자르지 말 것.
- sample peak와 가능하면 true peak, RMS, 음악의 integrated LUFS 측정.
- 최소한 -1dBTP의 배포용 여유를 목표로 하되 재질별 역동성을 압축하지 말 것.
- 음악과 효과음을 같은 LUFS로 일괄 정규화하지 말 것.
- 모노 합산, 스마트폰, 이어폰, PC에서 재질 구분과 피로를 검수.
- 강한 효과 4개+접촉음 6개+음악 조합의 마스킹과 피크 검사.
- 반복음은 10회 재생해 click/pop·리듬 끊김을 검사.
- 측정하지 않은 항목은 미측정으로 표기. 숫자를 추정해서 채우지 말 것.
- 제작 도구·생성 기록·원본 출처·상업 사용 조건을 함께 기록.

[납품]
industrial_pinball_audio_phase2/
  phase1_revisions/
  payout_short/
  music_harbor_stems/
  music_pneumatic/
  tables/[각 테이블]/
  demos/
  manifest.csv
  README_ko.md

manifest:
filename,table,event,version,duration_decoded_seconds,container_duration_seconds,
sample_rate,bit_depth,channels,loop,bpm,key,loop_start_sample,loop_end_sample,
peak_dbfs,true_peak_dbtp,rms_dbfs,lufs_i,source_tool,source_format,
processing_notes,commercial_usage_notes

한 번에 전부 제작하기 어려우면 A→B→C 순서로 단계별 ZIP을 제출해주세요.
파일 미생성·측정 미실시·stem 불가 항목은 솔직하게 별도 목록으로 남깁니다.
실제 오디오 파일 없이 설명·빈 파일·이름 변경만으로 완료 처리하지 마세요.
```

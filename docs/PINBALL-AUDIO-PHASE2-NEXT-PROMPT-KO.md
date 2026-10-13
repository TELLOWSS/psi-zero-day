# 마누스·제미나이 전달용 — 2-A 검증 이후 남은 제작

아래 내용을 동일하게 전달하고 이전 제작 원본과 industrial_pinball_audio_phase2.zip을 함께 참고해주세요. 처음 요청한 전체 명세는 PINBALL-AUDIO-REMAINING-PROMPT-KO.md에 있습니다.

```text
‘오늘도 무사히 — INDUSTRIAL PINBALL’ 음원 2-A를 실제 게임에 부분 적용했습니다.
이번에는 이미 제출한 묶음을 반복해서 납품하지 말고, 아래 미완료 항목을 제작해주세요.

[확인한 결과]
- 2-A의 오디오 50개는 모두 신규 바이너리입니다. 재명명한 동일 파일은 발견되지 않았습니다.
- 개선본 중 좌우 패들 2개, 고무 타격 1개, 항만 모터 정지·성공 마무리,
  타워 실제 낙하 충돌·잔해, 짧은 공압 지급음 등 8개를 적용했습니다.
- 짧은 지급음은 지급 저장에 성공했을 때 한 번만 재생합니다. 연습이나 실패에는 재생하지 않습니다.
- WAV 원본·음악 stem·9개 테이블 전용음은 아직 미납품입니다.
- 36개 공통 효과음은 모두 약 0.480초로 디코딩됩니다. 패들 요청 길이는 0.08~0.22초입니다.
  도구 최소 길이 제약이 있으면 명시하고, 잔향을 갑자기 잘라 짧게 맞추지 마세요.
- 일부 MP3의 컨테이너 길이와 실제 디코드 길이가 다릅니다. 지연/패딩을 구분해야 합니다.
- 레벨과 종료부가 아직 고르지 않습니다. 전부 같은 RMS로 만드는 것이 목표는 아닙니다.

[선택 적용한 파일 — 재제작 우선순위 낮음]
paddle_left_v02_03.mp3
paddle_right_v02_03.mp3
hit_rubber_heavy_v02_02.mp3
harbor_crane_motor_stop_v02.mp3
harbor_cargo_impact_v02.mp3
harbor_cargo_debris_v02.mp3
harbor_success_finish_v02.mp3
pneumatic_payout_short_01.mp3

위 파일도 최종 청취 Lock을 주장하지 않습니다.
기존 파일 개선본을 만든다면 원본과 비교할 수 있게 v03으로 분리해주세요.

[우선 1 — 해결되지 않은 소스 문제]
브라우저 44.1kHz 디코드에서 full-scale 이상 샘플이 확인된 파일:
harbor_cargo_fall_v02.mp3: 26개
hit_concrete_heavy_v02_03.mp3: 27개
hit_metal_heavy_v02_01.mp3: 15개
perfect_contact_v02_01.mp3: 7개

이것만으로 원본이 가청 클리핑된다고 단정하지 않습니다.
원래 소스에서 클리핑인지 MP3 오버슈트인지 확인하고 무손실 원본으로 재납품해주세요.
이미 눌린 파형을 단순히 볼륨만 낮춘 것을 복원이라고 부르지 마세요.

레벨이 매우 약한 예:
hit_metal_heavy_v02_03.mp3: RMS 약 -49.0dBFS
hit_metal_light_v02_03.mp3: RMS 약 -48.7dBFS
hit_glass_light_v02_01.mp3: RMS 약 -48.2dBFS
hit_glass_heavy_v02_03.mp3: RMS 약 -46.3dBFS

원본 어택과 몸체를 확인하고, 모노 스마트폰에서 구분되는지 비교해주세요.
노이즈까지 크게 키우는 방식으로 해결하지 마세요.

perfect_shot_v02_01/02는 경계의 첫/마지막 샘플 차이가 약 0.427로 큽니다.
발사음의 자연스러운 끝을 소스에서 확인해 v03으로 보완해주세요.
고정 0.48초 컷으로 잔향을 끊지 마세요.
패들 v03은 선명한 최초 어택과 짧은 솔레노이드 접촉이 핵심입니다.

[우선 2 — 진짜 같은 타임라인의 항만 음악 stem]
아직 실제 파일이 없습니다. 다음을 신규 제작해주세요.
harbor_music_base_v02.wav
harbor_music_groove_v02.wav
harbor_music_tension_v02.wav
harbor_music_special_v02.wav
harbor_music_full_mix_v02.wav

60~90초, 4/4, 고정 BPM과 조성.
base=기본 리듬/화성, groove=연속 성공의 베이스/퍼커션,
tension=설비 준비의 긴장, special=특수 모드의 멜로디/추진력.
모든 트랙은 같은 시작 위치·샘플 수·템포·박자·조성을 가져야 합니다.
각 조합과 전체 합산에서 헤드룸을 확보해주세요.
같은 곡의 진짜 분리 트랙이 필요하며, 별개의 생성 곡을 stem이라고 부르지 마세요.
full mix를 필터링한 것을 원래 stem이라고 표기하지 마세요.
도구가 실제 stem 제작을 지원하지 않으면 불가능하다고 명시하고 미완료로 남겨주세요.
반복 재생 10회로 경계의 리듬·잔향·클릭을 검수합니다.

[우선 3 — Pneumatic_Payout 음악 보완]
pneumatic_payout_music_remaster.wav
pneumatic_payout_music_game_loop.wav

원래 176.77초 음악과 게임용 반복 편집을 구분합니다.
실제 BPM·조성을 확인하고 피크·반복 경계를 검사해주세요.
원래 무손실 소스가 없다면 MP3 기반 편집이라고 명시하세요.
단순 WAV 변환이나 업샘플을 새로운 고해상도 원본이라고 부르지 마세요.
짧은 보상 지급음은 이미 별도 파일로 적용했으므로 음악으로 대체하지 마세요.

[우선 4 — 아직 비어 있는 9개 테이블]
각 테이블마다 아래 7개를 실제 오디오로 제작합니다.
[table]_mechanism_start.wav
[table]_mechanism_loop.wav
[table]_mechanism_stop.wav
[table]_action_release.wav
[table]_action_impact.wav
[table]_success_finish.wav
[table]_success_demo.wav — 감상용. 분리 파일도 필수.

one-shot 약 0.15~1.2초, 성공 마무리 1~2초, 반복 기계음 2~4초.
전부 동일한 길이로 자르지 말고 실제 동작과 잔향에 맞춥니다.

conveyor: 벨트 이송→프레스 압축. 규칙적인 생산 리듬과 압축 결정타.
foundry: 가열→용융→냉각→주괴 연쇄 파열. 추가 heat_ready / melt_link_01~03.
tunnel: 굴진기→암반 관통→깊은 층 돌파. 추가 rock_break_01~03.
tower: 공 포획→장력→해제→낙하→중량 충돌. 추가 ball_capture / cable_tension_loop.
power: 릴레이 접점→단계 충전→연쇄 방전. 추가 relay_step_01~04.
water: 밸브→펌프→압력→고압 수류. 추가 valve_switch_01~03.
rail: 분기기 잠금→레일 리듬→급행 가속. 추가 turnout_lock_01~03.
demolition: 균열→약점 파괴→순차 붕괴→잔해. 추가 collapse_small_01~03.
zeroday: 굴진·전력·수류가 연결되는 코어. 추가 phase_drill / phase_power / phase_water.

실제 타격과 성공 시점에 따라 별도 재생합니다. 커다란 폭발 하나로 모두 대신하지 마세요.
기계와 장소의 차이가 귀로 구분되도록 제작합니다.

[납품·검수]
가능하면 원본 프로젝트에서 PCM WAV 48kHz/24bit로 출력합니다.
공간 배치 효과음은 모노, 음악·환경음은 스테레오.
실제 도구 출력이 MP3이면 원본과 한계를 보존하고 솔직히 기록합니다.

- 불필요한 앞 무음 제거, 어택은 보존.
- 종료부 클릭과 잔향 잘림 검사.
- sample peak, 가능하면 true peak/RMS/음악 LUFS 측정.
- MP3 인코딩 후 재디코딩 피크도 확인.
- 모노/스마트폰/PC/이어폰 비교.
- 접촉음 6개+성공음 6개+음악의 합산 마스킹/피크 검사.
- 반복 10회 검사. 측정하지 않은 항목은 미측정으로 표시.
- 제작 도구·생성 기록·원본 출처·실제 사용 조건 기록.

ZIP 구조:
phase2b_music/ — stem과 음악 편집
phase2c_tables/[테이블]/ — 전용 기계/충돌/성공음
phase2a_v03_fixes/ — 필요한 소스 보완
manifest.csv / README_ko.md / measurement_report.json

manifest에는 실제 디코드 길이와 컨테이너 길이, 규격, loop 샘플 범위,
BPM/조성, peak/true peak/RMS/LUFS, 원본 형식과 처리 내역을 기록합니다.
실제 생성 파일이 없으면 빈 폴더로 완료 처리하지 마세요.
음악·테이블 각각 한 세트를 완성해 먼저 제출하고, 나머지는 단계별 ZIP으로 제출해주세요.
```

# NEW PSI FIELD GUIDE — 118개 고속 생산 로드맵

## 핵심 운영 원칙

- **대량 생성 → 배치 선별 → 실패작만 재생성 → GitHub 일괄 반영**
- 총 **14개 생성 배치**, 목표 **7개 GitHub 통합 커밋**
- 기존 `field-guide-isometric-v1` 픽토그램은 **placeholder**로만 유지하며 realistic-v2 완료로 계산하지 않는다.
- 등급: **A 37개 / B 58개 / C 23개**

## A/B/C 기준

- **A — 정밀 핵심자산:** 구조·체결·양중·추락·붕괴 관련. 실사진/현장 레퍼런스 우선, 구조 논리 엄격 검수.
- **B — 표준 현실형:** 실제 자재·장비 형태와 사용상태를 명확히 재현. 배치 검수.
- **C — 경량 현실형:** 공구·표지·운영 소품. 단순화는 가능하지만 픽토그램/벡터 스타일 금지.

## 생성 배치

### FG-HS-01 — SECTION 0 — 프로젝트 셋업·현장개설 (10개)

- [B] 현장 출입 게이트 `site_gate`
- [B] 근로자 전용 출입구 `pedestrian_gate`
- [A] 차량·보행 동선 분리시설 `vehicle_pedestrian_separation`
- [B] 자재 야적장 `material_yard`
- [B] 임시 분전반 `temporary_distribution_board`
- [C] 임시조명 `temporary_lighting_pack`
- [C] 안전용품 지급·교체 지점 `ppe_issue_station`
- [C] 소화기 배치 지점 `fire_extinguisher_station`
- [C] 응급구호함·AED `first_aid_aed`
- [B] 현장 풍속·기상 확인 지점 `site_weather_station`

### FG-HS-02 — SECTION 1 — 기초공사 (7개)

- [B] 버림타설 단부·단차 `foundation_blinding_edge`
- [B] 기초 철근 배근 구간 `foundation_rebar_mat`
- [B] 철근 받침·스페이서 `rebar_chair_support`
- [B] 돌출 철근·스타터바 `starter_rebar_protrusion`
- [A] 철근 다발 양중 `rebar_lifting_bundle`
- [A] EV PIT 개구부 `ev_pit_opening`
- [B] EV 구간 작업·이동 동선 `ev_pit_access_route`

### FG-HS-03 — SECTION 1 — 기초공사 (6개)

- [B] 기초 임시통로 `foundation_temporary_walkway`
- [A] 펌프카 아웃트리거 `pump_outrigger`
- [B] 자바라 이동 동선 `pump_hose_route`
- [C] 바이브레이터·전선 `concrete_vibrator_cable`
- [B] 집수정·양수기 `foundation_sump_pump`
- [C] 습윤·미끄럼 구간 `wet_floor`

### FG-HS-04 — SECTION 2 — 지하층 RC·유로폼·시스템동바리 (10개)

- [A] 유로폼 벽체 거푸집 `euroform_wall_panel`
- [A] 폼타이·연결철물 `formwork_tie`
- [A] 벽체 거푸집 전도방지 지지 `formwork_brace`
- [A] 거푸집 작업발판 `formwork_work_platform`
- [A] 시스템동바리 잭베이스 `system_shoring_jackbase`
- [A] 시스템동바리 수직재 `system_shoring_standard`
- [A] 시스템동바리 수평재 `system_shoring_ledger`
- [A] 누락된 가새·연결재 `system_shoring_missing_brace`
- [A] U-Head와 멍에 중심 `uhead_beam_alignment`
- [A] 슬래브 판개 단부 `slab_formwork_edge`

### FG-HS-05 — SECTION 2 — 지하층 RC·유로폼·시스템동바리 (10개)

- [A] 슬래브 개구부 덮개 `slab_opening_cover`
- [A] 임시 계단·승강통로 `temporary_stair`
- [B] 타설 중 동바리 감시 `shoring_deformation_watch`
- [B] 슬래브 타설 작업구역 `concrete_pour_zone`
- [B] 거푸집 해체 하부통제 `dismantle_drop_zone`
- [B] 해체 거푸집 적치 `dismantled_formwork_stack`
- [B] 밀폐공간 가스농도 측정기 `confined_space_meter`
- [B] 환기팬·덕트 `ventilation_fan_duct`
- [B] 밀폐공간 감시인 위치 `confined_space_attendant`
- [B] 습윤구간 임시전기 `temporary_electric_wet`

### FG-HS-06 — SECTION 3 — 지상 전환층 (8개)

- [B] 전환층 고층고 구간 `transfer_floor_high_ceiling`
- [A] 고소작업대 `mobile_work_platform`
- [A] 전환층 시스템비계 `system_scaffold_transition`
- [B] 전환층 신규 개구부 `transfer_floor_opening`
- [A] 재래식·시스템 거푸집 접점 `mixed_formwork_interface`
- [B] 전환층 임시서포트 `temporary_support_transfer`
- [B] 전환층 자재인양구 `material_lift_opening_transfer`
- [B] 전환층 우회통로 `temporary_route_reroute`

### FG-HS-07 — SECTION 4 — 기준층 사이클·AL Form (7개)

- [A] AL Form 벽체·슬래브 패널 `alform_panel`
- [A] 알폼 핀·웨지 `alform_pin_wedge`
- [A] 알폼 핀 타격·비래 `alform_pin_flying`
- [B] AL Form 하부 서포트 `alform_support`
- [B] 슬래브 데크 서포트 `alform_deck_support`
- [B] 자재 인양 박스 `lifting_box`
- [A] 자재인양구 개방 상태 `material_lift_opening`

### FG-HS-08 — SECTION 4 — 기준층 사이클·AL Form (6개)

- [B] 압송관 개구부 `pump_pipe_opening`
- [A] 기준층 외곽 단부 `perimeter_open_edge`
- [B] 더블 랜야드 안전대 미체결 `harness_unclipped`
- [C] 매립박스·돌출부 `embedded_box_trip`
- [B] 알폼 패널 적치 `alform_panel_stack`
- [C] 기준층 정리정돈 상태 `housekeeping_typical_floor`

### FG-HS-09 — SECTION 5 — 갱폼 설치·인상 (7개)

- [A] 갱폼 패널 본체 `gangform_panel`
- [A] 갱폼 작업발판 `gangform_platform`
- [A] 갱폼 고정볼트 `gangform_anchor_bolt`
- [A] 갱폼 인양 샤클 `gangform_shackle`
- [A] 갱폼 양중 · Ø22 mm 와이어로프 `gangform_lift_wire22`
- [A] 전도방지 턴버클·와이어 `gangform_turnbuckle_wire`
- [B] 갱폼 유도로프 `gangform_tagline`

### FG-HS-10 — SECTION 5 — 갱폼 설치·인상 (7개)

- [B] 갱폼 발판 위 적재물 `gangform_platform_debris`
- [B] 출입금지 구역 `exclusion_zone`
- [C] 풍속계 `wind_meter`
- [A] 갱폼 인상 구조물 간섭 `gangform_lift_interference`
- [B] 갱폼 인상 후 고정상태 `gangform_landing_fix`
- [C] 갱폼 인상 무전·신호 `gangform_signal_radio`
- [C] 금속 파편 비래 `flying_metal_eye`

### FG-HS-11 — SECTION 6 — 층변화·Roof·옥탑 (10개)

- [A] 층변화 신규 단부 `floor_change_edge`
- [A] 갱폼 부분탈형 `partial_gangform_dismantle`
- [B] 변경된 인양고리 위치 `changed_lifting_point`
- [B] 비정형 작업발판 틈 `irregular_platform_gap`
- [B] 임시 생명줄 `temporary_lifeline`
- [B] Roof 외곽 단부 `roof_open_edge`
- [B] 옥탑 승강통로 `penthouse_access`
- [C] 옥상 강풍 노출구간 `roof_wind_exposure`
- [B] 최종 갱폼 해체구역 `final_gangform_dismantle`
- [C] Roof·옥탑 정리정돈 `roof_housekeeping`

### FG-HS-12 — SECTION 7 — 견출·할석·미장·해체정리·직영 (9개)

- [C] 견출 작업 공구 `surface_finishing_tools`
- [B] 할석 브레이커 `chipping_breaker`
- [A] 그라인더 덮개·스위치 `grinder_guard_switch`
- [B] 미장용 믹서·교반기 `mortar_mixer`
- [B] 우마·간이 작업발판 `workhorse_platform`
- [A] 이동식비계 `mobile_scaffold`
- [B] 분진 저감장치 `dust_control`
- [C] 보안경·안면보호구 `eye_face_ppe`
- [B] 임의 해체된 안전난간 `dismantled_guardrail`

### FG-HS-13 — SECTION 7 — 견출·할석·미장·해체정리·직영 (9개)

- [B] 해체자재와 이동통로 `dismantle_debris_route`
- [C] 폐자재 분리·반출구역 `waste_sorting_zone`
- [B] 지게차 사각지대 `forklift_blind_spot`
- [C] 차량통제 장비 `traffic_control_pack`
- [C] 화학물질·MSDS 관리지점 `chemical_msds_station`
- [B] 이동식 사다리 `extension_ladder`
- [B] 가설 안전시설 철거 `temporary_facility_removal`
- [B] 임시전기 철거 `temporary_power_removal`
- [B] 준공 전 최종 이동통로 `final_route_clearance`

### FG-HS-14 — SECTION 8 — 공통 안전·운영 아이템 (12개)

- [B] 통로 인접 적재 자재 `material_stack`
- [C] 출입 통제 바리케이드 `access_barrier`
- [B] 차량·보행 동선 중첩 `vehicle_overlap_zone`
- [A] 일반 중량물 양중 · 라운드 슬링 초크걸이 `suspended_load`
- [C] 현장 무전기 `radio_pack`
- [C] 현장 점검 키트 `inspection_kit`
- [C] 작업중지·통제 표시 `stop_work_marker`
- [B] TBM 현황판 `tbm_board`
- [B] 작업허가·계획 확인판 `permit_board`
- [C] 아차사고 흔적 `near_miss_marker`
- [B] 작업발판 절단부 `platform_cut_edge`
- [A] 개구부·단부 `open_edge`

## GitHub 반영 주기

- **FG-GH-01:** FG-HS-01 + FG-HS-02 완료 후 1회 원자적 커밋
- **FG-GH-02:** FG-HS-03 + FG-HS-04 완료 후 1회 원자적 커밋
- **FG-GH-03:** FG-HS-05 + FG-HS-06 완료 후 1회 원자적 커밋
- **FG-GH-04:** FG-HS-07 + FG-HS-08 완료 후 1회 원자적 커밋
- **FG-GH-05:** FG-HS-09 + FG-HS-10 완료 후 1회 원자적 커밋
- **FG-GH-06:** FG-HS-11 + FG-HS-12 완료 후 1회 원자적 커밋
- **FG-GH-07:** FG-HS-13 + FG-HS-14 완료 후 1회 원자적 커밋

## 시스템동바리 별도 강제 기준

- 사용자 제공 현장사진을 구조 기준으로 사용
- 잭베이스 → 수직재 → 수평재 → U-Head → 멍에 → 슬래브 거푸집의 하중 전달관계가 보여야 함
- U-Head와 멍에 균형을 위한 현장형 수평유지재/안정화 요소가 레퍼런스에 존재하면 반드시 반영
- 일반 비계처럼 보이는 임의 구조는 불합격

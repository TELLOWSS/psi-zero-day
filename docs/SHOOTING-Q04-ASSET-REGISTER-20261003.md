# Q04 — 슈팅 오디오 자산 장부

런타임: 엔진 사건 큐(발사/명중/통제/수집/피격/성장/보스/궁극기/승패), 단일 context, 4개 버스+Master, buffer cache, 공통 stem clock, 24 voice cap, duck, 비동기 재생 취소, 실패 로그, mute/exit 정리 구현. 반복 사건은 렌더 배치에서 같은 cue를 집계한다. 중요 cue 우선 voice 회수와 약한 좌우 pan/거리 감쇠를 구현했다. 현재 듣는 소리는 DEVELOPMENT_SYNTH이며 최종 승인으로 계산하지 않는다.

`src/app/survivors-audio-manifest.ts`의 21개 슬롯은 모두 MISSING_FINAL / URI=null / 권리=null / SHA256=null이다. 승인 상태·URI·권리·해시가 없으면 `playApproved`는 재생하지 않는다. 검증용 가짜 버퍼 테스트는 tests에만 있다.

| 제작 묶음 | 수량 | 제작 요청 | 상태 |
|---|---:|---|---|
| foundation / pressure / heavy_risk | 3 | 공통 조성·BPM·길이·시작점의 실제 분리 stem. 96 BPM 초안, 기존 G8-A 84 BPM과 무편곡 혼합 금지 | MISSING_FINAL |
| intervention / evolution / success / failure | 4 | PSI 모티프의 짧은 개입·성장·결과 cue | MISSING_FINAL |
| 실제 도구/접촉/통제/수집/성장/경보/승패 SFX | 12 | sound brief의 현장 Foley, 반복 사건별 3~5 variant. 명중과 통제 완료를 서로 구분 | MISSING_FINAL |
| 무전 음성 / 현장 ambience | 2 | 실제 지시·공기·기계 공간감. 화면 없이 주요 위험 식별 | MISSING_FINAL |

납품 장부에 반드시 추가할 필드: 제작자/도구, 출처·권리 증거, native/runtime 포맷, 길이, loop start/end, key/BPM/bar 수, SHA256, 기술 측정, 청취 증거, 실기기 증거. native master를 보존하고 단순 upsample을 고품질로 표시하지 않는다.

G8-A 24개 승인 파일은 그대로 유지하고 production gate를 재검증한다. 그 승인은 디펜스 용도이며 슈팅 편곡의 권리·템포·loop·감정 적합성 승인을 대신하지 않는다. 직접 청취·권리 재검토 없이 재사용을 결정하지 않았다.

남은 런타임 production 범위: 최종 stem 연결, 음악 상태 hysteresis/마디 전환·crossfade, tool variant/분사 start-loop-end, 실기기 cue별 우선순위 최적화, 실제 10분 trace. 최종 자산/청취 측정이 없으므로 Q04 PRODUCTION PASS가 아니다.

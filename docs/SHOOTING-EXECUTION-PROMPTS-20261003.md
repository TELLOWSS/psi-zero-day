# 슈팅 개선 실행 프롬프트

## 사용 순서

아래 공통 규칙을 첫 요청에 포함하고 Q01부터 하나씩 실행한다. 각 완료 결과와 증거를 검토한 후 다음 번호를 요청한다. 최종 음원/아트가 없으면 필요한 자산 목록과 제작 요청을 결과로 남긴다. 없는 파일이나 사람의 청취 승인을 만들지 않는다.

## 공통 규칙 프롬프트

```text
TELLOWSS/psi-zero-day의 SURVIVORS 슈팅 품질 개선을 수행하라.
현재 checkout/branch/SHA/dirty 상태와 AGENTS.md를 확인하라.
docs/SHOOTING-QUALITY-AUDIT-20261003.md,
docs/SHOOTING-ORCHESTRAL-SOUND-BRIEF-20261003.md,
docs/MASTER-DESIGN-PRINCIPLES.md, GAMEPLAY_DOCTRINE.md를 읽어라.
내가 지정한 Q 작업만 구현하라. 현재 코드가 감사 기준 SHA 이후 바뀌었다면 발견을 재검증하라.
사용자 변경을 보존하고 엔진 규칙은 domain/engine에 둬라.
기존 스토리/디펜스/G8-A 승인 자산과 저장을 회귀시켜라.
새 framework/backend/ECS를 도입하지 말고 최종 자산을 placeholder로 대체하지 마라.
세계관 충돌은 문서에 선택지와 영향으로 남기고 확정되지 않은 기획을 임의 구현하지 마라.
직접 구현한 항목과 제안/미검증 항목을 구분하라.
결과를 IMPLEMENTED / FILES / TEST / TODO / DIRECTOR REVIEW로 짧게 보고하라.
```

## Q01: 세션 안정성

```text
Q01을 수행하라. PatrolSurvivorsGame의 AudioContext를 세션당 하나로 재사용하고
재생 source/voice 수명과 종료 정리를 구현하라. 기존 synth는 개발용임을 유지하라.
blur/visibilitychange/touchcancel에서 이동 입력을 초기화하고 안전하게 pause하라.
렌더 loop의 selectedStage/character stale closure를 재현한 후
배경·보상·별·다음 stage 해금을 실행 중 engine state의 식별자에 맞춰라.
저장 JSON의 형태·finite 숫자·범위·허용 ID를 검증하고 기존 저장을 보존하라.
결과 진입 시 보상은 1회만 지급되어야 한다. UI가 엔진을 직접 변경하는 경로는
이 작업에 필요한 부분만 기존 engine API로 옮겨라.
Stage 01→02 전환, stage_02 결과 저장, 키 누른 상태로 창 전환,
손상 JSON/null/NaN 저장, 반복 종료/재진입의 회귀 테스트를 작성하라.
typecheck와 관련 테스트를 실행하라. 오디오 context/voice가 누적되지 않는 증거를 남겨라.
```

## Q02: 전투 재현성과 충돌

```text
Q02를 수행하라. Math.random 기반 게임 난수를 seed 주입 RNG로 교체하고
퍽 선택은 Fisher-Yates로 처리하라. 표현용 난수는 게임 난수와 분리하라.
RAF에서 고정 simulation step accumulator를 사용하고 렌더와 HUD 갱신을 분리하라.
긴 지연 후 catch-up 상한과 pause 복귀 정책을 명시하라.
탄환 이전/현재 위치를 이용하는 swept collision로 고속 통과를 방지하고
지속 범위 공격의 hit cadence와 관통 횟수를 명시적으로 검증하라.
밸런스 수치는 바꾸지 말고 현재 frame 의존 피해량 차이를 먼저 측정하라.
동일 seed/input 재현, 30/60/120Hz 입력 schedule, 고속 탄환 작은 target,
동시 치명피격/시간 종료의 승패 우선순위를 회귀 테스트하라.
성능 측정 후에만 공간 partition 최적화를 도입하라.
```

## Q03: 모바일 플레이와 HUD

```text
Q03을 수행하라. 390x844 캡처의 콤보 배너/HUD 겹침을 해결하라.
주요 상태, 퍽 선택, 궁극기, pause, 결과의 영역을 예약하고 safe-area를 적용하라.
긴 한국어 이름과 최대 표시 숫자에서도 줄바꿈/잘림/레이아웃 변화를 검증하라.
360x800, 390x844, 844x390, 1440x900에서 Playwright screenshot을 남겨라.
터치 joystick dead zone, touchcancel, 여러 손가락, 회전, 버튼 누르는 동안 이동을 확인하라.
키보드 pause는 key repeat로 토글되지 않게 하라.
reduced-motion 설정으로 큰 shake/flash를 줄이고 무음 상태에서도 위험 정보를 전달하라.
모바일 캔버스가 nonblank이며 이동/자동 공격/성장 선택/재개가 실제 작동하는지 검증하라.
```

## Q04: 오케스트라와 효과음 런타임

```text
Q04를 수행하라. 오케스트라 사운드 기획을 기준으로 슈팅용 manifest와
Music/SFX/Voice/Ambience/Master 버스를 구성하라. 기존 AudioContext 한 개를 사용하라.
실제 발사/명중/위험 통제/수집/성장/보스 등장/궁극기/승패 이벤트를 엔진에서 전달해라.
상태 차이 추측이나 매 frame 재생으로 중복 소리를 만들지 마라.
기존 G8-A 음악을 재사용할 수 있는지 권리와 tempo/loop/감정 적합성을 먼저 평가하라.
최종 승인 asset만 production으로 연결하고 synth를 orchestral final로 표시하지 마라.
동기화 stem 시작, 전환 hysteresis, 경보/무전 duck, voice 제한,
mute/exit/hidden/pause 때 loop와 one-shot 정리를 검증하라.
재생 실패를 로그/telemetry에 기록하되 무음에서도 게임은 계속 작동해야 한다.
주요 사건별 실제 재생 증거와 10분 context/voice/메모리 trace를 제출하라.
최종 음원이 없으면 자산 제작표와 미완료 범위를 정확히 남겨라.
청취 승인은 내가 제공한 실제 증거로만 기록하라.
```

## Q05: 현장 비주얼과 액션 연출

```text
Q05를 수행하라. Stage 01을 대표 vertical slice로 완성하라.
하역장 공간이 보이는 최종 배경/전경, 캐릭터 접지, 위험 실루엣,
명중과 통제 완료의 구분, 이동과 공격 방향의 일치에 집중하라.
공격을 받은 사람/폭발 유도 묘사의 세계관 충돌을 정리하고
격리·통제·대피의 액션 대안을 기획으로 제출하라. 확정 후 해당 항목을 구현하라.
기존 넉백/히트스톱/컷인은 짧고 사건별 차등으로 조정하고 중요 화면을 가리지 마라.
큰 검정 빈 공간, 읽기 어려운 반복 라벨, 과도한 범위/번쩍임을 검토하라.
최종 자산이 없으면 필요한 자산과 shot brief를 제출하고 구현 완료를 주장하지 마라.
동일 seed/시간/viewport의 전후 캡처와 target 기기 frame trace를 제출하라.
```

## Q06: 출시 후보 검수

```text
Q06을 수행하라. Stage 01 대표 흐름의 시작/이동/자동공격/수집/퍽/진화/
위험 예고/궁극기/pause/승패/보상/재시작을 브라우저 E2E로 검증하라.
전체 npm test, npm run typecheck, npm run build와 기존 production gate를 실행하라.
실패는 코드 문제/환경 문제/자산 누락으로 근거 있게 구분하라.
신규 사용자와 실물 Android 검수 양식을 작성하라.
헤드폰/휴대폰/작은 speaker 10분 청취, 화면 없는 중요 큐 식별,
Bluetooth 지연, offline 재실행, 저장 복구를 기록하도록 하라.
사람과 실기기 증거가 없는 항목은 NOT_RUN으로 남겨라.
모든 gate의 결과/커밋/기기/증거/남은 blocker를 1개 표로 정리하고
완성된 Stage 01을 기준으로 Stage 02-05 확대 우선순위를 제안하라.
```

## 바로 사용할 첫 요청

```text
docs/SHOOTING-EXECUTION-PROMPTS-20261003.md의 공통 규칙과 Q01을 실행해줘.
현재 main에서 발견을 재검증하고 Q01 구현과 검증까지 완료해줘.
Q02 이후는 이번 작업 범위에 포함하지 않아.
```

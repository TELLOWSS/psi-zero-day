# 시그널 가드 P2 구현·검증

## IMPLEMENTED

- GD-04~06 지하 작전(7/8/9파), GD-05 복수 진입로, GD-06 5파 전 수동 전환과 무료 재배치 1회.
- 6인 구성: GD-03 후 플레이어의 장비 재배치, GD-04 후 최민석의 방향 지원 해금.
- 4계열 L4 A/B 8종, GD-03 클리어 이후 동시 한 기 제한. 점사·관통·진행 파동·지연 착탄·고정·경계·관측점·분석을 순수 엔진에서 처리.
- 이전 작업에서 생성한 L4 8종과 지하 전장 3종의 최종 후보 자산 연결. 기존 사용자 공급 오디오 유지.
- 개별 경로의 이동·표적 순서·피격 좌표·카메라·추천을 연결. 지연 공격은 발사 당시 위치와 성능을 보존.
- v1 저장 원문을 보관하며 v2로 이관. 전환·재배치·지원 사용 즉시 저장.

## FILES

핵심: `src/engine/defense.ts`, `defense-geometry.ts`, `defense-ultimate.ts`, `src/ui/GuardSpatialControls.tsx`, `src/app/guard-save-version.ts`, `content/defense/guard-campaign-v1.json`.

## TEST

- 최종 전체 회귀: **2,130 통과 / 1 기존 건너뛰기**, 367개 파일 통과. 타입 검사와 전체 배포 빌드 통과.
- 지하 3작전 × 동료 6인 = **18개 정상 구매 완주**. 100틱마다 전투 중 추천 보강도 사용하며 자원·승리 상태를 덮어쓰지 않음.
- PC 1440×900, 세로 390×844, 가로 844×390에서 지하 3작전씩 **9회 실제 UI 완주**. 준비 대기·전환 확인·결과 조작·저장·패드 터치 정렬(2px 이내) 확인.
- PC·세로·가로·320×568·568×320에서 재배치와 방향 지원 **10개 조작 사례 통과**. 스크롤 가로 넘침·런타임 오류·미번역 동료 키 없음.
- 지연 착탄의 매각/저장 후 복원, L4 슬롯, 경계선 접촉, 점사·관통·파동·고정·분석, v1 원문 보존, 전환 중복 지급 방지, 하부 경로 카메라 검사.
- 지하 시작 자원은 초기 300에서 480으로 조정. 추천은 은폐 탐지 반경과 실제 화력의 겹침을 계산하고 이미 관측한 영역의 중복 투자를 줄임. 전투 중 얻은 자원으로 추가 보강 가능.
- 회귀/빌드의 샌드박스 임시 파일 ENOENT는 외부 실행으로 재검증. 최종 성공 로그: `artifacts/guard-p2-final-tests.log`, `artifacts/guard-p2-build-final2.log`.
- 재현: `npm test`, `npm run typecheck`, `npm run build`; 브라우저: `scripts/play-guard-p2.cjs`, `scripts/check-guard-p2-controls.cjs`.

## TODO

- GD-07~12/P3는 이번 납품 범위에 포함하지 않음.
- Android 저사양·중급 실기의 장시간 성능/발열 측정과 실제 스피커·이어폰 청취 검수.

## DIRECTOR REVIEW

자동 완주와 화면 크기 검증은 사람의 재미 검수·Android 실기 성능·최종 미술 승인을 대신하지 않음. 자산은 최종 후보이며 시각 품질 승인 완료로 표기하지 않음.

동기화 대상: GitHub `TELLOWSS/psi-zero-day`의 `main`, Vercel `tellowss-projects/psi-zero-day` production, `https://psi-zero-day.vercel.app/`.

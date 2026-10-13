# 성장 원화 슬롯과 해금 경계

`node scripts/audit-growth-art-slots.mjs`는 원본을 수정하지 않고 structured JSON 및 파일 SHA를 대조한다. 결과는 `artifacts/growth-art-slots/report.json`이다.

현재 본편은 8명/initial·focused·skilled 총24단계 표현 계약과 인물별 기본 초상 manifest를 가진다. 단계 이름을 suffix로 가지는 별도 manifest 이미지 항목은0이다. 이는 모든 저장소 파일을 전수 검증했다거나 새 원화가 이미 납품됐다는 뜻이 아니다. 계약의 expression/posture/items는 표시 메타데이터이며 독립 이미지 승인 기록이 아니다.

실제 경로: `src/app/character-growth.ts`는 기존 growth 플래그를 읽고 `PlayableEpisode`/`VisualSlot`이 읽기 표시한다. `character-loadout.ts`는 기존 growth/장비 플래그를 별도로 투영한다. 시그널 워치의5장 완수와 관심사 저장은 이 플래그를 쓰지 않는다. 관심사 CG는 원화별 기존 종료 근거·대화·관심사 표시 조건만 사용하며 초기/집중/숙련 이미지나 직업 획득으로 재명명하지 않는다.

승인 STAGE12/control CG 정확 bytes2건은 일치했다. 기존 인물 초상의 사용권/최종 시각 승인을 manifest 존재만으로 추정하지 않는다. 조율/조사 후보는 문서 영역에서 파일 답변을 기다린다. 이 둘이 승인되더라도 본편8명 성장 이미지나 나머지 시그널 워치5인물로 승인을 확장하지 않는다.

자동 동기화 정책: 2026-10-09 최신 사용자 지시로 GitHub push/PR/병합/Vercel 배포는 요청 시에만 한다. 로컬 구현·검증을 배포 대기로 중단하지 않으며 기존 배포 한도 실패를 반복 확인하는 것을 구현 진척으로 계산하지 않는다.

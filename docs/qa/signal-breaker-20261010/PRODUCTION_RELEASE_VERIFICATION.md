# 운영 동기화 검증 — 2026-10-10

기능 릴리스: ebfd59af10dca47747d26e9751255d421a890ae8. GitHub main과 Vercel psi-zero-day 프로젝트의 production 배포 dpl_67GRwMy7E3okSTQ3vxY6EUGLTxwt에서 같은 SHA를 확인했다. READY 및 기존 psi-zero-day.vercel.app 운영 별칭 확인.

운영 Chrome에서 PC 1366×768/모바일 390×844: 메인 모드 메뉴 → 브레이커 → 실제 발사 → 메인 복귀 통과, JS 오류·가로 넘침 없음. 초기 HTML 버튼이 보이는 시점과 앱 초기화 완료 시점은 다르므로 브레이커 QA 초기화를 기다린 뒤 조작하도록 검증 스크립트를 보강했다. 후속 검증 커밋은 게임 기능을 변경하지 않는다.

운영 정적 파일 6종(브레이커 HTML, 구조물/배경/장비 WebP, 공유 캐릭터 브리지 JS, service worker) 모두 HTTP 200과 올바른 Content-Type 확인. 브레이커 저장은 WATCH와 별도 유지.

로컬: 본편 2,037개 통과/1개 제외, 브레이커 31개 통과, 타입 검사 및 production build 통과. 실제 모바일 GPU·발열의 측정은 포함하지 않는다.

이미지: production-main-desktop.png, production-main-mobile.png. 원본 실행 결과는 artifacts/production-hub-entry/result.json에 보존한다.

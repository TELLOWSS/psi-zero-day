# 디펜스 전투 그래픽·사운드 QA — 2026-10-15

- 최종 `npm test`: 360 파일 통과 / 1 파일 건너뜀, 2,089 테스트 통과 / 1 건너뜀. `full-tests.log`.
- `npm run typecheck`, `npm run build` 통과. `typecheck.log`, `build.log`.
- 엔진 계약 테스트 7개: 4계열의 실제 표적/피해/위치, 범위 피격·킬, 상태 불변, 2배속 틱 집계, 정지/은폐 대상 무발사, 기존 상태 결과 일치.
- 믹서 테스트 2개: 중복 디코딩 방지, 예약음 포함 최대 8보이스, 정지 정리, 디코딩 실패 시 무음 종료·재요청 폭주 없음.
- `combat-av-browser.json`: 실제 Chrome, PC 4계열 + 세로 PULSE + 가로 BURST. 일반 UI 구매/웨이브 시작으로 발사/명중을 유발했다. 페이지 오류/가로 넘침 없음. 유효 피해 각각 PULSE 12, BURST 16, CONTROL 3, SENSOR 8. 3개 음원 디코딩 및 launch/impact/stopped 이벤트, 음소거/다시 켜기/설정창 닫기 확인. `*-contact.png`, `*-sound.json` 보존.
- 시간 가속은 UI 업데이트용 Playwright clock을 사용한다. Web Audio는 자체 하드웨어 시간을 쓰므로, 짧은 음원이 스크린샷 중 끝나는 경우 다음 실제 발사를 기다린 뒤 정지 검사를 했다. 오디오 이벤트는 실제 샘플 소스 예약 이후 발생한다. 이것은 인간 청취 판정이 아니다.
- `sample-analysis.json`: 실제 브라우저 디코딩, 48kHz 2채널. 첫 90ms RMS는 control-resolve 0.1012, area-resolve 0.1144, control-barrier-clack 0.0172. 첫 220ms 피크 모두 1 미만. 최종 스피커 출력의 LUFS/청취 측정으로 오인하지 않는다.
- `natural-play.json`: PC 1440×900, 세로 390×844, 가로 844×390. 각 10웨이브 정상 완주·보호막 20·3별·일반 구매/진화 17회·결과 저장. 승리/자원/적 상태 주입 없음. 시간 가속 및 정상 2배속 사용.
- `browser.json`: 5개 화면 크기의 배치·진화·정지·닫기·재접속·중복 탭/로드 후 오프라인 회귀. `*-board/tree/preparation.png`.

실제 Android 장시간 성능·휴대폰 청취·Director 최종 연출 승인·원음 권리 감사는 별도다. 새 래스터 이미지/외부 음원을 생성하지 않았으며 현재 공개 기본 `ramp-01`에 한정해 시청각 연출을 보강했다.

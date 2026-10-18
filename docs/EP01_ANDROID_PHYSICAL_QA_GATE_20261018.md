# PSI : ZERO DAY — EP01 Android 실기기 승인 기준

## 패키지/화면 회전 계약
- Preview 브랜치 `art/story-cinema-20261017`에서 `fullUser` Android orientation 사용 (사용자 기기 회전 설정에 따름).
- `scripts/configure-android.mjs`가 `npm run android:sync` 이후에도 `fullUser`를 유지함.
- `scripts/verify-android-orientation.mjs`는 Manifest/후처리 동기화 계약만 검사함.
- `.github/workflows/build-ep01-director-android-qa.yml`가 설치 가능한 **디버그 APK** 제작/다운로드 아티팩트를 제공함. **에뮬레이터나 실제 휴대폰에서 플레이를 실행한 것은 아님**.

## 실기기 테스트 표준 (검증 결과 기록 시 기종/OS/해상도/앱 SHA 표기)
1. 화면 회전 자동 켠 상태에서 앱 실행 → 세로 본편 시작 → 가로 회전 → 선택지 읽기/선택 → 세로 복귀. 앱 재시작/중복 진입/저장 초기화가 없어야 함.
2. 자동 회전 잠금 상태에서는 Android 기본 사용자 방향 설정에 따른 화면 동작이 일관돼야 함. 앱에서 추가적인 회전 강제를 하지 않음.
3. 09:24 펌프카 및 09:45 타설 장면 전환이 정확하고 서로 다르며 SVG 프리뷰 이미지가 실제 렌더링되어야 함.
4. 전신 인물 1~2명, 불투명도, 발끝 및 지면 그림자 접합 점검. 390×844/844×390/320×568 해상도 별 확인.
5. 터치 가용성: 다음/선택지 버튼 44px 이상, 자막 잘림/선택지 겹침/가로 넘침 없음.
6. 오디오: 단말 내장 스피커/유선/블루투스에서 OST 8후보/효과음 9종, VO 덕킹, 루프 연결, 이벤트 진입 단발 재생, 화면 잠금/복귀/전화 중단, 앱 백그라운드 복귀.
7. 성능: 26사건 전개, 회전 중 프레임 드롭, 프리뷰 WebView SVG decode, 메모리/발열, 재접속 후 저장 복구.
8. 테스트 체크표/영상/오디오 청취 의견 및 저작권 증빙이 없으면 상업용 최종 승인 불가.

## 결과 상태
- 자동 정적 매니페스트/웹 CI는 실제 단말 QA 증거가 아니다.
- 최종 WebP 원화와 캐릭터 전신 원본 재제작 역시 별도 ART Lock 사항.
- 운영 `main` 병합 및 Play Store 정식 배포 금지. PR #210 Draft 보존.

### QA APK 분리 패키지 정책
- Android 디버그 변형에서 `applicationIdSuffix ".qa"`와 `versionNameSuffix "-director-qa"` 적용.
- 테스트 기기에서 기존 `com.tellowss.psizeroday` 정식 패키지와 공존 가능; 테스트 저장 영역은 독립됨.
- QA 설치 아이콘·앱 이름은 `PSI : ZERO DAY QA`; 배포용 릴리스 서명·패키지 ID는 변경하지 않음.

## Android QA 전용 텍스처 용량 패스
- 원인 진단: 이전 디버그 APK 571 MiB 수준(빌드 로그 기준); `public/assets/survivors`의 큰 PNG 사용량이 높음.
- `scripts/prepare-android-qa-textures.mjs`는 `npm run build` 후, Capacitor `sync` 전 `dist/assets/survivors/{maps,pinball/tables,graphics-v1}`에 한정해 용량 1MiB 이상·최대 변 1600px 초과 PNG를 축소.
- 경로/파일 형식 PNG, 종횡비, alpha 보존. 결과가 원본보다 작지 않으면 교체하지 않음. `public/` 원화 및 브라우저 Vercel 빌드 변경 **없음**.
- `artifacts/android-qa/texture-budget.json`에 변경별 SHA256/전후 해상도/절감 바이트를 기록.
- 원본 자산의 미술품질 승인과 별개인 디버그 APK 한정 실험; 세로/가로 Android 실기에서 디테일·가독성 재검수가 필요.

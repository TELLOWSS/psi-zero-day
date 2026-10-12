# EP02 엔딩 음성 후보 수신·검증

## 이전 상태

GitHub main `bc5a4cef6f657acca0ee552bd7641e1bb20699d6`와 Vercel production `dpl_8Jazoqyudqnpk3cWSdi42ZcxQxsU`가 일치한다. #195 보스 기계 동작·누적 손상·국소 피격 연출과 기존 CH-01~05 엔딩 음성 통합을 기준선으로 삼았다.

## 이번 범위

사용자가 제공한 `PSI_V_END_EP02_voice_candidates.zip`의 최종 WAV 10개를 byte-for-byte 보존하고 후보 manifest와 비교 청취 페이지를 제공한다. 원시 WAV 10개는 제공 ZIP에서 SHA-256을 대조했다. 원시 파일은 후보 재생 경로에 중복 배포하지 않는다. 파일 변형·속도 조절·대사 변경 없이 실제 후보만 수신했다.

- 비교 청취: `/signal-breaker-dev/qa/ep02-voice.html`
- 후보 메타데이터: `content/signal-breaker-ending-voice-ep02-candidates.json`
- 검증: `npm run audio:ending-ep02-check` (prebuild에도 포함)

24 kHz / mono / PCM 16-bit, SHA-256, RIFF chunk 경계, 실제 디코딩 길이, 샘플 클리핑을 확인했다. ffmpeg loudnorm으로 integrated loudness와 true peak를 별도 실측해 공급 manifest의 값을 덮어쓰지 않고 보존했다. 샘플 클리핑은 0이며 true peak는 모두 0 dBTP 미만이다. 이는 대사·발음·연기·자막 동기화의 청취 승인과 다르다.

| 슬롯 | v01 길이 | v02 길이 | 목표 길이 |
|---|---:|---:|---:|
| CH-06 | 4.24초 (통과) | 4.32초 | 3.6~4.3초 |
| CH-07 | 4.76초 | 5.16초 | 3.8~4.5초 |
| CH-08 | 4.40초 | 4.68초 | 3.6~4.3초 |
| CH-09 | 5.48초 | 5.08초 | 3.8~4.5초 |
| CH-10 | 5.72초 | 6.52초 | 4.0~4.8초 |

## 다음 연결 조건

현재 `SignalBreakerEndings.definition()`과 작전 콘텐츠는 CH-01~05만 정의하며 CH-06은 없음이 회귀 계약이다. 제공 파일만으로 CH-06~10의 장면·작전·화면·해금·저장 계약을 생성하지 않는다. 후보의 speakerId/lineId는 null, runtimeIntegrated와 finalListeningApproved는 false다.

Director의 CH-06~10 엔딩 명세(대사 text_id, 화자, human shot 시간, 대응 작전)와 후보 선택이 도착하면 기존 exact speaker/transcript/hash/fit 계약에 연결한다. 목표 초과 음성은 장면 시간을 승인받아 조정하거나 재녹음해야 한다. 청취 페이지는 후보 비교용이며 게임 보상·아카이브·오프라인 프리캐시와 연결되지 않는다.

## 검증 및 기존 CI 정합성 보완

- 전체 회귀: 2,039 PASS / 1 SKIP, 브레이커 회귀: 198 PASS.
- 타입 검사·운영 빌드 PASS. Chromium에서 후보 10개 디코딩과 실제 재생, 단일 재생, 모두 정지, 모바일 가로 넘침 없음 확인.
- 기존 G8-A 오디오 브라우저 CI는 현재 준비중인 디펜스 모드에 옛 `현장 디펜스` 버튼으로 진입해 실패했다. 현재 데스크톱·모바일의 준비중 프리뷰와 전투 진입 차단을 검증하도록 보완했다. 보고서는 `modeLockVerified: true`, `actualPlayVerified: false`와 보류 사유를 기록한다. 디펜스가 다시 플레이 가능해지면 기존 실제 플레이 오디오 검증을 그대로 실행한다.
- trusted click은 화면 밖 버튼을 먼저 스크롤한 뒤 실제 입력을 전달한다. 모바일에서도 같은 프리뷰 열기·닫기 경로를 확인했다.

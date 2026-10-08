# NEW PSI 자산 출처 및 사용권 기준선

기준일: 2026-10-08. B0 부분 감사이며 전체 게임의 법적 사용권 확인 완료를 의미하지 않는다.
저장소 메타데이터와 사용자의 직접 확인을 구분한다. 기술 검사, 사용권, 최종 화면/청취 승인은 서로 대체하지 않는다.

## 확인한 범위

| 자산 | 저장소 근거 | 사용권 기록 | 최종 승인/남은 확인 |
| --- | --- | --- | --- |
| Pretendard Variable 1.3.9 | `public/fonts/README.md`, `Pretendard-LICENSE.txt` | SIL OFL 1.1 동봉; 원본 자체 호스팅 기록 | 배포 시 라이선스 보존. 워드마크 변형 권리와 별개 |
| Black Han Sans Regular | 같은 README, `BlackHanSans-OFL.txt` | SIL OFL 1.1 동봉 | 라이선스 보존 |
| Chakra Petch Bold | 같은 README, `ChakraPetch-OFL.txt` | SIL OFL 1.1 동봉 | 라이선스 보존 |
| 타격 효과음 9개 | `content/survivors-impact-sfx-ingest.json` | Manus generate_sound_effect; 사용자가 게임 공개 배포권 확인 완료라고 답변. 9개 모두 rightsApproval=true | CANDIDATE, listeningApproval=false. 공개 배포권 확인을 최종 청취 승인으로 승격하지 않음 |
| 기존 여성 음성 12개 | `content/survivors-player-voice-v1-ingest.json` | 사용자 Manus 제작 확인; 제공자 라이선스 근거 미제공 기록 | 통합 요청은 있음. 모델/화자 ID, 제공자 권리, 최종 청취 Lock은 미확정 |
| P1 음성 14개 | `content/survivors-player-voice-p1-v1-ingest.json` | Manus generate_speech; 제공 메타데이터의 사용권 Unknown | 내부 모델 미노출. 최종 청취 Lock 미확정 |
| covert 음성 26개 | `content/survivors-player-voice-covert-v1-ingest.json` | 통합 요청 있음; 제공자 상업 사용권 미확정 기록 | 최종 청취 승인 미확정. 제작 콘셉트가 주인공 정체성 변경의 승인 근거는 아님 |
| male engineer 음성 26개 | `content/survivors-player-voice-engineer-v1-ingest.json` | 통합 요청 있음; 제공자 상업 사용권 미확정 기록 | 최종 청취 승인 미확정. 선택 화자와 공식 주인공은 구분 |
| SFX V2 43개 원본 팩 | `content/survivors-sfx-v2-source-pack.json`, `survivors-sfx-v2-ingest.json` | 원본 Manus WAV 및 팩 해시 기록 있음; 이 기록만으로 제공자 약관 확인을 주장하지 않음 | V2 드론 계열은 Director 거부 기록. 최종 자산으로 재승격 금지 |
| 드론 SFX V3 6개 | `content/survivors-drone-sfx-v3-ingest.json` | 출처 팩 기록과 기술 검증 있음; 법적 사용권 완료로 확대하지 않음 | technical=true, perceptual=false. 폰/헤드폰/PC/30회 반복 청취 필요 |

## 승인 기록 원칙

- 사용자 타격 효과음 공개 배포권 답변은 해당 첨부 팩에만 적용한다. 다른 음성/음악/원화 전체로 확대하지 않는다.
- 이번 감사는 기존 runtime 연결을 변경하지 않는다. 권리가 미확정인 자산을 신규 공개 범위로 확장하거나 최종 Lock으로 표시하지 않는다.
- 2026-10-08 사용자에게 음성 네 버전의 공개 배포권을 별도로 질문했고, 기존 여성/P1/covert/male engineer 모두 확인 완료라는 직접 답변을 받았다. 위 표의 Unknown/unconfirmed는 감사 당시 ingest 원본 기록이며, 현재 사용자 확인 상태는 네 버전 모두 공개 배포권 확인 완료다. 제공자 약관 문서 자체는 전달받지 않았고 최종 청취 승인은 별도다.
- 사용자 확인을 받으면 확인 날짜, 해당 파일/팩, 확인 주체를 기록한다. 제공자 약관 문서 미제공과 사용자 확인을 구분한다.
- 파일 변경 시 원본 및 납품본 SHA-256을 함께 보존한다. 후보 교체는 기술 검사와 Director 승인 후 수행한다.

## 파일 기준선 추가 확인

2026-10-08 저장소 납품본을 ingest 메타데이터와 대조했다. 아래 확인은 파일 존재와 SHA-256 일치만 의미하며 권리 또는 최종 승인 기록을 변경하지 않는다.

| 범위 | 파일 대조 | 출처/승인 경계 |
| --- | --- | --- |
| Survivors Score V2 | `content/survivors-score-v2-ingest.json`의 9개 runtime URI 모두 존재, 납품본 SHA-256 모두 일치 | 원본 MP3 이름/해시가 기록되어 있으나 제공자 약관·공개 배포권 확인 근거는 이 목록에 없음. 최종 청취 승인 별도 |
| Survivors SFX V1 | `content/survivors-sfx-v1-ingest.json` 중 runtime URI가 있는 8개 모두 존재/해시 일치 | 15개 기록 중 나머지 7개는 `id=null`, `AWAITING_DIRECTOR_MAPPING`이며 URI가 없는 미배치 후보. 운영 파일 누락으로 계산하지 않음. CANDIDATE/listeningApproval=false 유지 |
| Episode 01 배경 | `content/episode01/final-art-ingest-manifest.json`의 8개 target_path 모두 존재/해시 일치 | ChatGPT image generation batch 및 runtime WebP 변환 기록. archive/ingest 검증은 제공자 약관 확인이나 최종 시각 승인과 다름 |

음성 네 버전과 타격 효과음에 대한 사용자 권리 확인을 위 음악·SFX V1·배경에 확대 적용하지 않는다. 이번 문서 감사는 runtime, 원본 ingest 또는 승인 상태를 수정하지 않는다.

## 남은 권리 확인

- 타이틀 로고/대표 인물/배경/장비/애니메이션 원화 전체의 파일별 출처 및 제공자 약관.
- 음악, SFX V1, 본편 성우/음원 전체의 파일별 권리와 최종 청취 승인.
- 외부 공개용 키 아트/스토어 이미지 및 상표 검색. 상표 등록 가능성이나 법적 권리 확보를 주장하지 않는다.

본 목록만으로 B0 전체 또는 Phase D Final Art/Sound Lock을 완료 처리하지 않는다.

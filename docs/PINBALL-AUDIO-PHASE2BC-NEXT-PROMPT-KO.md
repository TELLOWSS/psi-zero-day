# 마누스·제미나이 전달용 — 2-B 재납품 및 남은 제작

다음 내용을 기존 제작 원본과 함께 전달해주세요.

```text
industrial_pinball_phase2b_2c.zip을 검사했습니다. 컨베이어 효과음 7개는 CRC와 원본 크기가 일치하며, 그중 가동/운전/정지/타격/성공 5개를 게임에 적용했습니다.

음악은 현재 ZIP 손상 때문에 적용할 수 없습니다. 중앙 디렉터리의 오프셋이 실제 위치와 다르고 full_mix/tension/base의 DEFLATE 데이터가 오류를 냅니다. special 로컬 헤더도 찾지 못했습니다. groove만 정상 복구됩니다. 기존 WAV 원본에서 ZIP을 새로 만들어 재납품해주세요. 손상된 압축 파일을 재압축하는 것으로 처리하지 마세요.

1. 음악 WAV 5개를 따로도 전달하고, 가능하면 음악 ZIP과 컨베이어 ZIP을 분리해주세요. ZIP 생성 후 전체 압축 해제 및 CRC 검사, 각 WAV SHA-256/바이트 크기/샘플 수를 기록해주세요. 업로드된 파일을 다시 다운로드해 검사해주세요.
2. 같은 악보의 base/groove/tension/special/full_mix를 유지하고, 동일 샘플 수·시작점과 stem 합산 일치를 검증해주세요. 실제 제작 방식은 numpy 합성으로 명시해주세요. 이미 작성한 측정값을 복사하지 말고 최종 전달 파일을 재측정해주세요.
3. 남은 8개 테이블: foundry/tunnel/tower/power/water/rail/demolition/zeroday. 기존 PINBALL-AUDIO-PHASE2-NEXT-PROMPT-KO.md 명세대로 물리적 기믹에 맞는 가동/운전/정지/방출/충돌/성공/데모를 순차 납품해주세요.
4. v03 공통 타격/패들 보정과 pneumatic_payout 음악 리마스터는 기존 원본이 필요합니다. industrial_pinball_audio_phase2.zip과 Pneumatic_Payout.mp3를 함께 참고하고, MP3 기반 편집은 무손실 복원이라고 표시하지 마세요.
5. 실물 기기 청취나 믹스 마스킹 검사를 하지 못했다면 미검증이라고 남겨주세요. 오디오 샘플과 반복 데모를 함께 제공해주세요.
```

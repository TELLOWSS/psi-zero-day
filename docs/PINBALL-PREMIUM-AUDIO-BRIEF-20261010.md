# 공장 핀볼 프리미엄 사운드 제작 패키지

## 목표와 현재 상태

금속 구슬이 실제 기계를 움직이는 촉감, 세 번의 기회마다 기대감, 크레인 연쇄 성공의 시원한 해방감을 만든다. 소리의 크기로 보상을 표현하지 않는다. 반복음은 짧고 편안하게, 큰 보상만 넓고 풍성하게 표현한다.

현재 핀볼은 기존 강재·콘크리트·피니셔 타격음을 재사용한다. 이 문서는 신규 제작 명세이며 신규 음원 납품 또는 청취 승인 완료를 뜻하지 않는다. 현재 세션에는 Gemini/Manus 직접 제작 도구가 없다. 기존 impact-sfx-v1 입고 기록에는 Manus generate_sound_effect 제작 이력이 있다.

## 제작할 소리

| 파일 접두사 | 순간 / 물성 | 길이 | 후보 수 |
| --- | --- | --- | --- |
| pinball_launch | 스프링 압축 해제와 구슬의 짧은 레일 질주 | 0.4–0.7초 | 3 |
| pinball_flipper_up | 솔레노이드 클릭, 단단한 패들 작동 | 0.06–0.12초 | 4 |
| pinball_flipper_down | 작동음보다 작은 기계 복귀 | 0.06–0.12초 | 3 |
| pinball_bumper | 강재 접촉 어택 + 따뜻한 짧은 공명 | 0.15–0.3초 | 4 |
| pinball_rubber | 탄성 고무 반동과 미세한 구슬 접촉 | 0.08–0.18초 | 4 |
| pinball_rail | 얇고 짧은 강재 레일 접촉 | 0.08–0.2초 | 4 |
| pinball_crane_motor | 모터 상승과 체인 장력, 시작/지속/끝 분리 | 총 1.2초 | 2 |
| pinball_crane_reward | 기계 잠금 해제 + 짧은 상승 음악 결말 | 1–1.8초 | 2 |
| pinball_ball_save | 위험에서 돌아오는 빠르고 밝은 확인음 | 0.3–0.5초 | 2 |
| pinball_drain | 구슬 회수 홈의 짧은 구름 소리 | 0.3–0.6초 | 3 |
| pinball_session_result | 따뜻한 현장 퇴근 느낌의 만족스러운 마침 | 2–3초 | 2 |
| pinball_theme | 112 BPM, 향수 있는 아케이드와 실제 공장 질감 | 60–90초 | 3곡 비교 |

총 효과음 후보 33개와 음악 후보 3곡. 첫 제작은 범퍼·패들·고무·크레인·음악 각 1개로 방향부터 검증한다. 합격한 질감만 확장한다. 음악과 효과음은 별도 파일이며, 음악 생성 결과를 잘라 정밀 접촉음으로 간주하지 않는다.

## Gemini 음악 요청문

```text
Create an original instrumental game music candidate for PSI ZERO DAY's premium miniature factory pinball. 112 BPM, warm retro arcade optimism with polished contemporary production. A memorable four-note motif, rounded analog bass, restrained electric piano, subtle brushed-metal percussion, and a small uplifting brass response. The player is relaxing after an industrial work shift: playful competence and relief, not danger or aggressive combat. No vocals, no alarms, no copyrighted melody imitation. Keep midrange space for rapid mechanical impacts. Avoid harsh high hats, constant risers, crushing limiting, and exaggerated sub bass. Build gentle variation while keeping a stable pulse. Aim for a 60–90 second repeatable bed with no abrupt ending; if the service cannot make a seamless loop, deliver a complete candidate and state that limitation. Provide the actual audio file and available native output specifications. Do not claim separate stems unless they are actually generated separately.
```

후보는 평상시와 연쇄 성공 중에 모두 들어본다. 음악 전환으로 루프가 끊기지 않도록 한다. 가사는 넣지 않는다.

## Manus 효과음 요청문

```text
Produce an original isolated game sound effect, not background music, for a detailed factory pinball machine.
Event: [table event]. Material and action: [table description]. Duration: [table duration].
Use convincing close-up mechanical Foley: a crisp physical attack, believable material resonance, controlled decay. Premium miniature industrial machine, neither toy cartoon nor sci-fi weapon. No voice, musical bed, room noise, unrelated impacts, excessive reverb, or harsh metallic screech. Keep repeated playback comfortable on phone speakers and headphones. Each variant must change microtexture without changing perceived volume or event identity.
Return a real audio file per variant, preferably dry mono WAV at native quality. State actual sample rate/bit depth; do not upsample and call it improved fidelity. If sound-effect generation is unavailable, report it rather than substituting a song. Provide creation source, usage terms, and filenames pinball_[event]_v01_[a-d].wav. Spatial tails and music must be separate files when available.
```

## 납품과 게임 연결

- 原本は別バージョンとして保持する。目標マスターは48kHz/24bit WAV、効果mono、音楽stereo。実際の出力品質を記録し、圧縮原本の変換を品質回復と呼ばない。
- 候補保存先：`public/assets/survivors/pinball/audio-candidates-v1/`。生成元、権利条件、SHA256、時間、チャンネル、無音、ピーク、聴取状態をmanifestに記録する。音源がない空manifestを完成品として登録しない。
- 音楽の開始目標は-18 LUFS-I、納品true peakは-1 dBTP以下。短い効果音はLUFS一律正規化を避け、ピークと反復時の体感で合わせる。
- 生成段階の数値保証を信用せず、デコード後のクリップ、開始クリック、途切れた余韻、ループ境界を測定する。
- 最終接続では音声バッファを開始前に準備する。衝突ごとのファイル読込は避ける。再生は物理イベントに連動し、描画フレームの回数で増やさない。
- パドルの押下/復帰は角度変化に連動し、押しっぱなしで連打しない。レールは接触速度の閾値と同一接触の短い抑制を設ける。強度差は音量だけでなく音色で表す。
- 衝突は左右位置に応じた控えめな定位、低速接触は小さく、範囲を制限した速度依存。monoでもイベントの意味を保つ。
- 同時効果は最大8声を開始目標にし、低優先レール音から整理する。連鎖報酬時は音楽を約3dBだけ下げ、短いattackと約0.4秒releaseで戻す。
- 音消し・停止・非表示・終了では全音と予約を停止する。復帰で古い衝突を鳴らさない。音楽の自動再生許可はユーザー操作で取得する。

## 합격 조건

イヤホン、PC、スマートフォンmonoで実際の3球をプレイして判断する。同音量で旧音と比較し、音量差を品質差と誤認しない。目を閉じても強い反発・柔らかい接触・大成功・球回収を判別できること。10分の反復で高域疲労がなく、画面の接触時刻と音が一致し、連鎖中も操作音が聞こえること。

技術検査合格は品質の最終承認ではない。候補をCANDIDATEとして試聴し、Directorの聴取判断後に採用する。採用前に既存音を上書きしない。

## 기능 확인 출처

- Google公式音楽モデル：https://deepmind.google/models/lyria/
- Manus公式音楽生成案内：https://www.manus.im/tools/ai-music-generator

音楽生成案内は個別Foley、任意のWAV規格、独立stemの対応証明ではない。利用画面で実際の出力を確認する。


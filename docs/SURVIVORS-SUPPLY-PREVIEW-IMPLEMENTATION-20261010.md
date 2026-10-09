# 슈팅 보급 구매 전 실제 변화

스토리·애착·재플레이 기획 A의 '없는 효과 안내 없음'과 C의 구매 회귀 범위. 기존 보급 item.apply를 실제 상태의 깊은 복사본에만 적용해 현재→구매 후 변화량을 표시한다. 가격·적용 함수·구매·보상·저장·상한 규칙 변경 없음. HP/maxHP/speed/damageMultiplier/critRate/dashMaxCooldown/cooldownReduction/pickupRadius만 읽기 투영한다.

구매 후 변화 details는 구매 전 카드에만 표시한다. 실제 변화가 없으면 무변화 안내이며 구매 차단 규칙을 새로 만들지 않는다. 치명타/공격 재사용 감소는 %, 대시는 초 단위다. 구매 완료 카드에는 이미 적용된 효과를 다시 예측하지 않는다.

집중10/type/Vite build 통과. 실제 source shop fixture 3viewport에서4개 미리보기/상태 원문 불변/넘침/오류 확인, 폰 세로 직접 확인. artifact는 artifacts/supply-preview/report.json/3PNG. 고정 선택 fixture이며 모든8상품 자연 구매·새 웨이브 재개·실기기 검증은 아니다. healer cap/cooldown cap/HP 두 필드는 함수 테스트로 구분. 전체 회귀는 이전1924이며 이번 변경 전체 재실행은 아직 남았다. 동기화 없음.

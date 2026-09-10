# Persistence 경계

SaveEnvelope/ProfileEnvelope 계약은 src/domain/save.ts에 있다.
이후 StoragePort에서 읽은 문자열을 검증하고 버전별 마이그레이션을 마친 뒤 엔진에 전달한다.
TASK-001은 실제 저장·체크섬·마이그레이션을 구현하지 않는다.

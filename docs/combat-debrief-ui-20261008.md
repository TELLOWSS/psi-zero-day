# Combat HUD and Debrief UI

Presentation-only continuation of the tactical UI refresh.

- Existing HP facts expose progressbar semantics; level, health, timer, wave and score use instrument numerals.
- Victory and defeat share a stateless result summary. Earned PSI is prominent and truthfully supports zero; no bonus, score, grade, wear or unlock calculation is added.
- Victory summary precedes the longer mission/maintenance/growth records. Scrollable records and fixed next-operation/retry actions retain existing behavior.
- Result status icons use Lucide. Unframed stat rows and mission records replace nested decorative panels.
- Existing rules, input timing, engine state, save format and next-stage selection remain unchanged.

Verification: SSR tests cover zero and large authoritative values and readonly inputs. Browser QA uses real launch/pause HUD and explicit test-only victory/defeat presentation fixtures at desktop/mobile portrait/landscape sizes. Fixture screenshots are not evidence of an actual earned clear; existing game flow regressions remain mandatory.

No new artwork or Production Lock claim.

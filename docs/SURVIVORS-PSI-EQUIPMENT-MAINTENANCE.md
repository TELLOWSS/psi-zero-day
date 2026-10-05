# PSI equipment maintenance

## Runtime rules
- Preparation and paused patrol expose the PSI purchase/repair shop; no cash checkout.
- Opening the shop pauses patrol. Closing it does not resume simulation automatically.
- One item per category, up to six categories. Fitting supports a multi-slot draft, facing and zoom, stat comparison, and one atomic purchase/equip quote.
- Ownership is permanent. Legacy owned items start at 100 durability.
- A successful stage clear consumes 15 durability from each item used at any point in that patrol, once per item. Defeat consumes none.
- Zero durability disables equipment, not ownership. Repair restores 100; cost is ceil(price * 0.20 * missing / 100). Repair does not equip automatically.
- Mid-patrol changes preserve elapsed time, damage and weapon progression. Health is not healed; shield and tactic supplies are granted only on first use of each item in the patrol.
- The wallet stores credits and inventory together. The legacy credit mirror is best effort, not authoritative.

## Verification and approval
- Unit/integration coverage: legacy migration, wear, repairs, batch purchases, insufficient funds, broken gear, paused loadout changes, first-use grants, wallet failures and clear settlement.
- Responsive targets: desktop, 390x844 portrait and 844x390 landscape.
- Economy values are tunable initial values. Director review should assess reward-to-maintenance ratio, first-time player affordability and stage difficulty over multiple consecutive clears.
- Existing art and sound remain their current candidate status; these controls do not imply cinematic production lock.

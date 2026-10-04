# PSI credit equipment

Earned PSI credits buy permanent equipment in the existing R&D headquarters. There is no real-money checkout, random paid pack, expiry, or repeat purchase. Ownership and wallet balance share a single local save; purchase fails without deduction if that save cannot be written. Legacy credit balances migrate on first use. Data stays on this device/browser.

Six categories, sixteen items; one equipped item per category. Equip/unequip before patrol; the next initialized run receives the loadout. This does not grant weapon levels or bypass evolution recipes. Categories: instruction effectiveness, response cadence/precision, collection/mobility, protection/recovery. Higher price buys a specialized or stronger capability, while existing late-run threats and difficulty remain unchanged.

References checked 2026-10-04: Fortnite official Item Shop (https://www.fortnite.com/item-shop), Call of Duty official bundles (https://www.callofduty.com/en/store/bundles), EA Apex currency guide (https://help.ea.com/en/articles/apex-legends/crafting-and-currency/). These are three prominent reference games, not a verified global popularity ranking. Borrowed concepts: collection cards, identifiable equipment blueprints, clear ownership/equipping and aspirational long-term purchases. Do not attribute PSI stat advantages to those games' cosmetic purchases. Dedicated sixteen-cell premium equipment raster art replaces reused shop icons. This is a new production candidate, not a completed browser visual or Android performance lock.

Validation: full regression 1144 passed / 1 skipped; premium intervention and store tests passed; typecheck and production build passed. Browser visual and real Android performance/play balance remain pending: Chromium is unavailable in this workspace. Review earning pace versus 700–5200 PSI prices and higher difficulty before calling the economy locked.


## Intervention behavior

- Shock mantle: +20 HP, 45 shield. Contact and crane damage drain shield first; overflow damages HP. Only complete depletion starts an 18-second refill. Partial shield does not regenerate continuously.
- Rescue wing: 0.8 HP/s plus 15 shield with 24-second refill. When combined with mantle, shield capacity is 60 and the faster generator refills the shared capacity after 18 seconds.
- Inspection wing: cart/gas movement at 80% within 180 world units. Does not change worker movement, falling material or warning clocks.
- Predictive watch: 0.9 shout charge per simulation second, capped at 100; two additional support calls. Barrier forge grants three additional control lines. Same-category equipment cannot stack.
- Stronger broadcast, cadence, precision and recovery equipment complement existing weapons. No weapon level or evolution ingredient is granted. Equipment cadence pauses with the simulation.

## Premium artwork provenance

Built-in image_gen generated a 1254×1254 atlas, optimized as WebP at quality 90 (339896 bytes). Runtime path: `public/assets/survivors/premium-equipment-v2.webp`; checksum and cell layout: `content/art/survivors-premium-equipment-v2.json`. Browser caches a single atlas for shop cards, close-up details, loadout HUD, companion drone and shoulder-mounted equipment badge. The character animation remains the existing production sprite; this is equipment overlay, not a new full-body outfit animation.

Generation prompt: one production atlas for PSI ZERO DAY construction safety action game; exactly four columns by four rows, equally sized square cells, dark navy background, no UI/text/people/guns. Center one isolated premium construction-safety object per cell in a three-quarter product view. Cinematic hard-surface rendering, brushed titanium, black polymer, orange safety paint, glass, restrained cyan/amber emission, clean silhouettes and empty margins. Row 1: communication headset, satellite backpack, radio relay core, precision visor. Row 2: magnetic spool, powered safety boots, armored harness, regeneration cartridge. Row 3: broadcast megaphone, synchronized wrist controller, extraction backpack, shoulder armor. Row 4: inspection drone, mobile barricade projector, rescue drone, hazard radar watch. Studio key and rim lighting, crisp metal highlights, subtle wear and contact shadows; no object crosses its cell.

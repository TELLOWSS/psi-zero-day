# SURVIVORS visual assets v2

Director requested a high-quality, gameplay-readable map and distinct risk sprites. Built-in image generation produced a Stage 01 loading-yard ground plate and transparent industrial sprite atlas. These are original project assets; final Director visual acceptance remains pending. No engine coordinates, collision radii or progression rules changed.

Ground: `public/assets/survivors/stage-01-ground-v2.webp`, 1564×1006, mapped to the existing 1400×900 world. The center remains open, with peripheral materials, slab texture, drainage and restrained work lights. Stage 01 only; other stage themes retain their existing rendering. Generation did not deliver the requested 2800×1800 resolution, and no artificial upscale is claimed.

Atlas: `public/assets/survivors/risk-atlas-v2.webp`, 1300×1210 with alpha. Worker, material trolley and concrete-debris source rectangles are rendered as grounded billboards. Equipment blower candidate is not used as a gas source. Existing gas warning and crane boss art remain. Mirroring and small bob motion are presentation only; no eight-direction animation is claimed.

Final generation prompts: ground — orthographic night construction loading yard, quiet concrete central play space, central green safety corridor, edge-only materials and drainage, no people/UI/labels or interior obstacles. Atlas — transparent quarter-view unhelmeted worker with radio, loaded yellow industrial trolley, concrete/rebar fragments and ventilation blower, separated silhouettes, no weapons/gore/UI/labels.

Director also requested exact shout copy: `작업중지 돌아버려 씨~!!!`. This is the displayed cut-in line. Director's voice recording is pending; no synthetic replacement is added.

Validation requires typecheck, full regression/build, real SURVIVORS smoke screenshots at 360×800, 390×844, 844×390 and 1440×900. Device performance, full growth/ultimate/results and listening remain separate pending gates.

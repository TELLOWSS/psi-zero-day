# PSI : ZERO DAY — Korean Text Lock

Status: LOCKED for production UI and visual media.

## Goal
Prevent Korean typos, broken glyphs, pseudo-Korean lettering and inconsistent spacing from entering commercial builds while preserving the approved visual direction.

## Core rule
Production artwork must not contain Korean UI copy baked into pixels.

Backgrounds, character art, CG and decorative images are produced as clean art. Korean labels, dialogue, mission text, warnings, buttons, names, site-zone labels and notices are rendered by the game UI from localization data.

Exception: a deliberately authored environmental sign may be used only when its exact Korean source text is separately approved and the sign is not generated as pseudo-text. Default production art should remain text-free.

## Authoritative Korean sources
Player-visible Korean text should come from:
- `content/localization/*-ko.json`
- `content/localization/ko.json`
- `content/episode01/*-ko.json`
- `content/episode01/ko.json`

Do not copy Korean UI text manually into image-generation prompts as final rendered lettering.

## Typography
Use the operating system Korean UI fonts before generic Latin fonts:

`Apple SD Gothic Neo -> Malgun Gothic -> Noto Sans KR -> Segoe UI -> system sans-serif`

Rules:
- keep Korean words intact with `word-break: keep-all` where practical,
- never substitute decorative Latin display fonts for Korean body/dialogue text,
- do not rely on AI-generated lettering,
- avoid forced letter spacing on long Korean body copy,
- verify at desktop and mobile sizes before release.

## Copy quality gate
Korean catalogs must be valid UTF-8 JSON and pass automated checks for:
- Unicode replacement characters,
- zero-width/invisible corruption,
- isolated Hangul jamo caused by broken composition,
- non-NFC Korean strings,
- accidental leading/trailing whitespace,
- empty player-visible values.

Automated validation catches encoding and structural defects. Natural-language spelling and wording still receives a human/read-through pass before a production release.

## Approved spacing conventions
Use these forms consistently in player-visible copy:
- `위험 신호`
- `현장 맵`
- `작업 구역`
- `진입 통로`
- `신입 근로자`
- `기본 훈련`
- `보고 훈련`
- `보조 도구`
- `주 도구`

Identifiers and localization keys may keep compact English-style tokens; this rule applies to displayed Korean text.

## Image-generation reject rules
Reject visual media containing:
- misspelled Korean,
- malformed Hangul,
- pseudo-Korean glyphs,
- random lettering on helmets or PPE,
- generated company/project/site names,
- mission/HUD/dialogue Korean baked into the image.

When text is visually required in a mockup used only for concept review, treat it as non-production reference material. Final game screens rebuild that text with UI components.

## Release rule
`npm run copy:ko-check` is part of `release:check` and therefore also part of `release:production-check`.

A build passing this gate does not mean every sentence is stylistically perfect; it guarantees the Korean source files are technically clean and keeps all editable Korean text outside generated production artwork.

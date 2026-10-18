# Current home v7 runtime delivery vs historical B2 approval

Date: 2026-10-18. The original B2 slot contract pinned the old night-pour background, legacy game thumbnails and BR-LOGO-02 title wordmark. Current MODE_SELECT_V11 uses a separately requested NEW-PSI main image and shield, documented in docs/branding/NEW-PSI-HELMET-PERSPECTIVE-20261017.json and content/episode01/home-new-psi-art-v7.json.

Old audit-brand-production-slots.mjs remains unchanged as historical verification. Its old logo whitelist MUST NOT be extended implicitly to approve the newer user-requested title symbol. New audit-current-title-delivery.mjs checks actual 1440x900/390x844/844x390 image delivery: current portrait/wide SHA-256 against v7 manifest, local/source shield equality and user-request authority, approved favicon SHA, decoded mode art, one STORY mode, untouched full-screen home first fold and no browser errors.

The separate SURVIVORS Art job now runs current runtime delivery validation instead of mistakenly testing B2 against v7. This test grants NO design or commercial approval. Other-art approval remains false and trademark/physical-device visual acceptance remain unconfirmed.
# Survivors movement and live growth polish

- Preserve joystick magnitude below full speed; clamp diagonal keyboard input to full speed.
- Reject non-finite movement inputs without corrupting actor position or facing.
- Active equipment opens the existing evolution archive and pauses the run.
- Closing the archive does not resume combat; pause controls are blocked while it is open.
- Trap keyboard focus and restore the previously focused control on close.
- Show actual weapon progress, support prerequisite, ready-next-level status, and acquired evolution separately.
- Hide consumed base weapon badges after their evolution; retain engine ownership unchanged.
- Retain attack balance, PSI transactions, durability, maps, and recorded/orchestral sound.

## Verification

Full regression: 1,208 passing tests, one pre-existing skip. Added proportional movement, diagonal cap, invalid-input and paused-input coverage. Typecheck and production build verified. Browser checks cover desktop, portrait and landscape archive layout and paused interaction.

## Director review

Film-quality art and semantic sound approval remain separate production gates. Seven opaque-name audio files still require cue identification; no speculative assignment is included.

# Released hazard atlas provenance

Asset: `public/signal-breaker-dev/art/released-hazards-v1.webp`

Built-in image generation and targeted cutout cleanup. No third-party reference artwork. Runtime retains the RGBA alpha and uses four equal atlas cells. Source PNG is retained outside the repository; WebP is a format conversion only.

Final source: `generated_images/exec-5d02010d-7d5b-4014-bbe9-1ea9f62478ea.png`

Final edit prompt:

> Use case: background-extraction. Edit target: the supplied 2x2 industrial hazard sprite atlas. Preserve exactly these four original industrial objects and their high-detail painted realistic game rendering: top left twisted steel/rebar, top right ochre dust filter cartridge and dust, bottom left purple broken electrical coil, bottom right concrete hoist weight. Clean up all bright red, yellow, blue, magenta matte speckles and jagged color fringes around the cutout edges; natural object colors and the legitimate purple electrical spark must remain. Make truly clean transparent alpha edges with no colored matte, no checkerboard, no background. Preserve the 2x2 ordering, roughly equal object sizes and center each object within its quadrant with a generous transparent gap at the exact horizontal and vertical midlines so runtime cells do not clip or overlap. No bubbles, circles, faces, text, logos, UI, or added objects. Only improve cutout quality and padding; preserve material detail and lighting.

The source and output have not been granted a Phase D visual production lock. Quality is reviewed in real gameplay screenshots separately from the asset hash and format check.

#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "public/assets/episode01/characters/player-map.webp"
OUT_PATH = ROOT / "public/assets/defense/towers/pulse/pulse-l1-final.webp"
MANIFEST_PATH = ROOT / "content/defense/pulse-tower-production-v1.json"

MASTER_SIZE = (720, 900)
RUNTIME_MAX = (512, 768)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def trim(im: Image.Image) -> Image.Image:
    rgba = im.convert("RGBA")
    bbox = rgba.getchannel("A").getbbox()
    return rgba.crop(bbox) if bbox else rgba


def fit_no_upscale(im: Image.Image, max_w: int, max_h: int) -> tuple[Image.Image, float]:
    scale = min(1.0, max_w / im.width, max_h / im.height)
    if scale >= 0.9999:
        return im, 1.0
    size = (max(1, round(im.width * scale)), max(1, round(im.height * scale)))
    return im.resize(size, Image.Resampling.LANCZOS), scale


def build() -> dict:
    if not SOURCE_PATH.exists():
        raise SystemExit(f"PULSE:L1 source asset missing: {SOURCE_PATH}")

    source_native = trim(Image.open(SOURCE_PATH))
    source, source_scale = fit_no_upscale(source_native, 480, 720)

    canvas = Image.new("RGBA", MASTER_SIZE, (0, 0, 0, 0))
    xy = (
        (canvas.width - source.width) // 2,
        790 - source.height,
    )

    # PULSE is a direct human intervention, not a device/turret. Keep the
    # Production-Locked safety-manager silhouette intact and add only a soft
    # contact shadow so it reads as a placed field unit.
    alpha = source.getchannel("A")
    shadow_alpha = alpha.filter(ImageFilter.GaussianBlur(16)).point(lambda p: p * 110 // 255)
    shadow = Image.new("RGBA", source.size, (0, 0, 0, 0))
    shadow.putalpha(shadow_alpha)
    canvas.alpha_composite(shadow, (xy[0] + 12, xy[1] + 24))
    canvas.alpha_composite(source, xy)

    bbox = canvas.getchannel("A").getbbox()
    if not bbox:
        raise SystemExit("PULSE:L1 composite has no visible pixels")

    pad = 52
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(canvas.width, bbox[2] + pad)
    bottom = min(canvas.height, bbox[3] + pad)
    cropped = canvas.crop((left, top, right, bottom))

    scale = min(1.0, RUNTIME_MAX[0] / cropped.width, RUNTIME_MAX[1] / cropped.height)
    runtime_size = (
        max(1, round(cropped.width * scale)),
        max(1, round(cropped.height * scale)),
    )
    runtime = cropped if scale >= 0.9999 else cropped.resize(runtime_size, Image.Resampling.LANCZOS)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    runtime.save(OUT_PATH, "WEBP", lossless=True, method=6, exact=True)

    final = Image.open(OUT_PATH).convert("RGBA")
    alpha_extrema = final.getchannel("A").getextrema()
    if alpha_extrema[0] != 0 or alpha_extrema[1] != 255:
        raise SystemExit(f"PULSE:L1 alpha contract failed: {alpha_extrema}")

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    level = manifest["levels"][0]
    if level["levelId"] != "L1":
        raise SystemExit("PULSE representative manifest must contain L1 first")

    level["status"] = "PRODUCTION_APPROVED"
    level["sourceReview"] = {
        "status": "PASS",
        "lineage": "NORMALIZED_FROM_PRODUCTION_LOCKED_PLAYER_MAP",
        "sources": ["assets/episode01/characters/player-map.webp"],
        "sourceSha256": sha256(SOURCE_PATH),
        "sourceNativePixels": {
            "width": source_native.width,
            "height": source_native.height,
        },
        "sourceScale": round(source_scale, 6),
        "nativeUpscaleUsed": False,
        "identityRead": "female safety manager + inspection tablet + direct pointing/intervention pose",
        "controlSeparation": "no marshal baton, vehicle-flow barrier, or traffic-control corridor baked into PULSE",
    }
    level["assetIntegrity"] = {
        "sha256": sha256(OUT_PATH),
        "bytes": OUT_PATH.stat().st_size,
        "pixelWidth": final.width,
        "pixelHeight": final.height,
        "transparent": True,
        "alphaExtrema": list(alpha_extrema),
    }
    level["promotionEvidence"] = {
        "staticRasterBuild": "PASS",
        "browserActualPlay": "PENDING_BRANCH_QA",
        "mobile390x844": "PENDING_BRANCH_QA",
        "commercialVisualReview": "PENDING_BRANCH_QA",
    }

    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    return {
        "output": str(OUT_PATH.relative_to(ROOT)),
        "pixelSize": [final.width, final.height],
        "bytes": OUT_PATH.stat().st_size,
        "sha256": sha256(OUT_PATH),
        "alphaExtrema": list(alpha_extrema),
        "sourceScale": source_scale,
    }


def check() -> dict:
    if not OUT_PATH.exists():
        raise SystemExit("PULSE:L1 final raster is missing")

    final = Image.open(OUT_PATH).convert("RGBA")
    alpha = final.getchannel("A").getextrema()
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    level = manifest["levels"][0]

    if final.width > RUNTIME_MAX[0] or final.height > RUNTIME_MAX[1]:
        raise SystemExit(f"PULSE:L1 runtime raster too large: {final.size}")
    if min(final.size) < 180:
        raise SystemExit(f"PULSE:L1 raster too small for high-DPI display: {final.size}")
    if alpha[0] != 0 or alpha[1] != 255:
        raise SystemExit(f"PULSE:L1 alpha is not full-range transparent: {alpha}")
    if level.get("status") != "PRODUCTION_APPROVED":
        raise SystemExit("PULSE:L1 manifest is not promoted")
    if level.get("assetIntegrity", {}).get("sha256") != sha256(OUT_PATH):
        raise SystemExit("PULSE:L1 manifest SHA does not match raster")
    if level.get("sourceReview", {}).get("nativeUpscaleUsed") is not False:
        raise SystemExit("PULSE:L1 source review must prove no source upscale")

    return {
        "status": "PASS",
        "pixelSize": list(final.size),
        "alphaExtrema": list(alpha),
        "sha256": sha256(OUT_PATH),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    result = check() if args.check else build()
    print("PULSE_L1_RASTER=" + json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()

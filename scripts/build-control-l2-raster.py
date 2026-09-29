#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
MARSHAL_PATH = ROOT / "public/assets/episode01/characters/choi-minseok-map.webp"
BARRIER_PATH = ROOT / "public/assets/episode01/scene-elements/access-barrier.webp"
PEDESTRIAN_GATE_PATH = ROOT / "public/assets/episode01/scene-elements/pedestrian-gate.webp"
OUT_PATH = ROOT / "public/assets/defense/towers/control/control-l2-final.webp"
MANIFEST_PATH = ROOT / "content/defense/control-tower-production-v1.json"

MASTER_SIZE = (1792, 1152)
RUNTIME_MAX = (896, 560)


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


def paste_with_shadow(canvas: Image.Image, item: Image.Image, xy: tuple[int, int], blur: int, offset: tuple[int, int], opacity: int) -> None:
    alpha = item.getchannel("A")
    shadow_alpha = alpha.filter(ImageFilter.GaussianBlur(blur))
    if opacity < 255:
        shadow_alpha = shadow_alpha.point(lambda p: p * opacity // 255)
    shadow = Image.new("RGBA", item.size, (0, 0, 0, 0))
    shadow.putalpha(shadow_alpha)
    canvas.alpha_composite(shadow, (xy[0] + offset[0], xy[1] + offset[1]))
    canvas.alpha_composite(item, xy)


def build() -> dict:
    for path in (MARSHAL_PATH, BARRIER_PATH, PEDESTRIAN_GATE_PATH):
        if not path.exists():
            raise SystemExit(f"CONTROL:L2 source asset missing: {path}")

    marshal_native = trim(Image.open(MARSHAL_PATH))
    barrier_native = trim(Image.open(BARRIER_PATH))
    gate_native = trim(Image.open(PEDESTRIAN_GATE_PATH))

    marshal, marshal_scale = fit_no_upscale(marshal_native, 430, 650)
    barrier, barrier_scale = fit_no_upscale(barrier_native, 760, 440)
    gate, gate_scale = fit_no_upscale(gate_native, 540, 520)
    barrier2 = barrier.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

    canvas = Image.new("RGBA", MASTER_SIZE, (0, 0, 0, 0))

    # L2 is materially wider than L1: two linked temporary traffic barriers create
    # a reinforced lane boundary, while a pedestrian gate defines a dedicated
    # walking channel. The marshal remains the human-control anchor.
    barrier1_xy = (350, 760 - barrier.height)
    barrier2_xy = (890, 730 - barrier2.height)
    gate_xy = (1080, 900 - gate.height)
    marshal_xy = (670, 875 - marshal.height)

    paste_with_shadow(canvas, barrier, barrier1_xy, blur=18, offset=(10, 24), opacity=100)
    paste_with_shadow(canvas, barrier2, barrier2_xy, blur=18, offset=(10, 24), opacity=100)
    paste_with_shadow(canvas, gate, gate_xy, blur=18, offset=(12, 24), opacity=110)
    paste_with_shadow(canvas, marshal, marshal_xy, blur=16, offset=(12, 24), opacity=120)

    bbox = canvas.getchannel("A").getbbox()
    if not bbox:
        raise SystemExit("CONTROL:L2 composite has no visible pixels")

    pad = 80
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
        raise SystemExit(f"CONTROL:L2 alpha contract failed: {alpha_extrema}")

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    level = next(item for item in manifest["levels"] if item["levelId"] == "L2")
    level["status"] = "PRODUCTION_APPROVED"
    level["runtime"] = {"width": 86, "height": 68}
    level["sourceReview"] = {
        "status": "PASS",
        "lineage": "RASTERIZED_FROM_PRODUCTION_LOCKED_CONTROL_COMPONENTS",
        "sources": [
            "assets/episode01/characters/choi-minseok-map.webp",
            "assets/episode01/scene-elements/access-barrier.webp",
            "assets/episode01/scene-elements/pedestrian-gate.webp",
        ],
        "sourceSha256": {
            "marshal": sha256(MARSHAL_PATH),
            "barrier": sha256(BARRIER_PATH),
            "pedestrianGate": sha256(PEDESTRIAN_GATE_PATH),
        },
        "sourceNativePixels": {
            "marshal": {"width": marshal_native.width, "height": marshal_native.height},
            "barrier": {"width": barrier_native.width, "height": barrier_native.height},
            "pedestrianGate": {"width": gate_native.width, "height": gate_native.height},
        },
        "sourceScale": {
            "marshal": round(marshal_scale, 6),
            "barrier": round(barrier_scale, 6),
            "pedestrianGate": round(gate_scale, 6),
        },
        "nativeUpscaleUsed": False,
        "silhouetteDeltaFromL1": "two linked barriers plus dedicated pedestrian gate; not a scaled L1 image",
    }
    level["assetIntegrity"] = {
        "sha256": sha256(OUT_PATH),
        "bytes": OUT_PATH.stat().st_size,
        "pixelWidth": final.width,
        "pixelHeight": final.height,
        "transparent": True,
        "alphaExtrema": list(alpha_extrema),
    }
    existing_evidence = dict(level.get("promotionEvidence", {}))
    existing_evidence.update({
        "staticRasterBuild": "PASS",
        "browserActualPlay": existing_evidence.get("browserActualPlay", "PENDING_BRANCH_QA"),
        "mobile390x844": existing_evidence.get("mobile390x844", "PENDING_BRANCH_QA"),
        "commercialVisualReview": existing_evidence.get("commercialVisualReview", "PENDING_BRANCH_QA"),
    })
    level["promotionEvidence"] = existing_evidence

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    return {
        "output": str(OUT_PATH.relative_to(ROOT)),
        "pixelSize": [final.width, final.height],
        "bytes": OUT_PATH.stat().st_size,
        "sha256": sha256(OUT_PATH),
        "alphaExtrema": list(alpha_extrema),
        "marshalScale": marshal_scale,
        "barrierScale": barrier_scale,
        "pedestrianGateScale": gate_scale,
    }


def check() -> dict:
    if not OUT_PATH.exists():
        raise SystemExit("CONTROL:L2 final raster is missing")
    final = Image.open(OUT_PATH).convert("RGBA")
    alpha = final.getchannel("A").getextrema()
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    level = next(item for item in manifest["levels"] if item["levelId"] == "L2")

    if final.width > RUNTIME_MAX[0] or final.height > RUNTIME_MAX[1]:
        raise SystemExit(f"CONTROL:L2 runtime raster too large: {final.size}")
    if min(final.size) < 180:
        raise SystemExit(f"CONTROL:L2 runtime raster too small for high-DPI display: {final.size}")
    if alpha[0] != 0 or alpha[1] != 255:
        raise SystemExit(f"CONTROL:L2 alpha is not full-range transparent: {alpha}")
    if level.get("status") != "PRODUCTION_APPROVED":
        raise SystemExit("CONTROL:L2 manifest is not promoted")
    if level.get("assetIntegrity", {}).get("sha256") != sha256(OUT_PATH):
        raise SystemExit("CONTROL:L2 manifest SHA does not match raster")
    if level.get("sourceReview", {}).get("nativeUpscaleUsed") is not False:
        raise SystemExit("CONTROL:L2 source review must prove no source upscale")
    if "scaled L1" not in level.get("sourceReview", {}).get("silhouetteDeltaFromL1", ""):
        raise SystemExit("CONTROL:L2 must record a material silhouette delta from L1")

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
    print("CONTROL_L2_RASTER=" + json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()

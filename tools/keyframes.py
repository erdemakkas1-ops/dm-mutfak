"""Turn the four film keyframes into the site's images (img/film/) and the share image (img/og.jpg).

  py -3 tools/keyframes.py [folder]        # default folder: gemini/

The folder holds 1-olcu, 2-govde, 3-gunduz, 4-aksam (desktop, landscape) and the same names with -m
(phone, portrait), as .png, .jpg, .jpeg or .webp. See GEMINI.md for how they were made.

Gemini's edits drift by a percent or so, which shows as ghosting in the cross-fades, so every frame
is first aligned to its neighbour in the edit chain (uniform scale and shift that best match the
edges): 4-aksam and 2-govde to 3-gunduz, 1-olcu to 2-govde (it was edited from that frame).
Then each is cropped to 16:9 / 9:16 and saved as WebP, 1920 × 1080 and 1080 × 1920.
The printed match is the edge similarity: around 0.6 or more is the same camera; well below 0.5
means Gemini moved the camera and the frame should be redone.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, sys.argv[1] if len(sys.argv) > 1 else "gemini")
OUT = os.path.join(ROOT, "img", "film")
# frame -> the frame it was edited from (None for the reference)
CHAIN = {"3-gunduz": None, "4-aksam": "3-gunduz", "2-govde": "3-gunduz", "1-olcu": "2-govde"}


def find(name):
    for ext in (".png", ".jpg", ".jpeg", ".webp"):
        path = os.path.join(SRC, name + ext)
        if os.path.exists(path):
            return path
    return None


def edges(im, w):
    small = im.convert("L").resize((w, round(w * im.height / im.width)))
    return np.asarray(small.filter(ImageFilter.FIND_EDGES), dtype=np.float32)


def align(im, ref):
    """Scale and shift im so its edges best match ref's; the gaps at the border are filled from im itself."""
    im = im.resize(ref.size)
    W = 500
    A = edges(ref, W)
    H = A.shape[0]
    best = (-1, 1.0, 0, 0)
    for s in np.arange(.97, 1.0301, .0025):
        w, h = round(W * s), round(H * s)
        B = edges(im.resize((w, h)), w) if w != W else edges(im, W)
        B = B[:h, :w]
        for dx in range(-10, 11):
            for dy in range(-8, 9):
                x0, y0 = (W - w) // 2 + dx, (H - h) // 2 + dy
                xa, ya, xb, yb = max(0, x0), max(0, y0), min(W, x0 + w), min(H, y0 + h)
                a, b = A[ya:yb, xa:xb], B[ya - y0:yb - y0, xa - x0:xb - x0]
                score = float((a * b).sum() / (np.sqrt((a * a).sum() * (b * b).sum()) + 1e-6))
                if score > best[0]:
                    best = (score, s, dx, dy)
    score, s, dx, dy = best
    k = ref.width / W
    w, h = round(ref.width * s), round(ref.height * s)
    out = im.copy()  # background for the border, in case the frame shrinks
    out.paste(im.resize((w, h), Image.LANCZOS), ((ref.width - w) // 2 + round(dx * k), (ref.height - h) // 2 + round(dy * k)))
    return out, f"scale {s:.4f}, shift {round(dx * k)},{round(dy * k)} px, match {score:.2f}"


def crop(im, w, h):
    scale = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    left, top = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((left, top, left + w, top + h))


def build(suffix, size, quality):
    aligned = {}
    for name, parent in CHAIN.items():  # parents come first in CHAIN
        path = find(name + suffix)
        if not path:
            sys.exit(f"missing {name}{suffix} in {SRC}")
        im = Image.open(path).convert("RGB")
        note = "reference"
        if parent:
            im, note = align(im, aligned[parent])
        aligned[name] = im
        crop(im, *size).save(os.path.join(OUT, name + suffix + ".webp"), "WEBP", quality=quality, method=6)
        print(f"{name}{suffix}: {note}")
    return aligned


def share_image(im):
    # the evening kitchen, 1200 × 630
    crop(im, 1200, 630).save(os.path.join(ROOT, "img", "og.jpg"), "JPEG", quality=84, optimize=True, progressive=True)


def main():
    os.makedirs(OUT, exist_ok=True)
    desktop = build("", (1920, 1080), 80)
    build("-m", (1080, 1920), 78)
    share_image(desktop["4-aksam"])


if __name__ == "__main__":
    main()

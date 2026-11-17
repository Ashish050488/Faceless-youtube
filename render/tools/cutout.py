"""Whole-product cut-out (transparent PNG, trimmed). Never crop the product afterwards (render.js refuses crops).

    python render/tools/cutout.py in.jpg out.png [--mode ai|white] [--strip-lines]

ai    : rembg isnet-general-use, then keep only the largest connected component (drops stray props/text blobs).
white : flood-fill from the borders on near-white backgrounds (cleaner than AI on studio shots).
--strip-lines: remove thin horizontal callout lines left in press renders (morphological opening + repaint).
Upscale small sources first (< 1200 px wide): python render/tools/esrgan.py <RealESRGAN_x4plus.pth> in.png out.png
"""
import argparse

import numpy as np
from PIL import Image
from scipy import ndimage


def largest(alpha):
    lab, n = ndimage.label(alpha > 128)
    if n <= 1:
        return alpha
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
    return np.where(lab == 1 + int(np.argmax(sizes)), alpha, 0).astype(np.uint8)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("dst")
    ap.add_argument("--mode", default="ai", choices=["ai", "white"]); ap.add_argument("--strip-lines", action="store_true")
    a = ap.parse_args()
    im = Image.open(a.src).convert("RGB"); rgb = np.asarray(im)
    if a.strip_lines:
        grey = rgb.mean(2); dark = grey < 200
        lines = ndimage.binary_opening(dark, structure=np.ones((1, 61))) & ~ndimage.binary_opening(dark, structure=np.ones((7, 7)))
        rgb = rgb.copy(); rgb[ndimage.binary_dilation(lines, iterations=2)] = 255
    if a.mode == "white":
        bgish = (rgb.min(2) > 235)
        lab, _ = ndimage.label(bgish)
        border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        alpha = np.where(np.isin(lab, list(border)), 0, 255).astype(np.uint8)
        alpha = ndimage.binary_opening(alpha > 0, iterations=1).astype(np.uint8) * 255
    else:
        from rembg import new_session, remove
        out = remove(Image.fromarray(rgb), session=new_session("isnet-general-use"))
        alpha = np.asarray(out)[:, :, 3]
    alpha = largest(alpha)
    rgba = np.dstack([rgb, alpha]); ys, xs = np.nonzero(alpha > 8)
    Image.fromarray(rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]).save(a.dst)
    print(a.dst, xs.max() - xs.min() + 1, "x", ys.max() - ys.min() + 1)


if __name__ == "__main__":
    main()

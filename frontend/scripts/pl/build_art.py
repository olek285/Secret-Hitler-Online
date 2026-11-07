#!/usr/bin/env python3
"""Repaint the big English labels in the card/banner art in Polish.

Reads the originals in src/assets/ and writes edited copies with the same
names to src/assets/pl/ (the originals are never touched, so this can be
rerun). The components import the pl/ copies.

Each label is found by colour inside a search box, erased by filling its
pixels from their neighbours (the backgrounds behind labels are flat or
nearly so), and redrawn centred in the same place at the same cap height,
squeezed or shrunk to fit. "LIBERAL" -> "LIBERAŁ" only adds the Ł stroke,
because that word overlaps the illustrations.

Fonts: Germania PL (src/fonts/germania-pl.woff2, see build_font.py) for the
blackletter labels, and macOS Futura for the sans-serif ones. Only the
rendered PNGs are committed.

Usage (from frontend/):
    python3 scripts/pl/build_art.py [--sheet DIR]   # DIR: before/after PNGs
Needs Pillow, numpy and fontTools (+ brotli).
"""
import argparse
import os
import tempfile

import numpy as np
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FRONTEND = os.path.normpath(os.path.join(HERE, "..", ".."))
ASSETS = os.path.join(FRONTEND, "src", "assets")
OUT = os.path.join(ASSETS, "pl")
FUTURA = "/System/Library/Fonts/Supplemental/Futura.ttc"
FUTURA_MEDIUM, FUTURA_BOLD = 0, 2  # face indices in Futura.ttc


def germania_ttf():
    path = os.path.join(tempfile.gettempdir(), "germania-pl-build-art.ttf")
    font = TTFont(os.path.join(FRONTEND, "src", "fonts", "germania-pl.woff2"))
    font.flavor = None
    font.save(path)
    return path


GERMANIA = None  # set in main()


def load_font(face, size):
    if face == "germania":
        return ImageFont.truetype(GERMANIA, size)
    index = FUTURA_BOLD if face == "futura-bold" else FUTURA_MEDIUM
    return ImageFont.truetype(FUTURA, size, index=index)


# --------------------------------------------------------------------------
# Finding and erasing


def color_mask(arr, box, color, tol):
    x0, y0, x1, y1 = box
    reg = arr[y0:y1, x0:x1, :3].astype(int)
    return np.abs(reg - np.array(color)).sum(axis=2) < tol


def find_text(arr, box, color, tol):
    """Tight bbox (x0, y0, x1, y1) of pixels near `color` inside `box`."""
    m = color_mask(arr, box, color, tol)
    ys, xs = np.nonzero(m)
    if len(xs) == 0:
        raise ValueError(f"no text of colour {color} in {box}")
    return (int(box[0] + xs.min()), int(box[1] + ys.min()),
            int(box[0] + xs.max() + 1), int(box[1] + ys.max() + 1))


def erase(arr, box, color, tol, grow=2):
    """Replace pixels near `color` inside `box` by diffusing their neighbours."""
    h, w = arr.shape[:2]
    x0, y0, x1, y1 = box
    mask = np.zeros((h, w), bool)
    mask[y0:y1, x0:x1] = color_mask(arr, box, color, tol)
    if grow:
        img = Image.fromarray((mask * 255).astype(np.uint8))
        img = img.filter(ImageFilter.MaxFilter(2 * grow + 1))
        grown = np.array(img) > 0
        clip = np.zeros((h, w), bool)
        clip[max(0, y0 - grow):y1 + grow, max(0, x0 - grow):x1 + grow] = True
        mask = grown & clip
    out = arr.astype(float)
    known = ~mask
    offsets = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
    while not known.all():
        acc = np.zeros_like(out)
        cnt = np.zeros((h, w))
        for dy, dx in offsets:
            k = np.roll(np.roll(known, dy, 0), dx, 1)
            v = np.roll(np.roll(out, dy, 0), dx, 1)
            acc += v * k[..., None]
            cnt += k
        frontier = (~known) & (cnt > 0)
        if not frontier.any():
            break
        out[frontier] = acc[frontier] / cnt[frontier][:, None]
        known = known | frontier
    return out.round().clip(0, 255).astype(np.uint8)


def sample_color(arr, box, color, tol):
    """Median colour of the label's solid core (ignores anti-aliased edges)."""
    m = color_mask(arr, box, color, tol / 2)
    x0, y0, x1, y1 = box
    px = arr[y0:y1, x0:x1, :3][m]
    return tuple(int(v) for v in np.median(px, axis=0))


# --------------------------------------------------------------------------
# Drawing


def text_layer(text, face, cap_px, tracking, fill):
    """Render `text` so that capital letters are `cap_px` tall.

    Returns (RGBA layer, cap-top offset inside the layer)."""
    probe = load_font(face, 200)
    l, t, r, b = probe.getbbox("H")
    size = max(4, round(200 * cap_px / (b - t)))
    font = load_font(face, size)
    _, cap_top, _, base = font.getbbox("H")
    ascent, descent = font.getmetrics()
    track = tracking * cap_px
    widths = [font.getlength(ch) for ch in text]
    total = sum(widths) + track * (len(text) - 1)
    pad = int(cap_px) + 2  # room for accents above and ogonek below
    layer = Image.new("RGBA", (int(total + 2 * pad), ascent + descent + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x = pad
    for ch, wch in zip(text, widths):
        d.text((x, pad), ch, font=font, fill=fill)
        x += wch + track
    # crop horizontally to ink, keep vertical reference
    bbox = layer.getbbox()
    layer = layer.crop((bbox[0], 0, bbox[2], layer.height))
    return layer, pad + cap_top


def draw_text(img, text, found, area, face, fill, cap_px, tracking=0.0, max_squeeze=0.8,
              widen=1.0, align="center"):
    """Draw `text` where the English label `found` was, inside `area`.

    Capitals start at height `cap_px` and are centred on the old label; the
    whole ink (accents, ogonek included) must fit `area`: the text is first
    squeezed horizontally (down to `max_squeeze`), then made smaller, then
    nudged vertically to stay inside. `widen` stretches the letters first, to
    match lettering wider than Germania."""
    tx0, ty0, tx1, ty1 = found
    ax0, ay0, ax1, ay1 = area
    aw, ah = ax1 - ax0, ay1 - ay0
    cap = cap_px
    for _ in range(60):
        layer, cap_off = text_layer(text, face, cap, tracking, fill)
        if widen != 1.0:
            layer = layer.resize((round(layer.width * widen), layer.height), Image.LANCZOS)
        ink = layer.getbbox()
        ink_top, ink_bot = ink[1] - cap_off, ink[3] - cap_off
        if layer.width * max_squeeze <= aw and ink_bot - ink_top <= ah:
            break
        cap *= 0.97
    if layer.width > aw:
        layer = layer.resize((aw, layer.height), Image.LANCZOS)
    if align == "left":
        px = tx0
    else:
        px = round(min(max((tx0 + tx1) / 2 - layer.width / 2, ax0), ax1 - layer.width))
    cap_top = ty0 + ((ty1 - ty0) - cap) / 2
    if cap_top + ink_top < ay0:
        cap_top = ay0 - ink_top
    if cap_top + ink_bot > ay1:
        cap_top = ay1 - ink_bot
    img.alpha_composite(layer, (px, round(cap_top - cap_off)))
    return cap


def add_lslash(arr, word_box, color, fill, tol):
    """Turn the last letter L of a word into Ł by drawing its stroke."""
    x0, y0, x1, y1 = word_box
    m = color_mask(arr, word_box, color, tol)
    cap = y1 - y0
    # The L's stem is the rightmost run of columns inked over most of the
    # upper part of the word (the L's foot is only at the bottom). Searching
    # from the right also works when the A and L touch.
    upper = m[: int(cap * 0.6)]
    tall = upper.sum(axis=0) > upper.shape[0] * 0.5
    c = len(tall) - 1
    while c >= 0 and not tall[c]:
        c -= 1
    sx1 = c + 1
    while c >= 0 and tall[c]:
        c -= 1
    sx0, sx1 = x0 + c + 1, x0 + sx1
    stem = sx1 - sx0
    base = y1
    # same shape as build_font.py's Ł, a bit heavier for the card lettering
    lx, rx = sx0 - 0.3 * stem, sx1 + 0.85 * stem
    yl = base - 0.40 * cap
    yr = base - 0.58 * cap
    t = 0.15 * cap
    poly = [(lx, yl - t / 2), (rx, yr - t / 2), (rx, yr + t / 2), (lx, yl + t / 2)]
    img = Image.fromarray(arr)
    big = img.resize((img.width * 4, img.height * 4), Image.NEAREST)
    layer = Image.new("RGBA", big.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).polygon([(px * 4, py * 4) for px, py in poly], fill=fill + (255,))
    layer = layer.resize(img.size, Image.LANCZOS)
    img.alpha_composite(layer)
    return np.array(img)


# --------------------------------------------------------------------------
# The labels

ROLE_CARDS = [f"role-liberal-{i}.png" for i in range(1, 7)] + [
    f"role-fascist-{i}.png" for i in range(1, 4)
] + ["role-hitler.png"]
CREAM = (244, 228, 196)


def label(area, color, text, face, tol=60, tracking=0.0, max_squeeze=0.8,
          cap_scale=1.0, grow=2, widen=1.0, align="center"):
    """Replace the label of colour `color` found inside `area` (which is also
    the space the Polish text may use)."""
    return dict(kind="label", area=area, color=color, text=text, face=face, tol=tol,
                tracking=tracking, max_squeeze=max_squeeze, cap_scale=cap_scale, grow=grow,
                widen=widen, align=align)


def lslash(area, color, tol=60):
    return dict(kind="lslash", area=area, color=color, tol=tol)


SPECS = {}
for name in ROLE_CARDS:
    ops = [label((60, 40, 440, 100), CREAM, "TWOJA TAJNA ROLA", "futura-bold", tracking=0.09)]
    if "liberal" in name:
        ops.append(lslash((62, 98, 445, 204), CREAM))
    elif "fascist" in name:
        ops.append(label((40, 98, 460, 200), CREAM, "FASZYSTA", "germania",
                         max_squeeze=0.85, grow=3, widen=1.25))
    SPECS[name] = ops

YELLOW_INK = (64, 56, 32)
SPECS["party-membership-liberal.png"] = [
    label((30, 50, 152, 92), YELLOW_INK, "KARTA", "futura-bold", tracking=0.06),
    label((224, 50, 475, 92), YELLOW_INK, "PARTYJNA", "futura-bold", tracking=0.06, align="left"),
    lslash((60, 575, 440, 665), (48, 128, 72)),
]
SPECS["party-membership-fascist.png"] = [
    label((30, 44, 152, 87), YELLOW_INK, "KARTA", "futura-bold", tracking=0.06),
    label((224, 44, 475, 87), YELLOW_INK, "PARTYJNA", "futura-bold", tracking=0.06, align="left"),
    label((60, 575, 440, 665), (216, 80, 24), "FASZYSTA", "germania", grow=3),
]
SPECS["party-membership.png"] = [
    label((150, 272, 360, 330), (240, 208, 96), "KARTA", "germania", grow=3),
    label((88, 333, 412, 390), (240, 208, 96), "PARTYJNA", "germania", grow=3),
]

for name, color, word, big, small in (
    ("policy-fascist.png", (224, 96, 72), "FASZYSTOWSKA", (138, 290, 448, 390), (130, 410, 365, 463)),
    ("policy-liberal.png", (88, 152, 160), "LIBERALNA", (130, 288, 446, 396), (130, 414, 365, 470)),
    ("board-policy-fascist.png", (224, 96, 72), "FASZYSTOWSKA", (37, 87, 141, 120), (36, 128, 110, 146)),
    ("board-policy-liberal.png", (88, 152, 160), "LIBERALNA", (35, 89, 140, 122), (36, 130, 110, 148)),
):
    small_card = name.startswith("board-")
    SPECS[name] = [
        label(big, color, word, "germania", max_squeeze=0.75, grow=1 if small_card else 3),
        label(small, color, "USTAWA", "germania", tracking=0.18, grow=1 if small_card else 2),
    ]
SPECS["board-policy.png"] = [
    label((32, 86, 142, 120), (240, 224, 192), "USTAWA", "germania", grow=1),
]
SPECS["policy-folder-cover-front.png"] = [
    label((360, 64, 545, 100), (88, 88, 80), "NOWA", "futura-bold", tracking=0.22),
    label((345, 102, 565, 168), (88, 88, 80), "USTAWA", "germania"),
]
for name, word in (("victory-liberal-header.png", "LIBERAŁÓW"), ("victory-fascist-header.png", "FASZYSTÓW")):
    SPECS[name] = [
        label((150, 16, 795, 146), (248, 248, 248), "ZWYCIĘSTWO " + word, "germania",
              max_squeeze=0.82, grow=3),
    ]
for name, color, top, bottom in (
    ("board-draw.png", (104, 200, 168), "TALIA", "USTAW"),
    ("board-discard.png", (40, 40, 40), "ODRZUCONE", "USTAWY"),
):
    SPECS[name] = [
        label((68, 125, 182, 161), color, top, "germania", grow=1),
        label((68, 167, 182, 200), color, bottom, "germania", grow=1),
    ]
SPECS["vote-yes.png"] = [
    # the bracket glyphs are taller than the capitals they enclose
    label((300, 380, 460, 418), (40, 40, 40), "(TAK)", "futura-medium", tracking=0.3, grow=1,
          cap_scale=0.78),
]
SPECS["vote-no.png"] = [
    label((300, 385, 460, 434), (240, 232, 216), "(NIE)", "futura-bold", tracking=0.25, grow=1,
          cap_scale=0.78),
]
SPECS["board-election-tracker.png"] = [
    # the area stops before the paint speckles right of the English text
    label((100, 49, 516, 93), (112, 200, 208), "LICZNIK WYBORÓW", "futura-bold",
          tracking=0.12, grow=2),
]
SPECS["board-liberal.png"] = [
    label((685, 76, 1000, 153), (56, 104, 136), "LIBERAŁOWIE", "germania", grow=3),
]
for n in ("5-6", "7-8", "9-10"):
    SPECS[f"board-fascist-{n}.png"] = [
        label((690, 79, 995, 157), (160, 16, 8), "FASZYŚCI", "germania",
              max_squeeze=0.85, grow=3),
    ]


def apply_ops(name, ops):
    arr = np.array(Image.open(os.path.join(ASSETS, name)).convert("RGBA"))
    for op in ops:
        found = find_text(arr, op["area"], op["color"], op["tol"])
        fill = sample_color(arr, found, op["color"], op["tol"])
        if op["kind"] == "lslash":
            arr = add_lslash(arr, found, op["color"], fill, op["tol"])
            continue
        alpha = arr[..., 3].copy()
        arr = erase(arr, found, op["color"], op["tol"], op["grow"])
        arr[..., 3] = alpha
        img = Image.fromarray(arr)
        cap = (found[3] - found[1]) * op["cap_scale"]
        draw_text(img, op["text"], found, op["area"], op["face"], fill + (255,), cap,
                  tracking=op["tracking"], max_squeeze=op["max_squeeze"], widen=op["widen"],
                  align=op["align"])
        arr = np.array(img)
    return Image.fromarray(arr)


def main():
    global GERMANIA
    ap = argparse.ArgumentParser()
    ap.add_argument("--sheet", help="write before/after comparison PNGs to this directory")
    ap.add_argument("--only", nargs="*", help="only these file names")
    args = ap.parse_args()
    GERMANIA = germania_ttf()
    os.makedirs(OUT, exist_ok=True)
    for name, ops in SPECS.items():
        if args.only and name not in args.only:
            continue
        out = apply_ops(name, ops)
        out.save(os.path.join(OUT, name), optimize=True)
        print("wrote", os.path.relpath(os.path.join(OUT, name), FRONTEND))
        if args.sheet:
            os.makedirs(args.sheet, exist_ok=True)
            before = Image.open(os.path.join(ASSETS, name)).convert("RGBA")
            sheet = Image.new("RGBA", (before.width * 2 + 10, before.height), (255, 0, 255, 255))
            sheet.paste(before, (0, 0))
            sheet.paste(out, (before.width + 10, 0))
            sheet.save(os.path.join(args.sheet, name))


if __name__ == "__main__":
    main()

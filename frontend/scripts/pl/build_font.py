#!/usr/bin/env python3
"""Build "Germania PL": Germania One plus the Polish letters it lacks.

Germania One (the header/button font) only ships a latin subset: it has
ó/Ó but not ą ć ę ł ń ś ź ż. This script draws those 16 glyphs from the
font's own shapes (base letter + the font's acute accent or i-dot, and a
drawn ogonek or slash) and writes a renamed woff2. The OFL reserves the
name "Germania One" for unmodified versions, hence "Germania PL".

Usage (from frontend/):
    python3 scripts/pl/build_font.py [--ttf OUT.ttf]
Needs fontTools + brotli. Output: src/fonts/germania-pl.woff2
"""
import argparse
import copy
import math
import os

from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
FRONTEND = os.path.normpath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(
    FRONTEND,
    "node_modules/@fontsource/germania-one/files/germania-one-latin-400-normal.woff2",
)
OUT = os.path.join(FRONTEND, "src/fonts/germania-pl.woff2")
FAMILY = "Germania PL"


def contours_of(glyphset, name):
    """Split a glyph's outline into per-contour recordings."""
    rp = RecordingPen()
    glyphset[name].draw(rp)
    out, cur = [], []
    for op, args in rp.value:
        cur.append((op, args))
        if op in ("closePath", "endPath"):
            out.append(cur)
            cur = []
    return out


def bbox_of(contour):
    pts = [p for _, args in contour for p in args if p is not None]
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def replay(contour, pen):
    for op, args in contour:
        getattr(pen, op)(*args)


def polygon(pen, pts):
    """Draw a closed polygon, forced clockwise (TrueType outer contour)."""
    area = sum(
        pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1]
        for i in range(len(pts))
    )
    if area > 0:  # counter-clockwise in y-up coordinates
        pts = list(reversed(pts))
    pen.moveTo(pts[0])
    for p in pts[1:]:
        pen.lineTo(p)
    pen.closePath()


def stroke_polyline(center, width):
    """Outline a polyline of given width with mitred joins."""
    half = width / 2.0

    def offset_lines(sign):
        lines = []
        for (x0, y0), (x1, y1) in zip(center, center[1:]):
            dx, dy = x1 - x0, y1 - y0
            n = math.hypot(dx, dy)
            nx, ny = -dy / n * half * sign, dx / n * half * sign
            lines.append(((x0 + nx, y0 + ny), (x1 + nx, y1 + ny)))
        return lines

    def intersect(l1, l2):
        (x1, y1), (x2, y2) = l1
        (x3, y3), (x4, y4) = l2
        d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
        if abs(d) < 1e-9:
            return l1[1]
        a = x1 * y2 - y1 * x2
        b = x3 * y4 - y3 * x4
        return ((a * (x3 - x4) - (x1 - x2) * b) / d, (a * (y3 - y4) - (y1 - y2) * b) / d)

    side = []
    for sign in (1, -1):
        lines = offset_lines(sign)
        pts = [lines[0][0]]
        for a, b in zip(lines, lines[1:]):
            pts.append(intersect(a, b))
        pts.append(lines[-1][1])
        side.append(pts)
    return [(round(x), round(y)) for x, y in side[0] + list(reversed(side[1]))]


def ogonek(xr):
    """An angular ogonek hanging from x≈xr at the baseline, tail to the right."""
    return stroke_polyline(
        [(xr - 40, 30), (xr - 95, -95), (xr - 70, -185), (xr + 25, -215)], 66
    )


def build(ttf_out=None):
    font = TTFont(SRC)
    gs = font.getGlyphSet()
    glyf = font["glyf"]
    hmtx = font["hmtx"]

    def center(name):
        return (glyf[name].xMin + glyf[name].xMax) / 2.0

    # Accents taken from the font's own accented letters.
    cap_acute = contours_of(gs, "Aacute")[2]  # sits at y 750..882 above capitals
    low_acute = contours_of(gs, "aacute")[2]  # y 580..750 above x-height
    i_dot = [c for c in contours_of(gs, "i") if bbox_of(c)[1] > 500][0]  # y 594..748

    def accent_shift(contour, base, extra_dx=0.0, dy=0.0):
        x0, _, x1, _ = bbox_of(contour)
        return center(base) + extra_dx - (x0 + x1) / 2.0, dy

    def make(base, parts, advance=None):
        pen = TTGlyphPen(gs)
        gs[base].draw(pen)
        for kind, payload in parts:
            if kind == "contour":
                contour, dx, dy = payload
                replay(contour, TransformPen(pen, (1, 0, 0, 1, dx, dy)))
            else:  # polygon points
                polygon(pen, payload)
        glyph = pen.glyph()
        glyph.recalcBounds(glyf)
        return glyph, advance if advance is not None else hmtx[base][0]

    acute = lambda base, src, extra: (
        "contour",
        (src, *accent_shift(src, base, extra)),
    )
    new = {
        # name: (codepoint, base, parts, advance)
        "Aogonek": (0x104, "A", [("poly", ogonek(466))], None),
        "aogonek": (0x105, "a", [("poly", ogonek(426))], None),
        "Cacute": (0x106, "C", [acute("C", cap_acute, 6)], None),
        "cacute": (0x107, "c", [acute("c", low_acute, 2)], None),
        "Eogonek": (0x118, "E", [("poly", ogonek(428))], None),
        "eogonek": (0x119, "e", [("poly", ogonek(300))], None),
        "Lslash": (
            0x141,
            "L",
            [("poly", [(-5, 335), (255, 455), (255, 375), (-5, 255)])],
            None,
        ),
        "lslash": (
            0x142,
            "l",
            [("poly", [(0, 360), (240, 470), (240, 390), (0, 280)])],
            hmtx["l"][0] + 20,
        ),
        "Nacute": (0x143, "N", [acute("N", cap_acute, 6)], None),
        "nacute": (0x144, "n", [acute("n", low_acute, 2)], None),
        "Sacute": (0x15A, "S", [acute("S", cap_acute, 6)], None),
        "sacute": (0x15B, "s", [acute("s", low_acute, 2)], None),
        "Zacute": (0x179, "Z", [acute("Z", cap_acute, 6)], None),
        "zacute": (0x17A, "z", [acute("z", low_acute, 2)], None),
        "Zdotaccent": (
            0x17B,
            "Z",
            [("contour", (i_dot, *accent_shift(i_dot, "Z", 0, 156)))],
            None,
        ),
        "zdotaccent": (
            0x17C,
            "z",
            [("contour", (i_dot, *accent_shift(i_dot, "z", 0, 0)))],
            None,
        ),
    }

    order = font.getGlyphOrder()
    built = {}
    for name, (cp, base, parts, adv) in new.items():
        glyph, advance = make(base, parts, adv)
        built[name] = (cp, base, glyph, advance)
    font.setGlyphOrder(order + list(built))
    for name, (cp, base, glyph, advance) in built.items():
        glyf[name] = glyph
        hmtx[name] = (advance, glyph.xMin)
        for table in font["cmap"].tables:
            if table.isUnicode():
                table.cmap[cp] = name
    font["maxp"].numGlyphs = len(font.getGlyphOrder())

    # Base glyph class for GDEF; copy the (tiny) pair kerning of each base.
    gdef = font["GDEF"].table.GlyphClassDef
    if gdef is not None:
        for name in built:
            gdef.classDefs[name] = 1
    gid = font.getReverseGlyphMap()
    for lookup in font["GPOS"].table.LookupList.Lookup:
        for st in lookup.SubTable:
            if lookup.LookupType != 2 or st.Format != 1:
                continue
            firsts = st.Coverage.glyphs
            sets = dict(zip(firsts, st.PairSet))
            for pairset in st.PairSet:
                extra = []
                for rec in pairset.PairValueRecord:
                    for name, (_, base, _, _) in built.items():
                        if rec.SecondGlyph == base:
                            dup = copy.deepcopy(rec)
                            dup.SecondGlyph = name
                            extra.append(dup)
                pairset.PairValueRecord.extend(extra)
                pairset.PairValueRecord.sort(key=lambda r: gid[r.SecondGlyph])
                pairset.PairValueCount = len(pairset.PairValueRecord)
            for name, (_, base, _, _) in built.items():
                if base in sets:
                    sets[name] = copy.deepcopy(sets[base])
            ordered = sorted(sets, key=lambda g: gid[g])
            st.Coverage.glyphs = ordered
            st.PairSet = [sets[g] for g in ordered]
            st.PairSetCount = len(ordered)

    # Rename (OFL Reserved Font Name) and advertise Latin-2 coverage.
    name_table = font["name"]
    for rec in name_table.names:
        if rec.nameID in (1, 4):
            name_table.setName(FAMILY, rec.nameID, rec.platformID, rec.platEncID, rec.langID)
        elif rec.nameID == 3:
            name_table.setName(
                "GermaniaPL: Germania One + Polish letters",
                rec.nameID, rec.platformID, rec.platEncID, rec.langID,
            )
        elif rec.nameID == 6:
            name_table.setName("GermaniaPL-Regular", rec.nameID, rec.platformID, rec.platEncID, rec.langID)
    os2 = font["OS/2"]
    os2.ulUnicodeRange1 |= 1 << 2  # Latin Extended-A
    os2.ulCodePageRange1 |= 1 << 1  # Latin 2: Eastern Europe

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    font.flavor = "woff2"
    font.save(OUT)
    print("wrote", os.path.relpath(OUT, FRONTEND))
    if ttf_out:
        font.flavor = None
        font.save(ttf_out)
        print("wrote", ttf_out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--ttf", help="also write an uncompressed TTF here (for build_art.py)")
    build(ap.parse_args().ttf)

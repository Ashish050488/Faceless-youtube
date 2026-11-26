"""Country silhouettes for the kit's `countryShape` layer (real Natural Earth outlines, one country per shape).

    python render/tools/make_countries.py <ne50.geojson> <work>/assets/countries.json DEU ITA [FRA ...]

ne50.geojson (public domain, ~3 MB):
    curl -sL -o ne50.geojson https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@v5.1.2/geojson/ne_50m_admin_0_countries.geojson
Projection: equirectangular around the country's own mid-latitude (x = lon·cos φ0, y = −lat), normalised so the
country is 1.0 tall. Islands smaller than 1.5 % of the largest part are dropped (keeps Sicily/Sardinia, drops dots).
"""
import json
import math
import sys


def iso_of(p):
    for k in ("ISO_A3", "ADM0_A3", "SOV_A3"):
        if p.get(k) and p[k] != "-99":
            return p[k]
    return ""


def area(r):
    return abs(sum(r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1] for i in range(len(r)))) / 2


def main():
    src, dst, isos = sys.argv[1], sys.argv[2], sys.argv[3:]
    feats = {iso_of(f["properties"]): f for f in json.load(open(src))["features"]}
    out = {}
    for iso in isos:
        g = feats[iso]["geometry"]
        rings = [p[0] for p in (g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]])]
        big = max(area(r) for r in rings)
        rings = [r for r in rings if area(r) >= 0.015 * big]
        lats = [q[1] for r in rings for q in r]
        k = math.cos(math.radians((min(lats) + max(lats)) / 2))
        pts = [[[q[0] * k, -q[1]] for q in r] for r in rings]
        xs = [q[0] for r in pts for q in r]; ys = [q[1] for r in pts for q in r]
        x0, y0, h = min(xs), min(ys), max(ys) - min(ys)
        polys = [[[round((q[0] - x0) / h, 4), round((q[1] - y0) / h, 4)] for q in r] for r in pts]
        out[iso] = {"w": round((max(xs) - x0) / h, 4), "polys": polys}
        print(iso, len(polys), "parts, w/h", out[iso]["w"])
    json.dump(out, open(dst, "w"), separators=(",", ":"))


if __name__ == "__main__":
    main()

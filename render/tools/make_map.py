"""Real world map for the kit's `map` layer: Natural Earth 1:110m countries, Robinson projection, pins at real centroids.

    python render/tools/make_map.py <ne110.geojson> <out assets/map_robinson.json> --hl USA,IND,EUROPE --pins USA,DEU,IND

ne110.geojson (public domain, ~840 KB):
    curl -sL -o ne110.geojson https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@v5.1.2/geojson/ne_110m_admin_0_countries.geojson
--hl: ISO-A3 codes to fill marigold; EUROPE = every European country except Russia. --pins: in the order the cues' pins[] fire.
"""
import argparse
import json

import numpy as np

LAT = np.arange(0, 95, 5)  # Robinson table (Snyder)
X = [1.0, 0.9986, 0.9954, 0.99, 0.9822, 0.973, 0.96, 0.9427, 0.9216, 0.8962, 0.8679, 0.835, 0.7986, 0.7597, 0.7186, 0.6732, 0.6213, 0.5722, 0.5322]
Y = [0.0, 0.062, 0.124, 0.186, 0.248, 0.31, 0.372, 0.434, 0.4958, 0.5571, 0.6176, 0.6769, 0.7346, 0.7903, 0.8435, 0.8936, 0.9394, 0.9761, 1.0]


def rob(lon, lat):
    a = abs(lat)
    return 0.8487 * np.interp(a, LAT, X) * np.radians(lon), 1.3523 * np.interp(a, LAT, Y) * np.sign(lat)


def polys_of(f):
    g = f["geometry"]
    return g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]


def iso_of(f):
    p = f["properties"]
    return p.get("ADM0_A3") or p.get("ISO_A3")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("geojson"); ap.add_argument("out")
    ap.add_argument("--hl", default=""); ap.add_argument("--pins", default="")
    a = ap.parse_args()
    g = json.load(open(a.geojson)); hl = set(a.hl.split(",")) - {""}
    out = []
    for f in g["features"]:
        cont = f["properties"].get("CONTINENT"); iso = iso_of(f)
        if cont == "Antarctica":
            continue
        is_hl = iso in hl or ("EUROPE" in hl and cont == "Europe" and iso != "RUS")
        for poly in polys_of(f):
            out.append({"hl": bool(is_hl), "iso": iso, "p": [[round(float(c), 4) for c in rob(x, y)] for x, y in poly[0]]})
    pins = {}
    for k in [p for p in a.pins.split(",") if p]:
        best = None  # centroid of the country's largest polygon
        for f in g["features"]:
            if iso_of(f) != k:
                continue
            for poly in polys_of(f):
                r = np.array(poly[0]); x, y = r[:, 0], r[:, 1]; cr = x[:-1] * y[1:] - x[1:] * y[:-1]; A = 0.5 * cr.sum()
                c = (np.sum((x[:-1] + x[1:]) * cr) / (6 * A), np.sum((y[:-1] + y[1:]) * cr) / (6 * A))
                if best is None or abs(A) > best[0]:
                    best = (abs(A), c)
        if best is None:
            raise SystemExit(f"no country {k}")
        pins[k] = [round(float(v), 4) for v in rob(*best[1])]
    xs = [q[0] for o in out for q in o["p"]]; ys = [q[1] for o in out for q in o["p"]]
    json.dump({"polys": out, "pins": pins, "bbox": [min(xs), min(ys), max(xs), max(ys)]}, open(a.out, "w"))
    print(json.dumps({"polygons": len(out), "highlighted": sum(o["hl"] for o in out), "pins": list(pins)}))


if __name__ == "__main__":
    main()

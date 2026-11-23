"""Check a video package before pushing it: python -m meta.check_package <slug>
Prints PASS or a list of problems. Used by script chats (WORKFLOW.md) so every package has the same shape."""
import json, re, sys
from pathlib import Path

REQUIRED = ["factsheet.md", "script.md", "cues.json", "metadata.json"]
META_KEYS = ["title", "description", "tags", "categoryId", "defaultLanguage", "madeForKids",
             "containsSyntheticMedia", "pinned_comment", "playlist", "format"]

warn = []

def check(slug):
    d, bad = Path("scripts") / slug, []
    if not re.fullmatch(r"sow\d{3}-[a-z0-9-]+", slug): bad.append("slug must look like sow012-brand-product")
    if not d.is_dir(): return [f"missing folder {d}"]
    bad += [f"missing {f}" for f in REQUIRED if not (d / f).exists()]
    if bad: return bad
    m = json.loads((d / "metadata.json").read_text())
    bad += [f"metadata.json missing '{k}'" for k in META_KEYS if k not in m]
    t = m.get("title", "")
    if len(t) > 60: bad.append(f"title {len(t)} chars (max 60)")
    tags = m.get("tags", [])
    n = len(",".join(tags))
    if not 10 <= len(tags) <= 25: bad.append(f"{len(tags)} tags (want ~15–21)")
    if n > 500: bad.append(f"tags {n} chars (YouTube max 500)")
    if m.get("madeForKids") is not False: bad.append("madeForKids must be false")
    fmt = m.get("format")
    if fmt in ("short", "long"):
        lo, hi, label = (90, 150, "Shorts: 100–130") if fmt == "short" else (900, 1500, "long: 900–1,500")
        words = len(re.findall(r"[A-Za-z0-9$']+", "\n".join(l for l in (d / "script.md").read_text().splitlines()
                                                             if l.strip() and not l.startswith(("#", "[")))))
        if not lo <= words <= hi: bad.append(f"script {words} words ({label})")
        txt = "\n".join(l for l in (d / "script.md").read_text().splitlines() if l.strip() and not l.startswith(("#", "[")))
        sents = [x for x in re.split(r"(?<=[.?!…])\s+", txt) if x.strip()]
        you = len(re.findall(r"\b(you|your|you'd|you're|you'll)\b", txt, re.I))
        contr = len(re.findall(r"\b\w+'(s|re|d|ll|ve|t)\b", txt, re.I))
        long_ = [x for x in sents if len(x.split()) > 14]
        if you < 3: warn.append(f"style: only {you} 'you/your' (want ≥ 3, SCRIPT_STYLE.md #1)")
        if contr < 3: warn.append(f"style: only {contr} contractions (want ≥ 3, #2)")
        if txt.count("?") < 2: warn.append("style: fewer than 2 questions to the viewer (#1/#4)")
        m = re.search(r"\[VERDICT\](.*?)(\n\[|\Z)", (d / "script.md").read_text(), re.S)
        if not m or not re.search(r"\b(it's|it is|that's)\s+(a\s+)?(spec|wreck)\b\s*[.!]", m.group(1), re.I):
            bad.append("script [VERDICT] needs a full sentence \"It's a spec.\" / \"It's a wreck.\" (SCRIPT_STYLE #11)")
        if long_: warn.append(f"style: {len(long_)} sentence(s) over 14 words (#3): " + long_[0][:60])
    f = (d / "factsheet.md").read_text()
    if not re.search(r"VERDICT.*?\b\d{1,3}(\.\d)?\b.*?(SPEC|WRECK)", f, re.S | re.I):
        bad.append("factsheet.md needs a '## VERDICT' section with the score and SPEC/WRECK (VERDICT.md)")
    if "source" not in f.lower(): bad.append("factsheet.md needs sources")
    json.loads((d / "cues.json").read_text())
    return bad

if __name__ == "__main__":
    probs = check(sys.argv[1])
    print("PASS" if not probs else "FAIL\n- " + "\n- ".join(probs))
    if warn: print("WARN (fix before pushing)\n- " + "\n- ".join(warn))
    sys.exit(1 if probs else 0)

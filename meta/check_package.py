"""Check a video package before pushing it: python -m meta.check_package <slug>
Prints PASS or a list of problems. Used by script chats (WORKFLOW.md) so every package has the same shape."""
import json, re, sys
from pathlib import Path

REQUIRED = ["factsheet.md", "script.md", "cues.json", "metadata.json"]
META_KEYS = ["title", "description", "tags", "categoryId", "defaultLanguage", "madeForKids",
             "containsSyntheticMedia", "pinned_comment", "playlist", "format"]

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
    if m.get("format") == "short":
        words = len(re.findall(r"[A-Za-z0-9$']+", "\n".join(l for l in (d / "script.md").read_text().splitlines()
                                                             if l.strip() and not l.startswith(("#", "[")))))
        if not 90 <= words <= 150: bad.append(f"script {words} words (Shorts: 100–130)")
    f = (d / "factsheet.md").read_text()
    if not re.search(r"VERDICT.*?\b\d{1,3}(\.\d)?\b.*?(SPEC|WRECK)", f, re.S | re.I):
        bad.append("factsheet.md needs a '## VERDICT' section with the score and SPEC/WRECK (VERDICT.md)")
    if "source" not in f.lower(): bad.append("factsheet.md needs sources")
    json.loads((d / "cues.json").read_text())
    return bad

if __name__ == "__main__":
    probs = check(sys.argv[1])
    print("PASS" if not probs else "FAIL\n- " + "\n- ".join(probs))
    sys.exit(1 if probs else 0)

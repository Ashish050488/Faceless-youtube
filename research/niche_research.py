"""Measure candidate niches with the YouTube Data API (brief §1).

    python -m research.niche_research            # runs all niches, caches raw pulls in state/niche_cache/
    python -m research.niche_research --report   # rebuild state/niche_report.md from cache only

Quota: search.list = 100 units. 7 niches x 12 seeds = 8,400 units (default daily quota 10,000).
Cached per query, so a quota-exhausted run resumes next day.
"""
import argparse
import datetime as dt
import json
import re
import statistics as st
from pathlib import Path

from yt import client

CACHE = Path("state/niche_cache")  # committed so fresh sessions can resume
REPORT = Path("state/niche_report.md")

NICHES = {
    "personal_finance_basics": [
        "how compound interest works", "index funds explained", "how credit scores work",
        "how to budget explained", "inflation explained", "what is an emergency fund",
        "roth ira explained", "how taxes work explained", "why rent is so expensive",
        "how mortgages work", "how banks make money", "stock market explained beginners"],
    "business_money_explainers": [
        "how does company make money", "why company failed", "business model explained",
        "how costco makes money", "why prices keep rising", "how airlines make money",
        "rise and fall of company", "how monopolies work", "economics explained",
        "how supply chains work", "why is it so cheap", "how franchises work"],
    "tech_explainers": [
        "how does it actually work tech", "how gps works", "how the internet works",
        "how computer chips are made", "how wifi works", "how batteries work",
        "how encryption works", "how touchscreens work", "how data centers work",
        "how cpu works", "how 5g works", "how satellites work"],
    "ai_software_tutorials": [
        "ai tools tutorial", "chatgpt tutorial beginners", "notion tutorial",
        "excel tips tutorial", "automate with ai", "best ai tools for work",
        "claude ai tutorial", "n8n automation tutorial", "canva tutorial",
        "google sheets tutorial", "obsidian tutorial", "ai productivity workflow"],
    "science_engineering": [
        "engineering explained", "how bridges are built", "why planes fly",
        "how nuclear reactors work", "how dams work", "how skyscrapers stand",
        "physics explained simply", "how rockets work", "how tunnels are built",
        "materials science explained", "how ships float", "how power grid works"],
    "history_mysteries": [
        "history mystery explained", "unsolved history mystery", "lost civilization",
        "ancient engineering mystery", "what happened to", "history explained",
        "forgotten history", "ancient rome daily life", "medieval life explained",
        "history of empire explained", "ancient egypt mystery", "lost city found"],
    "geography_why_country": [
        "why is this country", "geography explained", "why does country exist",
        "border explained", "why is population there", "map explained",
        "why is country so rich", "why is country so poor", "geopolitics explained simply",
        "why cities are where they are", "strange borders", "country explained"],
}


def iso_dur_s(d):
    m = re.fullmatch(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", d or "")
    if not m:
        return 0
    dd, h, mi, s = (int(x or 0) for x in m.groups())
    return dd * 86400 + h * 3600 + mi * 60 + s


def pull(niche, q, since):
    f = CACHE / niche / (re.sub(r"\W+", "_", q) + ".json")
    if f.exists():
        return json.loads(f.read_text())
    items = client.search(q, since, max_results=25, video_duration="medium")  # 4–20 min
    ids = [i["id"]["videoId"] for i in items]
    vids = client.videos(ids) if ids else []
    chs = client.channels(list({v["snippet"]["channelId"] for v in vids})) if vids else []
    data = {"q": q, "since": since, "videos": vids, "channels": chs}
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps(data))
    return data


def metrics(pulls):
    vids, chs = {}, {}
    for p in pulls:
        for v in p["videos"]:
            vids[v["id"]] = v
        for c in p["channels"]:
            chs[c["id"]] = c
    rows = []
    for v in vids.values():
        c = chs.get(v["snippet"]["channelId"])
        if not c:
            continue
        subs = int(c["statistics"].get("subscriberCount", 0) or 0)
        views = int(v["statistics"].get("viewCount", 0) or 0)
        rows.append({"views": views, "subs": subs, "len": iso_dur_s(v["contentDetails"]["duration"]),
                     "ch": c["id"], "ch_videos": int(c["statistics"].get("videoCount", 0) or 0),
                     "ch_title": c["snippet"]["title"], "title": v["snippet"]["title"]})
    if not rows:
        return None
    rows.sort(key=lambda r: -r["views"])
    top = rows[:100]
    small_top = [r for r in top if r["subs"] < 50_000]
    small_outliers = [r for r in rows if r["subs"] < 50_000 and r["subs"] > 0 and r["views"] / r["subs"] >= 3]
    # top-10 channels by views in sample; upload frequency proxy = lifetime videos (exact cadence needs uploads pull)
    by_ch = {}
    for r in rows:
        by_ch.setdefault(r["ch"], r)
    top_ch = sorted(by_ch.values(), key=lambda r: -r["views"])[:10]
    return {
        "videos_sampled": len(rows),
        "median_views": int(st.median(r["views"] for r in rows)),
        "median_outlier_score": round(st.median(r["views"] / max(r["subs"], 1) for r in rows), 2),
        "share_top100_from_sub50k": round(len(small_top) / len(top), 2),
        "small_channel_3x_outliers": len(small_outliers),
        "median_length_min": round(st.median(r["len"] for r in rows) / 60, 1),
        "top10_channels": [{"title": r["ch_title"], "subs": r["subs"], "lifetime_videos": r["ch_videos"]} for r in top_ch],
        "example_small_outliers": [{"title": r["title"], "views": r["views"], "subs": r["subs"]}
                                   for r in sorted(small_outliers, key=lambda r: -r["views"] / max(r["subs"], 1))[:5]],
    }


def write_report(results, since):
    lines = [f"# Niche report", "",
             f"Window: videos published since {since[:10]} (90 days), YouTube search order=viewCount, "
             f"videoDuration=medium (4–20 min), 25 results per seed query.", "",
             "All numbers below are **measured** from the API sample unless marked *estimate*. "
             "RPM is not available from the API; RPM tier is an *estimate* from public industry ranges.", "",
             "| Niche | Sampled | Median views | Median views/subs | Top-100 share from <50K-sub channels | <50K 3× outliers | Median length (min) |",
             "|---|---|---|---|---|---|---|"]
    for n, m in results.items():
        if m:
            lines.append(f"| {n} | {m['videos_sampled']} | {m['median_views']:,} | {m['median_outlier_score']} | "
                         f"{m['share_top100_from_sub50k']:.0%} | {m['small_channel_3x_outliers']} | {m['median_length_min']} |")
    for n, m in results.items():
        if not m:
            continue
        lines += ["", f"## {n}", "", "Top 10 channels in sample (*measured*):"]
        lines += [f"- {c['title']} — {c['subs']:,} subs, {c['lifetime_videos']} lifetime videos" for c in m["top10_channels"]]
        lines += ["", "Small-channel outliers (*measured*):"]
        lines += [f"- \"{e['title']}\" — {e['views']:,} views on {e['subs']:,} subs" for e in m["example_small_outliers"]] or ["- none"]
    REPORT.write_text("\n".join(lines) + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true")
    a = ap.parse_args()
    since = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=90)).strftime("%Y-%m-%dT00:00:00Z")
    results = {}
    for niche, seeds in NICHES.items():
        pulls = []
        for q in seeds:
            if a.report:
                f = CACHE / niche / (re.sub(r"\W+", "_", q) + ".json")
                if f.exists():
                    pulls.append(json.loads(f.read_text()))
                continue
            try:
                pulls.append(pull(niche, q, since))
            except RuntimeError as e:
                if "quotaExceeded" in str(e):
                    print("quota exhausted; rerun tomorrow (cache keeps progress)")
                    write_report(results, since)
                    return
                raise
        results[niche] = metrics(pulls)
    write_report(results, since)
    print(f"wrote {REPORT}")


if __name__ == "__main__":
    main()

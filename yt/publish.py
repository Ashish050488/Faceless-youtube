"""Publish a finished video with all metadata in one go.

    python -m yt.publish <slug> <handoff_dir> [--privacy public|unlisted|private] [--publish-at ISO8601]

Reads scripts/<slug>/metadata.json. Expects in handoff_dir: video.mp4, thumbnail.jpg, captions.srt, sha256.txt.
Steps: verify checksums -> videos.insert -> thumbnail -> captions -> playlist -> first comment -> verify status
-> record in state/videos.json.
"""
import argparse, hashlib, json, time
from pathlib import Path

from . import client


def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def verify(handoff: Path):
    f = handoff / "sha256.txt"
    if not f.exists():
        print("no sha256.txt — skipping checksum verification")
        return
    for line in f.read_text().splitlines():
        if not line.strip():
            continue
        digest, name = line.split()[0], line.split()[-1].lstrip("*")
        got = sha256(handoff / Path(name).name)
        if got != digest:
            raise SystemExit(f"checksum mismatch: {name}")
    print("checksums OK")


def find_or_create_playlist(title):
    r = client._req("GET", f"{client.DATA}/playlists", oauth=True, params={"part": "snippet", "mine": "true", "maxResults": 50})
    for p in r.get("items", []):
        if p["snippet"]["title"] == title:
            return p["id"]
    return client.create_playlist(title, "Every new gadget, one verdict: spec or wreck.")["id"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug"); ap.add_argument("handoff")
    ap.add_argument("--privacy", default="public"); ap.add_argument("--publish-at")
    a = ap.parse_args()
    handoff = Path(a.handoff)
    meta = json.loads(Path(f"scripts/{a.slug}/metadata.json").read_text())
    verify(handoff)
    video = handoff / "video.mp4"
    mb = video.stat().st_size / 1e6
    print(f"video {mb:.1f} MB")

    tags, total = [], 0
    for t in meta["tags"]:  # YouTube's 500-char tag limit (quoted multi-word tags count extra)
        cost = len(t) + (2 if " " in t else 0) + 1
        if total + cost > 495:
            break
        tags.append(t); total += cost

    snippet = {"title": meta["title"], "description": meta["description"], "tags": tags,
               "categoryId": meta.get("categoryId", "28"), "defaultLanguage": meta.get("defaultLanguage", "en"),
               "defaultAudioLanguage": meta.get("defaultAudioLanguage", "en")}
    status = {"privacyStatus": "private" if a.publish_at else a.privacy, "selfDeclaredMadeForKids": False,
              "license": "youtube", "embeddable": True, "publicStatsViewable": True,
              "containsSyntheticMedia": bool(meta.get("containsSyntheticMedia", False))}
    if a.publish_at:
        status["publishAt"] = a.publish_at
    r = client.insert_video(str(video), snippet, status)
    vid = r["id"]
    print("uploaded:", vid, r["status"].get("privacyStatus"))

    for step, fn in [
        ("thumbnail", lambda: client.set_thumbnail(vid, str(handoff / "thumbnail.jpg"))),
        ("captions", lambda: client.upload_captions(vid, str(handoff / "captions.srt"))),
        ("playlist", lambda: client.add_to_playlist(find_or_create_playlist(meta.get("playlist", "New Gadgets: Spec or Wreck")), vid)),
        ("comment", lambda: client.post_comment(vid, meta["pinned_comment"])),
    ]:
        try:
            fn(); print(step, "OK")
        except Exception as e:  # keep going; report at the end
            print(step, "FAILED:", str(e)[:200])

    time.sleep(30)
    st = client._req("GET", f"{client.DATA}/videos", oauth=True, params={"part": "status,processingDetails", "id": vid})["items"][0]
    print("status:", st["status"], st.get("processingDetails", {}).get("processingStatus"))

    vids = json.loads(Path("state/videos.json").read_text())
    for v in vids:
        if v.get("slug") == a.slug:
            v.update({"id": vid, "status": "uploaded", "privacy": st["status"]["privacyStatus"],
                      "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "size_mb": round(mb, 1)})
    Path("state/videos.json").write_text(json.dumps(vids, indent=1))
    print("https://youtube.com/shorts/" + vid)


if __name__ == "__main__":
    main()

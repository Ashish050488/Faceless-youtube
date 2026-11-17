"""Thin YouTube Data + Analytics API client (REST, no google SDK)."""
import json
import os
import time
from pathlib import Path

import requests

from .auth import access_token, env

DATA = "https://www.googleapis.com/youtube/v3"
UPLOAD = "https://www.googleapis.com/upload/youtube/v3"
ANALYTICS = "https://youtubeanalytics.googleapis.com/v2/reports"


def _req(method, url, *, oauth=False, params=None, retries=4, **kw):
    params = dict(params or {})
    headers = kw.pop("headers", {})
    import os
    if oauth or not os.environ.get("YT_API_KEY"):  # no API key -> use the OAuth token (same quota)
        headers["Authorization"] = f"Bearer {access_token()}"
    else:
        params["key"] = env("YT_API_KEY")
    for i in range(retries):
        r = requests.request(method, url, params=params, headers=headers, timeout=120, **kw)
        if r.status_code in (500, 502, 503, 504) and i < retries - 1:
            time.sleep(2 ** i)
            continue
        if not r.ok:
            raise RuntimeError(f"{method} {url.split('?')[0]} -> {r.status_code}: {r.text[:400]}")
        return r.json() if r.content else {}


# ---------- public reads (API key) ----------
def search(q, published_after, max_results=50, order="viewCount", video_duration=None):
    p = {"part": "snippet", "q": q, "type": "video", "order": order,
         "publishedAfter": published_after, "maxResults": max_results}
    if video_duration:
        p["videoDuration"] = video_duration
    return _req("GET", f"{DATA}/search", params=p).get("items", [])


def videos(ids, part="snippet,statistics,contentDetails"):
    out = []
    for i in range(0, len(ids), 50):
        out += _req("GET", f"{DATA}/videos", params={"part": part, "id": ",".join(ids[i:i + 50])}).get("items", [])
    return out


def channels(ids, part="snippet,statistics,contentDetails"):
    out = []
    for i in range(0, len(ids), 50):
        out += _req("GET", f"{DATA}/channels", params={"part": part, "id": ",".join(ids[i:i + 50])}).get("items", [])
    return out


def recent_uploads(uploads_playlist_id, n=20):
    items = _req("GET", f"{DATA}/playlistItems", params={
        "part": "contentDetails", "playlistId": uploads_playlist_id, "maxResults": min(n, 50)}).get("items", [])
    return [i["contentDetails"]["videoId"] for i in items]


# ---------- own channel (OAuth) ----------
def my_channel():
    items = _req("GET", f"{DATA}/channels", oauth=True,
                 params={"part": "snippet,statistics,contentDetails,brandingSettings", "mine": "true"}).get("items", [])
    return items[0] if items else None


def update_video(video_id, snippet: dict, status: dict | None = None):
    parts = ["snippet"] + (["status"] if status else [])
    body = {"id": video_id, "snippet": snippet}
    if status:
        body["status"] = status
    return _req("PUT", f"{DATA}/videos", oauth=True, params={"part": ",".join(parts)}, json=body)


def set_thumbnail(video_id, path):
    with open(path, "rb") as f:
        return _req("POST", f"{UPLOAD}/thumbnails/set", oauth=True, params={"videoId": video_id},
                    headers={"Content-Type": "image/jpeg" if str(path).endswith(".jpg") else "image/png"}, data=f)


def upload_captions(video_id, srt_path, language="en", name="English"):
    meta = {"snippet": {"videoId": video_id, "language": language, "name": name}}
    boundary = "capb0undary"
    body = (f"--{boundary}\r\nContent-Type: application/json\r\n\r\n{json.dumps(meta)}\r\n"
            f"--{boundary}\r\nContent-Type: application/octet-stream\r\n\r\n").encode() + \
        Path(srt_path).read_bytes() + f"\r\n--{boundary}--".encode()
    return _req("POST", f"{UPLOAD}/captions", oauth=True, params={"part": "snippet", "uploadType": "multipart"},
                headers={"Content-Type": f"multipart/related; boundary={boundary}"}, data=body)


def add_to_playlist(playlist_id, video_id):
    return _req("POST", f"{DATA}/playlistItems", oauth=True, params={"part": "snippet"},
                json={"snippet": {"playlistId": playlist_id, "resourceId": {"kind": "youtube#video", "videoId": video_id}}})


def create_playlist(title, description=""):
    return _req("POST", f"{DATA}/playlists", oauth=True, params={"part": "snippet,status"},
                json={"snippet": {"title": title, "description": description}, "status": {"privacyStatus": "public"}})


def post_comment(video_id, text):
    """Top-level comment as the channel. Pinning is not available in the API; owner pins in Studio
    (or it stays the first comment since it's posted first)."""
    return _req("POST", f"{DATA}/commentThreads", oauth=True, params={"part": "snippet"},
                json={"snippet": {"videoId": video_id, "topLevelComment": {"snippet": {"textOriginal": text}}}})


def insert_video(path, snippet: dict, status: dict):
    """Resumable upload. NOTE: unaudited projects -> video locked private."""
    meta = {"snippet": snippet, "status": status}
    size = os.path.getsize(path)
    init = requests.post(f"{UPLOAD}/videos", params={"uploadType": "resumable", "part": "snippet,status"},
                         headers={"Authorization": f"Bearer {access_token()}",
                                  "Content-Type": "application/json; charset=UTF-8",
                                  "X-Upload-Content-Length": str(size), "X-Upload-Content-Type": "video/mp4"},
                         json=meta, timeout=60)
    init.raise_for_status()
    loc = init.headers["Location"]
    with open(path, "rb") as f:
        r = requests.put(loc, data=f, headers={"Authorization": f"Bearer {access_token()}",
                                               "Content-Type": "video/mp4"}, timeout=3600)
    r.raise_for_status()
    return r.json()


def analytics(start, end, metrics, dimensions=None, filters=None, sort=None, max_results=None):
    p = {"ids": "channel==MINE", "startDate": start, "endDate": end, "metrics": metrics}
    for k, v in (("dimensions", dimensions), ("filters", filters), ("sort", sort), ("maxResults", max_results)):
        if v:
            p[k] = v
    return _req("GET", ANALYTICS, oauth=True, params=p)

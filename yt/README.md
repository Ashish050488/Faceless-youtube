# yt/ — YouTube API (keys from env: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN — never print)
- Publish a finished video: `python -m yt.publish <slug> <handoff_dir> [--privacy public | --publish-at 2026-11-20T07:30:00Z]`
  (checks sha256, uploads, thumbnail, captions, playlist, comment when public, updates state/videos.json)
- Make a scheduled video public now: `client.update_video(id, snippet, {"privacyStatus": "public", "selfDeclaredMadeForKids": False})`
- Stats: `client.videos([ids], part="statistics,status")`; Analytics: `client._req("GET", client.ANALYTICS, oauth=True, params=...)`

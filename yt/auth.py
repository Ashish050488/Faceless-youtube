"""OAuth for the channel. Keys come from env vars only and are never printed.

First-time setup (creates YT_REFRESH_TOKEN):
    python -m yt.auth link            -> prints a Google login URL
    owner signs in, browser lands on http://localhost/?code=...  (page fails to load; that's fine)
    python -m yt.auth exchange '<that full localhost URL>'
                                      -> writes the refresh token to secrets/refresh_token (gitignored)
    owner copies it into the environment as YT_REFRESH_TOKEN.
"""
import os
import sys
import urllib.parse
from pathlib import Path

import requests

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
REDIRECT = "http://localhost"
SCOPES = [
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
]


class MissingKey(RuntimeError):
    pass


def env(name: str) -> str:
    v = os.environ.get(name, "").strip()
    if not v:
        raise MissingKey(f"{name} is not set in the environment")
    return v


def login_link() -> str:
    q = {
        "client_id": env("YT_CLIENT_ID"),
        "redirect_uri": REDIRECT,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
    }
    return AUTH_URL + "?" + urllib.parse.urlencode(q)


def exchange(localhost_url: str) -> Path:
    code = urllib.parse.parse_qs(urllib.parse.urlparse(localhost_url).query).get("code", [None])[0]
    if not code:
        raise ValueError("no ?code= in that URL")
    r = requests.post(TOKEN_URL, data={
        "code": code,
        "client_id": env("YT_CLIENT_ID"),
        "client_secret": env("YT_CLIENT_SECRET"),
        "redirect_uri": REDIRECT,
        "grant_type": "authorization_code",
    }, timeout=30)
    r.raise_for_status()
    tok = r.json().get("refresh_token")
    if not tok:
        raise RuntimeError("Google returned no refresh_token (revoke app access and retry with prompt=consent)")
    out = Path("secrets/refresh_token")
    out.parent.mkdir(exist_ok=True)
    out.write_text(tok)
    out.chmod(0o600)
    return out


_cache = {}


def access_token() -> str:
    if "tok" in _cache:
        return _cache["tok"]
    r = requests.post(TOKEN_URL, data={
        "client_id": env("YT_CLIENT_ID"),
        "client_secret": env("YT_CLIENT_SECRET"),
        "refresh_token": env("YT_REFRESH_TOKEN"),
        "grant_type": "refresh_token",
    }, timeout=30)
    if r.status_code == 400 and "invalid_grant" in r.text:
        raise MissingKey("YT_REFRESH_TOKEN expired/revoked — owner must redo `python -m yt.auth link` "
                         "(check the OAuth app is 'In production', not 'Testing')")
    r.raise_for_status()
    _cache["tok"] = r.json()["access_token"]
    return _cache["tok"]


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "link":
        print(login_link())
    elif cmd == "exchange" and len(sys.argv) == 3:
        print(f"refresh token saved to {exchange(sys.argv[2])} (not printed)")
    elif cmd == "check":
        access_token()
        print("OAuth OK")
    else:
        print(__doc__)

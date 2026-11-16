# Learnings (newest first)

## 2026-11-16 — renamed to "Spec or Wreck"
- Owner: "The Catch" is used by multiple channels. Checked via API: @specorwreck free, and a channel search for
  "Spec or Wreck" returns no channel with that name (closest: "Wreck Spec Rebuilds", cars). Also free handles:
  @hypeorhold, @specsandsnags, @specautopsy, @gizmoverdict, @specshock.
- Channel description + keywords updated via API. The API cannot change channel name/handle (tested: title change
  accepted but ignored) — owner sets Name "Spec or Wreck" + handle @specorwreck in Studio.
- "THE CATCH" stays as the in-video moment; the verdict now ends "SPEC" (cyan) or "WRECK" (amber) plus who it's for.

## 2026-11-16 — rebrand
- Name chosen: "The Catch" (@thecatch free on check). Tagline "Every new gadget has one."
  Signature format element: THE CATCH moment in every video (amber stamp) + WORTH IT IF / SKIP IT IF verdict.
- API-applied: channel description, keywords, country IN, default language en. Owner must set name, @handle,
  avatar and banner in Studio (the API can't change the name or handle).
- Full spec: state/brand.md. Benchmark watched frame-by-frame (Bose, Logitech): only 8–11 hard cuts per ~75 s;
  motion comes from continuous camera moves on one canvas.

## 2026-11-16 — decisions (owner: "totally up to you")
- Niche: new physical tech products, Shorts-first, with a real verdict. Long-form = weekly experiment later.
- Look: navy/charcoal + white + electric-cyan accent (our own, not the benchmark's cream/orange).
- Cadence target: 1 Short/day to start, 2/day once the video pipeline is stable.
- Evidence: state/competitor_watch/techyornot_full.md, state/playbook_shorts.md.

## 2026-11-16 — old content deleted (owner approved "delete all")
- Deleted all 160 old anime videos via API (160/160 OK). IDs/titles kept in state/deleted_old_videos.json.
- Used ~8,000 API quota units today; niche research waits for the daily quota reset (midnight Pacific).
- Next: niche research -> owner picks niche -> rebrand (description, keywords, banner via API; name + profile picture in Studio).

## 2026-11-16 — login done
- OAuth works. Logged-in channel = "Algorithmic Aura" (created 2022-09-26, IN): 136 subs, 160 videos, 175,346 views (*measured*).
- Recent uploads: ~40 s Jujutsu Kaisen Shorts + 5 s anime meme edits, 0.5K–8.7K views each (*measured*).
- Risk: anime clips = reused content/copyright; templated JJK Shorts = inauthentic. YPP review checks the whole channel. Owner decision needed: new channel vs keep this one.

## 2026-11-16 — setup
- Toolkit scaffolded. Blocked on: repo push access, Google Cloud keys, Pexels key, API audit.

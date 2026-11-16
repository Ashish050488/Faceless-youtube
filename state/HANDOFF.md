# Handoff for the next "Faceless script" session (2026-11-16)

Read this first, then state/learnings.md, state/niche_report.md, state/policy_notes.md.

## Done
- OAuth works for channel "Algorithmic Aura" (UC id via yt.client.my_channel()). Keys are NOT in git:
  owner must re-add them as env vars (YT_API_KEY, YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN) in the
  new session's environment, or paste once into a gitignored secrets/.env.
- All 160 old anime videos deleted (owner-approved). 136 subs kept.
- Benchmark competitor: Techy or Not (UC5lOPAwhZ6buYsbWK257YJg) — raw data in state/competitors_raw/techyornot.json.
- Drive (layer3studios.team account — owner OK'd using it): "Faceless Channel" 1JSN2GwM8lZPCpbauy4K3zdNMJh2GiuiK,
  subfolder "Watch" 18mwc8tcDL06_UMnpKPTAC2Txlnp5YTj4. Do NOT touch the existing "Youtube" folder (other project).

## Next
1. TubeAlfred (now connected): /youtube-shorts on @TechyorNot — transcripts of top 5 + bottom 3 Shorts; save hooks to niche_report.md.
2. Run full niche research (python -m research.niche_research) once quota resets; owner picks niche.
3. Rebrand (description/keywords/banner via API; name/handle/avatar by owner in Studio).
4. Split of work: this session = research, scripts, metadata, uploads, analytics. "Faceless video" session = rendering.

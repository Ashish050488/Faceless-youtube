# sow025 — assets (official Samsung press images, checked 27 Nov 2026)
Page: https://www.samsungmobilepress.com/media-assets/galaxy-watch8 (also /media-assets/galaxy-watch9, /galaxy-watch8-classic).
The page HTML only holds 800 px previews. Originals: take each image's `downloadKey` from the page's embedded JSON
(`"downloadKey":"…","filename":"…jpg"`), then
`curl -X POST -H 'Content-Type: application/json' -d '{"keys":["<key>"]}' https://api.samsungmobilepress.com/api/v1/file-download/url`
→ returns signed S3 URLs (expire), download those. Measured originals:

| # | File | Size | Use |
|---|---|---|---|
| A | 001-galaxy-watch8-silver-40mm-front.jpg | 3000×2000 | hero, cut out (white bg) |
| B | 007-galaxy-watch8-graphite-40mm-front.jpg | 5683×8525 | second colour, vertical |
| C | 003-galaxy-watch8-silver-40mm-r-perspective.jpg | 3000×2000 | angle shot |
| D | 005-product-design-galaxy-watch8-silver-1p.jpg | 4134×5846 | design KV |
| E | 003-kv-product-galaxy-watch8-main-OOH-vertical.jpg | 7087×14173 | vertical KV (crop) |
| F | Watch9 front image from /media-assets/galaxy-watch9 (same method; pick a front-view silver/graphite, ≥ 1600 px) | — | price compare |
| G | Article image "Vitals" (watch + phone Vitals screen) from the 24 Nov release | 1440×960 | ONLY as a small inset (< 1600 px) |

No official product-page clips used (press stills only). Credit: "Product images: Samsung (press kit)".

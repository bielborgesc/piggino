# PWA Icons — Action Required

The PWA manifest references PNG icons that must be present at build time:

- `public/pwa-192x192.png`
- `public/pwa-512x512.png`

## How to generate them

1. Visit https://realfavicongenerator.net or https://www.pwabuilder.com/imageGenerator
2. Upload your logo (the existing `piggino-logo.jpg` in this folder works perfectly)
3. Download the generated icon pack
4. Place `pwa-192x192.png` and `pwa-512x512.png` into the `frontend/public/` directory

## Temporary placeholders

`pwa-192x192.svg` and `pwa-512x512.svg` are included as visual placeholders only.
They will NOT satisfy the manifest PNG requirement for installability.
Replace them with the real PNGs before deploying to production.

## Color reference

- Background: `#1e293b` (slate-800)
- Accent: `#22c55e` (green-500)

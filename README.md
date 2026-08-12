# irfanzakir — personal static site

This repository is a tiny static personal site / portfolio for a Roblox game developer (irfanzakir). It contains a single-page site (index.html) that displays a short bio and a showcase carousel populated from images/manifest.json.

Purpose
- Provide a lightweight, public portfolio page.
- Showcase images/videos from the `images/` directory.

Quick links
- Live files: `index.html` (root)
- Assets: `images/` (profile + showcase images)
- Carousel manifest: `images/manifest.json`

Deploy (GitHub Pages)
1. Push the repository to GitHub (already on this account).
2. Open the repository on GitHub → Settings → Pages.
3. Under "Source", select the branch `main` and folder `/(root)`.
4. Save. The site will become available at `https://<your-username>.github.io/page/` (or a similar URL shown in the Pages settings).

Local testing
- Serve the repo locally (recommended so fetch() works):

```bash
# Python 3
python -m http.server 8000
# open http://localhost:8000/

# Node (http-server)
npx http-server -c-1
# open http://localhost:8080/
```

Image recommendations
- Profile image: 92×92 (square) or a larger square (e.g. 512×512) and allow the page to scale it down. Use PNG or JPG.
- Showcase images: aim for a balance of visual quality and file size. Recommended:
  - Desktop/hero images: 1280–1920px wide, WebP or optimized PNG/JPG, under ~300–400 KB each if possible.
  - Mobile: smaller images will be loaded thanks to lazy-loading

Specific note for images/showcase_2.png
- This file appears large in the repository. If you want faster loads, consider resizing to 1280px wide and exporting with moderate quality (70–80%) or convert to WebP.

Maintaining the repository
- The carousel is driven by `images/manifest.json`. Add any new image or video filenames to the manifest (or remove them to hide them from the showcase).
- If you prefer automatic discovery instead of a manifest, we can add a small server-side build step to enumerate files into the manifest before deploy.

What I changed (recent)
- Extracted CSS and JS into `assets/styles.css` and `assets/app.js` for maintainability.
- Improved lazy-loading for carousel media and added a minimal fallback when `images/manifest.json` fails to load.
- Added a lightweight GitHub Actions workflow `.github/workflows/site-check.yml` to verify the site serves locally inside CI (simple smoke test).

Contributing
- PRs are welcome. For asset changes, update `images/manifest.json` and push the new files into `images/`.

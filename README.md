# My Health Check Scan

Scan a food barcode to see:
- ingredients that are banned or being removed from U.S. food, or banned elsewhere (with official sources)
- allergens, and anything on your personal "avoid" list
- nutrition, Nutri-Score and how processed it is
- healthier options in the same category, with a side-by-side comparison

Product data: [Open Food Facts](https://world.openfoodfacts.org), a free public database (no key needed).
Ingredient rules live in `ingredients.js`. Review them every few months, because food laws are changing fast.

## Rebranding
Change the name, tagline and colors in `brand.js` (and the title in `index.html`).

## Render (Static Site)
- Build command: `npm install && npm run build`
- Publish directory: `dist`

All files sit in the main folder of the repo; no subfolders are needed.

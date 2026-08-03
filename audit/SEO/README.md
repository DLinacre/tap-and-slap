# SEO assets

| File | Purpose |
|---|---|
| `metadata.md` | Page title / meta / OG / Twitter recipe (already live in `src/app/layout.tsx`) |
| `faq-content.md` | Long-tail FAQ content for the README (new) |
| `gsc-checklist.md` | Post-deploy Google Search Console checklist |
| `../Schema/videogame.jsonld` | JSON-LD VideoGame schema (live) |
| `../Robots/robots.txt` | Live via `src/app/robots.ts` |
| `../Metadata/` | Metadata reference |

## Post-deploy SEO checklist (10 min)

1. Deploy → set repo `homepage` to the live URL.
2. Google Search Console → add property → verify (DNS or meta tag).
3. Submit `https://<origin>/sitemap.xml` for indexing.
4. Request indexing for the homepage.
5. Upload social preview (repo Settings) — affects every share, not Google,
   but also powers OG-image discovery for the repo page.
6. Within weeks, search for `tap and slap game` / `dance mat beat em up` —
   iterate on README keywords based on impressions.

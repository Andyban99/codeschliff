# codeschliff.de — Startseite

Marketing-Website der Software- und Webagentur **codeschliff** (Hamburg).
Basis: Brand Kit v1.0 + Entwurf „4A Schnittstelle" aus dem Design-Handoff.

## Stack

Bewusst ohne Framework: statisches HTML + CSS + Vanilla-JS.

- `css/tokens.css` — verbindliche Design-Tokens aus dem Brand Kit (Erste Stildatei)
- `css/style.css` — Komponenten + Inszenierung
- `js/main.js` — Interaktionsebene
- `js/vendor/` — GSAP 3.12 + ScrollTrigger + Lenis 1.1 (lokal, kein CDN)

## Inszenierung

Preloader (Signet baut sich auf), Custom Cursor (Quadratpunkt), Lenis Smooth
Scroll, ScrollTrigger-Reveals nach Brand-Kit-Werten (240 ms / 60 ms Kaskade),
Maskenöffnung der Manifest-Sektion, mausfolgende Video-Vorschau in den
Leistungen, gepinnter Horizontal-Lauf im Ablauf, Zähler, Marquees,
3D-Neigungen. `prefers-reduced-motion: reduce` schaltet alles ab.

## Video-Assets

Alle Filme wurden mit **Higgsfield** erzeugt: Stills mit Cinema Studio
Image 2.5 (2K), animiert per Kling 3.0 Pro (Image-to-Video, 5 s, ohne Ton).
Die Rohbilder liegen lokal unter `assets/img/src-*.png` (nicht im Repo).

| Datei | Motiv | Einsatz |
|---|---|---|
| `seam.mp4` | Glühende Naht im Obsidian | Hero-Panel + Manifest |
| `sparks.mp4` | Schleiffunken | Zahlen-Band |
| `monolith.mp4` | Glasmonolith, rote Naht | Werkstatt 01 / Vorschau Websites |
| `cubes.mp4` | Glaswürfel | Werkstatt 02 / Vorschau Shops |
| `traces.mp4` | Rote Leiterbahnen | Werkstatt 03 / Vorschau Systeme |
| `studio.mp4` | Lichtstrahl in der Werkstatt | Studio-Sektion |

## Lokal starten

```bash
node serve.js
# → http://localhost:4173
```

## Deployment

GitHub Pages, Custom Domain `codeschliff.de` (Datei `CNAME`).
Jeder Push auf `main` geht live.

## Offene Punkte (aus dem Handoff)

- Impressum + Datenschutzerklärung: Firmierung/Anschrift fehlen noch (Links sind Platzhalter)
- Formularversand: aktuell simuliert — Endpunkt (z. B. Formspree o. eigenes Backend) anbinden in `js/main.js`
- „Max Bergmann" / Preise sind laut Handoff Platzhalter

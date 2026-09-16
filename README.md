# codeschliff.de — Startseite

Marketing-Website der Software- und Webagentur **codeschliff** (Hamburg).
Basis: Brand Kit v1.0 + Entwurf „4A Schnittstelle" aus dem Design-Handoff.

## Stack

Bewusst ohne Framework: statisches HTML + CSS + Vanilla-JS.

- `css/tokens.css` — verbindliche Design-Tokens aus dem Brand Kit (Erste Stildatei)
- `css/style.css` — Komponenten + Inszenierung
- `js/main.js` — zwei getrennte Einheiten: Bewegungsschicht und Kontaktformular.
  Das Formular hängt bewusst nicht an GSAP — fällt die Animation aus, trägt es trotzdem.
- `js/vendor/` — GSAP 3.12 + ScrollTrigger + Lenis 1.1 (lokal, kein CDN)
- `js/buchung.js` — Terminbuchung (Erstgespräch), spricht direkt mit dem CRM
- `tools/contact-worker.js` — Endpunkt für den Formularversand (nicht Teil der Auslieferung)

## Inszenierung

Preloader (Signet baut sich auf), Custom Cursor (Quadratpunkt), Lenis Smooth
Scroll, ScrollTrigger-Reveals nach Brand-Kit-Werten (240 ms / 60 ms Kaskade),
Maskenöffnung der Manifest-Sektion, mausfolgende Video-Vorschau in den
Leistungen, gepinnter Horizontal-Lauf im Ablauf, Zähler, Marquees,
3D-Neigungen. `prefers-reduced-motion: reduce` schaltet alles ab.

## Terminbuchung (Erstgespräch)

Der Kontaktbereich ist ein Buchungs-Widget: Tag → Uhrzeit → Daten → bestätigt.
Es spricht die öffentliche Buchungs-API unseres CRM direkt an — **kein iframe**,
damit die Seite ihr eigenes Gesicht behält:

| Aufruf | Zweck |
|---|---|
| `GET  crm.zuschusspiloten.de/api/booking/slots?from&to&source=codeschliff` | freie Termine + Titel/Dauer der Marke |
| `POST crm.zuschusspiloten.de/api/booking` mit `source: "codeschliff"` | Termin anlegen: CRM-Kalender, Google-Meet-Raum, Bestätigungs-Mails |

Das CRM (Repo `Andyban99/TimoCRM`, Vercel) kennt die Marke `codeschliff` in
`lib/booking-brands.ts`: eigener Titel, 30 Minuten, Absender
`andrew.banoub@codeschliff.de`, Mail-Layout im codeschliff-Stil, Storno-Seite
im codeschliff-Stil. Verfügbarkeit, Kalender und Google-Konto sind dieselben wie
bei Zuschuss Piloten — ein Mensch, ein Kalender.

Fällt das CRM aus oder klappt eine Buchung nicht, zeigt das Widget das
klassische Nachrichtenformular (siehe unten). Nichts geht verloren.

**Lokal testen:** CRM mit `npm run dev` auf :3000 starten; `js/buchung.js`
schaltet auf `localhost` automatisch dorthin um. Das CRM erlaubt
`http://localhost:4173` als Herkunft nur außerhalb von Production.

**Ausrollen, in dieser Reihenfolge:** erst das CRM (CORS + Marke), dann diese
Seite. Umgekehrt würde das Widget bis zum CRM-Deploy in den Rückfall laufen.

## Kontaktformular (Nachricht)

Eine statische Seite hat kein Backend, und ein Browser kann kein SMTP sprechen.
Zugangsdaten dürfen nie in den Quelltext — dieses Repo ist öffentlich. Der
Versandweg wird deshalb an genau einer Stelle festgelegt, in `js/main.js`:

```js
var CONTACT = { endpoint: '', mail: 'andrew.banoub@codeschliff.de' };
```

| `endpoint` | Verhalten |
|---|---|
| leer | Der Browser übergibt die fertige Nachricht an das Mailprogramm des Absenders. Zwischenstand. |
| `https://formular.codeschliff.de/senden.php` | **Vorgesehener Weg.** `POST` an den eigenen IONOS-Endpunkt (`tools/senden.php`). |
| Worker-URL | Alternative über Cloudflare + Resend (`tools/contact-worker.js`) — zwei zusätzliche Auftragsverarbeiter. |

In jedem Fall gilt: **keine Erfolgsmeldung ohne tatsächlichen Versand.** Scheitert
die Übermittlung, bekommt der Besucher den fertigen Text zum Kopieren angezeigt,
dazu E-Mail-Adresse und Telefonnummer — die Anfrage geht nie verloren.

### Vorgesehener Weg: eigener Endpunkt bei IONOS

Post und Domain liegen ohnehin bei IONOS (`mx00/mx01.ionos.de`, SPF auf
`_spf-eu.ionos.com`). Der Endpunkt läuft dort mit — dadurch kommt **kein
zusätzlicher Anbieter ins Spiel** und es liegen **keine Zugangsdaten im
Quelltext**: `mail()` benutzt den Mailserver des Pakets direkt.

1. In IONOS eine Subdomain `formular.codeschliff.de` auf das Webhosting-Paket
   zeigen lassen (nicht auf GitHub Pages).
2. `tools/senden.php` als `/senden.php` in deren Webverzeichnis hochladen.
   Benötigt PHP 8.1 oder neuer.
3. In `js/main.js` eintragen:
   `endpoint: 'https://formular.codeschliff.de/senden.php'`
4. Abschnitt 05 der Datenschutzerklärung auf den neuen Weg umschreiben
   (IONOS als Hoster des Endpunkts, Rechtsgrundlage, Speicherdauer).

Der Endpunkt prüft die Herkunft, drosselt auf drei Anfragen je Minute und IP,
wertet den Honigtopf aus und säubert alles, was in eine Mail-Kopfzeile geht.
Antworten gehen per `Reply-To` direkt an den Interessenten.

Die Domain selbst bleibt dabei auf GitHub Pages — nur die Subdomain wandert.

## Video-Assets

Alle Filme wurden mit **Higgsfield** erzeugt: Stills mit Cinema Studio
Image 2.5 (2K), animiert per Kling 3.0 Pro (Image-to-Video, 5 s, ohne Ton).
Die Rohbilder liegen lokal unter `assets/img/src-*.png` (nicht im Repo).

Für die Auslieferung sind sie mit `avconvert` (macOS, kein Zusatzprogramm)
verkleinert — 48 MB auf 18 MB. Stufe nach Anzeigegröße:

```bash
# vollflächige Hintergründe
avconvert -s roh.mp4 -p Preset1280x720 -o assets/video/seam.mp4 --multiPass --replace
# Kacheln und Vorschau (nie größer als ~380 px dargestellt)
avconvert -s roh.mp4 -p Preset960x540  -o assets/video/cubes.mp4 --multiPass --replace
```

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

## Offene Punkte

- **Terminbuchung scharf schalten:** im CRM `npx prisma db push` (neue Spalte
  `bookings.source`), CRM deployen, dann diese Seite. Im CRM unter Einstellungen
  das Postfach `andrew.banoub@codeschliff.de` als E-Mail-Konto anlegen — sonst
  gehen codeschliff-Bestätigungen vom Zuschuss-Piloten-Postfach raus.
- **Endpunkt ausrollen:** `tools/senden.php` bei IONOS hochladen und
  `CONTACT.endpoint` setzen (siehe oben). Bis dahin läuft der Zwischenstand
  über das Mailprogramm des Absenders.
- Anwaltliche Prüfung der Rechtstexte steht aus.
- Die Werkstatt zeigt abstrakte Studien statt echter Referenzprojekte.
- Keine Preisangabe auf der Seite, obwohl „Festpreis" beworben wird.

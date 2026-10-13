# codeschliff.de — Startseite

Marketing-Website der Software- und Webagentur **codeschliff** (Hamburg).
Basis: Brand Kit v1.0 + Entwurf „4A Schnittstelle" aus dem Design-Handoff.

## Botschaft, Hero und Werkbank

Hero-Überschrift seit 13.10.2026: **„Software nach Maß, die Ihrem Unternehmen
Arbeit abnimmt."** — explizit statt Slogan, auf Wunsch des Inhabers anstelle
des Handoff-Claims „Gebaut, bis nichts mehr hakt." (der bleibt im Fuß und in
der Teilen-Vorschau). Botschaft: individuelle IT-Projekte für Unternehmen —
Websites, Webshops, Automatisierungen — zugeschnitten auf die Abläufe, mit KI
dort, wo sie hilft.

Der Hero ist zweispaltig und so breit wie der Rest der Seite (`--cs-content-max`).
Links Text (Überschrift bis 52 px, bei 1120 bis 1920 px ohne ungewollten Umbruch
gemessen), rechts der **Player** (`#kino`, `js/kino.js`): der Markenfilm
(`assets/video/codeschliff.mp4`, 74 s, 6,2 MB, H.264, mit Tonspur) in einer
Player-Karte aus Tinte (Glasrand, Radius), ohne Neigung. Leiste: Play/Pause,
klickbarer Fortschrittsbalken, Timecode, Ton. Infoleisten außerhalb des Bildes,
weil der Film eigene Ecklabels trägt. Autoplay stumm, großes helles Play-Zeichen
„Mit Ton abspielen", Klick aufs Bild pausiert. Pause außerhalb des Sichtfelds;
bei `prefers-reduced-motion` Start erst auf Klick.

**Großansicht:** Klick aufs Bild oder aufs Play-Zeichen holt den Player mittig nach
vorn (FLIP-Flug aus der Spalte, Seite dahinter abgedunkelt und gesperrt). Beim
ersten Mal startet der Film mit Ton von vorn, danach an der gemerkten Stelle.
Zurück per Klick daneben, Esc, „Schließen" oder Weiterscrollen/Wischen; danach
läuft wieder die stumme Vorschau („Weiter ansehen"). In der Großansicht pausiert
ein Klick aufs Bild, die Leertaste ebenso. Ein Knopf unten rechts schaltet ins
Vollbild (auf dem iPhone das Video-Vollbild).

**Ton nur auf Klick:** Scrollt man weg oder wechselt den Tab, während Ton läuft,
wird der Film stumm (klein) bzw. angehalten (Großansicht, Vollbild). Mit Ton
läuft er nicht in Schleife, sondern bleibt am Ende stehen („Nochmal ansehen").

Text und Player bilden einen Block: Der Chip steht bündig mit der Oberkante des
Players, die Buttons mit der Unterkante (von 1180 bis 1920 px gemessen). Eine
zwischenzeitliche Szenen-Animation anstelle des Films ist wieder entfernt.

Seitenfolge seit 13.10.2026: Hero (mit Kundenlaufband am unteren Rand) → Was wir machen → Portfolio → Stimmen → Über mich → Kontakt (Leistungen entfernt, war Doppelung zu „Was wir machen"). Kopfzeile: nummerierte Punkte (01 Was wir machen / 02 Portfolio / 03 Über mich, 13,5 px, mittig zur Zeile), Status „Frei für neue Projekte", Code-Knopf `{ Erstgespräch }` mit blinkendem Cursor. Beim Darüberfahren werden die Texte erst zu roten Code-Zeichen (Mono) und lösen sich in gut einer Sekunde von links nach rechts auf; die Breite bleibt dabei fest.

Am unteren Rand des Heros, unter der Zeile „Eine Auswahl unserer Kunden", läuft das **Kundenlaufband** mit den Wortmarken der Kunden in Grau:
FreshWin, BESTEnergieLaden und reamotion/GRILLOMAX sind Aufnahmen ihrer
Seitenköpfe (3-fach, Text auf Tinte, Bilder entsättigt, `*-wortmarke.png`),
Erdelmeier und Zuschuss Piloten liegen als Vektor-Logos vor. Die gezeigten Arbeiten sind eine
**Auswahl**, nicht die Gesamtzahl. Die frühere „Naht"-Sektion ist entfernt.

## Stack

Bewusst ohne Framework: statisches HTML + CSS + Vanilla-JS.

- `css/tokens.css` — verbindliche Design-Tokens aus dem Brand Kit (Erste Stildatei)
- `css/style.css` — Komponenten + Inszenierung
- `js/main.js` — zwei getrennte Einheiten: Bewegungsschicht und Kontaktformular.
  Das Formular hängt bewusst nicht an GSAP — fällt die Animation aus, trägt es trotzdem.
- `js/vendor/` — GSAP 3.12 + ScrollTrigger + Lenis 1.1 (lokal, kein CDN)
- `js/kino.js` — Player für den Markenfilm im Hero (Timecode, Ton, Spulen)
- `js/was.js` — „Was wir machen": drei Glaskarten auf Tinte, jede mit einem kleinen System
  im Betrieb (Posteingang sortiert sich, Besucher bucht Termin, Bestellung läuft bis zum
  Versand). Szenen laufen nur im Sichtfeld; ohne JS oder bei `prefers-reduced-motion`
  steht der Endzustand aus dem HTML. Pro Karte nur Problem (rot durchgestrichen) + Lösung.
- `js/buchung.js` — Terminbuchung (Erstgespräch), spricht direkt mit dem CRM
- `tools/contact-worker.js` — Endpunkt für den Formularversand (nicht Teil der Auslieferung)

## Inszenierung

Preloader (Signet baut sich auf), Custom Cursor (Quadratpunkt), Lenis Smooth
Scroll, ScrollTrigger-Reveals nach Brand-Kit-Werten (240 ms / 60 ms Kaskade),
mausfolgende Bild-Vorschau in den Leistungen, Marquees,
3D-Neigungen. `prefers-reduced-motion: reduce` schaltet alles ab.

## Abschnitt „Wer baut" (Gründer)

Zwischen Studio und Kontakt: Porträt links, drei nummerierte Haltungen rechts,
Zitat, Verweis auf die Terminbuchung. Brand Kit, Bildsprache: **Porträts in
Schwarzweiß, neutraler Hintergrund** — das Foto ist mit `sips` zugeschnitten
(4:5), über das Gray-ICC-Profil entsättigt und liegt im Multiply-Modus auf
`--cs-surface`, damit das Studio-Weiß zum Papierton wird (keine Kante).

```bash
sips roh.jpg -c 5243 4194 --cropOffset 0 1673 --out crop.jpg
sips crop.jpg --resampleWidth 1200 -m "/System/Library/ColorSync/Profiles/Generic Gray Profile.icc" \
  -s format jpeg -s formatOptions 82 --out assets/img/andrew-banoub.jpg
```

## Terminbuchung (Erstgespräch)

Der Kontaktbereich (Überschrift „Ein Gespräch. Danach steht Ihr Plan.") ist eine
breite Buchungskarte in drei Spalten, nach dem Vorbild der Buchung auf
zuschusspiloten.de, aber in unserer Gestaltung (keine Rundungen, 1-px-Linien,
Mono-Labels):

1. **Wer und was:** Porträt (eng auf den Kopf geschnitten), „Kostenloses
   Erstgespräch", Dauer, Google Meet, Zeitzonen-Auswahl, Kasten „Das klären wir".
2. **Kalender:** Monatsansicht, freie Tage fett mit Signalpunkt, gewählter Tag
   in Tinte, heute mit Rahmen.
3. **Uhrzeiten:** nach Vormittag/Nachmittag gruppiert; die Wahl einer Zeit
   schaltet „Weiter" frei (Doppelklick geht direkt weiter).

Danach ersetzen Formular, Bestätigung oder Rückfall die Spalten 2 und 3; die
erste Spalte bleibt stehen. Darunter: „Lieber schreiben statt buchen?",
E-Mail und Telefon, AGB-Hinweis. Ablauf: Tag → Uhrzeit → Weiter → Daten → bestätigt.
Die Karte spricht die öffentliche Buchungs-API unseres CRM direkt an — **kein iframe**,
damit die Seite ihr eigenes Gesicht behält:

| Aufruf | Zweck |
|---|---|
| `GET  crm.zuschusspiloten.de/api/booking/slots?from&to&source=codeschliff` | freie Termine + Titel/Dauer der Marke |
| `POST crm.zuschusspiloten.de/api/booking` mit `source: "codeschliff"` | Termin anlegen: CRM-Kalender, Google-Meet-Raum, Bestätigungs-Mails |

Das CRM (Repo `Andyban99/TimoCRM`, Vercel) kennt die Marke `codeschliff` in
`lib/booking-brands.ts`: eigener Titel, 30 Minuten, Absender
`andrew.banoub@codeschliff.de`, Mail-Layout im codeschliff-Stil, Storno-Seite
im codeschliff-Stil. Kalender und Google-Konto sind dieselben wie bei Zuschuss Piloten — ein Mensch,
ein Kalender; nur das Zeitfenster ist je Marke: codeschliff bis 17:00 Uhr
(Start), Zuschuss Piloten bis 15:00 Uhr.

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

## Portfolio (Referenzen)

Sechs echte Projekte mit Bildschirmfotos in `assets/img/arbeiten/` (Desktop
1440 px breit, Ganzseite bis 2600 px; Mobil 600 px breit). Die Fotos sind mit
headless Chrome über das DevTools-Protokoll aufgenommen (Cookie-Banner
weggeklickt, Lazy-Bilder vorgeladen) und mit `sips` zu JPEG (Qualität 78)
gewandelt. Bei Hover scrollt das Foto im Rahmen (`js/main.js`). Der Abschnitt
heißt „Portfolio" (Anker bleibt `#arbeiten`) und ist in drei Gruppen mit kleiner
Kopfzeile geteilt: Websites (01–02), Webshops (03–04), CRM & Systeme (05–06).

| Projekt | Art | Bild |
|---|---|---|
| 01 FreshWin Preisrechner | Web-App, öffentlich | Desktop + Mobil |
| 02 zuschusspiloten.de | Website | Desktop + Mobil |
| 03 bestenergieladen.de | Shopware, B2B | Desktop |
| 04 grillomax.shop | Shopware, Direktvertrieb | Desktop |
| 05 CRM Zuschuss Piloten | intern | Pipeline-Ansicht |
| 06 Erdelmeier Partner-Portal | intern | Anmeldeseite (zeigt die drei Checks) |

Kundenlogos liegen in `assets/img/kunden/` und werden einfarbig gezeigt
(Brand Kit: ruhige Fläche), farbig bei Hover.

**Stimmen** (`#stimmen`) ist sichtbar; bis die Originaltexte vorliegen, steht
dort ein neutraler Platzhalter (Klasse `is-platzhalter`, ohne Anführungszeichen).

Die früheren KI-generierten Videos sind entfernt (Stand 13.10.2026).

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
- CRM- und Intranet-Bildschirmfotos von innen (Dashboard) nach gemeinsamer Aufnahme einsetzen.
- Bewertungstexte von Timo Erdelmeier, Zuru Arifi, Tobias Meyer einsetzen (Klasse `is-platzhalter` entfernen).
- Keine Preisangabe auf der Seite, obwohl „Festpreis" beworben wird.

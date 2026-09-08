/* ═══════════════════════════════════════════════════════════════
   codeschliff — Endpunkt für das Kontaktformular
   Cloudflare Worker. Nimmt die Anfrage entgegen und stellt sie per
   Resend als E-Mail zu. Kostenlos bis 100.000 Aufrufe/Tag.

   AUSROLLEN
     npm install -g wrangler
     wrangler login
     wrangler deploy tools/contact-worker.js --name codeschliff-kontakt
     wrangler secret put RESEND_KEY --name codeschliff-kontakt

   Danach die Worker-Adresse in js/main.js bei CONTACT.endpoint eintragen.

   Der Schlüssel liegt als verschlüsseltes Secret bei Cloudflare,
   nicht in diesem Repository — das ist öffentlich.
   ═══════════════════════════════════════════════════════════════ */

const ERLAUBTE_HERKUNFT = [
  'https://codeschliff.de',
  'https://www.codeschliff.de',
  'http://localhost:4173'
];

const EMPFAENGER = 'andrew.banoub@codeschliff.de';
const ABSENDER = 'codeschliff Formular <formular@codeschliff.de>';

/* Einfache Drosselung pro IP: hält Massenzusendungen fern, ohne
   einen ehrlichen Absender auszusperren, der sich vertippt hat. */
const FENSTER_MS = 60_000;
const MAX_PRO_FENSTER = 3;
const gesehen = new Map();

function darfSenden(ip) {
  const jetzt = Date.now();
  const eintraege = (gesehen.get(ip) || []).filter((t) => jetzt - t < FENSTER_MS);
  if (eintraege.length >= MAX_PRO_FENSTER) return false;
  eintraege.push(jetzt);
  gesehen.set(ip, eintraege);
  return true;
}

function kopfzeilen(herkunft) {
  return {
    'Access-Control-Allow-Origin': ERLAUBTE_HERKUNFT.includes(herkunft) ? herkunft : ERLAUBTE_HERKUNFT[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

function antwort(status, daten, herkunft) {
  return new Response(JSON.stringify(daten), { status, headers: kopfzeilen(herkunft) });
}

/* Zeilenumbrüche in Kopfzeilen sind der klassische Weg, fremde
   Empfänger unterzuschieben. Betreff und Absendername werden bereinigt. */
function saeubern(wert, laenge) {
  return String(wert || '').replace(/[\r\n]+/g, ' ').trim().slice(0, laenge);
}

export default {
  async fetch(request, env) {
    const herkunft = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: kopfzeilen(herkunft) });
    }
    if (request.method !== 'POST') {
      return antwort(405, { error: 'Nur POST.' }, herkunft);
    }
    if (herkunft && !ERLAUBTE_HERKUNFT.includes(herkunft)) {
      return antwort(403, { error: 'Herkunft nicht erlaubt.' }, herkunft);
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unbekannt';
    if (!darfSenden(ip)) {
      return antwort(429, { error: 'Zu viele Anfragen. Bitte in einer Minute erneut versuchen.' }, herkunft);
    }

    let daten;
    try {
      daten = await request.json();
    } catch {
      return antwort(400, { error: 'Ungültige Anfrage.' }, herkunft);
    }

    // Honigtopf: ausgefüllt heißt Roboter. Freundlich bestätigen, nichts senden.
    if (daten.website) return antwort(200, { ok: true }, herkunft);

    const name = saeubern(daten.name, 120);
    const email = saeubern(daten.email, 200);
    const projektTyp = saeubern(daten.projectType, 40);
    const nachricht = String(daten.message || '').trim().slice(0, 5000);

    if (!name || !nachricht || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return antwort(400, { error: 'Bitte Name, gültige E-Mail-Adresse und Nachricht angeben.' }, herkunft);
    }

    const text =
      `Name: ${name}\n` +
      `E-Mail: ${email}\n` +
      `Projekttyp: ${projektTyp || '—'}\n\n` +
      `Nachricht:\n${nachricht}\n\n` +
      `—\nGesendet über das Kontaktformular auf codeschliff.de\n` +
      `Zeitpunkt: ${new Date().toISOString()}`;

    const versand = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: ABSENDER,
        to: [EMPFAENGER],
        // Antworten gehen direkt an den Interessenten, nicht an den Worker.
        reply_to: email,
        subject: `Projektanfrage${projektTyp ? ' · ' + projektTyp : ''} — ${name}`,
        text
      })
    });

    if (!versand.ok) {
      // Der Fehlertext gehört ins Worker-Protokoll, nicht in die Antwort.
      console.error('Versand fehlgeschlagen', versand.status, await versand.text());
      return antwort(502, { error: 'Zustellung fehlgeschlagen.' }, herkunft);
    }

    return antwort(200, { ok: true }, herkunft);
  }
};

<?php
/* ═══════════════════════════════════════════════════════════════
   codeschliff — Endpunkt für das Kontaktformular
   Läuft auf dem eigenen IONOS-Webhosting. Nimmt die Anfrage
   entgegen und stellt sie über den Mailserver zu, der ohnehin
   schon die Post für codeschliff.de führt.

   Kein Formulardienst, kein zusätzlicher Auftragsverarbeiter,
   keine Zugangsdaten irgendwo im Quelltext: mail() nutzt den
   Mailserver des Pakets direkt.

   HOCHLADEN
     Diese Datei nach /senden.php im Webverzeichnis der Subdomain
     formular.codeschliff.de legen. Danach in js/main.js eintragen:
       endpoint: 'https://formular.codeschliff.de/senden.php'
   ═══════════════════════════════════════════════════════════════ */

declare(strict_types=1);

const EMPFAENGER      = 'andrew.banoub@codeschliff.de';
// Absender muss eine Adresse der eigenen Domain sein, sonst greift SPF nicht.
const ABSENDER        = 'andrew.banoub@codeschliff.de';
const ERLAUBTE_QUELLEN = ['https://codeschliff.de', 'https://www.codeschliff.de'];

const MAX_PRO_MINUTE  = 3;

/* ── Antwortrahmen ─────────────────────────────────────────── */
$quelle = $_SERVER['HTTP_ORIGIN'] ?? '';
header('Access-Control-Allow-Origin: ' . (in_array($quelle, ERLAUBTE_QUELLEN, true) ? $quelle : ERLAUBTE_QUELLEN[0]));
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function ende(int $status, array $daten): never {
    http_response_code($status);
    echo json_encode($daten, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST')    { ende(405, ['error' => 'Nur POST.']); }
if ($quelle !== '' && !in_array($quelle, ERLAUBTE_QUELLEN, true)) {
    ende(403, ['error' => 'Herkunft nicht erlaubt.']);
}

/* ── Drosselung: hält Massenzusendungen fern ───────────────────
   Der Schlüssel enthält die Minute, das Zeitfenster ergibt sich
   also von selbst. Die IP wird nur als Streuwert abgelegt, nie
   im Klartext. */
$ip     = $_SERVER['REMOTE_ADDR'] ?? 'unbekannt';
$marke  = sys_get_temp_dir() . '/cs-form-' . hash('sha256', $ip . date('YmdHi'));
$zaehler = is_file($marke) ? (int) file_get_contents($marke) : 0;
if ($zaehler >= MAX_PRO_MINUTE) {
    ende(429, ['error' => 'Zu viele Anfragen. Bitte in einer Minute erneut versuchen.']);
}
file_put_contents($marke, (string) ($zaehler + 1));

/* ── Eingang lesen ─────────────────────────────────────────── */
$roh   = file_get_contents('php://input') ?: '';
$daten = json_decode($roh, true);
if (!is_array($daten)) { ende(400, ['error' => 'Ungültige Anfrage.']); }

// Honigtopf: ausgefüllt heißt Roboter. Freundlich bestätigen, nichts senden.
if (!empty($daten['website'])) { ende(200, ['ok' => true]); }

/* Zeilenumbrüche in Kopfzeilen sind der klassische Weg, fremde
   Empfänger unterzuschieben. Alles, was in eine Kopfzeile geht,
   wird vorher davon befreit. */
function saeubern(mixed $wert, int $laenge): string {
    return mb_substr(trim(str_replace(["\r", "\n", "\0"], ' ', (string) $wert)), 0, $laenge);
}

$name      = saeubern($daten['name']        ?? '', 120);
$email     = saeubern($daten['email']       ?? '', 200);
$projektTyp = saeubern($daten['projectType'] ?? '', 40);
$nachricht = mb_substr(trim((string) ($daten['message'] ?? '')), 0, 5000);

if ($name === '' || $nachricht === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    ende(400, ['error' => 'Bitte Name, gültige E-Mail-Adresse und Nachricht angeben.']);
}

/* ── Zustellen ─────────────────────────────────────────────── */
$betreff = 'Projektanfrage' . ($projektTyp !== '' ? ' · ' . $projektTyp : '') . ' — ' . $name;
// Umlaute im Betreff müssen kodiert werden, sonst zeigen manche Programme Kauderwelsch.
$betreffKodiert = '=?UTF-8?B?' . base64_encode($betreff) . '?=';

$text = "Name: {$name}\n"
      . "E-Mail: {$email}\n"
      . "Projekttyp: " . ($projektTyp !== '' ? $projektTyp : '—') . "\n\n"
      . "Nachricht:\n{$nachricht}\n\n"
      . "—\nGesendet über das Kontaktformular auf codeschliff.de\n"
      . "Zeitpunkt: " . date('d.m.Y H:i:s') . "\n";

$kopf = [
    'From: codeschliff Formular <' . ABSENDER . '>',
    // Antworten gehen direkt an den Interessenten, nicht an einen Automaten.
    'Reply-To: ' . $name . ' <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'MIME-Version: 1.0',
    'X-Mailer: codeschliff-formular',
];

$erfolg = mail(EMPFAENGER, $betreffKodiert, $text, implode("\r\n", $kopf), '-f' . ABSENDER);

if (!$erfolg) {
    error_log('codeschliff: Zustellung des Kontaktformulars fehlgeschlagen.');
    ende(502, ['error' => 'Zustellung fehlgeschlagen.']);
}

ende(200, ['ok' => true]);

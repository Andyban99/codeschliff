/* ═══════════════════════════════════════════════════════════════
   codeschliff — Terminbuchung (kostenloses Erstgespräch)

   Spricht die Buchungs-API unseres CRM direkt an: Verfügbarkeit lesen,
   Termin anlegen. Kein iframe — die Oberfläche gehört zur Seite, die
   Daten gehören ins CRM. Dort entstehen Kalendereintrag, Google-Meet-Raum
   und die Bestätigungs-Mails.

   Bewusst unabhängig von der Bewegungsschicht (GSAP/Lenis): fällt sie aus,
   bucht man trotzdem. Fällt das CRM aus, bleibt das klassische Formular.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var CRM = {
    base: 'https://crm.zuschusspiloten.de',
    source: 'codeschliff'
  };
  // Lokale Vorschau spricht mit dem lokalen CRM (npm run dev → :3000).
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) CRM.base = 'http://localhost:3000';

  var root = document.getElementById('buchung');
  if (!root || !window.fetch) return;

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    notice: $('buchungNotice'),
    pick: $('buchungPick'),
    form: $('buchungForm'),
    done: $('buchungDone'),
    offline: $('buchungOffline'),
    calPrev: $('calPrev'),
    calNext: $('calNext'),
    calMonth: $('calMonth'),
    calDays: $('calDays'),
    calSlots: $('calSlots'),
    timesDay: $('timesDay'),
    timesTz: $('timesTz'),
    tzSelect: $('tzSelect'),
    weiter: $('buchungWeiter'),
    state: $('buchungState'),
    chosenText: $('chosenText'),
    chosenChange: $('chosenChange'),
    message: $('buchungMessage'),
    submit: $('buchungSubmit'),
    trap: $('bWebsite'),
    doneWhen: $('doneWhen'),
    doneText: $('doneText'),
    doneMeet: $('doneMeet'),
    doneCancel: $('doneCancel'),
    retry: $('buchungRetry'),
    write: $('buchungWrite'),
    formToggle: $('formToggle'),
    kontaktForm: $('kontaktForm')
  };

  var ZONES = [
    'Europe/Berlin', 'Europe/Vienna', 'Europe/Zurich', 'Atlantic/Madeira', 'Europe/Lisbon',
    'Europe/London', 'Europe/Paris', 'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Istanbul',
    'America/New_York', 'America/Los_Angeles', 'Asia/Dubai'
  ];
  var WEEKDAY_INDEX = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

  var state = {
    meta: null,
    slots: [],          // ISO-Zeitpunkte (UTC), aufsteigend
    byDay: {},          // 'YYYY-MM-DD' (in Besucher-Zeitzone) → [ISO]
    dayKeys: [],
    tz: 'Europe/Berlin',
    view: null,         // { y, m } — angezeigter Monat (m: 1–12)
    day: null,
    slot: null,
    step: 'pick'
  };

  /* ── Zeit & Format ───────────────────────────────────────── */
  function dateKey(iso, tz) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
  }
  function timeOf(iso, tz) {
    return new Intl.DateTimeFormat('de-DE', { timeZone: tz, hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  }
  function longDate(iso, tz) {
    return new Intl.DateTimeFormat('de-DE', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso));
  }
  function keyToLocalNoon(key) {
    var p = key.split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12, 0, 0);
  }
  function dayHead(key) {
    return new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }).format(keyToLocalNoon(key));
  }
  function hourOf(iso, tz) {
    return Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }).format(new Date(iso)));
  }
  function tzText() {
    var mins = state.meta ? state.meta.durationMinutes : 30;
    return 'Alle Zeiten in ' + (state.tz === 'Europe/Berlin' ? 'deutscher Zeit' : tzLabel(state.tz)) + ' · ' + mins + ' Minuten';
  }
  function weekdayOfKey(key) {
    var wd = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(keyToLocalNoon(key));
    return WEEKDAY_INDEX[wd] || 0;
  }
  function ymd(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function endOf(iso) {
    var mins = state.meta ? state.meta.durationMinutes : 30;
    return new Date(new Date(iso).getTime() + mins * 60000).toISOString();
  }
  function tzLabel(tz) { return tz.replace(/_/g, ' '); }

  /* ── Schritte: pick → form → done (oder offline) ─────────── */
  function setStep(name) {
    state.step = name;
    el.pick.hidden = name !== 'pick';
    el.form.hidden = name !== 'form';
    el.done.hidden = name !== 'done';
    el.offline.hidden = name !== 'offline';
    root.setAttribute('data-schritt', name);
  }

  function notice(text, kind) {
    if (!text) { el.notice.hidden = true; el.notice.textContent = ''; el.notice.className = 'buchung__notice'; return; }
    el.notice.className = 'buchung__notice' + (kind ? ' is-' + kind : '');
    el.notice.textContent = text;
    el.notice.hidden = false;
  }

  function status(text, live) {
    el.state.textContent = text;
    el.state.classList.toggle('is-live', !!live);
  }

  /* ── Verfügbarkeit laden ─────────────────────────────────── */
  function load(keepDay) {
    status('Verfügbarkeit wird geladen …');
    var from = new Date(); from.setDate(from.getDate() - 1);
    var to = new Date(); to.setDate(to.getDate() + 62);
    var url = CRM.base + '/api/booking/slots?from=' + ymd(from) + '&to=' + ymd(to) + '&source=' + CRM.source;
    return window.fetch(url, { cache: 'no-store' })
      .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then(function (data) {
        state.meta = data.meta;
        state.slots = data.days.reduce(function (acc, d) { return acc.concat(d.slots); }, []).sort();
        regroup();
        if (!keepDay || !state.byDay[state.day]) {
          state.day = state.dayKeys.length ? state.dayKeys[0] : null;
        }
        if (state.day) {
          var p = state.day.split('-');
          state.view = { y: Number(p[0]), m: Number(p[1]) };
        } else {
          var n = new Date();
          state.view = { y: n.getFullYear(), m: n.getMonth() + 1 };
        }
        renderMonth();
        renderSlots();
        status(state.dayKeys.length
          ? state.slots.length + ' freie Termine · ' + state.meta.durationMinutes + ' Min'
          : 'Gerade keine freien Termine', state.dayKeys.length > 0);
        if (!state.dayKeys.length) {
          notice('Im Moment ist kein Termin frei. Schreiben Sie uns — wir melden uns mit Vorschlägen.');
        }
        setStep('pick');
      })
      .catch(function () {
        setStep('offline');
      });
  }

  function regroup() {
    var today = dateKey(new Date().toISOString(), state.tz);
    state.byDay = {};
    state.slots.forEach(function (iso) {
      var k = dateKey(iso, state.tz);
      if (k < today) return;
      (state.byDay[k] = state.byDay[k] || []).push(iso);
    });
    state.dayKeys = Object.keys(state.byDay).sort();
    el.timesTz.textContent = tzText();
  }

  /* ── Kalender ────────────────────────────────────────────── */
  function renderMonth() {
    var y = state.view.y, m = state.view.m;
    var monthName = new Intl.DateTimeFormat('de-DE', { month: 'long' }).format(new Date(y, m - 1, 1));
    el.calMonth.textContent = monthName + ' ' + y;

    var today = dateKey(new Date().toISOString(), state.tz);
    var now = new Date();
    var firstKey = y + '-' + String(m).padStart(2, '0') + '-01';
    var daysInMonth = new Date(y, m, 0).getDate();
    var offset = weekdayOfKey(firstKey);
    var lastKey = state.dayKeys.length ? state.dayKeys[state.dayKeys.length - 1] : today;

    el.calPrev.disabled = (y < now.getFullYear()) || (y === now.getFullYear() && m <= now.getMonth() + 1);
    el.calNext.disabled = firstKey.slice(0, 7) >= lastKey.slice(0, 7);

    var html = '';
    for (var i = 0; i < offset; i++) html += '<span class="buchung__day buchung__day--pad" aria-hidden="true"></span>';
    for (var d = 1; d <= daysInMonth; d++) {
      var key = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var free = !!state.byDay[key];
      var cls = 'buchung__day' + (free ? ' is-frei' : '') + (key === today ? ' is-today' : '') + (key === state.day ? ' is-selected' : '');
      var label = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }).format(keyToLocalNoon(key));
      html += '<button type="button" class="' + cls + '" data-date="' + key + '"' +
        (free ? ' data-cursor="button" aria-pressed="' + (key === state.day) + '"' : ' disabled') +
        ' aria-label="' + label + (free ? ', ' + state.byDay[key].length + ' Termine frei' : ', keine Termine') + '">' + d + '</button>';
    }
    el.calDays.innerHTML = html;
  }

  // Uhrzeiten nach Tageszeit gruppiert; Auswahl schaltet „Weiter" frei
  var TAGESZEITEN = [['Vormittag', 0, 12], ['Nachmittag', 12, 24]];
  function renderSlots() {
    el.timesTz.textContent = tzText();
    if (el.weiter) el.weiter.disabled = !state.slot;
    if (!state.day) {
      el.timesDay.textContent = 'Tag wählen';
      el.calSlots.innerHTML = '<p class="buchung__empty">Wählen Sie einen Tag mit freien Zeiten.</p>';
      return;
    }
    var list = state.byDay[state.day] || [];
    el.timesDay.textContent = dayHead(state.day);
    var html = '';
    TAGESZEITEN.forEach(function (t) {
      var teil = list.filter(function (iso) { var h = hourOf(iso, state.tz); return h >= t[1] && h < t[2]; });
      if (!teil.length) return;
      html += '<div class="buchung__gruppe"><span class="buchung__mini">' + t[0] + '</span><div class="buchung__gruppe-slots">' +
        teil.map(function (iso) {
          return '<button type="button" class="buchung__slot' + (iso === state.slot ? ' is-selected' : '') +
            '" data-slot="' + iso + '" data-cursor="button" aria-pressed="' + (iso === state.slot) + '">' +
            timeOf(iso, state.tz) + '</button>';
        }).join('') + '</div></div>';
    });
    el.calSlots.innerHTML = html || '<p class="buchung__empty">Keine freien Zeiten an diesem Tag.</p>';
  }

  el.calDays.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-date]');
    if (!b || b.disabled) return;
    state.day = b.getAttribute('data-date');
    state.slot = null;
    renderMonth();
    renderSlots();
  });

  el.calSlots.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-slot]');
    if (!b) return;
    state.slot = b.getAttribute('data-slot');
    renderSlots();
    var neu = el.calSlots.querySelector('[data-slot="' + state.slot + '"]');
    if (neu) neu.focus({ preventScroll: true });
  });
  // Doppelklick auf eine Zeit: direkt weiter
  el.calSlots.addEventListener('dblclick', function (e) {
    if (e.target.closest('button[data-slot]') && state.slot) openForm();
  });
  if (el.weiter) {
    el.weiter.addEventListener('click', function () { if (state.slot) openForm(); });
  }

  el.calPrev.addEventListener('click', function () {
    if (el.calPrev.disabled) return;
    state.view.m -= 1; if (state.view.m < 1) { state.view.m = 12; state.view.y -= 1; }
    renderMonth();
  });
  el.calNext.addEventListener('click', function () {
    if (el.calNext.disabled) return;
    state.view.m += 1; if (state.view.m > 12) { state.view.m = 1; state.view.y += 1; }
    renderMonth();
  });

  /* ── Zeitzone ────────────────────────────────────────────── */
  (function initTz() {
    try { var guess = Intl.DateTimeFormat().resolvedOptions().timeZone; if (guess) state.tz = guess; } catch (err) { /* Berlin bleibt */ }
    var zones = ZONES.slice();
    if (zones.indexOf(state.tz) === -1) zones.unshift(state.tz);
    el.tzSelect.innerHTML = zones.map(function (z) {
      return '<option value="' + z + '"' + (z === state.tz ? ' selected' : '') + '>' + tzLabel(z) + '</option>';
    }).join('');
    el.timesTz.textContent = tzText();
  })();

  el.tzSelect.addEventListener('change', function () {
    state.tz = el.tzSelect.value;
    regroup();
    if (!state.byDay[state.day]) { state.day = state.dayKeys[0] || null; state.slot = null; }
    if (state.day) { var p = state.day.split('-'); state.view = { y: Number(p[0]), m: Number(p[1]) }; }
    renderMonth();
    renderSlots();
  });

  /* ── Schritt 2: Daten ────────────────────────────────────── */
  function openForm() {
    el.chosenText.textContent = longDate(state.slot, state.tz) + ' · ' + timeOf(state.slot, state.tz) + '–' +
      timeOf(endOf(state.slot), state.tz) + ' Uhr (' + tzLabel(state.tz) + ')';
    notice('');
    setMessage('', '');
    setStep('form');
    var first = $('bName');
    if (first && !first.value) first.focus({ preventScroll: true });
  }

  el.chosenChange.addEventListener('click', function () {
    setStep('pick');
  });

  var touched = {};
  function fields() { return [$('bName'), $('bMail'), $('bDsgvo')]; }
  function fieldError(input) {
    if (input.id === 'bName' && !input.value.trim()) return 'Bitte ausfüllen.';
    if (input.id === 'bMail') {
      if (!input.value.trim()) return 'Bitte ausfüllen.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) return 'Bitte prüfen Sie Ihre E-Mail-Adresse.';
    }
    if (input.id === 'bDsgvo' && !input.checked) return 'Bitte bestätigen Sie die Datenschutzerklärung.';
    return '';
  }
  function showError(input) {
    var err = fieldError(input);
    var box = el.form.querySelector('[data-error-for="' + input.id + '"]');
    if (box) { box.textContent = err; box.classList.toggle('is-visible', !!err); }
    input.setAttribute('aria-invalid', err ? 'true' : 'false');
    if (input.classList.contains('form__input')) input.classList.toggle('has-error', !!err);
    return !err;
  }
  fields().forEach(function (input) {
    input.addEventListener('blur', function () { touched[input.id] = true; showError(input); });
    input.addEventListener('input', function () { if (touched[input.id]) showError(input); });
    input.addEventListener('change', function () { if (touched[input.id]) showError(input); });
  });

  function setMessage(kind, text) {
    el.message.className = 'form__message' + (kind ? ' is-' + kind : '');
    el.message.textContent = text;
  }
  function busy(on) {
    el.submit.disabled = on;
    el.submit.textContent = on ? 'Wird gebucht …' : 'Termin bestätigen';
  }

  el.form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (el.trap && el.trap.value) return;   // Honigtopf: Roboter, still verwerfen
    if (!state.slot) { setStep('pick'); return; }

    var ok = true;
    fields().forEach(function (i) { touched[i.id] = true; if (!showError(i)) ok = false; });
    if (!ok) {
      setMessage('error', 'Bitte prüfen Sie die markierten Felder.');
      var bad = el.form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus();
      return;
    }

    var payload = {
      name: $('bName').value.trim(),
      email: $('bMail').value.trim(),
      company: $('bCompany').value.trim(),
      phone: $('bPhone').value.trim(),
      message: $('bMsg').value.trim(),
      timezone: state.tz,
      start: state.slot,
      source: CRM.source,
      website: el.trap ? el.trap.value : ''
    };

    busy(true);
    setMessage('', '');
    var chosen = state.slot;
    window.fetch(CRM.base + '/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) { return { res: res, data: data }; });
    }).then(function (r) {
      busy(false);
      if (r.res.status === 201) { showDone(r.data, payload, chosen); return; }
      if (r.res.status === 409) {
        // Jemand war schneller: zurück zur Auswahl, Verfügbarkeit frisch laden.
        state.slot = null;
        setStep('pick');
        notice(r.data.error || 'Dieser Termin wurde gerade vergeben. Bitte wählen Sie einen anderen.', 'error');
        load(true);
        return;
      }
      if (r.res.status === 429) {
        setMessage('error', 'Zu viele Versuche in kurzer Zeit. Bitte in einer Minute noch einmal.');
        return;
      }
      throw new Error(r.data.error || 'HTTP ' + r.res.status);
    }).catch(function () {
      busy(false);
      setMessage('error', 'Die Buchung ist gerade nicht durchgegangen. Versuchen Sie es gleich noch einmal — oder schreiben Sie uns unten eine Nachricht, wir schlagen Termine vor.');
      revealForm(false);
    });
  });

  /* ── Schritt 3: Bestätigt ────────────────────────────────── */
  function showDone(data, payload, chosen) {
    el.doneWhen.textContent = longDate(chosen, state.tz) + ' · ' + timeOf(chosen, state.tz) + '–' +
      timeOf(endOf(chosen), state.tz) + ' Uhr (' + tzLabel(state.tz) + ')';
    el.doneText.textContent = 'Bestätigung und Kalendereinladung gehen an ' + payload.email +
      (data.meetLink ? '. Der Google-Meet-Link steht darin — und hier:' : '. Der Google-Meet-Link folgt per E-Mail.');
    if (data.meetLink) { el.doneMeet.href = data.meetLink; el.doneMeet.hidden = false; }
    else { el.doneMeet.hidden = true; }
    el.doneCancel.href = data.cancelUrl || (CRM.base + '/buchen/storno/' + data.cancelToken);
    setStep('done');
    el.form.reset();
    touched = {};
  }

  /* ── Rückfallebenen ──────────────────────────────────────── */
  function revealForm(scroll) {
    if (!el.kontaktForm) return;
    el.kontaktForm.hidden = false;
    if (el.formToggle) el.formToggle.setAttribute('aria-expanded', 'true');
    if (scroll !== false) {
      el.kontaktForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var first = $('fName'); if (first) first.focus({ preventScroll: true });
    }
  }
  if (el.formToggle && el.kontaktForm) {
    el.formToggle.addEventListener('click', function () {
      var open = el.kontaktForm.hidden;
      if (open) { revealForm(true); }
      else { el.kontaktForm.hidden = true; el.formToggle.setAttribute('aria-expanded', 'false'); }
    });
  }
  if (el.retry) el.retry.addEventListener('click', function () { load(true); });
  if (el.write) el.write.addEventListener('click', function () { revealForm(true); });

  load(false);
})();

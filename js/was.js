/* ═══════════════════════════════════════════════════════════════
   codeschliff — „Was wir machen": drei Systeme im Betrieb
   Jede Karte spielt eine kurze Szene in Schleife, aber nur, solange sie
   im Bild ist. Ohne GSAP oder bei reduzierter Bewegung bleibt der
   Endzustand aus dem HTML stehen.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var systeme = Array.prototype.slice.call(document.querySelectorAll('.system'));
  if (!systeme.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    systeme.forEach(function (s) { s.classList.add('is-an'); });
    return;
  }

  /* ── Problem durchstreichen, sobald die Karte im Bild ist ──── */
  systeme.forEach(function (s) {
    ScrollTrigger.create({
      trigger: s,
      start: 'top 80%',
      once: true,
      onEnter: function () { s.classList.add('is-an'); }
    });
  });

  /* ── Lichtkegel folgt dem Zeiger ───────────────────────────── */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    systeme.forEach(function (s) {
      s.addEventListener('pointermove', function (e) {
        var r = s.getBoundingClientRect();
        s.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        s.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  // Spielt eine Szene in Schleife, solange das Element im Bild ist.
  // Jede Runde wird neu gebaut, damit Positionen nach einer
  // Groessenaenderung wieder stimmen.
  function schleife(el, szene) {
    var tl = null;
    var aktiv = false;
    function runde() {
      tl = szene();
      tl.eventCallback('onComplete', function () {
        tl = null;
        if (aktiv) runde();
      });
    }
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      end: 'bottom 12%',
      onToggle: function (self) {
        aktiv = self.isActive;
        if (!aktiv) { if (tl) tl.pause(); return; }
        if (tl) tl.resume(); else runde();
      }
    });
  }

  function pause(sekunden) { return gsap.to({}, { duration: sekunden }); }

  /* ── 01 · Posteingang sortiert sich ────────────────────────── */
  var post = document.querySelector('[data-post-liste]');
  if (post) {
    var POST = [
      ['PDF', 'Rechnung 4712', 'Buchhaltung'],
      ['@', 'Rückfrage zum Angebot', 'Vertrieb'],
      ['XLS', 'Preisliste Lieferant', 'Shop'],
      ['@', 'Reklamation', 'Service'],
      ['PDF', 'Auftragsbestätigung', 'Ablage'],
      ['@', 'Bewerbung', 'Personal']
    ];
    var postNr = 0;
    schleife(post, function () {
      var d = POST[postNr++ % POST.length];
      var muster = post.firstElementChild;
      var hoehe = muster.offsetHeight;
      var abstand = parseFloat(getComputedStyle(muster).marginBottom) || 0;

      var li = document.createElement('li');
      li.className = 'post__zeile is-liest';
      li.innerHTML = '<span class="post__typ"></span><span class="post__titel"></span>' +
        '<span class="post__status"><i class="post__puls"></i>liest</span>';
      li.children[0].textContent = d[0];
      li.children[1].textContent = d[1];
      var status = li.children[2];

      return gsap.timeline()
        .call(function () { post.insertBefore(li, post.firstChild); })
        .fromTo(li,
          { height: 0, marginBottom: 0, opacity: 0 },
          { height: hoehe, marginBottom: abstand, opacity: 1, duration: 0.45, ease: 'power2.out', immediateRender: false, clearProps: 'height,marginBottom,opacity' })
        .call(function () {
          li.classList.remove('is-liest');
          status.innerHTML = '<b>✓</b>';
          status.appendChild(document.createTextNode(d[2]));
          while (post.children.length > 5) post.removeChild(post.lastChild);
        }, null, '+=1.1')
        .add(pause(0.9));
    });
  }

  /* ── 02 · Website: ein Besucher bucht einen Termin ─────────── */
  var termin = document.querySelector('[data-termin]');
  if (termin) {
    var tage = Array.prototype.slice.call(termin.querySelectorAll('.termin__tage span'));
    var slots = Array.prototype.slice.call(termin.querySelectorAll('.termin__slots span'));
    var knopf = termin.querySelector('.termin__knopf');
    var toast = termin.querySelector('.termin__toast');
    var toastText = termin.querySelector('[data-termin-text]');
    var zeiger = termin.querySelector('.termin__zeiger');
    var klick = document.createElement('i');
    klick.className = 'termin__klick';
    termin.appendChild(klick);
    var TAGNAMEN = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
    var terminNr = 0;

    var mitte = function (el) {
      var a = termin.getBoundingClientRect();
      var b = el.getBoundingClientRect();
      return { x: b.left - a.left + b.width / 2, y: b.top - a.top + b.height / 2 };
    };
    var waehle = function (liste, el) {
      liste.forEach(function (x) { x.classList.toggle('is-gewaehlt', x === el); });
    };
    var leeren = function () { waehle(tage, null); waehle(slots, null); };
    var ruhe = function () { return { x: termin.clientWidth - 34, y: termin.clientHeight - 30 }; };

    // Ein Klick: Zeiger drueckt, Ring breitet sich aus, Wirkung tritt ein
    var drueck = function (p, wirkung) {
      return gsap.timeline()
        .to(zeiger, { scale: 0.84, duration: 0.08, ease: 'power1.out' })
        .call(wirkung)
        .fromTo(klick,
          { x: p.x, y: p.y, scale: 0.2, opacity: 0.9 },
          { scale: 1.5, opacity: 0, duration: 0.45, ease: 'power2.out', immediateRender: false }, '<')
        .to(zeiger, { scale: 1, duration: 0.14, ease: 'power1.out' }, '<0.08');
    };

    leeren();
    gsap.set(toast, { autoAlpha: 0, y: 10 });
    gsap.set(zeiger, Object.assign({ left: 0, top: 0, right: 'auto', bottom: 'auto' }, ruhe()));

    schleife(termin, function () {
      var tag = tage[(terminNr * 2 + 1) % tage.length];
      var slot = slots[(terminNr * 3 + 1) % slots.length];
      terminNr++;
      var start = ruhe();
      var pT = mitte(tag);
      var pS = mitte(slot);
      var pK = mitte(knopf);

      return gsap.timeline({ defaults: { ease: 'power2.inOut' } })
        .set(zeiger, { x: start.x, y: start.y })
        .to(zeiger, { x: pT.x, y: pT.y, duration: 0.8 }, 0.5)
        .add(drueck(pT, function () { waehle(tage, tag); }))
        .to(zeiger, { x: pS.x, y: pS.y, duration: 0.6 }, '+=0.15')
        .add(drueck(pS, function () { waehle(slots, slot); }))
        .to(zeiger, { x: pK.x, y: pK.y, duration: 0.6 }, '+=0.2')
        .add(drueck(pK, function () {
          toastText.textContent = 'Gebucht · ' + TAGNAMEN[tage.indexOf(tag)] + ', ' + slot.textContent;
        }))
        .to(toast, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, '+=0.05')
        .to(zeiger, { x: start.x, y: start.y, duration: 0.7 }, '<')
        .to(toast, { autoAlpha: 0, y: 10, duration: 0.24, ease: 'power2.in' }, '+=1.8')
        .call(leeren)
        .add(pause(0.5));
    });
  }

  /* ── 03 · Webshop: Bestellung laeuft bis zum Versand ───────── */
  var lauf = document.querySelector('[data-lauf]');
  if (lauf) {
    var stationen = Array.prototype.slice.call(lauf.querySelectorAll('.lauf__strecke li'));
    var fuellung = lauf.querySelector('[data-lauf-fuellung]');
    var bestellung = lauf.querySelector('.lauf__bestellung');
    var log = lauf.querySelector('[data-lauf-log]');
    var feld = {
      nr: lauf.querySelector('[data-lauf-nr]'),
      art: lauf.querySelector('[data-lauf-art]'),
      summe: lauf.querySelector('[data-lauf-summe]')
    };
    var BESTELLUNGEN = [
      ['#10483', '1 Artikel', '89,90 €'],
      ['#10484', '5 Artikel', '612,40 €'],
      ['#10485', '2 Artikel', '158,00 €'],
      ['#10486', '3 Artikel', '249,00 €']
    ];
    var laufNr = 0;

    // Logzeile tippt sich in Mono, wie eine Konsole
    var tippe = function (text) {
      var stand = { n: 0 };
      gsap.to(stand, {
        n: text.length,
        duration: Math.min(0.6, text.length * 0.022),
        ease: 'none',
        overwrite: true,
        onUpdate: function () { log.textContent = text.slice(0, Math.round(stand.n)); }
      });
    };
    var zuruecksetzen = function () {
      stationen.forEach(function (s) { s.classList.remove('is-fertig'); });
      gsap.set(fuellung, { scaleX: 0 });
    };

    zuruecksetzen();
    log.textContent = 'Wartet auf Bestellung …';

    schleife(lauf, function () {
      var b = BESTELLUNGEN[laufNr++ % BESTELLUNGEN.length];
      var texte = [
        'Bestellung ' + b[0] + ' eingegangen',
        b[1] + ' im Lager reserviert',
        'Rechnung erstellt und versendet',
        'Versandlabel gedruckt · Kunde informiert'
      ];
      var tl = gsap.timeline()
        .call(function () {
          zuruecksetzen();
          feld.nr.textContent = b[0];
          feld.art.textContent = b[1];
          feld.summe.textContent = b[2];
        })
        .fromTo(bestellung,
          { y: -8, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out', immediateRender: false });
      stationen.forEach(function (s, i) {
        if (i > 0) tl.to(fuellung, { scaleX: i / (stationen.length - 1), duration: 0.55, ease: 'power1.inOut' });
        tl.call(function () { s.classList.add('is-fertig'); tippe(texte[i]); });
        tl.add(pause(0.4));
      });
      return tl
        .add(pause(1.4))
        .to(bestellung, { y: 8, autoAlpha: 0, duration: 0.24, ease: 'power2.in' });
    });
  }
})();

/* ═══════════════════════════════════════════════════════════════
   codeschliff — Hero-Bühne: drei Systeme im Betrieb
   Rechts im Hero wechseln drei Szenen: ein Webshop, ein ERP und die
   Werkstatt (Ideen, die zu Werkzeugen werden). Jede Szene spielt eine
   kurze Handlung mit GSAP, der Reiter darüber zeigt den Fortschritt,
   danach kommt die nächste. Die Reiter sind klickbar. Außerhalb des
   Bildes und bei verborgenem Tab wird angehalten.
   Ohne GSAP oder bei reduzierter Bewegung steht Szene 01 als Standbild,
   die Reiter schalten dann nur um.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var wurzel = document.getElementById('szenen');
  if (!wurzel) return;

  function slice(l) { return Array.prototype.slice.call(l); }

  var tabs = slice(wurzel.querySelectorAll('.szenen__tab'));
  var szenen = slice(wurzel.querySelectorAll('.szene'));
  var caption = document.getElementById('szenenCaption');
  if (!tabs.length || tabs.length !== szenen.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var live = !reduced && typeof gsap !== 'undefined';
  if (live) wurzel.classList.add('is-live');

  var aktiv = -1;
  var master = null;
  var imBild = true;

  /* ── Umschalten ────────────────────────────────────────────── */
  function zeige(i) {
    szenen.forEach(function (s, k) {
      var an = k === i;
      s.classList.toggle('is-active', an);
    });
    tabs.forEach(function (t, k) {
      var an = k === i;
      t.classList.toggle('is-active', an);
      t.setAttribute('aria-pressed', an ? 'true' : 'false');
      var lauf = t.querySelector('.szenen__lauf');
      if (lauf && !an) lauf.style.transform = 'scaleX(0)';
    });
    if (caption) caption.textContent = szenen[i].getAttribute('data-caption') || '';
    aktiv = i;
  }

  function starte(i) {
    if (master) { master.kill(); master = null; }
    zeige(i);
    if (!live) return;

    var bau = BAU[szenen[i].getAttribute('data-szene')];
    var handlung = bau ? bau(szenen[i]) : gsap.timeline();
    var dauer = Math.max(handlung.duration(), 5) + 0.5;
    var lauf = tabs[i].querySelector('.szenen__lauf');

    master = gsap.timeline({
      onComplete: function () { starte((i + 1) % szenen.length); }
    });
    master.add(handlung, 0);
    if (lauf) master.fromTo(lauf, { scaleX: 0 }, { scaleX: 1, duration: dauer, ease: 'none' }, 0);
    if (!imBild || document.hidden) master.pause();
  }

  function pauseOderWeiter() {
    if (!master) return;
    if (!imBild || document.hidden) master.pause(); else master.resume();
  }

  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () { if (k !== aktiv) starte(k); });
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      imBild = es[0].isIntersecting;
      pauseOderWeiter();
    }, { threshold: 0.2 }).observe(wurzel);
  }
  document.addEventListener('visibilitychange', pauseOderWeiter);

  /* ── Hilfen ────────────────────────────────────────────────── */
  // Mittelpunkt eines Elements, relativ zur Szene. Wird erst beim Start
  // des jeweiligen Tweens ausgewertet, damit das Layout fertig ist.
  function mitte(szene, ziel, dx, dy) {
    return function () {
      var r = ziel.getBoundingClientRect();
      var b = szene.getBoundingClientRect();
      return { x: r.left - b.left + r.width * dx, y: r.top - b.top + r.height * dy };
    };
  }
  function zu(szene, ziel, dx, dy) {
    var m = mitte(szene, ziel, dx, dy);
    return { x: function () { return m().x - 2; }, y: function () { return m().y - 2; } };
  }
  function zahl(n, einheit) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (einheit || '');
  }

  var BAU = {};

  /* ── 01 · Shop: zwei Produkte in den Korb, Bestellung geht ein ── */
  BAU.shop = function (el) {
    var tl = gsap.timeline();
    var zeiger = el.querySelector('[data-zeiger]');
    var btns = slice(el.querySelectorAll('[data-btn]'));
    var karten = slice(el.querySelectorAll('[data-produkt]'));
    var rolle = el.querySelector('[data-rolle]');
    var toast = el.querySelector('[data-toast]');
    var korb = el.querySelector('[data-korb]');
    if (!zeiger || btns.length < 3 || !rolle || !toast || !korb) return tl;

    btns.forEach(function (b) { b.classList.remove('is-klick'); });
    gsap.set(zeiger, { opacity: 0, scale: 1, transformOrigin: '0 0', x: function () { return el.clientWidth * 0.62; }, y: function () { return el.clientHeight * 0.92; } });
    gsap.set(rolle, { yPercent: 0 });
    gsap.set(toast, { opacity: 0, y: 10 });
    gsap.set(karten, { y: 0 });

    function klick(btn, karte, t) {
      tl.to(zeiger, { scale: 0.82, duration: 0.09, yoyo: true, repeat: 1, ease: 'power1.inOut' }, t);
      tl.call(function () { btn.classList.add('is-klick'); }, null, t + 0.06);
      if (karte) tl.to(karte, { y: -4, duration: 0.22, ease: 'power2.out' }, t + 0.06).to(karte, { y: 0, duration: 0.5, ease: 'power2.inOut' }, t + 0.5);
      tl.call(function () { btn.classList.remove('is-klick'); }, null, t + 0.75);
    }

    tl.to(zeiger, { opacity: 1, duration: 0.3 }, 0.25);
    tl.to(zeiger, Object.assign({ duration: 0.9, ease: 'power2.inOut' }, zu(el, btns[1], 0.55, 0.5)), 0.45);
    klick(btns[1], karten[1], 1.45);
    tl.to(rolle, { yPercent: -33.3334, duration: 0.35, ease: 'power2.out' }, 1.65);

    tl.to(zeiger, Object.assign({ duration: 0.8, ease: 'power2.inOut' }, zu(el, btns[2], 0.5, 0.5)), 2.7);
    klick(btns[2], karten[2], 3.55);
    tl.to(rolle, { yPercent: -66.6667, duration: 0.35, ease: 'power2.out' }, 3.75);

    tl.to(zeiger, Object.assign({ duration: 0.95, ease: 'power2.inOut' }, zu(el, korb, 0.5, 0.6)), 4.7);
    klick(korb, null, 5.7);
    tl.to(toast, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 6.0);
    tl.to(zeiger, { opacity: 0, duration: 0.4 }, 6.7);
    tl.to({}, { duration: 1.2 }, 7.1);
    return tl;
  };

  /* ── 02 · ERP: Zahlen laufen hoch, ein Auftrag kommt rein und wandert durch ── */
  BAU.erp = function (el) {
    var tl = gsap.timeline();
    var kpis = slice(el.querySelectorAll('[data-zahl]'));
    var neu = el.querySelector('[data-neu]');
    var chip = neu ? neu.querySelector('[data-chip]') : null;
    var balken = slice(el.querySelectorAll('[data-balken] i'));
    var lager = el.querySelector('[data-lager]');
    if (!neu || !chip) return tl;

    kpis.forEach(function (k) { k.textContent = zahl(0, k.getAttribute('data-einheit')); });
    chip.className = 'erp__chip';
    chip.querySelector('em').textContent = 'Neu';
    gsap.set(neu, { height: 0, opacity: 0, overflow: 'hidden' });
    gsap.set(balken, { scaleY: 0, transformOrigin: '50% 100%' });
    if (lager) gsap.set(lager, { opacity: 0, scale: 0.6 });

    kpis.forEach(function (k, i) {
      var ziel = parseFloat(k.getAttribute('data-zahl')) || 0;
      var einheit = k.getAttribute('data-einheit');
      var o = { v: 0 };
      tl.to(o, { v: ziel, duration: 1.3, ease: 'power3.out', onUpdate: function () { k.textContent = zahl(o.v, einheit); } }, 0.2 + i * 0.12);
    });
    tl.to(balken, { scaleY: 1, duration: 0.55, ease: 'power3.out', stagger: 0.07 }, 0.45);

    tl.to(neu, { height: '2.75em', opacity: 1, duration: 0.5, ease: 'power3.out', clearProps: 'height,overflow' }, 1.7);
    tl.fromTo(neu, { x: -8 }, { x: 0, duration: 0.5, ease: 'power3.out' }, 1.7);
    if (lager) tl.to(lager, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, 2.2);

    function stand(t, klasse, text) {
      tl.to(chip, { scale: 0.86, opacity: 0.3, duration: 0.16, ease: 'power2.in' }, t);
      tl.call(function () { chip.className = 'erp__chip ' + klasse; chip.querySelector('em').textContent = text; }, null, t + 0.16);
      tl.to(chip, { scale: 1, opacity: 1, duration: 0.22, ease: 'power2.out' }, t + 0.16);
    }
    stand(3.7, 'is-lauf', 'In Arbeit');
    stand(5.5, 'is-ok', 'Versendet');
    tl.to({}, { duration: 1.4 }, 6.0);
    return tl;
  };

  /* ── 03 · Werkstatt: Ideen werden eingetippt und landen als Werkzeug im Regal ── */
  BAU.werk = function (el) {
    var tl = gsap.timeline();
    var ideen = slice(el.querySelectorAll('.werk__idee'));
    var staende = slice(el.querySelectorAll('.werk__stand'));
    var chips = slice(el.querySelectorAll('[data-chip]'));
    var cursor = el.querySelector('.werk__cursor');
    if (!ideen.length) return tl;

    gsap.set(ideen, { clipPath: 'inset(0px 100% 0px 0px)' });
    gsap.set(staende, { opacity: 0 });
    gsap.set(chips, { opacity: 0, scale: 0.7, transformOrigin: '0 50%' });
    if (cursor) gsap.set(cursor, { opacity: 0 });

    var t = 0.35;
    ideen.forEach(function (idee, i) {
      var n = idee.textContent.length;
      var letzte = i === ideen.length - 1;
      tl.to(idee, { clipPath: 'inset(0px 0% 0px 0px)', duration: n * (letzte ? 0.045 : 0.028), ease: 'steps(' + n + ')' }, t);
      t += n * (letzte ? 0.045 : 0.028) + 0.1;
      if (staende[i]) tl.to(staende[i], { opacity: 1, duration: 0.25 }, t);
      if (chips[i]) tl.to(chips[i], { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, t);
      t += letzte ? 0.15 : 0.32;
    });
    if (cursor) {
      tl.set(cursor, { opacity: 1 }, t);
      tl.to(cursor, { opacity: 0, duration: 0.5, ease: 'steps(1)', repeat: 5, yoyo: true }, t + 0.5);
      t += 3.2;
    }
    tl.to({}, { duration: 0.2 }, t);
    return tl;
  };

  // Szene 01 erst starten, wenn der Preloader weg ist; bis dahin steht
  // der Endzustand aus dem HTML. Reissleine nach 5 s.
  zeige(0);
  var versuche = 0;
  (function warte() {
    if (!document.getElementById('preloader') || versuche++ > 33) starte(0);
    else window.setTimeout(warte, 150);
  })();
})();

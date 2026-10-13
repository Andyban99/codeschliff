/* ═══════════════════════════════════════════════════════════════
   codeschliff — Die Werkbank (Hero)

   Drei Szenen, die zeigen, was wir bauen: eine Website setzt sich
   zusammen, ein Shop nimmt eine Bestellung an, eine Automatisierung
   erledigt den Rest. Alles SVG + GSAP, nichts gerendert, nichts geladen.

   Verhalten:
   - laeuft als Schleife, pausiert ausserhalb des Sichtfelds und bei
     verdecktem Tab
   - Reiter springen zur Szene
   - prefers-reduced-motion: keine Schleife, Reiter schalten hart um
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var stage = document.getElementById('buehne');
  var svg = document.getElementById('buehneSvg');
  if (!stage || !svg) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tabs = Array.prototype.slice.call(stage.querySelectorAll('.buehne__tab'));
  var caption = document.getElementById('buehneCaption');
  var progress = document.getElementById('buehneProgress');
  var q = function (sel) { return svg.querySelector(sel); };
  var qa = function (sel) { return Array.prototype.slice.call(svg.querySelectorAll(sel)); };

  var SCENES = {
    website: { caption: '<strong>Websites</strong> — Auftritt, Struktur, Redaktion ohne Schulung.' },
    shop:    { caption: '<strong>Webshops</strong> — Sortiment, Kasse, Anbindung an Ihre Warenwirtschaft.' },
    auto:    { caption: '<strong>Automatisierung</strong> — Abläufe, die ohne Handgriff laufen.' }
  };
  var ORDER = ['website', 'shop', 'auto'];

  /* ── Mobil: engerer Ausschnitt, damit die Schrift lesbar bleibt ── */
  function fitViewBox() {
    if (window.innerWidth >= 768) { svg.setAttribute('viewBox', '0 0 1200 560'); return; }
    // Mobil: 700 Einheiten breit, Hoehe aus dem Seitenverhaeltnis der Buehne;
    // die Szene sitzt mittig, oben und unten bleibt Platz fuer Reiter und Untertitel.
    var h = Math.round(700 * stage.clientHeight / Math.max(1, stage.clientWidth));
    var y = Math.round(-(h - 560) / 2);
    svg.setAttribute('viewBox', '250 ' + y + ' 700 ' + h);
  }
  fitViewBox();
  window.addEventListener('resize', fitViewBox);

  function setActive(key) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === key;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (caption) caption.innerHTML = SCENES[key].caption;
  }

  /* ── Ohne GSAP oder mit reduzierter Bewegung: Standbilder ────── */
  if (typeof gsap === 'undefined' || reduced) {
    var show = function (key) {
      qa('.szene').forEach(function (g) { g.setAttribute('opacity', g.getAttribute('data-szene') === key ? '1' : '0'); });
      setActive(key);
    };
    tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.getAttribute('data-tab')); }); });
    show('website');
    return;
  }

  var EASE = 'power2.out';
  var cursor = q('.zeiger');
  var scenes = { website: q('.szene--website'), shop: q('.szene--shop'), auto: q('.szene--auto') };

  /* ── Ausgangszustaende ──────────────────────────────────────── */
  gsap.set([scenes.website, scenes.shop, scenes.auto], { opacity: 0 });
  gsap.set(cursor, { opacity: 0, x: 600, y: 300 });
  gsap.set(qa('.web-el'), { opacity: 0, y: 10 });
  gsap.set(q('.web-fenster'), { opacity: 0, scale: 0.97, transformOrigin: '50% 50%' });
  gsap.set(q('.web-live'), { opacity: 0 });
  gsap.set(q('.shop-fenster'), { opacity: 0, scale: 0.97, transformOrigin: '50% 50%' });
  gsap.set(qa('.shop-el'), { opacity: 0, y: 10 });
  gsap.set(qa('.shop-card'), { opacity: 0, y: 18 });
  gsap.set(q('.shop-toast'), { opacity: 0, y: 16 });
  gsap.set(qa('.auto-node'), { opacity: 0, y: 12 });
  gsap.set(qa('.auto-edge'), { strokeDasharray: 30, strokeDashoffset: 30 });
  gsap.set(q('.auto-pulse'), { opacity: 0 });
  gsap.set(q('.auto-log'), { opacity: 0, y: 12 });
  gsap.set(qa('.auto-line'), { opacity: 0, x: -8 });
  gsap.set(q('.auto-fazit'), { opacity: 0 });

  function cursorTo(tl, x, y, at, dur) {
    tl.to(cursor, { x: x, y: y, duration: dur || 0.6, ease: 'power3.inOut' }, at);
  }
  function click(tl, rectSel, at) {
    tl.to(cursor, { scale: 0.8, duration: 0.08, yoyo: true, repeat: 1, transformOrigin: '50% 50%' }, at)
      .to(rectSel, { opacity: 0.6, duration: 0.08, yoyo: true, repeat: 1 }, at);
  }

  /* ── Szene 1: Website baut sich auf ────────────────────────── */
  function sceneWebsite() {
    var tl = gsap.timeline({ defaults: { ease: EASE } });
    tl.to(scenes.website, { opacity: 1, duration: 0.4 }, 0)
      .to(q('.web-fenster'), { opacity: 1, scale: 1, duration: 0.6 }, 0)
      .to(q('.web-nav'), { opacity: 1, y: 0, duration: 0.35 }, 0.35)
      .to(qa('.web-h1, .web-h2, .web-h3'), { opacity: 1, y: 0, duration: 0.35, stagger: 0.09 }, 0.55)
      .to(qa('.web-p1, .web-p2'), { opacity: 1, y: 0, duration: 0.3, stagger: 0.08 }, 0.95)
      .to(q('.web-bild'), { opacity: 1, y: 0, duration: 0.5 }, 0.8)
      .to(q('.web-btn'), { opacity: 1, y: 0, duration: 0.35 }, 1.2)
      .to(qa('.web-col'), { opacity: 1, y: 0, duration: 0.35, stagger: 0.1 }, 1.4)
      .to(cursor, { opacity: 1, duration: 0.2 }, 1.7);
    cursorTo(tl, 349, 338, 1.7, 0.9);
    click(tl, '.web-btn-rect', 2.65);
    tl.to(q('.web-live'), { opacity: 1, duration: 0.3 }, 2.9)
      .to(cursor, { opacity: 0, duration: 0.3 }, 3.6)
      .to(scenes.website, { opacity: 0, duration: 0.45 }, 4.6);
    return tl;
  }

  /* ── Szene 2: Shop nimmt eine Bestellung an ────────────────── */
  function sceneShop() {
    var tl = gsap.timeline({ defaults: { ease: EASE } });
    tl.to(scenes.shop, { opacity: 1, duration: 0.4 }, 0)
      .to(q('.shop-fenster'), { opacity: 1, scale: 1, duration: 0.6 }, 0)
      .to(q('.shop-kopf'), { opacity: 1, y: 0, duration: 0.35 }, 0.35)
      .to(qa('.shop-card'), { opacity: 1, y: 0, duration: 0.45, stagger: 0.12 }, 0.5)
      .to(cursor, { opacity: 1, duration: 0.2 }, 1.1);
    cursorTo(tl, 598, 419, 1.1, 0.9);
    click(tl, '.shop-btn-1 rect', 2.05);
    tl.add(function () { var z = q('.shop-zahl'); if (z) z.textContent = '1'; }, 2.2)
      .fromTo(q('.shop-badge'), { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.5, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.inOut' }, 2.2)
      .to(cursor, { opacity: 0, duration: 0.3 }, 2.5)
      .to(q('.shop-toast'), { opacity: 1, y: 0, duration: 0.45 }, 2.7)
      .to(scenes.shop, { opacity: 0, duration: 0.45 }, 4.7);
    return tl;
  }

  /* ── Szene 3: Automatisierung erledigt den Rest ────────────── */
  function sceneAuto() {
    var tl = gsap.timeline({ defaults: { ease: EASE } });
    var pulse = q('.auto-pulse');
    tl.to(scenes.auto, { opacity: 1, duration: 0.4 }, 0)
      .to(qa('.auto-node'), { opacity: 1, y: 0, duration: 0.4, stagger: 0.12 }, 0.1)
      .to(q('.auto-dot-0'), { fill: '#FF3B18', duration: 0.2 }, 0.5)
      .to(q('.auto-log'), { opacity: 1, y: 0, duration: 0.45 }, 0.5)
      .to(q('.auto-line-0'), { opacity: 1, x: 0, duration: 0.3 }, 0.7);
    // Impuls wandert von Knoten zu Knoten, die Kanten zeichnen sich dabei
    var hops = [[400, 430], [580, 610], [760, 790]];
    var t = 0.9;
    hops.forEach(function (h, i) {
      tl.set(pulse, { attr: { cx: h[0] }, opacity: 1 }, t)
        .to(q('.auto-edge-' + i), { strokeDashoffset: 0, duration: 0.5, ease: 'none' }, t)
        .to(pulse, { attr: { cx: h[1] }, duration: 0.5, ease: 'none' }, t)
        .to(q('.auto-dot-' + (i + 1)), { fill: '#FF3B18', duration: 0.2 }, t + 0.5)
        .to(q('.auto-line-' + (i + 1)), { opacity: 1, x: 0, duration: 0.3 }, t + 0.55);
      t += 0.75;
    });
    tl.to(pulse, { opacity: 0, duration: 0.2 }, t)
      .to(q('.auto-fazit'), { opacity: 1, duration: 0.4 }, t + 0.1)
      .to(scenes.auto, { opacity: 0, duration: 0.45 }, t + 2.2);
    return tl;
  }

  /* ── Schleife ──────────────────────────────────────────────── */
  var master = gsap.timeline({ repeat: -1, paused: true });
  var builders = { website: sceneWebsite, shop: sceneShop, auto: sceneAuto };
  ORDER.forEach(function (key) {
    master.addLabel(key)
      .add(function () { setActive(key); })
      .fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: builders[key]().duration(), ease: 'none' }, key)
      .add(builders[key](), key);
  });
  // Die Szenen wurden zum Messen einmal gebaut; die Tweens im Master sind die, die laufen.

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      master.seek(t.getAttribute('data-tab')).play();
    });
  });

  // Nur laufen, wenn man es sieht
  var visible = false, inView = false;
  function sync() { if (inView && !document.hidden) master.play(); else master.pause(); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting; sync();
    }, { threshold: 0.15 }).observe(stage);
  } else { inView = true; sync(); }
  document.addEventListener('visibilitychange', sync);
})();

/* ═══════════════════════════════════════════════════════════════
   codeschliff — Das Kino (Hero)

   Der Markenfilm als Leinwand. Diese Datei kuemmert sich um
   - Timecode, Kapitel und Fortschritt in der Infoleiste
   - Ton an/aus (der Film hat eine Tonspur; Autoplay nur stumm)
   - Pause ausserhalb des Sichtfelds und bei verdecktem Tab
   - reduzierte Bewegung: kein Autoplay, Film auf Klick
   - Scroll: die Leinwand oeffnet sich von Inhaltsbreite auf volle Breite
   Ohne JavaScript laeuft der Film stumm in Endlosschleife.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var kino = document.getElementById('kino');
  var video = document.getElementById('kinoVideo');
  if (!kino || !video) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var zeit = document.getElementById('kinoZeit');
  var kapitel = document.getElementById('kinoKapitel');
  var fortschritt = document.getElementById('kinoFortschritt');
  var ton = document.getElementById('kinoTon');
  var play = document.getElementById('kinoPlay');
  var leinwand = document.getElementById('kinoLeinwand');

  // Kapitel, wie sie im Film eingeblendet werden (Sekunden ab Start)
  var KAPITEL = [
    [0, '01 — Auftakt'],
    [14, '02 — Leistungen'],
    [30, '03 — Routine'],
    [41, '04 — Automatisierung'],
    [52, '05 — Ergebnis'],
    [64, '06 — codeschliff']
  ];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(sek) { sek = Math.max(0, Math.floor(sek)); return pad(Math.floor(sek / 60)) + ':' + pad(sek % 60); }

  var letztesKapitel = '';
  video.addEventListener('timeupdate', function () {
    var t = video.currentTime || 0;
    if (zeit) zeit.textContent = fmt(t);
    if (fortschritt && video.duration) fortschritt.style.transform = 'scaleX(' + (t / video.duration) + ')';
    if (kapitel) {
      var name = KAPITEL[0][1];
      for (var i = 0; i < KAPITEL.length; i++) if (t >= KAPITEL[i][0]) name = KAPITEL[i][1];
      if (name !== letztesKapitel) { letztesKapitel = name; kapitel.textContent = name; }
    }
  });

  /* ── Ton ──────────────────────────────────────────────────── */
  if (ton) {
    ton.addEventListener('click', function () {
      video.muted = !video.muted;
      var an = !video.muted;
      ton.setAttribute('aria-pressed', an ? 'true' : 'false');
      ton.querySelector('span').textContent = an ? 'Ton aus' : 'Ton an';
      if (an && video.paused) { var p = video.play(); if (p) p.catch(function () {}); }
    });
  }

  /* ── Sichtbarkeit: nur laufen, wenn man es sieht ───────────── */
  var inView = true;
  var wunsch = !reduced;   // ob der Film ueberhaupt laufen soll
  function sync() {
    if (!wunsch) return;
    if (inView && !document.hidden) { var p = video.play(); if (p) p.catch(function () {}); }
    else video.pause();
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { inView = e[0].isIntersecting; sync(); }, { threshold: 0.2 }).observe(kino);
  }
  document.addEventListener('visibilitychange', sync);

  /* ── Reduzierte Bewegung: Film erst auf Klick ──────────────── */
  if (reduced) {
    video.removeAttribute('autoplay');
    video.pause();
    if (play) {
      play.hidden = false;
      play.addEventListener('click', function () {
        wunsch = true; play.hidden = true;
        var p = video.play(); if (p) p.catch(function () {});
      });
    }
  }

  /* ── Scroll: Leinwand oeffnet sich ─────────────────────────── */
  if (!reduced && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && leinwand && window.innerWidth >= 768) {
    // Inhaltsbreite als Startmass: so breit wie die Textspalte darueber
    var rand = function () {
      var inner = document.querySelector('.hero__inner');
      if (!inner) return 0;
      var r = inner.getBoundingClientRect();
      var pad = parseFloat(getComputedStyle(inner).paddingLeft) || 0;
      return Math.max(0, (window.innerWidth - (r.width - 2 * pad)) / 2);
    };
    gsap.fromTo(leinwand,
      { clipPath: function () { return 'inset(0px ' + rand() + 'px)'; } },
      {
        clipPath: 'inset(0px 0px)',
        ease: 'none',
        scrollTrigger: {
          trigger: kino,
          start: 'top 85%',
          end: 'top 25%',
          scrub: 0.6,
          invalidateOnRefresh: true
        }
      });
  }
})();

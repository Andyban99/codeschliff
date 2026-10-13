/* ═══════════════════════════════════════════════════════════════
   codeschliff — Stimmen: Text schreibt sich beim Scrollen ein

   Die Zitate stehen zuerst in hellem Grau. Beim Scrollen laeuft eine
   rote Welle Wort fuer Wort durch den Text und laesst ihn in Tinte
   zurueck, als wuerde er gerade geschrieben. Ist ein Zitat fertig,
   ploppen die Sterne nacheinander auf, Logo und Name schieben sich hoch.
   Jedes Zitat hat seinen eigenen Scroll-Abschnitt: am Desktop laufen
   die drei Spalten parallel, auf dem Handy eins nach dem anderen.
   Ohne GSAP oder bei reduzierter Bewegung bleibt alles, wie es ist.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var stimmen = Array.prototype.slice.call(document.querySelectorAll('.stimme'));
  if (!stimmen.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  var GRAU = '#D9D6CF';
  var SIGNAL = '#FF3B18';
  var TINTE = '#0A0A0A';

  // Woerter einzeln einpacken. Nur an normalen Leerzeichen trennen, damit
  // feste Leerzeichen (&nbsp;) ihre Woerter zusammenhalten.
  function woerter(p) {
    var text = p.textContent;
    p.innerHTML = text.split(' ').map(function (w) {
      return '<span class="stimme__wort">' + w.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>';
    }).join(' ');
    return Array.prototype.slice.call(p.querySelectorAll('.stimme__wort'));
  }

  stimmen.forEach(function (stimme) {
    var p = stimme.querySelector('.stimme__quote p');
    if (!p) return;
    var liste = woerter(p);
    var sterne = Array.prototype.slice.call(stimme.querySelectorAll('.stimme__sterne i'));
    var wer = stimme.querySelector('.stimme__who');

    gsap.set(liste, { color: GRAU });
    if (sterne.length) gsap.set(sterne, { scale: 0, rotate: -50, opacity: 0, transformOrigin: '50% 55%' });
    if (wer) gsap.set(wer, { opacity: 0, y: 14 });

    // Die rote Welle: jedes Wort geht Grau → Signal → Tinte, gebunden an den Scroll
    gsap.timeline({
      scrollTrigger: { trigger: p, start: 'top 85%', end: 'bottom 52%', scrub: 0.5 }
    }).to(liste, {
      keyframes: { color: [GRAU, SIGNAL, TINTE], easeEach: 'none' },
      duration: 1,
      ease: 'none',
      stagger: 0.18
    });

    // Am Ende: Logo und Name, dann die Sterne einzeln
    ScrollTrigger.create({
      trigger: p,
      start: 'bottom 56%',
      once: true,
      onEnter: function () {
        if (wer) gsap.to(wer, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
        if (sterne.length) {
          gsap.to(sterne, { scale: 1, rotate: 0, opacity: 1, duration: 0.55, ease: 'back.out(2.6)', stagger: 0.09, delay: 0.15 });
        }
      }
    });
  });
})();

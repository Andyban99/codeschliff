/* ═══════════════════════════════════════════════════════════════
   codeschliff — Das Kino (Hero)

   Der Markenfilm als Leinwand. Diese Datei kuemmert sich um
   - Timecode, Kapitel und Fortschritt in der Infoleiste
   - Ton an/aus (der Film hat eine Tonspur; Autoplay nur stumm)
   - Pause ausserhalb des Sichtfelds und bei verdecktem Tab
   - reduzierte Bewegung: kein Autoplay, Film auf Klick
   - Grossansicht: Klick aufs Bild holt den Player mittig nach vorn
   - Vollbild ueber den Knopf in der Leiste
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
  var pp = document.getElementById('kinoPP');
  var spur = document.getElementById('kinoSpur');
  var overlay = document.getElementById('kinoOverlay');
  var overlayText = document.getElementById('kinoOverlayText');
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

  /* ── Zustaende ────────────────────────────────────────────────
     Autoplay laeuft stumm, darueber das grosse Play-Zeichen.
     Play-Zeichen: Ton an, Film von vorn, Zeichen verschwindet.
     Klick aufs Bild: Pause. Pausiert bleibt pausiert — auch wenn man
     wegscrollt und zurueckkommt — bis man wieder klickt. */
  var userPaused = false;    // vom Besucher angehalten
  var wunsch = !reduced;     // soll der Film ueberhaupt laufen
  var inView = true;

  function setTon(an) {
    video.muted = !an;
    // Endlosschleife nur stumm: mit Ton endet der Film und faengt nicht
    // von selbst mit Ton wieder von vorn an
    video.loop = !an;
    if (ton) {
      ton.setAttribute('aria-pressed', an ? 'true' : 'false');
      ton.querySelector('span').textContent = an ? 'Ton aus' : 'Ton an';
    }
  }
  function zeigeOverlay(text) {
    if (!overlay) return;
    if (overlayText) overlayText.textContent = text;
    overlay.hidden = false;
  }
  function versteckeOverlay() { if (overlay) overlay.hidden = true; }
  function abspielen() { var p = video.play(); if (p) p.catch(function () {}); }
  function zeigePP() {
    if (!pp) return;
    pp.classList.toggle('is-paused', video.paused);
    pp.setAttribute('aria-label', video.paused ? 'Abspielen' : 'Pause');
  }
  video.addEventListener('play', zeigePP);
  video.addEventListener('pause', zeigePP);
  zeigePP();

  if (pp) {
    pp.addEventListener('click', function () {
      if (video.paused) { userPaused = false; wunsch = true; versteckeOverlay(); abspielen(); }
      else { userPaused = true; video.pause(); zeigeOverlay('Weiter'); }
    });
  }
  // Fortschrittsbalken: Klick springt an die Stelle
  if (spur) {
    spur.addEventListener('click', function (e) {
      if (!video.duration) return;
      var r = spur.getBoundingClientRect();
      var anteil = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      try { video.currentTime = anteil * video.duration; } catch (err) { /* noch nicht geladen */ }
    });
  }

  /* ── Grossansicht ─────────────────────────────────────────────
     Klick aufs kleine Bild (oder aufs Play-Zeichen) holt den Player aus
     seiner Spalte mittig nach vorn: er fliegt von seiner Position aus
     (FLIP), die Seite dahinter wird abgedunkelt und steht still. Beim
     ersten Mal startet der Film mit Ton von vorn, danach an der Stelle,
     an der man aufgehoert hat.
     Zurueck in die normale Ansicht: Klick daneben, Esc, „Schliessen"
     oder einfach weiterscrollen. Danach laeuft wieder die stumme
     Vorschau. In der Grossansicht pausiert ein Klick aufs Bild. */
  var wrap = kino.parentNode;
  var zu = document.getElementById('kinoZu');
  var voll = document.getElementById('kinoVoll');
  var animiert = !reduced && typeof gsap !== 'undefined';
  var gross = false;
  var merke = null;          // Stelle beim Verlassen der Grossansicht
  var vorherFokus = null;
  var radSumme = 0;
  var tY = 0;

  var vorhang = document.createElement('div');
  vorhang.className = 'kino-vorhang';
  vorhang.setAttribute('aria-hidden', 'true');
  vorhang.innerHTML = '<span class="kino-vorhang__hinweis">Esc oder Klick daneben schließt</span>';
  document.body.appendChild(vorhang);

  function scrollen(an) {
    if (window.csLenis) { if (an) window.csLenis.start(); else window.csLenis.stop(); }
  }
  function mitTon() {
    wunsch = true; userPaused = false;
    if (video.muted) {
      setTon(true);
      try { video.currentTime = merke === null ? 0 : merke; } catch (err) { /* noch nicht geladen */ }
    }
    versteckeOverlay();
    abspielen();
  }
  function stummeVorschau() {
    merke = video.currentTime || 0;
    if (video.ended || (video.duration && merke > video.duration - 1)) merke = 0;
    setTon(false);
    userPaused = false;
    if (reduced) { wunsch = false; video.pause(); } else { wunsch = true; abspielen(); }
    zeigeOverlay('Weiter ansehen');
  }

  // Zielgroesse: so gross wie moeglich, mit Rand, nie breiter als 1720 px
  function ziel() {
    var vw = document.documentElement.clientWidth;
    var vh = window.innerHeight;
    var k = kino.getBoundingClientRect();
    var l = leinwand.getBoundingClientRect();
    var hRand = k.width - l.width;
    var vRand = k.height - l.height;
    var rand = vw < 768 ? 12 : 40;
    var hinweis = vw < 768 ? 0 : 36;
    var lw = Math.min(vw - 2 * rand - hRand, (vh - 2 * rand - hinweis - vRand) * 16 / 9, 1720);
    var w = Math.round(lw + hRand);
    var h = lw * 9 / 16 + vRand;
    return { left: Math.round((vw - w) / 2), top: Math.round((vh - hinweis - h) / 2), width: w };
  }
  function setze(r) {
    kino.style.left = r.left + 'px';
    kino.style.top = r.top + 'px';
    kino.style.width = r.width + 'px';
  }

  function oeffne() {
    if (gross) return;
    gross = true;
    if (animiert) gsap.killTweensOf(kino);
    vorherFokus = document.activeElement;
    var erst = kino.getBoundingClientRect();
    wrap.style.height = erst.height + 'px';            // Platz in der Spalte halten
    kino.classList.add('is-gross');
    if (animiert) gsap.set(kino, { x: 0, y: 0, scale: 1 });
    setze({ left: erst.left, top: erst.top, width: erst.width });
    setze(ziel());
    var dann = kino.getBoundingClientRect();
    vorhang.classList.add('is-an');
    document.documentElement.classList.add('kino-offen');
    scrollen(false);
    video.setAttribute('data-cursor', 'button');
    video.removeAttribute('data-cursor-label');
    mitTon();
    if (animiert) {
      gsap.fromTo(kino,
        { x: erst.left - dann.left, y: erst.top - dann.top, scale: erst.width / dann.width, transformOrigin: '0 0' },
        { x: 0, y: 0, scale: 1, duration: 0.8, ease: 'expo.out' });
    }
    if (zu) zu.focus({ preventScroll: true });
    radSumme = 0;
    window.addEventListener('wheel', amRad, { passive: false });
    window.addEventListener('touchstart', amTouchStart, { passive: true });
    window.addEventListener('touchmove', amTouch, { passive: false });
    window.addEventListener('resize', neuSetzen);
  }

  function schliesse() {
    if (!gross) return;
    gross = false;
    window.removeEventListener('wheel', amRad);
    window.removeEventListener('touchstart', amTouchStart);
    window.removeEventListener('touchmove', amTouch);
    window.removeEventListener('resize', neuSetzen);
    if (animiert) gsap.killTweensOf(kino);
    var erst = kino.getBoundingClientRect();
    var platz = wrap.getBoundingClientRect();
    vorhang.classList.remove('is-an');
    document.documentElement.classList.remove('kino-offen');
    scrollen(true);
    video.setAttribute('data-cursor', 'link');
    video.setAttribute('data-cursor-label', 'ansehen');
    stummeVorschau();

    function fertig() {
      kino.classList.remove('is-gross');
      kino.style.left = kino.style.top = kino.style.width = '';
      wrap.style.height = '';
      if (animiert) gsap.set(kino, { clearProps: 'transform' });
    }
    if (animiert) {
      gsap.set(kino, { x: 0, y: 0, scale: 1 });
      var basis = kino.getBoundingClientRect();
      gsap.fromTo(kino,
        { x: erst.left - basis.left, y: erst.top - basis.top, scale: erst.width / basis.width, transformOrigin: '0 0' },
        { x: platz.left - basis.left, y: platz.top - basis.top, scale: platz.width / basis.width,
          duration: 0.65, ease: 'expo.inOut', onComplete: fertig });
    } else {
      fertig();
    }
    if (vorherFokus && vorherFokus.focus) vorherFokus.focus({ preventScroll: true });
  }

  function neuSetzen() {
    if (!gross) return;
    if (animiert) { gsap.killTweensOf(kino); gsap.set(kino, { x: 0, y: 0, scale: 1 }); }
    setze(ziel());
  }
  // Weiterscrollen schliesst die Grossansicht
  // (kleine, vereinzelte Bewegungen verfallen nach einer halben Sekunde)
  var radZeit = 0;
  function amRad(e) {
    e.preventDefault();
    var jetzt = Date.now();
    if (jetzt - radZeit > 500) radSumme = 0;
    radZeit = jetzt;
    radSumme += Math.abs(e.deltaY) + Math.abs(e.deltaX);
    if (radSumme > 150) schliesse();
  }
  function amTouchStart(e) { tY = e.touches[0].clientY; }
  function amTouch(e) {
    e.preventDefault();
    if (Math.abs(e.touches[0].clientY - tY) > 90) schliesse();
  }

  vorhang.addEventListener('click', schliesse);
  if (zu) zu.addEventListener('click', schliesse);

  document.addEventListener('keydown', function (e) {
    if (!gross) return;
    if (e.key === 'Escape') { e.preventDefault(); schliesse(); return; }
    // Fokus bleibt im Player
    if (e.key === 'Tab') {
      var ziele = Array.prototype.filter.call(kino.querySelectorAll('button'), function (b) { return !b.hidden && b.offsetParent !== null; });
      if (!ziele.length) return;
      var i = ziele.indexOf(document.activeElement);
      var n = e.shiftKey ? (i <= 0 ? ziele.length - 1 : i - 1) : (i === ziele.length - 1 ? 0 : i + 1);
      e.preventDefault();
      ziele[n].focus();
      return;
    }
    // Leertaste: Pause / Weiter (ausser auf Knoepfen, die loesen selbst aus)
    if (e.key === ' ' && !(e.target.closest && e.target.closest('button'))) {
      e.preventDefault();
      if (pp) pp.click();
      return;
    }
    // Seite dahinter nicht per Tastatur scrollen
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].indexOf(e.key) !== -1) e.preventDefault();
  });

  // Play-Zeichen: klein → Grossansicht; gross (pausiert, „Weiter") → weiter
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!gross) { oeffne(); return; }
      wunsch = true; userPaused = false;
      versteckeOverlay();
      abspielen();
    });
  }

  // Klick aufs Bild: klein → Grossansicht; gross → Pause / Weiter
  video.addEventListener('click', function () {
    if (!gross) { oeffne(); return; }
    if (video.paused) {
      userPaused = false; wunsch = true;
      versteckeOverlay();
      abspielen();
    } else {
      userPaused = true;
      video.pause();
      zeigeOverlay('Weiter');
    }
  });

  /* ── Vollbild ─────────────────────────────────────────────────
     Der ganze Player geht ins Vollbild (mit eigener Leiste). Auf dem
     iPhone gibt es nur das Vollbild des Videos selbst. */
  var kannVoll = !!(kino.requestFullscreen || kino.webkitRequestFullscreen);
  var kannIOS = !kannVoll && typeof video.webkitEnterFullscreen === 'function';
  function istVoll() { return (document.fullscreenElement || document.webkitFullscreenElement) === kino; }
  if (voll) {
    if (!kannVoll && !kannIOS) voll.hidden = true;
    voll.addEventListener('click', function () {
      if (istVoll()) {
        var raus = document.exitFullscreen || document.webkitExitFullscreen;
        if (raus) raus.call(document);
        return;
      }
      mitTon();
      if (kannVoll) {
        var p = (kino.requestFullscreen || kino.webkitRequestFullscreen).call(kino);
        if (p && p.catch) p.catch(function () {});
      } else {
        video.webkitEnterFullscreen();
      }
    });
    var warVoll = false;
    var fsWechsel = function () {
      var an = istVoll();
      voll.classList.toggle('is-voll', an);
      voll.setAttribute('aria-label', an ? 'Vollbild beenden' : 'Vollbild');
      // Aus dem Vollbild zurueck in die kleine Ansicht: wieder stille Vorschau
      if (warVoll && !an && !gross) stummeVorschau();
      warVoll = an;
    };
    document.addEventListener('fullscreenchange', fsWechsel);
    document.addEventListener('webkitfullscreenchange', fsWechsel);
  }

  // Ton-Schalter in der Leiste: nur den Ton, keine Rueckspulung
  if (ton) {
    ton.addEventListener('click', function () {
      setTon(video.muted);
      if (!video.muted) {
        if (!userPaused) versteckeOverlay();
        if (video.paused && !userPaused) { wunsch = true; abspielen(); }
      } else if (!gross && !istVoll() && !video.paused) {
        zeigeOverlay('Mit Ton abspielen');
      }
    });
  }

  /* ── Sichtbarkeit: nur laufen, wenn man es sieht ─────────────
     Ton gibt es nur nach einem Klick und nur, solange man hinsieht.
     Scrollt man weg oder wechselt den Tab, waehrend der Ton laeuft,
     wird der Film stumm (kleine Ansicht) bzw. angehalten (Grossansicht,
     Vollbild). Beim Zurueckkommen startet also nie Ton von selbst. */
  function sync() {
    var sichtbar = inView && !document.hidden;
    if (!sichtbar && !video.muted) {
      if (gross || istVoll()) {
        userPaused = true;
        video.pause();
        zeigeOverlay('Weiter');
        return;
      }
      stummeVorschau();
    }
    if (!wunsch || userPaused) { if (!sichtbar) video.pause(); return; }
    if (sichtbar) abspielen(); else video.pause();
  }

  // Filmende mit Ton: stehen bleiben statt von vorn mit Ton
  video.addEventListener('ended', function () {
    merke = 0;
    if (gross || istVoll()) { userPaused = true; zeigeOverlay('Nochmal ansehen'); return; }
    // kleine Ansicht: zurueck zur stummen Vorschau
    setTon(false);
    userPaused = false;
    if (!reduced) { wunsch = true; abspielen(); }
    zeigeOverlay('Mit Ton abspielen');
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { inView = e[0].isIntersecting; sync(); }, { threshold: 0.2 }).observe(kino);
  }
  document.addEventListener('visibilitychange', sync);

  /* ── Reduzierte Bewegung: kein Autoplay, Film erst auf Klick ── */
  if (reduced) {
    video.removeAttribute('autoplay');
    video.pause();
    zeigeOverlay('Mit Ton abspielen');
  }

})();

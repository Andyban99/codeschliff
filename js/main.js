/* ═══════════════════════════════════════════════════════════════
   codeschliff — Interaktionsebene
   Lenis (Smooth Scroll) + GSAP/ScrollTrigger (Bewegung)
   Alle Dauern/Easings folgen dem Brand Kit:
   Hover 160ms · Fade 240ms · Seite 320ms · Kaskade 60ms
   Easing cubic-bezier(0.22, 0.61, 0.36, 1)
   prefers-reduced-motion: reduce → keine Bewegung, kein Preloader
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  document.documentElement.classList.add('js');

  // Die Bewegungsschicht ist Beiwerk, keine Voraussetzung. Fehlt eine der
  // Bibliotheken, wird die Seite ohne Animation vollstaendig ausgeliefert,
  // statt hinter dem Preloader stehen zu bleiben.
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    document.documentElement.classList.remove('js');
    var stuck = document.getElementById('preloader');
    if (stuck) stuck.remove();
    document.body.classList.remove('is-locked');
    return;
  }

  var EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
  var GS_EASE = CustomEaseFallback();
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function CustomEaseFallback() {
    // GSAP-Äquivalent des Marken-Easings
    return 'power2.out';
  }

  gsap.registerPlugin(ScrollTrigger);

  // Vorbereitete Abschnitte (z. B. Stimmen ohne Originaltexte) bleiben versteckt,
  // bis die Inhalte da sind. Mit ?vorschau in der Adresse sieht man sie trotzdem.
  if (/[?&]vorschau\b/.test(location.search)) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-vorschau]'), function (el) { el.hidden = false; });
  }

  /* ── Lenis Smooth Scroll ───────────────────────────────────── */
  var lenis = null;
  if (!reduced && typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.05,
      easing: function (t) { return 1 - Math.pow(1 - t, 3); },
      smoothWheel: true,
      touchMultiplier: 1.6
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target) {
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    var offset = -72;
    if (lenis) { lenis.scrollTo(el, { offset: offset, duration: 1.2 }); }
    else { window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset }); }
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href');
    if (id.length < 2) return;
    var el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    closeMobileNav();
    scrollToTarget(el);
  });

  /* ── Hilfen ────────────────────────────────────────────────── */
  function splitLines(el) {
    // Zerlegt Überschriften an <br> in maskierte Zeilen
    var parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(function (p) {
      return '<span class="split-line"><span>' + p + '</span></span>';
    }).join('');
    return Array.prototype.slice.call(el.querySelectorAll('.split-line > span'));
  }

  /* ── Preloader + Intro ─────────────────────────────────────── */
  var preloader = document.getElementById('preloader');
  var heroLines = Array.prototype.slice.call(document.querySelectorAll('.hero__line-inner'));
  var heroRevealEls = Array.prototype.slice.call(document.querySelectorAll('.hero [data-reveal]'));
  var panel = document.querySelector('[data-hero-panel]');
  var panelRows = Array.prototype.slice.call(document.querySelectorAll('[data-panel-row]'));

  function introTimeline() {
    var tl = gsap.timeline({ defaults: { ease: GS_EASE } });
    tl.fromTo(heroLines,
      { yPercent: 112 },
      { yPercent: 0, duration: 0.9, stagger: 0.09 }, 0)
      .to(heroRevealEls, { opacity: 1, y: 0, duration: 0.24, stagger: 0.06 }, 0.35)
      .fromTo(panel,
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.7 }, 0.3)
    if (panelRows.length) {
      tl.fromTo(panelRows,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.24, stagger: 0.06, clearProps: 'all' }, 0.75);
    }
    return tl;
  }

  if (reduced || !preloader) {
    if (preloader) preloader.remove();
    gsap.set(heroLines, { yPercent: 0 });
    gsap.set(heroRevealEls, { opacity: 1, y: 0 });
    if (panel) gsap.set(panel, { opacity: 1 });
  } else {
    document.body.classList.add('is-locked');
    var countEl = document.getElementById('preloaderCount');
    var braceL = preloader.querySelector('.preloader__brace--l');
    var braceR = preloader.querySelector('.preloader__brace--r');
    var dot = preloader.querySelector('.preloader__dot');
    var seen = null;
    try { seen = sessionStorage.getItem('cs-intro'); } catch (err) { /* privater Modus */ }
    var count = { v: 0 };

    // Der Preloader deckt die ganze Seite ab. Er darf deshalb unter keinen
    // Umstaenden haengen bleiben: die Reissleine raeumt ihn nach 4 s weg,
    // auch wenn die Timeline nie fertig wird.
    var preDone = false;
    function finishPreloader(instant) {
      if (preDone) return;
      preDone = true;
      window.clearTimeout(rescue);
      try { sessionStorage.setItem('cs-intro', '1'); } catch (err) { /* privater Modus */ }
      document.body.classList.remove('is-locked');
      if (!preloader || !preloader.isConnected) return;
      preloader.classList.add('is-done');
      if (instant) {
        preloader.remove();
        ScrollTrigger.refresh();
      } else {
        gsap.to(preloader, {
          clipPath: 'inset(0 0 100% 0)',
          duration: 0.6,
          ease: 'power3.inOut',
          onComplete: function () { preloader.remove(); ScrollTrigger.refresh(); }
        });
      }
      try { introTimeline(); } catch (err) {
        gsap.set(heroLines, { yPercent: 0 });
        gsap.set(heroRevealEls, { opacity: 1, y: 0 });
        if (panel) gsap.set(panel, { opacity: 1 });
      }
    }
    var rescue = window.setTimeout(function () { finishPreloader(true); }, 4000);

    var pre = gsap.timeline({
      defaults: { ease: GS_EASE },
      onComplete: function () { finishPreloader(false); }
    });

    var fast = !!seen;
    pre.fromTo(braceL, { x: -44, opacity: 0 }, { x: 0, opacity: 1, duration: fast ? 0.25 : 0.55 }, 0)
       .fromTo(braceR, { x: 44, opacity: 0 }, { x: 0, opacity: 1, duration: fast ? 0.25 : 0.55 }, 0)
       .fromTo(dot, { scale: 0 }, { scale: 1, duration: fast ? 0.2 : 0.4, ease: 'back.out(2.4)' }, fast ? 0.1 : 0.3)
       .to(count, {
         v: 100,
         duration: fast ? 0.4 : 1.05,
         ease: 'power2.inOut',
         onUpdate: function () { countEl.textContent = Math.round(count.v); }
       }, 0)
       .to(dot, { scaleX: 34, transformOrigin: '50% 50%', duration: 0.35, ease: 'power3.inOut' }, fast ? 0.5 : 1.15)
       .to([braceL, braceR], { opacity: 0, duration: 0.2 }, fast ? 0.5 : 1.15)
       .to('.preloader__meta', { opacity: 0, duration: 0.2 }, fast ? 0.5 : 1.2);
  }

  /* ── Custom Cursor ─────────────────────────────────────────── */
  if (finePointer && !reduced) {
    document.body.classList.add('has-cursor');
    var cursor = document.getElementById('cursor');
    var cursorLabel = document.getElementById('cursorLabel');
    var dotX = gsap.quickTo('#cursorDot', 'x', { duration: 0.08, ease: 'power2.out' });
    var dotY = gsap.quickTo('#cursorDot', 'y', { duration: 0.08, ease: 'power2.out' });
    var ringX = gsap.quickTo('#cursorRing', 'x', { duration: 0.32, ease: 'power2.out' });
    var ringY = gsap.quickTo('#cursorRing', 'y', { duration: 0.32, ease: 'power2.out' });

    var pressed = false;
    var cursorClass = 'cursor';
    function paintCursor(kind) {
      var next = 'cursor' + (kind ? ' is-' + kind : '') + (pressed ? ' is-pressed' : '');
      // Nur schreiben, wenn sich wirklich etwas aendert: sonst erzwingt
      // jeder Mausbewegungs-Frame eine Neuberechnung der Stile.
      if (next !== cursorClass) { cursorClass = next; cursor.className = next; }
    }
    var lastKind = '';
    window.addEventListener('mousemove', function (e) {
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
      var t = e.target.closest('[data-cursor]');
      var kind = t ? t.getAttribute('data-cursor') : '';
      if (kind !== lastKind) {
        lastKind = kind;
        cursorLabel.textContent = !t ? '' : (t.getAttribute('data-cursor-label') ||
          (kind === 'video' ? 'ansehen' : kind === 'card' ? 'Vorschau' : ''));
      }
      paintCursor(kind);
    }, { passive: true });
    window.addEventListener('mousedown', function () { pressed = true; paintCursor(lastKind); });
    window.addEventListener('mouseup', function () { pressed = false; paintCursor(lastKind); });
  }

  /* ── Magnetische Buttons ───────────────────────────────────── */
  if (finePointer && !reduced) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-magnetic]'), function (btn) {
      var xTo = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power3.out' });
      var yTo = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power3.out' });
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.34);
      });
      btn.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ── Kopfzeile: Zustand + Scrollspy ────────────────────────── */
  var header = document.getElementById('header');
  ScrollTrigger.create({
    start: 24,
    onUpdate: function (self) {
      header.classList.toggle('is-scrolled', self.scroll() > 24);
    }
  });

  ['arbeiten', 'leistungen', 'studio'].forEach(function (id) {
    var section = document.getElementById(id);
    var link = document.querySelector('.header__link[href="#' + id + '"]');
    if (!section || !link) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 40%',
      end: 'bottom 40%',
      onToggle: function (self) { link.classList.toggle('is-active', self.isActive); }
    });
  });

  /* ── Scroll-Fortschritt ────────────────────────────────────── */
  if (!reduced) {
    gsap.to('#scrollProgress', {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.4 }
    });
  }

  /* ── Mobile Navigation ─────────────────────────────────────── */
  var burger = document.getElementById('burger');
  var mobileNav = document.getElementById('mobileNav');
  function closeMobileNav() {
    if (!burger || !mobileNav) return;
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Menü öffnen');
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    if (lenis) lenis.start();
  }
  if (burger && mobileNav) burger.addEventListener('click', function () {
    var open = !mobileNav.classList.contains('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    mobileNav.classList.toggle('is-open', open);
    mobileNav.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('is-locked', open);
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  });

  /* ── Hero-Panel: 3D-Neigung ────────────────────────────────── */
  if (finePointer && !reduced && panel && panel.hasAttribute('data-tilt')) {
    var rx = gsap.quickTo(panel, 'rotationX', { duration: 0.6, ease: 'power2.out' });
    var ry = gsap.quickTo(panel, 'rotationY', { duration: 0.6, ease: 'power2.out' });
    var wrap = panel.parentElement;
    wrap.addEventListener('mousemove', function (e) {
      var r = wrap.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 7);
      rx(py * -7);
    });
    wrap.addEventListener('mouseleave', function () { rx(0); ry(0); });
  }

  /* ── Marquee (Tempo folgt Scroll) ──────────────────────────── */
  function velocityMarquee(trackSel, baseSeconds, groupPercent) {
    var track = document.querySelector(trackSel);
    if (!track) return;
    var tween = gsap.to(track, {
      xPercent: -groupPercent,
      duration: baseSeconds,
      ease: 'none',
      repeat: -1
    });
    if (reduced) { tween.pause(); return; }
    var proxy = { speed: 1 };
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: function (self) {
        var v = Math.abs(self.getVelocity()) / 900;
        gsap.to(proxy, {
          speed: 1 + Math.min(v, 3.2),
          duration: 0.3,
          ease: 'power2.out',
          overwrite: true,
          onUpdate: function () { tween.timeScale(proxy.speed); }
        });
      }
    });
  }
  velocityMarquee('#marqueeTrack', 26, 33.3334);
  velocityMarquee('#footerMarquee', 38, 50);

  /* ── Standard-Reveals (240ms, 60ms Kaskade) ────────────────── */
  if (!reduced) {
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-reveal]:not(.hero [data-reveal])'),
      function (el) {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 0.24, ease: GS_EASE,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      });
    Array.prototype.forEach.call(document.querySelectorAll('[data-reveal-group]'), function (group) {
      gsap.to(group.children, {
        opacity: 1, y: 0, duration: 0.24, stagger: 0.06, ease: GS_EASE,
        scrollTrigger: { trigger: group, start: 'top 88%', once: true }
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-split-lines]'), function (el) {
      var lines = splitLines(el);
      gsap.fromTo(lines,
        { yPercent: 112 },
        {
          yPercent: 0, duration: 0.8, stagger: 0.09, ease: GS_EASE,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true }
        });
    });
    // Leistungs-Spalten: Kaskade
    gsap.fromTo('.leistung',
      { opacity: 0, y: 16 },
      {
        opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: GS_EASE,
        scrollTrigger: { trigger: '.leistungen__grid', start: 'top 84%', once: true }
      });
  } else {
    gsap.set('.leistung', { opacity: 1 });
  }

  /* ── Leistungen: schwebende Vorschau folgt der Maus ────────── */
  var grid = document.getElementById('leistungenGrid');
  var preview = document.getElementById('preview');
  if (finePointer && !reduced && grid && preview) {
    var previewImg = document.getElementById('previewImg');
    var pX = gsap.quickTo(preview, 'x', { duration: 0.45, ease: 'power3.out' });
    var pY = gsap.quickTo(preview, 'y', { duration: 0.45, ease: 'power3.out' });
    var visible = false;

    grid.addEventListener('mousemove', function (e) {
      pX(e.clientX + 26);
      pY(e.clientY - 120);
      var col = e.target.closest('[data-preview]');
      if (col) {
        var src = col.getAttribute('data-preview');
        if (previewImg.getAttribute('src') !== src) previewImg.setAttribute('src', src);
        if (!visible) {
          visible = true;
          gsap.to(preview, { opacity: 1, scale: 1, duration: 0.32, ease: GS_EASE });
        }
      }
    });
    grid.addEventListener('mouseleave', function () {
      visible = false;
      gsap.to(preview, { opacity: 0, scale: 0.82, duration: 0.28, ease: GS_EASE });
    });
  }

  /* ── Arbeiten: Bildschirmfoto scrollt im Rahmen bei Hover ──── */
  if (finePointer) {
    Array.prototype.forEach.call(document.querySelectorAll('.fall__media'), function (media) {
      var frames = Array.prototype.slice.call(media.querySelectorAll('[data-scroll-frame]'));
      if (!frames.length) return;
      function run() {
        frames.forEach(function (frame) {
          var img = frame.querySelector('img');
          var overflow = img.offsetHeight - frame.clientHeight;
          if (overflow <= 0) return;
          // Gleichmaessiges Tempo: 140 px je Sekunde, egal wie lang die Seite ist.
          img.style.transitionDuration = reduced ? '0ms' : Math.max(0.6, overflow / 140) + 's';
          img.style.transitionTimingFunction = 'linear';
          img.style.transform = 'translateY(' + (-overflow) + 'px)';
        });
      }
      function reset() {
        frames.forEach(function (frame) {
          var img = frame.querySelector('img');
          img.style.transitionDuration = reduced ? '0ms' : '600ms';
          img.style.transitionTimingFunction = '';
          img.style.transform = 'translateY(0)';
        });
      }
      media.addEventListener('mouseenter', run);
      media.addEventListener('mouseleave', reset);
      media.addEventListener('focus', run, true);
      media.addEventListener('blur', reset, true);
    });
  }

  /* ── Wer baut: Vorhang hebt sich, Bild setzt sich ──────────── */
  var personFrame = document.querySelector('[data-person-frame]');
  if (personFrame) {
    if (reduced) {
      gsap.set(personFrame, { clipPath: 'none' });
      gsap.set(personFrame.querySelector('img'), { scale: 1 });
    } else {
      var personTl = gsap.timeline({
        defaults: { ease: GS_EASE },
        scrollTrigger: { trigger: personFrame, start: 'top 82%', once: true }
      });
      personTl
        .fromTo(personFrame, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.9 }, 0)
        .fromTo(personFrame.querySelector('img'), { scale: 1.06 }, { scale: 1, duration: 1.2 }, 0);
    }
  }

  /* ── Scramble-Effekt auf Mono-/Nav-Texten ──────────────────── */
  if (finePointer && !reduced) {
    var CHARS = '{}[]<>/\\|=+*#';
    Array.prototype.forEach.call(document.querySelectorAll('[data-scramble]'), function (el) {
      var original = el.textContent;
      var frame = null;
      el.addEventListener('mouseenter', function () {
        var i = 0;
        var total = 14;
        cancelAnimationFrame(frame);
        (function tick() {
          i++;
          el.textContent = original.split('').map(function (ch, idx) {
            if (ch === ' ') return ch;
            var reveal = (idx / original.length) * total * 0.72;
            return i > reveal + 3 ? ch : CHARS[Math.floor(Math.random() * CHARS.length)];
          }).join('');
          if (i < total) { frame = requestAnimationFrame(tick); }
          else { el.textContent = original; }
        })();
      });
      el.addEventListener('mouseleave', function () {
        cancelAnimationFrame(frame);
        el.textContent = original;
      });
    });
  }

  /* ── Refresh nach Laden aller Medien ───────────────────────── */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();


/* ═══════════════════════════════════════════════════════════════
   codeschliff — Kontaktformular

   Bewusst eine eigene Einheit: fällt die Bewegungsschicht aus
   (GSAP/Lenis laden nicht), muss das Formular trotzdem tragen.

   Zur Zustellung: eine statische Seite hat kein Backend, und ein
   Browser kann kein SMTP sprechen. Zugangsdaten zu einem Postfach
   dürfen niemals in den Quelltext — dieses Repo ist öffentlich.
   Es bleiben zwei ehrliche Wege:

     CONTACT.endpoint gesetzt → POST an den eigenen Endpunkt.
                                Fertige Vorlage: tools/contact-worker.js
     CONTACT.endpoint leer    → das Mailprogramm des Absenders
                                übernimmt. Kein Dritter beteiligt.

   Regel in beiden Fällen: keine Erfolgsmeldung ohne Versand.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var CONTACT = {
    // Adresse, die die Anfrage entgegennimmt und als E-Mail zustellt.
    // Es passt beides — eintragen und fertig, am Rest ändert sich nichts:
    //   eigener Worker  →  'https://codeschliff-kontakt.<konto>.workers.dev'
    //                      (Vorlage: tools/contact-worker.js)
    //   Formspree       →  'https://formspree.io/f/<formular-id>'
    // Solange das Feld leer ist, übernimmt das Mailprogramm des Absenders.
    endpoint: '',
    mail: 'andrew.banoub@codeschliff.de'
  };

  var form = document.getElementById('kontaktForm');
  if (!form) return;

  var msgBox = document.getElementById('formMessage');
  var submitBtn = document.getElementById('formSubmit');
  var fallback = document.getElementById('formFallback');
  var fallbackText = document.getElementById('formFallbackText');
  var copyBtn = document.getElementById('formCopy');
  var trap = form.querySelector('#fWebsite');
  var touched = {};

  function fields() {
    return Array.prototype.slice.call(form.querySelectorAll('#fName, #fMail, #fMsg, #fDsgvo'));
  }

  /* ── Prüfung ──────────────────────────────────────────────── */
  function fieldError(input) {
    if (input.id === 'fName' && !input.value.trim()) return 'Bitte ausfüllen.';
    if (input.id === 'fMail') {
      if (!input.value.trim()) return 'Bitte ausfüllen.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) return 'Bitte prüfen Sie Ihre E-Mail-Adresse.';
    }
    if (input.id === 'fMsg' && !input.value.trim()) return 'Bitte ausfüllen.';
    if (input.id === 'fDsgvo' && !input.checked) return 'Bitte bestätigen Sie die Datenschutzerklärung.';
    return '';
  }

  function showError(input) {
    var err = fieldError(input);
    var box = form.querySelector('[data-error-for="' + input.id + '"]');
    if (!box) return !err;
    box.textContent = err;
    box.classList.toggle('is-visible', !!err);
    input.setAttribute('aria-invalid', err ? 'true' : 'false');
    if (input.classList.contains('form__input')) {
      input.classList.toggle('has-error', !!err);
    }
    return !err;
  }

  fields().forEach(function (input) {
    // Erst beim Verlassen prüfen, danach live (Brand Kit, Kapitel Formulare)
    input.addEventListener('blur', function () { touched[input.id] = true; showError(input); });
    input.addEventListener('input', function () { if (touched[input.id]) showError(input); });
    input.addEventListener('change', function () { if (touched[input.id]) showError(input); });
  });

  /* ── Nachricht zusammensetzen ─────────────────────────────── */
  function collect() {
    var type = form.querySelector('input[name="projectType"]:checked');
    return {
      name: form.querySelector('#fName').value.trim(),
      email: form.querySelector('#fMail').value.trim(),
      projectType: type ? type.value : '',
      message: form.querySelector('#fMsg').value.trim(),
      website: trap ? trap.value : ''
    };
  }

  function subjectFor(d) {
    return 'Projektanfrage' + (d.projectType ? ' · ' + d.projectType : '') + ' — ' + d.name;
  }

  function bodyFor(d) {
    return 'Name: ' + d.name + '\n' +
           'E-Mail: ' + d.email + '\n' +
           'Projekttyp: ' + (d.projectType || '—') + '\n\n' +
           'Nachricht:\n' + d.message + '\n\n' +
           '—\nGesendet über das Kontaktformular auf codeschliff.de';
  }

  function setMessage(kind, text) {
    msgBox.className = 'form__message' + (kind ? ' is-' + kind : '');
    msgBox.textContent = text;
  }

  function busy(on) {
    submitBtn.disabled = on;
    submitBtn.textContent = on ? 'Wird gesendet …' : 'Anfrage senden';
  }

  /* ── Rückfallebene: Text zum Kopieren ─────────────────────── */
  function showFallback(d) {
    if (!fallback || !fallbackText) return;
    fallbackText.value = 'An: ' + CONTACT.mail + '\n' +
                         'Betreff: ' + subjectFor(d) + '\n\n' + bodyFor(d);
    fallback.hidden = false;
  }

  function hideFallback() {
    if (fallback) fallback.hidden = true;
  }

  if (copyBtn && fallbackText) {
    copyBtn.addEventListener('click', function () {
      function markCopied() {
        copyBtn.textContent = 'Kopiert';
        window.setTimeout(function () { copyBtn.textContent = 'Text kopieren'; }, 2000);
      }
      function selectInstead() {
        fallbackText.focus();
        fallbackText.select();
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fallbackText.value).then(markCopied, selectInstead);
      } else {
        selectInstead();
      }
    });
  }

  /* ── Versandwege ──────────────────────────────────────────── */
  function sendViaEndpoint(d) {
    busy(true);
    setMessage('', '');
    // 'Accept: application/json' ist der Unterschied zwischen einer
    // sauberen Antwort und einer Weiterleitung auf eine fremde Dankeseite.
    window.fetch(CONTACT.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(d)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      busy(false);
      hideFallback();
      setMessage('success', 'Anfrage gesendet. Wir melden uns innerhalb eines Werktags.');
      form.reset();
      touched = {};
      fields().forEach(function (i) { i.removeAttribute('aria-invalid'); });
    }).catch(function () {
      busy(false);
      setMessage('error', 'Die Übermittlung hat nicht geklappt. Bitte senden Sie uns den Text unten direkt an ' + CONTACT.mail + ' — oder versuchen Sie es noch einmal.');
      showFallback(d);
    });
  }

  function sendViaMailClient(d) {
    var href = 'mailto:' + CONTACT.mail +
               '?subject=' + encodeURIComponent(subjectFor(d)) +
               '&body=' + encodeURIComponent(bodyFor(d));
    // Der Text zum Kopieren steht immer bereit: ob sich ein Mailprogramm
    // öffnet, lässt sich technisch nicht zurückmelden.
    showFallback(d);
    if (href.length > 1900) {
      setMessage('info', 'Ihre Nachricht ist zu lang für die automatische Übergabe an das Mailprogramm. Bitte kopieren Sie den Text unten und senden Sie ihn an ' + CONTACT.mail + '.');
      return;
    }
    setMessage('info', 'Ihr Mailprogramm öffnet sich mit der fertigen Nachricht — bitte dort noch auf Senden klicken. Öffnet sich nichts, nutzen Sie den Text unten.');
    window.location.href = href;
  }

  /* ── Absenden ─────────────────────────────────────────────── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Honigtopf: von Menschen nicht sichtbar, von Robotern gern ausgefüllt.
    if (trap && trap.value) return;

    var ok = true;
    fields().forEach(function (i) {
      touched[i.id] = true;
      if (!showError(i)) ok = false;
    });

    if (!ok) {
      hideFallback();
      setMessage('error', 'Bitte prüfen Sie die markierten Felder.');
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }

    var data = collect();
    if (CONTACT.endpoint) { sendViaEndpoint(data); }
    else { sendViaMailClient(data); }
  });
})();

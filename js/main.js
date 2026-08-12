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

  var EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
  var GS_EASE = CustomEaseFallback();
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function CustomEaseFallback() {
    // GSAP-Äquivalent des Marken-Easings
    return 'power2.out';
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ── Lenis Smooth Scroll ───────────────────────────────────── */
  var lenis = null;
  if (!reduced) {
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

  function splitWords(el) {
    var text = el.textContent;
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(' ').map(function (w) {
      return '<span class="word" aria-hidden="true">' + w + '</span>';
    }).join(' ');
    return Array.prototype.slice.call(el.querySelectorAll('.word'));
  }

  /* ── Preloader + Intro ─────────────────────────────────────── */
  var preloader = document.getElementById('preloader');
  var heroLines = Array.prototype.slice.call(document.querySelectorAll('.hero__line-inner'));
  var heroRevealEls = Array.prototype.slice.call(document.querySelectorAll('.hero [data-reveal]'));
  var panel = document.getElementById('heroPanel');
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
      .fromTo(panelRows,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.24, stagger: 0.06, clearProps: 'all' }, 0.75);
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
    var seen = sessionStorage.getItem('cs-intro');
    var count = { v: 0 };

    var pre = gsap.timeline({
      defaults: { ease: GS_EASE },
      onComplete: function () {
        sessionStorage.setItem('cs-intro', '1');
        document.body.classList.remove('is-locked');
        preloader.classList.add('is-done');
        gsap.to(preloader, {
          clipPath: 'inset(0 0 100% 0)',
          duration: 0.6,
          ease: 'power3.inOut',
          onComplete: function () { preloader.remove(); ScrollTrigger.refresh(); }
        });
        introTimeline();
      }
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

    window.addEventListener('mousemove', function (e) {
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
      var t = e.target.closest('[data-cursor]');
      cursor.className = 'cursor';
      if (t) {
        var kind = t.getAttribute('data-cursor');
        cursor.classList.add('is-' + kind);
        var label = t.getAttribute('data-cursor-label') ||
          (kind === 'video' ? 'ansehen' : kind === 'card' ? 'Vorschau' : '');
        cursorLabel.textContent = label;
      }
    }, { passive: true });
    window.addEventListener('mousedown', function () { cursor.classList.add('is-pressed'); });
    window.addEventListener('mouseup', function () { cursor.classList.remove('is-pressed'); });
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
  if (finePointer && !reduced && panel) {
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

  /* ── Manifest: Maske öffnet sich, Worte glühen auf ─────────── */
  var manifestClip = document.getElementById('manifestClip');
  var statement = document.getElementById('manifestStatement');
  if (manifestClip && statement) {
    var words = splitWords(statement);
    if (!reduced) {
      gsap.fromTo(manifestClip,
        { clipPath: 'inset(9% 7% 9% 7%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          ease: 'none',
          scrollTrigger: {
            trigger: manifestClip,
            start: 'top 96%',
            end: 'top 12%',
            scrub: 0.6
          }
        });
      gsap.fromTo(manifestClip.querySelector('.manifest__video'),
        { scale: 1.18 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: manifestClip,
            start: 'top bottom',
            end: 'top top',
            scrub: 0.6
          }
        });
      gsap.to(words, {
        opacity: 1,
        stagger: 0.35,
        ease: 'none',
        scrollTrigger: {
          trigger: statement,
          start: 'top 78%',
          end: 'top 30%',
          scrub: 0.4
        }
      });
    } else {
      words.forEach(function (w) { w.style.opacity = 1; });
    }
  }

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
    // Werkstatt-Kacheln: Kaskade
    gsap.fromTo('.werkstatt__item',
      { opacity: 0, y: 22 },
      {
        opacity: 1, y: 0, duration: 0.5, stagger: 0.09, ease: GS_EASE,
        scrollTrigger: { trigger: '.werkstatt__grid', start: 'top 82%', once: true }
      });
    // Leistungs-Spalten: Kaskade
    gsap.fromTo('.leistung',
      { opacity: 0, y: 16 },
      {
        opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: GS_EASE,
        scrollTrigger: { trigger: '.leistungen__grid', start: 'top 84%', once: true }
      });
  } else {
    gsap.set('.werkstatt__item, .leistung', { opacity: 1 });
  }

  /* ── Videos: nur im Viewport abspielen ─────────────────────── */
  var ambientVideos = Array.prototype.slice.call(
    document.querySelectorAll('video[autoplay], video[data-ambient-video]'));
  var visibleVideos = new Set();
  var vidObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var v = entry.target;
      if (entry.isIntersecting) {
        visibleVideos.add(v);
        if (!reduced) { var p = v.play(); if (p) p.catch(function () {}); }
      } else {
        visibleVideos.delete(v);
        v.pause();
      }
    });
  }, { rootMargin: '120px' });
  ambientVideos.forEach(function (v) {
    if (reduced) { v.removeAttribute('autoplay'); v.pause(); }
    vidObserver.observe(v);
  });
  // Nach Tab-Wechsel o. Ä. sichtbare Videos wieder anstoßen
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && !reduced) {
      visibleVideos.forEach(function (v) { var p = v.play(); if (p) p.catch(function () {}); });
    }
  });

  /* ── Werkstatt: Hover-Videos + Kartenneigung ───────────────── */
  Array.prototype.forEach.call(document.querySelectorAll('.werkstatt__item'), function (item) {
    var video = item.querySelector('video');
    function start() { if (!reduced) { var p = video.play(); if (p) p.catch(function () {}); } }
    function stop() { if (!item.matches(':hover')) video.pause(); }
    item.addEventListener('mouseenter', start);
    item.addEventListener('mouseleave', stop);
    item.addEventListener('focus', start);
    item.addEventListener('blur', stop);

    if (finePointer && !reduced) {
      var media = item.querySelector('.werkstatt__media');
      var rx = gsap.quickTo(media, 'rotationX', { duration: 0.5, ease: 'power2.out' });
      var ry = gsap.quickTo(media, 'rotationY', { duration: 0.5, ease: 'power2.out' });
      item.addEventListener('mousemove', function (e) {
        var r = media.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 5);
        rx(((e.clientY - r.top) / r.height - 0.5) * -5);
      });
      item.addEventListener('mouseleave', function () { rx(0); ry(0); });
    }
  });
  // Ohne Hover (Touch): Werkstatt-Videos laufen im Viewport
  if (!finePointer && !reduced) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-hover-video]'), function (v) {
      vidObserver.observe(v);
    });
  }

  /* ── Leistungen: schwebende Vorschau folgt der Maus ────────── */
  var grid = document.getElementById('leistungenGrid');
  var preview = document.getElementById('preview');
  if (finePointer && !reduced && grid && preview) {
    var previewVideo = document.getElementById('previewVideo');
    var pX = gsap.quickTo(preview, 'x', { duration: 0.45, ease: 'power3.out' });
    var pY = gsap.quickTo(preview, 'y', { duration: 0.45, ease: 'power3.out' });
    var visible = false;

    grid.addEventListener('mousemove', function (e) {
      pX(e.clientX + 26);
      pY(e.clientY - 190);
      var col = e.target.closest('[data-preview]');
      if (col) {
        var src = col.getAttribute('data-preview');
        if (previewVideo.getAttribute('src') !== src) {
          previewVideo.setAttribute('src', src);
          var p = previewVideo.play(); if (p) p.catch(function () {});
        }
        if (!visible) {
          visible = true;
          gsap.to(preview, { opacity: 1, scale: 1, duration: 0.32, ease: GS_EASE });
          var pl = previewVideo.play(); if (pl) pl.catch(function () {});
        }
      }
    });
    grid.addEventListener('mouseleave', function () {
      visible = false;
      gsap.to(preview, { opacity: 0, scale: 0.82, duration: 0.28, ease: GS_EASE });
      previewVideo.pause();
    });
  }

  /* ── Zahlen: Aufwärtszähler ────────────────────────────────── */
  Array.prototype.forEach.call(document.querySelectorAll('[data-count]'), function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (reduced) { el.textContent = target; return; }
    var obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 86%',
      once: true,
      onEnter: function () {
        gsap.to(obj, {
          v: target,
          duration: 1.4,
          ease: 'power3.out',
          onUpdate: function () { el.textContent = Math.round(obj.v); }
        });
      }
    });
  });

  /* ── Prozess: gepinnter Horizontal-Lauf (nur Desktop) ──────── */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', function () {
    var track = document.getElementById('prozessTrack');
    var bar = document.getElementById('prozessBar');
    if (!track || !bar) return;
    function amount() { return Math.max(0, track.scrollWidth - window.innerWidth); }
    var tween = gsap.to(track, {
      x: function () { return -amount(); },
      ease: 'none',
      scrollTrigger: {
        trigger: '#prozess',
        start: 'top top',
        end: function () { return '+=' + (amount() + window.innerHeight * 0.35); },
        scrub: 0.7,
        pin: '#prozessPin',
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: function (self) {
          bar.style.transform = 'scaleX(' + self.progress + ')';
        }
      }
    });
    return function () { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); };
  });

  /* ── Studio: Parallaxe im Medienrahmen ─────────────────────── */
  if (!reduced) {
    var pm = document.querySelector('[data-parallax-media] video');
    if (pm) {
      gsap.fromTo(pm, { yPercent: -8 }, {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-parallax-media]',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.5
        }
      });
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

  /* ── Kontaktformular ───────────────────────────────────────── */
  var form = document.getElementById('kontaktForm');
  if (form) {
    var msgBox = document.getElementById('formMessage');
    var submitBtn = document.getElementById('formSubmit');
    var touched = {};

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
      if (input.classList.contains('form__input')) {
        input.classList.toggle('has-error', !!err);
      }
      return !err;
    }

    Array.prototype.forEach.call(form.querySelectorAll('#fName, #fMail, #fMsg, #fDsgvo'), function (input) {
      // Erst beim Verlassen prüfen, danach live (Brand Kit, Kapitel Formulare)
      input.addEventListener('blur', function () { touched[input.id] = true; showError(input); });
      input.addEventListener('input', function () { if (touched[input.id]) showError(input); });
      input.addEventListener('change', function () { if (touched[input.id]) showError(input); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var inputs = Array.prototype.slice.call(form.querySelectorAll('#fName, #fMail, #fMsg, #fDsgvo'));
      var ok = true;
      inputs.forEach(function (i) { touched[i.id] = true; if (!showError(i)) ok = false; });
      msgBox.className = 'form__message';
      if (!ok) {
        msgBox.classList.add('is-error');
        msgBox.textContent = 'Bitte prüfen Sie die markierten Felder.';
        return;
      }
      // Versand: Endpunkt eigener Wahl (siehe Handoff) — hier simuliert,
      // bis ein Backend/Formular-Dienst angebunden ist.
      submitBtn.disabled = true;
      submitBtn.textContent = 'Wird gesendet …';
      window.setTimeout(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Anfrage senden';
        msgBox.classList.add('is-success');
        msgBox.textContent = 'Anfrage gesendet. Wir melden uns innerhalb eines Werktags.';
        form.reset();
        touched = {};
      }, 900);
    });
  }

  /* ── Refresh nach Laden aller Medien ───────────────────────── */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();

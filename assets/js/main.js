/* ==========================================================================
   QAWAREER ACADEMY — Interactions
   Vanilla JS, no dependencies. Everything degrades gracefully.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     0. CONFIG FALLBACK
     If config.js failed to load, fall back to these values so the
     site never shows empty contact links.
     ------------------------------------------------------------------ */
  var CFG = window.SITE || {
    name: 'أكاديمية قوارير',
    phoneDisplay: '01130830390',
    whatsapp: '201130830390',
    email: 'QawarirAcademy@gmail.com',
    telegram: 'QawareerAcademy',
    instagram: 'Qawareer.Academy'
  };

  /* Shorthands */
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==================================================================
     1. THEME (dark mode) — persisted in localStorage
     ================================================================== */
  (function theme() {
    var KEY = 'qwr-theme';
    var root = document.documentElement;
    var btn = $('[data-theme-toggle]');

    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}

    /* If the site was published with a forced light/dark mode, respect the
       server-baked attribute and ignore the visitor's saved choice. */
    var forced = root.getAttribute('data-theme-forced');
    if (forced === 'dark') root.setAttribute('data-theme', 'dark');
    if (forced === 'light') root.removeAttribute('data-theme');

    if (saved === 'dark' && !forced) root.setAttribute('data-theme', 'dark');
    if (saved === 'light' && !forced) root.removeAttribute('data-theme');

    if (!btn) return;
    if (forced) { btn.style.display = 'none'; return; }

    btn.addEventListener('click', function () {
      var isDark = root.getAttribute('data-theme') === 'dark';
      if (isDark) {
        root.removeAttribute('data-theme');
        try { localStorage.setItem(KEY, 'light'); } catch (e) {}
      } else {
        root.setAttribute('data-theme', 'dark');
        try { localStorage.setItem(KEY, 'dark'); } catch (e) {}
      }
    });
  })();

  /* ==================================================================
     2. HEADER — add .is-stuck when scrolled
     ================================================================== */
  (function stickyHeader() {
    var header = $('.header');
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle('is-stuck', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  /* ==================================================================
     3. MOBILE DRAWER
     ================================================================== */
  (function drawer() {
    var drawer = $('.drawer');
    var burger = $('.burger');
    var close  = $('.drawer__close');
    if (!drawer || !burger) return;

    function open() {
      drawer.classList.add('is-open');
      burger.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('is-locked');
    }
    function shut() {
      drawer.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');
    }

    burger.addEventListener('click', function () {
      drawer.classList.contains('is-open') ? shut() : open();
    });
    if (close) close.addEventListener('click', shut);

    $$('.drawer__overlay, .drawer__nav a').forEach(function (el) {
      el.addEventListener('click', shut);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) shut();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) shut();
    });
  })();

  /* ==================================================================
     4. READING PROGRESS BAR
     ================================================================== */
  (function progress() {
    var bar = $('.progress__bar');
    if (!bar) return;

    var ticking = false;
    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* ==================================================================
     4b. SITE SEARCH

     Lives on the 404 page, where a visitor has just hit a dead end. The index
     is a JSON blob written into the page by render.js at publish time, so this
     works with no server and no network round trip.

     Arabic is folded before comparing (see render.js `fold`), because the
     common spelling variants -- أ/إ/آ, ة/ه, ى/ي -- would otherwise each miss.
     Scoring puts title matches above body matches so the thing you asked for by
     name comes first, and every word has to appear somewhere, which keeps a
     two-letter query from returning the whole site.
     ================================================================== */
  (function search() {
    var form = $('[data-search]');
    var box  = $('[data-search-input]');
    var out  = $('[data-search-results]');
    var note = $('[data-search-note]');
    if (!form || !box || !out) return;

    /* Arabic typing has a handful of interchangeable forms and people mix them
       freely: أ/إ/آ, ة/ه, ى/ي, ؤ/ء, plus stray tatweel and harakat. Folding both
       sides once means "الاجراءات" still finds "الإجراءات" -- without this the
       search looks broken to anyone typing on a phone. */
    function fold(s) {
      return String(s == null ? '' : s)
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/[ىی]/g, 'ي')
        .replace(/[ؤئ]/g, 'ء')
        .replace(/ـ/g, '')
        .replace(/[ً-ٰٟ]/g, '')
        .toLowerCase();
    }

    var raw = $('#qwr-search-index');
    if (!raw) return;

    /* The region markers live inside the <script>, and a <script> with a
       non-JS type is raw text -- the browser hands them over verbatim rather
       than treating them as comments. Strip them before parsing, otherwise the
       JSON never loads and the search looks dead for no visible reason. */
    var txt = raw.textContent.replace(/<!--[\s\S]*?-->/g, '').trim();

    var items = [];
    if (txt) {
      try {
        items = JSON.parse(txt) || [];
      } catch (e) {
        items = [];                 // a broken index must not break the page
      }
    }

    /* folded once, up front -- the visitor types, not the index */
    var index = items.map(function (it) {
      return {
        t: it.t,
        u: it.u,
        d: it.d || '',
        g: it.g || '',
        ft: fold(it.t),
        fd: fold(it.d),
        fk: fold(it.k)
      };
    });

    var AR = {
      empty:  'اكتبي كلمة أو اتنين فوق، وأنا أدوّرلك في الموقع كله.',
      none:   'مفيش حاجة بالاسم ده. جرّبي كلمة تانية، أو اكتبي لنا على واتساب.',
      found:  'نتيجة',
      label:  'النتايج:'
    };

    function esc2(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function run(q) {
      var terms = fold(q).split(/\s+/).filter(function (t) { return t.length > 1; });
      if (!terms.length) {
        out.innerHTML = '';
        if (note) note.textContent = AR.empty;
        return;
      }

      var hits = [];
      index.forEach(function (it) {
        var score = 0;
        var ok = true;
        for (var i = 0; i < terms.length; i++) {
          var w = terms[i];
          var inT = it.ft.indexOf(w) !== -1;
          var inK = it.fk.indexOf(w) !== -1;
          var inD = it.fd.indexOf(w) !== -1;
          if (!inT && !inK && !inD) { ok = false; break; }
          if (inT) score += 10;
          if (inK) score += 5;
          if (inD) score += 2;
        }
        if (ok) hits.push({ it: it, score: score });
      });

      hits.sort(function (a, b) { return b.score - a.score; });
      hits = hits.slice(0, 12);

      if (!hits.length) {
        out.innerHTML = '';
        if (note) note.textContent = AR.none;
        return;
      }

      if (note) {
        note.textContent = hits.length + ' ' + AR.found + ' — ' + AR.label;
      }
      out.innerHTML = hits.map(function (h) {
        return '<li class="sr__item"><a class="sr__link" href="' + esc2(h.it.u) + '">' +
          '<span class="sr__badge">' + esc2(h.it.g) + '</span>' +
          '<span class="sr__t">' + esc2(h.it.t) + '</span>' +
          (h.it.d ? '<span class="sr__d">' + esc2(h.it.d) + '</span>' : '') +
          '</a></li>';
      }).join('');
    }

    var timer = null;
    box.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { run(box.value); }, 140);
    });

    /* submit works without JS timing games, and Enter always lands here */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearTimeout(timer);
      run(box.value);
    });

    /* deep link: 404.html?q=الأسعار */
    try {
      var pre = new URLSearchParams(location.search).get('q');
      if (pre) { box.value = pre; run(pre); }
    } catch (e) { /* older browser: no deep link, typing still works */ }
  })();

  /* ==================================================================
     4c. VIDEO FACADE

     The homepage shows a poster and a play button instead of a live YouTube
     embed, and this builds the real player on the first click. A live embed
     cost 1042 KB before the visitor had even scrolled to it.

     autoplay=1 because the visitor just asked for the video; without it
     YouTube shows its own click-to-play poster over ours, which is two clicks
     for one intent.

     The noscript case needs no help: without JS the facade is a button that
     does nothing, so it is hidden by the .no-js rule in the stylesheet and the
     real embed is what the visitor gets. */
  (function videoFacade() {
    var btns = $$('.video__facade');
    if (!btns.length) return;

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-video-id');
        if (!id) return;

        var frame = document.createElement('iframe');
        frame.src = 'https://www.youtube-nocookie.com/embed/' + id +
                    '?autoplay=1&rel=0';
        frame.title = btn.getAttribute('data-video-title') || 'فيديو';
        frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        frame.allowFullscreen = true;
        frame.className = 'video__embed';

        /* swap in place, keeping the poster's box so nothing shifts */
        btn.parentNode.replaceChild(frame, btn);
      });
    });
  })();

  /* ==================================================================
     5. REVEAL ON SCROLL
     ================================================================== */
  (function reveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ==================================================================
     6. COUNTERS — animate numbers when visible
     ================================================================== */
  (function counters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var dur = 1500;

      if (reduceMotion) { el.textContent = target + suffix; return; }

      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        // easeOutExpo
        var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.5 });

    nums.forEach(function (el) { io.observe(el); });
  })();

  /* ==================================================================
     7. BACK TO TOP
     ================================================================== */
  (function backTop() {
    var btn = $('.floater--top');
    if (!btn) return;

    var ticking = false;
    function update() {
      btn.classList.toggle('is-visible', window.scrollY > 500);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    update();
  })();

  /* ==================================================================
     7b. BACK TO BOTTOM
     ================================================================== */
  (function backBottom() {
    var btn = $('.floater--bottom');
    if (!btn) return;

    var ticking = false;
    function update() {
      var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      // Show when not at bottom (within 100px threshold)
      btn.classList.toggle('is-visible', window.scrollY < maxScroll - 100);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    btn.addEventListener('click', function () {
      var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: maxScroll, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    update();
  })();

  /* ==================================================================
     8. SMOOTH ANCHORS (respect reduced motion + header offset)
     ================================================================== */
  (function smoothAnchors() {
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (!href || href === '#') return;

        var id = href.slice(1);
        var target = document.getElementById(id);
        if (!target) return;

        e.preventDefault();

        var headerH = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10
        ) || 74;
        var offset = headerH + 18;
        var top = target.getBoundingClientRect().top + window.scrollY - offset;

        // Clamp so we never try to scroll past the document end — some
        // browsers silently ignore a scrollTo beyond maxScroll.
        var max = document.documentElement.scrollHeight - window.innerHeight;
        top = Math.max(0, Math.min(top, max));

        if (reduceMotion || !('scrollBehavior' in document.documentElement.style)) {
          window.scrollTo(0, top);
        } else {
          window.scrollTo({ top: top, left: 0, behavior: 'smooth' });
        }

        history.replaceState(null, '', '#' + id);

        // move keyboard focus for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  })();

  /* ==================================================================
     9. FAQ — allow only one open at a time (optional, per group)
     ================================================================== */
  (function faq() {
    var groups = $$('[data-faq-group]');
    groups.forEach(function (group) {
      var items = $$('details', group);
      items.forEach(function (d) {
        d.addEventListener('toggle', function () {
          if (!d.open) return;
          items.forEach(function (other) { if (other !== d) other.open = false; });
        });
      });
    });
  })();

  /* ==================================================================
     9b. TESTIMONIAL SLIDER (homepage)

     A scroll-snap carousel with autoplay. Notes on the approach:

       - The HTML already contains every review. This code only moves the
         scroll position, so a crawler (or a JS-less browser) still reads the
         full text. `.is-slid` is added only once we take over.
       - Autoplay stops on hover, on focus, when the tab is hidden, and when
         the user prefers reduced motion. A rotating carousel that keeps
         moving while someone is trying to read it is worse than no carousel.
       - Touch swipe is native: the track is a scroll container, so we only
         report the resulting index.
     ================================================================== */
  (function slider() {
    var root = $('[data-slider]');
    if (!root) return;

    var view   = $('.slider__view', root);
    var track  = $('.slider__track', root);

    /* Random selection: the owner can have the homepage slider
       show a random subset of the reviews, so every visit feels
       fresh. This runs before the slider reads the DOM, so the
       slides, dots and the status region all describe the
       chosen set. The full list stays in the HTML for Google. */
    if (track && root.getAttribute('data-reviews-shuffle') === '1') {
      var keep = parseInt(root.getAttribute('data-reviews-count'), 10) || 3;
      var pool = $$('.slider__slide', root);
      if (keep > 0 && pool.length > keep) {
        /* Fisher–Yates shuffle */
        var order = pool.slice();
        for (var si = order.length - 1; si > 0; si--) {
          var sj = Math.floor(Math.random() * (si + 1));
          var tmp = order[si]; order[si] = order[sj]; order[sj] = tmp;
        }
        var chosen = order.slice(0, keep);
        /* re-appending moves the nodes, so the track ends up
           holding exactly the chosen slides, in shuffled order */
        chosen.forEach(function (s) { track.appendChild(s); });
        pool.forEach(function (s) {
          if (chosen.indexOf(s) === -1 && s.parentNode) {
            s.parentNode.removeChild(s);
          }
        });
        /* dot n pairs with slide n — trim the extras */
        $$('.slider__dot', root).forEach(function (d, n) {
          if (n >= keep && d.parentNode) d.parentNode.removeChild(d);
        });
        $$('.slider__slide', root).forEach(function (s, n) {
          s.setAttribute('aria-label', (n + 1) + ' من ' + keep);
        });
      }
    }

    var slides = $$('.slider__slide', root);
    if (!view || !track || slides.length < 2) return;

    var prevBtn = $('[data-prev]', root);
    var nextBtn = $('[data-next]', root);
    var dots    = $$('.slider__dot', root);
    var status  = $('.slider__status', root);
    var fill    = $('.slider__barfill', root);

    var auto   = root.getAttribute('data-auto') !== '0';
    var speed  = parseInt(root.getAttribute('data-speed'), 10) || 6500;
    var showNav = root.getAttribute('data-nav') !== '0';

    // honour the OS setting: no motion, no autoplay
    if (reduceMotion) auto = false;

    // the owner can turn the arrows and dots off from content.js
    if (!showNav && $('.slider__navrow', root)) {
      $('.slider__navrow', root).style.display = 'none';
    }

    var index = 0;
    var timer = null;
    var barTick = null;
    var startedAt = 0;

    root.classList.add('is-slid');

    /* ---------- geometry ---------- */
    function step() {
      var gap = parseFloat(getComputedStyle(track).gap) || 0;
      return slides[0].getBoundingClientRect().width + gap;
    }
    // scrollLeft is negative in RTL on some engines and inverted on others;
    // compute the index from the position instead of trusting the sign.
    function currentIndex() {
      var x = Math.abs(view.scrollLeft);
      var per = step();
      if (!per) return 0;
      var i = Math.round(x / per);
      return Math.max(0, Math.min(slides.length - 1, i));
    }

    function goTo(i, silent) {
      index = Math.max(0, Math.min(slides.length - 1, i));
      var per = step();

      // RTL scroll ranges differ between engines: Chrome/Firefox start at 0 and
      // go negative, older engines use a positive range. Detect once from the
      // live values instead of sniffing the user agent.
      var target = -index * per;
      if (view.scrollLeft > 0) target = index * per;

      /* A smooth scroll never runs while the tab is hidden, so the slide would
         simply not move. Note that 'auto' means "defer to the CSS", which is
         smooth here — the value that jumps is 'instant'. */
      var smooth = !reduceMotion && !document.hidden;
      try {
        view.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'instant' });
      } catch (e) {
        // older engines without the options object
        var prev = view.style.scrollBehavior;
        view.style.scrollBehavior = smooth ? 'smooth' : 'auto';
        view.scrollLeft = target;
        view.style.scrollBehavior = prev;
      }

      dots.forEach(function (d, n) {
        d.classList.toggle('is-on', n === index);
        if (n === index) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      if (prevBtn) prevBtn.disabled = (index === 0);
      if (nextBtn) nextBtn.disabled = (index === slides.length - 1);

      if (!silent && status) {
        var name = (slides[index].querySelector('.review__name') || {}).textContent;
        status.textContent = 'الرأي ' + (index + 1) + ' من ' + slides.length +
          (name ? ' — ' + name.trim() : '');
      }
      restartTimer();
    }

    /* ---------- the progress hairline ----------
       Driven by a timer, not requestAnimationFrame: rAF is paused while the
       tab is hidden, which would freeze the bar and make it disagree with
       the slide that actually changes. */
    function runBar() {
      if (barTick) { clearInterval(barTick); barTick = null; }
      if (!fill || reduceMotion || !auto) {
        if (fill) fill.style.transform = 'scaleX(0)';
        return;
      }
      startedAt = Date.now();
      barTick = setInterval(function () {
        var p = (Date.now() - startedAt) / speed;
        if (p >= 1) return;
        fill.style.transform = 'scaleX(' + p + ')';
      }, 60);
    }

    /* ---------- autoplay ---------- */
    function restartTimer() {
      stopTimer();
      if (!auto) return;
      runBar();
      timer = setInterval(function () {
        goTo(index >= slides.length - 1 ? 0 : index + 1);
      }, speed);
    }
    function stopTimer() {
      if (timer) { clearInterval(timer); timer = null; }
      if (barTick) { clearInterval(barTick); barTick = null; }
      if (fill) fill.style.transform = 'scaleX(0)';
    }

    /* ---------- controls ---------- */
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(index + 1); });
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(index - 1); });
    dots.forEach(function (d, n) {
      d.addEventListener('click', function () { goTo(n); });
    });

    // keyboard on the viewport
    view.addEventListener('keydown', function (e) {
      var k = e.key;
      // RTL: ArrowLeft is "forward" for the reader, ArrowRight is "back"
      if (k === 'ArrowLeft')  { e.preventDefault(); goTo(index + 1); }
      else if (k === 'ArrowRight') { e.preventDefault(); goTo(index - 1); }
      else if (k === 'Home')  { e.preventDefault(); goTo(0); }
      else if (k === 'End')   { e.preventDefault(); goTo(slides.length - 1); }
    });

    /* ---------- pause on intent ---------- */
    root.addEventListener('mouseenter', stopTimer);
    root.addEventListener('mouseleave', function () {
      // don't resume if the keyboard is inside the widget
      if (root.contains(document.activeElement)) return;
      restartTimer();
    });
    root.addEventListener('focusin', stopTimer);
    root.addEventListener('focusout', function (e) {
      if (root.contains(e.relatedTarget)) return;
      if (root.matches(':hover')) return;
      restartTimer();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopTimer();
      else restartTimer();
    });

    /* ---------- touch swipe for mobile ---------- */
    var touchStartX = 0;
    var touchStartTime = 0;
    view.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      touchStartTime = Date.now();
    }, { passive: true });
    view.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dt = Date.now() - touchStartTime;
      // Swipe threshold: 50px horizontal, less than 300ms, and more horizontal than vertical
      if (Math.abs(dx) > 50 && dt < 300) {
        // RTL: swipe left (negative dx) = next, swipe right (positive dx) = prev
        if (dx < 0) goTo(index + 1);
        else goTo(index - 1);
      }
    }, { passive: true });

    /* ---------- a manual swipe updates the dots ---------- */
    var scrollEnd = null;
    view.addEventListener('scroll', function () {
      if (scrollEnd) clearTimeout(scrollEnd);
      scrollEnd = setTimeout(function () {
        var i = currentIndex();
        if (i !== index) {
          index = i;
          dots.forEach(function (d, n) { d.classList.toggle('is-on', n === i); });
          if (prevBtn) prevBtn.disabled = (i === 0);
          if (nextBtn) nextBtn.disabled = (i === slides.length - 1);
        }
      }, 90);
    }, { passive: true });

    // a resize changes the per-slide width, so re-seat the current slide
    window.addEventListener('resize', function () { goTo(index, true); });

    /* ---------- go ---------- */
    // layout may not be final on first paint; settle once it is
    goTo(0, true);
    setTimeout(function () { goTo(0, true); restartTimer(); }, 60);
  })();

  /* ==================================================================
     9c. LIGHTBOX for chat screenshots
     A thumbnail of a WhatsApp / Telegram screenshot is unreadable, so
     tapping it opens the full image. Vanilla, no library.
     ================================================================== */
  (function lightbox() {
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'عرض المحادثة');
    box.hidden = true;
    box.innerHTML =
      '<div class="lightbox__backdrop" data-close></div>' +
      '<figure class="lightbox__fig">' +
        '<img class="lightbox__img" alt="">' +
        '<figcaption class="lightbox__cap"></figcaption>' +
      '</figure>' +
      '<button type="button" class="lightbox__x" data-close aria-label="إغلاق">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
        ' stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
      '</button>';
    document.body.appendChild(box);

    var img  = $('.lightbox__img', box);
    var cap  = $('.lightbox__cap', box);
    var last = null;

    function open(src, label) {
      img.src = src;
      img.alt = label || '';
      cap.textContent = label || '';
      box.hidden = false;
      document.body.classList.add('is-locked');
      var x = $('.lightbox__x', box);
      if (x) x.focus();
    }
    function close() {
      if (box.hidden) return;
      box.hidden = true;
      img.src = '';
      document.body.classList.remove('is-locked');
      if (last && last.focus) {
        last.focus();
        last = null;
      }
    }

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest && e.target.closest('[data-shot]');
      if (trigger) {
        e.preventDefault();
        // remember the trigger itself: by the time we close, document
        // .activeElement may already be <body> (some engines do not focus a
        // button on click), and focus has to go back to the shot button
        last = trigger;
        open(trigger.getAttribute('data-shot'),
             trigger.getAttribute('aria-label') || '');
        return;
      }
      if (e.target.closest && e.target.closest('[data-close]')) close();
    });

    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      // keep focus inside the dialog
      if (e.key === 'Tab') {
        var x = $('.lightbox__x', box);
        if (x) { e.preventDefault(); x.focus(); }
      }
    });

    // tapping the image itself also closes (mobile habit)
    img.addEventListener('click', close);
  })();


  /* ==================================================================
     10. NAV — mark active link based on current filename
     ================================================================== */
  (function activeNav() {
    var path = window.location.pathname.split('/').pop() || 'index.html';

    $$('[data-nav] a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href) return;
      var target = href.split('/').pop();
      if (target === path || (path === '' && target === 'index.html')) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
    });
  })();

  /* ==================================================================
     11. WHATSAPP LINKS

     Every wa.me link is built here, from window.SITE.waMessages, which the
     panel writes into config.js at publish time.

     This used to be a <script> block copied verbatim into ten pages. One
     edit meant ten files, and nothing the owner typed into the panel could
     change a message -- the whole point of the control was missing.

     A button names its message with data-wa="key", and may say what it is
     about with data-ctx="..." which fills in {program}:

         <a data-wa="program" data-ctx="قوارير للحفظ المتدرج">

     The greeting is added here, on purpose, rather than being part of the
     editable text. An owner editing a message cannot leave it off by
     forgetting; they only ever edit what comes after it.
     ================================================================== */
  function waText(key, ctx) {
    var M = (window.SITE && window.SITE.waMessages) || {};
    var body = (M[key] || M.general || '').trim();
    if (ctx) body = body.replace(/\{[a-zA-Z]+\}/g, ctx);
    var greeting = (M.greeting || '').trim();
    return greeting ? greeting + '\n' + body : body;
  }

  (function whatsapp() {
    var number = (window.SITE && window.SITE.whatsapp) || CFG.whatsapp;
    var links = $$('[data-wa]');
    if (!links.length) return;

    links.forEach(function (a) {
      var key = a.getAttribute('data-wa') || '';
      a.setAttribute('href', 'https://wa.me/' + number +
        '?text=' + encodeURIComponent(waText(key, a.getAttribute('data-ctx'))));
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    });
  })();

  /* ==================================================================
     11a. CONTACT LINKS + LOCAL CLICK COUNTER

     Telegram, Instagram, email and the phone display all come from
     config.js, and the WhatsApp half lives in the section above.

     These two used to sit in a <script> block copied into ten pages. Anything
     that had to change meant editing all ten, and nothing typed into the panel
     could reach them -- which is how the WhatsApp message ended up frozen in
     the markup while config.js carried a perfectly editable phone number
     twenty lines above it.
     ================================================================== */
  (function contactLinks() {
    var C = window.SITE || {};
    var tg = 'https://t.me/'      + (C.telegram  || 'QawareerAcademy');
    var ig = 'https://instagram.com/' + (C.instagram || 'Qawareer.Academy');
    var ml = 'mailto:'            + (C.email     || 'QawarirAcademy@gmail.com');

    function set(sel, attr, val, blank) {
      $$(sel).forEach(function (a) {
        a.setAttribute(attr, val);
        if (blank) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
      });
    }

    set('[data-tg]',   'href', tg, true);
    set('[data-ig]',   'href', ig, true);
    set('[data-mail]', 'href', ml, false);

    $$('[data-phone]').forEach(function (el) {
      el.textContent = C.phoneDisplay || '01130830390';
    });

    /* ---------- local click counter (works with zero setup) ----------
       Counts outbound WhatsApp taps per page, in this browser only. Useful
       even without Google Analytics: open the console and run qwrStats(). */
    if (C.localStats) {
      var KEY = 'qwr-stats';
      var stats = {};
      try { stats = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
      window.qwrStats = function () {
        console.log('%c إحصائيات الضغط ', 'background:#06683f;color:#caa959;padding:3px 8px;border-radius:4px');
        console.table(stats);
        return stats;
      };
      document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href*="wa.me"]');
        if (!a) return;
        var p = (location.pathname.split('/').pop() || 'index.html');
        stats[p] = (stats[p] || 0) + 1;
        try { localStorage.setItem(KEY, JSON.stringify(stats)); } catch (e) {}
      }, true);
    }
  })();

  /* ==================================================================
     11b. CONTACT FORM → WhatsApp (no backend needed)
     Turns the form into a WhatsApp message so it works on any host.
     ================================================================== */
  (function waForm() {
    var form = $('[data-wa-form]');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name  = (form.elements.name    && form.elements.name.value    || '').trim();
      var phone = (form.elements.phone   && form.elements.phone.value   || '').trim();
      var prog  = (form.elements.program && form.elements.program.value || '').trim();
      var msg   = (form.elements.message && form.elements.message.value || '').trim();

      if (!name) { alert('من فضلكِ اكتبِي اسمكِ'); return; }

      var M = (window.SITE && window.SITE.waMessages) || {};
      var lines = [
        (M.greeting || 'السلام عليكم ورحمة الله وبركاته'),
        'أنا: ' + name,
        phone ? 'رقم التواصل: ' + phone : '',
        prog  ? 'البرنامج المطلوب: ' + prog : '',
        msg   ? 'رسالتي: ' + msg : '',
        '',
        '(via موقع أكاديمية قوارير)'
      ].filter(Boolean);

      var url = 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(lines.join('\n'));
      window.open(url, '_blank', 'noopener');
    });
  })();

  /* ==================================================================
     12. YEAR in footer
     ================================================================== */
  (function year() {
    $$('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  })();

  /* ==================================================================
     13. LOG — one friendly line in console
     ================================================================== */
  if (window.console && console.info) {
    console.info('%c أكاديمية قوارير ', 'background:#06683f;color:#caa959;padding:4px 10px;border-radius:4px;font-weight:700');
  }
})();
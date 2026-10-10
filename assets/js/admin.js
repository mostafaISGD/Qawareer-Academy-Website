/* ==========================================================================
   Qawareer Academy — Admin Panel
   يتعامل مع content.js، ويكتبه من جديد، وينشره على GitHub.

   Data flow:
     1. load content.js  (or the browser's saved copy, if newer)
     2. you edit forms  ->  window.CONTENT is mutated live
     3. save            ->  written back to content.js (blob) + GitHub
     4. render          ->  the marked regions of each page are rebuilt
                           using RENDER.* so the HTML that Google reads
                           always matches what you see.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- tiny helpers ---------- */
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var C  = window.CONTENT;

  /* Settings migration — older content.js files have no `settings` key,
     so add the defaults that match the current site exactly. */
  (function ensureSettings() {
    if (!C.settings) C.settings = {};
    var S = C.settings;
    if (!S.theme) S.theme = { name: 'green', mode: 'auto', showDarkToggle: true, colors: { brand: '', accent: '', bg: '', text: '' } };
    if (!S.theme.colors) S.theme.colors = { brand: '', accent: '', bg: '', text: '' };
    if (!S.contact) S.contact = { name: 'أكاديمية قوارير', nameEn: 'Qawareer Academy', slogan: 'رفقاً بقلوبكن.. وقرباً لكتاب الله', tagline: 'برامج قرآنية وتربوية رحيمة', phoneDisplay: '01130830390', whatsapp: '201130830390', email: 'QawarirAcademy@gmail.com', telegram: 'QawareerAcademy', instagram: 'Qawareer.Academy', audience: 'النساء والأطفال', location: 'أونلاين بالكامل', siteUrl: '', gaId: '', localStats: true };
    if (!S.announcement) S.announcement = { visible: false, text: '', link: '', linkText: '', bg: '#06683f', color: '#ffffff' };
    if (!S.home) S.home = { reviews: { random: true, count: 3 } };
    if (!S.home.reviews) S.home.reviews = { random: true, count: 3 };
    if (S.home.reviews.random == null) S.home.reviews.random = true;
    if (S.home.reviews.count == null) S.home.reviews.count = 3;

    /* WhatsApp messages. The greeting is the one line the owner does NOT
       edit per message -- main.js prepends it to everything, so it cannot be
       forgotten on one button out of seventy. */
    if (!S.waMessages) S.waMessages = {};
    var WA_DEFAULTS = {
      greeting: 'السلام عليكم ورحمة الله وبركاته',
      general: 'حابّة أعرف تفاصيل أكثر عن برامج أكاديمية قوارير.',
      trial: 'حابّة أحجز حصة تجريبية في أكاديمية قوارير.',
      program: 'حابّة أحجز في برنامج «{program}».',
      pricing: 'حابّة أعرف تفاصيل أكثر عن الباقات والأسعار.',
      tierClassic: 'حابّة أعرف تفاصيل أكثر عن الباقات التقليدية.',
      tierGolden: 'حابّة أعرف تفاصيل أكثر عن الباقات الذهبية.',
      tierGroups: 'حابّة أعرف تفاصيل أكثر عن باقات المجموعات.',
      faq: 'حابة اسأل عن سؤال في صفحة الأسئلة الشائعة.',
      materials: 'حابّة أعرف المواد المتاحة للقراءة في البيت.',
      testimonials: 'حابّة أشارك رأيي في تجربتي مع الأكاديمية.',
      notFound: 'وصلت لصفحة غير موجودة وحابّة أستفسر عن حاجة.',
      contact: 'حابّة أستفسر عن حاجة.',
      article: 'حابّة أعرف المزيد عن مقال: {article}.',
      notify: 'نبهيني لما المحتوى ده يكون جاهز.'
    };
    Object.keys(WA_DEFAULTS).forEach(function (k) {
      if (S.waMessages[k] === undefined) S.waMessages[k] = WA_DEFAULTS[k];
    });

    /* `why` used to point at the "من نحن" block while the panel labelled it
       "لماذا قوارير" -- so a saved setting for one actually controlled the
       other. The two blocks have their own keys now, and the old value moves
       to the block it really controlled. `why` starts clean (missing =
       visible), and the dead `testimonials` key folds into `reviews`. */
    if (!C.sections) C.sections = {};
    if (C.sections.why && !C.sections['about-intro']) {
      C.sections['about-intro'] = C.sections.why;
      delete C.sections.why;
    }
    if (C.sections.testimonials && !C.sections.reviews) {
      C.sections.reviews = C.sections.testimonials;
    }
    delete C.sections.testimonials;

    /* home blocks + their cards, so the panel can edit every word in them */
    if (!C.home) C.home = {};
    if (!C.home.blocks) C.home.blocks = {};
    if (!C.home.cards) C.home.cards = {};
    if (!C.home.video) C.home.video = {
      url: 'y1TUN9ivr-Q',
      caption: 'جزء عم كامل — أسلوب متّبع في تعليم وتحفيظ القرآن الكريم للأطفال'
    };
    if (!C.home.blocks.aboutIntro) C.home.blocks.aboutIntro = {
      kicker: 'من نحن',
      title: 'تعليم قرآني برحمة، يليق بكِ',
      lead: 'في قوارير مش بنقدّم حصص حفظ وخلاص — بنصمّم مسار شخصي لكل طالبة وطفل.'
    };
    if (!C.home.blocks.video) C.home.blocks.video = {
      kicker: 'فيديو تعريفي',
      title: 'تعرّفي على أكاديمية قوارير',
      lead: 'دقيقة واحدة تلخّص رسالتنا وطريقتنا.'
    };
    if (!C.home.blocks.why) C.home.blocks.why = {
      kicker: 'لماذا قوارير؟',
      title: 'أربعة أسباب يخلّوكِ تختارينا',
      lead: ''
    };
    if (!C.home.blocks.programs) C.home.blocks.programs = {
      kicker: 'البرامج',
      title: 'أربعة برامج تبدأ من حيث أنتِ',
      lead: 'كل برنامج مصمّم لمرحلة معيّنة — اختاري الأقرب لوضعكِ دلوقتي، أو تعرّفي على الباقي من صفحة البرامج.'
    };
    if (!C.home.blocks.materials) C.home.blocks.materials = {
      kicker: 'المواد',
      title: 'مكتبة عملية تساعدكِ في البيت',
      lead: 'أدلة وورق مراجعة وأنشطة مناسبة للطفل، كلها متاحة مجاناً ومباشرة — تنفع في أي وقت، من غير ما تحتاجي تحفظي منظّم.',
      cta: 'تصفّحي المواد'
    };
    if (!C.home.cards.aboutIntro) {
      C.home.cards.aboutIntro = [
        { ico: '💻', title: 'أونلاين في أي وقت', text: 'من بيتكِ ومن أي مكان، بمواعيد مرنة تناسب جدولكِ وظروفكِ.' },
        { ico: '🗺️', title: 'خريطة قرآنية', text: 'متابعة واضحة لكل مقطع: قيد الحفظ، يحتاج تثبيت، ثابت، أو يحتاج استعادة.' },
        { ico: '🤝', title: 'رفقة بلا ضغط', text: 'متابعة أسبوعية إنسانية تشجيعية، وأسبوع بدون لوم مهما كان الانقطاع.' }
      ];
    }
    if (!C.home.cards.why) {
      C.home.cards.why = [
        { ico: '🎓', title: 'معلّمات مؤهّلات', text: 'فريق معلمات متخصّصات في التعليم القرآني بأساليب تربوية حديثة.' },
        { ico: '🎯', title: 'مراعاة الفروق', text: 'خطة مخصّصة لكل طالبة حسب مستواها ووقتها وقدرتها.' },
        { ico: '📈', title: 'متابعة مستمرة', text: 'خريطة قرآنية أسبوعية وتقرير ختامي يوضّح ما أُنجز.' },
        { ico: '💚', title: 'بلا لوم ولا ضغط', text: 'لو انقطعتِ، بنرجّعكِ بلطف. الخطة بتتعدّل مع ظروفكِ.' }
      ];
    }
    if (!S.sectionOrder) S.sectionOrder = {
      home: ['hero', 'stats', 'programs', 'testimonials', 'pricing', 'articles', 'faq', 'cta'],
      about: ['about-hero', 'about'],
      programs: ['programs-cards', 'program-details'],
      pricing: ['pricing-cards', 'price-table', 'price-notes'],
      testimonials: ['reviews'],
      materials: ['topics', 'materials-hero', 'materials-intro', 'materials-suggest'],
      faq: ['faq'],
      contact: ['soon-faq']
    };
    if (!S.navigation) S.navigation = {
      header: [
        { label: 'الرئيسية', href: 'index.html', visible: true, target: '' },
        { label: 'عن الأكاديمية', href: 'about.html', visible: true, target: '' },
        { label: 'البرامج', href: 'programs.html', visible: true, target: '' },
        { label: 'الأسعار', href: 'pricing.html', visible: true, target: '' },
        { label: 'آراء الطلاب', href: 'testimonials.html', visible: true, target: '' },
        { label: 'المواد', href: 'materials.html', visible: true, target: '' },
        { label: 'تواصل معنا', href: 'contact.html', visible: true, target: '' }
      ],
      footer: {
        columns: [
          { title: 'روابط سريعة', links: [
            { label: 'الرئيسية', href: 'index.html' },
            { label: 'البرامج', href: 'programs.html' },
            { label: 'الأسعار', href: 'pricing.html' },
            { label: 'الأسئلة الشائعة', href: 'faq.html' }
          ]},
          { title: 'الأكاديمية', links: [
            { label: 'عن الأكاديمية', href: 'about.html' },
            { label: 'المواد المقروءة', href: 'materials.html' },
            { label: 'آراء الطلاب', href: 'testimonials.html' }
          ]},
          { title: 'تواصل', links: [
            { label: 'واتساب', href: 'https://wa.me/201130830390' },
            { label: 'إيميل', href: 'mailto:QawarirAcademy@gmail.com' },
            { label: 'تيليجرام', href: 'https://t.me/QawareerAcademy' },
            { label: 'إنستجرام', href: 'https://instagram.com/Qawareer.Academy' }
          ]}
        ]
      },
      social: {
        whatsapp: '201130830390',
        telegram: 'QawareerAcademy',
        instagram: 'Qawareer.Academy',
        email: 'QawarirAcademy@gmail.com'
      }
    };
  })();

  var LS_CONTENT = 'qwr-content';
  var LS_DRAFT   = 'qwr-draft';
  var LS_GH      = 'qwr-github';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function toast(msg, kind) {
    var t = $('#admToast');
    t.textContent = msg;
    t.className = 'adm-toast is-on' + (kind ? ' is-' + kind : '');
    setTimeout(function () { t.className = 'adm-toast'; }, 3400);
  }
  function setStatus(text, cls) {
    $('#admStatus').textContent = text;
    $('#admDot').className = 'adm-dot' + (cls ? ' is-' + cls : '');
  }
  function uid(prefix) {
    return prefix + Math.random().toString(36).slice(2, 7);
  }

  /* ================================================================
     1. DRAFT STATE
     ================================================================ */
  function loadDraft() {
    var raw = null;
    try { raw = localStorage.getItem(LS_DRAFT); } catch (e) {}
    if (!raw) return;
    try {
      var saved = JSON.parse(raw);
      if (!saved || !saved.programs) return;   // not a draft we wrote

      // The shipped content.js has no updatedAt, so there is nothing to
      // compare against: any readable draft is newer by definition (it can
      // only exist because this browser saved it in a previous session).
      var draftAt = saved.updatedAt ? new Date(saved.updatedAt).getTime() : 0;
      var liveAt  = C && C.updatedAt ? new Date(C.updatedAt).getTime() : 0;

      if (draftAt >= liveAt) {
        C = saved;
        window.CONTENT = C;
        setStatus('عندك مسودة محفوظة من قبل', 'dirty');
        $('#btnPublish').disabled = false;
        $('#admSaveTxt').textContent =
          'عندك مسودة محفوظة — اضغطي «حفظ ونشر» لتثبيتها أو امسحيها من المتصفح.';
      }
    } catch (e) {}
  }

  function dropDraft() {
    try { localStorage.removeItem(LS_DRAFT); } catch (e) {}
  }

  function markDirty() {
    C.updatedAt = new Date().toISOString();
    try { localStorage.setItem(LS_DRAFT, JSON.stringify(C)); } catch (e) {}
    setStatus('فيه تغييرات مش محفوظة', 'dirty');
    $('#btnPublish').disabled = false;
    $('#admSaveTxt').textContent = 'فيه تغييرات — اضغطي «حفظ ونشر» لتثبيتها على الموقع';
  }

  function markClean() {
    try { localStorage.setItem(LS_CONTENT, JSON.stringify(C)); } catch (e) {}
    dropDraft();
    setStatus('كل حاجة محفوظة', 'saved');
    $('#btnPublish').disabled = true;
    $('#admSaveTxt').textContent = 'مفيش تغييرات لسه';
  }

  /* ================================================================
     2. FORM BUILDERS
     ================================================================ */
  /* ---------- helpers ---------- */
  /* Every control needs a programmatic label, otherwise it is unreachable by
     screen readers and Lighthouse flags the whole panel. Field labels are
     rendered as siblings, so we pair them with a generated id. */
  var uid = 0;
  function nextId(prefix) {
    uid += 1;
    return 'adm-' + prefix + '-' + uid;
  }
  function labelFor(labelEl, control, prefix) {
    var id = control.id || (control.id = nextId(prefix));
    labelEl.htmlFor = id;
    return id;
  }

  function field(label, hint, value, onInput, multiline, tall) {
    var tag = multiline ? 'textarea' : 'input';
    var cls = multiline ? 'adm-ta' + (tall ? ' adm-ta--tall' : '') : 'adm-in';
    var el = document.createElement(tag);
    el.className = cls;
    el.value = value == null ? '' : value;
    if (!multiline) el.type = 'text';
    el.addEventListener('input', function () { onInput(el.value); markDirty(); });

    var wrap = document.createElement('div');
    wrap.className = 'adm-field';
    var lab = document.createElement('label');
    lab.className = 'adm-label';
    lab.innerHTML = esc(label) +
      (hint ? ' <span class="adm-hint">' + esc(hint) + '</span>' : '');
    labelFor(lab, el, 'f');
    wrap.appendChild(lab);
    wrap.appendChild(el);
    return wrap;
  }

  /* `options` may be an array of strings, or a {value: label} map. The map
     form is what lets a select use stable keys ('shot') instead of Arabic
     text, so the onChange callback never has to match on copy. */
  function select(label, options, value, onChange) {
    var el = document.createElement('select');
    el.className = 'adm-sel';

    var pairs;
    if (Array.isArray(options)) {
      pairs = options.map(function (o) { return { value: o, label: o }; });
    } else {
      pairs = Object.keys(options).map(function (k) {
        return { value: k, label: options[k] };
      });
    }

    pairs.forEach(function (p) {
      var op = document.createElement('option');
      op.value = p.value;
      op.textContent = p.label;
      if (p.value === value) op.selected = true;
      el.appendChild(op);
    });
    el.addEventListener('change', function () { onChange(el.value); markDirty(); });

    var wrap = document.createElement('div');
    wrap.className = 'adm-field';
    var lab = document.createElement('label');
    lab.className = 'adm-label';
    lab.textContent = label;
    labelFor(lab, el, 's');
    wrap.appendChild(lab);
    wrap.appendChild(el);
    return wrap;
  }

  function toggle(label, checked, onChange) {
    var wrap = document.createElement('label');
    wrap.className = 'adm-toggle';
    wrap.innerHTML =
      '<input type="checkbox"' + (checked ? ' checked' : '') + '>' +
      '<span class="adm-toggle__ui"></span>' +
      '<span class="adm-label" style="margin:0">' + esc(label) + '</span>';
    $('input', wrap).addEventListener('change', function (e) {
      onChange(e.target.checked); markDirty();
    });
    return wrap;
  }

  /* --- image field -------------------------------------------------------
     Used for testimonial photos AND chat screenshots. Two ways to fill it:
       1. pick a file  -> we shrink it in the browser and store it inline
          as a data URL, so the site stays a single folder with no extra
          files to publish and the image never 404s.
       2. type a path or a full URL (e.g. assets/img/shot-1.jpg) if you
          would rather host the image yourself.

     `opts.maxEdge` / `opts.placeholder` let the avatar and the screenshot
     use the same control with different limits: an avatar renders at 52px,
     a chat screenshot is opened full-screen and needs to stay readable.  */
  var MAX_DATA_KB = 90;    // warn above this so content.js stays lean

  function imgField(label, hint, value, onInput, opts) {
    opts = opts || {};
    var maxEdge = opts.maxEdge || 220;
    var ph = opts.placeholder || 'اختاري صورة أو اكتبي رابطها';

    var wrap = document.createElement('div');
    wrap.className = 'adm-field adm-field--img' + (opts.wide ? ' is-wide' : '');

    var lab = document.createElement('label');
    lab.className = 'adm-label';
    lab.textContent = label;
    wrap.appendChild(lab);

    var row = document.createElement('div');
    row.className = 'adm-imgrow';

    var prev = document.createElement('span');
    prev.className = 'adm-imgprev';
    row.appendChild(prev);

    var col = document.createElement('div');
    col.className = 'adm-imgcol';

    var inp = document.createElement('input');
    inp.className = 'adm-in adm-in--ltr';
    inp.type = 'text';
    inp.value = value || '';
    inp.placeholder = ph;
    labelFor(lab, inp, 'img');
    inp.addEventListener('input', function () {
      onInput(inp.value.trim());
      paint();
      markDirty();
    });
    col.appendChild(inp);

    var note = document.createElement('div');
    note.className = 'adm-hint';
    col.appendChild(note);

    var btns = document.createElement('div');
    btns.className = 'adm-imgbtns';

    var file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.className = 'adm-hidden-file';
    file.setAttribute('aria-label', 'اختيار ملف صورة من الجهاز');
    file.addEventListener('change', function () {
      if (!file.files || !file.files[0]) return;
      shrinkImage(file.files[0], function (dataUrl, w, h) {
        inp.value = dataUrl;
        onInput(dataUrl);
        paint();
        markDirty();
      }, maxEdge, opts.crop !== false);
    });

    var pick = document.createElement('button');
    pick.type = 'button';
    pick.className = 'btn btn--outline btn--sm';
    pick.textContent = opts.pickLabel || '📷 اختيار صورة';
    pick.addEventListener('click', function () { file.click(); });

    var clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'btn btn--outline btn--sm';
    clear.textContent = opts.clearLabel || '✕ بدون صورة';
    clear.addEventListener('click', function () {
      inp.value = '';
      onInput('');
      paint();
      markDirty();
    });

    btns.appendChild(pick);
    btns.appendChild(clear);
    btns.appendChild(file);
    col.appendChild(btns);
    row.appendChild(col);
    wrap.appendChild(row);

    if (hint) {
      var h = document.createElement('div');
      h.className = 'adm-hint';
      h.textContent = hint;
      wrap.appendChild(h);
    }

    function paint() {
      var v = inp.value.trim();
      if (!v) {
        prev.innerHTML = '<span class="adm-imgprev__none">' +
          esc(opts.emptyText || 'لا صورة') + '</span>';
        note.textContent = opts.emptyHint || 'بدون صورة يظهر الحرف الأول من الاسم.';
        note.className = 'adm-hint';
        return;
      }
      var kb = Math.round(v.length * 0.75 / 1024);
      prev.innerHTML = '';
      var im = document.createElement('img');
      im.src = v;
      im.alt = '';
      prev.appendChild(im);
      if (/^data:/.test(v)) {
        note.textContent = 'مخزّنة داخل الملف (' + kb + ' كيلوبايت)';
        note.className = 'adm-hint' + (kb > MAX_DATA_KB ? ' adm-hint--warn' : '');
      } else {
        note.textContent = 'رابط أو مسار صورة: ' + v;
        note.className = 'adm-hint';
      }
    }
    paint();
    return wrap;
  }

  /* Resample a picked image in the browser and return it as a data URL.

     A phone photo is several MB, which would bloat content.js, so the image
     is scaled down here. Two shapes:
       square (crop: true)  -> the round avatar
       fitted  (crop: false) -> a chat screenshot, which must keep its whole
                               shape because the words are the point         */
  function shrinkImage(file, done, maxEdge, crop) {
    var LIMIT = maxEdge || 220;
    var fr = new FileReader();
    fr.onerror = function () { alert('تعذّرت قراءة الصورة.'); };
    fr.onload = function () {
      var im = new Image();
      im.onerror = function () { alert('هذا الملف ليس صورة صالحة.'); };
      im.onload = function () {
        var w, h, sx = 0, sy = 0, sw = im.width, sh = im.height;

        if (crop) {
          var s = Math.min(im.width, im.height);
          sx = (im.width - s) / 2;
          sy = (im.height - s) / 2;
          sw = sh = s;
          w = h = Math.min(LIMIT, s);
        } else {
          // never grow a small image; only shrink what is too big
          var k = Math.min(1, LIMIT / Math.max(im.width, im.height));
          w = Math.round(im.width * k);
          h = Math.round(im.height * k);
        }

        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var g = c.getContext('2d');
        // chat screenshots have small text: keep the pixels crisp
        g.imageSmoothingQuality = 'high';
        g.drawImage(im, sx, sy, sw, sh, 0, 0, w, h);

        var url;
        try {
          url = c.toDataURL('image/webp', crop ? 0.82 : 0.9);
          // some browsers silently fall back to PNG; detect by header
          if (url.slice(0, 15) !== 'data:image/webp') {
            url = c.toDataURL('image/jpeg', crop ? 0.85 : 0.92);
          }
        } catch (e) {
          url = c.toDataURL('image/jpeg', crop ? 0.85 : 0.92);
        }
        done(url, w, h);
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  /* --- repeatable list editor (who / how / out / plans / topics) --- */
  function listEditor(arr, onChange, placeholder, withTitle) {
    var box = document.createElement('div');
    box.className = 'adm-list';

    /* items are either plain strings or objects; withTitle means the row is
       edited as "title — text" inside a single textarea */
    function display(item) {
      if (withTitle === 'plan') {
        if (item && typeof item === 'object') {
          return (item.sessions || '') + ' — ' + (item.price || '');
        }
        return String(item == null ? '' : item);
      }
      if (withTitle) {
        if (item && typeof item === 'object') {
          return (item.title || '') + ' — ' + (item.text || '');
        }
        return String(item == null ? '' : item);
      }
      if (item && typeof item === 'object') return String(item.text || '');
      return String(item == null ? '' : item);
    }

    function parse(value, template) {
      if (withTitle === 'plan') {
        var m = String(value).split(/\s+[—–-]\s+/);
        return {
          sessions: (m[0] || '').trim(),
          price: (m.length > 1 ? m.slice(1).join(' — ') : '').trim()
        };
      }
      if (withTitle) {
        var p = String(value).split(/\s+[—–-]\s+/);
        var o2 = (template && typeof template === 'object') ? template : {};
        o2.title = (p[0] || '').trim();
        o2.text = p.length > 1 ? p.slice(1).join(' — ').trim() : '';
        return o2;
      }
      return value;
    }

    function render() {
      box.innerHTML = '';
      arr.forEach(function (item, i) {
        var row = document.createElement('div');
        row.className = 'adm-li';

        var grip = document.createElement('span');
        grip.className = 'adm-li__grip';
        grip.textContent = '⠿';
        grip.setAttribute('aria-hidden', 'true');

        var ta = document.createElement('textarea');
        ta.rows = 1;
        ta.value = display(item);
        ta.placeholder = placeholder || '';
        ta.setAttribute('aria-label',
          (placeholder || 'بند') + ' ' + (i + 1));
        ta.addEventListener('input', function () {
          arr[i] = parse(ta.value, item);
          ta.style.height = 'auto';
          ta.style.height = ta.scrollHeight + 'px';
          onChange();
          markDirty();
        });

        var x = document.createElement('button');
        x.className = 'adm-li__x';
        x.type = 'button';
        x.setAttribute('aria-label', 'احذفي');
        x.innerHTML = '&times;';
        x.addEventListener('click', function () {
          arr.splice(i, 1);
          render();
          onChange();
          markDirty();
        });

        row.appendChild(grip);
        row.appendChild(ta);
        row.appendChild(x);
        box.appendChild(row);
      });
      requestAnimationFrame(function () {
        $$('textarea', box).forEach(function (t) {
          t.style.height = 'auto';
          t.style.height = t.scrollHeight + 'px';
        });
      });
    }

    box.__arr = arr;
    box.__render = render;
    box.__display = display;
    render();
    return box;
  }

  function addRow(listEl, value, title) {
    var arr = listEl.__arr;
    var item = (title !== undefined)
      ? { title: title, text: value }
      : (value === undefined ? '' : value);
    arr.push(item);
    listEl.__render();
    listEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function addPlanRow(listEl) {
    listEl.__arr.push({ sessions: 'حصة جديدة', price: '0' });
    listEl.__render();
    listEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* --- generic card shell with order / visibility / delete --- */
  function cardShell(item, titleText, num, opts) {
    opts = opts || {};
    var card = document.createElement('div');
    card.className = 'adm-card';
    if (item.visible === false) card.style.opacity = '.55';

    var head = document.createElement('div');
    head.className = 'adm-card__head';
    head.innerHTML =
      '<div class="adm-card__num">' + esc(num) + '</div>' +
      '<div class="adm-card__title">' + esc(titleText || '') + '</div>';

    var tools = document.createElement('div');
    tools.className = 'adm-card__tools';

    if (opts.orderable !== false) {
      var up = document.createElement('button');
      up.className = 'adm-mini'; up.type = 'button'; up.title = 'لأعلى'; up.textContent = '↑';
      up.addEventListener('click', function () {
        var i = C[opts.list].indexOf(item);
        if (i > 0) {
          C[opts.list].splice(i, 1);
          C[opts.list].splice(i - 1, 0, item);
          markDirty(); renderTab();
        }
      });
      var dn = document.createElement('button');
      dn.className = 'adm-mini'; dn.type = 'button'; dn.title = 'لأسفل'; dn.textContent = '↓';
      dn.addEventListener('click', function () {
        var i = C[opts.list].indexOf(item);
        if (i < C[opts.list].length - 1) {
          C[opts.list].splice(i, 1);
          C[opts.list].splice(i + 1, 0, item);
          markDirty(); renderTab();
        }
      });
      tools.appendChild(up);
      tools.appendChild(dn);
    }

    var vis = document.createElement('label');
    vis.className = 'adm-toggle';
    vis.title = 'إظهار / إخفاء';
    vis.innerHTML = '<input type="checkbox"' + (item.visible !== false ? ' checked' : '') + '>' +
                    '<span class="adm-toggle__ui"></span>';
    $('input', vis).addEventListener('change', function (e) {
      item.visible = e.target.checked;
      card.style.opacity = item.visible === false ? '.55' : '1';
      markDirty();
    });
    tools.appendChild(vis);

    var del = document.createElement('button');
    del.className = 'adm-mini is-del'; del.type = 'button'; del.title = 'احذفي'; del.textContent = '🗑';
    del.addEventListener('click', function () {
      if (!confirm('احذفي «' + (titleText || '') + '» نهائياً؟')) return;
      var i = C[opts.list].indexOf(item);
      if (i > -1) C[opts.list].splice(i, 1);
      markDirty(); renderTab();
    });
    tools.appendChild(del);

    head.appendChild(tools);
    card.appendChild(head);
    card.__item = item;
    return card;
  }

  /* ================================================================
     3. TAB BUILDERS
     ================================================================ */
  /* `add` is optional: tabs without it (الصفحات / الرئيسية) are singletons.
     When present it appends a fresh item to the list and re-renders, so the
     new card appears at the bottom ready to fill in. */
  var TABS = [
    { id: 'sections', label: 'الأقسام', icon: '👁', build: buildSections },
    { id: 'theme', label: 'المظهر', icon: '🎨', build: buildTheme },
    { id: 'contact', label: 'الإعدادات', icon: '⚙️', build: buildContact },
    { id: 'announcement', label: 'إعلان', icon: '📢', build: buildAnnouncement },
    { id: 'waMessages', label: 'رسائل الواتساب', icon: '💬', build: buildWaMessages },
    { id: 'sectionOrder', label: 'ترتيب الأقسام', icon: '↕️', build: buildSectionOrder },
    { id: 'navigation', label: 'القائمة', icon: '🧭', build: buildNavigation },
    { id: 'texts', label: 'النصوص', icon: '📝', build: buildTexts },
    { id: 'seo', label: 'SEO', icon: '🔎', build: buildSeo },
    { id: 'programs', label: 'البرامج', icon: '📚', build: buildPrograms,
      addLabel: '+ أضيفي برنامجاً', add: addProgram },
    { id: 'packages', label: 'الفئات', icon: '💳', build: buildPackages,
      addLabel: '+ أضيفي فئة أسعار', add: addPackage },
    { id: 'reviews', label: 'الآراء', icon: '⭐', build: buildReviews,
      addLabel: '+ أضيفي رأياً جديداً', add: addReview },
    { id: 'faq', label: 'الأسئلة', icon: '❓', build: buildFaq,
      addLabel: '+ أضيفي سؤالاً جديداً', add: addFaq },
    { id: 'pages', label: 'الصفحات', icon: '📄', build: buildPages },
    { id: 'home', label: 'الرئيسية', icon: '🏠', build: buildHome }
  ];

  /* ---------- factory helpers ----------
     nextOrder keeps the existing 1,2,3… numbering intact so the sort in
     render.js stays stable and no two items share a position. */
  function nextOrder(list) {
    var max = 0;
    (list || []).forEach(function (x) { max = Math.max(max, x.order || 0); });
    return max + 1;
  }

  function addProgram() {
    C.programs.push({
      id: 'p' + Date.now().toString(36).slice(-5),
      order: nextOrder(C.programs),
      visible: true,
      title: 'برنامج جديد',
      short: 'وصف مختصر يظهر في كارت البرنامج.',
      audience: 'الجميع',
      duration: '٨ أسابيع',
      idea: 'اشرحي فكرة البرنامج في سطرين.',
      why: 'اكتبي هنا ليه البرنامج مهم.',
      who: ['الفئة المستهدفة'],
      how: ['خطوة أولى'],
      out: ['ما الذي تخرج به الطالبة']
    });
    markDirty();
    var at = C.programs.length - 1;   // programs render first, in order
    renderTab();
    focusCard(at);
  }

  function addPackage() {
    var P = priceModel();
    var plans = P.plans;

    P.tiers.push({
      id: 't' + Date.now().toString(36).slice(-5),
      order: nextOrder(P.tiers),
      visible: true,
      featured: false,
      theme: 'classic',
      badge: '',
      name: 'فئة جديدة',
      tagline: 'عنوان فرعي قصير',
      description: 'اكتبي هنا وصف الفئة، وليه الزائرة تختارها.',
            features: [
        'ميزة أولى بتظهر بعلامة صح',
        'ميزة ثانية'
      ],
      cta: 'اختاري باقتكِ',
      // start with every system the site knows about, so the new tier is
      // complete on the page rather than half-filled and easy to forget
      rows: P.systems.map(function (s) {
        return {
          system: s.id,
          prices: plans.map(function () { return ''; })
        };
      })
    });

    markDirty();
    // the pricing tab renders the currency/plans card first, then one card
    // per tier, so the new tier's index is offset by 1
    var at = P.tiers.length;
    renderTab();
    focusCard(at);
  }

  function addReview() {
    C.testimonials.push({
      id: 'r' + Date.now().toString(36).slice(-5),
      order: nextOrder(C.testimonials),
      visible: true,
      rating: 5,
      name: 'اسم الطالبة',
      initial: '',
      program: '',
      text: 'اكتبي هنا رأي الطالبة أو وليّ الأمر.'
    });
    markDirty();
    var at = C.testimonials.length - 1;
    renderTab();
    focusCard(at);
  }

  function addFaq() {
    C.faq.push({
      id: 'q' + Date.now().toString(36).slice(-5),
      order: nextOrder(C.faq),
      visible: true,
      q: 'السؤال الجديد؟',
      a: 'اكتبي الإجابة هنا.'
    });
    markDirty();
    var at = C.faq.length - 1;
    renderTab();
    focusCard(at);
  }

  /* Scroll to the card that was just created and put the caret in its first
     box, so the owner can start typing straight away.

     The index matters: the_packages tab ends with a "price notes" card that
     is NOT part of the packages array, so "last card" would be the wrong
     target there. Each adder therefore reports where it landed. */
  function focusCard(index) {
    // The panel is rebuilt synchronously by renderTab(), so the card already
    // exists here — no requestAnimationFrame needed. Using rAF would also mean
    // the focus silently never happens when the browser throttles animations
    // (background tab, reduced-motion, some mobile browsers).
    var card = $$('.adm-card')[index];
    if (!card) return;

    card.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // brief highlight so the eye finds it in a long list
    card.classList.add('is-fresh');
    setTimeout(function () { card.classList.remove('is-fresh'); }, 1800);

    /* Focus the first box meant for TYPING, not the show/hide checkbox in
       the card header — that checkbox is the first <input> in the card, so a
       naive "first input" would land there and typing would toggle
       visibility instead of writing text. */
    var TEXTY = { text: 1, search: 1, email: 1, url: 1, tel: 1, password: 1 };
    var target = $$('input, textarea, select', card).filter(function (el) {
      if (el.disabled || el.readOnly) return false;
      if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
      return TEXTY[el.type] === 1;
    })[0];

    if (target) {
      target.focus();
      if (target.select) target.select();
    }
  }

  function panel(id) {
    var p = document.createElement('div');
    p.id = 'panel-' + id;
    p.className = 'adm-panel';
    return p;
  }

  /* ---------- SECTIONS: إظهار / إخفاء للزائرة ---------- */
/* Turning a section off does not delete anything. The content stays in
   content.js, the visitor gets a "قريباً" panel instead, and switching it
   back on brings every card straight back. The renderers return an empty
   string while a section is off, so the hidden content is not in the HTML
   either — which means it is not indexed before you are ready for it. */

var SEC_META = [
  // Homepage sections. `binary: true` = ظاهر / مخفي only, no «قريباً».
  { key: 'hero',       title: 'الهيرو (الشاشة الأولى)',    where: 'الصفحة الرئيسية' },
  { key: 'stats',      title: 'شريط الأرقام',              where: 'الصفحة الرئيسية' },
  { key: 'about-intro',title: 'من نحن',                    where: 'الصفحة الرئيسية', binary: true },
  { key: 'video',      title: 'فيديو تعريفي',              where: 'الصفحة الرئيسية', binary: true },
  { key: 'programs',   title: 'قسم البرامج',               where: 'الصفحة الرئيسية + صفحة البرامج', binary: true },
  { key: 'why',        title: 'لماذا قوارير؟',             where: 'الصفحة الرئيسية', binary: true },
  { key: 'pricing',    title: 'معاينة الأسعار',            where: 'الصفحة الرئيسية + صفحة الأسعار' },
  { key: 'reviews',    title: 'آراء الطالبات',            where: 'الصفحة الرئيسية + صفحة آراء الطالبات' },
  { key: 'faq',        title: 'الأسئلة الشائعة',          where: 'الرئيسية + صفحة الأسئلة + تواصل معنا' },
  { key: 'cta',        title: 'شريط الدعوة للتسجيل',      where: 'الصفحة الرئيسية' },
  { key: 'materials',  title: 'المواد المقروءة',           where: 'الصفحة الرئيسية + صفحة المواد' },
  { key: 'articles',   title: 'المقالات والشروحات',       where: 'صفحة المقالات (لسه مفيش صفحة)' },
];

function secState(key) {
  if (!C.sections) C.sections = {};
  if (!C.sections[key]) C.sections[key] = { visible: true };
  /* Normalize legacy string values saved by older versions */
  var v = C.sections[key].visible;
  if (v === 'on') C.sections[key].visible = true;
  if (v === 'off') C.sections[key].visible = false;
  /* binary blocks have no "قريباً" state, so never show one as selected */
  if (v === 'soon' && window.RENDER.secIsBinary(key)) C.sections[key].visible = true;
  return C.sections[key];
}

function buildSections(host) {
  var note = document.createElement('div');
  note.className = 'adm-note';
  note.innerHTML =
    'المفتاح ده بيحكم في <strong>اللي بيشوفه الزائرة بس</strong>، ' +
    'وأنتِ بتقدري تكتبي وتعدّلي عادي. ' +
    'لما تقفلي أي قسم، اختاري: <strong>يختفي خالص</strong> (مافيش حاجة — ' +
    'ولا الخلفية ولا الفراغ) أو <strong>يظهر «قريباً»</strong> (لوحة مكان المحتوى). ' +
    'المحتوى بيتفضل في اللوحة، ارجعي المفتاح تاني في أي وقت.';
  host.appendChild(note);

  SEC_META.forEach(function (m) {
    var s = secState(m.key);
    var state = s.visible === true ? 'on' : (s.visible === 'soon' ? 'soon' : 'off');

    var card = document.createElement('div');
    card.className = 'adm-card';

    var head = document.createElement('div');
    head.className = 'adm-card__head';
    head.innerHTML =
      '<div><div class="adm-card__title">' + esc(m.title) + '</div>' +
      '<div class="adm-hint">' + esc(m.where) + '</div></div>';

    var tools = document.createElement('div');
    tools.className = 'adm-card__tools';

    // Segmented control. Binary blocks get two buttons: a "قريباً" panel on a
    // section that already exists reads oddly, so those are on/off only.
    var wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.gap = '6px';
    wrap.style.alignItems = 'center';
    wrap.style.background = 'var(--bg-alt)';
    wrap.style.padding = '4px';
    wrap.style.borderRadius = 'var(--r)';

    var states = [
      { val: 'on', label: '✅ ظاهر', title: 'الزائرة تشوف المحتوى طبيعي' },
      { val: 'soon', label: '🕐 قريباً', title: 'الزائرة تشوف لوحة «قريباً بإذن الله»' },
      { val: 'off', label: '🚫 مخفي', title: 'القسم يختفي خالص — خلفيته الفراغة كمان' }
    ];
    if (m.binary) states = states.filter(function (st) { return st.val !== 'soon'; });

    states.forEach(function (st) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'adm-seg-btn' + (state === st.val ? ' is-on' : '');
      btn.textContent = st.label;
      btn.title = st.title;
      btn.style.padding = '6px 12px';
      btn.style.border = 'none';
      btn.style.background = state === st.val ? 'var(--green)' : 'transparent';
      btn.style.color = state === st.val ? '#fff' : 'var(--ink)';
      btn.style.borderRadius = 'var(--r-sm)';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '.8rem';
      btn.style.transition = 'var(--t)';
      btn.addEventListener('click', function () {
        /* 'on' must be stored as boolean true, not the string 'on' */
        s.visible = st.val === 'on' ? true : (st.val === 'off' ? false : 'soon');
        markDirty();
        renderTab();
      });
      wrap.appendChild(btn);
    });

    tools.appendChild(wrap);
    head.appendChild(tools);
    card.appendChild(head);
    host.appendChild(card);
  });
}

/* ---------- PROGRAMS ---------- */
  function buildPrograms(host) {
    C.programs.forEach(function (p) {
      var card = cardShell(p, p.title, p.order, { list: 'programs' });

      var grid = document.createElement('div');
      grid.className = 'adm-row';
      grid.appendChild(field('اسم البرنامج', '', p.title, function (v) { p.title = v; }));
      grid.appendChild(field('الفئة المستهدفة', 'تظهر كشارة', p.audience, function (v) { p.audience = v; }));
      card.appendChild(grid);

      grid = document.createElement('div');
      grid.className = 'adm-row';
      grid.appendChild(field('المدة', 'مثال: 8 – 12 أسبوع', p.duration, function (v) { p.duration = v; }));
      grid.appendChild(field('الوصف القصير', 'يظهر في كارت البرنامج', p.short, function (v) { p.short = v; }, true));
      card.appendChild(grid);

      card.appendChild(field('الفكرة', 'الفقرة الأولى في التفاصيل', p.idea, function (v) { p.idea = v; }, true));
      card.appendChild(field('لماذا مهم؟', '', p.why, function (v) { p.why = v; }, true));

      [['who', 'الفئة المستهدفة (كل سطر بند)'],
       ['how', 'طريقة التنفيذ (كل سطر بند)'],
       ['out', 'المخرج النهائي (كل سطر بند)']].forEach(function (pair) {
        var f = document.createElement('div');
        f.className = 'adm-field';
        // a group of textareas, not a single control: use a span, not a <label>
        f.innerHTML = '<span class="adm-label">' + esc(pair[1]) + '</span>';
        var le = listEditor(p[pair[0]], function () {}, 'اكتبي بنداً');
        f.appendChild(le);
        var add = document.createElement('button');
        add.className = 'adm-mini'; add.type = 'button'; add.textContent = '+ أضيفي بند';
        add.style.marginTop = '8px';
        add.addEventListener('click', function () {
          addRow(le, 'بند جديد'); markDirty();
        });
        f.appendChild(add);
        card.appendChild(f);
      });

      card.appendChild(field('الميزة التنافسية', 'يظهر في مربع مميز', p.edge, function (v) { p.edge = v; }, true));

      host.appendChild(card);
    });
  }

  /* ---------- PACKAGES ---------- */
    /* ---------- PRICING TIERS ----------
     The model is pricing.systems (session lengths) + pricing.plans (bundles)
   + pricing.tiers (each pointing at systems by id with its own prices array).

     The editor follows that shape: one card per tier, and inside it one row
     per system with four price boxes aligned to the plan names printed once at
     the top. Aligning them by eye across free-text fields is exactly the kind
     of thing that goes wrong quietly, so the plan labels come from
     pricing.plans and the boxes are numbered the same way. */
  var TIER_THEMES = {
    classic: 'أخضر — الباقة الأساسية',
    golden: 'ذهبي — الباقة المميزة',
    groups: 'فيروزي — المجموعات'
  };

  function priceModel() {
    if (!C.pricing) {
      C.pricing = { currency: 'جنيه', systems: [], plans: [], tiers: [] };
    }
    if (!C.pricing.systems) C.pricing.systems = [];
    if (!C.pricing.plans) C.pricing.plans = [];
    if (!C.pricing.tiers) C.pricing.tiers = [];
    return C.pricing;
  }

  function sysById(id) {
    var all = priceModel().systems;
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  /* one row: the system name on the left, then a price box per plan */
  function priceRow(tier, row, plans) {
    var sys = sysById(row.system);
    var wrap = document.createElement('div');
    wrap.className = 'adm-pricerow';

    var head = document.createElement('div');
    head.className = 'adm-pricerow__head';

    var nameSel = document.createElement('select');
    nameSel.className = 'adm-sel';
    priceModel().systems.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s.id;
      o.textContent = s.name;
      if (s.id === row.system) o.selected = true;
      nameSel.appendChild(o);
    });
    nameSel.addEventListener('change', function () {
      row.system = nameSel.value;
      markDirty();
    });
    head.appendChild(nameSel);

    var del = document.createElement('button');
    del.className = 'adm-mini is-del';
    del.type = 'button';
    del.title = 'احذفي هذا النظام من الفئة';
    del.textContent = '🗑';
    del.addEventListener('click', function () {
      if (!confirm('احذفي النظام ده من الفئة؟')) return;
      var i = tier.rows.indexOf(row);
      if (i > -1) tier.rows.splice(i, 1);
      markDirty();
      renderTab();
    });
    head.appendChild(del);

    wrap.appendChild(head);

    var cells = document.createElement('div');
    cells.className = 'adm-pricerow__cells';
    plans.forEach(function (pl, pi) {
      var cell = document.createElement('div');
      cell.className = 'adm-pricecell';

      var lab = document.createElement('span');
      lab.className = 'adm-label';
      lab.textContent = pl.label;
      cell.appendChild(lab);

      var wrapI = document.createElement('div');
      wrapI.className = 'adm-field';
      var input = document.createElement('input');
      input.className = 'adm-in adm-in--ltr';
      input.type = 'text';
      input.dir = 'ltr';
      input.value = (row.prices || [])[pi] || '';
      input.placeholder = '0';
      input.addEventListener('input', function () {
        if (!row.prices) row.prices = [];
        row.prices[pi] = input.value;
        markDirty();
      });
      wrapI.appendChild(input);
      cell.appendChild(wrapI);

      cells.appendChild(cell);
    });
    wrap.appendChild(cells);
    return wrap;
  }

  function buildPackages(host) {
    var P = priceModel();
    var plans = P.plans;

    /* --- currency + the two shared lists --- */
    var top = document.createElement('div');
    top.className = 'adm-card';
    top.innerHTML = '<div class="adm-card__head"><div class="adm-card__num">' +
      esc('₪') + '</div><div class="adm-card__title">العملة والباقات</div></div>';
    top.appendChild(field('اسم العملة (يظهر بعد السعر)', 'مثال: جنيه أو ج.م',
      P.currency, function (v) { P.currency = v; }));

    var sysWrap = document.createElement('div');
    sysWrap.className = 'adm-field';
    sysWrap.innerHTML = '<span class="adm-label">أنظمة الحصة' +
      '<span class="adm-hint">الاسم والدقيقة — بتتكرر في كل الفئات</span></span>';
    P.systems.forEach(function (s) {
      var g = document.createElement('div');
      g.className = 'adm-row';
      g.appendChild(field('اسم النظام', '', s.name, function (v) { s.name = v; }));
      var m = document.createElement('div');
      m.className = 'adm-field';
      var ml = document.createElement('label');
      ml.className = 'adm-label';
      ml.textContent = 'عدد الدقائق';
      var mi = document.createElement('input');
      mi.type = 'number';
      mi.className = 'adm-in';
      mi.dir = 'ltr';
      mi.value = s.minutes;
      mi.addEventListener('input', function () { s.minutes = parseInt(mi.value, 10) || 0; markDirty(); });
      m.appendChild(ml);
      m.appendChild(mi);
      g.appendChild(m);
      sysWrap.appendChild(g);
    });
    top.appendChild(sysWrap);

    var planWrap = document.createElement('div');
    planWrap.className = 'adm-field';
    planWrap.innerHTML = '<span class="adm-label">عدد الحصص في كل باقة' +
      '<span class="adm-hint">أعمدة الأسعار بتترتيب دي بالظبط — لو ضفتِ أو شلتِ ' +
      'باقة، الأسعار بتتظبط لوحدها</span></span>';

    var prow = document.createElement('div');
    prow.className = 'adm-row adm-row--3';
    plans.forEach(function (pl, pi) {
      var cell = document.createElement('div');
      cell.className = 'adm-planfield';

      var f = field('الباقة', 'مثال: 4 حصص', pl.label, function (v) { pl.label = v; });
      cell.appendChild(f);

      /* Deleting a bundle has to delete the matching price in every row of
         every tier. Dropping only the label would shift every later price one
         column left and silently re-price the whole table -- 850 would become
         the price for 8 sessions. So the removal happens on the index, and a
         price left empty is simply not shown (see tierSystemCard). */
      var del = document.createElement('button');
      del.className = 'adm-mini is-del';
      del.type = 'button';
      del.title = 'احذفي الباقة «' + pl.label + '»';
      del.textContent = '🗑';
      del.addEventListener('click', function () {
        if (plans.length <= 1) { alert('لازم فضل باقة واحدة على الأقل'); return; }
        if (!confirm('احذفي باقة «' + pl.label + '»؟\n'
          + 'هيتمسح سعرها من كل الفئات، والخانة الفاضية مش هتظهر على الموقع.')) return;

        plans.splice(pi, 1);
        P.tiers.forEach(function (t) {
          (t.rows || []).forEach(function (r) {
            if (Array.isArray(r.prices)) r.prices.splice(pi, 1);
          });
        });
        markDirty();
        renderTab();
      });
      cell.appendChild(del);
      prow.appendChild(cell);
    });
    planWrap.appendChild(prow);

    /* Adding a bundle asks for the session count and the label.

       The count is required: it is the number the bundle is actually sold as
       (22 for a daily-except-weekend plan, say), and it is what the plans are
       compared on. The label is what a visitor reads, and is free text so a
       bundle can be called something other than its count -- "يوميًا ما عدا
       الجمعة والسبت" is a better name than "22 حصة".

       Before this, the button invented both: sessions came out as
       plans.length + 1, so a fifth bundle was named "5 حصص" no matter what it
       was for. */
    var addPlan = document.createElement('button');
    addPlan.className = 'adm-mini adm-mini--add';
    addPlan.type = 'button';
    addPlan.textContent = '+ أضيفي باقة';

    addPlan.addEventListener('click', function () {
      var input = window.prompt(
        'عدد الحصص في الباقة (رقم):\n' +
        'مثال: 20، أو اكتب 0 لو مش مرتبطة بعدد ثابت',
        '');

      if (input === null) return;                       // cancelled

      var raw = String(input).trim();
      if (!raw) { alert('اكتبي عدد الحصص الأول'); return; }

      var n = parseInt(raw.replace(/[٠-٩]/g, function (d) {
        return '٠١٢٣٤٥٦٧٨٩'.indexOf(d);
      }), 10);

      if (isNaN(n) || n < 0) {
        alert('«' + raw + '» مش رقم. اكتبي رقم صحيح.');
        return;
      }
      if (n === 0) {
        alert('لو الباقة مش مرتبطة بعدد ثابت، اكتبي الاسم في خانة الاسم.');
        return;
      }

      // a duplicate count is almost certainly a mistake, and the two would be
      // indistinguishable on the page
      var clash = plans.filter(function (pl) { return pl.sessions === n; });
      if (clash.length && !confirm(
        'فيه باقة بـ' + n + ' حصة بالفعل («' + clash[0].label + '»).\n' +
        'تضيفي تانية؟')) return;

      var name = window.prompt(
        'الاسم اللي هيظهر على الموقع:\n' +
        'سيبيه فاضي لو عايزة «' + n + ' حصة»',
        n + ' حصة');
      if (name === null) return;
      var label = String(name).trim() || (n + ' حصة');

      plans.push({ id: 'p' + Date.now().toString(36), sessions: n, label: label });

      // one empty price cell per row, so the new column lines up. A row left
      // empty simply does not appear on the page (tierSystemCard skips it), so
      // a bundle can be added before its prices are known.
      P.tiers.forEach(function (t) {
        (t.rows || []).forEach(function (r) {
          if (!Array.isArray(r.prices)) r.prices = [];
          r.prices.push('');
        });
      });

      markDirty();
      renderTab();
    });
    planWrap.appendChild(addPlan);

    top.appendChild(planWrap);

    host.appendChild(top);

    /* --- one card per tier --- */
    P.tiers.forEach(function (tier) {
      var card = cardShell(tier, tier.name, tier.order, { list: 'pricing' });

      var g = document.createElement('div');
      g.className = 'adm-row';
      g.appendChild(field('اسم الفئة', 'يظهر في اللون المميز', tier.name,
        function (v) { tier.name = v; }));
      g.appendChild(field('العنوان الفرعي', 'جملة قصيرة تحت الاسم', tier.tagline,
        function (v) { tier.tagline = v; }, true));
      card.appendChild(g);

      card.appendChild(field('الوصف', 'اشرحِي للمعاها إيه الفئة دي وليه تختارها',
        tier.description, function (v) { tier.description = v; }, true, true));

      /* theme + badge + featured, side by side */
      var meta = document.createElement('div');
      meta.className = 'adm-row';

      var thWrap = document.createElement('div');
      thWrap.className = 'adm-field';
      thWrap.appendChild(select('لون الفئة', TIER_THEMES, tier.theme || 'classic',
        function (v) { tier.theme = v; }));
      meta.appendChild(thWrap);
      meta.appendChild(field('شريط صغير', 'مثال: الأكثر طلباً — اتركيه فاضي لل invisible',
        tier.badge, function (v) { tier.badge = v; }));

      var featWrap = document.createElement('div');
      featWrap.className = 'adm-field';
      featWrap.appendChild(toggle('الفئة المميزة (ظهور أكبر وظل ذهبي)',
        tier.featured === true, function (v) { tier.featured = v; }));
      meta.appendChild(featWrap);
      card.appendChild(meta);

      /* features, one per line */
      var f = document.createElement('div');
      f.className = 'adm-field';
      f.innerHTML = '<span class="adm-label">مميزات الفئة' +
        '<span class="adm-hint">كل سطر ميزة، بتظهر بعلامة صح في اللون</span></span>';
      var fTa = document.createElement('textarea');
      fTa.className = 'adm-ta adm-ta--tall';
      fTa.dir = 'auto';
      fTa.value = (tier.features || []).join('\n');
      fTa.addEventListener('input', function () {
        tier.features = fTa.value.split('\n')
          .map(function (s) { return s.trim(); })
          .filter(Boolean);
        markDirty();
      });
      f.appendChild(fTa);
      card.appendChild(f);

      /* prices, one row per system */
      var pr = document.createElement('div');
      pr.className = 'adm-field';
      pr.innerHTML = '<span class="adm-label">الأسعار' +
        '<span class="adm-hint">صف لكل نظام، والأعمدة بترتيب الباقات اللي فوق</span></span>';
      (tier.rows || []).forEach(function (row) {
        pr.appendChild(priceRow(tier, row, plans));
      });

      var addSys = document.createElement('button');
      addSys.className = 'adm-mini';
      addSys.type = 'button';
      addSys.textContent = '+ أضيفي نظام لهذه الفئة';
      addSys.style.marginTop = '8px';
      addSys.addEventListener('click', function () {
        var first = priceModel().systems[0];
        if (!first) { toast('لا توجد أنظمة — أضيفي نظاماً أولاً'); return; }
        tier.rows.push({
          system: first.id,
          prices: plans.map(function () { return ''; })
        });
        markDirty();
        renderTab();
      });
      pr.appendChild(addSys);
      card.appendChild(pr);

      card.appendChild(field('نص زرار الحجز', '', tier.cta,
        function (v) { tier.cta = v; }));

      host.appendChild(card);
    });

    /* --- price notes: unchanged, still here --- */
    var n = C.priceNotes;
    if (n) {
      var nCard = document.createElement('div');
      nCard.className = 'adm-card';
      nCard.innerHTML = '<div class="adm-card__head"><div class="adm-card__num">' +
        esc(n.order) + '</div><div class="adm-card__title">' + esc(n.title) + '</div></div>';
      nCard.appendChild(field('عنوان القسم', '', n.title, function (v) { n.title = v; }));

      n.items.forEach(function (it, i) {
        var g2 = document.createElement('div');
        g2.className = 'adm-row';
        g2.appendChild(field('أيقونة ' + (i + 1), '', it.icon, function (v) { it.icon = v; }));
        g2.appendChild(field('عنوان ' + (i + 1), '', it.title, function (v) { it.title = v; }));
        nCard.appendChild(g2);
        nCard.appendChild(field('وصف ' + (i + 1), '', it.text, function (v) { it.text = v; }, true));
      });

      nCard.appendChild(field('ملاحظة في الأسفل', '', n.quote, function (v) { n.quote = v; }, true));
      host.appendChild(nCard);
    }
  }

  /* ---------- REVIEWS ---------- */
  var APPS = ['واتساب', 'تيليجرام', 'ماسنجر', 'أخرى'];

  /* the three shapes a testimonial can take; the values are what render.js
     decides on, so the panel and the site can never disagree */
  var REVIEW_KINDS = {
    text: 'نص',
    shot: 'سكرين شوت محادثة',
    both: 'نص + سكرين شوت'
  };

  function buildReviews(host) {
    /* ---- how the homepage slider picks its reviews ----
       The homepage can show every review, or a random
       handful of them so each visit feels fresh. The
       full list stays on the testimonials page. */
    var HR = (C.settings && C.settings.home && C.settings.home.reviews) || {};

    var disp = document.createElement('div');
    disp.className = 'adm-card';
    disp.innerHTML = '<div class="adm-card__title">شريط الآراء في الرئيسية</div>' +
      '<div class="adm-hint">قسم «ماذا قالت طالباتنا؟» في الصفحة الرئيسية. ' +
      'مع الاختيار العشوائي، كل زيارة بتشوف آراء مختلفة من كل الآراء الموجودة.</div>';
    disp.appendChild(toggle('اختيار آراء عشوائية في الرئيسية', HR.random !== false,
      function (v) {
        if (!C.settings.home) C.settings.home = {};
        if (!C.settings.home.reviews) C.settings.home.reviews = {};
        C.settings.home.reviews.random = v;
      }));
    disp.appendChild(field('عدد الآراء المعروضة', 'لو العدد أكبر من عدد الآراء الكلي، هتعرض كل الآراء',
      String(HR.count || 3), function (v) {
        if (!C.settings.home) C.settings.home = {};
        if (!C.settings.home.reviews) C.settings.home.reviews = {};
        var n = parseInt(v, 10);
        C.settings.home.reviews.count = (n > 0 && n < 100) ? n : 3;
      }));
    host.appendChild(disp);

    C.testimonials.forEach(function (r) {
      var card = cardShell(r, r.name, r.order, { list: 'testimonials' });

      var grid = document.createElement('div');
      grid.className = 'adm-row--3 adm-row';
      grid.appendChild(field('الاسم', '', r.name, function (v) { r.name = v; }));
      grid.appendChild(field('الحرف في الأفاتار', 'يظهر لو لم تختاري صورة', r.initial, function (v) { r.initial = v; }));
      grid.appendChild(field('البرنامج', '', r.program, function (v) { r.program = v; }));
      card.appendChild(grid);

      /* ---- how this review is presented ----
         A review may be text, a chat screenshot, or both. The selector at
         the top switches between them so the card is never cluttered with
         fields the owner does not need.

         The mode is stored implicitly: `shot` being present at all means the
         screenshot field exists, which is exactly what render.js checks. So
         choosing "screenshot" creates an empty slot for the owner to fill
         rather than adding a second, redundant flag. */
      var hasShot = ('shot' in r);
      var mode = hasShot ? (r.text ? 'both' : 'shot') : 'text';

      var modeSel = document.createElement('div');
      modeSel.className = 'adm-field';
      modeSel.appendChild(select('نوع الرأي', REVIEW_KINDS, mode,
        function (v) {
          if (v === 'text') {
            delete r.shot;
          } else {
            if (!('shot' in r)) r.shot = '';          // open an empty slot
            if (v === 'shot') {
              delete r.text;
            } else if (!r.text) {
              // 'both' needs words as well; seed them so the field exists
              r.text = 'اكتبي هنا رأي الطالبة أو وليّ الأمر.';
            }
          }
          if (!r.name) r.name = 'اسم الطالبة';
          if (!r.program) r.program = 'اسم البرنامج';
          if (!r.initial) r.initial = (r.name || '؟').charAt(0);
          markDirty();
          renderTab();
        }));
      card.appendChild(modeSel);

      if (mode !== 'shot') {
        card.appendChild(field('نص الرأي', '', r.text, function (v) {
          r.text = v;
        }, true, true));
      }

      if (mode !== 'text') {
        // a screenshot is kept whole (not cropped) and bigger, because the
        // words inside it are the whole point
        card.appendChild(imgField('سكرين شوت المحادثة',
          'صوّر المحادثة من واتساب أو تيليجرام أو ماسنجر، أو اكتبي رابطها. ' +
          'بتظهر بحجم كبير، والزائرة تقدر تكبّرها بالضغط عليها.',
          r.shot, function (v) {
            if (v) r.shot = v; else delete r.shot;
          }, {
            wide: true,
            maxEdge: 900,              // readable when opened full-screen
            crop: false,               // keep the chat's real shape
            placeholder: 'اختاري سكرين شوت أو اكتبي رابطها',
            pickLabel: '📎 اختيار سكرين شوت',
            clearLabel: '✕ بدون سكرين شوت',
            emptyText: 'لا سكرين',
            emptyHint: 'بدون سكرين شوت يظهر نص الرأي فقط.'
          }));

        var appRow = document.createElement('div');
        appRow.className = 'adm-row';
        appRow.appendChild(select('التطبيق', APPS, r.app || 'واتساب',
          function (v) { r.app = v; }));
        appRow.appendChild(field('عدد الرسائل', 'اختياري — مثال: من ١٢ رسالة', r.count,
          function (v) {
            if (v) r.count = v; else delete r.count;
          }));
        card.appendChild(appRow);
      }

      /* ---- avatar: only worth showing next to words ---- */
      if (mode === 'text') {
        card.appendChild(imgField('صورة الطالبة',
          'اختياري: صورة دائرية صغيرة. النص يظل ظاهرًا دائمًا.',
          r.img, function (v) {
            if (v) r.img = v; else delete r.img;
          }));
      } else if (r.img) {
        card.appendChild(imgField('صورة الطالبة', '', r.img, function (v) {
          if (v) r.img = v; else delete r.img;
        }));
      }

      var rate = document.createElement('div');
      rate.className = 'adm-field';
      rate.appendChild(select('التقييم', ['5', '4', '3', '2', '1'], String(r.rating || 5),
        function (v) { r.rating = parseInt(v, 10); }));
      card.appendChild(rate);

      host.appendChild(card);
    });
  }

  /* ---------- ARTICLES ---------- */
  /* The body is edited as one paragraph per line. render.js splits it back
     into <p> elements, which keeps the panel simple and means a stray blank
     line never produces an empty paragraph on the page. */
  function paragraphsToText(list) {
    return (list || []).join('\n');
  }

  function textToParagraphs(text) {
    return String(text || '')
      .split('\n')
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  function addArticle() {
    var today = new Date().toISOString().slice(0, 10);
    C.articles.push({
      id: 'a' + Date.now().toString(36).slice(-5),
      order: nextOrder(C.articles),
      visible: true,
      featured: false,
      title: 'عنوان المقال',
      category: 'الحفظ',
      date: today,
      excerpt: 'فقرة تشويقية قصيرة بتظهر في الكارت قبل ما تفتحي المقال.',
      body: ['اكتبي فقرة أولى هنا.', 'اكتبي فقرة ثانية، وكل فقرة في سطر.'],
      tags: []
    });
    markDirty();
    var at = C.articles.length - 1;
    renderTab();
    focusCard(at);
  }

  function buildArticles(host) {
    (C.articles || []).forEach(function (a) {
      var card = cardShell(a, a.title, a.order, { list: 'articles' });

      var grid = document.createElement('div');
      grid.className = 'adm-row';
      grid.appendChild(field('عنوان المقال', '', a.title, function (v) { a.title = v; }));
      grid.appendChild(field('التصنيف', 'يظهر كشارة وفلتر أعلى الصفحة', a.category,
        function (v) { a.category = v.trim(); }));
      card.appendChild(grid);

      var grid2 = document.createElement('div');
      grid2.className = 'adm-row';

      var dateWrap = document.createElement('div');
      dateWrap.className = 'adm-field';
      var dLab = document.createElement('label');
      dLab.className = 'adm-label';
      dLab.textContent = 'تاريخ النشر';
      var dIn = document.createElement('input');
      dIn.type = 'date';
      dIn.className = 'adm-in';
      dIn.value = a.date || '';
      labelFor(dLab, dIn, 'adate');
      dIn.addEventListener('input', function () { a.date = dIn.value; markDirty(); });
      dateWrap.appendChild(dLab);
      dateWrap.appendChild(dIn);
      grid2.appendChild(dateWrap);

      var featWrap = document.createElement('div');
      featWrap.className = 'adm-field';
      featWrap.appendChild(toggle('مقال مميّز (يظهر أولاً)', a.featured === true,
        function (v) { a.featured = v; }));
      card.appendChild(grid2);
      card.appendChild(featWrap);

      card.appendChild(field('فقرة تشويقية', 'سطر أو سطران يظهران قبل فتح المقال',
        a.excerpt, function (v) { a.excerpt = v; }, true));

      /* the body: one paragraph per line */
      var bodyField = field('متن المقال',
        'كل فقرة في سطر — اضغطي Enter بين كل فقرة والتالية',
        paragraphsToText(a.body),
        function (v) { a.body = textToParagraphs(v); },
        true, true);
      bodyField.classList.add('adm-field--body');
      card.appendChild(bodyField);

      var pf = document.createElement('div');
      pf.className = 'adm-field';
      pf.innerHTML = '<span class="adm-label">الوسوم' +
        ' <span class="adm-hint">افصلي بينها بفاصلة</span></span>';
      var tagsIn = document.createElement('input');
      tagsIn.type = 'text';
      tagsIn.className = 'adm-in';
      tagsIn.value = (a.tags || []).join('، ');
      labelFor({ htmlFor: '' }, tagsIn, 'atags');
      tagsIn.addEventListener('input', function () {
        a.tags = tagsIn.value.split(/[،,]/).map(function (s) { return s.trim(); })
          .filter(Boolean);
        markDirty();
      });
      /* the tags input sits under a <span>, so give it its own label element
         for screen readers instead of relying on htmlFor */
      var tagsLab = document.createElement('label');
      tagsLab.className = 'adm-hint';
      tagsLab.htmlFor = tagsIn.id;
      tagsLab.textContent = 'مثال: خطة حفظ، تنظيم الوقت';
      pf.appendChild(tagsLab);
      pf.appendChild(tagsIn);
      card.appendChild(pf);

      host.appendChild(card);
    });
  }

  /* ---------- FAQ ---------- */
  function buildFaq(host) {
    C.faq.forEach(function (f) {
      var card = cardShell(f, f.q, f.order, { list: 'faq' });
      card.appendChild(field('السؤال', '', f.q, function (v) { f.q = v; }));
      card.appendChild(field('الإجابة', '', f.a, function (v) { f.a = v; }, true));
      host.appendChild(card);
    });
  }

  /* ---------- PAGES ---------- */
  function buildPages(host) {
    ['about', 'materials'].forEach(function (key) {
      var pg = C.pages[key];
      if (!pg) return;
      var names = { about: 'صفحة "عن الأكاديمية"', materials: 'صفحة "المواد المقروءة"' };
      var card = document.createElement('div');
      card.className = 'adm-card';
      card.innerHTML = '<div class="adm-card__head"><div class="adm-card__num">' +
        (key === 'about' ? 'ع' : 'م') + '</div><div class="adm-card__title">' +
        esc(names[key]) + '</div></div>';

      card.appendChild(field('عنوان الصفحة', '', pg.title, function (v) { pg.title = v; }));
      card.appendChild(field('العنوان الفرعي', 'يظهر تحت العنوان', pg.subtitle, function (v) { pg.subtitle = v; }, true));

      if (key === 'about') {
        card.appendChild(field('النص الأساسي', '', pg.lead, function (v) { pg.lead = v; }, true, true));
        card.appendChild(field('النص الثانوي', '', pg.lead2, function (v) { pg.lead2 = v; }, true, true));
        card.appendChild(field('الفلسفة', 'يظهر داخل مربع مميز', pg.philosophy, function (v) { pg.philosophy = v; }, true));
      } else {
        card.appendChild(field('المقدمة', '', pg.intro, function (v) { pg.intro = v; }, true));
        card.appendChild(field('عنوان الاقتراح', '', pg.suggestionTitle, function (v) { pg.suggestionTitle = v; }));
        card.appendChild(field('نص الاقتراح', '', pg.suggestionText, function (v) { pg.suggestionText = v; }, true));

        var f = document.createElement('div');
        f.className = 'adm-field';
        f.innerHTML = '<span class="adm-label">المواضيع القادمة ' +
          '<span class="adm-hint">كل سطر: العنوان — الوصف</span></span>';
        var le = listEditor(pg.topics, function () {}, 'عنوان — وصف', true);
        f.appendChild(le);
        var add = document.createElement('button');
        add.className = 'adm-mini'; add.type = 'button'; add.textContent = '+ أضيفي موضوع';
        add.style.marginTop = '8px';
        add.addEventListener('click', function () {
          pg.topics.push({ icon: '📖', title: 'موضوع جديد', text: 'وصف مختصر' });
          markDirty(); renderTab();
        });
        f.appendChild(add);
        card.appendChild(f);
      }

      host.appendChild(card);
    });
  }

  /* ---------- HOME ---------- */
  function buildHome(host) {
    var h = C.home;

    // hero
    var card = document.createElement('div');
    card.className = 'adm-card';
    card.innerHTML = '<div class="adm-card__head"><div class="adm-card__num">H</div>' +
      '<div class="adm-card__title">قسم الهيرو (أول الصفحة)</div></div>';
    card.appendChild(field('اسم الأكاديمية', '', h.hero.title, function (v) { h.hero.title = v; }));
    card.appendChild(field('السلوجان', '', h.hero.slogan, function (v) { h.hero.slogan = v; }));

    var g = document.createElement('div');
    g.className = 'adm-row';
    g.appendChild(field('الوصف', '', h.hero.desc, function (v) { h.hero.desc = v; }, true));
    g.appendChild(field('نص الزرار الأساسي', '', h.hero.ctaPrimary, function (v) { h.hero.ctaPrimary = v; }));
    card.appendChild(g);

    card.appendChild(field('نص الزرار الثانوي', '', h.hero.ctaSecondary, function (v) { h.hero.ctaSecondary = v; }));
    card.appendChild(field('الوسوم (كل سطر واحد)', '', h.hero.tags.join('\n'), function (v) {
      h.hero.tags = v.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    }, true));
    host.appendChild(card);

    // stats
    var sc = document.createElement('div');
    sc.className = 'adm-card';
    sc.innerHTML = '<div class="adm-card__head"><div class="adm-card__num">S</div>' +
      '<div class="adm-card__title">شريط الأرقام</div></div>';
    h.stats.forEach(function (st, i) {
      var row = document.createElement('div');
      row.className = 'adm-row--3 adm-row';
      row.appendChild(field('الرقم ' + (i + 1), '', st.value, function (v) { st.value = parseInt(v, 10) || 0; }));
      row.appendChild(field('اللاحقة ' + (i + 1), '+ أو % أو /7', st.suffix, function (v) { st.suffix = v; }));
      row.appendChild(field('الوصف ' + (i + 1), '', st.label, function (v) { st.label = v; }));
      sc.appendChild(row);
    });
    host.appendChild(sc);

    // cta
    var cc = document.createElement('div');
    cc.className = 'adm-card';
    cc.innerHTML = '<div class="adm-card__head"><div class="adm-card__num">C</div>' +
      '<div class="adm-card__title">شريط الدعوة للتسجيل</div></div>';
    cc.appendChild(field('الشارة', '', h.cta.offer, function (v) { h.cta.offer = v; }));
    cc.appendChild(field('العنوان', '', h.cta.title, function (v) { h.cta.title = v; }));
    cc.appendChild(field('النص', '', h.cta.text, function (v) { h.cta.text = v; }, true));
    cc.appendChild(field('نص الزرار', '', h.cta.button, function (v) { h.cta.button = v; }));
    host.appendChild(cc);

    /* من نحن · لماذا قوارير · الفيديو · عنوان البرامج */
    buildHomeBlocks(host);
  }

  /* ---- the four blocks that used to be hand-written in index.html ----
       من نحن · لماذا قوارير؟ · فيديو تعريفي · عنوان البرامج.
       Each one is a heading plus a body, edited here and written into the
       page by a marked region on every publish. */
  function blockHeadCard(h, title, key) {
    var b = h.blocks[key];
    var card = document.createElement('div');
    card.className = 'adm-card';
    card.innerHTML = '<div class="adm-card__title">' + esc(title) + '</div>';
    card.appendChild(field('العنوان الصغير (فوق العنوان)', '', b.kicker, function (v) { b.kicker = v; }));
    card.appendChild(field('العنوان', '', b.title, function (v) { b.title = v; }));
    card.appendChild(field('الجملة الوصفية', 'اتركيها فاضية لو مش هتكتبي حاجة', b.lead, function (v) { b.lead = v; }, true));
    return card;
  }

  function glassCardEditor(host, list, title) {
    var card = document.createElement('div');
    card.className = 'adm-card';
    card.innerHTML = '<div class="adm-card__title">' + esc(title) + '</div>' +
      '<div class="adm-hint">الكروت دي بتظهر بالترتيب ده على الموقع.</div>';
    host.appendChild(card);

    list.forEach(function (c, i) {
      var row = document.createElement('div');
      row.className = 'adm-row';
      row.appendChild(field('الأيقونة ' + (i + 1), 'emoji', c.ico, function (v) { c.ico = v; }));
      row.appendChild(field('العنوان ' + (i + 1), '', c.title, function (v) { c.title = v; }));
      card.appendChild(row);
      card.appendChild(field('النص ' + (i + 1), '', c.text, function (v) { c.text = v; }, true));
    });
  }

  function buildHomeBlocks(host) {
    var h = C.home;
    var note = document.createElement('div');
    note.className = 'adm-note';
    note.innerHTML = 'البلوكات دي كانت مكتوبة في الصفحة نفسها، فكانت <strong>مش قابلة ' +
      'للتعديل ولا للإخفاء</strong>. دلوقتي بتعدّليها من هنا، والإخفاء من تبويب «الأقسام».';
    host.appendChild(note);

    host.appendChild(blockHeadCard(h, 'بلوك «من نحن»', 'aboutIntro'));
    glassCardEditor(host, h.cards.aboutIntro, 'كروت «من نحن»');

    host.appendChild(blockHeadCard(h, 'بلوك «لماذا قوارير؟»', 'why'));
    glassCardEditor(host, h.cards.why, 'أسباب اختيارنا');

    host.appendChild(blockHeadCard(h, 'بلوك «فيديو تعريفي»', 'video'));
    var vcard = host.lastChild;
    vcard.appendChild(field('رابط الفيديو', 'كود الفيديو أو الرابط كامل', h.video.url, function (v) { h.video.url = v; }));
    vcard.appendChild(field('وصف تحت الفيديو', '', h.video.caption, function (v) { h.video.caption = v; }, true));

    host.appendChild(blockHeadCard(h, 'عنوان بلوك «البرامج»', 'programs'));

    /* the homepage teaser for the materials page -- its region was in the
       markup but nothing rewrote it, so these words were frozen */
    var mcard = blockHeadCard(h, 'بلوك «المواد» (معاينة في الرئيسية)', 'materials');
    mcard.appendChild(field('نص الزرار', '', h.blocks.materials.cta, function (v) { h.blocks.materials.cta = v; }));
    host.appendChild(mcard);
  }

  /* ================================================================
     4. TABS UI
     ================================================================ */
  var currentTab = TABS[0].id;

  /* ---------- THEME ---------- */
  function buildTheme(host) {
    var note = document.createElement('div');
    note.className = 'adm-note';
    note.innerHTML = 'اختاري الثيمة والوضع الداكن وأي لون مخصص فوق الثيمة. ' +
      'التعديلات بتنطبق بعد «حفظ ونشر» (المعاينة هنا للشكل بس).';
    host.appendChild(note);

    var T = C.settings.theme;

    var card = document.createElement('div');
    card.className = 'adm-card';

    card.appendChild(select('الثيمة', {
      green: 'أخضر قوارير (الافتراضي)',
      teal: 'فيروزي',
      gold: 'ذهبي دافئ',
      royal: 'أزرق ملكي',
      maroon: 'عنابي'
    }, T.name, function (v) { T.name = v; }));

    card.appendChild(select('الوضع', {
      auto: 'تلقائي (الزائرة تختار)',
      dark: 'داكن دائماً',
      light: 'فاتح دائماً'
    }, T.mode, function (v) { T.mode = v; }));

    card.appendChild(toggle('إظهار زرار الوضع الداكن في الهيدر', T.showDarkToggle !== false,
      function (v) { T.showDarkToggle = v; }));

    host.appendChild(card);

    var colorsCard = document.createElement('div');
    colorsCard.className = 'adm-card';
    colorsCard.innerHTML = '<div class="adm-card__title">ألوان مخصصة (اختياري)</div>' +
      '<div class="adm-hint">اكتبي قيمة فارغة = استخدمي ألوان الثيمة.</div>';

    [['brand', 'اللون الأساسي'], ['accent', 'اللون الثانوي (الذهبي)'],
     ['bg', 'الخلفية'], ['text', 'لون النص']].forEach(function (pair) {
      var key = pair[0], label = pair[1];
      var row = document.createElement('div');
      row.className = 'adm-field';
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '10px';
      var lab = document.createElement('label');
      lab.className = 'adm-label';
      lab.textContent = label;
      var inp = document.createElement('input');
      inp.type = 'color';
      inp.value = T.colors[key] || '#06683f';
      inp.addEventListener('input', function () {
        T.colors[key] = inp.value; markDirty(); val.textContent = inp.value;
      });
      var val = document.createElement('span');
      val.className = 'adm-hint';
      val.textContent = T.colors[key] || '(من الثيمة)';
      var clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'adm-mini';
      clear.textContent = 'إلغاء';
      clear.addEventListener('click', function () {
        T.colors[key] = ''; markDirty(); val.textContent = '(من الثيمة)';
      });
      row.appendChild(lab); row.appendChild(inp); row.appendChild(val); row.appendChild(clear);
      colorsCard.appendChild(row);
    });

    host.appendChild(colorsCard);
  }

  /* ---------- CONTACT ---------- */
  function buildContact(host) {
    var note = document.createElement('div');
    note.className = 'adm-note';
    note.innerHTML = 'بيانات التواصل محفوظة مرة واحدة في <code>settings.contact</code> ' +
      'وبتتكتب تلقائياً في <code>config.js</code> عند النشر — فتتغيّر في كل روابط الموقع.';
    host.appendChild(note);

    var S = C.settings.contact;
    var card = document.createElement('div');
    card.className = 'adm-card';

    card.appendChild(field('اسم الأكاديمية', '', S.name, function (v) { S.name = v; }));
    card.appendChild(field('الاسم بالإنجليزي', '', S.nameEn, function (v) { S.nameEn = v; }));
    card.appendChild(field('الشعار', '', S.slogan, function (v) { S.slogan = v; }));
    card.appendChild(field('الوصف القصير', '', S.tagline, function (v) { S.tagline = v; }));
    card.appendChild(field('رقم الهاتف (كما يظهر)', '', S.phoneDisplay, function (v) { S.phoneDisplay = v; }));
    card.appendChild(field('واتساب (بدون + أو صفر)', '', S.whatsapp, function (v) { S.whatsapp = v; }));
    card.appendChild(field('الإيميل', '', S.email, function (v) { S.email = v; }));
    card.appendChild(field('تيليجرام', '', S.telegram, function (v) { S.telegram = v; }));
    card.appendChild(field('إنستجرام', '', S.instagram, function (v) { S.instagram = v; }));
    card.appendChild(field('الجمهور', '', S.audience, function (v) { S.audience = v; }));
    card.appendChild(field('المكان', '', S.location, function (v) { S.location = v; }));
    card.appendChild(field('رابط الموقع (siteUrl)', 'اختياري', S.siteUrl, function (v) { S.siteUrl = v; }));
    card.appendChild(field('Google Analytics ID', 'اتركيه فاضي لإيقاف الإحصائيات', S.gaId, function (v) { S.gaId = v; }));

    host.appendChild(card);
  }

  /* ---------- WHATSAPP MESSAGES ----------

     Seventy-odd buttons go to WhatsApp. Their text used to be a single line
     copied into ten pages, so nothing here could change it and a per-button
     message (the pricing tiers, each program) had nowhere to live except a
     hardcoded data-msg attribute.

     Every button now names a key: <a data-wa="pricing">. This tab edits the
     message behind each key, and the greeting is edited once at the top --
     main.js puts it in front of every message, so it cannot be left off on
     one button. */
  var WA_KEYS = [
    ['greeting',      'التحية (بتبدأ بيها كل رسالة)',            'بتتضاف تلقائياً لكل رسالة، مش بتكتبيها مع كل زرار'],
    ['general',       'الرسالة العامة (الزرار الافتراضي)',       'أي زرار مش محدد ليه رسالة خاصة'],
    ['trial',         'زر «احجزي الحصة التجريبية الآن»',          'الشريط في أسفل الصفحة الرئيسية وكل الصفحات'],
    ['program',       'زرار «احجزي في هذا البرنامج»',             '{program} بيتبدّل باسم البرنامج تلقائياً'],
    ['pricing',       '«عرض تفاصيل الباقات»',                    'من الصفحة الرئيسية'],
    ['tierClassic',   '«اختاري باقتكِ» — التقليدية',              'صفحة الأسعار'],
    ['tierGolden',    '«احجزي الباقة الذهبية»',                  'صفحة الأسعار'],
    ['tierGroups',    '«اسألي عن المجموعة»',                      'صفحة الأسعار'],
    ['faq',           '«اسألينا سؤالاً»',                        'صفحة الأسئلة'],
    ['materials',     '«أخبريني بما تحتاجين»',                    'صفحة المواد'],
    ['testimonials',  '«أرسل�� رأيكِ»',                          'صفحة الآراء'],
    ['notFound',      '«اكتبي لنا على واتساب»',                  'صفحة ٤٠٤'],
    ['contact',       'أزرار التواصل العام',                      'نموذج التواصل وغيره'],
    ['article',       '«اسأليني عن المقال»',                    '{article} بيتبدّل بعنوان المقال تلقائياً'],
    ['notify',        '«نبهيني عند الجاهزية»',                   'الزرار بتاع لوحات «قريباً»']
  ];

  function buildWaMessages(host) {
    var M = C.settings.waMessages || (C.settings.waMessages = {});

    var note = document.createElement('div');
    note.className = 'adm-note';
    note.innerHTML = 'النص اللي بتكتبه هنا <strong>بيتبعت بعد التحية تلقائياً</strong> — ' +
      'يعني مش هتكتبی «السلام عليكم» في كل رسالة. لو حذفتِ الزرار اللي ' +
      'بيستخدم رسالة، هيستخدم <strong>الرسالة العامة</strong>.';
    host.appendChild(note);

    /* a live preview, so there is no guessing what a visitor will receive */
    var prev = document.createElement('div');
    prev.className = 'adm-card';
    prev.innerHTML = '<div class="adm-card__title">معاينة الرسالة</div>' +
      '<div class="adm-hint">بتتحدّث مع كل كتابة — النتيجة كما توصل لواتساب.</div>';
    var box = document.createElement('div');
    box.className = 'adm-pricereply';
    box.style.cssText = 'white-space:pre-wrap;line-height:1.7;padding:14px 16px;' +
      'border:1px solid var(--line);border-radius:var(--r);margin-top:10px;' +
      'background:var(--bg-alt);font-size:.94rem';
    prev.appendChild(box);

    var live = document.createElement('label');
    live.className = 'adm-label';
    live.textContent = 'عايزة تشوفي رسالة:';
    var pick = document.createElement('select');
    pick.className = 'adm-sel';
    WA_KEYS.forEach(function (pair) {
      var o = document.createElement('option');
      o.value = pair[0];
      o.textContent = pair[1];
      pick.appendChild(o);
    });
    var row = document.createElement('div');
    row.className = 'adm-field';
    row.appendChild(live);
    row.appendChild(pick);
    prev.appendChild(row);
    host.appendChild(prev);

    function refresh() {
      var body = (M[pick.value] || '').trim();
      var sample = body.replace(/\{[a-zA-Z]+\}/g, 'قوارير للحفظ المتدرج');
      box.textContent = (M.greeting || '').trim() + '\n' + sample;
    }
    pick.addEventListener('change', refresh);

    WA_KEYS.forEach(function (pair) {
      var key = pair[0];
      var card = document.createElement('div');
      card.className = 'adm-card';

      var head = document.createElement('div');
      head.innerHTML = '<div class="adm-card__title">' + esc(pair[1]) + '</div>' +
        '<div class="adm-hint">' + esc(pair[2]) + '</div>';
      card.appendChild(head);

      var wrap = document.createElement('div');
      wrap.className = 'adm-field';
      var lab = document.createElement('label');
      lab.className = 'adm-label';
      lab.textContent = key === 'greeting' ? 'نص التحية' : 'نص الرسالة (بعد التحية)';
      var ta = document.createElement('textarea');
      ta.className = 'adm-ta';
      ta.dir = 'rtl';
      ta.value = M[key] || '';
      ta.addEventListener('input', function () {
        M[key] = ta.value;
        refresh();
        markDirty();
      });
      labelFor(lab, ta, 'wa');
      wrap.appendChild(lab);
      wrap.appendChild(ta);
      card.appendChild(wrap);

      var go = document.createElement('button');
      go.type = 'button';
      go.className = 'adm-mini';
      go.textContent = 'عايزة أشوفها في المعاينة';
      go.addEventListener('click', function () {
        pick.value = key;
        refresh();
        prev.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      card.appendChild(go);

      host.appendChild(card);
    });

    refresh();
  }

  /* ---------- ANNOUNCEMENT ---------- */
  function buildAnnouncement(host) {
    var note = document.createElement('div');
    note.className = 'adm-note';
    note.innerHTML = 'شريط إعلان أعلى الموقع. فعّليه واكتبي الرسالة، وهيظهر لكل الزوار بعد النشر.';
    host.appendChild(note);

    var A = C.settings.announcement;
    var card = document.createElement('div');
    card.className = 'adm-card';

    card.appendChild(toggle('إظهار الشريط', A.visible === true, function (v) { A.visible = v; }));
    card.appendChild(field('النص', '', A.text, function (v) { A.text = v; }));
    card.appendChild(field('رابط الزرار (اختياري)', '', A.link, function (v) { A.link = v; }));
    card.appendChild(field('نص الزرار', '', A.linkText, function (v) { A.linkText = v; }));
    card.appendChild(field('لون الخلفية', 'مثال: #06683f', A.bg, function (v) { A.bg = v; }));
    card.appendChild(field('لون النص', 'مثال: #ffffff', A.color, function (v) { A.color = v; }));

    host.appendChild(card);
  }

  /* ---------- SECTION ORDER (Drag & Drop) ---------- */
  function buildSectionOrder(host) {
    var note = document.createElement('div');
    note.className = 'adm-note';
    note.innerHTML = 'رتبي أقسام كل صفحة بالسحب والإفلات. الترتيب بيحفظ في <code>settings.sectionOrder</code> '
      'وبيطبق عند النشر — من غير ما تلمسي أي كود.';
    host.appendChild(note);

    var pages = Object.keys(C.settings.sectionOrder || {});
    pages.forEach(function (pageKey) {
      var card = document.createElement('div');
      card.className = 'adm-card';
      card.style.marginBottom = '16px';

      var head = document.createElement('div');
      head.className = 'adm-card__head';
      head.textContent = pageKey;
      card.appendChild(head);

      var list = document.createElement('div');
      list.className = 'adm-sortable';
      list.style.display = 'flex';
      list.style.flexDirection = 'column';
      list.style.gap = '8px';

      var order = C.settings.sectionOrder[pageKey] || [];
      order.forEach(function (sectionId, idx) {
        var item = document.createElement('div');
        item.className = 'adm-sortable-item';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '10px';
        item.style.padding = '10px 12px';
        item.style.background = 'var(--bg-alt)';
        item.style.borderRadius = 'var(--r)';
        item.style.border = '1px solid var(--line)';
        item.draggable = true;
        item.dataset.id = sectionId;

        var drag = document.createElement('span');
        drag.className = 'adm-drag-handle';
        drag.textContent = '⋮⋮';
        drag.style.cursor = 'grab';
        drag.style.color = 'var(--muted)';
        item.appendChild(drag);

        var label = document.createElement('span');
        label.textContent = sectionId;
        label.style.flex = '1';
        item.appendChild(label);

        var vis = document.createElement('input');
        vis.type = 'checkbox';
        vis.checked = true; // visibility handled in sections tab
        vis.style.width = '18px';
        vis.style.height = '18px';
        item.appendChild(vis);

        // Drag events
        item.addEventListener('dragstart', function (e) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', sectionId);
          item.classList.add('dragging');
        });
        item.addEventListener('dragend', function () {
          item.classList.remove('dragging');
        });
        item.addEventListener('dragover', function (e) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          var after = getDragAfterElement(list, e.clientY);
          var dragging = list.querySelector('.dragging');
          if (after) list.insertBefore(dragging, after);
          else list.appendChild(dragging);
        });

        list.appendChild(item);
      });

      card.appendChild(list);
      host.appendChild(card);
    });

    // Helper for drag & drop
    function getDragAfterElement(container, y) {
      var elements = Array.from(container.querySelectorAll('.adm-sortable-item:not(.dragging)'));
      return elements.reduce(function (closest, child) {
        var box = child.getBoundingClientRect();
        var offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        }
        return closest;
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
  }

  /* ---------- NAVIGATION (Header/Footer/Social) ---------- */
  function buildNavigation(host) {
    var note = document.createElement('div');
    note.className = 'adm-note';
    note.innerHTML = 'إدارة القائمة العلوية (الهيدر)، أعمدة الفوتر، وروابط السوشيال. '
      'التعديلات بتحفظ في <code>settings.navigation</code> وبتظهر في كل الموقع بعد النشر.';
    host.appendChild(note);

    var NAV = C.settings.navigation;

    // Header links
    var headerCard = document.createElement('div');
    headerCard.className = 'adm-card';
    headerCard.style.marginBottom = '16px';
    headerCard.innerHTML = '<div class="adm-card__title">القائمة العلوية (الهيدر)</div>';
    host.appendChild(headerCard);

    var headerList = document.createElement('div');
    headerList.className = 'adm-sortable';
    headerList.style.display = 'flex';
    headerList.style.flexDirection = 'column';
    headerList.style.gap = '8px';

    (NAV.header || []).forEach(function (link, idx) {
      var item = document.createElement('div');
      item.className = 'adm-sortable-item';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '10px';
      item.style.padding = '10px 12px';
      item.style.background = 'var(--bg-alt)';
      item.style.borderRadius = 'var(--r)';
      item.style.border = '1px solid var(--line)';
      item.draggable = true;

      var drag = document.createElement('span');
      drag.className = 'adm-drag-handle';
      drag.textContent = '⋮⋮';
      drag.style.cursor = 'grab';
      drag.style.color = 'var(--muted)';
      item.appendChild(drag);

      var vis = document.createElement('input');
      vis.type = 'checkbox';
      vis.checked = link.visible !== false;
      vis.addEventListener('change', function () { link.visible = vis.checked; markDirty(); });
      item.appendChild(vis);

      var labelInp = document.createElement('input');
      labelInp.type = 'text';
      labelInp.value = link.label;
      labelInp.style.flex = '1';
      labelInp.addEventListener('input', function () { link.label = labelInp.value; markDirty(); });
      item.appendChild(labelInp);

      var hrefInp = document.createElement('input');
      hrefInp.type = 'text';
      hrefInp.value = link.href;
      hrefInp.style.width = '200px';
      hrefInp.addEventListener('input', function () { link.href = hrefInp.value; markDirty(); });
      item.appendChild(hrefInp);

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'adm-mini is-del';
      del.textContent = '🗑';
      del.addEventListener('click', function () {
        NAV.header.splice(idx, 1);
        markDirty();
        renderTab();
      });
      item.appendChild(del);

      // Drag events
      item.addEventListener('dragstart', function (e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'header', idx: idx }));
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', function () { item.classList.remove('dragging'); });
      item.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        var after = getDragAfterElement(headerList, e.clientY);
        var dragging = headerList.querySelector('.dragging');
        if (after) headerList.insertBefore(dragging, after);
        else headerList.appendChild(dragging);
      });
      item.addEventListener('drop', function (e) {
        e.preventDefault();
        var data = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (data.type === 'header') {
          var fromIdx = data.idx;
          var toIdx = Array.from(headerList.children).indexOf(item);
          if (fromIdx !== toIdx) {
            var moved = NAV.header.splice(fromIdx, 1)[0];
            NAV.header.splice(toIdx, 0, moved);
            markDirty();
            renderTab();
          }
        }
      });

      headerList.appendChild(item);
    });

    // Add new header link button
    var addHeaderBtn = document.createElement('button');
    addHeaderBtn.type = 'button';
    addHeaderBtn.className = 'btn btn--green btn--sm mt-2';
    addHeaderBtn.textContent = '+ إضافة رابط في الهيدر';
    addHeaderBtn.addEventListener('click', function () {
      NAV.header.push({ label: 'رابط جديد', href: '#', visible: true, target: '' });
      markDirty();
      renderTab();
    });
    headerCard.appendChild(headerList);
    headerCard.appendChild(addHeaderBtn);

    // Footer columns
    var footerCard = document.createElement('div');
    footerCard.className = 'adm-card';
    footerCard.style.marginBottom = '16px';
    footerCard.innerHTML = '<div class="adm-card__title">أعمدة الفوتر</div>';
    host.appendChild(footerCard);

    (NAV.footer.columns || []).forEach(function (col, cIdx) {
      var colCard = document.createElement('div');
      colCard.className = 'adm-card';
      colCard.style.marginBottom = '12px';
      colCard.style.padding = '12px';

      var colHead = document.createElement('div');
      colHead.style.display = 'flex';
      colHead.style.alignItems = 'center';
      colHead.style.gap = '10px';
      colHead.style.marginBottom = '8px';

      var titleInp = document.createElement('input');
      titleInp.type = 'text';
      titleInp.value = col.title;
      titleInp.style.flex = '1';
      titleInp.addEventListener('input', function () { col.title = titleInp.value; markDirty(); });
      colHead.appendChild(titleInp);

      var delCol = document.createElement('button');
      delCol.type = 'button';
      delCol.className = 'adm-mini is-del';
      delCol.textContent = '🗑 حذف العمود';
      delCol.addEventListener('click', function () {
        NAV.footer.columns.splice(cIdx, 1);
        markDirty();
        renderTab();
      });
      colHead.appendChild(delCol);

      colCard.appendChild(colHead);

      var linksList = document.createElement('div');
      linksList.style.display = 'flex';
      linksList.style.flexDirection = 'column';
      linksList.style.gap = '6px';

      (col.links || []).forEach(function (link, lIdx) {
        var linkRow = document.createElement('div');
        linkRow.style.display = 'flex';
        linkRow.style.gap = '8px';

        var lLabel = document.createElement('input');
        lLabel.type = 'text';
        lLabel.value = link.label;
        lLabel.style.flex = '1';
        lLabel.addEventListener('input', function () { link.label = lLabel.value; markDirty(); });
        linkRow.appendChild(lLabel);

        var lHref = document.createElement('input');
        lHref.type = 'text';
        lHref.value = link.href;
        lHref.style.width = '250px';
        lHref.addEventListener('input', function () { link.href = lHref.value; markDirty(); });
        linkRow.appendChild(lHref);

        var delLink = document.createElement('button');
        delLink.type = 'button';
        delLink.className = 'adm-mini is-del';
        delLink.textContent = '🗑';
        delLink.addEventListener('click', function () {
          col.links.splice(lIdx, 1);
          markDirty();
          renderTab();
        });
        linkRow.appendChild(delLink);

        linksList.appendChild(linkRow);
      });

      var addLinkBtn = document.createElement('button');
      addLinkBtn.type = 'button';
      addLinkBtn.className = 'btn btn--green btn--sm';
      addLinkBtn.style.width = 'fit-content';
      addLinkBtn.textContent = '+ إضافة رابط';
      addLinkBtn.addEventListener('click', function () {
        col.links.push({ label: 'رابط', href: '#' });
        markDirty();
        renderTab();
      });
      colCard.appendChild(linksList);
      colCard.appendChild(addLinkBtn);

      footerCard.appendChild(colCard);
    });

    var addColBtn = document.createElement('button');
    addColBtn.type = 'button';
    addColBtn.className = 'btn btn--green btn--sm mt-2';
    addColBtn.textContent = '+ إضافة عمود في الفوتر';
    addColBtn.addEventListener('click', function () {
      NAV.footer.columns.push({ title: 'عمود جديد', links: [] });
      markDirty();
      renderTab();
    });
    footerCard.appendChild(addColBtn);

    // Social links
    var socialCard = document.createElement('div');
    socialCard.className = 'adm-card';
    socialCard.innerHTML = '<div class="adm-card__title">روابط السوشيال ميديا</div>';
    host.appendChild(socialCard);

    Object.keys(NAV.social || {}).forEach(function (key) {
      var val = NAV.social[key];
      socialCard.appendChild(field(key.charAt(0).toUpperCase() + key.slice(1), '', val, function (v) { NAV.social[key] = v; }));
    });
  }

  /* ---------- TEXTS (all static copy) ---------- */
  function buildTexts(host) {
    var note = document.createElement('div');
    note.className = 'adm-note';
    note.innerHTML = 'كل النصوص الثابتة في الموقع. اكتب في خانة البحث لفلترة القائمة، وعدّل أي نص — التعديل بيحفظ في <code>settings.texts</code> وبيتطبق عند النشر.';
    host.appendChild(note);

    var search = document.createElement('input');
    search.type = 'search';
    search.placeholder = '🔍 ابحثي في النصوص...';
    search.style.width = '100%';
    search.style.padding = '10px 12px';
    search.style.marginBottom = '16px';
    search.style.fontSize = '1rem';
    search.style.border = '1px solid var(--line)';
    search.style.borderRadius = 'var(--r)';
    search.style.background = 'var(--bg)';
    host.appendChild(search);

    var texts = C.settings.texts || {};
    var keys = Object.keys(texts).sort();
    var container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    host.appendChild(container);

    function renderList(filter) {
      container.innerHTML = '';
      keys.filter(function(k) { return k.toLowerCase().indexOf(filter.toLowerCase()) !== -1; })
        .forEach(function (key) {
          var val = texts[key];
          var card = document.createElement('div');
          card.className = 'adm-card';
          card.style.padding = '12px';

          var head = document.createElement('div');
          head.style.display = 'flex';
          head.style.alignItems = 'flex-start';
          head.style.gap = '10px';
          head.style.marginBottom = '8px';

          var keySpan = document.createElement('code');
          keySpan.textContent = key;
          keySpan.style.flex = '1';
          keySpan.style.fontSize = '.85rem';
          keySpan.style.background = 'var(--bg-alt)';
          keySpan.style.padding = '4px 8px';
          keySpan.style.borderRadius = 'var(--r-sm)';
          head.appendChild(keySpan);

          var copyBtn = document.createElement('button');
          copyBtn.type = 'button';
          copyBtn.className = 'adm-mini';
          copyBtn.textContent = '📋';
          copyBtn.title = 'نسخ المفتاح';
          copyBtn.addEventListener('click', function () {
            navigator.clipboard.writeText(key);
            toast('تم نسخ المفتاح: ' + key, 'ok');
          });
          head.appendChild(copyBtn);

          card.appendChild(head);

          var isArray = Array.isArray(val);
          if (isArray) {
            val.forEach(function (item, i) {
              var row = document.createElement('div');
              row.style.display = 'flex';
              row.style.gap = '8px';
              row.style.marginBottom = '8px';
              
              var idx = document.createElement('span');
              idx.textContent = (i + 1) + '.';
              idx.style.color = 'var(--muted)';
              idx.style.minWidth = '24px';
              row.appendChild(idx);
              
              if (typeof item === 'object') {
                Object.keys(item).forEach(function (k) {
                  var inp = document.createElement('input');
                  inp.type = 'text';
                  inp.value = item[k];
                  inp.style.flex = '1';
                  inp.addEventListener('input', function () {
                    texts[key][i][k] = inp.value;
                    markDirty();
                  });
                  row.appendChild(inp);
                });
              } else {
                var inp = document.createElement('input');
                inp.type = 'text';
                inp.value = item;
                inp.style.flex = '1';
                inp.addEventListener('input', function () {
                  texts[key][i] = inp.value;
                  markDirty();
                });
                row.appendChild(inp);
              }
              
              var del = document.createElement('button');
              del.type = 'button';
              del.className = 'adm-mini is-del';
              del.textContent = '🗑';
              del.addEventListener('click', function () {
                texts[key].splice(i, 1);
                markDirty();
                renderList(search.value);
              });
              row.appendChild(del);
              card.appendChild(row);
            });
            
            var addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.className = 'btn btn--green btn--sm';
            addBtn.textContent = '+ إضافة عنصر';
            addBtn.addEventListener('click', function () {
              if (val.length && typeof val[0] === 'object') {
                var newItem = {};
                Object.keys(val[0]).forEach(function (k) { newItem[k] = ''; });
                texts[key].push(newItem);
              } else {
                texts[key].push('');
              }
              markDirty();
              renderList(search.value);
            });
            card.appendChild(addBtn);
          } else {
            var inp = document.createElement('textarea');
            inp.className = 'adm-ta';
            inp.value = val;
            inp.style.minHeight = '60px';
            inp.style.width = '100%';
            inp.addEventListener('input', function () {
              texts[key] = inp.value;
              markDirty();
            });
            card.appendChild(inp);
          }

          container.appendChild(card);
        });
    }

    search.addEventListener('input', function () { renderList(search.value); });
    renderList('');
  }

  /* ---------- SEO per page ---------- */
  function buildSeo(host) {
    var note = document.createElement('div');
    note.className = 'adm-note';
    note.innerHTML = 'عنوان الصفحة والوصف والكلمات المفتاحية لكل صفحة. ده اللي بيظهر في نتائج جوجل ومشاركة الروابط.';
    host.appendChild(note);

    var seo = C.settings.seo || {};
    var pages = Object.keys(seo).sort();

    pages.forEach(function (page) {
      var card = document.createElement('div');
      card.className = 'adm-card';
      card.style.marginBottom = '16px';

      var title = document.createElement('div');
      title.className = 'adm-card__title';
      title.textContent = page;
      card.appendChild(title);

      card.appendChild(field('Title (عنوان الصفحة)', 'يظهر في تبويب المتصفح ونتائج البحث', seo[page].title, function (v) { seo[page].title = v; }));
      card.appendChild(field('Description (الوصف)', 'يظهر تحت العنوان في نتائج البحث (أفضل 150-160 حرف)', seo[page].description, function (v) { seo[page].description = v; }, true));
      card.appendChild(field('Keywords (كلمات مفتاحية)', 'مفصولة بفواصل', seo[page].keywords, function (v) { seo[page].keywords = v; }));

      host.appendChild(card);
    });
  }

  function countFor(id) {
    switch (id) {
      case 'sections': return SEC_META.filter(function (m) {
        return secState(m.key).visible !== false;
      }).length;
      case 'programs': return C.programs.length;
      case 'packages': return (C.pricing && C.pricing.tiers || []).length;
      case 'reviews':  return C.testimonials.length;
      case 'articles': return (C.articles || []).length;
      case 'faq':      return C.faq.length;
      case 'pages':    return Object.keys(C.pages || {}).length;
      case 'home':     return 1;
      case 'theme':    return 1;
      case 'contact':  return 1;
      case 'announcement': return (C.settings && C.settings.announcement && C.settings.announcement.visible) ? 1 : 0;
      case 'sectionOrder': return Object.keys(C.settings.sectionOrder || {}).length;
      case 'navigation': return 1;
      case 'texts': return Object.keys(C.settings.texts || {}).length;
      case 'seo': return Object.keys(C.settings.seo || {}).length;
      default: return 0;
    }
  }

  function renderTabs() {
    var box = $('#admTabs');
    box.innerHTML = '';
    TABS.forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'adm-tab' + (t.id === currentTab ? ' is-on' : '');
      b.type = 'button';
      b.innerHTML = t.icon + ' ' + esc(t.label) +
        ' <span class="adm-tab__n">' + countFor(t.id) + '</span>';
      b.addEventListener('click', function () { currentTab = t.id; renderTab(); });
      box.appendChild(b);
    });
  }

  function renderTab() {
    renderTabs();
    var host = $('#admPanels');
    host.innerHTML = '';
    var def = TABS.filter(function (t) { return t.id === currentTab; })[0];
    if (!def) return;

    var p = panel(currentTab);
    p.style.display = 'block';
    host.appendChild(p);
    try {
      def.build(p);

      // The add button sits BELOW the list on purpose: you read what is
      // already there first, then append.
      if (def.add) {
        var addBar = document.createElement('div');
        addBar.className = 'adm-addbar';
        var btn = document.createElement('button');
        btn.className = 'btn btn--green btn--sm';
        btn.type = 'button';
        btn.textContent = def.addLabel;
        btn.addEventListener('click', def.add);
        addBar.appendChild(btn);

        var hint = document.createElement('span');
        hint.className = 'adm-hint';
        hint.textContent = 'العنصر الجديد بيظهر في الآخر — عدّليه ثم احفظي.';
        addBar.appendChild(hint);

        p.appendChild(addBar);
      }
    } catch (e) {
      p.innerHTML = '<div class="adm-note">حصل خطأ في العرض: ' + esc(e.message) + '</div>';
      if (window.console) console.error(e);
    }
  }

  /* ================================================================
     5. REGENERATE THE STATIC HTML
     Marks regions in each page and replaces them with freshly rendered
     HTML, so what Google reads always equals what you see.
     ================================================================ */
  var PAGE_MAP = [
    { file: 'index.html', regions: {
        'about-intro':   'aboutIntroBlock',
        'video':         'videoBlock',
        'programs-head': 'programsHead',
        'programs-cards': 'programCards',
        'stats':          'stats',
        'pricing-cards':  'priceCards',
        'why':            'whyBlock',
        'materials-block': 'materialsTeaser',
        'reviews':        'reviewSlider',
        'faq':            'faq',
        'floaters':       'floaters'
      } },
    { file: 'programs.html', regions: {
        'programs-cards':  'programCardsLocal',
        'program-details': 'programDetails',
        'floaters':        'floaters'
      } },
    { file: 'pricing.html', regions: {
        'pricing-cards': 'priceTiers',
        'price-table':  'priceTable',
        'price-notes':  'priceNotes',
        'pricing-intro': 'priceIntro',
        'floaters':       'floaters'
      } },
    { file: 'testimonials.html', regions: {
        'reviews': 'reviewsAll',
        'floaters': 'floaters'
      } },
    { file: 'materials.html', regions: {
        'topics':            'topics',
        'materials-hero':    'pageHeroText:materials',
        'materials-intro':   'materialsIntro',
        'materials-suggest': 'materialsSuggest',
        'floaters':          'floaters'
      } },
    { file: 'faq.html', regions: {
        'faq': 'faq',
        'floaters': 'floaters'
      } },
    /* no marked regions left, but the page still needs the section / nav /
       texts / seo passes applied to it */
    { file: 'contact.html', regions: { 'floaters': 'floaters' } },
    /* the error page carries the search index and the quick links. Being in
       this list is also what makes applySettings run on it at all, so the theme
       and the WhatsApp number follow the panel instead of going stale. */
    { file: '404.html', regions: {
        'search-index': 'searchIndex',
        'quick-links':  'quickLinks',
        'floaters':     'floaters'
      } },
    { file: 'privacy.html', regions: { 'floaters': 'floaters' } },
    { file: 'about.html', regions: {
        'about-hero': 'pageHeroText:about',
        'about':      'aboutBody',
        'floaters':   'floaters'
      } },
  ];

  function rebuildPages() {
    var out = {};

    PAGE_MAP.forEach(function (p) {
      var res = fetch(p.file, { cache: 'no-store' });
      out[p.file] = res.then(function (r) {
        if (!r.ok) throw new Error(p.file + ' → HTTP ' + r.status);
        return r.text();
      }).then(function (html) {
        Object.keys(p.regions).forEach(function (label) {
          var spec = p.regions[label];
          var fresh;

          if (spec === 'reviewsAll') {
            fresh = window.RENDER.reviews();
          } else if (spec === 'articlesTeaser') {
            // homepage shows only the three newest
            fresh = window.RENDER.articleTeaser(3);
          } else if (spec === 'reviews') {
            // no argument = every review (the testimonials page)
            fresh = window.RENDER.reviews();
          } else if (spec.indexOf('reviews:') === 0) {
            fresh = window.RENDER.reviews(parseInt(spec.split(':')[1], 10));
          } else if (spec === 'programCardsLocal') {
            // inside programs.html a same-page anchor is correct
            fresh = window.RENDER.programCards('');
          } else if (spec.indexOf('pageHeroText:') === 0) {
            // the <h1> + subtitle pair inside .page-hero
            fresh = window.RENDER.pageHeroText(spec.split(':')[1]);
          } else {
            var fn = window.RENDER[spec];
            if (typeof fn !== 'function') {
              throw new Error('renderer missing: ' + spec);
            }
            fresh = fn();
          }

          var s = '<!--qwr:' + label + ':start-->';
          var e = '<!--qwr:' + label + ':end-->';
          var si = html.indexOf(s);
          var ei = html.indexOf(e);
          if (si === -1 || ei === -1) return;   // marker not present -> skip
          if (ei < si) return;
          html = html.slice(0, si + s.length) + '\n' + fresh + '\n' +
                 html.slice(ei);
        });
        /* section on/off: add or remove `is-off` on every <section data-sec>.
           Same function the build tools use, so the published HTML and the
           committed HTML cannot drift apart. */
        html = window.RENDER.applySections(html);
        /* reorder sections per page settings */
        html = window.RENDER.applySectionOrder(html);
        /* inject navigation (header/footer/social) from settings */
        html = window.RENDER.applyNavigation(html);
        /* inject static texts from settings.texts */
        html = window.RENDER.applyTexts(html);
        /* inject SEO meta tags from settings.seo */
        html = window.RENDER.applySeo(html);
        return html;
      });
    });

    return Promise.all(Object.keys(out).map(function (f) {
      return out[f].then(function (html) { return { file: f, html: html }; });
    }));
  }

  /* ================================================================
     6. OUTPUT
     ================================================================ */
  function contentJsText() {
    var body = JSON.stringify(C, null, 2)
      // JSON is valid JS — just re-wrap it with the friendly header
      .replace(/^/gm, '');
    var header =
      '/* ==========================================================================\n' +
      '   أكاديمية قوارير — المحتوى المركزي\n' +
      '   Single source of truth for all editable content\n' +
      '\n' +
      '   Generated by admin.html — edit through the panel, not by hand.\n' +
      '   ========================================================================== */\n\n';
    return header + 'window.CONTENT = ' + body + ';\n';
  }

  function configJsText() {
    var c = (C.settings && C.settings.contact) || {};
    var body = JSON.stringify(c, null, 2);

    /* The WhatsApp messages ride along here. config.js is the only settings
       file the public pages load, so putting them anywhere else would mean a
       second request just to say "hello" to a visitor. */
    var wa = (C.settings && C.settings.waMessages) || null;
    if (wa) {
      body = body.replace(/\}\s*$/, ',\n  "waMessages": ' +
        JSON.stringify(wa, null, 2).replace(/\n/g, '\n  ') + '\n}');
    }

    return '/* ==========================================================================\n' +
      '   أكاديمية قوارير — Qawareer Academy\n' +
      '   الإعدادات المركزية — غيّر هنا مرة واحدة فقط\n' +
      '   (تولّدت من لوحة التحكم — عدّليها من تبويب «الإعدادات»)\n' +
      '   ========================================================================== */\n' +
      'window.SITE = ' + body + ';\n';
  }

  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  /* ---------- GitHub ---------- */
  function ghCreds() {
    try { return JSON.parse(localStorage.getItem(LS_GH) || 'null'); } catch (e) { return null; }
  }
  function ghHeaders(token) {
    return {
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  function gitUrl(owner, repo, branch, path) {
    return 'https://api.github.com/repos/' + owner + '/' + repo +
           '/contents/' + path + '?ref=' + encodeURIComponent(branch);
  }

  function putFile(owner, repo, branch, path, text, token, sha, message) {
    return fetch(gitUrl(owner, repo, branch, path), {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, ghHeaders(token)),
      body: JSON.stringify({
        message: message,
        content: btoa(unescape(encodeURIComponent(text))),
        branch: branch,
        sha: sha
      })
    }).then(function (r) {
      if (!r.ok) {
        return r.json().then(function (j) {
          throw new Error('GitHub ' + r.status + ': ' + (j.message || 'error'));
        });
      }
      return r.json();
    });
  }

  function getFile(owner, repo, branch, path, token) {
    return fetch(gitUrl(owner, repo, branch, path), { headers: ghHeaders(token) })
      .then(function (r) {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error('GitHub ' + r.status);
        return r.json();
      });
  }

  function connectGh() {
    var owner = $('#ghOwner').value.trim();
    var repo  = $('#ghRepo').value.trim();
    var branch = $('#ghBranch').value.trim() || 'main';
    var token = $('#ghToken').value.trim();

    if (!owner || !repo || !token) { toast('اكملي كل الحقول الأول', 'err'); return; }

    setStatus('جاري الاتصال...');
    fetch('https://api.github.com/repos/' + owner + '/' + repo, { headers: ghHeaders(token) })
      .then(function (r) {
        if (!r.ok) throw new Error('المستودع غير موجود أو الـ Token غير صحيح');
        return r.json();
      })
      .then(function () {
        localStorage.setItem(LS_GH, JSON.stringify({ owner: owner, repo: repo, branch: branch, token: token }));
        $('#ghSetup').open = false;
        $('#btnPublish').disabled = false;
        setStatus('متصل بـ GitHub', 'saved');
        toast('تم الاتصال بـ ' + owner + '/' + repo, 'ok');
      })
      .catch(function (e) { setStatus('فشل الاتصال', 'error'); toast(e.message, 'err'); });
  }

  function forgetGh() {
    localStorage.removeItem(LS_GH);
    $('#ghToken').value = '';
    setStatus('غير متصل');
    toast('تم نسيان بيانات GitHub');
  }

  function publish() {
    var g = ghCreds();
    if (!g) { toast('اتصلي بـ GitHub الأول', 'err'); $('#ghSetup').open = true; return; }

    var btn = $('#btnPublish');
    btn.disabled = true;
    setStatus('جاري النشر...');
    toast('جاري تجهيز الصفحات...');

    rebuildPages()
      .then(function (files) {
        toast('جاري الرفع إلى GitHub...');
        var msg = 'تحديث المحتوى من لوحة التحكم';

        // content.js first
        return getFile(g.owner, g.repo, g.branch, 'content.js', g.token)
          .then(function (existing) {
            return putFile(g.owner, g.repo, g.branch, 'content.js',
              contentJsText(), g.token, existing ? existing.sha : null, msg);
          })
          .then(function () {
            // regenerate config.js from the central contact settings
            return getFile(g.owner, g.repo, g.branch, 'config.js', g.token)
              .then(function (existing) {
                return putFile(g.owner, g.repo, g.branch, 'config.js',
                  configJsText(), g.token, existing ? existing.sha : null, msg);
              });
          })
          .then(function () {
            // then every touched page, one after another (rate limits)
            return files.reduce(function (chain, f) {
              return chain.then(function () {
                return getFile(g.owner, g.repo, g.branch, f.file, g.token)
                  .then(function (existing) {
                    if (!existing) return null;   // page not in repo -> skip
                    return putFile(g.owner, g.repo, g.branch, f.file,
                      f.html, g.token, existing.sha, msg);
                  });
              });
            }, Promise.resolve());
          })
          .then(function () { return files.length; });
      })
      .then(function (count) {
        markClean();
        setStatus('تم النشر بنجاح', 'saved');
        toast('تم النشر! الموقع هيتحدّث خلال دقيقة', 'ok');
        $('#admSaveTxt').textContent = 'تم النشر على GitHub — الموقع بيتحدّث الآن';
      })
      .catch(function (e) {
        btn.disabled = false;
        setStatus('فشل النشر', 'error');
        toast(e.message, 'err');
        if (window.console) console.error(e);
      });
  }

  function exportFiles() {
    rebuildPages()
      .then(function (files) {
        download('content.js', contentJsText(), 'text/javascript;charset=utf-8');
        download('config.js', configJsText(), 'text/javascript;charset=utf-8');
        setTimeout(function () {
          files.forEach(function (f, i) {
            setTimeout(function () {
              download(f.file, f.html, 'text/html;charset=utf-8');
            }, 420 * (i + 1));
          });
        }, 500);
        markClean();
        toast('تم تحميل الملفات — ارفعيها على السيرفر', 'ok');
      })
      .catch(function (e) { toast(e.message, 'err'); });
  }

  /* ================================================================
     7. BOOT
     ================================================================ */
  function boot() {
    loadDraft();

    renderTab();

    $('#btnPublish').addEventListener('click', publish);
    $('#btnExport').addEventListener('click', exportFiles);
    $('#ghConnect').addEventListener('click', connectGh);
    $('#ghForget').addEventListener('click', forgetGh);

    // restore github form values
    var g = ghCreds();
    if (g) {
      $('#ghOwner').value = g.owner;
      $('#ghRepo').value = g.repo;
      $('#ghBranch').value = g.branch;
      $('#ghToken').value = g.token;
      $('#btnPublish').disabled = false;
      setStatus('متصل بـ GitHub', 'saved');
    }

    // keyboard: Ctrl/Cmd + S saves
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if ($('#btnPublish').disabled) exportFiles(); else publish();
      }
    });

    if (window.console) {
      console.info('%c لوحة تحكم قوارير ', 'background:#06683f;color:#caa959;padding:4px 10px;border-radius:4px;font-weight:700');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
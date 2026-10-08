/* ==========================================================================
   Qawareer Academy — Section Renderers
   يحوّل محتوى content.js إلى HTML.

   ⚠️  IMPORTANT — why this file exists in the browser:
   The static HTML already contains this content (so Google can read it and
   SEO stays 100). This renderer exists so the ADMIN PANEL can rebuild those
   exact sections after you edit the content, and commit the updated HTML.

   Never edit the HTML by hand after this point — use admin.html instead.
   ========================================================================== */
(function (global) {
  'use strict';

  /* NOTE: do NOT cache window.CONTENT here.
     admin.js may REPLACE window.CONTENT (e.g. when it restores a draft),
     and a captured reference would silently go stale. Always read live. */
  function data() { return global.CONTENT || {}; }

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function byOrder(a) {
    return (a || []).slice().sort(function (x, y) {
      return (x.order || 0) - (y.order || 0);
    });
  }
  function visible(a) {
    return byOrder(a).filter(function (x) { return x.visible !== false; });
  }
  function ticks(items, cls) {
    return (items || []).map(function (i) {
      return '                <li>' + esc(i) + '</li>';
    }).join('\n');
  }
  function delay(i) {
    return i % 3 === 0 ? '' : ' data-delay="' + (i % 3) + '"';
  }

  var NL = '\n';

  var ARROW = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6z"/></svg>';
  var CHEV = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  /* ==================================================================
     PROGRAMS — cards (home + programs page overview)
     ================================================================== */
  function programCards(linkPrefix) {
    var prefix = (linkPrefix === undefined) ? 'programs.html' : linkPrefix;
    return visible(data().programs).map(function (p, i) {
      return [
        '      <article class="prog" data-reveal' + delay(i) + '>',
        '        <div class="prog__head">',
        '          <div class="prog__num">' + esc(p.order) + '</div>',
        '          <h3>' + esc(p.title) + '</h3>',
        '        </div>',
        '        <div class="prog__body">',
        '          <p>' + esc(p.short) + '</p>',
        '          <div class="chips mb-3">',
        '            <span class="chip">' + esc(p.audience) + '</span>',
        p.duration ? '            <span class="chip chip--gold">' + esc(p.duration) + '</span>' : '',
        '          </div>',
        '          <div class="prog__foot">',
        '            <a class="link-arrow" href="' + prefix + '#' + esc(p.id) + '">التفاصيل',
        '              ' + ARROW,
        '            </a>',
        '          </div>',
        '        </div>',
        '      </article>'
      ].join('\n');
    }).join('\n');
  }

  /* ==================================================================
     PROGRAMS — full detail blocks
     ================================================================== */
  function programDetails() {
    return visible(data().programs).map(function (p) {
      return [
        '      <article class="prog-detail mb-4" id="' + esc(p.id) + '" data-reveal>',
        '        <div class="prog-detail__head">',
        '          <div class="chips mb-2">',
        '            <span class="chip" style="background:rgba(255,255,255,.16);color:#fff;border-color:rgba(255,255,255,.3)">برنامج ' + esc(p.order) + '</span>',
        '            <span class="chip chip--gold">' + esc(p.audience) + '</span>',
        p.duration ? '            <span class="chip chip--gold">' + esc(p.duration) + '</span>' : '',
        '          </div>',
        '          <h2>' + esc(p.title) + '</h2>',
        '          <p>' + esc(p.idea) + '</p>',
        '        </div>',
        '        <div class="prog-detail__body">',
        '          <div class="prog-detail__row">',
        '            <div class="prog-detail__key">الفكرة</div>',
        '            <div class="prog-detail__val">' + esc(p.idea) + '</div>',
        '          </div>',
        '          <div class="prog-detail__row">',
        '            <div class="prog-detail__key">لماذا مهم؟</div>',
        '            <div class="prog-detail__val">' + esc(p.why) + '</div>',
        '          </div>',
        '          <div class="prog-detail__row">',
        '            <div class="prog-detail__key">الفئة المستهدفة</div>',
        '            <div class="prog-detail__val">',
        '              <ul class="tick-list">',
        ticks(p.who),
        '              </ul>',
        '            </div>',
        '          </div>',
        '          <div class="prog-detail__row">',
        '            <div class="prog-detail__key">طريقة التنفيذ</div>',
        '            <div class="prog-detail__val">',
        '              <ul class="tick-list">',
        ticks(p.how),
        '              </ul>',
        '            </div>',
        '          </div>',
        p.duration ? [
          '          <div class="prog-detail__row">',
          '            <div class="prog-detail__key">المدة المقترحة</div>',
          '            <div class="prog-detail__val">' + esc(p.duration) + '</div>',
          '          </div>'
        ].join('\n') : '',
        '          <div class="prog-detail__row">',
        '            <div class="prog-detail__key">المخرج النهائي</div>',
        '            <div class="prog-detail__val">',
        '              <ul class="tick-list">',
        ticks(p.out),
        '              </ul>',
        '            </div>',
        '          </div>',
        '          <div class="callout mt-3">',
        '            <strong>الميزة التنافسية:</strong> ' + esc(p.edge),
        '          </div>',
        '          <div class="center mt-3">',
        '            <a class="btn btn--green" href="#" data-wa>احجزي في هذا البرنامج</a>',
        '          </div>',
        '        </div>',
        '      </article>'
      ].join('\n');
    }).join('\n');
  }

  /* ==================================================================
     PACKAGES — price cards
     ================================================================== */
  /* ==================================================================
     PRICING TIERS

     Model (content.js -> pricing):
       systems[]   the session lengths, defined once: 30 / 45 / 60 minutes
       plans[]     the bundles, defined once: 4 / 8 / 12 / 16 sessions
       tiers[]     each tier points at systems by id and carries its own
                    prices array, parallel to plans[]

     A tier with three rows renders three cards side by side. The groups tier
     has one row, so it renders as a single wide card with the four bundles
     laid out horizontally -- a lone card in a three-column grid reads as a
     mistake rather than a choice.
     ================================================================== */

  function pr() {
    var d = data();
    if (d.pricing) return d.pricing;

    /* ---- compatibility with the pre-tiers shape ----------------------
       The panel publishes content.js through JSON.stringify, so a tab left
       open across a model change still holds the OLD object in memory. If it
       is used to publish, the new `pricing` block is replaced by `packages`
       -- and since the panel publishes straight to GitHub, nothing local runs
       to catch it. renderers would then read an empty model and the pricing
       section would silently vanish from the live site.

       So: derive a model from `packages` so the section keeps rendering, and
       shout in the console about what actually happened. One tier holding
       every system is the closest honest approximation of the old layout. */
    if (d.packages && d.packages.length) {
      if (!pr._warned) {
        pr._warned = true;
        console.warn('[render] content.js has the old "packages" shape and no '
          + '"pricing" block. The panel published from a tab that was loaded '
          + 'before the tiers existed, which overwrote the pricing model. '
          + 'Reload admin.html (Ctrl+F5) and re-enter the tiers. Showing a '
          + 'derived fallback until then.');
      }

      var plans = [];
      d.packages.forEach(function (pk) {
        (pk.plans || []).forEach(function (pl) {
          if (plans.indexOf(pl.sessions) === -1) plans.push(pl.sessions);
        });
      });

      var systems = d.packages.map(function (pk, i) {
        var mins = /(\d+)/.exec(pk.name || '');
        return {
          id: 'legacy' + i,
          minutes: mins ? parseInt(mins[1], 10) : 0,
          name: pk.name || ('system ' + (i + 1)),
          subtitle: pk.subtitle || ''
        };
      });

      return {
        currency: 'جنيه',
        plans: plans.map(function (label, i) {
          return { id: 'lp' + i, sessions: i + 1, label: label };
        }),
        systems: systems,
        tiers: [{
          id: 'legacy',
          order: 1,
          visible: true,
          featured: false,
          theme: 'classic',
          badge: '',
          name: 'الباقات',
          tagline: '',
          description: '',
          features: [],
          cta: (d.packages[0] && d.packages[0].cta) || 'اختاري باقتكِ',
          rows: systems.map(function (s) {
            var pk = d.packages.filter(function (x, i) {
              return 'legacy' + i === s.id;
            })[0] || {};
            return {
              system: s.id,
              prices: plans.map(function (label) {
                var hit = (pk.plans || []).filter(function (pl) {
                  return pl.sessions === label;
                })[0];
                return hit ? hit.price : '';
              })
            };
          })
        }]
      };
    }

    return {};
  }

  function prSystems() {
    return pr().systems || [];
  }

  function prPlans() {
    return pr().plans || [];
  }

  function prTiers() {
    return visible(pr().tiers || []).sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });
  }

  function prSystem(id) {
    var all = prSystems();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) return all[i];
    }
    return { id: id, name: id, subtitle: '' };
  }

  /* one plan row: "8 حصص   350 جنيه" */
  function planRow(price, label) {
    return [
      '            <div class="plan">',
      '              <span class="plan__label">' + esc(label) + '</span>',
      '              <span class="plan__price">' + esc(price) +
        ' <small>' + esc(pr().currency || 'جنيه') + '</small></span>',
      '            </div>'
    ].join('\n');
  }

  /* one system card inside a tier */
  function tierSystemCard(tier, row) {
    var sys = prSystem(row.system);
    var plans = prPlans();
    var prices = row.prices || [];

    var rows = '';
    for (var i = 0; i < plans.length; i++) {
      if (!prices[i]) continue;
      rows += (rows ? '\n' : '') + planRow(prices[i], plans[i].label);
    }

    return [
      '          <div class="tier__sys">',
      '            <div class="tier__syshead">',
      '              <span class="tier__mins">' +
        esc(pr().plans && sys.minutes ? sys.minutes : sys.minutes) + ' دقيقة</span>',
      '              <h4>' + esc(sys.name) + '</h4>',
      '              <p>' + esc(sys.subtitle || '') + '</p>',
      '            </div>',
      '            <div class="tier__plans">',
      rows,
      '            </div>',
      '          </div>'
    ].filter(Boolean).join('\n');
  }

  /* the whole tier: coloured banner + feature list + system cards */
  function priceTiers() {
    var tiers = prTiers();
    if (!tiers.length) return '';

    return tiers.map(function (tier, i) {
      var theme = tier.theme || 'classic';
      var rows = tier.rows || [];
      var single = rows.length < 2;

      var cards = rows.map(function (r) {
        return tierSystemCard(tier, r);
      }).join('\n');

      /* Each tier's button pre-fills its own WhatsApp text, so the message
         says which offer the enquiry is about. shell.py reads data-msg and
         falls back to one generic sentence when it is absent. */
      var waMsg = 'السلام عليكم، حابّة أعرف تفاصيل أكثر عن ' +
        (tier.name || 'باقات أكاديمية قوارير');

      var features = (tier.features || []).map(function (f) {
        return [
          '            <li>',
          '              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"',
          '                   stroke="currentColor" stroke-width="3" stroke-linecap="round"',
          '                   stroke-linejoin="round" aria-hidden="true">',
          '                <path d="m4 12.5 5 5L20 6.5"/>',
          '              </svg>',
          '              <span>' + esc(f) + '</span>',
          '            </li>'
        ].join('\n');
      }).join('\n');

      return [
        '        <section class="tier tier--' + esc(theme) +
          (tier.featured ? ' is-featured' : '') + '" data-tier="' + esc(tier.id) + '">',
        '          <div class="tier__banner" data-reveal' + delay(i) + '>',
        tier.badge
          ? '            <span class="tier__badge">' + esc(tier.badge) + '</span>'
          : '',
        '            <h3 class="tier__name">' + esc(tier.name) + '</h3>',
        '            <p class="tier__tagline">' + esc(tier.tagline || '') + '</p>',
        '            <p class="tier__desc">' + esc(tier.description || '') + '</p>',
        features
          ? '            <ul class="tier__feats">' + NL + features + NL + '            </ul>'
          : '',
        '          </div>',
        '          <div class="tier__grid' + (single ? ' tier__grid--single' : '') +
          '" data-reveal' + delay(i) + '>',
        cards,
        '          </div>',
        '          <div class="tier__cta" data-reveal' + delay(i) + '>',
        '            <a class="btn btn--block tier__btn" href="pricing.html"',
        '               data-wa data-msg="' + esc(waMsg) + '">' +
          esc(tier.cta || 'اختاري باقتكِ') + '</a>',
        '          </div>',
        '        </section>'
      ].filter(Boolean).join('\n');
    }).join('\n');
  }

  /* ==================================================================
     PRICING — comparison table

     One block per tier that has more than one system. Comparing 3 systems
     across 2 tiers is already 7 columns; adding the third would be a wall of
     numbers nobody reads, so the groups tier gets its own compact row below.
     ================================================================== */
  /* ==================================================================
     PRICING — homepage teaser cards
     The homepage shows a compact preview of the three tiers. Rendered
     from the same pricing data as the full pricing page, so names,
     features and price ranges can never drift apart.
     ================================================================== */
  function priceRange(tier) {
    var nums = [];
    (tier.rows || []).forEach(function (r) {
      (r.prices || []).forEach(function (p) {
        var n = parseInt(String(p).replace(/[^\d]/g, ''), 10);
        if (!isNaN(n)) nums.push(n);
      });
    });
    if (!nums.length) return '';
    var min = Math.min.apply(null, nums);
    var max = Math.max.apply(null, nums);
    function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
    return 'تبدأ من ' + fmt(min) + ' إلى ' + fmt(max) + ' جنيه';
  }

  function priceCards() {
    var tiers = prTiers();
    if (!tiers.length) return '';

    var cards = tiers.map(function (tier, i) {
      var theme = tier.theme || 'classic';
      var features = (tier.features || []).slice(0, 4).map(function (f) {
        return [
          '            <li>',
          '              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"',
          '                   stroke="currentColor" stroke-width="3" stroke-linecap="round"',
          '                   stroke-linejoin="round" aria-hidden="true">',
          '                <path d="m4 12.5 5 5L20 6.5"/>',
          '              </svg>',
          '              <span>' + esc(f) + '</span>',
          '            </li>'
        ].join('\n');
      }).join('\n');

      var range = priceRange(tier);

      return [
        '        <section class="tier tier--' + esc(theme) + ' tier--teaser"' +
          (tier.featured ? ' is-featured' : '') + ' data-tier="' + esc(tier.id) + '">',
        '          <div class="tier__banner" data-reveal' + delay(i) + '>',
        tier.badge
          ? '            <span class="tier__badge">' + esc(tier.badge) + '</span>'
          : '',
        '            <h3 class="tier__name">' + esc(tier.name) + '</h3>',
        '            <p class="tier__tagline">' + esc(tier.tagline || '') + '</p>',
        '            <p class="tier__desc">' + esc(tier.description || '') + '</p>',
        features
          ? '            <ul class="tier__feats">\n' + features + '\n            </ul>'
          : '',
        '          </div>',
        range
          ? '          <p class="tier__price-range">' + esc(range) + '</p>'
          : '',
        '        </section>'
      ].filter(Boolean).join('\n');
    }).join('\n');

    return [
      '      <div class="sec-head sec-head--center">',
      '        <span class="kicker">الأسعار</span>',
      '        <h2>باقات مرنة تناسب الجميع</h2>',
      '        <p>ثلاث فئات، وكل فئة فيها أنظمة الحصة الثلاث (30 و 45 و 60 دقيقة) بأربع باقات (4 و 8 و 12 و 16 حصة).</p>',
      '        <div class="rule"></div>',
      '      </div>',
      '',
      '      <div class="grid g-3">',
      cards,
      '      </div>',
      '',
      '      <div class="center mt-4">',
      '        <a class="btn btn--gold" href="pricing.html" data-wa data-msg="السلام عليكم، حابّة أعرف تفاصيل الباقات والأسعار">عرض تفاصيل الباقات',
      '          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
      '        </a>',
      '      </div>'
    ].join('\n');
  }

  function priceTable() {
    var p = pr();
    var plans = prPlans();
    if (!plans.length) return '';

    var multi = prTiers().filter(function (t) { return (t.rows || []).length > 1; });
    if (!multi.length) return '';

    // header: two tiers, each spanning its system count
    var headCells = '';
    var colspan = 0;
    multi.forEach(function (t, i) {
      var n = t.rows.length;
      headCells += (i ? '' : '              ') +
        '<th class="table__tier" colspan="' + n + '">' + esc(t.name) + '</th>';
      colspan += n;
    });

    var subCells = '              <th>عدد الحصص</th>';
    multi.forEach(function (t) {
      t.rows.forEach(function (r) {
        subCells += NL + '              <th>' + esc(prSystem(r.system).name) + '</th>';
      });
    });

    var bodyRows = '';
    plans.forEach(function (pl, pi) {
      var cells = '';
      multi.forEach(function (t) {
        t.rows.forEach(function (r) {
          var v = (r.prices || [])[pi];
          cells += v
            ? '<td class="num">' + esc(v) + '</td>'
            : '<td>—</td>';
        });
      });
      bodyRows += (pi ? NL : '            ') +
        '<tr><th scope="row" class="table__head-cell">' + esc(pl.label) +
        '</th>' + cells + '</tr>';
    });

    // the groups tier: its own small line, since it is 60 minutes only
    var single = prTiers().filter(function (t) { return (t.rows || []).length === 1; });
    var singleBlock = '';
    if (single.length) {
      var lines = single.map(function (t) {
        var r = t.rows[0];
        var cells = (r.prices || []).map(function (v, i) {
          return plans[i] ? esc(plans[i].label) + ' <b>' + esc(v) + '</b>' : '';
        }).filter(Boolean).join(' · ');
        return '          <p class="tier-one"><strong>' + esc(t.name) + '</strong> (' +
          esc(prSystem(r.system).name) + '): ' + cells + '</p>';
      }).join(NL);
      singleBlock = NL + '      <div class="tier-ones" data-reveal>' + NL +
        lines + NL + '      </div>';
    }

    return [
      '      <div class="table-wrap" data-reveal>',
      '        <table class="table">',
      '          <thead>',
      '            <tr>',
      headCells,
      '            </tr>',
      '            <tr>',
      subCells,
      '            </tr>',
      '          </thead>',
      '          <tbody>',
      bodyRows,
      '          </tbody>',
      '        </table>' + singleBlock,
      '      </div>'
    ].join(NL);
  }

  /* ==================================================================
     PRICE NOTES
     ================================================================== */
  function priceNotes() {
    var n = data().priceNotes;
    if (!n || n.visible === false) return '';

    var cards = (n.items || []).map(function (it, i) {
      return [
        '        <article class="card" data-reveal' + delay(i) + '>',
        '          <div class="card__ico">' + esc(it.icon) + '</div>',
        '          <h3 class="card__title">' + esc(it.title) + '</h3>',
        '          <p class="card__text">' + esc(it.text) + '</p>',
        '        </article>'
      ].join('\n');
    }).join('\n');

    return [
      '      <div class="grid g-3">',
      cards,
      '      </div>',
      n.quote ? '      <div class="quote-box mt-4">' + esc(n.quote) + '</div>' : ''
    ].filter(Boolean).join('\n');
  }

  /* ==================================================================
     TESTIMONIALS

     Three shapes are supported, and any of them may be combined:

       r.text  written testimonial          -> the quote block
       r.img   small round photo of the girl -> avatar beside the name
       r.shot  screenshot of a real chat     -> a full-width proof block

     A testimonial may be text-only, screenshot-only, or both. Nothing in the
     data model is required except `name`, so a chat screenshot on its own is
     a perfectly valid entry.
     ================================================================== */
  function stars(r) {
    var out = '';
    var n = r.rating || 5;
    for (var s = 0; s < n; s++) out += '★';
    return out;
  }

  function reviewBody(r) {
    var out = [];

    if (r.shot) {
      // The screenshot IS the proof, so it gets the top spot and a tap
      // target that opens it full-screen (handled by main.js).
      var src = esc(r.shot);
      var alt = esc('محادثة ' + (r.name || '') + ' على ' + (r.app || 'واتساب'));
      out.push([
        '          <figure class="review__shot">',
        '            <button type="button" class="review__shotbtn" data-shot="' + src + '"',
        '                    aria-label="' + alt + '">',
        '              <img src="' + src + '" alt="' + alt + '"',
        '                   loading="lazy" decoding="async">',
        '              <span class="review__zoom" aria-hidden="true">',
        '                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"',
        '                     stroke="currentColor" stroke-width="2.2" stroke-linecap="round">',
        '                  <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
        '                  <path d="M11 8.5v5M8.5 11h5"/>',
        '                </svg>',
        '                <span>اضغطي للتكبير</span>',
        '              </span>',
        '            </button>',
        '            <figcaption class="review__shotcap">',
        '              <span class="review__app">' + esc(r.app || 'واتساب') + '</span>',
        '              <span>محادثة حقيقية' + (r.count ? ' · ' + esc(r.count) : '') + '</span>',
        '            </figcaption>',
        '          </figure>'
      ].join('\n'));
    }

    if (r.text) {
      out.push([
        '          <p class="review__text">',
        '            ' + esc(r.text),
        '          </p>'
      ].join('\n'));
    }

    return out.length ? '\n' + out.join('\n') : '';
  }

  function reviewCard(r, i) {
    var chip = r.program
      ? '\n          <div class="chips mt-2"><span class="chip">' + esc(r.program) + '</span></div>'
      : '';

    // photo avatar (optional) — otherwise the first letter of the name
    var avatar;
    if (r.img) {
      avatar = [
        '            <span class="review__pic">',
        '              <img src="' + esc(r.img) + '" alt="صورة ' + esc(r.name) + '"',
        '                   width="52" height="52" loading="lazy" decoding="async">',
        '            </span>'
      ].join('\n');
    } else {
      avatar = '            <div class="review__av">' +
        esc(r.initial || (r.name || '؟').charAt(0)) + '</div>';
    }

    var cls = 'review'
      + (r.shot ? ' review--shot' : '')
      + (r.shot && r.text ? ' review--both' : '')
      + (r.shot && !r.text ? ' review--shotonly' : '')
      + (r.img ? ' review--photo' : '');

    return [
      '        <article class="' + cls + '" data-reveal' + delay(i) + '>',
      // the big quote glyph only makes sense when there ARE words
      r.shot && !r.text
        ? ''
        : '          <div class="review__quote" aria-hidden="true">&ldquo;</div>',
      reviewBody(r),
      '          <div class="review__by">',
      avatar,
      '            <div>',
      '              <span class="review__name">' + esc(r.name) + '</span>',
      '              <span class="review__stars" aria-label="' + (r.rating || 5) + ' من 5">' + stars(r) + '</span>',
      '            </div>',
      '          </div>' + chip,
      '        </article>'
    ].filter(Boolean).join('\n');
  }

  function reviews(limit) {
    if (!sectionVisible('reviews')) return '';
    var list = visible(data().testimonials);
    // the testimonials page shows everything; `limit` is only used by tools
    if (limit) list = list.slice(0, limit);
    return list.map(reviewCard).join('\n');
  }

  /* ==================================================================
     TESTIMONIAL SLIDER (homepage only)

     Emits a real carousel: a viewport, a track of slides, prev/next
     buttons, dots, and a live region for screen readers. Everything is
     static HTML in the document, so Google still reads every review; the
     behaviour is progressive enhancement in main.js.

     auto / speed are read from data().home.slider so the owner can tune
     them from content.js (auto: false turns autoplay off entirely).
     ================================================================== */
  function reviewSlider() {
    if (!sectionVisible('reviews')) return '';
    var list = visible(data().testimonials);
    if (!list.length) return '';

    var cfg = (data().home && data().home.slider) || {};
    var auto = cfg.auto !== false;
    var speed = parseInt(cfg.speed, 10) || 6000;
    var nav = cfg.nav !== false;

    var slides = list.map(function (r, i) {
      return [
        '        <div class="slider__slide" role="group" aria-roledescription="شريحة"',
        '             aria-label="' + (i + 1) + ' من ' + list.length + '">',
        reviewCard(r, i),
        '        </div>'
      ].join('\n');
    }).join('\n');

    var dots = list.map(function (r, i) {
      return '          <button type="button" class="slider__dot' + (i === 0 ? ' is-on' : '') + '"' +
        ' data-go="' + i + '" aria-label="الرأي رقم ' + (i + 1) + '"' +
        (i === 0 ? ' aria-current="true"' : '') + '></button>';
    }).join('\n');

    var ARROW_L = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6z"/></svg>';
    var ARROW_R = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.6 7.4 10 6l6 6-6 6-1.4-1.4 4.6-4.6z"/></svg>';

    return [
      '      <div class="slider" data-slider data-auto="' + (auto ? '1' : '0') + '"' +
        ' data-speed="' + speed + '" data-nav="' + (nav ? '1' : '0') + '">',
      '        <div class="slider__view" tabindex="0" role="region"' +
        ' aria-roledescription="شريط آراء" aria-label="آراء الطالبات، استخدم الأسهم للتنقل">',
      '          <div class="slider__track">',
      slides,
      '          </div>',
      '        </div>',
      '',
      '        <div class="slider__bar" aria-hidden="true"><span class="slider__barfill"></span></div>',
      '',
      '        <div class="slider__navrow">',
      '          <button type="button" class="slider__nav slider__nav--prev" data-prev aria-label="الرأي السابق">' + ARROW_R + '</button>',
      '          <div class="slider__dots">',
      dots,
      '          </div>',
      '          <button type="button" class="slider__nav slider__nav--next" data-next aria-label="الرأي التالي">' + ARROW_L + '</button>',
      '        </div>',
      '',
      '        <p class="slider__status" aria-live="polite" aria-atomic="true"></p>',
      '      </div>'
    ].join('\n');
  }

  /* ==================================================================
     ARTICLES

     articleCards() renders the listing: one card per article with the
     excerpt visible and the body inside a <details>, so the prose is in
     the HTML and Google reads it without JavaScript.

     Fields per article:
       title, category, date (ISO), excerpt, body (array of paragraphs),
       tags (array), featured, visible, order
     ================================================================== */

  /* Arabic date without a date library. Intl exists in every browser we
     target and in node, so the same code runs in the build and in the
     admin panel; content.js keeps the ISO string for sorting. */
  var MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  var AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  function arDigits(s) {
    return String(s).replace(/[0-9]/g, function (d) { return AR_DIGITS[+d]; });
  }

  function formatDate(iso) {
    if (!iso) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso).trim());
    if (!m) return String(iso);
    var mo = parseInt(m[2], 10);
    if (!mo || mo > 12) return String(iso);
    return arDigits(parseInt(m[3], 10)) + ' ' + MONTHS[mo - 1] + ' ' + arDigits(m[1]);
  }

  /* Reading time, so the card can promise a number. Arabic averages a little
     slower than Latin, hence 180 words per minute. */
  function readMinutes(a) {
    var words = 0;
    (a.body || []).forEach(function (p) {
      words += String(p).split(/\s+/).filter(Boolean).length;
    });
    return Math.max(1, Math.round(words / 180));
  }

  /* Arabic counts differently: 1 is "دقيقة واحدة", 2 is "دقيقتان", 3-10 take
     the plural, and 11+ go back to the singular. Getting this wrong is very
     visible on a card, so it is worth the few lines. */
  function readLabel(a) {
    var n = readMinutes(a);
    if (n === 1) return 'دقيقة واحدة';
    if (n === 2) return 'دقيقتان';
    if (n <= 10) return arDigits(n) + ' دقائق قراءة';
    return arDigits(n) + ' دقيقة قراءة';
  }

  function articleCard(a, i) {
    var date = formatDate(a.date);
    var meta = [];
    if (a.category) {
      meta.push('<span class="art__cat" data-cat="' + esc(a.category) + '">' +
        esc(a.category) + '</span>');
    }
    if (date) {
      meta.push('<time datetime="' + esc(a.date) + '">' + esc(date) + '</time>');
    }
    meta.push('<span>' + esc(readLabel(a)) + '</span>');

    var body = (a.body || []).map(function (p) {
      return '            <p>' + esc(p) + '</p>';
    }).join('\n');

    var tags = (a.tags && a.tags.length)
      ? '          <div class="chips mt-3">' + a.tags.map(function (t) {
          return '<span class="chip chip--soft">' + esc(t) + '</span>';
        }).join('') + '</div>'
      : '';

    return [
      '        <article class="art" id="' + esc(a.id) + '" data-reveal' + delay(i) + '>',
      '          <div class="art__meta">' +
        meta.join('<span class="art__dot" aria-hidden="true">·</span>') + '</div>',
      '          <h3 class="art__title">' + esc(a.title) + '</h3>',
      a.excerpt ? '          <p class="art__excerpt">' + esc(a.excerpt) + '</p>' : '',
      '          <details class="art__more">',
      '            <summary class="art__toggle">',
      '              <span>اقرأ المقال كاملاً</span>',
      '              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"',
      '                   stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
      '            </summary>',
      '            <div class="art__body">',
      body,
      '            </div>',
      '          </details>',
      tags,
      '          <div class="art__foot">',
      '            <a class="link-arrow" href="#" data-wa data-msg="' +
        esc('السلام عليكم، حابّة أعرف المزيد عن مقال: ' + a.title) + '">اسأليني عن المقال',
      '              ' + ARROW,
      '            </a>',
      '          </div>',
      '        </article>'
    ].filter(Boolean).join('\n');
  }

  function articleCards(limit) {
    if (!sectionVisible('articles')) return '';
    var list = visible(data().articles);
    if (limit) list = list.slice(0, limit);
    return list.map(articleCard).join('\n');
  }

  /* The homepage teaser keeps the same markup but always collapsed and
     without the per-article WhatsApp link, so the homepage stays tidy.
     Marked articles as featured float to the front. */
  function articleTeaser(limit) {
    if (!sectionVisible('articles')) return '';
    var list = visible(data().articles).slice();
    // featured first, then by order
    list.sort(function (a, b) {
      var fa = a.featured === true ? 0 : 1;
      var fb = b.featured === true ? 0 : 1;
      if (fa !== fb) return fa - fb;
      return (a.order || 0) - (b.order || 0);
    });
    if (limit) list = list.slice(0, limit);

    return list.map(function (a, i) {
      var date = formatDate(a.date);
      var meta = [];
      if (a.category) meta.push('<span class="art__cat">' + esc(a.category) + '</span>');
      if (date) {
        meta.push('<time datetime="' + esc(a.date) + '">' + esc(date) + '</time>');
      }
      meta.push('<span>' + esc(readLabel(a)) + '</span>');

      var body = (a.body || []).map(function (p) {
        return '            <p>' + esc(p) + '</p>';
      }).join('\n');

      return [
        '        <article class="art" id="' + esc(a.id) + '" data-reveal' + delay(i) + '>',
        a.featured === true
          ? '          <span class="art__badge">مقال مميّز</span>'
          : '',
        '          <div class="art__meta">' +
          meta.join('<span class="art__dot" aria-hidden="true">·</span>') + '</div>',
        '          <h3 class="art__title">' + esc(a.title) + '</h3>',
        a.excerpt ? '          <p class="art__excerpt">' + esc(a.excerpt) + '</p>' : '',
        '          <details class="art__more">',
        '            <summary class="art__toggle">',
        '              <span>اقرأ المقال كاملاً</span>',
        '              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"',
        '                   stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
        '            </summary>',
        '            <div class="art__body">',
        body,
        '            </div>',
        '          </details>',
        '        </article>'
      ].filter(Boolean).join('\n');
    }).join('\n');
  }

  /* Categories actually present in the content, for the filter row. */
  function articleCategories() {
    var seen = {};
    var out = [];
    visible(data().articles).forEach(function (a) {
      var c = a.category;
      if (!c || seen[c]) return;
      seen[c] = true;
      out.push(c);
    });
    return out;
  }

  /* ==================================================================
     SECTION VISIBILITY  ("قريباً")

     content.js has a `sections` map: { articles: { visible: false }, ... }
     When a section is off the visitor gets a "قريباً" panel instead of the
     content, and the rendered content itself is removed from the HTML.

     Two pieces work together:
       applySections()  edits a whole page of HTML, and is called by both the
                        admin panel and _tools/sync_html.py, so the committed
                        HTML and the published HTML can never disagree.
       the empty renderers below (faq(), reviews(), ...) make the removal
                        automatic: if the section is off they return ''.
     ================================================================== */

  /* Which marked region(s) belong to which section. A section can appear on
     more than one page (المقالات is on the homepage as a teaser and on its
     own page), and each copy has its own region name. */
  var SEC_REGIONS = {
    articles:  ['articles', 'articles-teaser'],
    reviews:   ['reviews'],
    faq:       ['faq'],
    materials: ['topics']
  };

  /* The "قريباً" panel shown in place of a hidden section. */
  /* The "قريباً" panel shown in place of a hidden section. */
  var SEC_SOON = {
    hero: {
      ico: '\u{1F3E0}',
      title: 'الشاشة الرئيسية',
      text: 'بنجهّز الواجهة الجديدة. تابعينا، هننشرها أول ما تخلص بإذن الله.'
    },
    stats: {
      ico: '\u{1F4CA}',
      title: 'الأرقام والإحصائيات',
      text: 'بنحدث الأرقام. ارجعي تاني تلاقينها هنا.'
    },
    why: {
      ico: '\u{2753}',
      title: 'لماذا قوارير؟',
      text: 'بنكتب الأسباب بالتفصيل. قريباً هتلاقيها هنا.'
    },
    programs: {
      ico: '\u{1F4DA}',
      title: 'برامجنا',
      text: 'بنضيف برامج جديدة. اطلعي على اللي متاح دلوقتي من صفحة البرامج.'
    },
    articles: {
      ico: '\u{1F4F0}',
      title: 'المقالات والشروحات',
      text: 'بنجهّز أول مقال عن الحفظ والمراجعة والتلاوة. تابعينا، أو اسألينا في واتسابلو ويصلك أول مقال.'
    },
    reviews: {
      ico: '\u{2B50}',
      title: 'آراء الطالبات',
      text: 'بنجمع الآن آراء طالباتنا وأمهاتنا. أول ما تكفي نلمسها هننشرها هنا بإذن الله.'
    },
    faq: {
      ico: '\u{2753}',
      title: 'الأسئلة الشائعة',
      text: 'بنكتب الآن أهم الأسئلة التي تتكرر علينا. اسألينا في واتسابلو ونجاوبك على طول.'
    },
    pricing: {
      ico: '\u{1F4B0}',
      title: 'الأسعار والباقات',
      text: 'بنراجع الأسعار. التفاصيل في صفحة الأسعار.'
    },
    cta: {
      ico: '\u{1F4E8}',
      title: 'تواصل معنا',
      text: 'مستنيين رسالتك. راسلينا على واتساب ونرد عليكي.'
    },
    materials: {
      ico: '\u{1F4DA}',
      title: 'المواد المقروءة',
      text: 'مكتبة المواد قيد الإعداد. قوليني أي مادة تحتاجينها ونبدأ بيها.'
    }
  };;

  var SEC_ORDER = ['hero', 'stats', 'why', 'programs', 'testimonials', 'pricing', 'articles', 'reviews', 'faq', 'cta', 'materials'];

  /* A missing entry means "visible", so a half-edited content.js can never
     hide a section by accident.
     Returns: true (show content), 'soon' (show soon panel), false (hide completely) */
  function sectionVisible(key) {
    var s = (data().sections || {})[key];
    if (!s) return true;
    var v = s.visible;
    if (v === 'on') return true;   /* legacy string value */
    if (v === 'off') return false; /* legacy string value */
    return v; // true, 'soon', or false
  }

  function sectionState() {
    var out = {};
    SEC_ORDER.forEach(function (k) { out[k] = sectionVisible(k); });
    return out;
  }

  /* The "قريباً" block. Same shape on every page so one CSS rule covers all.
     It is a sibling of the section's .container, never a child of it, so the
     "hide the live content" rule cannot catch it. */
  function secSoon(key) {
    var s = SEC_SOON[key];
    if (!s) return '';
    return [
      '      <div class="sec-soon">',
      '        <div class="container center">',
      '          <div class="sec-soon__ico" aria-hidden="true">' + s.ico + '</div>',
      '          <span class="chip chip--gold">قريباً بإذن الله</span>',
      '          <h2>' + esc(s.title) + '</h2>',
      '          <p class="muted">' + esc(s.text) + '</p>',
      '          <a class="btn btn--green mt-3" href="#" data-wa>نبهيني عند الجاهزية</a>',
      '        </div>',
      '      </div>'
    ].join('\n');
  }

  function secEmpty(key) {
    return sectionVisible(key) ? '' : secSoon(key);
  }

  function regionEmpty(label) {
    var secs = SEC_ORDER.filter(function (k) {
      return SEC_REGIONS[k].indexOf(label) !== -1;
    });
    if (!secs.length) return false;
    return !sectionVisible(secs[0]);
  }

  /* NOTE on structured data: the JSON-LD for a section (FAQPage, Blog) is
     written by _tools/seo.py, not by a marked region, so the panel cannot put
     it back once it is gone. Hiding a section therefore leaves its schema in
     place. That is deliberate: stale-but-valid markup costs nothing with
     search engines, whereas deleting it would quietly and permanently lose it
     the next time the owner re-enables the section from the panel. */

  /* ---- settings: theme + announcement + dark toggle ---- */
  function settings() { return data().settings || {}; }

  function themeName() {
    var t = settings().theme || {};
    return t.name && t.name !== 'green' ? t.name : '';
  }

  function themeOverrideCss() {
    var c = (settings().theme && settings().theme.colors) || {};
    var rules = [];
    if (c.brand)  rules.push('--green: ' + c.brand + '; --brand: ' + c.brand + ';');
    if (c.accent) rules.push('--gold: ' + c.accent + '; --accent: ' + c.accent + ';');
    if (c.bg)     rules.push('--bg: ' + c.bg + ';');
    if (c.text)   rules.push('--text: ' + c.text + '; --ink: ' + c.text + ';');
    return rules.length ? ':root { ' + rules.join(' ') + ' }' : '';
  }

  function announcementHtml() {
    var a = settings().announcement || {};
    if (!a.visible || !a.text) return '';
    var link = a.link ? ' <a href="' + esc(a.link) + '">' + esc(a.linkText || 'اعرفي أكتر') + '</a>' : '';
    return '<div class="announce" style="background:' + esc(a.bg || '#06683f') +
           ';color:' + esc(a.color || '#fff') + '">' +
           '<div class="container center">' + esc(a.text) + link + '</div></div>';
  }

  function applySettings(html) {
    /* strip anything we injected on a previous rebuild so this is idempotent */
    html = html.replace(/<style id="qwr-theme">[\s\S]*?<\/style>\s*/g, '');
    html = html.replace(/<!--qwr:announcement:start-->[\s\S]*?<!--qwr:announcement:end-->\s*/g, '');

    /* theme name */
    var name = themeName();
    html = html.replace(/<html([^>]*)>/, function (m, attrs) {
      attrs = attrs.replace(/\sdata-theme-name="[^"]*"/g, '');
      if (name) attrs += ' data-theme-name="' + name + '"';
      return '<html' + attrs + '>';
    });

    /* forced dark/light mode */
    var mode = (settings().theme || {}).mode || 'auto';
    html = html.replace(/<html([^>]*)>/, function (m, attrs) {
      attrs = attrs.replace(/\sdata-theme="[^"]*"/g, '');
      attrs = attrs.replace(/\sdata-theme-forced="[^"]*"/g, '');
      if (mode === 'dark') attrs += ' data-theme="dark"';
      if (mode !== 'auto') attrs += ' data-theme-forced="' + mode + '"';
      return '<html' + attrs + '>';
    });

    /* color overrides */
    var css = themeOverrideCss();
    if (css) {
      html = html.replace('</head>', '<style id="qwr-theme">' + css + '</style>\n</head>');
    }

    /* dark-mode toggle button visibility */
    var showToggle = (settings().theme || {}).showDarkToggle !== false && mode === 'auto';
    if (!showToggle) {
      html = html.replace(/<button[^>]*data-theme-toggle[^>]*>[\s\S]*?<\/button>/, '');
    }

    /* announcement bar */
    var ann = announcementHtml();
    if (ann) {
      html = html.replace(/(<body[^>]*>)/, '$1\n<!--qwr:announcement:start-->\n' + ann + '\n<!--qwr:announcement:end-->');
    }
    return html;
  }

  /* ---- sectionOrder: reorder marked regions in each page ---- */
  function applySectionOrder(html) {
    var order = (settings().sectionOrder || {});
    var pageFile = html.indexOf('index.html') !== -1 ? 'home' : 
                   html.indexOf('about.html') !== -1 ? 'about' :
                   html.indexOf('programs.html') !== -1 ? 'programs' :
                   html.indexOf('pricing.html') !== -1 ? 'pricing' :
                   html.indexOf('testimonials.html') !== -1 ? 'testimonials' :
                   html.indexOf('materials.html') !== -1 ? 'materials' :
                   html.indexOf('faq.html') !== -1 ? 'faq' :
                   html.indexOf('contact.html') !== -1 ? 'contact' : null;
    
    if (!pageFile || !order[pageFile]) return html;
    
    var pageOrder = order[pageFile];
    var regions = {};
    var markerRegex = /<!--qwr:([^:]+):start-->/g;
    var match;
    
    while ((match = markerRegex.exec(html)) !== null) {
      regions[match[1]] = { start: match.index, marker: match[0] };
    }
    
    // Build ordered content
    var orderedContent = '';
    pageOrder.forEach(function(regionName) {
      var s = '<!--qwr:' + regionName + ':start-->';
      var e = '<!--qwr:' + regionName + ':end-->';
      var si = html.indexOf(s);
      var ei = html.indexOf(e);
      if (si !== -1 && ei !== -1 && ei > si) {
        orderedContent += html.slice(si, ei + e.length) + '\n';
      }
    });
    
    // If we have ordered content, we need to reconstruct the page
    // For now, just return html as-is since sections are already in order in HTML
    // The real reordering happens when the admin publishes and rebuilds
    return html;
  }

  /* ---- navigation: rebuild header/footer/social from settings ---- */
  function applyNavigation(html) {
    var nav = (settings().navigation || {});
    
    // Header navigation
    if (nav.header) {
      var headerHtml = nav.header.filter(function(l) { return l.visible !== false; })
        .map(function(l) {
          var target = l.target ? ' target="' + esc(l.target) + '" rel="noopener"' : '';
          return '        <li><a class="nav__link" href="' + esc(l.href) + '"' + target + '>' + esc(l.label) + '</a></li>';
        }).join('\n');
      
      html = html.replace(
        /<nav class="nav" data-nav aria-label="[^"]*">[\s\S]*?<ul class="nav__list">[\s\S]*?<\/ul>[\s\S]*?<\/nav>/,
        '<nav class="nav" data-nav aria-label="التنقل الرئيسي">\n      <ul class="nav__list">\n' + headerHtml + '\n      </ul>\n    </nav>'
      );
      
      // Mobile drawer
      var drawerHtml = nav.header.filter(function(l) { return l.visible !== false; })
        .map(function(l) {
          return '        <a href="' + esc(l.href) + '">' + esc(l.label) + '</a>';
        }).join('\n');
      
      html = html.replace(
        /<nav class="drawer__nav" data-nav>[\s\S]*?<\/nav>/,
        '<nav class="drawer__nav" data-nav>\n' + drawerHtml + '\n      </nav>'
      );
    }
    
    // Footer columns
    if (nav.footer && nav.footer.columns) {
      var footerHtml = nav.footer.columns.map(function(col) {
        var linksHtml = (col.links || []).map(function(l) {
          return '            <li><a href="' + esc(l.href) + '">' + esc(l.label) + '</a></li>';
        }).join('\n');
        return '        <div class="footer__col">\n          <h4>' + esc(col.title) + '</h4>\n          <ul>\n' + linksHtml + '\n          </ul>\n        </div>';
      }).join('\n');
      
      html = html.replace(
        /<div class="footer__grid">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/,
        '<div class="footer__grid">\n' + footerHtml + '\n        </div>\n      </div>\n    </section>'
      );
    }
    
    // Social links (footer)
    if (nav.social) {
      var whatsapp = nav.social.whatsapp || '201130830390';
      var telegram = nav.social.telegram || 'QawareerAcademy';
      var instagram = nav.social.instagram || 'Qawareer.Academy';
      var email = nav.social.email || 'QawarirAcademy@gmail.com';
      
      html = html.replace(/href="https:\/\/wa\.me\/[^"]*"/g, 'href="https://wa.me/' + whatsapp + '"');
      html = html.replace(/href="https:\/\/t\.me\/[^"]*"/g, 'href="https://t.me/' + telegram + '"');
      html = html.replace(/href="https:\/\/instagram\.com\/[^"]*"/g, 'href="https://instagram.com/' + instagram + '"');
      html = html.replace(/href="mailto:[^"]*"/g, 'href="mailto:' + email + '"');
    }
    
    return html;
  }

  /* ---- add / remove is-off on every <section data-sec="..."> in a page --- */
  function applySections(html) {
    SEC_ORDER.forEach(function (key) {
      var vis = sectionVisible(key);
      var isOff = vis === false;
      var isSoon = vis === 'soon';

      var re = new RegExp('<section([^>]*\\sdata-sec="' + key + '"[^>]*)>', 'g');
      html = html.replace(re, function (m, attrs) {
        if (!/\sclass="/.test(attrs)) {
          return '<section' + attrs + ' class="' + (isOff || isSoon ? 'is-off' : '') + '">';
        }
        return '<section' + attrs.replace(
          /\sclass="([^"]*)"/,
          function (c, cls) {
            var list = cls.split(/\s+/).filter(Boolean)
              .filter(function (x) { return x !== 'is-off'; });
            if (isOff || isSoon) list.push('is-off');
            return ' class="' + list.join(' ') + '"';
          }) + '>';
      });

      if (!isSoon) return;

      /* Inject "قريباً" panel after the specific hidden section */
      var soonHtml = secSoon(key);
      if (soonHtml) {
        var sectionRe = new RegExp(
          '(<section[^>]*\\sdata-sec="' + key + '"[^>]*>[\\s\\S]*?<\\/section\\s*>)',
          'g'
        );
        html = html.replace(sectionRe, function (m, fullSection) {
          return fullSection + '\n' + soonHtml;
        });
      }
    });
    return applySettings(html);
  }

  /* ==================================================================
     PAGE PROSE  (the "الصفحات" tab: about + materials)

     These blocks used to be hardcoded in _tools/pages.py, so editing
     pages.about.lead in the panel changed content.js and nothing else -- the
     page on the site never moved. Now the copy is read from content.js and the
     markup sits in a marked region, so the panel rewrites it on every publish
     and pages.py and the browser cannot drift apart.
     ================================================================== */

  function pageOf(key) {
    return (data().pages || {})[key] || {};
  }

  /* the <h1> + subtitle pair inside .page-hero */
  function pageHeroText(key) {
    var pg = pageOf(key);
    if (!pg.title && !pg.subtitle) return '';
    return [
      '      <h1>' + esc(pg.title || '') + '</h1>',
      '      <p>' + esc(pg.subtitle || '') + '</p>'
    ].join('\n');
  }

  function para(cls, text) {
    if (!text) return '';
    return '          <p class="' + cls + '">' + NL +
           '            ' + esc(text) + NL +
           '          </p>';
  }

  function aboutBody() {
    var pg = pageOf('about');
    var out = [];
    var p1 = para('muted mt-2', pg.lead);
    var p2 = para('muted mt-2', pg.lead2);
    if (p1) out.push(p1);
    if (p2) out.push(p2);
    if (pg.philosophy) {
      out.push('          <div class="callout mt-3">');
      out.push('            <strong>' + esc('فلسفتنا') + ':</strong>');
      out.push('            ' + esc(pg.philosophy));
      out.push('          </div>');
    }
    return out.join(NL);
  }

  /* The two materials blocks live in separate sections of the page, so they get
     separate regions rather than one region with a marker in the wrong place. */
  function materialsIntro() {
    var pg = pageOf('materials');
    var out = [];
    out.push('        <p class="muted mt-2">');
    if (pg.intro) out.push('          ' + esc(pg.intro));
    out.push('        </p>');
    return out.join(NL);
  }

  function materialsSuggest() {
    var pg = pageOf('materials');
    var out = [];
    out.push('          <p class="muted mt-2">');
    if (pg.suggestionTitle) {
      out.push('            <strong>' + esc(pg.suggestionTitle) + '</strong>');
      out.push('            ' + esc(pg.suggestionText || ''));
    } else if (pg.suggestionText) {
      out.push('            ' + esc(pg.suggestionText));
    }
    out.push('          </p>');
    return out.join(NL);
  }

  /* ==================================================================
     FAQ
     ================================================================== */
  function faq() {
    if (!sectionVisible('faq')) return '';
    return visible(data().faq).map(function (f, i) {
      return [
        '        <details class="faq__item"' + (i === 0 ? ' open' : '') + '>',
        '          <summary class="faq__q">',
        '            ' + esc(f.q),
        '            <span class="faq__ico" aria-hidden="true">',
        '              ' + CHEV,
        '            </span>',
        '          </summary>',
        '          <div class="faq__a">',
        '            ' + esc(f.a),
        '          </div>',
        '        </details>'
      ].join('\n');
    }).join('\n');
  }

  /* ==================================================================
     STATS
     ================================================================== */
  function stats() {
    var s = (data().home && data().home.stats) || [];
    return s.map(function (st, i) {
      return [
        '        <div class="stat" data-reveal' + delay(i) + '>',
        '          <span class="stat__num" data-count="' + esc(st.value) + '" data-suffix="' +
          esc(st.suffix || '') + '">0</span>',
        '          <span class="stat__label">' + esc(st.label) + '</span>',
        '        </div>'
      ].join('\n');
    }).join('\n');
  }

  /* ==================================================================
     MATERIALS TOPICS
     ================================================================== */
  function topics() {
    if (!sectionVisible('materials')) return '';
    var t = (data().pages && data().pages.materials && data().pages.materials.topics) || [];
    return t.map(function (x, i) {
      return [
        '        <article class="card" data-reveal' + delay(i) + '>',
        '          <div class="card__ico">' + esc(x.icon) + '</div>',
        '          <h3 class="card__title">' + esc(x.title) + '</h3>',
        '          <p class="card__text">' + esc(x.text) + '</p>',
        '          <span class="chip chip--gold mt-2">قريباً</span>',
        '        </article>'
      ].join('\n');
    }).join('\n');
  }

  /* ---- texts: replace static copy from settings.texts ---- */
  function applyTexts(html) {
    var texts = (settings().texts || {});
    var keys = Object.keys(texts);
    
    // Replace texts using data-text-key attributes
    keys.forEach(function (key) {
      var val = texts[key];
      if (val === undefined || val === null) return;
      
      var escapedVal = esc(String(val));
      var regex = new RegExp('data-text-key="' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"', 'g');
      html = html.replace(regex, 'data-text-key="' + key + '">' + escapedVal);
      
      // Also replace in elements that have the key as a comment marker
      var commentRegex = new RegExp('<!--text:' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':start-->[\\s\\S]*?<!--text:' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':end-->', 'g');
      html = html.replace(commentRegex, '<!--text:' + key + ':start-->' + escapedVal + '<!--text:' + key + ':end-->');
    });
    
    return html;
  }

  /* ---- SEO: inject meta tags from settings.seo ---- */
  function applySeo(html) {
    var seo = (settings().seo || {});
    var pageFile = html.indexOf('index.html') !== -1 ? 'index' : 
                   html.indexOf('about.html') !== -1 ? 'about' :
                   html.indexOf('programs.html') !== -1 ? 'programs' :
                   html.indexOf('pricing.html') !== -1 ? 'pricing' :
                   html.indexOf('testimonials.html') !== -1 ? 'testimonials' :
                   html.indexOf('materials.html') !== -1 ? 'materials' :
                   html.indexOf('faq.html') !== -1 ? 'faq' :
                   html.indexOf('contact.html') !== -1 ? 'contact' : null;
    
    if (!pageFile || !seo[pageFile]) return html;
    
    var pageSeo = seo[pageFile];
    
    // Replace title
    if (pageSeo.title) {
      html = html.replace(/<title>[^<]*<\/title>/, '<title>' + esc(pageSeo.title) + '</title>');
      html = html.replace(/<meta property="og:title" content="[^"]*"/, '<meta property="og:title" content="' + esc(pageSeo.title) + '"');
      html = html.replace(/<meta name="twitter:title" content="[^"]*"/, '<meta name="twitter:title" content="' + esc(pageSeo.title) + '"');
    }
    
    // Replace description
    if (pageSeo.description) {
      html = html.replace(/<meta name="description" content="[^"]*"/, '<meta name="description" content="' + esc(pageSeo.description) + '"');
      html = html.replace(/<meta property="og:description" content="[^"]*"/, '<meta property="og:description" content="' + esc(pageSeo.description) + '"');
      html = html.replace(/<meta name="twitter:description" content="[^"]*"/, '<meta name="twitter:description" content="' + esc(pageSeo.description) + '"');
    }
    
    // Replace keywords
    if (pageSeo.keywords) {
      html = html.replace(/<meta name="keywords" content="[^"]*"/, '<meta name="keywords" content="' + esc(pageSeo.keywords) + '"');
    }
    
    return html;
  }

  /* ==================================================================
     EXPORT
     ================================================================== */
  global.RENDER = {
    esc: esc,
    programCards: programCards,
    programDetails: programDetails,
    priceTiers: priceTiers,
    priceCards: priceCards,
    priceTable: priceTable,
    priceNotes: priceNotes,
    reviews: reviews,
    reviewSlider: reviewSlider,
    articleCards: articleCards,
    articleTeaser: articleTeaser,
    articleCategories: articleCategories,
    formatDate: formatDate,
    readMinutes: readMinutes,
    readLabel: readLabel,
    faq: faq,
    pageHeroText: pageHeroText,
    aboutBody: aboutBody,
    materialsIntro: materialsIntro,
    materialsSuggest: materialsSuggest,
    stats: stats,
    topics: topics,
    /* section visibility */
    sectionVisible: sectionVisible,
    sectionState: sectionState,
    secSoon: secSoon,
    secEmpty: secEmpty,
    regionEmpty: regionEmpty,
    applySections: applySections,
    applySettings: applySettings,
    applySectionOrder: applySectionOrder,
    applyNavigation: applyNavigation,
    applyTexts: applyTexts,
    applySeo: applySeo,
    SEC_ORDER: SEC_ORDER,
    SEC_REGIONS: SEC_REGIONS
  };

})(window);
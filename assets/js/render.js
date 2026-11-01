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

  function campaignDate(value, endOfDay) {
    if (!value) return 0;
    var text = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) text += endOfDay ? 'T23:59:59' : 'T00:00:00';
    var time = new Date(text).getTime();
    return isNaN(time) ? 0 : time;
  }
  function activeCampaigns() {
    var now = Date.now();
    return visible(data().campaigns || []).filter(function (item) {
      var start = campaignDate(item.startAt, false);
      var end = campaignDate(item.endAt, true);
      return (!start || start <= now) && (!end || end >= now);
    });
  }
  function campaignMatchesPage(item, file) {
    var target = item.targetPage || 'all';
    var key = pageKey(file);
    if (target === 'all') return true;
    if (target === 'home') return key === 'index';
    return target === key;
  }
  function relatedCampaign(type, id) {
    return activeCampaigns().filter(function (item) {
      return item.relatedType === type && item.relatedId === id;
    })[0] || null;
  }
  function campaignPriceHtml(item, cls) {
    if (!item.originalPrice && !item.offerPrice && !item.priceLabel) return '';
    return '<div class="' + cls + '">' +
      (item.priceLabel ? '<span class="season-save">' + esc(item.priceLabel) + '</span>' : '') +
      (item.originalPrice ? '<del>' + esc(item.originalPrice) + '</del>' : '') +
      (item.offerPrice ? '<strong>' + esc(item.offerPrice) + '</strong>' : '') +
      '</div>';
  }
  function campaignCountdownHtml(item) {
    var end = campaignDate(item.endAt, true);
    return item.showCountdown && end ? '<div class="season-countdown" data-season-countdown="' + end + '" aria-label="الوقت المتبقي للعرض"></div>' : '';
  }

  function pricingCampaigns() {
    return visible(data().campaigns || []).filter(function (item) {
      return item.applyPricing === true && item.discountType && item.discountType !== 'none' &&
        parseFloat(String(item.discountValue || '').replace(',', '.')) > 0;
    });
  }
  function pricingCampaignFor(tierId, systemId, planId) {
    return pricingCampaigns().filter(function (item) {
      return (!item.discountTier || item.discountTier === 'all' || item.discountTier === tierId) &&
        (!item.discountSystem || item.discountSystem === 'all' || item.discountSystem === systemId) &&
        (!item.discountPlan || item.discountPlan === 'all' || item.discountPlan === planId);
    })[0] || null;
  }
  function numericPrice(value) {
    var clean = String(value == null ? '' : value).replace(/,/g, '').replace(/[^\d.]/g, '');
    var number = parseFloat(clean);
    return isNaN(number) ? null : number;
  }
  function formatPrice(value) {
    var rounded = Math.round(value * 100) / 100;
    return String(rounded).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function offerForPrice(price, campaign) {
    var original = numericPrice(price);
    if (original == null || !campaign) return null;
    var value = parseFloat(String(campaign.discountValue || '').replace(',', '.'));
    if (!value || value < 0) return null;
    var discounted = campaign.discountType === 'fixed' ? original - value : original * (1 - value / 100);
    discounted = Math.max(0, discounted);
    return { original: formatPrice(original), offer: formatPrice(discounted) };
  }
  function offerDateAttrs(campaign) {
    return ' data-pricing-offer data-offer-start="' + esc(campaign.startAt || '') +
      '" data-offer-end="' + esc(campaign.endAt || '') + '"';
  }
  function offerLabel(campaign) {
    if (campaign.priceLabel) return campaign.priceLabel;
    return campaign.discountType === 'fixed'
      ? 'خصم ' + campaign.discountValue + ' ' + (pr().currency || 'جنيه')
      : 'خصم ' + campaign.discountValue + '%';
  }

  var NL = '\n';

  var ARROW = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6z"/></svg>';
  var CHEV = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  /* ==================================================================
     PROGRAMS — cards (home + programs page overview)
     ================================================================== */
  function programCards(linkPrefix) {
    if (offSection('programs')) return '';
    var prefix = (linkPrefix === undefined) ? 'programs.html' : linkPrefix;
    return visible(data().programs).map(function (p, i) {
      var related = relatedCampaign('program', p.id);
      return [
        '      <article class="prog" data-reveal' + delay(i) + '>',
        related ? '        <span class="season-related-badge">' + esc(related.relatedBadge || related.badge || 'عرض موسمي') + '</span>' : '',
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
    if (offSection('programs')) return '';
    var cards = visible(data().programs).map(function (p) {
      return [
        '      <article class="prog-detail mb-4" id="' + esc(p.id) + '" data-reveal>',
        '        <div class="prog-detail__head">',
        '          <div class="chips mb-2">',
        '            <span class="chip" style="background:rgba(255,255,255,.16);color:#fff;border-color:rgba(255,255,255,.3)">برنامج ' + esc(p.order) + '</span>',
        '            <span class="chip chip--gold">' + esc(p.audience) + '</span>',
        p.duration ? '            <span class="chip chip--gold">' + esc(p.duration) + '</span>' : '',
        '          </div>',
        '          <h2>' + esc(p.title) + '</h2>',
        '          <p>' + esc(p.short) + '</p>',
        '        </div>',
        '        <div class="prog-detail__body">',
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
        '          <div class="center mt-3">',
        /* data-ctx carries the program name, so the WhatsApp message asks
           about THIS program without the message being written five times. */
        '            <a class="btn btn--green" href="#" data-wa="program" data-ctx="' +
          esc(p.title) + '">احجزي في هذا البرنامج</a>',
        '          </div>',
        '        </div>',
        '      </article>'
      ].join('\n');
    }).join('\n');
    return '      <div class="program-details-grid">\n' + cards + '\n      </div>';
  }

  /* ==================================================================
     COURSES — a separate, fully managed catalogue on programs.html
     ================================================================== */
  function coursesSection() {
    var courses = visible(data().courses || []);
    var statusLabels = {
      open: 'التسجيل مفتوح', soon: 'قريبًا', closed: 'التسجيل مغلق', completed: 'انتهت'
    };
    var cards = courses.map(function (course, i) {
      var status = course.status || 'soon';
      var related = relatedCampaign('course', course.id);
      var facts = [
        course.duration ? '<span><b>المدة:</b> ' + esc(course.duration) + '</span>' : '',
        course.schedule ? '<span><b>الموعد:</b> ' + esc(course.schedule) + '</span>' : '',
        course.startDate ? '<span><b>البداية:</b> ' + esc(course.startDate) + '</span>' : '',
        course.isFree ? '<span><b>السعر:</b> مجانية</span>' : (course.price ? '<span><b>السعر:</b> ' + esc(course.price) + '</span>' : '')
      ].filter(Boolean).join('');
      var topics = (course.topics || []).length ?
        '<ul class="tick-list">' + ticks(course.topics) + '</ul>' : '';
      var disabled = status === 'open' ? '' : ' aria-disabled="true" class="btn btn--green is-disabled"';
      var enabled = status === 'open' ? ' class="btn btn--green"' : disabled;
      var button = course.cta || (status === 'open' ? 'احجزي في الدورة' : statusLabels[status]);
      return [
        '      <article class="course-card ' + (course.isFree ? 'course-card--free' : 'course-card--paid') + '" id="' + esc(course.id) + '" data-reveal' + delay(i) + '>',
        related ? '        <span class="season-related-badge">' + esc(related.relatedBadge || related.badge || 'عرض موسمي') + '</span>' : '',
        course.isFree ? '        <div class="free-decor" aria-hidden="true"><span>🎁</span><span>✦</span><span>◆</span><span>✦</span><span>🎀</span></div>' : '',
        '        <div class="course-card__top">',
        '          <span class="course-status course-status--' + esc(status) + '">' + esc(statusLabels[status] || status) + '</span>',
        course.isFree ? '          <span class="course-free">مجانية</span>' : '',
        course.audience ? '          <span class="chip">' + esc(course.audience) + '</span>' : '',
        '        </div>',
        '        <h3>' + esc(course.title) + '</h3>',
        '        <p>' + esc(course.short || '') + '</p>',
        facts ? '        <div class="course-facts">' + facts + '</div>' : '',
        course.details ? '        <p class="course-card__details">' + esc(course.details) + '</p>' : '',
        topics,
        '        <a href="#"' + enabled + ' data-wa="program" data-ctx="دورة: ' + esc(course.title) + '">' + esc(button) + '</a>',
        '      </article>'
      ].filter(Boolean).join('\n');
    }).join('\n');

    if (!cards) {
      cards = '      <div class="empty-state">لا توجد دورات معلنة حاليًا. ستظهر الدورات هنا عند إضافتها من لوحة التحكم.</div>';
    }
    return [
      '  <section class="section" id="courses">',
      '    <div class="container">',
      '      <div class="sec-head sec-head--center">',
      '        <span class="kicker">الدورات</span>',
      '        <h2>الدورات المتاحة</h2>',
      '        <p>دورات محددة المدة والموعد، ويمكن متابعة حالة التسجيل وتفاصيل كل دورة.</p>',
      '        <div class="rule"></div>',
      '      </div>',
      '      <div class="grid g-courses">', cards,
      '      </div>',
      '    </div>',
      '  </section>'
    ].join('\n');
  }

  function homeCoursesSection() {
    if (offSection('courses')) return '';
    var courses = visible(data().courses || []).filter(function (course) {
      return course.showOnHome !== false;
    });
    if (!courses.length) return '';
    var statusLabels = { open: 'التسجيل مفتوح', soon: 'قريبًا', closed: 'التسجيل مغلق', completed: 'انتهت' };
    var anyFree = courses.some(function (course) { return course.isFree === true; });
    var cards = courses.map(function (course, i) {
      var status = course.status || 'soon';
      return [
        '      <article class="course-teaser ' + (course.isFree ? 'course-teaser--free' : 'course-teaser--paid') + '" data-reveal' + delay(i) + '>',
        course.isFree ? '        <div class="free-decor" aria-hidden="true"><span>🎁</span><span>✦</span><span>◆</span><span>✦</span><span>🎀</span></div>' : '',
        '        <div class="course-teaser__badges">',
        course.isFree ? '          <span class="course-free">مجانية</span>' : '',
        '          <span class="course-status course-status--' + esc(status) + '">' + esc(statusLabels[status] || status) + '</span>',
        '        </div>',
        '        <h3>' + esc(course.title) + '</h3>',
        '        <p>' + esc(course.short || '') + '</p>',
        '        <div class="course-teaser__meta">',
        course.duration ? '          <span>⏱ ' + esc(course.duration) + '</span>' : '',
        course.startDate ? '          <span>📅 ' + esc(course.startDate) + '</span>' : '',
        course.isFree ? '          <span>🎁 بدون رسوم</span>' : '',
        '        </div>',
        '        <a class="link-arrow" href="programs.html#' + esc(course.id) + '">عرض التفاصيل ' + ARROW + '</a>',
        '      </article>'
      ].filter(Boolean).join('\n');
    }).join('\n');
    return [
      '  <section class="section home-courses' + (anyFree ? ' home-courses--free' : '') + '" data-home-courses data-sec="courses">',
      '    <div class="container">',
      '      <div class="sec-head sec-head--center">',
      '        <span class="kicker">' + (anyFree ? '🎁 فرصة مجانية 🎁' : 'الدورات') + '</span>',
      '        <h2>' + (anyFree ? '<span class="free-title-gift" aria-hidden="true">🎁</span> دورات مجانية تستحق اهتمامكِ <span class="free-title-gift" aria-hidden="true">🎁</span>' : 'دورات مختارة') + '</h2>',
      '        <p>تعرفي على المدة والموعد وحالة التسجيل، ثم انتقلي للتفاصيل الكاملة.</p>',
      '        <div class="rule"></div>',
      '      </div>',
      '      <div class="grid g-home-courses">', cards,
      '      </div>',
      '      <div class="center mt-4"><a class="btn btn--outline" href="programs.html#courses">كل الدورات</a></div>',
      '    </div>',
      '  </section>'
    ].join('\n');
  }

  function campaignSliderSection() {
    var slider = settings().campaignSlider || {};
    if (slider.visible === false || offSection('campaigns')) return '';
    var campaigns = activeCampaigns().filter(function (item) { return item.showInSlider !== false; });
    if (!campaigns.length) return '';
    var slides = campaigns.map(function (item, i) {
      var picture = item.image ? [
        '          <picture class="campaign__picture">',
        item.mobileImage ? '            <source media="(max-width:640px)" srcset="' + esc(item.mobileImage) + '">' : '',
        '            <img src="' + esc(item.image) + '" alt="" loading="' + (i ? 'lazy' : 'eager') + '">',
        '          </picture>'
      ].filter(Boolean).join('\n') : '';
      var link = item.link ? '<a class="btn btn--gold" href="' + esc(item.link) + '">' + esc(item.button || 'اعرفي التفاصيل') + '</a>' : '';
      if (item.image) {
        return [
          '      <article class="campaign campaign--image season-theme--' + esc(item.theme || 'gift') + (i === 0 ? ' is-active' : '') + '" data-campaign-slide aria-hidden="' + (i === 0 ? 'false' : 'true') + '">',
          item.link ? '        <a class="campaign__image-link" href="' + esc(item.link) + '" aria-label="' + esc(item.title || item.badge || 'تفاصيل العرض') + '">' : '        <div class="campaign__image-link">',
          picture,
          item.link ? '        </a>' : '        </div>',
          '      </article>'
        ].join('\n');
      }
      return [
        '      <article class="campaign season-theme--' + esc(item.theme || 'gift') + (i === 0 ? ' is-active' : '') + '" data-campaign-slide aria-hidden="' + (i === 0 ? 'false' : 'true') + '" style="--campaign-bg:' + esc(item.bg || '#074e38') + ';--campaign-color:' + esc(item.color || '#ffffff') + '">',
        picture,
        seasonDecor(),
        '        <div class="container campaign__content">',
        item.badge ? '          <span class="campaign__badge">' + esc(item.badge) + '</span>' : '',
        '          <h2>' + esc(item.title) + '</h2>',
        item.text ? '          <p>' + esc(item.text) + '</p>' : '',
        campaignPriceHtml(item, 'campaign__price'),
        campaignCountdownHtml(item),
        link,
        '        </div>',
        '      </article>'
      ].filter(Boolean).join('\n');
    }).join('\n');
    var dots = campaigns.map(function (_, i) {
      return '        <button type="button" data-campaign-dot="' + i + '" class="' + (i === 0 ? 'is-active' : '') + '" aria-label="الإعلان ' + (i + 1) + '"></button>';
    }).join('\n');
    return [
      '  <section class="campaign-slider" data-campaign-slider data-sec="campaigns" data-auto="' + (slider.auto !== false) + '" data-speed="' + esc(slider.speed || 6000) + '" style="--campaign-height:' + esc(Math.min(220, Math.max(100, parseInt(slider.height, 10) || 150))) + 'px">',
      '    <div class="campaign-slider__track">', slides, '    </div>',
      slider.navigation !== false && campaigns.length > 1 ? '    <button class="campaign-slider__arrow campaign-slider__arrow--prev" type="button" data-campaign-prev aria-label="الإعلان السابق">‹</button>' : '',
      slider.navigation !== false && campaigns.length > 1 ? '    <button class="campaign-slider__arrow campaign-slider__arrow--next" type="button" data-campaign-next aria-label="الإعلان التالي">›</button>' : '',
      campaigns.length > 1 ? '    <div class="campaign-slider__dots">\n' + dots + '\n    </div>' : '',
      '  </section>'
    ].filter(Boolean).join('\n');
  }

  function seasonDecor() {
    return '        <div class="season-decor" aria-hidden="true"><span>🎁</span><span>✦</span><span>🎀</span><span>◆</span><span>✦</span></div>';
  }

  function campaignBar(item) {
    return [
      '<aside class="season-bar season-theme--' + esc(item.theme || 'gift') + '" data-season-bar style="--campaign-bg:' + esc(item.bg || '#075b3b') + ';--campaign-color:' + esc(item.color || '#fff') + '">',
      '  <div class="container season-bar__in">',
      item.badge ? '    <span class="season-bar__badge">' + esc(item.badge) + '</span>' : '',
      '    <strong>' + esc(item.title) + '</strong>',
      item.priceLabel ? '    <span>' + esc(item.priceLabel) + '</span>' : '',
      item.link ? '    <a href="' + esc(item.link) + '">' + esc(item.button || 'التفاصيل') + '</a>' : '',
      '    <button type="button" data-season-bar-close aria-label="إغلاق التنبيه">×</button>',
      '  </div>',
      '</aside>'
    ].filter(Boolean).join('\n');
  }

  function campaignInlineCard(item) {
    return [
      '<section class="section season-inline" data-season-inline>',
      '  <div class="container">',
      '    <article class="season-inline__card season-theme--' + esc(item.theme || 'gift') + '" style="--campaign-bg:' + esc(item.bg || '#075b3b') + ';--campaign-color:' + esc(item.color || '#fff') + '">',
      seasonDecor(),
      '      <div>',
      item.badge ? '        <span class="campaign__badge">' + esc(item.badge) + '</span>' : '',
      '        <h2>' + esc(item.title) + '</h2>',
      item.text ? '        <p>' + esc(item.text) + '</p>' : '',
      '      </div>',
      '      <div class="season-inline__action">',
      campaignPriceHtml(item, 'season-inline__price'),
      campaignCountdownHtml(item),
      item.link ? '        <a class="btn btn--gold" href="' + esc(item.link) + '">' + esc(item.button || 'شاهدي التفاصيل') + '</a>' : '',
      '      </div>',
      '    </article>',
      '  </div>',
      '</section>'
    ].filter(Boolean).join('\n');
  }

  function applyCampaignPlacements(html, file) {
    html = html.replace(/\s*<!--qwr:campaign-bar:start-->[\s\S]*?<!--qwr:campaign-bar:end-->/g, '');
    html = html.replace(/\s*<!--qwr:campaign-popup:start-->[\s\S]*?<!--qwr:campaign-popup:end-->/g, '');
    html = html.replace(/\s*<!--qwr:campaign-inline:start-->[\s\S]*?<!--qwr:campaign-inline:end-->/g, '');
    var campaigns = activeCampaigns().filter(function (item) { return campaignMatchesPage(item, file); });
    var bar = campaigns.filter(function (item) { return item.showBar === true; })[0];
    var inline = campaigns.filter(function (item) { return item.showCard === true; })[0];
    html = html.replace(/<body([^>]*)>/, function (m, attrs) {
      attrs = attrs.replace(/\sclass="([^"]*)"/, function (_, names) {
        var clean = names.replace(/\bhas-season-bar\b/g, '').replace(/\s+/g, ' ').trim();
        return clean ? ' class="' + clean + '"' : '';
      });
      if (bar) {
        if (/\sclass="/.test(attrs)) attrs = attrs.replace(/\sclass="([^"]*)"/, ' class="$1 has-season-bar"');
        else attrs += ' class="has-season-bar"';
      }
      return '<body' + attrs + '>';
    });
    if (bar) html = html.replace(/(<header\b[^>]*class="[^"]*(?:site-head|header)[^"]*"[^>]*>)/, '<!--qwr:campaign-bar:start-->\n' + campaignBar(bar) + '\n<!--qwr:campaign-bar:end-->\n$1');
    if (inline && (pageKey(file) === 'programs' || pageKey(file) === 'pricing')) {
      html = html.replace(/(<section\b[^>]*class="[^"]*cta-band[^"]*"[^>]*>)/, '<!--qwr:campaign-inline:start-->\n' + campaignInlineCard(inline) + '\n<!--qwr:campaign-inline:end-->\n$1');
    }
    return html;
  }

  function applyPageCleanup(html) {
    if (html.indexOf('<!--qwr:program-details:start-->') !== -1) {
      html = html.replace('خمسة برامج تحل مشكلات حقيقية، لا أسماء فقط.', 'خمسة برامج تحل مشكلات حقيقية');
      html = html.replace(/\s*<section class="section">[\s\S]*?<!--qwr:programs-cards:start-->[\s\S]*?<!--qwr:programs-cards:end-->[\s\S]*?<\/section>/, '');
      html = html.replace('الفكرة، الفئة المستهدفة، طريقة التنفيذ، المدة، والمخرج النهائي.', 'الفئة المستهدفة، وطريقة التنفيذ، والمدة، والنتائج المتوقعة.');
      html = html.replace(/\s*<section class="section on-dark"[\s\S]*?<span class="kicker">أدوات مشتركة<\/span>[\s\S]*?<\/section>/, '');
      /* Remove every previously generated copy before inserting the one current
         section. Older rebuilds only removed the final copy before the CTA,
         so each publish could leave another courses section behind. */
      html = html.replace(/\s*<section class="section" id="courses">[\s\S]*?<\/section>/g, '');
      html = html.replace(/(\s*<section class="cta-band")/, '\n\n' + coursesSection() + '\n\n$1');
    }
    if (html.indexOf('data-sec="programs"') !== -1) {
      html = html.replace(/\s*<section class="campaign-slider"[^>]*data-campaign-slider[\s\S]*?<\/section>/, '');
      var campaignSlider = campaignSliderSection();
      if (campaignSlider) {
        html = html.replace(/(<section\b[^>]*\bdata-sec="hero"[^>]*>[\s\S]*?<\/section>)/, '$1\n\n' + campaignSlider);
      }
      html = html.replace(/\s*<section class="section home-courses(?: home-courses--free)?" data-home-courses[^>]*>[\s\S]*?<\/section>/, '');
      var homeCourses = homeCoursesSection();
      if (homeCourses) {
        html = html.replace(/(<section class="section" data-sec="programs">[\s\S]*?<!--qwr:programs-cards:end-->[\s\S]*?<\/section>)/,
          '$1\n\n' + homeCourses);
      }
    }
    html = html.replace(/\s*<div class="callout mt-3">\s*<strong>ملاحظة:<\/strong>\s*هذه النماذج ترسل عبر واتساب ولا تحتاج سيرفر أو\s*قاعدة بيانات، ولهذا تعمل على أي استضافة مجانية بدون إعداد\.\s*<\/div>/, '');
    return html;
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
  function planRow(price, label, tierId, systemId, planId) {
    var campaign = pricingCampaignFor(tierId, systemId, planId);
    var offer = offerForPrice(price, campaign);
    var priceHtml = offer
      ? '<span class="plan__price plan__price--offer"' + offerDateAttrs(campaign) + '>' +
          '<span class="plan__price-original">' + esc(offer.original) + ' <small>' + esc(pr().currency || 'جنيه') + '</small></span>' +
          '<span class="plan__price-new">' + esc(offer.offer) + ' <small>' + esc(pr().currency || 'جنيه') + '</small></span>' +
        '</span>'
      : '<span class="plan__price">' + esc(price) + ' <small>' + esc(pr().currency || 'جنيه') + '</small></span>';
    return [
      '            <div class="plan">',
      '              <span class="plan__label">' + esc(label) + '</span>',
      '              ' + priceHtml,
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
      rows += (rows ? '\n' : '') + planRow(prices[i], plans[i].label, tier.id, row.system, plans[i].id);
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
         says which offer the enquiry is about, so the answer starts with the
         right subject. The tier picks a message KEY rather than carrying the
         words -- that is what lets the owner rewrite all three from the panel
         without touching this file. A tier with an id nobody mapped falls back
         to the general message rather than to nothing. */
      var TIER_WA = { classic: 'tierClassic', golden: 'tierGolden', groups: 'tierGroups' };
      var waKey = TIER_WA[tier.id] || 'general';
      var tierOffer = pricingCampaigns().filter(function (item) {
        return !item.discountTier || item.discountTier === 'all' || item.discountTier === tier.id;
      })[0] || null;

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
        tierOffer
          ? '            <span class="tier__offer-badge"' + offerDateAttrs(tierOffer) + '>🎁 ' + esc(offerLabel(tierOffer)) + '</span>'
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
        '               data-wa="' + esc(waKey) + '"' + (tierOffer ? ' data-wa-extra="العرض: ' + esc(tierOffer.title || offerLabel(tierOffer)) + '"' : '') + '>' +
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
  function priceRange(tier, withOffers) {
    var nums = [];
    var plans = prPlans();
    (tier.rows || []).forEach(function (r) {
      (r.prices || []).forEach(function (p, i) {
        var campaign = withOffers && plans[i] ? pricingCampaignFor(tier.id, r.system, plans[i].id) : null;
        var offer = offerForPrice(p, campaign);
        var n = numericPrice(offer ? offer.offer : p);
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
    if (offSection('pricing')) return '';
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

      var range = priceRange(tier, false);
      var offerRange = priceRange(tier, true);
      var tierOffer = pricingCampaigns().filter(function (item) {
        return !item.discountTier || item.discountTier === 'all' || item.discountTier === tier.id;
      })[0] || null;

      return [
        '        <section class="tier tier--' + esc(theme) + ' tier--teaser"' +
          (tier.featured ? ' is-featured' : '') + ' data-tier="' + esc(tier.id) + '">',
        '          <div class="tier__banner" data-reveal' + delay(i) + '>',
        tier.badge
          ? '            <span class="tier__badge">' + esc(tier.badge) + '</span>'
          : '',
        tierOffer
          ? '            <span class="tier__offer-badge"' + offerDateAttrs(tierOffer) + '>🎁 ' + esc(offerLabel(tierOffer)) + '</span>'
          : '',
        '            <h3 class="tier__name">' + esc(tier.name) + '</h3>',
        '            <p class="tier__tagline">' + esc(tier.tagline || '') + '</p>',
        '            <p class="tier__desc">' + esc(tier.description || '') + '</p>',
        features
          ? '            <ul class="tier__feats">\n' + features + '\n            </ul>'
          : '',
        '          </div>',
        range && tierOffer
          ? '          <p class="tier__price-range tier__price-range--offer"' + offerDateAttrs(tierOffer) + '><span class="tier__range-original">' + esc(range) + '</span><span class="tier__range-new">مع العرض: ' + esc(offerRange) + '</span></p>'
          : (range ? '          <p class="tier__price-range">' + esc(range) + '</p>' : ''),
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
      '        <a class="btn btn--gold" href="pricing.html" data-wa="pricing">عرض تفاصيل الباقات',
      '          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
      '        </a>',
      '      </div>'
    ].join('\n');
  }

  function priceTable() {
    if (offSection('pricing')) return '';
    var p = pr();
    var plans = prPlans();
    if (!plans.length) return '';

    function tablePrice(tier, row, plan, value) {
      var campaign = pricingCampaignFor(tier.id, row.system, plan.id);
      var offer = offerForPrice(value, campaign);
      if (!offer) return esc(value);
      return '<span class="table-price-offer"' + offerDateAttrs(campaign) + '>' +
        '<span class="table-price-original">' + esc(offer.original) + '</span>' +
        '<strong class="table-price-new">' + esc(offer.offer) + '</strong></span>';
    }

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
            ? '<td class="num">' + tablePrice(t, r, pl, v) + '</td>'
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
          return plans[i] ? esc(plans[i].label) + ' <b>' + tablePrice(t, r, plans[i], v) + '</b>' : '';
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
  /* The heading above the tiers: "three tiers ... by N bundles (...)".

     Built from the data rather than written out, because the version that
     lived directly in pricing.html said "four bundles (4, 8, 12 and 16)" the
     whole time a fifth bundle was on screen just below it -- and it sat
     outside every region, so no rebuild could ever correct it. The numbers now
     follow pricing.systems and pricing.plans wherever they change. */
  function priceIntro() {
    var systems = prSystems() || [];
    var plans = prPlans() || [];
    if (!systems.length || !plans.length) return '';

    /* Session lengths in arabic-Indic digits, matching how the rest of the copy
       writes them; the bundle NAMES are passed through untouched, because a
       bundle is called whatever the owner called it ("22 حصة" stays "22 حصة",
       not "٢٢ حصة" -- half-converted numbers look like a typo). */
    var AR = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    function ar(n) {
      return String(n).replace(/[0-9]/g, function (d) { return AR[+d]; });
    }

    var mins = systems.map(function (s) { return ar(s.minutes); }).join(' و ');
    var bundles = plans.map(function (p) { return esc(p.label); }).join(' و ');
    var tierCount = (prTiers() || []).length;

    /* Counting words need the right form: two bundles take "حصتين", three take
       "ثلاث حصص". Written as a standalone phrase, then prefixed -- "بـ" joins
       to a following word ("بخمس") but not to "خمس", so the two are kept apart
       and the prefix is chosen per form rather than pasted on blindly. */
    var COUNT = {
      1: { one: 'حصة واحدة', acc: 'بحصة واحدة' },
      2: { one: 'حصتين',     acc: 'بحصتين' },
      3: { one: 'ثلاث حصص',  acc: 'بثلاث حصص' },
      4: { one: 'أربع حصص',  acc: 'بأربع حصص' },
      5: { one: 'خمس حصص',   acc: 'بخمس حصص' },
      6: { one: 'ست حصص',    acc: 'بست حصص' },
      7: { one: 'سبع حصص',   acc: 'بسبع حصص' },
      8: { one: 'ثمان حصص',  acc: 'بثمان حصص' },
      9: { one: 'تسع حصص',   acc: 'بتسع حصص' },
      10: { one: 'عشر حصص',  acc: 'بعشر حصص' }
    };
    function countAcc(n) {
      var c = COUNT[n];
      return c ? c.acc : 'بـ' + ar(n) + ' حصة';
    }
    function tiersWord(n) {
      return ['', 'فئة واحدة', 'فئتان', 'ثلاث فئات', 'أربع فئات', 'خمس فئات'][n] ||
             ar(n) + ' فئات';
    }

    var lead = (settings().texts || {})['pricing.lead'];
    var body = lead
      ? esc(lead)
      : esc(tiersWord(tierCount) + '، وكل فئة فيها أنظمة الحصة الثلاث (' +
            mins + ' دقيقة) ' + countAcc(plans.length) +
            ' (' + bundles + ').');

    return [
      '      <div class="sec-head sec-head--center">',
      '        <span class="kicker">نظرة عامة</span>',
      '        <h2>اختاري الفئة التي تناسبكِ</h2>',
      '        <p>',
      '          ' + body + ' كل الأسعار بـ' + esc(pr().currency || 'جنيه') + '.',
      '        </p>',
      '        <div class="rule"></div>',
      '      </div>'
    ].join('\n');
  }

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

    /* Random selection: the homepage slider can show a random
       subset of the reviews. The full list is still rendered in
       the HTML (so Google reads every review); main.js picks the
       subset at view time, so each visit sees a different mix. */
    var homeReviews = (data().settings && data().settings.home &&
                       data().settings.home.reviews) || {};
    var shuffle = homeReviews.random !== false;
    var keep = parseInt(homeReviews.count, 10) || 3;

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
        ' data-speed="' + speed + '" data-nav="' + (nav ? '1' : '0') + '"' +
        (shuffle ? ' data-reviews-shuffle="1" data-reviews-count="' + keep + '"' : '') + '>',
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
     HOME BLOCKS  (من نحن · لماذا قوارير · فيديو تعريفي · عنوان البرامج)

     These four blocks were hand-written in index.html, which meant the panel
     could neither switch them off nor edit a word in them. They live in
     content.js now and are rewritten on every publish from a marked region.

     Each block is two pieces: a heading (sec-head) and a body, so the title
     can be edited without touching the cards underneath it.
     ================================================================== */

  function homeBlock(name) {
    return (data().home && data().home.blocks &&
            data().home.blocks[name]) || {};
  }

  function cardsOf(name) {
    var all = data().home && data().home.cards && data().home.cards[name];
    return visible(all);
  }

  /* The kicker + <h2> + lead + rule that opens every block. */
  function secHeadHtml(name, withLead) {
    var b = homeBlock(name);
    if (!b.kicker && !b.title) return '';
    return [
      '      <div class="sec-head sec-head--center">',
      b.kicker ? '        <span class="kicker">' + esc(b.kicker) + '</span>' : '',
      b.title  ? '        <h2>' + esc(b.title) + '</h2>' : '',
      (withLead !== false && b.lead) ? '        <p>' + esc(b.lead) + '</p>' : '',
      '        <div class="rule"></div>',
      '      </div>'
    ].filter(Boolean).join('\n');
  }

  /* A row of glass cards. `cols` picks the grid width class. */
  function glassCards(name, cols) {
    var list = cardsOf(name);
    if (!list.length) return '';
    var inner = list.map(function (c, i) {
      return [
        '        <article class="card card--glass" data-reveal' + delay(i) + '>',
        c.ico ? '          <div class="card__ico">' + esc(c.ico) + '</div>' : '',
        '          <h3 class="card__title">' + esc(c.title) + '</h3>',
        c.text ? '          <p class="card__text">' + esc(c.text) + '</p>' : '',
        '        </article>'
      ].filter(Boolean).join('\n');
    }).join('\n');
    return '      <div class="grid ' + (cols || 'g-3') + '">\n' + inner + '\n      </div>';
  }

  function aboutIntroBlock() {
    if (offSection('about-intro')) return '';
    return [secHeadHtml('aboutIntro'), glassCards('aboutIntro', 'g-3')]
      .filter(Boolean).join('\n\n');
  }

  function whyBlock() {
    if (offSection('why')) return '';
    return [secHeadHtml('why'), glassCards('why', 'g-4')]
      .filter(Boolean).join('\n\n');
  }

  /* Only the heading — the cards come from the shared programCards(). */
  function programsHead() {
    if (offSection('programs')) return '';
    return secHeadHtml('programs');
  }

  /* Only the heading — the cards come from the shared programCards(). */
  function programsHead() {
    if (offSection('programs')) return '';
    return secHeadHtml('programs');
  }

  /* The homepage teaser for the materials page. Its region existed in the
     markup but nothing ever rewrote it, so the words on the homepage were
     frozen in the HTML while the materials page itself stayed editable. */
  function materialsTeaser() {
    if (offSection('materials')) return '';
    var b = homeBlock('materials');
    var head = secHeadHtml('materials');
    var cta = [
      '      <div class="block-cta" data-reveal>',
      '        <a class="btn btn--green" href="materials.html">' +
        esc(b.cta || 'تصفّحي المواد') + '</a>',
      '      </div>'
    ].join('\n');
    return head ? head + '\n\n' + cta : cta;
  }

  /* The YouTube embed. The owner may paste either a bare video id or any of
     the URL shapes YouTube hands out, so normalise here rather than making
     them learn which one this field wants. */
  function videoEmbedUrl() {
    var v = (data().home && data().home.video) || {};
    var raw = String(v.url || '').trim();
    if (!raw) return '';
    if (/^[\w-]{6,}$/.test(raw)) return 'https://www.youtube-nocookie.com/embed/' + raw;

    var m = raw.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{6,})/);
    if (m) return 'https://www.youtube-nocookie.com/embed/' + m[1];
    return raw;   // some other host: use whatever was given
  }

  /* The video id, for the facade's swap on click. */
  function videoId() {
    var m = String(videoEmbedUrl()).match(/embed\/([\w-]+)/);
    return m ? m[1] : '';
  }

  /* Why this is a button and not an <iframe>:

     A live YouTube embed pulled 1042 KB on first load -- 80% of the whole page,
     and enough to hold the hero text back to 7.5s on a phone. loading="lazy"
     was not enough: Chrome still fetches an iframe sitting within about a
     screen and a half of the viewport, which this one does on a phone.

     So the embed waits for a click. The poster is a first-party WebP, the
     player is built only once somebody asks for it, and YouTube is not
     contacted at all until then. The button carries the real title, so this
     still reads as a video to a screen reader and to a crawler. */
  function videoBlock() {
    if (offSection('video')) return '';
    var v = (data().home && data().home.video) || {};
    var src = videoEmbedUrl();
    var out = [secHeadHtml('video')];
    if (!src) return out.filter(Boolean).join('\n\n');

    var label = homeBlock('video').title || 'فيديو تعريفي بأكاديمية قوارير';
    var isYouTube = /youtube|youtu\.be/i.test(src);

    out.push([
      '      <div class="video" data-reveal="zoom">',
      '        <div class="video__frame">',
      isYouTube ? [
        '          <button class="video__facade" type="button" data-video-id="' + esc(videoId()) + '"',
        '                  data-video-title="' + esc(label) + '" aria-label="' + esc(label) + '">',
        '            <picture>',
        '              <source srcset="assets/img/video-poster.webp" type="image/webp">',
        '              <img class="video__poster" src="assets/img/video-poster.jpg" alt=""',
        '                   width="800" height="450" loading="lazy" decoding="async">',
        '            </picture>',
        '            <span class="video__play" aria-hidden="true">',
        '              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
        '            </span>',
        '          </button>',
        '          <noscript>',
        '            <style>.video__facade{display:none!important}</style>',
        '            <iframe src="' + esc(src) + '" title="' + esc(label) + '" loading="lazy"',
        '                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"',
        '                    allowfullscreen></iframe>',
        '          </noscript>'
      ].join('\n') : [
        '          <iframe',
        '            src="' + esc(src) + '"',
        '            title="' + esc(label) + '"',
        '            loading="lazy"',
        '            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"',
        '            allowfullscreen></iframe>'
      ].join('\n'),
      '        </div>',
      v.caption ? '        <p class="video__cap">' + esc(v.caption) + '</p>' : '',
      '      </div>'
    ].filter(Boolean).join('\n'));

    return out.filter(Boolean).join('\n\n');
  }

  /* The "probably one of these" cards on the 404 page. Same data as the search
     index, so a page can never appear in the search and then be missing from
     the list beside it. */
  function quickLinks() {
    return [
      { u: 'index.html',       t: 'الصفحة الرئيسية',    d: 'كل حاجة عن الأكاديمية في مكان واحد.' },
      { u: 'programs.html',    t: 'البرامج',            d: 'الحفظ المتدرّج، إنقاذ الحفظ، التلاوة، البيت القرآني.' },
      { u: 'pricing.html',     t: 'الأسعار والباقات',   d: 'الفئات وأنظمة الحصة والباقات.' },
      { u: 'faq.html',         t: 'الأسئلة الشائعة',   d: 'أكثر الأسئلة التي بتتكرر علينا.' },
      { u: 'materials.html',   t: 'المواد المقروءة',    d: 'أدلة وورق مراجعة وأنشطة للبيت.' },
      { u: 'testimonials.html',t: 'آراء الطالبات',      d: 'تجارب طالباتنا وأمهاتنا.' },
      { u: 'about.html',       t: 'عن الأكاديمية',      d: 'رسالتنا وطريقتنا في التعليم القرآني.' },
      { u: 'contact.html',     t: 'تواصل معنا',         d: 'اسألينا أو احجزي عبر واتساب.' }
    ].map(function (l) {
      return [
        '        <a class="ql" href="' + esc(l.u) + '">',
        '          <h3 class="ql__t">' + esc(l.t) + '</h3>',
        '          <p class="ql__d">' + esc(l.d) + '</p>',
        '          <span class="ql__go">ادخلي',
        '            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6z"/></svg>',
        '          </span>',
        '        </a>'
      ].join('\n');
    }).join('\n');
  }

  /* ==================================================================
     SEARCH INDEX

     A static site cannot answer "where is X?" with a query, so the 404 page
     carries its own small index: this builds it from content.js and the
     listing of pages, and main.js filters it as the visitor types.

     Only entries that have somewhere real to send the reader are included --
     an article with no page to live on would produce a result that is itself a
     404, which on this page would be a poor joke.
     ================================================================== */

  var SEARCH_PAGES = [
    { file: 'index.html',        title: 'الصفحة الرئيسية',        desc: 'كل حاجة عن الأكاديمية في صفحة واحدة.' },
    { file: 'about.html',         title: 'عن الأكاديمية',          desc: 'رسالتنا وفلسفتنا وطريقتنا في التعليم القرآني.' },
    { file: 'programs.html',      title: 'البرامج',                desc: 'كل البرامج بالتفصيل: الحفظ المتدرج، إنقاذ الحفظ، التلاوة، البيت القرآني.' },
    { file: 'pricing.html',       title: 'الأسعار والباقات',       desc: 'كل الفئات وأنظمة الحصة والباقات.' },
    { file: 'testimonials.html',  title: 'آراء الطالبات',          desc: 'تجارب طالباتنا وأمهاتنا مع الأكاديمية.' },
    { file: 'materials.html',     title: 'المواد المقروءة',       desc: 'أدلة وورق مراجعة وأنشطة للبيت.' },
    { file: 'faq.html',           title: 'الأسئلة الشائعة',       desc: 'إجابات على أكثر الأسئلة التي تتكرر علينا.' },
    { file: 'contact.html',       title: 'تواصل معنا',             desc: 'اسألينا أو احجزي عبر واتساب.' },
    { file: 'privacy.html',       title: 'سياسة الخصوصية',         desc: 'إزاي بنتعامل مع بياناتك.' }
  ];

  /* The spelling fold itself lives in main.js, where the comparison happens --
     render.js only writes the index and never reads it back. */
  function plainText(html) {
    return String(html == null ? '' : html)
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function searchIndex() {
    var items = [];

    SEARCH_PAGES.forEach(function (p) {
      items.push({ t: p.title, u: p.file, d: p.desc, g: 'صفحات' });
    });

    visible(data().programs).forEach(function (p) {
      items.push({
        t: p.title,
        u: 'programs.html#' + p.id,
        d: plainText(p.short),
        g: 'برنامج',
        k: [p.audience, p.duration, 'برنامج'].filter(Boolean).join(' ')
      });
    });

    visible(data().faq).forEach(function (f) {
      items.push({
        t: f.q,
        u: 'faq.html#' + (f.id || ''),
        d: plainText(f.a),
        g: 'سؤال شائع',
        k: 'أسئلة شائعة سؤال'
      });
    });

    visible(data().testimonials).forEach(function (r) {
      items.push({
        t: r.name + (r.program ? ' — ' + r.program : ''),
        u: 'testimonials.html',
        d: plainText(r.text),
        g: 'رأي',
        k: [r.program, 'آراء'].filter(Boolean).join(' ')
      });
    });

    /* `<` is escaped as < so a stray "</script>" inside any indexed text
     cannot close the tag early and break out into markup. */
    return JSON.stringify(items).replace(/</g, '\\u003c');
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
      '            <a class="link-arrow" href="#" data-wa="article" data-ctx="' +
        esc(a.title) + '">اسأليني عن المقال',
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
    if (offSection('articles')) return '';
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
    if (offSection('articles')) return '';
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
    'about-intro': ['about-intro'],
    'video':       ['video'],
    'programs':    ['programs-head', 'programs-cards'],
    'why':         ['why'],
    articles:  ['articles', 'articles-teaser'],
    reviews:   ['reviews'],
    faq:       ['faq'],
    materials: ['materials-block', 'topics']
  };

  /* The "قريباً" panel shown in place of a hidden section.
     Sections listed in SEC_BINARY have no entry here on purpose: they can only
     be on or off, so a panel for them could never be reached. */
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
  };

  var SEC_ORDER = ['hero', 'campaigns', 'stats', 'about-intro', 'video', 'programs', 'courses', 'why', 'testimonials', 'pricing', 'articles', 'reviews', 'faq', 'cta', 'materials'];

  /* Blocks the owner may only switch on or off. "قريباً" would read oddly on
     a section that already exists and is simply not wanted right now, so the
     panel shows two buttons for these and render.js refuses the middle state. */
  var SEC_BINARY = {
    'about-intro': true,
    'video':       true,
    'programs':    true,
    'why':         true
  };

  function secIsBinary(key) { return SEC_BINARY[key] === true; }

  /* A missing entry means "visible", so a half-edited content.js can never
     hide a section by accident.
     Returns: true (show content), 'soon' (show soon panel), false (hide completely) */
  function sectionVisible(key) {
    var s = (data().sections || {})[key];
    if (!s) return true;
    var v = s.visible;
    if (v === 'on') return true;   /* legacy string value */
    if (v === 'off') return false; /* legacy string value */
    /* a binary section never shows the "قريباً" panel, even if an older
       content.js still carries it: fall back to plain visible */
    if (v === 'soon' && secIsBinary(key)) return true;
    return v; // true, 'soon', or false
  }

  /* True only when the section is fully switched off.

     Every renderer that fills a section asks this first and returns an empty
     string, which is what actually keeps a hidden block out of the HTML: the
     `is-off` class alone only hides it on screen, and Google would still read
     the words. The "قريباً" state deliberately does NOT count as off -- the
     panel is swapped in by CSS and the real content stays in the file. */
  function offSection(key) {
    return sectionVisible(key) === false;
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
      '          <a class="btn btn--green mt-3" href="#" data-wa="notify">نبهيني عند الجاهزية</a>',
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
    /* Strip anything we injected on a previous rebuild, so this is idempotent.
       The rule that makes it hold: every strip eats ALL the whitespace that
       follows what it removed, and every injection below re-emits an exact
       fixed amount. Get one side to consume \r\n while the other writes \n and
       the page drifts a few bytes on every single publish. */
    html = html.replace(/<style id="qwr-theme">[\s\S]*?<\/style>\s*/g, '');
    html = html.replace(/<!--qwr:announcement:start-->[\s\S]*?<!--qwr:announcement:end-->\s*/g, '');
    html = html.replace(/<!--qwr:site-background:start-->[\s\S]*?<!--qwr:site-background:end-->\s*/g, '');
    html = html.replace(/<body([^>]*)>/, function (m, attrs) {
      attrs = attrs.replace(/\sclass="([^"]*)"/, function (_, names) {
        var clean = names.replace(/\bhas-site-background\b/g, '').replace(/\bhas-cursor-effect\b/g, '').replace(/\s+/g, ' ').trim();
        return clean ? ' class="' + clean + '"' : '';
      });
      attrs = attrs.replace(/\sdata-cursor-style="[^"]*"/g, '').replace(/\sdata-cursor-intensity="[^"]*"/g, '');
      return '<body' + attrs + '>';
    });

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

    /* Desktop-only cursor decoration. Native cursor and click behaviour stay intact. */
    var cursor = ((settings().theme || {}).cursorEffect || {});
    if (cursor.enabled === true) {
      html = html.replace(/<body([^>]*)>/, function (m, attrs) {
        if (/\sclass="/.test(attrs)) attrs = attrs.replace(/\sclass="([^"]*)"/, ' class="$1 has-cursor-effect"');
        else attrs += ' class="has-cursor-effect"';
        attrs += ' data-cursor-style="' + esc(cursor.style || 'sparkle') + '" data-cursor-intensity="' + esc(cursor.intensity || 'balanced') + '"';
        return '<body' + attrs + '>';
      });
    }

    /* announcement bar. The `\s*` after <body> is swallowed and replaced with one
       newline, so a file that arrived with \r\n there still comes out the same
       on the next pass. */
    var ann = announcementHtml();
    if (ann) {
      html = html.replace(/(<body[^>]*>)\s*/,
        '$1\n<!--qwr:announcement:start-->\n' + ann + '\n<!--qwr:announcement:end-->\n');
    }
    return html;
  }

  function pageKey(file) {
    return String(file || '').replace(/^.*[\\/]/, '').replace(/\.html(?:[?#].*)?$/i, '') || 'index';
  }

  /* Reorder the real homepage sections, not the small regions inside them. */
  function applySectionOrder(html, file) {
    if (pageKey(file) !== 'index') return html;
    var wanted = ((settings().sectionOrder || {}).home || []).slice();
    var main = html.match(/<main id="main">([\s\S]*?)<\/main>/);
    if (!main) return html;
    var body = main[1];
    var sections = {};
    var natural = [];
    var re = /<section\b[^>]*\bdata-sec="([^"]+)"[^>]*>[\s\S]*?<\/section>/g;
    var match;
    while ((match = re.exec(body)) !== null) {
      sections[match[1]] = match[0];
      natural.push(match[1]);
    }
    if (!natural.length) return html;
    natural.forEach(function (key) { if (wanted.indexOf(key) === -1) wanted.push(key); });
    wanted = wanted.filter(function (key, i) { return sections[key] && wanted.indexOf(key) === i; });
    var first = body.indexOf(sections[natural[0]]);
    var lastSection = sections[natural[natural.length - 1]];
    var last = body.lastIndexOf(lastSection) + lastSection.length;
    var ordered = wanted.map(function (key) { return sections[key]; }).join('\n\n');
    var rebuilt = body.slice(0, first) + ordered + body.slice(last);
    return html.replace(main[1], rebuilt);
  }

  function applyHomeHero(html, file) {
    if (pageKey(file) !== 'index') return html;
    var hero = (data().home && data().home.hero) || {};
    var found = html.match(/<section\b[^>]*class="[^"]*\bhero\b[^"]*"[^>]*>[\s\S]*?<\/section>/);
    if (!found) return html;
    var block = found[0];
    function textClass(className, value) {
      if (value == null) return;
      var re = new RegExp('(<[^>]+class="[^"]*\\b' + className + '\\b[^"]*"[^>]*>)[\\s\\S]*?(<\\/[^>]+>)');
      block = block.replace(re, function (_, open, close) { return open + esc(value) + close; });
    }
    textClass('hero__title', hero.title);
    textClass('hero__slogan', hero.slogan);
    textClass('hero__desc', hero.desc);
    if (hero.ctaPrimary != null) {
      block = block.replace(/(<a\b[^>]*class="[^"]*btn--gold[^"]*"[^>]*data-wa="trial"[^>]*>)[\s\S]*?(<svg)/,
        function (_, open, svg) { return open + '\n          ' + esc(hero.ctaPrimary) + '\n          ' + svg; });
    }
    if (hero.ctaSecondary != null) {
      block = block.replace(/(<a\b[^>]*class="[^"]*btn--ghost[^"]*"[^>]*>)[\s\S]*?(<svg)/,
        function (_, open, svg) { return open + '\n          ' + esc(hero.ctaSecondary) + '\n          ' + svg; });
    }
    if (Array.isArray(hero.tags)) {
      block = block.replace(/(<div class="hero__tags">)[\s\S]*?(<\/div>)/, function (_, open, close) {
        return open + '\n' + hero.tags.map(function (tag) {
          return '        <span class="hero__tag">' + esc(tag) + '</span>';
        }).join('\n') + '\n      ' + close;
      });
    }
    return html.replace(found[0], block);
  }

  function applyPageMeta(html, file) {
    var key = pageKey(file);
    if (key === 'index') return html;
    var meta = ((settings().pageMeta || {})[key]);
    if (!meta) return html;
    if (meta.title != null) {
      html = html.replace(/(<section class="page-hero"[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/,
        function (_, open, close) { return open + esc(meta.title) + close; });
    }
    if (meta.subtitle != null) {
      html = html.replace(/(<section class="page-hero"[\s\S]*?<h1>[\s\S]*?<\/h1>\s*<p>)[\s\S]*?(<\/p>)/,
        function (_, open, close) { return open + esc(meta.subtitle) + close; });
    }
    if (meta.showHero === false) {
      html = html.replace(/<section class="page-hero"/, '<section class="page-hero" hidden');
    } else {
      html = html.replace(/<section class="page-hero"\s+hidden/, '<section class="page-hero"');
    }
    if (meta.showBreadcrumbs === false) {
      html = html.replace(/\s*<nav class="crumbs"[\s\S]*?<\/nav>/, '');
    }
    if (meta.showCta === false) {
      html = html.replace(/<section class="cta-band"/, '<section class="cta-band" hidden');
    } else {
      html = html.replace(/<section class="cta-band"\s+hidden/, '<section class="cta-band"');
    }
    return html;
  }

  /* Keep footer program links aligned with the published program list. */
  function footerColumns() {
    var footer = settings().footer || {};
    return (footer.columns || []).map(function (col) {
      var links = (col.links || []).map(function (link) {
        return '          <a href="' + esc(link.href) + '">' + esc(link.label) + '</a>';
      }).join('\n');
      return [
        '      <div>',
        '        <h3 class="footer__title">' + esc(col.title) + '</h3>',
        '        <nav class="footer__links">',
        links,
        '        </nav>',
        '      </div>'
      ].join('\n');
    }).join('\n\n');
  }

  function applyFooterSettings(html) {
    var footer = settings().footer || {};
    var columnsStart = '<!--qwr:footer-columns:start-->';
    var columnsEnd = '<!--qwr:footer-columns:end-->';
    var si = html.indexOf(columnsStart);
    var ei = html.indexOf(columnsEnd);
    if (si !== -1 && ei > si) {
      html = html.slice(0, si + columnsStart.length) + '\n' + footerColumns() + '\n' + html.slice(ei);
    }
    if (footer.about != null) {
      html = html.replace(/(<p class="footer__about" data-footer-about>)[\s\S]*?(<\/p>)/g,
        function (_, open, close) { return open + '\n          ' + esc(footer.about) + '\n        ' + close; });
    }
    if (footer.programsTitle != null) {
      html = html.replace(/(<h3 class="footer__title" data-footer-programs-title>)[\s\S]*?(<\/h3>)/g,
        function (_, open, close) { return open + esc(footer.programsTitle) + close; });
    }
    if (footer.contactTitle != null) {
      html = html.replace(/(<h3 class="footer__title" data-footer-contact-title>)[\s\S]*?(<\/h3>)/g,
        function (_, open, close) { return open + esc(footer.contactTitle) + close; });
    }
    html = html.replace(/<div class="footer__bottom">[\s\S]*?<\/div>/g,
      '<div class="footer__bottom">\n' +
      '      <span>© <span data-year>' + new Date().getFullYear() + '</span> ' + esc(footer.copyright || '') + '</span>\n' +
      '      <span>' + esc(footer.motto || '') + '</span>\n' +
      '    </div>');
    return html;
  }

  function applyFooterPrograms(html) {
    var links = visible(data().programs).map(function (p) {
      return '          <a href="programs.html#' + esc(p.id) + '">' + esc(p.title) + '</a>';
    }).join('\n');
    return html.replace(
      /(<nav\b[^>]*\bdata-footer-programs(?:="[^"]*")?[^>]*>)[\s\S]*?<\/nav>/g,
      function (_, open) { return open + '\n' + links + '\n        </nav>'; }
    );
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
    
    html = applyFooterSettings(html);
    html = applyFooterPrograms(html);

    // Social links (footer)
    if (nav.social || settings().contact) {
      var contact = settings().contact || {};
      var social = nav.social || {};
      var whatsapp = contact.whatsapp || social.whatsapp || '201130830390';
      var telegram = contact.telegram || social.telegram || 'QawareerAcademy';
      var instagram = contact.instagram || social.instagram || 'Qawareer.Academy';
      var email = contact.email || social.email || 'QawarirAcademy@gmail.com';
      
      html = html.replace(/href="https:\/\/wa\.me\/[^"]*"/g, 'href="https://wa.me/' + whatsapp + '"');
      html = html.replace(/href="https:\/\/t\.me\/[^"]*"/g, 'href="https://t.me/' + telegram + '"');
      html = html.replace(/href="https:\/\/instagram\.com\/[^"]*"/g, 'href="https://instagram.com/' + instagram + '"');
      html = html.replace(/href="mailto:[^"]*"/g, 'href="mailto:' + email + '"');
      html = html.replace(/<a\b[^>]*\bdata-mail\b[^>]*>/g, function (tag) {
        var href = 'href="mailto:' + esc(email) + '"';
        return /\bhref="[^"]*"/.test(tag) ? tag.replace(/\bhref="[^"]*"/, href) : tag.replace('<a', '<a ' + href);
      });
      html = html.replace(/<a\b[^>]*\bdata-tg\b[^>]*>/g, function (tag) {
        var href = 'href="https://t.me/' + esc(telegram) + '"';
        return /\bhref="[^"]*"/.test(tag) ? tag.replace(/\bhref="[^"]*"/, href) : tag.replace('<a', '<a ' + href);
      });
    }
    
    return html;
  }

  /* ---- add / remove is-off / is-soon on every <section data-sec="..."> --- */
  function applySections(html) {
    SEC_ORDER.forEach(function (key) {
      var vis = sectionVisible(key);
      var isOff = vis === false;
      var isSoon = vis === 'soon';

      /* strip whichever marker we added last time, then add the current one.
         Doing both in one pass is what keeps the file idempotent: publishing
         twice must not leave `is-off is-soon` behind. */
      var flag = isOff ? 'is-off' : (isSoon ? 'is-soon' : '');
      var re = new RegExp('<section([^>]*\\sdata-sec="' + key + '"[^>]*)>', 'g');
      html = html.replace(re, function (m, attrs) {
        var cleaned = attrs.replace(/\s+class="([^"]*)"/, function (c, cls) {
          var list = cls.split(/\s+/).filter(Boolean)
            .filter(function (x) { return x !== 'is-off' && x !== 'is-soon'; });
          if (flag) list.push(flag);
          return ' class="' + list.join(' ') + '"';
        });
        if (/\sclass="/.test(attrs)) return '<section' + cleaned + '>';
        return '<section' + attrs + ' class="' + flag + '">';
      });

      /* Always drop a panel we injected on an earlier publish, whether or not this
         run wants one back. Otherwise switching a section off "قريباً" and on
         again would leave the old panel behind as invisible markup.

         The strip has to consume EXACTLY what the injection below writes --
         one newline, the indent, the fence, the indent, one newline. Starting
         it at the indent instead would leave the newline in front of the
         fence behind, and the page would gain a blank line on every publish. */
      var fence = new RegExp(
        '\\n[ \\t]*<!--qwr-soon:' + key + ':start-->[\\s\\S]*?' +
        '<!--qwr-soon:' + key + ':end-->[ \\t]*\\r?\\n',
        'g'
      );
      html = html.replace(fence, '');

      if (!isSoon) return;

      /* The panel has to be a DIRECT child of the section: the CSS hides
         `> .container` and reveals `> .sec-soon`, so anything nested deeper
         would be hidden along with the content it replaces. */
      var soonHtml = secSoon(key);
      if (!soonHtml) return;

      var sectionRe = new RegExp(
        '(<section[^>]*\\sdata-sec="' + key + '"[^>]*>[\\s\\S]*?)([ \\t]*<\\/section\\s*>)'
      );
      html = html.replace(sectionRe, function (m, open, close) {
        return open + '\n      <!--qwr-soon:' + key + ':start-->\n' +
               soonHtml + '\n      <!--qwr-soon:' + key + ':end-->\n' + close;
      });
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

  // Defaults keep existing drafts compatible with the new page fields.
  var ABOUT_FIELDS = [
  {
    "key": "block1_1",
    "group": "رسالتنا والفئات المستهدفة",
    "label": "الشارة — رسالتنا",
    "value": "رسالتنا",
    "multiline": false
  },
  {
    "key": "block1_2",
    "group": "رسالتنا والفئات المستهدفة",
    "label": "العنوان — أن نكون الوجهة الأولى في تعليم القرآن للنساء ",
    "value": "أن نكون الوجهة الأولى في تعليم القرآن للنساء والأطفال",
    "multiline": false
  },
  {
    "key": "block1_3",
    "group": "رسالتنا والفئات المستهدفة",
    "label": "الأيقونة — 👩",
    "value": "👩",
    "multiline": false
  },
  {
    "key": "block1_4",
    "group": "رسالتنا والفئات المستهدفة",
    "label": "العنوان — للنساء",
    "value": "للنساء",
    "multiline": false
  },
  {
    "key": "block1_5",
    "group": "رسالتنا والفئات المستهدفة",
    "label": "النص — برامج مصممة خصيصًا للنساء، مراعية لظروفهن ومس",
    "value": "برامج مصممة خصيصًا للنساء، مراعية لظروفهن ومسؤولياتهن — سواء كانت مبتدئة، أو حافظة، أو ترغب في تحسين تلاوتها، أو تحتاج وردًا ثابتًا يناسب عملها وبيتها وأمومتها.",
    "multiline": true
  },
  {
    "key": "block1_6",
    "group": "رسالتنا والفئات المستهدفة",
    "label": "الأيقونة — 👧",
    "value": "👧",
    "multiline": false
  },
  {
    "key": "block1_7",
    "group": "رسالتنا والفئات المستهدفة",
    "label": "العنوان — للأطفال",
    "value": "للأطفال",
    "multiline": false
  },
  {
    "key": "block1_8",
    "group": "رسالتنا والفئات المستهدفة",
    "label": "النص — نؤسس الأطفال علاقة حبّ مع القرآن منذ الصغر، ب",
    "value": "نؤسس الأطفال علاقة حبّ مع القرآن منذ الصغر، بأسلوب تفاعلي وممتع يناسب عمرهم، قبل الدخول في أي حفظ مكثف.",
    "multiline": true
  },
  {
    "key": "block2_1",
    "group": "أدواتنا — نظام العمل الموحّد",
    "label": "الشارة — أدواتنا",
    "value": "أدواتنا",
    "multiline": false
  },
  {
    "key": "block2_2",
    "group": "أدواتنا — نظام العمل الموحّد",
    "label": "العنوان — نظام العمل الموحّد",
    "value": "نظام العمل الموحّد",
    "multiline": false
  },
  {
    "key": "block2_3",
    "group": "أدواتنا — نظام العمل الموحّد",
    "label": "النص — أربع أدوات نستخدمها في أغلب البرامج لأنها هي ",
    "value": "أربع أدوات نستخدمها في أغلب البرامج لأنها هي ما يصنع الفرق فعلًا.",
    "multiline": true
  },
  {
    "key": "block2_4",
    "group": "أدواتنا — نظام العمل الموحّد",
    "label": "الأيقونة — 🗺️",
    "value": "🗺️",
    "multiline": false
  },
  {
    "key": "block2_5",
    "group": "أدواتنا — نظام العمل الموحّد",
    "label": "العنوان — خريطة القرآن",
    "value": "خريطة القرآن",
    "multiline": false
  },
  {
    "key": "block2_6",
    "group": "أدواتنا — نظام العمل الموحّد",
    "label": "النص — جدول يوضّح حالة كل مقطع: قيد الحفظ، يحتاج تثب",
    "value": "جدول يوضّح حالة كل مقطع: قيد الحفظ، يحتاج تثبيت، ثابت، أو يحتاج استعادة.",
    "multiline": true
  },
  {
    "key": "block2_7",
    "group": "أدواتنا — نظام العمل الموحّد",
    "label": "الأيقونة — 📌",
    "value": "📌",
    "multiline": false
  },
  {
    "key": "block2_8",
    "group": "أدواتنا — نظام العمل الموحّد",
    "label": "العنوان — المتابعة الأسبوعية",
    "value": "المتابعة الأسبوعية",
    "multiline": false
  },
  {
    "key": "block2_9",
    "group": "أدواتنا — نظام العمل الموحّد",
    "label": "النص — هدف صغير وخطوة قادمة — واضحتان ومحددتان، بلا ",
    "value": "هدف صغير وخطوة قادمة — واضحتان ومحددتان، بلا تردد.",
    "multiline": true
  },
  {
    "key": "block2_10",
    "group": "أدواتنا — نظام العمل الموحّد",
    "label": "الأيقونة — 🤲",
    "value": "🤲",
    "multiline": false
  },
  {
    "key": "block2_11",
    "group": "أدواتنا — نظام العمل الموحّد",
    "label": "العنوان — رفقة القرآن",
    "value": "رفقة القرآن",
    "multiline": false
  },
  {
    "key": "block2_12",
    "group": "أدواتنا — نظام العمل الموحّد",
    "label": "النص — تشجيع ومتابعة إنسانية لا تقتصر على الحصة، بل ",
    "value": "تشجيع ومتابعة إنسانية لا تقتصر على الحصة، بل تمتد بين الحصص.",
    "multiline": true
  },
  {
    "key": "block2_13",
    "group": "أدواتنا — نظام العمل الموحّد",
    "label": "الأيقونة — 📊",
    "value": "📊",
    "multiline": false
  },
  {
    "key": "block2_14",
    "group": "أدواتنا — نظام العمل الموحّد",
    "label": "العنوان — التقرير الختامي",
    "value": "التقرير الختامي",
    "multiline": false
  },
  {
    "key": "block2_15",
    "group": "أدواتنا — نظام العمل الموحّد",
    "label": "النص — يوضّح ما أُنجز وما يحتاج إلى متابعة، كما تكون",
    "value": "يوضّح ما أُنجز وما يحتاج إلى متابعة، كما تكون الصورة واضحة أمامكِ.",
    "multiline": true
  },
  {
    "key": "block3_1",
    "group": "معايير النجاح",
    "label": "الشارة — معايير النجاح",
    "value": "معايير النجاح",
    "multiline": false
  },
  {
    "key": "block3_2",
    "group": "معايير النجاح",
    "label": "العنوان — كيف نعرف أن البرنامج نجح؟",
    "value": "كيف نعرف أن البرنامج نجح؟",
    "multiline": false
  },
  {
    "key": "block3_3",
    "group": "معايير النجاح",
    "label": "النص — لا نقيس النجاح بعدد الحصص الحاضرة. نقيسه بهذه",
    "value": "لا نقيس النجاح بعدد الحصص الحاضرة. نقيسه بهذه المؤشرات البسيطة.",
    "multiline": true
  },
  {
    "key": "block3_4",
    "group": "معايير النجاح",
    "label": "الأيقونة — ✅",
    "value": "✅",
    "multiline": false
  },
  {
    "key": "block3_5",
    "group": "معايير النجاح",
    "label": "العنوان — استمرارية الطالبة",
    "value": "استمرارية الطالبة",
    "multiline": false
  },
  {
    "key": "block3_6",
    "group": "معايير النجاح",
    "label": "النص — وصولها حتى نهاية البرنامج، وحرصها على عدم الا",
    "value": "وصولها حتى نهاية البرنامج، وحرصها على عدم الانقطاع.",
    "multiline": true
  },
  {
    "key": "block3_7",
    "group": "معايير النجاح",
    "label": "الأيقونة — 🎯",
    "value": "🎯",
    "multiline": false
  },
  {
    "key": "block3_8",
    "group": "معايير النجاح",
    "label": "العنوان — تحقيق الهدف",
    "value": "تحقيق الهدف",
    "multiline": false
  },
  {
    "key": "block3_9",
    "group": "معايير النجاح",
    "label": "النص — الوصول إلى الهدف المتفق عليه مسبقًا، لا أكثر ",
    "value": "الوصول إلى الهدف المتفق عليه مسبقًا، لا أكثر ولا أقل.",
    "multiline": true
  },
  {
    "key": "block3_10",
    "group": "معايير النجاح",
    "label": "الأيقونة — 📈",
    "value": "📈",
    "multiline": false
  },
  {
    "key": "block3_11",
    "group": "معايير النجاح",
    "label": "العنوان — تحسّن الخريطة",
    "value": "تحسّن الخريطة",
    "multiline": false
  },
  {
    "key": "block3_12",
    "group": "معايير النجاح",
    "label": "النص — انتقال المقاطع من \"مهتز\" و\"منسي\" إلى \"ثابت\" ف",
    "value": "انتقال المقاطع من \"مهتز\" و\"منسي\" إلى \"ثابت\" في خريطة القرآن.",
    "multiline": true
  },
  {
    "key": "block3_13",
    "group": "معايير النجاح",
    "label": "الأيقونة — 💡",
    "value": "💡",
    "multiline": false
  },
  {
    "key": "block3_14",
    "group": "معايير النجاح",
    "label": "العنوان — قدرة التطبيق",
    "value": "قدرة التطبيق",
    "multiline": false
  },
  {
    "key": "block3_15",
    "group": "معايير النجاح",
    "label": "النص — أن تطبّق الطالبة ما تعلّمه عمليًا، لا أن تحفظ",
    "value": "أن تطبّق الطالبة ما تعلّمه عمليًا، لا أن تحفظه فقط.",
    "multiline": true
  },
  {
    "key": "block3_16",
    "group": "معايير النجاح",
    "label": "الأيقونة — 💚",
    "value": "💚",
    "multiline": false
  },
  {
    "key": "block3_17",
    "group": "معايير النجاح",
    "label": "العنوان — رضا الطالبة ووليّ الأمر",
    "value": "رضا الطالبة ووليّ الأمر",
    "multiline": false
  },
  {
    "key": "block3_18",
    "group": "معايير النجاح",
    "label": "النص — شعور طرف ثالث بأن الرحلة كانت ذات قيمة.",
    "value": "شعور طرف ثالث بأن الرحلة كانت ذات قيمة.",
    "multiline": true
  },
  {
    "key": "block3_19",
    "group": "معايير النجاح",
    "label": "الأيقونة — 🔁",
    "value": "🔁",
    "multiline": false
  },
  {
    "key": "block3_20",
    "group": "معايير النجاح",
    "label": "العنوان — العودة لبرنامج لاحق",
    "value": "العودة لبرنامج لاحق",
    "multiline": false
  },
  {
    "key": "block3_21",
    "group": "معايير النجاح",
    "label": "النص — أن تطلب الطالبة أن تستمر معنا في المرحلة التا",
    "value": "أن تطلب الطالبة أن تستمر معنا في المرحلة التالية.",
    "multiline": true
  },
  {
    "key": "block4_1",
    "group": "شريط الحجز",
    "label": "الشارة — 🎁 حصة تجريبية مجانية",
    "value": "🎁 حصة تجريبية مجانية",
    "multiline": false
  },
  {
    "key": "block4_2",
    "group": "شريط الحجز",
    "label": "العنوان — اقرئي عنّا أكثر من خلال التجربة",
    "value": "اقرئي عنّا أكثر من خلال التجربة",
    "multiline": false
  },
  {
    "key": "block4_3",
    "group": "شريط الحجز",
    "label": "النص — أفضل طريقة تعرفين فيها أكاديمية قوارير هي أن ",
    "value": "أفضل طريقة تعرفين فيها أكاديمية قوارير هي أن تبدئي. تواصلي معنا واحجزي حصة تجريبية مجانية.",
    "multiline": true
  },
  {
    "key": "ctaButton",
    "group": "شريط الحجز",
    "label": "نص زر الحجز",
    "value": "احجزي الحصة التجريبية الآن",
    "multiline": false
  }
];
  function applyAboutCopy(html) {
    var blocks = pageOf('about').blocks || {};
    ABOUT_FIELDS.forEach(function (f) {
      var value = blocks[f.key] == null ? f.value : blocks[f.key];
      var pattern = new RegExp('<!--about-copy:' + f.key + ':start-->[\\s\\S]*?<!--about-copy:' + f.key + ':end-->', 'g');
      html = html.replace(pattern, function () {
        return '<!--about-copy:' + f.key + ':start-->' + esc(value) + '<!--about-copy:' + f.key + ':end-->';
      });
    });
    return html;
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
    if (offSection('faq')) return '';
    if (!sectionVisible('faq')) return '';
    return visible(data().faq).map(function (f, i) {
      /* The id is what makes a single question linkable -- from the search on
         the 404 page, from a WhatsApp message, from anywhere else. Without it
         faq.html#f3 lands at the top of the page and the reader has to hunt. */
      return [
        '        <details class="faq__item" id="' + esc(f.id || 'f' + (i + 1)) + '"' +
          (i === 0 ? ' open' : '') + '>',
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
    if (offSection('stats')) return '';
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
    if (offSection('materials')) return '';
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
  function applySeo(html, file) {
    var seo = (settings().seo || {});
    var pageFile = pageKey(file);
    
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
     12b. FLOATING ACTIONS (shared across all pages)

     One renderer so the floaters are consistent everywhere and the links
     come from config.js. The panel can edit Telegram in the settings tab,
     WhatsApp is already there. The up/down buttons are pure UI. */
  function floaters() {
    var C = settings().contact || window.SITE || {};
    var wa = 'https://wa.me/' + (C.whatsapp || '201130830390');
    var tg = 'https://t.me/' + (C.telegram || 'QawareerAcademy');

    return [
      '<!-- ================= FLOATING ================= -->',
      '<div class="floaties">',
      '  <div class="floaties__rail floaties__rail--left">',
      '    <a class="floater floater--wa" href="' + esc(wa) + '" target="_blank" rel="noopener" aria-label="تواصلي عبر واتساب" data-wa="general">',
      '      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.27A9.96 9.96 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18.2a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.11.82.83-3.1-.2-.31a8.18 8.18 0 0 1-1.26-4.39c0-4.54 3.7-8.23 8.22-8.23 2.2 0 4.26.86 5.82 2.42a8.17 8.17 0 0 1 2.41 5.82c0 4.54-3.7 8.19-8.23 8.19z"/><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.07 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35z"/></svg>',
      '    </a>',
      '    <a class="floater floater--tg" href="' + esc(tg) + '" target="_blank" rel="noopener" aria-label="تواصلي عبر تيليجرام">',
      '      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.7 4.2 2.9 11.4c-1.1.4-1.1 1.1-.2 1.4l4.7 1.5 1.8 5.5c.2.6.1.8.7.8.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.4-1.5zM7.9 13.9l8.9-5.6c.4-.3.8-.1.5.2l-7.4 6.7-.3 3.4z"/></svg>',
      '    </a>',
      '  </div>',
      '  <div class="floaties__rail floaties__rail--right">',
      '    <button class="floater floater--bottom" aria-label="الذهاب إلى أسفل الصفحة">',
      '      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
      '    </button>',
      '    <button class="floater floater--top" aria-label="العودة إلى الأعلى">',
      '      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>',
      '    </button>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  /* One signup block shared by every page. The values live under home.cta for
     compatibility with existing saved drafts, but they are site-wide. */
  function globalCtaBlock() {
    var c = (data().home || {}).cta || {};
    return [
      '      <span class="offer">' + esc(c.offer) + '</span>',
      '      <h2>' + esc(c.title) + '</h2>',
      '      <p>' + esc(c.text) + '</p>',
      '      <div class="cta-band__btns">',
      '        <a class="btn btn--gold" href="#" data-wa="trial">',
      '          ' + esc(c.button),
      "          <svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\"><path fill-rule=\"evenodd\" d=\"M12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.27A9.96 9.96 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18.2a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.11.82.83-3.1-.2-.31a8.18 8.18 0 0 1-1.26-4.39c0-4.54 3.7-8.23 8.22-8.23 2.2 0 4.26.86 5.82 2.42a8.17 8.17 0 0 1 2.41 5.82c0 4.54-3.7 8.19-8.23 8.19z\"/><path d=\"M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.07 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35z\"/></svg>",
      '        </a>',
      '      </div>'
    ].join('\n');
  }

  function applyGlobalCta(html) {
    var pattern = /(<section\b[^>]*class="[^"]*\bcta-band\b[^"]*"[^>]*>\s*<div class="container">)[\s\S]*?(?=\s*<p class="cta-band__note">)/g;
    return html.replace(pattern, function (_, opening) {
      return opening + '\n' + globalCtaBlock() + '\n';
    });
  }

  /* ==================================================================
     EXPORT
     ================================================================== */
  global.RENDER = {
    esc: esc,
    programCards: programCards,
    programDetails: programDetails,
    coursesSection: coursesSection,
    homeCoursesSection: homeCoursesSection,
    campaignSliderSection: campaignSliderSection,
    applyCampaignPlacements: applyCampaignPlacements,
    applyPageCleanup: applyPageCleanup,
    applyHomeHero: applyHomeHero,
    applyPageMeta: applyPageMeta,
    priceTiers: priceTiers,
    priceCards: priceCards,
    priceIntro: priceIntro,
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
    /* home blocks */
    globalCtaBlock: globalCtaBlock,
    homeCtaBlock: globalCtaBlock,
    applyGlobalCta: applyGlobalCta,
    aboutIntroBlock: aboutIntroBlock,
    whyBlock: whyBlock,
    programsHead: programsHead,
    materialsTeaser: materialsTeaser,
    searchIndex: searchIndex,
    quickLinks: quickLinks,
    videoBlock: videoBlock,
    videoEmbedUrl: videoEmbedUrl,
    videoId: videoId,
    secHeadHtml: secHeadHtml,
    /* section visibility */
    sectionVisible: sectionVisible,
    sectionState: sectionState,
    secIsBinary: secIsBinary,
    secSoon: secSoon,
    secEmpty: secEmpty,
    regionEmpty: regionEmpty,
    floaters: floaters,
    applySections: applySections,
    applySettings: applySettings,
    applySectionOrder: applySectionOrder,
    applyFooterPrograms: applyFooterPrograms,
    applyFooterSettings: applyFooterSettings,
    ABOUT_FIELDS: ABOUT_FIELDS,
    applyAboutCopy: applyAboutCopy,
    applyNavigation: applyNavigation,
    applyTexts: applyTexts,
    applySeo: applySeo,
    SEC_ORDER: SEC_ORDER,
    SEC_BINARY: SEC_BINARY,
    SEC_REGIONS: SEC_REGIONS
  };

})(window);

(function () {
  'use strict';

  var C = window.CONTENT || {};
  var nav = document.getElementById('admTabs');
  var panels = document.getElementById('admPanels');
  var grouping = false;
  var dashboardOn = false;
  var initialTabOpened = false;
  var navSearch = document.getElementById('admNavSearch');
  var navEmpty = document.getElementById('admNavEmpty');

  var GROUPS = [
    { label: 'المحتوى', ids: ['home', 'pages', 'campaigns', 'programs', 'courses', 'packages', 'reviews', 'faq'] },
    { label: 'تجربة الموقع', ids: ['sections', 'sectionOrder', 'navigation', 'footer'] },
    { label: 'التواصل', ids: ['announcement', 'waMessages', 'contact'] },
    { label: 'الهوية والظهور', ids: ['theme', 'seo'] }
  ];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function liveCount(items) {
    return (items || []).filter(function (item) { return item.visible !== false; }).length;
  }

  function renderDashboard() {
    var programs = C.programs || [];
    var reviews = C.testimonials || [];
    var faq = C.faq || [];
    var sections = C.sections || {};
    var activeSections = Object.keys(sections).filter(function (key) {
      return !sections[key] || sections[key].visible !== false;
    }).length;

    dashHost.className = 'adm-v2-dashboard';
    dashHost.innerHTML =
      '<section class="adm-v2-hero">' +
        '<div><h2>الموقع تحت سيطرتكِ</h2>' +
        '<p>ابدئي من أكثر مهمة تحتاجينها الآن. التغييرات تُحفظ كمسودة محلية قبل المرور على شاشة المراجعة والنشر.</p></div>' +
        '<button class="adm-v2-hero__action" type="button" data-go="home">تعديل الصفحة الرئيسية</button>' +
      '</section>' +
      '<section class="adm-v2-stats" aria-label="ملخص المحتوى">' +
        stat('البرامج المفعلة', liveCount(programs), programs.length + ' إجمالي') +
        stat('آراء الطالبات', liveCount(reviews), reviews.length + ' إجمالي') +
        stat('الأسئلة الشائعة', liveCount(faq), faq.length + ' إجمالي') +
        stat('الأقسام المفعلة', activeSections, 'على صفحات الموقع') +
      '</section>' +
      '<section class="adm-v2-grid">' +
        '<div class="adm-v2-box"><h3>اختصارات سريعة</h3><p>أكثر المهام استخداماً بدون البحث بين التبويبات.</p>' +
          '<div class="adm-v2-quick">' +
            quick('home', 'تعديل الرئيسية') + quick('programs', 'إدارة البرامج') +
            quick('announcement', 'إضافة إعلان') + quick('footer', 'تعديل الفوتر') +
          '</div></div>' +
        '<div class="adm-v2-box"><h3>جاهزية المحتوى</h3><p>ملخص سريع قبل أي عملية نشر.</p>' +
          '<div class="adm-v2-checks">' +
            check('المحتوى المركزي محمّل') + check('البرامج مرتبطة بالموقع') +
            check('النسخة الحالية محفوظة محلياً') +
          '</div></div>' +
      '</section>';

    Array.prototype.forEach.call(dashHost.querySelectorAll('[data-go]'), function (button) {
      button.addEventListener('click', function () { goTo(button.getAttribute('data-go')); });
    });
  }

  function stat(label, value, note) {
    return '<div class="adm-v2-stat"><span>' + escapeHtml(label) + '</span><strong>' +
      escapeHtml(value) + '</strong><span>' + escapeHtml(note) + '</span></div>';
  }

  function quick(id, label) {
    return '<button type="button" data-go="' + id + '">' + escapeHtml(label) + ' ←</button>';
  }

  function check(label) {
    return '<div class="adm-v2-check"><i>✓</i><span>' + escapeHtml(label) + '</span></div>';
  }

  function tabId(button) {
    var text = button.textContent || '';
    var map = {
      'الأقسام': 'sections', 'المظهر': 'theme', 'الإعدادات': 'contact', 'إعلان': 'announcement',
      'رسائل الواتساب': 'waMessages', 'ترتيب الأقسام': 'sectionOrder', 'القائمة': 'navigation',
      'الفوتر': 'footer', 'النصوص': 'texts', 'SEO': 'seo', 'البرامج': 'programs', 'الدورات': 'courses', 'الحملات': 'campaigns',
      'الفئات': 'packages', 'الآراء': 'reviews', 'الأسئلة': 'faq', 'الصفحات': 'pages', 'الرئيسية': 'home'
    };
    var found = Object.keys(map).sort(function (a, b) { return b.length - a.length; })
      .filter(function (label) { return text.indexOf(label) !== -1; })[0];
    return found ? map[found] : '';
  }

  function decorateTabs() {
    if (grouping || !nav) return;
    if (nav.querySelector('.adm-v2-group')) return;
    var coreButtons = Array.prototype.slice.call(nav.querySelectorAll('.adm-tab'));
    if (!coreButtons.length) return;
    grouping = true;

    coreButtons.forEach(function (button) {
      if (!button.dataset.v2Id) button.dataset.v2Id = tabId(button);
      button.addEventListener('click', function () {
        dashboardOn = false;
        panels.hidden = false;
      });
    });

    nav.innerHTML = '';
    GROUPS.forEach(function (group) {
      var title = document.createElement('div');
      title.className = 'adm-v2-group';
      title.textContent = group.label;
      nav.appendChild(title);

      group.ids.forEach(function (id) {
        if (id === 'dashboard') {
          var dashboardButton = document.createElement('button');
          dashboardButton.type = 'button';
          dashboardButton.className = 'adm-tab adm-v2-dashboard-tab' + (dashboardOn ? ' is-on' : '');
          dashboardButton.dataset.v2Id = 'dashboard';
          dashboardButton.innerHTML = '⌂ نظرة عامة <span class="adm-tab__n">1</span>';
          dashboardButton.addEventListener('click', showDashboard);
          nav.appendChild(dashboardButton);
          return;
        }
        var button = coreButtons.filter(function (item) { return item.dataset.v2Id === id; })[0];
        if (button) nav.appendChild(button);
      });
    });

    /* The broad static-text editor is intentionally withheld until every key
       has a real marker in the public pages. It was one of the audit failures. */
    coreButtons.filter(function (button) { return button.dataset.v2Id === 'texts'; })
      .forEach(function (button) { button.hidden = true; });

    grouping = false;
    if (!initialTabOpened) {
      initialTabOpened = true;
      window.requestAnimationFrame(function () { goTo('home'); });
    }
    filterTabs(navSearch ? navSearch.value : '');
  }

  function normalizeSearch(value) {
    return String(value || '').toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();
  }

  function filterTabs(value) {
    if (!nav) return;
    var query = normalizeSearch(value);
    var visibleCount = 0;
    Array.prototype.forEach.call(nav.querySelectorAll('.adm-tab'), function (button) {
      var matched = !query || normalizeSearch(button.textContent).indexOf(query) !== -1;
      button.hidden = !matched || button.dataset.v2Id === 'texts';
      if (!button.hidden) visibleCount += 1;
    });
    Array.prototype.forEach.call(nav.querySelectorAll('.adm-v2-group'), function (group) {
      var next = group.nextElementSibling;
      var any = false;
      while (next && !next.classList.contains('adm-v2-group')) {
        if (next.classList.contains('adm-tab') && !next.hidden) any = true;
        next = next.nextElementSibling;
      }
      group.hidden = !any;
    });
    if (navEmpty) navEmpty.hidden = visibleCount > 0;
  }

  if (navSearch) navSearch.addEventListener('input', function () { filterTabs(navSearch.value); });

  function showDashboard() {
    dashboardOn = true;
    renderDashboard();
    dashHost.hidden = false;
    panels.hidden = true;
    decorateTabs();
    Array.prototype.forEach.call(nav.querySelectorAll('.adm-tab'), function (button) {
      button.classList.toggle('is-on', button.dataset.v2Id === 'dashboard');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goTo(id) {
    dashboardOn = false;
    decorateTabs();
    var button = nav.querySelector('[data-v2-id="' + id + '"]');
    if (button) button.click();
  }

  function validationIssues() {
    var content = window.QWR_ADMIN_API && window.QWR_ADMIN_API.getContent ? window.QWR_ADMIN_API.getContent() : C;
    var issues = [];
    function add(tab, text) { issues.push({ tab: tab, text: text }); }
    (content.campaigns || []).forEach(function (item, index) {
      if (item.visible === false) return;
      var name = item.title || ('الإعلان رقم ' + (index + 1));
      if (!String(item.title || '').trim()) add('campaigns', 'يوجد إعلان مفعّل بدون عنوان.');
      if (item.startAt && item.endAt && new Date(item.startAt) > new Date(item.endAt)) add('campaigns', 'تاريخ نهاية «' + name + '» أقدم من تاريخ البداية.');
      if (item.link && !/^(https?:\/\/|mailto:|tel:|#|[\w-]+\.html)/i.test(item.link)) add('campaigns', 'رابط «' + name + '» غير مكتمل.');
    });
    (content.courses || []).forEach(function (item, index) {
      if (item.visible === false) return;
      if (!String(item.title || '').trim()) add('courses', 'يوجد كورس مفعّل بدون اسم (رقم ' + (index + 1) + ').');
      if (!String(item.details || item.short || '').trim()) add('courses', 'الدورة «' + (item.title || index + 1) + '» تحتاج وصفًا مختصرًا.');
    });
    (content.programs || []).forEach(function (item, index) {
      if (item.visible === false) return;
      if (!String(item.title || item.name || '').trim()) add('programs', 'يوجد برنامج مفعّل بدون اسم (رقم ' + (index + 1) + ').');
    });
    var pageMeta = content.settings && content.settings.pageMeta || {};
    Object.keys(pageMeta).forEach(function (key) {
      if (pageMeta[key].showHero !== false && !String(pageMeta[key].title || '').trim()) add('pages', 'صفحة «' + key + '» مفعّل فيها العنوان الرئيسي لكنه فارغ.');
    });
    var contact = content.settings && content.settings.contact || {};
    if (!String(contact.whatsapp || '').replace(/\D/g, '')) add('contact', 'رقم واتساب غير موجود.');
    if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) add('contact', 'صيغة البريد الإلكتروني غير صحيحة.');
    return issues;
  }

  var checkButton = document.getElementById('btnCheck');
  var checkCount = document.getElementById('admCheckCount');
  var checkModal = document.getElementById('admCheckModal');
  var checkClose = document.getElementById('admCheckClose');
  var checkBody = document.getElementById('admCheckBody');
  function refreshCheckCount() {
    var count = validationIssues().length;
    if (checkCount) { checkCount.hidden = count === 0; checkCount.textContent = count; }
    return count;
  }
  function openCheck() {
    if (!checkModal || !checkBody) return;
    var issues = validationIssues();
    checkBody.innerHTML = '<div class="adm-check-summary"><h2>' + (issues.length ? 'فيه ' + issues.length + ' ملاحظة تحتاج مراجعة' : 'التعديلات جاهزة للمعاينة') + '</h2><p>' + (issues.length ? 'اضغط على أي ملاحظة للانتقال مباشرة إلى مكان تعديلها. الملاحظات لا تمنعك من المعاينة.' : 'لم نجد حقولًا أساسية ناقصة أو تعارضًا في مواعيد الإعلانات.') + '</p></div>' +
      (issues.length ? '<div class="adm-check-list">' + issues.map(function (issue) { return '<button class="adm-check-item" type="button" data-check-go="' + escapeHtml(issue.tab) + '"><span>' + escapeHtml(issue.text) + '</span><b>اذهب للتعديل ←</b></button>'; }).join('') + '</div>' : '<div class="adm-check-ok">✓ كل الحقول الأساسية سليمة</div>');
    Array.prototype.forEach.call(checkBody.querySelectorAll('[data-check-go]'), function (button) {
      button.addEventListener('click', function () { checkModal.hidden = true; goTo(button.dataset.checkGo); });
    });
    checkModal.hidden = false;
    refreshCheckCount();
  }
  if (checkButton) checkButton.addEventListener('click', openCheck);
  if (checkClose) checkClose.addEventListener('click', function () { checkModal.hidden = true; });
  document.addEventListener('input', function () { window.clearTimeout(refreshCheckCount.timer); refreshCheckCount.timer = window.setTimeout(refreshCheckCount, 160); });
  document.addEventListener('change', refreshCheckCount);

  if (nav) {
    new MutationObserver(function () {
      if (!grouping) window.requestAnimationFrame(decorateTabs);
    }).observe(nav, { childList: true });
  }

  function disablePreviewPublishing() {
    var publish = document.getElementById('btnPublish');
    if (!publish) return;
    if (!publish.disabled) publish.disabled = true;
    publish.textContent = 'المراجعة والنشر — بعد الاعتماد';
    publish.title = 'النشر معطّل في النسخة التجريبية';
  }

  disablePreviewPublishing();
  document.addEventListener('DOMContentLoaded', disablePreviewPublishing);
  var previewPublishButton = document.getElementById('btnPublish');
  if (previewPublishButton) {
    previewPublishButton.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      disablePreviewPublishing();
    }, true);
  }

  var contentPreviewOpen = document.getElementById('contentPreviewOpen');
  var contentPreviewClose = document.getElementById('contentPreviewClose');
  var contentPreviewModal = document.getElementById('contentPreviewModal');
  var contentPreviewFrame = document.getElementById('contentPreviewFrame');
  var livePreviewFiles = {};
  function showPreviewFile(file) {
    if (!contentPreviewFrame || !livePreviewFiles[file]) return;
    var base = new URL('.', document.baseURI).href;
    var html = livePreviewFiles[file].replace('<head>', '<head><base href="' + base + '">');
    contentPreviewFrame.removeAttribute('src');
    contentPreviewFrame.srcdoc = html;
  }
  if (contentPreviewFrame) {
    contentPreviewFrame.addEventListener('load', function () {
      var doc = contentPreviewFrame.contentDocument;
      if (!doc || doc.documentElement.dataset.adminPreviewBound) return;
      doc.documentElement.dataset.adminPreviewBound = '1';
      doc.addEventListener('click', function (event) {
        var link = event.target.closest && event.target.closest('a[href]');
        if (!link) return;
        var raw = link.getAttribute('href') || '';
        var file = raw.split('#')[0] || 'index.html';
        if (!livePreviewFiles[file]) return;
        event.preventDefault();
        showPreviewFile(file);
      });
    });
  }
  function openContentPreview() {
    if (!contentPreviewModal || !contentPreviewFrame) return;
    contentPreviewModal.hidden = false;
    contentPreviewFrame.removeAttribute('src');
    contentPreviewFrame.srcdoc = '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><body style="font-family:Tahoma;padding:40px;text-align:center;color:#0b5138">جاري تجهيز معاينة التعديلات الحالية…</body></html>';
    if (window.QWR_ADMIN_API && window.QWR_ADMIN_API.rebuildPages) {
      window.QWR_ADMIN_API.rebuildPages().then(function (files) {
        livePreviewFiles = {};
        files.forEach(function (item) { livePreviewFiles[item.file] = item.html; });
        showPreviewFile('index.html');
      }).catch(function () {
        contentPreviewFrame.removeAttribute('srcdoc');
        contentPreviewFrame.setAttribute('src', contentPreviewFrame.dataset.src);
      });
    } else {
      contentPreviewFrame.removeAttribute('srcdoc');
      contentPreviewFrame.setAttribute('src', contentPreviewFrame.dataset.src);
    }
  }
  function closeContentPreview() {
    if (contentPreviewModal) contentPreviewModal.hidden = true;
  }
  if (contentPreviewOpen) contentPreviewOpen.addEventListener('click', openContentPreview);
  if (contentPreviewClose) contentPreviewClose.addEventListener('click', closeContentPreview);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && contentPreviewModal && !contentPreviewModal.hidden) closeContentPreview();
    if (event.key === 'Escape' && checkModal && !checkModal.hidden) checkModal.hidden = true;
  });

  window.requestAnimationFrame(function () {
    decorateTabs();
    refreshCheckCount();
  });
})();

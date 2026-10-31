(function () {
  'use strict';

  var C = window.CONTENT || {};
  var nav = document.getElementById('admTabs');
  var panels = document.getElementById('admPanels');
  var dashHost = document.getElementById('admV2Dashboard');
  var search = document.getElementById('admV2Search');
  var grouping = false;
  var dashboardOn = true;

  var GROUPS = [
    { label: 'نظرة عامة', ids: ['dashboard'] },
    { label: 'المحتوى', ids: ['home', 'pages', 'programs', 'packages', 'reviews', 'faq'] },
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
      'الفوتر': 'footer', 'النصوص': 'texts', 'SEO': 'seo', 'البرامج': 'programs',
      'الفئات': 'packages', 'الآراء': 'reviews', 'الأسئلة': 'faq', 'الصفحات': 'pages', 'الرئيسية': 'home'
    };
    var found = Object.keys(map).sort(function (a, b) { return b.length - a.length; })
      .filter(function (label) { return text.indexOf(label) !== -1; })[0];
    return found ? map[found] : '';
  }

  function decorateTabs() {
    if (grouping || !nav) return;
    if (nav.querySelector('.adm-v2-dashboard-tab')) return;
    var coreButtons = Array.prototype.slice.call(nav.querySelectorAll('.adm-tab'));
    if (!coreButtons.length) return;
    grouping = true;

    coreButtons.forEach(function (button) {
      if (!button.dataset.v2Id) button.dataset.v2Id = tabId(button);
      button.addEventListener('click', function () {
        dashboardOn = false;
        dashHost.hidden = true;
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
  }

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

  if (search) {
    search.addEventListener('input', function () {
      var query = search.value.trim().toLowerCase();
      decorateTabs();
      Array.prototype.forEach.call(nav.querySelectorAll('.adm-tab'), function (button) {
        if (button.dataset.v2Id === 'dashboard') return;
        button.hidden = query && button.textContent.toLowerCase().indexOf(query) === -1;
      });
    });
  }

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
    new MutationObserver(disablePreviewPublishing).observe(previewPublishButton, {
      attributes: true,
      attributeFilter: ['disabled']
    });
  }

  window.requestAnimationFrame(function () {
    decorateTabs();
    showDashboard();
  });
})();

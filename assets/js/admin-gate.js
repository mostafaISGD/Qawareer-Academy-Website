/* =============================================================================
   ADMIN GATE — the lock in front of /admin.html

   WHAT THIS ACTUALLY PROTECTS (and what it does not — please read):

   Publishing to the live site needs the GitHub token, and that token is only
   ever in the owner's browser (localStorage). So even today an open admin.html
   cannot republish anything: a visitor would find the panel UI, edit a copy in
   their own browser, and that copy would go nowhere.

   This gate closes the remaining gap: the panel code itself is not loaded
   until the passphrase is entered, so an accidental visitor sees a password
   screen instead of the editor. It is a LOCK ON THE DOOR, not on the safe —
   the passphrase hash lives in this public file, so someone who reads the
   source can get past it. Real authentication needs a server, and a static
   site has none. For that, see ADMIN.md → «حماية لوحة التحكم» for the
   Cloudflare Access option, which IS real authentication.

   TO CHANGE THE PASSPHRASE
   -----------------------
   1. node _tools/check_admin_gate.js  -> copy the hash it prints for your word
      (or compute it in the panel's own console: sha256('your word'))
   2. replace GATE_HASH below with that hash
   3. to remove the lock completely, delete this file and put
      <script src="assets/js/admin.js"></script> back at the end of admin.html
   ========================================================================== */
(function () {
  'use strict';

  /* sha256('Qawarir-2026') — change both this and the note above together */
  var GATE_HASH = '4a563069a35619c5990cfd1aed07eb16daefe3352b974236422aaac19855e91b';

  var SESSION_KEY = 'qwr-gate-ok';     // this browser tab only
  var REMEMBER_KEY = 'qwr-gate-remember';

  function $(sel) { return document.querySelector(sel); }

  function unlocked() {
    try {
      return sessionStorage.getItem(SESSION_KEY) === GATE_HASH ||
             localStorage.getItem(REMEMBER_KEY) === GATE_HASH;
    } catch (e) {
      return false;                     // private mode with storage blocked
    }
  }

  function openPanel() {
    var gate = $('#admGate');
    if (gate) gate.parentNode.removeChild(gate);
    document.body.classList.remove('is-locked');

    // admin.js is deliberately not a <script> tag in admin.html: nothing loads
    // the editor until this point, so a wrong guess cannot poke at it.
    var s = document.createElement('script');
    s.src = 'assets/js/admin.js';
    document.body.appendChild(s);
  }

  function fail(form, input, msg) {
    form.classList.add('is-wrong');
    input.select();
    var box = $('#gateMsg');
    box.textContent = msg;
    box.hidden = false;
    window.setTimeout(function () { form.classList.remove('is-wrong'); }, 420);
  }

  function build() {
    var gate = document.createElement('div');
    gate.id = 'admGate';
    gate.className = 'gate';
    gate.innerHTML =
      '<form class="gate__card" id="gateForm" autocomplete="off">' +
        '<div class="gate__ico" aria-hidden="true">🔒</div>' +
        '<h1 class="gate__title">لوحة تحكم أكاديمية قوارير</h1>' +
        '<p class="gate__sub">الصفحة دي مخصوص للتعديل على محتوى الموقع.</p>' +
        '<label class="gate__label" for="gatePass">كلمة السر</label>' +
        '<input class="gate__in" id="gatePass" type="password" dir="ltr" ' +
          'inputmode="text" spellcheck="false" autocapitalize="off" ' +
          'autocorrect="off" required>' +
        '<p class="gate__msg" id="gateMsg" role="alert" hidden></p>' +
        '<button class="btn btn--green gate__go" type="submit">فتح اللوحة</button>' +
        '<label class="gate__keep">' +
          '<input type="checkbox" id="gateKeep">' +
          '<span>افتكريني على الجهاز ده</span>' +
        '</label>' +
        '<p class="gate__hint">لو نسيتي كلمة السر، افتحي ' +
          '<code>admin.html</code> على GitHub وغيّريها في ' +
          '<code>assets/js/admin-gate.js</code>.</p>' +
      '</form>';
    document.body.appendChild(gate);
    document.body.classList.add('is-locked');

    var form = $('#gateForm');
    var input = $('#gatePass');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = $('#gateMsg');
      msg.hidden = true;

      if (typeof window.sha256 !== 'function') {
        // never fail open: without the hash function there is no way to check
        fail(form, input, 'ملف الحماية لم يُحمّل. تأكّدي إن اتصل بالإنترنت وأعيدي تحميل الصفحة.');
        return;
      }

      var got = window.sha256(input.value);
      if (got !== GATE_HASH) {
        fail(form, input, 'كلمة السر غلط. جرّبي تاني.');
        return;
      }

      try {
        sessionStorage.setItem(SESSION_KEY, GATE_HASH);
        if ($('#gateKeep').checked) localStorage.setItem(REMEMBER_KEY, GATE_HASH);
      } catch (err) { /* storage blocked: the panel still opens for this tab */ }

      openPanel();
    });

    input.focus();
  }

  if (unlocked()) {
    openPanel();
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
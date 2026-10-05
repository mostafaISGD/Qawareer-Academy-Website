/* ==========================================================================
   أكاديمية قوارير — Qawareer Academy
   الإعدادات المركزية — غيّر هنا مرة واحدة فقط

   Central config. Change values here and they update across the whole site.
   All links are built at runtime from these values, so moving the site
   to another host never breaks them.
   ========================================================================== */
window.SITE = {
  /* ---- Identity ---- */
  name:      'أكاديمية قوارير',
  nameEn:    'Qawareer Academy',
  slogan:    'رفقاً بقلوبكن.. وقرباً لكتاب الله',
  tagline:   'برامج قرآنية وتربوية رحيمة',

  /* ---- Contact (change only here) ---- */
  phoneDisplay: '01130830390',        // as shown to visitors
  whatsapp:     '201130830390',       // international, no "+" and no leading 0
  email:        'QawarirAcademy@gmail.com',
  telegram:     'QawareerAcademy',
  instagram:    'Qawareer.Academy',

  /* ---- Audience ---- */
  audience: 'النساء والأطفال',
  location: 'أونلاين بالكامل',

  /* ---- Social / links ---- */
  siteUrl: '',   // leave empty on GitHub Pages; set to your domain after connecting one

  /* ---- Tracking ---- */
  /* Google Analytics 4.
     1. Go to https://analytics.google.com
     2. Create a property -> pick "Web"
     3. Copy the "Measurement ID" (looks like G-XXXXXXXXXX)
     4. Paste it below. Leave empty ('') and analytics stays OFF. */
  gaId: '',

  /* Optional: count button clicks locally (no external service).
     Works with zero setup - stores counts in this browser only. */
  localStats: true,
};
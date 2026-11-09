/* قالب الصفحة: يحوّل ملفات المحتوى (content/*.json) إلى HTML ثابت.
   لا تضع نصوصاً خاصة بعميل هنا — كل المحتوى يأتي من مجلد content. */

const ICONS = ["briefcase", "users", "heart", "home", "doc", "scale", "shield", "coins", "lock", "clock", "eye", "target", "building", "globe"];
const SOCIAL = [
  ["x", "إكس (تويتر)", true], ["linkedin", "لينكد إن", true], ["instagram", "إنستغرام", false],
  ["snapchat", "سناب شات", false], ["tiktok", "تيك توك", true], ["youtube", "يوتيوب", true], ["facebook", "فيسبوك", true],
];

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const list = (v) => (Array.isArray(v) ? v.filter((x) => x != null && x !== "") : []);
const icon = (name, cls = "") => `<svg class="icon${cls ? " " + cls : ""}"><use href="#i-${name}"/></svg>`;
const safeIcon = (name) => (ICONS.includes(name) ? name : "scale");
/* يسمح فقط بروابط http/https والمسارات المحلية — يمنع javascript: وغيرها */
const url = (v) => { const s = String(v ?? "").trim(); return /^(https?:\/\/|\/(?!\/))/i.test(s) ? s : ""; };
const paragraphs = (t) => String(t ?? "").split(/\n+/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("\n      ");
/* العنوان: *كلمة* تُلوَّن بلون التمييز، والسطر الجديد يصبح فاصل سطر */
const headline = (t) => esc(t).replace(/\*([^*]+)\*/g, "<em>$1</em>").replace(/\n+/g, "<br>");
const head = (s, center) => `<div class="section-head${center ? " center" : ""} reveal">
      ${s.kicker ? `<span class="kicker">${esc(s.kicker)}</span>` : ""}
      <h2>${esc(s.title)}</h2>
      ${s.intro ? `<p>${esc(s.intro)}</p>` : ""}
    </div>`;

function render(c) {
  const { identity: id, hero, stats, about, services, why, team, testimonials: tm, contact: ct, seo, theme, assets } = c;
  const card = hero.card || {};
  const cta = ct.cta || {};
  const form = ct.form || {};

  const fullName = [id.name, id.tagline].filter(Boolean).join(" ");
  const waNumber = String(ct.whatsapp ?? "").replace(/\D/g, "").replace(/^00/, "");
  const waMessage = ct.whatsappMessage || "السلام عليكم، أرغب في حجز استشارة قانونية.";
  const waHref = (topic) => waNumber
    ? `href="https://wa.me/${waNumber}?text=${encodeURIComponent(topic ? waMessage + "\nنوع الاستشارة: " + topic : waMessage)}" target="_blank" rel="noopener"`
    : `href="#contact"`;
  const tel = String(ct.phone ?? "").replace(/[^\d+]/g, "");

  const svcItems = list(services.items);
  const whyItems = list(why.items);
  const members = list(team.members);
  const reviews = list(tm.items);
  const statItems = list(stats.items);
  const showTeam = team.show !== false && members.length > 0;
  const showReviews = tm.show !== false && reviews.length > 0;
  const showStats = stats.show !== false && statItems.length > 0;
  const showWhy = whyItems.length > 0;

  const navLinks = [
    ["#about", "من نحن", true], ["#services", "خدماتنا", svcItems.length > 0], ["#why", why.navLabel || "لماذا نحن", showWhy],
    ["#team", "فريق العمل", showTeam], ["#reviews", "آراء العملاء", showReviews], ["#contact", "تواصل معنا", true],
  ].filter((l) => l[2]);

  const logo = `${url(id.logo) ? `<img class="logo-img" src="${esc(url(id.logo))}" alt="${esc(fullName)}">` : `<svg class="logo-mark"><use href="#i-logo"/></svg>`}
      ${url(id.logo) && id.logoShowName === false ? "" : `<span class="logo-text"><b>${esc(id.name)}</b><span>${esc(id.tagline)}</span></span>`}`;

  /* ---------- SEO ---------- */
  const siteUrl = String(seo.siteUrl ?? "").trim().replace(/\/+$/, "");
  const abs = (p) => (url(p) ? (/^https?:/i.test(p) ? p : siteUrl + p) : "");
  const title = seo.title || fullName;
  const desc = seo.description || hero.lead || "";
  const ogImage = abs(seo.ogImage) || abs(id.logo);
  const social = SOCIAL.map(([k, label, fill]) => [k, label, fill, url((ct.social || {})[k])]).filter((s) => s[3]);
  const ld = {
    "@context": "https://schema.org", "@type": "LegalService", name: fullName, description: desc,
    ...(siteUrl && { url: siteUrl }), ...(ogImage && { image: ogImage }),
    ...(tel && { telephone: tel }), ...(ct.email && { email: ct.email }),
    ...(ct.address && { address: { "@type": "PostalAddress", streetAddress: ct.address, addressCountry: seo.country || "SA" } }),
    ...(social.length && { sameAs: social.map((s) => s[3]) }),
  };

  const heroStyle = url(hero.image)
    ? ` style="background-image:linear-gradient(160deg,rgba(var(--navy-rgb),.95),rgba(var(--navy-rgb),.78)),url('${esc(url(hero.image))}')"` : "";
  const aboutStyle = url(about.image)
    ? ` style="background-image:linear-gradient(180deg,rgba(var(--navy-rgb),.35),rgba(var(--navy-rgb),.92)),url('${esc(url(about.image))}')"` : "";

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${seo.keywords ? `<meta name="keywords" content="${esc(seo.keywords)}">\n` : ""}${seo.noindex ? `<meta name="robots" content="noindex, nofollow">\n` : ""}${seo.googleVerification ? `<meta name="google-site-verification" content="${esc(seo.googleVerification)}">\n` : ""}${siteUrl ? `<link rel="canonical" href="${esc(siteUrl)}/">\n` : ""}<meta name="theme-color" content="${theme.primary}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ar_SA">
<meta property="og:site_name" content="${esc(fullName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
${siteUrl ? `<meta property="og:url" content="${esc(siteUrl)}/">\n` : ""}${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">\n<meta name="twitter:card" content="summary_large_image">\n` : ""}<link rel="icon" href="${esc(url(id.favicon) || theme.faviconData)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Reem+Kufi:wght@500;700&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<style>
${theme.css}
${assets.css}</style>
</head>

<body>

${assets.icons}
<!-- ============ الهيدر ============ -->
<header class="header" id="header">
  <div class="container">
    <a href="#top" class="logo" aria-label="${esc(fullName)} - الرئيسية">
      ${logo}
    </a>
    <nav class="nav" id="nav" aria-label="التنقل الرئيسي">
      ${navLinks.map(([h, l]) => `<a href="${h}">${esc(l)}</a>`).join("\n      ")}
    </nav>
    <div class="header-actions">
      <a class="btn btn-wa" ${waHref()}>
        ${icon("wa", "icon-fill")}
        <span><span class="long">احجز </span>استشارة</span>
      </a>
      <button class="menu-btn" id="menuBtn" aria-label="فتح القائمة" aria-expanded="false" aria-controls="nav">
        ${icon("menu")}
      </button>
    </div>
  </div>
</header>

<main id="top">

<!-- ============ الواجهة ============ -->
<div class="hero${heroStyle ? " has-img" : ""}"${heroStyle}>
  <div class="container hero-grid">
    <div>
      ${hero.eyebrow ? `<span class="eyebrow"><i></i>${esc(hero.eyebrow)}</span>` : ""}
      <h1>${headline(hero.title)}</h1>
      <p class="lead">${esc(hero.lead)}</p>
      <div class="hero-cta">
        <a class="btn btn-wa btn-lg" ${waHref()}>
          ${icon("wa", "icon-fill")}
          ${esc(hero.primaryButton || "احصل على استشارة عبر واتساب")}
        </a>
        <a class="btn btn-ghost btn-lg" href="#services">${esc(hero.secondaryButton || "تعرّف على خدماتنا")}</a>
      </div>
      <ul class="hero-trust">
        ${list(hero.trust).map((t) => `<li>${icon("check")}${esc(t)}</li>`).join("\n        ")}
      </ul>
    </div>
${list(card.steps).length ? `
    <aside class="hero-card reveal">
      <h2>${esc(card.title)}</h2>
      <p>${esc(card.text)}</p>
      <ul class="steps">
        ${list(card.steps).map((s, i) => `<li><span class="num">${i + 1}</span><div><b>${esc(s.title)}</b><span>${esc(s.text)}</span></div></li>`).join("\n        ")}
      </ul>
      <a class="btn btn-gold btn-block" ${waHref()}>${esc(card.button || "ابدأ الآن")}</a>
    </aside>` : ""}
  </div>
</div>
${showStats ? `
<!-- ============ الإحصائيات ============ -->
<div class="stats">
  <div class="container">
    <div class="stats-box reveal"${statItems.length < 4 ? ` style="--cols:${statItems.length}"` : ""}>
      ${statItems.slice(0, 4).map((s) => `<div class="stat"><div class="stat-num">${s.symbol ? `<small>${esc(s.symbol)}</small>` : ""}<span data-count="${esc(s.number)}">${esc(s.number)}</span></div><div class="stat-label">${esc(s.label)}</div></div>`).join("\n      ")}
    </div>
  </div>
</div>` : ""}

<!-- ============ من نحن ============ -->
<section id="about">
  <div class="container about-grid">
    <div class="about-visual${aboutStyle ? " has-img" : ""} reveal"${aboutStyle}>
      ${aboutStyle ? "" : `<svg class="bg icon" viewBox="0 0 24 24"><use href="#i-scale"/></svg>`}
      ${about.quote ? `<blockquote>${esc(about.quote)}</blockquote>` : ""}
      ${about.quoteAuthor ? `<cite>— ${esc(about.quoteAuthor)}</cite>` : ""}
    </div>
    <div class="about-text reveal">
      <div class="section-head" style="margin-bottom:22px">
        <span class="kicker">${esc(about.kicker || "من نحن")}</span>
        <h2>${esc(about.title)}</h2>
      </div>
      ${paragraphs(about.body)}
      <div class="values">
        ${list(about.values).map((v) => `<div class="value">${icon(safeIcon(v.icon))}<div><b>${esc(v.title)}</b><span>${esc(v.text)}</span></div></div>`).join("\n        ")}
      </div>
    </div>
  </div>
</section>
${svcItems.length ? `
<!-- ============ الخدمات ============ -->
<section id="services" class="services">
  <div class="container">
    ${head(services, true)}
    <div class="services-grid">
${svcItems.map((s) => `      <article class="service reveal">
        <div class="service-icon">${icon(safeIcon(s.icon))}</div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.text)}</p>
        <a ${waHref(s.title)}>اطلب استشارة${icon("arrow")}</a>
      </article>`).join("\n")}
    </div>
  </div>
</section>` : ""}
${showWhy ? `
<!-- ============ لماذا نحن ============ -->
<section id="why" class="why">
  <div class="container">
    ${head(why, false)}
    <div class="why-grid">
      ${whyItems.map((w) => `<div class="why-item reveal">${icon(safeIcon(w.icon))}<h3>${esc(w.title)}</h3><p>${esc(w.text)}</p></div>`).join("\n      ")}
    </div>
  </div>
</section>` : ""}
${showTeam ? `
<!-- ============ فريق العمل ============ -->
<section id="team" class="team">
  <div class="container">
    ${head(team, true)}
    <div class="team-grid">
${members.map((m) => `      <article class="member reveal">
        <div class="member-photo">${url(m.photo) ? `<img src="${esc(url(m.photo))}" alt="${esc(m.name)}" loading="lazy">` : esc(String(m.name || "").trim().charAt(0))}</div>
        <div class="member-body">
          <h3>${esc(m.name)}</h3>
          ${m.role ? `<span class="role">${esc(m.role)}</span>` : ""}
          ${m.bio ? `<p>${esc(m.bio)}</p>` : ""}
        </div>
      </article>`).join("\n")}
    </div>
  </div>
</section>` : ""}
${showReviews ? `
<!-- ============ آراء العملاء ============ -->
<section id="reviews">
  <div class="container">
    ${head(tm, true)}
    <div class="reviews-grid">
${reviews.map((r) => { const n = Math.max(1, Math.min(5, Math.round(+r.rating || 5))); return `      <article class="review reveal">
        <div class="stars" aria-label="${n} من 5">${icon("star", "icon-fill").repeat(n)}</div>
        <p>${esc(r.text)}</p>
        <footer><span class="avatar">${esc(String(r.name || "").trim().charAt(0))}</span><div><b>${esc(r.name)}</b><span>${esc(r.role)}</span></div></footer>
      </article>`; }).join("\n")}
    </div>
  </div>
</section>` : ""}

<!-- ============ شريط الدعوة ============ -->
<section class="cta-band"${showReviews ? "" : ` style="padding-top:104px"`}>
  <div class="container">
    <div class="cta-box reveal">
      <div>
        <h2>${esc(cta.title)}</h2>
        <p>${esc(cta.text)}</p>
      </div>
      <a class="btn btn-wa btn-lg" ${waHref()}>
        ${icon("wa", "icon-fill")}
        ${esc(cta.button || "استشارة فورية عبر واتساب")}
      </a>
    </div>
  </div>
</section>

<!-- ============ التواصل ============ -->
<section id="contact">
  <div class="container">
    ${head(ct, false)}
    <div class="contact-grid${waNumber ? "" : " single"}">
      <div class="contact-list reveal">
        ${waNumber ? `<a class="contact-item wa" ${waHref()}>
          <span class="ci-icon">${icon("wa", "icon-fill")}</span>
          <div><small>واتساب (الأسرع)</small><b class="ltr">${esc(ct.whatsapp)}</b></div>
        </a>` : ""}
        ${tel ? `<a class="contact-item" href="tel:${esc(tel)}">
          <span class="ci-icon">${icon("phone")}</span>
          <div><small>الهاتف</small><b class="ltr">${esc(ct.phone)}</b></div>
        </a>` : ""}
        ${ct.email ? `<a class="contact-item" href="mailto:${esc(ct.email)}">
          <span class="ci-icon">${icon("mail")}</span>
          <div><small>البريد الإلكتروني</small><b class="ltr">${esc(ct.email)}</b></div>
        </a>` : ""}
        ${ct.address ? `<${url(ct.mapUrl) ? `a href="${esc(url(ct.mapUrl))}" target="_blank" rel="noopener"` : "div"} class="contact-item">
          <span class="ci-icon">${icon("pin")}</span>
          <div><small>العنوان</small><b>${esc(ct.address)}</b></div>
        </${url(ct.mapUrl) ? "a" : "div"}>` : ""}
        ${ct.hours ? `<div class="contact-item">
          <span class="ci-icon">${icon("clock")}</span>
          <div><small>ساعات العمل</small><b>${esc(ct.hours)}</b></div>
        </div>` : ""}
      </div>
${waNumber ? `
      <form class="form-card reveal" id="consultForm" data-wa-number="${waNumber}" data-wa-message="${esc(waMessage)}" novalidate>
        <h3>${esc(form.title || "اطلب استشارتك الآن")}</h3>
        <p>${esc(form.text || "املأ البيانات وسيُفتح واتساب برسالة جاهزة للإرسال.")}</p>
        <div class="field">
          <label for="f-name">الاسم</label>
          <input id="f-name" name="name" type="text" autocomplete="name" placeholder="الاسم الكريم" required>
        </div>
        <div class="field">
          <label for="f-topic">نوع الاستشارة</label>
          <select id="f-topic" name="topic">
            ${[...svcItems.map((s) => s.title), "أخرى"].map((t) => `<option>${esc(t)}</option>`).join("\n            ")}
          </select>
        </div>
        <div class="field">
          <label for="f-msg">نبذة مختصرة عن الموضوع</label>
          <textarea id="f-msg" name="msg" placeholder="اكتب تفاصيل استفسارك باختصار..."></textarea>
        </div>
        <button class="btn btn-wa btn-lg btn-block" type="submit">
          ${icon("wa", "icon-fill")}
          ${esc(form.button || "إرسال عبر واتساب")}
        </button>
        <p class="form-note">${icon("lock")}لا نحفظ بياناتك على الموقع؛ تُرسل رسالتك مباشرة إلى واتساب المكتب.</p>
      </form>` : ""}
    </div>
  </div>
</section>

</main>

<!-- ============ الفوتر ============ -->
<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a href="#top" class="logo">
          ${logo}
        </a>
        <p>${esc(id.footerAbout)}</p>
        ${social.length ? `<div class="social">
          ${social.map(([k, label, fill, href]) => `<a href="${esc(href)}" target="_blank" rel="noopener" aria-label="${label}">${icon(k, fill ? "icon-fill" : "")}</a>`).join("\n          ")}
        </div>` : ""}
      </div>
      <div>
        <h4>روابط سريعة</h4>
        <ul>
          ${navLinks.slice(0, -1).map(([h, l]) => `<li><a href="${h}">${esc(l)}</a></li>`).join("\n          ")}
        </ul>
      </div>
      <div>
        <h4>أبرز الخدمات</h4>
        <ul>
          ${svcItems.slice(0, 4).map((s) => `<li><a href="#services">${esc(s.title)}</a></li>`).join("\n          ")}
        </ul>
      </div>
      <div>
        <h4>تواصل معنا</h4>
        <ul>
          ${waNumber ? `<li><a ${waHref()}>واتساب: <span class="ltr">${esc(ct.whatsapp)}</span></a></li>` : ""}
          ${tel ? `<li><a href="tel:${esc(tel)}">هاتف: <span class="ltr">${esc(ct.phone)}</span></a></li>` : ""}
          ${ct.email ? `<li><a href="mailto:${esc(ct.email)}"><span class="ltr">${esc(ct.email)}</span></a></li>` : ""}
          ${ct.address ? `<li>${esc(ct.address)}</li>` : ""}
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} ${esc(fullName)}. جميع الحقوق محفوظة.</span>
      ${id.license ? `<span>ترخيص وزارة العدل رقم: ${esc(id.license)}</span>` : ""}
    </div>
  </div>
</footer>

<!-- زر واتساب العائم -->
${waNumber ? `<a class="wa-float" ${waHref()} aria-label="تواصل معنا عبر واتساب">
  ${icon("wa", "icon-fill")}
  <span>استشارة واتساب</span>
</a>` : ""}

<script>
${assets.js}</script>
</body>
</html>
`;
}

module.exports = { render };

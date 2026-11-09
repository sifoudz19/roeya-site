#!/usr/bin/env node
/* مولّد الموقع الثابت — بدون أي مكتبات خارجية.
   يقرأ content/*.json ويُخرج الموقع الجاهز للنشر في مجلد dist.
     node build.js           بناء الموقع
     node build.js --serve   بناء + معاينة محلية على http://localhost:5173 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
const SECTIONS = ["identity", "hero", "stats", "about", "services", "why", "team", "testimonials", "contact", "seo"];

/* ---------- الألوان ---------- */
const DEFAULT_COLORS = { primary: "#0b1c2c", accent: "#c9a45c", background: "#f7f4ee", whatsapp: "#25d366" };
/* الدرجات المشتقة المضبوطة يدوياً للهوية الافتراضية؛ لأي لون آخر تُحسب تلقائياً */
const TUNED = {
  "#0b1c2c": { navy2: "#11283d", navy3: "#1a3650", dark: "#081522" },
  "#c9a45c": { gold2: "#e2c88f", goldDark: "#9a7a36" },
};
const hex = (v, fallback) => {
  let s = String(v ?? "").trim().toLowerCase();
  if (/^#?[0-9a-f]{3}$/.test(s)) s = s.replace("#", "").replace(/./g, "$&$&");
  return /^#?[0-9a-f]{6}$/.test(s) ? "#" + s.replace("#", "") : fallback;
};
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c) => "#" + c.map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("");
const scale = (h, f) => toHex(rgb(h).map((n) => n * f));
const tint = (h, p) => toHex(rgb(h).map((n) => n + (255 - n) * p));

function theme(colors = {}) {
  const primary = hex(colors.primary, DEFAULT_COLORS.primary);
  const accent = hex(colors.accent, DEFAULT_COLORS.accent);
  const background = hex(colors.background, DEFAULT_COLORS.background);
  const whatsapp = hex(colors.whatsapp, DEFAULT_COLORS.whatsapp);
  const p = TUNED[primary] || { navy2: tint(scale(primary, 1.35), 0.02), navy3: tint(scale(primary, 1.75), 0.03), dark: scale(primary, 0.75) };
  const a = TUNED[accent] || { gold2: tint(accent, 0.4), goldDark: scale(accent, 0.76) };
  const css = `:root{
  --navy:${primary};--navy-2:${p.navy2};--navy-3:${p.navy3};--navy-dark:${p.dark};--navy-rgb:${rgb(primary)};
  --gold:${accent};--gold-2:${a.gold2};--gold-dark:${a.goldDark};--gold-rgb:${rgb(accent)};
  --cream:${background};
  --wa:${whatsapp};--wa-rgb:${rgb(whatsapp)};
}`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='${primary}'/><path d='M10 32c6-10 14-15 22-15s16 5 22 15c-6 10-14 15-22 15S16 42 10 32z' fill='none' stroke='${accent}' stroke-width='3.5'/><circle cx='32' cy='32' r='7' fill='${accent}'/></svg>`;
  return { primary, css, faviconData: "data:image/svg+xml," + encodeURIComponent(svg) };
}

/* ---------- البناء ---------- */
function readJson(name) {
  const file = path.join(ROOT, "content", name + ".json");
  if (!fs.existsSync(file)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, ""));
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch (err) {
    throw new Error(`ملف المحتوى content/${name}.json غير صالح: ${err.message}`);
  }
}

function build() {
  delete require.cache[require.resolve("./src/page.js")];
  const { render } = require("./src/page.js");
  const read = (f) => fs.readFileSync(path.join(ROOT, "src", f), "utf8");

  const content = Object.fromEntries(SECTIONS.map((s) => [s, readJson(s)]));
  content.theme = theme(content.identity.colors);
  content.assets = { css: read("styles.css"), js: read("main.js"), icons: read("icons.svg") };

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(path.join(DIST, "index.html"), render(content));

  const media = path.join(ROOT, "media");
  if (fs.existsSync(media)) fs.cpSync(media, path.join(DIST, "media"), { recursive: true, filter: (src) => path.basename(src) !== ".gitkeep" });

  const siteUrl = String(content.seo.siteUrl ?? "").trim().replace(/\/+$/, "");
  const noindex = content.seo.noindex === true;
  fs.writeFileSync(path.join(DIST, "robots.txt"),
    noindex ? "User-agent: *\nDisallow: /\n" : `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ""}`);
  if (siteUrl && !noindex) {
    fs.writeFileSync(path.join(DIST, "sitemap.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>\n</urlset>\n`);
  }
  fs.writeFileSync(path.join(DIST, "_headers"),
    "/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: SAMEORIGIN\n  Referrer-Policy: strict-origin-when-cross-origin\n\n/media/*\n  Cache-Control: public, max-age=604800\n");
  /* /admin يحوّل إلى لوحة الإدارة — الدخول محمي بحساب المستخدم هناك، ولا توجد أي مفاتيح في الموقع */
  fs.writeFileSync(path.join(DIST, "_redirects"), "/admin https://app.pagescms.org 302\n");
  return content;
}

/* ---------- المعاينة المحلية ---------- */
function serve(port) {
  const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8" };
  require("http").createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/") { p = "/index.html"; try { build(); } catch (e) { res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" }); return res.end(String(e.message)); } }
    const file = path.join(DIST, path.normalize(p));
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(res);
  }).listen(port, () => console.log(`المعاينة: http://localhost:${port}  (يُعاد البناء عند كل تحديث للصفحة)`));
}

try {
  const c = build();
  console.log(`تم البناء: dist/index.html — ${c.identity.name || "بدون اسم"}`);
} catch (err) {
  console.error("فشل البناء:", err.message);
  process.exit(1);
}
if (process.argv.includes("--serve")) serve(Number(process.env.PORT) || 5173);

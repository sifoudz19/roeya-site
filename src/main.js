document.documentElement.classList.add("js");

/* نموذج الاستشارة → واتساب */
const form = document.getElementById("consultForm");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    if (!name) { form.name.focus(); return; }
    let text = form.dataset.waMessage + "\n\nالاسم: " + name + "\nنوع الاستشارة: " + form.topic.value;
    const msg = form.msg.value.trim();
    if (msg) text += "\nالتفاصيل: " + msg;
    window.open("https://wa.me/" + form.dataset.waNumber + "?text=" + encodeURIComponent(text), "_blank", "noopener");
  });
}

/* الهيدر والقائمة */
const header = document.getElementById("header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 30);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const nav = document.getElementById("nav");
const menuBtn = document.getElementById("menuBtn");
const setMenu = (open) => { nav.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", open); };
menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

/* الظهور عند التمرير + عدّاد الإحصائيات */
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const countUp = (el) => {
  const target = +el.dataset.count;
  if (reduced || !isFinite(target)) return;
  const start = performance.now(), dur = 1600;
  const tick = (now) => {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      en.target.querySelectorAll("[data-count]").forEach(countUp);
      io.unobserve(en.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = (i % 3) * 80 + "ms";
    io.observe(el);
  });
} else {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
}

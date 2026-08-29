/* ==========================================================================
   MOTION-U PORTALS — App shell
   Shared header/footer injection + small render helpers used across pages.
   No framework: this is plain DOM string assembly, kept deliberately small.
   ========================================================================== */

const MU_ICONS = {
  nfc: '<i class="fa-solid fa-wifi"></i>',
  grid: '<i class="fa-solid fa-table-columns"></i>',
  wallet: '<i class="fa-solid fa-wallet"></i>',
  camera: '<i class="fa-solid fa-camera"></i>',
  users: '<i class="fa-solid fa-users"></i>',
  globe: '<i class="fa-solid fa-globe"></i>',
  calendar: '<i class="fa-solid fa-calendar-days"></i>',
  shirt: '<i class="fa-solid fa-shirt"></i>',
  activity: '<i class="fa-solid fa-arrow-trend-up"></i>',
  search: '<i class="fa-solid fa-magnifying-glass"></i>',
};

function muIcon(name) { return MU_ICONS[name] || ""; }

const MU_NAV_LINKS = [
  { href: "index.html", label: "Dashboard", icon: "fa-gauge-high" },
  { href: "members.html", label: "Members", icon: "fa-users" },
  { href: "cards.html", label: "Cards", icon: "fa-id-card" },
  { href: "apps.html", label: "Apps", icon: "fa-grip" },
];

function muRenderHeader(active, me) {
  const links = MU_NAV_LINKS.map(
    (l) => `<a href="${l.href}" class="${l.href === active ? "is-active" : ""}"><i class="fa-solid ${l.icon}"></i>${l.label}</a>`
  ).join("");

  return `
  <aside class="site-sidebar">
    <a href="index.html" class="brand sidebar-brand">
      <span class="brand-mark">M</span>
      <span>Motion-U<br><span class="brand-sub">PORTALS</span></span>
    </a>
    <nav class="sidebar-nav" id="mu-nav">${links}</nav>
    <div class="sidebar-foot">
      <a href="profile.html?id=${me.id}" class="sidebar-user" data-dept="${me.dept}">
        <span class="sidebar-user__avatar">${me.initials}</span>
        <span class="sidebar-user__meta">
          <span class="sidebar-user__name">${me.name}</span>
          <span class="sidebar-user__role">${me.role}</span>
        </span>
        <i class="fa-solid fa-chevron-right sidebar-user__chev"></i>
      </a>
      <button class="sidebar-logout" id="mu-logout" title="Sign out" aria-label="Sign out"><i class="fa-solid fa-right-from-bracket"></i></button>
    </div>
  </aside>`;
}

function muRenderFooter() {
  const depts = MU_DATA.departments
    .map((d) => `<span class="dept-tag" data-dept="${d.key}">${d.short}</span>`)
    .join("");
  return `
  <footer class="site-footer">
    <div class="wrap">
      <div>
        <div class="brand" style="font-size:1rem;"><span class="brand-mark" style="width:22px;height:22px;font-size:0.7rem;">M</span> Motion-U Portals</div>
        <p class="text-faint" style="font-size:0.8rem;margin-top:8px;">One card. Every department, event, and achievement.</p>
      </div>
      <div class="footer-depts">${depts}</div>
    </div>
  </footer>`;
}

function muInitChrome(active) {
  const me = muCurrentMember();
  if (!me) {
    window.location.replace("login.html");
    return;
  }
  document.body.classList.add("has-sidebar");
  document.getElementById("mu-header").innerHTML = muRenderHeader(active, me);
  document.getElementById("mu-footer").innerHTML = muRenderFooter();

  const toggle = document.createElement("button");
  toggle.id = "mu-nav-toggle";
  toggle.className = "nav-toggle";
  toggle.setAttribute("aria-label", "Toggle menu");
  toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
  document.body.appendChild(toggle);

  const nav = document.getElementById("mu-nav");
  toggle.addEventListener("click", () => document.body.classList.toggle("is-nav-open"));
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => document.body.classList.remove("is-nav-open"))
  );

  document.getElementById("mu-logout").addEventListener("click", muLogout);
}

/* ---- Session (simulated auth) ---------------------------------------------------
   Stand-in for real JWT/cookie auth: the session lives in localStorage and gates
   every page behind login.html. Swap muLogin/muGetSession for real API calls when
   a backend exists — call sites only know these three helpers. */
const MU_SESSION_KEY = "motion-u-session:v1";

function muGetSession() {
  try {
    const raw = localStorage.getItem(MU_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function muLogin(memberId) {
  if (!MU_DATA.memberById(memberId)) return false;
  try {
    localStorage.setItem(MU_SESSION_KEY, JSON.stringify({ memberId, loginAt: Date.now() }));
  } catch (e) {
    return false;
  }
  return true;
}

function muLogout() {
  try { localStorage.removeItem(MU_SESSION_KEY); } catch (e) { /* noop */ }
  window.location.replace("login.html");
}

function muCurrentMember() {
  const s = muGetSession();
  return s ? MU_DATA.memberById(s.memberId) || null : null;
}

/* ---- Reusable badge markup -------------------------------------------------- */
function muRenderBadge(member, { size = "md", tilt = false, sheen = false, href = null, uid = null } = {}) {
  const dept = MU_DATA.deptByKey(member.dept);
  const sizeClass = size === "sm" ? "id-badge--sm" : "";
  const tiltClass = tilt ? "id-badge--tilt" : "";
  const sheenAttr = sheen ? "data-sheen" : "";
  const inner = `
    <div class="id-badge ${sizeClass} ${tiltClass}" data-dept="${member.dept}" ${sheenAttr}>
      ${sheen ? '<div class="id-badge__sheen"></div>' : ""}
      ${size !== "sm" ? '<div class="id-badge__punch"></div>' : ""}
      <div class="id-badge__row-top">
        <span class="id-badge__org">MOTION-U</span>
        <span class="id-badge__type">${dept ? dept.short.toUpperCase() : "MEMBER"}</span>
      </div>
      <div class="id-badge__photo">${member.initials}</div>
      <div class="id-badge__name">${member.name}</div>
      <div class="id-badge__role">${member.role}</div>
      <div class="id-badge__footer">
        <span class="id-badge__uid">UID · ${uid || member.id}</span>
        <span class="id-badge__nfc">${muIcon("nfc")}</span>
      </div>
    </div>`;
  return href ? `<a href="${href}" style="display:block;">${inner}</a>` : inner;
}

function muRenderAchievement(key, meta = {}) {
  const a = MU_DATA.achievements[key];
  if (!a) return "";
  return `
    <div class="achievement">
      <div class="achievement__icon">${a.icon}</div>
      <div class="achievement__body">
        <div class="achievement__title">${a.label}</div>
        <div class="achievement__meta">${meta.sub || a.desc}</div>
      </div>
    </div>`;
}

function muQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

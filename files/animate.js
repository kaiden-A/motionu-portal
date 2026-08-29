/* ==========================================================================
   MOTION-U PORTALS — Text animation engine
   Effects below are implemented from the pixel-point/animate-text public
   spec catalog (duration_ms / stagger_ms / easing / from / to values taken
   from catalog/text-animations/specs/*.json), reproduced here with the Web
   Animations API since this project has no build step or bundler.
   ========================================================================== */

const MU_REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Effect definitions — ported 1:1 from the catalog's portable specs. */
const MU_EFFECTS = {
  "per-character-rise": {
    target: "char",
    duration: 700, stagger: 24, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    from: { opacity: 0, y: 32 }, to: { opacity: 1, y: 0 },
  },
  "soft-blur-in": {
    target: "char",
    duration: 900, stagger: 25, easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    from: { opacity: 0, y: 16, blur: 12 }, to: { opacity: 1, y: 0, blur: 0 },
  },
  "stagger-from-center": {
    target: "char", staggerMode: "center-out",
    duration: 620, stagger: 22, easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    from: { opacity: 0, y: 12, blur: 3 }, to: { opacity: 1, y: 0, blur: 0 },
  },
  "top-down-letters": {
    target: "char",
    duration: 400, stagger: 88, easing: "cubic-bezier(0.18, 1, 0.32, 1)",
    from: { opacity: 0, y: -46 }, to: { opacity: 1, y: 0 },
  },
  "mask-reveal-up": {
    target: "line",
    duration: 760, stagger: 90, easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    from: { opacity: 0, y: 30, blur: 6 }, to: { opacity: 1, y: 0, blur: 0 },
  },
};

/* Split text into per-character spans, preserving words for wrapping. */
function muSplitChars(el) {
  const words = el.textContent.split(" ");
  el.textContent = "";
  const chars = [];
  words.forEach((word, wi) => {
    const wordSpan = document.createElement("span");
    wordSpan.style.display = "inline-block";
    wordSpan.style.whiteSpace = "nowrap";
    [...word].forEach((ch) => {
      const c = document.createElement("span");
      c.className = "tchar";
      c.textContent = ch;
      wordSpan.appendChild(c);
      chars.push(c);
    });
    el.appendChild(wordSpan);
    if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
  return chars;
}

function muCenterOutOrder(list) {
  const n = list.length;
  const mid = (n - 1) / 2;
  return list
    .map((el, i) => ({ el, dist: Math.abs(i - mid) }))
    .sort((a, b) => a.dist - b.dist)
    .map((item) => item.el);
}

function muKeyframe(state) {
  const filter = state.blur !== undefined ? `blur(${state.blur}px)` : undefined;
  const kf = { opacity: state.opacity, transform: `translateY(${state.y || 0}px)` };
  if (filter) kf.filter = filter;
  return kf;
}

/**
 * Runs a catalog text effect on an element. Splits into spans, animates in
 * with WAAPI. Safe to call once per element (idempotent guard via dataset).
 */
function muAnimateText(el, effectName) {
  const effect = MU_EFFECTS[effectName];
  if (!effect || !el || el.dataset.muAnimated === "1") return;
  el.dataset.muAnimated = "1";
  el.classList.add("text-anim");

  if (MU_REDUCED_MOTION) {
    el.style.opacity = "1";
    return;
  }

  let units;
  if (effect.target === "line") {
    units = [...el.querySelectorAll(":scope > .tline")];
  } else {
    units = muSplitChars(el);
  }
  if (!units.length) return;

  const ordered = effect.staggerMode === "center-out" ? muCenterOutOrder(units) : units;

  ordered.forEach((unit, i) => {
    unit.animate(
      [muKeyframe(effect.from), muKeyframe(effect.to)],
      {
        duration: effect.duration,
        delay: i * effect.stagger,
        easing: effect.easing,
        fill: "both",
      }
    );
  });
}

/* Scroll-triggered dispatcher: elements with [data-text-fx] animate once
   when they enter the viewport. */
function muInitTextReveals(root = document) {
  const targets = root.querySelectorAll("[data-text-fx]");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window) || MU_REDUCED_MOTION) {
    targets.forEach((el) => muAnimateText(el, el.dataset.textFx));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          muAnimateText(entry.target, entry.target.dataset.textFx);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  targets.forEach((el) => io.observe(el));
}

/* Generic fade/rise reveal for non-text elements (cards, rows, panels). */
function muInitScrollReveal(root = document) {
  const targets = root.querySelectorAll(".reveal");
  if (!targets.length) return;
  if (!("IntersectionObserver" in window) || MU_REDUCED_MOTION) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  targets.forEach((el) => io.observe(el));
}

/* Runs the badge holographic sheen sweep once, then re-arms on hover. */
function muInitBadgeSheen(root = document) {
  root.querySelectorAll(".id-badge[data-sheen]").forEach((badge) => {
    requestAnimationFrame(() => badge.classList.add("sheen-play"));
    badge.addEventListener("mouseenter", () => {
      badge.classList.remove("sheen-play");
      void badge.offsetWidth; // restart animation
      badge.classList.add("sheen-play");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  muInitTextReveals();
  muInitScrollReveal();
  muInitBadgeSheen();
});

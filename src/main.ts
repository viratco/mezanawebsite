import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/600-italic.css";
import "@fontsource/tiro-devanagari-hindi/400.css";
import "@fontsource-variable/inter-tight/wght.css";
import "./styles.css";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import Lenis from "lenis";
import { inject } from "@vercel/analytics";
import Clarity from "@microsoft/clarity";

declare const __CLARITY_ID__: string;

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);

// Vercel Web Analytics: visitors and page views (no cookies).
inject();

// Microsoft Clarity: session recordings and heatmaps. Off until clarityProjectId is set in site.config.json.
if (__CLARITY_ID__) {
  Clarity.init(__CLARITY_ID__);
  // Demo and login clicks show up as Clarity events, so recordings can be filtered by them.
  document.addEventListener("click", (e) => {
    const a = (e.target as Element).closest?.("a");
    if (a?.href.includes("wa.me")) Clarity.event("demo-whatsapp-click");
    else if (a?.href.startsWith("https://app.mezana.in")) Clarity.event("cafe-login-click");
  });
}

const motion = document.documentElement.classList.contains("motion");
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];
const rupees = (paise: number) =>
  "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

let lenis: Lenis | null = null;

/* ───────────── smooth scroll + anchor links ───────────── */
function setupScroll() {
  if (motion) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.addEventListener("click", (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href")!;
    const target = id === "#top" ? 0 : document.querySelector<HTMLElement>(id);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else if (target === 0) window.scrollTo({ top: 0 });
    else target.scrollIntoView();
    history.replaceState(null, "", id === "#top" ? location.pathname : id);
  });
}

/* ───────────── nav: frosted once you scroll, hides going down ───────────── */
function setupNav() {
  const nav = $("[data-nav]");
  let last = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-solid", y > 40);
    nav.classList.toggle("is-hidden", y > last && y > 500);
    last = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ───────────── hero: gold dust ───────────── */
function setupDust() {
  const canvas = $<HTMLCanvasElement>("[data-dust]");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let w = 0;
  let h = 0;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 32;
  const s = sprite.getContext("2d")!;
  const g = s.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(240,217,166,1)");
  g.addColorStop(0.35, "rgba(217,181,110,.55)");
  g.addColorStop(1, "rgba(190,148,69,0)");
  s.fillStyle = g;
  s.fillRect(0, 0, 32, 32);

  type P = { x: number; y: number; r: number; v: number; a: number; d: number };
  let ps: P[] = [];
  const seed = () => {
    const n = Math.round(Math.min(90, (w * h) / 16000));
    ps = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 2 + Math.random() * 6,
      v: 0.12 + Math.random() * 0.35,
      a: 0.15 + Math.random() * 0.55,
      d: Math.random() * Math.PI * 2,
    }));
  };
  const resize = () => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  };
  let running = false;
  let t = 0;
  const frame = () => {
    if (!running) return;
    t += 0.01;
    ctx.clearRect(0, 0, w, h);
    for (const p of ps) {
      p.y -= p.v;
      p.x += Math.sin(t + p.d) * 0.25;
      if (p.y < -10) {
        p.y = h + 10;
        p.x = Math.random() * w;
      }
      ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(t * 2 + p.d));
      ctx.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    requestAnimationFrame(frame);
  };
  resize();
  window.addEventListener("resize", resize);
  new IntersectionObserver(([e]) => {
    const was = running;
    running = e.isIntersecting && !document.hidden;
    if (running && !was) requestAnimationFrame(frame);
  }).observe(canvas);
}

/* ───────────── hero: the arch draws itself, then we walk through it ───────────── */
function setupHero() {
  const hero = $("[data-hero]");
  const wrap = $("[data-hero-emblem]", hero);
  const svg = $("svg", wrap);
  const outer = $(".em-outer", svg);
  const inner = $(".em-inner", svg);
  const cusps = $$(".em-cusp", svg);
  const m = $(".em-m", svg);
  const lotus = $(".em-lotus", svg);
  const petals = $$(".em-petal", svg);
  const finial = $(".em-finial", svg);
  const bases = $$(".em-base", svg);
  const word = $("[data-hero-word]", hero);
  const rule = $$(".hero-rule > *", hero);
  const copyBits = [$("[data-hero-tag]", hero), $("[data-hero-lede]", hero), $("[data-hero-ctas]", hero)];
  const copy = $("[data-hero-copy]", hero);
  const hint = $("[data-hero-scroll]", hero);
  const veil = $("[data-hero-veil]", hero);
  const dust = $("[data-dust]", hero);

  gsap.set(outer, { drawSVG: "50% 50%", fillOpacity: 0 });
  gsap.set(inner, { opacity: 0, scale: 0.9, transformOrigin: "50% 100%" });
  gsap.set(cusps, { drawSVG: "50% 50%" });
  gsap.set(m, { opacity: 0, y: 24 });
  gsap.set(petals, { scale: 0, transformOrigin: "50% 100%" });
  gsap.set(finial, { opacity: 0, y: -70 });
  gsap.set(bases, { scaleX: 0, transformOrigin: "50% 50%" });
  gsap.set(word, { clipPath: "inset(0% 50% 0% 50%)" });
  gsap.set(rule, { scaleX: 0 });
  gsap.set(copyBits, { opacity: 0, y: 22, filter: "blur(6px)" });
  gsap.set(hint, { opacity: 0 });

  const intro = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.2, onComplete: setupHeroScroll });
  intro
    .to(outer, { drawSVG: "0% 100%", duration: 1.5, ease: "power2.inOut" })
    .to(outer, { fillOpacity: 1, duration: 0.7 }, "-=0.45")
    .to(inner, { opacity: 1, scale: 1, duration: 0.9 }, "-=0.6")
    .to(cusps, { drawSVG: "0% 100%", duration: 1.1, stagger: 0.12, ease: "power2.inOut" }, "-=0.75")
    .to(m, { opacity: 1, y: 0, duration: 0.8 }, "-=0.7")
    .to(petals, { scale: 1, duration: 0.7, stagger: { each: 0.05, from: "center" }, ease: "back.out(1.7)" }, "-=0.55")
    .to(finial, { opacity: 1, y: 0, duration: 0.9, ease: "bounce.out" }, "-=0.7")
    .to(bases, { scaleX: 1, duration: 0.7, stagger: 0.08 }, "<")
    .to(word, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power3.inOut" }, "-=0.75")
    .to(rule, { scaleX: 1, duration: 0.8, stagger: 0.05 }, "-=0.6")
    .to(copyBits, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.09 }, "-=0.6")
    .to(hint, { opacity: 1, duration: 0.6 }, "-=0.3");

  // Arriving mid-page (refresh, deep link): skip straight to the finished logo.
  if (window.scrollY > 20) intro.progress(1);

  function setupHeroScroll() {
    gsap.set(wrap, { transformOrigin: "50% 67.6%" }); // a point inside the arch's doorway
    const zoom = () => {
      const r = wrap.getBoundingClientRect();
      const unit = wrap.offsetHeight / 666; // px per SVG unit before scaling
      const oy = r.top + wrap.offsetHeight * 0.676;
      const vw = innerWidth;
      const vh = innerHeight;
      return 1.12 * Math.max(vw / 2 / (190 * unit), (vh - oy) / (160 * unit), oy / (145 * unit));
    };
    gsap
      .timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom bottom", scrub: 0.8, invalidateOnRefresh: true },
      })
      .to(copy, { opacity: 0, y: -50, filter: "blur(10px)", duration: 0.22 }, 0)
      .to(hint, { opacity: 0, duration: 0.08 }, 0)
      .to([m, lotus], { opacity: 0, duration: 0.18 }, 0.12)
      .to(wrap, { scale: zoom, duration: 0.68, ease: "power2.in" }, 0.16)
      .to(dust, { opacity: 0, duration: 0.3 }, 0.4)
      .to(veil, { opacity: 1, duration: 0.12 }, 0.8)
      .set(copy, { pointerEvents: "none" }, 0.1);
  }
}

/* ───────────── one-off reveals ───────────── */
function setupReveals() {
  for (const el of $$("[data-reveal]")) {
    gsap.from(el, {
      y: 44,
      opacity: 0,
      duration: 1.1,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  }
  const groups: [string, string][] = [
    ["[data-bento]", ".tile"],
    ["[data-start]", "li"],
    ["[data-facts]", "li"],
    ["[data-stats]", ".stat"],
  ];
  for (const [g, child] of groups) {
    const root = $(g);
    gsap.from($$(child, root), {
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.07,
      ease: "power3.out",
      scrollTrigger: { trigger: root, start: "top 82%", once: true },
    });
  }
}

/* ───────────── statement: words light up as you read ───────────── */
function setupStatement() {
  const el = $("[data-words]");
  const split = SplitText.create(el, { type: "words", wordsClass: "w" });
  gsap.fromTo(
    split.words,
    { opacity: 0.14 },
    {
      opacity: 1,
      stagger: 0.1,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 42%", scrub: true },
    },
  );
}

/* ───────────── five headaches: cards stack up ───────────── */
function setupCards() {
  const cards = $$("[data-card]");
  cards.forEach((card, i) => {
    const visual = $(".card-visual", card);
    gsap.from(visual.children, {
      y: 90,
      rotate: (j) => (j % 2 ? 4 : -3),
      ease: "none",
      scrollTrigger: { trigger: card, start: "top bottom", end: "top 25%", scrub: true },
    });
    const next = cards[i + 1];
    if (!next) return;
    const shade = document.createElement("i");
    shade.style.cssText = "position:absolute;inset:0;background:#170609;opacity:0;pointer-events:none;border-radius:inherit";
    card.append(shade);
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: next, start: "top bottom", end: "top 20%", scrub: true },
    });
    tl.to(card, { scale: 0.92 - (cards.length - i) * 0.006 }, 0).to(shade, { opacity: 0.4 }, 0);
  });
}

/* ───────────── journey: one order, start to finish ───────────── */
function setupJourney() {
  const section = $("[data-journey]");
  const steps = $$(".step", section);
  const items = $$("[data-j]", section);
  const bar = $("[data-journey-bar]", section);
  const last = items.length - 1;

  gsap.set(items[0], { autoAlpha: 1 });
  const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
  items.forEach((it, k) => {
    if (k > 0)
      tl.fromTo(
        it,
        { autoAlpha: 0, y: 90, scale: 0.94, rotateX: 12 },
        { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, duration: 0.35 },
        k - 0.15,
      );
    if (k < last) tl.to(it, { autoAlpha: 0, y: -70, scale: 0.96, duration: 0.3, ease: "power2.in" }, k + 0.55);
  });
  // little moments inside each step
  const swaps = $$("[data-swap]", section);
  tl.to(swaps[0], { opacity: 1, duration: 0.06 }, 1.08)
    .to(swaps[1], { opacity: 1, duration: 0.06 }, 1.3)
    .from("[data-chime]", { scale: 0, duration: 0.12, ease: "back.out(3)" }, 2.1)
    .fromTo("[data-pop]", { y: 140, scale: 0.85, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.25 }, 3.12)
    .fromTo(
      "[data-roll]",
      { clipPath: "inset(0% 0% 100% 0%)", y: -60 },
      { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.55, ease: "none" },
      4.02,
    )
    .to({}, { duration: 0.3 });

  let active = 0;
  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    scrub: 0.6,
    animation: tl,
    onUpdate(self) {
      bar.style.transform = `scaleX(${self.progress})`;
      // Use where the scroll is heading, not the eased playhead, so labels never lag the picture.
      const idx = Math.min(last, Math.max(0, Math.floor(self.progress * tl.duration() + 0.3)));
      if (idx !== active) {
        steps[active].classList.remove("is-active");
        steps[idx].classList.add("is-active");
        active = idx;
      }
    },
  });
}

/* ───────────── floor plan: the tablet tilts up, pins pop ───────────── */
function setupFloor() {
  const stage = $("[data-floor]");
  gsap.fromTo(
    $("[data-floor-device]", stage),
    { rotateX: 34, scale: 0.8, y: 40 },
    {
      rotateX: 0,
      scale: 1,
      y: 0,
      ease: "none",
      scrollTrigger: { trigger: stage, start: "top 95%", end: "top 15%", scrub: true },
    },
  );
  gsap.from($$("[data-pin]", stage), {
    scale: 0,
    opacity: 0,
    duration: 0.7,
    stagger: 0.18,
    ease: "back.out(2.2)",
    scrollTrigger: { trigger: stage, start: "top 25%", once: true },
  });
}

/* ───────────── kitchen: the screen turns to face you ───────────── */
function setupKitchen() {
  const visual = $("[data-kitchen]");
  gsap.fromTo(
    $("[data-kitchen-device]", visual),
    { rotateY: -28, rotateX: 10, y: 80, scale: 0.92 },
    {
      rotateY: 0,
      rotateX: 0,
      y: 0,
      scale: 1,
      ease: "none",
      scrollTrigger: { trigger: visual, start: "top bottom", end: "center 55%", scrub: true },
    },
  );
  gsap.from($$(".ticks li"), {
    x: -30,
    opacity: 0,
    duration: 0.9,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: { trigger: ".ticks", start: "top 85%", once: true },
  });
}

/* ───────────── payments: try a split ───────────── */
function setupPayments() {
  const root = $("[data-pay]");
  const total = 98700;
  const modes: Record<string, { upi: number; cash: number; card: number }> = {
    upi: { upi: total, cash: 0, card: 0 },
    cash: { upi: 0, cash: total, card: 0 },
    card: { upi: 0, cash: 0, card: total },
    hybrid: { upi: 88700, cash: 10000, card: 0 },
  };
  const tabs = $$<HTMLButtonElement>("[data-mode]", root);
  const segs = { upi: $("[data-seg=upi]", root), cash: $("[data-seg=cash]", root), card: $("[data-seg=card]", root) };
  const amts = { upi: $("[data-amt=upi]", root), cash: $("[data-amt=cash]", root), card: $("[data-amt=card]", root) };
  const shown = { upi: 0, cash: 0, card: 0 };
  let current = "";

  const set = (mode: string, animate: boolean) => {
    if (mode === current) return;
    current = mode;
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.mode === mode)));
    const to = modes[mode];
    for (const k of ["upi", "cash", "card"] as const) {
      const pct = (to[k] / total) * 100 + "%";
      if (animate) {
        gsap.to(segs[k], { width: pct, duration: 0.9, ease: "power3.inOut" });
        gsap.to(shown, {
          [k]: to[k],
          duration: 0.9,
          ease: "power3.inOut",
          onUpdate: () => (amts[k].textContent = rupees(Math.round(shown[k]))),
        });
      } else {
        segs[k].style.width = pct;
        shown[k] = to[k];
        amts[k].textContent = rupees(to[k]);
      }
    }
  };
  set("hybrid", false);

  // Cycle through the methods while it's on screen, until someone taps.
  const order = ["hybrid", "upi", "cash", "card"];
  let timer = 0;
  let touched = false;
  const stop = () => clearInterval(timer);
  const start = () => {
    if (touched || !motion) return;
    stop();
    timer = window.setInterval(() => set(order[(order.indexOf(current) + 1) % order.length], true), 2600);
  };
  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      touched = true;
      stop();
      set(t.dataset.mode!, motion);
    }),
  );
  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.5 }).observe(root);
}

/* ───────────── offline: the lights go out, billing carries on ───────────── */
function setupOffline() {
  const track = $("[data-offline]");
  const bg = $("[data-off-bg]", track);
  const h = $(".offline-h", track);
  const b = $("[data-off-b]", track);
  const lede = $("[data-off-lede]", track);
  const eyebrow = $("[data-off-eyebrow]", track);
  const pill = $("[data-off-pill]", track);
  const pillText = $("[data-off-pill-text]", track);
  const bars = ["w3", "w2", "w1"].map((c) => $(`.${c}`, track));
  const slash = $("[data-off-slash]", track);
  const bills = $$("[data-off-bill]", track);
  const states = $$("[data-off-state]", track);
  const foot = $("[data-off-foot]", track);

  const say = (el: Element, text: string) => {
    if (el.textContent !== text) el.textContent = text;
  };
  // Text and status changes follow the timeline's own playhead, so they stay in step with the visuals.
  const apply = () => {
    const p = tl.progress();
    const off = p >= 0.22 && p < 0.78;
    pill.classList.toggle("is-off", off);
    say(pillText, off ? "Offline" : "Live");
    states.forEach((s, i) => {
      const sent = p >= 0.82 + i * 0.03;
      s.classList.toggle("is-sent", sent);
      say(s, sent ? "Sent ✓" : "Saved on this device");
    });
    say(foot, p < 0.22 ? "Everything saved" : p < 0.86 ? "Offline · bills saved on this device" : "Back online · 3 bills sent, nothing doubled");
  };
  const tl = gsap.timeline({ defaults: { ease: "none" }, onUpdate: apply });
  tl.to(bg, { backgroundColor: "#1f0a0e", duration: 0.12 }, 0.14)
    .to(h, { color: "#f7eedd", duration: 0.12 }, 0.14)
    .to(lede, { color: "rgba(247,238,221,0.72)", duration: 0.12 }, 0.14)
    .to(eyebrow, { color: "#d9b56e", duration: 0.12 }, 0.14)
    .to(bars, { opacity: 0.12, duration: 0.04, stagger: 0.03 }, 0.16)
    .to(slash, { scaleX: 1, duration: 0.05 }, 0.25)
    .fromTo(b, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.1 }, 0.3);
  bills.forEach((bill, i) =>
    tl.fromTo(bill, { autoAlpha: 0, y: 26, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.07 }, 0.38 + i * 0.11),
  );
  tl.to(slash, { scaleX: 0, duration: 0.04 }, 0.76)
    .to(bars, { opacity: 1, duration: 0.04, stagger: -0.02 }, 0.77)
    .to({}, { duration: 0.1 }, 0.9);

  ScrollTrigger.create({ trigger: track, start: "top top", end: "bottom bottom", scrub: 0.5, animation: tl });
}

/* ───────────── numbers: count up, bar fills ───────────── */
function setupNumbers() {
  for (const el of $$("[data-count]")) {
    const target = Number(el.dataset.count);
    const prefix = el.dataset.prefix ?? "";
    const o = { v: 0 };
    el.textContent = prefix + "0";
    gsap.to(o, {
      v: target,
      duration: 2.2,
      ease: "power2.out",
      onUpdate: () => (el.textContent = prefix + Math.round(o.v).toLocaleString("en-IN")),
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  }
  const profit = $("[data-profit]");
  const tl = gsap.timeline({ scrollTrigger: { trigger: profit, start: "top 88%", once: true } });
  tl.from("[data-pb-stock]", { width: 0, duration: 1.2, ease: "power3.inOut" }).from(
    "[data-pb-left]",
    { clipPath: "inset(0 100% 0 0)", duration: 1.2, ease: "power3.inOut" },
    "-=0.6",
  );
}

/* ───────────── closing emblem ───────────── */
function setupClosing() {
  const svg = $("[data-closing] svg");
  const tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: "top 85%", once: true } });
  tl.from($(".em-outer", svg), { drawSVG: "50% 50%", duration: 1.4, ease: "power2.inOut" })
    .from($$(".em-cusp", svg), { drawSVG: "50% 50%", duration: 1.1, stagger: 0.1, ease: "power2.inOut" }, "-=0.9")
    .from($$(".em-petal", svg), { scale: 0, transformOrigin: "50% 100%", stagger: { each: 0.05, from: "center" }, ease: "back.out(1.7)", duration: 0.6 }, "-=0.6");
  gsap.to("[data-closing]", { y: -10, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 });
}

/* ───────────── always on, motion or not ───────────── */
function setupTiles() {
  for (const tile of $$(".tile")) {
    tile.addEventListener("pointermove", (e) => {
      const r = tile.getBoundingClientRect();
      tile.style.setProperty("--mx", `${e.clientX - r.left}px`);
      tile.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  }
}

function setupFaq() {
  for (const d of $$<HTMLDetailsElement>("[data-faq] details")) {
    const body = $("div", d);
    $("summary", d).addEventListener("click", (e) => {
      if (!motion) return;
      e.preventDefault();
      if (d.open) {
        gsap.to(body, {
          height: 0,
          duration: 0.45,
          ease: "power2.inOut",
          onComplete: () => {
            d.open = false;
            gsap.set(body, { clearProps: "height" });
          },
        });
      } else {
        d.open = true;
        gsap.fromTo(body, { height: 0 }, { height: "auto", duration: 0.55, ease: "power3.out" });
      }
    });
  }
}

function setupFilm() {
  const video = $<HTMLVideoElement>("[data-video]");
  const btn = $<HTMLButtonElement>("[data-sound]");
  const on = $("[data-sound-on]", btn);
  const off = $("[data-sound-off]", btn);
  const label = $("[data-sound-label]", btn);
  const sync = () => {
    on.toggleAttribute("hidden", video.muted);
    off.toggleAttribute("hidden", !video.muted);
    label.textContent = video.muted ? "Sound off" : "Sound on";
    btn.setAttribute("aria-pressed", String(!video.muted));
  };
  btn.addEventListener("click", () => {
    video.muted = !video.muted;
    if (video.paused) void video.play().catch(() => {});
    sync();
  });
  video.addEventListener("click", () => (video.paused ? void video.play().catch(() => {}) : video.pause()));
  new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting && motion) {
        video.preload = "auto";
        void video.play().catch(() => {});
      } else if (!e.isIntersecting) video.pause();
    },
    { threshold: 0.45 },
  ).observe(video);
  sync();
}

/* ───────────── boot ───────────── */
setupScroll();
setupNav();
setupPayments();
setupTiles();
setupFaq();
setupFilm();

if (motion) {
  setupDust();
  setupHero();
  // Words are split by width, so wait for the real fonts first.
  document.fonts.ready.then(() => {
    setupStatement();
    setupReveals();
    setupCards();
    setupJourney();
    setupFloor();
    setupKitchen();
    setupOffline();
    setupNumbers();
    setupClosing();
    ScrollTrigger.refresh();
  });
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

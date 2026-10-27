(() => {
  const D = window.PORTFOLIO;
  const P = D.projects;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };

  /* ---------- Theme ---------- */
  const root = document.documentElement;
  const saved = store.get("yb-theme");
  if (saved === "blueprint" || saved === "paper") root.dataset.theme = saved;
  $(".theme-toggle").addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "blueprint" ? "paper" : "blueprint";
    store.set("yb-theme", root.dataset.theme);
  });

  /* ---------- About + marquee ---------- */
  $("#about-text").textContent = D.about;
  const allSkills = [...new Set(P.flatMap((p) => p.skills))];
  const track = $(".marquee-track");
  const words = ["Autodesk Inventor", "VEX", "Mechanical advantage", ...allSkills, "Python", "Data analysis"];
  const uniq = [...new Set(words)];
  track.innerHTML = [...uniq, ...uniq].map((w) => `<span>${esc(w)}</span>`).join("");

  /* ---------- Project cards ---------- */
  const cards = $("#cards");
  const COURSE = { IED: "Intro to Engineering Design", POE: "Principles of Engineering" };
  cards.innerHTML = P.map((p, i) => {
    const c = p.counts;
    const meta = [
      c.images && `<span><b>${c.images}</b> img</span>`,
      c.slides && `<span><b>${c.slides}</b> slides</span>`,
      c.videos && `<span><b>${c.videos}</b> video</span>`,
    ].filter(Boolean).join("");
    return `<button class="card reveal" style="--rd:${(i % 3) * 0.08}s" data-slug="${p.slug}" data-course="${p.course}" aria-label="Open ${esc(p.title)}">
      <div class="card-media"><img src="${p.cover}" alt="${esc(p.title)} cover" loading="lazy"><span class="card-no">${i + 1}</span></div>
      <div class="card-body">
        <span class="mono card-course">${COURSE[p.course]}</span>
        <h3>${esc(p.title)}</h3>
        <p class="card-kicker">${esc(p.kicker)}</p>
        <div class="card-meta mono">${meta}<span class="card-open">Open →</span></div>
      </div>
    </button>`;
  }).join("");
  cards.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (card) openProject(card.dataset.slug, card);
  });

  $$(".chip-btn").forEach((btn) => btn.addEventListener("click", () => {
    $$(".chip-btn").forEach((b) => { b.classList.toggle("is-on", b === btn); b.setAttribute("aria-selected", b === btn); });
    const f = btn.dataset.filter;
    $$(".card").forEach((c) => { c.hidden = f !== "all" && c.dataset.course !== f; });
  }));

  /* ---------- Bill of skills ---------- */
  const ALIAS = { "Exploded assemblies": "Exploded views", "Rapid prototyping": "Prototyping", "Mechanical systems": "Mechanisms", "Pulleys & levers": "Levers & pulleys" };
  const TYPE = {
    "Autodesk Inventor": "CAD software", "Multiview drawings": "Technical drawing", "Exploded views": "Technical drawing",
    "Assemblies": "CAD", "Bill of materials": "Technical drawing", "Loft & revolve": "CAD features", "Work planes": "CAD features",
    "Animation": "CAD presentation", "Sketching": "Technical drawing", "Spatial reasoning": "Design thinking",
    "Mechanical advantage": "Mechanics", "Statics": "Mechanics", "Compound machines": "Mechanics", "Levers & pulleys": "Mechanics",
    "Gear trains": "Mechanics", "Mechanisms": "Mechanics", "VEX robotics": "Hardware", "Calculations": "Math",
    "Design brief": "Design process", "Design process": "Design process", "Decision matrix": "Design process",
    "Ergonomics": "Human factors", "Prototyping": "Making", "Iteration": "Design process", "Redesign": "Design process",
    "Reverse engineering": "Analysis", "Product analysis": "Analysis", "Data collection": "Data", "Statistics": "Data",
    "Box plots": "Data", "Testing": "Data", "Teamwork": "Collaboration", "Presentation": "Communication",
  };
  const skillMap = new Map();
  P.forEach((p, i) => p.skills.forEach((s) => {
    const k = ALIAS[s] || s;
    if (!skillMap.has(k)) skillMap.set(k, new Set());
    skillMap.get(k).add(i);
  }));
  const rows = [...skillMap.entries()].sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]));
  $("#bom").innerHTML =
    `<div class="bom-row bom-head" role="row"><span role="columnheader">Item</span><span role="columnheader">Skill</span><span role="columnheader">Used in</span><span role="columnheader" class="bom-type">Type</span></div>` +
    rows.map(([skill, set], i) => `<div class="bom-row" role="row" data-projects="${[...set].join(",")}">
      <span class="bom-item" role="cell">${i + 1}</span>
      <span class="bom-skill" role="cell">${esc(skill)}</span>
      <span role="cell">${[...set].map((n) => `<button class="pbal" data-i="${n}" title="${esc(P[n].title)}" aria-label="Open ${esc(P[n].title)}">${n + 1}</button>`).join("")}</span>
      <span class="bom-type mono" role="cell">${esc(TYPE[skill] || "Engineering")}</span>
    </div>`).join("");
  const bom = $("#bom");
  bom.addEventListener("click", (e) => {
    const b = e.target.closest(".pbal");
    if (b) openProject(P[+b.dataset.i].slug, b);
  });
  bom.addEventListener("mouseover", (e) => {
    const row = e.target.closest(".bom-row[data-projects]");
    if (!row) return;
    const lit = row.dataset.projects.split(",").map(Number);
    $$(".card").forEach((c, i) => c.classList.toggle("is-lit", lit.includes(i)));
  });
  bom.addEventListener("mouseleave", () => $$(".card").forEach((c) => c.classList.remove("is-lit")));

  /* ---------- Reveal + counters ---------- */
  const countUp = (el) => {
    const end = +el.dataset.count;
    if (reduced) { el.textContent = end; return; }
    const t0 = performance.now(), dur = 1400;
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in");
    const dd = $("dd[data-count]", en.target);
    if (dd) countUp(dd);
    io.unobserve(en.target);
  }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- Title block + nav ---------- */
  const tbTitle = $("#tb-title"), tbSheet = $("#tb-sheet");
  const navLinks = $$(".nav-links a");
  const sectionIO = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const s = en.target;
    if (tbTitle.textContent !== s.dataset.title) {
      tbTitle.textContent = s.dataset.title;
      tbTitle.classList.remove("flip"); void tbTitle.offsetWidth; tbTitle.classList.add("flip");
    }
    tbSheet.textContent = s.dataset.sheet;
    navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + s.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$(".sheet").forEach((s) => sectionIO.observe(s));

  const nav = $(".nav");
  let lastY = scrollY;
  addEventListener("scroll", () => {
    const y = scrollY;
    nav.classList.toggle("is-hidden", y > lastY && y > 300);
    lastY = y;
  }, { passive: true });

  /* ---------- Crosshair cursor ---------- */
  if (matchMedia("(hover: hover) and (pointer: fine)").matches && !reduced) {
    const x = $(".xhair"), h = $(".xh-h"), v = $(".xh-v"), r = $(".xh-read");
    document.body.classList.add("has-xhair");
    let raf = 0, mx = 0, my = 0;
    addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        x.classList.add("on");
        h.style.transform = `translateY(${my}px)`;
        v.style.transform = `translateX(${mx}px)`;
        r.style.transform = `translate(${mx + 12}px, ${my + 12}px)`;
        r.textContent = `X ${String(mx).padStart(4, "0")} · Y ${String(Math.round(my + scrollY)).padStart(4, "0")}`;
      });
    });
    document.addEventListener("pointerleave", () => x.classList.remove("on"));
  }

  /* ---------- Project sheet (modal) ---------- */
  const modal = $("#modal"), body = $("#m-body");
  let current = -1, opener = null, gallery = [];

  function renderBlocks(blocks) {
    const out = [];
    let label = null;
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.t === "p") {
        const t = b.text;
        const isLabel = /:$/.test(t) && t.length < 60;
        if (isLabel) { label = t.replace(/:$/, ""); continue; }
        const m = t.match(/^(Project Description|Description|What I learned|Reflection):\s*(.+)$/);
        if (label && (!blocks[i + 1] || blocks[i + 1].t === "p" || t.length > 140)) {
          out.push(`<div class="m-text"><p><strong>${esc(label)}</strong>${esc(t)}</p></div>`); label = null;
        } else if (m) {
          out.push(`<div class="m-text"><p><strong>${esc(m[1])}</strong>${esc(m[2])}</p></div>`);
        } else {
          out.push(`<div class="m-text"><p>${esc(t)}</p></div>`);
        }
      } else if (b.t === "img") {
        const imgs = [];
        while (blocks[i] && blocks[i].t === "img") imgs.push(blocks[i++].src);
        let cap = "";
        const nxt = blocks[i];
        if (nxt && nxt.t === "p" && nxt.text.length < 140 && !/:$/.test(nxt.text)) { cap = nxt.text; i++; }
        i--;
        const title = label || (imgs.length > 1 ? "Gallery" : "Figure");
        const figs = imgs.map((src, k) => {
          const alt = cap || `${P[current].title}, ${title.toLowerCase()} ${k + 1}`;
          gallery.push({ src, cap: cap || title });
          const showCap = imgs.length === 1 && cap;
          return `<button class="g-item" data-g="${gallery.length - 1}" aria-label="Enlarge: ${esc(alt)}"><img src="${src}" alt="${esc(alt)}" loading="lazy">${showCap ? `<figcaption>${esc(cap)}</figcaption>` : ""}</button>`;
        }).join("");
        out.push(`<div class="m-section"><p class="mono">${esc(title)} · ${imgs.length} ${imgs.length > 1 ? "images" : "image"}</p>
          <div class="gallery${imgs.length === 1 ? " solo" : ""}">${figs}</div>${imgs.length > 1 && cap ? `<p class="mono" style="margin-top:12px;color:var(--ink-soft)">${esc(cap)}</p>` : ""}</div>`);
        label = null;
      } else if (b.t === "deck") {
        out.push(`<div class="m-section"><p class="mono">${esc(label || "Presentation")} · ${b.slides.length} slides</p>${deckHTML(b)}</div>`);
        label = null;
      } else if (b.t === "video") {
        out.push(`<div class="m-section"><p class="mono">${esc(label || "Video")}</p><div class="vid"><video controls playsinline preload="metadata" src="${b.src}"></video></div></div>`);
        label = null;
      }
    }
    return out.join("");
  }

  function deckHTML(b) {
    const n = b.slides.length;
    return `<div class="deck" tabindex="0" aria-label="Slide deck, ${n} slides. Use arrow keys to move." data-slides='${esc(JSON.stringify(b.slides))}'>
      <div class="deck-stage">
        ${b.slides.map((s, k) => `<img data-src="${s}" alt="Slide ${k + 1} of ${n}"${k === 0 ? ` src="${s}" class="on"` : ""}>`).join("")}
        <button class="deck-arrow deck-prev" aria-label="Previous slide">←</button>
        <button class="deck-arrow deck-next" aria-label="Next slide">→</button>
      </div>
      <div class="deck-bar mono"><span class="deck-count">01 / ${String(n).padStart(2, "0")}</span>
        <span class="deck-progress"><i style="width:${100 / n}%"></i></span>
        <a href="${b.src}" target="_blank" rel="noopener">Open in Google Slides ↗</a></div>
      <div class="deck-thumbs">${b.slides.map((s, k) => `<button data-k="${k}" class="${k === 0 ? "on" : ""}" aria-label="Go to slide ${k + 1}"><img src="${s}" alt="" loading="lazy"></button>`).join("")}</div>
    </div>`;
  }

  function wireDeck(deck) {
    const imgs = $$(".deck-stage img", deck), thumbs = $$(".deck-thumbs button", deck);
    const n = imgs.length;
    let k = 0;
    const load = (j) => { const im = imgs[j]; if (im && !im.getAttribute("src")) im.src = im.dataset.src; };
    const go = (j) => {
      k = (j + n) % n;
      [k, k + 1, k - 1].forEach((x) => load((x + n) % n));
      imgs.forEach((im, i) => im.classList.toggle("on", i === k));
      thumbs.forEach((t, i) => t.classList.toggle("on", i === k));
      thumbs[k].scrollIntoView({ block: "nearest", inline: "center", behavior: reduced ? "auto" : "smooth" });
      $(".deck-count", deck).textContent = `${String(k + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
      $(".deck-progress i", deck).style.width = `${((k + 1) / n) * 100}%`;
    };
    load(1);
    $(".deck-prev", deck).onclick = () => go(k - 1);
    $(".deck-next", deck).onclick = () => go(k + 1);
    thumbs.forEach((t) => (t.onclick = () => go(+t.dataset.k)));
    deck.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(k + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(k - 1); }
    });
    let sx = null;
    const stage = $(".deck-stage", deck);
    stage.addEventListener("pointerdown", (e) => { sx = e.clientX; });
    stage.addEventListener("pointerup", (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 40) go(dx < 0 ? k + 1 : k - 1);
    });
  }

  function openProject(slug, from) {
    const i = P.findIndex((p) => p.slug === slug);
    if (i < 0) return;
    current = i; gallery = [];
    if (from) opener = from;
    const p = P[i];
    const prev = P[(i - 1 + P.length) % P.length], next = P[(i + 1) % P.length];
    $("#m-crumb").textContent = `Sheet 2 · Item ${i + 1} of ${P.length} · ${COURSE[p.course]}`;
    body.innerHTML = `
      <div class="m-hero">
        <div><span class="m-no">${i + 1}</span><h2 id="m-title">${esc(p.title)}</h2></div>
        <div><p class="mono eyebrow">${esc(p.kicker)}</p><p class="m-summary">${esc(p.summary)}</p>
          <div class="m-skills">${p.skills.map((s) => `<span class="skill-tag">${esc(s)}</span>`).join("")}</div></div>
      </div>
      ${renderBlocks(p.blocks)}
      <div class="m-next">
        <button data-go="${prev.slug}"><span class="mono">← Previous</span><b>${esc(prev.title)}</b></button>
        <button data-go="${next.slug}"><span class="mono">Next →</span><b>${esc(next.title)}</b></button>
      </div>`;
    $$(".deck", body).forEach(wireDeck);
    body.scrollTop = 0;
    if (modal.hidden) {
      modal.hidden = false;
      document.body.classList.add("locked");
    }
    history.replaceState(null, "", "#project/" + slug);
    $(".m-close", modal).focus({ preventScroll: true });
  }

  function closeProject() {
    if (modal.hidden) return;
    $$("video", body).forEach((v) => v.pause());
    const done = () => {
      modal.hidden = true; modal.classList.remove("closing");
      document.body.classList.remove("locked");
      body.innerHTML = "";
      history.replaceState(null, "", location.pathname + location.search + "#work");
      if (opener) opener.focus({ preventScroll: true });
    };
    if (reduced) return done();
    modal.classList.add("closing");
    setTimeout(done, 340);
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest(".m-close")) return closeProject();
    const go = e.target.closest("[data-go]");
    if (go) return openProject(go.dataset.go);
    const g = e.target.closest(".g-item");
    if (g) openLightbox(+g.dataset.g, g);
  });

  /* ---------- Lightbox ---------- */
  const lb = $("#lightbox"), lbImg = $("#lb-img"), lbCap = $("#lb-cap");
  let li = 0, lbOpener = null;
  function showLb(j) {
    li = (j + gallery.length) % gallery.length;
    lbImg.src = gallery[li].src;
    lbImg.alt = gallery[li].cap;
    lbCap.textContent = `${li + 1} / ${gallery.length} · ${gallery[li].cap}`;
    lbImg.style.animation = "none"; void lbImg.offsetWidth; lbImg.style.animation = "";
  }
  function openLightbox(j, from) { lbOpener = from; lb.hidden = false; showLb(j); $(".lb-close", lb).focus(); }
  function closeLightbox() { lb.hidden = true; if (lbOpener) lbOpener.focus(); }
  $(".lb-prev", lb).onclick = () => showLb(li - 1);
  $(".lb-next", lb).onclick = () => showLb(li + 1);
  $(".lb-close", lb).onclick = closeLightbox;
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.tagName === "FIGURE") closeLightbox(); });

  /* ---------- Keyboard + focus trap ---------- */
  document.addEventListener("keydown", (e) => {
    if (!lb.hidden) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") showLb(li + 1);
      if (e.key === "ArrowLeft") showLb(li - 1);
      return;
    }
    if (!modal.hidden) {
      if (e.key === "Escape") closeProject();
      if (e.key === "Tab") {
        const f = $$("button, a[href], video, [tabindex='0']", modal).filter((el) => el.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    }
  });

  /* ---------- Deep link: #project/<slug> ---------- */
  const fromHash = () => {
    const m = location.hash.match(/^#project\/(.+)$/);
    if (m) openProject(decodeURIComponent(m[1]));
  };
  addEventListener("hashchange", fromHash);
  fromHash();
})();

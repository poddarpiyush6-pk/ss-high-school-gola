// ============================================================================
// FILE: campus-experience-admin.js (v3.2 — ZERO-CROP SHOWCASE + MASONRY GALLERY)
// 1. Home Page Cinematic Auto-Sliding Showcase (Ambient Blur + Zero-Crop Contain)
// 2. Pure Masonry Campus Gallery Page (#view-gallery — Natural Aspect Ratios)
// 3. Full-Screen Interactive Lightbox (Prev/Next + Touch Swipe + Keyboard)
// 4. Secret Admin Executive Control Suite v3.0 (3-Way Mobile Drawer Close)
// 5. Lazy-Loaded Live School Location Map Card (Heramdaga Rd, Bantara, Gola)
// ============================================================================

import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const SCHOOL_MAP_SHORT_URL = "https://maps.app.goo.gl/jd1mnaUX5G7WL3hFA";
const SCHOOL_MAP_EMBED_URL =
  "https://maps.google.com/maps?q=S.S.+%2B2+High+School+Gola,+Heramdaga+Rd,+Bantara,+Gola,+Jharkhand+829110&t=&z=16&ie=UTF8&iwloc=&output=embed";

let galleryCache = [];
let activeGalleryFilter = "All";
let homePhotosCache = [];
let carouselIndex = 0;
let carouselTimer = null;
let carouselPaused = false;
let lightboxItems = [];
let lightboxIndex = 0;
let adminActiveTab = "dashboard";
let adminCompressedPhoto = "";
let adminNoticeImage = "";

function esc(str) {
  const d = document.createElement("div");
  d.textContent = str == null ? "" : String(str);
  return d.innerHTML;
}

function getDb() {
  return window.LegacyPortalBridge ? window.LegacyPortalBridge.getSession().db : null;
}

function getYouTubeEmbed(url) {
  if (!url || typeof url !== "string") return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m && m[1] ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function compressPhoto(file, maxW = 1100, quality = 0.74) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxW) {
          h = Math.round((h * maxW) / w);
          w = maxW;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// 1. EXECUTIVE OBSIDIAN-GOLD & MASONRY GALLERY STYLES
// ============================================================================
function injectExecutiveStyles() {
  if (document.getElementById("exec-admin-gallery-styles")) return;
  const style = document.createElement("style");
  style.id = "exec-admin-gallery-styles";
  style.textContent = `
    .exec-shell {
      background: #070b14;
      color: #f1f5f9;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    }
    .exec-sidebar {
      background: linear-gradient(180deg, #0b1120 0%, #070b14 100%);
      border-right: 1px solid rgba(245, 185, 66, 0.16);
    }
    .exec-nav-active {
      background: linear-gradient(90deg, #f5b942 0%, #c98a1e 100%);
      color: #090d16 !important;
      font-weight: 800;
      box-shadow: 0 6px 20px rgba(245, 185, 66, 0.25);
    }
    .exec-card {
      background: linear-gradient(145deg, rgba(17, 25, 45, 0.92), rgba(10, 15, 29, 0.96));
      border: 1px solid rgba(148, 163, 184, 0.14);
    }
    .exec-kpi-blue { background: linear-gradient(135deg, rgba(29, 78, 216, 0.28), rgba(15, 23, 42, 0.95)); border: 1px solid rgba(59, 130, 246, 0.35); }
    .exec-kpi-emerald { background: linear-gradient(135deg, rgba(5, 150, 105, 0.28), rgba(15, 23, 42, 0.95)); border: 1px solid rgba(16, 185, 129, 0.35); }
    .exec-kpi-purple { background: linear-gradient(135deg, rgba(124, 58, 237, 0.28), rgba(15, 23, 42, 0.95)); border: 1px solid rgba(139, 92, 246, 0.35); }
    .exec-kpi-gold { background: linear-gradient(135deg, rgba(217, 119, 6, 0.30), rgba(15, 23, 42, 0.95)); border: 1px solid rgba(245, 185, 66, 0.40); }
    .exec-input {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(148, 163, 184, 0.22);
      color: #f8fafc;
    }
    .exec-input:focus { outline: none; border-color: #f5b942; }

    /* Zero-Crop Masonry Cards */
    .gal-masonry-card {
      break-inside: avoid;
      -webkit-column-break-inside: avoid;
      page-break-inside: avoid;
    }

    @keyframes galleryFade {
      0% { opacity: 0.25; transform: scale(0.985); }
      100% { opacity: 1; transform: scale(1); }
    }
    .gal-slide-anim { animation: galleryFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `;
  document.head.appendChild(style);
}

// ============================================================================
// 2. GALLERY DATA FETCH & FULL-SCREEN INTERACTIVE LIGHTBOX (PREV / NEXT / SWIPE)
// ============================================================================
async function fetchGalleryItems() {
  const db = getDb();
  if (!db) return galleryCache;
  try {
    const snap = await getDocs(collection(db, "gallery_items"));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    galleryCache = items;
    return items;
  } catch (e) {
    return galleryCache;
  }
}

function ensureGalleryLightbox() {
  let lb = document.getElementById("campus-gallery-lightbox");
  if (lb) return lb;

  lb = document.createElement("div");
  lb.id = "campus-gallery-lightbox";
  lb.className = "fixed inset-0 z-[9999] bg-black/92 backdrop-blur-md hidden items-center justify-center p-2 sm:p-6";
  lb.innerHTML = `
    <div id="lb-card" class="relative max-w-5xl w-full rounded-2xl overflow-hidden bg-slate-950 border border-amber-500/35 shadow-2xl flex flex-col max-h-[94vh]">
      
      <!-- Top Counter + Close -->
      <div class="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <span id="lb-counter" class="px-2.5 py-1 rounded-lg bg-black/70 text-amber-300 font-mono text-xs font-bold border border-white/15">
          1 / 1
        </span>
        <button id="lb-close" type="button" aria-label="Close Preview"
          class="pointer-events-auto w-9 h-9 rounded-full bg-black/75 hover:bg-red-600 text-white font-bold border border-white/15 cursor-pointer transition-colors">
          ✕
        </button>
      </div>

      <!-- Prev / Next Arrows -->
      <button id="lb-prev" type="button" aria-label="Previous"
        class="hidden absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/70 hover:bg-amber-500 text-white hover:text-slate-950 border border-white/20 flex items-center justify-center text-xl font-extrabold cursor-pointer transition-colors">
        ‹
      </button>
      <button id="lb-next" type="button" aria-label="Next"
        class="hidden absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/70 hover:bg-amber-500 text-white hover:text-slate-950 border border-white/20 flex items-center justify-center text-xl font-extrabold cursor-pointer transition-colors">
        ›
      </button>

      <!-- Zero-Crop Media Viewport -->
      <div id="lb-media" class="bg-black flex items-center justify-center min-h-[260px] flex-1 overflow-hidden"></div>

      <!-- Caption Footer -->
      <div class="p-4 sm:p-5 bg-slate-900 text-white space-y-1 border-t border-white/10 shrink-0">
        <span id="lb-cat" class="inline-block px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase"></span>
        <h3 id="lb-title" class="text-sm sm:text-lg font-extrabold leading-snug"></h3>
        <p id="lb-caption" class="text-xs sm:text-sm text-slate-300"></p>
      </div>
    </div>
  `;
  document.body.appendChild(lb);

  const close = () => {
    lb.classList.add("hidden");
    lb.classList.remove("flex");
    document.getElementById("lb-media").innerHTML = "";
  };

  const step = (dir) => {
    if (lightboxItems.length <= 1) return;
    lightboxIndex = (lightboxIndex + dir + lightboxItems.length) % lightboxItems.length;
    paintLightboxSlide();
  };

  document.getElementById("lb-close").addEventListener("click", close);
  document.getElementById("lb-prev").addEventListener("click", () => step(-1));
  document.getElementById("lb-next").addEventListener("click", () => step(1));
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });

  // Keyboard Navigation
  document.addEventListener("keydown", (e) => {
    if (lb.classList.contains("hidden")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  });

  // Mobile Touch Swipe Support
  let touchStartX = 0;
  const lbCard = document.getElementById("lb-card");
  lbCard.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  lbCard.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  return lb;
}

function paintLightboxSlide() {
  const item = lightboxItems[lightboxIndex];
  if (!item) return;

  const mediaEl = document.getElementById("lb-media");
  const ytEmbed = getYouTubeEmbed(item.youtubeUrl || "");

  if (item.type === "video" && ytEmbed) {
    mediaEl.innerHTML = `<div class="aspect-video w-full max-h-[72vh]"><iframe src="${esc(ytEmbed)}?autoplay=1" class="w-full h-full" allowfullscreen></iframe></div>`;
  } else {
    mediaEl.innerHTML = `<img src="${esc(item.imageDataUrl)}" alt="${esc(item.title)}" class="max-h-[74vh] w-auto max-w-full object-contain mx-auto gal-slide-anim" />`;
  }

  document.getElementById("lb-counter").textContent = `${lightboxIndex + 1} / ${lightboxItems.length}`;
  document.getElementById("lb-cat").textContent = item.category || "Campus";
  document.getElementById("lb-title").textContent = item.title || "S.S. +2 High School, Gola";
  document.getElementById("lb-caption").textContent = item.caption || "";

  const showNav = lightboxItems.length > 1;
  document.getElementById("lb-prev").classList.toggle("hidden", !showNav);
  document.getElementById("lb-next").classList.toggle("hidden", !showNav);
}

function openGalleryLightbox(itemsList, startIdx = 0) {
  if (!Array.isArray(itemsList) || itemsList.length === 0) return;
  lightboxItems = itemsList;
  lightboxIndex = Math.max(0, Math.min(startIdx, itemsList.length - 1));

  const lb = ensureGalleryLightbox();
  paintLightboxSlide();
  lb.classList.remove("hidden");
  lb.classList.add("flex");
}

// ============================================================================
// 3. HOME PAGE CINEMATIC AUTO-SLIDING SHOWCASE (AMBIENT BLUR + ZERO CROPPING)
// ============================================================================
function startHomeCarouselTimer() {
  if (carouselTimer) clearInterval(carouselTimer);
  if (homePhotosCache.length <= 1) return;

  carouselTimer = setInterval(() => {
    if (!carouselPaused && !document.hidden) {
      carouselIndex = (carouselIndex + 1) % homePhotosCache.length;
      renderHomeCarouselSlide();
    }
  }, 4400);
}

function renderHomeCarouselSlide() {
  const fgImg = document.getElementById("home-gal-fg");
  const bgImg = document.getElementById("home-gal-bg");
  const title = document.getElementById("home-gal-title");
  const caption = document.getElementById("home-gal-caption");
  const badge = document.getElementById("home-gal-badge");
  const dots = document.getElementById("home-gal-dots");
  if (!fgImg || !homePhotosCache.length) return;

  const item = homePhotosCache[carouselIndex % homePhotosCache.length];

  fgImg.classList.remove("gal-slide-anim");
  void fgImg.offsetWidth;
  fgImg.src = item.imageDataUrl;
  fgImg.alt = item.title || "Campus Showcase";
  fgImg.classList.add("gal-slide-anim");

  if (bgImg) bgImg.src = item.imageDataUrl;
  if (badge) badge.textContent = item.category || "CAMPUS";
  if (title) title.textContent = item.title || "S.S. +2 High School, Gola";
  if (caption) caption.textContent = item.caption || "";

  if (dots) {
    dots.innerHTML = homePhotosCache.map((_, i) => `
      <button type="button" data-home-dot="${i}" aria-label="Slide ${i + 1}"
        class="h-2 rounded-full transition-all cursor-pointer ${i === (carouselIndex % homePhotosCache.length) ? "w-7 bg-[#f59e0b]" : "w-2 bg-white/45 hover:bg-white"}"></button>
    `).join("");

    dots.querySelectorAll("[data-home-dot]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        carouselIndex = Number(btn.getAttribute("data-home-dot"));
        renderHomeCarouselSlide();
        startHomeCarouselTimer();
      });
    });
  }
}

async function mountHomeCampusShowcase() {
  const homeView = document.getElementById("view-home");
  if (!homeView) return;

  const items = await fetchGalleryItems();
  const photosOnly = items.filter((i) => i.type !== "video" && i.imageDataUrl);
  homePhotosCache = photosOnly;

  let showcase = document.getElementById("home-campus-showcase");

  // Clean zero-blank-state guard: hide if Admin hasn't uploaded any photos yet
  if (photosOnly.length === 0) {
    if (showcase) showcase.remove();
    if (carouselTimer) clearInterval(carouselTimer);
    return;
  }

  if (!showcase) {
    showcase = document.createElement("section");
    showcase.id = "home-campus-showcase";
    showcase.setAttribute("aria-label", "Campus Photo Showcase");
    homeView.insertBefore(showcase, homeView.firstChild);
  }

  showcase.innerHTML = `
    <div id="home-gal-stage"
      class="relative rounded-3xl overflow-hidden border leg-border shadow-xl bg-slate-950 h-[290px] sm:h-[430px] lg:h-[470px] cursor-pointer group select-none">
      
      <!-- Layer 1: Soft Ambient Blurred Backdrop (Fills Wide Frame Elegantly) -->
      <img id="home-gal-bg" src="${esc(photosOnly[0].imageDataUrl)}" alt="" aria-hidden="true"
        class="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-55 brightness-75 pointer-events-none" />

      <!-- Layer 2: Crisp 100% Uncropped Full Photo (Works for BOTH Vertical & Horizontal!) -->
      <img id="home-gal-fg" src="${esc(photosOnly[0].imageDataUrl)}" alt="${esc(photosOnly[0].title)}"
        class="relative z-10 w-full h-full object-contain mx-auto transition-transform duration-500" />

      <!-- Subtle Bottom Gradient for Readable Caption -->
      <div class="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-transparent z-10"></div>

      <!-- Top-Right View Full Gallery Pill -->
      <button id="home-gal-view-all" type="button"
        class="absolute top-3.5 right-3.5 z-20 px-3.5 py-1.5 rounded-xl bg-slate-950/75 hover:bg-[#f59e0b] text-white hover:text-slate-950 border border-white/20 text-xs font-extrabold backdrop-blur-sm transition-colors cursor-pointer">
        🖼️ View Full Gallery →
      </button>

      <!-- Prev / Next Controls (if >1 photo) -->
      ${
        photosOnly.length > 1
          ? `
            <button id="home-gal-prev" type="button" aria-label="Previous Photo"
              class="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/55 hover:bg-[#f59e0b] text-white hover:text-slate-950 border border-white/20 flex items-center justify-center text-lg font-extrabold opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer">
              ‹
            </button>
            <button id="home-gal-next" type="button" aria-label="Next Photo"
              class="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/55 hover:bg-[#f59e0b] text-white hover:text-slate-950 border border-white/20 flex items-center justify-center text-lg font-extrabold opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer">
              ›
            </button>
          `
          : ""
      }

      <!-- Bottom Caption & Slide Dots -->
      <div class="absolute bottom-0 inset-x-0 z-20 p-4 sm:p-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div class="space-y-1 max-w-2xl">
          <span id="home-gal-badge" class="inline-block px-2.5 py-0.5 rounded bg-[#f59e0b] text-slate-950 text-[10px] font-extrabold uppercase tracking-wider"></span>
          <h3 id="home-gal-title" class="text-base sm:text-2xl font-extrabold leading-tight drop-shadow"></h3>
          <p id="home-gal-caption" class="text-xs sm:text-sm text-slate-200 line-clamp-2"></p>
        </div>
        <div id="home-gal-dots" class="flex items-center gap-1.5 shrink-0"></div>
      </div>
    </div>
  `;

  carouselIndex = 0;
  renderHomeCarouselSlide();
  startHomeCarouselTimer();

  const stage = document.getElementById("home-gal-stage");
  stage.addEventListener("mouseenter", () => { carouselPaused = true; });
  stage.addEventListener("mouseleave", () => { carouselPaused = false; });
  stage.addEventListener("click", () => {
    openGalleryLightbox(homePhotosCache, carouselIndex % homePhotosCache.length);
  });

  // Mobile Swipe on Home Carousel
  let startX = 0;
  stage.addEventListener("touchstart", (e) => {
    startX = e.changedTouches[0].screenX;
    carouselPaused = true;
  }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].screenX - startX;
    if (Math.abs(dx) > 40 && homePhotosCache.length > 1) {
      carouselIndex = (carouselIndex + (dx < 0 ? 1 : -1) + homePhotosCache.length) % homePhotosCache.length;
      renderHomeCarouselSlide();
      startHomeCarouselTimer();
    }
    carouselPaused = false;
  }, { passive: true });

  const prevBtn = document.getElementById("home-gal-prev");
  const nextBtn = document.getElementById("home-gal-next");
  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      carouselIndex = (carouselIndex - 1 + homePhotosCache.length) % homePhotosCache.length;
      renderHomeCarouselSlide();
      startHomeCarouselTimer();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      carouselIndex = (carouselIndex + 1) % homePhotosCache.length;
      renderHomeCarouselSlide();
      startHomeCarouselTimer();
    });
  }

  document.getElementById("home-gal-view-all").addEventListener("click", (e) => {
    e.stopPropagation();
    const galBtn = document.querySelector('[data-leg-nav="gallery"]');
    if (galBtn) galBtn.click();
    else window.openCampusGalleryPage();
  });
}

// ============================================================================
// 4. DEDICATED GALLERY PAGE (#view-gallery — PURE ZERO-CROP MASONRY ARCHIVE)
// ============================================================================
window.openCampusGalleryPage = async function () {
  let view = document.getElementById("view-gallery");
  const main = document.querySelector("main") || document.body;

  if (!view) {
    view = document.createElement("section");
    view.id = "view-gallery";
    view.className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8";
    const homeView = document.getElementById("view-home");
    if (homeView && homeView.parentNode) {
      homeView.parentNode.insertBefore(view, homeView.nextSibling);
    } else {
      main.appendChild(view);
    }
  }

  view.classList.remove("hidden");
  view.innerHTML = `<div class="p-10 text-center text-sm leg-text-muted">Loading Campus Gallery...</div>`;

  const items = await fetchGalleryItems();
  const categories = ["All", "Campus", "Events", "Labs & NCC", "Sports", "Achievements", "Videos"];

  const filtered = items.filter((item) => {
    if (activeGalleryFilter === "All") return true;
    if (activeGalleryFilter === "Videos") return item.type === "video";
    return (item.category || "Campus") === activeGalleryFilter;
  });

  view.innerHTML = `
    <div class="flex flex-wrap items-end justify-between gap-4 border-b leg-border pb-4">
      <div>
        <span class="px-3 py-1 rounded-full bg-[#0B3066] text-amber-300 font-mono text-[10px] font-extrabold uppercase tracking-widest">
          OFFICIAL MEDIA ARCHIVE • ESTD. 1940
        </span>
        <h2 class="text-2xl sm:text-3xl font-extrabold leg-text-primary mt-2">
          Campus Photo &amp; Video Gallery
        </h2>
        <p class="text-xs sm:text-sm leg-text-muted mt-0.5">
          Tap any photograph to view full-screen with swipe navigation. Every image displays in full original aspect ratio.
        </p>
      </div>
      <div class="flex flex-wrap gap-1.5">
        ${categories.map((cat) => `
          <button type="button" data-gal-cat="${cat}"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeGalleryFilter === cat
                ? "bg-[#0B3066] text-white"
                : "bg-[var(--leg-surface)] border leg-border leg-text-body hover:border-amber-500"
            }">
            ${cat}
          </button>
        `).join("")}
      </div>
    </div>

    ${
      filtered.length === 0
        ? `
          <div class="sacred-card rounded-3xl p-10 text-center space-y-2">
            <div class="text-4xl">🖼️</div>
            <h3 class="text-base font-extrabold leg-text-primary">No Media in This Category Yet</h3>
            <p class="text-xs leg-text-muted max-w-md mx-auto">
              School administrators can upload compressed campus photos and YouTube event videos directly from the Secret Admin Panel.
            </p>
          </div>
        `
        : `
          <!-- PURE NATURAL-RATIO MASONRY GRID (ZERO CROPPING!) -->
          <div class="columns-1 sm:columns-2 lg:columns-3 gap-5">
            ${filtered.map((item, idx) => {
              const ytEmbed = getYouTubeEmbed(item.youtubeUrl || "");
              if (item.type === "video" && ytEmbed) {
                return `
                  <article class="gal-masonry-card mb-5 sacred-card rounded-2xl overflow-hidden flex flex-col">
                    <div class="aspect-video w-full bg-black">
                      <iframe src="${esc(ytEmbed)}" class="w-full h-full" loading="lazy" allowfullscreen></iframe>
                    </div>
                    <div class="p-4 space-y-1">
                      <span class="inline-block px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-extrabold uppercase">▶ VIDEO</span>
                      <h4 class="font-extrabold text-sm leg-text-primary pt-1">${esc(item.title)}</h4>
                      ${item.caption ? `<p class="text-xs leg-text-muted">${esc(item.caption)}</p>` : ""}
                    </div>
                  </article>
                `;
              }
              return `
                <article data-open-gal-idx="${idx}" class="gal-masonry-card mb-5 sacred-card rounded-2xl overflow-hidden cursor-pointer group">
                  <div class="relative bg-slate-950 overflow-hidden">
                    <img src="${esc(item.imageDataUrl)}" alt="${esc(item.title)}" loading="lazy"
                      class="w-full h-auto block group-hover:scale-[1.02] transition-transform duration-500" />
                    <span class="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-slate-950/80 text-amber-300 text-[10px] font-extrabold uppercase backdrop-blur-xs">
                      ${esc(item.category || "Campus")}
                    </span>
                  </div>
                  <div class="p-4 space-y-1">
                    <h4 class="font-extrabold text-sm leg-text-primary group-hover:text-[#0B3066] dark:group-hover:text-amber-400 transition-colors">
                      ${esc(item.title)}
                    </h4>
                    ${item.caption ? `<p class="text-xs leg-text-body leading-relaxed">${esc(item.caption)}</p>` : ""}
                  </div>
                </article>
              `;
            }).join("")}
          </div>
        `
    }
  `;

  view.querySelectorAll("[data-gal-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeGalleryFilter = btn.getAttribute("data-gal-cat");
      window.openCampusGalleryPage();
    });
  });

  view.querySelectorAll("[data-open-gal-idx]").forEach((card) => {
    card.addEventListener("click", () => {
      const idx = Number(card.getAttribute("data-open-gal-idx"));
      openGalleryLightbox(filtered, idx);
    });
  });
};

// ============================================================================
// 5. HOME PAGE: LAZY-LOADED LIVE SCHOOL LOCATION MAP CARD
// ============================================================================
function mountSchoolLocationMapCard() {
  if (document.getElementById("school-campus-map-section")) return;
  const homeView = document.getElementById("view-home");
  if (!homeView) return;

  const section = document.createElement("section");
  section.id = "school-campus-map-section";
  section.setAttribute("aria-label", "School Campus Location Map");
  section.className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8";

  section.innerHTML = `
    <div class="sacred-card rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
      <div class="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-5">
        <div class="space-y-3">
          <span class="inline-block px-3 py-1 rounded-full bg-[#0B3066] text-amber-300 font-mono text-[10px] font-extrabold uppercase tracking-wider">
            CAMPUS LOCATION • LIVE MAP
          </span>
          <h2 class="text-xl sm:text-2xl font-extrabold leg-text-primary leading-tight">
            Visit S.S. +2 High School, Gola
          </h2>
          <p class="text-xs sm:text-sm leg-text-body leading-relaxed">
            Near Community Health Centre, Heramdaga Road, Bantara, Gola Block, District Ramgarh, Jharkhand — <strong>829110</strong>
          </p>

          <div class="grid grid-cols-2 gap-2.5 pt-2 text-xs">
            <div class="p-3 rounded-xl sacred-inner-box">
              <div class="text-[10px] font-mono leg-text-muted uppercase">UDISE Code</div>
              <div class="font-extrabold leg-text-primary mt-0.5">20240701206</div>
            </div>
            <div class="p-3 rounded-xl sacred-inner-box">
              <div class="text-[10px] font-mono leg-text-muted uppercase">Established</div>
              <div class="font-extrabold leg-text-primary mt-0.5">1940 (JAC Ranchi)</div>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2.5 pt-2">
          <a href="${SCHOOL_MAP_SHORT_URL}" target="_blank" rel="noopener noreferrer"
            class="flex-1 text-center px-4 py-3 rounded-xl bg-[#0B3066] hover:bg-[#14438a] text-white text-xs font-extrabold shadow-sm transition-colors">
            📍 Get Directions in Google Maps ↗
          </a>
          <button type="button" id="map-open-gallery-btn"
            class="px-4 py-3 rounded-xl bg-[#f59e0b] hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer">
            🖼️ Campus Gallery
          </button>
        </div>
      </div>

      <div class="lg:col-span-7 min-h-[290px] sm:min-h-[340px] bg-slate-200 dark:bg-slate-900">
        <iframe
          title="S.S. +2 High School Gola Campus Map"
          src="${SCHOOL_MAP_EMBED_URL}"
          class="w-full h-full min-h-[290px] sm:min-h-[340px] border-0"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen>
        </iframe>
      </div>
    </div>
  `;

  homeView.appendChild(section);

  document.getElementById("map-open-gallery-btn").addEventListener("click", () => {
    const galBtn = document.querySelector('[data-leg-nav="gallery"]');
    if (galBtn) galBtn.click();
    else window.openCampusGalleryPage();
  });
}

// ============================================================================
// 6. SECRET ADMIN EXECUTIVE CONTROL SUITE v3.0 (3-WAY MOBILE DRAWER CLOSE)
// ============================================================================
function ensureExecutiveAdminModal() {
  let modal = document.getElementById("exec-admin-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "exec-admin-modal";
  modal.className = "fixed inset-0 z-[9998] bg-black/85 backdrop-blur-md hidden items-center justify-center p-0 sm:p-4 overflow-hidden";

  modal.innerHTML = `
    <div class="exec-shell w-full h-full sm:h-[92vh] sm:max-w-7xl sm:rounded-3xl border border-amber-500/25 shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col">
      
      <!-- LOCKED LOGIN VIEW -->
      <div id="exec-login-screen" class="flex-1 flex items-center justify-center p-6">
        <div class="exec-card rounded-3xl p-7 sm:p-9 max-w-md w-full space-y-6 border border-amber-500/35">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-xl">🛡️</div>
              <div>
                <div class="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">Zero-Trust Vault</div>
                <h2 class="text-lg font-extrabold text-white">Secret Admin Panel</h2>
              </div>
            </div>
            <button id="exec-login-close" type="button" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-red-600 text-xs font-bold cursor-pointer">✕</button>
          </div>

          <p class="text-xs text-slate-400 leading-relaxed">
            Restricted to the Authorized School Administrator. Unauthorized Student or Teacher accounts are automatically blocked.
          </p>

          <form id="exec-admin-login-form" class="space-y-4 text-xs">
            <div>
              <label class="block text-amber-300 font-bold mb-1">Admin Email</label>
              <input id="exec-adm-email" type="email" required placeholder="Authorized Admin Gmail"
                class="exec-input w-full px-4 py-3 rounded-xl text-sm" />
            </div>
            <div>
              <label class="block text-amber-300 font-bold mb-1">Password</label>
              <input id="exec-adm-pass" type="password" required placeholder="••••••••"
                class="exec-input w-full px-4 py-3 rounded-xl text-sm" />
            </div>
            <div id="exec-login-err" class="hidden p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold"></div>
            <button id="exec-login-btn" type="submit"
              class="w-full py-3.5 rounded-xl exec-nav-active text-sm uppercase tracking-wider cursor-pointer">
              🔐 Unlock Command Suite
            </button>
          </form>
        </div>
      </div>

      <!-- EXECUTIVE COMMAND CENTER -->
      <div id="exec-dashboard-screen" class="hidden flex-1 flex overflow-hidden relative">
        
        <div id="exec-sidebar-backdrop" class="hidden fixed inset-0 bg-black/70 backdrop-blur-xs z-20 lg:hidden"></div>

        <aside id="exec-sidebar" class="exec-sidebar hidden lg:flex lg:static flex-col justify-between w-64 max-w-[82vw] shrink-0 p-4 overflow-y-auto z-30">
          <div class="space-y-6">
            <div class="relative text-center pt-2 pb-4 border-b border-amber-500/15">
              <button id="exec-sidebar-close" type="button" aria-label="Close Sidebar"
                class="lg:hidden absolute top-0 right-0 w-8 h-8 rounded-lg bg-white/10 hover:bg-red-600 text-slate-200 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer">
                ✕
              </button>
              <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-2xl shadow-lg">🏛️</div>
              <div class="font-extrabold text-sm text-amber-300 tracking-wide mt-2.5">S.S. +2 HIGH SCHOOL</div>
              <div class="text-[11px] font-bold text-white">GOLA • RAMGARH</div>
              <div class="text-[10px] italic text-amber-400/80 mt-0.5">Knowledge • Discipline • Progress</div>
            </div>

            <nav id="exec-nav-list" class="space-y-1.5 text-xs font-semibold text-slate-300"></nav>
          </div>

          <div class="pt-4 border-t border-amber-500/15 space-y-2.5">
            <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <div class="text-[11px] font-extrabold text-white">System Status</div>
                <div class="text-[10px] text-emerald-400">Zero-Trust Cloud Live</div>
              </div>
            </div>
            <button id="exec-logout-btn" type="button"
              class="w-full py-2.5 rounded-xl bg-red-500/15 hover:bg-red-600 text-red-300 hover:text-white text-xs font-extrabold transition-colors cursor-pointer">
              ⏻ Sign Out Admin
            </button>
          </div>
        </aside>

        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header class="px-4 sm:px-6 py-3.5 bg-[#0b1120] border-b border-amber-500/15 flex items-center justify-between gap-3 shrink-0">
            <div class="flex items-center gap-3 min-w-0">
              <button id="exec-mob-menu" type="button" aria-label="Open Admin Menu"
                class="lg:hidden px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-400/35 text-amber-300 font-bold text-sm cursor-pointer">☰</button>
              <div class="min-w-0">
                <h2 class="text-sm sm:text-base font-extrabold text-amber-300 truncate">Secret Admin Panel</h2>
                <p class="text-[10px] font-mono text-slate-400 truncate">Executive Control Suite v3.0 • <span id="exec-admin-email-lbl"></span></p>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <span class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Secure Connection 🔒
              </span>
              <button id="exec-close-btn" type="button"
                class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-600 text-white text-xs font-bold cursor-pointer">
                ✕ Close
              </button>
            </div>
          </header>

          <div id="exec-mobile-tabs" class="lg:hidden px-3 py-2 bg-[#0a0f1d] border-b border-amber-500/15 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0"></div>

          <main id="exec-workspace" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"></main>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  const openExecSidebar = () => {
    const sb = document.getElementById("exec-sidebar");
    const bd = document.getElementById("exec-sidebar-backdrop");
    if (sb) {
      sb.classList.remove("hidden");
      sb.classList.add("flex", "fixed", "inset-y-0", "left-0", "shadow-2xl");
    }
    if (bd) bd.classList.remove("hidden");
  };

  const closeExecSidebar = () => {
    const sb = document.getElementById("exec-sidebar");
    const bd = document.getElementById("exec-sidebar-backdrop");
    if (sb) {
      sb.classList.add("hidden");
      sb.classList.remove("flex", "fixed", "inset-y-0", "left-0", "shadow-2xl");
    }
    if (bd) bd.classList.add("hidden");
  };

  window._closeExecMobileSidebar = closeExecSidebar;

  const closeModal = () => {
    closeExecSidebar();
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  };

  document.getElementById("exec-login-close").addEventListener("click", closeModal);
  document.getElementById("exec-close-btn").addEventListener("click", closeModal);
  document.getElementById("exec-mob-menu").addEventListener("click", openExecSidebar);
  document.getElementById("exec-sidebar-close").addEventListener("click", closeExecSidebar);
  document.getElementById("exec-sidebar-backdrop").addEventListener("click", closeExecSidebar);

  document.getElementById("exec-admin-login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("exec-login-err");
    const btn = document.getElementById("exec-login-btn");
    errEl.classList.add("hidden");
    btn.disabled = true;
    btn.textContent = "Verifying Credentials...";

    try {
      await window.BackendService.loginAdmin(
        document.getElementById("exec-adm-email").value,
        document.getElementById("exec-adm-pass").value
      );
      e.target.reset();
      renderExecutiveAdminState();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove("hidden");
    } finally {
      btn.disabled = false;
      btn.textContent = "🔐 Unlock Command Suite";
    }
  });

  document.getElementById("exec-logout-btn").addEventListener("click", async () => {
    closeExecSidebar();
    await window.BackendService.logoutAdmin();
    renderExecutiveAdminState();
  });

  return modal;
}

const EXEC_TABS = [
  { id: "dashboard", label: "Dashboard", icon: "🏠" },
  { id: "gallery", label: "Campus Gallery", icon: "🖼️" },
  { id: "notices", label: "Notices Studio", icon: "📢" },
  { id: "users", label: "Users & Staff", icon: "👥" },
  { id: "stambh", label: "Guru & Alumni", icon: "🏛️" },
  { id: "reports", label: "Flagged Reports", icon: "🚩" }
];

function renderExecNav() {
  const sideNav = document.getElementById("exec-nav-list");
  const mobNav = document.getElementById("exec-mobile-tabs");
  if (!sideNav || !mobNav) return;

  sideNav.innerHTML = EXEC_TABS.map((t) => `
    <button type="button" data-exec-tab="${t.id}"
      class="w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
        adminActiveTab === t.id ? "exec-nav-active" : "hover:bg-white/5 text-slate-300"
      }">
      <span>${t.icon}</span><span>${t.label}</span>
    </button>
  `).join("");

  mobNav.innerHTML = EXEC_TABS.map((t) => `
    <button type="button" data-exec-tab="${t.id}"
      class="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
        adminActiveTab === t.id ? "exec-nav-active" : "bg-white/5 text-slate-300"
      }">
      ${t.icon} ${t.label}
    </button>
  `).join("");

  document.querySelectorAll("[data-exec-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      adminActiveTab = btn.getAttribute("data-exec-tab");
      if (window._closeExecMobileSidebar) window._closeExecMobileSidebar();
      renderExecNav();
      loadExecWorkspaceTab(adminActiveTab);
    });
  });
}

async function renderExecutiveAdminState() {
  const adminUser = window.BackendService ? window.BackendService.getAdminUser() : null;
  const loginView = document.getElementById("exec-login-screen");
  const dashView = document.getElementById("exec-dashboard-screen");

  if (!adminUser) {
    loginView.classList.remove("hidden");
    dashView.classList.add("hidden");
    return;
  }

  loginView.classList.add("hidden");
  dashView.classList.remove("hidden");
  document.getElementById("exec-admin-email-lbl").textContent = adminUser.email;
  renderExecNav();
  loadExecWorkspaceTab(adminActiveTab);
}

async function loadExecWorkspaceTab(tab) {
  const ws = document.getElementById("exec-workspace");
  const db = getDb();
  if (!ws || !db) return;

  ws.innerHTML = `<p class="text-xs text-slate-400">Syncing live institutional data...</p>`;

  if (tab === "dashboard") {
    const [notices, usersSnap, galItems, repSnap] = await Promise.all([
      window.BackendService.fetchNotices(),
      getDocs(collection(db, "users")).catch(() => ({ docs: [] })),
      fetchGalleryItems(),
      getDocs(collection(db, "reports")).catch(() => ({ docs: [] }))
    ]);
    const users = usersSnap.docs.map((d) => d.data());
    const pendingTeachers = users.filter((u) => u.role === "pending_teacher").length;

    ws.innerHTML = `
      <div class="exec-card rounded-2xl p-5 sm:p-6 border border-amber-500/25 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div class="space-y-1">
          <div class="text-xs text-slate-300 font-semibold">Welcome Back,</div>
          <h3 class="text-2xl sm:text-3xl font-extrabold text-amber-400">Administrator!</h3>
          <p class="text-xs text-slate-400">Here's what's happening today across S.S. +2 High School, Gola.</p>
        </div>
        <div class="text-left sm:text-right">
          <div class="text-base sm:text-lg font-extrabold italic text-amber-300">“Our School As A Temple”</div>
          <div class="text-[11px] font-mono text-slate-400 mt-0.5">Purity • Equality • Discipline</div>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div class="exec-kpi-blue rounded-2xl p-4 space-y-1">
          <div class="text-xs text-blue-300 font-bold">Total Portal Users</div>
          <div class="text-2xl sm:text-3xl font-extrabold text-white">${users.length}</div>
          <div class="text-[11px] text-amber-300">${pendingTeachers} pending teacher(s)</div>
        </div>
        <div class="exec-kpi-emerald rounded-2xl p-4 space-y-1">
          <div class="text-xs text-emerald-300 font-bold">Live Notices</div>
          <div class="text-2xl sm:text-3xl font-extrabold text-white">${notices.length}</div>
          <div class="text-[11px] text-emerald-300">Synced to Marquee</div>
        </div>
        <div class="exec-kpi-purple rounded-2xl p-4 space-y-1">
          <div class="text-xs text-purple-300 font-bold">Gallery Media</div>
          <div class="text-2xl sm:text-3xl font-extrabold text-white">${galItems.length}</div>
          <div class="text-[11px] text-purple-200">Home Slider + Masonry</div>
        </div>
        <div class="exec-kpi-gold rounded-2xl p-4 space-y-1">
          <div class="text-xs text-amber-300 font-bold">Flagged Reports</div>
          <div class="text-2xl sm:text-3xl font-extrabold text-white">${repSnap.docs.length}</div>
          <div class="text-[11px] text-red-300">${repSnap.docs.length > 0 ? "Action needed" : "All clear"}</div>
        </div>
      </div>

      <div class="exec-card rounded-2xl p-5 space-y-3">
        <h4 class="text-sm font-extrabold text-amber-300">⚡ Quick Actions</h4>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
          <button type="button" data-quick-go="gallery" class="p-4 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 text-center space-y-1.5 cursor-pointer">
            <div class="text-xl">🖼️</div><div>Upload Gallery</div>
          </button>
          <button type="button" data-quick-go="notices" class="p-4 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 text-center space-y-1.5 cursor-pointer">
            <div class="text-xl">📢</div><div>Add Notice</div>
          </button>
          <button type="button" data-quick-go="users" class="p-4 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 text-center space-y-1.5 cursor-pointer">
            <div class="text-xl">👥</div><div>Approve Teachers</div>
          </button>
          <button type="button" data-quick-go="reports" class="p-4 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 text-center space-y-1.5 cursor-pointer">
            <div class="text-xl">🚩</div><div>Review Reports</div>
          </button>
        </div>
      </div>
    `;

    ws.querySelectorAll("[data-quick-go]").forEach((b) => {
      b.addEventListener("click", () => {
        adminActiveTab = b.getAttribute("data-quick-go");
        renderExecNav();
        loadExecWorkspaceTab(adminActiveTab);
      });
    });
    return;
  }

  // ==================== TAB: CAMPUS GALLERY MANAGER ====================
  if (tab === "gallery") {
    adminCompressedPhoto = "";
    const items = await fetchGalleryItems();

    ws.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <form id="exec-gal-form" class="lg:col-span-5 exec-card rounded-2xl p-5 space-y-3.5 text-xs h-fit">
          <h3 class="text-sm font-extrabold text-amber-300">🖼️ Add Photo or YouTube Video</h3>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-slate-300 font-bold mb-1">Media Type</label>
              <select id="eg-type" class="exec-input w-full px-3 py-2 rounded-xl font-bold">
                <option value="photo">📸 Compressed Photo</option>
                <option value="video">▶️ YouTube Video</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-300 font-bold mb-1">Category</label>
              <select id="eg-cat" class="exec-input w-full px-3 py-2 rounded-xl font-bold">
                <option value="Campus">Campus</option>
                <option value="Events">Events</option>
                <option value="Labs & NCC">Labs &amp; NCC</option>
                <option value="Sports">Sports</option>
                <option value="Achievements">Achievements</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-slate-300 font-bold mb-1">Title *</label>
            <input id="eg-title" type="text" required placeholder="e.g. Independence Day NCC Parade 2026"
              class="exec-input w-full px-3.5 py-2.5 rounded-xl" />
          </div>

          <div>
            <label class="block text-slate-300 font-bold mb-1">Caption / Description Text</label>
            <textarea id="eg-caption" rows="2" placeholder="Write a short caption that appears with this photo..."
              class="exec-input w-full px-3.5 py-2 rounded-xl"></textarea>
          </div>

          <div id="eg-photo-box">
            <label class="block text-slate-300 font-bold mb-1">Upload Photo (Auto-Compressed ~80KB) *</label>
            <input id="eg-file" type="file" accept="image/*"
              class="w-full text-xs file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-amber-400 file:text-slate-950 file:font-extrabold cursor-pointer" />
            <div id="eg-prev" class="hidden mt-2 flex items-center gap-2 text-emerald-400 font-bold"></div>
          </div>

          <div id="eg-yt-box" class="hidden">
            <label class="block text-slate-300 font-bold mb-1">YouTube Video Link *</label>
            <input id="eg-yt" type="url" placeholder="https://youtu.be/... or https://youtube.com/watch?v=..."
              class="exec-input w-full px-3.5 py-2.5 rounded-xl" />
          </div>

          <button id="eg-submit" type="submit" class="w-full py-3 rounded-xl exec-nav-active text-xs uppercase tracking-wider cursor-pointer">
            🚀 Publish to Live Gallery &amp; Home Slider
          </button>
        </form>

        <div class="lg:col-span-7 exec-card rounded-2xl p-5 space-y-3">
          <h3 class="text-sm font-extrabold text-amber-300">Live Gallery Archive (${items.length})</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            ${
              items.length === 0
                ? `<p class="text-xs text-slate-400">No items uploaded yet.</p>`
                : items.map((it) => `
                    <div class="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
                      ${
                        it.type === "video"
                          ? `<div class="h-28 rounded-lg bg-slate-900 flex items-center justify-center text-red-400 font-bold">▶ YouTube Video</div>`
                          : `<div class="h-28 rounded-lg bg-slate-950 flex items-center justify-center overflow-hidden"><img src="${esc(it.imageDataUrl)}" class="max-h-full max-w-full object-contain" /></div>`
                      }
                      <div class="font-bold text-white truncate">${esc(it.title)}</div>
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-[10px] font-mono text-amber-300">${esc(it.category || "Campus")}</span>
                        <button type="button" data-del-gal="${esc(it.id)}"
                          class="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white font-bold cursor-pointer">Delete</button>
                      </div>
                    </div>
                  `).join("")
            }
          </div>
        </div>
      </div>
    `;

    document.getElementById("eg-type").addEventListener("change", (e) => {
      const isVid = e.target.value === "video";
      document.getElementById("eg-photo-box").classList.toggle("hidden", isVid);
      document.getElementById("eg-yt-box").classList.toggle("hidden", !isVid);
    });

    document.getElementById("eg-file").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const prev = document.getElementById("eg-prev");
      prev.textContent = "Compressing HD photo...";
      prev.classList.remove("hidden");
      try {
        adminCompressedPhoto = await compressPhoto(file, 1100, 0.74);
        const kb = Math.round((adminCompressedPhoto.length * 3) / 4 / 1024);
        prev.innerHTML = `<img src="${adminCompressedPhoto}" class="w-12 h-12 rounded-lg object-contain bg-black border border-amber-400" /> <span>✓ Ready (${kb} KB)</span>`;
      } catch (err) {
        prev.textContent = "Compression error.";
      }
    });

    document.getElementById("exec-gal-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const type = document.getElementById("eg-type").value;
      const ytUrl = document.getElementById("eg-yt").value.trim();

      if (type === "photo" && !adminCompressedPhoto) return alert("Please choose a photo first.");
      if (type === "video" && !getYouTubeEmbed(ytUrl)) return alert("Please enter a valid YouTube link.");

      const btn = document.getElementById("eg-submit");
      btn.disabled = true;
      btn.textContent = "Publishing...";
      try {
        await addDoc(collection(db, "gallery_items"), {
          type,
          category: document.getElementById("eg-cat").value,
          title: document.getElementById("eg-title").value.trim(),
          caption: document.getElementById("eg-caption").value.trim(),
          imageDataUrl: type === "photo" ? adminCompressedPhoto : "",
          youtubeUrl: type === "video" ? ytUrl : "",
          createdAt: new Date().toISOString()
        });
        await mountHomeCampusShowcase();
        const galView = document.getElementById("view-gallery");
        if (galView && !galView.classList.contains("hidden")) window.openCampusGalleryPage();
        loadExecWorkspaceTab("gallery");
      } catch (err) {
        alert("Upload failed: " + err.message);
        btn.disabled = false;
        btn.textContent = "🚀 Publish to Live Gallery & Home Slider";
      }
    });

    ws.querySelectorAll("[data-del-gal]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this gallery item permanently?")) return;
        await deleteDoc(doc(db, "gallery_items", btn.getAttribute("data-del-gal")));
        await mountHomeCampusShowcase();
        const galView = document.getElementById("view-gallery");
        if (galView && !galView.classList.contains("hidden")) window.openCampusGalleryPage();
        loadExecWorkspaceTab("gallery");
      });
    });
    return;
  }

  // ==================== TAB: NOTICES STUDIO ====================
  if (tab === "notices") {
    adminNoticeImage = "";
    const notices = await window.BackendService.fetchNotices();

    ws.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
        <form id="exec-notice-form" class="lg:col-span-6 exec-card rounded-2xl p-5 space-y-3">
          <h3 class="text-sm font-extrabold text-amber-300">📢 Publish Official Notice</h3>
          <div class="grid grid-cols-2 gap-2.5">
            <input id="en-tag" value="OFFICIAL NOTICE" placeholder="Category Tag" class="exec-input px-3 py-2 rounded-xl font-bold" />
            <input id="en-audience" value="All School" placeholder="Target (e.g. All School)" class="exec-input px-3 py-2 rounded-xl" />
          </div>
          <input id="en-title" required placeholder="Notice Headline *" class="exec-input w-full px-3.5 py-2.5 rounded-xl text-sm font-bold" />
          <textarea id="en-desc" required rows="3" placeholder="Complete official notice text *" class="exec-input w-full px-3.5 py-2.5 rounded-xl"></textarea>
          <input id="en-link" type="url" placeholder="Google Drive PDF or YouTube Link (Optional)" class="exec-input w-full px-3.5 py-2.5 rounded-xl" />
          <input id="en-img" type="file" accept="image/*" class="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-400 file:text-slate-950 file:font-bold" />
          <label class="flex items-center gap-2 font-bold text-slate-200 cursor-pointer">
            <input id="en-new" type="checkbox" checked class="accent-amber-400" /> Highlight with NEW badge in Marquee
          </label>
          <button id="en-submit" type="submit" class="w-full py-3 rounded-xl exec-nav-active text-xs uppercase cursor-pointer">🚀 Publish Live Notice</button>
        </form>

        <div class="lg:col-span-6 exec-card rounded-2xl p-5 space-y-2.5">
          <h3 class="text-sm font-extrabold text-amber-300">Active Cloud Notices (${notices.length})</h3>
          <div class="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
            ${notices.map((n) => `
              <div class="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <div class="text-[10px] font-mono text-amber-300">${esc(n.date)} • ${esc(n.authorName || "Admin")}</div>
                  <div class="font-bold text-white truncate">${esc(n.titleEn || n.titleHi)}</div>
                </div>
                <button type="button" data-del-notice="${esc(n.id)}"
                  class="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white font-bold shrink-0 cursor-pointer">Delete</button>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;

    document.getElementById("en-img").addEventListener("change", async (e) => {
      if (e.target.files[0]) adminNoticeImage = await compressPhoto(e.target.files[0], 900, 0.72);
    });

    document.getElementById("exec-notice-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("en-title").value.trim();
      const desc = document.getElementById("en-desc").value.trim();
      const tag = document.getElementById("en-tag").value.trim() || "OFFICIAL NOTICE";
      await addDoc(collection(db, "notices"), {
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        tagEn: tag, tagHi: tag, titleEn: title, titleHi: title, descEn: desc, descHi: desc,
        targetAudience: document.getElementById("en-audience").value.trim() || "All School",
        attachmentUrl: document.getElementById("en-link").value.trim(),
        imageDataUrl: adminNoticeImage,
        isNew: document.getElementById("en-new").checked,
        authorName: "School Administration",
        createdAt: new Date().toISOString()
      });
      if (window.LegacyPortalBridge) window.LegacyPortalBridge.refreshNotices();
      loadExecWorkspaceTab("notices");
    });

    ws.querySelectorAll("[data-del-notice]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this notice permanently?")) return;
        await deleteDoc(doc(db, "notices", btn.getAttribute("data-del-notice")));
        if (window.LegacyPortalBridge) window.LegacyPortalBridge.refreshNotices();
        loadExecWorkspaceTab("notices");
      });
    });
    return;
  }

  // ==================== TAB: USERS & STAFF ====================
  if (tab === "users") {
    const snap = await getDocs(collection(db, "users"));
    const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    users.sort((a, b) => {
      const s = (u) => (u.role === "pending_teacher" ? 0 : u.role === "teacher" ? 1 : 2);
      return s(a) - s(b);
    });

    ws.innerHTML = `
      <div class="exec-card rounded-2xl p-5 space-y-4 text-xs">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-extrabold text-amber-300">👥 Portal Accounts (${users.length})</h3>
          <input id="exec-user-search" type="text" placeholder="Search name, email, class..." class="exec-input px-3.5 py-2 rounded-xl w-full sm:w-64" />
        </div>
        <div id="exec-users-grid" class="space-y-2.5 max-h-[62vh] overflow-y-auto pr-1"></div>
      </div>
    `;

    const paintUsers = (qStr = "") => {
      const q = qStr.toLowerCase();
      const filtered = users.filter((u) =>
        `${u.fullName || ""} ${u.email || ""} ${u.role || ""} ${u.classLevel || ""}`.toLowerCase().includes(q)
      );
      const grid = document.getElementById("exec-users-grid");
      grid.innerHTML = filtered.map((u) => {
        const isPend = u.role === "pending_teacher";
        const isTch = u.role === "teacher" && u.approved;
        return `
          <div class="p-3.5 rounded-xl bg-white/5 border ${isPend ? "border-amber-400/60" : "border-white/10"} flex flex-wrap items-center justify-between gap-3">
            <div class="space-y-0.5">
              <div class="font-bold text-sm text-white">
                ${esc(u.fullName)}
                <span class="ml-1.5 px-2 py-0.5 rounded text-[10px] font-mono ${isPend ? "bg-amber-400 text-slate-950 font-extrabold" : isTch ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"}">${esc(u.role.toUpperCase())}</span>
              </div>
              <div class="text-slate-300">${u.role === "student" ? `Class ${esc(u.classLevel)} (${esc(u.stream)})` : `${esc(u.designation || "Teacher")} • ${esc(u.subject || "General")}`}</div>
              <div class="font-mono text-[11px] text-amber-300">📧 ${esc(u.email)} • 📞 ${esc(u.phone || "N/A")}</div>
            </div>
            <div class="flex items-center gap-2">
              ${isPend ? `<button data-eu-approve="${esc(u.uid)}" class="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-extrabold cursor-pointer">✓ Approve Teacher</button>` : ""}
              ${isTch ? `<button data-eu-revoke="${esc(u.uid)}" class="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold cursor-pointer">Revoke</button>` : ""}
              <button data-eu-del="${esc(u.uid)}" class="px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white font-bold cursor-pointer">Delete</button>
            </div>
          </div>
        `;
      }).join("");

      grid.querySelectorAll("[data-eu-approve]").forEach((b) => b.addEventListener("click", async () => {
        await updateDoc(doc(db, "users", b.getAttribute("data-eu-approve")), { role: "teacher", approved: true });
        loadExecWorkspaceTab("users");
      }));
      grid.querySelectorAll("[data-eu-revoke]").forEach((b) => b.addEventListener("click", async () => {
        await updateDoc(doc(db, "users", b.getAttribute("data-eu-revoke")), { role: "pending_teacher", approved: false });
        loadExecWorkspaceTab("users");
      }));
      grid.querySelectorAll("[data-eu-del]").forEach((b) => b.addEventListener("click", async () => {
        if (!confirm("Delete this user account profile?")) return;
        await deleteDoc(doc(db, "users", b.getAttribute("data-eu-del")));
        loadExecWorkspaceTab("users");
      }));
    };

    paintUsers();
    document.getElementById("exec-user-search").addEventListener("input", (e) => paintUsers(e.target.value));
    return;
  }

  // ==================== TAB: GURU & GAURAV STAMBH ====================
  if (tab === "stambh") {
    const [faculty, alumni] = await Promise.all([
      window.BackendService.fetchAllFacultyForAdmin(),
      window.BackendService.fetchAllAlumniForAdmin()
    ]);

    ws.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
        <div class="exec-card rounded-2xl p-5 space-y-3">
          <h3 class="text-sm font-extrabold text-amber-300">👨‍🏫 Guru Stambh Approvals (${faculty.length})</h3>
          <div class="space-y-2.5 max-h-[58vh] overflow-y-auto pr-1">
            ${faculty.length === 0 ? `<p class="text-slate-400">No submissions.</p>` : faculty.map((f) => `
              <div class="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <div class="font-bold text-white truncate">${esc(f.fullName)} (${esc(f.subject)})</div>
                  <div class="text-slate-400">Class ${esc(f.wing)} • Status: <strong class="text-amber-300">${esc(f.status)}</strong></div>
                </div>
                <div class="flex gap-1.5 shrink-0">
                  ${f.status !== "approved" ? `<button data-app-fac="${esc(f.id)}" class="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-extrabold cursor-pointer">✓</button>` : ""}
                  <button data-del-fac="${esc(f.id)}" class="px-2.5 py-1 rounded bg-red-500/20 text-red-300 font-bold cursor-pointer">✕</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="exec-card rounded-2xl p-5 space-y-3">
          <h3 class="text-sm font-extrabold text-emerald-300">🏆 Gaurav Stambh (Alumni) Approvals (${alumni.length})</h3>
          <div class="space-y-2.5 max-h-[58vh] overflow-y-auto pr-1">
            ${alumni.length === 0 ? `<p class="text-slate-400">No submissions.</p>` : alumni.map((a) => `
              <div class="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <div class="font-bold text-white truncate">${esc(a.fullName)} (Batch ${esc(a.batchYear)})</div>
                  <div class="text-slate-400 truncate">${esc(a.achievement || "")} • <strong class="text-amber-300">${esc(a.status)}</strong></div>
                </div>
                <div class="flex gap-1.5 shrink-0">
                  ${a.status !== "approved" ? `<button data-app-alu="${esc(a.id)}" class="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-extrabold cursor-pointer">✓</button>` : ""}
                  <button data-del-alu="${esc(a.id)}" class="px-2.5 py-1 rounded bg-red-500/20 text-red-300 font-bold cursor-pointer">✕</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;

    ws.querySelectorAll("[data-app-fac]").forEach((b) => b.addEventListener("click", async () => {
      await window.BackendService.approveFaculty(b.getAttribute("data-app-fac"));
      loadExecWorkspaceTab("stambh");
    }));
    ws.querySelectorAll("[data-del-fac]").forEach((b) => b.addEventListener("click", async () => {
      if (!confirm("Delete faculty entry?")) return;
      await window.BackendService.deleteFaculty(b.getAttribute("data-del-fac"));
      loadExecWorkspaceTab("stambh");
    }));
    ws.querySelectorAll("[data-app-alu]").forEach((b) => b.addEventListener("click", async () => {
      await window.BackendService.approveAlumni(b.getAttribute("data-app-alu"));
      loadExecWorkspaceTab("stambh");
    }));
    ws.querySelectorAll("[data-del-alu]").forEach((b) => b.addEventListener("click", async () => {
      if (!confirm("Delete alumni entry?")) return;
      await window.BackendService.deleteAlumni(b.getAttribute("data-del-alu"));
      loadExecWorkspaceTab("stambh");
    }));
    return;
  }

  // ==================== TAB: FLAGGED REPORTS ====================
  if (tab === "reports") {
    const snap = await getDocs(collection(db, "reports"));
    const reports = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    reports.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    ws.innerHTML = `
      <div class="exec-card rounded-2xl p-5 space-y-3 text-xs">
        <h3 class="text-sm font-extrabold text-red-400">🚩 Teacher-Reported Fake Students (${reports.length})</h3>
        ${
          reports.length === 0
            ? `<p class="text-slate-400">No active fake student reports.</p>`
            : reports.map((r) => `
                <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/35 flex flex-wrap items-center justify-between gap-3">
                  <div class="space-y-1">
                    <div class="font-extrabold text-sm text-white">🚩 ${esc(r.reportedStudentName)} <span class="text-amber-300 font-mono text-xs">(Class ${esc(r.reportedStudentClass)})</span></div>
                    <div class="text-red-300 font-semibold">Reason: ${esc(r.reason)}</div>
                    <div class="text-slate-300">By: ${esc(r.reportedByTeacherName)} • 📧 ${esc(r.reportedStudentEmail)} • 📞 ${esc(r.reportedStudentPhone)}</div>
                  </div>
                  <div class="flex gap-2">
                    <button data-ban-stu="${esc(r.reportedStudentUid)}" data-rep-id="${esc(r.id)}" class="px-3 py-1.5 rounded-lg bg-red-600 text-white font-extrabold cursor-pointer">Delete Student</button>
                    <button data-dis-rep="${esc(r.id)}" class="px-3 py-1.5 rounded-lg bg-white/10 text-slate-200 font-bold cursor-pointer">Dismiss</button>
                  </div>
                </div>
              `).join("")
        }
      </div>
    `;

    ws.querySelectorAll("[data-ban-stu]").forEach((b) => b.addEventListener("click", async () => {
      if (!confirm("Delete this flagged student profile permanently?")) return;
      const uid = b.getAttribute("data-ban-stu");
      const rid = b.getAttribute("data-rep-id");
      if (uid) await deleteDoc(doc(db, "users", uid));
      await deleteDoc(doc(db, "reports", rid));
      loadExecWorkspaceTab("reports");
    }));
    ws.querySelectorAll("[data-dis-rep]").forEach((b) => b.addEventListener("click", async () => {
      await deleteDoc(doc(db, "reports", b.getAttribute("data-dis-rep")));
      loadExecWorkspaceTab("reports");
    }));
  }
}

function bindExecutiveAdminTrigger() {
  window.openSecretAdminModal = function () {
    const oldModal = document.getElementById("secret-admin-modal");
    if (oldModal) oldModal.classList.add("hidden");

    const modal = ensureExecutiveAdminModal();
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    renderExecutiveAdminState();
  };

  window.addEventListener("admin-auth-changed", () => {
    const modal = document.getElementById("exec-admin-modal");
    if (modal && !modal.classList.contains("hidden")) {
      renderExecutiveAdminState();
    }
  });
}

// ============================================================================
// 7. BOOTSTRAP
// ============================================================================
function bootCampusExperience() {
  injectExecutiveStyles();
  mountSchoolLocationMapCard();
  bindExecutiveAdminTrigger();
  mountHomeCampusShowcase();

  // Sync Home Showcase once Firebase finishes connecting
  window.addEventListener("backend-ready", () => {
    setTimeout(mountHomeCampusShowcase, 300);
  });
  setTimeout(mountHomeCampusShowcase, 900);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootCampusExperience);
} else {
  bootCampusExperience();
}

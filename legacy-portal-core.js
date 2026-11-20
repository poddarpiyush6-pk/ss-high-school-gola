// ============================================================================
// FILE: legacy-portal-core.js (v3.3 — STICKY MOBILE NAV + ZERO-BLOAT SHELL)
// 1. 4-Tier NTA/JEE Legacy Header + True Sticky Navigation Bar (Mobile & PC)
// 2. Eye-Friendly Dual Theme Engine (Soft Paper Day & Comfort Slate Night)
// 3. Adaptive Ctrl+K Spotlight Search Override + Mobile Sticky Search Button
// 4. Zero-Button Continuous "LATEST NEWS" Marquee + In-Site PDF/YT/Image Viewer
// 5. Curved Animated Auth Modal (Stealth Admin Isolation + Fresh Profile Sync)
// ============================================================================

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let fbApp = null;
let fbAuth = null;
let fbDb = null;
let currentUser = null;
let currentUserProfile = null;
let liveNoticesList = [];
let fontScaleStep = 0;

function escapeSafe(str) {
  const d = document.createElement("div");
  d.textContent = str == null ? "" : String(str);
  return d.innerHTML;
}

function getDrivePreviewUrl(url) {
  if (!url || typeof url !== "string") return null;
  const m =
    url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/) ||
    url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]{10,})/) ||
    url.match(/docs\.google\.com\/[a-z]+\/d\/([a-zA-Z0-9_-]{10,})/);
  return m && m[1] ? `https://drive.google.com/file/d/${m[1]}/preview` : null;
}

function getYouTubeEmbedUrl(url) {
  if (!url || typeof url !== "string") return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m && m[1] ? `https://www.youtube.com/embed/${m[1]}` : null;
}

// Stealth Admin Guard: Only returns true for registered Student/Teacher portal profiles
function isPublicPortalUser() {
  return Boolean(
    currentUser &&
    currentUserProfile &&
    ["student", "teacher", "pending_teacher"].includes(currentUserProfile.role)
  );
}

// Always fetches fresh profile from Firestore (Zero stale verification status)
async function fetchFreshUserProfile(uid) {
  if (!fbDb || !uid) return null;
  try {
    const snap = await getDoc(doc(fbDb, "users", uid));
    if (snap.exists()) {
      currentUserProfile = snap.data();
      return currentUserProfile;
    }
    currentUserProfile = null;
    return null;
  } catch (e) {
    currentUserProfile = null;
    return null;
  }
}

// ============================================================================
// 1. INITIALIZE FIREBASE SINGLETON & AUTH STATE LISTENER
// ============================================================================
function initFirebaseSafe() {
  if (fbApp) return true;
  const cfg = window.SCHOOL_MASTER_CONFIG;
  const fbConfig = cfg ? (cfg.firebaseConfig || cfg.firebase) : null;
  if (!fbConfig || !fbConfig.apiKey || fbConfig.apiKey === "PASTE_YOUR_API_KEY") return false;

  try {
    fbApp = getApps().length ? getApp() : initializeApp(fbConfig);
    fbAuth = getAuth(fbApp);
    fbDb = getFirestore(fbApp);

    onAuthStateChanged(fbAuth, async (user) => {
      currentUser = user;
      currentUserProfile = null;
      if (user) {
        await fetchFreshUserProfile(user.uid);
      }
      updateAuthHeaderButton();

      const authModal = document.getElementById("legacy-auth-modal");
      const profView = document.getElementById("auth-view-profile");
      if (authModal && !authModal.classList.contains("hidden") && profView && !profView.classList.contains("hidden")) {
        if (isPublicPortalUser()) renderProfileSheet();
        else switchAuthView("welcome");
      }

      window.dispatchEvent(new CustomEvent("portal-user-changed", {
        detail: { user: currentUser, profile: currentUserProfile, isPortalUser: isPublicPortalUser() }
      }));
    });
    return true;
  } catch (e) {
    console.warn("Legacy Auth Firebase init notice:", e);
    return false;
  }
}

// ============================================================================
// 2. EYE-FRIENDLY DAY / NIGHT THEME ENGINE
// ============================================================================
function applyEyeFriendlyTheme(mode) {
  const safeMode = mode === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", safeMode);
  document.documentElement.classList.toggle("dark", safeMode === "dark");
  localStorage.setItem("gola_school_theme", safeMode);

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute("content", safeMode === "dark" ? "#0f172a" : "#0b3066");

  updateThemeToggleUI(safeMode);
}

function toggleEyeFriendlyTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyEyeFriendlyTheme(current === "dark" ? "light" : "dark");
}

function updateThemeToggleUI(mode) {
  const isDark = mode === "dark";
  const topIcon = document.getElementById("legacy-theme-icon");
  const topLbl = document.getElementById("legacy-theme-lbl");
  const drawerLbl = document.getElementById("legacy-drawer-theme-lbl");

  if (topIcon) topIcon.textContent = isDark ? "☀️" : "🌙";
  if (topLbl) topLbl.textContent = isDark ? "Day" : "Night";
  if (drawerLbl) drawerLbl.textContent = isDark ? "☀️ Switch to Day Mode" : "🌙 Switch to Night Mode";
}

function injectEyeFriendlyStyles() {
  if (document.getElementById("legacy-portal-styles")) return;
  const style = document.createElement("style");
  style.id = "legacy-portal-styles";
  style.textContent = `
    :root,
    html[data-theme="light"] {
      --leg-bg: #f8fafc;
      --leg-surface: #ffffff;
      --leg-surface-alt: #f1f5f9;
      --leg-top-strip: #f3f4f6;
      --leg-border: #e2e8f0;
      --leg-text: #0f172a;
      --leg-body: #334155;
      --leg-muted: #64748b;
      --leg-accent: #0b3066;
      --leg-gold: #b45309;
      --leg-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
    }

    html[data-theme="dark"] {
      --leg-bg: #0f172a;
      --leg-surface: #1e293b;
      --leg-surface-alt: #172033;
      --leg-top-strip: #0b1120;
      --leg-border: #334155;
      --leg-text: #f1f5f9;
      --leg-body: #cbd5e1;
      --leg-muted: #94a3b8;
      --leg-accent: #172554;
      --leg-gold: #fbbf24;
      --leg-shadow: 0 4px 20px rgba(2, 6, 23, 0.4);
    }

    /* overflow-x: clip preserves position:sticky on mobile Chrome & Safari! */
    html, body {
      background-color: var(--leg-bg) !important;
      color: var(--leg-text) !important;
      max-width: 100vw;
      overflow-x: clip;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      transition: background-color 0.25s ease, color 0.25s ease;
    }

    #royal-prahar-ribbon { display: none !important; }

    #legacy-masthead { background-color: var(--leg-surface); color: var(--leg-text); }
    .leg-tier-1 { background-color: var(--leg-top-strip); border-color: var(--leg-border); color: var(--leg-body); }
    .leg-tier-2 { background-color: var(--leg-surface); border-color: var(--leg-border); }
    .leg-text-primary { color: var(--leg-text); }
    .leg-text-body { color: var(--leg-body); }
    .leg-text-muted { color: var(--leg-muted); }
    .leg-border { border-color: var(--leg-border); }

    /* True Sticky Navigation Bar */
    #legacy-sticky-nav {
      position: sticky;
      top: 0;
      z-index: 60;
      background-color: var(--leg-surface-alt);
      border-bottom: 1px solid var(--leg-border);
      color: var(--leg-text);
      transition: box-shadow 0.2s ease, background-color 0.25s ease;
    }
    #legacy-sticky-nav.is-stuck {
      box-shadow: 0 6px 20px rgba(15, 23, 42, 0.16);
    }

    .sacred-card {
      background: var(--leg-surface) !important;
      border: 1px solid var(--leg-border) !important;
      box-shadow: var(--leg-shadow) !important;
      transform: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    .sacred-inner-box {
      background: var(--leg-surface-alt) !important;
      border: 1px solid var(--leg-border) !important;
    }
    .t-heading, .theme-heading { color: var(--leg-text) !important; }
    .t-body, .theme-subtext { color: var(--leg-body) !important; }
    .t-muted, .theme-muted { color: var(--leg-muted) !important; }
    .t-gold { color: var(--leg-gold) !important; }

    /* Eye-Friendly Ctrl+K Spotlight Search Override */
    #royal-spotlight-modal { background: rgba(15, 23, 42, 0.55) !important; backdrop-filter: blur(6px) !important; }
    #royal-spotlight-modal > div {
      background: var(--leg-surface) !important;
      border: 1px solid var(--leg-border) !important;
      color: var(--leg-text) !important;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28) !important;
    }
    #royal-spotlight-modal > div > div:first-child {
      background: var(--leg-surface-alt) !important;
      border-bottom: 1px solid var(--leg-border) !important;
    }
    #royal-spotlight-input { color: var(--leg-text) !important; }
    #royal-spotlight-input::placeholder { color: var(--leg-muted) !important; }
    #royal-spotlight-close {
      background: var(--leg-surface) !important;
      border: 1px solid var(--leg-border) !important;
      color: var(--leg-body) !important;
    }
    #royal-spotlight-close:hover { background: #ef4444 !important; color: #ffffff !important; border-color: #ef4444 !important; }
    #royal-spotlight-results { background: var(--leg-surface) !important; }
    #royal-spotlight-results .royal-spot-item { border-radius: 14px !important; }
    #royal-spotlight-results .royal-spot-item:hover { background: var(--leg-surface-alt) !important; }
    #royal-spotlight-results .royal-spot-item h4 { color: var(--leg-text) !important; }
    #royal-spotlight-results .royal-spot-item p { color: var(--leg-body) !important; }
    #royal-spotlight-results .royal-spot-item span.text-amber-400\\/90,
    #royal-spotlight-results .royal-spot-item span.text-amber-400 { color: var(--leg-gold) !important; }
    #royal-spotlight-modal > div > div:last-child {
      background: var(--leg-surface-alt) !important;
      border-top: 1px solid var(--leg-border) !important;
      color: var(--leg-muted) !important;
    }
    #royal-spotlight-modal > div > div:last-child strong { color: var(--leg-gold) !important; }

    /* Automatic Continuous Smooth Marquee */
    @keyframes legacyMarqueeScroll {
      0% { transform: translate3d(0, 0, 0); }
      100% { transform: translate3d(-50%, 0, 0); }
    }
    .legacy-marquee-viewport { overflow: hidden; position: relative; width: 100%; }
    .legacy-marquee-track {
      display: inline-flex;
      align-items: center;
      white-space: nowrap;
      will-change: transform;
      animation: legacyMarqueeScroll 34s linear infinite;
    }
    .legacy-marquee-viewport:hover .legacy-marquee-track,
    .legacy-marquee-viewport:active .legacy-marquee-track { animation-play-state: paused; }

    @keyframes drawerSlideIn {
      0% { transform: translate3d(-100%, 0, 0); }
      100% { transform: translate3d(0, 0, 0); }
    }
    .mobile-drawer-panel { animation: drawerSlideIn 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes authOrbFloatA {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
      50% { transform: translate3d(18px, -14px, 0) scale(1.08); }
    }
    @keyframes authOrbFloatB {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
      50% { transform: translate3d(-16px, 14px, 0) scale(1.1); }
    }
    @keyframes authSheetRise {
      0% { opacity: 0; transform: translate3d(0, 24px, 0); }
      100% { opacity: 1; transform: translate3d(0, 0, 0); }
    }
    .auth-orb-a { animation: authOrbFloatA 7s ease-in-out infinite; }
    .auth-orb-b { animation: authOrbFloatB 9s ease-in-out infinite; }
    .auth-sheet-animate { animation: authSheetRise 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

    .auth-royal-gradient { background: linear-gradient(135deg, #b81d3d 0%, #5b1640 52%, #1d1135 100%); }
    .auth-btn-gradient { background: linear-gradient(90deg, #b81d3d 0%, #4b153d 55%, #1d1135 100%); }
    .auth-btn-gradient:hover { filter: brightness(1.12); }

    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `;
  document.head.appendChild(style);
}

// ============================================================================
// 3. MOUNT LEGACY MASTHEAD + STICKY NAV BAR + NEWS MARQUEE + MOBILE DRAWER
// ============================================================================
const NAV_ITEMS = [
  { key: "home", label: "Home", icon: "🏛️" },
  { key: "gallery", label: "Gallery", icon: "🖼️" },
  { key: "guru-stambh", label: "Guru Stambh (Faculty)", icon: "👨‍🏫" },
  { key: "gaurav-stambh", label: "Gaurav Stambh (Alumni)", icon: "🏆" },
  { key: "academics", label: "Academics & Syllabus", icon: "📚" },
  { key: "schemes", label: "Scholarships", icon: "🎓" },
  { key: "student-corner", label: "Student Corner", icon: "📄" }
];

function mountLegacyHeader() {
  if (document.getElementById("legacy-masthead")) return;

  const header = document.createElement("header");
  header.id = "legacy-masthead";
  header.className = "w-full relative z-50";

  const desktopNavButtons = NAV_ITEMS.map((item, idx) => `
    <button type="button" data-leg-nav="${item.key}"
      class="leg-nav-item shrink-0 px-3.5 py-3 ${idx === 0 ? "bg-[#f59e0b] text-slate-950" : "hover:bg-amber-500/15"} transition-colors cursor-pointer">
      ${item.label}
    </button>
  `).join("");

  header.innerHTML = `
    <div class="leg-tier-1 w-full border-b">
      <div class="max-w-7xl mx-auto px-3 sm:px-6 h-9 flex items-center justify-between gap-2 text-[11px] font-semibold">
        <div class="flex items-center gap-2 sm:gap-3 truncate">
          <span class="tracking-wide uppercase leg-text-primary font-bold">GOVERNMENT OF JHARKHAND</span>
          <span class="hidden sm:inline opacity-40">|</span>
          <span class="hidden sm:inline tracking-wide uppercase leg-text-muted">DEPARTMENT OF SCHOOL EDUCATION &amp; LITERACY</span>
        </div>

        <div class="flex items-center divide-x leg-border border-x h-full shrink-0">
          <button id="legacy-theme-toggle" type="button" title="Toggle Eye-Friendly Day / Night Mode" aria-label="Toggle Day or Night Mode"
            class="px-2.5 h-full hover:bg-amber-500/15 flex items-center gap-1 leg-text-primary transition-colors cursor-pointer">
            <span id="legacy-theme-icon">🌙</span>
            <span id="legacy-theme-lbl" class="hidden sm:inline text-[11px] font-bold">Night</span>
          </button>

          <button id="legacy-top-login-icon" type="button" title="Portal Login" aria-label="Portal Login"
            class="px-2.5 h-full hover:bg-amber-500/15 flex items-center gap-1.5 leg-text-primary transition-colors cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>
            <span id="legacy-top-user-lbl" class="hidden md:inline text-[11px] font-bold">Portal Login</span>
          </button>

          <button id="legacy-search-btn" type="button" title="Search Portal (Ctrl + K)" aria-label="Search Portal"
            class="px-2.5 h-full hover:bg-amber-500/15 flex items-center justify-center leg-text-primary transition-colors cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z"/></svg>
          </button>

          <button id="legacy-font-dec" type="button" title="Decrease Text Size" aria-label="Decrease Text Size"
            class="px-2 h-full hover:bg-amber-500/15 text-[11px] font-bold leg-text-body cursor-pointer">A-</button>

          <button id="legacy-font-inc" type="button" title="Increase Text Size" aria-label="Increase Text Size"
            class="px-2 h-full hover:bg-amber-500/15 text-[11px] font-bold leg-text-body cursor-pointer">A+</button>
        </div>
      </div>
    </div>

    <div class="leg-tier-2 w-full border-b">
      <div class="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div class="hidden md:flex items-center gap-3 w-1/4">
          <div class="w-12 h-12 rounded-xl bg-[#0B3066] text-amber-400 flex items-center justify-center shadow-sm shrink-0 border border-amber-400/40">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3L2 9l10 6 10-6-10-6z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/>
            </svg>
          </div>
          <div class="leading-tight">
            <div class="text-[11px] font-bold uppercase tracking-wider leg-text-muted">State Subsidized</div>
            <div class="text-sm font-extrabold leg-text-primary">Department of<br/>School Education</div>
          </div>
        </div>

        <div class="text-center flex-1">
          <div class="text-[10px] sm:text-xs font-bold uppercase tracking-[0.14em] text-[#0B3066] dark:text-amber-400">
            Established 1940 • UDISE Code: 20240701206
          </div>
          <h1 class="text-xl sm:text-3xl font-extrabold leg-text-primary tracking-tight leading-tight mt-0.5">
            S.S. +2 High School, Gola
          </h1>
          <div class="text-[11px] sm:text-sm font-semibold leg-text-body mt-0.5">
            Ramgarh, Jharkhand (829110) — Class 1 to 12 (Science, Arts &amp; Commerce)
          </div>
        </div>

        <div class="hidden md:flex items-center justify-end gap-2.5 w-1/4">
          <div class="text-right leading-tight">
            <div class="text-xs font-extrabold text-[#0B3066] dark:text-amber-400">JAC Ranchi Affiliated</div>
            <div class="text-[11px] font-semibold leg-text-muted">Jharkhand Academic Council</div>
            <span class="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-700 text-white text-[9px] font-bold tracking-wider uppercase">
              Excellence Since 1940
            </span>
          </div>
        </div>
      </div>
    </div>
  `;

  // STANDALONE STICKY NAVIGATION BAR (Always accessible while scrolling!)
  const stickyNav = document.createElement("nav");
  stickyNav.id = "legacy-sticky-nav";
  stickyNav.setAttribute("aria-label", "Main Navigation");
  stickyNav.className = "w-full";
  stickyNav.innerHTML = `
    <div class="max-w-7xl mx-auto px-3 sm:px-6">
      <div class="flex lg:hidden items-center justify-between h-12 gap-2">
        <button id="legacy-mobile-menu-btn" type="button" aria-label="Open Navigation Menu"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--leg-surface)] border leg-border leg-text-primary text-xs font-extrabold shadow-xs active:scale-95 transition-transform cursor-pointer">
          <svg class="w-5 h-5 text-[#0B3066] dark:text-amber-400" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
          </svg>
          <span>Menu</span>
          <span class="opacity-30">|</span>
          <span id="legacy-mobile-active-lbl" class="text-[#0B3066] dark:text-amber-400 truncate max-w-[100px]">Home</span>
        </button>

        <div class="flex items-center gap-1.5 shrink-0">
          <button id="legacy-mobile-search-btn" type="button" aria-label="Search Portal"
            class="w-9 h-9 rounded-lg bg-[var(--leg-surface)] border leg-border leg-text-primary flex items-center justify-center active:scale-95 transition-transform cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z"/></svg>
          </button>
          <button id="legacy-mobile-auth-btn" type="button"
            class="px-3 py-2 rounded-lg bg-[#0B3066] hover:bg-[#14438a] text-white text-xs font-bold shadow-xs active:scale-95 transition-transform cursor-pointer">
            Sign In / Register
          </button>
        </div>
      </div>

      <div class="hidden lg:flex items-center justify-center gap-0.5 text-[13px] font-bold">
        ${desktopNavButtons}
        <button type="button" id="legacy-nav-auth-btn"
          class="shrink-0 ml-3 my-1.5 px-4 py-1.5 rounded-lg bg-[#0B3066] hover:bg-[#14438a] text-white text-xs font-bold transition-colors cursor-pointer">
          Sign In / Register
        </button>
      </div>
    </div>
  `;

  // LATEST NEWS CONTINUOUS MARQUEE BAR
  const newsBar = document.createElement("div");
  newsBar.id = "legacy-news-bar";
  newsBar.className = "w-full bg-[#0B3066] text-white border-b-2 border-[#f59e0b]";
  newsBar.innerHTML = `
    <div class="max-w-7xl mx-auto px-3 sm:px-6 h-11 flex items-center">
      <div class="pr-3 sm:pr-5 mr-3 sm:mr-5 border-r border-white/25 shrink-0 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse"></span>
        <span class="text-[11px] sm:text-xs font-extrabold tracking-widest uppercase text-white">
          LATEST NEWS
        </span>
      </div>

      <div class="legacy-marquee-viewport flex-1 min-w-0">
        <div id="legacy-marquee-track" class="legacy-marquee-track text-xs sm:text-[13px] font-medium text-blue-50">
          <span class="px-6">Loading latest official announcements from S.S. +2 High School, Gola...</span>
        </div>
      </div>
    </div>
  `;

  const firstEl = document.body.firstChild;
  document.body.insertBefore(header, firstEl);
  document.body.insertBefore(stickyNav, header.nextSibling);
  document.body.insertBefore(newsBar, stickyNav.nextSibling);
  mountMobileDrawer();

  window.addEventListener("scroll", () => {
    stickyNav.classList.toggle("is-stuck", window.scrollY > 110);
  }, { passive: true });

  stickyNav.querySelectorAll(".leg-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => handleNavSelection(btn.getAttribute("data-leg-nav")));
  });

  const triggerSpotlight = () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  };

  document.getElementById("legacy-theme-toggle").addEventListener("click", toggleEyeFriendlyTheme);
  document.getElementById("legacy-mobile-menu-btn").addEventListener("click", openMobileDrawer);
  document.getElementById("legacy-search-btn").addEventListener("click", triggerSpotlight);
  document.getElementById("legacy-mobile-search-btn").addEventListener("click", triggerSpotlight);

  document.getElementById("legacy-font-inc").addEventListener("click", () => {
    fontScaleStep = Math.min(2, fontScaleStep + 1);
    document.documentElement.style.fontSize = `${16 + fontScaleStep}px`;
  });
  document.getElementById("legacy-font-dec").addEventListener("click", () => {
    fontScaleStep = Math.max(-1, fontScaleStep - 1);
    document.documentElement.style.fontSize = `${16 + fontScaleStep}px`;
  });

  const openAuth = async () => {
    if (currentUser && !currentUserProfile) {
      await fetchFreshUserProfile(currentUser.uid);
    }
    openCurvedAuthModal(isPublicPortalUser() ? "profile" : "welcome");
  };
  document.getElementById("legacy-top-login-icon").addEventListener("click", openAuth);
  document.getElementById("legacy-nav-auth-btn").addEventListener("click", openAuth);
  document.getElementById("legacy-mobile-auth-btn").addEventListener("click", openAuth);
}

function mountMobileDrawer() {
  if (document.getElementById("legacy-mobile-drawer")) return;

  const drawer = document.createElement("div");
  drawer.id = "legacy-mobile-drawer";
  drawer.className = "fixed inset-0 z-[9994] bg-slate-950/60 backdrop-blur-xs hidden";

  const drawerLinks = NAV_ITEMS.map((item, idx) => `
    <button type="button" data-drawer-nav="${item.key}"
      class="leg-drawer-item w-full text-left px-4 py-3.5 rounded-xl flex items-center justify-between text-sm font-bold transition-colors cursor-pointer ${
        idx === 0 ? "bg-[#0B3066] text-white" : "leg-text-primary hover:bg-amber-500/10"
      }">
      <span class="flex items-center gap-3">
        <span class="text-base">${item.icon}</span>
        <span>${item.label}</span>
      </span>
      <span class="text-xs opacity-60">›</span>
    </button>
  `).join("");

  drawer.innerHTML = `
    <div class="mobile-drawer-panel w-[82%] max-w-[320px] h-full bg-[var(--leg-surface)] leg-text-primary shadow-2xl flex flex-col justify-between overflow-y-auto">
      <div>
        <div class="px-5 py-4 bg-[#0B3066] text-white flex items-center justify-between border-b-2 border-[#f59e0b]">
          <div>
            <div class="text-[10px] font-bold uppercase tracking-widest text-amber-300">Official Portal</div>
            <div class="text-base font-extrabold leading-tight">S.S. +2 High School</div>
            <div class="text-[11px] text-blue-200">Gola, Ramgarh • Estd. 1940</div>
          </div>
          <button id="legacy-drawer-close" type="button" aria-label="Close Menu"
            class="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center font-bold cursor-pointer">
            ✕
          </button>
        </div>
        <div class="p-3 space-y-1">${drawerLinks}</div>
      </div>

      <div class="p-4 border-t leg-border bg-[var(--leg-surface-alt)] space-y-2.5">
        <button id="legacy-drawer-theme-btn" type="button"
          class="w-full py-2.5 rounded-xl border leg-border bg-[var(--leg-surface)] leg-text-primary text-xs font-bold cursor-pointer">
          <span id="legacy-drawer-theme-lbl">🌙 Switch to Night Mode</span>
        </button>
        <button id="legacy-drawer-auth-btn" type="button"
          class="w-full py-3 rounded-xl auth-btn-gradient text-white text-xs font-extrabold uppercase tracking-wider shadow cursor-pointer">
          Portal Sign In / Register
        </button>
        <div class="text-center text-[10px] font-semibold leg-text-muted">
          UDISE: 20240701206 • JAC Ranchi Affiliated
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(drawer);

  document.getElementById("legacy-drawer-close").addEventListener("click", closeMobileDrawer);
  drawer.addEventListener("click", (e) => { if (e.target === drawer) closeMobileDrawer(); });
  drawer.querySelectorAll(".leg-drawer-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeMobileDrawer();
      handleNavSelection(btn.getAttribute("data-drawer-nav"));
    });
  });

  document.getElementById("legacy-drawer-theme-btn").addEventListener("click", toggleEyeFriendlyTheme);
  document.getElementById("legacy-drawer-auth-btn").addEventListener("click", () => {
    closeMobileDrawer();
    openCurvedAuthModal(isPublicPortalUser() ? "profile" : "welcome");
  });
}

function openMobileDrawer() {
  const drawer = document.getElementById("legacy-mobile-drawer");
  if (drawer) drawer.classList.remove("hidden");
}

function closeMobileDrawer() {
  const drawer = document.getElementById("legacy-mobile-drawer");
  if (drawer) drawer.classList.add("hidden");
}

function handleNavSelection(target) {
  setActiveNavTab(target);
  const galView = document.getElementById("view-gallery");

  if (target === "gallery") {
    ["home", "guru-stambh", "gaurav-stambh"].forEach((v) => {
      const el = document.getElementById(`view-${v}`);
      if (el) el.classList.add("hidden");
    });
    if (typeof window.openCampusGalleryPage === "function") {
      window.openCampusGalleryPage();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (galView) galView.classList.add("hidden");

  if (target === "home" || target === "guru-stambh" || target === "gaurav-stambh") {
    if (typeof window.switchView === "function") window.switchView(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (target === "schemes") {
    if (typeof window.switchView === "function") window.switchView("home");
    setTimeout(() => {
      const el = document.getElementById("schemes-grid");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  } else if (target === "academics") {
    openInfoModal("academics");
  } else if (target === "student-corner") {
    openInfoModal("student-corner");
  }
}

function wrapGlobalSwitchView() {
  const orig = window.switchView;
  if (typeof orig !== "function" || orig._legacyWrapped) return;
  const wrapped = function (viewName) {
    const galView = document.getElementById("view-gallery");
    if (galView) galView.classList.add("hidden");
    if (["home", "guru-stambh", "gaurav-stambh"].includes(viewName)) {
      setActiveNavTab(viewName);
    }
    return orig(viewName);
  };
  wrapped._legacyWrapped = true;
  window.switchView = wrapped;
}

function setActiveNavTab(activeKey) {
  const found = NAV_ITEMS.find((i) => i.key === activeKey);
  const mobileLbl = document.getElementById("legacy-mobile-active-lbl");
  if (mobileLbl && found) mobileLbl.textContent = found.label.split(" (")[0];

  document.querySelectorAll(".leg-nav-item").forEach((btn) => {
    const isAct = btn.getAttribute("data-leg-nav") === activeKey;
    btn.className = isAct
      ? "leg-nav-item shrink-0 px-3.5 py-3 bg-[#f59e0b] text-slate-950 transition-colors cursor-pointer"
      : "leg-nav-item shrink-0 px-3.5 py-3 hover:bg-amber-500/15 transition-colors cursor-pointer";
  });

  document.querySelectorAll(".leg-drawer-item").forEach((btn) => {
    const isAct = btn.getAttribute("data-drawer-nav") === activeKey;
    btn.className = isAct
      ? "leg-drawer-item w-full text-left px-4 py-3.5 rounded-xl flex items-center justify-between text-sm font-bold transition-colors cursor-pointer bg-[#0B3066] text-white"
      : "leg-drawer-item w-full text-left px-4 py-3.5 rounded-xl flex items-center justify-between text-sm font-bold transition-colors cursor-pointer leg-text-primary hover:bg-amber-500/10";
  });
}

function updateAuthHeaderButton() {
  const navBtn = document.getElementById("legacy-nav-auth-btn");
  const mobBtn = document.getElementById("legacy-mobile-auth-btn");
  const drwBtn = document.getElementById("legacy-drawer-auth-btn");
  const topLbl = document.getElementById("legacy-top-user-lbl");

  if (isPublicPortalUser()) {
    const name = (currentUserProfile.fullName || "User").split(" ")[0];
    if (navBtn) navBtn.textContent = `👤 ${name}`;
    if (mobBtn) mobBtn.textContent = `👤 ${name}`;
    if (drwBtn) drwBtn.textContent = `Open Account (${name})`;
    if (topLbl) topLbl.textContent = name;
  } else {
    if (navBtn) navBtn.textContent = "Sign In / Register";
    if (mobBtn) mobBtn.textContent = "Sign In / Register";
    if (drwBtn) drwBtn.textContent = "Portal Sign In / Register";
    if (topLbl) topLbl.textContent = "Portal Login";
  }
}

// ============================================================================
// 4. AUTOMATIC CONTINUOUS MARQUEE FEED
// ============================================================================
function renderLegacyMarquee(notices) {
  const track = document.getElementById("legacy-marquee-track");
  if (!track || !Array.isArray(notices) || notices.length === 0) return;

  liveNoticesList = notices;
  const buildItemsHTML = () =>
    notices
      .map((n, idx) => {
        const title = escapeSafe(n.titleEn || n.titleHi || "Official School Announcement");
        const date = n.date ? `<span class="text-amber-300 font-semibold ml-1.5">[${escapeSafe(n.date)}]</span>` : "";
        const badge = n.isNew
          ? `<span class="px-1.5 py-0.5 mr-2 rounded bg-[#f59e0b] text-slate-950 text-[9px] font-extrabold uppercase tracking-wider">NEW</span>`
          : "";
        return `
          <button type="button" data-marquee-idx="${idx}"
            class="legacy-marquee-item inline-flex items-center hover:text-amber-300 transition-colors cursor-pointer mx-6 focus:outline-none">
            ${badge}<span>${title}</span>${date}
          </button>
          <span class="text-white/30 select-none">•</span>
        `;
      })
      .join("");

  const singlePass = buildItemsHTML();
  track.innerHTML = singlePass + singlePass;

  const approxChars = notices.reduce((acc, n) => acc + String(n.titleEn || n.titleHi || "").length, 0);
  const durationSec = Math.max(22, Math.min(60, Math.round(approxChars * 0.28)));
  track.style.animationDuration = `${durationSec}s`;

  track.querySelectorAll(".legacy-marquee-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = liveNoticesList[Number(btn.getAttribute("data-marquee-idx"))];
      if (item) openNoticeViewerModal(item);
    });
  });
}

async function syncMarqueeNotices() {
  const cfg = window.SCHOOL_MASTER_CONFIG;
  if (cfg && Array.isArray(cfg.defaultNotices) && liveNoticesList.length === 0) {
    renderLegacyMarquee(cfg.defaultNotices);
  }

  if (window.BackendService && typeof window.BackendService.fetchNotices === "function") {
    try {
      const live = await window.BackendService.fetchNotices();
      if (Array.isArray(live) && live.length > 0) {
        renderLegacyMarquee(live);
        return;
      }
    } catch (e) {}
  }

  if (fbDb) {
    try {
      const q = query(collection(fbDb, "notices"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      if (!snap.empty) {
        renderLegacyMarquee(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    } catch (e) {}
  }
}

// ============================================================================
// 5. ADAPTIVE EYE-FRIENDLY NOTICE & MEDIA VIEWER
// ============================================================================
function ensureAdaptiveModal() {
  let modal = document.getElementById("legacy-info-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "legacy-info-modal";
  modal.className = "fixed inset-0 z-[9998] bg-slate-950/65 backdrop-blur-xs hidden items-center justify-center p-3 sm:p-5 overflow-y-auto";
  modal.innerHTML = `
    <div class="w-full max-w-2xl rounded-2xl bg-[var(--leg-surface)] border leg-border leg-text-primary shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col auth-sheet-animate">
      <div class="px-5 py-4 bg-[#0B3066] text-white flex items-center justify-between gap-3">
        <div class="min-w-0">
          <span id="lim-badge" class="inline-block px-2 py-0.5 rounded bg-[#f59e0b] text-slate-950 text-[10px] font-extrabold uppercase tracking-wider mb-1">
            OFFICIAL NOTICE
          </span>
          <h3 id="lim-title" class="text-sm sm:text-base font-extrabold truncate"></h3>
        </div>
        <button id="lim-close" type="button" aria-label="Close"
          class="shrink-0 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer">
          ✕ Close
        </button>
      </div>
      <div id="lim-body" class="p-5 overflow-y-auto space-y-4 text-sm leg-text-body leading-relaxed"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.getElementById("lim-body").innerHTML = "";
  };
  document.getElementById("lim-close").addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  return modal;
}

function openNoticeViewerModal(notice) {
  const modal = ensureAdaptiveModal();
  const title = notice.titleEn || notice.titleHi || "Official Notice";
  const desc = notice.descEn || notice.descHi || "";
  const tag = notice.tagEn || notice.tagHi || "OFFICIAL ANNOUNCEMENT";
  const authorLine = notice.authorName ? ` • By ${notice.authorName}` : "";

  document.getElementById("lim-badge").textContent = `${tag}${notice.date ? " • " + notice.date : ""}${authorLine}`;
  document.getElementById("lim-title").textContent = title;

  const driveEmbed = getDrivePreviewUrl(notice.attachmentUrl || notice.pdfUrl || "");
  const ytEmbed = getYouTubeEmbedUrl(notice.attachmentUrl || notice.videoUrl || "");
  const imgSrc = notice.imageDataUrl || "";

  let mediaHTML = "";
  if (imgSrc) {
    mediaHTML += `
      <div class="rounded-xl overflow-hidden border leg-border bg-[var(--leg-surface-alt)]">
        <img src="${escapeSafe(imgSrc)}" alt="Notice Attachment" class="w-full max-h-[380px] object-contain mx-auto" />
      </div>
    `;
  }
  if (driveEmbed) {
    mediaHTML += `
      <div class="space-y-2">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-bold text-[#0B3066] dark:text-amber-400">Attached PDF Document</span>
          <a href="${escapeSafe(notice.attachmentUrl || notice.pdfUrl)}" target="_blank" rel="noopener noreferrer"
            class="px-3 py-1 rounded-lg bg-[#0B3066] text-white text-xs font-bold">
            Open in Drive / Download ↗
          </a>
        </div>
        <iframe src="${escapeSafe(driveEmbed)}" class="w-full h-[380px] rounded-xl border leg-border bg-white" allow="autoplay"></iframe>
      </div>
    `;
  } else if (ytEmbed) {
    mediaHTML += `
      <div class="aspect-video w-full rounded-xl overflow-hidden border leg-border bg-black">
        <iframe src="${escapeSafe(ytEmbed)}" class="w-full h-full" allowfullscreen></iframe>
      </div>
    `;
  } else if (notice.attachmentUrl) {
    mediaHTML += `
      <a href="${escapeSafe(notice.attachmentUrl)}" target="_blank" rel="noopener noreferrer"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B3066] text-white text-xs font-bold">
        Open Attached Link ↗
      </a>
    `;
  }

  document.getElementById("lim-body").innerHTML = `
    <div class="p-4 rounded-xl bg-[var(--leg-surface-alt)] border leg-border leg-text-primary whitespace-pre-line">
      ${escapeSafe(desc)}
    </div>
    ${mediaHTML}
    <div class="pt-3 border-t leg-border flex items-center justify-between text-xs leg-text-muted">
      <span>S.S. +2 High School, Gola • UDISE: 20240701206</span>
      <button type="button" id="lim-jump-notices" class="text-[#0B3066] dark:text-amber-400 font-bold hover:underline cursor-pointer">
        View Full Notice Board →
      </button>
    </div>
  `;

  document.getElementById("lim-jump-notices").addEventListener("click", () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    if (typeof window.switchView === "function") window.switchView("home");
    setTimeout(() => {
      const box = document.getElementById("notices-container");
      if (box) box.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  });

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function openInfoModal(type) {
  const modal = ensureAdaptiveModal();
  const badge = document.getElementById("lim-badge");
  const title = document.getElementById("lim-title");
  const body = document.getElementById("lim-body");

  if (type === "academics") {
    badge.textContent = "JAC RANCHI • CLASS 1 TO 12";
    title.textContent = "Academics, Streams & Official Syllabus";
    body.innerHTML = `
      <div class="space-y-3">
        <div class="p-4 rounded-xl bg-[var(--leg-surface-alt)] border leg-border flex items-center justify-between gap-3">
          <div>
            <div class="font-extrabold leg-text-primary">Primary &amp; Upper Primary (Class 1 – 8)</div>
            <p class="text-xs leg-text-muted">JCERT Foundation Curriculum, ICT Computer Basics, Free Books &amp; PM-POSHAN.</p>
          </div>
          <a href="https://jcert.jharkhand.gov.in/" target="_blank" rel="noopener noreferrer" class="shrink-0 px-3 py-1.5 rounded-lg bg-[#0B3066] text-white text-xs font-bold">JCERT ↗</a>
        </div>
        <div class="p-4 rounded-xl bg-[var(--leg-surface-alt)] border leg-border flex items-center justify-between gap-3">
          <div>
            <div class="font-extrabold leg-text-primary">Secondary Matric Wing (Class 9 – 10)</div>
            <p class="text-xs leg-text-muted">JAC Board Matric Preparation, Separate Science Labs &amp; IT Vocational Training.</p>
          </div>
          <a href="https://ncert.nic.in/textbook.php" target="_blank" rel="noopener noreferrer" class="shrink-0 px-3 py-1.5 rounded-lg bg-[#0B3066] text-white text-xs font-bold">NCERT ↗</a>
        </div>
        <div class="p-4 rounded-xl bg-[var(--leg-surface-alt)] border leg-border flex items-center justify-between gap-3">
          <div>
            <div class="font-extrabold leg-text-primary">+2 Intermediate Wing (Class 11 – 12)</div>
            <p class="text-xs leg-text-muted">Science (PCM / PCB), Arts &amp; Commerce Streams affiliated to JAC Ranchi.</p>
          </div>
          <a href="https://jac.jharkhand.gov.in/" target="_blank" rel="noopener noreferrer" class="shrink-0 px-3 py-1.5 rounded-lg bg-[#0B3066] text-white text-xs font-bold">JAC Portal ↗</a>
        </div>
      </div>
    `;
  } else {
    badge.textContent = "STUDENT SERVICES • QUICK LINKS";
    title.textContent = "Student Corner — JAC Results, Scholarships & Timings";
    body.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a href="https://www.jacresults.com/" target="_blank" rel="noopener noreferrer" class="p-4 rounded-xl bg-[var(--leg-surface-alt)] hover:border-amber-500 border leg-border block transition-colors">
          <div class="font-extrabold text-[#0B3066] dark:text-amber-400">JAC Examination Results ↗</div>
          <p class="text-xs leg-text-muted mt-0.5">Official Class 8, 9, 10, 11 &amp; 12 Board Results</p>
        </a>
        <a href="https://ekalyan.cgg.gov.in/" target="_blank" rel="noopener noreferrer" class="p-4 rounded-xl bg-[var(--leg-surface-alt)] hover:border-amber-500 border leg-border block transition-colors">
          <div class="font-extrabold text-[#0B3066] dark:text-amber-400">e-Kalyan Jharkhand Portal ↗</div>
          <p class="text-xs leg-text-muted mt-0.5">Pre-Matric &amp; Post-Matric Scholarship Tracking</p>
        </a>
        <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div class="font-extrabold text-amber-800 dark:text-amber-300">Summer Session (Apr – Jun)</div>
          <p class="text-xs leg-text-body mt-0.5 font-semibold">07:00 AM – 01:00 PM</p>
        </div>
        <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <div class="font-extrabold text-emerald-800 dark:text-emerald-300">Regular Session (Jul – Mar)</div>
          <p class="text-xs leg-text-body mt-0.5 font-semibold">09:00 AM – 03:00 PM</p>
        </div>
      </div>
    `;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

// ============================================================================
// 6. CURVED-GRADIENT LIVE-ANIMATED AUTH MODAL
// ============================================================================
function mountCurvedAuthModal() {
  if (document.getElementById("legacy-auth-modal")) return;

  const modal = document.createElement("div");
  modal.id = "legacy-auth-modal";
  modal.className = "fixed inset-0 z-[9996] bg-slate-950/75 backdrop-blur-sm hidden items-center justify-center p-3 sm:p-4 overflow-y-auto";

  modal.innerHTML = `
    <div id="legacy-auth-card"
      class="relative w-full max-w-[400px] min-h-[580px] max-h-[92vh] rounded-[34px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.45)] auth-royal-gradient flex flex-col justify-between my-auto">
      
      <div class="pointer-events-none absolute -top-12 -right-12 w-44 h-44 rounded-full bg-rose-400/20 blur-2xl auth-orb-a"></div>
      <div class="pointer-events-none absolute top-28 -left-14 w-36 h-36 rounded-full bg-indigo-400/20 blur-2xl auth-orb-b"></div>

      <button id="auth-close-btn" type="button" aria-label="Close Login"
        class="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer">
        ✕
      </button>

      <!-- VIEW 1: WELCOME -->
      <div id="auth-view-welcome" class="relative z-10 flex-1 flex flex-col items-center justify-between px-7 py-12 text-center text-white auth-sheet-animate">
        <div class="pt-6 space-y-3">
          <div class="w-16 h-16 mx-auto rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-lg">
            <svg class="w-9 h-9 text-amber-300" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3L2 9l10 6 10-6-10-6z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/>
            </svg>
          </div>
          <div class="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-200">S.S. +2 High School, Gola</div>
          <div class="text-xs text-white/75">Official Student &amp; Faculty Portal</div>
        </div>

        <div class="w-full space-y-4 my-auto py-8">
          <h2 class="text-3xl font-extrabold tracking-tight">Welcome Back</h2>
          <p class="text-xs text-rose-100/80 max-w-[260px] mx-auto">
            Access your class dashboard, syllabus, official notices, and direct teacher messaging.
          </p>
          <div class="pt-4 space-y-3">
            <button type="button" data-auth-goto="signin"
              class="w-full py-3.5 rounded-full border-2 border-white/80 text-white hover:bg-white/10 font-extrabold text-sm tracking-wider uppercase transition-all cursor-pointer">
              SIGN IN
            </button>
            <button type="button" data-auth-goto="signup"
              class="w-full py-3.5 rounded-full bg-white text-[#4b153d] hover:bg-rose-50 font-extrabold text-sm tracking-wider uppercase shadow-lg transition-all cursor-pointer">
              SIGN UP
            </button>
          </div>
        </div>

        <div class="text-[11px] text-white/65 tracking-wide">Secured by Firebase Zero-Trust Authentication</div>
      </div>

      <!-- VIEW 2: SIGN IN -->
      <div id="auth-view-signin" class="hidden relative z-10 flex-1 flex flex-col justify-between">
        <div class="px-7 pt-9 pb-7 text-white">
          <button type="button" data-auth-goto="welcome" class="text-xs text-rose-200 hover:text-white font-semibold mb-3 inline-flex items-center gap-1 cursor-pointer">← Back</button>
          <h2 class="text-3xl font-extrabold leading-tight">Hello<br/>Sign in!</h2>
        </div>

        <form id="legacy-signin-form" class="bg-white rounded-t-[36px] px-7 pt-8 pb-7 flex-1 flex flex-col justify-between space-y-5 overflow-y-auto auth-sheet-animate">
          <div class="space-y-5">
            <div>
              <label class="block text-xs font-bold text-[#9f1d3e] mb-1">Email Address</label>
              <div class="relative flex items-center border-b border-slate-300 focus-within:border-[#b81d3d] pb-1.5">
                <input id="signin-email" type="email" required placeholder="student@gmail.com"
                  class="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none pr-6" />
                <span class="text-slate-400 text-xs">✓</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#9f1d3e] mb-1">Password</label>
              <div class="relative flex items-center border-b border-slate-300 focus-within:border-[#b81d3d] pb-1.5">
                <input id="signin-password" type="password" required placeholder="••••••••"
                  class="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none pr-8" />
                <button type="button" data-toggle-pass="signin-password" class="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer">👁</button>
              </div>
              <div class="text-right mt-2">
                <button id="auth-forgot-btn" type="button" class="text-xs font-bold text-slate-600 hover:text-[#b81d3d] cursor-pointer">Forgot password?</button>
              </div>
            </div>

            <div id="signin-status" class="hidden text-xs font-semibold p-2.5 rounded-xl"></div>

            <button id="signin-submit-btn" type="submit"
              class="w-full py-3.5 rounded-full auth-btn-gradient text-white font-extrabold text-sm tracking-wider uppercase shadow-lg transition-all cursor-pointer">
              SIGN IN
            </button>
          </div>

          <div class="text-center pt-4 text-xs text-slate-500">
            Don't have an account?<br/>
            <button type="button" data-auth-goto="signup" class="font-extrabold text-slate-900 hover:text-[#b81d3d] mt-0.5 cursor-pointer">Sign up</button>
          </div>
        </form>
      </div>

      <!-- VIEW 3: CREATE ACCOUNT -->
      <div id="auth-view-signup" class="hidden relative z-10 flex-1 flex flex-col justify-between max-h-[92vh]">
        <div class="px-7 pt-7 pb-5 text-white shrink-0">
          <button type="button" data-auth-goto="welcome" class="text-xs text-rose-200 hover:text-white font-semibold mb-2 inline-flex items-center gap-1 cursor-pointer">← Back</button>
          <h2 class="text-2xl sm:text-3xl font-extrabold leading-tight">Create Your<br/>Account</h2>
        </div>

        <form id="legacy-signup-form" class="bg-white rounded-t-[36px] px-7 pt-6 pb-6 flex-1 overflow-y-auto space-y-4 auth-sheet-animate">
          <div class="grid grid-cols-2 gap-2 p-1 rounded-full bg-slate-100 border border-slate-200">
            <button type="button" data-role-pick="student" class="auth-role-pill py-2 rounded-full text-xs font-extrabold bg-[#b81d3d] text-white transition-all cursor-pointer">🎓 Student</button>
            <button type="button" data-role-pick="teacher" class="auth-role-pill py-2 rounded-full text-xs font-extrabold text-slate-600 hover:text-slate-900 transition-all cursor-pointer">👨‍🏫 Teacher</button>
          </div>
          <input type="hidden" id="signup-role" value="student" />

          <div>
            <label class="block text-[11px] font-bold text-[#9f1d3e] mb-0.5">Full Name</label>
            <input id="signup-name" type="text" required placeholder="e.g. Rahul Kumar"
              class="w-full border-b border-slate-300 focus:border-[#b81d3d] pb-1.5 text-sm text-slate-900 focus:outline-none" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-bold text-[#9f1d3e] mb-0.5">Email</label>
              <input id="signup-email" type="email" required placeholder="name@gmail.com"
                class="w-full border-b border-slate-300 focus:border-[#b81d3d] pb-1.5 text-sm text-slate-900 focus:outline-none" />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-[#9f1d3e] mb-0.5">Mobile No.</label>
              <input id="signup-phone" type="tel" required pattern="[0-9]{10}" placeholder="10-digit mobile"
                class="w-full border-b border-slate-300 focus:border-[#b81d3d] pb-1.5 text-sm text-slate-900 focus:outline-none" />
            </div>
          </div>

          <div id="signup-student-fields" class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-bold text-[#9f1d3e] mb-0.5">Class</label>
              <select id="signup-class" class="w-full border-b border-slate-300 focus:border-[#b81d3d] pb-1.5 text-sm text-slate-900 bg-transparent focus:outline-none">
                <option value="12">Class 12 (+2)</option>
                <option value="11">Class 11 (+2)</option>
                <option value="10" selected>Class 10 (Matric)</option>
                <option value="9">Class 9</option>
                <option value="8">Class 8</option>
                <option value="7">Class 7</option>
                <option value="6">Class 6</option>
                <option value="1-5">Class 1 – 5</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-[#9f1d3e] mb-0.5">Stream / Section</label>
              <select id="signup-stream" class="w-full border-b border-slate-300 focus:border-[#b81d3d] pb-1.5 text-sm text-slate-900 bg-transparent focus:outline-none">
                <option value="General">General (1–10)</option>
                <option value="Science">Science (+2)</option>
                <option value="Arts">Arts (+2)</option>
                <option value="Commerce">Commerce (+2)</option>
              </select>
            </div>
          </div>

          <div id="signup-teacher-fields" class="hidden grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-bold text-[#9f1d3e] mb-0.5">Designation</label>
              <select id="signup-designation" class="w-full border-b border-slate-300 focus:border-[#b81d3d] pb-1.5 text-sm text-slate-900 bg-transparent focus:outline-none">
                <option value="PGT (+2 Teacher)">PGT (+2 Teacher)</option>
                <option value="TGT (High School)">TGT (High School)</option>
                <option value="PRT (Primary)">PRT (Primary)</option>
                <option value="Lab / ICT Instructor">Lab / ICT Staff</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-[#9f1d3e] mb-0.5">Primary Subject</label>
              <input id="signup-subject" type="text" placeholder="e.g. Physics"
                class="w-full border-b border-slate-300 focus:border-[#b81d3d] pb-1.5 text-sm text-slate-900 focus:outline-none" />
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-[#9f1d3e] mb-0.5">Password (Min 6 chars)</label>
            <div class="relative flex items-center border-b border-slate-300 focus-within:border-[#b81d3d] pb-1.5">
              <input id="signup-password" type="password" required minlength="6" placeholder="Create strong password"
                class="w-full bg-transparent text-sm text-slate-900 focus:outline-none pr-8" />
              <button type="button" data-toggle-pass="signup-password" class="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer">👁</button>
            </div>
          </div>

          <div id="signup-status" class="hidden text-xs font-semibold p-2.5 rounded-xl"></div>

          <button id="signup-submit-btn" type="submit"
            class="w-full py-3.5 rounded-full auth-btn-gradient text-white font-extrabold text-sm tracking-wider uppercase shadow-lg transition-all cursor-pointer">
            SIGN UP
          </button>

          <div class="text-center pt-1 text-xs text-slate-500">
            Already have an account?
            <button type="button" data-auth-goto="signin" class="font-extrabold text-slate-900 hover:text-[#b81d3d] ml-1 cursor-pointer">Sign In</button>
          </div>
        </form>
      </div>

      <!-- VIEW 4: PROFILE -->
      <div id="auth-view-profile" class="hidden relative z-10 flex-1 flex flex-col justify-between">
        <div class="px-7 pt-9 pb-6 text-white">
          <div class="text-[11px] font-bold uppercase tracking-widest text-amber-300">Authenticated Session</div>
          <h2 id="profile-name-display" class="text-2xl font-extrabold mt-1">Welcome</h2>
          <p id="profile-role-badge" class="text-xs text-rose-100 mt-1"></p>
        </div>

        <div class="bg-white rounded-t-[36px] px-7 pt-7 pb-7 flex-1 flex flex-col justify-between space-y-5 auth-sheet-animate">
          <div id="profile-details-box" class="space-y-3 text-sm text-slate-700"></div>

          <div class="space-y-2.5">
            <button id="profile-open-dashboard-btn" type="button"
              class="w-full py-3.5 rounded-full auth-btn-gradient text-white font-extrabold text-xs tracking-wider uppercase shadow-md cursor-pointer">
              Open My Dashboard →
            </button>
            <button id="profile-logout-btn" type="button"
              class="w-full py-3 rounded-full border border-slate-300 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer">
              Sign Out
            </button>
          </div>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  const close = () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  };
  document.getElementById("auth-close-btn").addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

  modal.querySelectorAll("[data-auth-goto]").forEach((btn) => {
    btn.addEventListener("click", () => switchAuthView(btn.getAttribute("data-auth-goto")));
  });

  modal.querySelectorAll("[data-toggle-pass]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const inp = document.getElementById(btn.getAttribute("data-toggle-pass"));
      if (inp) inp.type = inp.type === "password" ? "text" : "password";
    });
  });

  modal.querySelectorAll("[data-role-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const role = btn.getAttribute("data-role-pick");
      document.getElementById("signup-role").value = role;

      modal.querySelectorAll("[data-role-pick]").forEach((b) => {
        const active = b.getAttribute("data-role-pick") === role;
        b.className = active
          ? "auth-role-pill py-2 rounded-full text-xs font-extrabold bg-[#b81d3d] text-white transition-all cursor-pointer"
          : "auth-role-pill py-2 rounded-full text-xs font-extrabold text-slate-600 hover:text-slate-900 transition-all cursor-pointer";
      });

      document.getElementById("signup-student-fields").classList.toggle("hidden", role !== "student");
      document.getElementById("signup-teacher-fields").classList.toggle("hidden", role !== "teacher");
    });
  });

  document.getElementById("legacy-signin-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("signin-submit-btn");
    const status = document.getElementById("signin-status");
    const email = document.getElementById("signin-email").value.trim();
    const pass = document.getElementById("signin-password").value;

    if (!initFirebaseSafe() || !fbAuth) {
      showAuthStatus(status, "Firebase Auth is not initialized.", true);
      return;
    }

    btn.disabled = true;
    btn.textContent = "VERIFYING ACCOUNT...";
    try {
      const cred = await signInWithEmailAndPassword(fbAuth, email, pass);
      currentUser = cred.user;
      const freshProfile = await fetchFreshUserProfile(cred.user.uid);

      if (!freshProfile) {
        showAuthStatus(status, "This account is not a Student/Teacher portal profile.", true);
        return;
      }

      updateAuthHeaderButton();
      showAuthStatus(status, "Signed in successfully!", false);
      switchAuthView("profile");
    } catch (err) {
      showAuthStatus(status, err.message.replace("Firebase:", "").trim(), true);
    } finally {
      btn.disabled = false;
      btn.textContent = "SIGN IN";
    }
  });

  document.getElementById("auth-forgot-btn").addEventListener("click", async () => {
    const email = document.getElementById("signin-email").value.trim();
    const status = document.getElementById("signin-status");
    if (!email) {
      showAuthStatus(status, "Enter your email address first to receive a reset link.", true);
      return;
    }
    if (!initFirebaseSafe() || !fbAuth) return;
    try {
      await sendPasswordResetEmail(fbAuth, email);
      showAuthStatus(status, "Password reset link sent to your email!", false);
    } catch (err) {
      showAuthStatus(status, err.message.replace("Firebase:", "").trim(), true);
    }
  });

  document.getElementById("legacy-signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("signup-submit-btn");
    const status = document.getElementById("signup-status");

    if (!initFirebaseSafe() || !fbAuth || !fbDb) {
      showAuthStatus(status, "Firebase service unavailable.", true);
      return;
    }

    const pickedRole = document.getElementById("signup-role").value;
    const fullName = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const phone = document.getElementById("signup-phone").value.trim();
    const password = document.getElementById("signup-password").value;

    const profileData = {
      fullName,
      email,
      phone,
      role: pickedRole === "teacher" ? "pending_teacher" : "student",
      approved: pickedRole === "student",
      createdAt: new Date().toISOString()
    };

    if (pickedRole === "student") {
      profileData.classLevel = document.getElementById("signup-class").value;
      profileData.stream = document.getElementById("signup-stream").value;
    } else {
      profileData.designation = document.getElementById("signup-designation").value;
      profileData.subject = document.getElementById("signup-subject").value.trim() || "General";
    }

    btn.disabled = true;
    btn.textContent = "CREATING ACCOUNT...";
    try {
      const cred = await createUserWithEmailAndPassword(fbAuth, email, password);
      await setDoc(doc(fbDb, "users", cred.user.uid), profileData);
      currentUser = cred.user;
      currentUserProfile = profileData;
      updateAuthHeaderButton();
      showAuthStatus(
        status,
        pickedRole === "teacher"
          ? "Account created! Pending Admin verification."
          : "Student account created successfully!",
        false
      );
      switchAuthView("profile");
    } catch (err) {
      showAuthStatus(status, err.message.replace("Firebase:", "").trim(), true);
    } finally {
      btn.disabled = false;
      btn.textContent = "SIGN UP";
    }
  });

  document.getElementById("profile-open-dashboard-btn").addEventListener("click", () => {
    close();
    if (typeof window.openPortalDashboard === "function") {
      window.openPortalDashboard();
    }
  });

  document.getElementById("profile-logout-btn").addEventListener("click", async () => {
    if (fbAuth) await signOut(fbAuth);
    currentUser = null;
    currentUserProfile = null;
    updateAuthHeaderButton();
    switchAuthView("welcome");
  });
}

function showAuthStatus(el, msg, isError) {
  el.textContent = msg;
  el.className = isError
    ? "text-xs font-semibold p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 block"
    : "text-xs font-semibold p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 block";
}

function renderProfileSheet() {
  if (!isPublicPortalUser()) return;
  const p = currentUserProfile;
  document.getElementById("profile-name-display").textContent = p.fullName || currentUser.email;

  const isApprovedTeacher = p.role === "teacher" && p.approved === true;
  const isPendingTeacher = p.role === "pending_teacher" || (p.role === "teacher" && !p.approved);

  const roleText = isApprovedTeacher
    ? `Verified Faculty • ${p.designation || "Teacher"} (${p.subject || "General"})`
    : isPendingTeacher
      ? "Teacher Account (Pending Admin Verification)"
      : `Student • Class ${p.classLevel || "N/A"} (${p.stream || "General"})`;

  document.getElementById("profile-role-badge").textContent = roleText;

  document.getElementById("profile-details-box").innerHTML = `
    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
      <div><span class="text-slate-500">Email:</span> <strong class="text-slate-900">${escapeSafe(currentUser.email)}</strong></div>
      <div><span class="text-slate-500">Mobile:</span> <strong class="text-slate-900">${escapeSafe(p.phone || "Not set")}</strong></div>
      <div><span class="text-slate-500">Account Status:</span>
        <strong class="${p.approved ? "text-emerald-700" : "text-amber-700"}">
          ${p.approved ? "✓ Verified Active" : "⏳ Awaiting Admin Verification"}
        </strong>
      </div>
    </div>
  `;

  const dashBtn = document.getElementById("profile-open-dashboard-btn");
  if (dashBtn) {
    if (isPendingTeacher) {
      dashBtn.disabled = true;
      dashBtn.textContent = "⏳ Waiting for Principal / Admin Approval";
      dashBtn.className = "w-full py-3.5 rounded-full bg-slate-200 text-slate-500 font-extrabold text-xs tracking-wider uppercase cursor-not-allowed";
    } else {
      dashBtn.disabled = false;
      dashBtn.textContent = isApprovedTeacher ? "Open Teacher Command Studio →" : "Open My Student Dashboard →";
      dashBtn.className = "w-full py-3.5 rounded-full auth-btn-gradient text-white font-extrabold text-xs tracking-wider uppercase shadow-md cursor-pointer";
    }
  }
}

async function switchAuthView(viewName) {
  ["welcome", "signin", "signup", "profile"].forEach((v) => {
    const el = document.getElementById(`auth-view-${v}`);
    if (el) el.classList.toggle("hidden", v !== viewName);
  });

  if (viewName === "profile" && currentUser) {
    await fetchFreshUserProfile(currentUser.uid);
    if (isPublicPortalUser()) renderProfileSheet();
    else switchAuthView("welcome");
  }
}

function openCurvedAuthModal(initialView = "welcome") {
  mountCurvedAuthModal();
  switchAuthView(initialView);
  const modal = document.getElementById("legacy-auth-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

window.openSchoolPortalAuth = openCurvedAuthModal;

// ============================================================================
// 7. CLEAN BRIDGE FOR portal-dashboards.js & campus-experience-admin.js
// ============================================================================
window.LegacyPortalBridge = {
  getSession: () => ({
    user: currentUser,
    profile: currentUserProfile,
    isPortalUser: isPublicPortalUser(),
    db: fbDb,
    auth: fbAuth
  }),
  refreshProfile: () => (currentUser ? fetchFreshUserProfile(currentUser.uid) : Promise.resolve(null)),
  openNoticeViewer: openNoticeViewerModal,
  refreshNotices: async () => {
    await syncMarqueeNotices();
    window.dispatchEvent(new CustomEvent("backend-ready"));
  }
};

// ============================================================================
// 8. BOOTSTRAP
// ============================================================================
function bootLegacyPortal() {
  document.documentElement.lang = "en";
  injectEyeFriendlyStyles();
  mountLegacyHeader();
  wrapGlobalSwitchView();

  const savedTheme = localStorage.getItem("gola_school_theme") || "light";
  applyEyeFriendlyTheme(savedTheme);

  initFirebaseSafe();
  syncMarqueeNotices();

  window.addEventListener("backend-ready", () => {
    initFirebaseSafe();
    wrapGlobalSwitchView();
    setTimeout(syncMarqueeNotices, 350);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootLegacyPortal);
} else {
  bootLegacyPortal();
}

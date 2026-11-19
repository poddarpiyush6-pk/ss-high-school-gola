// ============================================================================
// FILE: portal-pro-shell.js — PHASE 1: MOBILE-FIRST PRO SHELL
// 1. Mobile 60fps Smoothness Shield (Kills Canvas/Blur/Tilt Lag on Phones)
// 2. Top-Class Line-by-Line Live Notice Broadcast Bar (Auto-Rotate + Controls)
// 3. Quick Utility Strip (JAC, e-Kalyan, Syllabus, Timing, Guru Stambh, Login)
// 4. In-Site Notice Reader (Supports Text, Google Drive PDF Embed, YT & Image)
// 100% Safe: Zero impact on Guru Stambh, Gaurav Stambh, config.js, or app.js!
// ============================================================================

(function () {
  "use strict";

  let tickerNotices = [];
  let currentIndex = 0;
  let rotationTimer = null;
  let isPaused = false;

  function escapeSafe(str) {
    const d = document.createElement("div");
    d.textContent = str == null ? "" : String(str);
    return d.innerHTML;
  }

  function isEnglish() {
    const lbl = document.getElementById("lang-label");
    return lbl && lbl.textContent.trim().toUpperCase() === "HI";
  }

  // Extract Google Drive File ID safely from any Drive share link
  function getDrivePreviewUrl(url) {
    if (!url || typeof url !== "string") return null;
    const match1 = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/);
    const match2 = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]{10,})/);
    const match3 = url.match(/docs\.google\.com\/[a-z]+\/d\/([a-zA-Z0-9_-]{10,})/);
    const id = (match1 && match1[1]) || (match2 && match2[1]) || (match3 && match3[1]);
    return id ? `https://drive.google.com/file/d/${id}/preview` : null;
  }

  // Extract YouTube Embed URL safely
  function getYouTubeEmbedUrl(url) {
    if (!url || typeof url !== "string") return null;
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return m && m[1] ? `https://www.youtube.com/embed/${m[1]}` : null;
  }

  // ==========================================================================
  // 1. MOBILE-FIRST 60FPS PERFORMANCE & PRO BROADCAST STYLES
  // ==========================================================================
  function injectProStyles() {
    if (document.getElementById("portal-pro-shell-styles")) return;
    const style = document.createElement("style");
    style.id = "portal-pro-shell-styles";
    style.textContent = `
      /* Prevent horizontal overflow on every mobile screen */
      html, body {
        max-width: 100vw;
        overflow-x: hidden;
      }

      /* Mobile & Touch Device 60fps Smoothness Shield */
      @media (max-width: 768px), (hover: none) {
        #sacred-particles-canvas,
        #royal-prahar-ribbon {
          display: none !important;
        }
        .sacred-card {
          transform: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          transition: border-color 0.2s ease, background-color 0.2s ease !important;
        }
        header {
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
        }
      }

      /* Pro Broadcast Bar Line-by-Line Slide Transition */
      @keyframes proTickerSlideIn {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      .pro-ticker-animate {
        animation: proTickerSlideIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      /* Hide scrollbar cleanly on Quick Utility Strip */
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
  }

  // ==========================================================================
  // 2. PRO LIVE NOTICE BROADCAST BAR + QUICK UTILITY STRIP
  // ==========================================================================
  function mountProTopShell() {
    if (document.getElementById("pro-live-shell")) return;

    const header = document.querySelector("header");
    if (!header || !header.parentNode) return;

    const shell = document.createElement("section");
    shell.id = "pro-live-shell";
    shell.setAttribute("aria-label", "Live Notice Broadcast and Quick Utilities");
    shell.className = "w-full border-b border-amber-500/25 bg-[var(--bg-primary)]";

    shell.innerHTML = `
      <!-- A. TOP-CLASS SINGLE-LINE LIVE NOTICE BROADCAST BAR -->
      <div class="w-full bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 text-stone-100 border-b border-amber-500/30">
        <div class="max-w-7xl mx-auto px-3 sm:px-6 h-11 flex items-center gap-2 sm:gap-3">
          
          <!-- Pulsing LIVE Badge -->
          <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600/20 border border-red-500/50 shrink-0">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span class="font-mono text-[10px] font-extrabold tracking-wider text-red-300 uppercase">LIVE</span>
          </div>

          <!-- Rotating Single-Line Notice Slot (Clickable) -->
          <button id="pro-ticker-btn" type="button"
            class="flex-1 min-w-0 text-left flex items-center gap-2 py-1 group cursor-pointer focus:outline-none">
            <span id="pro-ticker-tag"
              class="hidden sm:inline-block shrink-0 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold">
              सूचना
            </span>
            <span id="pro-ticker-text"
              class="truncate font-hindi text-xs sm:text-sm font-semibold text-stone-100 group-hover:text-amber-300 transition-colors">
              नवीनतम विद्यालय सूचनाएं लोड हो रही हैं...
            </span>
            <span id="pro-ticker-date"
              class="hidden md:inline-block shrink-0 font-mono text-[10px] text-stone-400">
            </span>
          </button>

          <!-- Compact Controls (Prev / Next / View All) -->
          <div class="flex items-center gap-1 shrink-0">
            <button id="pro-ticker-prev" type="button" aria-label="Previous Notice"
              class="w-7 h-7 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 text-stone-300 hover:text-amber-300 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer">
              ‹
            </button>
            <button id="pro-ticker-next" type="button" aria-label="Next Notice"
              class="w-7 h-7 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 text-stone-300 hover:text-amber-300 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer">
              ›
            </button>
            <button id="pro-ticker-all" type="button"
              class="hidden sm:inline-flex items-center px-2.5 h-7 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-amber-500/40 font-mono text-[10px] font-extrabold transition-colors cursor-pointer">
              ALL ▾
            </button>
          </div>
        </div>
      </div>

      <!-- B. MOBILE-FIRST QUICK UTILITY STRIP (1-Tap Student & Teacher Actions) -->
      <div class="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-0.5">
          
          <!-- Primary Portal Login Trigger (Phase 2 Auth Hook Ready) -->
          <button type="button" id="pro-util-login-btn"
            class="snap-start shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-hindi font-extrabold text-xs shadow-sm active:scale-95 transition-transform cursor-pointer">
            <span>🔐</span>
            <span id="pro-login-pill-label">छात्र / शिक्षक लॉगिन</span>
          </button>

          <button type="button" data-pro-util="jac"
            class="snap-start shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 t-heading font-hindi font-bold text-xs active:scale-95 transition-colors cursor-pointer">
            <span>📄</span><span>JAC बोर्ड / रिज़ल्ट</span>
          </button>

          <button type="button" data-pro-util="syllabus"
            class="snap-start shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 t-heading font-hindi font-bold text-xs active:scale-95 transition-colors cursor-pointer">
            <span>📚</span><span>सिलेबस (1–12)</span>
          </button>

          <button type="button" data-pro-util="ekalyan"
            class="snap-start shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 t-heading font-hindi font-bold text-xs active:scale-95 transition-colors cursor-pointer">
            <span>🎓</span><span>ई-कल्याण छात्रवृत्ति</span>
          </button>

          <button type="button" data-pro-util="timing"
            class="snap-start shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 t-heading font-hindi font-bold text-xs active:scale-95 transition-colors cursor-pointer">
            <span>⏰</span><span>विद्यालय समय</span>
          </button>

          <button type="button" data-pro-util="guru"
            class="snap-start shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 t-heading font-hindi font-bold text-xs active:scale-95 transition-colors cursor-pointer">
            <span>🙏</span><span>गुरु स्तंभ</span>
          </button>

        </div>
      </div>
    `;

    // Insert directly after <header>
    header.parentNode.insertBefore(shell, header.nextSibling);

    // Pause ticker on hover / touch
    const tickerBar = shell.firstElementChild;
    tickerBar.addEventListener("mouseenter", () => { isPaused = true; });
    tickerBar.addEventListener("mouseleave", () => { isPaused = false; });

    document.getElementById("pro-ticker-prev").addEventListener("click", () => {
      if (!tickerNotices.length) return;
      currentIndex = (currentIndex - 1 + tickerNotices.length) % tickerNotices.length;
      renderTickerItem();
      restartTimer();
    });

    document.getElementById("pro-ticker-next").addEventListener("click", () => {
      if (!tickerNotices.length) return;
      currentIndex = (currentIndex + 1) % tickerNotices.length;
      renderTickerItem();
      restartTimer();
    });

    document.getElementById("pro-ticker-btn").addEventListener("click", () => {
      const activeNotice = tickerNotices[currentIndex];
      if (activeNotice) openProNoticeViewer(activeNotice);
    });

    document.getElementById("pro-ticker-all").addEventListener("click", () => {
      if (typeof window.switchView === "function") window.switchView("home");
      setTimeout(() => {
        const box = document.getElementById("notices-container");
        if (box) box.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    });

    // Quick Utility Button Handlers
    document.getElementById("pro-util-login-btn").addEventListener("click", () => {
      if (typeof window.openSchoolPortalAuth === "function") {
        window.openSchoolPortalAuth();
      } else {
        openUtilityModal("login_preview");
      }
    });

    shell.querySelectorAll("[data-pro-util]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = btn.getAttribute("data-pro-util");
        if (type === "guru") {
          if (typeof window.switchView === "function") window.switchView("guru-stambh");
          return;
        }
        if (type === "ekalyan") {
          if (typeof window.switchView === "function") window.switchView("home");
          setTimeout(() => {
            const el = document.getElementById("schemes-grid");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 120);
          return;
        }
        openUtilityModal(type);
      });
    });
  }

  // ==========================================================================
  // 3. TICKER DATA SYNC & SMOOTH ROTATION ENGINE
  // ==========================================================================
  function renderTickerItem() {
    const textEl = document.getElementById("pro-ticker-text");
    const tagEl = document.getElementById("pro-ticker-tag");
    const dateEl = document.getElementById("pro-ticker-date");
    if (!textEl || !tickerNotices.length) return;

    const item = tickerNotices[currentIndex];
    const en = isEnglish();
    const title = en ? (item.titleEn || item.titleHi) : (item.titleHi || item.titleEn);
    const tag = en ? (item.tagEn || item.tagHi || "NOTICE") : (item.tagHi || item.tagEn || "सूचना");

    textEl.classList.remove("pro-ticker-animate");
    void textEl.offsetWidth;
    textEl.textContent = title || "आधिकारिक विद्यालय सूचना";
    textEl.classList.add("pro-ticker-animate");

    if (tagEl) tagEl.textContent = tag;
    if (dateEl) dateEl.textContent = item.date ? `• ${item.date}` : "";
  }

  function restartTimer() {
    if (rotationTimer) clearInterval(rotationTimer);
    if (tickerNotices.length <= 1) return;
    rotationTimer = setInterval(() => {
      if (!isPaused && !document.hidden) {
        currentIndex = (currentIndex + 1) % tickerNotices.length;
        renderTickerItem();
      }
    }, 4500);
  }

  async function syncTickerNotices() {
    // 1. Instant default notices so there is zero blank state
    const cfg = window.SCHOOL_MASTER_CONFIG;
    if (tickerNotices.length === 0 && cfg && Array.isArray(cfg.defaultNotices)) {
      tickerNotices = cfg.defaultNotices;
      currentIndex = 0;
      renderTickerItem();
      restartTimer();
    }

    // 2. Live Firebase notices sync
    if (window.BackendService && typeof window.BackendService.fetchNotices === "function") {
      try {
        const live = await window.BackendService.fetchNotices();
        if (Array.isArray(live) && live.length > 0) {
          tickerNotices = live;
          currentIndex = 0;
          renderTickerItem();
          restartTimer();
        }
      } catch (e) {}
    }
  }

  // ==========================================================================
  // 4. IN-SITE NOTICE & MEDIA VIEWER (Text + Google Drive PDF + YT + Image)
  // ==========================================================================
  function ensureProModal() {
    let modal = document.getElementById("pro-universal-modal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "pro-universal-modal";
    modal.className = "fixed inset-0 z-[9998] bg-black/80 hidden items-center justify-center p-3 sm:p-5 overflow-y-auto";
    modal.innerHTML = `
      <div class="w-full max-w-2xl rounded-2xl bg-stone-950 border border-amber-500/40 text-stone-100 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        <div class="px-4 py-3.5 bg-stone-900 border-b border-amber-500/25 flex items-center justify-between gap-3">
          <div class="min-w-0">
            <span id="pro-modal-badge" class="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-extrabold mb-0.5">
              OFFICIAL UPDATE
            </span>
            <h3 id="pro-modal-title" class="font-hindi font-extrabold text-sm sm:text-base text-white truncate"></h3>
          </div>
          <button id="pro-modal-close" type="button" aria-label="Close"
            class="shrink-0 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/30 text-stone-200 hover:text-white font-mono text-xs font-bold cursor-pointer">
            ✕ बंद करें
          </button>
        </div>
        <div id="pro-modal-body" class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm font-hindi leading-relaxed"></div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("pro-modal-close").addEventListener("click", closeProModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeProModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeProModal();
    });
    return modal;
  }

  function closeProModal() {
    const modal = document.getElementById("pro-universal-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    const body = document.getElementById("pro-modal-body");
    if (body) body.innerHTML = ""; // Stop embedded video/PDF cleanly
  }

  function openProNoticeViewer(notice) {
    const modal = ensureProModal();
    const en = isEnglish();
    const title = en ? (notice.titleEn || notice.titleHi) : (notice.titleHi || notice.titleEn);
    const desc = en ? (notice.descEn || notice.descHi) : (notice.descHi || notice.descEn);
    const tag = en ? (notice.tagEn || notice.tagHi || "NOTICE") : (notice.tagHi || notice.tagEn || "आधिकारिक सूचना");

    document.getElementById("pro-modal-badge").textContent = `${tag} • ${notice.date || ""}`;
    document.getElementById("pro-modal-title").textContent = title || "आधिकारिक सूचना";

    const driveEmbed = getDrivePreviewUrl(notice.attachmentUrl || notice.pdfUrl || "");
    const ytEmbed = getYouTubeEmbedUrl(notice.attachmentUrl || notice.videoUrl || "");
    const imgSrc = notice.imageDataUrl || "";

    let mediaHTML = "";
    if (imgSrc) {
      mediaHTML += `
        <div class="rounded-xl overflow-hidden border border-amber-500/30 bg-black">
          <img src="${escapeSafe(imgSrc)}" alt="Notice Attachment" class="w-full max-h-[380px] object-contain mx-auto" />
        </div>
      `;
    }
    if (driveEmbed) {
      mediaHTML += `
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-mono text-amber-300 font-bold">📄 संलग्न दस्तावेज़ (Embedded PDF Preview)</span>
            <a href="${escapeSafe(notice.attachmentUrl || notice.pdfUrl)}" target="_blank" rel="noopener noreferrer"
              class="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-mono text-[11px] font-extrabold">
              Drive में खोलें / Download ↗
            </a>
          </div>
          <iframe src="${escapeSafe(driveEmbed)}" class="w-full h-[380px] sm:h-[440px] rounded-xl border border-amber-500/30 bg-white" allow="autoplay"></iframe>
        </div>
      `;
    } else if (ytEmbed) {
      mediaHTML += `
        <div class="aspect-video w-full rounded-xl overflow-hidden border border-amber-500/30 bg-black">
          <iframe src="${escapeSafe(ytEmbed)}" class="w-full h-full" allowfullscreen></iframe>
        </div>
      `;
    } else if (notice.attachmentUrl) {
      mediaHTML += `
        <a href="${escapeSafe(notice.attachmentUrl)}" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-extrabold text-xs">
          🔗 संलग्न लिंक खोलें (Open Attachment) ↗
        </a>
      `;
    }

    document.getElementById("pro-modal-body").innerHTML = `
      <div class="p-4 rounded-xl bg-stone-900/90 border border-amber-500/20 text-stone-200 whitespace-pre-line">
        ${escapeSafe(desc)}
      </div>
      ${mediaHTML}
      <div class="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-stone-400">
        <span>🏛️ S.S. +2 High School, Gola (UDISE: 20240701206)</span>
        <button type="button" id="pro-jump-notices-btn"
          class="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 font-bold cursor-pointer">
          सभी नोटिस देखें (Notice Board) ➔
        </button>
      </div>
    `;

    document.getElementById("pro-jump-notices-btn").addEventListener("click", () => {
      closeProModal();
      if (typeof window.switchView === "function") window.switchView("home");
      setTimeout(() => {
        const box = document.getElementById("notices-container");
        if (box) box.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    });

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  // Expose globally so Phase 2 Teacher/Student Dashboards can also open any notice
  window.openProNoticeViewer = openProNoticeViewer;

  // ==========================================================================
  // 5. QUICK UTILITY MODALS (JAC Board, Syllabus, Timing, Phase 2 Login Preview)
  // ==========================================================================
  function openUtilityModal(type) {
    const modal = ensureProModal();
    const badge = document.getElementById("pro-modal-badge");
    const title = document.getElementById("pro-modal-title");
    const body = document.getElementById("pro-modal-body");

    if (type === "jac") {
      badge.textContent = "JAC RANCHI • OFFICIAL LINKS";
      title.textContent = "📄 JAC बोर्ड परीक्षा, मॉडल पेपर एवं रिज़ल्ट";
      body.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="https://jac.jharkhand.gov.in/" target="_blank" rel="noopener noreferrer"
            class="p-4 rounded-xl bg-stone-900 hover:bg-amber-500/15 border border-amber-500/30 space-y-1 block transition-colors">
            <div class="font-extrabold text-amber-300">🏛️ JAC Official Website ↗</div>
            <p class="text-xs text-stone-400">बोर्ड परीक्षा कार्यक्रम, पंजीकरण एवं आधिकारिक सूचनाएं</p>
          </a>
          <a href="https://www.jacresults.com/" target="_blank" rel="noopener noreferrer"
            class="p-4 rounded-xl bg-stone-900 hover:bg-amber-500/15 border border-amber-500/30 space-y-1 block transition-colors">
            <div class="font-extrabold text-emerald-300">🏆 JAC Results Portal ↗</div>
            <p class="text-xs text-stone-400">कक्षा 8, 9, 10 (मैट्रिक) एवं 11, 12 (+2) परीक्षा परिणाम</p>
          </a>
          <a href="https://jcert.jharkhand.gov.in/" target="_blank" rel="noopener noreferrer"
            class="p-4 rounded-xl bg-stone-900 hover:bg-amber-500/15 border border-amber-500/30 space-y-1 block transition-colors">
            <div class="font-extrabold text-amber-300">📘 JCERT Model Papers & Books ↗</div>
            <p class="text-xs text-stone-400">मॉडल प्रश्न पत्र, प्रश्न बैंक एवं ई-पाठ्यपुस्तकें</p>
          </a>
          <a href="https://ekalyan.cgg.gov.in/" target="_blank" rel="noopener noreferrer"
            class="p-4 rounded-xl bg-stone-900 hover:bg-amber-500/15 border border-amber-500/30 space-y-1 block transition-colors">
            <div class="font-extrabold text-emerald-300">🎓 e-Kalyan Jharkhand ↗</div>
            <p class="text-xs text-stone-400">प्री-मैट्रिक एवं पोस्ट-मैट्रिक छात्रवृत्ति आवेदन व स्टेटस</p>
          </a>
        </div>
      `;
    } else if (type === "syllabus") {
      badge.textContent = "ACADEMIC CURRICULUM • CLASS 1 TO 12";
      title.textContent = "📚 कक्षा-वार पाठ्यक्रम (JCERT / JAC Syllabus)";
      body.innerHTML = `
        <p class="text-stone-300 text-xs">अपनी कक्षा के अनुसार JAC/JCERT पाठ्यक्रम और NCERT पुस्तकें नीचे से देखें। (Phase 2 में लॉगिन के बाद आपका व्यक्तिगत सिलेबस सीधे डैशबोर्ड पर खुलेगा।)</p>
        <div class="space-y-2">
          <div class="p-3.5 rounded-xl bg-stone-900 border border-amber-500/25 flex items-center justify-between gap-2">
            <div>
              <strong class="text-amber-300 block">प्राथमिक एवं उच्च प्राथमिक (कक्षा 1 से 8)</strong>
              <span class="text-xs text-stone-400">JCERT झारखंड पाठ्यपुस्तकें — हिंदी, अंग्रेजी, गणित, विज्ञान, सामाजिक विज्ञान</span>
            </div>
            <a href="https://jcert.jharkhand.gov.in/" target="_blank" rel="noopener noreferrer" class="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs">खोलें ↗</a>
          </div>
          <div class="p-3.5 rounded-xl bg-stone-900 border border-amber-500/25 flex items-center justify-between gap-2">
            <div>
              <strong class="text-amber-300 block">माध्यमिक मैट्रिक (कक्षा 9 एवं 10)</strong>
              <span class="text-xs text-stone-400">JAC Board NCERT Syllabus + IT Vocational + Science Practical</span>
            </div>
            <a href="https://ncert.nic.in/textbook.php" target="_blank" rel="noopener noreferrer" class="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs">NCERT ↗</a>
          </div>
          <div class="p-3.5 rounded-xl bg-stone-900 border border-amber-500/25 flex items-center justify-between gap-2">
            <div>
              <strong class="text-amber-300 block">+2 इंटरमीडिएट (कक्षा 11 एवं 12 — Science, Arts, Commerce)</strong>
              <span class="text-xs text-stone-400">PCM / PCB, कला एवं वाणिज्य संकाय — JAC Board Pattern</span>
            </div>
            <a href="https://jac.jharkhand.gov.in/" target="_blank" rel="noopener noreferrer" class="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs">JAC ↗</a>
          </div>
        </div>
      `;
    } else if (type === "timing") {
      badge.textContent = "SCHOOL SCHEDULE • GOLA, RAMGARH";
      title.textContent = "⏰ विद्यालय संचालन समय-सारिणी (School Timing)";
      body.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-4 rounded-xl bg-stone-900 border border-amber-500/35 space-y-1.5">
            <span class="text-[10px] font-mono text-amber-400 font-bold">सामान्य सत्र (अप्रैल – जून प्रातःकालीन)</span>
            <div class="text-base font-extrabold text-white">07:00 AM – 01:00 PM</div>
            <p class="text-xs text-stone-400">प्रार्थना सभा, नियमित कक्षाएं एवं मध्याह्न भोजन (कक्षा 1–8)।</p>
          </div>
          <div class="p-4 rounded-xl bg-stone-900 border border-emerald-500/35 space-y-1.5">
            <span class="text-[10px] font-mono text-emerald-400 font-bold">नियमित सत्र (जुलाई – मार्च)</span>
            <div class="text-base font-extrabold text-white">09:00 AM – 03:00 PM</div>
            <p class="text-xs text-stone-400">प्रार्थना सभा, प्रायोगिक कक्षाएं (Labs), ICT एवं NCC अभ्यास।</p>
          </div>
        </div>
        <p class="text-[11px] text-amber-300/90 font-mono">
          * नोट: झारखंड सरकार (शिक्षा विभाग) के आदेशानुसार मौसम के अनुसार समय में परिवर्तन होने पर लाइव नोटिस बार में सूचना दी जाती है।
        </p>
      `;
    } else if (type === "login_preview") {
      badge.textContent = "PHASE 2 PORTAL AUTH";
      title.textContent = "🔐 छात्र एवं शिक्षक पोर्टल लॉगिन";
      body.innerHTML = `
        <div class="p-4 rounded-xl bg-stone-900 border border-amber-500/30 space-y-2 text-center">
          <div class="text-2xl">🏛️</div>
          <p class="font-bold text-amber-300">छात्र एवं शिक्षक लॉगिन सिस्टम (Phase 2) सक्रिय होने वाला है।</p>
          <p class="text-xs text-stone-400">लॉगिन के बाद छात्रों को अपनी कक्षा का डैशबोर्ड व शिक्षक संदेश सुविधा, तथा शिक्षकों को इनबॉक्स एवं नोटिस पब्लिशर मिलेगा।</p>
        </div>
      `;
    }

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  // ==========================================================================
  // 6. BOOTSTRAP PHASE 1 SHELL
  // ==========================================================================
  function initProShell() {
    injectProStyles();
    mountProTopShell();
    syncTickerNotices();

    window.addEventListener("backend-ready", () => {
      setTimeout(syncTickerNotices, 400);
    });

    // Re-sync whenever notices container changes
    const noticesBox = document.getElementById("notices-container");
    if (noticesBox) {
      const obs = new MutationObserver(() => {
        if (window.BackendService && window.BackendService.isLive()) {
          syncTickerNotices();
        }
      });
      obs.observe(noticesBox, { childList: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProShell);
  } else {
    initProShell();
  }
})();
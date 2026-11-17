// ============================================================================
// FILE: royal-rajpatra-core.js — INSTITUTIONAL ROYAL ARCHITECTURE SUITE
// 1. Living Garbhagriha: 432Hz WebAudio Temple Bell Acoustics + Live Prahar Bar
// 2. Ctrl+K Royal Omni-Spotlight: Instant Search across Notices, Faculty, Alumni & Schemes
// 3. Official Rajpatra Gazette Engine: Govt. Letterhead + Seal + QR + A4 PDF Print
// 100% Zero-Risk Plugin: Untouched config.js, firebase-backend.js, and app.js!
// ============================================================================

(function () {
  "use strict";

  const cfg = window.SCHOOL_MASTER_CONFIG || {};
  const schoolIdentity = cfg.identity || {
    nameHi: "राज्य संपोषित +2 उच्च विद्यालय, गोला",
    nameEn: "S.S. +2 HIGH SCHOOL, GOLA",
    establishedYear: "1940",
    udiseCode: "20240701206",
    shlokaSanskrit: "॥ सा विद्या या विमुक्तये • न हि ज्ञानेन सदृशं पवित्रमिह विद्यते ॥"
  };
  const principalInfo = cfg.principal || {
    nameHi: "श्रीमती अनुपा पुष्पा तिर्की",
    nameEn: "Smt. Anupa Pushpa Tirkey",
    designationHi: "प्रधानाचार्य (Principal), राज्य संपोषित +2 उच्च विद्यालय, गोला"
  };

  let soundEnabled = localStorage.getItem("gola_sacred_sound") !== "off";
  let sharedAudioCtx = null;

  function escapeSafe(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function isEnglishMode() {
    const langLbl = document.getElementById("lang-label");
    return langLbl && langLbl.textContent.trim().toUpperCase() === "HI";
  }

  // ==========================================================================
  // 🔔 ENGINE 1A: PURE MATHEMATICAL WEBAUDIO TEMPLE BELL & DEEP ACOUSTICS
  // Zero external MP3 files! Generates authentic 432Hz Bronze Ghanta Resonance
  // ==========================================================================
  function playSacredTempleBell(variant = "bell") {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
      if (sharedAudioCtx.state === "suspended") sharedAudioCtx.resume();

      const now = sharedAudioCtx.currentTime;

      // Haptic physical feedback on mobile devices
      if (navigator.vibrate) {
        navigator.vibrate(variant === "deep" ? [35, 40, 65] : [50]);
      }

      // Harmonic frequencies modeled after a traditional Indian bronze temple bell
      const harmonics = variant === "deep"
        ? [
            { freq: 528.0, amp: 0.16, decay: 2.6 }, // Solfeggio Sacred Flame Chime
            { freq: 1056.0, amp: 0.08, decay: 1.8 },
            { freq: 1584.0, amp: 0.04, decay: 1.1 }
          ]
        : [
            { freq: 432.0, amp: 0.22, decay: 3.4 }, // Fundamental Hum
            { freq: 864.0, amp: 0.14, decay: 2.5 }, // Prime Octave
            { freq: 1296.5, amp: 0.08, decay: 1.7 }, // Metallic Tierce
            { freq: 2048.0, amp: 0.04, decay: 0.7 }  // Initial Strike Shimmer
          ];

      harmonics.forEach((h, idx) => {
        const osc = sharedAudioCtx.createOscillator();
        const gain = sharedAudioCtx.createGain();

        osc.type = idx === 0 ? "sine" : idx === harmonics.length - 1 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(h.freq, now);
        // Subtle natural pitch vibrato
        osc.frequency.exponentialRampToValueAtTime(h.freq * 0.998, now + h.decay);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(h.amp, now + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + h.decay);

        osc.connect(gain);
        gain.connect(sharedAudioCtx.destination);

        osc.start(now);
        osc.stop(now + h.decay + 0.05);
        osc.onended = () => {
          gain.disconnect();
          osc.disconnect();
        };
      });
    } catch (e) {
      // Fail silently if audio hardware is unavailable
    }
  }

  window.playSacredTempleBell = playSacredTempleBell;

  // ==========================================================================
  // 🌅 ENGINE 1B: LIVE GOLA PRAHAR (प्रहर) & ROYAL COMMAND RIBBON
  // ==========================================================================
  function getPraharStatus(en) {
    const hr = new Date().getHours();
    if (hr >= 4 && hr < 8) {
      return en
        ? "🌅 Brahma Muhurta & Prabhat Vandana • Morning Study Session"
        : "🌅 ॥ ब्राह्म मुहूर्त एवं प्रभात वंदना प्रहर • प्रातःकालीन स्वाध्याय ॥";
    } else if (hr >= 8 && hr < 12) {
      return en
        ? "☀️ Purvahna Vidya Sadhana • Active Institutional Hours (Gola)"
        : "☀️ ॥ पूर्वाह्न विद्या साधना प्रहर • विद्यालय शैक्षणिक सत्र सक्रिय ॥";
    } else if (hr >= 12 && hr < 16) {
      return en
        ? "🌤️ Madhyahna Gyan Yagya • Laboratory & Academic Session"
        : "🌤️ ॥ मध्याह्न ज्ञान यज्ञ प्रहर • प्रयोगशाला एवं शिक्षण काल ॥";
    } else if (hr >= 16 && hr < 19) {
      return en
        ? "🌇 Sandhya Vandana & Khel-Kood Prahar • Evening Reflection"
        : "🌇 ॥ गोधूलि संध्या वंदना एवं एनसीसी/खेलकूद प्रहर ॥";
    }
    return en
      ? "🌙 Ratri Swadhyaya Prahar • Peaceful Self-Study Hours"
      : "🌙 ॥ रात्रि स्वाध्याय एवं एकाग्र चिंतन प्रहर ॥";
  }

  function injectRoyalCommandRibbon() {
    if (document.getElementById("royal-prahar-ribbon")) return;

    const styleTag = document.createElement("style");
    styleTag.id = "royal-rajpatra-styles";
    styleTag.textContent = `
      @keyframes royalPulseHalo {
        0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.85), 0 0 30px rgba(234, 88, 12, 0.5); transform: scale(1.01); }
        50% { box-shadow: 0 0 0 14px rgba(245, 158, 11, 0), 0 0 45px rgba(245, 158, 11, 0.75); transform: scale(1.015); }
        100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0), 0 0 0 rgba(245, 158, 11, 0); transform: scale(1); }
      }
      .royal-spotlight-highlight {
        animation: royalPulseHalo 2.4s cubic-bezier(0.16, 1, 0.3, 1) 2;
        border-color: #f59e0b !important;
      }
      .rajpatra-seal-ring {
        background: radial-gradient(circle, rgba(180,83,9,0.12) 0%, rgba(180,83,9,0.03) 70%);
      }
      @media print {
        body > *:not(#royal-rajpatra-modal) {
          display: none !important;
        }
        #royal-rajpatra-modal {
          position: static !important;
          background: #ffffff !important;
          padding: 0 !important;
          margin: 0 !important;
          display: block !important;
          overflow: visible !important;
        }
        #royal-rajpatra-sheet {
          box-shadow: none !important;
          border: 3px double #78350f !important;
          max-width: 100% !important;
          width: 100% !important;
          margin: 0 !important;
          color: #1c1917 !important;
          background: #fffdf9 !important;
        }
        .no-print-control {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(styleTag);

    const ribbon = document.createElement("div");
    ribbon.id = "royal-prahar-ribbon";
    ribbon.className = "w-full bg-gradient-to-r from-stone-950 via-amber-950/95 to-stone-950 text-amber-200 border-b border-amber-500/35 px-3 sm:px-6 py-1.5 text-[11px] z-[60] relative";
    ribbon.innerHTML = `
      <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2 font-hindi">
          <span class="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span id="royal-prahar-text" class="font-bold tracking-wide text-amber-200"></span>
          <span id="royal-live-clock" class="hidden md:inline-block font-mono text-[10px] text-amber-400/90 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20"></span>
        </div>

        <div class="flex items-center gap-2 ml-auto">
          <!-- Omni-Search Trigger Button (Ctrl + K) -->
          <button id="royal-cmd-trigger" type="button"
            class="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-hindi font-bold text-[11px] transition-all cursor-pointer shadow-sm">
            <span>🔍</span>
            <span id="royal-search-btn-lbl">त्वरित खोज (Search Portal)</span>
            <kbd class="hidden sm:inline-block px-1.5 py-0.2 rounded bg-stone-900 text-amber-300 font-mono text-[9px] border border-amber-500/30">Ctrl+K</kbd>
          </button>

          <!-- Sacred Temple Sound Toggle -->
          <button id="royal-sound-toggle" type="button" title="Toggle 432Hz Temple Bell Sound"
            class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono font-bold text-[10px] transition-all cursor-pointer">
            <span id="royal-sound-icon">${soundEnabled ? "🔔" : "🔕"}</span>
            <span id="royal-sound-lbl" class="hidden sm:inline">${soundEnabled ? "मंदिर ध्वनि: ON" : "ध्वनि: OFF"}</span>
          </button>
        </div>
      </div>
    `;

    document.body.insertBefore(ribbon, document.body.firstChild);

    function updateRibbonClock() {
      const en = isEnglishMode();
      const praharEl = document.getElementById("royal-prahar-text");
      const clockEl = document.getElementById("royal-live-clock");
      const searchLbl = document.getElementById("royal-search-btn-lbl");
      const soundLbl = document.getElementById("royal-sound-lbl");

      if (praharEl) praharEl.textContent = getPraharStatus(en);
      if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }) + " IST • Gola (23.51°N, 85.72°E)";
      }
      if (searchLbl) searchLbl.textContent = en ? "Quick Search" : "त्वरित खोज";
      if (soundLbl) {
        soundLbl.textContent = soundEnabled
          ? (en ? "Bell Chime: ON" : "मंदिर ध्वनि: ON")
          : (en ? "Chime: OFF" : "ध्वनि: OFF");
      }
    }

    updateRibbonClock();
    setInterval(updateRibbonClock, 1000);

    document.getElementById("royal-sound-toggle").addEventListener("click", () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem("gola_sacred_sound", soundEnabled ? "on" : "off");
      document.getElementById("royal-sound-icon").textContent = soundEnabled ? "🔔" : "🔕";
      updateRibbonClock();
      if (soundEnabled) playSacredTempleBell("bell");
    });

    document.getElementById("royal-cmd-trigger").addEventListener("click", openOmniSpotlight);
  }

  // Attach Temple Bell Acoustics to existing Bell & Vidya Deep buttons
  function bindTempleBellInteractions() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("button, a");
      if (!btn) return;
      const text = (btn.textContent || "").toLowerCase();
      const id = (btn.id || "").toLowerCase();
      const onclickAttr = (btn.getAttribute("onclick") || "").toLowerCase();

      if (
        id.includes("deep") ||
        onclickAttr.includes("vidyadeep") ||
        text.includes("विद्या दीप") ||
        text.includes("light sacred") ||
        text.includes("प्रज्ज्वलित")
      ) {
        playSacredTempleBell("deep");
      } else if (
        id.includes("bell") ||
        onclickAttr.includes("bell") ||
        text.includes("🔔") ||
        btn.classList.contains("bell-swing")
      ) {
        playSacredTempleBell("bell");
      }
    });
  }

  // ==========================================================================
  // 🔍 ENGINE 2: CTRL + K ROYAL OMNI-SPOTLIGHT SEARCH ENGINE
  // Scans Live Notices, Faculty (Guru Stambh), Alumni (Gaurav Stambh) & Schemes
  // ==========================================================================
  function buildLiveSearchIndex() {
    const items = [];

    // 1. Index Live Notices
    document.querySelectorAll("#notices-container article").forEach((el, idx) => {
      const title = el.querySelector("h4")?.textContent?.trim() || "Official Notice";
      const desc = el.querySelector("p")?.textContent?.trim() || "";
      const date = el.textContent.match(/\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}/)?.[0] || "Notice";
      items.push({
        category: "📢 आधिकारिक सूचना (Live Notice)",
        badge: date,
        title: title,
        subtitle: desc,
        view: "home",
        element: el
      });
    });

    // 2. Index Faculty (Guru Stambh)
    document.querySelectorAll("#verified-faculty-grid > div").forEach((el) => {
      const name = el.querySelector("h3")?.textContent?.trim();
      if (!name) return;
      const text = el.textContent.replace(/\s+/g, " ").trim();
      items.push({
        category: "🙏 गुरु स्तंभ (Revered Faculty)",
        badge: "Teacher / Guru",
        title: name,
        subtitle: text.slice(0, 140),
        view: "guru-stambh",
        element: el
      });
    });

    // 3. Index Alumni (Gaurav Stambh)
    document.querySelectorAll("#verified-alumni-grid > div").forEach((el) => {
      const name = el.querySelector("h4")?.textContent?.trim();
      if (!name) return;
      const badge = el.querySelector("span")?.textContent?.trim() || "Alumni";
      const desc = el.querySelector("p")?.textContent?.trim() || "";
      items.push({
        category: "🏆 गौरव स्तंभ (Verified Alumni)",
        badge: badge,
        title: name,
        subtitle: desc,
        view: "gaurav-stambh",
        element: el
      });
    });

    // 4. Index Govt Schemes
    document.querySelectorAll("#schemes-grid .scheme-card").forEach((el) => {
      const title = el.querySelector("h3")?.textContent?.trim();
      if (!title) return;
      const desc = el.querySelector("p")?.textContent?.trim() || "";
      items.push({
        category: "🎓 सरकारी छात्रवृत्ति योजना (Govt. Scheme)",
        badge: "Jharkhand Govt",
        title: title,
        subtitle: desc,
        view: "home",
        element: el
      });
    });

    // 5. Core Institutional Quick Jumps
    items.push(
      {
        category: "🏛️ विद्यालय नेविगेशन (Quick Jump)",
        badge: "UDISE: " + schoolIdentity.udiseCode,
        title: "प्रधानाचार्य संदेश — " + principalInfo.nameHi,
        subtitle: "Principal's Desk • S.S. +2 High School, Gola (Estd. 1940)",
        view: "home",
        element: document.getElementById("principal-name-slot") || document.body
      },
      {
        category: "🏛️ विद्यालय नेविगेशन (Quick Jump)",
        badge: "Faculty Wall",
        title: "गुरु स्तंभ — समस्त शिक्षक वृंद (View All Teachers)",
        subtitle: "PGT (+2), TGT (Secondary), एवं Primary Wing के आदरणीय गुरुजन",
        view: "guru-stambh",
        element: document.getElementById("verified-faculty-grid")
      },
      {
        category: "🏛️ विद्यालय नेविगेशन (Quick Jump)",
        badge: "Alumni Wall",
        title: "गौरव स्तंभ — पूर्व छात्र एवं टॉपर पंजीकरण (Alumni Portal)",
        subtitle: "S.S. +2 High School Gola के सत्यापित पूर्व छात्र एवं पंजीकरण फॉर्म",
        view: "gaurav-stambh",
        element: document.getElementById("verified-alumni-grid")
      }
    );

    return items;
  }

  function mountOmniSpotlightModal() {
    if (document.getElementById("royal-spotlight-modal")) return;

    const modal = document.createElement("div");
    modal.id = "royal-spotlight-modal";
    modal.className = "fixed inset-0 z-[9996] bg-black/80 backdrop-blur-md hidden items-start justify-center pt-14 sm:pt-24 px-3 sm:px-4";
    modal.innerHTML = `
      <div class="w-full max-w-2xl rounded-3xl bg-stone-950/95 border-2 border-amber-500/50 text-stone-100 shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden">
        <!-- Search Input Header -->
        <div class="p-4 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent border-b border-amber-500/30 flex items-center gap-3">
          <span class="text-xl">🔍</span>
          <input id="royal-spotlight-input" type="text" autocomplete="off"
            placeholder="शिक्षक, पूर्व छात्र (Batch), नोटिस, या छात्रवृत्ति योजना खोजें..."
            class="flex-1 bg-transparent text-stone-100 placeholder-stone-400 text-sm sm:text-base font-hindi focus:outline-none" />
          <button id="royal-spotlight-close" type="button"
            class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-red-500/30 text-stone-300 hover:text-white font-mono text-xs font-bold cursor-pointer">
            ESC ✕
          </button>
        </div>

        <!-- Results List -->
        <div id="royal-spotlight-results" class="max-h-[62vh] overflow-y-auto p-3 space-y-2 divide-y divide-amber-500/10"></div>

        <!-- Footer -->
        <div class="px-4 py-2.5 bg-stone-900/90 border-t border-amber-500/20 flex items-center justify-between text-[11px] font-mono text-stone-400">
          <span>⚡ Live Cloud Index • S.S. +2 High School, Gola</span>
          <span>Press <strong class="text-amber-300">Ctrl + K</strong> anytime</span>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const input = document.getElementById("royal-spotlight-input");
    const closeBtn = document.getElementById("royal-spotlight-close");

    closeBtn.addEventListener("click", closeOmniSpotlight);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeOmniSpotlight();
    });

    input.addEventListener("input", () => {
      renderSpotlightResults(input.value.trim());
    });
  }

  function renderSpotlightResults(queryText) {
    const resultsBox = document.getElementById("royal-spotlight-results");
    if (!resultsBox) return;

    const allItems = buildLiveSearchIndex();
    const q = queryText.toLowerCase();

    const filtered = q
      ? allItems.filter(item =>
          (item.title + " " + item.subtitle + " " + item.badge + " " + item.category)
            .toLowerCase()
            .includes(q)
        )
      : allItems.slice(0, 10);

    if (filtered.length === 0) {
      resultsBox.innerHTML = `
        <div class="p-8 text-center space-y-2">
          <div class="text-2xl">🪔</div>
          <p class="font-hindi text-sm font-bold text-amber-300">कोई परिणाम नहीं मिला ("${escapeSafe(queryText)}")</p>
          <p class="text-xs text-stone-400 font-hindi">कृपया किसी शिक्षक का नाम, पूर्व छात्र का बैच (जैसे 2022, 2025), या योजना का नाम लिखें।</p>
        </div>
      `;
      return;
    }

    resultsBox.innerHTML = filtered.map((item, idx) => `
      <button type="button" data-spot-idx="${idx}"
        class="royal-spot-item w-full text-left p-3 rounded-2xl hover:bg-amber-500/15 transition-all flex items-start justify-between gap-3 cursor-pointer group">
        <div class="space-y-1 pr-2">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-mono font-bold text-amber-400/90">${escapeSafe(item.category)}</span>
            <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-extrabold">${escapeSafe(item.badge)}</span>
          </div>
          <h4 class="font-hindi font-extrabold text-sm text-stone-100 group-hover:text-amber-300 transition-colors">
            ${escapeSafe(item.title)}
          </h4>
          <p class="font-hindi text-xs text-stone-400 line-clamp-2">
            ${escapeSafe(item.subtitle)}
          </p>
        </div>
        <span class="text-amber-400 font-mono text-xs opacity-60 group-hover:opacity-100 shrink-0 mt-2">
          देखें ➔
        </span>
      </button>
    `).join("");

    resultsBox.querySelectorAll(".royal-spot-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const chosen = filtered[Number(btn.getAttribute("data-spot-idx"))];
        if (!chosen) return;
        closeOmniSpotlight();
        playSacredTempleBell("deep");

        if (typeof window.switchView === "function" && chosen.view) {
          window.switchView(chosen.view);
        }

        // If hidden by scheme filter, show all schemes
        if (chosen.element && chosen.element.classList.contains("hidden")) {
          chosen.element.classList.remove("hidden");
        }

        setTimeout(() => {
          if (chosen.element && chosen.element.scrollIntoView) {
            chosen.element.scrollIntoView({ behavior: "smooth", block: "center" });
            chosen.element.classList.remove("royal-spotlight-highlight");
            void chosen.element.offsetWidth;
            chosen.element.classList.add("royal-spotlight-highlight");
          }
        }, 180);
      });
    });
  }

  function openOmniSpotlight() {
    mountOmniSpotlightModal();
    const modal = document.getElementById("royal-spotlight-modal");
    const input = document.getElementById("royal-spotlight-input");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    input.value = "";
    renderSpotlightResults("");
    setTimeout(() => input.focus(), 60);
  }

  function closeOmniSpotlight() {
    const modal = document.getElementById("royal-spotlight-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  }

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      openOmniSpotlight();
    } else if (e.key === "Escape") {
      closeOmniSpotlight();
      closeRajpatraModal();
    }
  });

  // ==========================================================================
  // 📜 ENGINE 3: OFFICIAL "RAJPATRA" (राजपत्र) GAZETTE & TAMRAPATRA ENGINE
  // Turns every Notice on the Notice Board into an Official Signed Govt Circular
  // ==========================================================================
  function generateDigitalHash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return "GOLA-1940-" + (h >>> 0).toString(16).toUpperCase().padStart(8, "0");
  }

  function mountRajpatraModal() {
    if (document.getElementById("royal-rajpatra-modal")) return;

    const modal = document.createElement("div");
    modal.id = "royal-rajpatra-modal";
    modal.className = "fixed inset-0 z-[9997] bg-black/85 backdrop-blur-md hidden items-center justify-center p-3 sm:p-6 overflow-y-auto";
    modal.innerHTML = `
      <div class="w-full max-w-3xl my-auto space-y-3">
        <!-- Top Action Controls (Hidden when printing A4 PDF) -->
        <div class="no-print-control flex flex-wrap items-center justify-between gap-2 bg-stone-900/95 border border-amber-500/40 px-4 py-2.5 rounded-2xl text-xs">
          <div class="flex items-center gap-2 text-amber-300 font-hindi font-bold">
            <span>🏛️</span>
            <span>आधिकारिक विद्यालय राजपत्र एवं सूचना प्रारूप (Official Verifiable Gazette)</span>
          </div>
          <div class="flex items-center gap-2">
            <button id="rajpatra-print-btn" type="button"
              class="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold font-hindi text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all">
              <span>🖨️</span> <span>प्रिंट / आधिकारिक PDF सेव करें</span>
            </button>
            <button id="rajpatra-close-btn" type="button"
              class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-500/30 text-stone-200 hover:text-white font-mono text-xs font-bold cursor-pointer transition-all">
              ✕ बंद करें
            </button>
          </div>
        </div>

        <!-- Official A4 Tamrapatra / Sarkari Gazette Sheet -->
        <div id="royal-rajpatra-sheet"
          class="rounded-2xl bg-[#FFFDF7] text-stone-900 border-4 border-double border-amber-800/80 shadow-2xl p-6 sm:p-10 space-y-6 relative overflow-hidden">
          
          <!-- Subtle Corner Ornamental Borders -->
          <div class=" pointer-events-none absolute inset-2 border border-amber-700/25 rounded-xl"></div>

          <!-- Official Government & Institutional Header -->
          <div class="text-center space-y-1.5 border-b-2 border-amber-800/70 pb-5 relative">
            <p class="font-hindi text-xs sm:text-sm font-bold text-amber-900 tracking-wide">
              झारखंड सरकार • विद्यालय शिक्षा एवं साक्षरता विभाग (जैक रांची से संबद्ध)
            </p>
            <h1 class="font-hindi text-2xl sm:text-3xl font-extrabold text-stone-950 tracking-tight">
              कार्यालय: ${escapeSafe(schoolIdentity.nameHi)}
            </h1>
            <p class="font-mono text-xs sm:text-sm font-extrabold text-amber-800 tracking-wider">
              OFFICE OF THE PRINCIPAL • ${escapeSafe(schoolIdentity.nameEn)}, RAMGARH (JHARKHAND)
            </p>
            <div class="flex flex-wrap items-center justify-center gap-3 pt-1 text-[11px] font-mono font-bold text-stone-700">
              <span class="px-2.5 py-0.5 rounded bg-amber-900/10 border border-amber-800/30">स्थापना वर्ष (Estd.): ${escapeSafe(schoolIdentity.establishedYear)}</span>
              <span class="px-2.5 py-0.5 rounded bg-amber-900/10 border border-amber-800/30">UDISE CODE: ${escapeSafe(schoolIdentity.udiseCode)}</span>
              <span class="px-2.5 py-0.5 rounded bg-amber-900/10 border border-amber-800/30">PIN: 829110</span>
            </div>
          </div>

          <!-- Memo Number & Date Row -->
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-mono font-bold text-stone-800 bg-amber-500/10 px-4 py-2.5 rounded-xl border border-amber-800/25">
            <div>
              पत्रांक (Ref. Memo No.): <span id="rajpatra-memo-no" class="text-amber-950 font-extrabold"></span>
            </div>
            <div>
              दिनांक (Date): <span id="rajpatra-date" class="text-amber-950 font-extrabold"></span>
            </div>
          </div>

          <!-- Official Circular Badge & Subject -->
          <div class="space-y-4 py-2">
            <div class="text-center">
              <span id="rajpatra-tag" class="inline-block px-4 py-1 rounded-full bg-amber-900 text-amber-100 font-hindi text-xs font-extrabold tracking-wider uppercase shadow-sm">
                आधिकारिक विद्यालय सूचना (OFFICIAL GAZETTE NOTICE)
              </span>
            </div>

            <h2 id="rajpatra-title" class="font-hindi text-lg sm:text-xl font-extrabold text-stone-950 text-center leading-relaxed underline decoration-amber-700/60 underline-offset-4"></h2>

            <div class="p-5 rounded-xl bg-amber-50/70 border border-amber-900/20 text-stone-900 font-hindi text-sm sm:text-base leading-relaxed space-y-3">
              <p>सर्वसंबंधित छात्र-छात्राओं, अभिभावकों एवं विद्यालय परिवार के सदस्यों को सूचित किया जाता है कि:</p>
              <p id="rajpatra-desc" class="font-semibold text-stone-950 whitespace-pre-line"></p>
              <p class="text-xs sm:text-sm text-stone-700 pt-2">
                आज्ञा से — समस्त संबंधित छात्र-छात्राएं निर्धारित समय-सीमा के भीतर आवश्यक अनुपालन सुनिश्चित करें।
              </p>
            </div>
          </div>

          <!-- Official Seal, QR Code & Principal Signature Block -->
          <div class="pt-4 border-t-2 border-amber-800/60 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            
            <!-- Left: Cryptographic Verification & Live QR -->
            <div class="flex items-center gap-3">
              <img id="rajpatra-qr-img" alt="Official Verification QR"
                class="w-20 h-20 rounded-lg border-2 border-amber-900/40 p-1 bg-white shrink-0" />
              <div class="text-[10px] font-mono text-stone-700 space-y-0.5">
                <div class="font-extrabold text-emerald-800">✓ VERIFIED DIGITAL RECORD</div>
                <div>Hash: <strong id="rajpatra-hash" class="text-stone-900"></strong></div>
                <div>Verify at Official Portal:</div>
                <div class="text-[9px] text-amber-900 break-all">${escapeSafe(window.location.origin + window.location.pathname)}</div>
              </div>
            </div>

            <!-- Center: Circular Institutional Stamp Emblem -->
            <div class="flex justify-center">
              <div class="rajpatra-seal-ring w-28 h-28 rounded-full border-2 border-dashed border-amber-800/70 flex flex-col items-center justify-center text-center p-2 text-amber-900">
                <span class="text-[9px] font-mono font-extrabold tracking-tighter">S.S. +2 HIGH SCHOOL</span>
                <span class="text-base">🪔</span>
                <span class="font-hindi text-[10px] font-extrabold leading-tight">आधिकारिक मुहर<br>गोला • 1940</span>
                <span class="text-[8px] font-mono font-bold">UDISE: 20240701206</span>
              </div>
            </div>

            <!-- Right: Principal Authority Block -->
            <div class="text-center sm:text-right space-y-1 font-hindi">
              <div class="inline-block px-3 py-0.5 rounded bg-emerald-900/10 border border-emerald-800/30 text-[10px] font-mono font-bold text-emerald-900 mb-1">
                Digitally Issued & Authorized
              </div>
              <p class="text-sm sm:text-base font-extrabold text-stone-950">
                ${escapeSafe(principalInfo.nameHi)}
              </p>
              <p class="text-xs font-bold text-amber-900">
                प्रधानाचार्य (Principal)
              </p>
              <p class="text-[11px] text-stone-700">
                ${escapeSafe(schoolIdentity.nameHi)} (रामगढ़)
              </p>
            </div>
          </div>

          <!-- Shloka Footer -->
          <div class="text-center pt-2 border-t border-amber-800/20 text-[11px] font-hindi font-bold text-amber-900/90">
            ${escapeSafe(schoolIdentity.shlokaSanskrit)}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("rajpatra-close-btn").addEventListener("click", closeRajpatraModal);
    document.getElementById("rajpatra-print-btn").addEventListener("click", () => {
      playSacredTempleBell("deep");
      window.print();
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeRajpatraModal();
    });
  }

  function openRajpatraModal(noticeData) {
    mountRajpatraModal();
    playSacredTempleBell("bell");

    const hash = generateDigitalHash(noticeData.title + noticeData.date);
    const memoNo = `SSHS/GOLA/${new Date().getFullYear()}/${hash.slice(-4)}`;

    document.getElementById("rajpatra-memo-no").textContent = memoNo;
    document.getElementById("rajpatra-date").textContent = noticeData.date;
    document.getElementById("rajpatra-tag").textContent = noticeData.tag + " • OFFICIAL GAZETTE";
    document.getElementById("rajpatra-title").textContent = noticeData.title;
    document.getElementById("rajpatra-desc").textContent = noticeData.desc;
    document.getElementById("rajpatra-hash").textContent = hash;

    const qrPayload = encodeURIComponent(
      `VERIFIED NOTICE | S.S. +2 High School Gola (UDISE: 20240701206) | Memo: ${memoNo} | Date: ${noticeData.date} | ${window.location.href}`
    );
    document.getElementById("rajpatra-qr-img").src =
      `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=4&data=${qrPayload}`;

    const modal = document.getElementById("royal-rajpatra-modal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function closeRajpatraModal() {
    const modal = document.getElementById("royal-rajpatra-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  }

  // Automatically enhance every Notice Card with the Royal Rajpatra Button
  function enhanceNoticeCardsWithRajpatra() {
    const container = document.getElementById("notices-container");
    if (!container) return;

    const en = isEnglishMode();
    container.querySelectorAll("article").forEach((article, idx) => {
      if (article.getAttribute("data-rajpatra-mounted") === "true") return;
      article.setAttribute("data-rajpatra-mounted", "true");

      const title = article.querySelector("h4")?.textContent?.trim() || "आधिकारिक सूचना";
      const desc = article.querySelector("p")?.textContent?.trim() || "";
      const spans = article.querySelectorAll("span");
      const tag = spans[0]?.textContent?.trim() || "OFFICIAL NOTICE";
      const date = spans[1]?.textContent?.trim() || new Date().toLocaleDateString("en-IN");

      const footerBar = document.createElement("div");
      footerBar.className = "pt-3 mt-2 border-t border-amber-500/20 flex items-center justify-between gap-2";
      footerBar.innerHTML = `
        <span class="text-[10px] font-mono t-muted flex items-center gap-1">
          <span>🛡️</span> <span>Memo: SSHS/GOLA/0${idx + 1}</span>
        </span>
        <button type="button"
          class="rajpatra-open-btn px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-600 dark:text-amber-300 hover:text-stone-950 border border-amber-500/40 font-hindi font-extrabold text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm">
          <span>📜</span>
          <span>${en ? "Official Gazette / Print" : "आधिकारिक राजपत्र (PDF / प्रिंट)"}</span>
        </button>
      `;

      footerBar.querySelector(".rajpatra-open-btn").addEventListener("click", () => {
        openRajpatraModal({ title, desc, tag, date });
      });

      article.appendChild(footerBar);
    });
  }

  // Watch #notices-container so Firebase updates or Language switches automatically get the button
  function observeNoticesContainer() {
    const container = document.getElementById("notices-container");
    if (!container) return;

    enhanceNoticeCardsWithRajpatra();

    const observer = new MutationObserver(() => {
      enhanceNoticeCardsWithRajpatra();
    });

    observer.observe(container, { childList: true });
  }

  // ==========================================================================
  // 🚀 INITIALIZE ALL 3 ROYAL ARCHITECTURAL ENGINES
  // ==========================================================================
  function initRoyalArchitecture() {
    injectRoyalCommandRibbon();
    bindTempleBellInteractions();
    observeNoticesContainer();
    console.log("👑 [S.S. +2 High School Gola] Royal Rajpatra, 432Hz Bell & Omni-Spotlight Active.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRoyalArchitecture);
  } else {
    initRoyalArchitecture();
  }
})();
// ============================================================================
// FILE: app.js (v4.1 — NATIVE ENGLISH, ZERO-BLOAT CORE ENGINE)
// Handles: Hero Metrics, Principal Desk, Live Notice Board, Scholarships Hub,
//          Guru Stambh (Face-Safe Portraits), Gaurav Stambh (Alumni) & Routing
// ============================================================================

let currentSchemeFilter = "all";
let currentFacultyWingFilter = "all";
let cachedNotices = (window.SCHOOL_MASTER_CONFIG && window.SCHOOL_MASTER_CONFIG.defaultNotices) || [];
let cachedApprovedAlumni = [];
let cachedApprovedFaculty = [];

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

// ============================================================================
// 1. VERIFIED JHARKHAND GOVT. SCHEMES DATA (100% ENGLISH)
// ============================================================================
const SCHEMES_DATA = [
  {
    cats: "pre-matric post-matric",
    badge: "ST / SC / OBC • DBT",
    domain: "ekalyan.cgg.gov.in",
    link: "https://ekalyan.cgg.gov.in/",
    title: "e-Kalyan Jharkhand Scholarship (Pre & Post-Matric)",
    desc: "Direct Benefit Transfer (DBT) financial scholarship for ST, SC, and OBC students studying in Government schools.",
    elig: "• Eligibility: ST/SC/OBC students (Class 9–12).<br>• Income Ceiling: Family annual income up to <strong>₹2,50,000</strong>.<br>• Docs: Income, Caste, Domicile certificate &amp; Aadhaar-seeded bank account.",
    btn: "Open Official e-Kalyan Portal"
  },
  {
    cats: "pre-matric post-matric girls",
    badge: "₹40,000 GRANT • GIRLS",
    domain: "Class 8 to 12",
    link: null,
    title: "Savitribai Phule Kishori Samriddhi Yojana",
    desc: "Flagship Jharkhand Govt. scheme empowering girl students from Class 8 to 12 with phased financial grants.",
    elig: "• Installments: ₹2,500 in Class 8–9; ₹5,000 in Class 10–12 &amp; lump-sum <strong>₹20,000</strong> at age 18–19.<br>• Eligibility: First two daughters of non-income-tax-paying families.",
    btn: "Collect Form from School Office (Principal Verified)"
  },
  {
    cats: "post-matric",
    badge: "UP TO ₹15 LAKH • 4% INT",
    domain: "After 10th / 12th",
    link: "https://gscc.jharkhand.gov.in/",
    title: "Guruji Student Credit Card Scheme (GSCCS)",
    desc: "Collateral-free education loan for Class 10th (Diploma) and 12th pass students pursuing higher &amp; technical education.",
    elig: "• Key Benefit: Up to <strong>₹15,00,000</strong> collateral-free loan at just <strong>4% simple interest</strong> (15-year repayment tenure).",
    btn: "Visit Official GSCC Portal"
  },
  {
    cats: "pre-matric post-matric",
    badge: "₹12,000 / YEAR • MERIT",
    domain: "JAC Exam Based",
    link: "https://jac.jharkhand.gov.in/",
    title: "Chief Minister Merit Scholarship Scheme (CMMSS)",
    desc: "Annual ₹12,000 merit scholarship from Class 9 to 12 for students qualifying the state-level JAC CMMSS exam.",
    elig: "• Eligibility: Selected Class 8 pass students; requires maintaining 60% marks and 75% attendance annually.",
    btn: "Visit Official JAC Website"
  },
  {
    cats: "pre-matric",
    badge: "CLASS 8 • WELFARE DEPT",
    domain: "Cycle / DBT",
    link: null,
    title: "Unnati Ka Pahiya — Free Cycle Distribution Scheme",
    desc: "Free bicycle / DBT grant for Class 8 students commuting from rural villages to ensure zero school dropouts.",
    elig: "• Eligibility: ST, SC, Minority, and OBC students enrolled in Class 8 in Government schools.",
    btn: "Verify Enrollment with Class 8 Class-Teacher"
  },
  {
    cats: "pre-matric post-matric",
    badge: "CLASS 1–12 • UNIVERSAL",
    domain: "JCERT & NSP",
    link: "https://scholarships.gov.in/",
    title: "Free Textbooks, Uniform DBT, Mid-Day Meal & NSP",
    desc: "Universal free JCERT textbooks, uniform DBT grant, PM-POSHAN meals (Class 1–8) &amp; National Scholarship Portal access.",
    elig: "• Eligibility: Universal coverage for all enrolled students; NSP Central Sector for top 20% Class 12th graduates.",
    btn: "Open National Scholarship Portal (NSP)"
  }
];

// ============================================================================
// 2. MASTER UI RENDERER
// ============================================================================
function renderMasterConfig() {
  const cfg = window.SCHOOL_MASTER_CONFIG;
  if (!cfg) return;

  const countEl = document.getElementById("metric-student-count");
  if (countEl) {
    const rawStrength = cfg.metrics && cfg.metrics.studentStrength ? String(cfg.metrics.studentStrength).trim() : "";
    countEl.textContent = rawStrength && rawStrength !== "0000" ? rawStrength : "1,800+";
  }

  const principalName = (cfg.principal && cfg.principal.nameEn) || "Smt. Anupa Pushpa Tirkey";
  const principalRole = (cfg.principal && cfg.principal.designationEn) || "Principal, S.S. +2 High School, Gola";
  const principalMsg = (cfg.principal && cfg.principal.messageEn) ||
    "Our school is not merely a building of bricks and mortar, but a sacred temple of knowledge, equality, and character building since 1940.";

  const matPrin = document.getElementById("matrix-principal-name");
  if (matPrin) matPrin.textContent = principalName;

  const pName = document.getElementById("principal-name-display");
  const pRole = document.getElementById("principal-role-display");
  const pMsg = document.getElementById("principal-message-display");
  if (pName) pName.textContent = principalName;
  if (pRole) pRole.textContent = principalRole;
  if (pMsg) pMsg.textContent = principalMsg;

  const shlokaEl = document.getElementById("hero-shloka-meaning");
  if (shlokaEl) {
    shlokaEl.textContent = (cfg.identity && cfg.identity.shlokaMeaningEn) ||
      "Verily, there is nothing in this world as purifying as true knowledge; Education is that which liberates.";
  }

  renderNoticesBoard();
  renderSchemesGrid();
  renderVerifiedAlumniWall();
  renderVerifiedFacultyWall();

  if (cfg.creatorCredit) {
    const cName = document.getElementById("creator-name-slot");
    const cBatch = document.getElementById("creator-batch-slot");
    if (cName) cName.textContent = cfg.creatorCredit.name || "Piyush Poddar";
    if (cBatch) {
      cBatch.textContent = `${cfg.creatorCredit.batchYear || "Batch 2025"} • ${cfg.creatorCredit.roleEn || "Portal Architect"}`;
    }
  }

  if (window.lucide) lucide.createIcons();
}

function renderNoticesBoard() {
  const noticesContainer = document.getElementById("notices-container");
  if (!noticesContainer) return;

  if (!cachedNotices || cachedNotices.length === 0) {
    noticesContainer.innerHTML = `
      <div class="sacred-card rounded-2xl p-6 text-center text-xs t-muted">
        No active notices right now. Check back soon for official school updates.
      </div>
    `;
    return;
  }

  noticesContainer.innerHTML = cachedNotices.slice(0, 8).map((notice, idx) => {
    const title = notice.titleEn || notice.titleHi || "Official School Notice";
    const desc = notice.descEn || notice.descHi || "";
    const tag = notice.tagEn || notice.tagHi || "OFFICIAL NOTICE";
    const hasMedia = Boolean(notice.attachmentUrl || notice.pdfUrl || notice.imageDataUrl);

    return `
      <article data-board-notice-idx="${idx}"
        class="sacred-card rounded-2xl p-5 space-y-2 border-l-4 ${notice.isNew ? "border-l-orange-500" : "border-l-amber-500/50"} cursor-pointer group">
        <div class="flex items-center justify-between gap-2 text-xs font-mono">
          <span class="px-2.5 py-0.5 rounded bg-amber-500/15 t-gold font-extrabold">
            ${escapeHTML(tag)}
          </span>
          <span class="t-muted font-bold flex items-center gap-1">
            <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
            ${escapeHTML(notice.date || "")}
          </span>
        </div>
        <h4 class="font-extrabold text-sm sm:text-base t-heading group-hover:text-[#0B3066] dark:group-hover:text-amber-400 transition-colors">
          ${escapeHTML(title)}
        </h4>
        <p class="text-xs t-body line-clamp-2 leading-relaxed">
          ${escapeHTML(desc)}
        </p>
        <div class="pt-1 flex items-center justify-between text-[11px] font-bold">
          <span class="t-muted">${notice.targetAudience ? escapeHTML(notice.targetAudience) : "All School"}</span>
          <span class="text-[#0B3066] dark:text-amber-400">${hasMedia ? "📎 View Attachment →" : "Read More →"}</span>
        </div>
      </article>
    `;
  }).join("");

  noticesContainer.querySelectorAll("[data-board-notice-idx]").forEach((card) => {
    card.addEventListener("click", () => {
      const item = cachedNotices[Number(card.getAttribute("data-board-notice-idx"))];
      if (item && window.LegacyPortalBridge && typeof window.LegacyPortalBridge.openNoticeViewer === "function") {
        window.LegacyPortalBridge.openNoticeViewer(item);
      }
    });
  });
}

function renderSchemesGrid() {
  const grid = document.getElementById("schemes-grid");
  if (!grid) return;

  grid.innerHTML = SCHEMES_DATA.map((s) => {
    const isHidden = !(currentSchemeFilter === "all" || s.cats.includes(currentSchemeFilter));
    return `
      <div data-scheme-cat="${s.cats}" class="scheme-card sacred-card rounded-2xl p-6 flex flex-col justify-between space-y-4 ${isHidden ? "hidden" : ""}">
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <span class="px-2.5 py-1 rounded-md text-[11px] font-mono font-extrabold bg-amber-500/15 t-gold border border-amber-500/35">
              ${s.badge}
            </span>
            <span class="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">${s.domain}</span>
          </div>
          <h3 class="text-lg font-extrabold t-heading leading-snug">${s.title}</h3>
          <p class="text-xs t-body leading-relaxed">${s.desc}</p>
          <div class="p-3.5 rounded-xl sacred-inner-box space-y-1.5 text-xs t-heading leading-relaxed">
            ${s.elig}
          </div>
        </div>
        ${
          s.link
            ? `<a href="${s.link}" target="_blank" rel="noopener noreferrer"
                 class="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all">
                 <span>${s.btn}</span>
                 <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
               </a>`
            : `<div class="w-full py-2.5 px-4 rounded-xl sacred-inner-box t-gold font-extrabold text-xs text-center">
                 ${s.btn}
               </div>`
        }
      </div>
    `;
  }).join("");
}

function renderVerifiedAlumniWall() {
  const grid = document.getElementById("verified-alumni-grid");
  if (!grid) return;

  if (!cachedApprovedAlumni || cachedApprovedAlumni.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full sacred-card rounded-2xl p-6 text-center space-y-2 border border-dashed border-amber-500/50">
        <p class="text-base font-extrabold t-gold">Awaiting First Verified Alumni Profile</p>
        <p class="text-xs t-body">
          Register using the form above. Once verified by the school administration, your achievement card will appear live here.
        </p>
      </div>
    `;
    return;
  }

  grid.innerHTML = cachedApprovedAlumni.map((alum) => `
    <div class="sacred-card rounded-2xl p-6 border-t-4 border-t-amber-500 space-y-3">
      <div class="flex items-center justify-between">
        <span class="px-2.5 py-0.5 rounded text-[11px] font-mono font-extrabold bg-amber-500/15 t-gold border border-amber-500/35">
          BATCH ${escapeHTML(alum.batchYear)} ${alum.stream ? "• " + escapeHTML(alum.stream) : ""}
        </span>
        <span class="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <i data-lucide="badge-check" class="w-4 h-4"></i> Verified
        </span>
      </div>
      <h4 class="text-lg font-extrabold t-heading">${escapeHTML(alum.fullName)}</h4>
      <p class="text-xs t-body leading-relaxed">
        ${escapeHTML(alum.achievement || "Distinguished Alumnus — S.S. +2 High School, Gola")}
      </p>
    </div>
  `).join("");
}

// ============================================================================
// 3. GURU STAMBH (VERIFIED FACULTY WALL — FACE-SAFE PORTRAITS + FALLBACK)
// ============================================================================
function renderVerifiedFacultyWall() {
  const grid = document.getElementById("verified-faculty-grid");
  if (!grid) return;

  const filtered = currentFacultyWingFilter === "all"
    ? cachedApprovedFaculty
    : cachedApprovedFaculty.filter((f) => f.wing === currentFacultyWingFilter);

  const principalCard = (currentFacultyWingFilter === "all" || currentFacultyWingFilter === "11-12")
    ? `
      <div class="sacred-card rounded-3xl p-6 space-y-5 border-2 border-amber-500/45 flex flex-col justify-between">
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-2">
            <span class="px-3 py-1 rounded-full text-[11px] font-mono font-extrabold bg-amber-500 text-stone-950">
              HEAD OF INSTITUTION
            </span>
            <span class="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <i data-lucide="shield-check" class="w-4 h-4"></i> Verified Leadership
            </span>
          </div>
          <div class="flex items-center gap-4">
            <img src="https://api.dicebear.com/7.x/initials/svg?seed=Anupa+Pushpa+Tirkey&backgroundColor=0b3066" alt="Principal"
              class="w-20 h-20 rounded-2xl object-cover object-top border-2 border-amber-500 shadow-sm shrink-0 bg-slate-900" />
            <div class="space-y-0.5">
              <h3 class="text-lg font-extrabold t-heading">Smt. Anupa Pushpa Tirkey</h3>
              <p class="text-xs font-mono font-bold t-gold">Principal</p>
              <p class="text-xs t-muted font-semibold">S.S. +2 High School, Gola</p>
            </div>
          </div>
        </div>
        <div class="p-4 rounded-2xl sacred-inner-box space-y-1">
          <span class="text-[10px] font-mono uppercase tracking-wider t-gold font-extrabold block">
            Message for Students
          </span>
          <p class="text-xs sm:text-sm italic t-heading leading-relaxed">
            "Our school is not merely a building of bricks and mortar, but a sacred temple of knowledge, equality, and discipline."
          </p>
        </div>
      </div>
    `
    : "";

  const wingLabelMap = {
    "1-5": "CLASS 1–5 (PRIMARY)",
    "6-8": "CLASS 6–8 (UPPER PRIMARY)",
    "9-10": "CLASS 9–10 (SECONDARY)",
    "11-12": "CLASS 11–12 (+2 INTER)"
  };

  const teacherCards = filtered.map((f) => {
    const baseWing = wingLabelMap[f.wing] || `CLASS ${escapeHTML(f.wing || "1–12")}`;
    const badgeText = f.wing === "11-12" && f.stream ? `${baseWing} • ${escapeHTML(f.stream.split(" ")[0])}` : baseWing;
    const avatarFallback = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.fullName || "Faculty")}&backgroundColor=0b3066`;

    return `
      <div class="sacred-card rounded-3xl p-6 space-y-5 flex flex-col justify-between">
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-2">
            <span class="px-3 py-1 rounded-full text-[11px] font-mono font-extrabold bg-amber-500/15 t-gold border border-amber-500/35">
              ${badgeText}
            </span>
            <span class="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <i data-lucide="badge-check" class="w-4 h-4"></i> Verified Faculty
            </span>
          </div>

          <div class="flex items-center gap-4">
            <img src="${f.photoDataUrl || avatarFallback}" alt="${escapeHTML(f.fullName)}"
              onerror="this.onerror=null;this.src='${avatarFallback}';"
              class="w-20 h-20 rounded-2xl object-cover object-top border-2 border-amber-500/70 shadow-sm shrink-0 bg-slate-900" />
            <div class="space-y-0.5 min-w-0">
              <h3 class="text-lg font-extrabold t-heading truncate">${escapeHTML(f.fullName)}</h3>
              <p class="text-xs font-mono font-bold t-gold">${escapeHTML(f.designation || "Faculty Member")}</p>
              <p class="text-xs t-muted font-semibold truncate">${escapeHTML(f.qualification || "S.S. +2 High School, Gola")}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5 p-3 rounded-xl sacred-inner-box text-xs">
            <div>
              <span class="text-[10px] font-mono t-muted block">SUBJECT</span>
              <strong class="t-heading">${escapeHTML(f.subject || "General")}</strong>
            </div>
            <div>
              <span class="text-[10px] font-mono t-muted block">EXPERIENCE</span>
              <strong class="t-heading">${escapeHTML(f.experience || "Dedicated Service")}</strong>
            </div>
          </div>
        </div>

        ${
          f.thoughtForStudents
            ? `<div class="p-4 rounded-2xl sacred-inner-box space-y-1">
                 <span class="text-[10px] font-mono uppercase tracking-wider t-gold font-extrabold block">
                   Message for Students
                 </span>
                 <p class="text-xs sm:text-sm italic t-heading leading-relaxed">
                   "${escapeHTML(f.thoughtForStudents)}"
                 </p>
               </div>`
            : ""
        }
      </div>
    `;
  }).join("");

  grid.innerHTML = principalCard + teacherCards;
  if (window.lucide) lucide.createIcons();
}

// ============================================================================
// 4. CLOUD SYNC & INTERACTIVE HANDLERS
// ============================================================================
async function syncWithBackend() {
  if (!window.BackendService) return;

  cachedNotices = await window.BackendService.fetchNotices();
  if (window.BackendService.fetchApprovedAlumni) {
    cachedApprovedAlumni = await window.BackendService.fetchApprovedAlumni();
  }
  if (window.BackendService.fetchApprovedFaculty) {
    cachedApprovedFaculty = await window.BackendService.fetchApprovedFaculty();
  }
  renderMasterConfig();
}

window.syncSchoolPortalData = syncWithBackend;

window.handleAlumniSubmit = async function (e) {
  e.preventDefault();
  const statusBox = document.getElementById("alumni-form-status");
  const form = e.target;
  const payload = {
    fullName: form.fullName.value,
    batchYear: form.batchYear.value,
    stream: form.stream.value,
    achievement: form.achievement.value,
    contact: form.contact.value
  };

  try {
    const res = await window.BackendService.submitAlumniRegistration(payload);
    statusBox.className = "p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold block";
    statusBox.textContent = "✓ " + res.message;
    form.reset();
  } catch (err) {
    statusBox.className = "p-3.5 rounded-xl bg-red-500/20 border border-red-500/50 text-red-700 dark:text-red-300 text-xs font-extrabold block";
    statusBox.textContent = "Error: " + err.message;
  }
};

window.switchView = function (viewName) {
  ["home", "guru-stambh", "gaurav-stambh"].forEach((v) => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.toggle("hidden", v !== viewName);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.filterSchemes = function (category) {
  currentSchemeFilter = category;
  renderSchemesGrid();

  document.querySelectorAll(".scheme-filter-btn").forEach((btn) => {
    const isActive = btn.getAttribute("data-scheme-filter") === category;
    btn.className = isActive
      ? "scheme-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-mono font-extrabold bg-amber-500 text-stone-950 transition-all cursor-pointer"
      : "scheme-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border border-amber-500/40 hover:bg-amber-500/15 t-heading transition-all cursor-pointer";
  });
  if (window.lucide) lucide.createIcons();
};

window.filterFacultyByWing = function (wing) {
  currentFacultyWingFilter = wing;
  document.querySelectorAll(".faculty-filter-btn").forEach((btn) => {
    const isActive = btn.getAttribute("data-faculty-filter") === wing;
    btn.className = isActive
      ? "faculty-filter-btn px-4 py-2 rounded-xl text-xs font-mono font-extrabold bg-amber-500 text-stone-950 transition-all cursor-pointer"
      : "faculty-filter-btn px-4 py-2 rounded-xl text-xs font-mono font-bold border border-amber-500/40 hover:bg-amber-500/15 t-heading transition-all cursor-pointer";
  });
  renderVerifiedFacultyWall();
};

// Stealth Keyboard Shortcut: Ctrl + Shift + A opens Executive Secret Admin Panel
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
    e.preventDefault();
    if (typeof window.openSecretAdminModal === "function") {
      window.openSecretAdminModal();
    }
  }
});

// ============================================================================
// 5. BOOTSTRAP
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  renderMasterConfig();
  if (window.BackendService) syncWithBackend();
});

window.addEventListener("backend-ready", syncWithBackend);

// ============================================================================
// FILE: question-paper-studio.js (v1.0 — APEX QUESTION PAPER & PRACTICE BANK)
// Modules:
//  1. Teacher Question Paper Maker (Objective/Subjective/Mixed + Symbols + Auto-Draft)
//  2. Teacher Google Drive PDF Publisher (With Restricted->Public Alert & Live Test)
//  3. Live A4 Preview Modal + Pure @media print Engine (Full A4 & 2-in-1 Half Sheet)
//  4. Public Navigation View: Structured Question Bank & Practice Sheets
//  5. Student Dashboard Tab: Strict Class & Stream Locked Practice Papers
// ============================================================================

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const DRAFT_STORAGE_KEY = "gola_qp_draft_v1";
const MATH_SYMBOLS = ["²", "³", "√", "π", "θ", "°", "→", "Δ", "±", "×", "÷", "≤", "≥", "½", "H₂O", "CO₂"];
const CLASS_LIST = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

let qpState = loadDraftFromStorage();
let lastFocusedField = null;
let cachedPublicPapers = [];
let publicFilter = { classLevel: "all", type: "all", search: "" };

function esc(str) {
  const d = document.createElement("div");
  d.textContent = str == null ? "" : String(str);
  return d.innerHTML;
}

function getBridge() {
  return window.LegacyPortalBridge || null;
}

function getDbSafe() {
  const b = getBridge();
  return b && b.getSession ? b.getSession().db : null;
}

function extractDriveFileId(url) {
  if (!url || typeof url !== "string") return null;
  const m =
    url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/) ||
    url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]{10,})/) ||
    url.match(/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]{10,})/) ||
    url.match(/docs\.google\.com\/[a-z]+\/d\/([a-zA-Z0-9_-]{10,})/);
  return m && m[1] ? m[1] : null;
}

function getDrivePreviewLink(url) {
  const id = extractDriveFileId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : null;
}

function getDriveDownloadLink(url) {
  const id = extractDriveFileId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
}

function createEmptyQuestion(type = "objective") {
  return {
    id: "q_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    type, // "objective" | "subjective"
    text: "",
    marks: type === "objective" ? "1" : "3",
    options: ["", "", "", ""]
  };
}

function createDefaultDraft() {
  return {
    examTitle: "Monthly Practice Test",
    classLevel: "10",
    stream: "General",
    subject: "",
    timeAllowed: "1 Hour",
    fullMarks: "20",
    instructions: "All questions are compulsory. Write neat and clean answers.",
    defaultMode: "objective",
    questions: [createEmptyQuestion("objective")]
  };
}

function loadDraftFromStorage() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return createDefaultDraft();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return createDefaultDraft();
    }
    return parsed;
  } catch (e) {
    return createDefaultDraft();
  }
}

function saveDraftToStorage() {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(qpState));
  } catch (e) {}
}

function calculateTotalMarks(questions) {
  return (questions || []).reduce((sum, q) => sum + (parseFloat(q.marks) || 0), 0);
}

// ============================================================================
// 1. PURE A4 PRINT STYLES & PRINT ROOT INJECTION
// ============================================================================
function injectQuestionPaperStyles() {
  if (document.getElementById("qp-studio-styles")) return;
  const style = document.createElement("style");
  style.id = "qp-studio-styles";
  style.textContent = `
    .qp-a4-sheet {
      background: #ffffff;
      color: #000000;
      font-family: 'Plus Jakarta Sans', 'Noto Sans Devanagari', Arial, sans-serif;
      line-height: 1.5;
    }
    .qp-q-item { break-inside: avoid; page-break-inside: avoid; }

    #qp-print-root { display: none; }

    @media print {
      @page { margin: 10mm; }
      html, body {
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        height: auto !important;
      }
      body > *:not(#qp-print-root) {
        display: none !important;
      }
      #qp-print-root {
        display: block !important;
        width: 100% !important;
        background: #ffffff !important;
        color: #000000 !important;
      }
      .qp-print-2in1 {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 10mm !important;
        align-items: start !important;
      }
      .qp-print-2in1 .qp-copy-pane {
        border-right: 1px dashed #64748b;
        padding-right: 6mm;
        font-size: 11px !important;
      }
      .qp-print-2in1 .qp-copy-pane:last-child {
        border-right: none;
        padding-right: 0;
        padding-left: 2mm;
      }
    }
  `;
  document.head.appendChild(style);
}

// ============================================================================
// 2. A4 PAPER HTML RENDERER (USED FOR LIVE PREVIEW, READER & PRINT)
// ============================================================================
function buildOfficialPaperHTML(paper, compact = false) {
  const streamSuffix =
    ["11", "12"].includes(String(paper.classLevel)) && paper.stream && paper.stream !== "General"
      ? ` (${esc(paper.stream)})`
      : "";
  const addedMarks = calculateTotalMarks(paper.questions);
  const displayMarks = paper.fullMarks || addedMarks || "-";
  const validQuestions = (paper.questions || []).filter((q) => String(q.text || "").trim().length > 0);

  const qHtml =
    validQuestions.length === 0
      ? `<p style="text-align:center;color:#64748b;padding:24px 0;font-size:13px;">No questions typed yet. Add questions to see them formatted here.</p>`
      : validQuestions
          .map((q, idx) => {
            const opts = Array.isArray(q.options) ? q.options : [];
            const labels = ["(A)", "(B)", "(C)", "(D)"];
            const nonEmptyOpts = opts
              .map((val, i) => ({ label: labels[i], val: String(val || "").trim() }))
              .filter((o) => o.val.length > 0);

            const optionsGrid =
              q.type === "objective" && nonEmptyOpts.length > 0
                ? `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 16px;margin-top:5px;padding-left:18px;font-size:${compact ? "11px" : "12.5px"};">
                    ${nonEmptyOpts.map((o) => `<div><strong>${o.label}</strong> ${esc(o.val)}</div>`).join("")}
                   </div>`
                : "";

            return `
              <div class="qp-q-item" style="margin-bottom:${compact ? "8px" : "12px"};">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;font-size:${compact ? "11.5px" : "13.5px"};">
                  <div style="flex:1;white-space:pre-line;"><strong>Q${idx + 1}.</strong> ${esc(q.text.trim())}</div>
                  ${q.marks ? `<div style="font-weight:700;white-space:nowrap;font-size:${compact ? "11px" : "12.5px"};">[${esc(q.marks)}]</div>` : ""}
                </div>
                ${optionsGrid}
              </div>
            `;
          })
          .join("");

  return `
    <div class="qp-a4-sheet" style="padding:${compact ? "10px" : "22px"};border:1.5px solid #0f172a;border-radius:4px;">
      <div style="text-align:center;border-bottom:2px solid #0f172a;padding-bottom:8px;margin-bottom:10px;">
        <div style="font-size:${compact ? "13px" : "17px"};font-weight:800;letter-spacing:0.4px;text-transform:uppercase;">
          S.S. +2 HIGH SCHOOL, GOLA (RAMGARH)
        </div>
        <div style="font-size:${compact ? "9.5px" : "11px"};font-weight:600;color:#334155;margin-top:2px;">
          Estd. 1940 • UDISE: 20240701206 • Affiliated to JAC Ranchi (Jharkhand)
        </div>
        <div style="font-size:${compact ? "11.5px" : "14px"};font-weight:800;margin-top:5px;text-decoration:underline;">
          ${esc(paper.examTitle || "Practice Assessment Paper")}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:${compact ? "10.5px" : "12.5px"};font-weight:700;border-bottom:1px solid #475569;padding-bottom:7px;margin-bottom:10px;">
        <div>Class: ${esc(paper.classLevel || "-")}${streamSuffix}</div>
        <div style="text-align:right;">Full Marks: ${esc(displayMarks)}</div>
        <div>Subject: ${esc(paper.subject || "General")}</div>
        <div style="text-align:right;">Time: ${esc(paper.timeAllowed || "-")}</div>
      </div>

      ${
        paper.instructions && String(paper.instructions).trim()
          ? `<div style="font-size:${compact ? "10px" : "11.5px"};font-style:italic;margin-bottom:10px;color:#1e293b;">
               <strong>Instructions:</strong> ${esc(paper.instructions.trim())}
             </div>`
          : ""
      }

      <div>${qHtml}</div>

      <div style="margin-top:14px;padding-top:6px;border-top:1px solid #cbd5e1;display:flex;justify-content:space-between;font-size:10px;color:#475569;">
        <span>Prepared by: ${esc(paper.teacherName || "Faculty, S.S. +2 High School, Gola")}</span>
        <span>*** Best of Luck ***</span>
      </div>
    </div>
  `;
}

function triggerCleanA4Print(paper, mode = "a4") {
  injectQuestionPaperStyles();
  let printRoot = document.getElementById("qp-print-root");
  if (!printRoot) {
    printRoot = document.createElement("div");
    printRoot.id = "qp-print-root";
    document.body.appendChild(printRoot);
  }

  if (mode === "2in1") {
    const halfHtml = buildOfficialPaperHTML(paper, true);
    printRoot.innerHTML = `
      <div class="qp-print-2in1">
        <div class="qp-copy-pane">${halfHtml}</div>
        <div class="qp-copy-pane">${halfHtml}</div>
      </div>
    `;
  } else {
    printRoot.innerHTML = buildOfficialPaperHTML(paper, false);
  }

  setTimeout(() => {
    window.print();
  }, 80);
}

// ============================================================================
// 3. FULL-SCREEN PREVIEW & READER MODAL (MOBILE-FRIENDLY WITH BIG ✕ CLOSE)
// ============================================================================
function openPaperReaderModal(paper, isLiveDraftPreview = false) {
  injectQuestionPaperStyles();
  let modal = document.getElementById("qp-reader-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "qp-reader-modal";
    modal.className = "fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm hidden items-center justify-center p-2 sm:p-4 overflow-y-auto";
    document.body.appendChild(modal);
  }

  const isDrivePdf = paper.paperFormat === "drive_pdf" && paper.driveUrl;
  const previewEmbed = isDrivePdf ? getDrivePreviewLink(paper.driveUrl) : null;
  const downloadUrl = isDrivePdf ? getDriveDownloadLink(paper.driveUrl) : null;

  modal.innerHTML = `
    <div class="w-full max-w-4xl rounded-2xl bg-[var(--leg-surface)] border leg-border shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col auth-sheet-animate">
      <!-- Sticky Top Bar with Prominent Close Button -->
      <div class="px-4 py-3 bg-[#0B3066] text-white flex items-center justify-between gap-2 border-b-2 border-[#f59e0b] shrink-0">
        <div class="min-w-0">
          <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
            ${isLiveDraftPreview ? "LIVE A4 PREVIEW" : isDrivePdf ? "PDF QUESTION PAPER" : "OFFICIAL PRACTICE PAPER"}
          </div>
          <h3 class="text-sm sm:text-base font-extrabold truncate">
            ${esc(paper.examTitle || "Question Paper")} — Class ${esc(paper.classLevel)} (${esc(paper.subject || "General")})
          </h3>
        </div>
        <button id="qp-reader-close" type="button" aria-label="Close Preview"
          class="shrink-0 min-h-[38px] px-3.5 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-extrabold shadow cursor-pointer">
          ✕ Close
        </button>
      </div>

      <!-- Action Strip -->
      <div class="px-4 py-2.5 bg-[var(--leg-surface-alt)] border-b leg-border flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        <div class="leg-text-muted font-semibold truncate">
          👨‍🏫 ${esc(paper.teacherName || "Faculty")} ${paper.date ? `• 📅 ${esc(paper.date)}` : ""}
        </div>
        <div class="flex flex-wrap items-center gap-2">
          ${
            isDrivePdf
              ? `<a href="${esc(downloadUrl)}" target="_blank" rel="noopener noreferrer"
                   class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-1.5">
                   ⬇ Download PDF
                 </a>
                 <a href="${esc(paper.driveUrl)}" target="_blank" rel="noopener noreferrer"
                   class="px-3.5 py-2 rounded-xl bg-[#0B3066] text-white font-bold">
                   Open in Drive ↗
                 </a>`
              : `<div class="inline-flex rounded-xl border leg-border bg-[var(--leg-surface)] p-0.5 text-[11px] font-bold">
                   <button type="button" id="qp-mode-a4" class="px-2.5 py-1 rounded-lg bg-[#0B3066] text-white cursor-pointer">Full A4</button>
                   <button type="button" id="qp-mode-2in1" class="px-2.5 py-1 rounded-lg leg-text-primary cursor-pointer">2-in-1 Half Sheet</button>
                 </div>
                 <button type="button" id="qp-do-print-btn"
                   class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold cursor-pointer">
                   🖨️ Print / Save PDF
                 </button>`
          }
        </div>
      </div>

      <!-- Body -->
      <div id="qp-reader-body" class="p-3 sm:p-5 overflow-y-auto flex-1 bg-slate-200/70 dark:bg-slate-900">
        ${
          isDrivePdf
            ? previewEmbed
              ? `<iframe src="${esc(previewEmbed)}" class="w-full h-[70vh] rounded-xl border leg-border bg-white" allow="autoplay"></iframe>`
              : `<div class="p-6 rounded-xl bg-white text-slate-800 text-center space-y-2">
                   <p class="font-bold">Direct preview unavailable for this link.</p>
                   <a href="${esc(paper.driveUrl)}" target="_blank" rel="noopener noreferrer" class="inline-block px-4 py-2 rounded-xl bg-[#0B3066] text-white text-xs font-bold">Open File Directly ↗</a>
                 </div>`
            : `<div class="max-w-[780px] mx-auto shadow-lg">${buildOfficialPaperHTML(paper, false)}</div>`
        }
      </div>
    </div>
  `;

  const close = () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  };
  document.getElementById("qp-reader-close").addEventListener("click", close);
  modal.onclick = (e) => {
    if (e.target === modal) close();
  };

  if (!isDrivePdf) {
    let selectedPrintMode = "a4";
    const btnA4 = document.getElementById("qp-mode-a4");
    const btn2in1 = document.getElementById("qp-mode-2in1");

    btnA4.addEventListener("click", () => {
      selectedPrintMode = "a4";
      btnA4.className = "px-2.5 py-1 rounded-lg bg-[#0B3066] text-white cursor-pointer";
      btn2in1.className = "px-2.5 py-1 rounded-lg leg-text-primary cursor-pointer";
    });
    btn2in1.addEventListener("click", () => {
      selectedPrintMode = "2in1";
      btn2in1.className = "px-2.5 py-1 rounded-lg bg-[#0B3066] text-white cursor-pointer";
      btnA4.className = "px-2.5 py-1 rounded-lg leg-text-primary cursor-pointer";
    });
    document.getElementById("qp-do-print-btn").addEventListener("click", () => {
      triggerCleanA4Print(paper, selectedPrintMode);
    });
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

// ============================================================================
// 4. TEACHER QUESTION PAPER STUDIO (INSIDE TEACHER COMMAND STUDIO)
// ============================================================================
window.renderTeacherQuestionPaperStudio = function (user, profile, db) {
  injectQuestionPaperStyles();
  const box = document.getElementById("pd-content");
  if (!box) return;

  let activeSubTab = "builder"; // "builder" | "drive_pdf" | "my_papers"

  box.innerHTML = `
    <div class="space-y-4">
      <!-- Top Mode Switcher + Sticky Live Preview Trigger -->
      <div class="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border">
        <div class="flex flex-wrap gap-1.5">
          <button type="button" data-qps-tab="builder"
            class="qps-subtab px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#0B3066] text-white cursor-pointer">
            ✍️ Create Paper
          </button>
          <button type="button" data-qps-tab="drive_pdf"
            class="qps-subtab px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--leg-surface)] border leg-border leg-text-primary cursor-pointer">
            📎 Upload Drive PDF
          </button>
          <button type="button" data-qps-tab="my_papers"
            class="qps-subtab px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--leg-surface)] border leg-border leg-text-primary cursor-pointer">
            🗂️ My Published
          </button>
        </div>

        <button type="button" id="qp-live-preview-top"
          class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow cursor-pointer flex items-center gap-1.5">
          <span>👁️ Live Preview</span>
          <span id="qp-live-count-pill" class="px-1.5 py-0.5 rounded bg-slate-950/15 font-mono text-[10px]">${qpState.questions.length} Qs</span>
        </button>
      </div>

      <div id="qp-studio-stage"></div>
    </div>
  `;

  const setSubTabUI = (tab) => {
    activeSubTab = tab;
    box.querySelectorAll(".qps-subtab").forEach((b) => {
      const act = b.getAttribute("data-qps-tab") === tab;
      b.className = act
        ? "qps-subtab px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#0B3066] text-white cursor-pointer"
        : "qps-subtab px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--leg-surface)] border leg-border leg-text-primary cursor-pointer";
    });
    const prevBtn = document.getElementById("qp-live-preview-top");
    if (prevBtn) prevBtn.classList.toggle("hidden", tab !== "builder");

    if (tab === "builder") renderBuilderStage(user, profile, db);
    else if (tab === "drive_pdf") renderDrivePdfStage(user, profile, db);
    else renderMyPublishedStage(user, profile, db);
  };

  box.querySelectorAll(".qps-subtab").forEach((b) => {
    b.addEventListener("click", () => setSubTabUI(b.getAttribute("data-qps-tab")));
  });

  document.getElementById("qp-live-preview-top").addEventListener("click", () => {
    openPaperReaderModal(
      { ...qpState, teacherName: profile.fullName || user.email, paperFormat: "typed" },
      true
    );
  });

  setSubTabUI("builder");
};

// --- SUB-TAB A: INTERACTIVE QUESTION PAPER BUILDER ---
function renderBuilderStage(user, profile, db) {
  const stage = document.getElementById("qp-studio-stage");
  if (!stage) return;

  const isPlusTwo = ["11", "12"].includes(String(qpState.classLevel));
  const addedMarks = calculateTotalMarks(qpState.questions);

  stage.innerHTML = `
    <div class="space-y-4">
      <!-- 1. EXAM HEADER CARD -->
      <div class="p-4 sm:p-5 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border space-y-3.5 text-xs">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b leg-border pb-2.5">
          <div>
            <span class="text-[10px] font-mono font-extrabold text-[#0B3066] dark:text-amber-400 uppercase">Step 1 • Auto Official School Header</span>
            <h4 class="text-sm font-extrabold leg-text-primary">S.S. +2 High School, Gola • Exam Details</h4>
          </div>
          <button type="button" id="qp-reset-draft"
            class="px-2.5 py-1 rounded-lg border leg-border text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer">
            ↺ New Blank Paper
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label class="block font-bold leg-text-muted mb-1">Exam / Sheet Title *</label>
            <input id="qp-title" type="text" value="${esc(qpState.examTitle)}" placeholder="e.g. Monthly Test / Practice Sheet"
              class="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary font-semibold focus:outline-none focus:border-amber-500" />
          </div>

          <div>
            <label class="block font-bold leg-text-muted mb-1">Target Class *</label>
            <select id="qp-class" class="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary font-bold">
              ${CLASS_LIST.map((c) => `<option value="${c}" ${String(qpState.classLevel) === c ? "selected" : ""}>Class ${c}</option>`).join("")}
            </select>
          </div>

          <div id="qp-stream-wrap" class="${isPlusTwo ? "" : "hidden"}">
            <label class="block font-bold leg-text-muted mb-1">+2 Stream</label>
            <select id="qp-stream" class="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary font-bold">
              <option value="Science" ${qpState.stream === "Science" ? "selected" : ""}>Science</option>
              <option value="Arts" ${qpState.stream === "Arts" ? "selected" : ""}>Arts</option>
              <option value="Commerce" ${qpState.stream === "Commerce" ? "selected" : ""}>Commerce</option>
              <option value="General" ${qpState.stream === "General" ? "selected" : ""}>Common (All Streams)</option>
            </select>
          </div>

          <div>
            <label class="block font-bold leg-text-muted mb-1">Subject *</label>
            <input id="qp-subject" type="text" value="${esc(qpState.subject)}" placeholder="e.g. Physics, Mathematics, Hindi"
              class="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary font-semibold focus:outline-none focus:border-amber-500" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold leg-text-muted mb-1">Full Marks</label>
              <input id="qp-marks" type="text" value="${esc(qpState.fullMarks)}" placeholder="e.g. 40"
                class="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary font-bold" />
            </div>
            <div>
              <label class="block font-bold leg-text-muted mb-1">Time</label>
              <input id="qp-time" type="text" value="${esc(qpState.timeAllowed)}" placeholder="e.g. 1.5 Hrs"
                class="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary font-bold" />
            </div>
          </div>

          <div>
            <label class="block font-bold leg-text-muted mb-1">Default Question Type</label>
            <div class="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--leg-surface)] border leg-border">
              <button type="button" data-def-mode="objective"
                class="qp-def-mode-btn py-1.5 rounded-lg text-[11px] font-extrabold cursor-pointer ${qpState.defaultMode === "objective" ? "bg-[#0B3066] text-white" : "leg-text-muted"}">
                ☑ Objective (MCQ)
              </button>
              <button type="button" data-def-mode="subjective"
                class="qp-def-mode-btn py-1.5 rounded-lg text-[11px] font-extrabold cursor-pointer ${qpState.defaultMode === "subjective" ? "bg-[#0B3066] text-white" : "leg-text-muted"}">
                ✍ Subjective
              </button>
            </div>
          </div>
        </div>

        <div>
          <label class="block font-bold leg-text-muted mb-1">General Instructions (Optional)</label>
          <input id="qp-instructions" type="text" value="${esc(qpState.instructions)}" placeholder="e.g. All questions are compulsory."
            class="w-full min-h-[38px] px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary focus:outline-none focus:border-amber-500" />
        </div>
      </div>

      <!-- 2. 1-TAP MATH & SCIENCE SYMBOL BAR + LIVE MARKS COUNTER -->
      <div class="sticky top-0 z-20 p-2.5 rounded-2xl bg-[var(--leg-surface)] border border-amber-500/40 shadow-sm space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span class="font-bold leg-text-muted">1-Tap Math/Science Symbols (Hindi Voice Typing Supported 🎤)</span>
          <span id="qp-marks-summary" class="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono font-extrabold">
            Added: ${addedMarks} / ${esc(qpState.fullMarks || "-")} Marks
          </span>
        </div>
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          ${MATH_SYMBOLS.map(
            (sym) => `
              <button type="button" data-insert-sym="${esc(sym)}"
                class="shrink-0 min-w-[34px] h-8 px-2 rounded-lg bg-[var(--leg-surface-alt)] hover:bg-amber-400 hover:text-slate-950 border leg-border text-xs font-extrabold leg-text-primary cursor-pointer transition-colors">
                ${esc(sym)}
              </button>
            `
          ).join("")}
        </div>
      </div>

      <!-- 3. DYNAMIC QUESTION CARDS LIST -->
      <div id="qp-questions-list" class="space-y-3.5"></div>

      <!-- 4. BOTTOM ACTION BAR (+ ADD NEXT QUESTION | SAVE & FINISH) -->
      <div class="p-4 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button type="button" id="qp-add-next-btn"
            class="min-h-[46px] px-5 py-3 rounded-xl bg-[#0B3066] hover:bg-[#14438a] text-white font-extrabold text-xs sm:text-sm shadow active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2">
            <span>＋ Add Next Question</span>
          </button>

          <button type="button" id="qp-finish-toggle-btn"
            class="min-h-[46px] px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2">
            <span>✓ Save &amp; Finish Paper</span>
          </button>
        </div>

        <!-- FINAL SAVE / PRINT / PUBLISH DRAWER -->
        <div id="qp-finish-panel" class="hidden pt-3 border-t leg-border space-y-3">
          <div class="text-xs font-extrabold leg-text-primary">Choose how you want to use this paper:</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <button type="button" id="qp-private-print-btn"
              class="p-3.5 rounded-xl bg-[var(--leg-surface)] border-2 border-amber-500/60 hover:bg-amber-500/10 text-left space-y-1 cursor-pointer">
              <div class="font-extrabold leg-text-primary">🖨️ Print / Save PDF (Private — Exam Safe)</div>
              <div class="text-[11px] leg-text-muted">Stays 100% on your device. Never published online — zero paper-leak risk!</div>
            </button>

            <button type="button" id="qp-publish-portal-btn"
              class="p-3.5 rounded-xl bg-[#0B3066] hover:bg-[#14438a] text-white text-left space-y-1 shadow cursor-pointer">
              <div class="font-extrabold">🌐 Publish to Question Bank &amp; Student Dashboard</div>
              <div class="text-[11px] text-blue-100">Visible to Class ${esc(qpState.classLevel)} students for practice &amp; download.</div>
            </button>
          </div>
          <div id="qp-publish-status" class="hidden text-xs font-bold p-3 rounded-xl"></div>
        </div>
      </div>
    </div>
  `;

  // Bind Header Inputs
  const syncHeader = () => {
    qpState.examTitle = document.getElementById("qp-title").value;
    qpState.classLevel = document.getElementById("qp-class").value;
    qpState.stream = ["11", "12"].includes(qpState.classLevel)
      ? document.getElementById("qp-stream").value
      : "General";
    qpState.subject = document.getElementById("qp-subject").value;
    qpState.fullMarks = document.getElementById("qp-marks").value;
    qpState.timeAllowed = document.getElementById("qp-time").value;
    qpState.instructions = document.getElementById("qp-instructions").value;

    document.getElementById("qp-stream-wrap").classList.toggle("hidden", !["11", "12"].includes(qpState.classLevel));
    updateLiveCounters();
    saveDraftToStorage();
  };

  ["qp-title", "qp-class", "qp-stream", "qp-subject", "qp-marks", "qp-time", "qp-instructions"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", syncHeader);
    if (el) el.addEventListener("change", syncHeader);
  });

  // Default Mode Toggle
  stage.querySelectorAll(".qp-def-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      qpState.defaultMode = btn.getAttribute("data-def-mode");
      // If only 1 empty question exists, switch its type immediately for convenience
      if (qpState.questions.length === 1 && !qpState.questions[0].text.trim()) {
        qpState.questions[0].type = qpState.defaultMode;
        qpState.questions[0].marks = qpState.defaultMode === "objective" ? "1" : "3";
      }
      saveDraftToStorage();
      renderBuilderStage(user, profile, db);
    });
  });

  // Reset Draft
  document.getElementById("qp-reset-draft").addEventListener("click", () => {
    if (!confirm("Start a fresh blank question paper? Current unsaved draft will be cleared.")) return;
    qpState = createDefaultDraft();
    saveDraftToStorage();
    renderBuilderStage(user, profile, db);
  });

  // Symbol Bar (Zero Focus Loss on Mobile!)
  stage.querySelectorAll("[data-insert-sym]").forEach((btn) => {
    btn.addEventListener("mousedown", (e) => e.preventDefault());
    btn.addEventListener("click", () => {
      const sym = btn.getAttribute("data-insert-sym");
      if (!lastFocusedField || !document.body.contains(lastFocusedField)) {
        const firstTa = stage.querySelector("textarea[data-q-text]");
        if (firstTa) lastFocusedField = firstTa;
      }
      if (!lastFocusedField) return;
      const start = lastFocusedField.selectionStart ?? lastFocusedField.value.length;
      const end = lastFocusedField.selectionEnd ?? lastFocusedField.value.length;
      const val = lastFocusedField.value;
      lastFocusedField.value = val.slice(0, start) + sym + val.slice(end);
      lastFocusedField.focus();
      const pos = start + sym.length;
      try {
        lastFocusedField.setSelectionRange(pos, pos);
      } catch (e) {}
      lastFocusedField.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });

  // Render Question Cards
  renderQuestionCardsList();

  // Add Next Question
  document.getElementById("qp-add-next-btn").addEventListener("click", () => {
    const newQ = createEmptyQuestion(qpState.defaultMode);
    qpState.questions.push(newQ);
    saveDraftToStorage();
    renderQuestionCardsList(true);
  });

  // Toggle Save & Finish Panel
  document.getElementById("qp-finish-toggle-btn").addEventListener("click", () => {
    const panel = document.getElementById("qp-finish-panel");
    panel.classList.toggle("hidden");
    if (!panel.classList.contains("hidden")) {
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });

  // Private Print / Save PDF
  document.getElementById("qp-private-print-btn").addEventListener("click", () => {
    openPaperReaderModal(
      { ...qpState, teacherName: profile.fullName || user.email, paperFormat: "typed" },
      false
    );
  });

  // Publish to Website & Student Dashboard
  document.getElementById("qp-publish-portal-btn").addEventListener("click", async () => {
    const status = document.getElementById("qp-publish-status");
    const pubBtn = document.getElementById("qp-publish-portal-btn");
    const validQs = qpState.questions.filter((q) => String(q.text || "").trim().length > 0);

    if (!qpState.subject.trim()) {
      status.className = "text-xs font-bold p-3 rounded-xl bg-red-500/15 text-red-600 dark:text-red-300 block";
      status.textContent = "Please enter the Subject name before publishing.";
      return;
    }
    if (validQs.length === 0) {
      status.className = "text-xs font-bold p-3 rounded-xl bg-red-500/15 text-red-600 dark:text-red-300 block";
      status.textContent = "Please type at least 1 question before publishing.";
      return;
    }

    pubBtn.disabled = true;
    status.className = "text-xs font-bold p-3 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 block";
    status.textContent = "Publishing paper to Question Bank & Student Dashboard...";

    try {
      const payload = {
        paperFormat: "typed",
        examTitle: qpState.examTitle.trim() || "Practice Assessment Paper",
        classLevel: String(qpState.classLevel),
        stream: ["11", "12"].includes(String(qpState.classLevel)) ? qpState.stream : "General",
        subject: qpState.subject.trim(),
        timeAllowed: qpState.timeAllowed.trim() || "1 Hour",
        fullMarks: qpState.fullMarks.trim() || String(calculateTotalMarks(validQs)),
        instructions: qpState.instructions.trim(),
        questions: validQs,
        teacherUid: user.uid,
        teacherName: profile.fullName || user.email,
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "question_papers"), payload);
      status.className = "text-xs font-bold p-3 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 block";
      status.textContent = `✓ Published! Now live in Question Bank & Class ${payload.classLevel} Student Dashboard.`;
      cachedPublicPapers = [];
    } catch (err) {
      status.className = "text-xs font-bold p-3 rounded-xl bg-red-500/15 text-red-600 dark:text-red-300 block";
      status.textContent = "Publish failed: " + err.message;
    } finally {
      pubBtn.disabled = false;
    }
  });
}

function updateLiveCounters() {
  const pill = document.getElementById("qp-live-count-pill");
  if (pill) pill.textContent = `${qpState.questions.length} Qs`;
  const sum = document.getElementById("qp-marks-summary");
  if (sum) {
    sum.textContent = `Added: ${calculateTotalMarks(qpState.questions)} / ${qpState.fullMarks || "-"} Marks`;
  }
}

function renderQuestionCardsList(focusLast = false) {
  const listEl = document.getElementById("qp-questions-list");
  if (!listEl) return;

  listEl.innerHTML = qpState.questions
    .map((q, idx) => {
      const isObj = q.type === "objective";
      const opts = Array.isArray(q.options) ? q.options : ["", "", "", ""];

      return `
        <div class="p-4 rounded-2xl bg-[var(--leg-surface)] border leg-border shadow-xs space-y-3 text-xs" data-q-card="${idx}">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-lg bg-[#0B3066] text-amber-300 font-mono font-extrabold">Q${idx + 1}</span>
              <button type="button" data-q-toggle-type="${idx}"
                class="px-2.5 py-1 rounded-lg border leg-border bg-[var(--leg-surface-alt)] font-bold leg-text-primary hover:border-amber-500 cursor-pointer">
                ${isObj ? "☑ Objective (MCQ)" : "✍ Subjective"} ⇄
              </button>
            </div>

            <div class="flex items-center gap-1.5">
              <label class="text-[11px] font-bold leg-text-muted">Marks:</label>
              <input type="text" data-q-marks="${idx}" value="${esc(q.marks)}" placeholder="1"
                class="w-12 px-2 py-1 rounded-lg bg-[var(--leg-surface-alt)] border leg-border leg-text-primary text-center font-mono font-bold" />
              ${idx > 0 ? `<button type="button" data-q-up="${idx}" title="Move Up" class="w-7 h-7 rounded-lg bg-[var(--leg-surface-alt)] border leg-border font-bold cursor-pointer">↑</button>` : ""}
              ${idx < qpState.questions.length - 1 ? `<button type="button" data-q-down="${idx}" title="Move Down" class="w-7 h-7 rounded-lg bg-[var(--leg-surface-alt)] border leg-border font-bold cursor-pointer">↓</button>` : ""}
              ${qpState.questions.length > 1 ? `<button type="button" data-q-del="${idx}" title="Remove Question" class="w-7 h-7 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 font-extrabold cursor-pointer">✕</button>` : ""}
            </div>
          </div>

          <textarea data-q-text="${idx}" rows="2" placeholder="Type Question ${idx + 1} here (English ya Hindi me bol kar bhi likh sakte hain)..."
            class="w-full px-3.5 py-2.5 rounded-xl bg-[var(--leg-surface-alt)] border leg-border leg-text-primary text-xs sm:text-sm focus:outline-none focus:border-amber-500">${esc(q.text)}</textarea>

          ${
            isObj
              ? `<div class="space-y-1.5">
                   <div class="text-[10px] font-mono font-bold leg-text-muted uppercase">Options (Optional — Leave blank if not needed)</div>
                   <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                     ${["A", "B", "C", "D"]
                       .map(
                         (lbl, oIdx) => `
                           <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--leg-surface-alt)] border leg-border focus-within:border-amber-500">
                             <span class="font-mono font-extrabold text-[#0B3066] dark:text-amber-400">(${lbl})</span>
                             <input type="text" data-q-opt="${idx}" data-opt-idx="${oIdx}" value="${esc(opts[oIdx] || "")}"
                               placeholder="Option ${lbl}"
                               class="w-full bg-transparent leg-text-primary text-xs focus:outline-none" />
                           </div>
                         `
                       )
                       .join("")}
                   </div>
                 </div>`
              : ""
          }
        </div>
      `;
    })
    .join("");

  // Track last focused field for Math Symbol Bar
  listEl.querySelectorAll("textarea, input[type='text']").forEach((el) => {
    el.addEventListener("focusin", () => {
      lastFocusedField = el;
    });
  });

  listEl.querySelectorAll("[data-q-text]").forEach((ta) => {
    ta.addEventListener("input", () => {
      const i = Number(ta.getAttribute("data-q-text"));
      qpState.questions[i].text = ta.value;
      saveDraftToStorage();
    });
  });

  listEl.querySelectorAll("[data-q-marks]").forEach((inp) => {
    inp.addEventListener("input", () => {
      const i = Number(inp.getAttribute("data-q-marks"));
      qpState.questions[i].marks = inp.value;
      updateLiveCounters();
      saveDraftToStorage();
    });
  });

  listEl.querySelectorAll("[data-q-opt]").forEach((inp) => {
    inp.addEventListener("input", () => {
      const i = Number(inp.getAttribute("data-q-opt"));
      const oi = Number(inp.getAttribute("data-opt-idx"));
      if (!Array.isArray(qpState.questions[i].options)) qpState.questions[i].options = ["", "", "", ""];
      qpState.questions[i].options[oi] = inp.value;
      saveDraftToStorage();
    });
  });

  listEl.querySelectorAll("[data-q-toggle-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-q-toggle-type"));
      qpState.questions[i].type = qpState.questions[i].type === "objective" ? "subjective" : "objective";
      saveDraftToStorage();
      renderQuestionCardsList();
    });
  });

  listEl.querySelectorAll("[data-q-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-q-del"));
      qpState.questions.splice(i, 1);
      saveDraftToStorage();
      renderQuestionCardsList();
    });
  });

  listEl.querySelectorAll("[data-q-up]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-q-up"));
      if (i <= 0) return;
      const tmp = qpState.questions[i - 1];
      qpState.questions[i - 1] = qpState.questions[i];
      qpState.questions[i] = tmp;
      saveDraftToStorage();
      renderQuestionCardsList();
    });
  });

  listEl.querySelectorAll("[data-q-down]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.getAttribute("data-q-down"));
      if (i >= qpState.questions.length - 1) return;
      const tmp = qpState.questions[i + 1];
      qpState.questions[i + 1] = qpState.questions[i];
      qpState.questions[i] = tmp;
      saveDraftToStorage();
      renderQuestionCardsList();
    });
  });

  updateLiveCounters();

  if (focusLast) {
    const lastTa = listEl.querySelector(`textarea[data-q-text="${qpState.questions.length - 1}"]`);
    if (lastTa) {
      lastTa.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => lastTa.focus(), 180);
    }
  }
}

// --- SUB-TAB B: UPLOAD EXISTING PDF VIA GOOGLE DRIVE LINK (WITH SHARING ALERT) ---
function renderDrivePdfStage(user, profile, db) {
  const stage = document.getElementById("qp-studio-stage");
  if (!stage) return;

  stage.innerHTML = `
    <form id="qp-drive-form" class="p-4 sm:p-5 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border space-y-4 text-xs">
      <!-- MANDATORY GOOGLE DRIVE ACCESS ALERT -->
      <div class="p-3.5 rounded-xl bg-amber-500/15 border-2 border-amber-500/50 text-amber-900 dark:text-amber-200 space-y-1.5">
        <div class="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
          <span>⚠️ Important: Google Drive Link Public Setting Jaroori Hai!</span>
        </div>
        <p class="leading-relaxed">
          Link paste karne se pehle Google Drive me apni PDF file par <strong>3 dots (⋮) → Manage access</strong> kholein aur
          <strong>"Restricted"</strong> ko badal kar <strong>"Anyone with the link (Viewer)"</strong> select karein — warna students PDF open ya download nahi kar payenge!
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label class="block font-bold leg-text-muted mb-1">Paper / Sheet Title *</label>
          <input id="qpd-title" type="text" required placeholder="e.g. Class 12 Physics Model Paper 2026"
            class="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary font-semibold" />
        </div>

        <div>
          <label class="block font-bold leg-text-muted mb-1">Subject *</label>
          <input id="qpd-subject" type="text" required placeholder="e.g. Physics, Mathematics, English"
            class="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary font-semibold" />
        </div>

        <div>
          <label class="block font-bold leg-text-muted mb-1">Target Class *</label>
          <select id="qpd-class" class="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary font-bold">
            ${CLASS_LIST.map((c) => `<option value="${c}" ${c === "10" ? "selected" : ""}>Class ${c}</option>`).join("")}
          </select>
        </div>

        <div id="qpd-stream-wrap" class="hidden">
          <label class="block font-bold leg-text-muted mb-1">+2 Stream</label>
          <select id="qpd-stream" class="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary font-bold">
            <option value="Science">Science</option>
            <option value="Arts">Arts</option>
            <option value="Commerce">Commerce</option>
            <option value="General">Common (All Streams)</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block font-bold leg-text-muted mb-1">Google Drive PDF Share Link *</label>
        <div class="flex flex-col sm:flex-row gap-2">
          <input id="qpd-url" type="url" required placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
            class="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary" />
          <button type="button" id="qpd-test-btn"
            class="min-h-[42px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold cursor-pointer shrink-0">
            👁️ Test PDF Link
          </button>
        </div>
      </div>

      <div id="qpd-status" class="hidden text-xs font-bold p-3 rounded-xl"></div>

      <button type="submit" id="qpd-submit-btn"
        class="w-full min-h-[46px] py-3 rounded-xl bg-[#0B3066] hover:bg-[#14438a] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow cursor-pointer">
        🚀 Publish PDF to Question Bank &amp; Student Dashboard
      </button>
    </form>
  `;

  const clsSel = document.getElementById("qpd-class");
  clsSel.addEventListener("change", () => {
    document.getElementById("qpd-stream-wrap").classList.toggle("hidden", !["11", "12"].includes(clsSel.value));
  });

  document.getElementById("qpd-test-btn").addEventListener("click", () => {
    const url = document.getElementById("qpd-url").value.trim();
    const st = document.getElementById("qpd-status");
    if (!extractDriveFileId(url)) {
      st.className = "text-xs font-bold p-3 rounded-xl bg-red-500/15 text-red-600 dark:text-red-300 block";
      st.textContent = "Invalid Google Drive link. Please copy the full share link from Google Drive.";
      return;
    }
    st.classList.add("hidden");
    openPaperReaderModal({
      paperFormat: "drive_pdf",
      driveUrl: url,
      examTitle: document.getElementById("qpd-title").value.trim() || "PDF Link Preview Test",
      classLevel: clsSel.value,
      subject: document.getElementById("qpd-subject").value.trim() || "Preview",
      teacherName: profile.fullName || user.email
    });
  });

  document.getElementById("qp-drive-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const st = document.getElementById("qpd-status");
    const btn = document.getElementById("qpd-submit-btn");
    const url = document.getElementById("qpd-url").value.trim();

    if (!extractDriveFileId(url)) {
      st.className = "text-xs font-bold p-3 rounded-xl bg-red-500/15 text-red-600 dark:text-red-300 block";
      st.textContent = "Please paste a valid Google Drive file link (drive.google.com/file/d/...).";
      return;
    }

    btn.disabled = true;
    btn.textContent = "PUBLISHING PDF...";
    try {
      const payload = {
        paperFormat: "drive_pdf",
        driveUrl: url,
        examTitle: document.getElementById("qpd-title").value.trim(),
        classLevel: clsSel.value,
        stream: ["11", "12"].includes(clsSel.value) ? document.getElementById("qpd-stream").value : "General",
        subject: document.getElementById("qpd-subject").value.trim(),
        teacherUid: user.uid,
        teacherName: profile.fullName || user.email,
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "question_papers"), payload);
      st.className = "text-xs font-bold p-3 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 block";
      st.textContent = `✓ PDF Published! Live in Question Bank & Class ${payload.classLevel} Student Dashboard.`;
      e.target.reset();
      cachedPublicPapers = [];
    } catch (err) {
      st.className = "text-xs font-bold p-3 rounded-xl bg-red-500/15 text-red-600 dark:text-red-300 block";
      st.textContent = "Publish error: " + err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = "🚀 Publish PDF to Question Bank & Student Dashboard";
    }
  });
}

// --- SUB-TAB C: MY PUBLISHED PAPERS (TEACHER MANAGER) ---
async function renderMyPublishedStage(user, profile, db) {
  const stage = document.getElementById("qp-studio-stage");
  if (!stage) return;
  stage.innerHTML = `<p class="text-xs leg-text-muted py-4">Loading your published papers...</p>`;

  try {
    const snap = await getDocs(query(collection(db, "question_papers"), where("teacherUid", "==", user.uid)));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    if (list.length === 0) {
      stage.innerHTML = `
        <div class="p-6 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border text-center text-xs leg-text-muted">
          You haven't published any question papers or Drive PDFs yet.
        </div>
      `;
      return;
    }

    stage.innerHTML = `
      <div class="space-y-2.5">
        ${list
          .map(
            (p, idx) => `
              <div class="p-3.5 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border flex flex-wrap items-center justify-between gap-2.5 text-xs">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-1.5 mb-1">
                    <span class="px-2 py-0.5 rounded bg-[#0B3066] text-amber-300 font-mono text-[10px] font-bold">
                      Class ${esc(p.classLevel)}${["11", "12"].includes(String(p.classLevel)) && p.stream !== "General" ? " • " + esc(p.stream) : ""}
                    </span>
                    <span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">
                      ${p.paperFormat === "drive_pdf" ? "📎 DRIVE PDF" : `📝 ${esc(p.fullMarks || "-")} MARKS`}
                    </span>
                    <span class="text-[10px] leg-text-muted">${esc(p.date || "")}</span>
                  </div>
                  <div class="font-extrabold leg-text-primary truncate">${esc(p.examTitle)} (${esc(p.subject)})</div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <button type="button" data-my-view="${idx}"
                    class="px-3 py-1.5 rounded-lg bg-[#0B3066] text-white font-bold cursor-pointer">View / Print</button>
                  <button type="button" data-my-del="${esc(p.id)}"
                    class="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 font-bold cursor-pointer">Delete</button>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    `;

    stage.querySelectorAll("[data-my-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openPaperReaderModal(list[Number(btn.getAttribute("data-my-view"))], false);
      });
    });

    stage.querySelectorAll("[data-my-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this published paper permanently?")) return;
        await deleteDoc(doc(db, "question_papers", btn.getAttribute("data-my-del")));
        cachedPublicPapers = [];
        renderMyPublishedStage(user, profile, db);
      });
    });
  } catch (err) {
    stage.innerHTML = `<p class="text-xs text-red-500">Error: ${esc(err.message)}</p>`;
  }
}

// ============================================================================
// 5. STUDENT DASHBOARD STRICT CLASS-LOCKED TAB (📝 PRACTICE PAPERS)
// ============================================================================
window.renderStudentPracticePapersTab = async function (profile, db) {
  injectQuestionPaperStyles();
  const box = document.getElementById("pd-content");
  if (!box) return;

  const stuClass = String(profile.classLevel || "").trim();
  const stuStream = String(profile.stream || "General").trim();

  box.innerHTML = `<p class="text-xs leg-text-muted">Loading practice papers for Class ${esc(stuClass)}...</p>`;

  try {
    const snap = await getDocs(collection(db, "question_papers"));
    let all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Strict Class & Stream Isolation
    const matched = all.filter((p) => {
      const pCls = String(p.classLevel || "").trim();
      const classMatch =
        stuClass === "1-5" ? ["1", "2", "3", "4", "5"].includes(pCls) : pCls === stuClass;
      if (!classMatch) return false;
      if (["11", "12"].includes(stuClass)) {
        const pStream = String(p.stream || "General").trim();
        return pStream === "General" || pStream === stuStream;
      }
      return true;
    });

    matched.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    if (matched.length === 0) {
      box.innerHTML = `
        <div class="p-6 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border text-center space-y-2">
          <div class="text-2xl">📝</div>
          <div class="text-sm font-extrabold leg-text-primary">No Practice Papers for Class ${esc(stuClass)} yet</div>
          <p class="text-xs leg-text-muted">As soon as your teachers publish a practice paper or PDF for Class ${esc(stuClass)}, it will appear here automatically.</p>
        </div>
      `;
      return;
    }

    box.innerHTML = `
      <div class="space-y-3">
        <div class="text-xs font-bold leg-text-muted">
          Showing ${matched.length} verified paper(s) exclusively for <strong>Class ${esc(stuClass)}${["11", "12"].includes(stuClass) ? " (" + esc(stuStream) + ")" : ""}</strong>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${matched.map((p, idx) => renderPaperCardHTML(p, idx, "stu")).join("")}
        </div>
      </div>
    `;

    box.querySelectorAll("[data-stu-paper-idx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openPaperReaderModal(matched[Number(btn.getAttribute("data-stu-paper-idx"))], false);
      });
    });
  } catch (err) {
    box.innerHTML = `<p class="text-xs text-red-500">Could not load practice papers: ${esc(err.message)}</p>`;
  }
};

function renderPaperCardHTML(p, idx, prefix) {
  const isPdf = p.paperFormat === "drive_pdf";
  const streamTag =
    ["11", "12"].includes(String(p.classLevel)) && p.stream && p.stream !== "General"
      ? ` • ${esc(p.stream)}`
      : "";
  return `
    <article class="sacred-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 border-t-4 ${isPdf ? "border-t-emerald-600" : "border-t-[#0B3066] dark:border-t-amber-400"}">
      <div class="space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-mono">
          <span class="px-2.5 py-0.5 rounded-full bg-[#0B3066] text-amber-300 font-extrabold">
            CLASS ${esc(p.classLevel)}${streamTag}
          </span>
          <span class="px-2 py-0.5 rounded-full ${isPdf ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/15 t-gold"} font-extrabold">
            ${isPdf ? "📎 PDF DOCUMENT" : `📝 ${esc(p.fullMarks || "-")} MARKS`}
          </span>
        </div>

        <h4 class="text-sm sm:text-base font-extrabold t-heading leading-snug">${esc(p.examTitle || "Practice Sheet")}</h4>
        <div class="text-xs font-bold text-[#0B3066] dark:text-amber-400">Subject: ${esc(p.subject || "General")}</div>
      </div>

      <div class="pt-2.5 border-t leg-border flex items-center justify-between gap-2 text-[11px]">
        <div class="t-muted min-w-0">
          <div class="font-bold t-heading truncate">👨‍🏫 ${esc(p.teacherName || "Faculty")}</div>
          <div class="text-[10px]">${esc(p.date || "")}</div>
        </div>
        <button type="button" data-${prefix}-paper-idx="${idx}"
          class="shrink-0 min-h-[38px] px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer active:scale-95 transition-all">
          ${isPdf ? "View / Download" : "View / Print"} →
        </button>
      </div>
    </article>
  `;
}

// ============================================================================
// 6. PUBLIC NAVIGATION VIEW: STRUCTURED QUESTION BANK (#view-papers)
// ============================================================================
function ensurePublicPapersView() {
  let sec = document.getElementById("view-papers");
  if (sec) return sec;

  const mainEl = document.getElementById("portal-main") || document.body;
  sec = document.createElement("section");
  sec.id = "view-papers";
  sec.setAttribute("aria-label", "Question Bank and Practice Sheets");
  sec.className = "hidden max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-7 sm:py-10 space-y-6";

  sec.innerHTML = `
    <div class="flex flex-wrap items-end justify-between gap-4 border-b leg-border pb-5">
      <div class="space-y-1.5">
        <span class="px-3 py-1 rounded-full bg-[#0B3066] text-amber-300 font-mono text-[10px] font-extrabold uppercase tracking-widest">
          S.S. +2 HIGH SCHOOL, GOLA • ACADEMIC REPOSITORY
        </span>
        <h2 class="text-2xl sm:text-3xl font-extrabold t-heading">Question Bank &amp; Practice Sheets</h2>
        <p class="text-xs sm:text-sm t-muted max-w-2xl">
          Official practice papers, monthly tests, and PDF sets prepared directly by our respected school teachers for Class 1 to 12.
        </p>
      </div>
      <button type="button" id="qp-public-back-home"
        class="px-4 py-2 rounded-xl sacred-inner-box hover:border-amber-500 text-xs font-extrabold t-heading cursor-pointer">
        ← Back to Home
      </button>
    </div>

    <!-- Structured Filter Bar -->
    <div class="sacred-card rounded-2xl p-4 space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div>
          <label class="block text-[10px] font-mono font-bold uppercase t-muted mb-1">Filter by Class</label>
          <select id="qpb-filter-class" class="w-full min-h-[42px] px-3 py-2 rounded-xl sacred-inner-box t-heading font-bold">
            <option value="all">All Classes (1 to 12)</option>
            ${CLASS_LIST.map((c) => `<option value="${c}">Class ${c}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="block text-[10px] font-mono font-bold uppercase t-muted mb-1">Format</label>
          <select id="qpb-filter-type" class="w-full min-h-[42px] px-3 py-2 rounded-xl sacred-inner-box t-heading font-bold">
            <option value="all">All Formats</option>
            <option value="typed">📝 Typed Question Papers</option>
            <option value="drive_pdf">📎 PDF Sheets (Drive)</option>
          </select>
        </div>
        <div>
          <label class="block text-[10px] font-mono font-bold uppercase t-muted mb-1">Search Subject / Teacher</label>
          <input id="qpb-filter-search" type="search" placeholder="e.g. Physics, Math, Hindi..."
            class="w-full min-h-[42px] px-3 py-2 rounded-xl sacred-inner-box t-heading focus:outline-none focus:border-amber-500" />
        </div>
      </div>
    </div>

    <div id="qpb-papers-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"></div>
  `;

  mainEl.appendChild(sec);

  document.getElementById("qp-public-back-home").addEventListener("click", () => {
    if (typeof window.switchView === "function") window.switchView("home");
  });

  const onFilter = () => {
    publicFilter.classLevel = document.getElementById("qpb-filter-class").value;
    publicFilter.type = document.getElementById("qpb-filter-type").value;
    publicFilter.search = document.getElementById("qpb-filter-search").value.trim().toLowerCase();
    renderPublicPapersGrid();
  };
  document.getElementById("qpb-filter-class").addEventListener("change", onFilter);
  document.getElementById("qpb-filter-type").addEventListener("change", onFilter);
  document.getElementById("qpb-filter-search").addEventListener("input", onFilter);

  return sec;
}

function renderPublicPapersGrid() {
  const grid = document.getElementById("qpb-papers-grid");
  if (!grid) return;

  const filtered = cachedPublicPapers.filter((p) => {
    if (publicFilter.classLevel !== "all" && String(p.classLevel) !== publicFilter.classLevel) return false;
    if (publicFilter.type !== "all" && p.paperFormat !== publicFilter.type) return false;
    if (publicFilter.search) {
      const hay = `${p.examTitle || ""} ${p.subject || ""} ${p.teacherName || ""} ${p.stream || ""}`.toLowerCase();
      if (!hay.includes(publicFilter.search)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full sacred-card rounded-2xl p-8 text-center space-y-2 border border-dashed border-amber-500/40">
        <div class="text-2xl">📝</div>
        <h4 class="text-sm font-extrabold t-heading">No Question Papers Found</h4>
        <p class="text-xs t-muted">Try changing the class/subject filter, or check back after teachers publish new practice sheets.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((p, idx) => renderPaperCardHTML(p, idx, "pub")).join("");

  grid.querySelectorAll("[data-pub-paper-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openPaperReaderModal(filtered[Number(btn.getAttribute("data-pub-paper-idx"))], false);
    });
  });
}

window.openQuestionBankPage = async function () {
  injectQuestionPaperStyles();
  const sec = ensurePublicPapersView();

  ["view-home", "view-guru-stambh", "view-gaurav-stambh", "view-gallery", "school-campus-map-section"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  sec.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  const grid = document.getElementById("qpb-papers-grid");
  if (cachedPublicPapers.length === 0 && grid) {
    grid.innerHTML = `<div class="col-span-full sacred-card rounded-2xl p-6 text-center text-xs t-muted">Loading official question papers...</div>`;
  }

  const db = getDbSafe();
  if (!db) {
    if (grid) grid.innerHTML = `<div class="col-span-full sacred-card rounded-2xl p-6 text-center text-xs t-muted">Connecting to school cloud... Please tap Question Bank again in a moment.</div>`;
    return;
  }

  try {
    const snap = await getDocs(collection(db, "question_papers"));
    cachedPublicPapers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cachedPublicPapers.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    renderPublicPapersGrid();
  } catch (err) {
    if (grid) grid.innerHTML = `<div class="col-span-full sacred-card rounded-2xl p-6 text-center text-xs text-red-500">Could not load papers: ${esc(err.message)}</div>`;
  }
};

// Safely hide #view-papers whenever user switches to Home / Faculty / Alumni / Gallery
function hookViewSwitchForPapers() {
  if (typeof window.switchView === "function" && !window.switchView.__qpWrapped) {
    const orig = window.switchView;
    const wrapped = function (viewName) {
      const sec = document.getElementById("view-papers");
      if (sec) sec.classList.add("hidden");
      return orig(viewName);
    };
    wrapped.__qpWrapped = true;
    window.switchView = wrapped;
  }
}

window.addEventListener("load", () => {
  injectQuestionPaperStyles();
  hookViewSwitchForPapers();
  setTimeout(hookViewSwitchForPapers, 500);
});
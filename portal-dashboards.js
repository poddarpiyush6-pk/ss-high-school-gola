// ============================================================================
// FILE: portal-dashboards.js (v2.0 — STUDENT & TEACHER COMMAND PORTALS + QP STUDIO)
// 1. Student Dashboard: My Class Notices, Practice Papers (Class-Locked), Syllabus, Message Teachers
// 2. Teacher Studio: Unread Inbox, Question Paper Maker, Notice/Material Publisher, My Notices
// 3. Admin Reports Compatibility Hook (refreshAdminReportsModule)
// ============================================================================

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let compressedNoticeImage = "";

function esc(str) {
  const d = document.createElement("div");
  d.textContent = str == null ? "" : String(str);
  return d.innerHTML;
}

function getBridge() {
  return window.LegacyPortalBridge || null;
}

// HTML5 Canvas Smart Image Compressor (5MB photo -> ~75KB crisp JPEG for Free Firestore)
function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX_W = 900;
        let w = img.width;
        let h = img.height;
        if (w > MAX_W) {
          h = Math.round((h * MAX_W) / w);
          w = MAX_W;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// 1. DASHBOARD FULL-SCREEN RESPONSIVE SHELL
// ============================================================================
function ensureDashboardModal() {
  let modal = document.getElementById("portal-dashboard-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "portal-dashboard-modal";
  modal.className = "fixed inset-0 z-[9997] bg-slate-950/75 backdrop-blur-sm hidden items-center justify-center p-2 sm:p-5 overflow-y-auto";

  modal.innerHTML = `
    <div class="w-full max-w-5xl rounded-3xl bg-[var(--leg-surface)] border leg-border leg-text-primary shadow-2xl overflow-hidden my-auto max-h-[93vh] flex flex-col auth-sheet-animate">
      <!-- Top Bar -->
      <div class="px-4 sm:px-6 py-4 bg-[#0B3066] text-white flex items-center justify-between gap-3 border-b-2 border-[#f59e0b]">
        <div class="min-w-0">
          <div id="pd-role-chip" class="text-[10px] font-bold uppercase tracking-widest text-amber-300">PORTAL DASHBOARD</div>
          <h2 id="pd-user-title" class="text-base sm:text-xl font-extrabold truncate">Welcome</h2>
        </div>
        <button id="pd-close-btn" type="button" aria-label="Close Dashboard"
          class="shrink-0 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer">
          ✕ Close
        </button>
      </div>

      <!-- Tab Navigation Strip -->
      <div id="pd-tabs" class="px-4 sm:px-6 py-2.5 bg-[var(--leg-surface-alt)] border-b leg-border flex items-center gap-2 overflow-x-auto no-scrollbar"></div>

      <!-- Dynamic Body -->
      <div id="pd-content" class="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5"></div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  };
  document.getElementById("pd-close-btn").addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  return modal;
}

function renderDashTabs(tabs, activeId, onSelect) {
  const bar = document.getElementById("pd-tabs");
  if (!bar) return;

  const paint = (curr) => {
    bar.innerHTML = tabs
      .map(
        (t) => `
          <button type="button" data-pd-tab="${t.id}"
            class="shrink-0 px-4 py-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
              t.id === curr
                ? "bg-[#0B3066] text-white shadow-xs"
                : "bg-[var(--leg-surface)] border leg-border leg-text-primary hover:border-amber-500"
            }">
            ${esc(t.label)}
          </button>
        `
      )
      .join("");

    bar.querySelectorAll("[data-pd-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = btn.getAttribute("data-pd-tab");
        paint(next);
        onSelect(next);
      });
    });
  };
  paint(activeId);
}

window.openPortalDashboard = async function () {
  const bridge = getBridge();
  if (!bridge) return;

  await bridge.refreshProfile();
  const { user, profile, db, isPortalUser } = bridge.getSession();

  if (!isPortalUser || !user || !profile || !db) {
    if (typeof window.openSchoolPortalAuth === "function") window.openSchoolPortalAuth("signin");
    return;
  }

  if (profile.role === "pending_teacher" || !profile.approved) {
    alert("Your teacher account is awaiting Principal / Admin verification.");
    return;
  }

  const modal = ensureDashboardModal();
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  if (profile.role === "teacher") {
    mountTeacherDashboard(user, profile, db);
  } else {
    mountStudentDashboard(user, profile, db);
  }
};

// ============================================================================
// 2. STUDENT PERSONALIZED DASHBOARD (INCLUDES CLASS-LOCKED PRACTICE PAPERS)
// ============================================================================
function mountStudentDashboard(user, profile, db) {
  document.getElementById("pd-role-chip").textContent = `STUDENT DASHBOARD • CLASS ${profile.classLevel || "-"} (${profile.stream || "General"})`;
  document.getElementById("pd-user-title").textContent = profile.fullName || user.email;

  const tabs = [
    { id: "stu-notices", label: "📢 My Class Notices" },
    { id: "stu-papers", label: "📝 Practice Papers" },
    { id: "stu-syllabus", label: "📚 My Syllabus" },
    { id: "stu-teachers", label: "💬 Message Teachers" }
  ];

  renderDashTabs(tabs, "stu-notices", (tabId) => {
    if (tabId === "stu-notices") {
      renderStudentNoticesTab(profile, db);
    } else if (tabId === "stu-papers") {
      if (typeof window.renderStudentPracticePapersTab === "function") {
        window.renderStudentPracticePapersTab(profile, db);
      } else {
        document.getElementById("pd-content").innerHTML = `<p class="text-xs leg-text-muted">Practice Papers module is loading... Please tap again.</p>`;
      }
    } else if (tabId === "stu-syllabus") {
      renderStudentSyllabusTab(profile);
    } else if (tabId === "stu-teachers") {
      renderStudentMessagesTab(user, profile, db);
    }
  });

  renderStudentNoticesTab(profile, db);
}

async function renderStudentNoticesTab(profile, db) {
  const box = document.getElementById("pd-content");
  box.innerHTML = `<p class="text-xs leg-text-muted">Loading updates for Class ${esc(profile.classLevel)}...</p>`;

  try {
    const snap = await getDocs(collection(db, "notices"));
    let notices = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    notices.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    const stuClass = String(profile.classLevel || "").trim();
    const filtered = notices.filter((n) => {
      const target = String(n.targetAudience || "All").trim();
      if (!target || target === "All" || target === "All School") return true;
      return target.includes(`Class ${stuClass}`) || target === stuClass;
    });

    if (filtered.length === 0) {
      box.innerHTML = `<div class="p-6 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border text-center text-xs leg-text-muted">No notices for Class ${esc(stuClass)} right now.</div>`;
      return;
    }

    box.innerHTML = `
      <div class="space-y-3">
        ${filtered
          .map(
            (n, idx) => `
              <article data-stu-not-idx="${idx}"
                class="p-4 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border hover:border-amber-500 cursor-pointer space-y-1.5 transition-colors">
                <div class="flex items-center justify-between gap-2 text-[11px] font-mono">
                  <span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                    ${esc(n.tagEn || n.tagHi || "NOTICE")}
                  </span>
                  <span class="leg-text-muted font-bold">${esc(n.date || "")}</span>
                </div>
                <h4 class="text-sm font-extrabold leg-text-primary">${esc(n.titleEn || n.titleHi || "Official Notice")}</h4>
                <p class="text-xs leg-text-body line-clamp-2">${esc(n.descEn || n.descHi || "")}</p>
                <div class="text-[11px] font-bold text-[#0B3066] dark:text-amber-400 pt-1">
                  ${n.authorName ? `By ${esc(n.authorName)} • ` : ""}Tap to open full notice →
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    `;

    box.querySelectorAll("[data-stu-not-idx]").forEach((card) => {
      card.addEventListener("click", () => {
        const bridge = getBridge();
        const item = filtered[Number(card.getAttribute("data-stu-not-idx"))];
        if (item && bridge && typeof bridge.openNoticeViewer === "function") {
          bridge.openNoticeViewer(item);
        }
      });
    });
  } catch (err) {
    box.innerHTML = `<p class="text-xs text-red-500">Error loading notices: ${esc(err.message)}</p>`;
  }
}

function renderStudentSyllabusTab(profile) {
  const box = document.getElementById("pd-content");
  const cls = String(profile.classLevel || "10");
  const stream = String(profile.stream || "General");

  let subjects = ["Hindi", "English", "Mathematics", "Science", "Social Science", "Sanskrit / IT"];
  if (["1", "2", "3", "4", "5", "1-5"].includes(cls)) {
    subjects = ["Hindi", "English", "Mathematics", "Environmental Studies (EVS)", "Moral Education & Art"];
  } else if (["6", "7", "8"].includes(cls)) {
    subjects = ["Hindi", "English", "Mathematics", "Science", "Social Science", "Sanskrit / ICT Computer"];
  } else if (["11", "12"].includes(cls)) {
    if (stream === "Science") {
      subjects = ["Physics (Theory + Practical)", "Chemistry (Theory + Practical)", "Mathematics / Biology", "English Core", "Computer Science / Hindi / Economics"];
    } else if (stream === "Commerce") {
      subjects = ["Accountancy", "Business Studies (BST)", "Economics", "Entrepreneurship / Commercial Math", "English Core"];
    } else {
      subjects = ["History", "Political Science", "Geography", "Economics / Sociology / Hindi Elective", "English Core"];
    }
  }

  box.innerHTML = `
    <div class="p-5 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span class="text-[10px] font-mono font-bold text-[#0B3066] dark:text-amber-400 uppercase">Personalized Curriculum</span>
          <h3 class="text-lg font-extrabold leg-text-primary">Class ${esc(cls)} ${["11", "12"].includes(cls) ? `(${esc(stream)})` : ""} Syllabus</h3>
        </div>
        <div class="flex gap-2">
          <a href="https://jac.jharkhand.gov.in/" target="_blank" rel="noopener noreferrer"
            class="px-3 py-1.5 rounded-lg bg-[#0B3066] text-white text-xs font-bold">JAC Portal ↗</a>
          <a href="https://ncert.nic.in/textbook.php" target="_blank" rel="noopener noreferrer"
            class="px-3 py-1.5 rounded-lg bg-[#f59e0b] text-slate-950 text-xs font-extrabold">NCERT Books ↗</a>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        ${subjects
          .map(
            (sub, i) => `
              <div class="p-3.5 rounded-xl bg-[var(--leg-surface)] border leg-border flex items-center gap-3 text-sm font-bold leg-text-primary">
                <span class="w-7 h-7 rounded-lg bg-[#0B3066] text-amber-300 flex items-center justify-center text-xs font-mono">${i + 1}</span>
                <span>${esc(sub)}</span>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

async function renderStudentMessagesTab(user, profile, db) {
  const box = document.getElementById("pd-content");
  box.innerHTML = `<p class="text-xs leg-text-muted">Loading verified teachers &amp; your messages...</p>`;

  try {
    const tSnap = await getDocs(
      query(collection(db, "users"), where("role", "==", "teacher"), where("approved", "==", true))
    );
    const teachers = tSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));

    const mSnap = await getDocs(query(collection(db, "messages"), where("studentUid", "==", user.uid)));
    const myMsgs = mSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    myMsgs.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    box.innerHTML = `
      <div class="space-y-5">
        <form id="stu-msg-form" class="p-4 sm:p-5 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border space-y-3 text-xs">
          <h4 class="text-sm font-extrabold leg-text-primary">Ask a Doubt to Verified Faculty</h4>
          ${
            teachers.length === 0
              ? `<p class="leg-text-muted">No verified faculty accounts active yet.</p>`
              : `
                <div>
                  <label class="block font-bold leg-text-muted mb-1">Select Teacher *</label>
                  <select id="stu-msg-teacher" required class="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary font-bold">
                    ${teachers
                      .map(
                        (t) => `<option value="${esc(t.uid)}" data-tname="${esc(t.fullName)}">${esc(t.fullName)} — ${esc(t.subject || "Faculty")}</option>`
                      )
                      .join("")}
                  </select>
                </div>
                <div>
                  <label class="block font-bold leg-text-muted mb-1">Your Academic Question / Message *</label>
                  <textarea id="stu-msg-text" required rows="3" maxlength="500" placeholder="Write your question clearly..."
                    class="w-full px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary"></textarea>
                </div>
                <div id="stu-msg-status" class="hidden p-2.5 rounded-xl font-bold"></div>
                <button type="submit" class="px-5 py-2.5 rounded-xl bg-[#0B3066] hover:bg-[#14438a] text-white font-extrabold cursor-pointer">
                  Send Message →
                </button>
              `
          }
        </form>

        <div class="space-y-2.5">
          <h4 class="text-sm font-extrabold leg-text-primary">My Sent Messages &amp; Replies (${myMsgs.length})</h4>
          ${
            myMsgs.length === 0
              ? `<p class="text-xs leg-text-muted">You haven't sent any messages yet.</p>`
              : myMsgs
                  .map(
                    (m) => `
                      <div class="p-4 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border space-y-2 text-xs">
                        <div class="flex items-center justify-between">
                          <strong class="leg-text-primary">To: ${esc(m.teacherName || "Teacher")}</strong>
                          <span class="text-[10px] font-mono ${m.reply ? "text-emerald-600 dark:text-emerald-400" : "leg-text-muted"} font-bold">
                            ${m.reply ? "✓ Replied" : "Sent"}
                          </span>
                        </div>
                        <p class="leg-text-body">${esc(m.text)}</p>
                        ${
                          m.reply
                            ? `<div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 leg-text-primary">
                                 <span class="text-[10px] font-mono font-extrabold text-emerald-700 dark:text-emerald-300 block mb-0.5">TEACHER REPLY</span>
                                 ${esc(m.reply)}
                               </div>`
                            : ""
                        }
                      </div>
                    `
                  )
                  .join("")
          }
        </div>
      </div>
    `;

    const form = document.getElementById("stu-msg-form");
    if (form && teachers.length > 0) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const sel = document.getElementById("stu-msg-teacher");
        const teacherUid = sel.value;
        const teacherName = sel.options[sel.selectedIndex].getAttribute("data-tname") || "Teacher";
        const text = document.getElementById("stu-msg-text").value.trim();
        const st = document.getElementById("stu-msg-status");
        if (!text) return;

        try {
          await addDoc(collection(db, "messages"), {
            studentUid: user.uid,
            studentName: profile.fullName || user.email,
            studentClass: profile.classLevel || "",
            studentStream: profile.stream || "General",
            teacherUid,
            teacherName,
            text,
            read: false,
            reply: "",
            createdAt: new Date().toISOString()
          });
          st.className = "p-2.5 rounded-xl font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 block";
          st.textContent = "✓ Message sent to " + teacherName;
          setTimeout(() => renderStudentMessagesTab(user, profile, db), 700);
        } catch (err) {
          st.className = "p-2.5 rounded-xl font-bold bg-red-500/15 text-red-600 block";
          st.textContent = "Error: " + err.message;
        }
      });
    }
  } catch (err) {
    box.innerHTML = `<p class="text-xs text-red-500">Error loading teacher directory: ${esc(err.message)}</p>`;
  }
}

// ============================================================================
// 3. VERIFIED TEACHER COMMAND STUDIO (INBOX + QUESTION PAPER MAKER + NOTICES)
// ============================================================================
async function mountTeacherDashboard(user, profile, db) {
  document.getElementById("pd-role-chip").textContent = `VERIFIED FACULTY STUDIO • ${profile.designation || "TEACHER"} (${profile.subject || "General"})`;
  document.getElementById("pd-user-title").textContent = profile.fullName || user.email;

  let unreadCount = 0;
  try {
    const snap = await getDocs(query(collection(db, "messages"), where("teacherUid", "==", user.uid)));
    unreadCount = snap.docs.filter((d) => !d.data().read).length;
  } catch (e) {}

  const inboxLabel = unreadCount > 0 ? `📬 Student Inbox (${unreadCount} Unread)` : "📬 Student Inbox";
  const tabs = [
    { id: "tch-inbox", label: inboxLabel },
    { id: "tch-papers", label: "📝 Question Paper Maker" },
    { id: "tch-publish", label: "📢 Publish Notice / Material" },
    { id: "tch-my-notices", label: "🗂️ My Published Notices" }
  ];

  renderDashTabs(tabs, "tch-inbox", (tabId) => {
    if (tabId === "tch-inbox") {
      renderTeacherInboxTab(user, profile, db);
    } else if (tabId === "tch-papers") {
      if (typeof window.renderTeacherQuestionPaperStudio === "function") {
        window.renderTeacherQuestionPaperStudio(user, profile, db);
      } else {
        document.getElementById("pd-content").innerHTML = `<p class="text-xs leg-text-muted">Question Paper Studio is loading... Please tap again.</p>`;
      }
    } else if (tabId === "tch-publish") {
      renderTeacherPublishTab(user, profile, db);
    } else if (tabId === "tch-my-notices") {
      renderTeacherMyNoticesTab(user, db);
    }
  });

  renderTeacherInboxTab(user, profile, db);
}

// TAB 1: TEACHER UNREAD INBOX
async function renderTeacherInboxTab(user, profile, db) {
  const box = document.getElementById("pd-content");
  box.innerHTML = `<p class="text-xs leg-text-muted">Loading student messages...</p>`;

  try {
    const snap = await getDocs(query(collection(db, "messages"), where("teacherUid", "==", user.uid)));
    const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    msgs.sort((a, b) => {
      if (Boolean(a.read) !== Boolean(b.read)) return a.read ? 1 : -1;
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });

    if (msgs.length === 0) {
      box.innerHTML = `<div class="p-6 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border text-center text-xs leg-text-muted">No student messages in your inbox yet.</div>`;
      return;
    }

    box.innerHTML = `
      <div class="space-y-3">
        ${msgs
          .map(
            (m) => `
              <div class="p-4 rounded-2xl bg-[var(--leg-surface-alt)] border ${m.read ? "leg-border" : "border-amber-500"} space-y-2.5 text-xs">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <strong class="leg-text-primary">${esc(m.studentName || "Student")}</strong>
                    <span class="ml-1.5 px-2 py-0.5 rounded bg-[#0B3066] text-amber-300 font-mono text-[10px]">
                      Class ${esc(m.studentClass || "-")} ${m.studentStream ? "• " + esc(m.studentStream) : ""}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    ${!m.read ? `<span class="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-[10px] font-extrabold">UNREAD</span>` : ""}
                    <button type="button" data-rep-stu="${esc(m.studentUid)}" data-rep-name="${esc(m.studentName)}"
                      class="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 font-bold cursor-pointer">
                      🚩 Report Fake
                    </button>
                  </div>
                </div>

                <p class="p-3 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary">${esc(m.text)}</p>

                ${
                  m.reply
                    ? `<div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 leg-text-primary">
                         <strong>Your Reply:</strong> ${esc(m.reply)}
                       </div>`
                    : `<div class="flex gap-2">
                         <input type="text" data-reply-inp="${esc(m.id)}" placeholder="Write a quick reply to student..."
                           class="flex-1 px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary" />
                         <button type="button" data-reply-send="${esc(m.id)}"
                           class="px-4 py-2 rounded-xl bg-[#0B3066] text-white font-extrabold cursor-pointer">Reply</button>
                       </div>`
                }
              </div>
            `
          )
          .join("")}
      </div>
    `;

    box.querySelectorAll("[data-reply-send]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-reply-send");
        const inp = box.querySelector(`[data-reply-inp="${id}"]`);
        const reply = inp ? inp.value.trim() : "";
        if (!reply) return;
        btn.disabled = true;
        await updateDoc(doc(db, "messages", id), { reply, read: true });
        renderTeacherInboxTab(user, profile, db);
      });
    });

    box.querySelectorAll("[data-rep-stu]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const studentUid = btn.getAttribute("data-rep-stu");
        const studentName = btn.getAttribute("data-rep-name");
        const reason = prompt(`Report "${studentName}" as fake/abusive? Enter short reason:`);
        if (!reason || !reason.trim()) return;
        await addDoc(collection(db, "reports"), {
          studentUid,
          studentName,
          reportedByUid: user.uid,
          reportedByName: profile.fullName || user.email,
          reason: reason.trim(),
          createdAt: new Date().toISOString()
        });
        alert("Report sent to School Admin for immediate review.");
      });
    });
  } catch (err) {
    box.innerHTML = `<p class="text-xs text-red-500">Inbox error: ${esc(err.message)}</p>`;
  }
}

// TAB 3: TEACHER MULTI-OPTION NOTICE & MATERIAL PUBLISHER
function renderTeacherPublishTab(user, profile, db) {
  compressedNoticeImage = "";
  const box = document.getElementById("pd-content");

  box.innerHTML = `
    <form id="tch-publish-form" class="p-4 sm:p-5 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border space-y-4 text-xs">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label class="block font-bold leg-text-muted mb-1">Notice Category *</label>
          <select id="tp-tag" class="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary font-bold">
            <option value="OFFICIAL NOTICE">📢 Official School Notice</option>
            <option value="EXAM / JAC UPDATE">📝 Exam / JAC Board Update</option>
            <option value="STUDY MATERIAL">📚 Notes / Homework / Study Material</option>
            <option value="URGENT ALERT">🚨 Urgent Alert</option>
            <option value="HOLIDAY">🗓️ Holiday / Timing Update</option>
            <option value="EVENT / NCC">🏆 School Event / Sports / NCC</option>
          </select>
        </div>

        <div>
          <label class="block font-bold leg-text-muted mb-1">Target Audience</label>
          <select id="tp-target" class="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary font-bold">
            <option value="All School">All School (Class 1–12)</option>
            <option value="Class 12">Class 12 (+2)</option>
            <option value="Class 11">Class 11 (+2)</option>
            <option value="Class 10">Class 10 (Matric)</option>
            <option value="Class 9">Class 9</option>
            <option value="Class 8">Class 8</option>
            <option value="Class 7">Class 7</option>
            <option value="Class 6">Class 6</option>
            <option value="Class 1–5">Primary (Class 1–5)</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block font-bold leg-text-muted mb-1">Notice Headline *</label>
        <input id="tp-title" type="text" required placeholder="e.g. Pre-Board Practical Schedule for Class 12 Science"
          class="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary font-semibold" />
      </div>

      <div>
        <label class="block font-bold leg-text-muted mb-1">Details / Message *</label>
        <textarea id="tp-desc" rows="3" required placeholder="Write clear instructions for students and parents..."
          class="w-full px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary"></textarea>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label class="block font-bold leg-text-muted mb-1">Google Drive PDF / YouTube Link (Optional)</label>
          <input id="tp-link" type="url" placeholder="https://drive.google.com/file/d/..."
            class="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary" />
        </div>

        <div>
          <label class="block font-bold leg-text-muted mb-1">Attach Photo / Circular Image (Optional)</label>
          <input id="tp-img" type="file" accept="image/*"
            class="w-full text-[11px] leg-text-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#0B3066] file:text-white file:font-bold" />
          <div id="tp-img-preview" class="hidden mt-1.5 text-[11px] font-bold text-emerald-600"></div>
        </div>
      </div>

      <label class="inline-flex items-center gap-2 font-bold leg-text-primary cursor-pointer">
        <input id="tp-urgent" type="checkbox" checked class="w-4 h-4 accent-amber-500" />
        <span>Highlight as NEW / Urgent on Live Marquee</span>
      </label>

      <div id="tp-status" class="hidden p-3 rounded-xl font-bold"></div>

      <button type="submit" id="tp-submit-btn"
        class="w-full min-h-[44px] py-2.5 rounded-xl bg-[#0B3066] hover:bg-[#14438a] text-white font-extrabold uppercase tracking-wider shadow cursor-pointer">
        🚀 Publish Live to Notice Board
      </button>
    </form>
  `;

  document.getElementById("tp-img").addEventListener("change", async (e) => {
    const f = e.target.files && e.target.files[0];
    const prev = document.getElementById("tp-img-preview");
    if (!f) {
      compressedNoticeImage = "";
      prev.classList.add("hidden");
      return;
    }
    prev.textContent = "Compressing image...";
    prev.classList.remove("hidden");
    try {
      compressedNoticeImage = await compressImageFile(f);
      const kb = Math.round((compressedNoticeImage.length * 3) / 4 / 1024);
      prev.textContent = `✓ Image ready (${kb} KB)`;
    } catch (err) {
      prev.textContent = "Could not process image.";
    }
  });

  document.getElementById("tch-publish-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("tp-submit-btn");
    const st = document.getElementById("tp-status");
    btn.disabled = true;
    btn.textContent = "PUBLISHING...";

    try {
      const tag = document.getElementById("tp-tag").value;
      const title = document.getElementById("tp-title").value.trim();
      const desc = document.getElementById("tp-desc").value.trim();
      const payload = {
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        tagEn: tag,
        tagHi: tag,
        titleEn: title,
        titleHi: title,
        descEn: desc,
        descHi: desc,
        targetAudience: document.getElementById("tp-target").value,
        attachmentUrl: document.getElementById("tp-link").value.trim(),
        imageDataUrl: compressedNoticeImage,
        isNew: document.getElementById("tp-urgent").checked,
        authorUid: user.uid,
        authorName: profile.fullName || user.email,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "notices"), payload);
      compressedNoticeImage = "";
      e.target.reset();
      document.getElementById("tp-img-preview").classList.add("hidden");
      st.className = "p-3 rounded-xl font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 block";
      st.textContent = "✓ Notice published live to the school website!";
      const bridge = getBridge();
      if (bridge && typeof bridge.refreshNotices === "function") bridge.refreshNotices();
    } catch (err) {
      st.className = "p-3 rounded-xl font-bold bg-red-500/15 text-red-600 block";
      st.textContent = "Publish error: " + err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = "🚀 Publish Live to Notice Board";
    }
  });
}

// TAB 4: TEACHER'S OWN PUBLISHED NOTICES
async function renderTeacherMyNoticesTab(user, db) {
  const box = document.getElementById("pd-content");
  box.innerHTML = `<p class="text-xs leg-text-muted">Loading your published notices...</p>`;

  try {
    const snap = await getDocs(query(collection(db, "notices"), where("authorUid", "==", user.uid)));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    if (list.length === 0) {
      box.innerHTML = `<div class="p-6 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border text-center text-xs leg-text-muted">You haven't published any notices yet.</div>`;
      return;
    }

    box.innerHTML = `
      <div class="space-y-2.5">
        ${list
          .map(
            (n) => `
              <div class="p-3.5 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border flex items-center justify-between gap-3 text-xs">
                <div class="min-w-0">
                  <div class="font-extrabold leg-text-primary truncate">${esc(n.titleEn || n.titleHi)}</div>
                  <div class="text-[11px] leg-text-muted">${esc(n.date || "")} • ${esc(n.targetAudience || "All School")}</div>
                </div>
                <button type="button" data-del-mynot="${esc(n.id)}"
                  class="shrink-0 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 font-bold cursor-pointer">
                  Delete
                </button>
              </div>
            `
          )
          .join("")}
      </div>
    `;

    box.querySelectorAll("[data-del-mynot]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this notice permanently?")) return;
        await deleteDoc(doc(db, "notices", btn.getAttribute("data-del-mynot")));
        const bridge = getBridge();
        if (bridge && typeof bridge.refreshNotices === "function") bridge.refreshNotices();
        renderTeacherMyNoticesTab(user, db);
      });
    });
  } catch (err) {
    box.innerHTML = `<p class="text-xs text-red-500">Error: ${esc(err.message)}</p>`;
  }
}

// ============================================================================
// 4. ADMIN REPORTS COMPATIBILITY MODULE
// ============================================================================
window.refreshAdminReportsModule = async function () {
  const dashView = document.getElementById("admin-dashboard-view");
  const bridge = getBridge();
  if (!dashView || !bridge) return;

  const { user, db } = bridge.getSession();
  if (!user || !db) return;

  let section = document.getElementById("admin-reports-section");
  if (!section) {
    section = document.createElement("div");
    section.id = "admin-reports-section";
    section.className = "space-y-3 border-t border-red-500/35 pt-6 mt-6";
    section.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <h4 class="text-base sm:text-lg font-extrabold text-red-400">5. Teacher Reports — Flagged / Fake Students</h4>
        <button id="admin-refresh-reports-btn" type="button"
          class="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/35 text-red-300 font-mono text-[11px] font-bold cursor-pointer">
          ↻ Refresh
        </button>
      </div>
      <div id="admin-reports-list" class="space-y-2.5 max-h-72 overflow-y-auto"></div>
    `;
    dashView.appendChild(section);
    document.getElementById("admin-refresh-reports-btn").addEventListener("click", window.refreshAdminReportsModule);
  }

  const listEl = document.getElementById("admin-reports-list");
  if (!listEl) return;
  listEl.innerHTML = `<p class="text-xs text-slate-400">Checking teacher reports...</p>`;

  try {
    const snap = await getDocs(collection(db, "reports"));
    const reports = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    reports.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    if (reports.length === 0) {
      listEl.innerHTML = `<p class="text-xs text-slate-400">No flagged student reports right now.</p>`;
      return;
    }

    listEl.innerHTML = reports
      .map(
        (r) => `
          <div class="p-3 rounded-xl bg-red-950/35 border border-red-500/35 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <div class="font-bold text-white">${esc(r.studentName)} <span class="text-red-300 font-normal">(by ${esc(r.reportedByName)})</span></div>
              <div class="text-slate-300 mt-0.5">Reason: ${esc(r.reason)}</div>
            </div>
            <div class="flex gap-1.5">
              <button type="button" data-ban-uid="${esc(r.studentUid)}" data-rep-id="${esc(r.id)}"
                class="px-2.5 py-1 rounded bg-red-600 text-white font-bold cursor-pointer">Delete Account</button>
              <button type="button" data-dismiss-rep="${esc(r.id)}"
                class="px-2.5 py-1 rounded bg-white/10 text-slate-200 font-bold cursor-pointer">Dismiss</button>
            </div>
          </div>
        `
      )
      .join("");

    listEl.querySelectorAll("[data-ban-uid]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this student's portal profile?")) return;
        await deleteDoc(doc(db, "users", btn.getAttribute("data-ban-uid")));
        await deleteDoc(doc(db, "reports", btn.getAttribute("data-rep-id")));
        window.refreshAdminReportsModule();
      });
    });

    listEl.querySelectorAll("[data-dismiss-rep]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await deleteDoc(doc(db, "reports", btn.getAttribute("data-dismiss-rep")));
        window.refreshAdminReportsModule();
      });
    });
  } catch (err) {
    listEl.innerHTML = `<p class="text-xs text-red-400">Error: ${esc(err.message)}</p>`;
  }
};

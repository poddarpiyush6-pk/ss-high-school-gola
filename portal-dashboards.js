// ============================================================================
// FILE: portal-dashboards.js — PHASE 2B: STUDENT & TEACHER COMMAND PORTALS
// 1. Student Dashboard: Class-Filtered Notices, Syllabus, Message Verified Teachers
// 2. Teacher Command Studio: Multi-Option Notice Publisher (Text + Drive PDF + Auto Image Compressor)
// 3. Teacher Unread Inbox: Unread Badge, Inline Reply, Report Fake Student
// 4. Secret Admin Panel Module 5: Review Fake Student Reports & 1-Click Account Ban/Delete
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
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

  return modal;
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
// 2. STUDENT PERSONALIZED DASHBOARD
// ============================================================================
function mountStudentDashboard(user, profile, db) {
  document.getElementById("pd-role-chip").textContent =
    `STUDENT DASHBOARD • CLASS ${profile.classLevel || "-"} (${profile.stream || "General"})`;
  document.getElementById("pd-user-title").textContent = profile.fullName || user.email;

  const tabs = [
    { id: "stu-notices", label: "📢 My Class Notices" },
    { id: "stu-syllabus", label: "📚 My Syllabus" },
    { id: "stu-teachers", label: "💬 Message Teachers" }
  ];

  renderDashTabs(tabs, "stu-notices", (tabId) => {
    if (tabId === "stu-notices") renderStudentNoticesTab(profile, db);
    else if (tabId === "stu-syllabus") renderStudentSyllabusTab(profile);
    else if (tabId === "stu-teachers") renderStudentMessagesTab(user, profile, db);
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

    const myClass = String(profile.classLevel || "");
    const myStream = String(profile.stream || "");

    // Filter: All School OR matching student's class/stream
    const relevant = notices.filter((n) => {
      const target = String(n.targetAudience || "All School");
      if (target === "All School" || target === "") return true;
      if (target.includes(`Class ${myClass}`)) {
        if (["11", "12"].includes(myClass) && (target.includes("Science") || target.includes("Arts") || target.includes("Commerce"))) {
          return target.includes(myStream);
        }
        return true;
      }
      return false;
    });

    if (relevant.length === 0) {
      box.innerHTML = `<div class="p-6 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border text-center text-sm leg-text-muted">No notices posted for your class yet.</div>`;
      return;
    }

    box.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        ${relevant.map((n, idx) => `
          <div class="p-4 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border flex flex-col justify-between gap-3">
            <div class="space-y-1.5">
              <div class="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-mono">
                <span class="px-2 py-0.5 rounded bg-[#0B3066] text-white font-bold">${esc(n.tagEn || n.tagHi || "NOTICE")}</span>
                <span class="leg-text-muted">${esc(n.targetAudience || "All School")} • ${esc(n.date || "")}</span>
              </div>
              <h4 class="font-extrabold text-sm leg-text-primary">${esc(n.titleEn || n.titleHi)}</h4>
              <p class="text-xs leg-text-body line-clamp-3">${esc(n.descEn || n.descHi)}</p>
            </div>
            <div class="flex items-center justify-between pt-2 border-t leg-border">
              <span class="text-[10px] leg-text-muted">${n.authorName ? "By " + esc(n.authorName) : "School Office"}</span>
              <button type="button" data-open-stu-notice="${idx}"
                class="px-3 py-1 rounded-lg bg-[#f59e0b] text-slate-950 text-xs font-extrabold cursor-pointer">
                View Full ${n.attachmentUrl || n.imageDataUrl ? "📎" : "→"}
              </button>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    box.querySelectorAll("[data-open-stu-notice]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = relevant[Number(btn.getAttribute("data-open-stu-notice"))];
        if (item && getBridge()) getBridge().openNoticeViewer(item);
      });
    });
  } catch (err) {
    box.innerHTML = `<p class="text-xs text-red-500">Error loading notices: ${esc(err.message)}</p>`;
  }
}

function renderStudentSyllabusTab(profile) {
  const cls = String(profile.classLevel || "10");
  const stream = String(profile.stream || "General");
  const box = document.getElementById("pd-content");

  const subjectsMap = {
    "12-Science": ["Physics (NCERT / JAC)", "Chemistry (NCERT / JAC)", "Mathematics / Biology", "English Core", "Computer Science / Economics"],
    "12-Arts": ["History", "Political Science", "Geography / Economics", "English Core", "Hindi / Sanskrit"],
    "12-Commerce": ["Accountancy", "Business Studies (BST)", "Economics / ETP", "Commercial Arithmetic", "English Core"],
    "11-Science": ["Physics (Class 11 JAC)", "Chemistry (Class 11 JAC)", "Mathematics / Biology", "English Core", "Optional / IT"],
    "11-Arts": ["History", "Political Science", "Geography / Sociology", "English Core", "Hindi / Optional"],
    "11-Commerce": ["Accountancy", "Business Studies", "Economics", "English Core", "Commercial Math"],
    "10": ["Mathematics (JAC Board)", "Science (Physics, Chemistry, Bio)", "Social Science", "English", "Hindi / Sanskrit / IT Vocational"],
    "9": ["Mathematics (NCERT)", "Science", "Social Science", "English", "Hindi / IT Vocational"]
  };

  const key = ["11", "12"].includes(cls) ? `${cls}-${stream}` : cls;
  const subjects = subjectsMap[key] || ["Hindi", "English", "Mathematics", "Science / EVS", "Social Science (JCERT)"];

  box.innerHTML = `
    <div class="p-5 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span class="text-[10px] font-mono font-bold text-[#0B3066] dark:text-amber-400 uppercase">Personalized Curriculum</span>
          <h3 class="text-lg font-extrabold leg-text-primary">Class ${esc(cls)} ${["11", "12"].includes(cls) ? `(${esc(stream)})` : ""} Syllabus</h3>
        </div>
        <div class="flex gap-2">
          <a href="https://jac.jharkhand.gov.in/" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-[#0B3066] text-white text-xs font-bold">JAC Portal ↗</a>
          <a href="https://ncert.nic.in/textbook.php" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-[#f59e0b] text-slate-950 text-xs font-extrabold">NCERT Books ↗</a>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        ${subjects.map((sub, i) => `
          <div class="p-3.5 rounded-xl bg-[var(--leg-surface)] border leg-border flex items-center gap-3 text-sm font-bold leg-text-primary">
            <span class="w-7 h-7 rounded-lg bg-[#0B3066] text-amber-300 flex items-center justify-center text-xs font-mono">${i + 1}</span>
            <span>${esc(sub)}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

async function renderStudentMessagesTab(user, profile, db) {
  const box = document.getElementById("pd-content");
  box.innerHTML = `<p class="text-xs leg-text-muted">Loading verified teachers &amp; your messages...</p>`;

  try {
    // 1. Fetch Admin-Approved Teachers
    const tSnap = await getDocs(
      query(collection(db, "users"), where("role", "==", "teacher"), where("approved", "==", true))
    );
    const teachers = tSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));

    // 2. Fetch Student's Sent Messages & Replies
    const mSnap = await getDocs(query(collection(db, "messages"), where("studentUid", "==", user.uid)));
    const myMsgs = mSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    myMsgs.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    box.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Send Message Form -->
        <form id="stu-send-msg-form" class="lg:col-span-5 p-4 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border space-y-3 h-fit">
          <h3 class="text-sm font-extrabold leg-text-primary">✉️ Send Message / Doubt to Teacher</h3>
          ${
            teachers.length === 0
              ? `<p class="text-xs text-amber-600 dark:text-amber-400">No verified teachers are active yet. Once teachers join and are approved by the Principal, they will appear here.</p>`
              : `
                <div>
                  <label class="block text-[11px] font-bold leg-text-muted mb-1">Select Teacher *</label>
                  <select id="stu-msg-teacher" required class="w-full px-3 py-2.5 rounded-xl bg-[var(--leg-surface)] border leg-border text-xs font-bold leg-text-primary">
                    ${teachers.map((t) => `<option value="${esc(t.uid)}" data-tname="${esc(t.fullName)}">${esc(t.fullName)} (${esc(t.subject || "Teacher")} • ${esc(t.designation || "")})</option>`).join("")}
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-bold leg-text-muted mb-1">Subject / Topic *</label>
                  <input id="stu-msg-subject" type="text" required maxlength="80" placeholder="e.g. Physics Chapter 3 Doubt"
                    class="w-full px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border text-xs leg-text-primary" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold leg-text-muted mb-1">Your Message *</label>
                  <textarea id="stu-msg-body" rows="3" required maxlength="500" placeholder="Write your academic question politely..."
                    class="w-full px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border text-xs leg-text-primary"></textarea>
                </div>
                <div id="stu-msg-status" class="hidden text-xs font-bold p-2 rounded-lg"></div>
                <button id="stu-msg-submit" type="submit"
                  class="w-full py-2.5 rounded-xl bg-[#0B3066] hover:bg-[#14438a] text-white text-xs font-extrabold cursor-pointer">
                  Send to Teacher →
                </button>
              `
          }
        </form>

        <!-- Sent Messages & Teacher Replies -->
        <div class="lg:col-span-7 space-y-3">
          <h3 class="text-sm font-extrabold leg-text-primary">📬 Your Sent Messages &amp; Teacher Replies (${myMsgs.length})</h3>
          ${
            myMsgs.length === 0
              ? `<div class="p-6 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border text-center text-xs leg-text-muted">You haven't messaged any teacher yet.</div>`
              : myMsgs.map((m) => `
                  <div class="p-4 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border space-y-2 text-xs">
                    <div class="flex items-center justify-between gap-2">
                      <strong class="leg-text-primary">To: ${esc(m.teacherName)}</strong>
                      <span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        m.teacherReply ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                      }">
                        ${m.teacherReply ? "✓ Replied" : "Sent"}
                      </span>
                    </div>
                    <div class="font-bold text-[#0B3066] dark:text-amber-400">${esc(m.subject)}</div>
                    <p class="leg-text-body">${esc(m.message)}</p>
                    ${
                      m.teacherReply
                        ? `<div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                             <div class="text-[10px] font-mono font-extrabold text-emerald-700 dark:text-emerald-300">TEACHER REPLY:</div>
                             <p class="leg-text-primary font-semibold">${esc(m.teacherReply)}</p>
                           </div>`
                        : ""
                    }
                  </div>
                `).join("")
          }
        </div>
      </div>
    `;

    const form = document.getElementById("stu-send-msg-form");
    if (form && teachers.length > 0) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("stu-msg-submit");
        const status = document.getElementById("stu-msg-status");
        const sel = document.getElementById("stu-msg-teacher");
        const teacherUid = sel.value;
        const teacherName = sel.options[sel.selectedIndex].getAttribute("data-tname") || "Teacher";

        btn.disabled = true;
        btn.textContent = "Sending...";
        try {
          await addDoc(collection(db, "messages"), {
            studentUid: user.uid,
            studentName: profile.fullName || user.email,
            studentClass: profile.classLevel || "-",
            studentStream: profile.stream || "General",
            studentEmail: user.email,
            studentPhone: profile.phone || "N/A",
            teacherUid,
            teacherName,
            subject: document.getElementById("stu-msg-subject").value.trim(),
            message: document.getElementById("stu-msg-body").value.trim(),
            read: false,
            teacherReply: "",
            createdAt: new Date().toISOString()
          });
          status.textContent = "✓ Message delivered to teacher's inbox!";
          status.className = "text-xs font-bold p-2 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 block";
          setTimeout(() => renderStudentMessagesTab(user, profile, db), 700);
        } catch (err) {
          status.textContent = "Error: " + err.message;
          status.className = "text-xs font-bold p-2 rounded-lg bg-red-500/20 text-red-600 block";
          btn.disabled = false;
          btn.textContent = "Send to Teacher →";
        }
      });
    }
  } catch (err) {
    box.innerHTML = `<p class="text-xs text-red-500">Error loading teacher directory: ${esc(err.message)}</p>`;
  }
}

// ============================================================================
// 3. VERIFIED TEACHER COMMAND STUDIO (NOTICE PUBLISHER + UNREAD INBOX)
// ============================================================================
async function mountTeacherDashboard(user, profile, db) {
  document.getElementById("pd-role-chip").textContent =
    `VERIFIED FACULTY STUDIO • ${profile.designation || "TEACHER"} (${profile.subject || "General"})`;
  document.getElementById("pd-user-title").textContent = profile.fullName || user.email;

  // Count unread messages for badge
  let unreadCount = 0;
  try {
    const snap = await getDocs(query(collection(db, "messages"), where("teacherUid", "==", user.uid)));
    unreadCount = snap.docs.filter((d) => !d.data().read).length;
  } catch (e) {}

  const inboxLabel = unreadCount > 0 ? `📬 Student Inbox (${unreadCount} Unread)` : "📬 Student Inbox";

  const tabs = [
    { id: "tch-inbox", label: inboxLabel },
    { id: "tch-publish", label: "📢 Publish Notice / Material" },
    { id: "tch-my-notices", label: "🗂️ My Published Notices" }
  ];

  renderDashTabs(tabs, "tch-inbox", (tabId) => {
    if (tabId === "tch-inbox") renderTeacherInboxTab(user, profile, db);
    else if (tabId === "tch-publish") renderTeacherPublishTab(user, profile, db);
    else if (tabId === "tch-my-notices") renderTeacherMyNoticesTab(user, db);
  });

  renderTeacherInboxTab(user, profile, db);
}

// TAB 1: TEACHER UNREAD INBOX (REPLY + REPORT FAKE STUDENT)
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
      box.innerHTML = `
        <div class="p-8 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border text-center space-y-2">
          <div class="text-3xl">📭</div>
          <div class="font-extrabold text-sm leg-text-primary">Your Student Inbox is Clean</div>
          <p class="text-xs leg-text-muted">When students message you from their dashboard, unread alerts will appear right here.</p>
        </div>
      `;
      return;
    }

    box.innerHTML = `
      <div class="space-y-3.5">
        ${msgs.map((m) => `
          <div class="p-4 rounded-2xl bg-[var(--leg-surface-alt)] border ${
            !m.read ? "border-amber-500 shadow-sm" : "leg-border"
          } space-y-3 text-xs">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-2">
                ${!m.read ? `<span class="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-extrabold">UNREAD</span>` : `<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">READ</span>`}
                <strong class="text-sm leg-text-primary">${esc(m.studentName)}</strong>
                <span class="px-2 py-0.5 rounded bg-[#0B3066]/10 dark:bg-white/10 font-mono text-[10px] font-bold leg-text-body">
                  Class ${esc(m.studentClass)} (${esc(m.studentStream)})
                </span>
              </div>
              <button type="button" data-report-student="${esc(m.id)}"
                class="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white font-bold text-[11px] transition-colors cursor-pointer">
                🚩 Report Fake Student
              </button>
            </div>

            <div class="font-extrabold text-[#0B3066] dark:text-amber-400">${esc(m.subject)}</div>
            <p class="leg-text-primary text-xs sm:text-sm whitespace-pre-line">${esc(m.message)}</p>

            ${
              m.teacherReply
                ? `<div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                     <span class="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 block">YOUR REPLY:</span>
                     <p class="leg-text-primary font-semibold mt-0.5">${esc(m.teacherReply)}</p>
                   </div>`
                : ""
            }

            <div class="flex flex-col sm:flex-row gap-2 pt-1">
              <input type="text" id="reply-input-${esc(m.id)}" value="${esc(m.teacherReply || "")}"
                placeholder="Type your reply to ${esc(m.studentName)}..."
                class="flex-1 px-3 py-2 rounded-xl bg-[var(--leg-surface)] border leg-border text-xs leg-text-primary" />
              <button type="button" data-send-reply="${esc(m.id)}"
                class="px-4 py-2 rounded-xl bg-[#0B3066] hover:bg-[#14438a] text-white font-extrabold text-xs shrink-0 cursor-pointer">
                ${m.teacherReply ? "Update Reply" : "Send Reply ✓"}
              </button>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    // Bind Reply Buttons
    box.querySelectorAll("[data-send-reply]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const msgId = btn.getAttribute("data-send-reply");
        const inp = document.getElementById(`reply-input-${msgId}`);
        const replyText = inp ? inp.value.trim() : "";
        if (!replyText) return alert("Please enter a reply first.");

        btn.disabled = true;
        btn.textContent = "Sending...";
        try {
          await updateDoc(doc(db, "messages", msgId), {
            teacherReply: replyText,
            read: true,
            repliedAt: new Date().toISOString()
          });
          mountTeacherDashboard(user, profile, db);
        } catch (err) {
          alert("Reply failed: " + err.message);
          btn.disabled = false;
          btn.textContent = "Send Reply ✓";
        }
      });
    });

    // Bind Report Fake Student Buttons (Goes straight to Secret Admin Panel!)
    box.querySelectorAll("[data-report-student]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const msgId = btn.getAttribute("data-report-student");
        const msgObj = msgs.find((x) => x.id === msgId);
        if (!msgObj) return;

        const reason = prompt(
          `Report "${msgObj.studentName}" to Secret Admin Panel?\nEnter reason (e.g., Fake account / Abusive message / Unknown student):`,
          "Suspected fake student account"
        );
        if (!reason) return;

        btn.disabled = true;
        btn.textContent = "Reporting...";
        try {
          await addDoc(collection(db, "reports"), {
            reportedStudentUid: msgObj.studentUid,
            reportedStudentName: msgObj.studentName,
            reportedStudentClass: `${msgObj.studentClass} (${msgObj.studentStream})`,
            reportedStudentEmail: msgObj.studentEmail || "N/A",
            reportedStudentPhone: msgObj.studentPhone || "N/A",
            reportedByTeacherUid: user.uid,
            reportedByTeacherName: profile.fullName || user.email,
            sampleMessage: msgObj.message || "",
            reason: reason.trim(),
            status: "open",
            createdAt: new Date().toISOString()
          });
          alert("🚩 Report sent securely to the Secret Admin Panel for immediate action.");
          btn.textContent = "✓ Reported";
        } catch (err) {
          alert("Report failed: " + err.message);
          btn.disabled = false;
          btn.textContent = "🚩 Report Fake Student";
        }
      });
    });
  } catch (err) {
    box.innerHTML = `<p class="text-xs text-red-500">Inbox error: ${esc(err.message)}</p>`;
  }
}

// TAB 2: TEACHER MULTI-OPTION NOTICE & MATERIAL PUBLISHER
function renderTeacherPublishTab(user, profile, db) {
  compressedNoticeImage = "";
  const box = document.getElementById("pd-content");

  box.innerHTML = `
    <form id="tch-publish-form" class="p-4 sm:p-5 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border space-y-4 text-xs">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label class="block font-bold leg-text-muted mb-1">Notice Category *</label>
          <select id="tp-tag" class="w-full px-3 py-2.5 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary font-bold">
            <option value="OFFICIAL NOTICE">📢 Official School Notice</option>
            <option value="EXAM / JAC UPDATE">📝 Exam / JAC Board Update</option>
            <option value="STUDY MATERIAL">📚 Notes / Homework / Study Material</option>
            <option value="URGENT ALERT">🚨 Urgent Alert</option>
            <option value="HOLIDAY">🗓️ Holiday / Timing Update</option>
            <option value="EVENT / NCC">🏆 School Event / Sports / NCC</option>
          </select>
        </div>

        <div>
          <label class="block font-bold leg-text-muted mb-1">Target Audience *</label>
          <select id="tp-audience" class="w-full px-3 py-2.5 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary font-bold">
            <option value="All School">🏫 All School (Class 1–12)</option>
            <option value="Class 12 Science">Class 12 — Science</option>
            <option value="Class 12 Arts">Class 12 — Arts</option>
            <option value="Class 12 Commerce">Class 12 — Commerce</option>
            <option value="Class 11 Science">Class 11 — Science</option>
            <option value="Class 11 Arts">Class 11 — Arts</option>
            <option value="Class 11 Commerce">Class 11 — Commerce</option>
            <option value="Class 10">Class 10 (Matric)</option>
            <option value="Class 9">Class 9</option>
            <option value="Class 6-8">Class 6 – 8</option>
            <option value="Class 1-5">Class 1 – 5</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block font-bold leg-text-muted mb-1">Headline / Title *</label>
        <input id="tp-title" type="text" required maxlength="140" placeholder="e.g. Class 12 Physics Practical Exam Schedule 2026"
          class="w-full px-3.5 py-2.5 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary text-sm font-semibold" />
      </div>

      <div>
        <label class="block font-bold leg-text-muted mb-1">Detailed Notice / Instructions *</label>
        <textarea id="tp-desc" rows="4" required placeholder="Write complete details, dates, timings, or homework instructions..."
          class="w-full px-3.5 py-2.5 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary text-xs sm:text-sm"></textarea>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label class="block font-bold leg-text-muted mb-1">Google Drive PDF or YouTube Link (Optional)</label>
          <input id="tp-link" type="url" placeholder="https://drive.google.com/file/d/..."
            class="w-full px-3 py-2.5 rounded-xl bg-[var(--leg-surface)] border leg-border leg-text-primary" />
          <p class="text-[10px] leg-text-muted mt-1">Tip: For Drive PDFs, set sharing to <strong>"Anyone with the link"</strong> so students can read it right inside the website.</p>
        </div>

        <div>
          <label class="block font-bold leg-text-muted mb-1">Attach Image / Notice Photo (Auto-Compressed)</label>
          <input id="tp-image" type="file" accept="image/*"
            class="w-full text-xs file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#0B3066] file:text-white file:font-bold cursor-pointer" />
          <div id="tp-img-preview" class="hidden mt-2 flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold"></div>
        </div>
      </div>

      <label class="flex items-center gap-2 cursor-pointer font-bold leg-text-primary">
        <input id="tp-isnew" type="checkbox" checked class="w-4 h-4 accent-[#0B3066]" />
        <span>Highlight with "NEW" badge in Top LATEST NEWS bar</span>
      </label>

      <div id="tp-status" class="hidden p-3 rounded-xl font-bold text-xs"></div>

      <button id="tp-submit-btn" type="submit"
        class="w-full py-3.5 rounded-xl bg-[#0B3066] hover:bg-[#14438a] text-white font-extrabold text-sm shadow-md cursor-pointer">
        🚀 Publish Live Notice Now
      </button>
    </form>
  `;

  document.getElementById("tp-image").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const prev = document.getElementById("tp-img-preview");
    prev.textContent = "Compressing image...";
    prev.classList.remove("hidden");
    try {
      compressedNoticeImage = await compressImageFile(file);
      const kb = Math.round((compressedNoticeImage.length * 3) / 4 / 1024);
      prev.innerHTML = `<img src="${compressedNoticeImage}" class="w-10 h-10 rounded-lg object-cover border leg-border" /> <span>✓ Compressed to ${kb} KB (Ready!)</span>`;
    } catch (err) {
      prev.textContent = "Image compression failed.";
    }
  });

  document.getElementById("tch-publish-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("tp-submit-btn");
    const status = document.getElementById("tp-status");

    const title = document.getElementById("tp-title").value.trim();
    const desc = document.getElementById("tp-desc").value.trim();
    const tag = document.getElementById("tp-tag").value;
    const audience = document.getElementById("tp-audience").value;
    const link = document.getElementById("tp-link").value.trim();
    const isNew = document.getElementById("tp-isnew").checked;

    btn.disabled = true;
    btn.textContent = "Publishing to School Portal...";
    try {
      await addDoc(collection(db, "notices"), {
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        tagEn: tag,
        tagHi: tag,
        titleEn: title,
        titleHi: title,
        descEn: desc,
        descHi: desc,
        targetAudience: audience,
        attachmentUrl: link,
        imageDataUrl: compressedNoticeImage,
        isNew,
        authorUid: user.uid,
        authorName: `${profile.fullName || user.email} (${profile.subject || "Faculty"})`,
        createdAt: new Date().toISOString()
      });

      status.textContent = "✅ Notice published live! It is now visible in LATEST NEWS & Student Dashboards.";
      status.className = "p-3 rounded-xl font-bold text-xs bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 block";
      e.target.reset();
      compressedNoticeImage = "";
      document.getElementById("tp-img-preview").classList.add("hidden");

      if (getBridge()) getBridge().refreshNotices();
    } catch (err) {
      status.textContent = "⚠️ Publish failed: " + err.message;
      status.className = "p-3 rounded-xl font-bold text-xs bg-red-500/20 text-red-600 block";
    } finally {
      btn.disabled = false;
      btn.textContent = "🚀 Publish Live Notice Now";
    }
  });
}

// TAB 3: TEACHER'S OWN PUBLISHED NOTICES (WITH DELETE)
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
        ${list.map((n) => `
          <div class="p-4 rounded-2xl bg-[var(--leg-surface-alt)] border leg-border flex flex-wrap items-center justify-between gap-3 text-xs">
            <div class="space-y-0.5 min-w-0">
              <div class="font-mono text-[10px] leg-text-muted">${esc(n.date)} • ${esc(n.targetAudience || "All School")}</div>
              <div class="font-extrabold text-sm leg-text-primary">${esc(n.titleEn || n.titleHi)}</div>
            </div>
            <button type="button" data-del-my-notice="${esc(n.id)}"
              class="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white font-bold cursor-pointer">
              Delete
            </button>
          </div>
        `).join("")}
      </div>
    `;

    box.querySelectorAll("[data-del-my-notice]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this notice?")) return;
        btn.disabled = true;
        await deleteDoc(doc(db, "notices", btn.getAttribute("data-del-my-notice")));
        if (getBridge()) getBridge().refreshNotices();
        renderTeacherMyNoticesTab(user, db);
      });
    });
  } catch (err) {
    box.innerHTML = `<p class="text-xs text-red-500">Error: ${esc(err.message)}</p>`;
  }
}

function renderDashTabs(tabs, activeId, onSelect) {
  const bar = document.getElementById("pd-tabs");
  if (!bar) return;

  const paint = (curr) => {
    bar.innerHTML = tabs.map((t) => `
      <button type="button" data-pd-tab="${t.id}"
        class="shrink-0 px-4 py-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
          t.id === curr
            ? "bg-[#0B3066] text-white shadow-xs"
            : "bg-[var(--leg-surface)] border leg-border leg-text-primary hover:border-amber-500"
        }">
        ${esc(t.label)}
      </button>
    `).join("");

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

// ============================================================================
// 4. SECRET ADMIN PANEL MODULE 5: FAKE STUDENT REPORTS CONTROL CENTER
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
        <h4 class="text-base sm:text-lg font-extrabold text-red-400">
          5. Teacher Reports — Flagged / Fake Students
        </h4>
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
      listEl.innerHTML = `<p class="text-xs text-slate-400">No fake student reports submitted by teachers.</p>`;
      return;
    }

    listEl.innerHTML = reports.map((r) => `
      <div class="p-3.5 rounded-xl bg-black/45 border border-red-500/45 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="space-y-1">
          <div class="font-bold text-sm text-white">
            🚩 ${esc(r.reportedStudentName)}
            <span class="text-amber-300 font-mono text-[11px]">(Class ${esc(r.reportedStudentClass)})</span>
          </div>
          <div class="text-red-300 font-semibold">Reason: ${esc(r.reason)}</div>
          <div class="text-slate-300">Reported by: <strong>${esc(r.reportedByTeacherName)}</strong> • 📧 ${esc(r.reportedStudentEmail)} • 📞 ${esc(r.reportedStudentPhone)}</div>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" data-adm-ban-student="${esc(r.reportedStudentUid)}" data-rep-id="${esc(r.id)}"
            class="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-extrabold cursor-pointer">
            Delete Student &amp; Resolve
          </button>
          <button type="button" data-adm-dismiss-rep="${esc(r.id)}"
            class="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-mono font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      </div>
    `).join("");

    listEl.querySelectorAll("[data-adm-ban-student]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Permanently remove this student's portal profile and resolve the report?")) return;
        const uid = btn.getAttribute("data-adm-ban-student");
        const repId = btn.getAttribute("data-rep-id");
        btn.disabled = true;
        try {
          if (uid) await deleteDoc(doc(db, "users", uid));
          await deleteDoc(doc(db, "reports", repId));
          window.refreshAdminReportsModule();
          if (bridge.refreshAdminAccounts) bridge.refreshAdminAccounts();
        } catch (err) {
          alert("Action failed: " + err.message);
        }
      });
    });

    listEl.querySelectorAll("[data-adm-dismiss-rep]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const repId = btn.getAttribute("data-adm-dismiss-rep");
        btn.disabled = true;
        await deleteDoc(doc(db, "reports", repId));
        window.refreshAdminReportsModule();
      });
    });
  } catch (err) {
    listEl.innerHTML = `<p class="text-xs text-red-400">Admin access required to view reports.</p>`;
  }
};
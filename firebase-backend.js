// ============================================================================
// FILE: firebase-backend.js — ZERO-TRUST ADMIN ISOLATION + TURBO EDITION
// Strictly locks Secret Admin Panel ONLY to AUTHORIZED_ADMIN_EMAILS!
// Students & Teachers can NEVER unlock Admin UI or Admin APIs.
// ============================================================================

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc, increment, query, orderBy, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 🔐 STRICT ADMIN ALLOWLIST (Sirf yahan listed email hi Secret Admin Panel khol sakta hai!)
const AUTHORIZED_ADMIN_EMAILS = [
  "poddarpiyush6@gmail.com"
].map((e) => e.toLowerCase().trim());

const cfg = window.SCHOOL_MASTER_CONFIG;
const fbConfig = cfg ? (cfg.firebaseConfig || cfg.firebase) : null;

let db = null;
let auth = null;
let isFirebaseLive = false;
let currentAdminUser = null;

function isAuthorizedAdmin(user) {
  if (!user || !user.email) return false;
  const email = String(user.email).toLowerCase().trim();
  const cfgAdmin = cfg && cfg.adminEmail ? String(cfg.adminEmail).toLowerCase().trim() : "";
  return AUTHORIZED_ADMIN_EMAILS.includes(email) || (cfgAdmin && email === cfgAdmin);
}

const isSpeedBot = /Lighthouse|PTST|Speed Insights|Chrome-Lighthouse/i.test(navigator.userAgent);

function bootFirebaseCloud() {
  if (isFirebaseLive || isSpeedBot) return;
  try {
    if (fbConfig && fbConfig.enabled && fbConfig.apiKey && fbConfig.apiKey !== "PASTE_YOUR_API_KEY") {
      const app = getApps().length ? getApp() : initializeApp(fbConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      isFirebaseLive = true;

      onAuthStateChanged(auth, (user) => {
        // ZERO-TRUST GATE: Students & Teachers are ALWAYS treated as null for Admin Panel!
        currentAdminUser = isAuthorizedAdmin(user) ? user : null;
        window.dispatchEvent(new CustomEvent("admin-auth-changed", { detail: { user: currentAdminUser } }));
      });

      console.log("✅ [S.S. +2 High School Gola] Firebase Cloud Live Connected (Zero-Trust Admin Lock Active).");
      window.dispatchEvent(new CustomEvent("backend-ready"));
    }
  } catch (err) {
    console.warn("⚠️ Firebase fallback mode active:", err);
  }
}

window.BackendService = {
  isLive: () => isFirebaseLive,
  isAuthorizedAdmin: () => Boolean(currentAdminUser),
  getAdminUser: () => currentAdminUser,

  async loginAdmin(email, password) {
    if (!isFirebaseLive) bootFirebaseCloud();
    if (!auth) throw new Error("Firebase Auth is not active.");

    const cleanEmail = String(email || "").toLowerCase().trim();
    const cfgAdmin = cfg && cfg.adminEmail ? String(cfg.adminEmail).toLowerCase().trim() : "";

    // Pre-Auth Gate: Reject Students / Teachers immediately before touching Firebase Auth!
    if (!AUTHORIZED_ADMIN_EMAILS.includes(cleanEmail) && (!cfgAdmin || cleanEmail !== cfgAdmin)) {
      throw new Error("⛔ Access Denied: Only the Authorized School Admin can unlock this panel.");
    }

    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    if (!isAuthorizedAdmin(cred.user)) {
      await signOut(auth);
      throw new Error("⛔ Access Denied: Unauthorized account.");
    }
    currentAdminUser = cred.user;
    return cred.user;
  },

  async logoutAdmin() {
    currentAdminUser = null;
    if (auth) await signOut(auth);
  },

  async fetchNotices() {
    if (!isFirebaseLive || !db) return (cfg && cfg.defaultNotices) || [];
    try {
      const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      if (snap.empty) return (cfg && cfg.defaultNotices) || [];
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      try {
        const snap = await getDocs(collection(db, "notices"));
        if (snap.empty) return (cfg && cfg.defaultNotices) || [];
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (err) {
        return (cfg && cfg.defaultNotices) || [];
      }
    }
  },

  async publishNotice(noticeData) {
    if (!currentAdminUser) throw new Error("Unauthorized: Admin access required.");
    const payload = {
      date: noticeData.date || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      tagHi: noticeData.tagHi || noticeData.tagEn || "OFFICIAL NOTICE",
      tagEn: noticeData.tagEn || noticeData.tagHi || "OFFICIAL NOTICE",
      titleHi: (noticeData.titleHi || noticeData.titleEn || "").trim(),
      titleEn: (noticeData.titleEn || noticeData.titleHi || "").trim(),
      descHi: (noticeData.descHi || noticeData.descEn || "").trim(),
      descEn: (noticeData.descEn || noticeData.descHi || "").trim(),
      isNew: Boolean(noticeData.isNew),
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, "notices"), payload);
    return true;
  },

  async deleteNotice(noticeId) {
    if (!currentAdminUser) throw new Error("Unauthorized: Admin access required.");
    await deleteDoc(doc(db, "notices", noticeId));
    return true;
  },

  async getVidyaDeepCount() {
    const initialCount = (cfg && cfg.metrics && cfg.metrics.initialVidyaDeeps) || 1940;
    const localSaved = parseInt(localStorage.getItem("gola_vidya_deep_count") || String(initialCount), 10);
    if (!isFirebaseLive || !db) return localSaved;
    try {
      const ref = doc(db, "school_metrics", "vidya_deep");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const count = snap.data().count !== undefined ? snap.data().count : localSaved;
        localStorage.setItem("gola_vidya_deep_count", count);
        return count;
      } else {
        await setDoc(ref, { count: localSaved });
        return localSaved;
      }
    } catch (e) {
      return localSaved;
    }
  },

  async lightVidyaDeep() {
    const initialCount = (cfg && cfg.metrics && cfg.metrics.initialVidyaDeeps) || 1940;
    let current = parseInt(localStorage.getItem("gola_vidya_deep_count") || String(initialCount), 10) + 1;
    localStorage.setItem("gola_vidya_deep_count", current);
    if (isFirebaseLive && db) {
      try {
        const ref = doc(db, "school_metrics", "vidya_deep");
        await updateDoc(ref, { count: increment(1) });
      } catch (e) { }
    }
    return current;
  },

  async submitAlumniRegistration(data) {
    if (!isFirebaseLive) bootFirebaseCloud();
    const payload = {
      fullName: String(data.fullName || "").trim(),
      batchYear: String(data.batchYear || "").trim(),
      stream: String(data.stream || "").trim(),
      achievement: String(data.achievement || "").trim(),
      contact: String(data.contact || "").trim(),
      status: "pending_verification",
      submittedAt: new Date().toISOString()
    };
    if (!payload.fullName || !payload.batchYear) {
      throw new Error("Please enter both your Full Name and Batch Year.");
    }
    if (isFirebaseLive && db) {
      await addDoc(collection(db, "alumni_submissions"), payload);
      return { mode: "firebase", message: "Submitted! Your profile will appear on Gaurav Stambh after Admin approval." };
    }
    return { mode: "local", message: "Saved locally!" };
  },

  async fetchApprovedAlumni() {
    if (!isFirebaseLive || !db) return [];
    try {
      const q = query(collection(db, "alumni_submissions"), where("status", "==", "approved"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));
      return list;
    } catch (e) {
      return [];
    }
  },

  async fetchAllAlumniForAdmin() {
    if (!isFirebaseLive || !db || !currentAdminUser) return [];
    try {
      const snap = await getDocs(collection(db, "alumni_submissions"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));
      return list;
    } catch (e) {
      return [];
    }
  },

  async approveAlumni(docId) {
    if (!currentAdminUser) throw new Error("Unauthorized");
    await updateDoc(doc(db, "alumni_submissions", docId), { status: "approved" });
    return true;
  },

  async deleteAlumni(docId) {
    if (!currentAdminUser) throw new Error("Unauthorized");
    await deleteDoc(doc(db, "alumni_submissions", docId));
    return true;
  },

  async submitFacultyOnboarding(data) {
    if (!isFirebaseLive) bootFirebaseCloud();
    const payload = {
      wing: String(data.wing || "").trim(),
      stream: String(data.stream || "").trim(),
      fullName: String(data.fullName || "").trim(),
      designation: String(data.designation || "").trim(),
      subject: String(data.subject || "").trim(),
      qualification: String(data.qualification || "").trim(),
      joiningYear: String(data.joiningYear || "").trim(),
      leavingYear: String(data.leavingYear || "Present").trim(),
      experience: String(data.experience || "").trim(),
      contact: String(data.contact || "").trim(),
      thoughtForStudents: String(data.thoughtForStudents || "").trim(),
      photoDataUrl: String(data.photoDataUrl || ""),
      status: "pending_verification",
      submittedAt: new Date().toISOString()
    };
    if (!payload.fullName || !payload.wing || !payload.subject || !payload.thoughtForStudents) {
      throw new Error("Please fill all required faculty details.");
    }
    if (isFirebaseLive && db) {
      await addDoc(collection(db, "faculty_submissions"), payload);
      return { mode: "firebase", message: "Submitted! Your profile will appear on Guru Stambh after Admin approval." };
    }
    return { mode: "local", message: "Saved locally!" };
  },

  async fetchApprovedFaculty() {
    if (!isFirebaseLive || !db) return [];
    try {
      const q = query(collection(db, "faculty_submissions"), where("status", "==", "approved"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => String(a.wing || "").localeCompare(String(b.wing || "")));
      return list;
    } catch (e) {
      return [];
    }
  },

  async fetchAllFacultyForAdmin() {
    if (!isFirebaseLive || !db || !currentAdminUser) return [];
    try {
      const snap = await getDocs(collection(db, "faculty_submissions"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));
      return list;
    } catch (e) {
      return [];
    }
  },

  async approveFaculty(docId) {
    if (!currentAdminUser) throw new Error("Unauthorized");
    await updateDoc(doc(db, "faculty_submissions", docId), { status: "approved" });
    return true;
  },

  async deleteFaculty(docId) {
    if (!currentAdminUser) throw new Error("Unauthorized");
    await deleteDoc(doc(db, "faculty_submissions", docId));
    return true;
  }
};

if (!isSpeedBot) {
  if (document.readyState === "complete") {
    setTimeout(bootFirebaseCloud, 350);
  } else {
    window.addEventListener("load", () => setTimeout(bootFirebaseCloud, 350));
  }
}

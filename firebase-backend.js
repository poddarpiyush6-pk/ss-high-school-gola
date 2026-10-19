// ============================================================================
// FILE: firebase-backend.js — STABLE FIREBASE CLOUD ENGINE
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, collection, getDocs, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc, increment, query, where 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const cfg = window.SCHOOL_MASTER_CONFIG;
let db = null;
let auth = null;
let isFirebaseLive = false;
let currentAdminUser = null;

try {
  if (cfg && cfg.firebase && cfg.firebase.enabled && cfg.firebase.apiKey !== "PASTE_YOUR_API_KEY") {
    const app = initializeApp(cfg.firebase);
    db = getFirestore(app);
    auth = getAuth(app);
    isFirebaseLive = true;

    onAuthStateChanged(auth, (user) => {
      currentAdminUser = user;
      window.dispatchEvent(new CustomEvent('admin-auth-changed', { detail: { user } }));
    });

    console.log("✅ [S.S. +2 High School Gola] Firebase Cloud Connected Successfully.");
  }
} catch (err) {
  console.warn("⚠️ Firebase fallback mode active:", err);
}

window.BackendService = {
  isLive: () => isFirebaseLive,
  getAdminUser: () => currentAdminUser,

  async loginAdmin(email, password) {
    if (!auth) throw new Error("Firebase Auth सक्रिय नहीं है।");
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return cred.user;
  },

  async logoutAdmin() {
    if (auth) await signOut(auth);
  },

  async fetchNotices() {
    if (!isFirebaseLive || !db) return cfg.defaultNotices || [];
    try {
      const snap = await getDocs(collection(db, "notices"));
      if (snap.empty) return cfg.defaultNotices || [];
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => String(b.createdAt || b.date || '').localeCompare(String(a.createdAt || a.date || '')));
      return list;
    } catch (e) {
      return cfg.defaultNotices || [];
    }
  },

  async publishNotice(noticeData) {
    if (!currentAdminUser) throw new Error("Unauthorized");
    const payload = {
      date: noticeData.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      tagHi: noticeData.tagHi || "आधिकारिक सूचना",
      tagEn: noticeData.tagEn || "OFFICIAL NOTICE",
      titleHi: noticeData.titleHi.trim(),
      titleEn: (noticeData.titleEn || noticeData.titleHi).trim(),
      descHi: noticeData.descHi.trim(),
      descEn: (noticeData.descEn || noticeData.descHi).trim(),
      isNew: Boolean(noticeData.isNew),
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, "notices"), payload);
    return true;
  },

  async deleteNotice(noticeId) {
    if (!currentAdminUser) throw new Error("Unauthorized");
    await deleteDoc(doc(db, "notices", noticeId));
    return true;
  },

  // Vidya Deep counter with base 0 reset as requested
  async getVidyaDeepCount() {
    const localSaved = parseInt(localStorage.getItem("gola_vidya_deep_count") || "0", 10);
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
    let current = parseInt(localStorage.getItem("gola_vidya_deep_count") || "0", 10) + 1;
    localStorage.setItem("gola_vidya_deep_count", current);
    if (isFirebaseLive && db) {
      try {
        const ref = doc(db, "school_metrics", "vidya_deep");
        await updateDoc(ref, { count: increment(1) });
      } catch (e) {}
    }
    return current;
  },

  async submitAlumniRegistration(data) {
    const payload = {
      fullName: String(data.fullName || '').trim(),
      batchYear: String(data.batchYear || '').trim(),
      stream: String(data.stream || '').trim(),
      achievement: String(data.achievement || '').trim(),
      contact: String(data.contact || '').trim(),
      status: "pending",
      submittedAt: new Date().toISOString()
    };

    if (!payload.fullName || !payload.batchYear) {
      throw new Error("कृपया नाम और बैच वर्ष अवश्य भरें।");
    }

    if (isFirebaseLive && db) {
      await addDoc(collection(db, "alumni_submissions"), payload);
    }

    return {
      mode: isFirebaseLive ? "firebase" : "local",
      message: "आपका विवरण सफलतापूर्वक दर्ज हो गया है! एडमिन अप्रूवल के तुरंत बाद यह गौरव स्तंभ पर लाइव चमकेगा।"
    };
  },

  async fetchApprovedAlumni() {
    if (!isFirebaseLive || !db) return [];
    try {
      const q = query(collection(db, "alumni_submissions"), where("status", "==", "approved"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));
      return list;
    } catch (e) {
      return [];
    }
  },

  async fetchAllAlumniForAdmin() {
    if (!isFirebaseLive || !db || !currentAdminUser) return [];
    try {
      const snap = await getDocs(collection(db, "alumni_submissions"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));
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
    const payload = {
      wing: String(data.wing || '').trim(),
      stream: String(data.stream || '').trim(),
      fullName: String(data.fullName || '').trim(),
      designation: String(data.designation || '').trim(),
      subject: String(data.subject || '').trim(),
      qualification: String(data.qualification || '').trim(),
      joiningYear: String(data.joiningYear || '').trim(),
      leavingYear: String(data.leavingYear || 'Present').trim(),
      experience: String(data.experience || '').trim(),
      contact: String(data.contact || '').trim(),
      thoughtForStudents: String(data.thoughtForStudents || '').trim(),
      photoDataUrl: String(data.photoDataUrl || ''),
      status: "pending",
      submittedAt: new Date().toISOString()
    };

    if (!payload.fullName || !payload.wing || !payload.subject || !payload.thoughtForSchools && !payload.thoughtForStudents) {
      throw new Error("कृपया सभी अनिवार्य विवरण (नाम, वर्ग, विषय एवं संदेश) भरें।");
    }

    if (isFirebaseLive && db) {
      await addDoc(collection(db, "faculty_submissions"), payload);
    }

    return {
      mode: isFirebaseLive ? "firebase" : "local",
      message: "आदरणीय गुरुजी, आपका विवरण सफलतापूर्वक दर्ज हो गया है! प्रधानाचार्य/एडमिन सत्यापन के तुरंत बाद आपका प्रोफाइल 'गुरु स्तंभ' पर लाइव दिखेगा।"
    };
  },

  async fetchApprovedFaculty() {
    if (!isFirebaseLive || !db) return [];
    try {
      const q = query(collection(db, "faculty_submissions"), where("status", "==", "approved"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => String(a.wing || '').localeCompare(String(b.wing || '')));
      return list;
    } catch (e) {
      return [];
    }
  },

  async fetchAllFacultyForAdmin() {
    if (!isFirebaseLive || !db || !currentAdminUser) return [];
    try {
      const snap = await getDocs(collection(db, "faculty_submissions"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));
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

window.dispatchEvent(new CustomEvent('backend-ready'));

// ============================================================================
// FILE: firebase-backend.js — CLOUD FIRESTORE + ZERO-TRUST ADMIN AUTH ENGINE
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, increment, addDoc, query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
    getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const cfg = window.SCHOOL_MASTER_CONFIG;
let db = null;
let auth = null;
let isFirebaseLive = false;
let currentAdminUser = null;

if (cfg.firebaseConfig && cfg.firebaseConfig.enabled && cfg.firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY") {
    try {
        const app = initializeApp(cfg.firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        isFirebaseLive = true;

        onAuthStateChanged(auth, (user) => {
            currentAdminUser = user || null;
            window.dispatchEvent(new CustomEvent("admin-auth-changed", { detail: { user: currentAdminUser } }));
        });

        console.log("✅ [Apex Backend] Firebase Firestore & Admin Auth Connected!");
    } catch (err) {
        console.warn("⚠️ [Apex Backend] Firebase Init Fallback:", err.message);
    }
}

window.BackendService = {
    isLive: () => isFirebaseLive,
    getAdminUser: () => currentAdminUser,

    // --- ADMIN AUTHENTICATION ---
    async loginAdmin(email, password) {
        if (!isFirebaseLive || !auth) throw new Error("Firebase is not enabled in config.js");
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        return cred.user;
    },

    async logoutAdmin() {
        if (auth) await signOut(auth);
    },

    // --- 1. NOTICES (PUBLIC READ + ADMIN CREATE/DELETE) ---
    async fetchNotices() {
        if (!isFirebaseLive) return cfg.defaultNotices;
        try {
            const snap = await getDocs(collection(db, "notices"));
            if (snap.empty) return cfg.defaultNotices;
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort newest first
            return list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        } catch (e) {
            return cfg.defaultNotices;
        }
    },

    async publishNotice(noticeData) {
        if (!currentAdminUser) throw new Error("Unauthorized: कृपया पहले एडमिन लॉगिन करें।");
        const cleanNotice = {
            date: String(noticeData.date || "").trim() || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            tagHi: String(noticeData.tagHi || "आवश्यक सूचना").trim(),
            tagEn: String(noticeData.tagEn || "OFFICIAL NOTICE").trim(),
            titleHi: String(noticeData.titleHi || "").trim(),
            titleEn: String(noticeData.titleEn || noticeData.titleHi || "").trim(),
            descHi: String(noticeData.descHi || "").trim(),
            descEn: String(noticeData.descEn || noticeData.descHi || "").trim(),
            isNew: Boolean(noticeData.isNew),
            createdAtMs: Date.now(),
            createdAt: serverTimestamp()
        };
        if (!cleanNotice.titleHi || !cleanNotice.descHi) {
            throw new Error("कृपया नोटिस का शीर्षक और विवरण अवश्य भरें।");
        }
        await addDoc(collection(db, "notices"), cleanNotice);
    },

    async deleteNotice(noticeId) {
        if (!currentAdminUser) throw new Error("Unauthorized");
        await deleteDoc(doc(db, "notices", noticeId));
    },

    // --- 2. VIDYA DEEP COUNTER ---
    async getVidyaDeepCount() {
        const localCount = parseInt(localStorage.getItem("gola_vidya_deep_count") || cfg.metrics.initialVidyaDeeps, 10);
        if (!isFirebaseLive) return localCount;
        try {
            const ref = doc(db, "school_metrics", "vidya_deep");
            const snap = await getDoc(ref);
            if (snap.exists()) return snap.data().count || localCount;
            await setDoc(ref, { count: cfg.metrics.initialVidyaDeeps });
            return cfg.metrics.initialVidyaDeeps;
        } catch (e) {
            return localCount;
        }
    },

    async lightVidyaDeep() {
        const current = await this.getVidyaDeepCount();
        const next = current + 1;
        localStorage.setItem("gola_vidya_deep_count", String(next));
        if (isFirebaseLive) {
            try {
                const ref = doc(db, "school_metrics", "vidya_deep");
                await updateDoc(ref, { count: increment(1) });
            } catch (e) {
                console.warn("Vidya Deep local sync:", e.message);
            }
        }
        return next;
    },

    // --- 3. ALUMNI SUBMISSIONS (PUBLIC SUBMIT + ADMIN APPROVE/DELETE) ---
    async submitAlumniRegistration(payload) {
        const cleanPayload = {
            fullName: String(payload.fullName || "").trim().slice(0, 80),
            batchYear: String(payload.batchYear || "").trim().slice(0, 20),
            stream: String(payload.stream || "").trim().slice(0, 40),
            achievement: String(payload.achievement || "").trim().slice(0, 250),
            contact: String(payload.contact || "").trim().slice(0, 50),
            status: "pending_verification",
            submittedAt: isFirebaseLive ? serverTimestamp() : new Date().toISOString()
        };

        if (!cleanPayload.fullName || !cleanPayload.batchYear) {
            throw new Error("कृपया अपना नाम और बैच वर्ष अवश्य भरें।");
        }

        if (isFirebaseLive) {
            await addDoc(collection(db, "alumni_submissions"), cleanPayload);
            return { mode: "cloud", message: "आपका विवरण सुरक्षित रूप से सत्यापन (Verification) हेतु दर्ज हो गया है!" };
        } else {
            return { mode: "local", message: "डेमो मोड: विवरण दर्ज हो गया है!" };
        }
    },

    async fetchApprovedAlumni() {
        if (!isFirebaseLive) return [];
        try {
            const q = query(collection(db, "alumni_submissions"), where("status", "==", "approved"));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({
                id: d.id,
                fullName: d.data().fullName,
                batchYear: d.data().batchYear,
                stream: d.data().stream,
                achievement: d.data().achievement
            }));
        } catch (e) {
            return [];
        }
    },

    // Admin-Only: Fetch Pending & Approved Alumni for 1-Click Moderation
    async fetchAllAlumniForAdmin() {
        if (!isFirebaseLive || !currentAdminUser) return [];
        const snap = await getDocs(collection(db, "alumni_submissions"));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async approveAlumni(docId) {
        if (!currentAdminUser) throw new Error("Unauthorized");
        await updateDoc(doc(db, "alumni_submissions", docId), { status: "approved" });
    },

    async deleteAlumni(docId) {
        if (!currentAdminUser) throw new Error("Unauthorized");
        await deleteDoc(doc(db, "alumni_submissions", docId));
    }
};

window.dispatchEvent(new CustomEvent("backend-ready"));
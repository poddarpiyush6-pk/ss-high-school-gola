// ============================================================================
// FILE 1: config.js — DEVELOPER MASTER CONFIGURATION
// CTRL+F "[EDIT_HERE]" karke apna data kabhi bhi badlein!
// ============================================================================

window.SCHOOL_MASTER_CONFIG = {
    // 1. [EDIT_HERE_FIREBASE] -> Apna Free Firebase Project bana kar keys yahan dalein
    // Jab tak aap keys nahi dalte, website automatically Niche diye Static Data par chalegi (Zero Crash!)
    firebaseConfig: {
        enabled: true, // <-- Firebase keys dalne ke baad ise `true` kar dein
        apiKey: "AIzaSyC0c61WOMy4KbPNGsReB69_pT-IUkY5N7w",
        authDomain: "our-school-as-a-temple.firebaseapp.com",
        projectId: "our-school-as-a-temple",
        storageBucket: "our-school-as-a-temple.firebasestorage.app",
        messagingSenderId: "475486264472",
        appId: "1:475486264472:web:d3eb0eaf5484e3b78b04ed"
    },

    // 2. School Ground Truth Identity (Locked)
    identity: {
        nameHi: "राज्य संपोषित +2 उच्च विद्यालय, गोला",
        nameEn: "S.S. +2 HIGH SCHOOL, GOLA",
        establishedYear: "1940",
        udiseCode: "20240701206",
        shlokaSanskrit: "॥ सा विद्या या विमुक्तये • न हि ज्ञानेन सदृशं पवित्रमिह विद्यते ॥",
        shlokaMeaningHi: "इस संसार में ज्ञान के समान पवित्र करने वाला निःसंदेह कुछ भी नहीं है; सच्ची विद्या वही है जो अज्ञान एवं बाधाओं से मुक्ति दिलाए।",
        shlokaMeaningEn: "Verily, there is nothing in this world as purifying as true knowledge; Education is that which liberates."
    },

    // 3. [EDIT_HERE_STUDENT_COUNT] -> Students ki sankhya yahan badlein
    metrics: {
        studentStrength: "", // Add an official student count when it is verified.
        initialVidyaDeeps: 1940  // Default sacred lamp counter
    },

    // 4. [EDIT_HERE_PRINCIPAL_MESSAGE] -> Principal Smt. Anupa Pushpa Tirkey ji ka sandesh
    principal: {
        nameHi: "श्रीमती अनुपा पुष्पा तिर्की",
        nameEn: "Smt. Anupa Pushpa Tirkey",
        designationHi: "प्रधानाचार्य (Principal), राज्य संपोषित +2 उच्च विद्यालय, गोला",
        designationEn: "Principal, S.S. +2 High School, Gola (Ramgarh)",
        messageHi: "हमारा विद्यालय केवल ईंट और पत्थरों की इमारत नहीं, बल्कि ज्ञान और संस्कार का एक जीवंत मंदिर है। सन् 1940 से अनवरत प्रज्ज्वलित यह शिक्षा-दीप गोला और रामगढ़ के प्रत्येक विद्यार्थी के भीतर अनुशासन, वैज्ञानिक दृष्टिकोण और राष्ट्रभक्ति का संचार करने के लिए समर्पित है।",
        messageEn: "Our school is not merely a structure of brick and mortar, but a living temple of wisdom and character. Since 1940, this sacred lamp of learning has stood dedicated to nurturing discipline, scientific temper, and excellence in every child of Gola."
    },

    // 5. [EDIT_HERE_NOTICES] -> Default Notices (Agar Firebase बंद hai toh ye dikhenge)
    defaultNotices: [
        {
            id: "N-01",
            date: "16 Oct 2026",
            tagHi: "अति महत्वपूर्ण",
            tagEn: "URGENT",
            isNew: true,
            titleHi: "ई-कल्याण एवं सावित्रीबाई फुले किशोरी समृद्धि योजना (2026-27) दस्तावेज़ सत्यापन",
            titleEn: "Document Verification for e-Kalyan & Savitribai Phule Kishori Samriddhi Yojana (2026-27)",
            descHi: "कक्षा 8 से 12 तक के सभी पात्र छात्र-छात्राएं अपना आय, जाति प्रमाण पत्र, आधार सीडेड बैंक पासबुक एवं अंकतालिका कार्यालय में जमा करें।",
            descEn: "All eligible students from Class 8 to 12 must submit Income, Caste Certificate, Aadhaar-seeded Passbook, and marksheet to the office."
        },
        {
            id: "N-02",
            date: "12 Oct 2026",
            tagHi: "जैक बोर्ड एवं लैब",
            tagEn: "JAC EXAM & LAB",
            isNew: true,
            titleHi: "JAC वार्षिक बोर्ड परीक्षा (10वीं/12वीं) एवं साइंस/ICT प्रैक्टिकल शेड्यूल",
            titleEn: "JAC Annual Board Exam (10th/12th) & Science/ICT Practical Schedule",
            descHi: "भौतिकी, रसायन, जीव विज्ञान प्रयोगशाला एवं ICT/IT कंप्यूटर लैब में प्रायोगिक कक्षाएं नियमित रूप से चल रही हैं। 75% उपस्थिति अनिवार्य है।",
            descEn: "Practical sessions in Physics, Chemistry, Biology and ICT/IT Labs are running regularly. 75% attendance is mandatory."
        },
        {
            id: "N-03",
            date: "05 Oct 2026",
            tagHi: "NCC एवं खेलकूद",
            tagEn: "NCC & SPORTS",
            isNew: false,
            titleHi: "विद्यालय खेल मैदान पर एनसीसी (NCC) परेड एवं खेलकूद अभ्यास",
            titleEn: "NCC Parade & Sports Practice at School Playground",
            descHi: "सभी एनसीसी कैडेट्स और खेल प्रतिभागी निर्धारित गणवेश में प्रातःकालीन परेड हेतु मुख्य मैदान में उपस्थित रहें।",
            descEn: "All NCC cadets and sports participants must report to the main playground in uniform for morning parade."
        }
    ],

    // 6. [EDIT_HERE_CREATOR_CREDIT] -> Sab hone ke baad apna naam yahan dalein
    creatorCredit: {
        name: "PIYUSH PODDAR",
        batchYear: "batch-2025 SCIENCE",
        roleHi: "पूर्व छात्र एवं प्रमुख आर्किटेक्ट (Alma Mater Tribute)",
        roleEn: "Proud Alumnus & Principal Full-Stack Architect"
    }
};

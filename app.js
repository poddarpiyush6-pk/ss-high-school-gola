// ============================================================================
// FILE 3: app.js — FINAL PRO CONTROLLER (100% BILINGUAL HI/EN + TRUE THEME LOCK)
// ============================================================================

let currentLang = 'hi';
let currentSchemeFilter = 'all';
let cachedNotices = window.SCHOOL_MASTER_CONFIG.defaultNotices;
let cachedApprovedAlumni = [];

// 1. COMPLETE BILINGUAL DICTIONARY (Translates Every Single Section on Click!)
const I18N_DICTIONARY = {
    hi: {
        header_badge: "झारखंड सरकार • विद्या मंदिर (कक्षा 1–12)",
        school_name_main: "राज्य संपोषित +2 उच्च विद्यालय, गोला",
        school_location_sub: "S.S. +2 High School, Gola • जिला: रामगढ़, झारखंड",
        nav_home: "विद्या मंदिर",
        nav_guru: "गुरु स्तंभ (Faculty)",
        nav_gaurav: "गौरव स्तंभ (Alumni)",
        hero_badge: "॥ हमारा विद्यालय: एक पावन विद्या मंदिर • गौरवशाली स्थापना: 1940 ॥",
        hero_title_1: "राज्य संपोषित +2 उच्च विद्यालय,",
        hero_title_2: " गोला (रामगढ़)",
        hero_subtitle: "S.S. +2 High School, Gola • हमारा विद्यालय एक पावन मंदिर",
        btn_light_deep: "प्रज्ज्वलित करें विद्या दीप (Light Sacred Lamp)",
        deep_counter_label: "अखंड प्रज्ज्वलित दीप:",
        matrix_tag: "Sacred Garbhagriha Matrix",
        matrix_title: "विद्यालय दर्पण (Identity Matrix)",
        m_estd_label: "स्थापना वर्ष (ESTD)",
        m_estd_sub: "86+ वर्षों की साधना",
        m_udise_sub: "सत्यापित सरकारी कोड",
        m_students_label: "कुल विद्यार्थी (Strength)",
        m_students_sub: "कक्षा 1 से 12 तक",
        m_wings_label: "शैक्षणिक संकाय",
        m_principal_prefix: "प्रधानाचार्य:",
        principal_label: "प्रधानाचार्य की कलम से",
        wings_tag: "4-Wing Gurukul Academic Architecture",
        wings_heading: "चतुर्स्तरीय शैक्षणिक स्तंभ (कक्षा 1 से 12)",
        wings_sub: "प्रारंभिक बाल शिक्षा से लेकर +2 इंटरमीडिएट (विज्ञान, कला एवं वाणिज्य) तक एकीकृत सरकारी उत्कृष्टता।",
        w1_title: "प्राथमिक प्रभाग (अंकुरण)",
        w1_desc: "बुनियादी साक्षरता एवं संख्या ज्ञान (FLN), नैतिक संस्कार, खेल-आधारित शिक्षण तथा प्रधानमंत्री पोषण शक्ति निर्माण।",
        w1_foot: "निःशुल्क पुस्तकें व पोशाक",
        w2_title: "उच्च प्राथमिक प्रभाग (अन्वेषण)",
        w2_desc: "विज्ञान एवं गणित की प्रयोगात्मक नींव, कंप्यूटर साक्षरता (ICT परिचय), एनसीसी एवं साइकिल वितरण योजना पात्रता।",
        w2_foot: "किशोरी समृद्धि (कक्षा 8)",
        w3_title: "माध्यमिक प्रभाग (मैट्रिक संकल्प)",
        w3_desc: "JAC मैट्रिक बोर्ड परीक्षा की सघन तैयारी, भौतिकी-रसायन-जीव विज्ञान प्रैक्टिकल, IT व्यावसायिक शिक्षा एवं मेधा छात्रवृत्ति।",
        w3_foot: "Science & IT प्रैक्टिकल",
        w4_title: "+2 इंटरमीडिएट (शिखर संकाय)",
        w4_desc: "विज्ञान (PCM/PCB), कला (Arts) एवं वाणिज्य (Commerce) — उच्च स्तरीय प्रयोगशालाएं, करियर मार्गदर्शन एवं गुरुजी क्रेडिट कार्ड सपोर्ट।",
        notice_heading: "सूचना पट्ट (Live Notice Board)",
        labs_heading: "प्रयोगशालाएं, स्मार्ट क्लास, खेल मैदान एवं एनसीसी",
        lab1_title: "ICT कंप्यूटर लैब एवं IT प्रयोगशाला",
        lab1_desc: "आधुनिक कंप्यूटर सिस्टम्स, डिजिटल लर्निंग और व्यावसायिक IT प्रशिक्षण के लिए समर्पित दोहरे कंप्यूटर केंद्र।",
        lab2_title: "डिजिटल स्मार्ट क्लासरूम",
        lab2_desc: "इंटरैक्टिव डिजिटल पैनल और ई-कंटेंट के माध्यम से कठिन विषयों का दृश्य-श्रव्य (3D/Audio-Visual) शिक्षण।",
        lab3_title: "भौतिकी, रसायन एवं जीव विज्ञान लैब",
        lab3_desc: "मैट्रिक एवं +2 विज्ञान संकाय के विद्यार्थियों के लिए पूर्णतः सुसज्जित तीनों अलग-अलग वैज्ञानिक प्रयोगशालाएं।",
        lab4_title: "सक्रिय NCC इकाई एवं विशाल खेल मैदान",
        lab4_desc: "एकता और अनुशासन के लिए गौरवशाली एनसीसी (NCC) प्लाटून तथा फुटबॉल, एथलेटिक्स व परेड के लिए विस्तृत मैदान।",
        schemes_heading: "झारखंड सरकार छात्र कल्याण एवं छात्रवृत्ति योजनाएं",
        f_all: "सभी योजनाएं (All)",
        f_pre: "कक्षा 1–10 (Pre-Matric)",
        f_post: "कक्षा 11–12 व उच्च शिक्षा (+2)",
        f_girls: "बालिका विशेष (Girls)",
        guru_heading: "गुरु ब्रह्मा गुरुर्विष्णुः • आचार्य एवं शिक्षक गौरव स्तंभ",
        guru_sub: "राज्य संपोषित +2 उच्च विद्यालय, गोला (1940) के श्रद्धेय प्रधानाचार्यों एवं शिक्षकों का समर्पित पोर्टल। विद्यालय से सभी शिक्षकों का विस्तृत डेटा संकलित होते ही यहाँ प्रत्येक गुरुजन का गौरवशाली प्रोफाइल कार्ड प्रदर्शित किया जाएगा।",
        guru_p_name: "श्रीमती अनुपा पुष्पा तिर्की",
        guru_p_desc: "विद्यालय के शैक्षणिक अनुशासन, प्रशासन एवं समग्र विकास की प्रमुख मार्गदर्शक।",
        guru_pgt_title: "[PGT शिक्षक डेटा संकलन प्रतीक्षित]",
        guru_pgt_desc: "डेटा कलेक्ट होते ही यहाँ विषय, योग्यता एवं अनुभव के साथ पूर्ण कार्ड जोड़े जाएंगे।",
        guru_tgt_title: "[TGT एवं प्राथमिक शिक्षक स्लॉट]",
        guru_tgt_desc: "हमारे सभी शिक्षकों के सम्मान में यह विशेष सेक्शन अंतिम चरण में लाइव डेटा से भरा जाएगा।",
        gaurav_heading: "गौरव स्तंभ — हमारे टॉपर्स एवं प्रतिष्ठित पूर्व छात्र",
        gaurav_sub: "क्या आप राज्य संपोषित +2 उच्च विद्यालय, गोला के पूर्व छात्र (Alumni) या बोर्ड टॉपर रहे हैं? अपना विवरण फॉर्म में दर्ज करें। एडमिन द्वारा Firebase Console में स्टेटस approved करते ही आपका नाम नीचे सत्यापित गौरव दीवार पर चमकने लगेगा!",
        form_title: "पूर्व छात्र (Alumni) पंजीकरण फॉर्म",
        btn_submit_alumni: "गौरव स्तंभ हेतु विवरण भेजें (Submit for Verification)",
        wall_heading: "सत्यापित गौरव स्तंभ (Verified Alumni & Toppers Wall)",
        btn_back_home: "मुख्य विद्या मंदिर पटल पर लौटें",
        footer_copy: "© 1940–2026 राज्य संपोषित +2 उच्च विद्यालय, गोला (रामगढ़, झारखंड)। सर्वाधिकार सुरक्षित।"
    },
    en: {
        header_badge: "Govt. of Jharkhand • Temple of Learning (Class 1–12)",
        school_name_main: "S.S. +2 High School, Gola (Ramgarh)",
        school_location_sub: "State Subsidized +2 High School • Gola, Ramgarh, Jharkhand",
        nav_home: "Vidya Mandir",
        nav_guru: "Guru Stambh (Faculty)",
        nav_gaurav: "Gaurav Stambh (Alumni)",
        hero_badge: "॥ Our School As A Sacred Temple • Glorious Establishment: 1940 ॥",
        hero_title_1: "State Subsidized +2 High School,",
        hero_title_2: " Gola (Ramgarh)",
        hero_subtitle: "राज्य संपोषित +2 उच्च विद्यालय, गोला • Estd. 1940",
        btn_light_deep: "Light a Sacred Vidya Lamp (प्रज्ज्वलित करें)",
        deep_counter_label: "Sacred Lamps Lit:",
        matrix_tag: "Official Institution Matrix",
        matrix_title: "School Identity Matrix (विद्यालय दर्पण)",
        m_estd_label: "Established (ESTD)",
        m_estd_sub: "86+ Years of Legacy",
        m_udise_sub: "Verified Govt. UDISE",
        m_students_label: "Student Strength",
        m_students_sub: "From Class 1 to 12",
        m_wings_label: "Academic Streams",
        m_principal_prefix: "Principal:",
        principal_label: "From The Principal's Desk",
        wings_tag: "4-Wing Gurukul Academic Architecture",
        wings_heading: "4-Tier Academic Wings (Class 1 to 12)",
        wings_sub: "Integrated Government excellence from foundational primary education to +2 Intermediate (Science, Arts & Commerce).",
        w1_title: "Primary Wing (Foundation)",
        w1_desc: "Foundational Literacy & Numeracy (FLN), moral values, activity-based learning, and PM-POSHAN Mid-Day Meal support.",
        w1_foot: "Free Books & Uniform",
        w2_title: "Upper Primary Wing (Discovery)",
        w2_desc: "Hands-on Science & Mathematics foundation, ICT Computer literacy, NCC introduction, and Cycle scheme eligibility.",
        w2_foot: "Kishori Samriddhi (Class 8)",
        w3_title: "Secondary Wing (Matric Board)",
        w3_desc: "Rigorous JAC Class 10th Board preparation, Physics-Chemistry-Biology practicals, IT Vocational training & Merit Scholarships.",
        w3_foot: "Science & IT Practicals",
        w4_title: "+2 Intermediate (Senior Wing)",
        w4_desc: "Science (PCM/PCB), Arts & Commerce streams — dedicated advanced laboratories, career guidance & Guruji Credit Card support.",
        notice_heading: "Official Live Notice Board",
        labs_heading: "Campus Laboratories, Smart Classes, Playground & NCC",
        lab1_title: "ICT Computer Lab & Dedicated IT Lab",
        lab1_desc: "Dual state-of-the-art computer centers dedicated to digital literacy, coding, and vocational IT practical training.",
        lab2_title: "Digital Smart Classrooms",
        lab2_desc: "Interactive audio-visual digital panels and 3D e-content making complex scientific and humanities topics engaging.",
        lab3_title: "Physics, Chemistry & Biology Labs",
        lab3_desc: "Three fully equipped, separate scientific laboratories for Secondary (9–10) and +2 Intermediate Science students.",
        lab4_title: "Active NCC Unit & Grand Playground",
        lab4_desc: "Disciplined NCC platoon for character & national service alongside an expansive ground for football, athletics, and parades.",
        schemes_heading: "Jharkhand Govt. Student Welfare & Scholarship Schemes",
        f_all: "All Schemes",
        f_pre: "Class 1–10 (Pre-Matric)",
        f_post: "Class 11–12 & Higher Ed (+2)",
        f_girls: "Girls Special Welfare",
        guru_heading: "Guru Stambh — Revered Faculty & Legacy Pillar",
        guru_sub: "Dedicated portal honoring the Principals and Teachers of S.S. +2 High School, Gola (1940). Complete profile cards will be unlocked once official faculty data collection is finalized.",
        guru_p_name: "Smt. Anupa Pushpa Tirkey",
        guru_p_desc: "Leading academic discipline, administration, and holistic student development.",
        guru_pgt_title: "[PGT +2 Faculty Data Collection Scheduled]",
        guru_pgt_desc: "Full faculty cards with subject specialization and qualifications will be rendered here.",
        guru_tgt_title: "[TGT & Primary Wing Faculty Slot]",
        guru_tgt_desc: "Honoring our Class 1 to 10 educators—scheduled for final phase data integration.",
        gaurav_heading: "Gaurav Stambh — Board Toppers & Notable Alumni",
        gaurav_sub: "Are you an Alumnus or Board Topper of S.S. +2 High School, Gola? Submit your details in the form. Once approved by the Admin in Firebase Console, your card will automatically shine on the Verified Alumni Wall below!",
        form_title: "Alumni & Topper Registration Form",
        btn_submit_alumni: "Submit Details for Gaurav Stambh (Firebase Cloud)",
        wall_heading: "Verified Alumni & Toppers Wall (Live Cloud Synced)",
        btn_back_home: "Back to Main Vidya Mandir Dashboard",
        footer_copy: "© 1940–2026 S.S. +2 High School, Gola (Ramgarh, Jharkhand). All Rights Reserved."
    }
};

// 2. BILINGUAL SCHEMES DATA (Renders in Hindi or English seamlessly)
const SCHEMES_DATA = [
    {
        cats: "pre-matric post-matric",
        badge: "ST / SC / OBC • DBT",
        domain: "ekalyan.cgg.gov.in",
        link: "https://ekalyan.cgg.gov.in/",
        titleHi: "ई-कल्याण झारखंड छात्रवृत्ति (प्री एवं पोस्ट-मैट्रिक)",
        titleEn: "e-Kalyan Jharkhand Scholarship (Pre & Post-Matric)",
        descHi: "अनुसूचित जनजाति (ST), अनुसूचित जाति (SC) एवं पिछड़ा वर्ग (BC/OBC) के विद्यार्थियों के लिए प्रत्यक्ष आर्थिक सहायता।",
        descEn: "Direct Benefit Transfer (DBT) financial scholarship for ST, SC, and OBC students studying in Government schools.",
        eligHi: "• पात्रता: ST/SC/OBC छात्र (कक्षा 9–12)।<br>• आय सीमा: पारिवारिक वार्षिक आय अधिकतम <strong>₹2,50,000</strong> तक।<br>• दस्तावेज़: आय, जाति, आवासीय प्रमाण पत्र, आधार-सीडेड बैंक खाता।",
        eligEn: "• Eligibility: ST/SC/OBC students (Class 9–12).<br>• Income Ceiling: Family annual income up to <strong>₹2,50,000</strong>.<br>• Docs: Income, Caste, Domicile certificate & Aadhaar-seeded bank account.",
        btnHi: "आधिकारिक ई-कल्याण पोर्टल खोलें",
        btnEn: "Open Official e-Kalyan Portal"
    },
    {
        cats: "pre-matric post-matric girls",
        badge: "₹40,000 GRANT • GIRLS",
        domain: "Class 8 to 12",
        link: null,
        titleHi: "सावित्रीबाई फुले किशोरी समृद्धि योजना",
        titleEn: "Savitribai Phule Kishori Samriddhi Yojana",
        descHi: "बालिका शिक्षा को प्रोत्साहित करने एवं महिला सशक्तिकरण हेतु झारखंड सरकार की प्रमुख योजना।",
        descEn: "Flagship Jharkhand Govt. scheme empowering girl students from Class 8 to 12 with phased financial grants.",
        eligHi: "• किस्त: कक्षा 8–9 में ₹2,500; कक्षा 10–12 में ₹5,000 तथा 18-19 वर्ष की आयु पर एकमुश्त <strong>₹20,000</strong>।<br>• पात्रता: परिवार की प्रथम दो बेटियां; माता-पिता आयकरदाता न हों।",
        eligEn: "• Installments: ₹2,500 in Class 8–9; ₹5,000 in Class 10–12 & lump-sum <strong>₹20,000</strong> at age 18–19.<br>• Eligibility: First two daughters of non-income-tax-paying families.",
        btnHi: "विद्यालय कार्यालय से फॉर्म प्राप्त करें (प्रधानाचार्य सत्यापन)",
        btnEn: "Collect Form from School Office (Principal Verified)"
    },
    {
        cats: "post-matric",
        badge: "UP TO ₹15 LAKH • 4% INT",
        domain: "After 10th / 12th",
        link: "https://gscc.jharkhand.gov.in/",
        titleHi: "गुरुजी स्टूडेंट क्रेडिट कार्ड योजना (GSCCS)",
        titleEn: "Guruji Student Credit Card Scheme (GSCCS)",
        descHi: "10वीं (डिप्लोमा) एवं 12वीं उत्तीर्ण विद्यार्थियों को इंजीनियरिंग, मेडिकल व उच्च शिक्षा हेतु बिना गारंटी शिक्षा ऋण।",
        descEn: "Collateral-free education loan for Class 10th (Diploma) and 12th pass students pursuing higher/technical education.",
        eligHi: "• मुख्य लाभ: बिना गारंटी के <strong>₹15,00,000</strong> तक का ऋण मात्र <strong>4% साधारण ब्याज</strong> पर (15 वर्ष पुनर्भुगतान अवधि)।",
        eligEn: "• Key Benefit: Up to <strong>₹15,00,000</strong> collateral-free loan at just <strong>4% simple interest</strong> (15-year repayment tenure).",
        btnHi: "GSCC झारखंड पोर्टल देखें",
        btnEn: "Visit Official GSCC Portal"
    },
    {
        cats: "pre-matric post-matric",
        badge: "₹12,000 / YEAR • MERIT",
        domain: "JAC Exam Based",
        link: "https://jac.jharkhand.gov.in/",
        titleHi: "मुख्यमंत्री मेधा छात्रवृत्ति योजना (CMMSS)",
        titleEn: "Chief Minister Merit Scholarship Scheme (CMMSS)",
        descHi: "JAC मेधा परीक्षा उत्तीर्ण करने वाले मेधावी विद्यार्थियों को कक्षा 9 से 12 तक प्रतिवर्ष ₹12,000 की छात्रवृत्ति।",
        descEn: "Annual ₹12,000 merit scholarship from Class 9 to 12 for students qualifying the state-level JAC CMMSS exam.",
        eligHi: "• पात्रता: कक्षा 8 उत्तीर्ण चयनित छात्र; प्रतिवर्ष न्यूनतम 60% अंक एवं 75% उपस्थिति अनिवार्य।",
        eligEn: "• Eligibility: Selected Class 8 pass students; requires maintaining 60% marks and 75% attendance annually.",
        btnHi: "JAC आधिकारिक वेबसाइट देखें",
        btnEn: "Visit Official JAC Website"
    },
    {
        cats: "pre-matric",
        badge: "CLASS 8 • WELFARE DEPT",
        domain: "Cycle / DBT",
        link: null,
        titleHi: "उन्नति का पहिया — निःशुल्क साइकिल वितरण योजना",
        titleEn: "Unnati Ka Pahiya — Free Cycle Distribution Scheme",
        descHi: "दूर-दराज के गांवों से विद्यालय आने वाले कक्षा 8 के विद्यार्थियों को आवागमन हेतु साइकिल/DBT सहायता।",
        descEn: "Free bicycle / DBT grant for Class 8 students commuting from rural villages to ensure zero school dropouts.",
        eligHi: "• पात्रता: सरकारी विद्यालय में कक्षा 8 में नामांकित ST, SC, अल्पसंख्यक एवं OBC वर्ग के छात्र-छात्राएं।",
        eligEn: "• Eligibility: ST, SC, Minority, and OBC students enrolled in Class 8 in Government schools.",
        btnHi: "कक्षा 8 वर्ग-शिक्षक से नामांकन सत्यापित कराएं",
        btnEn: "Verify Enrollment with Class 8 Class-Teacher"
    },
    {
        cats: "pre-matric post-matric",
        badge: "CLASS 1–12 • UNIVERSAL",
        domain: "JCERT & NSP",
        link: "https://scholarships.gov.in/",
        titleHi: "निःशुल्क पाठ्यपुस्तक, पोशाक, मध्याह्न भोजन व NSP",
        titleEn: "Free Textbooks, Uniform DBT, Mid-Day Meal & NSP",
        descHi: "कक्षा 1–8 तक PM-POSHAN, निःशुल्क JCERT पुस्तकें, पोशाक DBT राशि एवं नेशनल स्कॉलरशिप पोर्टल (NMMSS/Central Sector)।",
        descEn: "Universal free JCERT textbooks, uniform DBT grant, PM-POSHAN meals (Class 1–8) & National Scholarship Portal access.",
        eligHi: "• पात्रता: सभी नामांकित विद्यार्थियों हेतु निःशुल्क पुस्तकें व पोशाक; मेधावी छात्रों हेतु NSP पोर्टल।",
        eligEn: "• Eligibility: Universal coverage for all enrolled students; NSP Central Sector for top 20% Class 12th graduates.",
        btnHi: "National Scholarship Portal (NSP) खोलें",
        btnEn: "Open National Scholarship Portal (NSP)"
    }
];

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

// Render Master Config & Complete Bilingual Dictionary
function renderMasterConfig() {
    const cfg = window.SCHOOL_MASTER_CONFIG;
    const dict = I18N_DICTIONARY[currentLang];

    // 1. Translate all elements with [data-i18n]
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });

    // Update Language Button Label
    const langBtn = document.getElementById('lang-btn-label');
    if (langBtn) {
        langBtn.textContent = currentLang === 'hi' ? 'Switch to EN' : 'हिंदी में देखें';
    }

    // Update Form Placeholders Bilingually
    const inpName = document.getElementById('inp-name');
    const inpBatch = document.getElementById('inp-batch');
    const inpStream = document.getElementById('inp-stream');
    const inpRole = document.getElementById('inp-role');
    const inpContact = document.getElementById('inp-contact');
    if (inpName) inpName.placeholder = currentLang === 'hi' ? "आपका पूरा नाम (Full Name) *" : "Your Full Name *";
    if (inpBatch) inpBatch.placeholder = currentLang === 'hi' ? "बैच वर्ष (e.g. 2020) *" : "Batch Pass-out Year (e.g. 2020) *";
    if (inpStream) inpStream.placeholder = currentLang === 'hi' ? "संकाय (Science / Arts / Com / 10th)" : "Stream (Science / Arts / Com / 10th)";
    if (inpRole) inpRole.placeholder = currentLang === 'hi' ? "वर्तमान पद / उपलब्धि (Achievement)" : "Current Role / Profession / Achievement";
    if (inpContact) inpContact.placeholder = currentLang === 'hi' ? "मोबाइल या ईमेल (केवल एडमिन सत्यापन हेतु)" : "Mobile or Email (Private for Admin Verification)";

    // 2. Student Strength & Principal Name in Matrix
    const countEl = document.getElementById('metric-student-count');
    if (countEl) countEl.textContent = escapeHTML(cfg.metrics.studentStrength);
    const matPrin = document.getElementById('matrix-principal-name');
    if (matPrin) matPrin.textContent = currentLang === 'hi' ? cfg.principal.nameHi : cfg.principal.nameEn;

    // 3. Shloka Meaning
    const shlokaEl = document.getElementById('hero-shloka-meaning');
    if (shlokaEl) {
        shlokaEl.textContent = currentLang === 'hi' ? cfg.identity.shlokaMeaningHi : cfg.identity.shlokaMeaningEn;
    }

    // 4. Principal Desk
    const pName = document.getElementById('principal-name-display');
    const pRole = document.getElementById('principal-role-display');
    const pMsg = document.getElementById('principal-message-display');
    if (pName) pName.textContent = currentLang === 'hi' ? cfg.principal.nameHi : cfg.principal.nameEn;
    if (pRole) pRole.textContent = currentLang === 'hi' ? cfg.principal.designationHi : cfg.principal.designationEn;
    if (pMsg) pMsg.textContent = currentLang === 'hi' ? cfg.principal.messageHi : cfg.principal.messageEn;

    // 5. Render Live Notices Bilingually
    const noticesContainer = document.getElementById('notices-container');
    if (noticesContainer) {
        noticesContainer.innerHTML = cachedNotices.map(notice => {
            const title = currentLang === 'hi' ? notice.titleHi : (notice.titleEn || notice.titleHi);
            const desc = currentLang === 'hi' ? notice.descHi : (notice.descEn || notice.descHi);
            const tag = currentLang === 'hi' ? notice.tagHi : (notice.tagEn || notice.tagHi);
            return `
        <article class="sacred-card rounded-2xl p-5 space-y-2 border-l-4 ${notice.isNew ? 'border-l-orange-500' : 'border-l-amber-500/50'}">
          <div class="flex items-center justify-between gap-2 text-xs font-mono">
            <span class="px-2.5 py-0.5 rounded bg-amber-500/20 t-gold font-extrabold">
              ${escapeHTML(tag)}
            </span>
            <span class="t-muted font-bold flex items-center gap-1">
              <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
              ${escapeHTML(notice.date)}
            </span>
          </div>
          <h4 class="font-hindi font-extrabold text-base t-heading devanagari-leading">
            ${escapeHTML(title)}
          </h4>
          <p class="text-xs t-body devanagari-leading">
            ${escapeHTML(desc)}
          </p>
        </article>
      `;
        }).join('');
    }

    // 6. Render Bilingual Schemes Grid
    renderSchemesGrid();

    // 7. Render Approved Alumni Wall
    renderVerifiedAlumniWall();

    // 8. Creator Credit Slot
    const cName = document.getElementById('creator-name-slot');
    const cBatch = document.getElementById('creator-batch-slot');
    if (cName) cName.textContent = cfg.creatorCredit.name;
    if (cBatch) {
        cBatch.textContent = `${cfg.creatorCredit.batchYear} • ${currentLang === 'hi' ? cfg.creatorCredit.roleHi : cfg.creatorCredit.roleEn}`;
    }

    if (window.lucide) lucide.createIcons();
    init3DTiltCards();
}

function renderSchemesGrid() {
    const grid = document.getElementById('schemes-grid');
    if (!grid) return;

    grid.innerHTML = SCHEMES_DATA.map(s => {
        const isHidden = !(currentSchemeFilter === 'all' || s.cats.includes(currentSchemeFilter));
        const title = currentLang === 'hi' ? s.titleHi : s.titleEn;
        const desc = currentLang === 'hi' ? s.descHi : s.descEn;
        const elig = currentLang === 'hi' ? s.eligHi : s.eligEn;
        const btn = currentLang === 'hi' ? s.btnHi : s.btnEn;

        return `
      <div data-scheme-cat="${s.cats}" class="scheme-card sacred-card rounded-2xl p-6 flex flex-col justify-between space-y-4 ${isHidden ? 'hidden' : ''}">
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <span class="px-2.5 py-1 rounded-md text-[11px] font-mono font-extrabold bg-amber-500/20 t-gold border border-amber-500/40">
              ${s.badge}
            </span>
            <span class="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">${s.domain}</span>
          </div>
          <h3 class="font-hindi text-xl font-extrabold t-heading">${title}</h3>
          <p class="text-xs t-body devanagari-leading">${desc}</p>
          <div class="p-3.5 rounded-xl sacred-inner-box space-y-1.5 text-xs t-heading devanagari-leading">
            ${elig}
          </div>
        </div>
        ${s.link ? `
          <a href="${s.link}" target="_blank" rel="noopener noreferrer" class="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all">
            <span>${btn}</span>
            <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
          </a>
        ` : `
          <div class="w-full py-2.5 px-4 rounded-xl sacred-inner-box t-gold font-extrabold text-xs text-center">
            ${btn}
          </div>
        `}
      </div>
    `;
    }).join('');
}

function renderVerifiedAlumniWall() {
    const grid = document.getElementById('verified-alumni-grid');
    if (!grid) return;

    if (!cachedApprovedAlumni || cachedApprovedAlumni.length === 0) {
        grid.innerHTML = `
      <div class="col-span-full sacred-card rounded-2xl p-6 text-center space-y-2 border border-dashed border-amber-500/50">
        <p class="font-hindi text-base font-extrabold t-gold">
          ${currentLang === 'hi' ? 'प्रथम सत्यापित पूर्व छात्र कार्ड प्रतीक्षित' : 'Awaiting First Verified Alumni Card'}
        </p>
        <p class="text-xs t-body">
          ${currentLang === 'hi'
                ? 'ऊपर दिए गए फॉर्म से पंजीकरण करें और Firebase Console के alumni_submissions में जाकर status को "approved" करें — वह कार्ड तुरंत यहाँ दिखाई देगा!'
                : 'Register using the form above and change status to "approved" inside Firebase Console (alumni_submissions) to display the card live!'}
        </p>
      </div>
    `;
        return;
    }

    grid.innerHTML = cachedApprovedAlumni.map(alum => `
    <div class="sacred-card rounded-2xl p-6 border-t-4 border-t-amber-500 space-y-3">
      <div class="flex items-center justify-between">
        <span class="px-2.5 py-0.5 rounded text-[11px] font-mono font-extrabold bg-amber-500/20 t-gold border border-amber-500/40">
          BATCH ${escapeHTML(alum.batchYear)} ${alum.stream ? '• ' + escapeHTML(alum.stream) : ''}
        </span>
        <span class="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <i data-lucide="badge-check" class="w-4 h-4"></i> Verified
        </span>
      </div>
      <h4 class="font-hindi text-xl font-extrabold t-heading">${escapeHTML(alum.fullName)}</h4>
      <p class="text-xs t-body devanagari-leading">
        ${escapeHTML(alum.achievement || (currentLang === 'hi' ? 'गौरवशाली पूर्व छात्र — राज्य संपोषित +2 उच्च विद्यालय, गोला' : 'Distinguished Alumnus — S.S. +2 High School, Gola'))}
      </p>
    </div>
  `).join('');
}

// ============================================================================
// BULLETPROOF DAY / NIGHT THEME ENGINE
// ============================================================================
function applyTheme(theme) {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    if (theme === 'dark') {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
    localStorage.setItem('gola_school_theme', theme);
    updateThemeIcons(theme);
}

window.toggleTheme = function () {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
};

function updateThemeIcons(theme) {
    const sun = document.getElementById('theme-icon-sun');
    const moon = document.getElementById('theme-icon-moon');
    const label = document.getElementById('theme-mode-label');
    if (sun && moon) {
        sun.classList.toggle('hidden', theme !== 'dark');
        moon.classList.toggle('hidden', theme === 'dark');
    }
    if (label) {
        label.textContent = theme === 'dark' ? 'Day Mode' : 'Night Mode';
    }
}

// ============================================================================
// 3D TILT & DIYA SPOTLIGHT ENGINE
// ============================================================================
function init3DTiltCards() {
    document.querySelectorAll('.sacred-card').forEach(card => {
        if (card.dataset.tiltBound) return;
        card.dataset.tiltBound = "true";

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);

            const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -3;
            const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 3;
            card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
        });
    });
}

// ============================================================================
// LIVE SACRED AARTI SPARKS CANVAS
// ============================================================================
function initSacredParticles() {
    const canvas = document.getElementById('sacred-particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = Array.from({ length: 45 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.5 + 0.8,
        speedY: -(Math.random() * 0.6 + 0.2),
        speedX: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.65 + 0.25,
        hue: Math.random() > 0.4 ? 40 : 20
    }));

    function animate() {
        ctx.clearRect(0, 0, width, height);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        particles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX + Math.sin(p.y * 0.015) * 0.15;
            if (p.y < -10) {
                p.y = height + 10;
                p.x = Math.random() * width;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = isDark
                ? `hsla(${p.hue}, 95%, 60%, ${p.alpha})`
                : `hsla(${p.hue - 8}, 90%, 40%, ${p.alpha * 0.55})`;
            ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();
}

window.ringTempleBell = function (el) {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'bellRingActive 0.8s ease-in-out 2';
};

async function syncWithBackend() {
    if (!window.BackendService) return;

    const statusEl = document.getElementById('backend-status-badge');
    if (statusEl) {
        statusEl.textContent = window.BackendService.isLive()
            ? "🔥 Firebase Cloud Live"
            : "Static Config Mode";
    }

    cachedNotices = await window.BackendService.fetchNotices();
    if (window.BackendService.fetchApprovedAlumni) {
        cachedApprovedAlumni = await window.BackendService.fetchApprovedAlumni();
    }
    renderMasterConfig();

    const deepCount = await window.BackendService.getVidyaDeepCount();
    const deepEl = document.getElementById('vidya-deep-count');
    if (deepEl) deepEl.textContent = deepCount.toLocaleString('en-IN');
}

window.handleLightVidyaDeep = async function () {
    const btn = document.getElementById('btn-light-deep');
    const countEl = document.getElementById('vidya-deep-count');
    if (!window.BackendService) return;

    btn.disabled = true;
    const newCount = await window.BackendService.lightVidyaDeep();
    if (countEl) countEl.textContent = newCount.toLocaleString('en-IN');
    btn.innerHTML = `<i data-lucide="flame" class="w-5 h-5"></i> <span>${currentLang === 'hi' ? 'विद्या दीप प्रज्ज्वलित हुआ! (धन्यवाद)' : 'Sacred Lamp Lit! (Thank You)'}</span>`;
    if (window.lucide) lucide.createIcons();
};

window.handleAlumniSubmit = async function (e) {
    e.preventDefault();
    const statusBox = document.getElementById('alumni-form-status');
    const form = e.target;

    try {
        const res = await window.BackendService.submitAlumniRegistration({
            fullName: form.fullName.value,
            batchYear: form.batchYear.value,
            stream: form.stream.value,
            achievement: form.achievement.value,
            contact: form.contact.value
        });
        statusBox.className = "p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold block";
        statusBox.textContent = "✅ " + res.message;
        form.reset();
    } catch (err) {
        statusBox.className = "p-3.5 rounded-xl bg-red-500/20 border border-red-500/50 text-red-700 dark:text-red-300 text-xs font-extrabold block";
        statusBox.textContent = "⚠️ " + err.message;
    }
};

window.switchView = function (viewName) {
    ['home', 'guru-stambh', 'gaurav-stambh'].forEach(v => {
        const el = document.getElementById(`view-${v}`);
        if (el) el.classList.toggle('hidden', v !== viewName);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(init3DTiltCards, 60);
};

window.filterSchemes = function (category) {
    currentSchemeFilter = category;
    renderSchemesGrid();

    document.querySelectorAll('.scheme-filter-btn').forEach(btn => {
        const isActive = btn.getAttribute('data-scheme-filter') === category;
        btn.className = isActive
            ? 'scheme-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-mono font-extrabold bg-amber-500 text-stone-950 transition-all'
            : 'scheme-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border border-amber-500/40 hover:bg-amber-500/15 t-heading transition-all';
    });
    if (window.lucide) lucide.createIcons();
    init3DTiltCards();
};

window.toggleLanguage = function () {
    currentLang = currentLang === 'hi' ? 'en' : 'hi';
    renderMasterConfig();
};

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('gola_school_theme') || 'dark';
    applyTheme(savedTheme);
    renderMasterConfig();
    initSacredParticles();
});

window.addEventListener('backend-ready', syncWithBackend);
// ============================================================================
// 🔐 SECRET ADMIN COMMAND CENTER CONTROLLER (APPEND TO END OF app.js)
// ============================================================================

window.openSecretAdminModal = function () {
    const modal = document.getElementById('secret-admin-modal');
    if (modal) modal.classList.remove('hidden');
    refreshAdminModalUI();
};

window.closeSecretAdminModal = function () {
    const modal = document.getElementById('secret-admin-modal');
    if (modal) modal.classList.add('hidden');
};

// Keyboard Shortcut: Ctrl + Shift + A opens Secret Admin Modal
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        window.openSecretAdminModal();
    }
});

async function refreshAdminModalUI() {
    if (!window.BackendService) return;
    const user = window.BackendService.getAdminUser();
    const loginView = document.getElementById('admin-login-view');
    const dashView = document.getElementById('admin-dashboard-view');
    const emailLbl = document.getElementById('admin-email-label');

    if (!user) {
        loginView.classList.remove('hidden');
        dashView.classList.add('hidden');
        return;
    }

    loginView.classList.add('hidden');
    dashView.classList.remove('hidden');
    if (emailLbl) emailLbl.textContent = user.email;

    // 1. Render Cloud Notices for Admin Delete
    const noticesListEl = document.getElementById('admin-notices-list');
    const notices = await window.BackendService.fetchNotices();
    noticesListEl.innerHTML = notices.map(n => `
    <div class="p-3 rounded-xl bg-black/30 border border-amber-500/30 flex items-center justify-between gap-2 text-xs">
      <div>
        <strong class="text-amber-300">[${escapeHTML(n.date)}]</strong> ${escapeHTML(n.titleHi)}
      </div>
      <button onclick="handleDeleteNotice('${escapeHTML(n.id)}')" class="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white font-mono text-[11px] font-bold shrink-0">
        Delete
      </button>
    </div>
  `).join('');

    // 2. Render Pending & Approved Alumni for 1-Click Approval
    const alumniListEl = document.getElementById('admin-alumni-list');
    const allAlumni = await window.BackendService.fetchAllAlumniForAdmin();
    if (allAlumni.length === 0) {
        alumniListEl.innerHTML = `<p class="text-xs theme-muted">कोई पूर्व छात्र आवेदन अभी कतार में नहीं है।</p>`;
    } else {
        alumniListEl.innerHTML = allAlumni.map(a => `
      <div class="p-3.5 rounded-xl bg-black/30 border ${a.status === 'approved' ? 'border-emerald-500/40' : 'border-amber-500/50'} flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="space-y-0.5">
          <div class="font-bold text-sm text-white">
            ${escapeHTML(a.fullName)} <span class="text-amber-400 font-mono text-xs">(Batch: ${escapeHTML(a.batchYear)} • ${escapeHTML(a.stream || 'N/A')})</span>
          </div>
          <div class="text-slate-300">${escapeHTML(a.achievement || '')}</div>
          <div class="font-mono text-[11px] text-amber-300">📞 Contact: ${escapeHTML(a.contact || 'Not provided')} • Status: <strong>${escapeHTML(a.status)}</strong></div>
        </div>
        <div class="flex items-center gap-2">
          ${a.status !== 'approved' ? `
            <button onclick="handleApproveAlumni('${escapeHTML(a.id)}')" class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-mono font-extrabold">
              ✓ Approve
            </button>
          ` : `<span class="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">Approved</span>`}
          <button onclick="handleDeleteAlumni('${escapeHTML(a.id)}')" class="px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white font-mono font-bold">
            Delete
          </button>
        </div>
      </div>
    `).join('');
    }
    if (window.lucide) lucide.createIcons();
}

window.addEventListener('admin-auth-changed', refreshAdminModalUI);

window.handleAdminLogin = async function (e) {
    e.preventDefault();
    const errBox = document.getElementById('admin-login-error');
    errBox.classList.add('hidden');
    const form = e.target;
    try {
        await window.BackendService.loginAdmin(form.email.value, form.password.value);
        form.reset();
        await refreshAdminModalUI();
    } catch (err) {
        errBox.textContent = "⚠️ लॉगिन विफल: ईमेल या पासवर्ड गलत है (" + err.message + ")";
        errBox.classList.remove('hidden');
    }
};

window.handleAdminLogout = async function () {
    await window.BackendService.logoutAdmin();
    await refreshAdminModalUI();
};

window.handlePublishNotice = async function (e) {
    e.preventDefault();
    const form = e.target;
    try {
        await window.BackendService.publishNotice({
            date: form.date.value,
            tagHi: form.tagHi.value,
            tagEn: form.tagEn.value,
            titleHi: form.titleHi.value,
            titleEn: form.titleEn.value,
            descHi: form.descHi.value,
            descEn: form.descEn.value,
            isNew: form.isNew.checked
        });
        form.reset();
        await syncWithBackend();
        await refreshAdminModalUI();
        alert("✅ नया नोटिस सफलतापूर्वक लाइव प्रकाशित हो गया!");
    } catch (err) {
        alert("⚠️ त्रुटि: " + err.message);
    }
};

window.handleDeleteNotice = async function (id) {
    if (!confirm("क्या आप वाकई इस नोटिस को हटाना चाहते हैं?")) return;
    try {
        await window.BackendService.deleteNotice(id);
        await syncWithBackend();
        await refreshAdminModalUI();
    } catch (err) {
        alert("यह डिफ़ॉल्ट नोटिस है। जब आप कम से कम 1 क्लाउड नोटिस जोड़ देंगे तो क्लाउड नोटिस यहाँ से डिलीट हो सकेंगे।");
    }
};

window.handleApproveAlumni = async function (docId) {
    await window.BackendService.approveAlumni(docId);
    await syncWithBackend();
    await refreshAdminModalUI();
};

window.handleDeleteAlumni = async function (docId) {
    if (!confirm("क्या आप इस प्रविष्टि को हटाना चाहते हैं?")) return;
    await window.BackendService.deleteAlumni(docId);
    await syncWithBackend();
    await refreshAdminModalUI();
};
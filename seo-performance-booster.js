// ============================================================================
// FILE: seo-performance-booster.js — GOOGLE #1 RANKING & PERFORMANCE ENGINE
// 1. Dynamic Schema.org JSON-LD (@graph: HighSchool + FAQPage + Live Notices/Faculty)
// 2. Core Web Vitals Optimizer (Async Image Decoding, Lazy Load, Resource Hints)
// 3. Bilingual Institutional Directory & FAQ Accordion (Captures Regional Queries)
// 100% Zero-Risk Plugin: Untouched config.js, firebase-backend.js, and app.js!
// ============================================================================

(function () {
  "use strict";

  const SITE_URL = "https://poddarpiyush6-pk.github.io/ss-high-school-gola/";
  const cfg = window.SCHOOL_MASTER_CONFIG || {};

  // ==========================================================================
  // 1. GOOGLE KNOWLEDGE GRAPH & RICH SNIPPET JSON-LD INJECTOR
  // Tells Googlebot exact UDISE, Geo-Coordinates, Principal, Wings & FAQs
  // ==========================================================================
  function injectDynamicStructuredData() {
    let scriptEl = document.getElementById("gola-jsonld-schema");
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.id = "gola-jsonld-schema";
      scriptEl.type = "application/ld+json";
      document.head.appendChild(scriptEl);
    }

    // Collect live approved faculty names from DOM if loaded
    const facultyNames = [];
    document.querySelectorAll("#verified-faculty-grid h3").forEach((el) => {
      const name = el.textContent?.trim();
      if (name) facultyNames.push(name);
    });

    // Collect live notices from DOM if loaded
    const liveAnnouncements = [];
    document.querySelectorAll("#notices-container article").forEach((el) => {
      const title = el.querySelector("h4")?.textContent?.trim();
      const desc = el.querySelector("p")?.textContent?.trim();
      if (title) {
        liveAnnouncements.push({
          "@type": "SpecialAnnouncement",
          "name": title,
          "text": desc || title,
          "category": "https://www.wikidata.org/wiki/Q133900"
        });
      }
    });

    const schemaGraph = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["HighSchool", "EducationalOrganization"],
          "@id": SITE_URL + "#school",
          "name": "S.S. +2 High School, Gola (राज्य संपोषित +2 उच्च विद्यालय, गोला)",
          "alternateName": [
            "State Subsidized +2 High School Gola",
            "Rajya Samposhit +2 Uchch Vidyalaya Gola",
            "SS High School Gola Ramgarh",
            "Gola +2 High School Jharkhand",
            "UDISE 20240701206"
          ],
          "url": SITE_URL,
          "foundingDate": "1940",
          "identifier": {
            "@type": "PropertyValue",
            "propertyID": "UDISE Code",
            "value": "20240701206"
          },
          "description": "Established in 1940, State Subsidized (S.S.) +2 High School, Gola is a premier government co-educational institution in Ramgarh District, Jharkhand (UDISE: 20240701206) offering Class 1 to 12 education across Science (PCM/PCB), Arts, and Commerce streams under JAC Ranchi.",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Gola Main Road, Gola Block",
            "addressLocality": "Gola, Ramgarh",
            "addressRegion": "Jharkhand",
            "postalCode": "829110",
            "addressCountry": "IN"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 23.5147,
            "longitude": 85.7219
          },
          "employee": [
            {
              "@type": "Person",
              "name": (cfg.principal && cfg.principal.nameEn) || "Smt. Anupa Pushpa Tirkey",
              "jobTitle": "Principal (प्रधानाचार्य)"
            },
            ...facultyNames.slice(0, 15).map((tName) => ({
              "@type": "Person",
              "name": tName,
              "jobTitle": "Faculty Member"
            }))
          ],
          "alumni": [
            {
              "@type": "Person",
              "name": "Piyush Poddar",
              "description": "Batch 2025 Science Alumnus & Principal Full-Stack Architect of Official Portal"
            }
          ],
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Academic Wings & Streams (Class 1 to 12)",
            "itemListElement": [
              { "@type": "Course", "name": "Primary & Upper Primary Wing (Class 1 to 8)" },
              { "@type": "Course", "name": "Secondary Matric Wing (JAC Class 9 & 10)" },
              { "@type": "Course", "name": "+2 Intermediate Science (PCM / PCB - Class 11 & 12)" },
              { "@type": "Course", "name": "+2 Intermediate Arts & Humanities (Class 11 & 12)" },
              { "@type": "Course", "name": "+2 Intermediate Commerce (Class 11 & 12)" }
            ]
          },
          "sameAs": [SITE_URL]
        },
        {
          "@type": "WebSite",
          "@id": SITE_URL + "#website",
          "url": SITE_URL,
          "name": "S.S. +2 High School, Gola • राज्य संपोषित +2 उच्च विद्यालय, गोला",
          "inLanguage": ["hi-IN", "en-IN"],
          "publisher": { "@id": SITE_URL + "#school" }
        },
        {
          "@type": "FAQPage",
          "@id": SITE_URL + "#faq",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is the UDISE Code and Establishment Year of S.S. +2 High School, Gola (Ramgarh)?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "State Subsidized (S.S.) +2 High School, Gola (राज्य संपोषित +2 उच्च विद्यालय, गोला), located in Ramgarh District, Jharkhand (PIN 829110), was established in the year 1940. Its official UDISE Code is 20240701206."
              }
            },
            {
              "@type": "Question",
              "name": "Who is the Principal of S.S. +2 High School, Gola?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The Principal (प्रधानाचार्य) of S.S. +2 High School, Gola is Smt. Anupa Pushpa Tirkey (श्रीमती अनुपा पुष्पा तिर्की)."
              }
            },
            {
              "@type": "Question",
              "name": "Which streams and facilities are available in S.S. +2 High School Gola for Class 11 and 12?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The school offers integrated education from Class 1 to 12 under JAC Board Ranchi, including +2 Intermediate Science (Physics, Chemistry, Maths, Biology), Arts, and Commerce streams. Facilities include dedicated Physics, Chemistry & Biology Labs, Dual ICT & Vocational IT Computer Labs, Smart Classrooms, an active NCC Unit, and a grand playground."
              }
            },
            {
              "@type": "Question",
              "name": "Which Jharkhand Government scholarships are available for students of S.S. +2 High School Gola?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Eligible students receive e-Kalyan Pre & Post-Matric Scholarships, Savitribai Phule Kishori Samriddhi Yojana (up to ₹40,000 for girls), Chief Minister Merit Scholarship (CMMSS - ₹12,000/year), Guruji Student Credit Card (up to ₹15 Lakh loan at 4% interest), and Class 8 Free Cycle Scheme."
              }
            }
          ]
        }
      ]
    };

    if (liveAnnouncements.length > 0) {
      schemaGraph["@graph"].push(...liveAnnouncements);
    }

    scriptEl.textContent = JSON.stringify(schemaGraph);
  }

  // ==========================================================================
  // 2. CORE WEB VITALS & IMAGE LAZY-LOAD OPTIMIZER (Boosts PageSpeed Score)
  // ==========================================================================
  function optimizeDOMPerformance() {
    document.querySelectorAll("img").forEach((img, index) => {
      if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
      if (index > 1 && !img.hasAttribute("loading")) {
        img.setAttribute("loading", "lazy");
      }
      if (!img.getAttribute("alt")) {
        img.setAttribute("alt", "S.S. +2 High School Gola Ramgarh Jharkhand Official Portal");
      }
    });
  }

  // ==========================================================================
  // 3. ROYAL INSTITUTIONAL FAQ & REGIONAL KEYWORD DIRECTORY (On-Page SEO)
  // Captures searches for Gola, Ramgarh, JAC Board, UDISE, and nearby queries
  // ==========================================================================
  function mountSEOInstitutionalDirectory() {
    if (document.getElementById("seo-institutional-directory")) return;

    const homeView = document.getElementById("view-home");
    if (!homeView) return;

    const section = document.createElement("section");
    section.id = "seo-institutional-directory";
    section.setAttribute("aria-label", "Official Institutional FAQ and Regional Academic Directory");
    section.className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4";

    section.innerHTML = `
      <div class="sacred-card rounded-3xl p-6 sm:p-8 border border-amber-500/35 space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div class="space-y-1">
            <span class="px-3 py-0.5 rounded-full bg-amber-500/15 t-gold font-mono text-[10px] font-extrabold uppercase tracking-wider">
              VERIFIED INSTITUTIONAL INDEX • UDISE: 20240701206
            </span>
            <h2 class="font-hindi text-lg sm:text-2xl font-extrabold t-heading">
              विद्यालय सूचना कोश एवं सामान्य प्रश्न (Official School Directory & FAQ)
            </h2>
          </div>
          <span class="text-xs font-mono t-muted">Gola Block • District Ramgarh • Jharkhand (829110)</span>
        </div>

        <!-- Collapsible Rich FAQ Items for Users & Google Crawler -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <details class="group p-4 rounded-2xl sacred-inner-box border border-amber-500/25 cursor-pointer">
            <summary class="font-hindi font-extrabold text-sm t-heading flex items-center justify-between gap-2 list-none">
              <span>1. राज्य संपोषित +2 उच्च विद्यालय, गोला की स्थापना और UDISE कोड क्या है?</span>
              <span class="t-gold font-mono text-base group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p class="mt-2.5 t-body font-hindi leading-relaxed">
              <strong>राज्य संपोषित +2 उच्च विद्यालय, गोला (State Subsidized +2 High School, Gola)</strong> जिला रामगढ़, झारखंड की स्थापना सन् <strong>1940</strong> में हुई थी। विद्यालय का आधिकारिक <strong>UDISE कोड 20240701206</strong> है और यह झारखंड अधिविद्य परिषद (JAC Ranchi) से संबद्ध गोला प्रखंड का प्रमुख सरकारी +2 विद्यालय है।
            </p>
          </details>

          <details class="group p-4 rounded-2xl sacred-inner-box border border-amber-500/25 cursor-pointer">
            <summary class="font-hindi font-extrabold text-sm t-heading flex items-center justify-between gap-2 list-none">
              <span>2. कक्षा 1 से 12 (+2 Inter Science, Arts, Commerce) में नामांकन की सुविधा क्या है?</span>
              <span class="t-gold font-mono text-base group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p class="mt-2.5 t-body font-hindi leading-relaxed">
              विद्यालय में <strong>4-स्तरीय शैक्षणिक व्यवस्था</strong> संचालित है: प्राथमिक (कक्षा 1–5), उच्च प्राथमिक (कक्षा 6–8), माध्यमिक मैट्रिक बोर्ड (कक्षा 9–10), तथा <strong>+2 इंटरमीडिएट (कक्षा 11–12: विज्ञान PCM/PCB, कला Arts एवं वाणिज्य Commerce)</strong>।
            </p>
          </details>

          <details class="group p-4 rounded-2xl sacred-inner-box border border-amber-500/25 cursor-pointer">
            <summary class="font-hindi font-extrabold text-sm t-heading flex items-center justify-between gap-2 list-none">
              <span>3. विद्यालय की प्रधानाचार्य (Principal) कौन हैं और प्रयोगशाला सुविधाएं कैसी हैं?</span>
              <span class="t-gold font-mono text-base group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p class="mt-2.5 t-body font-hindi leading-relaxed">
              विद्यालय की वर्तमान प्रधानाचार्य <strong>श्रीमती अनुपा पुष्पा तिर्की (Smt. Anupa Pushpa Tirkey)</strong> हैं। परिसर में भौतिकी (Physics), रसायन (Chemistry), जीव विज्ञान (Biology) की पृथक प्रयोगशालाएं, दो आधुनिक <strong>ICT एवं व्यावसायिक IT कंप्यूटर लैब</strong>, स्मार्ट क्लासरूम, सक्रिय <strong>NCC इकाई</strong> और विशाल खेल मैदान उपलब्ध हैं।
            </p>
          </details>

          <details class="group p-4 rounded-2xl sacred-inner-box border border-amber-500/25 cursor-pointer">
            <summary class="font-hindi font-extrabold text-sm t-heading flex items-center justify-between gap-2 list-none">
              <span>4. गोला एवं रामगढ़ के विद्यार्थियों हेतु कौन-कौन सी सरकारी छात्रवृत्ति उपलब्ध है?</span>
              <span class="t-gold font-mono text-base group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p class="mt-2.5 t-body font-hindi leading-relaxed">
              यहाँ अध्ययनरत छात्र-छात्राओं को <strong>ई-कल्याण छात्रवृत्ति (e-Kalyan)</strong>, छात्राओं हेतु <strong>सावित्रीबाई फुले किशोरी समृद्धि योजना (₹40,000)</strong>, <strong>गुरुजी स्टूडेंट क्रेडिट कार्ड (₹15 लाख तक शिक्षा ऋण)</strong>, <strong>मुख्यमंत्री मेधा छात्रवृत्ति (₹12,000/वर्ष)</strong> एवं निःशुल्क साइकिल/पुस्तक योजना का सीधा लाभ मिलता है।
            </p>
          </details>
        </div>

        <!-- Subtle Regional Search Authority Tags -->
        <div class="pt-2 border-t border-amber-500/15 flex flex-wrap items-center gap-1.5 text-[10px] font-mono t-muted">
          <span class="font-bold t-gold">Official Search Index:</span>
          <span>S.S. +2 High School Gola</span> •
          <span>Rajya Samposhit Uchch Vidyalaya Gola</span> •
          <span>Gola Inter School Ramgarh</span> •
          <span>JAC Board +2 School Gola 829110</span> •
          <span>UDISE 20240701206</span> •
          <span>Govt Plus Two High School Ramgarh Jharkhand</span>
        </div>
      </div>
    `;

    homeView.appendChild(section);
  }

  // Re-index whenever Firebase finishes loading live notices/faculty
  function initSEOBooster() {
    injectDynamicStructuredData();
    optimizeDOMPerformance();
    mountSEOInstitutionalDirectory();

    window.addEventListener("backend-ready", () => {
      setTimeout(() => {
        injectDynamicStructuredData();
        optimizeDOMPerformance();
      }, 1500);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSEOBooster);
  } else {
    initSEOBooster();
  }
})();
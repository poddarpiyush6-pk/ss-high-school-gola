// ============================================================================
// FILE: seo-performance-booster.js (v3.0 — ENGLISH-ONLY + TURBO CWV)
// ============================================================================
(function () {
  "use strict";

  const SITE_URL = "https://poddarpiyush6-pk.github.io/ss-high-school-gola/";
  const cfg = window.SCHOOL_MASTER_CONFIG || {};
  const runWhenIdle = window.requestIdleCallback || function (cb) { return setTimeout(cb, 250); };

  function injectSpeedCSS() {
    if (document.getElementById("turbo-cwv-styles")) return;
    const style = document.createElement("style");
    style.id = "turbo-cwv-styles";
    style.textContent = `
      #schemes-grid, #verified-alumni-grid, #verified-faculty-grid, #seo-institutional-directory, footer {
        content-visibility: auto;
        contain-intrinsic-size: 1px 500px;
      }
      body { font-synthesis: none; text-rendering: optimizeSpeed; }
    `;
    document.head.appendChild(style);
  }
  injectSpeedCSS();

  function patchAccessibilityAndImages() {
    document.querySelectorAll("img").forEach((img, index) => {
      if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
      if (index > 0 && !img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
      if (!img.getAttribute("alt") || img.getAttribute("alt").trim() === "") {
        img.setAttribute("alt", "S.S. +2 High School Gola Official Portal");
      }
    });
  }

  function injectDynamicStructuredData() {
    let scriptEl = document.getElementById("gola-jsonld-schema");
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.id = "gola-jsonld-schema";
      scriptEl.type = "application/ld+json";
      document.head.appendChild(scriptEl);
    }

    const facultyNames = [];
    document.querySelectorAll("#verified-faculty-grid h3").forEach((el) => {
      const name = el.textContent?.trim();
      if (name) facultyNames.push(name);
    });

    const schemaGraph = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["HighSchool", "EducationalOrganization"],
          "@id": SITE_URL + "#school",
          "name": "S.S. +2 High School, Gola",
          "alternateName": [
            "State Subsidized +2 High School Gola",
            "राज्य संपोषित +2 उच्च विद्यालय, गोला",
            "SS High School Gola Ramgarh",
            "UDISE 20240701206"
          ],
          "url": SITE_URL,
          "foundingDate": "1940",
          "identifier": { "@type": "PropertyValue", "propertyID": "UDISE Code", "value": "20240701206" },
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Gola Main Road, Gola Block",
            "addressLocality": "Gola, Ramgarh",
            "addressRegion": "Jharkhand",
            "postalCode": "829110",
            "addressCountry": "IN"
          },
          "geo": { "@type": "GeoCoordinates", "latitude": 23.5147, "longitude": 85.7219 },
          "employee": [
            { "@type": "Person", "name": (cfg.principal && cfg.principal.nameEn) || "Smt. Anupa Pushpa Tirkey", "jobTitle": "Principal" },
            ...facultyNames.slice(0, 15).map((tName) => ({ "@type": "Person", "name": tName, "jobTitle": "Faculty Member" }))
          ]
        },
        {
          "@type": "FAQPage",
          "@id": SITE_URL + "#faq",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is the UDISE Code and Establishment Year of S.S. +2 High School, Gola?",
              "acceptedAnswer": { "@type": "Answer", "text": "State Subsidized (S.S.) +2 High School, Gola (Ramgarh, Jharkhand - 829110) was established in 1940. Its official UDISE Code is 20240701206." }
            },
            {
              "@type": "Question",
              "name": "Which streams are offered in +2 Intermediate (Class 11 & 12)?",
              "acceptedAnswer": { "@type": "Answer", "text": "The school offers Class 1 to 12 integrated education under JAC Ranchi, including +2 Science (PCM/PCB), Arts, and Commerce streams." }
            }
          ]
        }
      ]
    };

    scriptEl.textContent = JSON.stringify(schemaGraph);
  }

  function mountSEOInstitutionalDirectory() {
    if (document.getElementById("seo-institutional-directory")) return;
    const homeView = document.getElementById("view-home");
    if (!homeView) return;

    const section = document.createElement("section");
    section.id = "seo-institutional-directory";
    section.setAttribute("aria-label", "Official Institutional FAQ and Directory");
    section.className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4";

    section.innerHTML = `
      <div class="sacred-card rounded-3xl p-6 sm:p-8 space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b leg-border pb-4">
          <div class="space-y-1">
            <span class="px-3 py-0.5 rounded-full bg-amber-500/15 t-gold font-mono text-[10px] font-extrabold uppercase tracking-wider">
              VERIFIED INSTITUTIONAL INDEX • UDISE: 20240701206
            </span>
            <h2 class="text-lg sm:text-2xl font-extrabold t-heading">
              Official School Directory &amp; Frequently Asked Questions
            </h2>
          </div>
          <span class="text-xs font-mono t-muted">Gola Block • District Ramgarh • Jharkhand (829110)</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <details class="group p-4 rounded-2xl sacred-inner-box cursor-pointer">
            <summary class="font-extrabold text-sm t-heading flex items-center justify-between gap-2 list-none">
              <span>1. What is the UDISE Code and establishment year of S.S. +2 High School, Gola?</span>
              <span class="t-gold font-mono text-base group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p class="mt-2.5 t-body leading-relaxed">
              <strong>State Subsidized (S.S.) +2 High School, Gola</strong> (Ramgarh, Jharkhand) was established in <strong>1940</strong>. Its official UDISE Code is <strong>20240701206</strong> and it is affiliated with the Jharkhand Academic Council (JAC Ranchi).
            </p>
          </details>

          <details class="group p-4 rounded-2xl sacred-inner-box cursor-pointer">
            <summary class="font-extrabold text-sm t-heading flex items-center justify-between gap-2 list-none">
              <span>2. Which classes and +2 streams are available for admission?</span>
              <span class="t-gold font-mono text-base group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p class="mt-2.5 t-body leading-relaxed">
              The institution runs a 4-tier academic system: Primary (Class 1–5), Upper Primary (Class 6–8), Secondary Matric (Class 9–10), and <strong>+2 Intermediate (Class 11–12: Science PCM/PCB, Arts &amp; Commerce)</strong>.
            </p>
          </details>

          <details class="group p-4 rounded-2xl sacred-inner-box cursor-pointer">
            <summary class="font-extrabold text-sm t-heading flex items-center justify-between gap-2 list-none">
              <span>3. Who is the Principal and what laboratory facilities exist on campus?</span>
              <span class="t-gold font-mono text-base group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p class="mt-2.5 t-body leading-relaxed">
              The Principal is <strong>Smt. Anupa Pushpa Tirkey</strong>. The campus features dedicated Physics, Chemistry, and Biology labs, two ICT &amp; Vocational IT Computer Labs, Smart Classrooms, an active NCC Unit, and a large playground.
            </p>
          </details>

          <details class="group p-4 rounded-2xl sacred-inner-box cursor-pointer">
            <summary class="font-extrabold text-sm t-heading flex items-center justify-between gap-2 list-none">
              <span>4. Which Jharkhand Government scholarships can students apply for?</span>
              <span class="t-gold font-mono text-base group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p class="mt-2.5 t-body leading-relaxed">
              Eligible students receive <strong>e-Kalyan Scholarships</strong>, <strong>Savitribai Phule Kishori Samriddhi Yojana (up to ₹40,000)</strong>, <strong>Guruji Student Credit Card</strong>, <strong>CM Merit Scholarship (₹12,000/yr)</strong>, and Free Cycle/Textbook schemes.
            </p>
          </details>
        </div>
      </div>
    `;
    homeView.appendChild(section);
  }

  function initTurboEngine() {
    runWhenIdle(() => {
      patchAccessibilityAndImages();
      mountSEOInstitutionalDirectory();
      injectDynamicStructuredData();
    });
    window.addEventListener("backend-ready", () => {
      runWhenIdle(() => {
        patchAccessibilityAndImages();
        injectDynamicStructuredData();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTurboEngine);
  } else {
    initTurboEngine();
  }
})();

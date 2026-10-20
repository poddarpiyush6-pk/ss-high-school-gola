// ============================================================================
// FILE: vidya-mitra-ai.js — ROCKET-SPEED + DRAGGABLE + MOBILE-COMPACT AI ENGINE
// Priority #1: Instant Cloud AI Relay (Zero Delay) | Priority #2: Gemini Backup
// 100% Isolated: Zero impact on config.js, firebase-backend.js, or app.js!
// ============================================================================

(function () {
  // 🔑 Backup Gemini API Key
  const GEMINI_API_KEY = "AQ.Ab8RN6Jv4b91kRXmnrYzjJ3jQgpDq6y6nem93HQjqYdWibUDDw";

  const GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash"
  ];

  // 🏫 Official School Ground Truth + Universal Tutor System Prompt
  const SYSTEM_INSTRUCTION = `
You are "Vidya Mitra AI" (विद्या मित्र AI), the official AI Mentor & Universal Academic Assistant for State Subsidized +2 High School, Gola (राज्य संपोषित +2 उच्च विद्यालय, गोला), District Ramgarh, Jharkhand (PIN: 829110).

1. OFFICIAL SCHOOL GROUND TRUTH (Use when asked about the school):
- School Name: राज्य संपोषित +2 उच्च विद्यालय, गोला (S.S. +2 High School, Gola, Ramgarh, Jharkhand)
- Established: 1940 (86+ years of glorious legacy)
- UDISE Code: 20240701206
- Principal (प्रधानाचार्य): Smt. Anupa Pushpa Tirkey (श्रीमती अनुपा पुष्पा तिर्की)
- Classes & 4 Academic Wings: Class 1 to 12 (Primary 1-5, Upper Primary 6-8, Secondary Matric 9-10, +2 Intermediate 11-12 in Science PCM/PCB, Arts, Commerce).
- Campus Facilities: Separate Physics, Chemistry & Biology Labs, Dual ICT & Vocational IT Computer Labs, Digital Smart Classrooms, Active NCC Unit & Grand Playground.
- Key Jharkhand Govt Schemes:
  1. e-Kalyan Scholarship (ST/SC/OBC Pre & Post-Matric, family income limit up to ₹2.5 Lakh, portal: ekalyan.cgg.gov.in)
  2. Savitribai Phule Kishori Samriddhi Yojana (Class 8 to 12 girls, total grant up to ₹40,000 in installments)
  3. Guruji Student Credit Card Scheme - GSCCS (Up to ₹15 Lakh collateral-free loan at 4% simple interest after 10th/12th)
  4. Chief Minister Merit Scholarship - CMMSS (₹12,000/year from Class 9 to 12 via JAC exam)
  5. Unnati Ka Pahiya (Free Cycle scheme for Class 8 students)
- Portal Architect & Creator: Piyush Poddar (Batch 2025, Science).

2. UNIVERSAL GEMINI CAPABILITY (Students can ask ANYTHING):
- Students can ask you ANY question in the world: Physics, Chemistry, Math problems, Biology, History, Geography, English grammar, Hindi Vyakaran, JAC Board exam preparation, coding, career guidance, general knowledge, or essay/application writing.
- Answer clearly, warmly, and concisely in the language the student uses (Hindi, English, or Hinglish). Use bullet points and bold text for easy reading.
`;

  let chatHistory = [];
  let isGenerating = false;

  function escapeSafeHTML(str) {
    const d = document.createElement("div");
    d.textContent = str == null ? "" : String(str);
    return d.innerHTML;
  }

  function formatAIResponse(text) {
    let safe = escapeSafeHTML(text);
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-400 font-extrabold">$1</strong>');
    safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
    safe = safe.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px]">$1</code>');
    safe = safe.replace(/\n/g, "<br>");
    return safe;
  }

  // ==========================================================================
  // PRIORITY #1 (TOP LAYER): Ultra-Fast Universal Cloud AI Relay (0ms Wait!)
  // ==========================================================================
  async function tryUniversalCloudAI(userMessage) {
    const messages = [
      { role: "system", content: SYSTEM_INSTRUCTION },
      ...chatHistory.slice(-6).map(m => ({
        role: m.role === "model" ? "assistant" : "user",
        content: m.parts[0].text
      })),
      { role: "user", content: userMessage }
    ];

    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: messages,
        temperature: 0.7
      })
    });

    if (!response.ok) throw new Error("Cloud AI Relay busy");
    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (reply && reply.trim()) return reply.trim();
    throw new Error("Empty response from Cloud Relay");
  }

  // ==========================================================================
  // PRIORITY #2 (BACKUP LAYER): Direct Google Gemini API Call
  // ==========================================================================
  async function tryGoogleGeminiDirect(userMessage) {
    const key = GEMINI_API_KEY.trim();
    if (!key) throw new Error("No Gemini Key");

    const contents = [
      ...chatHistory.slice(-6),
      { role: "user", parts: [{ text: userMessage }] }
    ];

    for (const modelName of GEMINI_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(key)}`;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents: contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024
            }
          })
        });

        const data = await response.json();
        if (response.ok && data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
      } catch (e) {
        // Try next backup model
      }
    }
    throw new Error("Backup Gemini endpoint unreachable");
  }

  // ==========================================================================
  // MASTER CALLER: Priority #1 (Cloud AI) -> Priority #2 (Gemini) -> Safety Net
  // ==========================================================================
  async function generateSmartReply(userMessage) {
    let replyText = null;

    // 1. Instant Priority #1: Universal Cloud AI Relay (Fastest!)
    try {
      replyText = await tryUniversalCloudAI(userMessage);
    } catch (cloudErr) {
      // 2. Priority #2 Backup: Google Gemini Direct
      try {
        replyText = await tryGoogleGeminiDirect(userMessage);
      } catch (geminiErr) {
        // 3. Offline Instant School Knowledge Safety Net
        replyText =
          "🙏 **विद्या मित्र AI (राज्य संपोषित +2 उच्च विद्यालय, गोला):**\n\n" +
          "• **स्थापना:** 1940 | **UDISE कोड:** 20240701206\n" +
          "• **प्रधानाचार्य:** श्रीमती अनुपा पुष्पा तिर्की\n" +
          "• **संकाय:** कक्षा 1 से 12 (+2 विज्ञान, कला एवं वाणिज्य)\n" +
          "• **प्रमुख योजनाएं:** ई-कल्याण छात्रवृत्ति, सावित्रीबाई फुले किशोरी समृद्धि योजना (₹40,000), गुरुजी स्टूडेंट क्रेडिट कार्ड (₹15 लाख ऋण), मुख्यमंत्री मेधा छात्रवृत्ति (₹12,000/वर्ष)।\n\n" +
          "*(कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रश्न पूछें!)*";
      }
    }

    chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
    chatHistory.push({ role: "model", parts: [{ text: replyText }] });
    return replyText;
  }

  // ==========================================================================
  // DRAGGABLE & MOBILE-COMPACT FLOATING WIDGET
  // ==========================================================================
  function mountVidyaMitraUI() {
    const existing = document.getElementById("vidya-mitra-root");
    if (existing) existing.remove();

    const wrapper = document.createElement("div");
    wrapper.id = "vidya-mitra-root";
    wrapper.innerHTML = `
      <!-- Compact & Freely Draggable Floating Trigger Button -->
      <button id="vm-toggle-btn" type="button" aria-label="Open or Drag Vidya Mitra AI" title="Click to Open • Drag to Move Anywhere"
        style="touch-action: none; user-select: none; -webkit-user-select: none;"
        class="fixed bottom-4 right-4 z-[9990] flex items-center gap-1.5 sm:gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full sm:rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-extrabold text-[11px] sm:text-xs shadow-[0_8px_30px_rgba(245,158,11,0.45)] hover:shadow-[0_10px_35px_rgba(245,158,11,0.65)] active:scale-95 transition-shadow duration-200 border border-amber-200/90 cursor-grab active:cursor-grabbing">
        <span class="text-sm sm:text-base leading-none pointer-events-none">🪔</span>
        <div class="text-left leading-tight pointer-events-none">
          <div class="font-hindi font-extrabold tracking-tight">विद्या मित्र AI</div>
          <div class="hidden sm:block text-[9px] font-mono opacity-85">Ask Anything • Drag Me</div>
        </div>
      </button>

      <!-- Responsive Chat Window Modal -->
      <div id="vm-chat-panel"
        class="fixed bottom-16 sm:bottom-20 right-3 sm:right-6 z-[9995] w-[93vw] max-w-[385px] rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/50 bg-stone-950/95 text-stone-100 backdrop-blur-xl hidden flex-col transition-all duration-300"
        style="height: 500px; max-height: 76vh;">
        
        <!-- Header -->
        <div class="p-3.5 sm:p-4 bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-transparent border-b border-amber-500/30 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-extrabold text-base sm:text-lg shadow">
              🪔
            </div>
            <div>
              <h3 class="font-hindi font-extrabold text-xs sm:text-sm text-amber-300 leading-tight">
                विद्या मित्र AI (24×7 स्मार्ट ट्यूटर)
              </h3>
              <p class="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                S.S. +2 High School, Gola • Superfast
              </p>
            </div>
          </div>
          <button id="vm-close-btn" type="button" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-red-500/30 text-[11px] font-mono font-bold text-stone-300 hover:text-white transition-all cursor-pointer">
            ✕ बंद करें
          </button>
        </div>

        <!-- Quick Starter Chips -->
        <div class="px-3 py-2 bg-stone-900/90 border-b border-amber-500/20 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <button type="button" data-vm-prompt="हमारे विद्यालय राज्य संपोषित +2 उच्च विद्यालय, गोला के बारे में संक्षिप्त जानकारी दें।" class="vm-chip shrink-0 px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 font-hindi cursor-pointer transition-all">🏫 विद्यालय परिचय</button>
          <button type="button" data-vm-prompt="झारखंड सरकार की प्रमुख छात्रवृत्ति योजनाएं कौन-कौन सी हैं?" class="vm-chip shrink-0 px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 font-hindi cursor-pointer transition-all">🎓 छात्रवृत्ति</button>
          <button type="button" data-vm-prompt="JAC बोर्ड परीक्षा में 90%+ अंक लाने की बेहतरीन रणनीति बताएं।" class="vm-chip shrink-0 px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 font-hindi cursor-pointer transition-all">📚 बोर्ड टिप्स</button>
          <button type="button" data-vm-prompt="ओम का नियम (Ohm's Law) आसान शब्दों में उदाहरण सहित समझाएं।" class="vm-chip shrink-0 px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 font-hindi cursor-pointer transition-all">⚡ विज्ञान प्रश्न</button>
        </div>

        <!-- Messages Container -->
        <div id="vm-messages" class="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 text-xs leading-relaxed">
          <div class="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-stone-200 font-hindi">
            🙏 <strong>प्रणाम! मैं 'विद्या मित्र AI' हूँ।</strong><br>
            आप मुझसे <strong>राज्य संपोषित +2 उच्च विद्यालय, गोला</strong>, छात्रवृत्ति योजनाओं, या अपनी पढ़ाई (Science, Math, Arts, Commerce, GK, Coding) से जुड़ा <strong>कोई भी सवाल</strong> पूछ सकते हैं!<br>
            <span class="text-[10px] text-amber-300/80 font-mono">💡 टिप: आप इस बटन को स्क्रीन पर कहीं भी खिसका (Drag) सकते हैं।</span>
          </div>
        </div>

        <!-- Input Bar -->
        <form id="vm-form" class="p-2.5 sm:p-3 bg-stone-900/95 border-t border-amber-500/30 flex items-center gap-2">
          <input id="vm-input" type="text" required autocomplete="off"
            placeholder="अपना कोई भी सवाल यहाँ लिखें..."
            class="flex-1 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-stone-950 border border-amber-500/40 text-stone-100 placeholder-stone-400 text-xs focus:outline-none focus:border-amber-400 font-hindi" />
          <button id="vm-send-btn" type="submit"
            class="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs shrink-0 transition-all cursor-pointer">
            भेजें ➤
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(wrapper);

    const toggleBtn = document.getElementById("vm-toggle-btn");
    const closeBtn = document.getElementById("vm-close-btn");
    const chatPanel = document.getElementById("vm-chat-panel");
    const form = document.getElementById("vm-form");
    const input = document.getElementById("vm-input");
    const messagesBox = document.getElementById("vm-messages");
    const sendBtn = document.getElementById("vm-send-btn");

    // ========================================================================
    // DRAG-ANYWHERE ENGINE (Supports Both Mobile Touch & Desktop Mouse)
    // ========================================================================
    let isDragging = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    function clampPosition(left, top) {
      const rect = toggleBtn.getBoundingClientRect();
      const maxLeft = window.innerWidth - rect.width - 8;
      const maxTop = window.innerHeight - rect.height - 8;
      return {
        left: Math.max(8, Math.min(left, maxLeft)),
        top: Math.max(8, Math.min(top, maxTop))
      };
    }

    // Restore saved position if valid on current screen
    try {
      const savedPos = JSON.parse(localStorage.getItem("gola_vm_btn_pos") || "null");
      if (savedPos && typeof savedPos.left === "number" && typeof savedPos.top === "number") {
        const clamped = clampPosition(savedPos.left, savedPos.top);
        toggleBtn.style.left = clamped.left + "px";
        toggleBtn.style.top = clamped.top + "px";
        toggleBtn.style.right = "auto";
        toggleBtn.style.bottom = "auto";
      }
    } catch (e) {}

    function onPointerDown(e) {
      // Ignore right click
      if (e.button !== undefined && e.button !== 0) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const rect = toggleBtn.getBoundingClientRect();
      isDragging = true;
      hasMoved = false;
      startX = clientX;
      startY = clientY;
      initialLeft = rect.left;
      initialTop = rect.top;
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const dx = clientX - startX;
      const dy = clientY - startY;

      // Only treat as drag if moved more than 6px (prevents accidental drag on tap)
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        hasMoved = true;
        if (e.cancelable) e.preventDefault();

        const clamped = clampPosition(initialLeft + dx, initialTop + dy);
        toggleBtn.style.left = clamped.left + "px";
        toggleBtn.style.top = clamped.top + "px";
        toggleBtn.style.right = "auto";
        toggleBtn.style.bottom = "auto";
      }
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      if (hasMoved) {
        const rect = toggleBtn.getBoundingClientRect();
        try {
          localStorage.setItem("gola_vm_btn_pos", JSON.stringify({ left: rect.left, top: rect.top }));
        } catch (e) {}
      }
    }

    // Keep button inside screen on window resize / mobile rotation
    window.addEventListener("resize", () => {
      if (toggleBtn.style.left && toggleBtn.style.left !== "auto") {
        const rect = toggleBtn.getBoundingClientRect();
        const clamped = clampPosition(rect.left, rect.top);
        toggleBtn.style.left = clamped.left + "px";
        toggleBtn.style.top = clamped.top + "px";
      }
    });

    toggleBtn.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    toggleBtn.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("touchend", onPointerUp);

    // ========================================================================
    // CHAT PANEL TOGGLE (Only opens if user clicked, not dragged!)
    // ========================================================================
    function toggleChat() {
      const isHidden = chatPanel.classList.contains("hidden");
      if (isHidden) {
        chatPanel.classList.remove("hidden");
        chatPanel.classList.add("flex");
        setTimeout(() => input.focus(), 100);
      } else {
        chatPanel.classList.add("hidden");
        chatPanel.classList.remove("flex");
      }
    }

    toggleBtn.addEventListener("click", (e) => {
      if (hasMoved) {
        e.preventDefault();
        e.stopPropagation();
        hasMoved = false;
        return;
      }
      toggleChat();
    });

    closeBtn.addEventListener("click", toggleChat);

    wrapper.querySelectorAll(".vm-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const promptText = chip.getAttribute("data-vm-prompt");
        if (promptText) {
          input.value = promptText;
          form.dispatchEvent(new Event("submit"));
        }
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (isGenerating) return;

      const question = input.value.trim();
      if (!question) return;

      // User Message Bubble
      const userDiv = document.createElement("div");
      userDiv.className = "ml-8 p-3 rounded-2xl bg-amber-500 text-stone-950 font-semibold font-hindi text-xs shadow";
      userDiv.textContent = question;
      messagesBox.appendChild(userDiv);

      input.value = "";
      messagesBox.scrollTop = messagesBox.scrollHeight;

      isGenerating = true;
      sendBtn.disabled = true;
      sendBtn.textContent = "...";

      // Loading Bubble
      const loadingDiv = document.createElement("div");
      loadingDiv.className = "mr-6 p-3 rounded-2xl bg-stone-900 border border-amber-500/30 text-amber-300 text-xs font-mono animate-pulse";
      loadingDiv.textContent = "⚡ विद्या मित्र लिख रहा है...";
      messagesBox.appendChild(loadingDiv);
      messagesBox.scrollTop = messagesBox.scrollHeight;

      try {
        const answer = await generateSmartReply(question);
        loadingDiv.className = "mr-4 p-3.5 rounded-2xl bg-stone-900/95 border border-amber-500/30 text-stone-100 text-xs font-hindi leading-relaxed shadow";
        loadingDiv.innerHTML = formatAIResponse(answer);
      } catch (err) {
        loadingDiv.className = "mr-4 p-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-hindi";
        loadingDiv.textContent = "⚠️ क्षमा करें, कृपया पुनः प्रयास करें।";
      } finally {
        isGenerating = false;
        sendBtn.disabled = false;
        sendBtn.textContent = "भेजें ➤";
        messagesBox.scrollTop = messagesBox.scrollHeight;
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountVidyaMitraUI);
  } else {
    mountVidyaMitraUI();
  }
})();

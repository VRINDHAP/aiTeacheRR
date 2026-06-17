/**
 * Application Main Controller & Orchestrator
 */
document.addEventListener("DOMContentLoaded", () => {
  // Views
  const views = {
    landing: document.getElementById("landing-view"),
    upload: document.getElementById("upload-view"),
    classroom: document.getElementById("classroom-view")
  };

  // Navigations & CTAs
  const navStartBtn = document.getElementById("nav-start-btn");
  const navLoginBtn = document.getElementById("nav-login-btn");
  const heroStartBtn = document.getElementById("hero-start-btn");
  const uploadBackBtn = document.getElementById("upload-back-btn");
  const classroomExitBtn = document.getElementById("classroom-exit-btn");
  
  // Modals
  const authModal = document.getElementById("auth-modal");
  const authClose = document.getElementById("auth-close");
  const authSubmit = document.getElementById("auth-submit");
  const tabLogin = document.getElementById("tab-login");
  const tabSignup = document.getElementById("tab-signup");
  const watchDemoBtn = document.getElementById("hero-demo-btn");
  const demoModal = document.getElementById("demo-modal");
  const demoClose = document.getElementById("demo-close");
  
  // Settings & Keys Modal
  const settingsBtn = document.getElementById("settings-btn");
  const settingsModal = document.getElementById("settings-modal");
  const settingsClose = document.getElementById("settings-close");
  const apiKeyInput = document.getElementById("api-key-input");
  const saveSettingsBtn = document.getElementById("save-settings");

  // File Upload Elements
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const progressContainer = document.getElementById("progress-container");
  const progressBarFill = document.getElementById("progressBarFill");
  const progressStatus = document.getElementById("progress-status");
  const mockUploadBtn = document.getElementById("mock-upload-btn");

  // Classroom Elements
  const classroomTitle = document.getElementById("classroom-title");
  const filePillText = document.getElementById("file-pill-text");
  // Classroom Lesson Controls
  const classroomPrevBtn = document.getElementById("classroom-prev-btn");
  const classroomNextBtn = document.getElementById("classroom-next-btn");
  const classroomStartBtn = document.getElementById("classroom-start-btn");
  const classroomPauseBtn = document.getElementById("classroom-pause-btn");
  const classroomResumeBtn = document.getElementById("classroom-resume-btn");
  const classroomStopBtn = document.getElementById("classroom-stop-btn");
  
  // Classroom Tabs
  const tabLecture = document.getElementById("tab-lecture");
  const tabNotes = document.getElementById("tab-notes");
  const tabQuiz = document.getElementById("tab-quiz");
  const classroomContentBody = document.getElementById("classroom-content-body");

  // Whiteboard
  const whiteboardTopic = document.getElementById("whiteboard-topic");
  const whiteboardText = document.getElementById("whiteboard-text");

  // Chat UI Elements
  const chatHistory = document.getElementById("chat-history");
  const chatInput = document.getElementById("chat-input");
  const chatSendBtn = document.getElementById("chat-send-btn");
  const suggestionContainer = document.getElementById("chat-suggestions");

  // Voice Elements
  const micBtnContainer = document.getElementById("mic-btn-container");
  const transcriptionPill = document.getElementById("transcription-pill");
  const transcriptionText = document.getElementById("transcription-text");
  const audioWaves = document.getElementById("audio-waves");

  // Initialize Avatar
  let avatar = null;

  // Track scroll for navbar visual class
  const navbar = document.querySelector(".nav-container");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  // Theme toggling elements
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const themeToggleClassroomBtn = document.getElementById("theme-toggle-classroom-btn");

  function toggleTheme() {
    const isLight = document.body.classList.toggle("light-theme");
    const newTheme = isLight ? "light" : "dark";
    localStorage.setItem("app_theme", newTheme);
    updateThemeIcons(newTheme);
  }

  function updateThemeIcons(theme) {
    [themeToggleBtn, themeToggleClassroomBtn].forEach(btn => {
      if (!btn) return;
      const icon = btn.querySelector("i");
      if (icon) {
        icon.setAttribute("data-lucide", theme === "light" ? "sun" : "moon");
      }
    });
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Load theme from preference
  const savedTheme = localStorage.getItem("app_theme") || "dark";
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
  }
  updateThemeIcons(savedTheme);

  // Bind theme clicks
  if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);
  if (themeToggleClassroomBtn) themeToggleClassroomBtn.addEventListener("click", toggleTheme);

  // Load saved settings
  const providerSelect = document.getElementById("llm-provider-select");
  const geminiKeyGroup = document.getElementById("gemini-key-group");
  const openaiKeyGroup = document.getElementById("openai-key-group");
  const openaiKeyInput = document.getElementById("openai-key-input");

  if (providerSelect) {
    const savedProvider = localStorage.getItem("elena_llm_provider") || "gemini";
    providerSelect.value = savedProvider;
    
    // Toggle fields visibility
    if (savedProvider === "openai") {
      openaiKeyGroup.style.display = "block";
      geminiKeyGroup.style.display = "none";
    } else {
      geminiKeyGroup.style.display = "block";
      openaiKeyGroup.style.display = "none";
    }

    providerSelect.addEventListener("change", () => {
      if (providerSelect.value === "openai") {
        openaiKeyGroup.style.display = "block";
        geminiKeyGroup.style.display = "none";
      } else {
        geminiKeyGroup.style.display = "block";
        openaiKeyGroup.style.display = "none";
      }
    });
  }

  if (apiKeyInput) {
    apiKeyInput.value = localStorage.getItem("elena_gemini_key") || "";
  }
  if (openaiKeyInput) {
    openaiKeyInput.value = localStorage.getItem("elena_openai_key") || "";
  }

  // Define Routing
  function navigateTo(viewName) {
    // Hide all
    Object.values(views).forEach(v => {
      v.classList.remove("active");
    });
    // Show active
    views[viewName].classList.add("active");

    // Hide main landing navbar on classroom and upload views to prevent overlays
    const mainNavbar = document.querySelector(".nav-container");
    if (mainNavbar) {
      if (viewName === 'landing') {
        mainNavbar.style.display = "flex";
      } else {
        mainNavbar.style.display = "none";
      }
    }

    if (viewName === 'classroom') {
      // Validate that the active provider's API key is configured
      const activeProvider = localStorage.getItem("elena_llm_provider") || "gemini";
      const key = activeProvider === "openai" ? localStorage.getItem("elena_openai_key") : localStorage.getItem("elena_gemini_key");
      if (!key) {
        settingsModal.classList.add("active");
        alert("Welcome to AI Teacher! Please paste your OpenAI or Google Gemini API Key in the settings configuration before starting the classroom.");
      }

      document.body.style.overflow = "hidden"; // Lock outer scrollbars
      // Lazy load avatar when classroom view is activated
      if (!avatar) {
        avatar = new window.TeacherAvatar('avatar-viewport');
        window.avatarController = avatar;
        bindAvatarToSpeech();
      }
      setupClassroomData();
    } else {
      document.body.style.overflow = ""; // Unlock outer scrollbars
    }
  }

  // --- Router Events ---
  const logoBrand = document.getElementById("logo-brand");
  if (logoBrand) {
    logoBrand.addEventListener("click", () => navigateTo('landing'));
  }
  heroStartBtn.addEventListener("click", () => navigateTo('upload'));
  navStartBtn.addEventListener("click", () => navigateTo('upload'));
  uploadBackBtn.addEventListener("click", () => navigateTo('landing'));
  classroomExitBtn.addEventListener("click", () => {
    window.speechEngine.stopSpeaking();
    navigateTo('upload'); // Back to upload page
  });

  // Auth Modals triggers
  navLoginBtn.addEventListener("click", () => {
    authModal.classList.add("active");
  });
  authClose.addEventListener("click", () => {
    authModal.classList.remove("active");
  });
  authSubmit.addEventListener("click", (e) => {
    e.preventDefault();
    authModal.classList.remove("active");
    navigateTo('upload');
  });

  // Watch Demo Video Modal
  watchDemoBtn.addEventListener("click", () => {
    demoModal.classList.add("active");
  });
  demoClose.addEventListener("click", () => {
    demoModal.classList.remove("active");
  });

  // Settings Modal triggers
  settingsBtn.addEventListener("click", () => {
    settingsModal.classList.add("active");
  });
  settingsClose.addEventListener("click", () => {
    settingsModal.classList.remove("active");
  });
  saveSettingsBtn.addEventListener("click", () => {
    const provider = providerSelect.value;
    const geminiKey = apiKeyInput.value.trim();
    const openaiKey = openaiKeyInput.value.trim();

    localStorage.setItem("elena_llm_provider", provider);
    localStorage.setItem("elena_gemini_key", geminiKey);
    localStorage.setItem("elena_openai_key", openaiKey);

    // Sync variables in chatManager
    window.chatManager.geminiApiKey = geminiKey;
    window.chatManager.openaiApiKey = openaiKey;
    window.chatManager.llmProvider = provider;

    settingsModal.classList.remove("active");
    alert(`Configuration saved successfully! Elena is now connected directly to ${provider === 'openai' ? 'OpenAI ChatGPT' : 'Google Gemini'}.`);
  });

  // Test Connection Event Listener
  const testConnectionBtn = document.getElementById("test-connection-btn");
  const testConnectionStatus = document.getElementById("test-connection-status");

  if (testConnectionBtn && testConnectionStatus) {
    testConnectionBtn.addEventListener("click", async () => {
      const provider = providerSelect.value;
      const key = provider === "openai" ? openaiKeyInput.value.trim() : apiKeyInput.value.trim();
      
      testConnectionStatus.innerText = "Testing...";
      testConnectionStatus.style.color = "var(--accent-cyan)";
      testConnectionBtn.disabled = true;

      try {
        const result = await window.chatManager.testConnection(provider, key);
        testConnectionStatus.innerText = result; // "Success!"
        testConnectionStatus.style.color = "#2ed573"; // green
      } catch (err) {
        console.error("Connection Test failed:", err);
        testConnectionStatus.innerText = err.message || "Failed";
        testConnectionStatus.style.color = "#ff4757"; // red
      } finally {
        testConnectionBtn.disabled = false;
      }
    });
  }

  // Auth Tab Toggles
  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
    authSubmit.innerText = "Log In";
  });
  tabSignup.addEventListener("click", () => {
    tabSignup.classList.add("active");
    tabLogin.classList.remove("active");
    authSubmit.innerText = "Sign Up";
  });

  // Close modals on clicking background overlay
  [authModal, demoModal, settingsModal].forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("active");
    });
  });

  // --- File Upload Handling ---
  dropzone.addEventListener("click", () => fileInput.click());

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", async (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  });

  fileInput.addEventListener("change", async () => {
    const files = fileInput.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  });

  mockUploadBtn.addEventListener("click", () => {
    // Proceed directly with default AI course
    window.pdfHandler.loadDefaultCourse();
    navigateTo('classroom');
  });

  async function processFile(file) {
    progressContainer.style.display = "block";
    progressBarFill.style.width = "0%";
    
    try {
      if (file.type === "application/pdf") {
        progressStatus.innerText = "Extracting text from PDF pages...";
        await window.pdfHandler.parsePDF(file, (pct) => {
          progressBarFill.style.width = `${pct}%`;
        });
      } else {
        progressStatus.innerText = "Reading uploaded document notes...";
        progressBarFill.style.width = "40%";
        await window.pdfHandler.parseTextFile(file);
        progressBarFill.style.width = "100%";
      }

      progressStatus.innerText = "Indexing study chapters & generating quizzes...";
      await new Promise(r => setTimeout(r, 1000));
      
      navigateTo('classroom');
    } catch (err) {
      console.error(err);
      progressStatus.innerText = "Error: File format unsupported or parsing failed.";
      progressBarFill.style.backgroundColor = "var(--accent-pink)";
    }
  }

  // --- Classroom Dashboard logic ---
  let activeTab = "lecture"; // "lecture", "notes", "quiz"

  function setupClassroomData() {
    const handler = window.pdfHandler;
    filePillText.innerText = handler.fileName;

    updateWhiteboard();
    renderContentTab();
    renderChatHistory();

    // Reset state to INTRODUCTION and greet student (boots directly to Introduction state)
    window.chatManager.stopLesson(handler);
  }

  function updateWhiteboard() {
    const section = window.pdfHandler.sections[window.pdfHandler.currentSectionIndex];
    if (section) {
      whiteboardTopic.innerText = section.title.toUpperCase();
      whiteboardText.innerText = section.whiteboard;
    }
  }

  function renderContentTab() {
    const section = window.pdfHandler.sections[window.pdfHandler.currentSectionIndex];
    if (!section) return;

    if (activeTab === "lecture") {
      const paragraphs = section.content.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 20);
      const paragraphsHtml = paragraphs.map((p, idx) => `<p data-p-idx="${idx}">${p}</p>`).join("");
      classroomContentBody.innerHTML = `
        <div class="pdf-reader-view">
          <h2>${section.title}</h2>
          ${paragraphsHtml}
        </div>
      `;
    } else if (activeTab === "notes") {
      classroomContentBody.innerHTML = `
        <div class="pdf-reader-view">
          <h2>Chapter Summary Cards</h2>
          <p>Here are the key points Elena has extracted for your revision:</p>
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 24px; border-radius: 12px; margin-top: 16px;">
            <p style="white-space: pre-line; line-height: 1.8;">${section.summary}</p>
          </div>
        </div>
      `;
    } else if (activeTab === "quiz") {
      renderQuiz(section.quiz);
    }
  }

  function renderQuiz(quizList) {
    let quizHtml = `<div class="quiz-container"><h2> Elena's Doubts Verification</h2><p>Select the correct answer to check your understanding of this topic.</p>`;

    quizList.forEach((q, qIdx) => {
      quizHtml += `
        <div class="quiz-card" id="quiz-${qIdx}">
          <div class="quiz-question">${qIdx + 1}. ${q.question}</div>
          <div class="quiz-options">
            ${q.options.map((opt, optIdx) => `
              <div class="quiz-option" data-q="${qIdx}" data-opt="${optIdx}">
                <span class="badge badge-cyan">${String.fromCharCode(65 + optIdx)}</span>
                <span>${opt}</span>
              </div>
            `).join("")}
          </div>
          <div class="explanation-box" id="exp-${qIdx}" style="display:none; margin-top:16px; padding: 12px; background: rgba(255,255,255,0.02); border-left: 3px solid var(--accent-cyan); font-size:0.85rem;">
            <strong>Elena says:</strong> ${q.explanation}
          </div>
        </div>
      `;
    });

    quizHtml += `</div>`;
    classroomContentBody.innerHTML = quizHtml;

    // Add quiz listeners
    document.querySelectorAll(".quiz-option").forEach(element => {
      element.addEventListener("click", () => {
        const qIdx = parseInt(element.dataset.q);
        const optIdx = parseInt(element.dataset.opt);
        const quiz = quizList[qIdx];
        const card = document.getElementById(`quiz-${qIdx}`);
        const expBox = document.getElementById(`exp-${qIdx}`);

        // Prevent multi-answering
        if (card.classList.contains("answered")) return;

        card.classList.add("answered");
        
        const options = card.querySelectorAll(".quiz-option");
        options.forEach((o, oIdx) => {
          if (oIdx === quiz.answer) {
            o.classList.add("correct");
          } else if (oIdx === optIdx) {
            o.classList.add("incorrect");
          }
        });

        // Show explanation
        expBox.style.display = "block";
        
        // Positive reinforcements via teacher speech!
        if (optIdx === quiz.answer) {
          window.speechEngine.speak("Spot on! That is exactly correct. Good job!", 1.1);
        } else {
          window.speechEngine.speak("Not quite, but close! The correct answer is option " + String.fromCharCode(65 + quiz.answer) + ". Read the explanation on the board.", 1.1);
        }
      });
    });
  }

  // Tab Menu Clicks
  tabLecture.addEventListener("click", () => {
    activeTab = "lecture";
    tabLecture.classList.add("active");
    tabNotes.classList.remove("active");
    tabQuiz.classList.remove("active");
    renderContentTab();
  });

  tabNotes.addEventListener("click", () => {
    activeTab = "notes";
    tabNotes.classList.add("active");
    tabLecture.classList.remove("active");
    tabQuiz.classList.remove("active");
    renderContentTab();
  });

  tabQuiz.addEventListener("click", () => {
    activeTab = "quiz";
    tabQuiz.classList.add("active");
    tabLecture.classList.remove("active");
    tabNotes.classList.remove("active");
    renderContentTab();
  });

  // Lesson Control Center Bindings
  classroomStartBtn.addEventListener("click", () => {
    window.chatManager.startLesson(window.pdfHandler);
  });

  classroomPauseBtn.addEventListener("click", () => {
    window.chatManager.pauseLesson();
  });

  classroomResumeBtn.addEventListener("click", () => {
    window.chatManager.resumeLesson(window.pdfHandler);
  });

  classroomStopBtn.addEventListener("click", () => {
    window.chatManager.stopLesson(window.pdfHandler);
  });

  classroomNextBtn.addEventListener("click", () => {
    window.chatManager.nextTopic(window.pdfHandler);
  });

  classroomPrevBtn.addEventListener("click", () => {
    window.chatManager.prevTopic(window.pdfHandler);
  });

  // Smooth Scroll for Navigation Links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetEl = document.querySelector(href);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Paragraph Highlight Event Listener
  window.addEventListener('paragraphHighlight', (e) => {
    const index = e.detail.index;
    const pdfReader = document.querySelector('.pdf-reader-view');
    if (!pdfReader) return;
    
    pdfReader.querySelectorAll('p').forEach(p => {
      p.classList.remove('highlighted-paragraph');
      p.style.backgroundColor = '';
      p.style.borderRadius = '';
      p.style.padding = '';
      p.style.margin = '';
    });
    
    const targetParagraph = pdfReader.querySelector(`p[data-p-idx="${index}"]`);
    if (targetParagraph) {
      targetParagraph.classList.add('highlighted-paragraph');
      targetParagraph.style.transition = 'all 0.4s ease';
      targetParagraph.style.backgroundColor = 'rgba(118, 74, 241, 0.15)'; // Transparent purple
      targetParagraph.style.borderRadius = '8px';
      targetParagraph.style.padding = '8px 12px';
      targetParagraph.style.margin = '8px -12px';
      targetParagraph.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  // Controls UI Sync Function
  function updateControlsUI() {
    const state = window.chatManager.lessonState.currentState;
    
    if (state === 'TEACHING') {
      classroomStartBtn.style.display = "none";
      classroomPauseBtn.style.display = "inline-flex";
      classroomResumeBtn.style.display = "none";
    } else if (state === 'PAUSED' || state === 'QUESTION') {
      classroomStartBtn.style.display = "none";
      classroomPauseBtn.style.display = "none";
      classroomResumeBtn.style.display = "inline-flex";
    } else { // 'INTRODUCTION', 'COMPLETED'
      classroomStartBtn.style.display = "inline-flex";
      classroomPauseBtn.style.display = "none";
      classroomResumeBtn.style.display = "none";
    }
    
    const handler = window.pdfHandler;
    classroomPrevBtn.disabled = handler.currentSectionIndex === 0;
    classroomNextBtn.disabled = handler.currentSectionIndex === handler.sections.length - 1;
    
    classroomTitle.innerText = handler.sections[handler.currentSectionIndex]?.title || "Classroom Lecture";
    updateWhiteboard();
  }
  
  window.chatManager.onLessonStateChange = updateControlsUI;

  // --- Voice Interface bindings ---
  micBtnContainer.addEventListener("click", () => {
    if (window.speechEngine.isListening) {
      window.speechEngine.stopListening();
    } else {
      window.speechEngine.startListening();
    }
  });

  window.speechEngine.onListeningStatus = (status) => {
    if (status) {
      micBtnContainer.classList.add("listening");
      transcriptionPill.classList.add("active");
      transcriptionText.innerText = "Listening to your voice...";
      if (avatar) avatar.setState('listening');
      
      // Voice Barge-in: transition to QUESTION state if listening starts during active teaching
      if (window.chatManager.lessonState.currentState === 'TEACHING') {
        window.speechEngine.stopSpeaking();
        window.chatManager.lessonState.currentState = 'QUESTION';
        if (window.chatManager.onLessonStateChange) window.chatManager.onLessonStateChange();
      }
    } else {
      micBtnContainer.classList.remove("listening");
      setTimeout(() => {
        transcriptionPill.classList.remove("active");
      }, 3000);
    }
  };

  window.speechEngine.onResult = (transcript) => {
    transcriptionText.innerText = `You said: "${transcript}"`;
    // Pass question to AI Manager
    window.chatManager.askQuestion(transcript, window.pdfHandler);
  };

  window.speechEngine.onError = (errorMsg) => {
    transcriptionText.innerText = `Note: ${errorMsg}`;
    transcriptionPill.classList.add("active");
    transcriptionPill.style.borderColor = "var(--accent-pink)";
    transcriptionPill.style.color = "var(--accent-pink)";
    
    // Stop recording visual status
    micBtnContainer.classList.remove("listening");
    
    setTimeout(() => {
      transcriptionPill.classList.remove("active");
      transcriptionPill.style.borderColor = "";
      transcriptionPill.style.color = "";
    }, 6000);
  };

  // --- Chat UI Bindings ---
  chatSendBtn.addEventListener("click", triggerChatQuestion);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      triggerChatQuestion();
    }
  });

  function triggerChatQuestion() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    chatInput.value = "";
    window.chatManager.askQuestion(text, window.pdfHandler);
  }

  function renderChatHistory() {
    chatHistory.innerHTML = "";
    window.chatManager.history.forEach(m => addChatBubble(m));
  }

  function addChatBubble(message) {
    const bubble = document.createElement("div");
    bubble.className = `chat-message ${message.sender}`;
    bubble.innerHTML = `
      <div class="message-bubble">${message.text}</div>
      <div class="message-meta">${message.timestamp}</div>
    `;
    chatHistory.appendChild(bubble);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // Render suggestions chips depending on context
    updateSuggestionChips();
  }

  function updateSuggestionChips() {
    const section = window.pdfHandler.sections[window.pdfHandler.currentSectionIndex];
    if (!section) return;

    suggestionContainer.innerHTML = "";

    const chips = [
      "Summarize this topic",
      "Give me an analogy",
      "Create practice questions"
    ];

    chips.forEach(c => {
      const chip = document.createElement("div");
      chip.className = "suggestion-chip";
      chip.innerText = c;
      chip.addEventListener("click", () => {
        window.chatManager.askQuestion(`${c} for "${section.title}"`, window.pdfHandler);
      });
      suggestionContainer.appendChild(chip);
    });
  }

  // Bind avatar animations to speech boundaries
  function bindAvatarToSpeech() {
    window.speechEngine.onSpeechBoundary = (word) => {
      if (avatar) avatar.triggerMouthMovement(word);
    };

    window.speechEngine.onSpeechStart = () => {
      audioWaves.classList.add("active");
      if (avatar) avatar.setState('speaking');
    };

    window.speechEngine.onSpeechEnd = () => {
      audioWaves.classList.remove("active");
      if (avatar) avatar.setState('neutral');
      
      // Automatic continuous lecturing progression
      const chat = window.chatManager;
      if (chat.lessonState.currentState === 'TEACHING') {
        chat.lessonState.currentParagraphIdx++;
        setTimeout(() => {
          if (chat.lessonState.currentState === 'TEACHING' && chat.lessonState.isLecturingActive) {
            chat.explainCurrentParagraph(window.pdfHandler);
          }
        }, 1500);
      } else if (chat.lessonState.currentState === 'RESUME') {
        chat.lessonState.currentState = 'TEACHING';
        if (chat.onLessonStateChange) chat.onLessonStateChange();
        setTimeout(() => {
          if (chat.lessonState.currentState === 'TEACHING' && chat.lessonState.isLecturingActive) {
            chat.explainCurrentParagraph(window.pdfHandler);
          }
        }, 1000);
      }
    };
  }

  window.chatManager.onMessageAdded = (msg) => {
    addChatBubble(msg);
  };

  window.chatManager.onTypingStatus = (status) => {
    const existing = document.getElementById("chat-typing");
    if (status && !existing) {
      const bubble = document.createElement("div");
      bubble.className = "chat-message teacher";
      bubble.id = "chat-typing";
      bubble.innerHTML = `
        <div class="message-bubble" style="padding: 10px 14px;">
          <div class="typing-indicator">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      `;
      chatHistory.appendChild(bubble);
      chatHistory.scrollTop = chatHistory.scrollHeight;
    } else if (!status && existing) {
      existing.remove();
    }
  };

  // Setup Initial View
  navigateTo('landing');
});

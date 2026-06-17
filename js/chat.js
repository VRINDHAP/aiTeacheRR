/**
 * Chat and Conversation Manager
 */
class ChatManager {
  constructor() {
    this.geminiApiKey = localStorage.getItem('elena_gemini_key') || "";
    this.openaiApiKey = localStorage.getItem('elena_openai_key') || "";
    this.llmProvider = localStorage.getItem('elena_llm_provider') || "gemini";
    this.history = [];
    this.onMessageAdded = null;
    this.onTypingStatus = null;
    
    // Classroom Lesson Memory State Machine
    this.lessonState = {
      currentState: 'INTRODUCTION', // 'INTRODUCTION', 'TEACHING', 'QUESTION', 'PAUSED', 'RESUME', 'COMPLETED'
      currentChapterIdx: 0,
      currentParagraphIdx: 0,
      paragraphsList: [],
      lastExplanationPoint: "",
      isLecturingActive: false
    };
    
    this.onLessonStateChange = null;
  }

  /**
   * Start the lesson from paragraph 0
   */
  async startLesson(pdfHandler) {
    this.lessonState.currentChapterIdx = pdfHandler.currentSectionIndex;
    this.lessonState.currentParagraphIdx = -1; // Ready for speech-end progression to 0
    this.lessonState.isLecturingActive = true;

    if (this.onTypingStatus) this.onTypingStatus(true);
    try {
      const systemPrompt = this.buildSystemPrompt(pdfHandler);
      const userPrompt = "The student is ready to start the lesson. Transition the state to 'TEACHING' and speak an encouraging welcome phrase to kick off the chapter.";
      const responseObj = await this.callLLM(systemPrompt, userPrompt);
      this.lessonState.currentState = responseObj.nextState;
      if (this.onTypingStatus) this.onTypingStatus(false);
      
      this.addMessage('teacher', responseObj.message);
      
      if (window.avatarController) {
        window.avatarController.setState('speaking');
      }
      window.speechEngine.speak(responseObj.message);
      
      if (this.onLessonStateChange) this.onLessonStateChange();
    } catch (err) {
      if (this.onTypingStatus) this.onTypingStatus(false);
      this.lessonState.currentState = 'TEACHING';
      const section = pdfHandler.sections[pdfHandler.currentSectionIndex];
      const sectionName = section ? section.title : "this chapter";
      const fallback = `Excellent. Let's begin with Chapter ${pdfHandler.currentSectionIndex + 1}: ${sectionName}.`;
      this.addMessage('teacher', fallback);
      window.speechEngine.speak(fallback);
      if (this.onLessonStateChange) this.onLessonStateChange();
    }
  }

  /**
   * Pause the lesson lecturing
   */
  pauseLesson() {
    this.lessonState.currentState = 'PAUSED';
    window.speechEngine.stopSpeaking();
    if (window.avatarController) {
      window.avatarController.setState('neutral');
    }
    this.addMessage('teacher', `[System: Entering PAUSED STATE] Lesson paused. Click Resume or type 'continue' to resume.`);
    if (this.onLessonStateChange) this.onLessonStateChange();
  }

  /**
   * Resume the lesson lecturing
   */
  async resumeLesson(pdfHandler) {
    if (this.onTypingStatus) this.onTypingStatus(true);
    try {
      const systemPrompt = this.buildSystemPrompt(pdfHandler);
      const userPrompt = "The student wants to resume the lesson. Transition to 'RESUME' and speak a brief transition welcoming them back.";
      const responseObj = await this.callLLM(systemPrompt, userPrompt);
      this.lessonState.currentState = responseObj.nextState;
      if (this.onTypingStatus) this.onTypingStatus(false);
      
      this.addMessage('teacher', responseObj.message);
      
      if (window.avatarController) {
        window.avatarController.setState('speaking');
      }
      window.speechEngine.speak(responseObj.message);
      if (this.onLessonStateChange) this.onLessonStateChange();
    } catch (err) {
      if (this.onTypingStatus) this.onTypingStatus(false);
      this.lessonState.currentState = 'RESUME';
      const fallback = "Great. Let's resume from where we left off.";
      this.addMessage('teacher', fallback);
      window.speechEngine.speak(fallback);
      if (this.onLessonStateChange) this.onLessonStateChange();
    }
  }

  /**
   * Stop the lesson (return to Introduction state)
   */
  stopLesson(pdfHandler) {
    this.lessonState.currentState = 'INTRODUCTION';
    this.lessonState.currentParagraphIdx = -1;
    this.lessonState.isLecturingActive = false;
    window.speechEngine.stopSpeaking();
    if (window.avatarController) {
      window.avatarController.setState('neutral');
    }
    
    const welcome = `Hello. I have reviewed your document and I am ready to begin today's lesson. Shall we start?`;
    this.history = []; // reset chat
    this.addMessage('teacher', welcome);
    window.speechEngine.speak(welcome);
    
    if (this.onLessonStateChange) this.onLessonStateChange();
  }

  /**
   * Jump to next topic chapter
   */
  nextTopic(pdfHandler) {
    if (pdfHandler.currentSectionIndex < pdfHandler.sections.length - 1) {
      pdfHandler.currentSectionIndex++;
      this.lessonState.currentChapterIdx = pdfHandler.currentSectionIndex;
      this.startLesson(pdfHandler);
    } else {
      this.lessonState.currentState = 'COMPLETED';
      const completeText = "We have finished all chapters in this study document. Congratulations on completing the course!";
      this.addMessage('teacher', completeText);
      window.speechEngine.speak(completeText);
      if (this.onLessonStateChange) this.onLessonStateChange();
    }
  }

  /**
   * Jump to previous topic chapter
   */
  prevTopic(pdfHandler) {
    if (pdfHandler.currentSectionIndex > 0) {
      pdfHandler.currentSectionIndex--;
      this.lessonState.currentChapterIdx = pdfHandler.currentSectionIndex;
      this.startLesson(pdfHandler);
    }
  }

  /**
   * Explains current paragraph index
   */
  async explainCurrentParagraph(pdfHandler) {
    if (this.lessonState.currentState !== 'TEACHING') return;

    const section = pdfHandler.sections[pdfHandler.currentSectionIndex];
    if (!section) return;

    // Segment paragraphs
    const paragraphs = section.content.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 20);
    this.lessonState.paragraphsList = paragraphs;

    if (this.lessonState.currentParagraphIdx >= paragraphs.length) {
      this.lessonState.currentState = 'COMPLETED';
      const completedText = `We have completed our lesson on ${section.title}. Excellent progress! You can try out the practice quiz on the center board, or click "Next Topic" to continue.`;
      
      this.addMessage('teacher', completedText);
      window.speechEngine.speak(completedText);
      if (this.onLessonStateChange) this.onLessonStateChange();
      return;
    }

    const currentText = paragraphs[this.lessonState.currentParagraphIdx];
    this.lessonState.lastExplanationPoint = currentText;

    // Highlight paragraph in UI
    const highlightEv = new CustomEvent('paragraphHighlight', { detail: { index: this.lessonState.currentParagraphIdx } });
    window.dispatchEvent(highlightEv);

    if (this.onTypingStatus) this.onTypingStatus(true);
    if (window.avatarController) {
      window.avatarController.setState('thinking');
    }

    try {
      const systemPrompt = this.buildSystemPrompt(pdfHandler);
      const userPrompt = `EXPLAIN THE FOLLOWING PARAGRAPH:\n"${currentText}"\n\nExplain it to the student. Ensure you stay in the 'TEACHING' state. Include an interesting analogy or example if applicable.`;
      
      const responseObj = await this.callLLM(systemPrompt, userPrompt);
      
      this.lessonState.currentState = responseObj.nextState;

      if (this.onTypingStatus) this.onTypingStatus(false);

      if (responseObj.whiteboard) {
        const whiteboardTextEl = document.getElementById("whiteboard-text");
        if (whiteboardTextEl) {
          whiteboardTextEl.innerText = responseObj.whiteboard;
        }
      }

      this.addMessage('teacher', responseObj.message);

      if (window.speechEngine) {
        if (window.avatarController) {
          window.avatarController.setState('speaking');
        }
        const speed = parseFloat(document.getElementById('voice-speed')?.value || "1.0");
        window.speechEngine.speak(responseObj.message, speed);
      }

      if (this.onLessonStateChange) this.onLessonStateChange();

    } catch (err) {
      console.error("LLM Lecturing Error:", err);
      if (this.onTypingStatus) this.onTypingStatus(false);
      if (window.avatarController) window.avatarController.setState('neutral');
      
      // Fallback: speak the paragraph content directly if API fails
      this.addMessage('teacher', currentText);
      if (window.speechEngine) {
        if (window.avatarController) {
          window.avatarController.setState('speaking');
        }
        const speed = parseFloat(document.getElementById('voice-speed')?.value || "1.0");
        window.speechEngine.speak(currentText, speed);
      }
      if (this.onLessonStateChange) this.onLessonStateChange();
    }
  }

  /**
   * Add a message to history and dispatch events
   */
  addMessage(sender, text) {
    const message = {
      id: Date.now(),
      sender, // 'student' or 'teacher'
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.history.push(message);
    
    if (this.onMessageAdded) {
      this.onMessageAdded(message);
    }
  }

  /**
   * Set and persist a custom Gemini API Key
   */
  setApiKey(key) {
    this.geminiApiKey = key.trim();
    if (this.geminiApiKey) {
      localStorage.setItem('elena_gemini_key', this.geminiApiKey);
    } else {
      localStorage.removeItem('elena_gemini_key');
    }
  }

  /**
   * Send a query to the AI Teacher. Decides whether to use Gemini API or Local Fallback.
   * @param {string} userText - question typed or spoken by the student
   * @param {object} pdfHandler - current document context reference
   */
  async askQuestion(userText, pdfHandler) {
    // Interruption / Barge-in check: if currently lecturing/teaching, stop speech and enter QUESTION state
    if (this.lessonState.currentState === 'TEACHING') {
      if (window.speechEngine) {
        window.speechEngine.stopSpeaking();
      }
      this.lessonState.currentState = 'QUESTION';
      if (this.onLessonStateChange) this.onLessonStateChange();
    }

    // Show student message in chat history immediately
    this.addMessage('student', userText);

    if (this.onTypingStatus) this.onTypingStatus(true);
    if (window.avatarController) {
      window.avatarController.setState('thinking');
    }

    try {
      const systemPrompt = this.buildSystemPrompt(pdfHandler);
      const userPrompt = userText;
      
      const responseObj = await this.callLLM(systemPrompt, userPrompt);
      
      this.lessonState.currentState = responseObj.nextState;

      if (this.onTypingStatus) this.onTypingStatus(false);

      // Update whiteboard if provided
      if (responseObj.whiteboard) {
        const whiteboardTextEl = document.getElementById("whiteboard-text");
        if (whiteboardTextEl) {
          whiteboardTextEl.innerText = responseObj.whiteboard;
        }
      }

      // Add teacher message
      this.addMessage('teacher', responseObj.message);

      // Speak response
      if (window.speechEngine) {
        if (window.avatarController) {
          window.avatarController.setState('speaking');
        }
        const speed = parseFloat(document.getElementById('voice-speed')?.value || "1.0");
        window.speechEngine.speak(responseObj.message, speed);
      }

      if (this.onLessonStateChange) this.onLessonStateChange();
      
    } catch (err) {
      console.error("LLM Error:", err);
      if (this.onTypingStatus) this.onTypingStatus(false);
      if (window.avatarController) window.avatarController.setState('neutral');
      
      let fallbackMsg = `I experienced a temporary connection issue (${err.message}).`;
      
      if (err.message && (err.message.includes("quota") || err.message.includes("429"))) {
        const section = pdfHandler.sections[pdfHandler.currentSectionIndex];
        fallbackMsg = `[Quota Notification] We have hit the free tier limit for the API key, but let's keep learning! Based on your active chapter "${section.title}", here is the direct breakdown: ${section.summary.replace(/•/g, "")}`;
      }
      
      this.addMessage('teacher', fallbackMsg);
      if (window.speechEngine) {
        window.speechEngine.speak(fallbackMsg);
      }
    }
  }

  /**
   * Dispatches system and user prompts to the active LLM provider (OpenAI or Gemini)
   * and returns the parsed JSON response object.
   */
  async callLLM(systemPrompt, userPrompt) {
    if (this.llmProvider === 'openai') {
      if (!this.openaiApiKey) {
        throw new Error("OpenAI API Key is missing. Please configure it in Settings.");
      }
      const url = "https://api.openai.com/v1/chat/completions";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response structure from OpenAI.");
      }
      const content = data.choices[0].message.content;
      
      // Log raw response before parsing
      console.log("Raw LLM Response (OpenAI):", content);

      return this.parseAndValidateJSON(content);

    } else {
      // Google Gemini
      if (!this.geminiApiKey) {
        throw new Error("Gemini API Key is missing. Please configure it in Settings.");
      }

      const { GoogleGenerativeAI } = await import("https://cdn.jsdelivr.net/npm/@google/generative-ai/+esm");
      const genAI = new GoogleGenerativeAI(this.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const combinedPrompt = `${systemPrompt}\n\n[USER INPUT]\n${userPrompt}`;

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: combinedPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
          responseMimeType: "application/json"
        }
      });

      let responseText;
      try {
        responseText = result.response.text();
      } catch (e) {
        // Check for safety blocks
        const candidates = result.response.candidates;
        if (candidates && candidates[0] && candidates[0].finishReason === "SAFETY") {
          throw new Error("Response blocked by safety filters.");
        }
        throw e;
      }

      if (!responseText) {
        throw new Error("Invalid response format or empty response from Gemini API.");
      }

      // Log raw response before parsing
      console.log("Raw LLM Response (Gemini):", responseText);

      return this.parseAndValidateJSON(responseText);
    }
  }

  /**
   * Validates and parses LLM responses, falling back to plain text if invalid
   * @param {string} rawString - JSON string to validate and parse
   */
  parseAndValidateJSON(rawString) {
    let cleaned = rawString.trim();
    
    // Remove markdown block wraps if present
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    try {
      // Find valid outer bracket positions
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      
      if (firstBrace === -1 || lastBrace === -1 || firstBrace > lastBrace) {
        throw new SyntaxError("No JSON object bounds located in payload.");
      }
      
      const jsonTarget = cleaned.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonTarget);
      
      return {
        message: parsed.message ? parsed.message.trim() : "",
        nextState: parsed.nextState || this.lessonState.currentState,
        whiteboard: parsed.whiteboard ? parsed.whiteboard.trim() : "",
        quizQuestion: parsed.quizQuestion ? parsed.quizQuestion.trim() : ""
      };
    } catch (err) {
      console.warn("Standard JSON processing intercepted unformatted block. Extracting via clean text string transformations:", err);
      
      let finalCleanMessage = rawString;
      
      // Target text content inside the "message" key cleanly
      const match = cleaned.match(/"message"\s*:\s*"([\s\S]*?)"\s*,\s*"nextState"/);
      if (match && match[1]) {
        finalCleanMessage = match[1];
      } else {
        // Fallback string sanitizations to remove JSON control syntax keys entirely
        finalCleanMessage = cleaned
          .replace(/^\{\s*"message"\s*:\s*"/i, "")
          .replace(/"\s*,\s*"nextState"[\s\S]*$/, "")
          .replace(/"\s*\}\s*$/, "");
      }
      
      // Decode escaped newlines and quote signs neatly for web UI presentation
      finalCleanMessage = finalCleanMessage
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .trim();

      return {
        message: finalCleanMessage,
        nextState: this.lessonState.currentState,
        whiteboard: "",
        quizQuestion: ""
      };
    }
  }

  /**
   * Tests API credentials for OpenAI or Gemini
   * @param {string} provider - 'openai' or 'gemini'
   * @param {string} apiKey - key to test
   */
  async testConnection(provider, apiKey) {
    if (provider === 'openai') {
      if (!apiKey) {
        throw new Error("OpenAI API Key is empty.");
      }
      const url = "https://api.openai.com/v1/chat/completions";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Test connection." }],
          max_tokens: 5
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${response.status} - ${response.statusText}`);
      }
      return "Success!";
    } else {
      if (!apiKey) {
        throw new Error("Gemini API Key is empty.");
      }
      const { GoogleGenerativeAI } = await import("https://cdn.jsdelivr.net/npm/@google/generative-ai/+esm");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: "Hello, reply with one word: Success" }] }]
      });
      const responseText = result.response.text();
      if (!responseText) {
        throw new Error("Connection succeeded but empty response returned.");
      }
      return "Success!";
    }
  }

  /**
   * Helper to strip markdown formatting ticks around JSON if generated
   */
  cleanJSONString(str) {
    let cleaned = str.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }
    return cleaned;
  }

  /**
   * Dynamic system prompt builder supplying context and curriculum
   */
  buildSystemPrompt(pdfHandler) {
    const handler = pdfHandler || window.pdfHandler;
    const currentSection = handler.sections[handler.currentSectionIndex];
    const chaptersList = handler.sections.map((s, idx) => `Chapter ${idx + 1}: ${s.title}`).join("\n");
    
    const memoryContext = `
[CLASSROOM MEMORY & PROGRESS]
- Document Name: ${handler.fileName}
- Active Chapter: Chapter ${handler.currentSectionIndex + 1} of ${handler.sections.length}
- Chapter Title: ${currentSection?.title || "General"}
- Total Paragraphs in Chapter: ${this.lessonState.paragraphsList.length}
- Current Paragraph Index: ${this.lessonState.currentParagraphIdx}
- Last Paragraph Explanation Point: "${this.lessonState.lastExplanationPoint || 'None'}"
- Active state machine state: ${this.lessonState.currentState}
`;

    const recentHistory = this.history.slice(-10);
    const historyContext = recentHistory.map(m => `${m.sender === 'teacher' ? 'Elena (Teacher)' : 'Student'}: ${m.text}`).join("\n");

    return `You are Elena, a professional, friendly, and patient virtual classroom teacher.
You teach concepts dynamically from the uploaded document, simplifying difficult topics, giving analogies, examples, and answering student questions.

[CONTEXT & SOURCE PRIORITY]
- Primary Knowledge Base: You MUST prioritize the content, facts, and concepts from the active chapter: "${currentSection?.title || 'General'}" under the curriculum context section. Specifically utilize the uploaded PDF text data for the active chapter index.
- Follow-up Questions & Continuity: For all student follow-up questions and clarifications, refer closely to the provided [CONVERSATION HISTORY] to maintain logical flow, conversational memory, and continuity.

CHARACTERISTICS:
- Approachable, encouraging, natural, and conversational.
- Act like a real teacher in a classroom.
- Do not restrict your explanation length. Provide detailed, deep, and complete educational explanations. Give reasoning, step-by-step breakdowns, concrete examples, and real-world analogies where relevant. Maintain an educational, encouraging tone.
- Native Markdown: Because you are returning a JSON structure, you MUST place your entire complete, multi-paragraph educational explanation or answer directly inside the "message" value string, using native markdown formatting (headings, bold text, bullet points) for visual structure.

SUMMARY AND OVERVIEW QUERIES:
- If the student clicks or types a request to "Summarize Topic", "Explain Topic", or "Give Overview", generate a comprehensive, structured educational summary.
- You MUST structure the "message" field content exactly as follows:
  1. Topic Introduction: A detailed introductory paragraph.
  2. Main Concept: Core explanation of how the concept works.
  3. Key Points: A step-by-step breakdown or list of key points.
  4. Example: A concrete practical scenario or use case.
  5. Real-world Analogy: A vivid, memorable analogy to help comprehension.
  6. One-line Revision Note: A short, high-impact summary sentence.
  - Use multiple paragraphs, markdown headings/bullet points (e.g. \`### 1. Topic Introduction\`, \`* **Key Point:**...\`), and structural spacing. Keep the tone professional, educational, and engaging.

CURRICULUM CHAPTERS:
${chaptersList}

${memoryContext}

[CONVERSATION HISTORY]
${historyContext || "No messages yet."}

STATE MACHINE AND DIALOG RULES:
1. 'INTRODUCTION' state:
   - Introduce yourself, state the chapter name, and ask the student if they are ready to start.
   - If the student says yes, proceed, ok, continue, etc., transition the state to 'TEACHING' and begin the lesson.
2. 'TEACHING' state:
   - You are explaining textbook concepts paragraph-by-paragraph.
   - Explain the concept, simplify it, and give a clear analogy or real-world example.
   - If the student interrupts with a question or doubt, transition state to 'QUESTION' and address their doubt.
3. 'QUESTION' state:
   - Answer their doubt or clarify their confusion.
   - Keep state as 'QUESTION' until they indicate their doubt is cleared (e.g. "Yes", "Got it", "Understood", "Clear", "Yeah").
   - At the end of every answer in this state, append: "Did that answer your question, or has your doubt been cleared?"
   - Once they confirm it's clear, transition the state to 'RESUME' and speak a brief transition phrase.
4. 'PAUSED' state:
   - If the student wants to pause or take a break, transition state to 'PAUSED'. Halts lecturing.
5. 'RESUME' state:
   - Transition to 'TEACHING' state to continue where you left off.
6. 'COMPLETED' state:
   - If they finish the final paragraph of the final chapter, congratulate them.

OUTPUT CONSTRAINT:
You MUST respond ONLY with a valid JSON object. Do not include markdown code blocks around the JSON. Ensure it is complete, well-formed, and not truncated. Match this structure EXACTLY:
{
  "message": "Teacher explanation",
  "nextState": "INTRODUCTION | TEACHING | QUESTION | PAUSED | RESUME | COMPLETED",
  "whiteboard": "Optional bullet points summarizing this topic for the whiteboard, or empty string.",
  "quizQuestion": "An optional practice question to check understanding, or empty string."
}
`;
  }
}

window.chatManager = new ChatManager();

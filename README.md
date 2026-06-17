# aiTeacheRR - Holographic AI Classroom

**aiTeacheRR** is a premium, interactive AI Teacher Education Learning System featuring an animated, vector-based AI Avatar that explains subjects, listens to voice prompts, reads explanations aloud, and administers adaptive, context-aware quizzes.

The system utilizes **Google Gemini models** to power conversational AI teaching and automatically reference documents uploaded directly by the user.

---

## 🌟 Key Features

1. **Interactive SVG Avatar**: An animated, glowing hologram avatar styled via CSS. The eyes blink and look around, and the mouth morphs smoothly (synchronized with Text-to-Speech) in one of several expression states (`idle`, `thinking`, `speaking`, `listening`, `happy`).
2. **Native Voice Control (TTS / STT)**:
   * **Speech-to-Text (STT)**: Use your browser's microphone recognition to ask questions verbally.
   * **Text-to-Speech (TTS)**: Listen to explanations with configurable accents. The TTS engine filters out markdown symbols and syntax characters, ignoring code blocks for a clean voice narrative.
   * **Play / Pause / Resume / Stop**: Full control to pause mid-sentence, resume speaking, or completely cancel explanations.
3. **Smart Study Materials Uplink (RAG)**: Drag & drop PDF, TXT, or Markdown files. Newly uploaded documents are automatically checked and selected as context reference sources for chat and quizzes.
4. **Adaptive Context Quizzes**: Generate structured quizzes on a custom topic or directly from uploaded documents. The quiz engine analyzes your current study session transcript to test you specifically on what you have learned up to that exact moment!

---

## 🛠️ Tech Stack

*   **Frontend**: Vite + React + TypeScript + Vanilla CSS (Glassmorphism & animations)
*   **Backend**: Flask (Python 3) + Google GenAI SDK (`google-generativeai`)
*   **APIs**: HTML5 Web Speech API (`SpeechSynthesis` & `webkitSpeechRecognition`)

---

## 📁 Directory Structure

```text
aiTeacheRR/
│
├── backend/
│   ├── app.py               # Main Flask server
│   ├── requirements.txt     # Backend Python dependencies
│   ├── .env                 # API Key configuration file
│   ├── uploads/             # local document store & parsed metadata
│   └── services/
│       ├── doc_processor.py # PDF page-by-page/Text extractor
│       └── gemini_service.py# Gemini API calls (gemini-2.5-flash) & structured JSON quiz
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html           # SEO optimized title & descriptions
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx          # Orchestrator container
│   │   ├── index.css        # Central HSL layout, animations & scrollbar styles
│   │   ├── hooks/
│   │   │   └── useSpeech.ts # Audio synthesis, STT recorders, text sanitizers
│   │   └── components/
│   │       ├── Avatar.tsx   # Hologram SVG and status panels
│   │       ├── Chat.tsx     # Message streams & custom inline markdown engine
│   │       ├── DocManager.tsx# Drag-and-drop document sidebar
│   │       ├── Quiz.tsx     # Multiple choice cards & score reviews
│   │       └── GlassCard.tsx# Glassmorphism wrapper
│
└── README.md
```

---

## 🚀 Setup & Launch Instructions

### 1. Configure your Gemini API Key
To run the project, you must use your own Gemini API key. If you do not have one, you can generate it in [Google AI Studio](https://aistudio.google.com/).

Create a `.env` file in the `backend/` directory (or modify the template inside `backend/.env`) and insert your API key:
```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

### 2. Start the Backend Server (Flask)
Open a terminal in the root directory:
```bash
# Navigate to backend
cd backend

# Create a Python virtual environment (optional but recommended)
python -m venv venv
# Activate virtual env:
# - On Windows:
.\venv\Scripts\activate
# - On macOS/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run the Flask app
python app.py
```
*The Flask API starts at `http://localhost:5000`.*

### 3. Start the Frontend Server (Vite)
Open a second terminal window in the root directory:
```bash
# Navigate to frontend
cd frontend

# Install Node modules
npm install

# Start Vite server
npm run dev
```
*The client application starts at `http://localhost:5173`. Open this URL in Chrome, Edge, or Safari.*

---

## 💡 How to Use the Holographic Classroom

1. **Learn by Conversing**: Type your question in the chat bar at the bottom or click the **Microphone** icon to dictate your question verbally.
2. **Text-To-Speech Controls**: 
   * Click the **Speaker** icon in the chat header to mute/unmute audio.
   * Choose different voice characters/accents using the dropdown menu.
   * While the avatar is explaining, click **Pause Explaining** on the left card to pause, and **Resume** or **Stop** at any point.
3. **Reference Materials**:
   * Drag & drop any PDF or plain text file into the **Study Materials** sidebar.
   * Uploaded files are automatically checked/activated. The AI Avatar will reference these documents specifically when teaching you.
4. **Adaptive Quiz Arena**:
   * Click the **Quiz Arena** tab in the header.
   * Hit **Generate Custom Quiz** to receive a 3, 5, or 10-question test curated specifically from your active documents and whatever concepts you discussed in the current chat history!
   * Click options to receive instant correct/incorrect color glows, explanations, and spoken avatar feedback.

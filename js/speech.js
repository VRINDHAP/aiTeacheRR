/**
 * Speech Processing Module (TTS & STT)
 */
class SpeechEngine {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.recognition = null;
    this.speakingUtterance = null;
    this.selectedVoice = null;
    this.isListening = false;

    // Events dispatch
    this.onSpeechStart = null;
    this.onSpeechEnd = null;
    this.onSpeechBoundary = null; // Used for lip-sync mouth shape adjustments
    this.onResult = null;
    this.onListeningStatus = null;

    this.initSTT();
    this.initTTS();
  }

  /**
   * Setup Speech to Text (Speech Recognition)
   */
  initSTT() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.onListeningStatus) this.onListeningStatus(true);
      };

      this.recognition.onerror = (e) => {
        console.error('Speech Recognition Error:', e);
        this.isListening = false;
        if (this.onListeningStatus) this.onListeningStatus(false);
        if (this.onError) {
          let msg = "Microphone error.";
          if (e.error === 'not-allowed') {
            msg = "Microphone permission blocked.";
          } else if (e.error === 'service-not-allowed' || e.error === 'network') {
            msg = "Speech recognition blocked. Please use Chrome/Edge or type directly.";
          }
          this.onError(msg);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onListeningStatus) this.onListeningStatus(false);
      };

      this.recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        if (this.onResult) {
          this.onResult(text);
        }
      };
    } else {
      console.warn('Speech Recognition not supported in this browser.');
    }
  }

  /**
   * Setup Text to Speech (Speech Synthesis)
   */
  initTTS() {
    // Populate voice when loaded
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.selectBestVoice();
    }
    this.selectBestVoice();
  }

  selectBestVoice() {
    const voices = this.synthesis.getVoices();
    // Prefer natural sounding English female voices
    const preferredVoices = [
      'Google US English', 
      'Microsoft Zira', 
      'en-US-Neural', 
      'Samantha', 
      'en-US'
    ];

    for (let name of preferredVoices) {
      const found = voices.find(v => v.name.includes(name) || v.lang === name);
      if (found) {
        this.selectedVoice = found;
        break;
      }
    }

    if (!this.selectedVoice && voices.length > 0) {
      // Fallback to first English voice or any voice
      this.selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    }
  }

  /**
   * Start listening via microphone
   */
  startListening() {
    if (!this.recognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    // Cancel any ongoing speech first
    this.stopSpeaking();
    
    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Recognition already started', e);
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Speak a string of text aloud
   * @param {string} text - text to speak
   * @param {number} rate - speech rate (speed)
   * @param {number} pitch - speech pitch
   */
  speak(text, rate = 1.0, pitch = 1.0) {
    this.stopSpeaking();

    // Clean text from markdown bold, lists, and code blocks for cleaner audio speech
    const cleanText = text
      .replace(/[\*\_\`\#]/g, '')
      .replace(/-\s+/g, '')
      .replace(/\[.*\]\(.*\)/g, '')
      .trim();

    this.speakingUtterance = new SpeechSynthesisUtterance(cleanText);
    
    if (this.selectedVoice) {
      this.speakingUtterance.voice = this.selectedVoice;
    }
    
    this.speakingUtterance.rate = rate;
    this.speakingUtterance.pitch = pitch;

    this.speakingUtterance.onstart = () => {
      if (this.onSpeechStart) this.onSpeechStart();
    };

    this.speakingUtterance.onend = () => {
      if (this.onSpeechEnd) this.onSpeechEnd();
    };

    this.speakingUtterance.onerror = (e) => {
      console.error('Speech Synthesis Error:', e);
      if (this.onSpeechEnd) this.onSpeechEnd();
    };

    // Lip sync trigger: word boundary
    this.speakingUtterance.onboundary = (event) => {
      if (event.name === 'word' && this.onSpeechBoundary) {
        // Extract current word
        const word = cleanText.substring(event.charIndex, event.charIndex + event.charLength);
        this.onSpeechBoundary(word);
      }
    };

    this.synthesis.speak(this.speakingUtterance);
  }

  /**
   * Stop any current speech playback
   */
  stopSpeaking() {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
  }
}

// Export single instance
window.speechEngine = new SpeechEngine();

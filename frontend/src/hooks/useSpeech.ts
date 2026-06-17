import { useState, useEffect, useRef } from 'react';

export interface UseSpeechReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  isListening: boolean;
  transcript: string;
  voices: SpeechSynthesisVoice[];
  selectedVoiceName: string;
  setSelectedVoiceName: (name: string) => void;
  speak: (text: string, onBoundary?: (event: SpeechSynthesisEvent) => void) => void;
  stopSpeaking: () => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  startListening: (onResult: (text: string) => void, onEnd?: () => void) => void;
  stopListening: () => void;
}

export function useSpeech(): UseSpeechReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Speech Synthesis and Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSynth = 'speechSynthesis' in window;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const hasRec = !!SpeechRecognition;
      
      setIsSupported(hasSynth);

      if (hasSynth) {
        synthRef.current = window.speechSynthesis;
        
        // Load voices
        const updateVoices = () => {
          if (synthRef.current) {
            const allVoices = synthRef.current.getVoices();
            // Filter to English or common languages
            setVoices(allVoices);
            
            // Try to find a nice default voice
            const defaultVoice = allVoices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) || 
                                 allVoices.find(v => v.lang.startsWith('en')) || 
                                 allVoices[0];
            if (defaultVoice) {
              setSelectedVoiceName(defaultVoice.name);
            }
          }
        };

        updateVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = updateVoices;
        }
      }

      if (hasRec) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';
        recognitionRef.current = rec;
      }
    }
  }, []);

  const cleanTextForSpeech = (rawText: string) => {
    let clean = rawText;

    // 1. Remove expression tags like [EXPRESSION: happy]
    clean = clean.replace(/\[EXPRESSION:\s*\w+\]/g, '');

    // 2. Remove code blocks completely (sounds terrible if read out loud)
    clean = clean.replace(/```[\s\S]*?```/g, ' [code snippet] ');

    // 3. Remove inline backticks
    clean = clean.replace(/`/g, '');

    // 4. Remove headers, bullet symbols, blockquotes
    clean = clean.replace(/^#+\s+/gm, ''); // Headings
    clean = clean.replace(/^\s*[-*+]\s+/gm, ''); // Bullets
    clean = clean.replace(/^\s*>\s+/gm, ''); // Blockquotes

    // 5. Remove bold/italic markers
    clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1');
    clean = clean.replace(/\*([^*]+)\*/g, '$1');
    clean = clean.replace(/__([^_]+)__/g, '$1');
    clean = clean.replace(/_([^_]+)_/g, '$1');

    // 6. Clean up extra whitespaces/newlines
    clean = clean.replace(/\n+/g, ' ');
    clean = clean.replace(/\s+/g, ' ').trim();

    return clean;
  };

  const speak = (text: string, onBoundary?: (event: SpeechSynthesisEvent) => void) => {
    if (!synthRef.current || !isSupported) return;

    // Cancel any current speaking
    synthRef.current.cancel();

    // Clean text: strip out markdown symbols, tags and code blocks
    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;

    // Find and set selected voice
    if (selectedVoiceName) {
      const voice = voices.find(v => v.name === selectedVoiceName);
      if (voice) utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = (e) => {
      console.error('SpeechSynthesis error:', e);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    if (onBoundary) {
      utterance.onboundary = onBoundary;
    }

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  const pauseSpeaking = () => {
    if (synthRef.current && synthRef.current.speaking && !synthRef.current.paused) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeaking = () => {
    if (synthRef.current && synthRef.current.paused) {
      synthRef.current.resume();
      setIsPaused(false);
    }
  };

  const startListening = (onResult: (text: string) => void, onEnd?: () => void) => {
    if (!recognitionRef.current) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    // Stop speaking if the user starts talking
    stopSpeaking();

    setTranscript('');
    setIsListening(true);

    recognitionRef.current.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setTranscript(resultText);
      onResult(resultText);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('SpeechRecognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      if (onEnd) onEnd();
    };

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return {
    isSupported,
    isSpeaking,
    isPaused,
    isListening,
    transcript,
    voices,
    selectedVoiceName,
    setSelectedVoiceName,
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    startListening,
    stopListening
  };
}

import { useState, useEffect, useRef } from 'react';

export interface UseSpeechReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  transcript: string;
  voices: SpeechSynthesisVoice[];
  selectedVoiceName: string;
  setSelectedVoiceName: (name: string) => void;
  speak: (text: string, onBoundary?: (event: SpeechSynthesisEvent) => void) => void;
  stopSpeaking: () => void;
  startListening: (onResult: (text: string) => void, onEnd?: () => void) => void;
  stopListening: () => void;
}

export function useSpeech(): UseSpeechReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
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

  const speak = (text: string, onBoundary?: (event: SpeechSynthesisEvent) => void) => {
    if (!synthRef.current || !isSupported) return;

    // Cancel any current speaking
    synthRef.current.cancel();

    // Clean text: strip expression tags like [EXPRESSION: happy]
    const cleanText = text.replace(/\[EXPRESSION:\s*\w+\]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;

    // Find and set selected voice
    if (selectedVoiceName) {
      const voice = voices.find(v => v.name === selectedVoiceName);
      if (voice) utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error('SpeechSynthesis error:', e);
      setIsSpeaking(false);
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
    isListening,
    transcript,
    voices,
    selectedVoiceName,
    setSelectedVoiceName,
    speak,
    stopSpeaking,
    startListening,
    stopListening
  };
}

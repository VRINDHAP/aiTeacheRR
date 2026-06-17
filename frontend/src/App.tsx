import { useState, useEffect } from 'react';
import { FiCpu, FiMessageSquare, FiTrendingUp, FiKey, FiLock, FiUnlock } from 'react-icons/fi';

// Components
import { GlassCard } from './components/GlassCard';
import { Avatar, type AvatarState } from './components/Avatar';
import { DocManager, type DocumentData } from './components/DocManager';
import { Chat, type Message } from './components/Chat';
import { Quiz, type QuizData } from './components/Quiz';

// Hooks
import { useSpeech } from './hooks/useSpeech';

const BACKEND_URL = 'http://localhost:5000';

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);
  const [backendHasKey, setBackendHasKey] = useState(false);
  
  // App views
  const [activeTab, setActiveTab] = useState<'chat' | 'quiz'>('chat');
  
  // Backend data
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGeneratingChat, setIsGeneratingChat] = useState(false);
  
  // Quiz state
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  
  // Avatar state
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');

  // Speech Hook
  const speech = useSpeech();
  const [isMuted, setIsMuted] = useState(false);

  // Sync speech synthesis and speech recognition with Avatar states
  useEffect(() => {
    if (speech.isSpeaking && !speech.isPaused) {
      setAvatarState('speaking');
    } else if (speech.isListening) {
      setAvatarState('listening');
    } else {
      setAvatarState('idle');
    }
  }, [speech.isSpeaking, speech.isPaused, speech.isListening]);

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`);
      if (res.ok) {
        const data = await res.json();
        if (data.gemini_api_key_configured) {
          setBackendHasKey(true);
          setShowKeyInput(false);
        }
      }
    } catch (err) {
      console.error('Error checking backend health:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', apiKey);
    setShowKeyInput(false);
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setShowKeyInput(true);
  };

  const toggleDocSelect = (docId: string) => {
    setSelectedDocIds(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  // Convert selected doc IDs to their original filenames
  const getSelectedDocNames = () => {
    return documents
      .filter(doc => selectedDocIds.includes(doc.id))
      .map(doc => doc.filename);
  };

  // Process text responses: extract expression tags and apply them to avatar
  const processAIResponse = (text: string) => {
    // Look for expression tag e.g. [EXPRESSION: happy]
    const match = text.match(/\[EXPRESSION:\s*(\w+)\]/);
    if (match && match[1]) {
      const tag = match[1].toLowerCase() as AvatarState;
      if (['idle', 'thinking', 'speaking', 'listening', 'happy'].includes(tag)) {
        setAvatarState(tag);
        // Reset to speaking/idle once speech hook starts/finishes
      }
    }

    // Clean text and speak it if not muted
    const cleanText = text.replace(/\[EXPRESSION:\s*\w+\]/g, '').trim();
    if (!isMuted && cleanText) {
      speech.speak(cleanText);
    }
  };

  // Chat message submission
  const handleSendMessage = async (text: string) => {
    if (!apiKey && !backendHasKey) {
      alert('Please configure your Gemini API Key in the server environment or header first.');
      setShowKeyInput(true);
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text
    };

    setMessages(prev => [...prev, userMsg]);
    setIsGeneratingChat(true);
    setAvatarState('thinking');

    // Format history for backend
    const chatHistory = messages.map(m => ({
      role: m.role,
      text: m.text
    }));

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-API-Key': apiKey
        },
        body: JSON.stringify({
          prompt: text,
          history: chatHistory,
          selected_doc_ids: selectedDocIds
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error');
      }

      const resData = await response.json();
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: resData.response
      };

      setMessages(prev => [...prev, modelMsg]);
      processAIResponse(resData.response);
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `[EXPRESSION: sad] Error: ${err.message || 'Failed to reach back-end server. Make sure the backend Flask app is running.'}`
      };
      setMessages(prev => [...prev, errorMsg]);
      setAvatarState('idle');
    } finally {
      setIsGeneratingChat(false);
    }
  };

  // Voice recognition triggers
  const handleToggleListen = () => {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      speech.startListening((transcriptText) => {
        if (transcriptText.trim()) {
          handleSendMessage(transcriptText);
        }
      });
    }
  };

  // Speech synthesizer trigger for custom voice speech outputs
  const handleSpeakFeedback = (text: string) => {
    if (!isMuted) {
      speech.speak(text);
    }
  };

  // Generate quiz
  const handleGenerateQuiz = async (topic: string, count: number) => {
    if (!apiKey && !backendHasKey) {
      alert('Please configure your Gemini API Key in the server environment or header first.');
      setShowKeyInput(true);
      return;
    }

    setIsGeneratingQuiz(true);
    setAvatarState('thinking');
    setQuizData(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-API-Key': apiKey
        },
        body: JSON.stringify({
          topic,
          count,
          selected_doc_ids: selectedDocIds,
          history: messages.map(m => ({
            role: m.role,
            text: m.text
          }))
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate quiz');
      }

      const data = await response.json();
      setQuizData(data);
      setAvatarState('idle');
      handleSpeakFeedback(`I have generated a quiz on ${data.quiz_title || 'your materials'}. Good luck!`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error generating quiz. Please verify your API Key and backend server.');
      setAvatarState('idle');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div style={{ display: 'flex', alignHover: 'center', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            borderRadius: '10px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 0 15px var(--secondary-glow)'
          }}>
            <FiCpu style={{ fontSize: '1.4rem', color: 'var(--text-main)' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              background: 'linear-gradient(90deg, var(--text-main), var(--secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>aiTeacheRR</h1>
            <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Holographic Classroom</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{
          display: 'flex',
          background: 'hsla(223, 30%, 8%, 0.6)',
          border: '1px solid var(--border-glass)',
          borderRadius: '24px',
          padding: '4px',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('chat')}
            className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '20px', padding: '6px 16px', fontSize: '0.85rem' }}
          >
            <FiMessageSquare /> Teach Session
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`btn ${activeTab === 'quiz' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '20px', padding: '6px 16px', fontSize: '0.85rem' }}
          >
            <FiTrendingUp /> Quiz Arena
          </button>
        </div>

        {/* API Key Configure */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {backendHasKey ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
              <FiLock /> Server Auth Active
            </div>
          ) : showKeyInput ? (
            <form onSubmit={handleSaveKey} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="password"
                placeholder="Enter Gemini API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="input-text"
                style={{ padding: '6px 12px', fontSize: '0.8rem', width: '180px' }}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                Save
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiLock /> Key Active
              </div>
              <button 
                onClick={handleClearKey} 
                className="btn btn-secondary" 
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar - Study Materials */}
      <aside className="app-sidebar">
        <DocManager
          documents={documents}
          selectedDocIds={selectedDocIds}
          onToggleDocSelect={toggleDocSelect}
          onUploadSuccess={(newDoc) => {
            fetchDocuments();
            setSelectedDocIds(prev => [...prev, newDoc.id]);
          }}
          onDeleteSuccess={fetchDocuments}
          backendUrl={BACKEND_URL}
          apiKey={apiKey}
        />
      </aside>

      {/* Main Viewport */}
      <main className="app-main">
        {/* Left Side: Avatar Panel */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
          <Avatar state={avatarState} />
          
          <div style={{ marginTop: '24px', textAlign: 'center', maxWidth: '300px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {avatarState === 'idle' && 'Your virtual teacher is standing by. Speak or type to begin learning!'}
              {avatarState === 'thinking' && 'Analyzing data patterns to construct your explanation...'}
              {avatarState === 'speaking' && 'Listen closely to the explanation. Feel free to ask questions.'}
              {avatarState === 'listening' && 'Say something! The avatar is listening via speech recognition.'}
              {avatarState === 'happy' && 'Terrific! Active interaction boosts learning retention.'}
            </p>
            {speech.isSpeaking && !speech.isPaused && (
              <button
                onClick={() => {
                  speech.pauseSpeaking();
                  setAvatarState('idle');
                }}
                className="btn btn-secondary"
                style={{ marginTop: '16px', padding: '8px 18px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 500 }}
              >
                Pause Explaining
              </button>
            )}
            {speech.isPaused && (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    speech.resumeSpeaking();
                    setAvatarState('speaking');
                  }}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 500 }}
                >
                  Resume
                </button>
                <button
                  onClick={() => {
                    speech.stopSpeaking();
                    setAvatarState('idle');
                  }}
                  className="btn btn-danger"
                  style={{ padding: '8px 18px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 500 }}
                >
                  Stop
                </button>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Right Side: Tab Panel (Chat or Quiz) */}
        <div style={{ height: '100%', minWidth: 0, minHeight: 0 }}>
          {activeTab === 'chat' ? (
            <Chat
              messages={messages}
              onSendMessage={handleSendMessage}
              isGenerating={isGeneratingChat}
              isListening={speech.isListening}
              onToggleListen={handleToggleListen}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
              speechSupported={speech.isSupported}
              voices={speech.voices}
              selectedVoiceName={speech.selectedVoiceName}
              onSelectVoice={speech.setSelectedVoiceName}
            />
          ) : (
            <GlassCard style={{ height: '100%', overflowY: 'auto' }}>
              <Quiz
                quizData={quizData}
                onGenerateQuiz={handleGenerateQuiz}
                onCloseQuiz={() => setQuizData(null)}
                isGenerating={isGeneratingQuiz}
                onSpeakFeedback={handleSpeakFeedback}
                selectedDocNames={getSelectedDocNames()}
                onSetAvatarState={(st) => {
                  if (st === 'idle') setAvatarState('idle');
                  else if (st === 'happy') setAvatarState('happy');
                  else if (st === 'explaining') setAvatarState('speaking');
                  else if (st === 'thinking') setAvatarState('thinking');
                }}
              />
            </GlassCard>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

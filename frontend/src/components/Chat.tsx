import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiMic, FiMicOff, FiVolume2, FiVolumeX, FiArrowDown } from 'react-icons/fi';


export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

interface ChatProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  isListening: boolean;
  onToggleListen: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  speechSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoiceName: string;
  onSelectVoice: (name: string) => void;
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  onSendMessage,
  isGenerating,
  isListening,
  onToggleListen,
  isMuted,
  onToggleMute,
  speechSupported,
  voices,
  selectedVoiceName,
  onSelectVoice
}) => {
  const [inputText, setInputText] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Handle scroll detection for scroll-to-bottom button
  const handleScroll = () => {
    if (!chatBodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
    // Show button if user scrolled up significantly
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText);
    setInputText('');
  };

  // Helper to parse message text and strip out expression tags, then format markdown
  const renderMessageContent = (text: string) => {
    // Strip the expression tag e.g. [EXPRESSION: happy]
    const cleanText = text.replace(/\[EXPRESSION:\s*\w+\]/g, '').trim();

    // Regex parsing for simple markdown elements
    const parts = cleanText.split(/(```[\s\S]*?```|`[^`\n]+`|\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
      // 1. Code Block
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        let language = 'text';
        let code = part.slice(3, -3).trim();

        if (lines[0] && !lines[0].includes(' ') && lines[0].length < 15) {
          language = lines[0];
          code = lines.slice(1).join('\n');
        }

        return (
          <div key={index} className="code-block-wrapper">
            <div className="code-block-header">
              <span>{language}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(code)}
                className="code-copy-btn"
              >
                Copy
              </button>
            </div>
            <pre className="code-pre">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // 2. Inline Code
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="code-inline">
            {part.slice(1, -1)}
          </code>
        );
      }

      // 3. Bold Text
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }

      // 4. Standard Text (with linebreaks formatting)
      return part.split('\n').map((line, lineIdx, array) => (
        <React.Fragment key={`${index}-${lineIdx}`}>
          {line}
          {lineIdx < array.length - 1 && <br />}
        </React.Fragment>
      ));
    });
  };

  return (
    <div className="chat-container">
      <style>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          border-radius: 16px;
          overflow: hidden;
          background: hsla(223, 35%, 11%, 0.4);
          border: 1px solid var(--border-glass);
          box-shadow: var(--glass-shadow);
        }

        .chat-header {
          padding: 16px 20px;
          background: hsla(223, 35%, 8%, 0.5);
          border-bottom: 1px solid var(--border-glass);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chat-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-main);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .chat-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .voice-select {
          background: hsla(223, 30%, 15%, 0.8);
          border: 1px solid var(--border-glass);
          color: var(--text-muted);
          font-family: var(--font-sans);
          font-size: 0.8rem;
          padding: 4px 8px;
          border-radius: 6px;
          outline: none;
          max-width: 130px;
          cursor: pointer;
        }

        .voice-select:focus {
          border-color: var(--secondary);
          color: var(--text-main);
        }

        .control-icon-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.15rem;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 50%;
          transition: all var(--transition-fast);
        }

        .control-icon-btn:hover {
          color: var(--secondary);
          background: hsla(190, 95%, 50%, 0.1);
        }

        .control-icon-btn.active {
          color: var(--secondary);
          background: hsla(190, 95%, 50%, 0.15);
        }

        .chat-body {
          flex-grow: 1;
          overflow-y: auto;
          min-height: 0;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
        }

        .message-bubble-wrapper {
          display: flex;
          width: 100%;
        }

        .message-bubble-wrapper.user {
          justify-content: flex-end;
        }

        .message-bubble-wrapper.model {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 80%;
          padding: 12px 18px;
          border-radius: 12px;
          font-size: 0.95rem;
          line-height: 1.5;
          position: relative;
        }

        .user .message-bubble {
          background: linear-gradient(135deg, var(--primary), hsla(263, 85%, 50%, 0.8));
          color: var(--text-main);
          border-bottom-right-radius: 2px;
          box-shadow: 0 4px 15px rgba(138, 43, 226, 0.15);
        }

        .model .message-bubble {
          background: hsla(223, 25%, 18%, 0.6);
          border: 1px solid var(--border-glass);
          color: var(--text-main);
          border-bottom-left-radius: 2px;
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 18px;
          background: hsla(223, 25%, 18%, 0.4);
          border: 1px solid var(--border-glass);
          border-radius: 12px;
          border-bottom-left-radius: 2px;
          width: max-content;
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
          animation: dot-pulse 1.2s infinite ease-in-out;
        }

        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes dot-pulse {
          0%, 100% { transform: scale(0.8); opacity: 0.4; }
          50% { transform: scale(1.2); opacity: 1; }
        }

        .chat-footer {
          padding: 14px 20px;
          background: hsla(223, 35%, 8%, 0.4);
          border-top: 1px solid var(--border-glass);
        }

        .chat-form {
          display: flex;
          gap: 12px;
          align-items: center;
          position: relative;
        }

        .chat-input {
          flex-grow: 1;
          background: hsla(223, 30%, 8%, 0.7);
          border: 1px solid var(--border-glass);
          border-radius: 24px;
          padding: 12px 18px;
          padding-right: 50px;
          color: var(--text-main);
          font-family: var(--font-sans);
          font-size: 0.95rem;
          outline: none;
          transition: all var(--transition-fast);
        }

        .chat-input:focus {
          border-color: var(--secondary);
          box-shadow: 0 0 10px var(--secondary-glow);
        }

        .mic-btn-inside {
          position: absolute;
          right: 64px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.15rem;
          padding: 8px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .mic-btn-inside:hover, .mic-btn-inside.active {
          color: var(--secondary);
          background: hsla(190, 95%, 50%, 0.1);
        }

        .mic-btn-inside.active {
          animation: mic-pulse 1.5s infinite;
        }

        @keyframes mic-pulse {
          0% { box-shadow: 0 0 0 0 hsla(190, 95%, 50%, 0.4); }
          70% { box-shadow: 0 0 0 8px hsla(190, 95%, 50%, 0); }
          100% { box-shadow: 0 0 0 0 hsla(190, 95%, 50%, 0); }
        }

        .send-btn {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          border: none;
          color: var(--text-main);
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: 0 4px 10px rgba(138, 43, 226, 0.2);
        }

        .send-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(138, 43, 226, 0.35);
          filter: brightness(1.1);
        }

        .send-btn:disabled {
          background: hsla(223, 20%, 25%, 0.3);
          color: var(--text-muted);
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        /* Custom Code block formatting */
        .code-block-wrapper {
          margin: 10px 0;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border-glass);
          background: hsla(222, 20%, 5%, 0.7);
        }

        .code-block-header {
          background: hsla(222, 20%, 8%, 0.9);
          padding: 6px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-glass);
        }

        .code-copy-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-family: var(--font-sans);
          transition: color var(--transition-fast);
        }

        .code-copy-btn:hover {
          color: var(--secondary);
        }

        .code-pre {
          padding: 12px;
          overflow-x: auto;
          margin: 0;
        }

        .code-pre code {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: hsl(190, 95%, 60%);
        }

        .code-inline {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          background: hsla(223, 20%, 5%, 0.5);
          padding: 2px 6px;
          border-radius: 4px;
          color: hsl(300, 90%, 75%);
          border: 1px solid var(--border-glass);
        }

        .scroll-bottom-btn {
          position: absolute;
          bottom: 80px;
          right: 20px;
          background: hsla(223, 35%, 15%, 0.85);
          backdrop-filter: var(--glass-blur);
          border: 1px solid var(--border-glass);
          color: var(--text-main);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          transition: all var(--transition-fast);
          z-index: 5;
        }

        .scroll-bottom-btn:hover {
          color: var(--secondary);
          border-color: var(--secondary);
          transform: translateY(-2px);
        }
      `}</style>

      {/* Header */}
      <div className="chat-header">
        <div className="chat-title">
          <span>Teacher Session</span>
        </div>
        <div className="chat-controls">
          {speechSupported && voices.length > 0 && (
            <select
              value={selectedVoiceName}
              onChange={(e) => onSelectVoice(e.target.value)}
              className="voice-select"
              title="Select Avatar Voice"
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name.replace('Microsoft', '').replace('Google', '').trim()} ({v.lang})
                </option>
              ))}
            </select>
          )}

          {speechSupported && (
            <button
              className={`control-icon-btn ${!isMuted ? 'active' : ''}`}
              onClick={onToggleMute}
              title={isMuted ? 'Unmute Avatar Speech' : 'Mute Avatar Speech'}
            >
              {isMuted ? <FiVolumeX /> : <FiVolume2 />}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        className="chat-body" 
        ref={chatBodyRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '20px'
          }}>
            <h4 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Ask your AI Avatar anything!</h4>
            <p style={{ maxWidth: '280px', fontSize: '0.85rem' }}>
              Upload files to ask about specific subjects, or switch to Quiz mode to test your knowledge.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`message-bubble-wrapper ${msg.role}`}>
              <div className="message-bubble">
                {renderMessageContent(msg.text)}
              </div>
            </div>
          ))
        )}

        {isGenerating && (
          <div className="message-bubble-wrapper model">
            <div className="typing-indicator">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />

        {showScrollBtn && (
          <button 
            className="scroll-bottom-btn" 
            onClick={scrollToBottom}
            title="Scroll to bottom"
          >
            <FiArrowDown />
          </button>
        )}
      </div>

      {/* Input controls */}
      <div className="chat-footer">
        <form onSubmit={handleSend} className="chat-form">
          <input
            type="text"
            className="chat-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening..." : "Type your question here..."}
            disabled={isGenerating || isListening}
          />
          {speechSupported && (
            <button
              type="button"
              className={`mic-btn-inside ${isListening ? 'active' : ''}`}
              onClick={onToggleListen}
              title={isListening ? 'Stop Listening' : 'Speak to Avatar'}
              disabled={isGenerating}
            >
              {isListening ? <FiMicOff /> : <FiMic />}
            </button>
          )}
          <button
            type="submit"
            className="send-btn"
            disabled={!inputText.trim() || isGenerating}
          >
            <FiSend />
          </button>
        </form>
      </div>
    </div>
  );
};

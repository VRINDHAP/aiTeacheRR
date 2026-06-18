import React, { useState } from 'react';
import { FiBookOpen, FiCheckCircle, FiXCircle, FiAward, FiArrowRight, FiRotateCcw } from 'react-icons/fi';


export interface QuizQuestion {
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
}

export interface QuizData {
  quiz_title: string;
  questions: QuizQuestion[];
}

interface QuizProps {
  quizData: QuizData | null;
  onGenerateQuiz: (topic: string, count: number) => void;
  onCloseQuiz: () => void;
  isGenerating: boolean;
  onSpeakFeedback: (text: string) => void;
  selectedDocNames: string[];
  onSetAvatarState: (state: 'idle' | 'happy' | 'explaining' | 'thinking') => void;
}

export const Quiz: React.FC<QuizProps> = ({
  quizData,
  onGenerateQuiz,
  onCloseQuiz,
  isGenerating,
  onSpeakFeedback,
  selectedDocNames,
  onSetAvatarState
}) => {
  const [customTopic, setCustomTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  
  // Game states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showScoreCard, setShowScoreCard] = useState(false);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const topic = customTopic.trim() || (selectedDocNames.length > 0 
      ? `Selected Documents: ${selectedDocNames.join(', ')}`
      : 'General Knowledge Education');
    onGenerateQuiz(topic, questionCount);
    
    // Reset states
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowScoreCard(false);
  };

  const handleOptionClick = (optionIndex: number) => {
    if (isAnswered) return;
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    
    const question = quizData!.questions[currentIndex];
    const isCorrect = optionIndex === question.correct_option_index;
    
    let speechText = '';
    if (isCorrect) {
      setScore(prev => prev + 1);
      onSetAvatarState('happy');
      speechText = "Excellent! You got it right. " + question.explanation;
    } else {
      onSetAvatarState('explaining');
      speechText = `That is incorrect. The correct answer is option ${['A', 'B', 'C', 'D'][question.correct_option_index]}. ` + question.explanation;
    }
    
    onSpeakFeedback(speechText);
  };

  const handleNext = () => {
    onSetAvatarState('idle');
    const nextIndex = currentIndex + 1;
    if (nextIndex < quizData!.questions.length) {
      setCurrentIndex(nextIndex);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowScoreCard(true);
      
      const finalScore = score + (selectedOption === quizData!.questions[currentIndex].correct_option_index ? 1 : 0);
      const total = quizData!.questions.length;
      const ratio = finalScore / total;
      
      let endSpeech = '';
      if (ratio >= 0.8) {
        onSetAvatarState('happy');
        endSpeech = `Congratulations! You scored ${finalScore} out of ${total}. A perfect example of dedication!`;
      } else if (ratio >= 0.5) {
        onSetAvatarState('happy');
        endSpeech = `Good work! You scored ${finalScore} out of ${total}. Keep review materials to master this.`;
      } else {
        onSetAvatarState('explaining');
        endSpeech = `You scored ${finalScore} out of ${total}. Don't worry, errors are steps to learn. Let's study again.`;
      }
      onSpeakFeedback(endSpeech);
    }
  };

  const resetQuiz = () => {
    onCloseQuiz();
    setCustomTopic('');
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowScoreCard(false);
  };

  // 1. Loading screen
  if (isGenerating) {
    return (
      <div className="quiz-loading-container">
        <style>{`
          .quiz-loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 16px;
            color: var(--text-muted);
            text-align: center;
          }
          .quiz-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid transparent;
            border-top-color: var(--secondary);
            border-bottom-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          }
        `}</style>
        <div className="quiz-spinner" />
        <h4>Creating Quiz Questions...</h4>
        <p style={{ fontSize: '0.85rem' }}>Gemini is building your test based on your study subjects.</p>
      </div>
    );
  }

  // 2. Setup screen
  if (!quizData) {
    return (
      <div className="quiz-setup">
        <style>{`
          .quiz-setup {
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 8px;
          }
          
          .setup-title-row {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .setup-icon {
            font-size: 1.8rem;
            color: var(--secondary);
          }
          
          .setup-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .input-label {
            font-size: 0.85rem;
            font-weight: 500;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .active-docs-badge {
            background: hsla(190, 95%, 50%, 0.08);
            border: 1px solid var(--secondary-glow);
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 0.85rem;
            color: var(--secondary);
            margin-bottom: 8px;
          }
        `}</style>

        <div className="setup-title-row">
          <FiBookOpen className="setup-icon" />
          <div>
            <h3>Knowledge Quiz</h3>
            <p style={{ fontSize: '0.85rem' }}>Let the avatar test your learning outcomes.</p>
          </div>
        </div>

        <form onSubmit={handleStart} className="setup-form">
          {selectedDocNames.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="input-label" style={{ marginBottom: '6px' }}>Quiz Reference Context</span>
              <div className="active-docs-badge">
                Selected Materials ({selectedDocNames.length}): {selectedDocNames.join(', ')}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                The quiz will be custom generated specifically from the texts of these files.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="input-label" htmlFor="topic-input">Quiz Topic</label>
              <input
                id="topic-input"
                type="text"
                className="input-text"
                placeholder="e.g. World History, Calculus basics, JavaScript closures"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Type a custom topic or upload materials on the sidebar to quiz from documents.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="input-label" htmlFor="count-select">Number of Questions</label>
            <select
              id="count-select"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="input-text"
              style={{ cursor: 'pointer' }}
            >
              <option value={3}>3 Questions (Quick check)</option>
              <option value={5}>5 Questions (Standard)</option>
              <option value={10}>10 Questions (Thorough)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '12px' }}>
            Generate Custom Quiz
          </button>
        </form>
      </div>
    );
  }

  // 3. Scorecard screen
  if (showScoreCard) {
    const total = quizData.questions.length;
    const ratio = score / total;
    let rankText = '';
    let rankColor = '';

    if (ratio >= 0.8) {
      rankText = 'A+ Expert Master';
      rankColor = 'var(--success)';
    } else if (ratio >= 0.5) {
      rankText = 'B- Passing Scholar';
      rankColor = 'var(--warning)';
    } else {
      rankText = 'Apprentice Learner';
      rankColor = 'var(--danger)';
    }

    return (
      <div className="quiz-scorecard">
        <style>{`
          .quiz-scorecard {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            gap: 20px;
            padding: 10px;
            animation: float 6s ease-in-out infinite;
          }

          .score-circle {
            width: 140px;
            height: 140px;
            border-radius: 50%;
            border: 4px solid var(--border-glass);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            background: hsla(223, 30%, 15%, 0.4);
            box-shadow: 0 0 25px var(--primary-glow);
          }

          .score-num {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--text-main);
          }

          .score-label {
            font-size: 0.75rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .rank-badge {
            font-size: 1.1rem;
            font-weight: 600;
            padding: 6px 16px;
            border-radius: 20px;
            background: hsla(223, 30%, 15%, 0.8);
            border: 1px solid var(--border-glass);
          }
        `}</style>

        <FiAward style={{ fontSize: '3rem', color: rankColor }} />
        
        <div>
          <h3>{quizData.quiz_title}</h3>
          <p style={{ fontSize: '0.85rem' }}>Quiz Results</p>
        </div>

        <div className="score-circle" style={{ borderColor: rankColor }}>
          <span className="score-num">{score}</span>
          <span className="score-label">out of {total}</span>
        </div>

        <div className="rank-badge" style={{ color: rankColor, borderColor: rankColor }}>
          {rankText}
        </div>

        <p style={{ fontSize: '0.9rem', maxWidth: '300px' }}>
          {ratio >= 0.8 
            ? 'Stellar performance! You have fully understood the teaching material.' 
            : ratio >= 0.5 
              ? 'Great effort! Review the study text to master these details.' 
              : 'Don\'t give up! Study the reference materials and try another test.'}
        </p>

        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: '280px' }}>
          <button onClick={resetQuiz} className="btn btn-secondary" style={{ flex: 1 }}>
            <FiRotateCcw /> Exit
          </button>
        </div>
      </div>
    );
  }

  // 4. Playing screen
  const currentQuestion = quizData.questions[currentIndex];
  
  return (
    <div className="quiz-playing">
      <style>{`
        .quiz-playing {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .quiz-progress-bar {
          height: 6px;
          background: hsla(223, 20%, 15%, 0.6);
          border-radius: 3px;
          overflow: hidden;
          width: 100%;
          border: 1px solid var(--border-glass);
        }

        .quiz-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), var(--secondary));
          transition: width var(--transition-normal);
        }

        .question-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .question-card {
          padding: 18px;
          border-radius: 12px;
          background: hsla(223, 25%, 15%, 0.3);
          border: 1px solid var(--border-glass);
          font-size: 1rem;
          line-height: 1.5;
        }

        .options-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .option-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          background: hsla(223, 20%, 12%, 0.5);
          border: 1px solid var(--border-glass);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: 0.9rem;
          text-align: left;
        }

        .option-item:hover:not(.locked) {
          border-color: var(--secondary);
          background: hsla(190, 95%, 50%, 0.05);
        }

        .option-letter {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: hsla(223, 20%, 25%, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .option-item:hover:not(.locked) .option-letter {
          background: var(--secondary);
          color: var(--text-dark);
        }

        /* Option locked states */
        .option-item.correct {
          border-color: var(--success);
          background: hsla(145, 75%, 47%, 0.08);
          box-shadow: 0 0 10px var(--success-glow);
        }
        .option-item.correct .option-letter {
          background: var(--success);
          color: var(--text-dark);
        }

        .option-item.incorrect {
          border-color: var(--danger);
          background: hsla(355, 85%, 60%, 0.08);
        }
        .option-item.incorrect .option-letter {
          background: var(--danger);
          color: var(--text-main);
        }

        .explanation-card {
          padding: 16px;
          border-radius: 8px;
          background: hsla(223, 30%, 10%, 0.4);
          border: 1px solid var(--border-glass);
          border-left: 4px solid var(--secondary);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .explanation-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 600;
        }
      `}</style>

      {/* Progress */}
      <div>
        <div className="question-meta">
          <span>{quizData.quiz_title}</span>
          <span>Question {currentIndex + 1} of {quizData.questions.length}</span>
        </div>
        <div className="quiz-progress-bar" style={{ marginTop: '8px' }}>
          <div 
            className="quiz-progress-fill" 
            style={{ width: `${((currentIndex + (isAnswered ? 1 : 0)) / quizData.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="question-card">
        {currentQuestion.question_text}
      </div>

      {/* Options */}
      <div className="options-grid">
        {currentQuestion.options.map((option, idx) => {
          let optionClass = '';
          if (isAnswered) {
            optionClass = 'locked ';
            if (idx === currentQuestion.correct_option_index) {
              optionClass += 'correct';
            } else if (idx === selectedOption) {
              optionClass += 'incorrect';
            }
          }
          
          return (
            <button
              key={idx}
              className={`option-item ${optionClass}`}
              onClick={() => handleOptionClick(idx)}
              disabled={isAnswered}
            >
              <div className="option-letter">
                {['A', 'B', 'C', 'D'][idx]}
              </div>
              <span style={{ color: 'var(--text-main)' }}>{option}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation & Next */}
      {isAnswered && (
        <>
          <div 
            className="explanation-card"
            style={{ borderLeftColor: selectedOption === currentQuestion.correct_option_index ? 'var(--success)' : 'var(--danger)' }}
          >
            <div className="explanation-header" style={{ color: selectedOption === currentQuestion.correct_option_index ? 'var(--success)' : 'var(--danger)' }}>
              {selectedOption === currentQuestion.correct_option_index ? (
                <>
                  <FiCheckCircle />
                  <span>Correct Answer</span>
                </>
              ) : (
                <>
                  <FiXCircle />
                  <span>Incorrect</span>
                </>
              )}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
              {currentQuestion.explanation}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <button onClick={resetQuiz} className="btn btn-secondary">
              Exit Quiz
            </button>
            <button onClick={handleNext} className="btn btn-primary">
              {currentIndex + 1 < quizData.questions.length ? 'Next Question' : 'View Results'} <FiArrowRight />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

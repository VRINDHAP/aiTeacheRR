import React from 'react';

export type AvatarState = 'idle' | 'thinking' | 'speaking' | 'listening' | 'happy';

interface AvatarProps {
  state: AvatarState;
}

export const Avatar: React.FC<AvatarProps> = ({ state }) => {
  // Determine gradient color and status message based on state
  const getStatusDetails = () => {
    switch (state) {
      case 'thinking':
        return {
          glowColor: 'var(--warning)',
          statusText: 'Thinking...',
          pulseClass: 'pulse-thinking'
        };
      case 'speaking':
        return {
          glowColor: 'var(--secondary)',
          statusText: 'Explaining...',
          pulseClass: 'pulse-speaking'
        };
      case 'listening':
        return {
          glowColor: 'var(--success)',
          statusText: 'Listening to you...',
          pulseClass: 'pulse-listening'
        };
      case 'happy':
        return {
          glowColor: 'var(--primary)',
          statusText: 'Great Job!',
          pulseClass: 'pulse-happy'
        };
      case 'idle':
      default:
        return {
          glowColor: 'var(--primary)',
          statusText: 'Ready to teach',
          pulseClass: 'pulse-idle'
        };
    }
  };

  const details = getStatusDetails();

  return (
    <div className="avatar-wrapper">
      <style>{`
        .avatar-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          position: relative;
        }

        .avatar-svg-container {
          position: relative;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: hsla(223, 35%, 8%, 0.6);
          border: 1px solid var(--border-glass);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--glass-shadow);
          overflow: visible;
        }

        .avatar-bg-glow {
          position: absolute;
          width: 110%;
          height: 110%;
          border-radius: 50%;
          filter: blur(24px);
          opacity: 0.15;
          z-index: 1;
          transition: background var(--transition-slow);
        }

        .svg-avatar {
          width: 85%;
          height: 85%;
          z-index: 2;
        }

        /* SVG Hologram & Glow Animations */
        .holo-glow {
          stroke-dasharray: 8 4;
          animation: rotate-holo 30s linear infinite;
        }

        @keyframes rotate-holo {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 120; }
        }

        /* Eye blink animation */
        .eye-left, .eye-right {
          transform-origin: center;
          animation: blink 4s infinite ease-in-out;
        }
        
        .eye-left {
          animation-delay: 0.5s;
        }

        /* State mouth animations */
        .mouth-idle {
          transition: d var(--transition-normal);
        }

        .mouth-speaking {
          animation: speaking-mouth 0.4s infinite ease-in-out;
        }

        .mouth-listening {
          transform-origin: center;
        }

        .mouth-thinking {
          animation: mouth-think 1.5s infinite ease-in-out;
        }

        @keyframes mouth-think {
          0%, 100% { transform: translateY(0) scaleX(1); }
          50% { transform: translateY(1px) scaleX(0.9); }
        }

        /* Thinking bubbles */
        .think-dot {
          opacity: 0;
          transform-origin: bottom;
        }
        
        .state-thinking .think-dot-1 {
          animation: think-bubble 1.2s infinite ease-in-out 0.2s;
        }
        .state-thinking .think-dot-2 {
          animation: think-bubble 1.2s infinite ease-in-out 0.4s;
        }
        .state-thinking .think-dot-3 {
          animation: think-bubble 1.2s infinite ease-in-out 0.6s;
        }

        .status-badge {
          background: hsla(223, 30%, 15%, 0.7);
          backdrop-filter: var(--glass-blur);
          border: 1px solid var(--border-glass);
          border-radius: 20px;
          padding: 8px 18px;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          transition: all var(--transition-normal);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 8px currentColor;
        }

        /* State specific pulsing rings */
        .avatar-svg-container::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border-radius: 50%;
          border: 1px solid transparent;
          pointer-events: none;
          z-index: 3;
          transition: all var(--transition-normal);
        }

        .pulse-idle::after {
          border-color: hsla(263, 85%, 63%, 0.2);
        }

        .pulse-speaking::after {
          border-color: hsla(190, 95%, 50%, 0.5);
          animation: avatar-ring-pulse 2s infinite;
        }

        .pulse-listening::after {
          border-color: hsla(145, 75%, 47%, 0.5);
          animation: avatar-ring-pulse 1.5s infinite;
        }

        .pulse-thinking::after {
          border-color: hsla(38, 95%, 55%, 0.3);
          border-style: dashed;
          animation: rotate-ring 8s linear infinite;
        }

        .pulse-happy::after {
          border-color: hsla(263, 85%, 63%, 0.5);
          animation: avatar-ring-pulse 1.2s infinite;
        }

        @keyframes avatar-ring-pulse {
          0% { transform: scale(1); opacity: 1; border-color: inherit; }
          100% { transform: scale(1.08); opacity: 0; }
        }

        @keyframes rotate-ring {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Glow Backing */}
      <div 
        className="avatar-bg-glow" 
        style={{ backgroundColor: details.glowColor }} 
      />

      {/* SVG Canvas */}
      <div className={`avatar-svg-container ${details.pulseClass} state-${state}`}>
        <svg 
          viewBox="0 0 200 200" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="svg-avatar"
        >
          {/* Hologram Outer Rings */}
          <circle cx="100" cy="100" r="95" stroke={details.glowColor} strokeWidth="0.5" strokeOpacity="0.3" />
          <circle cx="100" cy="100" r="92" stroke={details.glowColor} strokeWidth="1" strokeOpacity="0.4" className="holo-glow" />
          
          {/* Neck & Shoulders (Hologram vector lines) */}
          <path d="M70 160 C70 145, 80 135, 90 135 H110 C120 135, 130 145, 130 160 L135 185 H65 L70 160 Z" fill="url(#avatarBodyGrad)" stroke="url(#strokeGrad)" strokeWidth="1.5" />
          <path d="M90 120 V138" stroke="url(#strokeGrad)" strokeWidth="1.5" />
          <path d="M110 120 V138" stroke="url(#strokeGrad)" strokeWidth="1.5" />

          {/* Head Shape */}
          <path d="M60 90 C60 60, 140 60, 140 90 C140 115, 125 125, 100 125 C75 125, 60 115, 60 90 Z" fill="url(#avatarHeadGrad)" stroke="url(#strokeGrad)" strokeWidth="1.5" />
          
          {/* Glasses Frame (Looks intellectual/teacher-like) */}
          <path d="M65 85 C65 77, 82 77, 85 85 C88 85, 92 85, 95 85 C98 77, 115 77, 115 85" stroke="url(#strokeGrad)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="75" cy="85" r="12" stroke="url(#strokeGrad)" strokeWidth="1.5" strokeOpacity="0.8" fill="hsla(190, 95%, 50%, 0.05)" />
          <circle cx="105" cy="85" r="12" stroke="url(#strokeGrad)" strokeWidth="1.5" strokeOpacity="0.8" fill="hsla(190, 95%, 50%, 0.05)" />
          <line x1="87" y1="85" x2="93" y2="85" stroke="url(#strokeGrad)" strokeWidth="1.5" />

          {/* Eyes (Blinking arches or glowing spheres) */}
          {state === 'happy' ? (
            // Curved happy eyes
            <>
              <path d="M70 87 Q75 80 80 87" stroke={details.glowColor} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M100 87 Q105 80 110 87" stroke={details.glowColor} strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : (
            // Normal blinking eyes
            <>
              <ellipse cx="75" cy="85" rx="3" ry="3" fill={details.glowColor} className="eye-left" />
              <ellipse cx="105" cy="85" rx="3" ry="3" fill={details.glowColor} className="eye-right" />
            </>
          )}

          {/* Eyebrows */}
          <path 
            d={state === 'thinking' ? "M68 73 Q75 68 82 74" : "M68 72 Q75 70 82 72"} 
            stroke="url(#strokeGrad)" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
          />
          <path 
            d={state === 'thinking' ? "M98 74 Q105 72 112 70" : "M98 72 Q105 70 112 72"} 
            stroke="url(#strokeGrad)" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
          />

          {/* Ears */}
          <path d="M59 85 C55 85, 55 95, 59 97" stroke="url(#strokeGrad)" strokeWidth="1.2" />
          <path d="M141 85 C145 85, 145 95, 141 97" stroke="url(#strokeGrad)" strokeWidth="1.2" />

          {/* Holographic Hair Overlay */}
          <path d="M60 80 C58 70, 70 50, 100 50 C130 50, 142 70, 140 80 C132 72, 130 76, 128 80 C120 70, 115 75, 110 80 C100 70, 90 75, 80 80 C75 72, 65 72, 60 80 Z" fill="url(#avatarHairGrad)" stroke="url(#strokeGrad)" strokeWidth="1" />

          {/* Mouth Path dependent on state */}
          {state === 'idle' && (
            <path d="M88 108 Q90 112 92 108" stroke={details.glowColor} strokeWidth="2" strokeLinecap="round" fill="none" className="mouth-idle" />
          )}
          {state === 'happy' && (
            <path d="M85 106 Q90 114 95 106 Z" fill={details.glowColor} stroke={details.glowColor} strokeWidth="1" />
          )}
          {state === 'speaking' && (
            <path d="M86 107 Q90 101 94 107 Q90 115 86 107 Z" fill="none" stroke={details.glowColor} strokeWidth="2.2" className="mouth-speaking" />
          )}
          {state === 'listening' && (
            <circle cx="90" cy="107" r="3.5" stroke={details.glowColor} strokeWidth="2" fill="none" className="mouth-listening" />
          )}
          {state === 'thinking' && (
            <line x1="85" y1="107" x2="95" y2="107" stroke={details.glowColor} strokeWidth="2.2" strokeLinecap="round" className="mouth-thinking" />
          )}

          {/* Thinking Bubbles (Drawn top-left of the avatar head) */}
          <g className="think-bubbles">
            <circle cx="50" cy="50" r="4" fill="var(--warning)" className="think-dot think-dot-3" />
            <circle cx="43" cy="58" r="2.5" fill="var(--warning)" className="think-dot think-dot-2" />
            <circle cx="38" cy="64" r="1.5" fill="var(--warning)" className="think-dot think-dot-1" />
          </g>

          {/* Linear Gradients Definition */}
          <defs>
            <linearGradient id="avatarHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsla(263, 85%, 63%, 0.15)" />
              <stop offset="100%" stopColor="hsla(190, 95%, 50%, 0.05)" />
            </linearGradient>
            <linearGradient id="avatarBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsla(263, 85%, 63%, 0.2)" />
              <stop offset="100%" stopColor="hsla(190, 95%, 50%, 0.05)" />
            </linearGradient>
            <linearGradient id="avatarHairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsla(263, 85%, 63%, 0.4)" />
              <stop offset="100%" stopColor="hsla(190, 95%, 50%, 0.1)" />
            </linearGradient>
            <linearGradient id="strokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="50%" stopColor="var(--secondary)" />
              <stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Status Badge */}
      <div className="status-badge" style={{ color: details.glowColor }}>
        <span className="status-dot" style={{ backgroundColor: details.glowColor }} />
        {details.statusText}
      </div>
    </div>
  );
};

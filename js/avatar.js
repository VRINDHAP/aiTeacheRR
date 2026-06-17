/**
 * SVG-Based Virtual Teacher Avatar Controller
 */
class TeacherAvatar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.state = 'neutral'; // 'neutral', 'listening', 'thinking', 'teaching'
    
    // SVG Elements
    this.svg = null;
    this.headGroup = null;
    this.pupils = [];
    this.eyebrows = [];
    this.mouth = null;
    this.whiteboardText = null;
    
    // Pose groups
    this.armNeutral = null;
    this.armPointing = null;
    this.armExplaining = null;
    this.armThinking = null;
    
    // Animation state values
    this.blinkTimer = 0;
    this.isBlinking = false;
    this.breathCycle = 0;
    this.mouthOpenAmount = 0.1;
    this.targetMouthOpen = 0.1;
    this.mouseX = 0;
    this.mouseY = 0;
    
    this.init();
  }

  /**
   * Injects the SVG structure and caches element pointers
   */
  init() {
    if (!this.container) return;

    // Premium vector graphic of Elena (SVG)
    this.container.innerHTML = `
      <svg id="elena-svg" viewBox="0 0 400 500" class="avatar-svg" xmlns="http://www.w3.org/2000/svg">
        <!-- Gradients Definitions -->
        <defs>
          <linearGradient id="hair-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2c1a4d" />
            <stop offset="100%" stop-color="#0f0720" />
          </linearGradient>
          <linearGradient id="skin-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffd5b4" />
            <stop offset="100%" stop-color="#ffbe94" />
          </linearGradient>
          <linearGradient id="suit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1b4b" />
            <stop offset="100%" stop-color="#0f0e30" />
          </linearGradient>
          <linearGradient id="collar-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#764af1" />
            <stop offset="100%" stop-color="#bd00ff" />
          </linearGradient>
          <radialGradient id="pupil-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#00f2fe" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#00565b" stop-opacity="0" />
          </radialGradient>
        </defs>

        <!-- BACKGROUND CLASSROOM BOARD (whiteboard inside panel is separate, this is behind avatar) -->
        <rect width="400" height="500" rx="12" fill="transparent"/>

        <!-- BODY & CLOTHING -->
        <g id="avatar-torso">
          <!-- Suit Shoulders -->
          <path d="M80 430 C80 340, 320 340, 320 430 L350 500 L50 500 Z" fill="url(#suit-grad)" stroke="rgba(255,255,255,0.05)" stroke-width="2" />
          
          <!-- Shirt Collar V-Neck -->
          <path d="M160 360 L200 420 L240 360 Z" fill="#ffffff" />
          <path d="M170 360 L200 405 L230 360 Z" fill="url(#collar-grad)" />
          
          <!-- Glasses lanyard or badge (EdTech Startup details) -->
          <rect x="194" y="425" width="12" height="18" rx="2" fill="#764af1" />
          <line x1="200" y1="405" x2="200" y2="425" stroke="#764af1" stroke-width="2" />
        </g>

        <!-- POSES: Arm poses swaps -->
        <!-- 1. Neutral Arms resting -->
        <g id="arm-neutral" opacity="1">
          <!-- Resting left and right arms -->
          <path d="M50 490 C60 440, 90 420, 110 440" stroke="rgba(255,255,255,0.1)" stroke-width="8" stroke-linecap="round" fill="none"/>
          <path d="M350 490 C340 440, 310 420, 290 440" stroke="rgba(255,255,255,0.1)" stroke-width="8" stroke-linecap="round" fill="none"/>
        </g>

        <!-- 2. Pointing Arm (Points to the whiteboard/content) -->
        <g id="arm-pointing" opacity="0">
          <!-- Pointing Left arm towards whiteboard -->
          <path d="M90 410 Q40 320, 20 280" stroke="#ffbe94" stroke-width="20" stroke-linecap="round" fill="none"/>
          <!-- Suit Sleeve sleeve -->
          <path d="M100 430 L80 370 C60 320, 50 300, 35 295" stroke="url(#suit-grad)" stroke-width="24" stroke-linecap="round" fill="none"/>
          <!-- Pointing Finger details -->
          <circle cx="20" cy="275" r="9" fill="#ffd5b4"/>
          <path d="M18 270 Q10 240, 5 230" stroke="#ffd5b4" stroke-width="5" stroke-linecap="round"/>
        </g>

        <!-- 3. Explaining Arm (raised open palm gesture) -->
        <g id="arm-explaining" opacity="0">
          <path d="M310 410 Q350 330, 370 290" stroke="#ffbe94" stroke-width="20" stroke-linecap="round" fill="none"/>
          <!-- Sleeve -->
          <path d="M300 430 L320 370 C340 330, 350 310, 360 295" stroke="url(#suit-grad)" stroke-width="24" stroke-linecap="round" fill="none"/>
          <!-- Open Hand -->
          <circle cx="372" cy="285" r="11" fill="#ffd5b4"/>
          <path d="M372 280 C380 270, 390 275, 390 285" stroke="#ffd5b4" stroke-width="4" stroke-linecap="round" fill="none"/>
          <path d="M376 282 C385 275, 392 280, 390 290" stroke="#ffd5b4" stroke-width="4" stroke-linecap="round" fill="none"/>
        </g>

        <!-- 4. Thinking Arm (hand on chin) -->
        <g id="arm-thinking" opacity="0">
          <path d="M300 460 Q260 380, 210 320" stroke="#ffbe94" stroke-width="18" stroke-linecap="round" fill="none"/>
          <path d="M310 490 L290 440 Q250 380, 215 330" stroke="url(#suit-grad)" stroke-width="22" stroke-linecap="round" fill="none"/>
          <!-- Hand touching chin -->
          <circle cx="205" cy="310" r="10" fill="#ffd5b4"/>
        </g>

        <!-- HEAD GROUP (rotates and bobs) -->
        <g id="avatar-head" transform="translate(0, 0)">
          <!-- Neck -->
          <path d="M175 300 L175 370 L225 370 L225 300 Z" fill="url(#skin-grad)" />
          <!-- Neck Shadow -->
          <path d="M175 350 C175 350, 200 375, 225 350 Z" fill="rgba(0,0,0,0.1)" />

          <!-- Back Hair -->
          <path d="M130 240 C100 170, 300 170, 270 240 C280 340, 120 340, 130 240 Z" fill="url(#hair-grad)" />
          <circle cx="200" cy="120" r="45" fill="url(#hair-grad)" /> <!-- Hair Bun -->

          <!-- Ears -->
          <circle cx="138" cy="230" r="10" fill="#ffbe94" />
          <circle cx="262" cy="230" r="10" fill="#ffbe94" />

          <!-- Face base -->
          <path d="M140 210 C140 140, 260 140, 260 210 C260 280, 140 280, 140 210 Z" fill="url(#skin-grad)" />

          <!-- Eyebrows -->
          <path id="eyebrow-left" d="M160 185 Q172 178, 185 185" stroke="#2c1a4d" stroke-width="3.5" stroke-linecap="round" fill="none" />
          <path id="eyebrow-right" d="M215 185 Q228 178, 240 185" stroke="#2c1a4d" stroke-width="3.5" stroke-linecap="round" fill="none" />

          <!-- Eyes Outer (White part) -->
          <g id="eyes-open">
            <ellipse cx="175" cy="202" rx="14" ry="8" fill="#ffffff" stroke="#2c1a4d" stroke-width="1.5" />
            <ellipse cx="225" cy="202" rx="14" ry="8" fill="#ffffff" stroke="#2c1a4d" stroke-width="1.5" />
            
            <!-- Irises & Pupils -->
            <g id="pupil-left">
              <circle cx="175" cy="202" r="6.5" fill="#764af1" />
              <circle cx="175" cy="202" r="3.5" fill="#000000" />
              <circle cx="173" cy="200" r="2.5" fill="#ffffff" /> <!-- Glint -->
              <circle cx="175" cy="202" r="8" fill="url(#pupil-glow)" pointer-events="none" />
            </g>
            <g id="pupil-right">
              <circle cx="225" cy="202" r="6.5" fill="#764af1" />
              <circle cx="225" cy="202" r="3.5" fill="#000000" />
              <circle cx="223" cy="200" r="2.5" fill="#ffffff" /> <!-- Glint -->
              <circle cx="225" cy="202" r="8" fill="url(#pupil-glow)" pointer-events="none" />
            </g>
          </g>

          <!-- Eyes Eyelids (for Blinking) -->
          <g id="eyes-closed" opacity="0">
            <path d="M161 202 Q175 208, 189 202" stroke="#2c1a4d" stroke-width="3" stroke-linecap="round" fill="none" />
            <path d="M211 202 Q225 208, 239 202" stroke="#2c1a4d" stroke-width="3" stroke-linecap="round" fill="none" />
          </g>

          <!-- Glasses (Adds intelligence/professional flair) -->
          <g id="glasses" stroke="#00f2fe" stroke-width="2" fill="none" opacity="0.95">
            <!-- Left Frame -->
            <rect x="156" y="191" width="38" height="23" rx="6" stroke="#00f2fe" />
            <!-- Right Frame -->
            <rect x="206" y="191" width="38" height="23" rx="6" stroke="#00f2fe" />
            <!-- Bridge -->
            <path d="M194 200 L206 200" />
            <!-- Temple stems -->
            <path d="M156 198 L142 198" />
            <path d="M244 198 L258 198" />
          </g>

          <!-- Nose -->
          <path d="M200 210 L197 230 C197 230, 200 234, 203 230 Z" fill="rgba(0,0,0,0.08)" />

          <!-- Mouth Structure -->
          <path id="mouth" d="M185 252 Q200 258, 215 252" stroke="#b33939" stroke-width="4.5" stroke-linecap="round" fill="none" />
          
          <!-- Cute cheeks (blush highlights) -->
          <circle cx="152" cy="235" r="8" fill="#ff7675" opacity="0.3" />
          <circle cx="248" cy="235" r="8" fill="#ff7675" opacity="0.3" />

          <!-- Front Hair bangs -->
          <path d="M140 180 C150 150, 180 145, 200 165 C220 145, 250 150, 260 180 C265 160, 250 135, 200 135 C150 135, 135 160, 140 180 Z" fill="url(#hair-grad)" />
        </g>
      </svg>
    `;

    // Cache elements
    this.svg = document.getElementById('elena-svg');
    this.headGroup = document.getElementById('avatar-head');
    this.pupils = [document.getElementById('pupil-left'), document.getElementById('pupil-right')];
    this.eyebrows = [document.getElementById('eyebrow-left'), document.getElementById('eyebrow-right')];
    this.mouth = document.getElementById('mouth');
    
    this.armNeutral = document.getElementById('arm-neutral');
    this.armPointing = document.getElementById('arm-pointing');
    this.armExplaining = document.getElementById('arm-explaining');
    this.armThinking = document.getElementById('arm-thinking');

    // Bind window mousemove for eye tracking
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));

    // Launch breathing and blinking loops
    this.animate();
  }

  /**
   * Tracks mouse cursor coordinates to dynamically calculate pupil offsets
   */
  handleMouseMove(e) {
    if (!this.svg) return;
    
    // Get bounding box of SVG to calculate relative vector offsets
    const rect = this.svg.getBoundingClientRect();
    const svgCenterX = rect.left + rect.width / 2;
    const svgCenterY = rect.top + rect.height / 3; // Align to eye level

    const dx = e.clientX - svgCenterX;
    const dy = e.clientY - svgCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Clamp coordinates to range [-3, 3] pixels for subtle, realistic eye-tracking
    const maxOffset = 3.5;
    this.mouseX = (dx / (distance || 1)) * Math.min(maxOffset, distance * 0.05);
    this.mouseY = (dy / (distance || 1)) * Math.min(maxOffset, distance * 0.05);
  }

  /**
   * Updates visual pose states (neutral, listening, thinking, speaking)
   */
  setState(state) {
    this.state = state;
    if (!this.svg) return;

    // Reset arm visibility
    this.armNeutral.style.opacity = '0';
    this.armPointing.style.opacity = '0';
    this.armExplaining.style.opacity = '0';
    this.armThinking.style.opacity = '0';

    // Reset eyebrows
    this.eyebrows[0].setAttribute('d', 'M160 185 Q172 178, 185 185');
    this.eyebrows[1].setAttribute('d', 'M215 185 Q228 178, 240 185');

    // Reset eye container glow class
    const container = this.container.closest('.avatar-container');
    if (container) {
      container.className = 'avatar-container';
    }

    switch(state) {
      case 'listening':
        this.armNeutral.style.opacity = '1';
        if (container) container.classList.add('state-listening');
        // Raise eyebrows slightly to show attentiveness
        this.eyebrows[0].setAttribute('d', 'M160 182 Q172 173, 185 182');
        this.eyebrows[1].setAttribute('d', 'M215 182 Q228 173, 240 182');
        break;

      case 'thinking':
        this.armThinking.style.opacity = '1';
        if (container) container.classList.add('state-thinking');
        // Furrow eyebrows slightly
        this.eyebrows[0].setAttribute('d', 'M160 187 Q172 183, 185 185');
        this.eyebrows[1].setAttribute('d', 'M215 185 Q228 183, 240 187');
        break;

      case 'teaching':
      case 'speaking':
        // Choose pointing or explaining gesture dynamically
        if (Math.random() > 0.5) {
          this.armPointing.style.opacity = '1';
        } else {
          this.armExplaining.style.opacity = '1';
        }
        if (container) container.classList.add('state-speaking');
        break;

      case 'neutral':
      default:
        this.armNeutral.style.opacity = '1';
        break;
    }
  }

  /**
   * Sets target mouth open height for lip-sync routines
   */
  triggerMouthMovement(word) {
    if (this.state !== 'speaking' && this.state !== 'teaching') return;
    
    // Choose mouth heights based on length of word spoken
    const wordLen = word.length;
    if (wordLen <= 3) {
      this.targetMouthOpen = 0.3; // closed-ish O
    } else if (wordLen <= 6) {
      this.targetMouthOpen = 0.6; // medium open
    } else {
      this.targetMouthOpen = 0.9; // wide open
    }
    
    // Reset back to closed slightly later
    setTimeout(() => {
      if (this.state === 'speaking' || this.state === 'teaching') {
        this.targetMouthOpen = 0.1;
      }
    }, 180);
  }

  /**
   * Primary animation rendering loop (60 FPS requestAnimationFrame)
   */
  animate() {
    this.breathCycle += 0.04;
    
    // 1. Natural Breathing Cycle
    const breathOffset = Math.sin(this.breathCycle) * 1.5;
    
    // Apply breathing translation to head and shoulders
    if (this.headGroup) {
      // Subtle tilt/rotation based on state
      let tiltAngle = 0;
      let headX = 0;
      let headY = breathOffset * 0.4;

      if (this.state === 'listening') {
        tiltAngle = 2.5; // Listening head tilt
        headX = 1;
      } else if (this.state === 'thinking') {
        tiltAngle = -1.5;
        headY += Math.sin(this.breathCycle * 0.5) * 1.0;
      } else if (this.state === 'speaking' || this.state === 'teaching') {
        // Dynamic nodding while speaking
        headY += Math.abs(Math.sin(this.breathCycle * 1.5)) * 1.8;
        tiltAngle = Math.sin(this.breathCycle * 1.2) * 1.2;
      }

      this.headGroup.setAttribute('transform', `translate(${headX}, ${headY}) rotate(${tiltAngle}, 200, 210)`);
    }

    // 2. Eye Blinking cycles
    this.blinkTimer++;
    if (this.blinkTimer > 280) { // Blink every 4.6 seconds
      this.isBlinking = true;
      this.blinkTimer = 0;
    }

    if (this.isBlinking) {
      document.getElementById('eyes-open').setAttribute('opacity', '0');
      document.getElementById('eyes-closed').setAttribute('opacity', '1');
      
      // Keep blink brief (10 frames ~ 160ms)
      if (this.blinkTimer > 10) {
        this.isBlinking = false;
        this.blinkTimer = 0;
        document.getElementById('eyes-open').setAttribute('opacity', '1');
        document.getElementById('eyes-closed').setAttribute('opacity', '0');
      }
    }

    // 3. Eye Pupil position adjustments
    if (!this.isBlinking && this.pupils.length === 2) {
      let pupilX = this.mouseX;
      let pupilY = this.mouseY;

      // When thinking, look upward/sideways instead of tracking mouse
      if (this.state === 'thinking') {
        pupilX = -2;
        pupilY = -3;
      }

      this.pupils[0].setAttribute('transform', `translate(${pupilX}, ${pupilY})`);
      this.pupils[1].setAttribute('transform', `translate(${pupilX}, ${pupilY})`);
    }

    // 4. Lip sync mouth path interpolations
    if (this.mouth) {
      // Linear interpolation to smoothly transition mouth heights
      this.mouthOpenAmount += (this.targetMouthOpen - this.mouthOpenAmount) * 0.25;

      let mouthD = "";
      if (this.mouthOpenAmount < 0.2) {
        // Closed/Smiling line
        mouthD = "M185 252 Q200 257, 215 252";
      } else {
        // Open ellipse-like mouth path
        const openHeight = this.mouthOpenAmount * 16;
        mouthD = `M183 250 C183 250, 200 ${250 + openHeight}, 217 250 C217 250, 200 ${250 - openHeight/3}, 183 250 Z`;
      }
      this.mouth.setAttribute('d', mouthD);
    }

    requestAnimationFrame(() => this.animate());
  }
}

// Export initialization handle
window.TeacherAvatar = TeacherAvatar;

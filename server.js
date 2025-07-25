const express = require('express');
const WebSocket = require('ws');
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the public directory
app.use(express.static('public'));

// Serve the web page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
</head>
<body style="margin: 0; height: 100vh; width: 100%; max-width: 414px; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; box-sizing: border-box; font-family: Arial; color: white;">
  <div id="startScreen" style="position: absolute; top: 0; left: 0; width: 100%; height: 100vh; background: radial-gradient(circle at 50% 50%, rgba(20, 44, 102, 0.5) 10%, transparent 50%), radial-gradient(circle at 20% 30%, rgba(32, 16, 38, 0.5) 20%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(14, 17, 36, 0.5) 25%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(32, 16, 38, 0.5) 20%, transparent 50%), radial-gradient(circle at 30% 70%, rgba(40, 50, 100, 0.0), 40%), linear-gradient(to bottom, #201026, #0e1124); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10;">
    <img id="titleImage" src="/images/title.png" alt="Game Title" style="width: 200px; max-width: 80%; margin-bottom: 20px;">
    <input id="roomInput" type="text" placeholder="Enter Room Code" style="width: 36px; height: 18px; font-size: 10px; padding: 4px; background: url('/images/room-code-bg.png') no-repeat center center; background-size: contain; border: none; color: white; text-align: center;">
    <button id="joinButton" style="margin-top: 20px; padding: 5px 10px; font-size: 12px; background: #60a5fa; border: none; color: white; cursor: pointer; border-radius: 5px;">Join</button>
  </div>
  <div id="gameContent" style="display: none; width: 100%; height: 100%; padding: 10px; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 50%, rgba(20, 44, 102, 10%), transparent 50%, rgba(32, 16, 38, 0.0), rgba(14, 64, 36, 0.0), transparent 25%), radial-gradient(circle at 50% 80%, rgba(32, 16, 38, 0.5) 20%, transparent 50%), radial-gradient(circle at 30% 70%, rgba(40, 50, 100, 0.0), 40%), linear-gradient(to bottom, #201026, #0e1124);">
    <div id="glowDotsContainer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0;"></div>
    <div id="scoreDisplay" style="position: absolute; top: 10px; left: 15px; font-size: 12px; color: #60a5fa; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5); display: flex; align-items: center;">
      <img src="/images/custom-fire.png" alt="Fire Icon" style="width: 16px; height: 16px; margin-right: 5px; filter: drop-shadow(0 0 5px rgba(255, 69, 0, 0.7));">
      <span id="score">0</span>
    </div>
    <div id="topContainer" style="position: absolute; top: 10px; right: 15px;">
      <input id="room" type="text" placeholder="Code" style="width: 36px; height: 18px; font-size: 10px; padding: 4px; background: url('/images/room-code-bg.png') no-repeat center center; background-size: contain; border: none; color: white; text-align: center;" readonly>
    </div>
    <div id="sliderTrack" style="width: 120px; height: 50%; max-height: 300px; position: relative; margin: 10px auto 20px auto; display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: 10px 0;">
      <div class="bar-graphic" style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 120px; height: 100%; background: url('/images/custom-bar.png') no-repeat center center; background-size: contain; z-index: 1;"></div>
      <div class="red-dot" style="width: 18px; height: 18px; background: transparent; border-radius: 50%; z-index: 3;"></div>
      <div class="red-dot" style="width: 18px; height: 18px; background: transparent; border-radius: 50%; z-index: 3;"></div>
      <div class="pulse-symbol top" style="position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-size: 18px; color: #ff3333; z-index: 4;">〰️</div>
      <div class="pulse-symbol bottom" style="position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); font-size: 18px; color: #ff3333; z-index: 4;">〰️</div>
    </div>
    <div id="vibrateButton" style="padding: 0; background: none; border: none; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); cursor: pointer; touch-action: none; z-index: 3;">
      <img src="/images/custom-heart.png" alt="Custom Heart" style="width: 40px; height: 40px;">
    </div>
    <div id="bottomControls" style="margin-top: 14px; width: 100%; display: flex; flex-direction: column; align-items: center;">
      <div id="toggleContainer" style="display: flex; justify-content: center; gap: 2px; margin: 5px auto;">
        <div id="pulseToggle" class="toggle-button toggled" style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none;">
          <img src="/images/pulse-toggle.png" alt="Pulse Toggle" style="width: 60px; height: 60px; transition: transform 0.2s;">
        </div>
        <div id="waveToggle" class="toggle-button" style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none;">
          <img src="/images/wave-toggle.png" alt="Wave Toggle" style="width: 60px; height: 60px; transition: transform 0.2s;">
        </div>
      </div>
      <div id="intensityContainer" style="width: 80%; max-width: 600px; padding: 12px; background: url('/images/intensity-bar.png') no-repeat center center; background-size: contain; border-radius: 15px; margin: 5px auto;">
        <input type="range" id="intensity" min="1" max="5" value="3" style="width: 100%; height: 24px; background: transparent; accent-color: transparent;">
      </div>
      <label for="intensity"><span id="intensityValue" style="font-size: 14px; color: #60a5fa;">3</span></label>
    </div>
  </div>
  <style>
    @keyframes fadeOut {
      0% { opacity: 1; background: radial-gradient(circle at 50% 50%, rgba(20, 44, 102, 0.5) 10%, transparent 50%), radial-gradient(circle at 20% 30%, rgba(32, 16, 38, 0.5) 20%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(14, 17, 36, 0.5) 25%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(32, 16, 38, 0.5) 20%, transparent 50%), radial-gradient(circle at 30% 70%, rgba(40, 50, 100, 0.0), 40%), linear-gradient(to bottom, #201026, #0e1124); }
      100% { opacity: 0; background: #0e1124; }
    }
    #startScreen.fade-out {
      animation: fadeOut 1s ease-in-out forwards;
      pointer-events: none; /* Prevent interaction during fade-out */
    }
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    @keyframes barPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    @keyframes subtlePulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }
    @keyframes intensityPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.03); }
      100% { transform: scale(1); }
    }
    @keyframes pendulumWobble {
      0% { transform: translateX(-50%) rotate(0deg); }
      25% { transform: translateX(-50%) rotate(3deg); }
      75% { transform: translateX(-50%) rotate(-3deg); }
      100% { transform: translateX(-50%) rotate(0deg); }
    }
    @keyframes pinch {
      0% { transform: scaleX(1); }
      50% { transform: scaleX(0.9); }
      100% { transform: scaleX(1); }
    }
    @keyframes gelatin {
      0% { transform: scale(var(--scale-x, 1), var(--scale-y, 1)); }
      25% { transform: scale(calc(var(--scale-x, 1) * 0.9), calc(var(--scale-y, 1) * 1.1)); }
      50% { transform: scale(calc(var(--scale-x, 1) * 1.1), calc(var(--scale-y, 1) * 0.9)); }
      75% { transform: scale(calc(var(--scale-x, 1) * 0.95), calc(var(--scale-y, 1) * 1.05)); }
      100% { transform: scale(var(--scale-x, 1), var(--scale-y, 1)); }
    }
    @keyframes bottom-gelatin {
      0% { transform: scale(var(--scale-x, 1), var(--scale-y, 1)); }
      25% { transform: scale(calc(var(--scale-x, 1) * 0.9), calc(var(--scale-y, 1) * 1.1)); }
      50% { transform: scale(calc(var(--scale-x, 1) * 1.1), calc(var(--scale-y, 1) * 0.9)); }
      75% { transform: scale(calc(var(--scale-x, 1) * 0.95), calc(var(--scale-y, 1) * 1.05)); }
      100% { transform: scale(var(--scale-x, 1), var(--scale-y, 1)); }
    }
    @keyframes glowPulse {
      0% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.2); }
      100% { opacity: 0.3; transform: scale(1); }
    }
    .pulsing {
      animation: pulse 0.5s ease-in-out;
    }
    .bar-pulsing {
      animation: barPulse 0.4s ease-in-out infinite;
    }
    .subtle-pulsing {
      animation: subtlePulse 0.4s ease-in-out;
    }
    .intensity-pulsing {
      animation: intensityPulse 0.3s ease-in-out;
    }
    .pendulum-wobble {
      animation: pendulumWobble 0.6s ease-in-out;
      transform-origin: bottom center;
    }
    .pinching {
      animation: pinch 0.3s ease-in-out;
    }
    .gelatin {
      animation: gelatin 0.5s ease-in-out;
    }
    .bottom-gelatin {
      animation: bottom-gelatin 0.5s ease-in-out;
      transform-origin: bottom;
    }
    .squished {
      transition: transform 0.2s ease-in-out;
    }
    .glow-dot {
      position: absolute;
      width: 6px;
      height: 6px;
      background: url('/images/glow-dot.png') no-repeat center center;
      background-size: cover;
      opacity: 0.3;
      animation: glowPulse 3s ease-in-out infinite;
      pointer-events: none;
    }
    .toggle-button {
      background: none;
      color: white;
    }
    .toggle-button.toggled img {
      transform: scale(1.5);
      filter: brightness(1.2);
    }
    #vibrateButton img:hover {
      transform: scale(1.1);
    }
    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      height: 24px;
      background: url('/images/intensity-track.png') no-repeat center center;
      background-size: 100% 100%;
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 48px;
      height: 48px;
      background: url('/images/intensity-thumb.png') no-repeat center center;
      background-size: contain;
      cursor: pointer;
      margin-top: -12px;
      transition: transform 0.2s ease-out;
    }
    input[type="range"]::-webkit-slider-thumb:hover {
      transform: scale(1.1);
    }
    input[type="range"]::-moz-range-thumb {
      width: 48px;
      height: 48px;
      background: url('/images/intensity-thumb.png') no-repeat center center;
      background-size: contain;
      cursor: pointer;
      border: none;
      transition: transform 0.2s ease-out;
    }
    input[type="range"]::-moz-range-thumb:hover {
      transform: scale(1.1);
    }
    input[type="range"]::-webkit-slider-runnable-track {
      height: 24px;
      background: transparent;
    }
    input[type="range"]::-moz-range-track {
      height: 24px;
      background: transparent;
    }
    @media (orientation: landscape) {
      body {
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 5px;
        margin: 0 auto;
        width: 100%;
        max-width: 414px;
      }
      #startScreen {
        padding: 5px;
      }
      #titleImage {
        width: 180px;
        margin-bottom: 15px;
      }
      #roomInput, #joinButton {
        font-size: 10px;
      }
      #gameContent {
        padding: 5px;
      }
      #scoreDisplay {
        font-size: 10px;
        top: 5px;
        left: 10px;
      }
      #topContainer {
        top: 5px;
        right: 10px;
      }
      #room {
        width: 36px;
        height: 18px;
        font-size: 10px;
      }
      #sliderTrack {
        width: 120px;
        height: 40%;
        max-height: 240px;
        margin: 5px auto 15px auto;
      }
      .bar-graphic {
        width: 120px;
        height: 100%;
      }
      #bottomControls {
        margin-top: 14px;
      }
      #toggleContainer {
        flex-direction: row;
        gap: 2px;
        margin: 5px auto;
      }
      #intensityContainer {
        width: 80%;
        max-width: 560px;
        padding: 10px;
      }
      #intensityValue {
        font-size: 12px;
      }
      .pulse-symbol.top {
        top: -14px;
        font-size: 14px;
      }
      .pulse-symbol.bottom {
        bottom: -14px;
        font-size: 14px;
      }
      .glow-dot {
        width: 5px;
        height: 5px;
      }
      .toggle-button {
        width: 80px;
        height: 80px;
      }
      .toggle-button img {
        width: 60px;
        height: 60px;
      }
      .toggle-button.toggled img {
        transform: scale(1.5);
      }
      input[type="range"] {
        height: 22px;
      }
      input[type="range"]::-webkit-slider-thumb {
        width: 44px;
        height: 44px;
        margin-top: -11px;
      }
      input[type="range"]::-moz-range-thumb {
        width: 44px;
        height: 44px;
      }
      input[type="range"]::-webkit-slider-runnable-track {
        height: 22px;
      }
      input[type="range"]::-moz-range-track {
        height: 22px;
      }
    }
  </style>
  <script>
    let ws = null; // Initialize WebSocket after room number is set
    let isVibrating = false;
    let vibrationMode = 'pulse'; // Default mode
    let score = 0;
    let isPressingBar = false; // Track bar press state
    const startScreen = document.getElementById('startScreen');
    const roomInput = document.getElementById('roomInput');
    const joinButton = document.getElementById('joinButton');
    const gameContent = document.getElementById('gameContent');
    const intensityDisplay = document.getElementById('intensityValue');
    const intensitySlider = document.getElementById('intensity');
    const intensityContainer = document.getElementById('intensityContainer');
    const sliderTrack = document.getElementById('sliderTrack');
    const barGraphic = document.querySelector('.bar-graphic');
    const vibrateButton = document.getElementById('vibrateButton');
    const pulseToggle = document.getElementById('pulseToggle');
    const waveToggle = document.getElementById('waveToggle');
    const scoreElement = document.getElementById('score');
    const glowDotsContainer = document.getElementById('glowDotsContainer');
    const roomDisplay = document.getElementById('room');
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let lastPosition = 0;
    let lastCollision = null;
    let lastGelatinTime = 0;
    let lastHeartGelatinTime = 0;
    let lastTrackGelatinTime = 0;
    let lastBottomGelatinTime = 0;
    let lastPendulumTime = 0;
    let currentHeartPosition = 'middle'; // Track heart position state

    function startGame() {
      const roomCode = roomInput.value.trim();
      if (roomCode) {
        console.log('Starting game with room code:', roomCode);
        // Set room display value
        roomDisplay.value = roomCode;
        // Start fade-out animation
        startScreen.classList.add('fade-out');
        setTimeout(() => {
          console.log('Fade-out complete, hiding startScreen');
          startScreen.remove(); // Remove from DOM
          gameContent.style.display = 'flex';
          console.log('gameContent displayed');
          // Initialize WebSocket connection
          ws = new WebSocket('wss://' + window.location.host);
          ws.onopen = () => console.log('Connected to server');
          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.room === roomCode) {
              if (data.command === 'startVibrate' && navigator.vibrate) {
                const intensity = data.intensity || 3;
                let pattern = [1000]; // Default for wave mode
                if (data.mode === 'pulse') {
                  switch (intensity) {
                    case 1: pattern = [50, 200]; break;
                    case 2: pattern = [50, 100]; break;
                    case 3: pattern = [50, 50]; break;
                    case 4: pattern = [100, 50]; break;
                    case 5: pattern = [200]; break;
                    default: pattern = [50, 50];
                  }
                }
                navigator.vibrate(pattern);
                console.log('Vibrate started with mode:', data.mode, 'intensity:', intensity);
                sliderTrack.classList.add('pulsing');
                setTimeout(() => sliderTrack.classList.remove('pulsing'), 500);
              } else if (data.command === 'stopVibrate' && navigator.vibrate) {
                navigator.vibrate(0);
              }
            }
          };
        }, 1000); // Match fadeOut animation duration
      } else {
        console.log('No room code entered');
        roomInput.placeholder = 'Please enter a room code';
        roomInput.value = '';
      }
    }

    // Handle Enter key or Join button click
    roomInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        console.log('Enter key pressed');
        startGame();
      }
    });

    joinButton.addEventListener('click', () => {
      console.log('Join button clicked');
      startGame();
    });

    // Create glowing dots
    function createGlowDots() {
      const dotCount = 20; // Number of dots
      for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('div');
        dot.className = 'glow-dot';
        const size = Math.random() * 3 + 3; // Random size between 3-6px
        dot.style.width = size + 'px';
        dot.style.height = size + 'px';
        dot.style.left = Math.random() * 100 + '%';
        dot.style.top = Math.random() * 100 + '%';
        dot.style.animationDelay = Math.random() * 3 + 's';
        glowDotsContainer.appendChild(dot);
      }
    }
    createGlowDots();

    // Score reduction
    setInterval(() => {
      if (score > 0) {
        score = Math.max(0, score - 2);
        scoreElement.textContent = score;
      }
    }, 1000);

    // Subtle pulsation every 3-6 seconds
    function triggerSubtlePulse() {
      sliderTrack.classList.add('subtle-pulsing');
      setTimeout(() => { sliderTrack.classList.remove('subtle-pulsing'); }, 400);
      const nextPulse = Math.random() * 3000 + 3000; // Random interval between 3-6 seconds
      setTimeout(triggerSubtlePulse, nextPulse);
    }
    triggerSubtlePulse();

    intensitySlider.oninput = () => {
      intensityDisplay.textContent = intensitySlider.value;
      intensityContainer.classList.add('intensity-pulsing');
      setTimeout(() => { intensityContainer.classList.remove('intensity-pulsing'); }, 300);
    };

    pulseToggle.addEventListener('click', () => {
      vibrationMode = 'pulse';
      pulseToggle.classList.add('toggled');
      waveToggle.classList.remove('toggled');
    });

    waveToggle.addEventListener('click', () => {
      vibrationMode = 'wave';
      waveToggle.classList.add('toggled');
      pulseToggle.classList.remove('toggled');
    });

    function createParticle(x, y, side) {
      if (lastCollision === side) return;
      lastCollision = side;
      score += 1;
      scoreElement.textContent = score;
      const currentTime = Date.now();
      if (currentTime - lastGelatinTime >= 500) {
        sliderTrack.classList.add(side === 'top' ? 'gelatin' : 'bottom-gelatin');
        setTimeout(() => { sliderTrack.classList.remove('gelatin', 'bottom-gelatin'); }, 500);
        lastGelatinTime = currentTime;
      }
      setTimeout(() => { if (lastCollision === side) lastCollision = null; }, 200);
    }

    sliderTrack.addEventListener('mousedown', (e) => {
      // Only trigger if not clicking on vibrateButton
      if (e.target !== vibrateButton && !vibrateButton.contains(e.target)) {
        const trackRect = sliderTrack.getBoundingClientRect();
        const clickY = e.clientY - trackRect.top;
        const topThreshold = trackRect.height * 0.1; // Top 10% of track
        const currentTime = Date.now();
        if (clickY <= topThreshold && currentTime - lastPendulumTime >= 600) {
          // Trigger pendulum wobble and squish
          isPressingBar = true;
          sliderTrack.classList.add('squished');
          sliderTrack.style.setProperty('--scale-y', 0.8); // Squish top Y
          barGraphic.classList.add('pendulum-wobble');
          setTimeout(() => { barGraphic.classList.remove('pendulum-wobble'); }, 600);
          lastPendulumTime = currentTime;
        } else if (currentTime - lastTrackGelatinTime >= 500) {
          // Trigger gelatin for other parts of sliderTrack
          sliderTrack.classList.add('gelatin');
          setTimeout(() => { sliderTrack.classList.remove('gelatin'); }, 500);
          lastTrackGelatinTime = currentTime;
        }
      }
    });

    sliderTrack.addEventListener('touchstart', (e) => {
      // Only trigger if not touching vibrateButton
      if (e.target !== vibrateButton && !vibrateButton.contains(e.target)) {
        const trackRect = sliderTrack.getBoundingClientRect();
        const touchY = e.touches[0].clientY - trackRect.top;
        const topThreshold = trackRect.height * 0.1; // Top 10% of track
        const currentTime = Date.now();
        if (touchY <= topThreshold && currentTime - lastPendulumTime >= 600) {
          // Trigger pendulum wobble and squish
          isPressingBar = true;
          sliderTrack.classList.add('squished');
          sliderTrack.style.setProperty('--scale-y', 0.8); // Squish top Y
          barGraphic.classList.add('pendulum-wobble');
          setTimeout(() => { barGraphic.classList.remove('pendulum-wobble'); }, 600);
          lastPendulumTime = currentTime;
        } else if (currentTime - lastTrackGelatinTime >= 500) {
          // Trigger gelatin for other parts of sliderTrack
          sliderTrack.classList.add('gelatin');
          setTimeout(() => { sliderTrack.classList.remove('gelatin'); }, 500);
          lastTrackGelatinTime = currentTime;
        }
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isPressingBar) {
        const trackRect = sliderTrack.getBoundingClientRect();
        const clickY = e.clientY - trackRect.top;
        const topThreshold = trackRect.height * 0.1;
        if (clickY > topThreshold) {
          // Moved out of top 10%, stop squish
          isPressingBar = false;
          sliderTrack.classList.remove('squished');
          sliderTrack.classList.add('gelatin');
          sliderTrack.style.setProperty('--scale-y', currentHeartPosition === 'top' ? 1.1 : currentHeartPosition === 'bottom' ? 0.9 : 1);
          setTimeout(() => { sliderTrack.classList.remove('gelatin'); }, 500);
        }
      }
      handleMovement(e, false);
    });

    document.addEventListener('touchmove', (e) => {
      if (isPressingBar) {
        const trackRect = sliderTrack.getBoundingClientRect();
        const touchY = e.touches[0].clientY - trackRect.top;
        const topThreshold = trackRect.height * 0.1;
        if (touchY > topThreshold) {
          // Moved out of top 10%, stop squish
          isPressingBar = false;
          sliderTrack.classList.remove('squished');
          sliderTrack.classList.add('gelatin');
          sliderTrack.style.setProperty('--scale-y', currentHeartPosition === 'top' ? 1.1 : currentHeartPosition === 'bottom' ? 0.9 : 1);
          setTimeout(() => { sliderTrack.classList.remove('gelatin'); }, 500);
        }
      }
      handleMovement(e, true);
    });

    document.addEventListener('mouseup', () => {
      if (isPressingBar) {
        isPressingBar = false;
        sliderTrack.classList.remove('squished');
        sliderTrack.classList.add('gelatin');
        sliderTrack.style.setProperty('--scale-y', currentHeartPosition === 'top' ? 1.1 : currentHeartPosition === 'bottom' ? 0.9 : 1);
        setTimeout(() => { sliderTrack.classList.remove('gelatin'); }, 500);
      }
      if (isDragging) {
        const room = roomDisplay.value;
        if (room) {
          ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
          vibrateButton.classList.remove('pulsing');
          sliderTrack.classList.remove('bar-pulsing', 'pinching');
          if (!isPressingBar) {
            sliderTrack.style.setProperty('--scale-x', 1);
            sliderTrack.style.setProperty('--scale-y', 1);
            sliderTrack.classList.remove('gelatin', 'bottom-gelatin');
            currentHeartPosition = 'middle';
          }
        }
        isDragging = false;
        lastCollision = null;
      }
    });

    document.addEventListener('touchend', () => {
      if (isPressingBar) {
        isPressingBar = false;
        sliderTrack.classList.remove('squished');
        sliderTrack.classList.add('gelatin');
        sliderTrack.style.setProperty('--scale-y', currentHeartPosition === 'top' ? 1.1 : currentHeartPosition === 'bottom' ? 0.9 : 1);
        setTimeout(() => { sliderTrack.classList.remove('gelatin'); }, 500);
      }
      if (isDragging) {
        const room = roomDisplay.value;
        if (room) {
          ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
          vibrateButton.classList.remove('pulsing');
          sliderTrack.classList.remove('bar-pulsing', 'pinching');
          if (!isPressingBar) {
            sliderTrack.style.setProperty('--scale-x', 1);
            sliderTrack.style.setProperty('--scale-y', 1);
            sliderTrack.classList.remove('gelatin', 'bottom-gelatin');
            currentHeartPosition = 'middle';
          }
        }
        isDragging = false;
        lastCollision = null;
      }
    });

    vibrateButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      const bodyRect = document.body.getBoundingClientRect();
      startX = e.clientX - bodyRect.left - (vibrateButton.offsetWidth / 2);
      startY = e.clientY - bodyRect.top - (vibrateButton.offsetHeight / 2);
      const room = roomDisplay.value;
      if (room) {
        vibrateButton.classList.add('pulsing');
        const currentTime = Date.now();
        if (currentTime - lastHeartGelatinTime >= 500) {
          vibrateButton.classList.add('gelatin');
          setTimeout(() => { vibrateButton.classList.remove('gelatin'); }, 500);
          lastHeartGelatinTime = currentTime;
        }
      }
      lastPosition = vibrateButton.offsetTop;
    });

    vibrateButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDragging = true;
      const bodyRect = document.body.getBoundingClientRect();
      startX = e.touches[0].clientX - bodyRect.left - (vibrateButton.offsetWidth / 2);
      startY = e.touches[0].clientY - bodyRect.top - (vibrateButton.offsetHeight / 2);
      const room = roomDisplay.value;
      if (room) {
        vibrateButton.classList.add('pulsing');
        const currentTime = Date.now();
        if (currentTime - lastHeartGelatinTime >= 500) {
          vibrateButton.classList.add('gelatin');
          setTimeout(() => { vibrateButton.classList.remove('gelatin'); }, 500);
          lastHeartGelatinTime = currentTime;
        }
      }
      lastPosition = vibrateButton.offsetTop;
    });

    function handleMovement(e, isTouch = false) {
      if (isDragging) {
        e.preventDefault();
        const bodyRect = document.body.getBoundingClientRect();
        let newX = isTouch ? e.touches[0].clientX : e.clientX;
        let newY = isTouch ? e.touches[0].clientY : e.clientY;
        newX = newX - bodyRect.left - (vibrateButton.offsetWidth / 2);
        newY = newY - bodyRect.top - (vibrateButton.offsetHeight / 2);
        // Constrain to body bounds
        if (newX < 0) newX = 0;
        if (newX > bodyRect.width - vibrateButton.offsetWidth) newX = bodyRect.width - vibrateButton.offsetWidth;
        if (newY < 0) newY = 0;
        if (newY > bodyRect.height - vibrateButton.offsetHeight) newY = bodyRect.height - vibrateButton.offsetHeight;
        vibrateButton.style.left = newX + 'px';
        vibrateButton.style.top = newY + 'px';

        const room = roomDisplay.value;
        const trackRect = sliderTrack.getBoundingClientRect();
        const heartRect = vibrateButton.getBoundingClientRect();
        const relativeY = heartRect.top - trackRect.top;
        const maxPosition = trackRect.height - vibrateButton.offsetHeight;
        const bottomThreshold = maxPosition * 0.9; // Bottom 10% of track
        const topThreshold = maxPosition * 0.1; // Top 10% of track

        // Determine heart position state
        let newHeartPosition = 'middle';
        if (relativeY <= topThreshold) {
          newHeartPosition = 'top';
        } else if (relativeY >= bottomThreshold) {
          newHeartPosition = 'bottom';
        }

        // Update scale only if position state changes and not pressing bar
        if (newHeartPosition !== currentHeartPosition && !isPressingBar) {
          sliderTrack.classList.remove('gelatin', 'bottom-gelatin');
          if (newHeartPosition === 'top') {
            sliderTrack.style.setProperty('--scale-x', 0.8); // Thinner
            sliderTrack.style.setProperty('--scale-y', 1.1); // Squeezed
            sliderTrack.classList.add('gelatin');
            setTimeout(() => { sliderTrack.classList.remove('gelatin'); }, 500);
          } else if (newHeartPosition === 'bottom') {
            sliderTrack.style.setProperty('--scale-x', 1.2); // Thicker
            sliderTrack.style.setProperty('--scale-y', 0.9); // Shorter
            sliderTrack.classList.add('bottom-gelatin');
            setTimeout(() => { sliderTrack.classList.remove('bottom-gelatin'); }, 500);
          } else {
            sliderTrack.style.setProperty('--scale-x', 1); // Normal
            sliderTrack.style.setProperty('--scale-y', 1); // Normal
          }
          currentHeartPosition = newHeartPosition;
        }

        if (room) {
          if (relativeY <= 0 || relativeY >= maxPosition) {
            const intensity = parseInt(intensitySlider.value);
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: intensity, mode: vibrationMode }));
            sliderTrack.classList.add('bar-pulsing', 'pinching');
            createParticle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2, relativeY <= 0 ? 'top' : 'bottom');
          } else {
            ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
            sliderTrack.classList.remove('bar-pulsing', 'pinching');
            lastCollision = null;
          }
        }
        lastPosition = relativeY;
      }
    }
  </script>
</body>
</html>
  `);
});

// WebSocket connection
let clients = [];
wss.on('connection', (ws) => {
  clients.push(ws);
  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
  });
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });
});

server.listen(process.env.PORT || 3000, () => console.log('Server running'));

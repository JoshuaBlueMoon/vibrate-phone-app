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
<body style="background: radial-gradient(circle at 50% 50%, rgba(20, 44, 102, 0.5) 10%, transparent 50%), radial-gradient(circle at 20% 30%, rgba(32, 16, 38, 0.5) 20%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(14, 17, 36, 0.5) 25%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(32, 16, 38, 0.5) 20%, transparent 50%), radial-gradient(circle at 30% 70%, rgba(14, 17, 36, 0.5) 20%, transparent 50%), linear-gradient(to bottom, #201026, #0e1124); color: white; font-family: Arial; margin: 0 auto; padding: 10px; height: 100vh; width: 100%; max-width: 414px; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; box-sizing: border-box;">
  <div id="scoreDisplay" style="position: absolute; top: 10px; left: 15px; font-size: 12px; color: #60a5fa; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5); display: flex; align-items: center;">
    <img src="/images/custom-fire.png" alt="Fire Icon" style="width: 16px; height: 16px; margin-right: 5px; filter: drop-shadow(0 0 5px rgba(255, 69, 0, 0.7));">
    <span id="score">0</span>
  </div>
  <div id="topContainer" style="position: absolute; top: 10px; right: 15px;">
    <input id="room" type="text" placeholder="Code" style="width: 36px; height: 18px; font-size: 10px; padding: 4px; background-color: #2b4d9e; border: 2px solid #60a5fa; border-radius: 5px; color: white; text-align: center; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);">
  </div>
  <div id="sliderTrack" style="width: 100px; height: 60%; max-height: 400px; background: url('/images/custom-bar.png') no-repeat center center; background-size: cover; border-radius: 50px; position: relative; margin: 10px auto 20px auto; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: 10px 0; box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.5); border: 1px solid rgba(255, 255, 255, 0.2);">
    <div class="red-dot" style="width: 18px; height: 18px; background: transparent; border-radius: 50%; z-index: 3;"></div>
    <div id="vibrateButton" style="padding: 8px; background-color: transparent; border: none; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; position: absolute; top: 0; left: calc(50% - 28px); cursor: pointer; touch-action: none; z-index: 3;">
      <img src="/images/custom-heart.png" alt="Custom Heart" style="width: 40px; height: 40px;">
    </div>
    <div class="red-dot" style="width: 18px; height: 18px; background: transparent; border-radius: 50%; z-index: 3;"></div>
    <div class="pulse-symbol top" style="position: absolute; top: -22px; left: 50%; transform: translateX(-50%); font-size: 18px; color: #ff3333; z-index: 4;">〰️</div>
    <div class="pulse-symbol bottom" style="position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%); font-size: 18px; color: #ff3333; z-index: 4;">〰️</div>
  </div>
  <div id="bottomControls" style="margin-top: 30px; width: 100%; display: flex; flex-direction: column; align-items: center;">
    <div id="toggleContainer" style="display: flex; justify-content: center; gap: 12px; margin: 5px auto;">
      <div id="pulseToggle" class="toggle-button toggled" style="width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3); border: none;">
        <img src="/images/pulse-icon.png" alt="Pulse Icon" style="width: 24px; height: 24px;">
      </div>
      <div id="waveToggle" class="toggle-button" style="width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3); border: none;">
        <img src="/images/wave-icon.png" alt="Wave Icon" style="width: 24px; height: 24px;">
      </div>
    </div>
    <div id="intensityContainer" style="width: 80%; max-width: 240px; padding: 6px; background: linear-gradient(to right, #1e40af, #3b82f6); border-radius: 15px; margin: 5px auto; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);">
      <input type="range" id="intensity" min="1" max="5" value="3" style="width: 100%; background: transparent; accent-color: #93c5fd;">
    </div>
    <label for="intensity"><span id="intensityValue" style="font-size: 12px; color: #60a5fa;">3</span></label>
  </div>
  <style>
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
    @keyframes flash {
      0% { background-color: rgba(0, 0, 0, 0); }
      20% { background-color: rgba(255, 51, 51, 0.3); }
      100% { background-color: rgba(0, 0, 0, 0); }
    }
    @keyframes particle {
      0% { opacity: 1; transform: translate(0, 0) scale(1); }
      100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.5); }
    }
    @keyframes pinch {
      0% { transform: scaleX(1); }
      50% { transform: scaleX(0.9); }
      100% { transform: scaleX(1); }
    }
    @keyframes gelatin {
      0% { transform: scale(1, 1); }
      25% { transform: scale(0.9, 1.1); }
      50% { transform: scale(1.1, 0.9); }
      75% { transform: scale(0.95, 1.05); }
      100% { transform: scale(1, 1); }
    }
    @keyframes redPulse {
      0% { background-color: rgba(0, 0, 0, 0); }
      50% { background-color: rgba(255, 51, 51, 0.3); }
      100% { background-color: rgba(0, 0, 0, 0); }
    }
    @keyframes waveBurst {
      0% { transform: scale(1); opacity: 0.5; }
      100% { transform: scale(2); opacity: 0; }
    }
    @keyframes enlargeBottom {
      0% { transform: scale(1, 1); transform-origin: bottom center; }
      25% { transform: scale(1.05, 1.15); transform-origin: bottom center; }
      50% { transform: scale(1.1, 1.3); transform-origin: bottom center; }
      75% { transform: scale(1.05, 1.15); transform-origin: bottom center; }
      100% { transform: scale(1, 1); transform-origin: bottom center; }
    }
    @keyframes pinchTop {
      0% { transform: scale(1, 1); transform-origin: top center; }
      25% { transform: scale(0.85, 1); transform-origin: top center; }
      50% { transform: scale(0.8, 1); transform-origin: top center; }
      75% { transform: scale(0.85, 1); transform-origin: top center; }
      100% { transform: scale(1, 1); transform-origin: top center; }
    }
    @keyframes twitch {
      0% { transform: scale(1, 1) rotate(0deg); }
      25% { transform: scale(1.02, 1.02) rotate(1deg); }
      50% { transform: scale(1, 1) rotate(-1deg); }
      75% { transform: scale(1.02, 1.02) rotate(1deg); }
      100% { transform: scale(1, 1) rotate(0deg); }
    }
    .pulsing {
      animation: pulse 0.5s ease-in-out;
    }
    .bar-pulsing {
      animation: barPulse 0.4s ease-in-out infinite;
    }
    .flashing::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      animation: flash 0.3s ease-out;
    }
    .pinching {
      animation: pinch 0.3s ease-in-out;
    }
    .gelatin {
      animation: gelatin 0.5s ease-in-out;
    }
    .red-pulsing::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      animation: redPulse 2s ease-in-out infinite;
    }
    .enlarge-bottom {
      animation: enlargeBottom 0.5s ease-in-out;
    }
    .pinch-top {
      animation: pinchTop 0.5s ease-in-out;
    }
    .twitch {
      animation: twitch 0.3s ease-in-out;
    }
    .particle {
      position: absolute;
      pointer-events: none;
      animation: particle 1.5s ease-out forwards;
    }
    .wave-burst {
      position: absolute;
      width: 100px;
      height: 100px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent);
      border-radius: 50%;
      pointer-events: none;
      animation: waveBurst 1s ease-out forwards;
      z-index: 1;
    }
    .toggle-button {
      background-color: #2b4d9e;
      color: white;
    }
    .toggle-button.toggled {
      background-color: white !important;
    }
    .toggle-button.toggled img {
      filter: brightness(1.2);
    }
    #vibrateButton img:hover {
      transform: scale(1.1);
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      background: #93c5fd;
      border-radius: 50%;
      cursor: pointer;
      margin-top: -6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    input[type="range"]::-moz-range-thumb {
      width: 20px;
      height: 20px;
      background: #93c5fd;
      border-radius: 50%;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    input[type="range"]::-webkit-slider-runnable-track {
      background: #1e3a8a;
      height: 10px;
      border-radius: 5px;
    }
    input[type="range"]::-moz-range-track {
      background: #1e3a8a;
      height: 10px;
      border-radius: 5px;
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
        width: 100px;
        height: 50%;
        max-height: 300px;
        margin: 5px auto 15px auto;
      }
      #bottomControls {
        margin-top: 25px;
      }
      #toggleContainer {
        flex-direction: row;
        gap: 8px;
        margin: 5px auto;
      }
      #intensityContainer {
        width: 80%;
        max-width: 220px;
        padding: 5px;
      }
      #intensityValue {
        font-size: 10px;
      }
      .pulse-symbol.top {
        top: -18px;
        font-size: 14px;
      }
      .pulse-symbol.bottom {
        bottom: -18px;
        font-size: 14px;
      }
    }
  </style>
  <script>
    const ws = new WebSocket('wss://' + window.location.host);
    let isVibrating = false;
    let vibrationMode = 'pulse'; // Default mode
    let score = 0;
    const intensityDisplay = document.getElementById('intensityValue');
    const intensitySlider = document.getElementById('intensity');
    const sliderTrack = document.getElementById('sliderTrack');
    const vibrateButton = document.getElementById('vibrateButton');
    const pulseToggle = document.getElementById('pulseToggle');
    const waveToggle = document.getElementById('waveToggle');
    const scoreElement = document.getElementById('score');
    let isDragging = false;
    let startY = 0;
    let lastPosition = 0;
    let lastCollision = null;
    let lastGelatinTime = 0;
    let lastWaveBurstTime = 0;
    let lastHeartGelatinTime = 0;
    let lastTrackGelatinTime = 0;
    let lastDistortionTime = 0;

    // Score reduction: 2 points per second
    setInterval(() => {
      if (score > 0) {
        score = Math.max(0, score - 2);
        scoreElement.textContent = score;
        if (score < 60 && sliderTrack.classList.contains('red-pulsing')) {
          sliderTrack.classList.remove('red-pulsing', 'gelatin');
        }
      }
    }, 1000);

    // Subtle twitch every 3-6 seconds
    function triggerTwitch() {
      const randomInterval = Math.random() * 3000 + 3000; // 3-6 seconds
      setTimeout(() => {
        sliderTrack.classList.add('twitch');
        setTimeout(() => {
          sliderTrack.classList.remove('twitch');
          triggerTwitch(); // Schedule next twitch
        }, 300);
      }, randomInterval);
    }
    triggerTwitch();

    intensitySlider.oninput = () => {
      intensityDisplay.textContent = intensitySlider.value;
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

    ws.onopen = () => console.log('Connected to server');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.room === document.getElementById('room').value) {
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
          sliderTrack.classList.add('pulsing', 'flashing');
          setTimeout(() => sliderTrack.classList.remove('pulsing', 'flashing'), 500);
        } else if (data.command === 'stopVibrate' && navigator.vibrate) {
          navigator.vibrate(0);
        }
      }
    };

    function createParticle(x, y, side) {
      if (lastCollision === side) return;
      lastCollision = side;
      score += 1;
      scoreElement.textContent = score;
      if (score >= 60) {
        sliderTrack.classList.add('red-pulsing', 'gelatin');
      }
      const particleCount = 3;
      const trackRect = sliderTrack.getBoundingClientRect();
      const bodyRect = document.body.getBoundingClientRect();
      const bodyX = x + trackRect.left - bodyRect.left;
      const bodyY = y + trackRect.top - bodyRect.top;
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.innerHTML = '<img src="/images/custom-particle.png" alt="Particle" style="width: 20px; height: 20px;">';
        particle.style.left = (bodyX - 2) + 'px';
        particle.style.top = (bodyY - 2) + 'px';
        const angle = Math.random() * 2 * Math.PI;
        const distance = 30 + Math.random() * 70;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        document.body.appendChild(particle);
        setTimeout(() => { particle.remove(); }, 1500);
      }
      const currentTime = Date.now();
      if (currentTime - lastGelatinTime >= 500) {
        sliderTrack.classList.add('gelatin');
        setTimeout(() => { sliderTrack.classList.remove('gelatin'); }, 500);
        lastGelatinTime = currentTime;
      }
      if (currentTime - lastWaveBurstTime >= 500) {
        const waveBurst = document.createElement('div');
        waveBurst.className = 'wave-burst';
        waveBurst.style.left = (trackRect.left - bodyRect.left + trackRect.width / 2 - 50) + 'px';
        waveBurst.style.top = (trackRect.top - bodyRect.top + trackRect.height / 2 - 50) + 'px';
        document.body.appendChild(waveBurst);
        setTimeout(() => { waveBurst.remove(); }, 1000);
        lastWaveBurstTime = currentTime;
      }
      setTimeout(() => { if (lastCollision === side) lastCollision = null; }, 200);
    }

    vibrateButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      const trackRect = sliderTrack.getBoundingClientRect();
      startY = e.clientY - trackRect.top - (vibrateButton.offsetHeight / 2);
      const room = document.getElementById('room').value;
      if (room) {
        vibrateButton.style.backgroundColor = '#1e40af';
        vibrateButton.classList.add('pulsing');
        const currentTime = Date.now();
        if (currentTime - lastHeartGelatinTime >= 500) {
          vibrateButton.classList.add('gelatin');
          setTimeout(() => { vibrateButton.classList.remove('gelatin'); }, 500);
          lastHeartGelatinTime = currentTime;
        }
        const intensity = parseInt(intensitySlider.value);
        ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: intensity, mode: vibrationMode }));
        sliderTrack.classList.add('pulsing', 'flashing');
        setTimeout(() => sliderTrack.classList.remove('pulsing', 'flashing'), 500);
      }
      lastPosition = vibrateButton.offsetTop;
    });

    vibrateButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDragging = true;
      const trackRect = sliderTrack.getBoundingClientRect();
      startY = e.touches[0].clientY - trackRect.top - (vibrateButton.offsetHeight / 2);
      const room = document.getElementById('room').value;
      if (room) {
        vibrateButton.style.backgroundColor = '#1e40af';
        vibrateButton.classList.add('pulsing');
        const currentTime = Date.now();
        if (currentTime - lastHeartGelatinTime >= 500) {
          vibrateButton.classList.add('gelatin');
          setTimeout(() => { vibrateButton.classList.remove('gelatin'); }, 500);
          lastHeartGelatinTime = currentTime;
        }
        const intensity = parseInt(intensitySlider.value);
        ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: intensity, mode: vibrationMode }));
        sliderTrack.classList.add('pulsing', 'flashing');
        setTimeout(() => sliderTrack.classList.remove('pulsing', 'flashing'), 500);
      }
      lastPosition = vibrateButton.offsetTop;
    });

    sliderTrack.addEventListener('click', (e) => {
      // Only trigger wobble if not clicking on vibrateButton
      if (e.target !== vibrateButton && !vibrateButton.contains(e.target)) {
        const currentTime = Date.now();
        if (currentTime - lastTrackGelatinTime >= 500) {
          sliderTrack.classList.add('gelatin');
          setTimeout(() => { sliderTrack.classList.remove('gelatin'); }, 500);
          lastTrackGelatinTime = currentTime;
        }
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        const trackRect = sliderTrack.getBoundingClientRect();
        let newY = e.clientY - trackRect.top - (vibrateButton.offsetHeight / 2);
        if (newY < 0) newY = 0;
        if (newY > trackRect.height - vibrateButton.offsetHeight) newY = trackRect.height - vibrateButton.offsetHeight;
        vibrateButton.style.left = 'calc(50% - 28px)';
        vibrateButton.style.top = newY + 'px';

        const room = document.getElementById('room').value;
        const currentPosition = vibrateButton.offsetTop;
        const maxPosition = trackRect.height - vibrateButton.offsetHeight;
        const currentTime = Date.now();

        // Apply distortion based on heart position
        if (currentTime - lastDistortionTime >= 500) {
          sliderTrack.classList.remove('enlarge-bottom', 'pinch-top');
          if (currentPosition <= maxPosition * 0.1) {
            sliderTrack.classList.add('pinch-top');
            setTimeout(() => { sliderTrack.classList.remove('pinch-top'); }, 500);
          } else if (currentPosition >= maxPosition * 0.9) {
            sliderTrack.classList.add('enlarge-bottom');
            setTimeout(() => { sliderTrack.classList.remove('enlarge-bottom'); }, 500);
          }
          lastDistortionTime = currentTime;
        }

        if (room) {
          if (currentPosition <= 0 || currentPosition >= maxPosition) {
            const intensity = parseInt(intensitySlider.value);
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: intensity, mode: vibrationMode }));
            sliderTrack.classList.add('bar-pulsing', 'flashing', 'pinching');
            createParticle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2, currentPosition <= 0 ? 'top' : 'bottom');
          } else {
            ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
            sliderTrack.classList.remove('bar-pulsing', 'flashing', 'pinching');
            lastCollision = null;
          }
        }
        lastPosition = currentPosition;
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        const room = document.getElementById('room').value;
        if (room) {
          ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
          vibrateButton.style.backgroundColor = '#3b82f6';
          vibrateButton.classList.remove('pulsing');
          sliderTrack.classList.remove('bar-pulsing', 'flashing', 'pinching', 'enlarge-bottom', 'pinch-top');
        }
        isDragging = false;
        lastCollision = null;
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (isDragging) {
        e.preventDefault();
        const trackRect = sliderTrack.getBoundingClientRect();
        let newY = e.touches[0].clientY - trackRect.top - (vibrateButton.offsetHeight / 2);
        if (newY < 0) newY = 0;
        if (newY > trackRect.height - vibrateButton.offsetHeight) newY = trackRect.height - vibrateButton.offsetHeight;
        vibrateButton.style.left = 'calc(50% - 28px)';
        vibrateButton.style.top = newY + 'px';

        const room = document.getElementById('room').value;
        const currentPosition = vibrateButton.offsetTop;
        const maxPosition = trackRect.height - vibrateButton.offsetHeight;
        const currentTime = Date.now();

        // Apply distortion based on heart position
        if (currentTime - lastDistortionTime >= 500) {
          sliderTrack.classList.remove('enlarge-bottom', 'pinch-top');
          if (currentPosition <= maxPosition * 0.1) {
            sliderTrack.classList.add('pinch-top');
            setTimeout(() => { sliderTrack.classList.remove('pinch-top'); }, 500);
          } else if (currentPosition >= maxPosition * 0.9) {
            sliderTrack.classList.add('enlarge-bottom');
            setTimeout(() => { sliderTrack.classList.remove('enlarge-bottom'); }, 500);
          }
          lastDistortionTime = currentTime;
        }

        if (room) {
          if (currentPosition <= 0 || currentPosition >= maxPosition) {
            const intensity = parseInt(intensitySlider.value);
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: intensity, mode: vibrationMode }));
            sliderTrack.classList.add('bar-pulsing', 'flashing', 'pinching');
            createParticle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2, currentPosition <= 0 ? 'top' : 'bottom');
          } else {
            ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
            sliderTrack.classList.remove('bar-pulsing', 'flashing', 'pinching');
            lastCollision = null;
          }
        }
        lastPosition = currentPosition;
      }
    });

    document.addEventListener('touchend', () => {
      if (isDragging) {
        const room = document.getElementById('room').value;
        if (room) {
          ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
          vibrateButton.style.backgroundColor = '#3b82f6';
          vibrateButton.classList.remove('pulsing');
          sliderTrack.classList.remove('bar-pulsing', 'flashing', 'pinching', 'enlarge-bottom', 'pinch-top');
        }
        isDragging = false;
        lastCollision = null;
      }
    });
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

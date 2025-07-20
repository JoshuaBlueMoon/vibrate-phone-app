const express = require('express');
const WebSocket = require('ws');
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

// Serve the web page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
</head>
<body style="background: linear-gradient(to bottom, #1a2a44, #3b82f6); color: white; font-family: Arial; margin: 0; padding: 20px; height: 100vh; width: 100vw; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; position: relative; max-width: 414px; margin: 0 auto;">
  <div style="display: flex; align-items: center; gap: 20px; margin: 20px 10px 40px 10px;">
    <input id="room" type="text" placeholder="Code" style="width: 40px; height: 20px; font-size: 12px; padding: 4px; background-color: #2b4d9e; border: 2px solid #60a5fa; border-radius: 5px; color: white; text-align: center; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);">
    <div id="scoreDisplay" style="font-size: 16px; color: #60a5fa; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);">Score: <span id="score">0</span></div>
  </div>
  <div id="toggleContainer" style="display: flex; justify-content: center; gap: 20px; margin-bottom: 10px;">
    <div id="pulseToggle" class="toggle-button toggled" style="width: 40px; height: 40px; background-color: white; color: #1e40af; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5); border: none;">💓</div>
    <div id="waveToggle" class="toggle-button" style="width: 40px; height: 40px; background-color: #2b4d9e; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5); border: none;">〰️</div>
  </div>
  <div id="intensityContainer" style="width: 80%; max-width: 150px; padding: 4px; background: linear-gradient(to right, #60a5fa, #a855f7); border-radius: 20px; margin: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);">
    <input type="range" id="intensity" min="1" max="5" value="3" style="width: 100%; background: transparent; accent-color: #93c5fd;">
  </div>
  <label for="intensity"><span id="intensityValue" style="color: #60a5fa;">3</span></label>
  <div id="sliderTrack" style="width: 80%; max-width: 600px; height: 120px; background-color: #1e1b4b; border-radius: 60px; position: relative; margin-top: 20px; overflow: hidden; display: flex; justify-content: space-between; align-items: center; padding: 0 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);">
    <div class="red-dot" style="width: 20px; height: 20px; background: radial-gradient(circle, red, #ff3333); border-radius: 50%; z-index: 3;"></div>
    <div id="vibrateButton" style="font-size: 48px; padding: 10px; background-color: transparent; color: #3b82f6; border: none; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; transition: color 0.2s, transform: 0.2s; position: absolute; top: 30px; left: 0; cursor: pointer; touch-action: none; z-index: 3;">💙</div>
    <div class="red-dot" style="width: 20px; height: 20px; radial-gradient(circle, red, #ff3333); border-radius: 50%; z-index: 3;"></div>
    <div class="pulse-symbol left" style="position: absolute; top: -30px; left: 10px; font-size: 20px; color: #ff3333; z-index: 4;">〰️</div>
    <div class="pulse-symbol right" style="position: absolute; top: -30px; right: 10px; font-size: 20px; color: #ff3333; z-index: 4;">〰️</div>
    <div class="glint left" style="position: absolute; left: 8px; top: 20px; width: 15px; height: 60px; background: radial-gradient(ellipse, rgba(255, 255, 255, 0.4), transparent); border-radius: 50%; transform: skewX(-10deg); z-index: 2;"></div>
    <div class="glint right" style="position: absolute; right: 8px; top: 20px; width: 15px; height: 60px; background: radial-gradient(ellipse, rgba(255, 255, 255, 0.4), transparent); border-radius: 50%; transform: skewX(10deg); z-index: 2;"></div>
    <div id="distortionLayer" style="position: absolute; top: 0; width: 60px; height: 120px; background-color: #1e1b4b; border-radius: 60px; z-index: 1;"></div>
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
      0% { background-color: #1e1b4b; }
      20% { background-color: #ff0000; }
      100% { background-color: #1e1b4b; }
    }
    @keyframes particle {
      0% { opacity: 1; transform: translate(0, 0) scale(1); }
      100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.5); }
    }
    @keyframes pinch {
      0% { transform: scaleY(1); }
      50% { transform: scaleY(0.9); }
      100% { transform: scaleY(1); }
    }
    @keyframes localSqueeze {
      0% { transform: scaleY(1); }
      50% { transform: scaleY(0.85); }
      100% { transform: scaleY(1); }
    }
    .pulsing {
      animation: pulse 0.5s ease-in-out;
    }
    .bar-pulsing {
      animation: barPulse 0.4s ease-in-out infinite;
    }
    .flashing {
      animation: flash 0.3s ease-out;
    }
    .pinching {
      animation: pinch 0.3s ease-in-out;
    }
    .squeezing {
      animation: localSqueeze 0.4s ease-in-out infinite;
    }
    .particle {
      position: absolute;
      font-size: 20px;
      color: purple;
      pointer-events: none;
      animation: particle 1.5s ease-out forwards;
    }
    .toggled {
      background-color: white !important;
      color: #1e40af !important;
    }
    #sliderTrack::before, #sliderTrack::after {
      content: '';
      position: absolute;
      top: 0;
      width: 30px;
      height: 100%;
      z-index: 2;
    }
    #sliderTrack::before {
      left: 0;
      background: linear-gradient(to right, rgba(255, 51, 51, 0.5), transparent);
    }
    #sliderTrack::after {
      right: 0;
      background: linear-gradient(to left, rgba(255, 51, 51, 0.5), transparent);
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 22px;
      height: 22px;
      background: #93c5fd;
      border-radius: 50%;
      cursor: pointer;
      margin-top: -6px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
    }
    input[type="range"]::-moz-range-thumb {
      width: 22px;
      height: 22px;
      background: #93c5fd;
      border-radius: 50%;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
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
        flex-direction: row;
        justify-content: space-around;
        align-items: center;
        padding: 10px;
      }
      #room {
        width: 40px;
        height: 20px;
        margin: 0 10px;
      }
      #scoreDisplay {
        font-size: 14px;
      }
      #toggleContainer {
        flex-direction: column;
        gap: 10px;
        margin-bottom: 0;
        margin-right: 10px;
      }
      #intensityContainer {
        width: 40%;
        max-width: 100px;
      }
      #sliderTrack {
        width: 60%;
        max-width: 400px;
        margin-left: 20px;
      }
      .pulse-symbol.left {
        left: 5px;
      }
      .pulse-symbol.right {
        right: 5px;
      }
      .glint.left {
        left: 5px;
      }
      .glint.right {
        right: 5px;
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
    const distortionLayer = document.getElementById('distortionLayer');
    const pulseToggle = document.getElementById('pulseToggle');
    const waveToggle = document.getElementById('waveToggle');
    const scoreElement = document.getElementById('score');
    let isDragging = false;
    let startX = 0;
    let lastPosition = 0;
    let lastCollision = null;

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
      const particleCount = 5;
      const trackRect = sliderTrack.getBoundingClientRect();
      const bodyRect = document.body.getBoundingClientRect();
      const bodyX = x + trackRect.left - bodyRect.left;
      const bodyY = y + trackRect.top - bodyRect.top;
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = '💜';
        particle.style.left = bodyX + 'px';
        particle.style.top = bodyY + 'px';
        const angle = Math.random() * 2 * Math.PI;
        const distance = 50 + Math.random() * 100;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1500);
      }
      setTimeout(() => { if (lastCollision === side) lastCollision = null; }, 200);
    }

    vibrateButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      startX = e.clientX - vibrateButton.offsetLeft;
      const room = document.getElementById('room').value;
      if (room) {
        vibrateButton.style.backgroundColor = '#1e40af';
        vibrateButton.classList.add('pulsing');
        distortionLayer.classList.add('squeezing');
        const intensity = parseInt(intensitySlider.value);
        ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: intensity, mode: vibrationMode }));
        sliderTrack.classList.add('pulsing', 'flashing');
        setTimeout(() => sliderTrack.classList.remove('pulsing', 'flashing'), 500);
      }
      lastPosition = vibrateButton.offsetLeft;
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        const trackRect = sliderTrack.getBoundingClientRect();
        let newX = e.clientX - startX - trackRect.left;
        let newY = e.clientY - trackRect.top - (vibrateButton.offsetHeight / 2) + 30;
        if (newX < 0) newX = 0;
        if (newX > trackRect.width - vibrateButton.offsetWidth) newX = trackRect.width - vibrateButton.offsetWidth;
        if (newY < 0) newY = 0;
        if (newY > trackRect.height - vibrateButton.offsetHeight) newY = trackRect.height - vibrateButton.offsetHeight;
        vibrateButton.style.left = newX + 'px';
        vibrateButton.style.top = newY + 'px';
        distortionLayer.style.left = newX + 'px';

        const room = document.getElementById('room').value;
        const currentPosition = vibrateButton.offsetLeft;
        const maxPosition = trackRect.width - vibrateButton.offsetWidth;
        if (room) {
          if (currentPosition <= 0 || currentPosition >= maxPosition) {
            const intensity = parseInt(intensitySlider.value);
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: intensity, mode: vibrationMode }));
            sliderTrack.classList.add('bar-pulsing', 'flashing', 'pinching');
            createParticle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2, currentPosition <= 0 ? 'left' : 'right');
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
          distortionLayer.classList.remove('squeezing');
          sliderTrack.classList.remove('bar-pulsing', 'flashing', 'pinching');
        }
        isDragging = false;
        lastCollision = null;
      }
    });

    vibrateButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDragging = true;
      startX = e.touches[0].clientX - vibrateButton.offsetLeft;
      const room = document.getElementById('room').value;
      if (room) {
        vibrateButton.style.backgroundColor = '#1e40af';
        vibrateButton.classList.add('pulsing');
        distortionLayer.classList.add('squeezing');
        const intensity = parseInt(intensitySlider.value);
        ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: intensity, mode: vibrationMode }));
        sliderTrack.classList.add('pulsing', 'flashing');
        setTimeout(() => sliderTrack.classList.remove('pulsing', 'flashing'), 500);
      }
      lastPosition = vibrateButton.offsetLeft;
    });

    document.addEventListener('touchmove', (e) => {
      if (isDragging) {
        e.preventDefault();
        const trackRect = sliderTrack.getBoundingClientRect();
        let newX = e.touches[0].clientX - startX - trackRect.left;
        let newY = e.touches[0].clientY - trackRect.top - (vibrateButton.offsetHeight / 2) + 30;
        if (newX < 0) newX = 0;
        if (newX > trackRect.width - vibrateButton.offsetWidth) newX = trackRect.width - vibrateButton.offsetWidth;
        if (newY < 0) newY = 0;
        if (newY > trackRect.height - vibrateButton.offsetHeight) newY = trackRect.height - vibrateButton.offsetHeight;
        vibrateButton.style.left = newX + 'px';
        vibrateButton.style.top = newY + 'px';
        distortionLayer.style.left = newX + 'px';

        const room = document.getElementById('room').value;
        const currentPosition = vibrateButton.offsetLeft;
        const maxPosition = trackRect.width - vibrateButton.offsetWidth;
        if (room) {
          if (currentPosition <= 0 || currentPosition >= maxPosition) {
            const intensity = parseInt(intensitySlider.value);
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: intensity, mode: vibrationMode }));
            sliderTrack.classList.add('bar-pulsing', 'flashing', 'pinching');
            createParticle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2, currentPosition <= 0 ? 'left' : 'right');
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
          distortionLayer.classList.remove('squeezing');
          sliderTrack.classList.remove('bar-pulsing', 'flashing', 'pinching');
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

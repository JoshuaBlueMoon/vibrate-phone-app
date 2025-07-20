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
<body style="background: radial-gradient(circle at 20% 30%, rgba(26, 42, 68, 0.5) 20%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(46, 26, 71, 0.5) 25%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(26, 42, 68, 0.5) 20%, transparent 50%), radial-gradient(circle at 30% 70%, rgba(46, 26, 71, 0.5) 20%, transparent 50%), linear-gradient(to bottom, #1a2a44, #2e1a47); color: white; font-family: Arial; margin: 0; padding: 10px; height: 100vh; width: 100vw; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; max-width: 414px; margin: 0 auto;">
  <div id="topContainer" style="position: absolute; top: 10px; left: 10px;">
    <input id="room" type="text" placeholder="Code" style="width: 36px; height: 18px; font-size: 10px; padding: 4px; background-color: #2b4d9e; border: 2px solid #60a5fa; border-radius: 5px; color: white; text-align: center; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);">
  </div>
  <div id="scoreDisplay" style="position: absolute; top: 10px; left: 60px; font-size: 12px; color: #60a5fa; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);">Score: <span id="score">0</span></div>
  <div id="sliderTrack" style="width: 100px; height: 60%; max-height: 400px; background: linear-gradient(to bottom, #60a5fa 10%, #1e40af 50%, #60a5fa 90%); border-radius: 50px; position: relative; margin: 10px auto 20px auto; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: 10px 0; box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.5); border: 1px solid rgba(255, 255, 255, 0.2);">
    <div class="red-dot" style="width: 18px; height: 18px; background: radial-gradient(circle, red, #ff3333); border-radius: 50%; z-index: 3;"></div>
    <div id="vibrateButton" style="font-size: 40px; padding: 8px; background-color: transparent; color: #3b82f6; border: none; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; transition: color 0.2s, transform: 0.2s; position: absolute; top: 0; left: 24px; cursor: pointer; touch-action: none; z-index: 3;">💙</div>
    <div class="red-dot" style="width: 18px; height: 18px; background: radial-gradient(circle, red, #ff3333); border-radius: 50%; z-index: 3;"></div>
    <div class="pulse-symbol top" style="position: absolute; top: -22px; left: 50%; transform: translateX(-50%); font-size: 18px; color: #ff3333; z-index: 4;">〰️</div>
    <div class="pulse-symbol bottom" style="position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%); font-size: 18px; color: #ff3333; z-index: 4;">〰️</div>
    <div class="glint top" style="position: absolute; top: 8px; left: 50%; width: 60px; height: 14px; background: radial-gradient(ellipse, rgba(255, 255, 255, 0.4), transparent); border-radius: 50%; transform: translateX(-50%) skewY(-10deg); z-index: 2;"></div>
    <div class="glint bottom" style="position: absolute; bottom: 8px; left: 50%; width: 60px; height: 14px; background: radial-gradient(ellipse, rgba(255, 255, 255, 0.4), transparent); border-radius: 50%; transform: translateX(-50%) skewY(10deg); z-index: 2;"></div>
    <div id="distortionLayer" style="position: absolute; left: 0; width: 100px; height: 52px; background-color: #1e40af; border-radius: 50px; z-index: 1; opacity: 0.3;"></div>
  </div>
  <div id="bottomControls" style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
    <div id="toggleContainer" style="display: flex; justify-content: center; gap: 10px; margin: 5px;">
      <div id="pulseToggle" class="toggle-button toggled" style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; cursor: pointer; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3); border: none;">💓</div>
      <div id="waveToggle" class="toggle-button" style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; cursor: pointer; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3); border: none;">〰️</div>
    </div>
    <div id="intensityContainer" style="width: 80%; max-width: 400px; padding: 6px; background: linear-gradient(to right, #1e40af, #3b82f6); border-radius: 15px; margin: 5px auto; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);">
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
      0% { background-color: #1e40af; }
      20% { background-color: #ff0000; }
      100% { background-color: #1e40af; }
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
    @keyframes localSqueeze {
      0% { transform: scaleX(1); }
      50% { transform: scaleX(0.85); }
      100% { transform: scaleX(1); }
    }
    @keyframes redPulse {
      0% { background: linear-gradient(to bottom, #60a5fa 10%, #1e40af 50%, #60a5fa 90%); }
      50% { background: linear-gradient(to bottom, #ff6666 10%, #ff3333 50%, #ff6666 90%); }
      100% { background: linear-gradient(to bottom, #60a5fa 10%, #1e40af 50%, #60a5fa 90%); }
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
    .red-pulsing {
      animation: redPulse 2s ease-in-out infinite;
    }
    .particle {
      position: absolute;
      font-size: 16px;
      color: purple;
      pointer-events: none;
      animation: particle 1.5s ease-out forwards;
    }
    .toggle-button {
      background-color: #2b4d9e;
      color: white;
    }
    .toggle-button.toggled {
      background-color: white !important;
      color: #1e40af !important;
    }
    #sliderTrack::before, #sliderTrack::after {
      content: '';
      position: absolute;
      left: 0;
      width: 100%;
      height: 24px;
      z-index: 2;
    }
    #sliderTrack::before {
      top: 0;
      background: linear-gradient(to bottom, rgba(255, 51, 51, 0.5), transparent);
    }
    #sliderTrack::after {
      bottom: 0;
      background: linear-gradient(to top, rgba(255, 51, 51, 0.5), transparent);
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
      }
      #topContainer {
        top: 5px;
        left: 5px;
      }
      #scoreDisplay {
        font-size: 10px;
        top: 5px;
        left: 50px;
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
        margin-top: 15px;
      }
      #toggleContainer {
        flex-direction: row;
        gap: 8px;
        margin: 5px;
      }
      #intensityContainer {
        width: 80%;
        max-width: 360px;
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
      .glint.top {
        top: 6px;
        width: 50px;
        height: 12px;
      }
      .glint.bottom {
        bottom: 6px;
        width: 50px;
        height: 12px;
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
    let startY = 0;
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
      if (score >= 60) {
        sliderTrack.classList.add('red-pulsing');
      }
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
        const distance = 30 + Math.random() * 70;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        document.body.appendChild(particle);
        setTimeout(() => { particle.remove(); }, 1500);
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
        distortionLayer.classList.add('squeezing');
        const intensity = parseInt(intensitySlider.value);
        ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: intensity, mode: vibrationMode }));
        sliderTrack.classList.add('pulsing', 'flashing');
        setTimeout(() => sliderTrack.classList.remove('pulsing', 'flashing'), 500);
      }
      lastPosition = vibrateButton.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        const trackRect = sliderTrack.getBoundingClientRect();
        let newY = e.clientY - trackRect.top - (vibrateButton.offsetHeight / 2);
        if (newY < 0) newY = 0;
        if (newY > trackRect.height - vibrateButton.offsetHeight) newY = trackRect.height - vibrateButton.offsetHeight;
        vibrateButton.style.left = '24px';
        vibrateButton.style.top = newY + 'px';
        distortionLayer.style.top = newY + 'px';

        const room = document.getElementById('room').value;
        const currentPosition = vibrateButton.offsetTop;
        const maxPosition = trackRect.height - vibrateButton.offsetHeight;
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
      const trackRect = sliderTrack.getBoundingClientRect();
      startY = e.touches[0].clientY - trackRect.top - (vibrateButton.offsetHeight / 2);
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
      lastPosition = vibrateButton.offsetTop;
    });

    document.addEventListener('touchmove', (e) => {
      if (isDragging) {
        e.preventDefault();
        const trackRect = sliderTrack.getBoundingClientRect();
        let newY = e.touches[0].clientY - trackRect.top - (vibrateButton.offsetHeight / 2);
        if (newY < 0) newY = 0;
        if (newY > trackRect.height - vibrateButton.offsetHeight) newY = trackRect.height - vibrateButton.offsetHeight;
        vibrateButton.style.left = '24px';
        vibrateButton.style.top = newY + 'px';
        distortionLayer.style.top = newY + 'px';

        const room = document.getElementById('room').value;
        const currentPosition = vibrateButton.offsetTop;
        const maxPosition = trackRect.height - vibrateButton.offsetHeight;
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

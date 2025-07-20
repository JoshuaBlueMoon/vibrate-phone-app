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
<body style="background: linear-gradient(to bottom, #1a2a44, #3b82f6); color: white; font-family: Arial; margin: 0; padding: 20px; height: 100vh; width: 100vw; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; max-width: 414px; margin: 0 auto;">
  <input id="room" type="text" placeholder="Code" style="width: 40px; height: 20px; font-size: 12px; padding: 4px; margin: 10px; background-color: #2b4d9e; border: 2px solid #60a5fa; border-radius: 5px; color: white; text-align: center; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);">
  <br>
  <div id="intensityContainer" style="width: 80%; max-width: 250px; padding: 4px; background: linear-gradient(to right, #60a5fa, #a855f7); border-radius: 20px; margin: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);">
    <input type="range" id="intensity" min="1" max="5" value="3" style="width: 100%; background: transparent; accent-color: #93c5fd;">
  </div>
  <label for="intensity"><span id="intensityValue" style="color: #60a5fa;">3</span></label>
  <br>
  <div id="scoreDisplay" style="font-size: 16px; color: #60a5fa; margin: 10px;">Score: 0</div>
  <div id="sliderTrack" style="width: 80%; max-width: 600px; height: 120px; background-color: #1e1b4b; border-radius: 60px; position: relative; margin-top: 10px; overflow: hidden; display: flex; justify-content: space-between; align-items: center; padding: 0 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);">
    <div class="red-dot" style="width: 20px; height: 20px; background: radial-gradient(circle, red, #ff3333); border-radius: 50%; z-index: 2;"></div>
    <div id="vibrateButton" style="font-size: 48px; padding: 10px; background-color: transparent; color: #3b82f6; border: none; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; transition: color 0.2s, transform: 0.2s; position: absolute; top: 30px; left: 0; cursor: pointer; touch-action: none; z-index: 2;">💙</div>
    <div class="red-dot" style="width: 20px; height: 20px; background: radial-gradient(circle, red, #ff3333); border-radius: 50%; z-index: 2;"></div>
    <div class="pulse-symbol left" style="position: absolute; top: -30px; left: 10px; font-size: 20px; color: #ff3333; z-index: 3;">〰️</div>
    <div class="pulse-symbol right" style="position: absolute; top: -30px; right: 10px; font-size: 20px; color: #ff3333; z-index: 3;">〰️</div>
    <div class="glint left" style="position: absolute; left: 8px; top: 20px; width: 15px; height: 60px; background: radial-gradient(ellipse, rgba(255, 255, 255, 0.4), transparent); border-radius: 50%; transform: skewX(-10deg); z-index: 1;"></div>
    <div class="glint right" style="position: absolute; right: 8px; top: 20px; width: 15px; height: 60px; background: radial-gradient(ellipse, rgba(255, 255, 255, 0.4), transparent); border-radius: 50%; transform: skewX(10deg); z-index: 1;"></div>
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
    @keyframes redPulse {
      0% { background-color: #1e1b4b; }
      50% { background-color: #ff3333; }
      100% { background-color: #1e1b4b; }
    }
    @keyframes fastRedPulse {
      0% { background-color: #1e1b4b; }
      50% { background-color: #ff3333; }
      100% { background-color: #1e1b4b; }
    }
    @keyframes wiggle {
      0% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
      100% { transform: translateX(0); }
    }
    @keyframes droplet {
      0% { opacity: 1; transform: translate(0, 0) scale(1); }
      100% { opacity: 0; transform: translate(0, 100px) scale(0.5); }
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
    .red-pulsing {
      animation: redPulse 2s ease-in-out infinite;
    }
    .fast-red-pulsing {
      animation: fastRedPulse 1s ease-in-out infinite;
    }
    .wiggling {
      animation: wiggle 0.5s ease-in-out infinite;
    }
    .particle {
      position: absolute;
      font-size: 20px;
      color: purple;
      pointer-events: none;
      animation: particle 1.5s ease-out forwards;
    }
    .droplet {
      position: absolute;
      font-size: 14px;
      color: #60a5fa;
      pointer-events: none;
      animation: droplet 1s ease-out forwards;
    }
    #sliderTrack::before, #sliderTrack::after {
      content: '';
      position: absolute;
      top: 0;
      width: 30px;
      height: 100%;
      z-index: 1;
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
      width: 18px;
      height: 18px;
      background: #93c5fd;
      border-radius: 50%;
      cursor: pointer;
      margin-top: -5px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
    }
    input[type="range"]::-moz-range-thumb {
      width: 18px;
      height: 18px;
      background: #93c5fd;
      border-radius: 50%;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
    }
    input[type="range"]::-webkit-slider-runnable-track {
      background: #1e3a8a;
      height: 6px;
      border-radius: 3px;
    }
    input[type="range"]::-moz-range-track {
      background: #1e3a8a;
      height: 6px;
      border-radius: 3px;
    }
    @media (orientation: landscape) {
      body {
        flex-direction: row;
        justify-content: space-around;
        align-items: center;
        padding: 10px;
      }
      #room, #intensityContainer {
        width: 40%;
        max-width: 150px;
      }
      #room {
        width: 40px;
        height: 20px;
      }
      label {
        margin-left: 10px;
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
    const intensityDisplay = document.getElementById('intensityValue');
    const intensitySlider = document.getElementById('intensity');
    const sliderTrack = document.getElementById('sliderTrack');
    const vibrateButton = document.getElementById('vibrateButton');
    const scoreDisplay = document.getElementById('scoreDisplay');
    let isDragging = false;
    let startX = 0;
    let lastPosition = 0;
    let lastCollision = null;
    let score = 0;

    intensitySlider.oninput = () => {
      intensityDisplay.textContent = intensitySlider.value;
    };

    ws.onopen = () => console.log('Connected to server');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.room === document.getElementById('room').value) {
        if (data.command === 'startVibrate' && navigator.vibrate) {
          const intensity = data.intensity || 3;
          let pattern;
          switch (intensity) {
            case 1: pattern = [50, 200]; break;
            case 2: pattern = [50, 100]; break;
            case 3: pattern = [50, 50]; break;
            case 4: pattern = [100, 50]; break;
            case 5: pattern = [200]; break;
            default: pattern = [50, 50];
          }
          navigator.vibrate(pattern);
          console.log('Vibrate started with intensity:', intensity);
          sliderTrack.classList.add('pulsing', 'flashing');
          setTimeout(() => sliderTrack.classList.remove('pulsing', 'flashing'), 500);
        }
      }
    };

    function createParticle(x, y, side) {
      if (lastCollision === side) return;
      lastCollision = side;
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

    function createDroplet(x, y) {
      const droplet = document.createElement('div');
      droplet.className = 'droplet';
      droplet.textContent = '💧';
      const trackRect = sliderTrack.getBoundingClientRect();
      const bodyRect = document.body.getBoundingClientRect();
      const bodyX = x + trackRect.left - bodyRect.left;
      const bodyY = y + trackRect.top - bodyRect.top;
      droplet.style.left = bodyX + 'px';
      droplet.style.top = bodyY + 'px';
      document.body.appendChild(droplet);
      setTimeout(() => droplet.remove(), 1000);
    }

    function updateScoreEffects() {
      sliderTrack.classList.remove('red-pulsing', 'fast-red-pulsing', 'wiggling');
      if (score >= 90) {
        sliderTrack.classList.add('fast-red-pulsing', 'wiggling');
      } else if (score >= 60) {
        sliderTrack.classList.add('fast-red-pulsing');
      } else if (score >= 30) {
        sliderTrack.classList.add('red-pulsing');
      }
    }

    setInterval(() => {
      if (score > 0) {
        score = Math.max(0, score - 2);
        scoreDisplay.textContent = `Score: ${score}`;
        updateScoreEffects();
      }
    }, 1000);

    vibrateButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      startX = e.clientX - vibrateButton.offsetLeft;
      const room = document.getElementById('room').value;
      if (room) {
        vibrateButton.style.backgroundColor = '#1e40af';
        vibrateButton.classList.add('pulsing');
        const intensity = intensitySlider.value;
        ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
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

        const room = document.getElementById('room').value;
        const currentPosition = vibrateButton.offsetLeft;
        const maxPosition = trackRect.width - vibrateButton.offsetWidth;
        if (room) {
          if (currentPosition <= 0 && lastPosition > 0) {
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            updateScoreEffects();
            const intensity = intensitySlider.value;
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
            sliderTrack.classList.add('bar-pulsing', 'flashing', 'pinching');
            createParticle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2, 'left');
            if (score >= 90) {
              createDroplet(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2);
            }
          } else if (currentPosition >= maxPosition && lastPosition < maxPosition) {
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            updateScoreEffects();
            const intensity = intensitySlider.value;
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
            sliderTrack.classList.add('bar-pulsing', 'flashing', 'pinching');
            createParticle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2, 'right');
            if (score >= 90) {
              createDroplet(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2);
            }
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
        const intensity = intensitySlider.value;
        ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
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

        const room = document.getElementById('room').value;
        const currentPosition = vibrateButton.offsetLeft;
        const maxPosition = trackRect.width - vibrateButton.offsetWidth;
        if (room) {
          if (currentPosition <= 0 && lastPosition > 0) {
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            updateScoreEffects();
            const intensity = intensitySlider.value;
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
            sliderTrack.classList.add('bar-pulsing', 'flashing', 'pinching');
            createParticle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2, 'left');
            if (score >= 90) {
              createDroplet(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2);
            }
          } else if (currentPosition >= maxPosition && lastPosition < maxPosition) {
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            updateScoreEffects();
            const intensity = intensitySlider.value;
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
            sliderTrack.classList.add('bar-pulsing', 'flashing', 'pinching');
            createParticle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2, 'right');
            if (score >= 90) {
              createDroplet(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2);
            }
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

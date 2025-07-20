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
<body style="background: linear-gradient(to bottom, #1a2a44, #000000); color: white; font-family: Arial; margin: 0; padding: 20px; height: 100vh; width: 100vw; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; max-width: 414px; margin: 0 auto;">
  <h1 style="font-size: 24px;">Pulse</h1>
  <input id="room" type="text" placeholder="Enter room code (e.g., secret123)" style="font-size: 18px; padding: 10px; margin: 10px; background-color: #2b4d9e; border: none; border-radius: 5px; color: white; width: 80%;">
  <br>
  <input type="range" id="intensity" min="1" max="5" value="3" style="width: 80%; margin: 10px; accent-color: #60a5fa;">
  <label for="intensity">Intensity: <span id="intensityValue" style="color: #60a5fa;">3</span></label>
  <br>
  <div id="sliderTrack" style="width: 80%; max-width: 600px; height: 120px; background-color: #4b5e97; border-radius: 10px; position: relative; margin-top: 20px; overflow: hidden; display: flex; justify-content: space-between; align-items: center; padding: 0 10px;">
    <div class="red-dot" style="width: 20px; height: 20px; background: radial-gradient(circle, red, #ff3333); border-radius: 50%;"></div>
    <div id="vibrateButton" style="font-size: 48px; padding: 10px; background-color: transparent; color: #3b82f6; border: none; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; transition: color 0.2s, transform 0.2s; position: absolute; top: 30px; left: 0; cursor: pointer; touch-action: none;">💙</div>
    <div class="red-dot" style="width: 20px; height: 20px; background: radial-gradient(circle, red, #ff3333); border-radius: 50%;"></div>
  </div>
  <p style="font-size: 14px;">Drag the heart to the red dots back and forth to vibrate continuously. Release to stop. Adjust intensity.</p>
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
      0% { background-color: #4b5e97; }
      20% { background-color: #ff0000; }
      100% { background-color: #4b5e97; }
    }
    @keyframes particle {
      0% { opacity: 1; transform: translate(0, 0) scale(1); }
      100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.5); }
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
    .particle {
      position: absolute;
      font-size: 20px;
      color: purple;
      pointer-events: none;
      animation: particle 1.5s ease-out forwards;
    }
    @media (orientation: landscape) {
      body {
        flex-direction: row;
        justify-content: space-around;
        align-items: center;
        padding: 10px;
      }
      h1 {
        font-size: 20px;
        margin: 0 10px;
      }
      #room, #intensity {
        width: 40%;
        max-width: 150px;
      }
      label {
        margin-left: 10px;
      }
      #sliderTrack {
        width: 60%;
        max-width: 400px;
        margin-left: 20px;
      }
      p {
        max-width: 150px;
        margin-left: 20px;
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
    let isDragging = false;
    let startX = 0;
    let lastPosition = 0;
    let lastCollision = null;

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
      // Convert sliderTrack coordinates to body coordinates
      const bodyX = x + trackRect.left - bodyRect.left;
      const bodyY = y + trackRect.top - bodyRect.top;
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = '💜';
        particle.style.left = bodyX + 'px';
        particle.style.top = bodyY + 'px';
        // Random trajectory for screen-wide movement
        const angle = Math.random() * 2 * Math.PI;
        const distance = 50 + Math.random() * 100; // Larger range: 50-150px
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1500); // Match animation duration
      }
      setTimeout(() => { if (lastCollision === side) lastCollision = null; }, 200);
    }

    // Drag handling
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
          if (currentPosition <= 0) {
            const intensity = intensitySlider.value;
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
            sliderTrack.classList.add('bar-pulsing', 'flashing');
            createParticle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2, 'left');
          } else if (currentPosition >= maxPosition) {
            const intensity = intensitySlider.value;
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
            sliderTrack.classList.add('bar-pulsing', 'flashing');
            createParticle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2, 'right');
          } else {
            ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
            sliderTrack.classList.remove('bar-pulsing', 'flashing');
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
          sliderTrack.classList.remove('bar-pulsing', 'flashing');
        }
        isDragging = false;
        lastCollision = null;
      }
    });

    // For touch devices (phones)
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
          if (currentPosition <= 0) {
            const intensity = intensitySlider.value;
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
            sliderTrack.classList.add('bar-pulsing', 'flashing');
            createParticle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2, 'left');
          } else if (currentPosition >= maxPosition) {
            const intensity = intensitySlider.value;
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
            sliderTrack.classList.add('bar-pulsing', 'flashing');
            createParticle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2, 'right');
          } else {
            ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
            sliderTrack.classList.remove('bar-pulsing', 'flashing');
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
          sliderTrack.classList.remove('bar-pulsing', 'flashing');
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

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
        <div class="red-circle" style="width: 20px; height: 20px; background: radial-gradient(circle, red, #ff3333); border-radius: 50%;"></div>
        <div id="vibrateButton" style="font-size: 48px; padding: 10px; background-color: transparent; color: #3b82f6; border: none; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; transition: color 0.2s, transform 0.2s; position: absolute; top: 30px; left: 0; cursor: pointer; touch-action: none;">💙</div>
        <div class="red-circle" style="width: 20px; height: 20px; background: radial-gradient(circle, red, #ff3333); border-radius: 50%;"></div>
      </div>
      <canvas id="particleCanvas" style="position: absolute; top: 0; left: 0; pointer-events: none;"></canvas>
      <p style="font-size: 14px;">Drag the heart to the red dots back and forth to vibrate continuously. Release to stop. Adjust intensity.</p>
      <style>
        @keyframes intensePulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes flash {
          0% { background-color: #4b5e97; }
          20% { background-color: #ff0000; }
          100% { background-color: #4b5e97; }
        }
        .intense-pulsing {
          animation: intensePulse 0.3s ease-in-out infinite;
        }
        .flashing {
          animation: flash 0.3s ease-out;
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
        const redCircles = document.getElementsByClassName('red-circle');
        const canvas = document.getElementById('particleCanvas');
        const ctx = canvas.getContext('2d');
        let isDragging = false;
        let startX = 0;
        let lastPosition = 0;
        let particles = [];

        // Set up canvas
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Particle class for purple hearts
        class Particle {
          constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = 20;
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4;
            this.life = 1;
            this.decay = 0.02;
          }

          update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= this.decay;
          }

          draw() {
            ctx.font = \`\${this.size}px Arial\`;
            ctx.fillStyle = \`rgba(128, 0, 128, \${this.life})\`;
            ctx.fillText('💜', this.x, this.y);
          }
        }

        // Animation loop for particles
        function animateParticles() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          particles = particles.filter(p => p.life > 0);
          particles.forEach(p => {
            p.update();
            p.draw();
          });
          requestAnimationFrame(animateParticles);
        }
        animateParticles();

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
              sliderTrack.classList.add('intense-pulsing', 'flashing');
              setTimeout(() => sliderTrack.classList.remove('intense-pulsing', 'flashing'), 500);
            }
          }
        };

        function checkRedCircleCollision() {
          const trackRect = sliderTrack.getBoundingClientRect();
          const buttonRect = vibrateButton.getBoundingClientRect();
          let collision = false;
          Array.from(redCircles).forEach(circle => {
            const circleRect = circle.getBoundingClientRect();
            const distanceX = (buttonRect.left + buttonRect.width / 2) - (circleRect.left + circleRect.width / 2);
            if (Math.abs(distanceX) < (buttonRect.width / 2 + circleRect.width / 2)) {
              collision = true;
              // Add particles at circle position
              for (let i = 0; i < 3; i++) {
                particles.push(new Particle(circleRect.left + circleRect.width / 2, circleRect.top + circleRect.height / 2));
              }
            }
          });
          return collision;
        }

        // Drag handling
        vibrateButton.addEventListener('mousedown', (e) => {
          e.preventDefault();
          isDragging = true;
          startX = e.clientX - vibrateButton.offsetLeft;
          const room = document.getElementById('room').value;
          if (room) {
            vibrateButton.style.backgroundColor = '#1e40af';
            vibrateButton.classList.add('intense-pulsing');
            const intensity = intensitySlider.value;
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
            if (checkRedCircleCollision()) {
              sliderTrack.classList.add('intense-pulsing', 'flashing');
            }
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
              if (checkRedCircleCollision()) {
                const intensity = intensitySlider.value;
                ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
                sliderTrack.classList.add('intense-pulsing', 'flashing');
              } else {
                ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
                sliderTrack.classList.remove('intense-pulsing', 'flashing');
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
              vibrateButton.classList.remove('intense-pulsing');
              sliderTrack.classList.remove('intense-pulsing', 'flashing');
            }
            isDragging = false;
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
            vibrateButton.classList.add('intense-pulsing');
            const intensity = intensitySlider.value;
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
            if (checkRedCircleCollision()) {
              sliderTrack.classList.add('intense-pulsing', 'flashing');
            }
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
            const currentPosition = vibrateButton.offsetLeft отвеч

System: const maxPosition = trackRect.width - vibrateButton.offsetWidth;
            if (room) {
              if (checkRedCircleCollision()) {
                const intensity = intensitySlider.value;
                ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
                sliderTrack.classList.add('intense-pulsing', 'flashing');
              } else {
                ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
                sliderTrack.classList.remove('intense-pulsing', 'flashing');
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
              vibrateButton.classList.remove('intense-pulsing');
              sliderTrack.classList.remove('intense-pulsing', 'flashing');
            }
            isDragging = false;
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

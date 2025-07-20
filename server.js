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
      <h1 style="font-size: 24px;">Vibrate My Friend's Phone</h1>
      <input id="room" type="text" placeholder="Enter room code (e.g., secret123)" style="font-size: 18px; padding: 10px; margin: 10px; background-color: #2b4d9e; border: none; border-radius: 5px; color: white; width: 80%;">
      <br>
      <input type="range" id="intensity" min="1" max="5" value="3" style="width: 80%; margin: 10px; accent-color: #60a5fa;">
      <label for="intensity">Intensity: <span id="intensityValue" style="color: #60a5fa;">3</span></label>
      <br>
      <div id="sliderTrack" style="width: 80%; max-width: 600px; height: 120px; background-color: #4b5e97; border-radius: 10px; position: relative; margin-top: 20px; overflow: hidden; display: flex; justify-content: space-between; align-items: center; padding: 0 10px;">
        <div style="width: 20px; height: 20px; background: radial-gradient(circle, red, #ff3333); border-radius: 50%;"></div>
        <div id="vibrateButton" style="font-size: 48px; padding: 10px; background-color: transparent; color: #3b82f6; border: none; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; transition: color 0.2s, transform 0.2s; position: absolute; top: 30px; left: 0; cursor: pointer; touch-action: none;">💙</div>
        <div style="width: 20px; height: 20px; background: radial-gradient(circle, red, #ff3333); border-radius: 50%;"></div>
      </div>
      <p style="font-size: 14px;">Drag the heart to the red dots back and forth to vibrate continuously. Release to stop. Adjust intensity.</p>
      <canvas id="particleCanvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></canvas>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .pulsing {
          animation: pulse 0.5s ease-in-out;
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
        const canvas = document.getElementById('particleCanvas');
        const ctx = canvas.getContext('2d');
        let particles = [];
        let isDragging = false;
        let startX = 0;
        let lastPosition = 0;

        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        window.addEventListener('resize', () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        });

        // Particle class (improved heart shape, no fade)
        class Particle {
          constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 60 + 50; // 50-110px
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * -3 - 1; // Faster upward
            this.color = '#a855f7'; // Bright purple
          }
          update() {
            this.y += this.speedY;
            this.x += this.speedX;
          }
          draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.size / 4);
            ctx.quadraticCurveTo(this.x + this.size / 4, this.y - this.size / 4, this.x, this.y - this.size / 2);
            ctx.quadraticCurveTo(this.x - this.size / 4, this.y - this.size / 4, this.x - this.size / 2, this.y);
            ctx.quadraticCurveTo(this.x - this.size / 4, this.y + this.size / 4, this.x, this.y + this.size / 2);
            ctx.quadraticCurveTo(this.x + this.size / 4, this.y + this.size / 4, this.x + this.size / 2, this.y);
            ctx.closePath();
            ctx.fill();
          }
        }

        // Animation loop
        function animateParticles() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].y + particles[i].size < 0) particles.splice(i, 1); // Remove when off-screen
          }
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
                case 1: pattern = [50, 200]; break; // 50ms on, 200ms off
                case 2: pattern = [50, 100]; break; // 50ms on, 100ms off
                case 3: pattern = [50, 50]; break;  // 50ms on, 50ms off
                case 4: pattern = [100, 50]; break; // 100ms on, 50ms off
                case 5: pattern = [200]; break;     // 200ms on, no off
                default: pattern = [50, 50];
              }
              navigator.vibrate(pattern);
              console.log('Vibrate started with intensity:', intensity);
            }
          }
        };

        // Drag handling
        vibrateButton.addEventListener('mousedown', (e) => {
          e.preventDefault();
          isDragging = true;
          startX = e.clientX - vibrateButton.offsetLeft;
          const room = document.getElementById('room').value;
          if (room) {
            vibrateButton.style.backgroundColor = '#1e40af';
            vibrateButton.classList.add('pulsing');
            for (let i = 0; i < 5; i++) {
              particles.push(new Particle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2));
            }
          }
          lastPosition = vibrateButton.offsetLeft;
        });

        document.addEventListener('mousemove', (e) => {
          if (isDragging) {
            e.preventDefault();
            const trackRect = sliderTrack.getBoundingClientRect();
            let newX = e.clientX - startX - trackRect.left;
            let newY = e.clientY - trackRect.top - (vibrateButton.offsetHeight / 2) + 30; // Adjust for padding
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
              if (currentPosition <= 0 || currentPosition >= maxPosition) {
                const intensity = intensitySlider.value;
                ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
                for (let i = 0; i < 5; i++) {
                  particles.push(new Particle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2));
                }
              } else {
                ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
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
            vibrateButton.classList.add('pulsing');
            for (let i = 0; i < 5; i++) {
              particles.push(new Particle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2));
            }
          }
          lastPosition = vibrateButton.offsetLeft;
        });

        document.addEventListener('touchmove', (e) => {
          if (isDragging) {
            e.preventDefault();
            const trackRect = sliderTrack.getBoundingClientRect();
            let newX = e.touches[0].clientX - startX - trackRect.left;
            let newY = e.touches[0].clientY - trackRect.top - (vibrateButton.offsetHeight / 2) + 30; // Adjust for padding
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
              if (currentPosition <= 0 || currentPosition >= maxPosition) {
                const intensity = intensitySlider.value;
                ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
                for (let i = 0; i < 5; i++) {
                  particles.push(new Particle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2));
                }
              } else {
                ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
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

econst express = require('express');
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
    <body style="background-color: #1e3a8a; color: white; font-family: Arial; margin: 0; padding: 20px; min-height: 100vh; width: 100vw; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; max-width: 100%; margin: 0 auto;">
      <h1 style="font-size: 24px;">Vibrate My Friend's Phone</h1>
      <input id="room" type="text" placeholder="Enter room code (e.g., secret123)" style="font-size: 18px; padding: 10px; margin: 10px; background-color: #2b4d9e; border: none; border-radius: 5px; color: white; width: 80%; max-width: 300px;">
      <br>
      <input type="range" id="intensity" min="1" max="5" value="3" style="width: 80%; margin: 10px; accent-color: #60a5fa; max-width: 300px;">
      <label for="intensity">Intensity: <span id="intensityValue" style="color: #60a5fa;">3</span></label>
      <br>
      <div id="sliderTrack" style="width: 80%; max-width: 600px; height: 50px; background-color: #4b5e97; border-radius: 25px; position: relative; margin-top: 20px; overflow: hidden;">
        <div id="sliderButton" style="width: 60px; height: 60px; background-color: #3b82f6; border: none; border-radius: 50%; position: absolute; top: -5px; left: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background-color 0.2s, transform 0.2s; font-size: 36px;">💙</div>
      </div>
      <p style="font-size: 14px; text-align: center; max-width: 300px;">Hold and drag the heart back and forth to vibrate continuously. Release or stop moving to stop. Adjust intensity or drag speed.</p>
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
        const sliderButton = document.getElementById('sliderButton');
        const canvas = document.getElementById('particleCanvas');
        const ctx = canvas.getContext('2d');
        let particles = [];
        let isDragging = false;
        let lastX = null;
        let lastTime = null;
        let lastMoveTime = null;

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
            if (data.command === 'startVibrate' && navigator.vibrate && !isVibrating) {
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
              isVibrating = true;
            } else if (data.command === 'stopVibrate' && isVibrating) {
              navigator.vibrate(0);
              isVibrating = false;
            }
          }
        };

        // Drag handling
        let startX = 0;
        sliderButton.addEventListener('mousedown', (e) => {
          e.preventDefault();
          isDragging = true;
          startX = e.clientX - sliderButton.offsetLeft;
          const room = document.getElementById('room').value;
          const intensity = intensitySlider.value;
          if (room) {
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
            sliderButton.style.backgroundColor = '#1e40af';
            sliderButton.classList.add('pulsing');
            for (let i = 0; i < 5; i++) {
              particles.push(new Particle(sliderButton.offsetLeft + sliderButton.offsetWidth / 2, sliderButton.offsetTop + sliderButton.offsetHeight / 2));
            }
          }
          lastX = e.clientX;
          lastTime = performance.now();
          lastMoveTime = performance.now();
        });

        document.addEventListener('mousemove', (e) => {
          if (isDragging) {
            e.preventDefault();
            const trackRect = sliderTrack.getBoundingClientRect();
            let newX = e.clientX - startX - trackRect.left;
            if (newX < 0) newX = 0;
            if (newX > trackRect.width - sliderButton.offsetWidth) newX = trackRect.width - sliderButton.offsetWidth;
            sliderButton.style.left = newX + 'px';

            const currentX = e.clientX;
            const currentTime = performance.now();
            const distance = Math.abs(currentX - lastX);
            const timeDiff = (currentTime - lastTime) / 1000; // Convert to seconds
            const speed = distance / timeDiff; // Pixels per second
            let intensity = Math.min(5, Math.max(1, Math.floor(speed / 100))); // Scale speed to 1-5
            const room = document.getElementById('room').value;
            if (room) {
              if (!isVibrating) {
                ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: intensity }));
                sliderButton.style.backgroundColor = '#1e40af';
                sliderButton.classList.add('pulsing');
                for (let i = 0; i < 5; i++) {
                  particles.push(new Particle(sliderButton.offsetLeft + sliderButton.offsetWidth / 2, sliderButton.offsetTop + sliderButton.offsetHeight / 2));
                }
              } else {
                ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: intensity }));
              }
              lastMoveTime = currentTime; // Update last move time
            }
            lastX = currentX;
            lastTime = currentTime;

            // Stop vibration if no movement for 0.5 seconds
            if (lastMoveTime && currentTime - lastMoveTime > 500) {
              if (room && isVibrating) {
                ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
                sliderButton.style.backgroundColor = '#3b82f6';
                sliderButton.classList.remove('pulsing');
                isVibrating = false;
              }
            }
          }
        });

        document.addEventListener('mouseup', () => {
          if (isDragging) {
            const room = document.getElementById('room').value;
            if (room && isVibrating) {
              ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
              sliderButton.style.backgroundColor = '#3b82f6';
              sliderButton.classList.remove('pulsing');
            }
            isDragging = false;
            lastX = null;
            lastTime = null;
            lastMoveTime = null;
          }
        });

        // For touch devices (phones)
        sliderButton.addEventListener('touchstart', (e) => {
          e.preventDefault();
          isDragging = true;
          startX = e.touches[0].clientX - sliderButton.offsetLeft;
          const room = document.getElementById('room').value;
          const intensity = intensitySlider.value;
          if (room) {
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
            sliderButton.style.backgroundColor = '#1e40af';
            sliderButton.classList.add('pulsing');
            for (let i = 0; i < 5; i++) {
              particles.push(new Particle(sliderButton.offsetLeft + sliderButton.offsetWidth / 2, sliderButton.offsetTop + sliderButton.offsetHeight / 2));
            }
          }
          lastX = e.touches[0].clientX;
          lastTime = performance.now();
          lastMoveTime = performance.now();
        });

        document.addEventListener('touchmove', (e) => {
          if (isDragging) {
            e.preventDefault();
            const trackRect = sliderTrack.getBoundingClientRect();
            let newX = e.touches[0].clientX - startX - trackRect.left;
            if (newX < 0) newX = 0;
            if (newX > trackRect.width - sliderButton.offsetWidth) newX = trackRect.width - sliderButton.offsetWidth;
            sliderButton.style.left = newX + 'px';

            const currentX = e.touches[0].clientX;
            const currentTime = performance.now();
            const distance = Math.abs(currentX - lastX);
            const timeDiff = (currentTime - lastTime) / 1000; // Convert to seconds
            const speed = distance / timeDiff; // Pixels per second
            let intensity = Math.min(5, Math.max(1, Math.floor(speed / 100))); // Scale speed to 1-5
            const room = document.getElementById('room').value;
            if (room) {
              if (!isVibrating) {
                ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: intensity }));
                sliderButton.style.backgroundColor = '#1e40af';
                sliderButton.classList.add('pulsing');
                for (let i = 0; i < 5; i++) {
                  particles.push(new Particle(sliderButton.offsetLeft + sliderButton.offsetWidth / 2, sliderButton.offsetTop + sliderButton.offsetHeight / 2));
                }
              } else {
                ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: intensity }));
              }
              lastMoveTime = currentTime; // Update last move time
            }
            lastX = currentX;
            lastTime = currentTime;

            // Stop vibration if no movement for 0.5 seconds
            if (lastMoveTime && currentTime - lastMoveTime > 500) {
              if (room && isVibrating) {
                ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
                sliderButton.style.backgroundColor = '#3b82f6';
                sliderButton.classList.remove('pulsing');
                isVibrating = false;
              }
            }
          }
        });

        document.addEventListener('touchend', () => {
          if (isDragging) {
            const room = document.getElementById('room').value;
            if (room && isVibrating) {
              ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
              sliderButton.style.backgroundColor = '#3b82f6';
              sliderButton.classList.remove('pulsing');
            }
            isDragging = false;
            lastX = null;
            lastTime = null;
            lastMoveTime = null;
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

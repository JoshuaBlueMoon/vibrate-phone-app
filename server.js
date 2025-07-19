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
    <body style="background-color: #1e3a8a; color: white; font-family: Arial; margin: 0; padding: 20px; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
      <h1>Vibrate My Friend's Phone</h1>
      <input id="room" type="text" placeholder="Enter room code (e.g., secret123)" style="font-size: 18px; padding: 10px; margin: 10px; background-color: #2b4d9e; border: none; border-radius: 5px; color: white;">
      <br>
      <input type="range" id="intensity" min="1" max="5" value="3" style="width: 200px; margin: 10px; accent-color: #60a5fa;">
      <label for="intensity">Intensity: <span id="intensityValue" style="color: #60a5fa;">3</span></label>
      <br>
      <button id="vibrateButton" style="font-size: 72px; padding: 20px; background-color: #3b82f6; color: white; border: none; border-radius: 50%; width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s; position: relative; overflow: hidden;">💙</button>
      <p>Enter the same room code on both phones. Hold the button to vibrate, release to stop. Adjust intensity with the slider (1-5).</p>
      <canvas id="particleCanvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></canvas>
      <script>
        const ws = new WebSocket('wss://' + window.location.host);
        let isVibrating = false;
        const intensityDisplay = document.getElementById('intensityValue');
        const intensitySlider = document.getElementById('intensity');
        const vibrateButton = document.getElementById('vibrateButton');
        const canvas = document.getElementById('particleCanvas');
        const ctx = canvas.getContext('2d');
        let particles = [];

        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        window.addEventListener('resize', () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        });

        // Particle class
        class Particle {
          constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 20 + 10; // 10-30px
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * -2 - 1; // Move upward
            this.opacity = 1;
            this.color = '#a855f7'; // Purple heart
          }
          update() {
            this.y += this.speedY;
            this.x += this.speedX;
            this.opacity -= 0.02;
          }
          draw() {
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.size / 2, this.y + this.size / 4);
            ctx.lineTo(this.x + this.size, this.y);
            ctx.lineTo(this.x + this.size / 2, this.y + this.size / 2);
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
            if (particles[i].opacity <= 0) particles.splice(i, 1);
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

        vibrateButton.onmousedown = () => {
          const room = document.getElementById('room').value;
          const intensity = intensitySlider.value;
          if (room) {
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
            vibrateButton.style.backgroundColor = '#1e40af'; // Darker blue when pressed
            // Create particles
            for (let i = 0; i < 5; i++) {
              particles.push(new Particle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2));
            }
          }
        };
        vibrateButton.onmouseup = () => {
          const room = document.getElementById('room').value;
          if (room) {
            ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
            vibrateButton.style.backgroundColor = '#3b82f6'; // Back to original blue
          }
        };

        // For touch devices (phones)
        vibrateButton.ontouchstart = (e) => {
          e.preventDefault();
          const room = document.getElementById('room').value;
          const intensity = intensitySlider.value;
          if (room) {
            ws.send(JSON.stringify({ room: room, command: 'startVibrate', intensity: parseInt(intensity) }));
            vibrateButton.style.backgroundColor = '#1e40af'; // Darker blue when pressed
            // Create particles
            for (let i = 0; i < 5; i++) {
              particles.push(new Particle(vibrateButton.offsetLeft + vibrateButton.offsetWidth / 2, vibrateButton.offsetTop + vibrateButton.offsetHeight / 2));
            }
          }
        };
        vibrateButton.ontouchend = (e) => {
          e.preventDefault();
          const room = document.getElementById('room').value;
          if (room) {
            ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
            vibrateButton.style.backgroundColor = '#3b82f6'; // Back to original blue
          }
        };
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

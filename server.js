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
    <body style="background-color: #1e3a8a; color: white; font-family: Arial; margin: 0; padding: 20px; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <h1>Pulse!! <3</h1>
      <input id="room" type="text" placeholder="Enter room code (e.g., secret123)" style="font-size: 18px; padding: 10px; margin: 10px; background-color: #2b4d9e; border: none; border-radius: 5px; color: white;">
      <br>
      <input type="range" id="intensity" min="1" max="5" value="3" style="width: 200px; margin: 10px; accent-color: #60a5fa;">
      <label for="intensity">Intensity: <span id="intensityValue" style="color: #60a5fa;">3</span></label>
      <br>
      <button id="vibrateButton" style="font-size: 24px; padding: 15px 30px; background-color: #3b82f6; color: white; border: none; border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); transition: background-color 0.2s;">💙</button>
      <p>Enter the same room code on both phones. Hold the button to vibrate, release to stop. Adjust intensity with the slider (1-5).</p>
      <script>
        const ws = new WebSocket('wss://' + window.location.host);
        let isVibrating = false;
        const intensityDisplay = document.getElementById('intensityValue');
        const intensitySlider = document.getElementById('intensity');
        const vibrateButton = document.getElementById('vibrateButton');

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

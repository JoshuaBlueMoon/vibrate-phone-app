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
    <body style="text-align: center; font-family: Arial;">
      <h1>Vibrate Phone</h1>
      <input id="room" type="text" placeholder="Enter room code (e.g., secret123)" style="font-size: 18px; padding: 10px; margin: 10px;">
      <br>
      <button onclick="sendVibrate()" style="font-size: 24px; padding: 15px 30px; background-color: #4CAF50; color: white; border: none; border-radius: 5px;">Vibrate Friend's Phone</button>
      <p>Enter the same room code on both phones. Click the button to vibrate the other phone.</p>
      <script>
        const ws = new WebSocket('wss://' + window.location.host);
        ws.onopen = () => console.log('Connected to server');
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.room === document.getElementById('room').value && data.command === 'vibrate') {
            if (navigator.vibrate) {
              navigator.vibrate(500);
              alert('Phone vibrated!');
            } else {
              alert('Vibration not supported on this device');
            }
          }
        };
        function sendVibrate() {
          const room = document.getElementById('room').value;
          if (!room) {
            alert('Please enter a room code');
            return;
          }
          ws.send(JSON.stringify({ room: room, command: 'vibrate' }));
          alert('Vibrate signal sent!');
        }
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

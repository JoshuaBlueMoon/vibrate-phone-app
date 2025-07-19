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
      <h1>Vibrate My Friend's Phone</h1>
      <input id="room" type="text" placeholder="Enter room code (e.g., secret123)" style="font-size: 18px; padding: 10px; margin: 10px;">
      <br>
      <button id="vibrateButton" style="font-size: 24px; padding: 15px 30px; background-color: #4CAF50; color: white; border: none; border-radius: 5px;">Vibrate Friend's Phone</button>
      <p>Enter the same room code on both phones. Hold the button to vibrate, release to stop.</p>
      <script>
        const ws = new WebSocket('wss://' + window.location.host);
        let isVibrating = false;

        ws.onopen = () => console.log('Connected to server');
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.room === document.getElementById('room').value) {
            if (data.command === 'startVibrate' && navigator.vibrate && !isVibrating) {
              navigator.vibrate(Infinity); // Start continuous vibration
              isVibrating = true;
            } else if (data.command === 'stopVibrate' && isVibrating) {
              navigator.vibrate(0); // Stop vibration
              isVibrating = false;
            }
          }
        };

        const button = document.getElementById('vibrateButton');
        button.onmousedown = () => {
          const room = document.getElementById('room').value;
          if (room) ws.send(JSON.stringify({ room: room, command: 'startVibrate' }));
        };
        button.onmouseup = () => {
          const room = document.getElementById('room').value;
          if (room) ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
        };

        // For touch devices (phones)
        button.ontouchstart = (e) => {
          e.preventDefault();
          const room = document.getElementById('room').value;
          if (room) ws.send(JSON.stringify({ room: room, command: 'startVibrate' }));
        };
        button.ontouchend = (e) => {
          e.preventDefault();
          const room = document.getElementById('room').value;
          if (room) ws.send(JSON.stringify({ room: room, command: 'stopVibrate' }));
        };
      </script>
    </body>
    </html>
  `);
});
server.listen(process.env.PORT || 3000, () => console.log('Server running'));

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

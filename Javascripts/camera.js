let currentFramePath = 'Assets/photobooth/camerapage/frame.png';
const WIDTH = 1176, HEIGHT = 1470, HALF = HEIGHT / 2;

const elements = {
  video: document.getElementById('liveVideo'),
  canvas: document.getElementById('finalCanvas'),
  ctx: document.getElementById('finalCanvas').getContext('2d'),
  takePhotoBtn: document.getElementById('takePhoto'),
  countdownEl: document.querySelector('.countdown-timer')
};

let photoStage = 0; 

const moveVideoToHalf = i => {
  const { video } = elements;
  video.style.display = 'block';
  video.style.top = i === 0 ? '0' : '50%';
  video.style.left = '0';
  video.style.width = '100%';
  video.style.height = '50%';
};

const startCountdown = callback => {
  let count = 3;
  const { countdownEl } = elements;
  countdownEl.textContent = count;
  countdownEl.style.display = 'flex';
  const intervalId = setInterval(() => {
    count--;
    if (count > 0) countdownEl.textContent = count;
    else {
      clearInterval(intervalId);
      countdownEl.style.display = 'none';
      callback();
    }
  }, 1000);
};

const capturePhoto = () => {
  const { video, ctx, takePhotoBtn } = elements;
  const yOffset = photoStage === 0 ? 0 : HALF;
  const vW = video.videoWidth, vH = video.videoHeight;
  const targetAspect = WIDTH / HALF, vAspect = vW / vH;
  let sx, sy, sw, sh;

  if (vAspect > targetAspect) { 
    sh = vH; sw = vH * targetAspect; sx = (vW - sw) / 2; sy = 0; 
  } else { 
    sw = vW; sh = vW / targetAspect; sx = 0; sy = (vH - sh) / 2; 
  }

  ctx.save();
  ctx.translate(WIDTH, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, sx, sy, sw, sh, 0, yOffset, WIDTH, HALF);
  ctx.restore();

  photoStage++;
  if (photoStage === 1) { 
    moveVideoToHalf(1); 
    takePhotoBtn.disabled = false; 
  } else if (photoStage === 2) {
    finalizePhotoStrip();
  }
};

const finalizePhotoStrip = () => {
  const { video, ctx, canvas } = elements;
  video.style.display = 'none';
  const frame = new Image();
  frame.src = currentFramePath;
  frame.onload = () => {
    ctx.drawImage(frame, 0, 0, WIDTH, HEIGHT);
    localStorage.setItem('photoStrip', canvas.toDataURL('image/png'));
    setTimeout(() => window.location.href = 'final.html', 50);
  };
};

const setupCamera = () => {
  navigator.mediaDevices.getUserMedia({ 
    video: { width: { ideal: 2560 }, height: { ideal: 1440 }, facingMode: 'user' }, 
    audio: false 
  })
    .then(stream => { 
      elements.video.srcObject = stream; 
      elements.video.play(); 
      moveVideoToHalf(0); 
    })
    .catch(err => alert('Camera access failed: ' + err));
};

// Hàm này cực kỳ quan trọng để các nút bấm hoạt động
const setupEventListeners = () => {
  elements.takePhotoBtn.addEventListener('click', () => {
    elements.takePhotoBtn.disabled = true;
    startCountdown(capturePhoto);
  });

  const frameThumbs = document.querySelectorAll('.frame-thumb');
  const frameOverlay = document.querySelector('.frame-overlay');

  frameThumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      currentFramePath = thumb.getAttribute('data-frame');
      if (frameOverlay) frameOverlay.src = currentFramePath;
      frameThumbs.forEach(t => t.style.border = '1px solid #ccc');
      thumb.style.border = '2px solid #1E1E1E';
    });
  });
};

const initPhotoBooth = () => { 
  setupCamera(); 
  setupEventListeners(); 
};

document.addEventListener('DOMContentLoaded', () => {
  initPhotoBooth();
  const logo = document.querySelector('.logo');
  if (logo) logo.addEventListener('click', () => window.location.href = 'index.html');
});
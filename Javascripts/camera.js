const { WIDTH, HEIGHT, HALF } = BOOTH_CONFIG;
let currentFramePath = 'Assets/photobooth/camerapage/frame.png';
let photoStage = 0; // 0: first photo, 1: second photo, 2: finished

const elements = {
  video: document.getElementById('liveVideo'),
  canvas: document.getElementById('finalCanvas'),
  ctx: document.getElementById('finalCanvas').getContext('2d'),
  takePhotoBtn: document.getElementById('takePhoto'),
  countdownEl: document.querySelector('.countdown-timer'),
  shutterSound: new Audio('Assets/photobooth/shutter.mp3'),
  frameThumbs: document.querySelectorAll('.frame-thumb'),
  frameOverlay: document.querySelector('.frame-overlay')
};

// Adjust video position based on current photo stage
const updateVideoPosition = (stage) => {
  Object.assign(elements.video.style, {
    display: 'block',
    top: stage === 0 ? '0' : '50%',
    left: '0',
    width: '100%',
    height: '50%'
  });
};

// Capture photo logic
const capturePhoto = () => {
  elements.shutterSound.play().catch(e => console.warn('Sound play failed', e));
  
  const { video, ctx } = elements;
  const yOffset = photoStage === 0 ? 0 : HALF;
  
  // Calculate crop dimensions to cover the half-frame area
  const vW = video.videoWidth, vH = video.videoHeight;
  const vAspect = vW / vH;
  const targetAspect = WIDTH / HALF;
  
  let renderW, renderH, offsetX, offsetY;

  if (vAspect > targetAspect) { 
    renderH = vH; renderW = vH * targetAspect; 
    offsetX = (vW - renderW) / 2; offsetY = 0; 
  } else { 
    renderW = vW; renderH = vW / targetAspect; 
    offsetX = 0; offsetY = (vH - renderH) / 2; 
  }

  // Draw captured frame to canvas (mirrored)
  ctx.save();
  ctx.translate(WIDTH, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, offsetX, offsetY, renderW, renderH, 0, yOffset, WIDTH, HALF);
  ctx.restore();

  photoStage++;
  
  if (photoStage === 1) { 
    updateVideoPosition(1); 
    elements.takePhotoBtn.disabled = false; 
  } else {
    finalizeSession();
  }
};

// Merge frame and save to storage
const finalizeSession = () => {
  elements.video.style.display = 'none';
  const frame = new Image();
  frame.src = currentFramePath;
  frame.onload = () => {
    elements.ctx.drawImage(frame, 0, 0, WIDTH, HEIGHT);
    localStorage.setItem('photoStrip', elements.canvas.toDataURL('image/png'));
    // Small delay to ensure storage write
    setTimeout(() => goTo('final.html'), 50);
  };
};

// Countdown timer logic
const startCountdown = () => {
  let count = 3;
  elements.countdownEl.textContent = count;
  elements.countdownEl.style.display = 'flex';
  
  const timer = setInterval(() => {
    count--;
    if (count > 0) {
      elements.countdownEl.textContent = count;
    } else {
      clearInterval(timer);
      elements.countdownEl.style.display = 'none';
      capturePhoto();
    }
  }, 1000);
};

// Initialize Camera
const initCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: { ideal: 2560 }, height: { ideal: 1440 }, facingMode: 'user' }, 
      audio: false 
    });
    elements.video.srcObject = stream;
    elements.video.play();
    updateVideoPosition(0);
  } catch (err) {
    alert('Camera access denied or not available: ' + err.message);
  }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initLogo();
  initCamera();

  elements.takePhotoBtn.addEventListener('click', () => {
    elements.shutterSound.play().then(() => {
        elements.shutterSound.pause();
        elements.shutterSound.currentTime = 0;
    }).catch(() => {});

    elements.takePhotoBtn.disabled = true;
    startCountdown();
});

  // Frame selection logic
  elements.frameThumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      currentFramePath = thumb.getAttribute('data-frame');
      if (elements.frameOverlay) elements.frameOverlay.src = currentFramePath;
      
      // Update UI selection state
      elements.frameThumbs.forEach(t => t.style.border = '1px solid #ccc');
      thumb.style.border = '2px solid #1E1E1E';
    });
  });
});
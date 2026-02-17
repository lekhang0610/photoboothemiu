const { WIDTH, HEIGHT } = BOOTH_CONFIG;
const canvas = document.getElementById('finalCanvas');
const ctx = canvas.getContext('2d');

// Sticker Assets Configuration
const stickerButtons = {
  fish: 'Assets/photobooth/camerapage/stickers/fish.png',
  octopus: 'Assets/photobooth/camerapage/stickers/octopus.png',
  axolotl: 'Assets/photobooth/camerapage/stickers/axolotl.png'
};

// Arrays for rotating stickers
const seaweedImages = ['Assets/photobooth/camerapage/stickers/seaweed1.png','Assets/photobooth/camerapage/stickers/seaweed2.png'];
const bubbleImages = ['Assets/photobooth/camerapage/stickers/bubble1.png','Assets/photobooth/camerapage/stickers/bubble2.png'];
let seaweedIndex = 0, bubbleIndex = 0;

// --- PRELOAD ASSETS (Optimization) ---
// Preload all stickers immediately to avoid lag when adding them
const allStickerSources = [
  ...Object.values(stickerButtons),
  ...seaweedImages,
  ...bubbleImages
];

const preloadImages = (srcArray) => {
  srcArray.forEach(src => {
    const img = new Image();
    img.src = src;
  });
};

// State Management
let stickers = [];
let selectedSticker = null;
let dragOffset = { x: 0, y: 0 };
let finalImage = new Image();

// Load base photo from LocalStorage
const dataURL = localStorage.getItem('photoStrip');
if (dataURL) {
  finalImage.src = dataURL;
  finalImage.onload = renderCanvas;
  // Note: We remove it to keep storage clean, but you can comment this out if you want persistence on refresh
  localStorage.removeItem('photoStrip'); 
} else {
  alert("No photo found! Redirecting...");
  goTo('index.html');
}

// Main Render Loop
function renderCanvas() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  // 1. Draw base photo
  ctx.drawImage(finalImage, 0, 0, WIDTH, HEIGHT);
  // 2. Draw all stickers
  stickers.forEach(s => ctx.drawImage(s.img, s.x, s.y, s.width, s.height));
}

// Helper: Add a sticker to the canvas
const addSticker = (src) => {
  const img = new Image();
  img.src = src;
  img.onload = () => {
    stickers.push({
      img,
      x: WIDTH / 2 - img.width / 5, // Center roughly
      y: HEIGHT / 2 - img.height / 5,
      width: img.width / 2.5,
      height: img.height / 2.5
    });
    renderCanvas();
  };
};

// --- UNIFIED POINTER EVENTS (Mouse + Touch) ---
const getPointerPos = (e) => {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) * (WIDTH / rect.width),
    y: (clientY - rect.top) * (HEIGHT / rect.height)
  };
};

const handlePointerDown = (e) => {
  e.preventDefault(); // Prevent scrolling on touch devices
  const { x, y } = getPointerPos(e);
  
  // Iterate backwards to select the top-most sticker first
  for (let i = stickers.length - 1; i >= 0; i--) {
    const s = stickers[i];
    if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) {
      selectedSticker = s;
      dragOffset = { x: x - s.x, y: y - s.y };
      
      // Move selected sticker to the top of the stack (render last)
      stickers.push(stickers.splice(i, 1)[0]);
      renderCanvas();
      break;
    }
  }
};

const handlePointerMove = (e) => {
  if (!selectedSticker) return;
  e.preventDefault();
  const { x, y } = getPointerPos(e);
  selectedSticker.x = x - dragOffset.x;
  selectedSticker.y = y - dragOffset.y;
  renderCanvas();
};

const handlePointerUp = () => { selectedSticker = null; };

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initLogo(); // From utils.js
  preloadImages(allStickerSources); // Start preloading assets

  // 1. Attach Canvas Events
  ['mousedown', 'touchstart'].forEach(evt => canvas.addEventListener(evt, handlePointerDown, { passive: false }));
  ['mousemove', 'touchmove'].forEach(evt => canvas.addEventListener(evt, handlePointerMove, { passive: false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(evt => canvas.addEventListener(evt, handlePointerUp));

  // 2. Attach UI Button Events
  document.getElementById('addFish').onclick = () => addSticker(stickerButtons.fish);
  document.getElementById('addOctopus').onclick = () => addSticker(stickerButtons.octopus);
  document.getElementById('addAx').onclick = () => addSticker(stickerButtons.axolotl);
  
  document.getElementById('addSeaweed').onclick = () => {
    addSticker(seaweedImages[seaweedIndex]);
    seaweedIndex = (seaweedIndex + 1) % seaweedImages.length;
  };

  document.getElementById('addBubble').onclick = () => {
    addSticker(bubbleImages[bubbleIndex]);
    bubbleIndex = (bubbleIndex + 1) % bubbleImages.length;
  };

  document.getElementById('reset').onclick = () => { stickers = []; renderCanvas(); };
  document.getElementById('homeBtn').onclick = () => goTo('index.html');

  // 3. Download Logic with Loading State
  document.getElementById('downloadBtn').onclick = function() {
    const btn = this; // Use 'this' to reference the button element
    const originalText = btn.textContent;
   
    // Set Loading State
    btn.textContent = "Đang lưu...";
    btn.disabled = true;
    btn.style.opacity = "0.7";
    btn.style.cursor = "wait";

    // Use setTimeout to allow UI to update before heavy processing
    setTimeout(() => {
        canvas.toBlob(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'photobooth-love.png';
            a.click();
            
            // Revert State after a short delay
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
                btn.style.opacity = "1";
                btn.style.cursor = "pointer";
            }, 1000);
        });
    }, 50);
  };
});
const { WIDTH, HEIGHT, HALF, TARGET_ASPECT } = BOOTH_CONFIG;

let currentFramePath = 'Assets/photobooth/camerapage/frame.png';
let uploadedImages = [null, null]; // Stores: { img, rawFile, x, y }
let cropper = null;
let currentFile = null; 
let activePhotoIndex = -1; 
let photoStage = 0; 
let isDragging = false;
let startDrag = { x: 0, y: 0 };

// Pre-load frame image to prevent flickering during drag
const frameImg = new Image();
frameImg.src = currentFramePath;

const elements = {
  canvas: document.getElementById('finalCanvas'),
  ctx: document.getElementById('finalCanvas').getContext('2d'),
  uploadInput: document.getElementById('uploadPhotoInput'),
  uploadBtn: document.getElementById('uploadPhoto'),
  readyBtn: document.getElementById('readyButton'),
  frameOverlay: document.querySelector('.frame-overlay'),
  cropperModal: document.getElementById('cropperModal'),
  imageToCrop: document.getElementById('imageToCrop'),
  confirmCrop: document.getElementById('confirmCrop'),
  cancelCrop: document.getElementById('cancelCrop'),
  reEditControls: document.getElementById('re-edit-controls'),
  reSelectBtn: document.getElementById('reSelectBtn'),
  reCropBtn: document.getElementById('reCropBtn'),
  frameThumbs: document.querySelectorAll('.frame-thumb')
};

// Render the main canvas with images, frame, and selection highlight
const renderCanvas = () => {
  const { ctx } = elements;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Draw user photos
  uploadedImages.forEach((photo, index) => {
    if (photo) {
      const yBaseOffset = index * HALF;
      ctx.save();
      
      // Create clipping region for the photo slot
      ctx.beginPath();
      ctx.rect(0, yBaseOffset, WIDTH, HALF);
      ctx.clip();
      
      // Draw the photo
      ctx.drawImage(photo.img, photo.x, yBaseOffset + photo.y, WIDTH, HALF);
      
      // --- Selection Highlight (Feature Update) ---
      if (index === activePhotoIndex) {
        ctx.restore(); // Exit clip to draw border on top
        ctx.save();
        ctx.strokeStyle = '#ff85b3'; // Pink theme color
        ctx.lineWidth = 15;
        ctx.strokeRect(10, yBaseOffset + 10, WIDTH - 20, HALF - 20);
        
        ctx.fillStyle = 'rgba(255, 133, 179, 0.2)'; // Light pink overlay
        ctx.fillRect(10, yBaseOffset + 10, WIDTH - 20, HALF - 20);
      }
      
      ctx.restore();
    }
  });
  
  // Draw the pre-loaded frame overlay
  if (frameImg.complete) {
    ctx.drawImage(frameImg, 0, 0, WIDTH, HEIGHT);
  } else {
    frameImg.onload = () => ctx.drawImage(frameImg, 0, 0, WIDTH, HEIGHT);
  }
};

// Initialize CropperJS
const openCropper = (file) => {
  currentFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    elements.imageToCrop.src = e.target.result;
    elements.cropperModal.style.display = 'flex';
    if (cropper) cropper.destroy();
    cropper = new Cropper(elements.imageToCrop, {
      aspectRatio: TARGET_ASPECT,
      viewMode: 1,
      guides: true,
    });
  };
  reader.readAsDataURL(file);
};

// --- DRAG & SELECT LOGIC ---
const handlePointerDown = (e) => {
  const rect = elements.canvas.getBoundingClientRect();
  const scaleX = WIDTH / rect.width;
  const scaleY = HEIGHT / rect.height;

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  const mouseX = (clientX - rect.left) * scaleX;
  const mouseY = (clientY - rect.top) * scaleY;

  // Determine which photo slot was clicked (0: top, 1: bottom)
  activePhotoIndex = mouseY < HALF ? 0 : 1;
  
  // Immediately update to show selection highlight
  renderCanvas();

  if (uploadedImages[activePhotoIndex]) {
    isDragging = true;
    startDrag = {
      x: mouseX - uploadedImages[activePhotoIndex].x,
      y: (mouseY - (activePhotoIndex * HALF)) - uploadedImages[activePhotoIndex].y
    };
    
    elements.reEditControls.style.display = 'flex';
  } else {
    elements.reEditControls.style.display = 'none';
  }
};

const handlePointerMove = (e) => {
  if (!isDragging || activePhotoIndex === -1) return;
  if (e.cancelable) e.preventDefault(); 
  
  const rect = elements.canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
  const mouseX = (clientX - rect.left) * (WIDTH / rect.width);
  const mouseY = (clientY - rect.top) * (HEIGHT / rect.height);

  uploadedImages[activePhotoIndex].x = mouseX - startDrag.x;
  uploadedImages[activePhotoIndex].y = (mouseY - (activePhotoIndex * HALF)) - startDrag.y;
  
  renderCanvas();
};

const handlePointerUp = () => { 
  isDragging = false; 
};

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
  initLogo();
  localStorage.removeItem('photoStrip');
  renderCanvas();

  elements.uploadBtn.onclick = () => {
    const nextIndex = uploadedImages.findIndex(img => img === null);
    photoStage = nextIndex !== -1 ? nextIndex : 0;
    elements.uploadInput.click();
  };

  elements.uploadInput.onchange = (e) => {
    if (e.target.files[0]) openCropper(e.target.files[0]);
    e.target.value = ''; 
  };

  elements.confirmCrop.onclick = () => {
    const croppedCanvas = cropper.getCroppedCanvas({ width: WIDTH, height: HALF });
    const img = new Image();
    img.onload = () => {
      uploadedImages[photoStage] = { img, rawFile: currentFile, x: 0, y: 0 };
      
      if (uploadedImages[0] && uploadedImages[1]) {
        elements.uploadBtn.style.display = 'none';
        elements.readyBtn.style.display = 'inline-block';
        elements.readyBtn.disabled = false;
      }
      elements.cropperModal.style.display = 'none';
      elements.reEditControls.style.display = 'none';
      activePhotoIndex = -1; // Reset selection after cropping
      renderCanvas();
    };
    img.src = croppedCanvas.toDataURL('image/png');
  };

  elements.cancelCrop.onclick = () => {
    elements.cropperModal.style.display = 'none';
    if (cropper) cropper.destroy();
  };

  elements.reSelectBtn.onclick = () => {
    photoStage = activePhotoIndex;
    elements.uploadInput.click();
  };

  elements.reCropBtn.onclick = () => {
    if (uploadedImages[activePhotoIndex]) {
      photoStage = activePhotoIndex;
      openCropper(uploadedImages[activePhotoIndex].rawFile);
    }
  };

  elements.readyBtn.onclick = () => {
    activePhotoIndex = -1; // Ensure no highlight is saved
    renderCanvas(); 
    setTimeout(() => {
        localStorage.setItem('photoStrip', elements.canvas.toDataURL('image/png'));
        goTo('final.html');
    }, 50);
  };

  elements.frameThumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      currentFramePath = thumb.getAttribute('data-frame');
      frameImg.src = currentFramePath; // Update global frame object
      if (elements.frameOverlay) elements.frameOverlay.src = currentFramePath;
      renderCanvas();
      elements.frameThumbs.forEach(t => t.style.border = '1px solid #ccc');
      thumb.style.border = '2px solid #1E1E1E';
    });
  });

  elements.canvas.addEventListener('mousedown', handlePointerDown);
  window.addEventListener('mousemove', handlePointerMove);
  window.addEventListener('mouseup', handlePointerUp);
  
  elements.canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
  window.addEventListener('touchmove', handlePointerMove, { passive: false });
  window.addEventListener('touchend', handlePointerUp);
});
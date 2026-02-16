const { WIDTH, HEIGHT, HALF, TARGET_ASPECT } = BOOTH_CONFIG;

let currentFramePath = 'Assets/photobooth/camerapage/frame.png';
let uploadedImages = [null, null]; // Stores: { img, rawFile, x, y }
let cropper = null;
let currentFile = null; 
let activePhotoIndex = -1; 
let photoStage = 0; 
let isDragging = false;
let startDrag = { x: 0, y: 0 };

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

// Render the main canvas with images and frame
const renderCanvas = () => {
  const { ctx } = elements;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Toggle hint visibility
  const hintContainer = document.querySelector('.sticker-container');
  if (hintContainer) hintContainer.style.opacity = (uploadedImages[0] || uploadedImages[1]) ? '1' : '0';

  // Draw user photos
  uploadedImages.forEach((photo, index) => {
    if (photo) {
      const yBaseOffset = index * HALF;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, yBaseOffset, WIDTH, HALF);
      ctx.clip();
      ctx.drawImage(photo.img, photo.x, yBaseOffset + photo.y, WIDTH, HALF);
      ctx.restore();
    }
  });
  
  // Draw frame overlay
  const frame = new Image();
  frame.src = currentFramePath;
  frame.onload = () => ctx.drawImage(frame, 0, 0, WIDTH, HEIGHT);
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

// Drag Logic (Unified)
const handlePointerDown = (e) => {
  const rect = elements.canvas.getBoundingClientRect();
  const scaleY = HEIGHT / rect.height;
  const clientY = e.touches ? e.touches[0].clientY : e.clientX;
  const mouseY = (clientY - rect.top) * scaleY;

  activePhotoIndex = mouseY < HALF ? 0 : 1;

  if (uploadedImages[activePhotoIndex]) {
    isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const scaleX = WIDTH / rect.width;
    const mouseX = (clientX - rect.left) * scaleX;

    startDrag = {
      x: mouseX - uploadedImages[activePhotoIndex].x,
      y: (mouseY - (activePhotoIndex * HALF)) - uploadedImages[activePhotoIndex].y
    };
    
    // UI Feedback
    elements.reEditControls.style.display = 'flex';
    const editHint = document.getElementById('edit-hint');
    if (editHint) {
      editHint.classList.remove('shake-animation');
      void editHint.offsetWidth; // Trigger reflow
      editHint.classList.add('shake-animation');
    }
  }
};

const handlePointerMove = (e) => {
  if (!isDragging || activePhotoIndex === -1) return;
  e.preventDefault(); // Stop scrolling on touch
  
  const rect = elements.canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
  const mouseX = (clientX - rect.left) * (WIDTH / rect.width);
  const mouseY = (clientY - rect.top) * (HEIGHT / rect.height);

  uploadedImages[activePhotoIndex].x = mouseX - startDrag.x;
  uploadedImages[activePhotoIndex].y = (mouseY - (activePhotoIndex * HALF)) - startDrag.y;
  renderCanvas();
};

const handlePointerUp = () => { isDragging = false; };

document.addEventListener('DOMContentLoaded', () => {
  initLogo();
  localStorage.removeItem('photoStrip');
  renderCanvas();

  // Upload & Crop Handlers
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
      
      const isFull = uploadedImages[0] && uploadedImages[1];
      if (isFull) {
        elements.uploadBtn.style.display = 'none';
        elements.readyBtn.style.display = 'inline-block';
        elements.readyBtn.disabled = false;
        photoStage = 2;
      } else {
        photoStage = uploadedImages[0] ? 1 : 0;
        elements.uploadBtn.innerText = uploadedImages[0] ? "Chọn tiếp ảnh 2 nè" : "Chọn ảnh 1 nè";
      }

      elements.cropperModal.style.display = 'none';
      elements.reEditControls.style.display = 'none';
      renderCanvas();
    };
    img.src = croppedCanvas.toDataURL('image/png');
  };

  elements.cancelCrop.onclick = () => {
    elements.cropperModal.style.display = 'none';
    if (cropper) cropper.destroy();
  };

  // Re-edit handlers
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
    localStorage.setItem('photoStrip', elements.canvas.toDataURL('image/png'));
    goTo('final.html');
  };

  // Frame Selection
  elements.frameThumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      currentFramePath = thumb.getAttribute('data-frame');
      if (elements.frameOverlay) elements.frameOverlay.src = currentFramePath;
      renderCanvas();
      elements.frameThumbs.forEach(t => t.style.border = '1px solid #ccc');
      thumb.style.border = '2px solid #1E1E1E';
    });
  });

  // Attach pointer events
  elements.canvas.addEventListener('mousedown', handlePointerDown);
  window.addEventListener('mousemove', handlePointerMove);
  window.addEventListener('mouseup', handlePointerUp);
  
  elements.canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
  window.addEventListener('touchmove', handlePointerMove, { passive: false });
  window.addEventListener('touchend', handlePointerUp);
});
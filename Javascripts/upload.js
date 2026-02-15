let currentFramePath = 'Assets/photobooth/camerapage/frame.png';
let uploadedImages = [null, null]; // Lưu trữ: { img: Image, rawFile: File, x: 0, y: 0 }

const WIDTH = 1176, HEIGHT = 1470, HALF = HEIGHT / 2;
const TARGET_ASPECT = WIDTH / HALF;

let cropper = null;
let currentFile = null; 
let isDragging = false;
let startX, startY;
let activePhotoIndex = -1; 
let photoStage = 0; 

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
  reCropBtn: document.getElementById('reCropBtn')
};

// Hàm vẽ chính trên Canvas
const renderCanvas = () => {
  const { ctx } = elements;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  // Hiện dòng lưu ý khi đã có ảnh
if (uploadedImages[0] || uploadedImages[1]) {
    document.querySelector('.sticker-container').style.opacity = '1';
} else {
    document.querySelector('.sticker-container').style.opacity = '0';
}

  uploadedImages.forEach((photoData, index) => {
    if (photoData) {
      const yBaseOffset = index * HALF;
      ctx.save();
      // Tạo vùng cắt để ảnh không tràn ra ngoài khung tương ứng
      ctx.beginPath();
      ctx.rect(0, yBaseOffset, WIDTH, HALF);
      ctx.clip();

      // Vẽ ảnh dựa trên tọa độ x, y người dùng đã điều chỉnh
      ctx.drawImage(photoData.img, photoData.x, yBaseOffset + photoData.y, WIDTH, HALF);
      ctx.restore();
    }
  });
  
  // Vẽ khung đè lên trên cùng
  const frame = new Image();
  frame.src = currentFramePath;
  frame.onload = () => {
    if (frame.src.includes(currentFramePath)) {
      ctx.drawImage(frame, 0, 0, WIDTH, HEIGHT);
    }
  };
};

// Mở trình cắt ảnh (Cropper)
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

const setupEventListeners = () => {
  // Nút chọn ảnh ban đầu
  elements.uploadBtn.addEventListener('click', () => {
    const nextEmptyIndex = uploadedImages.findIndex(img => img === null);
    photoStage = nextEmptyIndex !== -1 ? nextEmptyIndex : 0;
    elements.uploadInput.click();
  });

  elements.uploadInput.addEventListener('change', e => {
    if (e.target.files[0]) openCropper(e.target.files[0]);
    e.target.value = ''; 
  });

  // Xác nhận cắt ảnh từ Cropper
  elements.confirmCrop.addEventListener('click', () => {
    const croppedCanvas = cropper.getCroppedCanvas({ width: WIDTH, height: HALF });
    const img = new Image();
    img.onload = () => {
      uploadedImages[photoStage] = { img, rawFile: currentFile, x: 0, y: 0 };
      
      const hasPhoto1 = uploadedImages[0] !== null;
      const hasPhoto2 = uploadedImages[1] !== null;

      if (hasPhoto1 && hasPhoto2) {
        elements.uploadBtn.style.display = 'none';
        elements.readyBtn.style.display = 'inline-block';
        elements.readyBtn.disabled = false;
        photoStage = 2;
      } else {
        photoStage = hasPhoto1 ? 1 : 0;
        elements.uploadBtn.innerText = hasPhoto1 ? "Chọn tiếp ảnh 2 nè" : "Chọn ảnh 1 nè";
      }

      elements.cropperModal.style.display = 'none';
      elements.reEditControls.style.display = 'none';
      renderCanvas();
    };
    img.src = croppedCanvas.toDataURL('image/png');
  });

  // Chức năng chọn lại ảnh
  elements.reSelectBtn.addEventListener('click', () => {
    photoStage = activePhotoIndex;
    elements.uploadInput.click();
  });

  // Chức năng Crop lại từ file gốc ban đầu
  elements.reCropBtn.addEventListener('click', () => {
    if (uploadedImages[activePhotoIndex]) {
      photoStage = activePhotoIndex;
      openCropper(uploadedImages[activePhotoIndex].rawFile);
    }
  });

  elements.cancelCrop.addEventListener('click', () => {
    elements.cropperModal.style.display = 'none';
    if (cropper) cropper.destroy();
  });

  elements.readyBtn.addEventListener('click', () => {
    localStorage.setItem('photoStrip', elements.canvas.toDataURL('image/png'));
    window.location.href = 'final.html';
  });

  // Xử lý sự kiện kéo thả và chọn ảnh để sửa trên Canvas
  elements.canvas.addEventListener('mousedown', handlePointerDown);
  window.addEventListener('mousemove', handlePointerMove);
  window.addEventListener('mouseup', handlePointerUp);
  elements.canvas.addEventListener('touchstart', handlePointerDown);
  window.addEventListener('touchmove', handlePointerMove);
  window.addEventListener('touchend', handlePointerUp);

  // Đổi khung (frame)
  const frameThumbs = document.querySelectorAll('.frame-thumb');
  frameThumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      currentFramePath = thumb.getAttribute('data-frame');
      if (elements.frameOverlay) elements.frameOverlay.src = currentFramePath;
      renderCanvas();
      frameThumbs.forEach(t => t.style.border = '1px solid #ccc');
      thumb.style.border = '2px solid #1E1E1E';
    });
  });
};

const handlePointerDown = (e) => {
  const rect = elements.canvas.getBoundingClientRect();
  const scaleX = WIDTH / rect.width;
  const scaleY = HEIGHT / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const mouseX = (clientX - rect.left) * scaleX;
  const mouseY = (clientY - rect.top) * scaleY;

  activePhotoIndex = mouseY < HALF ? 0 : 1;

  if (uploadedImages[activePhotoIndex]) {
    isDragging = true;
    startX = mouseX - uploadedImages[activePhotoIndex].x;
    startY = (mouseY - (activePhotoIndex * HALF)) - uploadedImages[activePhotoIndex].y;
    
    // 1. Hiển thị cụm nút chỉnh sửa
    elements.reEditControls.style.display = 'flex';

    // 2. Kích hoạt hiệu ứng rung cho dòng chữ lưu ý
    const editHint = document.getElementById('edit-hint');
    if (editHint) {
      // Xóa class cũ nếu có để có thể kích hoạt lại hiệu ứng nhiều lần
      editHint.classList.remove('shake-animation');
      // Kích hoạt lại hiệu ứng bằng cách thêm class sau một khoảng thời gian cực ngắn (void offset)
      void editHint.offsetWidth; 
      editHint.classList.add('shake-animation');
    }
  }
};

const handlePointerMove = (e) => {
  if (!isDragging || activePhotoIndex === -1) return;
  const rect = elements.canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const mouseX = (clientX - rect.left) * (WIDTH / rect.width);
  const mouseY = (clientY - rect.top) * (HEIGHT / rect.height);

  uploadedImages[activePhotoIndex].x = mouseX - startX;
  uploadedImages[activePhotoIndex].y = (mouseY - (activePhotoIndex * HALF)) - startY;
  renderCanvas();
};

const handlePointerUp = () => { isDragging = false; };

document.addEventListener('DOMContentLoaded', () => {
  localStorage.removeItem('photoStrip');
  setupEventListeners();
  renderCanvas();
});
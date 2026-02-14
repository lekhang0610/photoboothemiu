let currentFramePath = 'Assets/photobooth/camerapage/frame.png';
let uploadedImages = [null, null]; // Lưu 2 ảnh riêng biệt
const WIDTH = 1176, HEIGHT = 1470, HALF = HEIGHT / 2;

const elements = {
  canvas: document.getElementById('finalCanvas'),
  ctx: document.getElementById('finalCanvas').getContext('2d'),
  uploadInput: document.getElementById('uploadPhotoInput'),
  uploadBtn: document.getElementById('uploadPhoto'),
  readyBtn: document.getElementById('readyButton'),
  frameOverlay: document.querySelector('.frame-overlay') // Để cập nhật preview
};

let photoStage = 0; // 0: ảnh 1, 1: ảnh 2, 2: hoàn tất

// Hàm vẽ chính - Được tối ưu để không bị chồng frame
const renderCanvas = () => {
  const { ctx } = elements;
  
  // 1. Xóa sạch canvas trước khi vẽ bất cứ thứ gì mới
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // 2. Vẽ các ảnh đã upload
  uploadedImages.forEach((img, index) => {
    if (img) {
      const yOffset = index * HALF;
      const targetAspect = WIDTH / HALF;
      const imgAspect = img.width / img.height;
      let sx, sy, sw, sh;

      if (imgAspect > targetAspect) { 
        sh = img.height; sw = img.height * targetAspect; sx = (img.width - sw) / 2; sy = 0; 
      } else { 
        sw = img.width; sh = img.width / targetAspect; sx = 0; sy = (img.height - sh) / 2; 
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, yOffset, WIDTH, HALF);
    }
  });
  
  // 3. Vẽ frame - Sử dụng biến cục bộ để tránh lỗi load ảnh cũ
  const frame = new Image();
  frame.src = currentFramePath;
  frame.onload = () => {
    // Chỉ vẽ nếu đường dẫn ảnh vẫn là frame hiện tại (tránh lỗi bất đồng bộ)
    if (frame.src.includes(currentFramePath)) {
      ctx.drawImage(frame, 0, 0, WIDTH, HEIGHT);
    }
  };
};

const setupEventListeners = () => {
  // Click nút chọn ảnh
  elements.uploadBtn.addEventListener('click', () => {
    if (photoStage < 2) elements.uploadInput.click();
  });

  // Xử lý khi chọn file
  elements.uploadInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      uploadedImages[photoStage] = img; // Lưu vào vị trí 1 hoặc 2
      photoStage++;

      if (photoStage === 1) {
        elements.uploadBtn.innerText = "Chọn tiếp ảnh 2 nè";
      } else if (photoStage === 2) {
        elements.uploadBtn.style.display = 'none';
        elements.readyBtn.style.display = 'inline-block';
        elements.readyBtn.disabled = false;
      }
      renderCanvas();
    };
    img.src = URL.createObjectURL(file);
    elements.uploadInput.value = ''; 
  });

  // Nút Hoàn tất
  elements.readyBtn.addEventListener('click', () => {
    localStorage.setItem('photoStrip', elements.canvas.toDataURL('image/png'));
    window.location.href = 'final.html';
  });

  // Đổi frame và sửa lỗi hiển thị
  const frameThumbs = document.querySelectorAll('.frame-thumb');
  frameThumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      currentFramePath = thumb.getAttribute('data-frame');
      
      // Cập nhật cả overlay HTML để em nhìn thấy ngay lập tức
      if (elements.frameOverlay) {
        elements.frameOverlay.src = currentFramePath;
      }
      
      renderCanvas(); // Vẽ lại canvas
      
      frameThumbs.forEach(t => t.style.border = '1px solid #ccc');
      thumb.style.border = '2px solid #1E1E1E';
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  localStorage.removeItem('photoStrip');
  setupEventListeners();
  renderCanvas(); // Vẽ khung trống ban đầu
});
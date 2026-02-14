// --- DOM REFERENCES ---
const selectButton = document.getElementById('select-button');
const photostripEl = document.querySelector('.photostrip-mock');
const cameraBtn = document.getElementById('menu-camera-button');
const uploadBtn = document.getElementById('menu-upload-button');
const logoEl = document.querySelector('.logo');

// --- PHOTOSTRIP ANIMATION ---
// Giữ lại hiệu ứng "vẫy" nhẹ của dải ảnh khi tương tác với nút bấm
const photostrip = {
  el: photostripEl,
  rotation: 16.52,
  current: 0,
};

let photostripTimeout = null;
let photostripAnimating = false;

function animatePhotostrip() {
  if (!photostripAnimating || !photostrip.el) return;

  // Đổi trạng thái xoay giữa 0 và 16.52 độ
  photostrip.el.style.transform = `rotate(${photostrip.current}deg)`;
  photostrip.current = photostrip.current === photostrip.rotation ? 0 : photostrip.rotation;

  photostripTimeout = setTimeout(() => {
    requestAnimationFrame(animatePhotostrip);
  }, 300);
}

function startPhotostripAnimation() {
  if (!photostripAnimating) {
    photostripAnimating = true;
    animatePhotostrip();
  }
}

function stopPhotostripAnimation() {
  photostripAnimating = false;
  clearTimeout(photostripTimeout);
  if (photostrip.el) {
    // Trả về độ nghiêng mặc định trong CSS (16.52deg) thay vì 0deg nếu bạn muốn giữ dáng nghiêng
    photostrip.el.style.transform = `rotate(16.52deg)`;
  }
}

// --- NAVIGATION LOGIC ---
function addSafeNavigation(button, url, id) {
  if (!button) return;

  button.addEventListener('click', e => {
    e.preventDefault();
    // Tạo khoảng nghỉ ngắn để tạo cảm giác mượt mà khi chuyển trang
    setTimeout(() => (window.location.href = url), 100);
  });
}

// --- EVENT LISTENERS ---

// Hiệu ứng cho nút "Vô việc"
if (selectButton) {
  ['mouseenter', 'mousedown'].forEach(evt =>
    selectButton.addEventListener(evt, startPhotostripAnimation)
  );

  ['mouseleave', 'mouseup'].forEach(evt =>
    selectButton.addEventListener(evt, stopPhotostripAnimation)
  );
}

// Kích hoạt điều hướng
addSafeNavigation(selectButton, 'menu.html');
addSafeNavigation(cameraBtn, 'camera.html');
addSafeNavigation(uploadBtn, 'upload.html');
addSafeNavigation(logoEl, 'index.html', 'logo');
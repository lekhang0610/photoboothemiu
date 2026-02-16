// DOM References
const selectButton = document.getElementById('select-button');
const photostripEl = document.querySelector('.photostrip-mock');
const cameraBtn = document.getElementById('menu-camera-button');
const uploadBtn = document.getElementById('menu-upload-button');

// Photostrip Animation State
const photostrip = {
  el: photostripEl,
  rotation: 16.52,
  current: 0,
};

let photostripTimeout = null;
let photostripAnimating = false;

// Animation Loop
function animatePhotostrip() {
  if (!photostripAnimating || !photostrip.el) return;
  photostrip.el.style.transform = `rotate(${photostrip.current}deg)`;
  photostrip.current = photostrip.current === photostrip.rotation ? 0 : photostrip.rotation;
  photostripTimeout = setTimeout(() => requestAnimationFrame(animatePhotostrip), 300);
}

function startAnimation() {
  if (!photostripAnimating) {
    photostripAnimating = true;
    animatePhotostrip();
  }
}

function stopAnimation() {
  photostripAnimating = false;
  clearTimeout(photostripTimeout);
  if (photostrip.el) photostrip.el.style.transform = `rotate(16.52deg)`;
}

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initLogo(); // From utils.js

  // Home Page Interaction
  if (selectButton) {
    selectButton.addEventListener('mouseenter', startAnimation);
    selectButton.addEventListener('mousedown', startAnimation);
    selectButton.addEventListener('mouseleave', stopAnimation);
    selectButton.addEventListener('mouseup', stopAnimation);
    
    // Delayed Navigation for effect
    selectButton.onclick = (e) => {
      e.preventDefault();
      setTimeout(() => goTo('menu.html'), 100);
    };
  }

  // Menu Page Interaction
  if (cameraBtn) cameraBtn.onclick = (e) => { e.preventDefault(); setTimeout(() => goTo('camera.html'), 100); };
  if (uploadBtn) uploadBtn.onclick = (e) => { e.preventDefault(); setTimeout(() => goTo('upload.html'), 100); };
});
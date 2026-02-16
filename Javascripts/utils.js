// Shared configuration for the application
const BOOTH_CONFIG = {
  WIDTH: 1176,
  HEIGHT: 1470,
  get HALF() { return this.HEIGHT / 2; },
  get TARGET_ASPECT() { return this.WIDTH / this.HALF; }
};

// Quick navigation helper
const goTo = (url) => window.location.href = url;

// Initialize logo click event (navigates to home)
const initLogo = () => {
  const logo = document.querySelector('.logo');
  if (logo) logo.addEventListener('click', () => goTo('index.html'));
};

// Detect if device supports touch
const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;
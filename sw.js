const CACHE_NAME = 'photobooth-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/menu.html',
  '/camera.html',
  '/upload.html',
  '/final.html',
  '/StyleSheets/home.css',
  '/StyleSheets/camera.css',
  '/StyleSheets/final.css',
  '/Javascripts/utils.js',
  '/Javascripts/home.js',
  '/Javascripts/camera.js',
  '/Javascripts/upload.js',
  '/Javascripts/final.js',
  '/Assets/photobooth/logo-new.png',
  '/Assets/photobooth/shutter.mp3',
  '/Assets/photobooth/count.mp3'
];

// Cài đặt Service Worker và lưu trữ tài nguyên
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Phản hồi yêu cầu từ bộ nhớ đệm
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
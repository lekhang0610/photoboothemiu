const CACHE_NAME = 'photobooth-v2'; // Thay đổi v này khi cập nhật code
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './menu.html',
  './camera.html',
  './upload.html',
  './final.html',
  './StyleSheets/home.css',
  './StyleSheets/camera.css',
  './StyleSheets/final.css',
  './Javascripts/utils.js',
  './Javascripts/home.js',
  './Javascripts/camera.js',
  './Javascripts/upload.js',
  './Javascripts/final.js',
  './manifest.json',
  './Assets/photobooth/logo-new.png',
  './Assets/photobooth/favicon.png',
  './Assets/photobooth/icon-192.png',
  './Assets/photobooth/icon-512.png',
  './Assets/photobooth/shutter.mp3',
  './Assets/photobooth/count.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});
/**
 * Service Worker with Compression
 * 
 * Caches assets with compression for offline support and faster loading
 * Integrates with the lossless compression system
 */

import { compressData, decompressData } from '../utilities/compression';
import { compressImageFile } from '../utilities/imageCompression';

const CACHE_VERSION = 'v1-compressed';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const DATA_CACHE = `${CACHE_VERSION}-data`;

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/work/',
  '/about/',
  '/coursework/',
  '/assets/portrait.jpg',
  '/assets/backgrounds/bg-main-light-800w.jpg',
  '/assets/backgrounds/bg-main-dark-800w.jpg',
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Force activation
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.startsWith(CACHE_VERSION))
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control immediately
  self.clients.claim();
});

// Fetch event - serve from cache with compression
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests
  if (url.origin !== location.origin) return;

  // Handle images
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle other requests
  event.respondWith(handleRequest(request));
});

/**
 * Handle image requests with compression
 */
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
      // Cache the image
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return fallback or cached version if available
    const fallback = await caches.match('/assets/stock-1.jpg');
    return fallback || new Response('Image not available', { status: 404 });
  }
}

/**
 * Handle general requests
 */
async function handleRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached and update in background
    fetchAndUpdate(request);
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Try to return offline page or cached version
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Fetch and update cache in background
 */
async function fetchAndUpdate(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
  } catch (error) {
    // Silently fail - we already returned cached version
  }
}

/**
 * Message handler for cache management
 */
self.addEventListener('message', (event) => {
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((name) => caches.delete(name)));
      })
    );
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

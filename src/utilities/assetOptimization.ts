/**
 * Asset Optimization Client
 * 
 * Registers service worker and manages asset compression/caching
 * NOW USES WEB WORKERS - Non-blocking multithreaded compression!
 */

import { getAssetCache, preloadCriticalAssets, fetchAndCacheImage } from './assetCache';
import { getWorkerPool, compressAsync, compressImageAsync } from './workerPool';
import type { ImageCompressionResult } from './imageCompression';

/**
 * Initialize asset optimization system with Web Workers
 */
export async function initAssetOptimization(): Promise<void> {
  // Register service worker
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      if (import.meta.env.DEV) {
        console.log('Service Worker registered:', registration.scope);
      }
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && import.meta.env.DEV) {
              console.log('Service Worker updated');
            }
          });
        }
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Initialize worker pool
  try {
    const pool = getWorkerPool();
    if (import.meta.env.DEV) {
      const stats = pool.getStats();
      console.log(`Compression worker pool initialized: ${stats.totalWorkers} workers`);
    }
  } catch (error) {
    console.warn('Worker pool initialization failed:', error);
  }

  // Preload critical images in background (non-blocking)
  const criticalAssets = [
    '/assets/portrait.jpg',
    '/assets/backgrounds/bg-main-light-800w.jpg',
    '/assets/backgrounds/bg-main-dark-800w.jpg'
  ];
  
  // Delayed prefetch - won't block initial render
  setTimeout(() => {
    preloadCriticalAssets(criticalAssets).catch(console.error);
  }, 2000);
}

/**
 * Optimize all images on the page using Web Workers
 * Now non-blocking!
 */
export async function optimizePageImages(): Promise<void> {
  const images = document.querySelectorAll('img[data-optimize]');
  if (images.length === 0) return;

  // Process images concurrently but limit to avoid overwhelming
  const maxConcurrent = 3;
  const imageArray = Array.from(images) as HTMLImageElement[];
  
  for (let i = 0; i < imageArray.length; i += maxConcurrent) {
    const batch = imageArray.slice(i, i + maxConcurrent);
    
    await Promise.all(
      batch.map(async (img) => {
        const src = img.src;
        if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
        
        try {
          const cached = await fetchAndCacheImage(src);
          if (cached) {
            const url = URL.createObjectURL(cached);
            img.src = url;
            img.onload = () => URL.revokeObjectURL(url);
          }
        } catch (error) {
          // Silent fail - image will load normally
          if (import.meta.env.DEV) {
            console.warn(`Failed to optimize image: ${src}`, error);
          }
        }
      })
    );
  }
}

/**
 * Lazy load images with compression using Web Workers
 */
export function setupLazyLoadingWithCompression(): void {
  if (!('IntersectionObserver' in window)) return;
  
  const imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            // Fetch and cache in background (non-blocking with workers)
            fetchAndCacheImage(src)
              .then((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  img.src = url;
                  img.onload = () => URL.revokeObjectURL(url);
                }
              })
              .catch(() => {
                // Fallback to normal src
                img.src = src;
              });
          }
          
          imageObserver.unobserve(img);
        }
      });
    },
    {
      rootMargin: '100px 0px', // Increased for smoother loading
      threshold: 0.01
    }
  );

  document.querySelectorAll('img[data-src]').forEach((img) => {
    imageObserver.observe(img);
  });
}

/**
 * Clear asset cache (for debugging or user request)
 */
export async function clearAssetCache(): Promise<void> {
  const cache = getAssetCache();
  await cache.clear();
  
  // Also clear service worker caches
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_CACHE'
    });
  }
  
  console.log('Asset cache cleared');
}

/**
 * Get cache statistics for monitoring
 */
export async function getCacheStats() {
  const cache = getAssetCache();
  return await cache.getStats();
}

/**
 * Prefetch images for a page before navigation
 */
export async function prefetchPageImages(urls: string[]): Promise<void> {
  const cache = getAssetCache();
  
  await Promise.all(
    urls.map(async (url) => {
      if (await cache.has(url)) return;
      
      try {
        await fetchAndCacheImage(url);
      } catch (error) {
        console.warn(`Failed to prefetch: ${url}`);
      }
    })
  );
}

/**
 * Setup link prefetching with image compression (Web Workers - non-blocking)
 */
export function setupLinkPrefetching(): void {
  const prefetched = new Set<string>();
  let prefetchTimeout: number | null = null;
  
  document.addEventListener('mouseover', (event) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a[href^="/"]') as HTMLAnchorElement;
    
    if (link && link.dataset.imageSrc) {
      const imageSrc = link.dataset.imageSrc;
      
      // Debounce prefetch
      if (prefetchTimeout) clearTimeout(prefetchTimeout);
      
      prefetchTimeout = window.setTimeout(() => {
        if (!prefetched.has(imageSrc)) {
          prefetched.add(imageSrc);
          // Non-blocking fetch in background
          fetchAndCacheImage(imageSrc).catch(() => {});
        }
      }, 100);
    }
  });
}

/**
 * Monitor network quality and adjust compression strategy
 */
export function setupNetworkQualityMonitoring(): void {
  if (!('connection' in navigator)) return;
  
  const connection = (navigator as any).connection;
  
  const updateCompressionStrategy = () => {
    const effectiveType = connection.effectiveType;
    
    if (import.meta.env.DEV) {
      console.log(`Network: ${effectiveType}`);
    }
    
    // Adjust prefetching based on connection
    if (effectiveType === '4g') {
      // Good connection - enable aggressive prefetching
      document.documentElement.dataset.networkSpeed = 'fast';
    } else if (effectiveType === '3g' || effectiveType === '2g') {
      // Slow connection - be conservative
      document.documentElement.dataset.networkSpeed = 'slow';
    }
  };
  
  connection.addEventListener('change', updateCompressionStrategy);
  updateCompressionStrategy();
}

/**
 * Compress localStorage data
 */
export async function compressLocalStorage(): Promise<void> {
  const cache = getAssetCache();
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    // Skip compression system keys
    if (key.startsWith('compressed-')) continue;
    
    const value = localStorage.getItem(key);
    if (!value) continue;
    
    // Only compress large items (> 1KB)
    if (value.length > 1024) {
      try {
        await cache.cacheData(`ls-${key}`, value, 'data');
        localStorage.setItem(`compressed-${key}`, 'true');
      } catch (error) {
        console.warn(`Failed to compress localStorage key: ${key}`);
      }
    }
  }
}

/**
 * Get compressed localStorage value
 */
export async function getCompressedLocalStorage(key: string): Promise<string | null> {
  if (!localStorage.getItem(`compressed-${key}`)) {
    return localStorage.getItem(key);
  }
  
  const cache = getAssetCache();
  const data = await cache.getData(`ls-${key}`);
  
  if (!data) return localStorage.getItem(key);
  
  const decoder = new TextDecoder();
  return decoder.decode(data);
}

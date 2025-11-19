/**
 * Compression System Configuration
 * 
 * Centralized configuration for all compression features
 * 
 * ✅ NOW USING WEB WORKERS - Non-blocking multithreaded compression!
 * Performance issues resolved with concurrent processing
 */

export const CompressionConfig = {
  /**
   * Worker pool settings
   */
  workers: {
    // Number of worker threads (auto-detected based on CPU cores)
    count: typeof navigator !== 'undefined' 
      ? Math.min(Math.max(navigator.hardwareConcurrency - 1, 2), 4)
      : 2,
    
    // Maximum concurrent compression tasks
    maxConcurrent: 3,
    
    // Enable worker pool
    enabled: true,
  },

  /**
   * Cache settings
   */
  cache: {
    // Maximum cache size in megabytes
    maxSizeMB: 50,
    
    // Maximum age of cached items in days
    maxAgeDays: 7,
    
    // Database name for IndexedDB
    dbName: 'asset-compression-cache',
    
    // Enable automatic cache cleanup
    autoCleanup: true,
  },

  /**
   * Image compression settings
   */
  image: {
    // Default quality for image compression (1-100)
    quality: 80,
    
    // Responsive image widths
    responsiveWidths: [400, 800, 1200, 1600],
    
    // Enable PNG-style filtering (now safe with workers)
    usePNGFiltering: false, // Still disabled for performance
    
    // Separate alpha channel for better compression
    separateAlpha: true,
    
    // Minimum file size to compress (bytes)
    minSizeToCompress: 5120, // 5KB
  },

  /**
   * Build-time compression
   */
  build: {
    // File extensions to compress
    extensions: ['.jpg', '.png', '.svg', '.json', '.css', '.js', '.html'],
    
    // Gzip compression level (1-9, 9 = best compression)
    gzipLevel: 9,
    
    // Generate Brotli compression as well
    brotli: false,
    
    // Output compression stats
    generateStats: true,
  },

  /**
   * Service Worker settings
   */
  serviceWorker: {
    // Enable service worker
    enabled: true,
    
    // Cache version (increment to force cache refresh)
    version: 'v1',
    
    // URLs to precache
    precacheUrls: [
      '/',
      '/work/',
      '/about/',
      '/coursework/',
    ],
    
    // Network-first or cache-first strategy
    strategy: 'cache-first' as 'cache-first' | 'network-first',
  },

  /**
   * Optimization features (RE-ENABLED with Web Workers!)
   */
  optimization: {
    // Enable lazy loading with compression
    lazyLoading: true,
    
    // Enable link prefetching on hover
    prefetchOnHover: true,
    
    // Prefetch delay in milliseconds
    prefetchDelay: 100,
    
    // Enable network quality monitoring
    networkQualityMonitoring: true,
    
    // Optimize localStorage data
    compressLocalStorage: false, // Keep disabled for now
    
    // LocalStorage compression threshold (bytes)
    localStorageThreshold: 10240,
  },

  /**
   * Development settings
   */
  development: {
    // Show compression monitor in dev mode
    showMonitor: true,
    
    // Log compression stats to console
    logStats: true,
    
    // Enable verbose logging
    verbose: false,
  },

  /**
   * Performance budgets
   */
  performance: {
    // Maximum image size in KB
    maxImageSizeKB: 500,
    
    // Warn if compression ratio is below this percentage
    minCompressionRatio: 10,
    
    // Maximum total cache size warning threshold (MB)
    cacheSizeWarningMB: 40,
  },
} as const;

/**
 * Get configuration value with type safety
 */
export function getConfig<K extends keyof typeof CompressionConfig>(
  key: K
): typeof CompressionConfig[K] {
  return CompressionConfig[key];
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: string): boolean {
  const [category, setting] = feature.split('.');
  
  if (category in CompressionConfig) {
    const config = CompressionConfig[category as keyof typeof CompressionConfig] as any;
    if (setting in config) {
      return config[setting] === true;
    }
  }
  
  return false;
}

/**
 * Override configuration at runtime (for testing)
 */
export function overrideConfig<K extends keyof typeof CompressionConfig>(
  key: K,
  value: Partial<typeof CompressionConfig[K]>
): void {
  Object.assign(CompressionConfig[key], value);
}

export default CompressionConfig;

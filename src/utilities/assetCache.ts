/**
 * Asset Compression and Caching System
 * 
 * Provides runtime compression and caching for images, fonts, and other assets
 * Uses IndexedDB for persistent storage with automatic cache management
 * 
 * @author Abdon Morales
 */

import { compressData, decompressData, type CompressionResult } from './compression';
import { compressImageFile, type ImageCompressionResult } from './imageCompression';

interface CacheEntry {
  key: string;
  data: CompressionResult | ImageCompressionResult;
  timestamp: number;
  size: number;
  type: 'image' | 'data' | 'font' | 'json';
  originalSize: number;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  totalOriginalSize: number;
  compressionRatio: number;
  oldestEntry: number;
  newestEntry: number;
}

/**
 * Asset Cache Manager using IndexedDB
 */
export class AssetCache {
  private dbName = 'asset-compression-cache';
  private storeName = 'compressed-assets';
  private version = 1;
  private db: IDBDatabase | null = null;
  private maxCacheSize = 50 * 1024 * 1024; // 50MB default
  private maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days default

  constructor(maxCacheSizeMB?: number, maxAgeDays?: number) {
    if (maxCacheSizeMB) this.maxCacheSize = maxCacheSizeMB * 1024 * 1024;
    if (maxAgeDays) this.maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
  }

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }

  /**
   * Compress and cache an image
   */
  async cacheImage(url: string, blob: Blob): Promise<void> {
    const db = await this.initDB();
    const compressed = await compressImageFile(blob);
    
    const entry: CacheEntry = {
      key: url,
      data: compressed,
      timestamp: Date.now(),
      size: compressed.metadata.compressedSize,
      type: 'image',
      originalSize: compressed.metadata.originalSize
    };

    await this.putEntry(db, entry);
    await this.enforceLimit(db);
  }

  /**
   * Compress and cache data (JSON, text, etc.)
   */
  async cacheData(key: string, data: string | Uint8Array, type: 'data' | 'font' | 'json' = 'data'): Promise<void> {
    const db = await this.initDB();
    const compressed = await compressData(data);
    
    const entry: CacheEntry = {
      key,
      data: compressed,
      timestamp: Date.now(),
      size: compressed.metadata.compressedSize,
      type,
      originalSize: compressed.metadata.originalSize
    };

    await this.putEntry(db, entry);
    await this.enforceLimit(db);
  }

  /**
   * Retrieve and decompress cached image
   */
  async getImage(url: string): Promise<Blob | null> {
    const db = await this.initDB();
    const entry = await this.getEntry(db, url);
    
    if (!entry || entry.type !== 'image') return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      await this.delete(url);
      return null;
    }

    const imageData = entry.data as ImageCompressionResult;
    const decompressed = await decompressData(imageData);
    
    return new Blob([decompressed], { type: 'image/png' });
  }

  /**
   * Retrieve and decompress cached data
   */
  async getData(key: string): Promise<Uint8Array | null> {
    const db = await this.initDB();
    const entry = await this.getEntry(db, key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      await this.delete(key);
      return null;
    }

    return await decompressData(entry.data);
  }

  /**
   * Check if asset is cached
   */
  async has(key: string): Promise<boolean> {
    const db = await this.initDB();
    const entry = await this.getEntry(db, key);
    
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      await this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete cached entry
   */
  async delete(key: string): Promise<void> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result as CacheEntry[];
        
        if (entries.length === 0) {
          resolve({
            totalEntries: 0,
            totalSize: 0,
            totalOriginalSize: 0,
            compressionRatio: 0,
            oldestEntry: 0,
            newestEntry: 0
          });
          return;
        }

        const stats = entries.reduce((acc, entry) => ({
          totalSize: acc.totalSize + entry.size,
          totalOriginalSize: acc.totalOriginalSize + entry.originalSize,
          oldestEntry: Math.min(acc.oldestEntry, entry.timestamp),
          newestEntry: Math.max(acc.newestEntry, entry.timestamp)
        }), {
          totalSize: 0,
          totalOriginalSize: 0,
          oldestEntry: Infinity,
          newestEntry: 0
        });

        resolve({
          totalEntries: entries.length,
          totalSize: stats.totalSize,
          totalOriginalSize: stats.totalOriginalSize,
          compressionRatio: ((1 - stats.totalSize / stats.totalOriginalSize) * 100),
          oldestEntry: stats.oldestEntry,
          newestEntry: stats.newestEntry
        });
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Put entry in store
   */
  private putEntry(db: IDBDatabase, entry: CacheEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get entry from store
   */
  private getEntry(db: IDBDatabase, key: string): Promise<CacheEntry | null> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Enforce cache size and age limits
   */
  private async enforceLimit(db: IDBDatabase): Promise<void> {
    const stats = await this.getStats();
    
    // Remove expired entries
    const now = Date.now();
    await this.removeOldEntries(db, now - this.maxAge);
    
    // If still over limit, remove oldest entries
    if (stats.totalSize > this.maxCacheSize) {
      await this.removeOldestEntries(db, stats.totalSize - this.maxCacheSize);
    }
  }

  /**
   * Remove entries older than timestamp
   */
  private removeOldEntries(db: IDBDatabase, maxTimestamp: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(maxTimestamp);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove oldest entries to free up space
   */
  private removeOldestEntries(db: IDBDatabase, sizeToFree: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const request = index.openCursor();
      let freedSize = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && freedSize < sizeToFree) {
          const entry = cursor.value as CacheEntry;
          freedSize += entry.size;
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * Global cache instance
 */
let globalCache: AssetCache | null = null;

export function getAssetCache(): AssetCache {
  if (!globalCache) {
    globalCache = new AssetCache(50, 7); // 50MB, 7 days
  }
  return globalCache;
}

/**
 * Fetch and cache image with automatic compression
 */
export async function fetchAndCacheImage(url: string, force = false): Promise<Blob | null> {
  const cache = getAssetCache();
  
  // Check cache first
  if (!force) {
    const cached = await cache.getImage(url);
    if (cached) return cached;
  }
  
  // Fetch from network
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    
    // Cache for next time
    await cache.cacheImage(url, blob);
    
    return blob;
  } catch (error) {
    console.error('Failed to fetch image:', error);
    return null;
  }
}

/**
 * Preload and cache critical assets
 */
export async function preloadCriticalAssets(urls: string[]): Promise<void> {
  const cache = getAssetCache();
  
  await Promise.all(
    urls.map(async (url) => {
      if (await cache.has(url)) return;
      
      try {
        const response = await fetch(url);
        if (!response.ok) return;
        
        const blob = await response.blob();
        await cache.cacheImage(url, blob);
      } catch (error) {
        console.warn(`Failed to preload ${url}:`, error);
      }
    })
  );
}

/**
 * Compress and store JSON data
 */
export async function cacheJSON(key: string, data: object): Promise<void> {
  const cache = getAssetCache();
  const json = JSON.stringify(data);
  await cache.cacheData(key, json, 'json');
}

/**
 * Retrieve and decompress JSON data
 */
export async function getCachedJSON<T = any>(key: string): Promise<T | null> {
  const cache = getAssetCache();
  const data = await cache.getData(key);
  
  if (!data) return null;
  
  const decoder = new TextDecoder();
  const json = decoder.decode(data);
  return JSON.parse(json) as T;
}

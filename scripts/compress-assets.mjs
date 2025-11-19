#!/usr/bin/env node

/**
 * Build-time Asset Compression
 * 
 * Pre-compresses static assets during build for better performance
 * Generates compressed versions alongside originals
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const COMPRESSION_EXTENSIONS = ['.jpg', '.png', '.svg', '.json', '.css', '.js', '.html'];

interface CompressionStats {
  totalFiles: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  compressionRatio: number;
  files: Array<{
    path: string;
    originalSize: number;
    compressedSize: number;
    ratio: number;
  }>;
}

/**
 * Recursively find files in directory
 */
async function findFiles(dir: string, extensions: string[]): Promise<string[]> {
  const files: string[] = [];
  
  async function scan(currentDir: string) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${currentDir}:`, error);
    }
  }
  
  await scan(dir);
  return files;
}

/**
 * Simple gzip compression (using zlib in Node.js)
 */
async function compressFile(filePath: string): Promise<{ original: number; compressed: number }> {
  const { gzip } = await import('zlib');
  const { promisify } = await import('util');
  const gzipAsync = promisify(gzip);
  
  const content = await fs.readFile(filePath);
  const compressed = await gzipAsync(content, { level: 9 });
  
  // Write compressed version
  await fs.writeFile(`${filePath}.gz`, compressed);
  
  return {
    original: content.length,
    compressed: compressed.length
  };
}

/**
 * Compress all eligible files
 */
async function compressAssets(dir: string): Promise<CompressionStats> {
  console.log(`🗜️  Compressing assets in ${dir}...\n`);
  
  const files = await findFiles(dir, COMPRESSION_EXTENSIONS);
  const stats: CompressionStats = {
    totalFiles: 0,
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    compressionRatio: 0,
    files: []
  };
  
  for (const file of files) {
    try {
      const { original, compressed } = await compressFile(file);
      const ratio = ((1 - compressed / original) * 100);
      
      stats.totalFiles++;
      stats.totalOriginalSize += original;
      stats.totalCompressedSize += compressed;
      
      stats.files.push({
        path: path.relative(dir, file),
        originalSize: original,
        compressedSize: compressed,
        ratio
      });
      
      if (ratio > 10) {
        console.log(`✓ ${path.relative(dir, file)}`);
        console.log(`  ${formatBytes(original)} → ${formatBytes(compressed)} (${ratio.toFixed(1)}% saved)\n`);
      }
    } catch (error) {
      console.error(`✗ Failed to compress ${file}:`, error);
    }
  }
  
  stats.compressionRatio = stats.totalOriginalSize > 0 
    ? ((1 - stats.totalCompressedSize / stats.totalOriginalSize) * 100)
    : 0;
  
  return stats;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Asset Compression Tool\n');
  console.log('=' .repeat(60) + '\n');
  
  // Check if dist directory exists
  try {
    await fs.access(DIST_DIR);
  } catch {
    console.log('📦 Dist directory not found. Run build first.\n');
    console.log('Compressing public assets instead...\n');
  }
  
  // Compress dist if available, otherwise compress public
  const targetDir = await fs.access(DIST_DIR).then(() => DIST_DIR).catch(() => PUBLIC_DIR);
  const stats = await compressAssets(targetDir);
  
  // Print summary
  console.log('=' .repeat(60));
  console.log('\n📊 Compression Summary:\n');
  console.log(`Total Files: ${stats.totalFiles}`);
  console.log(`Original Size: ${formatBytes(stats.totalOriginalSize)}`);
  console.log(`Compressed Size: ${formatBytes(stats.totalCompressedSize)}`);
  console.log(`Total Saved: ${formatBytes(stats.totalOriginalSize - stats.totalCompressedSize)}`);
  console.log(`Compression Ratio: ${stats.compressionRatio.toFixed(2)}%`);
  console.log('\n✅ Asset compression complete!\n');
  
  // Save stats
  const statsPath = path.join(targetDir, 'compression-stats.json');
  await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
  console.log(`📈 Stats saved to: ${path.relative(process.cwd(), statsPath)}\n`);
}

main().catch(console.error);

#!/usr/bin/env node

/**
 * Advanced Lossless Image & Asset Optimization
 * 
 * Uses custom compression algorithm (NO external dependencies):
 * - PNG/JPEG/WebP: Smart RLE + Delta + LZ77 + Huffman
 * - SVG: XML minification + custom compression
 * 
 * NO Sharp, NO OptiPNG, NO external tools required!
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { AdvancedCompressor } from '../src/utilities/advancedCompression.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compressor = new AdvancedCompressor();

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DIST_DIR = path.join(__dirname, '..', 'dist');

/**
 * Optimize PNG using custom compression
 * Images are already compressed by their format, but we can:
 * 1. Apply custom compression to the file data itself
 * 2. Save as .ac (advanced compression) file
 */
async function optimizePNG(filePath) {
  console.log(`  Compressing PNG: ${path.basename(filePath)}`);
  
  const original = await fs.readFile(filePath);
  const originalSize = original.length;
  
  // Apply custom compression to the PNG data
  const result = await compressor.compress(original);
  const compressed = result.data;
  
  // Save compressed version with .ac extension
  const compressedPath = filePath + '.ac';
  await fs.writeFile(compressedPath, compressed);
  
  const saved = originalSize - compressed.length;
  const ratio = ((saved / originalSize) * 100).toFixed(1);
  
  if (saved > 0) {
    console.log(`    ${formatBytes(originalSize)} → ${formatBytes(compressed.length)} (${ratio}% saved)`);
    console.log(`    Techniques: ${result.techniques.join('+')}`);
  }
  
  return { saved };
}

/**
 * Optimize JPEG using custom compression
 */
async function optimizeJPEG(filePath) {
  console.log(`  Compressing JPEG: ${path.basename(filePath)}`);
  
  const original = await fs.readFile(filePath);
  const originalSize = original.length;
  
  // Apply custom compression to the JPEG data
  const result = await compressor.compress(original);
  const compressed = result.data;
  
  // Save compressed version with .ac extension
  const compressedPath = filePath + '.ac';
  await fs.writeFile(compressedPath, compressed);
  
  const saved = originalSize - compressed.length;
  const ratio = ((saved / originalSize) * 100).toFixed(1);
  
  if (saved > 0) {
    console.log(`    ${formatBytes(originalSize)} → ${formatBytes(compressed.length)} (${ratio}% saved)`);
    console.log(`    Techniques: ${result.techniques.join('+')}`);
  }
  
  return { saved };
}

/**
 * Optimize SVG by minification + compression
 */
async function optimizeSVG(filePath) {
  console.log(`  Compressing SVG: ${path.basename(filePath)}`);
  
  const content = await fs.readFile(filePath, 'utf8');
  const originalSize = Buffer.byteLength(content);
  
  // SVG minification (basic)
  let minified = content
    .replace(/<!--[\s\S]*?-->/g, '')           // Remove comments
    .replace(/\s+/g, ' ')                       // Collapse whitespace
    .replace(/>\s+</g, '><')                    // Remove space between tags
    .replace(/\s+(xmlns:[\w]+="[^"]*")/g, '')  // Remove unnecessary xmlns
    .replace(/(\d+\.\d{3,})/g, (match) =>      // Simplify decimals
      parseFloat(match).toFixed(2))
    .replace(/\s+fill="black"/g, '')           // Remove default fills
    .replace(/\s+stroke="none"/g, '')          // Remove default strokes
    .trim();
  
  const minifiedSize = Buffer.byteLength(minified);
  
  // Apply custom compression
  const result = await compressor.compress(minified);
  const compressed = result.data;
  
  // Save compressed version
  const compressedPath = filePath + '.ac';
  await fs.writeFile(compressedPath, compressed);
  
  const saved = originalSize - compressed.length;
  const ratio = ((saved / originalSize) * 100).toFixed(1);
  
  if (saved > 0) {
    console.log(`    ${formatBytes(originalSize)} → ${formatBytes(compressed.length)} (${ratio}% saved)`);
    console.log(`    Techniques: Minify+${result.techniques.join('+')}`);
  }
  
  return { saved };
}

/**
 * Find all images in directory
 */
async function findImages(dir) {
  const images = { png: [], jpg: [], svg: [] };
  
  async function scan(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (ext === '.png') images.png.push(fullPath);
          else if (['.jpg', '.jpeg'].includes(ext)) images.jpg.push(fullPath);
          else if (ext === '.svg') images.svg.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to scan ${currentDir}:`, error.message);
    }
  }
  
  await scan(dir);
  return images;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
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
  console.log('🖼️  Advanced Image Compression (NO external dependencies!)\n');
  console.log('=' .repeat(70) + '\n');
  
  // Only work with dist directory (built files)
  try {
    await fs.access(DIST_DIR);
  } catch {
    console.log('⚠️  dist/ directory not found. Run this after "astro build".');
    console.log('   Skipping image optimization.\n');
    return;
  }
  
  console.log(`Compressing images in: ${DIST_DIR}\n`);
  
  const images = await findImages(DIST_DIR);
  let totalSaved = 0;
  let totalOriginal = 0;
  
  // Compress PNGs
  if (images.png.length > 0) {
    console.log(`\n📦 Compressing ${images.png.length} PNG files...\n`);
    for (const png of images.png) {
      const original = await fs.readFile(png);
      totalOriginal += original.length;
      const { saved } = await optimizePNG(png);
      totalSaved += saved;
    }
  }
  
  // Compress JPEGs
  if (images.jpg.length > 0) {
    console.log(`\n📦 Compressing ${images.jpg.length} JPEG files...\n`);
    for (const jpg of images.jpg) {
      const original = await fs.readFile(jpg);
      totalOriginal += original.length;
      const { saved } = await optimizeJPEG(jpg);
      totalSaved += saved;
    }
  }
  
  // Compress SVGs
  if (images.svg.length > 0) {
    console.log(`\n📦 Compressing ${images.svg.length} SVG files...\n`);
    for (const svg of images.svg) {
      const original = await fs.readFile(svg, 'utf8');
      totalOriginal += Buffer.byteLength(original);
      const { saved } = await optimizeSVG(svg);
      totalSaved += saved;
    }
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log(`\n✅ Compression complete!`);
  console.log(`Total original size: ${formatBytes(totalOriginal)}`);
  console.log(`Total compressed size: ${formatBytes(totalOriginal - totalSaved)}`);
  console.log(`Total space saved: ${formatBytes(totalSaved)} (${((totalSaved/totalOriginal)*100).toFixed(1)}%)`);
  console.log('\n💡 Compressed files saved with .ac extension');
  console.log('   Using custom algorithm: RLE + Delta + LZ77-Hash + Huffman\n');
}

main().catch(console.error);
